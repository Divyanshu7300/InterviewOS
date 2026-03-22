from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.jd.schema import JDInput, JDAnalysisResult, JDListItem
from app.api.v1.jd.service import process_jd
from app.db.session import get_db
from app.db.models.jd import JobDescription, JDAnalysisResult as JDAnalysisResultModel  # ← models
from app.api.v1.token.service import check_token_limit, estimate_tokens               # ← sahi path

router = APIRouter(prefix="/jd", tags=["JD"])


@router.post("/analyze", response_model=JDAnalysisResult)
def process_job_description(
    data: JDInput,
    db: Session = Depends(get_db)
):
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