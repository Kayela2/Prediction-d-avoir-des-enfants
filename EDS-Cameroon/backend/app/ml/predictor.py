from pathlib import Path
from typing import Any

import joblib
import numpy as np

MODEL_PATH = Path(__file__).parent / "model.joblib"

FEATURE_NAMES = [
    "age", "instruction", "nb_enfants", "nb_enfants_deces",
    "contracep_trad", "contracep_moderne",
    "mariee", "union_libre", "veuve", "divorcee", "separee",
    "residence_rural", "quintile", "emploi", "region_nord",
    "rel_protestant", "rel_autres_chret", "rel_musulman", "rel_autres",
]

FEATURE_LABELS = {
    "age":               "Âge",
    "instruction":       "Niveau d'instruction",
    "nb_enfants":        "Nb enfants vivants",
    "nb_enfants_deces":  "Nb enfants décédés",
    "contracep_trad":    "Contraceptif traditionnel",
    "contracep_moderne": "Contraceptif moderne",
    "mariee":            "Statut : Mariée",
    "union_libre":       "Statut : Union libre",
    "veuve":             "Statut : Veuve",
    "divorcee":          "Statut : Divorcée",
    "separee":           "Statut : Séparée",
    "residence_rural":   "Milieu rural",
    "quintile":          "Quintile de richesse",
    "emploi":            "Emploi (activité)",
    "region_nord":       "Région septentrionale",
    "rel_protestant":    "Religion : Protestante",
    "rel_autres_chret":  "Religion : Autres chrétiens",
    "rel_musulman":      "Religion : Musulmane",
    "rel_autres":        "Religion : Autres",
}

MODEL_NAME_MAP = {
    "LogisticRegression":     "Régression Logistique",
    "RandomForestClassifier": "Random Forest",
    "DecisionTreeClassifier": "Arbre de Décision",
    "SVC":                    "SVM (noyau RBF)",
    "CalibratedClassifierCV": "SVM calibré (noyau RBF)",
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

        importances: dict[str, float] = {}
        raw_model = getattr(self._model, "estimator", self._model)
        if hasattr(raw_model, "feature_importances_"):
            raw = raw_model.feature_importances_
        elif hasattr(raw_model, "coef_"):
            raw = np.abs(raw_model.coef_[0])
            raw = raw / raw.sum() if raw.sum() > 0 else raw
        else:
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

        nb = data.get("nb_enfants", 0)
        if nb == 0:
            insights.append("L'absence d'enfant vivant est fortement associée au désir d'en avoir un.")
        elif nb >= 5:
            insights.append(f"Avec {nb} enfants vivants, le désir d'en avoir un autre diminue nettement.")

        if data.get("contracep_moderne") == 1:
            insights.append("L'utilisation d'un contraceptif moderne traduit souvent une volonté de limiter la fécondité.")
        elif data.get("contracep_trad") == 1:
            insights.append("L'utilisation d'un contraceptif traditionnel est associée à une moindre intention d'agrandissement.")

        if data.get("instruction", 0) >= 2:
            insights.append("Un niveau d'instruction secondaire ou supérieur est lié à un désir de famille plus restreinte.")

        if data.get("residence_rural") == 1:
            insights.append("Le milieu rural est généralement associé à un désir de fécondité plus élevé.")

        if data.get("quintile", 3) <= 2:
            insights.append("Un faible niveau de richesse est corrélé à un désir de fécondité plus élevé.")

        if data.get("emploi") == 1:
            insights.append("L'activité professionnelle féminine est associée à un recul du désir d'enfant.")

        if data.get("region_nord") == 1:
            insights.append("Les régions septentrionales (Adamaoua, Extrême-Nord, Nord) présentent les taux de fécondité les plus élevés du Cameroun.")

        if data.get("rel_musulman") == 1:
            insights.append("La religion musulmane est associée à des normes de fécondité plus élevées dans le contexte camerounais.")

        if data.get("mariee") == 1:
            insights.append("Le mariage formel est associé à un désir d'enfant plus élevé dans l'EDSC-V.")
        elif data.get("union_libre") == 1:
            insights.append("L'union libre présente un profil de fécondité intermédiaire entre le mariage et le célibat.")

        deces = data.get("nb_enfants_deces", 0)
        if deces >= 1:
            insights.append(f"Le décès d'enfant(s) ({int(deces)}) est associé à un désir de remplacement plus élevé.")

        return insights


predictor = FertilityPredictor()
