# %% [markdown]
# # Statistiques completes pour document academique
# EDSC Cameroun 2018 — Preferences en matiere de fecondite
# Genere toutes les tables necessaires pour le memoire Word

# %% Imports
import pandas as pd
import numpy as np
import pyreadstat
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from scipy.stats import chi2_contingency, mannwhitneyu, ttest_ind
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
import warnings
import os

warnings.filterwarnings('ignore')
os.makedirs("../outputs/figures", exist_ok=True)
os.makedirs("../outputs/tables", exist_ok=True)

plt.rcParams['figure.dpi'] = 150
plt.rcParams['font.family'] = 'DejaVu Sans'
sns.set_theme(style='whitegrid', palette='Set2')

# ============================================================
# CHARGEMENT ET PREPARATION DES DONNEES
# (meme code que le script principal)
# ============================================================

df, meta = pyreadstat.read_sav("../data/CMIR71FL.SAV")
df.columns = df.columns.str.lower()

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

# Variable cible
df['desir_enfant_bin'] = df['desir_enfant'].apply(
    lambda x: 1 if x in [1, 2, 3] else (0 if x in [4, 5, 6, 7, 8] else np.nan)
)
df = df[df['desir_enfant_bin'].notna()].copy()

# Poids de sondage (normalise)
df['poids'] = df['poids_sondage'] / 1_000_000

# Variables derivees
df['contraceptif_bin'] = (df['utilisation_contraceptif'] > 0).astype(int)

df['tranche_age'] = pd.cut(df['age'],
    bins=[14, 19, 24, 29, 34, 39, 44, 49],
    labels=['15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49'])

df['niveau_instr_lbl'] = df['niveau_instruction'].map(
    {0: 'Aucun', 1: 'Primaire', 2: 'Secondaire', 3: 'Superieur'})

df['residence_lbl'] = df['milieu_residence'].map({1: 'Urbain', 2: 'Rural'})

df['statut_mat_lbl'] = df['statut_matrimonial'].map(
    {0: 'Jamais marie(e)', 1: 'Marie(e)', 2: 'En union libre',
     3: 'Veuf/Veuve', 4: 'Divorce(e)', 5: 'Separe(e)'})

df['religion_lbl'] = df['religion'].map(
    {1: 'Catholique', 2: 'Protestant', 3: 'Autres chretiens',
     4: 'Musulman', 5: 'Animiste', 6: 'Sans religion', 96: 'Autre'})

df['quintile_lbl'] = df['quintile_richesse'].map(
    {1: 'Le plus pauvre', 2: 'Pauvre', 3: 'Moyen', 4: 'Riche', 5: 'Le plus riche'})

df['contraceptif_lbl'] = df['contraceptif_bin'].map(
    {0: 'N utilise pas', 1: 'Utilise'})

df['desir_lbl'] = df['desir_enfant_bin'].map(
    {1: 'Desire un enfant', 0: 'Ne desire pas'})

df['travail_lbl'] = df['travail'].map({0: 'Non', 1: 'Oui'})

# Nouvelles variables binaires (clivage démographique camerounais)
# Régions septentrionales : Adamaoua (1), Extrême-Nord (4), Nord (6)
df['region_nord']       = df['region'].isin([1, 4, 6]).astype(int)
df['region_nord_lbl']   = df['region_nord'].map({1: 'Septentrional', 0: 'Autre region'})
# Religion musulmane
df['religion_musulman'] = (df['religion'] == 4).astype(int)
df['religion_musulman_lbl'] = df['religion_musulman'].map({1: 'Musulmane', 0: 'Non musulmane'})

n_total = len(df)
print(f"Effectif total analyse : {n_total:,} femmes")
print(f"Desire un enfant : {df['desir_enfant_bin'].mean()*100:.1f}%")
print(f"Ne desire pas    : {(1-df['desir_enfant_bin'].mean())*100:.1f}%")

# ============================================================
# TABLE 1 — PRESENTATION DE L'ECHANTILLON
# Frequences et pourcentages de chaque variable
# ============================================================
print("\n" + "="*60)
print("TABLE 1 : CARACTERISTIQUES SOCIO-DEMOGRAPHIQUES")
print("="*60)

