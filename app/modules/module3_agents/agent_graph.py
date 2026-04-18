from .extractor_agent import extract_insights
from .comparator_agent import analyze_values
from .suggestion_agent import generate_suggestions
from .warning_agent import generate_warnings

def run_full_analysis(report_data, summary, patient, extra):

    # 🧠 Step 1: Extract insights
    insights = extract_insights(report_data)

    # ⚖️ Step 2: Compare values
    analysis = analyze_values(report_data)

    # 🧑‍⚕️ Step 3: Combine user input
    context = {
        "symptoms": extra.get("symptoms", ""),
        "duration": extra.get("duration", ""),
        "chronic": extra.get("chronic", ""),
        "chronic_type": extra.get("chronic_type", ""),
        "age": extra.get("age"),
        "weight": extra.get("weight"),
        "height": extra.get("height")
    }

    # 💊 Step 4: Suggestions
    suggestions = generate_suggestions(
        report_data, summary, context
    )

    # 🚨 Step 5: Warnings / Risk
    warnings = generate_warnings(
        report_data, summary, context
    )

    return {
        "insights": insights,
        "analysis": analysis,
        "suggestions": suggestions,
        "warnings": warnings
    }