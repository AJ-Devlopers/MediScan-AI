def generate_suggestions(report_data, summary, context):

    advice = []
    diet = []
    followups = []

    symptoms = context.get("symptoms", "").lower()

    for item in report_data:
        if item.get("status") == "HIGH":
            followups.append(f"Repeat {item['name']} test")

    # 🥗 Diet
    if "glucose" in str(report_data).lower():
        diet.append("Reduce sugar intake")

    if "cholesterol" in str(report_data).lower():
        diet.append("Avoid oily food")

    # 💊 Lifestyle
    advice.append("Exercise regularly")
    advice.append("Maintain proper sleep")

    if symptoms:
        advice.append(f"Monitor symptoms: {symptoms}")

    return {
        "diet": list(set(diet)),
        "lifestyle": list(set(advice)),
        "followups": list(set(followups))[:5]
    }