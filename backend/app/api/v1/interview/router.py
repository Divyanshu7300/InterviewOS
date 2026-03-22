from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.interview.schema import (
    InterviewStart,
    InterviewStartResponse,
    InterviewAnswer,
    InterviewAnswerResponse,
)
from app.api.v1.interview.service import (
    start_interview,
    next_question,
    finish_interview,
    get_jd_context,
)
from app.api.v1.token.service import check_token_limit

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/start", response_model=InterviewStartResponse)
def start_interview_route(data: InterviewStart, db: Session = Depends(get_db)):

    # Token check
    check_token_limit(db, data.user_id, estimated_tokens=600)

    try:
        session_id, question = start_interview(
            db=db,
            jd_id=data.jd_id,
            level=data.level,
            user_id=data.user_id,   # ← token record ke liye
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    jd_context = get_jd_context(db, data.jd_id)

    return InterviewStartResponse(
        session_id=session_id,
        question=question,
        role_title=jd_context["role_title"],
        level=data.level,
    )


@router.post("/answer", response_model=InterviewAnswerResponse)
def submit_answer_route(data: InterviewAnswer, db: Session = Depends(get_db)):

    # Token check — har answer pe ~800 tokens (question + scoring + next question)
    check_token_limit(db, data.user_id, estimated_tokens=800)

    try:
        result = next_question(
            db=db,
            session_id=data.session_id,
            answer=data.answer,
            user_id=data.user_id,   # ← token record ke liye
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return InterviewAnswerResponse(
        session_id=data.session_id,
        next_question=result["next_question"],
        score=result["score"],
        next_level=result["next_level"],
    )


@router.post("/finish/{session_id}")
def finish_interview_route(
    session_id: int,
    db: Session = Depends(get_db)
):
    try:
        summary = finish_interview(db=db, session_id=session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return summary