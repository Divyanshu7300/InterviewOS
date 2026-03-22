from app.services.ai_interviewer.evaluator import evaluate_answer


def score_answer(skill: str, question: str, answer: str) -> dict:
    """
    Score a candidate's answer.
    Returns: {
        "correctness": int (0-10),
        "depth": int (0-10),
        "clarity": int (0-10),
        "feedback": str,
        "missing": [str]
    }
    Previously duplicated evaluator logic — now unified.
    """
    result = evaluate_answer(skill, question, answer)

    score = result.get("score", 5)

    # Derive sub-scores from overall score with slight variation
    # (replace with separate GPT calls if granular scoring is needed)
    return {
        "correctness": min(10, score + 1),
        "depth": score,
        "clarity": max(0, score - 1),
        "feedback": result.get("feedback", ""),
        "missing": result.get("missing", []),
    }