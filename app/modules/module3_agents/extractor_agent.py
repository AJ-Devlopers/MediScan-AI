def extract_insights(report_data):
    insights = []

    for item in report_data:
        name = item.get("name", "")
        status = item.get("status", "")

        if status == "HIGH":
            insights.append(f"{name} is elevated")
        elif status == "LOW":
            insights.append(f"{name} is low")

    return insights