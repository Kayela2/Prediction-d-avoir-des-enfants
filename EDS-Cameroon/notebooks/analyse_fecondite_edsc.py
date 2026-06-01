# %% [markdown]
# # Analyse des facteurs influençant le désir d'avoir d'autres enfants
# **Source : Enquête Démographique et de Santé du Cameroun (EDSC 2018)**
# **Master 1 — Chapitre 6 : Préférences en matière de fécondité**

# %% Imports & Configuration
import pandas as pd
import numpy as np
import pyreadstat
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import chi2_contingency
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, roc_auc_score, classification_report, roc_curve)
import warnings
import os

warnings.filterwarnings('ignore')
os.makedirs("../outputs/figures", exist_ok=True)
os.makedirs("../outputs/tables",  exist_ok=True)

plt.rcParams['figure.dpi'] = 130
sns.set_theme(style='whitegrid', palette='Set2')
print("✓ Packages chargés")

# %% ÉTAPE 1 — Chargement des données
df, meta = pyreadstat.read_sav("../data/CMIR71FL.SAV")
df.columns = df.columns.str.lower()
print(f"Données brutes : {df.shape[0]:,} femmes | {df.shape[1]} variables")

# %% ÉTAPE 2 — Sélection et renommage des variables
variables_dhs = {
    'v005': 'poids_sondage',
    'v012': 'age',
    'v106': 'niveau_instruction',
    'v201': 'nb_enfants_total',
    'v218': 'nb_enfants_vivants',
    'v313': 'utilisation_contraceptif',
    'v501': 'statut_matrimonial',
    'v025': 'milieu_residence',
    'v024': 'region',
    'v130': 'religion',
    'v714': 'travail',
    'v511': 'age_premier_mariage',
    'v190': 'quintile_richesse',
    'v602': 'desir_enfant',
}
cols_ok = [c for c in variables_dhs if c in df.columns]
df = df[cols_ok].rename(columns=variables_dhs)
print(f"Variables retenues ({len(df.columns)}) : {list(df.columns)}")

# %% ÉTAPE 3 — Nettoyage et préparation
# Variable cible binaire
# v602 : 1=veut <2 ans  2=veut >2 ans  3=veut (ne sait quand) → désire (1)
#         4=indécise  5=ne veut plus  6-8=stérilisée/inféconde → ne désire pas (0)
df['desir_enfant_bin'] = df['desir_enfant'].apply(
    lambda x: 1 if x in [1, 2, 3] else (0 if x in [4, 5, 6, 7, 8] else np.nan)
)
df = df[df['desir_enfant_bin'].notna()].copy()

df['poids']          = df['poids_sondage'] / 1_000_000
df['contraceptif_bin'] = (df['utilisation_contraceptif'] > 0).astype(int)
df['tranche_age']    = pd.cut(df['age'],
                               bins=[14, 19, 24, 29, 34, 39, 44, 49],
                               labels=['15-19','20-24','25-29','30-34','35-39','40-44','45-49'])
df['niveau_instr_lbl'] = df['niveau_instruction'].map({0:'Aucun',1:'Primaire',2:'Secondaire',3:'Supérieur'})
df['residence_lbl']    = df['milieu_residence'].map({1:'Urbain', 2:'Rural'})
df['desir_lbl']        = df['desir_enfant_bin'].map({1:'Désire un enfant', 0:'Ne désire pas'})

# Nouvelles variables binaires (Cameroun : clivage Nord/Sud et religieux)
# Régions septentrionales : Adamaoua (1), Extrême-Nord (4), Nord (6)
df['region_nord']       = df['region'].isin([1, 4, 6]).astype(int)
# Religion musulmane vs non-musulmane
df['religion_musulman'] = (df['religion'] == 4).astype(int)
# Travail (v714) est déjà 0/1

dist = df['desir_enfant_bin'].value_counts(normalize=True) * 100
print(f"Effectif final : {df.shape[0]:,} femmes")
print(f"  Désire un autre enfant : {dist.get(1,0):.1f} %")
print(f"  Ne désire pas          : {dist.get(0,0):.1f} %")

