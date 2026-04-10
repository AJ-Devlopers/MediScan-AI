from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routers import module1
from fastapi.templating import Jinja2Templates

app = FastAPI(title="MediScan AI")

app.include_router(module1.router)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")
