from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import shutil

from app.modules.module1_extractor.pipeline import run_module1_pipeline

router = APIRouter()

templates = Jinja2Templates(directory="app/templates")


# ✅ THIS IS WHERE YOUR CODE GOES
@router.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="module1.html"
    )


@router.post("/upload", response_class=HTMLResponse)
async def upload_file(request: Request, file: UploadFile = File(...)):
    contents = await file.read()   # read file in memory

    result = run_module1_pipeline(contents)

    return templates.TemplateResponse(
        request=request,
        name="module1.html",
        context={"result": result}
    )