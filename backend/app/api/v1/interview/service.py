import json
from sqlalchemy.orm import Session

from app.db.models.interview import (
    InterviewSession,
    InterviewMessage,
    InterviewScore,
    InterviewEvaluation,
    InterviewInsight,
)
from app.db.models.jd import JobDescription, JDAnalysisResult
from app.services.ai_interviewer.interviewer import ask_question, generate_followup
from app.services.ai_interviewer.scorer import score_answer
from app.services.ai_interviewer.feedback import next_difficulty
from app.services.ai_interviewer.summary import generate_summary

DEFAULT_INTERVIEW_TARGET_ROUNDS = 20


def get_jd_context(db: Session, jd_id: int) -> dict:
    jd = db.query(JobDescription).filter_by(id=jd_id).first()
    if not jd:
        raise ValueError(f"JD not found with id {jd_id}")

    analysis = db.query(JDAnalysisResult).filter_by(jd_id=jd_id).first()

    return {
        "jd_text":          jd.text,
        "role_title":       analysis.role_title       if analysis else "Software Engineer",
        "tech_stack":       analysis.tech_stack       if analysis else [],
        "interview_topics": analysis.interview_topics if analysis else [],
        "seniority_level":  analysis.seniority_level  if analysis else "Mid",
    }


def _avg(values: list[float]) -> float:
    return round(sum(values) / len(values), 2) if values else 0.0


def _round_scores(evaluation: dict) -> dict:
    scores = evaluation.get("scores", {})
    return {
        "overall": round(float(scores.get("overall", evaluation.get("score", 0))), 2),
        "confidence": round(float(scores.get("confidence", 0)), 2),
        "correctness": round(float(scores.get("correctness", 0)), 2),
        "depth": round(float(scores.get("depth", 0)), 2),
        "clarity": round(float(scores.get("clarity", 0)), 2),
    }


def _session_dna(skill_scores: dict[str, float]) -> str:
    strongest = max(skill_scores, key=skill_scores.get, default="clarity")
    weakest = min(skill_scores, key=skill_scores.get, default="depth")
    if strongest == "clarity" and weakest == "depth":
        return "Clear but surface-level"
    if strongest == "depth" and weakest == "clarity":
        return "Deep but unstructured"
    if strongest == "confidence" and weakest == "correctness":
        return "Confident but needs validation"
    return "Balanced and improving"


def _trend_label(series: list[float]) -> str:
    if len(series) < 2:
        return "warming_up" if series else "not_started"
    delta = series[-1] - series[0]
    if delta > 0.5:
        return "improving"
    if delta < -0.5:
        return "declining"
    return "steady"


def compute_session_insights(
    evaluations: list[dict],
    target_rounds: int = DEFAULT_INTERVIEW_TARGET_ROUNDS,
) -> dict:
    safe_target_rounds = max(target_rounds, 1)
    responses_completed = len(evaluations)
    skill_scores = {
        "confidence": _avg([item["scores"]["confidence"] for item in evaluations]),
        "correctness": _avg([item["scores"]["correctness"] for item in evaluations]),
        "depth": _avg([item["scores"]["depth"] for item in evaluations]),
        "clarity": _avg([item["scores"]["clarity"] for item in evaluations]),
    }
    ordered_dimensions = sorted(skill_scores.items(), key=lambda item: item[1], reverse=True)
    best_signal = ordered_dimensions[0][0] if ordered_dimensions else "clarity"
    weakest_signal = ordered_dimensions[-1][0] if ordered_dimensions else "depth"
    trend = [round(item["scores"]["overall"], 2) for item in evaluations]
    weak_area_counts: dict[str, int] = {}
    topics: list[str] = []
    for item in evaluations:
        topic = item.get("topic")
        if topic and topic not in topics:
            topics.append(topic)
        for weak_area in item.get("weak_areas", []):
            weak_area_counts[weak_area] = weak_area_counts.get(weak_area, 0) + 1

    sorted_weak_areas = [
        area for area, _count in sorted(weak_area_counts.items(), key=lambda pair: pair[1], reverse=True)
    ][:4]

    return {
        "confidence": skill_scores["confidence"],
        "momentum": _trend_label(trend),
        "response_progress": round(min((responses_completed / safe_target_rounds) * 100, 100), 2),
        "responses_completed": responses_completed,
        "target_rounds": safe_target_rounds,
        "best_signal": best_signal,
        "weakest_signal": weakest_signal,
        "session_dna": _session_dna(skill_scores),
        "weak_areas": sorted_weak_areas,
        "improvement_trend": trend,
        "topic_coverage": topics,
        "skill_scores": skill_scores,
        "latest_topic": evaluations[-1].get("topic") if evaluations else None,
        "latest_feedback": evaluations[-1].get("feedback") if evaluations else None,
    }


