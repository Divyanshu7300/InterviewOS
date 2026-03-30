def next_difficulty(score: float, current_level: str = "MEDIUM") -> str:
    """
    Determine the next question difficulty based on the candidate's score.
    Score is expected on a 0-10 scale.
    """
    levels = ["EASY", "MEDIUM", "HARD"]
    current_idx = levels.index(current_level) if current_level in levels else 1

    if score >= 8:
        return levels[min(current_idx + 1, len(levels) - 1)]
    if score >= 5:
        return levels[current_idx]
    return levels[max(current_idx - 1, 0)]


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
