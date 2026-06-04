"""
Script d'entraînement et de sélection du meilleur modèle — EDSC Cameroun 2018

Diagnostic complet :
  - Comparaison Régression Logistique / Random Forest / Decision Tree
  - Test avec 7 variables (original) vs 10 variables (avec nouvelles)
  - Validation croisée 5-fold pour détecter l'overfitting
  - Sélection automatique du meilleur modèle par AUC

Exécution : python backend/scripts/train_model.py
             (depuis la racine du projet EDS-Cameroon)
"""

from pathlib import Path

import joblib
import numpy as np
import pyreadstat
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import roc_auc_score, classification_report
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold

DATA_PATH  = Path(__file__).parent.parent.parent / "data" / "CMIR71FL.SAV"
MODEL_PATH = Path(__file__).parent.parent / "app" / "ml" / "model.joblib"

# ── Variables ────────────────────────────────────────────────────────────────
FEATURES_7 = [
    "age", "niveau_instruction", "nb_enfants_vivants", "contraceptif",
    "statut_matrimonial", "milieu_residence", "quintile_richesse",
]

FEATURES_10 = FEATURES_7 + ["travail", "region_nord", "religion_musulman"]

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


# ── Chargement ───────────────────────────────────────────────────────────────
def load_and_prepare():
    print(f"Chargement : {DATA_PATH}")
    df, _ = pyreadstat.read_sav(str(DATA_PATH))
    df.columns = df.columns.str.lower()

    cols_ok = [c for c in VARIABLES_DHS if c in df.columns]
    df = df[cols_ok].rename(columns=VARIABLES_DHS)

    df["desir_enfant_bin"] = df["desir_enfant"].apply(
        lambda x: 1 if x in [1, 2, 3] else (0 if x in [4, 5, 6, 7, 8] else np.nan)
    )
    df = df[df["desir_enfant_bin"].notna()].copy()

    df["contraceptif"]      = (df["utilisation_contraceptif"] > 0).astype(int)
    df["travail"]           = df["travail_raw"].fillna(0).astype(int).clip(0, 1)
    df["region_nord"]       = df["region"].isin([1, 4, 6]).astype(int)
    df["religion_musulman"] = (df["religion"] == 4).astype(int)

    df_mod = df[FEATURES_10 + ["desir_enfant_bin"]].dropna()
    X = df_mod[FEATURES_10].astype(float)
    y = df_mod["desir_enfant_bin"].astype(int)

    print(f"Effectif : {len(X):,} femmes")
    dist = y.value_counts(normalize=True) * 100
    print(f"  Désire     : {dist.get(1, 0):.1f}%")
    print(f"  Ne désire  : {dist.get(0, 0):.1f}%")
    print(f"\n[!] Rappel : un modele naif qui dit 'tous desirent' = {dist.get(1,0):.1f}% accuracy")
    print(f"    -> L'accuracy seule est trompeuse. On se base sur l'AUC (ROC).\n")
    return X, y


