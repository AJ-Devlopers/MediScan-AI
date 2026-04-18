import json
import os
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

cache = {}

CATEGORY_IMPORTANCE = {
    "cardiac": 1.3,
    "kidney": 1.3,
    "liver": 1.2,
    "infection": 1.2,
    "metabolic": 1.1,
    "blood": 1.0,
    "electrolyte": 1.3,
    "vitamin": 0.7
}


def load_weights():
    try:
        with open("app/data/test_weights.json") as f:
            return json.load(f)
    except:
        return {}


def normalize(name):
    return re.sub(r"\(.*?\)", "", name.lower()).strip()


def get_weight_from_ai(test_name):
    prompt = f"""
Assign importance (1-5) and category for: {test_name}

Return JSON:
{{ "weight": number, "category": "type" }}
"""

    try:
        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        import json
        return json.loads(res.choices[0].message.content)

    except:
        return {"weight": 3, "category": "general"}


def get_test_profile(test_name):
    name = normalize(test_name)

    if name in cache:
        return cache[name]

    weights = load_weights()

    # ✅ exact match
    if name in weights:
        cache[name] = weights[name]
        return weights[name]

    # ✅ keyword match
    for key in weights:
        if key in name or name in key:
            cache[name] = weights[key]
            return weights[key]

    # 🤖 AI fallback
    ai_result = get_weight_from_ai(name)

    cache[name] = ai_result
    return ai_result