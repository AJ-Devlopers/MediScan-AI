from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.core.store import report_store
from app.modules.module3_agents.agent_graph import run_full_analysis
from app.modules.module3_agents.question_engine import generate_dynamic_questions
from app.modules.module3_agents.comparator_agent import analyze_values

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


# ─────────────────────────────────────────────
# 📥 REQUEST MODEL (USER INPUT)
# ─────────────────────────────────────────────
class PatientInput(BaseModel):
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None

    symptoms: Optional[str] = ""
    duration: Optional[str] = ""

    chronic: Optional[str] = "no"
    chronic_type: Optional[str] = ""

    # ⚠️ safer default
    previous_answers: Optional[Dict[str, Any]] = None


# ─────────────────────────────────────────────
# 🌐 GET — LOAD MODULE-3 PAGE
# ─────────────────────────────────────────────
@router.get("/")
def module3_page(request: Request):
    session_id = request.session.get("session_id")
    report = report_store.get(session_id)

    # ❌ No report
    if not report:
        return templates.TemplateResponse(
            request=request,
            name="module3.html",
            context={
                "request": request,
                "error": "No report found. Please upload a report first.",
                "has_report": False
            }
        )

    # 🧠 STEP 1: Comparator
    analysis = analyze_values(report.get("data", []))

    # 🧠 STEP 2: Hybrid Questions (initial)
    dynamic = generate_dynamic_questions(
        report.get("data", []),
        analysis,
        previous_answers=None
    )

    # ✅ FIXED TemplateResponse
    return templates.TemplateResponse(
        request=request,
        name="module3.html",
        context={
            "request": request,

            "patient": report.get("patient", {}),
            "summary": report.get("summary", {}),
            "report_data": report.get("data", []),

            "dynamic_questions": dynamic.get("questions", []),
            "dynamic_symptoms": dynamic.get("symptoms", []),

            "analysis": analysis,
            "has_report": True
        }
    )


# ─────────────────────────────────────────────
# 🤖 POST — RUN AI AGENTS
# ─────────────────────────────────────────────
@router.post("/analyze")
async def analyze(request: Request, body: PatientInput):
    session_id = request.session.get("session_id")
    report = report_store.get(session_id)

    if not report:
        return JSONResponse(
            {"error": "No report found"},
            status_code=400
        )

    try:
        # 🧠 MAIN AI PIPELINE
        result = run_full_analysis(
            report_data=report.get("data", []),
            summary=report.get("summary", {}),
            patient=report.get("patient", {}),
            extra=body.dict()
        )

        # 🧠 ADAPTIVE QUESTIONS (STEP 5)
        analysis = analyze_values(report.get("data", []))

        next_dynamic = generate_dynamic_questions(
            report.get("data", []),
            analysis,
            previous_answers=body.dict()
        )

        return JSONResponse({
            "result": result,
            "next_questions": next_dynamic.get("questions", []),
            "next_symptoms": next_dynamic.get("symptoms", [])
        })

    except Exception as e:
        return JSONResponse(
            {"error": str(e)},
            status_code=500
        )