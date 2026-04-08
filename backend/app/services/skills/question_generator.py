"""
Learning Module — LLM Question Generator
DB check karo → agar questions hain return karo → warna LLM se generate karo → save karo
"""
import ast
import json
import re
from collections import Counter
from sqlalchemy.orm import Session

from app.services.llm_client import generate_llm_response
from app.db.models.learn import LearningQuestion, LearningTopic


QUESTION_PROMPT = """
You are an expert programming educator creating MCQ quiz questions.

Skill: {skill_name}
Topic: {topic_title}
Level: {level}
Description: {description}

Generate exactly {candidate_count} MCQ questions for this topic.

Rules:
- Questions must be specific to "{topic_title}"
- Level appropriate: {level} means {level_desc}
- Focus on one concrete concept per question
- Each question has exactly 4 options
- Only one correct answer per question
- Keep options short, plausible, and distinct
- Avoid repeated phrases, repeated stems, repeated keywords, and generic filler
- Do not ask the same concept twice in different wording
- Avoid malformed wording, awkward grammar, and copy-paste patterns
- Avoid overusing templates like "Which of the following..."
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

QUESTION_JSON_MODE_PROMPT = """
You are an expert programming educator creating MCQ quiz questions.

Skill: {skill_name}
Topic: {topic_title}
Level: {level}
Description: {description}

Generate quiz questions for this topic and return ONLY a JSON object in this shape:
{{
  "questions": [
    {{
      "question_text": "...",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_index": 0,
      "explanation": "..."
    }}
  ]
}}

Requirements:
- Create exactly {candidate_count} questions
- Questions must be specific to "{topic_title}"
- Level appropriate: {level} means {level_desc}
- Avoid repeated or generic questions
- Each question must have exactly 4 distinct options
- Only one correct answer per question
"""

LEVEL_DESCRIPTIONS = {
    "BEGINNER":     "basic concepts, definitions, simple usage",
    "INTERMEDIATE": "practical usage, patterns, common mistakes, integrations",
    "ADVANCED":     "internals, performance, edge cases, advanced patterns",
}

QUESTION_REPAIR_PROMPT = """
Convert the following content into a valid JSON array of quiz questions.

Rules:
- Return ONLY a valid JSON array
- No markdown, no explanation
- Each item must have:
  - question_text
  - options (array of exactly 4 strings)
  - correct_index (0-3)
  - explanation
- Remove malformed items instead of guessing

