from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.db.models.resume import Resume
from app.db.models.jd import JobDescription, JDAnalysisResult
from app.db.models.interview import InterviewSession, InterviewScore
from app.db.models.comment import Comment

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/users/{user_id}/stats")
def get_user_dashboard_stats(user_id: int, db: Session = Depends(get_db)):

    # Counts
    total_resumes = db.query(Resume).filter(
        Resume.user_id == user_id
    ).count()

    jdss = (
    db.query(JobDescription)
    .filter(JobDescription.user_id == user_id).distinct()
    .all())

    total_jds = len(jdss)

    total_interviews = db.query(InterviewSession).filter(
        InterviewSession.user_id == user_id
    ).count()

    total_comments = db.query(Comment).filter(
        Comment.user_id == user_id
    ).count()

    # Interview averages
    avg_scores = (
        db.query(
            func.avg(InterviewScore.correctness),
            func.avg(InterviewScore.depth),
            func.avg(InterviewScore.clarity),
        )
        .join(InterviewSession)
        .filter(InterviewSession.user_id == user_id)
        .first()
    )

    correctness   = round(avg_scores[0] or 0, 2)
    depth         = round(avg_scores[1] or 0, 2)
    clarity       = round(avg_scores[2] or 0, 2)
    average_score = round((correctness + depth + clarity) / 3, 2)

    # Recent interviews
    recent_interviews = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user_id)
        .order_by(InterviewSession.created_at.desc())
        .limit(5)
        .all()
    )

    return {
        "overview": {
            "total_resumes":    total_resumes,
            "total_jds":        total_jds,
            "total_interviews": total_interviews,
            "total_comments":   total_comments,
        },
        "interview_stats": {
            "average_score":   average_score,
            "avg_correctness": correctness,
            "avg_depth":       depth,
            "avg_clarity":     clarity,
        },
        "recent_interviews": [
            {
                "id":         i.id,
                "role":       i.role,
                "level":      i.level,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in recent_interviews
        ],
    }