def freq_table(series, label_col="Modalite"):
    """Tableau de frequences : effectif + pourcentage."""
    counts = series.value_counts(dropna=True)
    pct    = series.value_counts(normalize=True, dropna=True) * 100
    t = pd.DataFrame({label_col: counts.index, 'Effectif': counts.values,
                      'Pourcentage (%)': pct.values.round(1)})
    return t.reset_index(drop=True)

sections = {}

# Tranche d'age
t_age = freq_table(df['tranche_age'], "Tranche d'age")
sections["Tranche d'age"] = t_age

# Niveau d'instruction
ordre_instr = ['Aucun', 'Primaire', 'Secondaire', 'Superieur']
t_instr = freq_table(df['niveau_instr_lbl'], "Niveau d'instruction")
t_instr['_ord'] = t_instr["Niveau d'instruction"].map(
    {v: i for i, v in enumerate(ordre_instr)})
t_instr = t_instr.sort_values('_ord').drop('_ord', axis=1).reset_index(drop=True)
sections["Niveau d'instruction"] = t_instr

# Milieu de residence
sections["Milieu de residence"] = freq_table(df['residence_lbl'], "Milieu de residence")

# Statut matrimonial
sections["Statut matrimonial"] = freq_table(df['statut_mat_lbl'], "Statut matrimonial")

# Religion
sections["Religion"] = freq_table(df['religion_lbl'], "Religion")

# Quintile de richesse
ordre_q = ['Le plus pauvre', 'Pauvre', 'Moyen', 'Riche', 'Le plus riche']
t_q = freq_table(df['quintile_lbl'], "Quintile de richesse")
t_q['_ord'] = t_q["Quintile de richesse"].map({v: i for i, v in enumerate(ordre_q)})
t_q = t_q.sort_values('_ord').drop('_ord', axis=1).reset_index(drop=True)
sections["Quintile de richesse"] = t_q

# Utilisation contraceptif
sections["Utilisation contraceptif"] = freq_table(df['contraceptif_lbl'],
                                                   "Utilisation contraceptif")

# Travail
if 'travail_lbl' in df.columns:
    sections["Activite professionnelle"] = freq_table(df['travail_lbl'],
                                                       "Activite professionnelle")

# Affichage
for nom, t in sections.items():
    print(f"\n--- {nom} ---")
    print(t.to_string(index=False))

# Variables continues : resume
print("\n--- Variables continues ---")
cont_vars = df[['age', 'nb_enfants_vivants', 'nb_enfants_total']].copy()
cont_vars.columns = ['Age', 'Nb enfants vivants', 'Nb enfants total']
resume_cont = cont_vars.describe().round(2)
resume_cont.index = ['N', 'Moyenne', 'Ecart-type', 'Min', 'Q1', 'Mediane', 'Q3', 'Max']
print(resume_cont.to_string())

# ============================================================
# TABLE 2 — ANALYSE BIVARIEE
# % desire un enfant par modalite de chaque variable
# ============================================================
print("\n" + "="*60)
print("TABLE 2 : ANALYSE BIVARIEE (% desire un autre enfant)")
print("="*60)

vars_biv = {
    "Tranche d'age"        : 'tranche_age',
    "Niveau d'instruction" : 'niveau_instr_lbl',
    "Milieu de residence"  : 'residence_lbl',
    "Statut matrimonial"   : 'statut_mat_lbl',
    "Religion"             : 'religion_lbl',
    "Quintile de richesse" : 'quintile_lbl',
    "Utilisation contraceptif": 'contraceptif_lbl',
    "Emploi (travail)"     : 'travail_lbl',
    "Region septentrionale": 'region_nord_lbl',
    "Religion musulmane"   : 'religion_musulman_lbl',
}

rows_biv = []
for label, col in vars_biv.items():
    if col not in df.columns:
        continue
    grp = df.groupby(col, observed=True)['desir_enfant_bin']
    for modalite, g in grp:
        n    = len(g)
        n1   = g.sum()
        n0   = n - n1
        pct1 = n1 / n * 100
        pct0 = n0 / n * 100
        rows_biv.append({
            'Variable'         : label,
            'Modalite'         : str(modalite),
            'N total'          : n,
            'Desire (n)'       : int(n1),
            'Desire (%)'       : round(pct1, 1),
            'Ne desire pas (n)': int(n0),
            'Ne desire pas (%)': round(pct0, 1),
        })

