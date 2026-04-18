from app.modules.module1_extractor.pipeline import run_module1_pipeline
from app.modules.module2_rag.auto_insights import generate_auto_insights


def run_full_pipeline(file_bytes, file_name="report.pdf"):

    # 🔹 Module 1
    module1_output = run_module1_pipeline(file_bytes, file_name)

    # 🔹 Module 2 (AUTO INSIGHTS)
    auto_insights = generate_auto_insights(module1_output["data"])

    return {
        "patient": module1_output["patient"],
        "summary": module1_output["summary"],
        "data": module1_output["data"],
        "suggestions": module1_output["suggestions"],
        "auto_insights": auto_insights
    }