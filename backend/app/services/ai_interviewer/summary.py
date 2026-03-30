from sqlalchemy.orm import Session
from app.services.ai_interviewer.json_utils import load_json_response
from app.services.ai_interviewer.prompt_builder import build_summary_prompt
from app.services.llm_client import generate_llm_response


def generate_summary(
    scores: list[dict],
    skill: str,
    session_insights: dict,
    db: Session = None,      # ← token tracking
    user_id: int = None,     # ← token tracking
) -> dict:
    prompt = build_summary_prompt(
        skill=skill,
        scores=scores,
        session_insights=session_insights,
    )
    fallback = {
        "overall_score": 5.0,
        "summary": "Could not generate summary.",
        "strengths": [],
        "improvements": [],
        "session_dna": "Developing communicator",
        "best_signal": "clarity",
        "momentum": "steady",
    }

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
        return fallback

    result = load_json_response(raw, fallback=fallback)
    return result
