from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import shutil

from app.modules.module1_extractor.pipeline import run_module1_pipeline

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")


@router.get("/", response_class=HTMLResponse)
def home(request: Request):

    # 🔥 READ SESSION DATA
    report_summary = request.session.get("report_summary")
    patient = request.session.get("patient")

    return templates.TemplateResponse(
        request=request,
        name="module1.html",
        context={
            "request": request,
            "report_summary": report_summary,
            "patient": patient
        }
    )
@router.post("/upload", response_class=HTMLResponse)
async def upload_file(request: Request, file: UploadFile = File(...)):
    
    contents = await file.read()

    # 🔥 STEP 1: CLEAR OLD SESSION
    request.session.clear()

    # 🔥 STEP 2: RUN PIPELINE
    result = run_module1_pipeline(contents)

    # 🔥 STEP 3: STORE ONLY SMALL DATA (IMPORTANT)
    request.session["report_summary"] = result.get("summary")
    request.session["patient"] = result.get("patient")

    # ❌ DO NOT STORE FULL RESULT (causes reset bug)
    # request.session["report_data"] = result   ← REMOVE if exists

    return templates.TemplateResponse(
        request=request,
        name="module1.html",
        context={"result": result}
    )