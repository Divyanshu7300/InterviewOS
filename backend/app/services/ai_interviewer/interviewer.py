from sqlalchemy.orm import Session
from app.services.ai_interviewer.prompt_builder import build_interview_prompt
from app.services.llm_client import generate_llm_response
import re


def _sanitize_interviewer_output(text: str) -> str:
    cleaned = (text or "").strip()
    if not cleaned:
        return "Can you walk me through your answer in more detail?"

    cleaned = re.sub(r"^```(?:text)?|```$", "", cleaned, flags=re.MULTILINE).strip()

    prefixes = [
        "here's the next question:",
        "here is the next question:",
        "next question:",
        "question:",
        "follow-up question:",
        "follow up question:",
    ]
    lower = cleaned.lower()
    for prefix in prefixes:
        if lower.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip()
            lower = cleaned.lower()

    lines = [line.strip(" -\t") for line in cleaned.splitlines() if line.strip()]
    question_lines = [line for line in lines if "?" in line]
    if question_lines:
        cleaned = question_lines[-1]
    elif lines:
        cleaned = lines[-1]

    if ":" in cleaned and "?" in cleaned:
        cleaned = cleaned.split(":", 1)[-1].strip()

    cleaned = cleaned.strip("\"'“”")
    if "?" not in cleaned:
        cleaned = f"{cleaned.rstrip('.')}?"
    return cleaned


def ask_question(
    skill: str,
    level: str,
    history: list[dict] = None,
    jd_context: dict = None,
    candidate_preferences: str | None = None,
    db: Session = None,      # ← token tracking
    user_id: int = None,     # ← token tracking
    source: str = "interview",
) -> str:

    system_prompt = build_interview_prompt(
        skill,
        level,
        jd_context=jd_context,
        candidate_preferences=candidate_preferences,
    )

    history_text = ""
    if history:
        for msg in history:
            role = "Interviewer" if msg["role"] == "assistant" else "Candidate"
            history_text += f"{role}: {msg['content']}\n"

    if history_text:
        full_prompt = (
            f"{system_prompt}\n\n"
            f"Conversation so far:\n{history_text}\n"
            f"Interviewer:"
        )
    else:
        full_prompt = (
            f"{system_prompt}\n\n"
            f"Start the interview. Ask the first question relevant to the job description.\n"
            f"Interviewer:"
        )

    try:
        response = generate_llm_response(
            full_prompt,
            db=db,
            user_id=user_id,
            source=source,
        )
        return _sanitize_interviewer_output(response)
    except Exception as e:
        print(f"LLM error: {e}")
        raise


def generate_followup(
    skill: str,
    level: str,
    previous_question: str,
    previous_answer: str,
    extracted_signals: dict,
    jd_context: dict = None,
    history: list[dict] = None,
    candidate_preferences: str | None = None,
    db: Session = None,
    user_id: int = None,
    source: str = "interview",
) -> str:
    from app.services.ai_interviewer.prompt_builder import build_followup_prompt

    prompt = build_followup_prompt(
        skill=skill,
        level=level,
        previous_question=previous_question,
        previous_answer=previous_answer,
        extracted_signals=extracted_signals,
        jd_context=jd_context,
        history=history,
        candidate_preferences=candidate_preferences,
    )

    try:
        response = generate_llm_response(
            prompt,
            db=db,
            user_id=user_id,
            source=source,
        )
        return _sanitize_interviewer_output(response)
    except Exception as e:
        print(f"LLM error: {e}")
        raise
