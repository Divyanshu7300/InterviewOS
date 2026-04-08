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
    # AI/ML Roles
    {"name": "AI Engineer",      "slug": "ai-engineer",      "icon": "🤖", "color": "#4F46E5"},
    {"name": "Generative AI Engineer", "slug": "generative-ai-engineer", "icon": "✨", "color": "#7C3AED"},
    {"name": "Machine Learning Engineer", "slug": "ml-engineer", "icon": "🛠️", "color": "#EC4899"},
    {"name": "Data Scientist",   "slug": "data-scientist",   "icon": "🧪", "color": "#1D4ED8"},
    {"name": "Data Analyst",     "slug": "data-analyst",     "icon": "📋", "color": "#0369A1"},
    {"name": "BI Analyst",       "slug": "bi-analyst",       "icon": "📊", "color": "#B45309"},
    {"name": "Business Analyst", "slug": "business-analyst", "icon": "💼", "color": "#0F766E"},
    {"name": "Analytics Engineer", "slug": "analytics-engineer", "icon": "📐", "color": "#0EA5E9"},

    # AI/ML Foundations
    {"name": "Machine Learning", "slug": "machine-learning", "icon": "🤖", "color": "#FF6F91"},
    {"name": "Deep Learning",    "slug": "deep-learning",    "icon": "🧠", "color": "#8B5CF6"},
    {"name": "Neural Networks",  "slug": "neural-networks",  "icon": "🕸️", "color": "#7C3AED"},
    {"name": "Statistics for ML", "slug": "statistics-ml",   "icon": "📊", "color": "#0F766E"},
    {"name": "Feature Engineering", "slug": "feature-engineering", "icon": "🧪", "color": "#7C3AED"},
    {"name": "Model Evaluation", "slug": "model-evaluation", "icon": "📏", "color": "#2563EB"},
    {"name": "Reinforcement Learning", "slug": "reinforcement-learning", "icon": "🎮", "color": "#059669"},
    {"name": "Causal Inference", "slug": "causal-inference", "icon": "🪢", "color": "#B45309"},

    # AI/ML Frameworks
    {"name": "Scikit-learn",     "slug": "scikit-learn",     "icon": "🔬", "color": "#F7931E"},
    {"name": "PyTorch",          "slug": "pytorch",          "icon": "🔥", "color": "#EE4C2C"},
    {"name": "TensorFlow",       "slug": "tensorflow",       "icon": "🟧", "color": "#FF6F00"},
    {"name": "Hugging Face",     "slug": "huggingface",      "icon": "🤗", "color": "#FFD21E"},
    {"name": "LangChain",        "slug": "langchain",        "icon": "🦜", "color": "#1C3C3C"},

    # GenAI / LLM
    {"name": "Generative AI",    "slug": "generative-ai",    "icon": "✨", "color": "#8B5CF6"},
    {"name": "LLMs",             "slug": "llms",             "icon": "💬", "color": "#4F46E5"},
    {"name": "Transformers",     "slug": "transformers",     "icon": "🔁", "color": "#FFBF00"},
    {"name": "Prompt Engineering", "slug": "prompt-engineering", "icon": "✍️", "color": "#9333EA"},
    {"name": "RAG",              "slug": "rag",              "icon": "📚", "color": "#F59E0B"},
    {"name": "Embeddings",       "slug": "embeddings",       "icon": "🧬", "color": "#4F46E5"},
    {"name": "Vector Search",    "slug": "vector-search",    "icon": "🧲", "color": "#7C3AED"},
    {"name": "Semantic Search",  "slug": "semantic-search",  "icon": "🔎", "color": "#0891B2"},
    {"name": "AI Agents",        "slug": "ai-agents",        "icon": "🧭", "color": "#1D4ED8"},
    {"name": "Multimodal AI",    "slug": "multimodal-ai",    "icon": "🖼️", "color": "#0EA5E9"},
    {"name": "Fine-Tuning",      "slug": "fine-tuning",      "icon": "🎛️", "color": "#7C3AED"},
    {"name": "Fine-Tuning LLMs", "slug": "fine-tuning-llms", "icon": "🧠", "color": "#6D28D9"},
    {"name": "LLM Evaluation",   "slug": "llm-evaluation",   "icon": "🧪", "color": "#1D4ED8"},
    {"name": "RLHF",             "slug": "rlhf",             "icon": "🎯", "color": "#EA580C"},
    {"name": "AI Safety",        "slug": "ai-safety",        "icon": "🛡️", "color": "#DC2626"},

    # Data / Analytics
    {"name": "Data Science",     "slug": "data-science",     "icon": "🧬", "color": "#2563EB"},
    {"name": "Data Analysis",    "slug": "data-analysis",    "icon": "📈", "color": "#0284C7"},
    {"name": "Exploratory Data Analysis", "slug": "eda",     "icon": "🔎", "color": "#C2410C"},
    {"name": "Data Cleaning",    "slug": "data-cleaning",    "icon": "🧹", "color": "#059669"},
    {"name": "Data Visualization", "slug": "data-visualization", "icon": "📉", "color": "#7C2D12"},
    {"name": "SQL for Data Analysis", "slug": "sql-data-analysis", "icon": "🧮", "color": "#336791"},
    {"name": "Pandas",           "slug": "pandas",           "icon": "🐼", "color": "#150458"},
    {"name": "NumPy",            "slug": "numpy",            "icon": "🔢", "color": "#4D77CF"},
    {"name": "Power BI",         "slug": "power-bi",         "icon": "📊", "color": "#F2C811"},
    {"name": "Apache Spark",     "slug": "apache-spark",     "icon": "⚡", "color": "#E25A1C"},
    {"name": "Airflow",          "slug": "airflow",          "icon": "🌬️", "color": "#017CEE"},
    {"name": "A/B Testing",      "slug": "ab-testing",       "icon": "🧫", "color": "#16A34A"},
    {"name": "Time Series Forecasting", "slug": "time-series", "icon": "⏱️", "color": "#0891B2"},
    {"name": "Anomaly Detection","slug": "anomaly-detection","icon": "🚨", "color": "#DC2626"},

    # Applied ML Use Cases
    {"name": "NLP",              "slug": "nlp",              "icon": "🗣️", "color": "#0EA5E9"},
    {"name": "Computer Vision",  "slug": "computer-vision",  "icon": "👁️", "color": "#14B8A6"},
    {"name": "Recommendation Systems", "slug": "recommendation-systems", "icon": "🎯", "color": "#EA580C"},
    {"name": "Recommendation ML","slug": "recommendation-ml","icon": "🎯", "color": "#C2410C"},
    {"name": "XGBoost",          "slug": "xgboost",          "icon": "🌲", "color": "#2E7D32"},
    {"name": "Vector Databases", "slug": "vector-databases", "icon": "🧲", "color": "#7C3AED"},

    # MLOps / Production AI
    {"name": "MLOps",            "slug": "mlops",            "icon": "⚙️", "color": "#2563EB"},
    {"name": "Model Deployment", "slug": "model-deployment", "icon": "🚀", "color": "#DC2626"},
    {"name": "Inference Optimization", "slug": "inference-optimization", "icon": "⚡", "color": "#F59E0B"},
    {"name": "Distributed Training", "slug": "distributed-training", "icon": "🖧", "color": "#0284C7"},
    {"name": "AI Observability", "slug": "ai-observability", "icon": "📡", "color": "#0F766E"},

    # Backend
    {"name": "Python",       "slug": "python",       "icon": "🐍", "color": "#3776AB"},
    {"name": "Java",         "slug": "java",         "icon": "☕", "color": "#ED8B00"},
    {"name": "Spring Boot",  "slug": "spring-boot",  "icon": "🍃", "color": "#6DB33F"},
    {"name": "FastAPI",      "slug": "fastapi",       "icon": "⚡", "color": "#009688"},
    {"name": "Django",       "slug": "django",        "icon": "🟩", "color": "#092E20"},
    {"name": "Node.js",      "slug": "nodejs",        "icon": "🟢", "color": "#339933"},
    {"name": "Express.js",   "slug": "expressjs",     "icon": "🚂", "color": "#444444"},
    {"name": "SQL",          "slug": "sql",           "icon": "🗄️", "color": "#336791"},
    {"name": "PostgreSQL",   "slug": "postgresql",    "icon": "🐘", "color": "#4169E1"},
    {"name": "MySQL",        "slug": "mysql",         "icon": "🐬", "color": "#4479A1"},
    {"name": "MongoDB",      "slug": "mongodb",       "icon": "🍃", "color": "#47A248"},
    {"name": "Redis",        "slug": "redis",         "icon": "🔴", "color": "#DC382D"},
    {"name": "GraphQL",      "slug": "graphql",       "icon": "🔺", "color": "#E10098"},
    {"name": "Microservices","slug": "microservices", "icon": "🧱", "color": "#0F766E"},

    # Frontend
    {"name": "HTML",         "slug": "html",          "icon": "📄", "color": "#E34F26"},
    {"name": "CSS",          "slug": "css",           "icon": "🎀", "color": "#1572B6"},
    {"name": "React",        "slug": "react",         "icon": "⚛️", "color": "#61DAFB"},
    {"name": "Redux",        "slug": "redux",         "icon": "🧰", "color": "#764ABC"},
    {"name": "React Native", "slug": "react-native",  "icon": "📱", "color": "#61DAFB"},
    {"name": "Next.js",      "slug": "nextjs",        "icon": "▲",  "color": "#ffffff"},
    {"name": "TypeScript",   "slug": "typescript",    "icon": "🔷", "color": "#3178C6"},
    {"name": "JavaScript",   "slug": "javascript",    "icon": "🟨", "color": "#F7DF1E"},
    {"name": "Tailwind CSS", "slug": "tailwindcss",   "icon": "🎨", "color": "#38BDF8"},
    {"name": "Webpack",      "slug": "webpack",       "icon": "📦", "color": "#8DD6F9"},
    {"name": "Vite",         "slug": "vite",          "icon": "⚡", "color": "#646CFF"},

    # DevOps & Tools
    {"name": "Docker",       "slug": "docker",        "icon": "🐳", "color": "#2496ED"},
    {"name": "Git",          "slug": "git",           "icon": "🌿", "color": "#F05032"},
    {"name": "Linux",        "slug": "linux",         "icon": "🐧", "color": "#FCC624"},
    {"name": "AWS",          "slug": "aws",           "icon": "☁️", "color": "#FF9900"},
    {"name": "Kubernetes",   "slug": "kubernetes",    "icon": "☸️", "color": "#326CE5"},
    {"name": "CI/CD",        "slug": "ci-cd",         "icon": "🔁", "color": "#0EA5E9"},
    {"name": "Nginx",        "slug": "nginx",         "icon": "🟢", "color": "#009639"},
    {"name": "Terraform",    "slug": "terraform",     "icon": "🏗️", "color": "#844FBA"},
    {"name": "GitHub Actions","slug": "github-actions","icon": "⚙️", "color": "#2088FF"},

    # CS Fundamentals
    {"name": "Data Structures & Algorithms", "slug": "dsa",    "icon": "🧩", "color": "#FF6B6B"},
    {"name": "System Design",                "slug": "system-design", "icon": "🏗️", "color": "#845EC2"},
    {"name": "REST APIs",                    "slug": "rest-apis",     "icon": "🔌", "color": "#FF9671"},
    {"name": "OOP",                          "slug": "oop",           "icon": "🧱", "color": "#2563EB"},
    {"name": "Operating Systems",            "slug": "operating-systems", "icon": "💻", "color": "#4B5563"},
    {"name": "Computer Networks",            "slug": "computer-networks", "icon": "🌐", "color": "#0EA5E9"},
    {"name": "DBMS",                         "slug": "dbms",          "icon": "🗃️", "color": "#1D4ED8"},
    {"name": "Concurrency",                  "slug": "concurrency",   "icon": "🪢", "color": "#DC2626"},
    {"name": "Low Level Design",             "slug": "lld",           "icon": "📐", "color": "#7C3AED"},

]

