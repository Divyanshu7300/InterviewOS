"""
LLM Client — OpenAI + Ollama
Token tracking built-in
"""
import os
import requests
from openai import OpenAI
from sqlalchemy.orm import Session

LLM_PROVIDER   = os.getenv("LLM_PROVIDER")
OLLAMA_URL     = os.getenv("OLLAMA_URL")
OLLAMA_MODEL   = os.getenv("OLLAMA_MODEL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL   = os.getenv("OPENAI_MODEL")

def generate_llm_response(
    prompt: str,
    json_mode: bool = False,
    # optional — agar diya toh tokens automatically record honge
    db: Session = None,
    user_id: int = None,
    source: str = "general",
) -> str:

    response_text = ""

    # ── OpenAI ────────────────────────────────────────────────────────────────
    if LLM_PROVIDER == "openai":
        client = OpenAI(api_key=OPENAI_API_KEY)

        kwargs = dict(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        resp = client.chat.completions.create(**kwargs)
        response_text = resp.choices[0].message.content

    # ── Ollama ────────────────────────────────────────────────────────────────
    else:
        payload = {
            "model":  OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        }
        if json_mode:
            payload["format"] = "json"

        resp = requests.post(OLLAMA_URL, json=payload, timeout=120)
        resp.raise_for_status()
        response_text = resp.json().get("response", "")

    # ── Token recording ────────────────────────────────────────────
    if db and user_id:
        try:
            from app.api.v1.token.service import record_token_usage
            record_token_usage(
                db=db,
                user_id=user_id,
                prompt=prompt,
                response=response_text,
                source=source,
            )
        except Exception as e:
            print(f"[TOKEN] Recording failed (non-fatal): {e}")

    return response_text