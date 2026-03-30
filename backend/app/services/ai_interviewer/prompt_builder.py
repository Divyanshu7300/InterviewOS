def build_interview_prompt(
    skill: str,
    level: str,
    jd_context: dict = None,
    candidate_preferences: str | None = None,
) -> str:
    difficulty_guidance = {
        "EASY": "Ask beginner-level questions. Focus on definitions and basic concepts.",
        "MEDIUM": "Ask intermediate questions. Include scenario-based and applied questions.",
        "HARD": "Ask advanced questions. Include system design, edge cases, and deep internals.",
    }

    guidance = difficulty_guidance.get(level.upper(), difficulty_guidance["MEDIUM"])

    # Build a JD-specific prompt when context is available.
    if jd_context:
        tech_stack = ", ".join(jd_context.get("tech_stack", [])) or skill
        topics = ", ".join(jd_context.get("interview_topics", [])) or skill
        role_title = jd_context.get("role_title", skill)
        jd_text = jd_context.get("jd_text", "")

        return f"""You are a strict but fair technical interviewer conducting a real job interview.

Role being interviewed for: {role_title}
Difficulty level: {level}

Job Description:
{jd_text}

Key topics to cover: {topics}
Tech stack to focus on: {tech_stack}
Candidate guidance: {candidate_preferences or "No additional candidate guidance."}

Guidelines:
- {guidance}
- Ask ONE clear, focused question at a time.
- Questions must be directly relevant to the job description above.
- Cover topics from the tech stack: {tech_stack}
- Respect the candidate guidance when balancing coverage. If they say they are already strong in one area, spend relatively less time there and probe weaker or broader areas instead.
- Do NOT reveal the answer or give hints unless explicitly asked.
- Base follow-up questions on the candidate's previous answers to go deeper.
- Mix theory, practical, and scenario-based questions.
- Focus on real-world understanding, not just definitions.
"""

    # Fall back to a generic prompt when JD context is unavailable.
    return f"""You are a strict but fair technical interviewer conducting a real interview.
Interview the candidate on: {skill}
Difficulty level: {level}
Candidate guidance: {candidate_preferences or "No additional candidate guidance."}

Guidelines:
- {guidance}
- Ask ONE clear, focused question at a time.
- Respect the candidate guidance when balancing coverage. If they say they are already strong in one area, spend relatively less time there and probe weaker or broader areas instead.
- Do NOT reveal the answer or give hints unless the candidate explicitly asks.
- Keep your question concise and unambiguous.
- Base follow-up questions on the candidate's previous answers to go deeper.
- Focus on real-world understanding, not just theory.
"""


