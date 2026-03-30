"""
Seed Script — LLM se Skills + Topics generate karo
Run: python -m app.services.skills.seed_data
"""
import json
import re
from app.db.session import SessionLocal
from app.db.models.learn import LearningSkill, LearningTopic
from app.services.llm_client import generate_llm_response


# ─── Skills Meta ─────────────────────────────────────────────────────────────
SKILLS_META = [
    # Backend
    {"name": "Python",       "slug": "python",       "icon": "🐍", "color": "#3776AB"},
    {"name": "FastAPI",      "slug": "fastapi",       "icon": "⚡", "color": "#009688"},
    {"name": "Django",       "slug": "django",        "icon": "🟩", "color": "#092E20"},
    {"name": "Node.js",      "slug": "nodejs",        "icon": "🟢", "color": "#339933"},
    {"name": "SQL",          "slug": "sql",           "icon": "🗄️", "color": "#336791"},
    {"name": "PostgreSQL",   "slug": "postgresql",    "icon": "🐘", "color": "#4169E1"},
    {"name": "Redis",        "slug": "redis",         "icon": "🔴", "color": "#DC382D"},

    # Frontend
    {"name": "React",        "slug": "react",         "icon": "⚛️", "color": "#61DAFB"},
    {"name": "Next.js",      "slug": "nextjs",        "icon": "▲",  "color": "#ffffff"},
    {"name": "TypeScript",   "slug": "typescript",    "icon": "🔷", "color": "#3178C6"},
    {"name": "JavaScript",   "slug": "javascript",    "icon": "🟨", "color": "#F7DF1E"},
    {"name": "Tailwind CSS", "slug": "tailwindcss",   "icon": "🎨", "color": "#38BDF8"},

    # DevOps & Tools
    {"name": "Docker",       "slug": "docker",        "icon": "🐳", "color": "#2496ED"},
    {"name": "Git",          "slug": "git",           "icon": "🌿", "color": "#F05032"},
    {"name": "Linux",        "slug": "linux",         "icon": "🐧", "color": "#FCC624"},

    # CS Fundamentals
    {"name": "Data Structures & Algorithms", "slug": "dsa",    "icon": "🧩", "color": "#FF6B6B"},
    {"name": "System Design",                "slug": "system-design", "icon": "🏗️", "color": "#845EC2"},
    {"name": "REST APIs",                    "slug": "rest-apis",     "icon": "🔌", "color": "#FF9671"},

    # AI/ML
    {"name": "Machine Learning", "slug": "machine-learning", "icon": "🤖", "color": "#FF6F91"},
    {"name": "LangChain",        "slug": "langchain",        "icon": "🦜", "color": "#1C3C3C"},
]


TOPICS_PROMPT = """
You are a senior software engineer and curriculum designer.

Generate a complete learning curriculum for: {skill_name}

Create exactly 15 topics:
- 5 BEGINNER topics (core fundamentals, must-know basics)
- 5 INTERMEDIATE topics (real-world usage, common patterns)
- 5 ADVANCED topics (production-level, interview-heavy topics)

Each topic must be:
- Specific and practical (NOT generic like "Introduction to X")
- Interview-relevant
- Logically ordered within each level

For each topic provide:
- title: short, specific name (e.g. "Dependency Injection", "JWT Auth Flow")
- description: 1-2 sentences on what will be covered
- level: BEGINNER / INTERMEDIATE / ADVANCED
- xp_reward: 10 for BEGINNER, 20 for INTERMEDIATE, 30 for ADVANCED

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {{
    "title": "...",
    "description": "...",
    "level": "BEGINNER",
    "xp_reward": 10
  }}
]
"""

SKILL_DESC_PROMPT = """
Write a single concise description (max 12 words) for the programming skill: {skill_name}
Return ONLY the description, nothing else.
"""


# ─── Helpers ─────────────────────────────────────────────────────────────────

def generate_skill_description(skill_name: str) -> str:
    try:
        raw = generate_llm_response(SKILL_DESC_PROMPT.format(skill_name=skill_name))
        return raw.strip().strip('"').strip("'")
    except Exception as e:
        print(f"    Description generation failed: {e}")
        return f"Master {skill_name} from basics to advanced"


def generate_topics_for_skill(skill_name: str) -> list[dict]:
    print(f"    LLM generating topics for {skill_name}...")
    try:
        raw = generate_llm_response(TOPICS_PROMPT.format(skill_name=skill_name))
        return _parse_json(raw)
    except Exception as e:
        print(f"    LLM error: {e}")
        return []


