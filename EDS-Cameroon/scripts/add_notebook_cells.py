"""Ajoute les cellules manquantes au notebook 02_ml_complet.ipynb"""
import json, uuid
from pathlib import Path

NB_PATH = Path(__file__).parent.parent / "notebooks" / "02_ml_complet.ipynb"

with open(NB_PATH, "r", encoding="utf-8") as f:
    nb = json.load(f)

# Vérifier qu'on n'a pas déjà ajouté ces cellules
existing_sources = " ".join(
    "".join(c.get("source", [])) for c in nb["cells"]
)
if "permutation_importance" in existing_sources:
    print("Les cellules sont déjà présentes — aucune modification.")
    exit(0)


def cell(lines):
    return {
        "cell_type": "code",
        "execution_count": None,
        "id": uuid.uuid4().hex[:8],
        "metadata": {},
        "outputs": [],
        "source": lines,
    }


# ── Cellule A : calcul Permutation Importance SVM ──────────────────────────
c_perm_calc = cell([
    "# ── Permutation Importance — SVM calibré (modèle sélectionné) ──────────\n",
    "# Pour le SVM calibré, SHAP LinearExplainer ne s'applique pas.\n",
    "# Permutation Importance : on perturbe chaque variable aléatoirement\n",
    "# et on mesure la chute d'AUC → variable importante = grande chute.\n",
    "from sklearn.inspection import permutation_importance\n",
    "\n",
    "LABELS_PI = {\n",
    "    'age': 'Age',\n",
    "    'niveau_instruction': 'Niveau instruction',\n",
    "    'nb_enfants_vivants': 'Nb enfants vivants',\n",
    "    'contraceptif_bin': 'Utilisation contraceptif',\n",
    "    'statut_matrimonial': 'Statut matrimonial',\n",
    "    'milieu_residence': 'Milieu de residence',\n",
    "    'quintile_richesse': 'Quintile de richesse',\n",
    "    'travail': 'Emploi (travail)',\n",
    "    'region_nord': 'Region septentrionale',\n",
    "    'religion_musulman': 'Religion musulmane',\n",
    "}\n",
    "\n",
    "best_clf_svm = modeles['SVM']\n",
    "r_perm = permutation_importance(\n",
    "    best_clf_svm, X_test_sc, y_test,\n",
    "    n_repeats=10, random_state=42, scoring='roc_auc', n_jobs=-1\n",
    ")\n",
    "\n",
    "perm_df = pd.DataFrame({\n",
    "    'Variable': [LABELS_PI[v] for v in VARS_MODELE],\n",
    "    'Importance': r_perm.importances_mean,\n",
    "    'Ecart_type': r_perm.importances_std,\n",
    "}).sort_values('Importance', ascending=False).reset_index(drop=True)\n",
    "\n",
    "print('Permutation Importance --- SVM calibre (chute AUC quand variable permutee) :')\n",
    "print(f\"{'Variable':<30} {'Chute AUC':>12} {'Ecart-type':>12}\")\n",
    "print('-' * 56)\n",
    "for _, row in perm_df.iterrows():\n",
    "    print(f\"{row['Variable']:<30} {row['Importance']:>+12.4f} {row['Ecart_type']:>12.4f}\")\n",
])

