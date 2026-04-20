from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from app.modules.module1_extractor.pipeline import run_module1_pipeline
import uuid

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


# ─────────────────────────────────────────────
# 🧾 MODULE 1 HOME → /m1
# ─────────────────────────────────────────────
@router.get("/m1", response_class=HTMLResponse)
def module1_home(request: Request):
    """
    Module 1 main page.
    Shows upload UI OR results based on session.
    """
    from app.core.store import report_store

    session_id = request.session.get("session_id")
    result = report_store.get(session_id) if session_id else None

    return templates.TemplateResponse(
        request=request,
        name="module1.html",
        context={
            "request": request,
            "result": result   # None = show upload zone, dict = show results
        }
    )


# ─────────────────────────────────────────────
# 📤 FILE UPLOAD → /m1/upload
# ─────────────────────────────────────────────
@router.post("/m1/upload", response_class=HTMLResponse)
async def upload_file(request: Request, file: UploadFile = File(...)):
    """
    Handles PDF upload → runs extraction pipeline → stores result in session.
    """
    from app.core.store import report_store

    contents = await file.read()

    # 🧹 Clear old session data
    old_id = request.session.get("session_id")
    if old_id and old_id in report_store:
        del report_store[old_id]

    # 🚀 Run extraction pipeline
    result = run_module1_pipeline(contents)

    # 🆔 Create new session ID
    session_id = str(uuid.uuid4())

    # 📦 Store processed result
    report_store[session_id] = {
        "patient":     result.get("patient", {}),
        "summary":     result.get("summary", {}),
        "data":        result.get("data", []),
        "suggestions": result.get("suggestions", [])
    }

    # 🔐 Store only session ID in cookie
    request.session.clear()
    request.session["session_id"] = session_id

    return templates.TemplateResponse(
        request=request,
        name="module1.html",
        context={
            "request": request,
            "result": report_store[session_id]
        }
    )


# ─────────────────────────────────────────────
# 🔄 CLEAR SESSION → /m1/clear-session
# ─────────────────────────────────────────────
@router.post("/m1/clear-session")
async def clear_session(request: Request):
    """
    Clears stored report + session.
    """
    from app.core.store import report_store

    session_id = request.session.get("session_id")

    if session_id and session_id in report_store:
        del report_store[session_id]

    request.session.clear()

    # 🔁 Redirect back to module1 page
    return RedirectResponse(url="/m1", status_code=303)