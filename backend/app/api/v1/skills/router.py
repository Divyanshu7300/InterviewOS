"""
Learning Module — API Router
Base: /api/v1/learn
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.learn import (
    LearningSkill, LearningTopic, LearningQuestion,
    UserTopicProgress, UserLearningStats,
)
from app.api.v1.skills.schema import (
    SkillOut, TopicOut, TopicsGrouped,
    QuestionOut, QuestionsResponse,
    QuizSubmit, QuizResult, AnswerResult,
    UserStatsOut, LeaderboardOut, LeaderboardEntry,
)
from app.services.skills.question_generator import get_or_generate_questions
from app.services.skills.logo_catalog import get_logo_url
from app.services.skills.similar_skill_generator import generate_similar_skills
from app.services.skills.xp_service import process_quiz_result, get_display_streak
from app.api.v1.token.service import check_token_limit
from app.db.models.user import User

router = APIRouter(prefix="/api/v1/learn", tags=["learning"])


# ─── 1. GET /skills ───────────────────────────────────────────────────────────
@router.get("/skills", response_model=list[SkillOut])
def get_skills(db: Session = Depends(get_db)):
    skills = db.query(LearningSkill).order_by(LearningSkill.name).all()
    return [
        SkillOut(
            id=skill.id,
            name=skill.name,
            slug=skill.slug,
            description=skill.description,
            icon=skill.icon,
            logo_url=get_logo_url(skill.slug),
            color=skill.color,
        )
        for skill in skills
    ]


@router.post("/skills/{skill_id}/similar", response_model=list[SkillOut])
def generate_similar_skills_route(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(LearningSkill).filter(LearningSkill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    generated = generate_similar_skills(db=db, skill=skill)
    return [
        SkillOut(
            id=item.id,
            name=item.name,
            slug=item.slug,
            description=item.description,
            icon=item.icon,
            logo_url=get_logo_url(item.slug),
            color=item.color,
        )
        for item in generated
    ]


# ─── 2. GET /skills/{skill_id}/topics ────────────────────────────────────────
@router.get("/skills/{skill_id}/topics", response_model=TopicsGrouped)
def get_topics(
    skill_id: int,
    user_id: int = None,
    db: Session = Depends(get_db),
):
    skill = db.query(LearningSkill).filter(LearningSkill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    topics = db.query(LearningTopic).filter(
        LearningTopic.skill_id == skill_id
    ).order_by(LearningTopic.order_index).all()

    progress_map = {}
    if user_id:
        progresses = db.query(UserTopicProgress).filter(
            UserTopicProgress.user_id == user_id,
            UserTopicProgress.topic_id.in_([t.id for t in topics]),
        ).all()
        progress_map = {p.topic_id: p for p in progresses}

    def to_out(t: LearningTopic) -> TopicOut:
        p = progress_map.get(t.id)
        return TopicOut(
            id=t.id, skill_id=t.skill_id, title=t.title,
            description=t.description, level=t.level,
            order_index=t.order_index, xp_reward=t.xp_reward,
            completed=p.completed if p else False,
            best_score=p.best_score if p else 0.0,
            attempts=p.attempts if p else 0,
        )

    return TopicsGrouped(
        beginner=[to_out(t) for t in topics if t.level == "BEGINNER"],
        intermediate=[to_out(t) for t in topics if t.level == "INTERMEDIATE"],
        advanced=[to_out(t) for t in topics if t.level == "ADVANCED"],
    )


# ─── 3. POST /topics/{topic_id}/questions ────────────────────────────────────
@router.post("/topics/{topic_id}/questions", response_model=QuestionsResponse)
def get_questions(
    topic_id: int,
    count: int = 15,
    user_id: int = None,   # ← token tracking ke liye
    db: Session = Depends(get_db),
):
    topic = db.query(LearningTopic).filter(LearningTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    skill = db.query(LearningSkill).filter(LearningSkill.id == topic.skill_id).first()

    try:
        questions, source = get_or_generate_questions(
            db=db, topic=topic, skill_name=skill.name, count=count
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Token sirf tab check/record karo jab LLM actually call hua ho
    if source == "generated" and user_id:
        # Questions already generate ho gaye — sirf record karo
        # estimate: 15 questions * ~200 tokens each
        from app.api.v1.token.service import record_token_usage
        record_token_usage(
            db=db,
            user_id=user_id,
            prompt=f"generate questions for {topic.title}",
            response=" ".join([q.question_text for q in questions]),
            source="learn",
        )

    return QuestionsResponse(
        topic_id=topic.id,
        topic_title=topic.title,
        skill_name=skill.name,
        level=topic.level,
        xp_reward=topic.xp_reward,
        questions=[
            QuestionOut(
                id=q.id,
                question_text=q.question_text,
                options=q.options,
            )
            for q in questions
        ],
        total=len(questions),
        source=source,
    )


# ─── 4. POST /quiz/submit ─────────────────────────────────────────────────────
@router.post("/quiz/submit", response_model=QuizResult)
def submit_quiz(payload: QuizSubmit, db: Session = Depends(get_db)):
    # No LLM here — no token check needed

    topic = db.query(LearningTopic).filter(LearningTopic.id == payload.topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    q_ids     = [a.question_id for a in payload.answers]
    questions = db.query(LearningQuestion).filter(
        LearningQuestion.id.in_(q_ids)
    ).all()
    q_map = {q.id: q for q in questions}

    results       = []
    correct_count = 0

    for ans in payload.answers:
        q = q_map.get(ans.question_id)
        if not q:
            continue
        is_correct = (ans.selected_index == q.correct_index)
        if is_correct:
            correct_count += 1
        results.append(AnswerResult(
            question_id=q.id,
            correct=is_correct,
            correct_index=q.correct_index,
            explanation=q.explanation,
        ))

    total = len(results)

    xp_data = process_quiz_result(
        db=db,
        user_id=payload.user_id,
        topic_id=payload.topic_id,
        total=total,
        correct=correct_count,
        xp_reward=topic.xp_reward,
    )

    return QuizResult(
        topic_id=payload.topic_id,
        total=total,
        correct=correct_count,
        score=xp_data["score"],
        xp_earned=xp_data["xp_earned"],
        passed=xp_data["passed"],
        new_total_xp=xp_data["new_total_xp"],
        streak=xp_data["streak"],
        streak_updated=xp_data["streak_updated"],
        results=results,
    )


# ─── 5. GET /users/{user_id}/stats ───────────────────────────────────────────
@router.get("/users/{user_id}/stats", response_model=UserStatsOut)
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    stats = db.query(UserLearningStats).filter(
        UserLearningStats.user_id == user_id
    ).first()
    if not stats:
        return UserStatsOut(
            user_id=user_id, total_xp=0, current_streak=0,
            longest_streak=0, topics_completed=0, accuracy=0.0,
            last_activity=None,
        )
    accuracy = 0.0
    if stats.total_attempted > 0:
        accuracy = round((stats.total_correct / stats.total_attempted) * 100, 1)
    return UserStatsOut(
        user_id=stats.user_id,
        total_xp=stats.total_xp,
        current_streak=get_display_streak(stats),
        longest_streak=stats.longest_streak,
        topics_completed=stats.topics_completed,
        accuracy=accuracy,
        last_activity=stats.last_activity,
    )


#
@router.get("/leaderboard", response_model=LeaderboardOut)
def get_leaderboard(limit: int = 20, db: Session = Depends(get_db)):
    stats = db.query(UserLearningStats).order_by(
        UserLearningStats.total_xp.desc()
    ).limit(limit).all()

    total_users = db.query(UserLearningStats).count()

    entries = []
    for rank, s in enumerate(stats, start=1):
        user = db.query(User).filter(User.id == s.user_id).first()
        entries.append(LeaderboardEntry(
            rank=rank,
            user_id=s.user_id,
            email=user.email if user else "unknown",
            total_xp=s.total_xp,
            topics_completed=s.topics_completed,
            current_streak=get_display_streak(s),
        ))

    return LeaderboardOut(entries=entries, total_users=total_users)