# ── Diagnostic ───────────────────────────────────────────────────────────────
def diagnostiquer(X, y):
    """
    Compare 6 configurations : 3 modèles × 2 ensembles de features
    Affiche le gap Train AUC – Test AUC pour détecter l'overfitting.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    candidats = [
        ("Régression Logistique", LogisticRegression(
            max_iter=1000, random_state=42, class_weight="balanced")),
        ("Random Forest        ", RandomForestClassifier(
            n_estimators=100, random_state=42, class_weight="balanced", n_jobs=-1)),
        ("Decision Tree        ", DecisionTreeClassifier(
            max_depth=5, random_state=42, class_weight="balanced")),
    ]

    print("=" * 75)
    print("DIAGNOSTIC OVERFITTING")
    print(f"{'Modèle':<25} {'Vars':>5} {'AUC CV-5':>10} {'AUC Train':>10} {'AUC Test':>10} {'Gap':>8}  Statut")
    print("-" * 75)

    resultats = []
    for nom, clf in candidats:
        for features, nb in [(FEATURES_7, 7), (FEATURES_10, 10)]:
            Xf_train = X_train[features]
            Xf_test  = X_test[features]

            # Cross-validation sur l'ensemble d'entraînement
            cv_scores  = cross_val_score(clf, X_train[features], y_train,
                                         cv=cv, scoring="roc_auc", n_jobs=-1)
            auc_cv     = cv_scores.mean()

            # Entraîner sur tout le train, évaluer sur test
            clf.fit(Xf_train, y_train)
            auc_train  = roc_auc_score(y_train, clf.predict_proba(Xf_train)[:, 1])
            auc_test   = roc_auc_score(y_test,  clf.predict_proba(Xf_test)[:, 1])
            gap        = auc_train - auc_test

            # Diagnostic
            if gap < 0.03:
                statut = "OK  Bon ajustement"
            elif gap < 0.08:
                statut = "/!\\ Leger overfitting"
            else:
                statut = "XXX Overfitting"

            print(f"{nom:<25} {nb:>5} {auc_cv:>10.4f} {auc_train:>10.4f} {auc_test:>10.4f} {gap:>8.4f}  {statut}")

            resultats.append({
                "nom": nom.strip(), "features": features, "nb_vars": nb,
                "clf": clf.__class__(**clf.get_params()),
                "auc_cv": auc_cv, "auc_test": auc_test, "gap": gap,
            })

    print("=" * 75)
    return resultats, X_train, X_test, y_train, y_test


# ── Sélection & entraînement final ──────────────────────────────────────────
def selectionner_et_entrainer(resultats, X_train, X_test, y_train, y_test):
    """
    Sélectionne le meilleur modèle : meilleur AUC CV parmi ceux sans overfitting.
    """
    # Filtrer : gap < 0.08, puis trier par AUC CV décroissant
    candidats_ok = [r for r in resultats if r["gap"] < 0.08]
    if not candidats_ok:
        candidats_ok = resultats  # fallback si tout overfitte

    meilleur = max(candidats_ok, key=lambda r: r["auc_cv"])

    print(f"\n[*] MEILLEUR MODELE SELECTIONNE")
    print(f"   Modèle    : {meilleur['nom']}")
    print(f"   Variables : {meilleur['nb_vars']} features")
    print(f"   AUC CV-5  : {meilleur['auc_cv']:.4f}")
    print(f"   AUC Test  : {meilleur['auc_test']:.4f}")
    print(f"   Gap       : {meilleur['gap']:.4f}")

    # Ré-entraîner sur l'ensemble train avec les bons hyperparamètres
    features = meilleur["features"]
    clf      = meilleur["clf"]
    clf.fit(X_train[features], y_train)

    # Rapport complet
    y_pred = clf.predict(X_test[features])
    print(f"\nRapport de classification (seuil = 0.5) :")
    print(classification_report(y_test, y_pred,
                                 target_names=["Ne désire pas", "Désire"]))

    # Importances
    print("Influence de chaque variable :")
    if hasattr(clf, "feature_importances_"):
        imps = pd.Series(clf.feature_importances_, index=features)
    elif hasattr(clf, "coef_"):
        raw  = np.abs(clf.coef_[0])
        imps = pd.Series(raw / raw.sum(), index=features)

    for feat, imp in imps.sort_values(ascending=False).items():
        bar = "#" * int(imp * 40)
        print(f"  {feat:<25} {bar} {imp:.4f}")

    return clf, features


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    X, y = load_and_prepare()

    resultats, X_train, X_test, y_train, y_test = diagnostiquer(X, y)

    clf, features = selectionner_et_entrainer(
        resultats, X_train, X_test, y_train, y_test
    )

    # Sauvegarder le modèle avec les features utilisées
    payload = {"model": clf, "features": features}
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(payload, MODEL_PATH)
    print(f"\nModele sauvegarde : {MODEL_PATH}")
    print(f"Features : {features}")


if __name__ == "__main__":
    main()