biv_df = pd.DataFrame(rows_biv)
print(biv_df.to_string(index=False))

# ============================================================
# TABLE 3 — TESTS CHI-CARRE + Cramer's V
# ============================================================
print("\n" + "="*60)
print("TABLE 3 : TESTS D'INDEPENDANCE (Chi-carre)")
print("="*60)

def cramers_v(chi2, n, k, r):
    """Cramer's V : taille d'effet pour le chi-carre."""
    return np.sqrt(chi2 / (n * (min(k, r) - 1)))

rows_chi2 = []
for label, col in vars_biv.items():
    if col not in df.columns:
        continue
    tab = pd.crosstab(df[col], df['desir_enfant_bin'])
    chi2, p, dof, _ = chi2_contingency(tab)
    r, k = tab.shape
    cv   = cramers_v(chi2, len(df), k, r)
    sig  = '***' if p < 0.001 else ('**' if p < 0.01 else ('*' if p < 0.05 else 'NS'))
    interp = ('Tres forte' if cv > 0.5 else
              ('Forte' if cv > 0.3 else
               ('Moderee' if cv > 0.1 else 'Faible')))
    rows_chi2.append({
        'Variable'   : label,
        'Chi2'       : round(chi2, 2),
        'ddl'        : dof,
        'p-value'    : round(p, 4),
        'Sig.'       : sig,
        "Cramer's V" : round(cv, 3),
        'Interpretation': interp,
    })

chi2_df = pd.DataFrame(rows_chi2)
print(chi2_df.to_string(index=False))

# Test Mann-Whitney pour les variables continues
print("\n--- Test de comparaison (Mann-Whitney U) pour variables continues ---")
rows_mw = []
for var_cont, label_cont in [('age', 'Age'),
                               ('nb_enfants_vivants', 'Nb enfants vivants'),
                               ('nb_enfants_total', 'Nb enfants total')]:
    g1 = df[df['desir_enfant_bin'] == 1][var_cont].dropna()
    g0 = df[df['desir_enfant_bin'] == 0][var_cont].dropna()
    stat, p = mannwhitneyu(g1, g0, alternative='two-sided')
    sig  = '***' if p < 0.001 else ('**' if p < 0.01 else ('*' if p < 0.05 else 'NS'))
    rows_mw.append({
        'Variable'            : label_cont,
        'Moy. (Desire)'       : round(g1.mean(), 2),
        'Moy. (Ne desire pas)': round(g0.mean(), 2),
        'Stat U'              : round(stat, 0),
        'p-value'             : round(p, 4),
        'Sig.'                : sig,
    })

mw_df = pd.DataFrame(rows_mw)
print(mw_df.to_string(index=False))

# ============================================================
# TABLE 4 — REGRESSION LOGISTIQUE COMPLETE
# ============================================================
print("\n" + "="*60)
print("TABLE 4 : REGRESSION LOGISTIQUE BINAIRE")
print("="*60)

vars_modele = ['age', 'niveau_instruction', 'nb_enfants_vivants',
               'contraceptif_bin', 'statut_matrimonial', 'milieu_residence',
               'quintile_richesse', 'travail', 'region_nord', 'religion_musulman']

labels_vars = {
    'const'               : 'Constante',
    'age'                 : 'Age',
    'niveau_instruction'  : "Niveau d'instruction",
    'nb_enfants_vivants'  : 'Nb enfants vivants',
    'contraceptif_bin'    : 'Utilisation contraceptif',
    'statut_matrimonial'  : 'Statut matrimonial',
    'milieu_residence'    : 'Milieu de residence',
    'quintile_richesse'   : 'Quintile de richesse',
    'travail'             : 'Emploi (travail)',
    'region_nord'         : 'Region septentrionale',
    'religion_musulman'   : 'Religion musulmane',
}

df_mod = df[vars_modele + ['desir_enfant_bin']].dropna()
X_stat = sm.add_constant(df_mod[vars_modele].astype(float))
y_stat = df_mod['desir_enfant_bin'].astype(float)

logit  = sm.Logit(y_stat, X_stat).fit(disp=False)

params = logit.params
conf   = logit.conf_int()
pvals  = logit.pvalues

