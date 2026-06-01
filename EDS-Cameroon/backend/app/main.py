from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .core.config import settings
from .database.base import Base
from .database.session import engine
from .models import User, Simulation, PredictionResult, AuditLog  # noqa: F401

# Crée toutes les tables au démarrage
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="API de prédiction du désir d'avoir un autre enfant — EDSC Cameroun 2018",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS pour le développement local (Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes API ────────────────────────────────────────────────────────────────
from .api.routes import auth, users, simulations, prediction  # noqa: E402

app.include_router(auth.router,        prefix="/auth",        tags=["Authentification"])
app.include_router(users.router,       prefix="/users",       tags=["Utilisateurs"])
app.include_router(simulations.router, prefix="/simulations", tags=["Simulations"])
app.include_router(prediction.router,  prefix="/prediction",  tags=["Prédiction ML"])


@app.get("/health", tags=["Santé"])
def health():
    return {"status": "ok"}


# ── Frontend React (production) ───────────────────────────────────────────────
# Vite build → backend/static/ (copié par le Dockerfile)
STATIC_DIR = Path(__file__).parent.parent / "static"

if STATIC_DIR.exists():
    # Fichiers compilés JS/CSS générés par Vite
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    # Catch-all : toute route non-API renvoie index.html (React Router gère la navigation)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        return FileResponse(STATIC_DIR / "index.html")
else:
    # Mode développement — pas de fichiers statiques
    @app.get("/")
    def root():
        return {"app": settings.APP_NAME, "status": "running", "version": "1.0.0"}
