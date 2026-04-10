from groq import Groq
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def safe_json_parse(text):
    try:
        return json.loads(text)
    except:
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except:
                return []
    return []


def analyze_medical_report(text):
    prompt = f"""
You are a medical data extraction AI.

Extract ALL medical test parameters from the report.

Return STRICT JSON array only.

Format:
[
  {{
    "name": "<test name>",
    "value": <number>,
    "unit": "<unit>"
  }}
]

Rules:
- Extract ALL tests
- Only numeric values
- No explanation
- Output only JSON

Report:
{text}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    content = response.choices[0].message.content.strip()

    return safe_json_parse(content)