# %% ÉTAPE 4 — Statistiques descriptives
desc = df[['age','nb_enfants_vivants','nb_enfants_total']].describe().round(2)
desc.to_csv("../outputs/tables/01_stats_descriptives.csv")
print("=== Variables continues ===")
print(desc)

print("\n=== Niveau d'instruction (%) ===")
print((df['niveau_instr_lbl'].value_counts(normalize=True)*100).round(1).to_string())

print("\n=== Milieu de résidence (%) ===")
print((df['residence_lbl'].value_counts(normalize=True)*100).round(1).to_string())

# %% FIGURE 1 — Distribution de la variable cible
fig, ax = plt.subplots(figsize=(7, 5))
counts = df['desir_lbl'].value_counts()
bars = ax.bar(counts.index, counts.values,
              color=['#2196F3','#FF5722'], edgecolor='white', linewidth=1.5)
for bar, val in zip(bars, counts.values):
    pct = val / len(df) * 100
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 50,
            f'{val:,}\n({pct:.1f}%)', ha='center', va='bottom', fontsize=11)
ax.set_title("Distribution du désir d'avoir un autre enfant\n(Cameroun EDSC 2018)",
             fontsize=13, fontweight='bold')
ax.set_ylabel("Nombre de femmes")
plt.tight_layout()
plt.savefig("../outputs/figures/fig1_variable_cible.png")
plt.show()

# %% FIGURE 2 — Désir par tranche d'âge
fig, ax = plt.subplots(figsize=(10, 5))
age_desir = df.groupby('tranche_age', observed=True)['desir_enfant_bin'].mean() * 100
age_desir.plot(kind='bar', ax=ax, color='#1565C0', edgecolor='white')
ax.set_title("Désir d'un autre enfant par tranche d'âge (%)", fontsize=13, fontweight='bold')
ax.set_ylabel("% désirant un autre enfant")
ax.set_xlabel("Tranche d'âge")
ax.set_xticklabels(ax.get_xticklabels(), rotation=0)
for p in ax.patches:
    ax.annotate(f"{p.get_height():.1f}%",
                (p.get_x() + p.get_width()/2, p.get_height()),
                ha='center', va='bottom', fontsize=9)
plt.tight_layout()
plt.savefig("../outputs/figures/fig2_desir_par_age.png")
plt.show()

# %% FIGURE 3 — Désir par niveau d'instruction
fig, ax = plt.subplots(figsize=(8, 5))
ordre = ['Aucun','Primaire','Secondaire','Supérieur']
instr_d = df.groupby('niveau_instr_lbl')['desir_enfant_bin'].mean() * 100
instr_d = instr_d.reindex([x for x in ordre if x in instr_d.index])
instr_d.plot(kind='bar', ax=ax, color='#388E3C', edgecolor='white')
ax.set_title("Désir d'un autre enfant par niveau d'instruction (%)", fontsize=13, fontweight='bold')
ax.set_ylabel("% désirant un autre enfant")
ax.set_xlabel("Niveau d'instruction")
ax.set_xticklabels(ax.get_xticklabels(), rotation=0)
for p in ax.patches:
    ax.annotate(f"{p.get_height():.1f}%",
                (p.get_x() + p.get_width()/2, p.get_height()),
                ha='center', va='bottom', fontsize=9)
plt.tight_layout()
plt.savefig("../outputs/figures/fig3_desir_par_instruction.png")
plt.show()

# %% FIGURE 4 — Désir par nombre d'enfants vivants
fig, ax = plt.subplots(figsize=(10, 5))
nbe = df[df['nb_enfants_vivants'] <= 8].groupby('nb_enfants_vivants')['desir_enfant_bin'].mean() * 100
nbe.plot(kind='bar', ax=ax, color='#F57C00', edgecolor='white')
ax.set_title("Désir d'un autre enfant par nombre d'enfants vivants (%)", fontsize=13, fontweight='bold')
ax.set_ylabel("% désirant un autre enfant")
ax.set_xlabel("Nombre d'enfants vivants")
ax.set_xticklabels(ax.get_xticklabels(), rotation=0)
for p in ax.patches:
    ax.annotate(f"{p.get_height():.1f}%",
                (p.get_x() + p.get_width()/2, p.get_height()),
                ha='center', va='bottom', fontsize=9)