# Pseudo R-carres
mcfadden    = logit.prsquared
llnull      = logit.llnull
llmodel     = logit.llf
cox_snell   = 1 - np.exp(2 * (llnull - llmodel) / len(y_stat))
nagelkerke  = cox_snell / (1 - np.exp(2 * llnull / len(y_stat)))

or_table = pd.DataFrame({
    'Variable'      : [labels_vars.get(v, v) for v in params.index],
    'Beta (coeff)'  : params.round(4).values,
    'Odds Ratio'    : np.exp(params).round(4).values,
    'IC 95% inf'    : np.exp(conf[0]).round(4).values,
    'IC 95% sup'    : np.exp(conf[1]).round(4).values,
    'p-value'       : pvals.round(4).values,
    'Sig.'          : pvals.apply(
        lambda p: '***' if p < 0.001 else ('**' if p < 0.01 else ('*' if p < 0.05 else 'NS'))).values,
})

print(or_table.to_string(index=False))
print(f"\nIndicateurs globaux du modele :")
print(f"  N observations     : {int(logit.nobs):,}")
print(f"  Log-vraisemblance  : {logit.llf:.4f}")
print(f"  AIC                : {logit.aic:.2f}")
print(f"  BIC                : {logit.bic:.2f}")
print(f"  Pseudo R2 McFadden : {mcfadden:.4f}  ({mcfadden*100:.1f}%)")
print(f"  Pseudo R2 Cox-Snell: {cox_snell:.4f}  ({cox_snell*100:.1f}%)")
print(f"  Pseudo R2 Nagelkerke: {nagelkerke:.4f}  ({nagelkerke*100:.1f}%)")

# Test de Hosmer-Lemeshow
y_pred_prob = logit.predict(X_stat)
n_groups    = 10
quantiles   = pd.qcut(y_pred_prob, n_groups, duplicates='drop')
hl_groups   = df_mod.copy()
hl_groups['pred_prob'] = y_pred_prob.values
hl_groups['group']     = quantiles.values

hl_table = hl_groups.groupby('group', observed=True).agg(
    n=('desir_enfant_bin', 'count'),
    obs_1=('desir_enfant_bin', 'sum'),
    mean_pred=('pred_prob', 'mean')
).reset_index()
hl_table['exp_1'] = hl_table['mean_pred'] * hl_table['n']
hl_table['obs_0'] = hl_table['n'] - hl_table['obs_1']
hl_table['exp_0'] = hl_table['n'] - hl_table['exp_1']

hl_chi2 = (((hl_table['obs_1'] - hl_table['exp_1'])**2 / hl_table['exp_1']) +
            ((hl_table['obs_0'] - hl_table['exp_0'])**2 / hl_table['exp_0'])).sum()

from scipy.stats import chi2 as chi2_dist
hl_p = 1 - chi2_dist.cdf(hl_chi2, df=n_groups - 2)
print(f"\nTest de Hosmer-Lemeshow :")
print(f"  Chi2 = {hl_chi2:.4f}  |  p-value = {hl_p:.4f}")
print(f"  Interpretation : {'Bon ajustement (p > 0.05)' if hl_p > 0.05 else 'Ajustement a verifier (p <= 0.05)'}")

# Tableau de classification
from sklearn.metrics import confusion_matrix, classification_report
y_pred_class = (y_pred_prob >= 0.5).astype(int)
cm = confusion_matrix(y_stat, y_pred_class)
tn, fp, fn, tp = cm.ravel()
sensibilite  = tp / (tp + fn) * 100
specificite  = tn / (tn + fp) * 100
pct_correct  = (tp + tn) / len(y_stat) * 100

print(f"\nTableau de classification (seuil = 0.5) :")
print(f"  Vrais positifs (VP)  : {tp:,}   Vrais negatifs (VN)  : {tn:,}")
print(f"  Faux positifs (FP)   : {fp:,}   Faux negatifs (FN)   : {fn:,}")
print(f"  Sensibilite          : {sensibilite:.1f}%")
print(f"  Specificite          : {specificite:.1f}%")
print(f"  % bien classes       : {pct_correct:.1f}%")

# ============================================================
# TABLE 5 — VIF (multicolinearite)
# ============================================================
print("\n" + "="*60)
print("TABLE 5 : TEST DE MULTICOLINEARITE (VIF)")
print("="*60)

