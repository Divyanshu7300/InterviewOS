"""
Token Service — daily token limit enforcement
Free tier: 10,000 tokens/day per user
"""
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.db.models.token import UserTokenUsage

import os
DAILY_LIMIT = int(os.getenv("DAILY_TOKEN_LIMIT", 10_000))


def estimate_tokens(text: str) -> int:
    """
    Rough token estimate — ~4 chars per token (OpenAI standard)
    Works for both Ollama and OpenAI
    """
    return max(1, len(text) // 4)


def get_today_usage(db: Session, user_id: int) -> int:
    """User ne aaj kitne tokens use kiye"""
    today = date.today()
    record = db.query(UserTokenUsage).filter(
        UserTokenUsage.user_id == user_id,
        UserTokenUsage.date    == today,
    ).first()
    return record.tokens_used if record else 0


def get_remaining_tokens(db: Session, user_id: int) -> int:
    used = get_today_usage(db, user_id)
    return max(0, DAILY_LIMIT - used)


def check_token_limit(db: Session, user_id: int, estimated_tokens: int = 500):
    """
    LLM call se pehle check karo — limit exceed hogi?
    Exceed hogi toh 429 raise karo.
    """
    used = get_today_usage(db, user_id)
    if used + estimated_tokens > DAILY_LIMIT:
        remaining = max(0, DAILY_LIMIT - used)
        raise HTTPException(
            status_code=429,
            detail={
                "error":     "daily_token_limit_exceeded",
                "message":   f"Daily token limit reached ({DAILY_LIMIT} tokens/day). Try again tomorrow.",
                "used":      used,
                "limit":     DAILY_LIMIT,
                "remaining": remaining,
            }
        )


def record_token_usage(
    db: Session,
    user_id: int,
    prompt: str,
    response: str,
    source: str = "general",
):
    """
    LLM call ke baad tokens record karo.
    prompt + response dono count hote hain.
    """
    today  = date.today()
    tokens = estimate_tokens(prompt) + estimate_tokens(response)

    record = db.query(UserTokenUsage).filter(
        UserTokenUsage.user_id == user_id,
        UserTokenUsage.date    == today,
    ).first()

    if record:
        record.tokens_used += tokens
    else:
        record = UserTokenUsage(
            user_id=user_id,
            date=today,
            tokens_used=tokens,
            source=source,
        )
        db.add(record)

    db.commit()
    return tokens


def get_usage_stats(db: Session, user_id: int) -> dict:
    """Dashboard ke liye usage stats"""
    used      = get_today_usage(db, user_id)
    remaining = max(0, DAILY_LIMIT - used)
    pct       = round((used / DAILY_LIMIT) * 100, 1)

    return {
        "used":       used,
        "limit":      DAILY_LIMIT,
        "remaining":  remaining,
        "percentage": pct,
        "exhausted":  used >= DAILY_LIMIT,
    }