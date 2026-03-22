"""
Learning Module — XP + Streak Service
"""
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.db.models.learn import UserLearningStats, UserTopicProgress


def get_or_create_stats(db: Session, user_id: int) -> UserLearningStats:
    stats = db.query(UserLearningStats).filter(
        UserLearningStats.user_id == user_id
    ).first()
    if not stats:
        stats = UserLearningStats(user_id=user_id)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats


def process_quiz_result(
    db: Session,
    user_id: int,
    topic_id: int,
    total: int,
    correct: int,
    xp_reward: int,
) -> dict:

    score  = round((correct / total) * 100, 1) if total > 0 else 0.0
    passed = score >= 70.0

    if score >= 70:
        xp_earned = xp_reward
    elif score >= 50:
        xp_earned = xp_reward // 2
    else:
        xp_earned = 0

    # ── Stats update ──────────────────────────────────────────────────────────
    stats = get_or_create_stats(db, user_id)
    today = date.today()
    streak_updated = False

    if stats.last_activity:
        last = stats.last_activity.date()
        if last == today:
            pass
        elif last == today - timedelta(days=1):
            stats.current_streak = (stats.current_streak or 0) + 1
            streak_updated = True
        else:
            stats.current_streak = 1
            streak_updated = True
    else:
        stats.current_streak = 1
        streak_updated = True

    if (stats.current_streak or 0) > (stats.longest_streak or 0):
        stats.longest_streak = stats.current_streak

    stats.total_xp        = (stats.total_xp        or 0) + xp_earned
    stats.total_correct   = (stats.total_correct   or 0) + correct
    stats.total_attempted = (stats.total_attempted or 0) + total
    stats.last_activity   = datetime.utcnow()

    # ── Topic Progress update ─────────────────────────────────────────────────
    progress = db.query(UserTopicProgress).filter(
        UserTopicProgress.user_id  == user_id,
        UserTopicProgress.topic_id == topic_id,
    ).first()

    if not progress:
        progress = UserTopicProgress(
            user_id=user_id,
            topic_id=topic_id,
            attempts=0,
            best_score=0.0,
            completed=False,
        )
        db.add(progress)

    progress.attempts   = (progress.attempts   or 0) + 1
    progress.score      = score
    progress.best_score = max(score, progress.best_score or 0.0)

    if passed and not progress.completed:
        progress.completed    = True
        progress.completed_at = datetime.utcnow()
        stats.topics_completed = (stats.topics_completed or 0) + 1

    db.commit()
    db.refresh(stats)

    return {
        "xp_earned":      xp_earned,
        "new_total_xp":   stats.total_xp,
        "streak":         stats.current_streak,
        "streak_updated": streak_updated,
        "passed":         passed,
        "score":          score,
    }