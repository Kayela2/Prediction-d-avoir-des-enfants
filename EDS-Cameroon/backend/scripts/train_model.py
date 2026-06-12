"""
Entraînement du modèle EDSC Cameroun 2018
  - SMOTE sur le train uniquement (correction déséquilibre 94/6%)
  - 4 modèles comparés : RL, RF, Arbre de décision, SVM
  - Sélection : meilleur AUC CV-5 parmi les modèles sans overfitting sévère (gap ≤ 0.15)
  - Sauvegarde : backend/app/ml/model.joblib

Exécution (depuis la racine EDS-Cameroon) :
    python backend/scripts/train_model.py
"""

from pathlib import Path

import joblib
import numpy as np
import pyreadstat
import pandas as pd
from sklearn.linear_model    import LogisticRegression
from sklearn.ensemble        import RandomForestClassifier
from sklearn.tree            import DecisionTreeClassifier
from sklearn.svm             import SVC
from sklearn.calibration     import CalibratedClassifierCV
from sklearn.metrics         import roc_auc_score, classification_report
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing   import StandardScaler
from imblearn.over_sampling  import SMOTE

DATA_PATH  = Path(__file__).parent.parent.parent / "data" / "CMIR71FL.SAV"
MODEL_PATH = Path(__file__).parent.parent / "app" / "ml" / "model.joblib"

FEATURES = [
    "age", "niveau_instruction", "nb_enfants_vivants", "contraceptif",
    "statut_matrimonial", "milieu_residence", "quintile_richesse",
    "travail", "region_nord", "religion_musulman",
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


def load_and_prepare():
    print(f"Chargement : {DATA_PATH}")
    df, _ = pyreadstat.read_sav(str(DATA_PATH))
    df.columns = df.columns.str.lower()

    cols_ok = [c for c in VARIABLES_DHS if c in df.columns]
    df = df[cols_ok].rename(columns=VARIABLES_DHS)

    df["desir_bin"]        = df["desir_enfant"].apply(
        lambda x: 1 if x in [1,2,3] else (0 if x in [4,5,6,7,8] else np.nan)
    )
    df = df[df["desir_bin"].notna()].copy()

    df["contraceptif"]     = (df["utilisation_contraceptif"] > 0).astype(int)
    df["travail"]          = df["travail_raw"].fillna(0).astype(int).clip(0, 1)
    df["region_nord"]      = df["region"].isin([1, 4, 6]).astype(int)
    df["religion_musulman"]= (df["religion"] == 4).astype(int)

    df_mod = df[FEATURES + ["desir_bin"]].dropna()
    X = df_mod[FEATURES].astype(float)
    y = df_mod["desir_bin"].astype(int)

    N = len(X)
    dist = y.value_counts(normalize=True) * 100
    print(f"Effectif : {N:,} femmes")
    print(f"  Désire    : {dist.get(1,0):.1f}%  |  Ne désire : {dist.get(0,0):.1f}%")
    print(f"  → SMOTE sera appliqué pour rééquilibrer le train\n")
    return X, y


def entrainer_et_selectionner(X, y):
    # ── Split 80/20 stratifié ─────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── SMOTE sur le train uniquement ─────────────────────
    smote = SMOTE(random_state=42)
    X_train_sm, y_train_sm = smote.fit_resample(X_train.values, y_train.values)
    X_train_sm = pd.DataFrame(X_train_sm, columns=FEATURES)
    print(f"SMOTE : {len(X_train):,} → {len(X_train_sm):,} observations (train)")
    print(f"  Classe 1 : {y_train_sm.sum():,} ({y_train_sm.mean()*100:.1f}%)")
    print(f"  Classe 0 : {(y_train_sm==0).sum():,} ({(y_train_sm==0).mean()*100:.1f}%)\n")

    # ── Normalisation pour SVM (fit sur numpy pour éviter le warning) ────
    scaler     = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train_sm.values)  # numpy → pas de warning feature names
    X_test_sc  = scaler.transform(X_test.values)

    # SVM calibré (SVC(probability=True) déprécié dans sklearn ≥ 1.9)
    svm_calibre = CalibratedClassifierCV(SVC(kernel="rbf", random_state=42), ensemble=False)

    # ── 4 modèles candidats ───────────────────────────────
    candidats = [
        ("Régression Logistique", LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced"), False),
        ("Random Forest",         RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),         False),
        ("Arbre de Décision",     DecisionTreeClassifier(max_depth=5, random_state=42),                         False),
        ("SVM",                   svm_calibre,                                                                   True),
    ]

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    print(f"{'Modèle':<25} {'AUC CV-5':>10} {'AUC Test':>10} {'Gap':>8}   Statut")
    print("-" * 65)

    resultats = []
    for nom, clf, normalise in candidats:
        Xtr = X_train_sc if normalise else X_train_sm.values
        Xte = X_test_sc  if normalise else X_test.values

        cv_scores = cross_val_score(clf, Xtr, y_train_sm, cv=cv, scoring="roc_auc", n_jobs=-1)
        auc_cv    = cv_scores.mean()

        clf.fit(Xtr, y_train_sm)
        auc_train = roc_auc_score(y_train_sm, clf.predict_proba(Xtr)[:, 1])
        auc_test  = roc_auc_score(y_test,     clf.predict_proba(Xte)[:, 1])
        gap       = auc_train - auc_test

        statut = ("✓ Bon ajustement"    if gap <= 0.05
             else ("⚠ Léger overfitting" if gap <= 0.15
             else  "✗ Overfitting sévère"))

        print(f"{nom:<25} {auc_cv:>10.4f} {auc_test:>10.4f} {gap:>8.4f}   {statut}")
        resultats.append({
            "nom": nom, "clf": clf, "normalise": normalise,
            "scaler": scaler if normalise else None,
            "auc_cv": auc_cv, "auc_test": auc_test, "gap": gap,
        })

    # ── Sélection : meilleur AUC CV-5 sans overfitting sévère ──
    candidats_ok = [r for r in resultats if r["gap"] <= 0.15]
    if not candidats_ok:
        candidats_ok = resultats
    meilleur = max(candidats_ok, key=lambda r: r["auc_cv"])

    print(f"\n{'='*65}")
    print(f"MODÈLE SÉLECTIONNÉ : {meilleur['nom']}")
    print(f"  AUC CV-5  : {meilleur['auc_cv']:.4f}")
    print(f"  AUC Test  : {meilleur['auc_test']:.4f}")
    print(f"  Gap       : {meilleur['gap']:.4f}")
    print(f"{'='*65}\n")

    clf = meilleur["clf"]
    Xte = X_test_sc if meilleur["normalise"] else X_test.values
    y_pred = clf.predict(Xte)
    print("Rapport de classification :")
    print(classification_report(y_test, y_pred, target_names=["Ne désire pas", "Désire"]))

    return meilleur


def main():
    X, y = load_and_prepare()
    meilleur = entrainer_et_selectionner(X, y)

    payload = {
        "model":     meilleur["clf"],
        "features":  FEATURES,
        "scaler":    meilleur["scaler"],   # None si pas de normalisation
        "normalise": meilleur["normalise"],
        "model_name": meilleur["nom"],
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(payload, MODEL_PATH)
    print(f"Modèle sauvegardé : {MODEL_PATH}")
    print(f"Modèle utilisé    : {meilleur['nom']}")


if __name__ == "__main__":
    main()