plt.tight_layout()
plt.savefig("../outputs/figures/fig4_desir_par_nb_enfants.png")
plt.show()

# %% FIGURE 5 — Résidence et contraceptifs
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

res_d = df.groupby('residence_lbl')['desir_enfant_bin'].mean() * 100
res_d.plot(kind='bar', ax=axes[0], color=['#7B1FA2','#C2185B'], edgecolor='white')
axes[0].set_title("Par milieu de résidence", fontsize=12, fontweight='bold')
axes[0].set_ylabel("% désirant un autre enfant")
axes[0].set_xticklabels(axes[0].get_xticklabels(), rotation=0)
for p in axes[0].patches:
    axes[0].annotate(f"{p.get_height():.1f}%",
                     (p.get_x() + p.get_width()/2, p.get_height()),
                     ha='center', va='bottom', fontsize=11)

contra_d = df.groupby('contraceptif_bin')['desir_enfant_bin'].mean() * 100
contra_d.index = ['Sans contraceptif','Avec contraceptif']
contra_d.plot(kind='bar', ax=axes[1], color=['#0097A7','#E64A19'], edgecolor='white')
axes[1].set_title("Par utilisation de contraceptifs", fontsize=12, fontweight='bold')
axes[1].set_ylabel("% désirant un autre enfant")
axes[1].set_xticklabels(axes[1].get_xticklabels(), rotation=0)
for p in axes[1].patches:
    axes[1].annotate(f"{p.get_height():.1f}%",
                     (p.get_x() + p.get_width()/2, p.get_height()),
                     ha='center', va='bottom', fontsize=11)

