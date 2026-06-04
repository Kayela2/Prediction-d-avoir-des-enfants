# Hearth — Simulation du désir de fécondité au Cameroun

> Application de simulation démographique basée sur l'Enquête Démographique et de Santé du Cameroun (EDSC-V 2018)

---

## Présentation

**Hearth** est une application web qui permet d'estimer la probabilité qu'une femme camerounaise de 15 à 49 ans désire avoir un enfant supplémentaire. Elle repose sur un modèle de Machine Learning (Régression Logistique) entraîné sur les données officielles de l'EDSC-V 2018 (INS Cameroun, n = 13 527 femmes).

L'utilisateur renseigne son profil en 5 étapes (âge, situation familiale, niveau d'instruction, milieu de résidence, quintile de richesse) et obtient un résultat personnalisé avec les facteurs explicatifs.

---

## Fonctionnalités

- **Simulation guidée** en 5 étapes avec interface moderne
- **Prédiction ML** (Régression Logistique, AUC = 0.80, Accuracy = 93.7 %)
- **10 variables explicatives** : âge, instruction, enfants vivants, contraceptif, statut matrimonial, résidence, richesse, emploi, région septentrionale, religion musulmane
- **Résultats détaillés** avec facteurs d'influence et insights contextuels
- **Export PDF** de l'analyse et partage de lien
- **Historique** des simulations par utilisateur
- **Architecture unifiée** : le backend FastAPI sert directement le frontend React

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19, TypeScript, Vite, Framer Motion, Recharts, Zustand |
| Backend | FastAPI, SQLAlchemy, SQLite, Pydantic v2 |
| Machine Learning | scikit-learn (Régression Logistique), pandas, numpy, joblib |
| Authentification | JWT (python-jose + passlib) |
| Déploiement | Docker (multi-stage), Render |

---

## Structure du projet

```
EDS-Cameroon/
├── Dockerfile                        # Build multi-stage (React + Python)
├── backend/
│   ├── app/
│   │   ├── api/routes/               # Endpoints FastAPI (auth, users, simulations, prediction)
│   │   ├── ml/
│   │   │   ├── model.joblib          # Modèle Régression Logistique entraîné
│   │   │   └── predictor.py          # Logique de prédiction + insights
│   │   ├── models/                   # Modèles SQLAlchemy (User, Simulation, …)
│   │   ├── schemas/                  # Schémas Pydantic
│   │   └── main.py                   # Application FastAPI + service des fichiers statiques
│   ├── scripts/
│   │   └── train_model.py            # Script d'entraînement du modèle
│   └── requirements-prod.txt
├── notebooks/
│   ├── analyse_fecondite_edsc.py     # Analyse statistique complète (EDA + ML)
│   ├── statistiques_completes.py     # Tables et tests pour le mémoire
│   └── edsc-fecondite/               # Application React (frontend)
│       └── src/
│           ├── pages/                # LandingPage, AuthPage, OnboardingPage, ResultsPage, …
│           ├── store/                # Zustand (état global)
│           └── lib/                  # Axios API client
└── data/                             # Données EDSC (non versionnées — .gitignore)
    └── CMIR71FL.SAV
```

---

## Installation locale

### Prérequis

- Python 3.12+
- Node.js 20+
- Le fichier de données `CMIR71FL.SAV` placé dans `data/`

### 1. Entraîner le modèle

```bash
python backend/scripts/train_model.py
```

> Génère `backend/app/ml/model.joblib`. Nécessite le fichier `data/CMIR71FL.SAV`.

### 2. Lancer le backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements-prod.txt
pip install pyreadstat          # Pour le script d'entraînement uniquement
python run.py
```

Le serveur démarre sur **http://localhost:8000**.  
Documentation API interactive : **http://localhost:8000/docs**

### 3. Mode développement frontend (optionnel)

```bash
cd notebooks/edsc-fecondite
npm install
npm run dev
```

Frontend accessible sur **http://localhost:5173** avec proxy vers le backend.

### 4. Mode production (backend sert le frontend)

```bash
# Compiler le frontend
cd notebooks/edsc-fecondite
npm run build

# Copier le build dans backend/static/
xcopy /E /I dist ..\..\..\backend\static\   # Windows
# ou
cp -r dist ../../../backend/static/          # Linux/Mac

# Démarrer le backend
cd backend
python run.py
```

L'application complète est accessible sur **http://localhost:8000**.

---

## Variables d'environnement

Créer un fichier `backend/.env` (copier depuis `backend/.env.example`) :

```env
SECRET_KEY=votre-cle-secrete-longue-et-aleatoire
DATABASE_URL=sqlite:///./hearth.db
```

---

## Déploiement sur Render

1. Créer un **Web Service** sur [render.com](https://render.com)
2. Connecter le dépôt GitHub
3. Render détecte automatiquement le `Dockerfile`
4. Ajouter la variable d'environnement `SECRET_KEY`
5. Déployer

Le Dockerfile compile le frontend React (Stage 1) et l'intègre dans l'image Python (Stage 2). Une seule URL suffit pour l'application complète.

---

## API — Principaux endpoints

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Créer un compte |
| `POST` | `/auth/login` | Connexion (retourne JWT) |
| `GET` | `/users/me` | Profil utilisateur |
| `POST` | `/prediction` | Prédiction ML |
| `POST` | `/simulations` | Créer + sauvegarder une simulation |
| `GET` | `/simulations` | Historique des simulations |
| `DELETE` | `/simulations/{id}` | Supprimer une simulation |
| `GET` | `/health` | Vérification de l'état du serveur |

---

## Source des données

- **Enquête Démographique et de Santé du Cameroun — EDSC-V 2018**
- Institut National de la Statistique (INS) du Cameroun
- Fichier Individual Recode (IR) : `CMIR71FL.SAV`
- Echantillon analysé : **13 527 femmes** de 15 à 49 ans
- Variable cible : `v602` — désir d'avoir un autre enfant (binaire)

Les données brutes ne sont pas versionnées (taille > 100 Mo). Elles sont disponibles sur le site du [DHS Program](https://dhsprogram.com).

---

## Résultats du modèle

| Métrique | Valeur |
|---|---|
| Prévalence du désir | 94.5 % |
| Accuracy (test) | 93.7 % |
| ROC-AUC (test, CV-5) | 0.80 |
| Facteurs significatifs | Âge, Nb enfants vivants, Statut matrimonial, Contraceptif, Quintile de richesse |

La Régression Logistique a été sélectionnée car elle offre le meilleur AUC (0.80) sans overfitting (gap Train/Test = 0.00), contrairement au Random Forest (gap = 0.26 — overfitting sévère).

---

## Licence

Projet académique — Usage éducatif et de recherche.  
Données EDSC © INS Cameroun / DHS Program.
