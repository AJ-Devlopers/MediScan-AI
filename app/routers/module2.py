from fastapi import APIRouter, Request, Form
from fastapi.templating import Jinja2Templates
from app.modules.module2_rag.rag_pipeline import generate_answer

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")


# ✅ FIX HERE
@router.get("/")
def module2_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="module2.html",
        context={"request": request}
    )


@router.post("/ask")
async def ask_question(question: str = Form(...)):
    answer = generate_answer(question)
    return {"answer": answer}