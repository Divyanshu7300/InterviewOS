import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.resumes.service import handle_resume_upload, analyze_resume_vs_jd
from app.api.v1.token.service import check_token_limit, estimate_tokens

router = APIRouter(prefix="/resumes", tags=["resumes"])

UPLOAD_DIR = "/tmp/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
def upload_resume(
    user_id: int = Query(...),
    jd_id: int   = Query(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF allowed")

    # Token check — resume analysis ~1200 tokens
    check_token_limit(db, user_id, estimated_tokens=1200)

    path = os.path.join(UPLOAD_DIR, file.filename)
    with open(path, "wb") as f:
        f.write(file.file.read())

    # Step 1: Resume parse + save
    resume = handle_resume_upload(db, user_id, path)

    # Step 2: JD vs Resume analysis — user_id pass karo token tracking ke liye
    analysis = analyze_resume_vs_jd(db, jd_id, resume.id, user_id=user_id)

    return {
        "resume_id": resume.id,
        "skills":    resume.skills,
        "analysis":  analysis,
    }