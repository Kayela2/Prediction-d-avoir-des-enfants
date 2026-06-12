# Hearth — Simulation du désir de fécondité au Cameroun

> Application web de simulation démographique basée sur l'Enquête Démographique et de Santé du Cameroun (EDSC-V 2018)

---

## Présentation

**Hearth** est une application web full-stack qui estime la probabilité qu'une femme camerounaise de 15 à 49 ans désire avoir un enfant supplémentaire. Elle repose sur un modèle de Machine Learning (SVM calibré, sélectionné par comparaison de 4 modèles avec SMOTE) entraîné sur les données officielles de l'EDSC-V 2018 (INS Cameroun, n = 13 527 femmes).

L'utilisateur renseigne son profil en 5 étapes et obtient un résultat personnalisé accompagné des facteurs explicatifs, des insights contextuels et d'un graphique de probabilité par quintile de richesse.

**Contexte académique :** Mémoire de Master 1 — Analyse des déterminants du désir de fécondité des femmes au Cameroun.

---

## Fonctionnalités

- **Simulation guidée en 5 étapes** — interface moderne et responsive
- **Prédiction ML avec SMOTE** — rééquilibrage de la classe minoritaire (5.5 % → 50 %) avant entraînement
- **Comparaison de 4 modèles** — Régression Logistique, Random Forest, Arbre de Décision, SVM
- **10 variables prédictives** — âge, instruction, enfants vivants, contraceptif, statut matrimonial, résidence, richesse, emploi, région septentrionale, religion
- **Résultats enrichis** — facteurs d'influence, insights contextuels, graphique quintile
- **Authentification complète** — inscription (avec identité de genre), connexion JWT, mot de passe oublié
- **Historique des simulations** par utilisateur
- **Export PDF** et partage de lien

---

## Résultats du modèle

| Modèle | AUC CV-5 | AUC Test | Gap | Statut |
|---|---|---|---|---|
| Régression Logistique | 0.8106 | 0.8076 | 0.003 | ✓ Bon ajustement |
| Random Forest | 0.9908 | 0.7486 | 0.251 | ✗ Overfitting sévère |
| Arbre de Décision | 0.8948 | 0.7823 | 0.118 | ⚠ Léger overfitting |
| **SVM calibré** | **0.9513** | **0.8090** | **0.148** | **⚠ Sélectionné** |

**Critère de sélection :** meilleur AUC CV-5 parmi les modèles avec gap ≤ 0.15.  
**SMOTE :** 10 821 → 20 450 observations (train) — équilibre parfait 50/50.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19, TypeScript, Vite, Framer Motion, Recharts, Zustand |
| Backend | FastAPI 0.111, SQLAlchemy 2, SQLite, Pydantic v2 |
| Machine Learning | scikit-learn 1.5, imbalanced-learn (SMOTE), pandas, numpy, joblib |
| Authentification | JWT (python-jose + passlib + bcrypt) |
| Déploiement | Docker (multi-stage), Render |

---

## Structure du projet

```
EDS-Cameroon/
├── README.md
├── Dockerfile                          # Build multi-stage (React → Python)
├── data/
│   └── CMIR71FL.SAV                    # Données EDSC-V 2018 (non versionnées)
├── backend/
│   ├── requirements.txt                # Dépendances Python
│   ├── .env                            # Variables d'environnement (non versionné)
│   ├── hearth.db                       # Base SQLite (non versionnée)
│   ├── app/
│   │   ├── main.py                     # Application FastAPI + fichiers statiques
│   │   ├── api/routes/
│   │   │   ├── auth.py                 # /auth/register, /login, /forgot-password
│   │   │   ├── users.py                # /users/me
│   │   │   ├── simulations.py          # /simulations (CRUD)
│   │   │   └── prediction.py           # /prediction (ML)
│   │   ├── ml/
│   │   │   ├── predictor.py            # Prédiction + insights contextuels
│   │   │   └── model.joblib            # Modèle SVM entraîné (généré)
│   │   ├── models/                     # ORM SQLAlchemy (User, Simulation, AuditLog)
│   │   ├── schemas/                    # Schémas Pydantic
│   │   ├── core/                       # Sécurité JWT, config
│   │   └── database/                   # Session SQLAlchemy
│   └── scripts/
│       └── train_model.py              # Entraînement SMOTE + 4 modèles
├── notebooks/
│   ├── analyse_statistique_EDSC.ipynb  # Analyse EDA + statistiques pour le mémoire
│   ├── 02_ml_complet.ipynb             # Pipeline ML complet (SMOTE, SHAP, évaluation)
│   └── edsc-fecondite/                 # Application React (frontend)
│       ├── src/
│       │   ├── pages/                  # LandingPage, AuthPage, OnboardingPage, ResultsPage, DashboardPage
│       │   ├── store/useStore.ts        # Zustand — état global
│       │   ├── lib/api.ts              # Client Axios avec intercepteur JWT
│       │   └── types/index.ts          # Types TypeScript
│       ├── public/images/
│       └── package.json
└── scripts/                            # Scripts utilitaires
```