SEED_BATCH_SIZE = 5


def _build_seed_batches(skills_meta: list[dict], chunk_size: int = SEED_BATCH_SIZE) -> dict[str, list[str]]:
    batches: dict[str, list[str]] = {}
    slugs = [item["slug"] for item in skills_meta]

    for index in range(0, len(slugs), chunk_size):
        batch_number = (index // chunk_size) + 1
        batch_name = f"batch-{batch_number:02d}"
        batches[batch_name] = slugs[index:index + chunk_size]

    return batches


SEED_BATCHES = _build_seed_batches(SKILLS_META)


def get_seed_skill_catalog() -> list[dict]:
    return [
        {
            "name": item["name"],
            "slug": item["slug"],
            "color": item["color"],
            "icon": item["icon"],
        }
        for item in SKILLS_META
    ]


def get_seed_batches() -> dict[str, list[str]]:
    return SEED_BATCHES


def expand_seed_batch(batch_name: str) -> list[str]:
    return SEED_BATCHES.get(batch_name, [])


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

def seed(
    skills_filter: list[str] = None,
    with_topics: bool = True,
    minimum_topic_count: int = 15,
):
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
    processed     = []

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
                processed.append(meta["slug"])
            else:
                # Update icon/color if changed
                skill.icon  = meta["icon"]
                skill.color = meta["color"]
                db.flush()
                print(f"    → Skill exists (id={skill.id}) — checking topics...")
                processed.append(meta["slug"])

            if not with_topics:
                db.commit()
                print("    ⏭  Topic generation disabled for this run")
                continue

            # ── Topics check ──────────────────────────────────────────────────
            existing_count = db.query(LearningTopic).filter(
                LearningTopic.skill_id == skill.id
            ).count()

            if existing_count >= minimum_topic_count:
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

        return {
            "processed_skills": processed,
            "skills_created": total_skills,
            "topics_saved": total_topics,
            "skills_skipped": skipped,
            "failed_skills": failed,
            "with_topics": with_topics,
            "minimum_topic_count": minimum_topic_count,
        }

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
