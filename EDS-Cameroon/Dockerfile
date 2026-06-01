FROM python:3.12-slim

WORKDIR /app

# Dépendances système pour scikit-learn / numpy
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Installer uniquement les dépendances de production
COPY backend/requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Copier le code backend + modèle ML
COPY backend/ ./backend/

WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