vif_df = pd.DataFrame({
    'Variable': [labels_vars.get(v, v) for v in vars_modele],
    'VIF'     : [variance_inflation_factor(
                    df_mod[vars_modele].astype(float).values, i)
                 for i in range(len(vars_modele))],
})
vif_df['Statut'] = vif_df['VIF'].apply(
    lambda v: 'Pas de probleme (<5)' if v < 5
    else ('Modere (5-10)'   if v < 10
    else  'Probleme (>10)'))
vif_df['VIF'] = vif_df['VIF'].round(3)
print(vif_df.to_string(index=False))

# ============================================================
# EXPORT EXCEL — 1 fichier, 1 onglet par tableau
# ============================================================
print("\n" + "="*60)
print("EXPORT EXCEL")
print("="*60)

excel_path = "../outputs/tables/RESULTATS_COMPLETS_EDSC2018.xlsx"

with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:

    # Onglet 0 : resume echantillon
    resume_rows = [{'Information': 'Effectif total', 'Valeur': f"{n_total:,}"},
                   {'Information': 'Desire un autre enfant',
                    'Valeur': f"{df['desir_enfant_bin'].sum():,} ({df['desir_enfant_bin'].mean()*100:.1f}%)"},
                   {'Information': 'Ne desire pas',
                    'Valeur': f"{(df['desir_enfant_bin']==0).sum():,} ({(1-df['desir_enfant_bin'].mean())*100:.1f}%)"},
                   {'Information': 'Source', 'Valeur': 'EDSC Cameroun 2018'},
                   {'Information': 'Population cible', 'Valeur': 'Femmes 15-49 ans'},]
    pd.DataFrame(resume_rows).to_excel(writer, sheet_name='Resume', index=False)

    # Onglet 1 : statistiques descriptives continues
    resume_cont_export = cont_vars.describe().round(2)
    resume_cont_export.index = ['N', 'Moyenne', 'Ecart-type', 'Min', 'Q1', 'Mediane', 'Q3', 'Max']
    resume_cont_export.to_excel(writer, sheet_name='T1a-Stats continues')

    # Onglet 1b : frequences variables categorielles
    all_freq_rows = []
    for nom_section, t_section in sections.items():
        first_col = t_section.columns[0]
        for _, row in t_section.iterrows():
            all_freq_rows.append({
                'Variable'        : nom_section,
                'Modalite'        : row[first_col],
                'Effectif'        : row['Effectif'],
                'Pourcentage (%)' : row['Pourcentage (%)'],
            })
    pd.DataFrame(all_freq_rows).to_excel(writer, sheet_name='T1b-Freq categories', index=False)

    # Onglet 2 : analyse bivariee
    biv_df.to_excel(writer, sheet_name='T2-Analyse bivariee', index=False)

    # Onglet 3a : tests chi2
    chi2_df.to_excel(writer, sheet_name='T3a-Tests Chi2', index=False)

    # Onglet 3b : tests Mann-Whitney
    mw_df.to_excel(writer, sheet_name='T3b-Mann-Whitney', index=False)

    # Onglet 4 : regression logistique
    or_table.to_excel(writer, sheet_name='T4-Regression logistique', index=False)

    # Indicateurs du modele
    indic_rows = [
        {'Indicateur': 'N observations', 'Valeur': int(logit.nobs)},
        {'Indicateur': 'Log-vraisemblance', 'Valeur': round(logit.llf, 4)},
        {'Indicateur': 'AIC', 'Valeur': round(logit.aic, 2)},
        {'Indicateur': 'BIC', 'Valeur': round(logit.bic, 2)},
        {'Indicateur': 'Pseudo R2 McFadden', 'Valeur': round(mcfadden, 4)},
        {'Indicateur': 'Pseudo R2 Cox-Snell', 'Valeur': round(cox_snell, 4)},
        {'Indicateur': 'Pseudo R2 Nagelkerke', 'Valeur': round(nagelkerke, 4)},
        {'Indicateur': 'Test Hosmer-Lemeshow Chi2', 'Valeur': round(hl_chi2, 4)},
        {'Indicateur': 'Test Hosmer-Lemeshow p-value', 'Valeur': round(hl_p, 4)},
        {'Indicateur': 'Sensibilite (%)', 'Valeur': round(sensibilite, 1)},
        {'Indicateur': 'Specificite (%)', 'Valeur': round(specificite, 1)},
        {'Indicateur': '% bien classes', 'Valeur': round(pct_correct, 1)},
    ]
    pd.DataFrame(indic_rows).to_excel(writer, sheet_name='T4-Indicateurs modele', index=False)

    # Onglet 5 : VIF
    vif_df.to_excel(writer, sheet_name='T5-VIF', index=False)

