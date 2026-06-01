from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

MODEL_PATH = Path(__file__).parent / "model.joblib"

FEATURE_NAMES = [
    "age",
    "niveau_instruction",
    "nb_enfants_vivants",
    "contraceptif",
    "statut_matrimonial",
    "milieu_residence",
    "quintile_richesse",
    "travail",
    "region_nord",
    "religion_musulman",
]

FEATURE_LABELS = {
    "age": "Âge",
    "niveau_instruction": "Niveau d'instruction",
    "nb_enfants_vivants": "Nb enfants vivants",
    "contraceptif": "Utilisation contraceptif",
    "statut_matrimonial": "Statut matrimonial",
    "milieu_residence": "Milieu de résidence",
    "quintile_richesse": "Quintile de richesse",
    "travail": "Emploi (travail)",
    "region_nord": "Région septentrionale",
    "religion_musulman": "Religion musulmane",
}


class FertilityPredictor:
    def __init__(self) -> None:
        self._model = None

    def _load(self) -> None:
        if self._model is not None:
            return
        if not MODEL_PATH.exists():
            raise RuntimeError(
                "Modèle ML introuvable. Exécutez d'abord : "
                "python backend/scripts/train_model.py"
            )
        self._model = joblib.load(MODEL_PATH)

    def predict(self, data: dict[str, Any]) -> dict[str, Any]:
        self._load()

        X = pd.DataFrame([[data[f] for f in FEATURE_NAMES]], columns=FEATURE_NAMES, dtype=float)

        probability = float(self._model.predict_proba(X)[0][1])
        desire_enfant = probability >= 0.5
        confidence = int(round(max(probability, 1 - probability) * 100))

        importances: dict[str, float] = {}
        if hasattr(self._model, "feature_importances_"):
            for name, imp in zip(FEATURE_NAMES, self._model.feature_importances_):
                importances[FEATURE_LABELS[name]] = round(float(imp), 4)

        insights = self._generate_insights(data, probability)

        return {
            "desire_enfant": desire_enfant,
            "probability": round(probability, 4),
            "confidence": confidence,
            "model_used": "random_forest_v1",
            "feature_importances": importances,
            "insights": insights,
        }

    def _generate_insights(self, data: dict[str, Any], prob: float) -> list[str]:
        insights: list[str] = []

        if data["age"] >= 40:
            insights.append("L'âge avancé (≥40 ans) est fortement associé à un désir d'enfant plus faible.")
        elif data["age"] >= 35:
            insights.append("L'âge (35-39 ans) réduit généralement le désir d'avoir un enfant supplémentaire.")
        elif data["age"] <= 24:
            insights.append("Le jeune âge (≤24 ans) est associé à un désir d'enfant plus élevé.")

        if data["nb_enfants_vivants"] == 0:
            insights.append("L'absence d'enfant vivant est fortement associée au désir d'en avoir un.")
        elif data["nb_enfants_vivants"] >= 5:
            insights.append(
                f"Avec {data['nb_enfants_vivants']} enfants vivants, le désir d'en avoir un autre diminue nettement."
            )

        if data["contraceptif"] == 1:
            insights.append("L'utilisation d'un contraceptif traduit souvent une volonté de limiter la fécondité.")

        if data["niveau_instruction"] >= 2:
            insights.append("Un niveau d'instruction secondaire ou supérieur est lié à un désir de famille plus restreinte.")

        if data["milieu_residence"] == 2:
            insights.append("Le milieu rural est généralement associé à un désir de fécondité plus élevé.")

        if data["quintile_richesse"] <= 2:
            insights.append("Un faible niveau de richesse est corrélé à un désir de fécondité plus élevé.")

        if data.get("travail") == 1:
            insights.append("L'activité professionnelle féminine est associée à un recul du désir d'enfant dans les zones urbaines.")

        if data.get("region_nord") == 1:
            insights.append("Les régions septentrionales (Adamaoua, Extrême-Nord, Nord) présentent les taux de fécondité les plus élevés du Cameroun.")

        if data.get("religion_musulman") == 1:
            insights.append("La religion musulmane est associée à des normes de fécondité plus élevées dans le contexte camerounais.")

        return insights


predictor = FertilityPredictor()
