from .rag_pipeline import generate_answer


def generate_auto_insights(data):
    insights = []

    for item in data:
        status = str(item.get("status", "")).strip().upper()
        name = item.get("name", "")

        if not name or status not in ["HIGH", "LOW"]:
            continue

        # 🔥 Generate dynamic question
        question = f"What does {status.lower()} {name} mean in a medical report?"

        try:
            explanation = generate_answer(question)
        except Exception:
            explanation = "Unable to generate explanation at the moment."

        insights.append({
            "test": name,
            "status": status,
            "explanation": explanation
        })

    return insights