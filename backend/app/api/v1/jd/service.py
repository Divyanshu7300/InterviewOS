import json
import re
from sqlalchemy.orm import Session

from app.db.models.jd import JobDescription, JDAnalysisResult
from app.api.v1.jd.schema import JDInput
from app.services.jd_parser.extractor import extract_jd_skills
from app.services.jd_parser.cleaner import clean_jd
from app.services.llm_client import generate_llm_response


ANALYSIS_PROMPT = """You are a JSON API. You only output valid JSON, nothing else.

Analyze this job description and return ONLY a JSON object with these exact keys:

{{
  "role_title": "string",
  "role_summary": "string (2-3 sentences)",
  "seniority_level": "Junior | Mid | Senior | Lead",
  "experience_required": "string e.g. 3-5 years",
  "tech_stack": ["list", "of", "technologies"],
  "soft_skills": ["list", "of", "soft", "skills"],
  "key_responsibilities": ["list", "of", "responsibilities"],
  "interview_topics": ["list", "of", "topics", "to", "prepare"],
  "resume_keywords": ["list", "of", "keywords"]
}}

Rules:
- Output ONLY the JSON object
- No markdown, no explanation, no extra text
- All keys must be present
- Use [] for empty lists
- Do not add any text before or after the JSON

Job Description:
{jd_text}"""


def parse_ai_response(raw: str) -> dict:
    if not raw or not raw.strip():
        return {}

    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        pass

    cleaned = re.sub(r"```(?:json)?```?", "", raw, flags=re.DOTALL).strip()
    cleaned = re.sub(r"```", "", cleaned).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        extracted = match.group()
        extracted += "]" * max(0, extracted.count("[") - extracted.count("]"))
        extracted += "}" * max(0, extracted.count("{") - extracted.count("}"))
        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            pass

    try:
        fixed = re.sub(r",\s*([}\]])", r"\1", cleaned)
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    print(f"[JD] Failed to parse JSON. Raw preview:\n{raw[:400]}")
    return {}


def process_jd(db: Session, data: JDInput):

    # Step 1: Clean JD
    cleaned_jd = clean_jd(data.jd_text)

    # Step 2: Save JD
    jd = JobDescription(text=cleaned_jd)
    db.add(jd)
    db.commit()
    db.refresh(jd)

    # Step 3: Skill extraction
    raw_skill_scores = extract_jd_skills(cleaned_jd)
    extracted_skills = {k: v for k, v in raw_skill_scores.items() if v > 0}

    # Step 4: LLM — token tracking pass karo
    prompt = ANALYSIS_PROMPT.format(jd_text=cleaned_jd)
    try:
        raw_response = generate_llm_response(
            prompt,
            json_mode=True,
            db=db,
            user_id=data.user_id,  # ← token record hoga
            source="jd",
        )
    except Exception as e:
        print(f"[JD] LLM ERROR: {e}")
        raw_response = ""

    # Step 5: Parse
    ai_result = parse_ai_response(raw_response) if raw_response else {}

    if not ai_result:
        print(f"[JD] Parse failed. Raw:\n{raw_response[:300]}")

    # Step 6: Save
    analysis = JDAnalysisResult(
        jd_id=jd.id,
        role_title=ai_result.get("role_title", "Unknown"),
        role_summary=ai_result.get("role_summary", ""),
        seniority_level=ai_result.get("seniority_level", ""),
        experience_required=ai_result.get("experience_required", ""),
        tech_stack=ai_result.get("tech_stack", []),
        soft_skills=ai_result.get("soft_skills", []),
        key_responsibilities=ai_result.get("key_responsibilities", []),
        interview_topics=ai_result.get("interview_topics", []),
        resume_keywords=ai_result.get("resume_keywords", []),
        extracted_skills=extracted_skills,
        raw_skill_scores=raw_skill_scores,
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis