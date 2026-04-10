# app/modules/module1_extractor/patient_extractor.py

import os
import re
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def extract_patient_details(text):
    prompt = f"""
Extract patient details from the following medical report.

Return ONLY JSON in this format:
{{
  "name": "",
  "age": "",
  "gender": "",
  "doctor": "",
  "lab": "",
  "date": ""
}}

Text:
{text[:3000]}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        content = response.choices[0].message.content

        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            return json.loads(match.group())

    except Exception as e:
        print("Patient extraction error:", e)

    # fallback (if AI fails)
    return {
        "name": "Unknown",
        "age": "Unknown",
        "gender": "Unknown",
        "doctor": "Unknown",
        "lab": "Unknown",
        "date": "Unknown"
    }