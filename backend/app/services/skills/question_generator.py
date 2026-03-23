"""
Learning Module — LLM Question Generator
DB check karo → agar questions hain return karo → warna LLM se generate karo → save karo
"""
import json
import re
from sqlalchemy.orm import Session

from app.services.llm_client import generate_llm_response
from app.db.models.learn import LearningQuestion, LearningTopic


QUESTION_PROMPT = """
You are an expert programming educator creating MCQ quiz questions.

Skill: {skill_name}
Topic: {topic_title}
Level: {level}
Description: {description}

Generate exactly {count} MCQ questions for this topic.

Rules:
- Questions must be specific to "{topic_title}"
- Level appropriate: {level} means {level_desc}
- Each question has exactly 4 options
- Only one correct answer per question
- Include a brief explanation for the correct answer
- No repeated questions

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {{
    "question_text": "...",
    "options": ["option A", "option B", "option C", "option D"],
    "correct_index": 0,
    "explanation": "..."
  }}
]
"""

LEVEL_DESCRIPTIONS = {
    "BEGINNER":     "basic concepts, definitions, simple usage",
    "INTERMEDIATE": "practical usage, patterns, common mistakes, integrations",
    "ADVANCED":     "internals, performance, edge cases, advanced patterns",
}


def get_or_generate_questions(
    db: Session,
    topic: LearningTopic,
    skill_name: str,
    count: int = 15,
) -> tuple[list[LearningQuestion], str]:
    """
    Returns (questions, source) where source = "cache" | "generated"
    """

    # ── Step 1: DB mein check karo ────────────────────────────────────────────
    existing = db.query(LearningQuestion).filter(
        LearningQuestion.topic_id == topic.id
    ).all()

    if len(existing) >= count:
        print(f"[LEARN] Cache hit → topic_id={topic.id}, {len(existing)} questions")
        return existing[:count], "cache"

    # ── Step 2: LLM se generate karo ─────────────────────────────────────────
    print(f"[LEARN] Generating questions → topic='{topic.title}', level={topic.level}")

    prompt = QUESTION_PROMPT.format(
        skill_name=skill_name,
        topic_title=topic.title,
        level=topic.level,
        description=topic.description or topic.title,
        count=count,
        level_desc=LEVEL_DESCRIPTIONS.get(topic.level, "general"),
    )

    try:
        raw = generate_llm_response(prompt)
    except Exception as e:
        print(f"[LEARN] LLM error: {e}")
        raise RuntimeError("Failed to generate questions from LLM")

    # ── Step 3: Parse JSON ────────────────────────────────────────────────────
    questions_data = _parse_questions_json(raw)

    if not questions_data:
        raise RuntimeError("LLM returned invalid JSON for questions")

    # ── Step 4: DB mein save karo ─────────────────────────────────────────────
    saved = []
    for q in questions_data[:count]:
        try:
            obj = LearningQuestion(
                topic_id=topic.id,
                question_text=q["question_text"],
                options=q["options"],
                correct_index=int(q["correct_index"]),
                explanation=q.get("explanation", ""),
            )
            db.add(obj)
            saved.append(obj)
        except (KeyError, TypeError) as e:
            print(f"[LEARN] Skipping malformed question: {e}")
            continue

    db.commit()
    for obj in saved:
        db.refresh(obj)

    print(f"[LEARN] Saved {len(saved)} questions for topic_id={topic.id}")
    return saved, "generated"


def _parse_questions_json(raw: str) -> list[dict]:
    """Robust JSON parser — tries multiple strategies"""

    # Strategy 1: direct parse
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        pass

    # Strategy 2: strip markdown fences
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Strategy 3: extract JSON array
    match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    print(f"[LEARN] Failed to parse JSON:\n{raw[:300]}")
    return []