from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.routers import module1, module2, module3   # 🔥 ADD module3
from app.modules.module2_rag.knowledge_loader import load_knowledge_base

import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="MediScan AI")

# 🔐 Secret key (safe fallback)
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

# 🧠 Session Middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    max_age=7200,
    same_site="lax",
    https_only=False,
    session_cookie="mediscan_session",
)

# 🚀 Load knowledge base on startup
@app.on_event("startup")
def startup_event():
    load_knowledge_base()

# 🔗 Routers
app.include_router(module1.router)
app.include_router(module2.router, prefix="/module2")

# 🔥 ADD THIS (Module-3)
app.include_router(module3.router, prefix="/module3")

# 📁 Static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")