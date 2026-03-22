import re

def clean_jd(text: str) -> str:
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^a-z0-9+.# ]', ' ', text)
    return text.strip()
