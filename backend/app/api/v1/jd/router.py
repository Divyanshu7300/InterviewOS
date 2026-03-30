import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.v1.jd.schema import JDInput, JDAnalysisResult, JDListItem
from app.api.v1.jd.service import process_jd
from app.db.session import get_db
from app.db.models.jd import JobDescription, JDAnalysisResult as JDAnalysisResultModel  # ← models
from app.api.v1.token.service import check_token_limit, estimate_tokens               # ← sahi path

router = APIRouter(prefix="/jd", tags=["JD"])


async def parse_jd_input(request: Request, user_id: int | None = None) -> JDInput:
    raw_body = (await request.body()).decode("utf-8").strip()
    if not raw_body:
        raise HTTPException(status_code=422, detail="Request body is required.")

    payload = None
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        payload = None

    if isinstance(payload, dict):
        normalized = {
            "jd_text": payload.get("jd_text") or payload.get("text"),
            "user_id": payload.get("user_id", user_id),
        }
    elif isinstance(payload, str):
        normalized = {"jd_text": payload, "user_id": user_id}
    else:
        normalized = {"jd_text": raw_body, "user_id": user_id}

    try:
        return JDInput.model_validate(normalized)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc


@router.post("/analyze", response_model=JDAnalysisResult)
async def process_job_description(
    request: Request,
    user_id: int | None = Query(default=None),
    db: Session = Depends(get_db)
):
    data = await parse_jd_input(request, user_id=user_id)
    estimated = estimate_tokens(data.jd_text) + 800
    check_token_limit(db, data.user_id, estimated)
    return process_jd(db, data)


@router.get("/list", response_model=List[JDListItem])
def get_user_jds(
    user_id: int,
    db: Session = Depends(get_db),
):
    jds = (
        db.query(JobDescription)
        .filter(JobDescription.user_id == user_id)
        .order_by(JobDescription.created_at.desc())
        .all()
    )

    if not jds:
        return []

    result = []
    for jd in jds:
        analysis = db.query(JDAnalysisResultModel).filter_by(jd_id=jd.id).first()
        result.append(JDListItem(
            jd_id=jd.id,
            role_title=analysis.role_title if analysis else "Unknown",
            seniority_level=analysis.seniority_level if analysis else None,
            experience_required=analysis.experience_required if analysis else None,
            tech_stack=analysis.tech_stack if analysis else [],
        ))

    return result
