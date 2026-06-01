# ── Stage 1 : Build du frontend React ────────────────────────────────────────
FROM node:20-slim AS frontend

WORKDIR /frontend
COPY notebooks/edsc-fecondite/package*.json ./
RUN npm ci --silent
COPY notebooks/edsc-fecondite/ ./

# URLs relatives → même domaine que le backend en production
ENV VITE_API_URL=""
RUN npm run build


# ── Stage 2 : Backend Python + fichiers statiques ────────────────────────────
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python (sans pyreadstat ni outils de test)
COPY backend/requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Code backend + modèle ML
COPY backend/ ./backend/

# Build React → backend/static/ (lu par main.py : STATIC_DIR = parent.parent / "static")
COPY --from=frontend /frontend/dist ./backend/static/

WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