Content to repair:
{raw}
"""


def get_or_generate_questions(
    db: Session,
    topic: LearningTopic,
    skill_name: str,
    count: int = 15,
    force_regenerate: bool = False,
) -> tuple[list[LearningQuestion], str]:
    """
    Returns (questions, source) where source = "cache" | "generated" | "regenerated"
    """

    # ── Step 1: DB mein check karo ────────────────────────────────────────────
    existing = db.query(LearningQuestion).filter(
        LearningQuestion.topic_id == topic.id
    ).all()

    if force_regenerate and existing:
        for item in existing:
            db.delete(item)
        db.commit()
        existing = []

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
        candidate_count=count + 8,
        level_desc=LEVEL_DESCRIPTIONS.get(topic.level, "general"),
    )

    raw = _generate_questions_payload(prompt)

    # ── Step 3: Parse JSON ────────────────────────────────────────────────────
    questions_data = _parse_questions_json(raw)

    cleaned_questions = _prepare_questions(questions_data, count=count)

    if not cleaned_questions:
        fallback_questions = _build_fallback_questions(topic=topic, skill_name=skill_name, count=min(count, 5))
        if fallback_questions:
            cleaned_questions = fallback_questions
        else:
            raise RuntimeError("LLM returned invalid JSON for questions")
    if len(cleaned_questions) < min(count, 5):
        raise RuntimeError("Generated quiz questions were too repetitive or malformed")

    # ── Step 4: DB mein save karo ─────────────────────────────────────────────
    saved = []
    for q in cleaned_questions[:count]:
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
    return saved, "regenerated" if force_regenerate else "generated"


def _parse_questions_json(raw: str) -> list[dict]:
    """Robust JSON parser — tries multiple strategies"""
    if not raw:
        return []

    candidate_texts = _build_json_candidates(raw)

    for candidate in candidate_texts:
        try:
            parsed = json.loads(candidate)
            normalized = _coerce_question_payload(parsed)
            if normalized:
                return normalized
        except json.JSONDecodeError:
            pass

        try:
            parsed = ast.literal_eval(candidate)
            normalized = _coerce_question_payload(parsed)
            if normalized:
                return normalized
        except (ValueError, SyntaxError):
            pass

    print(f"[LEARN] Failed to parse JSON:\n{raw[:300]}")
    return []


def _generate_questions_payload(prompt: str) -> str:
    try:
        raw = generate_llm_response(prompt)
    except Exception as e:
        print(f"[LEARN] LLM error: {e}")
        raise RuntimeError("Failed to generate questions from LLM")

    if _parse_questions_json(raw):
        return raw

    print("[LEARN] Primary question output invalid, attempting JSON-mode retry")
    json_prompt = _build_json_mode_prompt_from_prompt(prompt)
    if json_prompt:
        try:
            json_mode_raw = generate_llm_response(json_prompt, json_mode=True)
        except Exception as e:
            print(f"[LEARN] JSON-mode retry failed: {e}")
        else:
            if _parse_questions_json(json_mode_raw):
                return json_mode_raw

    print("[LEARN] Primary question output invalid, attempting repair pass")
    try:
        repaired = generate_llm_response(
            QUESTION_REPAIR_PROMPT.format(raw=raw[:12000])
        )
    except Exception as e:
        print(f"[LEARN] Repair pass failed: {e}")
        return raw

    if _parse_questions_json(repaired):
        return repaired

    return raw


def _coerce_question_payload(parsed: object) -> list[dict]:
    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, dict):
        for key in ("questions", "items", "data", "quiz_questions"):
            value = parsed.get(key)
            if isinstance(value, list):
                return value
    return []


def _build_json_candidates(raw: str) -> list[str]:
    cleaned = raw.strip()
    candidates: list[str] = []

    def add_candidate(value: str) -> None:
        value = _cleanup_jsonish_text(value)
        if value and value not in candidates:
            candidates.append(value)

    add_candidate(cleaned)
    add_candidate(re.sub(r"```(?:json)?", "", cleaned).strip())

    array_match = re.search(r"\[\s*\{.*\}\s*\]", cleaned, re.DOTALL)
    if array_match:
        add_candidate(array_match.group())

    object_match = re.search(r"\{\s*\"?(questions|items|data|quiz_questions)\"?\s*:.*\}", cleaned, re.DOTALL)
    if object_match:
        add_candidate(object_match.group())

    return candidates


def _cleanup_jsonish_text(value: str) -> str:
    value = value.strip()
    value = value.replace("\u201c", '"').replace("\u201d", '"')
    value = value.replace("\u2018", "'").replace("\u2019", "'")
    value = re.sub(r",(\s*[}\]])", r"\1", value)
    return value


def _build_json_mode_prompt_from_prompt(prompt: str) -> str:
    skill = _extract_prompt_field(prompt, "Skill")
    topic = _extract_prompt_field(prompt, "Topic")
    level = _extract_prompt_field(prompt, "Level")
    description = _extract_prompt_field(prompt, "Description")
    if not all((skill, topic, level, description)):
        return ""

    return QUESTION_JSON_MODE_PROMPT.format(
        skill_name=skill,
        topic_title=topic,
        level=level,
        description=description,
        candidate_count=23,
        level_desc=LEVEL_DESCRIPTIONS.get(level, "general"),
    )


def _extract_prompt_field(prompt: str, label: str) -> str:
    match = re.search(rf"{label}:\s*(.+)", prompt)
    return (match.group(1).strip() if match else "")


def _build_fallback_questions(topic: LearningTopic, skill_name: str, count: int) -> list[dict]:
    subject = f"{skill_name} - {topic.title}"
    base = [
        {
            "question_text": f"Which statement best describes the core idea of {subject}?",
            "options": [
                f"A practical concept used in {skill_name}",
                "A frontend styling library",
                "A mobile operating system",
                "A database backup command",
            ],
            "correct_index": 0,
            "explanation": f"{topic.title} is being treated as a concept within {skill_name}.",
        },
        {
            "question_text": f"When working with {subject}, what should you focus on first?",
            "options": [
                "Understanding the fundamental purpose and common use case",
                "Skipping straight to deployment without context",
                "Ignoring edge cases entirely",
                "Memorizing random syntax only",
            ],
            "correct_index": 0,
            "explanation": "Strong fundamentals usually come first before advanced usage.",
        },
        {
            "question_text": f"Which option is the most reasonable beginner approach to learn {subject}?",
            "options": [
                "Start with basics, examples, and small practice problems",
                "Only study interview riddles",
                "Avoid using examples",
                "Jump only to optimization internals",
            ],
            "correct_index": 0,
            "explanation": "Basics plus examples is the safest beginner learning path.",
        },
        {
            "question_text": f"In interviews, questions on {subject} usually test what most directly?",
            "options": [
                "Conceptual clarity and applied understanding",
                "Typing speed alone",
                "Monitor resolution",
                "Browser theme preference",
            ],
            "correct_index": 0,
            "explanation": "Interviewers typically look for understanding and application.",
        },
        {
            "question_text": f"What is a common mistake while answering questions about {subject}?",
            "options": [
                "Giving definitions without explaining practical usage",
                "Providing concise examples",
                "Connecting answers to real-world cases",
                "Explaining tradeoffs clearly",
            ],
            "correct_index": 0,
            "explanation": "Answers should usually connect concepts to application and tradeoffs.",
        },
    ]
    return base[:count]


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def _dedupe_key(text: str) -> str:
    normalized = _normalize_text(text).lower()
    normalized = re.sub(r"[^a-z0-9\s]", "", normalized)
    return normalized


def _is_distorted_text(text: str) -> bool:
    normalized = _normalize_text(text)
    lowered = normalized.lower()

    if len(normalized) < 12:
        return True
    if re.search(r"\b(\w+)(?:\s+\1){2,}\b", lowered):
        return True
    if re.search(r"(.)\1{4,}", normalized):
        return True

    tokens = re.findall(r"[a-zA-Z]{3,}", lowered)
    if not tokens:
        return False

    counts = Counter(tokens)
    most_common_count = counts.most_common(1)[0][1]
    if most_common_count >= 4 and most_common_count / max(len(tokens), 1) > 0.34:
        return True

    return False


def _looks_like_generic_question(text: str) -> bool:
    generic_patterns = [
        r"^what is ",
        r"^which of the following",
        r"^which statement is correct",
        r"^what does .* mean",
        r"^what is the purpose of",
    ]
    lowered = _normalize_text(text).lower()
    return any(re.search(pattern, lowered) for pattern in generic_patterns)


def _sanitize_question_item(item: dict) -> dict | None:
    if not isinstance(item, dict):
        return None

    question_text = _normalize_text(item.get("question_text", ""))
    explanation = _normalize_text(item.get("explanation", ""))
    options = item.get("options")
    correct_index = item.get("correct_index")

    if not question_text or not isinstance(options, list) or len(options) != 4:
        return None
    if correct_index not in (0, 1, 2, 3):
        return None

    cleaned_options = [_normalize_text(str(option)) for option in options]
    if any(not option for option in cleaned_options):
        return None
    if len({_dedupe_key(option) for option in cleaned_options}) != 4:
        return None
    if _is_distorted_text(question_text) or any(_is_distorted_text(option) for option in cleaned_options):
        return None

    return {
        "question_text": question_text if question_text.endswith("?") else f"{question_text}?",
        "options": cleaned_options,
        "correct_index": int(correct_index),
        "explanation": explanation,
    }


def _prepare_questions(raw_items: list[dict], count: int) -> list[dict]:
    prepared = []
    seen_questions = set()

    for raw_item in raw_items:
        item = _sanitize_question_item(raw_item)
        if not item:
            continue

        question_key = _dedupe_key(item["question_text"])
        if question_key in seen_questions:
            continue

        # Reject questions that are too close to already accepted ones.
        current_tokens = set(question_key.split())
        too_similar = False
        for accepted in prepared:
            accepted_tokens = set(_dedupe_key(accepted["question_text"]).split())
            overlap = len(current_tokens & accepted_tokens)
            union = len(current_tokens | accepted_tokens) or 1
            if overlap / union >= 0.72:
                too_similar = True
                break
        if too_similar:
            continue

        if _looks_like_generic_question(item["question_text"]) and len(prepared) >= max(4, count // 3):
            continue

        seen_questions.add(question_key)
        prepared.append(item)

    return prepared[:count]