print(f"Fichier Excel genere : {excel_path}")

# ============================================================
# FIGURES SUPPLEMENTAIRES
# ============================================================

# FIGURE A — Pyramide : % desir par tranche d'age ET residence
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

age_res = df.groupby(['tranche_age', 'residence_lbl'], observed=True)['desir_enfant_bin'].mean() * 100
age_res_pivot = age_res.unstack('residence_lbl')
age_res_pivot.plot(kind='bar', ax=axes[0], color=['#1565C0', '#E65100'], edgecolor='white')
axes[0].set_title("Desir d'un enfant par age et residence (%)", fontsize=11, fontweight='bold')
axes[0].set_ylabel("% desirant un autre enfant")
axes[0].set_xlabel("Tranche d'age")
axes[0].set_xticklabels(axes[0].get_xticklabels(), rotation=0)
axes[0].legend(title='Milieu')
for p in axes[0].patches:
    if p.get_height() > 0:
        axes[0].annotate(f"{p.get_height():.0f}%",
                         (p.get_x() + p.get_width()/2, p.get_height()),
                         ha='center', va='bottom', fontsize=7)

# % desir par quintile et instruction
quint_instr = df.groupby(['quintile_lbl', 'niveau_instr_lbl'], observed=True)['desir_enfant_bin'].mean() * 100
quint_instr = quint_instr.unstack('niveau_instr_lbl')
quint_instr = quint_instr.reindex(['Le plus pauvre', 'Pauvre', 'Moyen', 'Riche', 'Le plus riche'])
quint_instr.plot(kind='bar', ax=axes[1], edgecolor='white')
axes[1].set_title("Desir d'un enfant par quintile et instruction (%)", fontsize=11, fontweight='bold')
axes[1].set_ylabel("% desirant un autre enfant")
axes[1].set_xlabel("Quintile de richesse")
axes[1].set_xticklabels(axes[1].get_xticklabels(), rotation=15, ha='right')
axes[1].legend(title='Instruction', fontsize=8)

