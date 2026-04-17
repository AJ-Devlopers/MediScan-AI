from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from app.modules.module1_extractor.pipeline import run_module1_pipeline
import uuid

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/", response_class=HTMLResponse)
def home(request: Request):
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


@router.post("/upload", response_class=HTMLResponse)
async def upload_file(request: Request, file: UploadFile = File(...)):
    from app.core.store import report_store


    contents = await file.read()

    # ✅ Clear old session data from store
    old_id = request.session.get("session_id")
    if old_id and old_id in report_store:
        del report_store[old_id]

    # ✅ Run pipeline
    result = run_module1_pipeline(contents)

    # ✅ Generate a new session ID and store full result server-side
    session_id = str(uuid.uuid4())
    report_store[session_id] = {
        "patient":     result.get("patient", {}),
        "summary":     result.get("summary", {}),
        "data":        result.get("data", []),
        "suggestions": result.get("suggestions", [])
    }

    # ✅ Only store the tiny session_id in the cookie (never the full result)
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


@router.post("/clear-session", response_class=HTMLResponse)
async def clear_session(request: Request):
    from app.core.store import report_store


    session_id = request.session.get("session_id")
    if session_id and session_id in report_store:
        del report_store[session_id]

    request.session.clear()
    return RedirectResponse(url="/", status_code=303)