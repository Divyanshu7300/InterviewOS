from sqlalchemy.orm import Session
from app.services.ai_interviewer.prompt_builder import build_interview_prompt
from app.services.llm_client import generate_llm_response


def ask_question(
    skill: str,
    level: str,
    history: list[dict] = None,
    jd_context: dict = None,
    db: Session = None,      # ← token tracking
    user_id: int = None,     # ← token tracking
    source: str = "interview",
) -> str:

    system_prompt = build_interview_prompt(skill, level, jd_context=jd_context)

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
        return generate_llm_response(
            full_prompt,
            db=db,
            user_id=user_id,
            source=source,
        )
    except Exception as e:
        print(f"LLM error: {e}")
        raise