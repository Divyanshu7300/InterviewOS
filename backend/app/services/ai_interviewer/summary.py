import json
import re
from sqlalchemy.orm import Session
from app.services.llm_client import generate_llm_response


def generate_summary(
    scores: list[dict],
    skill: str,
    db: Session = None,      # ← token tracking
    user_id: int = None,     # ← token tracking
) -> dict:

    scores_text = json.dumps(scores, indent=2)

    prompt = f"""You are summarizing a technical interview for the skill: {skill}.

Here are the scores and feedback from each round:
{scores_text}

Generate a final summary. Return ONLY valid JSON (no markdown, no explanation):
{{
  "overall_score": <average score out of 10, float>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"]
}}
"""

    try:
        raw = generate_llm_response(
            prompt,
            json_mode=True,
            db=db,
            user_id=user_id,
            source="interview",
        )
    except Exception as e:
        print(f"LLM error: {e}")
        return {
            "overall_score": 5.0,
            "summary": "Could not generate summary.",
            "strengths": [],
            "improvements": [],
        }

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    try:
        cleaned = re.sub(r"```(?:json)?", "", raw).strip()
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    print("Could not parse summary response:", raw)
    return {
        "overall_score": 5.0,
        "summary": "Could not generate summary.",
        "strengths": [],
        "improvements": [],
    }