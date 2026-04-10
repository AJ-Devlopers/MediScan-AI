def generate_suggestions(data):
    suggestions = []

    for item in data:
        name = item.get("name", "")
        status = item.get("status", "").upper()

        if status == "HIGH":
            suggestions.append(f"{name} is high. Consider lifestyle changes.")
        elif status == "LOW":
            suggestions.append(f"{name} is low. Improve nutrition.")

    # 🔥 REMOVE DUPLICATES
    suggestions = list(set(suggestions))

    return suggestions