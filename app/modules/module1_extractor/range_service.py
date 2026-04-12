import json
import os
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# 🔥 CACHE
cache = {}


# 📂 Load local ranges
def load_local_ranges():
    try:
        with open("app/data/normal_ranges.json") as f:
            return json.load(f)
    except:
        return {}


# 🔧 Normalize test name
def normalize_name(name):
    name = name.lower()

    # remove brackets
    name = re.sub(r"\(.*?\)", "", name)

    # remove common words
    words_to_remove = [
        "serum", "blood", "total", "level", "count",
        "ultrasensitive", "calculated", "test"
    ]

    for w in words_to_remove:
        name = name.replace(w, "")

    return name.strip()


# 🔥 Helper function (NEW)
def extract_range(data):
    # list / tuple case
    if isinstance(data, (list, tuple)):
        low = data[0] if len(data) > 0 else None
        high = data[1] if len(data) > 1 else None
        unit = data[2] if len(data) > 2 else None
        return {"low": low, "high": high, "unit": unit}

    # dict case
    if isinstance(data, dict):
        return {
            "low": data.get("low"),
            "high": data.get("high"),
            "unit": data.get("unit")
        }

    # fallback
    return {"low": None, "high": None, "unit": None}


# 🤖 AI fallback
def get_range_from_ai(test_name):
    prompt = f"""
Give normal range for {test_name} in adults.

Return ONLY JSON:
{{
  "low": number,
  "high": number
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        content = response.choices[0].message.content.strip()

        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            data = json.loads(match.group())

            # ensure unit exists
            data["unit"] = None
            return data

    except:
        pass

    return {"low": None, "high": None, "unit": None}


# 🧠 HYBRID FUNCTION
def get_normal_range(test_name):
    normalized = normalize_name(test_name)

    # ✅ CACHE
    if normalized in cache:
        return cache[normalized]

    ranges = load_local_ranges()

    # 🔥 1. EXACT MATCH
    if normalized in ranges:
        result = extract_range(ranges[normalized])
        cache[normalized] = result
        return result

    # 🔥 2. KEYWORD MATCH
    for key in ranges:
        if key in normalized or normalized in key:
            result = extract_range(ranges[key])
            cache[normalized] = result
            return result

    # 🔥 3. TOKEN MATCH
    words = normalized.split()

    for key in ranges:
        for w in words:
            if w in key:
                result = extract_range(ranges[key])
                cache[normalized] = result
                return result

    # 🤖 4. AI FALLBACK
    ai_result = get_range_from_ai(normalized)

    cache[normalized] = ai_result

    return ai_result