fig.suptitle("Désir d'un autre enfant selon le contexte", fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig("../outputs/figures/fig5_residence_contraceptif.png")
plt.show()

# %% FIGURE 6 — Heatmap de corrélation
fig, ax = plt.subplots(figsize=(9, 7))
vars_corr = ['desir_enfant_bin','age','niveau_instruction','nb_enfants_vivants',
             'contraceptif_bin','milieu_residence','quintile_richesse']
corr_df = df[vars_corr].dropna().corr()
labels  = ['Désir enfant','Âge','Niveau instruction','Nb enfants vivants',
           'Contraceptif','Milieu résidence','Quintile richesse']
sns.heatmap(corr_df, annot=True, fmt='.2f', cmap='coolwarm', center=0,
            xticklabels=labels, yticklabels=labels, ax=ax,
            linewidths=0.5, square=True)
ax.set_title("Matrice de corrélation entre les variables", fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig("../outputs/figures/fig6_heatmap_correlation.png")
plt.show()

# %% ÉTAPE 6 — Tests d'indépendance (Chi²)
vars_chi2 = {
    'tranche_age'        : "Tranche d'âge",
    'niveau_instr_lbl'   : "Niveau d'instruction",
    'residence_lbl'      : "Milieu de résidence",
    'contraceptif_bin'   : "Utilisation de contraceptifs",
    'statut_matrimonial' : "Statut matrimonial",
    'quintile_richesse'  : "Quintile de richesse",
    'religion'           : "Religion",
    'travail'            : "Emploi (travail)",
    'region_nord'        : "Région septentrionale",
    'religion_musulman'  : "Religion musulmane",
}
resultats_chi2 = []
for var, label in vars_chi2.items():
    if var in df.columns:
        tab = pd.crosstab(df[var], df['desir_enfant_bin'])
        chi2, p, dof, _ = chi2_contingency(tab)
        sig = '***' if p < 0.001 else ('**' if p < 0.01 else ('*' if p < 0.05 else 'NS'))
        resultats_chi2.append({'Variable': label, 'Chi²': round(chi2,2),
                                'ddl': dof, 'p-value': round(p,4), 'Sig.': sig})

chi2_df = pd.DataFrame(resultats_chi2)
chi2_df.to_csv("../outputs/tables/02_tests_chi2.csv", index=False)
print(chi2_df.to_string(index=False))

# %% ÉTAPE 7 — Régression logistique binaire (statsmodels)
vars_modele = ['age', 'niveau_instruction', 'nb_enfants_vivants',
               'contraceptif_bin', 'statut_matrimonial', 'milieu_residence',
               'quintile_richesse', 'travail', 'region_nord', 'religion_musulman']

df_mod  = df[vars_modele + ['desir_enfant_bin']].dropna()
X_stat  = sm.add_constant(df_mod[vars_modele].astype(float))
y_stat  = df_mod['desir_enfant_bin'].astype(float)
logit   = sm.Logit(y_stat, X_stat).fit(disp=False)

params, conf, pvals = logit.params, logit.conf_int(), logit.pvalues
or_table = pd.DataFrame({
    'Variable'   : params.index,
    'β (Coeff)'  : params.round(4),
    'Odds Ratio' : np.exp(params).round(4),
    'IC 95% Inf' : np.exp(conf[0]).round(4),
    'IC 95% Sup' : np.exp(conf[1]).round(4),
    'p-value'    : pvals.round(4),
    'Sig.'       : pvals.apply(lambda p: '***' if p<0.001 else ('**' if p<0.01 else ('*' if p<0.05 else 'NS')))
})
or_table.to_csv("../outputs/tables/03_odds_ratio.csv", index=False)
print(or_table.drop('Variable', axis=1).to_string())
print(f"\nPseudo R² (McFadden) : {logit.prsquared:.4f}")
print(f"AIC : {logit.aic:.2f}  |  BIC : {logit.bic:.2f}")

# %% FIGURE 7 — Forest Plot des Odds Ratio
fig, ax = plt.subplots(figsize=(9, 6))
or_plot = or_table[or_table['Variable'] != 'const'].copy()
y_pos   = range(len(or_plot))
ax.errorbar(or_plot['Odds Ratio'], list(y_pos),
            xerr=[or_plot['Odds Ratio'] - or_plot['IC 95% Inf'],
                  or_plot['IC 95% Sup'] - or_plot['Odds Ratio']],
            fmt='o', color='#1565C0', ecolor='#90A4AE',
            capsize=5, markersize=8, linewidth=1.5)
ax.axvline(x=1, color='red', linestyle='--', linewidth=1.5, label='OR = 1 (référence)')
ax.set_yticks(list(y_pos))
ax.set_yticklabels(or_plot['Variable'])
ax.set_xlabel("Odds Ratio (IC 95%)")
ax.set_title("Forest Plot — Régression logistique\nFacteurs du désir d'avoir un autre enfant",
             fontsize=13, fontweight='bold')
ax.legend()
plt.tight_layout()
plt.savefig("../outputs/figures/fig7_forest_plot_OR.png")
plt.show()

# %% VIF — Test de multicolinéarité
vif = pd.DataFrame({
    'Variable' : vars_modele,
    'VIF'      : [variance_inflation_factor(df_mod[vars_modele].astype(float).values, i)
                  for i in range(len(vars_modele))],
})
vif['Statut'] = vif['VIF'].apply(
    lambda v: 'OK (<5)' if v < 5 else ('Modéré' if v < 10 else 'Problème (>10)'))
vif.to_csv("../outputs/tables/04_vif.csv", index=False)
print(vif.round(2).to_string(index=False))

# %% ÉTAPE 8 — Machine Learning : préparation
X_ml = df_mod[vars_modele].astype(float)
y_ml = df_mod['desir_enfant_bin'].astype(int)
X_train, X_test, y_train, y_test = train_test_split(
    X_ml, y_ml, test_size=0.2, random_state=42, stratify=y_ml)
print(f"Entraînement : {len(X_train):,} obs. | Test : {len(X_test):,} obs.")

modeles_ml = {
    'Régression Logistique' : LogisticRegression(max_iter=1000, random_state=42),
    'Random Forest'         : RandomForestClassifier(n_estimators=100, random_state=42),
    'Decision Tree'         : DecisionTreeClassifier(max_depth=5, random_state=42),
}
resultats_ml = []
for nom, clf in modeles_ml.items():
    clf.fit(X_train, y_train)
    y_pred  = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]
    acc     = accuracy_score(y_test, y_pred)
    auc     = roc_auc_score(y_test, y_proba)
    resultats_ml.append({'Modèle': nom, 'Accuracy': round(acc,4), 'ROC-AUC': round(auc,4)})
    print(f"\n{'─'*45}\n{nom}")
    print(f"  Accuracy : {acc:.4f}  |  ROC-AUC : {auc:.4f}")
    print(classification_report(y_test, y_pred,
                                target_names=['Ne désire pas','Désire un enfant']))

ml_df = pd.DataFrame(resultats_ml)
ml_df.to_csv("../outputs/tables/05_comparaison_modeles.csv", index=False)

# %% FIGURE 8 — Courbes ROC
fig, ax = plt.subplots(figsize=(8, 6))
for (nom, clf), color in zip(modeles_ml.items(), ['#1565C0','#2E7D32','#E65100']):
    y_proba = clf.predict_proba(X_test)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    auc = roc_auc_score(y_test, y_proba)
    ax.plot(fpr, tpr, label=f"{nom} (AUC = {auc:.3f})", color=color, linewidth=2)
ax.plot([0,1],[0,1], 'k--', linewidth=1, label='Modèle aléatoire')
ax.set_xlabel("Taux de faux positifs (1 - Spécificité)")
ax.set_ylabel("Taux de vrais positifs (Sensibilité)")
ax.set_title("Courbes ROC — Comparaison des modèles ML", fontsize=13, fontweight='bold')
ax.legend(loc='lower right')
plt.tight_layout()
plt.savefig("../outputs/figures/fig8_roc_curves.png")
plt.show()

# %% FIGURE 9 — Importance des variables (Random Forest)
fig, ax = plt.subplots(figsize=(8, 5))
rf = modeles_ml['Random Forest']
var_labels = {
    'age': 'Âge', 'niveau_instruction': "Niveau d'instruction",
    'nb_enfants_vivants': 'Nb enfants vivants', 'contraceptif_bin': 'Contraceptif',
    'statut_matrimonial': 'Statut matrimonial',
    'milieu_residence': 'Milieu de résidence', 'quintile_richesse': 'Quintile richesse',
    'travail': 'Emploi (travail)',
    'region_nord': 'Région septentrionale',
    'religion_musulman': 'Religion musulmane',
}
importances = pd.Series(rf.feature_importances_, index=vars_modele).sort_values(ascending=True)
importances.index = [var_labels.get(i, i) for i in importances.index]
importances.plot(kind='barh', ax=ax, color='#2E7D32', edgecolor='white')
ax.set_title("Importance des variables — Random Forest", fontsize=13, fontweight='bold')
ax.set_xlabel("Importance (Gini)")
for p in ax.patches:
    ax.annotate(f"{p.get_width():.3f}",
                (p.get_width(), p.get_y() + p.get_height()/2),
                ha='left', va='center', fontsize=9)
plt.tight_layout()
plt.savefig("../outputs/figures/fig9_importance_variables.png")
plt.show()

# %% FIGURE 10 — Comparaison des performances
fig, ax = plt.subplots(figsize=(9, 5))
x = np.arange(len(ml_df))
w = 0.35
b1 = ax.bar(x - w/2, ml_df['Accuracy'], w, label='Accuracy', color='#1565C0', edgecolor='white')
b2 = ax.bar(x + w/2, ml_df['ROC-AUC'],  w, label='ROC-AUC',  color='#E65100', edgecolor='white')
ax.set_xticks(x)
ax.set_xticklabels(ml_df['Modèle'], rotation=10, ha='right')
ax.set_ylim(0, 1)
ax.set_ylabel("Score")
ax.set_title("Comparaison des performances des modèles ML", fontsize=13, fontweight='bold')
ax.legend()
for bar in list(b1) + list(b2):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
            f"{bar.get_height():.3f}", ha='center', va='bottom', fontsize=9)
plt.tight_layout()
plt.savefig("../outputs/figures/fig10_comparaison_modeles.png")
plt.show()

# %% Résumé final
print("=" * 55)
print("ANALYSE TERMINÉE — FICHIERS GÉNÉRÉS")
print("=" * 55)
print("\nTableaux → outputs/tables/")
for f in sorted(os.listdir("../outputs/tables")):
    print(f"  ✓ {f}")
print("\nFigures  → outputs/figures/")
for f in sorted(os.listdir("../outputs/figures")):
    print(f"  ✓ {f}")


