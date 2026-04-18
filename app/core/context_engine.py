def get_context_multiplier(item, all_data):
    name = item.get("name", "").lower()
    status = item.get("status", "").upper()

    multiplier = 1.0

    abnormal = [
        d["name"].lower()
        for d in all_data
        if d.get("status") in ["HIGH", "LOW"]
    ]

    # 🔴 Liver cluster
    if "bilirubin" in name:
        if any(x in abnormal for x in ["alt", "ast"]):
            multiplier += 0.4

    if "alt" in name or "ast" in name:
        if "bilirubin" in abnormal:
            multiplier += 0.3

    # 🔴 Kidney
    if "creatinine" in name and "urea" in abnormal:
        multiplier += 0.4

    # 🔴 Cardiac
    if "ldl" in name and "cholesterol" in abnormal:
        multiplier += 0.3

    # 🔴 Critical electrolytes
    if name in ["potassium", "sodium"] and status in ["HIGH", "LOW"]:
        multiplier += 0.5

    # 🟡 Low impact vitamins
    if "vitamin" in name:
        multiplier *= 0.7

    return multiplier