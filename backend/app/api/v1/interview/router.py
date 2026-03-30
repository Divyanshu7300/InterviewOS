from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.interview.schema import (
    InterviewStart,
    InterviewStartResponse,
    InterviewAnswer,
    InterviewAnswerResponse,
    EvaluateAnswerRequest,
    AnswerEvaluation,
    GenerateFollowupRequest,
    FollowupResponse,
    SessionInsightsResponse,
)
from app.api.v1.interview.service import (
    start_interview,
    next_question,
    finish_interview,
    get_jd_context,
    evaluate_answer_payload,
    generate_followup_payload,
    get_session_intelligence,
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
            user_id=data.user_id,
            candidate_preferences=data.candidate_preferences,
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
            user_id=data.user_id,
            candidate_preferences=data.candidate_preferences,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return InterviewAnswerResponse(
        session_id=data.session_id,
        next_question=result["next_question"],
        score=result["score"],
        next_level=result["next_level"],
        evaluation=result["evaluation"],
        session_insights=result["session_insights"],
    )


@router.post("/evaluate-answer", response_model=AnswerEvaluation)
def evaluate_answer_route(data: EvaluateAnswerRequest, db: Session = Depends(get_db)):
    result = evaluate_answer_payload(
        skill=data.skill,
        question=data.question,
        answer=data.answer,
        candidate_preferences=data.candidate_preferences,
        jd_context=data.jd_context,
        history=data.history,
        db=db,
        user_id=data.user_id,
    )
    return {**result, "scores": result["scores"]}


@router.post("/generate-followup", response_model=FollowupResponse)
def generate_followup_route(data: GenerateFollowupRequest, db: Session = Depends(get_db)):
    question = generate_followup_payload(
        skill=data.skill,
        level=data.level,
        previous_question=data.previous_question,
        previous_answer=data.previous_answer,
        extracted_signals=data.extracted_signals,
        candidate_preferences=data.candidate_preferences,
        jd_context=data.jd_context,
        history=data.history,
        db=db,
        user_id=data.user_id,
    )
    return FollowupResponse(question=question)


@router.get("/session-insights/{session_id}", response_model=SessionInsightsResponse)
def session_insights_route(session_id: int, db: Session = Depends(get_db)):
    try:
        insights = get_session_intelligence(db=db, session_id=session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return SessionInsightsResponse(session_id=session_id, insights=insights)


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
