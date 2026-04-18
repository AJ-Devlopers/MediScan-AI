def generate_suggestions(data):
    suggestions = []

    for item in data:
        name = item.get("name", "")
        status = item.get("status", "").upper()
        value = item.get("value")

        range_data = item.get("normal_range", {})
        low = range_data.get("low")
        high = range_data.get("high")
        unit = range_data.get("unit")

        if status == "HIGH":
            suggestions.append(
                f"{name} is high ({value} {unit}). Consider lifestyle changes and consult a doctor."
            )

        elif status == "LOW":
            suggestions.append(
                f"{name} is low ({value} {unit}). Improve nutrition and consider medical advice."
            )

    # 🔥 REMOVE DUPLICATES
    return list(set(suggestions))