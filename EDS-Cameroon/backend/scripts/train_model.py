"""
Script d'entraînement du modèle Random Forest — EDSC Cameroun 2018
Exécution : python backend/scripts/train_model.py
             (depuis la racine du projet EDS-Cameroon)
"""

from pathlib import Path

import joblib
import numpy as np
import pyreadstat
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "CMIR71FL.SAV"
MODEL_PATH = Path(__file__).parent.parent / "app" / "ml" / "model.joblib"

FEATURES = [
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

VARIABLES_DHS = {
    "v012": "age",
    "v106": "niveau_instruction",
    "v218": "nb_enfants_vivants",
    "v313": "utilisation_contraceptif",
    "v501": "statut_matrimonial",
    "v025": "milieu_residence",
    "v190": "quintile_richesse",
    "v602": "desir_enfant",
    "v714": "travail_raw",
    "v024": "region",
    "v130": "religion",
}


def load_and_prepare() -> tuple[pd.DataFrame, pd.Series]:
    print(f"Chargement : {DATA_PATH}")
    df, _ = pyreadstat.read_sav(str(DATA_PATH))
    df.columns = df.columns.str.lower()
    print(f"Données brutes : {df.shape[0]:,} femmes | {df.shape[1]} variables")

    cols_ok = [c for c in VARIABLES_DHS if c in df.columns]
    df = df[cols_ok].rename(columns=VARIABLES_DHS)

    # Variable cible : 1=désire  0=ne désire pas
    df["desir_enfant_bin"] = df["desir_enfant"].apply(
        lambda x: 1 if x in [1, 2, 3] else (0 if x in [4, 5, 6, 7, 8] else np.nan)
    )
    df = df[df["desir_enfant_bin"].notna()].copy()

    # Variables dérivées
    df["contraceptif"]       = (df["utilisation_contraceptif"] > 0).astype(int)
    df["travail"]            = df["travail_raw"].fillna(0).astype(int).clip(0, 1)
    df["region_nord"]        = df["region"].isin([1, 4, 6]).astype(int)
    df["religion_musulman"]  = (df["religion"] == 4).astype(int)

    df_mod = df[FEATURES + ["desir_enfant_bin"]].dropna()
    X = df_mod[FEATURES].astype(float)
    y = df_mod["desir_enfant_bin"].astype(int)

    print(f"Effectif final : {len(df_mod):,} femmes")
    dist = y.value_counts(normalize=True) * 100
    print(f"  Désire un autre enfant : {dist.get(1, 0):.1f} %")
    print(f"  Ne désire pas          : {dist.get(0, 0):.1f} %")

    return X, y


def train(X: pd.DataFrame, y: pd.Series) -> RandomForestClassifier:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nEntraînement : {len(X_train):,} obs. | Test : {len(X_test):,} obs.")

    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)

    print(f"\nPerformances sur le jeu de test :")
    print(f"  Accuracy : {acc:.4f}  |  ROC-AUC : {auc:.4f}")
    print(classification_report(y_test, y_pred, target_names=["Ne désire pas", "Désire un enfant"]))

    importances = pd.Series(clf.feature_importances_, index=FEATURES).sort_values(ascending=False)
    print("\nImportance des variables :")
    for feat, imp in importances.items():
        print(f"  {feat:<25} {imp:.4f}")

    return clf


def main() -> None:
    X, y = load_and_prepare()
    clf = train(X, y)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    print(f"\nModèle sauvegardé : {MODEL_PATH}")


if __name__ == "__main__":
    main()
