from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

MODEL_PATH = Path(__file__).parent / "model.joblib"

FEATURE_NAMES = [
    "age", "niveau_instruction", "nb_enfants_vivants", "contraceptif",
    "statut_matrimonial", "milieu_residence", "quintile_richesse",
    "travail", "region_nord", "religion_musulman",
]

FEATURE_LABELS = {
    "age":                "Âge",
    "niveau_instruction": "Niveau d'instruction",
    "nb_enfants_vivants": "Nb enfants vivants",
    "contraceptif":       "Utilisation contraceptif",
    "statut_matrimonial": "Statut matrimonial",
    "milieu_residence":   "Milieu de résidence",
    "quintile_richesse":  "Quintile de richesse",
    "travail":            "Emploi (travail)",
    "region_nord":        "Région septentrionale",
    "religion_musulman":  "Religion musulmane",
}

MODEL_NAME_MAP = {
    "LogisticRegression":        "Régression Logistique",
    "RandomForestClassifier":    "Random Forest",
    "DecisionTreeClassifier":    "Arbre de Décision",
    "SVC":                       "SVM (noyau RBF)",
    "CalibratedClassifierCV":    "SVM calibré (noyau RBF)",
}


class FertilityPredictor:
    def __init__(self) -> None:
        self._model    = None
        self._features = None
        self._scaler   = None
        self._normalise= False
        self._model_nom= "inconnu"

    def _load(self) -> None:
        if self._model is not None:
            return
        if not MODEL_PATH.exists():
            raise RuntimeError(
                "Modèle ML introuvable. Exécutez d'abord :\n"
                "  python backend/scripts/train_model.py"
            )
        payload = joblib.load(MODEL_PATH)
        if isinstance(payload, dict) and "model" in payload:
            self._model    = payload["model"]
            self._features = payload.get("features", FEATURE_NAMES)
            self._scaler   = payload.get("scaler", None)
            self._normalise= payload.get("normalise", False)
            self._model_nom= payload.get("model_name",
                MODEL_NAME_MAP.get(type(self._model).__name__, type(self._model).__name__))
        else:
            # Ancien format (compatibilité)
            self._model    = payload
            self._features = FEATURE_NAMES
            self._scaler   = None
            self._normalise= False
            self._model_nom= MODEL_NAME_MAP.get(type(payload).__name__, type(payload).__name__)

    def predict(self, data: dict[str, Any]) -> dict[str, Any]:
        self._load()

        features = self._features
        X = np.array([[data.get(f, 0) for f in features]], dtype=float)

        if self._normalise and self._scaler is not None:
            X = self._scaler.transform(X)

        probability   = float(self._model.predict_proba(X)[0][1])
        desire_enfant = probability >= 0.5
        confidence    = int(round(max(probability, 1 - probability) * 100))

        # Importances des variables
        importances: dict[str, float] = {}
        # CalibratedClassifierCV enveloppe le modèle réel dans .estimator
        raw_model = getattr(self._model, "estimator", self._model)
        if hasattr(raw_model, "feature_importances_"):
            raw = raw_model.feature_importances_
        elif hasattr(raw_model, "coef_"):
            raw = np.abs(raw_model.coef_[0])
            raw = raw / raw.sum() if raw.sum() > 0 else raw
        else:
            # SVM ou autre sans importance → distribution uniforme
            raw = np.ones(len(features)) / len(features)

        for name, imp in zip(features, raw):
            importances[FEATURE_LABELS.get(name, name)] = round(float(imp), 4)

        insights = self._generate_insights(data, probability)

        return {
            "desire_enfant":       desire_enfant,
            "probability":         round(probability, 4),
            "confidence":          confidence,
            "model_used":          self._model_nom,
            "feature_importances": importances,
            "insights":            insights,
        }

    def _generate_insights(self, data: dict[str, Any], prob: float) -> list[str]:
        insights: list[str] = []

        age = data.get("age", 0)
        if age >= 40:
            insights.append("L'âge avancé (≥ 40 ans) est fortement associé à un désir d'enfant plus faible.")
        elif age >= 35:
            insights.append("L'âge (35-39 ans) réduit généralement le désir d'avoir un enfant supplémentaire.")
        elif age <= 24:
            insights.append("Le jeune âge (≤ 24 ans) est associé à un désir d'enfant plus élevé.")

        nb = data.get("nb_enfants_vivants", 0)
        if nb == 0:
            insights.append("L'absence d'enfant vivant est fortement associée au désir d'en avoir un.")
        elif nb >= 5:
            insights.append(f"Avec {nb} enfants vivants, le désir d'en avoir un autre diminue nettement.")

        if data.get("contraceptif") == 1:
            insights.append("L'utilisation d'un contraceptif traduit souvent une volonté de limiter la fécondité.")

        if data.get("niveau_instruction", 0) >= 2:
            insights.append("Un niveau d'instruction secondaire ou supérieur est lié à un désir de famille plus restreinte.")

        if data.get("milieu_residence") == 2:
            insights.append("Le milieu rural est généralement associé à un désir de fécondité plus élevé.")

        if data.get("quintile_richesse", 3) <= 2:
            insights.append("Un faible niveau de richesse est corrélé à un désir de fécondité plus élevé.")

        if data.get("travail") == 1:
            insights.append("L'activité professionnelle féminine est associée à un recul du désir d'enfant.")

        if data.get("region_nord") == 1:
            insights.append("Les régions septentrionales (Adamaoua, Extrême-Nord, Nord) présentent les taux de fécondité les plus élevés du Cameroun.")

        if data.get("religion_musulman") == 1:
            insights.append("La religion musulmane est associée à des normes de fécondité plus élevées dans le contexte camerounais.")

        return insights


predictor = FertilityPredictor()
