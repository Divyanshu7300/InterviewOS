from app.services.ai_interviewer.evaluator import evaluate_answer


def score_answer(
    skill: str,
    question: str,
    answer: str,
    jd_context: dict = None,
    history: list[dict] = None,
    candidate_preferences: str | None = None,
    db=None,
    user_id: int = None,
    source: str = "interview",
) -> dict:
    return evaluate_answer(
        skill=skill,
        question=question,
        answer=answer,
        jd_context=jd_context,
        history=history,
        candidate_preferences=candidate_preferences,
        db=db,
        user_id=user_id,
        source=source,
    )
