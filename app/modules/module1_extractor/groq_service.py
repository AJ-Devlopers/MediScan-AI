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
    "unit": "<unit exactly as written>"
  }}
]


Rules:
- Extract EVERY test parameter
- Value must be numeric only (no text like 'mg/dL' inside value)
- Unit must be EXACT (e.g., mg/dL, g/dL, U/L, %, mmol/L)
- If unit is missing, return null
- Do NOT guess units
- Do NOT include reference ranges
- Do NOT include text explanations
- Output ONLY JSON (no extra text)

Examples:
"Glucose 90 mg/dL" → value: 90, unit: "mg/dL"
"HbA1c 5.6%" → value: 5.6, unit: "%

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