def _parse_json(raw: str) -> list[dict]:
    # Try direct parse
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        pass

    # Strip markdown fences
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Extract array with regex
    match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    print(f"    JSON parse failed. Raw preview:\n{raw[:300]}")
    return []


def validate_topic(t: dict) -> bool:
    """Basic validation on LLM output"""
    if not isinstance(t, dict):
        return False
    if not t.get("title") or not t.get("level"):
        return False
    if t["level"].upper() not in ("BEGINNER", "INTERMEDIATE", "ADVANCED"):
        return False
    return True


# ─── Main Seed ───────────────────────────────────────────────────────────────

def seed(skills_filter: list[str] = None):
    """
    skills_filter: optional list of slugs to seed only specific skills
    e.g. seed(["python", "react"])
    """
    db = SessionLocal()

    skills_to_seed = SKILLS_META
    if skills_filter:
        skills_to_seed = [s for s in SKILLS_META if s["slug"] in skills_filter]

    total_skills  = 0
    total_topics  = 0
    skipped       = 0
    failed        = []

    try:
        for meta in skills_to_seed:
            print(f"\n{'='*55}")
            print(f"  {meta['icon']}  {meta['name']}")
            print(f"{'='*55}")

            # ── Skill upsert ──────────────────────────────────────────────────
            skill = db.query(LearningSkill).filter(
                LearningSkill.slug == meta["slug"]
            ).first()

            if not skill:
                description = generate_skill_description(meta["name"])
                skill = LearningSkill(
                    name=meta["name"],
                    slug=meta["slug"],
                    description=description,
                    icon=meta["icon"],
                    color=meta["color"],
                )
                db.add(skill)
                db.flush()
                print(f"    ✓ Skill created: {skill.name} (id={skill.id})")
                total_skills += 1
            else:
                # Update icon/color if changed
                skill.icon  = meta["icon"]
                skill.color = meta["color"]
                db.flush()
                print(f"    → Skill exists (id={skill.id}) — checking topics...")

            # ── Topics check ──────────────────────────────────────────────────
            existing_count = db.query(LearningTopic).filter(
                LearningTopic.skill_id == skill.id
            ).count()

            if existing_count >= 15:
                print(f"    ⏭  Already has {existing_count} topics — skipping")
                skipped += 1
                continue

            # ── Generate topics ───────────────────────────────────────────────
            topics_data = generate_topics_for_skill(meta["name"])

            if not topics_data:
                print(f"    ✗ No topics generated — skipping {meta['name']}")
                failed.append(meta["name"])
                continue

            # ── Validate + Save ───────────────────────────────────────────────
            # order_index: beginner=1-5, intermediate=6-10, advanced=11-15
            order_counters = {"BEGINNER": 0, "INTERMEDIATE": 5, "ADVANCED": 10}
            saved = 0

            for t in topics_data:
                if not validate_topic(t):
                    print(f"    ⚠ Invalid topic skipped: {t}")
                    continue

                level = t["level"].upper()
                title = t["title"].strip()

                # Skip duplicates
                exists = db.query(LearningTopic).filter(
                    LearningTopic.skill_id == skill.id,
                    LearningTopic.title    == title,
                ).first()

                if exists:
                    print(f"    ⏭  Topic exists: {title}")
                    continue

                order_counters[level] += 1

                # Enforce correct XP per level
                xp_map = {"BEGINNER": 10, "INTERMEDIATE": 20, "ADVANCED": 30}
                xp = xp_map.get(level, t.get("xp_reward", 10))

                topic = LearningTopic(
                    skill_id=skill.id,
                    title=title,
                    description=t.get("description", "").strip(),
                    level=level,
                    order_index=order_counters[level],
                    xp_reward=xp,
                )
                db.add(topic)
                saved += 1
                print(f"    + [{level}] {title} ({xp} XP)")

            db.commit()
            total_topics += saved
            print(f"    ✓ {saved} topics saved for {meta['name']}")

        # ── Summary ───────────────────────────────────────────────────────────
        print(f"\n{'='*55}")
        print(f"  SEED COMPLETE")
        print(f"{'='*55}")
        print(f"  Skills created : {total_skills}")
        print(f"  Topics saved   : {total_topics}")
        print(f"  Skills skipped : {skipped}")
        if failed:
            print(f"  Failed         : {', '.join(failed)}")
        print(f"{'='*55}\n")

    except Exception as e:
        db.rollback()
        print(f"\n✗ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    # Optional: pass skill slugs as args to seed only specific skills
    # e.g. python -m app.services.skills.seed_data python react
    if len(sys.argv) > 1:
        slugs = sys.argv[1:]
        print(f"Seeding only: {slugs}")
        seed(skills_filter=slugs)
    else:
        seed()