def build_evaluation_prompt(
    skill: str,
    question: str,
    answer: str,
    jd_context: dict = None,
    history: list[dict] | None = None,
    candidate_preferences: str | None = None,
) -> str:
    role_title = jd_context.get("role_title", skill) if jd_context else skill
    tech_stack = ", ".join(jd_context.get("tech_stack", [])) if jd_context else skill
    topics = ", ".join(jd_context.get("interview_topics", [])) if jd_context else skill
    history_text = ""
    if history:
        history_lines = []
        for item in history[-4:]:
            role = "Interviewer" if item["role"] == "assistant" else "Candidate"
            history_lines.append(f"{role}: {item['content']}")
        history_text = "\n".join(history_lines)

    return f"""You are evaluating a live technical interview answer for the role "{role_title}".

Question:
{question}

Candidate Answer:
{answer}

Role context:
- Core skill area: {skill}
- Tech stack: {tech_stack}
- Interview topics: {topics}
- Candidate guidance: {candidate_preferences or "No additional candidate guidance."}

Recent interview history:
{history_text or "No prior history."}

Score the answer with real interview judgement. Map the dimensions this way:
- confidence: inferred from linguistic patterns such as certainty, hesitations, ownership, specificity, and filler-heavy language
- clarity: inferred from structure, sequencing, concision, and whether the answer has a clear setup/body/conclusion
- depth: inferred from concept coverage, tradeoffs, edge cases, internals, examples, and technical reasoning
- correctness: factual and technical accuracy for the role

Return ONLY valid JSON:
{{
  "score": <float 0-10>,
  "scores": {{
    "overall": <float 0-10>,
    "confidence": <float 0-10>,
    "correctness": <float 0-10>,
    "depth": <float 0-10>,
    "clarity": <float 0-10>
  }},
  "reasoning": "<short overall explanation for the score>",
  "dimension_reasoning": {{
    "confidence": "<why confidence got this score>",
    "correctness": "<why correctness got this score>",
    "depth": "<why depth got this score>",
    "clarity": "<why clarity got this score>"
  }},
  "sentence_level_feedback": [
    {{
      "sentence": "<exact weak sentence from candidate answer>",
      "issue": "<what is weak about it>",
      "suggestion": "<how to improve or replace it>",
      "impacted_dimensions": ["<confidence|correctness|depth|clarity>"]
    }}
  ],
  "topic": "<primary topic of this answer>",
  "subtopics": ["<subtopic>", "<subtopic>"],
  "feedback": "<2-3 sentence actionable feedback>",
  "strengths": ["<strength>", "<strength>"],
  "weak_areas": ["<weak area>", "<weak area>"],
  "missing_concepts": ["<missing concept>", "<missing concept>"],
  "concept_coverage": ["<concept covered>", "<concept covered>"],
  "structure_signals": {{
    "has_clear_structure": <true/false>,
    "uses_examples": <true/false>,
    "mentions_tradeoffs": <true/false>,
    "answers_directly": <true/false>
  }},
  "linguistic_signals": {{
    "confidence_pattern": "<brief explanation>",
    "clarity_pattern": "<brief explanation>",
    "depth_pattern": "<brief explanation>"
  }},
  "followup_focus": "<what the interviewer should probe next>",
  "improvement_hint": "<single sentence coaching hint>"
}}
"""


def build_followup_prompt(
    skill: str,
    level: str,
    previous_question: str,
    previous_answer: str,
    extracted_signals: dict,
    jd_context: dict = None,
    history: list[dict] | None = None,
    candidate_preferences: str | None = None,
) -> str:
    role_title = jd_context.get("role_title", skill) if jd_context else skill
    tech_stack = ", ".join(jd_context.get("tech_stack", [])) if jd_context else skill
    topics = ", ".join(jd_context.get("interview_topics", [])) if jd_context else skill
    history_text = ""
    if history:
        history_text = "\n".join(
            f'{"Interviewer" if item["role"] == "assistant" else "Candidate"}: {item["content"]}'
            for item in history[-6:]
        )

    return f"""You are an adaptive AI interviewer for the role "{role_title}".

Generate the next interview question as a targeted follow-up, not a generic random question.

Current difficulty: {level}
Skill focus: {skill}
Tech stack: {tech_stack}
Topics to cover: {topics}
Candidate guidance: {candidate_preferences or "No additional candidate guidance."}

Previous question:
{previous_question}

Candidate's previous answer:
{previous_answer}

Extracted evaluation signals:
{extracted_signals}

Recent history:
{history_text or "No prior history."}

Rules:
- Ask exactly one question.
- Make it feel like a natural follow-up to the candidate's previous answer.
- Probe either a gap, a tradeoff, an edge case, or a concrete implementation detail.
- Respect the candidate guidance while still testing the role comprehensively.
- If the candidate was weak, narrow the scope and test fundamentals.
- If the candidate was strong, increase difficulty with deeper reasoning or system implications.
- Keep the wording concise and interview-like.
- Do not provide hints or coaching in the question.
- Return only the question itself.
- Do not include any preface such as "here's the next question", reasoning, analysis, labels, or quotation marks.
"""


def build_summary_prompt(
    skill: str,
    scores: list[dict],
    session_insights: dict,
) -> str:
    return f"""You are summarizing an adaptive technical interview for the skill: {skill}.

Per-round evaluations:
{scores}

Session intelligence:
{session_insights}

Return ONLY valid JSON:
{{
  "overall_score": <average score out of 10, float>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"],
  "session_dna": "<short label describing the candidate pattern>",
  "best_signal": "<strongest dimension>",
  "momentum": "<improving | steady | declining>"
}}
"""
