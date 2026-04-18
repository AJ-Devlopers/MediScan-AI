from app.modules.module2_rag.rag_pipeline import generate_answer

# ─────────────────────────────────────────────
# STATIC QUESTIONS
# ─────────────────────────────────────────────
STATIC_QUESTIONS = [
    "What is your age?",
    "What is your height and weight?",
    "Do you have any chronic diseases (BP, diabetes, thyroid)?",
    "Are you experiencing any symptoms?"
]


# ─────────────────────────────────────────────
# HYBRID QUESTION ENGINE
# ─────────────────────────────────────────────
def generate_dynamic_questions(report_data, analysis=None, previous_answers=None):

    questions = set(STATIC_QUESTIONS)
    symptoms = set()

    # ───────── RULE-BASED LAYER ─────────
    for item in report_data:
        name = item.get("name", "").lower()

        if "creatinine" in name:
            questions.add("Do you have any history of kidney issues?")
            symptoms.update(["Swelling", "Fatigue"])

        if "glucose" in name:
            questions.add("Do you have diabetes or high sugar levels?")
            symptoms.update(["Frequent urination", "Thirst"])

    # ───────── AI LAYER (ADAPTIVE) ─────────
    try:
        context = f"""
You are a medical assistant.

Patient Report:
{report_data}

Analysis:
{analysis}

Previous Answers:
{previous_answers}

Generate 3-5 NEW follow-up questions that:
- Are NOT already asked
- Are based on report + answers
- Help understand patient's condition better

Return ONLY JSON:
{{ "questions": ["...", "..."] }}
"""

        ai_response = generate_answer(
            question=context,
            chat_history=[]
        )

        # ⚠️ simple parsing (safe fallback)
        import json
        parsed = json.loads(ai_response)

        for q in parsed.get("questions", []):
            questions.add(q)

    except Exception:
        pass  # fail silently → system still works

    return {
        "questions": list(questions),
        "symptoms": list(symptoms)
    }