def analyze_values(report_data):
    """
    Advanced comparator:
    - Detects patterns (kidney, liver, diabetes, heart)
    - Calculates severity
    - Flags critical conditions
    """

    analysis = {
        "patterns": [],
        "severity": {},
        "critical": [],
        "abnormal_count": 0,
        "summary": ""
    }

    high_params = []
    low_params = []

    for item in report_data:
        name = item.get("name", "").lower()
        value = item.get("value")
        status = item.get("status", "")
        normal_range = item.get("normal_range", {})

        low = normal_range.get("low")
        high = normal_range.get("high")

        # 📊 Track abnormal
        if status in ["HIGH", "LOW"]:
            analysis["abnormal_count"] += 1

        # 🔴 HIGH
        if status == "HIGH":
            high_params.append(name)

            if high and value:
                diff = (value - high) / high

                if diff < 0.2:
                    level = "mild"
                elif diff < 0.5:
                    level = "moderate"
                else:
                    level = "severe"

                analysis["severity"][name] = level

                if diff > 1:
                    analysis["critical"].append(f"{name} is critically high")

        # 🔵 LOW
        elif status == "LOW":
            low_params.append(name)

            if low and value:
                diff = (low - value) / low

                if diff < 0.2:
                    level = "mild"
                elif diff < 0.5:
                    level = "moderate"
                else:
                    level = "severe"

                analysis["severity"][name] = level

                if diff > 1:
                    analysis["critical"].append(f"{name} is critically low")

    # 🧠 PATTERN DETECTION

    # Kidney
    if any(x in high_params for x in ["creatinine", "urea"]):
        analysis["patterns"].append("Possible kidney dysfunction")

    # Liver
    if any(x in high_params for x in ["bilirubin", "alt", "ast"]):
        analysis["patterns"].append("Possible liver issue")

    # Diabetes
    if any(x in high_params for x in ["glucose", "hba1c"]):
        analysis["patterns"].append("Possible diabetes risk")

    # Heart
    if any(x in high_params for x in ["cholesterol", "ldl", "triglycerides"]):
        analysis["patterns"].append("Possible cardiovascular risk")

    # 🧠 SUMMARY
    abnormal = analysis["abnormal_count"]

    if abnormal == 0:
        analysis["summary"] = "All parameters are within normal range"
    elif abnormal <= 2:
        analysis["summary"] = "Minor abnormalities detected"
    elif abnormal <= 5:
        analysis["summary"] = "Moderate abnormalities detected"
    else:
        analysis["summary"] = "Multiple abnormalities detected — attention needed"

    return analysis