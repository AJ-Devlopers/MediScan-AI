# app/modules/module1_extractor/categorizer_ai.py

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# 🧠 RULE-BASED FIRST (FAST)
def rule_based_category(name):
    name = name.lower()

    if any(k in name for k in ["alt", "ast", "bilirubin", "alp", "ggt", "sgpt", "sgot", "protein", "albumin", "globulin"]):
        return {"category": "Biochemistry", "subcategory": "Liver Function"}

    elif any(k in name for k in ["creatinine", "urea", "bun", "gfr", "uric acid"]):
        return {"category": "Biochemistry", "subcategory": "Kidney Function"}

    elif any(k in name for k in ["sodium", "potassium", "chloride", "calcium", "phosphorus"]):
        return {"category": "Biochemistry", "subcategory": "Electrolytes"}

    elif any(k in name for k in ["glucose", "hba1c"]):
        return {"category": "Biochemistry", "subcategory": "Diabetes"}

    elif any(k in name for k in ["cholesterol", "hdl", "ldl", "vldl", "triglyceride"]):
        return {"category": "Biochemistry", "subcategory": "Lipid Profile"}

    elif any(k in name for k in ["hemoglobin", "rbc", "hematocrit", "mcv", "mch", "mchc", "rdw"]):
        return {"category": "Hematology", "subcategory": "RBC"}

    elif any(k in name for k in ["leucocyte", "wbc", "neutrophil", "lymphocyte", "monocyte", "eosinophil", "basophil"]):
        return {"category": "Hematology", "subcategory": "WBC"}

    elif any(k in name for k in ["platelet", "mpv"]):
        return {"category": "Hematology", "subcategory": "Platelets"}

    elif any(k in name for k in ["tsh", "t3", "t4", "thyroid"]):
        return {"category": "Endocrinology", "subcategory": "Thyroid"}

    elif "esr" in name:
        return {"category": "Hematology", "subcategory": "Inflammation"}

    return None


# 🤖 AI FALLBACK
def ai_category(test_name):
    prompt = f"""
Categorize this medical test into category and subcategory.

Test: {test_name}

Return ONLY JSON:
{{
  "category": "...",
  "subcategory": "..."
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        content = response.choices[0].message.content

        import re, json
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            return json.loads(match.group())

    except:
        pass

    return {"category": "Other", "subcategory": "General"}


# 🔥 FINAL HYBRID FUNCTION
def categorize_test(test_name):
    # 1️⃣ Rule-based (fast)
    rule_result = rule_based_category(test_name)

    if rule_result:
        return rule_result

    # 2️⃣ AI fallback
    return ai_category(test_name)