# ── Cellule B : figure Permutation Importance ──────────────────────────────
c_perm_fig = cell([
    "# ── Figure : Permutation Importance SVM ─────────────────────────────────\n",
    "perm_plot = perm_df.sort_values('Importance', ascending=True)\n",
    "\n",
    "fig, ax = plt.subplots(figsize=(9, 5.5))\n",
    "colors_pi = [NAVY if v >= 0 else CORAL for v in perm_plot['Importance']]\n",
    "bars = ax.barh(\n",
    "    perm_plot['Variable'], perm_plot['Importance'],\n",
    "    xerr=perm_plot['Ecart_type'],\n",
    "    color=colors_pi, edgecolor='white', linewidth=1.2,\n",
    "    capsize=4, error_kw={'elinewidth': 1.2, 'ecolor': GRAY}\n",
    ")\n",
    "ax.axvline(x=0, color='gray', linewidth=1, linestyle='--', alpha=0.7)\n",
    "for b, v in zip(bars, perm_plot['Importance']):\n",
    "    offset = 0.002 if v >= 0 else -0.002\n",
    "    ha = 'left' if v >= 0 else 'right'\n",
    "    ax.text(b.get_width() + offset, b.get_y() + b.get_height() / 2,\n",
    "            f'{v:+.4f}', va='center', fontsize=9, fontweight='bold', ha=ha)\n",
    "ax.set_xlabel(\n",
    "    \"Chute d'AUC-ROC quand la variable est permutee\\n\"\n",
    "    \"(valeur positive = variable importante ; proche de 0 = peu utile)\",\n",
    "    fontsize=11\n",
    ")\n",
    "ax.set_title(\n",
    "    'Permutation Importance --- SVM calibre (modele selectionne)\\n'\n",
    "    'EDSC Cameroun 2018 - n=2 706 observations de test',\n",
    "    fontsize=12, fontweight='bold'\n",
    ")\n",
    "plt.tight_layout()\n",
    "plt.savefig('../outputs/figures/fig_permutation_importance_svm.png', bbox_inches='tight')\n",
    "plt.show()\n",
    "print('Figure sauvegardee : fig_permutation_importance_svm.png')\n",
])

# ── Cellule C : courbe de calibration ──────────────────────────────────────
c_calib = cell([
    "# ── Courbe de calibration — SVM calibre vs Regression Logistique ────────\n",
    "# Si le modele predit 70 %, est-ce que ~70 % des femmes desirent vraiment ?\n",
    "# Une courbe proche de la diagonale = probabilites predites fiables.\n",
    "from sklearn.calibration import calibration_curve\n",
    "\n",
    "fig, ax = plt.subplots(figsize=(7, 6))\n",
    "\n",
    "# Diagonale de reference\n",
    "ax.plot([0, 1], [0, 1], 'k--', linewidth=1.5,\n",
    "        label='Calibration parfaite', alpha=0.6)\n",
    "\n",
    "# SVM calibre\n",
    "frac_svm, pred_svm = calibration_curve(\n",
    "    y_test, y_proba_best, n_bins=10, strategy='uniform')\n",
    "ax.plot(pred_svm, frac_svm, 'o-',\n",
    "        color=NAVY, linewidth=2.2, markersize=7,\n",
    "        label=f'SVM calibre (AUC={roc_data[\"SVM\"][\"auc\"]:.3f})')\n",
    "\n",
    "# Regression Logistique pour comparaison\n",
    "y_proba_rl = modeles['Regression Logistique'].predict_proba(X_test)[:, 1] \\\n",
    "    if 'Regression Logistique' in modeles \\\n",
    "    else modeles[list(modeles.keys())[0]].predict_proba(X_test)[:, 1]\n",
    "y_proba_rl = modeles['Régression Logistique'].predict_proba(X_test)[:, 1]\n",
    "frac_rl, pred_rl = calibration_curve(\n",
    "    y_test, y_proba_rl, n_bins=10, strategy='uniform')\n",
    "ax.plot(pred_rl, frac_rl, 's--',\n",
    "        color=CORAL, linewidth=1.8, markersize=6, alpha=0.8,\n",
    "        label=f'Regression Logistique (AUC={roc_data[\"Régression Logistique\"][\"auc\"]:.3f})')\n",
    "\n",
    "ax.set_xlabel('Probabilite predite moyenne', fontsize=11)\n",
    "ax.set_ylabel('Fraction de cas positifs observes', fontsize=11)\n",
    "ax.set_title(\n",
    "    'Courbe de calibration --- SVM calibre vs Regression Logistique\\n'\n",
    "    '(proche de la diagonale = probabilites predites fiables)',\n",
    "    fontsize=11, fontweight='bold'\n",
    ")\n",
    "ax.legend(fontsize=10)\n",
    "ax.set_xlim(0, 1)\n",
    "ax.set_ylim(0, 1)\n",
    "plt.tight_layout()\n",
    "plt.savefig('../outputs/figures/fig_calibration_curve.png', bbox_inches='tight')\n",
    "plt.show()\n",
    "print('Figure sauvegardee : fig_calibration_curve.png')\n",
    "print()\n",
    "print('Interpretation :')\n",
    "print('  -> Courbe au-dessus de la diagonale : le modele SOUS-estime la probabilite')\n",
    "print('  -> Courbe en dessous : le modele SURESTIMÉ la probabilite')\n",
    "print('  -> Plus pres de la diagonale = probabilites plus fiables')\n",
])

