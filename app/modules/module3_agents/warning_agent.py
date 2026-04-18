def generate_warnings(report_data, summary, context):

    score = summary.get("score", 100)
    high = summary.get("high", 0)

    symptoms = context.get("symptoms", "")
    duration = context.get("duration", "")

    warnings = []

    # 🚨 Risk logic
    if score < 40 or high > 5:
        warnings.append("High risk — consult doctor")

    if symptoms and duration in ["months", "long_term"]:
        warnings.append("Long-term symptoms detected")

    if context.get("chronic") == "yes":
        warnings.append("Chronic condition requires monitoring")

    return warnings