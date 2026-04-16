from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from starlette.middleware.sessions import SessionMiddleware  # ✅ ADD THIS

from app.routers import module1, module2
from app.modules.module2_rag.knowledge_loader import load_knowledge_base

import os
from dotenv import load_dotenv


# ✅ Load env variables
load_dotenv()

app = FastAPI(title="MediScan AI")


# 🔐 Secret key (safe fallback)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")


# ✅ Session middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY
)


# ✅ Load knowledge base at startup (BEST PRACTICE)
@app.on_event("startup")
def startup_event():
    load_knowledge_base()


# ✅ Routers
app.include_router(module1.router)
app.include_router(module2.router, prefix="/module2")


# ✅ Static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# ✅ Templates
templates = Jinja2Templates(directory="app/templates")