# ── Cellule D : conclusion finale ──────────────────────────────────────────
c_conclusion = cell([
    "# ── Synthese finale pour le memoire ─────────────────────────────────────\n",
    "print('=' * 68)\n",
    "print('SYNTHESE COMPLETE --- ANALYSE ML · EDSC CAMEROUN 2018')\n",
    "print('=' * 68)\n",
    "print()\n",
    "print('DONNEES')\n",
    "print(f'  N = {N:,} femmes de 15-49 ans (EDSC-V 2018, INS Cameroun)')\n",
    "print(f'  Variable cible : desirer un enfant supplementaire')\n",
    "print(f'  Prevalence : {N_OUI/N*100:.1f}% desirent / {N_NON/N*100:.1f}% ne desirent pas')\n",
    "print(f'  Desequilibre corrige par SMOTE (train uniquement)')\n",
    "print()\n",
    "print('PIPELINE COMPLET')\n",
    "print('  1. Import (pyreadstat, CMIR71FL.SAV)')\n",
    "print('  2. Traitement (encodage, variables derivees, dropna)')\n",
    "print('  3. Separation X / y (10 variables explicatives / desir_bin)')\n",
    "print('  4. Split 80/20 stratifie')\n",
    "print('  5. SMOTE sur le train uniquement (jamais sur le test)')\n",
    "print('  6. Normalisation StandardScaler (pour SVM)')\n",
    "print('  7. Validation croisee 5-fold (StratifiedKFold)')\n",
    "print('  8. Evaluation : AUC, Accuracy, F1, gap overfitting')\n",
    "print('  9. Selection : meilleur AUC CV-5 parmi les modeles avec gap <= 0.15')\n",
    "print(' 10. Interpretation : Permutation Importance + courbe de calibration')\n",
    "print()\n",
    "print('RESULTATS --- 6 MODELES COMPARES')\n",
    "print('-' * 68)\n",
    "for _, row in synthese[['Modèle', 'AUC_CV5', 'AUC', 'Gap', 'Diagnostic']].iterrows():\n",
    "    flag = ' <-- RETENU' if row['Modèle'] == best_nom else ''\n",
    "    print(f\"  {row['Modèle']:<25} CV5={row['AUC_CV5']:.4f}  Test={row['AUC']:.4f}  Gap={row['Gap']:.4f}{flag}\")\n",
    "print()\n",
    "print(f'MODELE RETENU : {best_nom}')\n",
    "print(f'  AUC CV-5     = {best_row[\"AUC_CV5\"]:.4f}  (robustesse sur 5 folds)')\n",
    "print(f'  AUC test     = {best_row[\"AUC\"]:.4f}  (generalisation sur donnees inedites)')\n",
    "print(f'  Sensibilite  = {sensib:.1f}%  (femmes qui desirent, bien detectees)')\n",
    "print(f'  Specificite  = {specif:.1f}%  (classe minoritaire difficile)')\n",
    "print(f'  % bien classes = {pct_ok:.1f}%')\n",
    "print()\n",
    "print('FIGURES GENEREES POUR LE MEMOIRE')\n",
    "for fig_file in sorted(os.listdir('../outputs/figures/')):\n",
    "    print(f'  {fig_file}')\n",
    "print()\n",
    "print('Pipeline complet termine --- tous les fichiers sont dans outputs/')\n",
])

nb["cells"].extend([c_perm_calc, c_perm_fig, c_calib, c_conclusion])

with open(NB_PATH, "w", encoding="utf-8") as f:
    json.dump(nb, f, ensure_ascii=False, indent=1)

print(f"OK Notebook mis a jour : {len(nb['cells'])} cellules au total")
print("Cellules ajoutees :")
for c in nb["cells"][-4:]:
    print(f"  id={c['id']} -- {c['source'][0][:60].strip()}")
