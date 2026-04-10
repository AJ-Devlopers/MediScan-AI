from .pdf_extractor import extract_text
from .groq_service import analyze_medical_report
from .comparator import compare_values
from .suggestion_service import generate_suggestions
from .categorizer_ai import categorize_test
from .patient_extractor import extract_patient_details


def run_module1_pipeline(file_path):

    # 🧾 Extract text
    text = extract_text(file_path)

    # 🧠 Patient details
    patient = extract_patient_details(text)

    # 🤖 Extract report data
    extracted_data = analyze_medical_report(text)

    # 🔥 FIX 1: REMOVE DUPLICATES (ADD HERE)
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

    # 📊 HEALTH SCORE + COUNTS (IMPROVED 🔥)
    high = low = normal = 0

    for item in compared:
        status = item.get("status", "").upper()

        if status == "HIGH":
            high += 1
        elif status == "LOW":
            low += 1
        elif status == "NORMAL":
            normal += 1

    total = high + low + normal if (high + low + normal) else 1

    # 🔥 NEW SMART SCORE (instead of normal/total)
    score = 100
    score -= high * 5
    score -= low * 2

    score = max(0, min(100, score))

    summary = {
        "high": high,
        "low": low,
        "normal": normal,
        "score": score
    }

    # 💡 Suggestions (REMOVE DUPLICATES)
    suggestions = list(set(generate_suggestions(compared)))

    return {
        "patient": patient,
        "summary": summary,
        "data": compared,
        "suggestions": suggestions
    }