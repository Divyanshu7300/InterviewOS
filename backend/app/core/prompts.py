# INTERVIEW_SYSTEM_PROMPT = """
# You are a senior technical interviewer.
# Ask one question at a time.
# Ask follow-ups based on previous answers.
# """

# EVALUATION_PROMPT = """
# Evaluate the candidate answer.

# Question:
# {question}

# Answer:
# {answer}

# Return STRICT JSON:
# {
#   "correctness": number,
#   "depth": number,
#   "clarity": number,
#   "feedback": "short feedback"
# }
# """

# SUMMARY_PROMPT = """
# Given interview scores:
# {scores}

# Generate a concise interview summary with:
# - Strengths
# - Weaknesses
# - Final verdict
# """