fig.suptitle("Analyse croisee du desir d'avoir un autre enfant\n(EDSC Cameroun 2018)",
             fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig("../outputs/figures/figA_croise_age_residence_quintile.png", bbox_inches='tight')
plt.close()
print("Figure A sauvegardee.")

# FIGURE B — Boxplots : distributions par desir
fig, axes = plt.subplots(1, 3, figsize=(14, 5))

palette = {0: '#E57373', 1: '#42A5F5'}
vars_box = [
    ('age', 'Age (annees)'),
    ('nb_enfants_vivants', 'Nb enfants vivants'),
    ('nb_enfants_total', 'Nb enfants total'),
]
for ax, (var, label) in zip(axes, vars_box):
    df_box = df[['desir_lbl', var]].dropna()
    sns.boxplot(data=df_box, x='desir_lbl', y=var, ax=ax,
                palette={'Ne desire pas': '#E57373', 'Desire un enfant': '#42A5F5'})
    ax.set_title(label, fontsize=11, fontweight='bold')
    ax.set_xlabel('')
    ax.set_xticklabels(ax.get_xticklabels(), rotation=10, ha='right')

fig.suptitle("Distribution des variables continues selon le desir d'un autre enfant\n(EDSC Cameroun 2018)",
             fontsize=12, fontweight='bold')
plt.tight_layout()
plt.savefig("../outputs/figures/figB_boxplots_variables_continues.png", bbox_inches='tight')
plt.close()
print("Figure B sauvegardee.")

# FIGURE C — Forest plot des OR (version amelioree)
fig, ax = plt.subplots(figsize=(10, 6))
or_plot = or_table[or_table['Variable'] != 'Constante'].copy().reset_index(drop=True)
y_pos   = np.arange(len(or_plot))

colors = ['#E53935' if sig in ['*', '**', '***'] else '#90A4AE'
          for sig in or_plot['Sig.']]

for i, (_, row) in enumerate(or_plot.iterrows()):
    ax.errorbar(row['Odds Ratio'], i,
                xerr=[[row['Odds Ratio'] - row['IC 95% inf']],
                      [row['IC 95% sup'] - row['Odds Ratio']]],
                fmt='o', color=colors[i], ecolor=colors[i],
                capsize=5, markersize=9, linewidth=2)
    ax.text(max(or_plot['IC 95% sup']) * 1.05, i,
            f"OR={row['Odds Ratio']:.3f} {row['Sig.']}",
            va='center', fontsize=9)

ax.axvline(x=1, color='black', linestyle='--', linewidth=1.5, label='Reference OR=1')
ax.set_yticks(y_pos)
ax.set_yticklabels(or_plot['Variable'], fontsize=10)
ax.set_xlabel("Odds Ratio (IC 95%)", fontsize=11)
ax.set_title("Forest Plot — Facteurs associes au desir d'avoir un autre enfant\n"
             "Regression logistique binaire (EDSC Cameroun 2018)",
             fontsize=12, fontweight='bold')

rouge_patch  = mpatches.Patch(color='#E53935', label='Significatif (p<0.05)')
gris_patch   = mpatches.Patch(color='#90A4AE', label='Non significatif')
ax.legend(handles=[rouge_patch, gris_patch,
                   plt.Line2D([0],[0], color='black', linestyle='--', label='Reference OR=1')],
          loc='lower right', fontsize=9)
plt.tight_layout()
plt.savefig("../outputs/figures/figC_forest_plot_ameliore.png", bbox_inches='tight')
plt.close()
print("Figure C sauvegardee.")

# FIGURE D — Tableau de classification visuel
fig, ax = plt.subplots(figsize=(6, 4))
cm_labels = np.array([[f'VN = {tn:,}\n(Specificite)', f'FP = {fp:,}'],
                       [f'FN = {fn:,}', f'VP = {tp:,}\n(Sensibilite)']])
cm_vals   = np.array([[tn, fp], [fn, tp]])
im = ax.imshow(cm_vals, interpolation='nearest', cmap='Blues')
ax.set_xticks([0, 1])
ax.set_yticks([0, 1])
ax.set_xticklabels(['Predit : Ne desire pas', 'Predit : Desire'], fontsize=9)
ax.set_yticklabels(['Reel : Ne desire pas', 'Reel : Desire'], fontsize=9)
for i in range(2):
    for j in range(2):
        ax.text(j, i, cm_labels[i, j], ha='center', va='center', fontsize=10,
                color='white' if cm_vals[i, j] > cm_vals.max()/2 else 'black')
ax.set_title(f"Matrice de confusion — Regression logistique\n"
             f"% bien classes : {pct_correct:.1f}%  |  "
             f"Sensib. : {sensibilite:.1f}%  |  Specif. : {specificite:.1f}%",
             fontsize=10, fontweight='bold')
plt.tight_layout()
plt.savefig("../outputs/figures/figD_matrice_confusion.png", bbox_inches='tight')
plt.close()
print("Figure D sauvegardee.")

# ============================================================
# RESUME FINAL
# ============================================================
print("\n" + "="*60)
print("ANALYSE STATISTIQUE COMPLETE — RECAPITULATIF")
print("="*60)
print(f"\nEchantillon : {n_total:,} femmes (15-49 ans, EDSC Cameroun 2018)")
print(f"Variable cible : Desir d'un autre enfant")
print(f"  - Desire     : {df['desir_enfant_bin'].sum():,} ({df['desir_enfant_bin'].mean()*100:.1f}%)")
print(f"  - Ne desire pas : {(df['desir_enfant_bin']==0).sum():,} ({(1-df['desir_enfant_bin'].mean())*100:.1f}%)")
print(f"\nModele logistique :")
print(f"  - R2 Nagelkerke : {nagelkerke:.4f}")
print(f"  - Hosmer-Lemeshow p = {hl_p:.4f} -> {'Bon ajustement' if hl_p > 0.05 else 'Verifier'}")
print(f"  - % bien classes : {pct_correct:.1f}%")
print(f"\nFichiers generes :")
print(f"  EXCEL -> outputs/tables/RESULTATS_COMPLETS_EDSC2018.xlsx")
for f in sorted(os.listdir("../outputs/figures")):
    print(f"  PNG   -> outputs/figures/{f}")
