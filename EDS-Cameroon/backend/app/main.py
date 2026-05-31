from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .database.base import Base
from .database.session import engine
from .models import User, Simulation, PredictionResult, AuditLog  # noqa: F401

# Crée toutes les tables au démarrage (en dev ; en prod on utilise Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="API de prédiction du désir d'avoir un autre enfant — EDSC Cameroun 2018",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — localhost en dev + URL Vercel en production
_cors_regex = r"http://localhost:\d+"
if settings.FRONTEND_URL:
    # Ajoute l'URL de production (ex: https://hearth-edsc.vercel.app)
    _escaped = settings.FRONTEND_URL.replace(".", r"\.").replace("https://", r"https://")
    _cors_regex = f"{_cors_regex}|{_escaped}"

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=_cors_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes (importées après la création des tables) ──────────────────────────
from .api.routes import auth, users, simulations, prediction  # noqa: E402

app.include_router(auth.router,        prefix="/auth",        tags=["Authentification"])
app.include_router(users.router,       prefix="/users",       tags=["Utilisateurs"])
app.include_router(simulations.router, prefix="/simulations", tags=["Simulations"])
app.include_router(prediction.router,  prefix="/prediction",  tags=["Prédiction ML"])


@app.get("/", tags=["Santé"])
def root():
    return {"app": settings.APP_NAME, "status": "running", "version": "1.0.0"}


@app.get("/health", tags=["Santé"])
def health():
    return {"status": "ok"}
