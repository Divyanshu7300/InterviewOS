"""
Token Usage Router — /api/v1/tokens
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.token.service import get_usage_stats, check_token_limit

router = APIRouter(prefix="/tokens", tags=["tokens"])


@router.get("/users/{user_id}/usage")
def get_token_usage(user_id: int, db: Session = Depends(get_db)):
    """Users token usage stats for the current day"""
    return get_usage_stats(db, user_id)


@router.get("/users/{user_id}/check")
def check_tokens(
    user_id: int,
    estimated: int = 500,
    db: Session = Depends(get_db),
):
    """
    check before llm calling — is tokens available?
    Returns 200 if OK, 429 if limit exceeded
    """
    check_token_limit(db, user_id, estimated)
    from app.api.v1.token.service import get_remaining_tokens
    return {"ok": True, "remaining": get_remaining_tokens(db, user_id)}