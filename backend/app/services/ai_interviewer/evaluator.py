from sqlalchemy.orm import Session
from app.services.ai_interviewer.json_utils import load_json_response
from app.services.ai_interviewer.prompt_builder import build_evaluation_prompt
from app.services.llm_client import generate_llm_response


def evaluate_answer(
    skill: str,
    question: str,
    answer: str,
    jd_context: dict = None,
    history: list[dict] = None,
    candidate_preferences: str | None = None,
    db: Session = None,
    user_id: int = None,
    source: str = "interview",
) -> dict:
    fallback = {
        "score": 5.0,
        "scores": {
            "overall": 5.0,
            "confidence": 5.0,
            "correctness": 5.0,
            "depth": 5.0,
            "clarity": 5.0,
        },
        "reasoning": "The answer shows partial understanding but lacks enough evidence for a stronger score.",
        "dimension_reasoning": {
            "confidence": "The wording shows limited confidence signals and not enough decisive language.",
            "correctness": "Some relevant ideas appear, but technical accuracy cannot be strongly verified.",
            "depth": "The answer stays at a surface level and does not explore tradeoffs or internals.",
            "clarity": "The answer is understandable, but the structure is not especially crisp.",
        },
        "sentence_level_feedback": [],
        "topic": skill,
        "subtopics": [],
        "feedback": "Could not evaluate answer.",
        "strengths": [],
        "weak_areas": [],
        "missing_concepts": [],
        "concept_coverage": [],
        "structure_signals": {
            "has_clear_structure": False,
            "uses_examples": False,
            "mentions_tradeoffs": False,
            "answers_directly": True,
        },
        "linguistic_signals": {
            "confidence_pattern": "Insufficient signal.",
            "clarity_pattern": "Insufficient signal.",
            "depth_pattern": "Insufficient signal.",
        },
        "followup_focus": "Probe the core concept with a narrower scenario.",
        "improvement_hint": "Use a tighter structure and include one concrete example.",
    }
    prompt = build_evaluation_prompt(
        skill=skill,
        question=question,
        answer=answer,
        jd_context=jd_context,
        history=history,
        candidate_preferences=candidate_preferences,
    )

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
        return fallback

    result = load_json_response(raw, fallback=fallback)
    result.setdefault("score", result.get("scores", {}).get("overall", fallback["score"]))
    result.setdefault("scores", fallback["scores"])
    result.setdefault("reasoning", fallback["reasoning"])
    result.setdefault("dimension_reasoning", fallback["dimension_reasoning"])
    result.setdefault("sentence_level_feedback", fallback["sentence_level_feedback"])
    return result
