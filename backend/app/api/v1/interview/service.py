from sqlalchemy.orm import Session

from app.db.models.interview import InterviewSession, InterviewMessage, InterviewScore
from app.db.models.jd import JobDescription, JDAnalysisResult
from app.services.ai_interviewer.interviewer import ask_question
from app.services.ai_interviewer.scorer import score_answer
from app.services.ai_interviewer.feedback import next_difficulty
from app.services.ai_interviewer.summary import generate_summary


def get_jd_context(db: Session, jd_id: int) -> dict:
    jd = db.query(JobDescription).filter_by(id=jd_id).first()
    if not jd:
        raise ValueError(f"JD not found with id {jd_id}")

    analysis = db.query(JDAnalysisResult).filter_by(jd_id=jd_id).first()

    return {
        "jd_text":          jd.text,
        "role_title":       analysis.role_title       if analysis else "Software Engineer",
        "tech_stack":       analysis.tech_stack       if analysis else [],
        "interview_topics": analysis.interview_topics if analysis else [],
        "seniority_level":  analysis.seniority_level  if analysis else "Mid",
    }


def start_interview(
    db: Session,
    jd_id: int,
    level: str,
    user_id: int = None,   # ← token tracking ke liye
) -> tuple[int, str]:

    jd_context = get_jd_context(db, jd_id)

    session = InterviewSession(
        role=jd_context["role_title"],
        level=level,
        jd_id=jd_id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    question = ask_question(
        skill=jd_context["role_title"],
        level=level,
        history=None,
        jd_context=jd_context,
        db=db,               # ← token record ke liye
        user_id=user_id,     # ← token record ke liye
        source="interview",
    )

    db.add(InterviewMessage(
        session_id=session.id,
        role="assistant",
        content=question,
    ))
    db.commit()

    return session.id, question


def next_question(
    db: Session,
    session_id: int,
    answer: str,
    user_id: int = None,   # ← token tracking ke liye
) -> dict:

    session = db.query(InterviewSession).filter_by(id=session_id).first()
    if not session:
        raise ValueError(f"No session found with id {session_id}")

    jd_context = get_jd_context(db, session.jd_id)

    history = (
        db.query(InterviewMessage)
        .filter_by(session_id=session_id)
        .order_by(InterviewMessage.created_at)
        .all()
    )

    last_question = next(
        (m.content for m in reversed(history) if m.role == "assistant"),
        "Previous question"
    )

    # Score karo — token track karo
    score = score_answer(
        skill=jd_context["role_title"],
        question=last_question,
        answer=answer,
        db=db,           # ← token record ke liye
        user_id=user_id,
        source="interview",
    )
    overall_score = score["depth"]

    db.add(InterviewScore(
        session_id=session_id,
        correctness=score["correctness"],
        depth=score["depth"],
        clarity=score["clarity"],
    ))

    db.add(InterviewMessage(
        session_id=session_id,
        role="user",
        content=answer,
    ))
    db.commit()

    new_level = next_difficulty(overall_score)

    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": answer})

    # Next question generate karo — token track karo
    question = ask_question(
        skill=jd_context["role_title"],
        level=new_level,
        history=messages,
        jd_context=jd_context,
        db=db,           # ← token record ke liye
        user_id=user_id,
        source="interview",
    )

    db.add(InterviewMessage(
        session_id=session_id,
        role="assistant",
        content=question,
    ))
    db.commit()

    return {
        "next_question": question,
        "score":         score,
        "next_level":    new_level,
    }


def finish_interview(db: Session, session_id: int) -> dict:

    session = db.query(InterviewSession).filter_by(id=session_id).first()
    if not session:
        raise ValueError(f"No session found with id {session_id}")

    scores = (
        db.query(InterviewScore)
        .filter_by(session_id=session_id)
        .all()
    )

    if not scores:
        raise ValueError(f"No scores found for session {session_id}")

    scores_list = [
        {
            "correctness": s.correctness,
            "depth":       s.depth,
            "clarity":     s.clarity,
        }
        for s in scores
    ]

    return generate_summary(scores=scores_list, skill=session.role)