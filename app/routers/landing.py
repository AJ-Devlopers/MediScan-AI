# app/routers/landing.py
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


@router.get("/", response_class=HTMLResponse)
def landing_page(request: Request):
    """
    Public landing page — no session required.
    Gives an overview of all three modules and
    hosts the floating quick-chat popup.
    """
    return templates.TemplateResponse(
        request=request,
        name="landing.html",
        context={"request": request}
    )