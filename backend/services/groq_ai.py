import requests
import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def ask_groq(user_message):
    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-70b-versatile",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a coaching institute assistant. "
                    "Give short, clear, fast answers. No long explanations."
                )
            },
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.2,   # 🔥 faster + more stable
        "max_tokens": 200     # 🔥 LIMIT RESPONSE SIZE = FASTER
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)

        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]

        return "AI service error. Try again later."

    except requests.exceptions.Timeout:
        return "⚠ AI timeout. Please try again."