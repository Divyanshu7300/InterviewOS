import json
import re

from sqlalchemy.orm import Session

from app.db.models.learn import LearningSkill, LearningTopic
from app.services.llm_client import generate_llm_response
from app.services.skills.logo_catalog import get_logo_url


SIMILAR_SKILLS_PROMPT = """
You are a technical curriculum designer.

Primary skill: {skill_name}
Primary skill description: {description}

Generate exactly 3 similar or adjacent programming skills that would be useful next steps.

Rules:
- Skills must be distinct from the primary skill.
- Prefer practical, interview-relevant skills.
- Avoid duplicates or overly broad categories.
- Use short, standard names.
- Return slug in lowercase kebab-case.

Return ONLY valid JSON:
[
  {{
    "name": "Skill Name",
    "slug": "skill-slug",
    "description": "Short description in under 12 words"
  }}
]
"""

TOPICS_PROMPT = """
You are a senior software engineer and curriculum designer.

Generate a learning curriculum for: {skill_name}

Create exactly 15 topics:
- 5 BEGINNER topics
- 5 INTERMEDIATE topics
- 5 ADVANCED topics

For each topic provide:
- title
- description
- level
- xp_reward: 10 for BEGINNER, 20 for INTERMEDIATE, 30 for ADVANCED

Return ONLY valid JSON:
[
  {{
    "title": "...",
    "description": "...",
    "level": "BEGINNER",
    "xp_reward": 10
  }}
]
"""


def _parse_json_array(raw: str) -> list[dict]:
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        pass

    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return []


def _create_topics_for_skill(db: Session, skill: LearningSkill) -> None:
    raw = generate_llm_response(TOPICS_PROMPT.format(skill_name=skill.name))
    topics = _parse_json_array(raw)
    if not topics:
        return

    order_counters = {"BEGINNER": 0, "INTERMEDIATE": 3, "ADVANCED": 6}
    xp_map = {"BEGINNER": 10, "INTERMEDIATE": 20, "ADVANCED": 30}

    for topic in topics[:9]:
        title = (topic.get("title") or "").strip()
        level = (topic.get("level") or "").upper().strip()
        if not title or level not in order_counters:
            continue

        exists = db.query(LearningTopic).filter(
            LearningTopic.skill_id == skill.id,
            LearningTopic.title == title,
        ).first()
        if exists:
            continue

        order_counters[level] += 1
        db.add(LearningTopic(
            skill_id=skill.id,
            title=title,
            description=(topic.get("description") or "").strip(),
            level=level,
            order_index=order_counters[level],
            xp_reward=xp_map[level],
        ))


def generate_similar_skills(db: Session, skill: LearningSkill) -> list[LearningSkill]:
    raw = generate_llm_response(
        SIMILAR_SKILLS_PROMPT.format(
            skill_name=skill.name,
            description=skill.description or skill.name,
        )
    )
    suggestions = _parse_json_array(raw)
    created_or_found: list[LearningSkill] = []

    for item in suggestions[:3]:
        name = (item.get("name") or "").strip()
        slug = (item.get("slug") or "").strip().lower()
        description = (item.get("description") or f"Expand beyond {skill.name}").strip()
        if not name or not slug or slug == skill.slug:
            continue

        existing = db.query(LearningSkill).filter(LearningSkill.slug == slug).first()
        if existing:
            created_or_found.append(existing)
            continue

        new_skill = LearningSkill(
            name=name,
            slug=slug,
            description=description,
            icon=name[0].upper(),
            color="#111111",
        )
        db.add(new_skill)
        db.flush()
        _create_topics_for_skill(db, new_skill)
        created_or_found.append(new_skill)

    db.commit()
    for skill_item in created_or_found:
        db.refresh(skill_item)

    return created_or_found
