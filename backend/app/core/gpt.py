# from openai import OpenAI
# from app.core.prompts import INTERVIEW_SYSTEM_PROMPT
# from app.core.config import settings

# client = OpenAI(api_key=settings.OPENAI_API_KEY)

# def ask_gpt(messages: list[str]) -> str:
#     response = client.chat.completions.create(
#         model="gpt-4o-mini",
#         messages=messages,
#         temperature=0.6,
#     )
#     return response.choices[0].message.content
# #not using this now