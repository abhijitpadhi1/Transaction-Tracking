# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Import routers from the local package (use relative import so backend can be used as a package)
from .routers import auth, transactions, categories, settings, analytics

app = FastAPI(title="Transaction Tracker API")

# ======================
#   CORS CONFIGURATION
# ======================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================
#   ROUTE REGISTRATION
# ======================
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
app.include_router(settings.router, prefix="/settings", tags=["settings"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])

# ======================
#   HEALTH CHECK
# ======================
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# ======================
#   SERVE FRONTEND FILES
# ======================
# Serve the frontend directory reliably by resolving the path relative to this file
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
