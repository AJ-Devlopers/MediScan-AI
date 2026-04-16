from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.routers import module1, module2   # ✅ ADD THIS
from app.modules.module2_rag.knowledge_loader import load_knowledge_base

load_knowledge_base()

app = FastAPI(title="MediScan AI")

# ✅ Register both modules
app.include_router(module1.router)
app.include_router(module2.router, prefix="/module2")  # 🔥 IMPORTANT

app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")