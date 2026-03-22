def build_interview_prompt(skill: str, level: str, jd_context: dict = None) -> str:
    difficulty_guidance = {
        "EASY": "Ask beginner-level questions. Focus on definitions and basic concepts.",
        "MEDIUM": "Ask intermediate questions. Include scenario-based and applied questions.",
        "HARD": "Ask advanced questions. Include system design, edge cases, and deep internals.",
    }

    guidance = difficulty_guidance.get(level.upper(), difficulty_guidance["MEDIUM"])

    # JD context available hai toh JD-specific prompt banao
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

Guidelines:
- {guidance}
- Ask ONE clear, focused question at a time.
- Questions must be directly relevant to the job description above.
- Cover topics from the tech stack: {tech_stack}
- Do NOT reveal the answer or give hints unless explicitly asked.
- Base follow-up questions on the candidate's previous answers to go deeper.
- Mix theory, practical, and scenario-based questions.
- Focus on real-world understanding, not just definitions.
"""

    # JD nahi hai toh generic prompt
    return f"""You are a strict but fair technical interviewer conducting a real interview.
Interview the candidate on: {skill}
Difficulty level: {level}

Guidelines:
- {guidance}
- Ask ONE clear, focused question at a time.
- Do NOT reveal the answer or give hints unless the candidate explicitly asks.
- Keep your question concise and unambiguous.
- Base follow-up questions on the candidate's previous answers to go deeper.
- Focus on real-world understanding, not just theory.
"""