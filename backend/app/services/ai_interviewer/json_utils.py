import json
import re


def load_json_response(raw: str, fallback: dict) -> dict:
    if not raw:
        return fallback

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    try:
        cleaned = re.sub(r"```(?:json)?", "", raw).strip()
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return fallback