---

## Installation locale

### Prérequis

- Python 3.12+
- Node.js 20+
- Le fichier `data/CMIR71FL.SAV` (disponible sur [dhsprogram.com](https://dhsprogram.com))

---

### 1. Préparer le backend

```bash
cd backend

# Créer et activer le venv
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux / Mac

# Installer les dépendances
pip install -r requirements.txt
```

Créer le fichier `backend/.env` :

```env
SECRET_KEY=votre-cle-secrete-longue-et-aleatoire
DATABASE_URL=sqlite:///./hearth.db
```

---

### 2. Entraîner le modèle ML

Depuis la racine du projet (avec le venv activé) :

```bash
python backend/scripts/train_model.py
```

Ce script :
- Charge `data/CMIR71FL.SAV` via pyreadstat
- Applique SMOTE sur le train (80 %)
- Compare 4 modèles par AUC CV-5
- Sauvegarde le meilleur dans `backend/app/ml/model.joblib`

> **Note :** pyreadstat doit être installé dans l'environnement qui lance ce script.  
> Le backend FastAPI n'a pas besoin de pyreadstat.

---

### 3. Lancer le backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

- API disponible sur **http://localhost:8000**
- Documentation interactive : **http://localhost:8000/docs**

---

### 4. Lancer le frontend (développement)

Dans un second terminal :

```bash
cd notebooks/edsc-fecondite
npm install
npm run dev
```

Application accessible sur **http://localhost:5173** (proxy Vite → backend port 8000).

---

### 5. Mode production (backend sert le frontend)

```bash
# 1. Compiler le frontend
cd notebooks/edsc-fecondite
npm run build

# 2. Copier le build dans backend/static/
xcopy /E /I dist ..\..\..\backend\static\   # Windows
# cp -r dist ../../../backend/static/       # Linux/Mac

# 3. Démarrer le backend
cd backend
python -m uvicorn app.main:app
```

L'application complète est accessible sur **http://localhost:8000**.

---

## API — Endpoints principaux

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Créer un compte (nom, email, mdp, sexe) |
| `POST` | `/auth/login` | — | Connexion — retourne JWT |
| `POST` | `/auth/forgot-password` | — | Demande de réinitialisation de mot de passe |
| `GET` | `/users/me` | JWT | Profil utilisateur |
| `PUT` | `/users/me` | JWT | Mettre à jour le profil |
| `POST` | `/simulations` | JWT | Créer et sauvegarder une simulation |
| `GET` | `/simulations` | JWT | Historique des simulations |
| `DELETE` | `/simulations/{id}` | JWT | Supprimer une simulation |
| `POST` | `/prediction` | JWT | Prédiction ML brute |
| `GET` | `/health` | — | État du serveur |

---

## Variables prédictives

| Variable | Code DHS | Type | Description |
|---|---|---|---|
| `age` | v012 | Numérique | Âge de la femme (15–49 ans) |
| `niveau_instruction` | v106 | Ordinal (0–3) | Aucun / Primaire / Secondaire / Supérieur |
| `nb_enfants_vivants` | v218 | Numérique | Nombre d'enfants vivants |
| `contraceptif` | v313 | Binaire | Utilisation d'un contraceptif |
| `statut_matrimonial` | v501 | Catégoriel | Célibataire / Marié(e) / Union libre / … |
| `milieu_residence` | v025 | Binaire | 1 = Urbain / 2 = Rural |
| `quintile_richesse` | v190 | Ordinal (1–5) | Indice de richesse du ménage |
| `travail` | v714 | Binaire | Activité professionnelle |
| `region_nord` | v024 | Binaire | Adamaoua, Extrême-Nord ou Nord |
| `religion_musulman` | v130 | Binaire | Religion musulmane |

**Variable cible :** `v602` — désir d'avoir un autre enfant (1 = Désire, 0 = Ne désire pas)

---

## Source des données

- **Enquête Démographique et de Santé du Cameroun — EDSC-V 2018**
- Institut National de la Statistique (INS) du Cameroun
- Fichier Individual Recode (IR) : `CMIR71FL.SAV`
- Échantillon analysé : **13 527 femmes** de 15 à 49 ans
- Prévalence du désir d'enfant : **94.5 %**

Les données brutes ne sont pas versionnées (taille > 100 Mo). Disponibles sur [dhsprogram.com](https://dhsprogram.com) (accès libre après inscription).

---

## Déploiement sur Render

1. Créer un **Web Service** sur [render.com](https://render.com)
2. Connecter le dépôt GitHub
3. Render détecte automatiquement le `Dockerfile`
4. Ajouter la variable d'environnement `SECRET_KEY`
5. Déployer

Le Dockerfile compile le frontend React (Stage 1) et l'intègre dans l'image Python (Stage 2). Une seule URL suffit pour l'application complète.

---

## Licence

Projet académique — Usage éducatif et de recherche.  
Données EDSC © INS Cameroun / DHS Program.
