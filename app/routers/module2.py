from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict
import random

from app.modules.module2_rag.rag_pipeline import generate_answer

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


class AskRequest(BaseModel):
    question: str
    history: List[Dict[str, str]] = []


# 🔥 NEW: Dynamic Question Generator
def generate_smart_questions(report_result):
    if not report_result:
        return [
            "Explain my report",
            "Is my health score good?",
            "What should I improve?",
            "Give me a summary"
        ]

    data = report_result.get("data", [])
    summary = report_result.get("summary", {})

    high_tests = [d["name"] for d in data if d.get("status") == "HIGH"]
    low_tests  = [d["name"] for d in data if d.get("status") == "LOW"]

    questions = []

    # 🎯 Abnormal-based questions
    for test in high_tests[:2]:
        questions.append(f"Why is my {test} high?")

    for test in low_tests[:2]:
        questions.append(f"Why is my {test} low?")

    # 🧠 General intelligent questions
    questions += [
        "Is my health score concerning?",
        "What lifestyle changes should I make?",
        "What follow-up tests do I need?",
        "Explain my report in simple terms"
    ]

    random.shuffle(questions)

    return questions[:4]   # limit to 4


# ── GET ─────────────────────────────────────────
@router.get("/")
def module2_page(request: Request):
    from app.core.store import report_store

    session_id = request.session.get("session_id")
    report_result = report_store.get(session_id) if session_id else None

    patient = report_result.get("patient", {}) if report_result else {}
    summary = report_result.get("summary", {}) if report_result else {}
    data    = report_result.get("data", [])    if report_result else []

    # 🔥 NEW: Generate smart questions
    questions = generate_smart_questions(report_result)

    return templates.TemplateResponse(
        request=request,
        name="module2.html",
        context={
            "request": request,
            "patient": patient,
            "summary": summary,
            "report_data": data,
            "has_report": report_result is not None,
            "questions": questions   # ✅ PASS TO FRONTEND
        }
    )


# ── POST ────────────────────────────────────────
@router.post("/ask")
async def ask_question(request: Request, body: AskRequest):
    from app.core.store import report_store

    session_id = request.session.get("session_id")
    report_result = report_store.get(session_id) if session_id else None

    system_prefix = ""

    if report_result:
        patient = report_result.get("patient", {})
        summary = report_result.get("summary", {})
        data    = report_result.get("data", [])

        abnormal = [
            f"{d['name']}: {d.get('value','')} {d.get('unit','')} "
            f"(Normal: {d.get('normal_range','')}) — {d.get('status','')}"
            for d in data if d.get("status", "").upper() in ("HIGH", "LOW")
        ]

        abnormal_text = "\n".join(abnormal) if abnormal else "None"

        system_prefix = f"""
The user has uploaded a medical report.

Patient: {patient.get('name','Unknown')}, Age: {patient.get('age','?')}, Gender: {patient.get('gender','?')}
Health Score: {summary.get('score','?')}/100
High: {summary.get('high',0)} | Low: {summary.get('low',0)} | Normal: {summary.get('normal',0)}

Abnormal Results:
{abnormal_text}

Use this data to answer questions accurately.
"""

    answer = generate_answer(
        question=body.question,
        chat_history=body.history,
        system_prefix=system_prefix
    )

    return JSONResponse(content={"answer": answer})