def _persist_insight_snapshot(db: Session, session_id: int, snapshot_type: str, insights: dict) -> None:
    db.add(InterviewInsight(
        session_id=session_id,
        snapshot_type=snapshot_type,
        insights_json=json.dumps(insights),
    ))
    db.commit()


def get_session_intelligence(db: Session, session_id: int) -> dict:
    session = db.query(InterviewSession).filter_by(id=session_id).first()
    if not session:
        raise ValueError(f"No session found with id {session_id}")
    evaluations = (
        db.query(InterviewEvaluation)
        .filter_by(session_id=session_id)
        .order_by(InterviewEvaluation.created_at)
        .all()
    )
    if not evaluations:
        raise ValueError(f"No evaluations found for session {session_id}")
    parsed = [json.loads(item.evaluation_json) for item in evaluations]
    return compute_session_insights(parsed)


def evaluate_answer_payload(
    skill: str,
    question: str,
    answer: str,
    jd_context: dict | None = None,
    history: list[dict] | None = None,
    candidate_preferences: str | None = None,
    db: Session = None,
    user_id: int | None = None,
) -> dict:
    return score_answer(
        skill=skill,
        question=question,
        answer=answer,
        jd_context=jd_context,
        history=history,
        candidate_preferences=candidate_preferences,
        db=db,
        user_id=user_id,
        source="interview",
    )


def generate_followup_payload(
    skill: str,
    level: str,
    previous_question: str,
    previous_answer: str,
    extracted_signals: dict,
    jd_context: dict | None = None,
    history: list[dict] | None = None,
    candidate_preferences: str | None = None,
    db: Session = None,
    user_id: int | None = None,
) -> str:
    return generate_followup(
        skill=skill,
        level=level,
        previous_question=previous_question,
        previous_answer=previous_answer,
        extracted_signals=extracted_signals,
        jd_context=jd_context,
        history=history,
        candidate_preferences=candidate_preferences,
        db=db,
        user_id=user_id,
        source="interview",
    )


