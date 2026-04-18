from .pdf_extractor import extract_text
from .groq_service import analyze_medical_report
from .comparator import compare_values
from .suggestion_service import generate_suggestions
from .categorizer_ai import categorize_test
from .patient_extractor import extract_patient_details

# 🔥 NEW IMPORTS
from app.core.weight_service import get_test_profile, CATEGORY_IMPORTANCE
from app.core.context_engine import get_context_multiplier


# 🔥 NEW FUNCTION: CONTEXT-AWARE HEALTH SCORE
def calculate_health_score(data):
    total_penalty = 0
    max_penalty = 0

    for item in data:
        name = item.get("name", "")

        # 🔥 1. Get hybrid profile (JSON + AI)
        profile = get_test_profile(name)

        base_weight = profile.get("weight", 3)
        category = profile.get("category", "general")

        # 🔥 2. Category importance boost
        category_boost = CATEGORY_IMPORTANCE.get(category, 1.0)

        # 🔥 3. Context multiplier
        context_mult = get_context_multiplier(item, data)

        # 🔥 4. Severity calculation
        value = item.get("value")
        range_data = item.get("normal_range", {})

        low = range_data.get("low")
        high = range_data.get("high")

        severity = 0

        if value is not None and low is not None and high is not None:
            try:
                if value < low:
                    severity = (low - value) / low
                elif value > high:
                    severity = (value - high) / high
            except:
                severity = 0

        severity = min(severity, 1)

        # 🔥 5. Final weight
        final_weight = base_weight * category_boost * context_mult

        # 🔥 6. Penalty
        penalty = final_weight * severity * 10

        total_penalty += penalty
        max_penalty += base_weight * 10

    if max_penalty == 0:
        return 100

    score = 100 - (total_penalty / max_penalty) * 100

    return round(max(0, min(100, score)))


# ───────────────────────────────────────────────

def run_module1_pipeline(file_bytes):

    # 🧾 Extract text
    text = extract_text(file_bytes)

    # 🧠 Patient details
    patient = extract_patient_details(text)

    # 🤖 Extract report data
    extracted_data = analyze_medical_report(text)

    # 🔥 REMOVE DUPLICATES
    unique = {}
    for item in extracted_data:
        name = item.get("name", "").lower().strip()
        if name and name not in unique:
            unique[name] = item

    extracted_data = list(unique.values())

    # ⚖️ Compare values
    compared = compare_values(extracted_data)

    # 🧠 Categorization
    for item in compared:
        category_data = categorize_test(item.get("name", ""))
        item["category"] = category_data.get("category", "Other")
        item["subcategory"] = category_data.get("subcategory", "General")

    # 📊 COUNT STATS
    high = low = normal = 0

    for item in compared:
        status = item.get("status", "").upper()

        if status == "HIGH":
            high += 1
        elif status == "LOW":
            low += 1
        elif status == "NORMAL":
            normal += 1

    # 🔥 NEW HEALTH SCORE (REPLACED)
    score = calculate_health_score(compared)

    summary = {
        "high": high,
        "low": low,
        "normal": normal,
        "score": score
    }

    # 💡 Suggestions
    suggestions = list(set(generate_suggestions(compared)))

    return {
        "patient": patient,
        "summary": summary,
        "data": compared,
        "suggestions": suggestions
    }