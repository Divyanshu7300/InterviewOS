import json
import re
from sqlalchemy.orm import Session
from app.services.llm_client import generate_llm_response


def evaluate_answer(
    skill: str,
    question: str,
    answer: str,
    db: Session = None,      # ← token tracking ke liye
    user_id: int = None,     # ← token tracking ke liye
    source: str = "interview",
) -> dict:

    prompt = f"""You are evaluating a technical interview answer.

Skill: {skill}
Question: {question}
Candidate Answer: {answer}

Evaluate and return ONLY valid JSON (no markdown, no explanation):
{{
  "score": <number 0-10>,
  "feedback": "<2-3 sentence constructive feedback>",
  "missing": ["<missing concept 1>", "<missing concept 2>"]
}}
"""

    try:
        raw = generate_llm_response(
            prompt,
            json_mode=True,
            db=db,
            user_id=user_id,
            source=source,
        )
    except Exception as e:
        print(f"LLM error: {e}")
        return {"score": 5, "feedback": "Could not evaluate answer.", "missing": []}

    # Parse JSON
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

    print("Could not parse evaluator response:", raw)
    return {"score": 5, "feedback": "Could not evaluate answer.", "missing": []}