def start_interview(
    db: Session,
    jd_id: int,
    level: str,
    user_id: int = None,
    candidate_preferences: str | None = None,
) -> tuple[int, str]:

    jd_context = get_jd_context(db, jd_id)

    session = InterviewSession(
        role=jd_context["role_title"],
        level=level,
        jd_id=jd_id,
        user_id=user_id   ,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    question = ask_question(
        skill=jd_context["role_title"],
        level=level,
        history=None,
        jd_context=jd_context,
        candidate_preferences=candidate_preferences,
        db=db,
        user_id=user_id,
        source="interview",
    )

    db.add(InterviewMessage(
        session_id=session.id,
        role="assistant",
        content=question,
    ))
    db.commit()

    return session.id, question


def next_question(
    db: Session,
    session_id: int,
    answer: str,
    user_id: int = None,
    candidate_preferences: str | None = None,
) -> dict:

    session = db.query(InterviewSession).filter_by(id=session_id).first()
    if not session:
        raise ValueError(f"No session found with id {session_id}")

    jd_context = get_jd_context(db, session.jd_id)

    history = (
        db.query(InterviewMessage)
        .filter_by(session_id=session_id)
        .order_by(InterviewMessage.created_at)
        .all()
    )

    last_question = next(
        (m.content for m in reversed(history) if m.role == "assistant"),
        "Previous question"
    )
    score = score_answer(
        skill=jd_context["role_title"],
        question=last_question,
        answer=answer,
        jd_context=jd_context,
        history=[{"role": m.role, "content": m.content} for m in history],
        candidate_preferences=candidate_preferences,
        db=db,
        user_id=user_id,
        source="interview",
    )
    score_details = _round_scores(score)
    overall_score = score_details["overall"]

    user_message = InterviewMessage(
        session_id=session_id,
        role="user",
        content=answer,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    db.add(InterviewScore(
        session_id=session_id,
        correctness=score_details["correctness"],
        depth=score_details["depth"],
        clarity=score_details["clarity"],
    ))
    db.commit()

    previous_level = session.level
    new_level = next_difficulty(overall_score, previous_level)
    session.level = new_level
    db.add(session)
    db.commit()

    db.add(InterviewEvaluation(
        session_id=session_id,
        message_id=user_message.id,
        question=last_question,
        topic=score.get("topic"),
        level_before=previous_level,
        level_after=new_level,
        overall_score=score_details["overall"],
        confidence_score=score_details["confidence"],
        correctness_score=score_details["correctness"],
        depth_score=score_details["depth"],
        clarity_score=score_details["clarity"],
        evaluation_json=json.dumps({
            **score,
            "scores": score_details,
        }),
    ))
    db.commit()

    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": answer})
    all_evaluations = (
        db.query(InterviewEvaluation)
        .filter_by(session_id=session_id)
        .order_by(InterviewEvaluation.created_at)
        .all()
    )
    evaluation_payloads = [json.loads(item.evaluation_json) for item in all_evaluations]
    session_insights = compute_session_insights(evaluation_payloads)
    _persist_insight_snapshot(db, session_id, "live", session_insights)

    question = generate_followup(
        skill=jd_context["role_title"],
        level=new_level,
        previous_question=last_question,
        previous_answer=answer,
        extracted_signals={
            "topic": score.get("topic"),
            "weak_areas": score.get("weak_areas", []),
            "missing_concepts": score.get("missing_concepts", []),
            "followup_focus": score.get("followup_focus"),
            "scores": score_details,
            "linguistic_signals": score.get("linguistic_signals", {}),
            "structure_signals": score.get("structure_signals", {}),
        },
        jd_context=jd_context,
        history=messages,
        candidate_preferences=candidate_preferences,
        db=db,
        user_id=user_id,
        source="interview",
    )

    db.add(InterviewMessage(
        session_id=session_id,
        role="assistant",
        content=question,
    ))
    db.commit()

    return {
        "next_question": question,
        "score":         score_details,
        "next_level":    new_level,
        "evaluation":    {**score, "scores": score_details},
        "session_insights": session_insights,
    }


def finish_interview(db: Session, session_id: int) -> dict:

    session = db.query(InterviewSession).filter_by(id=session_id).first()
    if not session:
        raise ValueError(f"No session found with id {session_id}")

    evaluations = (
        db.query(InterviewEvaluation)
        .filter_by(session_id=session_id)
        .order_by(InterviewEvaluation.created_at)
        .all()
    )

    if not evaluations:
        raise ValueError(f"No evaluations found for session {session_id}")

    evaluations_list = [json.loads(item.evaluation_json) for item in evaluations]
    session_insights = compute_session_insights(evaluations_list)
    _persist_insight_snapshot(db, session_id, "final", session_insights)

    summary = generate_summary(
        scores=evaluations_list,
        skill=session.role,
        session_insights=session_insights,
    )
    summary["session_insights"] = session_insights
    return summary
