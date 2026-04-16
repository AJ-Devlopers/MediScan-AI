from fastapi import APIRouter, Request, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict
from app.modules.module2_rag.rag_pipeline import generate_answer

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")


# ── Request Model ──────────────────────────────────────────
class AskRequest(BaseModel):
    question: str
    history: List[Dict[str, str]] = []   # ✅ receives chat history


# ── GET — Render Page ──────────────────────────────────────
@router.get("/")
def module2_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="module2.html",
        context={"request": request}
    )


# ── POST — Answer Question with History ───────────────────
@router.post("/ask")
async def ask_question(body: AskRequest):
    answer = generate_answer(
        question=body.question,
        chat_history=body.history    # ✅ passes history to LLM
    )
    return JSONResponse(content={"answer": answer})