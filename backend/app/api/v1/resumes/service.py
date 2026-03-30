import json
import re
from sqlalchemy.orm import Session

from app.db.models.resume import Resume
from app.db.models.jd import JobDescription
from app.services.resume_parser.extractor import parse_resume
from app.services.llm_client import generate_llm_response


ANALYSIS_PROMPT = """You are a JSON API. You only output valid JSON, nothing else.

You are an ATS resume evaluator. Analyze the resume against the job description.

Return ONLY this JSON object:
{{
  "ats_score": <integer 0-100>,
  "role_match": <integer 0-100>,
  "experience_match": <integer 0-100>,
  "matched_skills": ["list of matched skills"],
  "missing_skills": ["list of missing skills"],
  "weak_skills": ["list of weak/partial skills"],
  "improvement_suggestions": ["list of suggestions"]
}}

Rules:
- Output ONLY the JSON object
- No markdown, no explanation, no extra text
- Use [] for empty lists
- ats_score, role_match, experience_match must be integers 0-100

Job Description:
{jd_text}

Candidate Resume:
{resume_text}"""


def _parse_llm_json(raw: str) -> dict:
    if not raw or not raw.strip():
        return {}

    # Case 1: direct parse
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        pass

    # Case 2: strip markdown
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    cleaned = re.sub(r"```", "", cleaned).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Case 3: extract { ... } block
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        extracted = match.group()
        extracted += "]" * max(0, extracted.count("[") - extracted.count("]"))
        extracted += "}" * max(0, extracted.count("{") - extracted.count("}"))
        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            pass

    # Case 4: fix trailing commas
    try:
        fixed = re.sub(r",\s*([}\]])", r"\1", cleaned)
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    print(f"[RESUME] JSON parse failed. Raw preview:\n{raw[:400]}")
    return {}


def handle_resume_upload(db: Session, user_id: int, file_path: str):
    parsed = parse_resume(file_path)

    resume = Resume(
        user_id=user_id,
        raw_text=parsed["raw_text"],
        skills=parsed["skill_scores"],
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def analyze_resume_vs_jd(
    db: Session,
    jd_id: int,
    resume_id: int,
    user_id: int = None,   # token tracking ke liye
) -> dict:

    jd     = db.query(JobDescription).filter(JobDescription.id == jd_id).first()
    resume = db.query(Resume).filter(Resume.id == resume_id).first()

    if not jd or not resume:
        return {"error": "JD or Resume not found"}

    if not jd.text:
        print("[RESUME] JD text empty!")
    if not resume.raw_text:
        print("[RESUME] Resume raw_text empty!")

    prompt = ANALYSIS_PROMPT.format(
        jd_text=jd.text or "",
        resume_text=resume.raw_text or "",
    )

    try:
        raw = generate_llm_response(
            prompt,
            json_mode=True,
            db=db,
            user_id=user_id,
            source="resume",
        )
        result = _parse_llm_json(raw)

        if not result:
            return {"error": "Could not parse LLM response"}

        # Ensure correct types
        return {
            "ats_score":              int(result.get("ats_score", 0)),
            "role_match":             int(result.get("role_match", 0)),
            "experience_match":       int(result.get("experience_match", 0)),
            "matched_skills":         result.get("matched_skills", []),
            "missing_skills":         result.get("missing_skills", []),
            "weak_skills":            result.get("weak_skills", []),
            "improvement_suggestions": result.get("improvement_suggestions", []),
        }

    except Exception as e:
        print(f"[RESUME] LLM ERROR: {e}")
        return {"error": "LLM request failed"}