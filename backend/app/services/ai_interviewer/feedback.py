def next_difficulty(score: float) -> str:
    """
    Determine the next question difficulty based on the candidate's score.
    Score is expected on a 0-10 scale.
    """
    if score >= 7:
        return "HARD"
    elif score >= 4:
        return "MEDIUM"
    else:
        return "EASY"


def build_feedback_message(score: float, feedback: str, missing: list[str]) -> str:
    """
    Build a human-readable feedback string shown to the candidate after each answer.
    """
    level = next_difficulty(score)
    missing_text = ", ".join(missing) if missing else "None"

    return (
        f"Score: {score}/10 | Next difficulty: {level}\n"
        f"Feedback: {feedback}\n"
        f"Missing concepts: {missing_text}"
    )