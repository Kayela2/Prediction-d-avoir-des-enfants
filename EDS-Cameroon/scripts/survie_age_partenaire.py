"""
Analyse de Survie - EDSC Cameroun 2018
Thème : Influence de l'âge du partenaire sur la survie des enfants
-----------------------------------------------------------------------
Méthodes : Table de mortalité | Courbes de Kaplan-Meier | Modèle de Cox
"""

import sys
sys.path.insert(0, r'C:\Users\FTAB TECH\AppData\Local\Programs\Python\Python312\Lib\site-packages')

import pyreadstat
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
matplotlib.rcParams['font.family'] = 'DejaVu Sans'

from lifelines import KaplanMeierFitter
from lifelines.statistics import logrank_test, multivariate_logrank_test
from lifelines import CoxPHFitter
from lifelines.statistics import proportional_hazard_test

import warnings
warnings.filterwarnings('ignore')
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# 1. CHARGEMENT ET PREPARATION DES DONNÉES
 
print("=" * 60)
print("ANALYSE DE SURVIE - EDSC CAMEROUN 2018")
print("Thème : Age du partenaire et survie des enfants")
print("=" * 60)

print("\n[1] Chargement des données EDSC...")
df_ir, meta = pyreadstat.read_sav(
    r'C:\Users\FTAB TECH\EDS-Cameroon\CMIR71FL.SAV'
)
print(f"    Femmes enquêtées : {len(df_ir):,}")

# ----------------------------------------------------------
# Mise en format long : 1 ligne par enfant (au lieu de 1 par femme)
# ----------------------------------------------------------
print("\n[2] Restructuration : format large → format long (1 ligne/enfant)...")

records = []
max_children = 20

for i in range(1, max_children + 1):
    idx = f"{i:02d}"  # 01, 02, ... 20

    cols_needed = [f'B5${idx}', f'B7${idx}', f'B3${idx}',
                   'V008', 'V730', 'V012', 'V025', 'V106', 'V190', 'V501']

    # Vérifier que toutes les colonnes existent
    if not all(c in df_ir.columns for c in cols_needed):
        continue

    tmp = df_ir[cols_needed].copy()
    tmp.columns = ['b5', 'b7', 'b3', 'v008', 'v730',
                   'v012', 'v025', 'v106', 'v190', 'v501']
    tmp['rang_naissance'] = i

    # Garder seulement les enfants réels (B5 renseigné)
    tmp = tmp[tmp['b5'].notna()]
    records.append(tmp)

df = pd.concat(records, ignore_index=True)
print(f"    Enfants au total : {len(df):,}")

# ----------------------------------------------------------
# Construction des variables de survie
# ----------------------------------------------------------
# Événement : décès = 1, vivant (censuré) = 0
df['event'] = (df['b5'] == 0).astype(int)

# Temps (en mois) :
#   - Si décédé  → age au décès (B7)
#   - Si vivant  → age à l'enquête (V008 - B3)
df['temps'] = np.where(
    df['event'] == 1,
    df['b7'],
    df['v008'] - df['b3']
)

# Supprimer temps ≤ 0 ou manquants
df = df[(df['temps'] > 0) & df['temps'].notna()]

# Limiter à 60 mois (5 ans) — mortalité infanto-juvénile
df = df[df['temps'] <= 60]

print(f"    Enfants après nettoyage (≤60 mois) : {len(df):,}")
print(f"    Décès observés : {df['event'].sum():,} ({df['event'].mean()*100:.1f}%)")

# ----------------------------------------------------------
# Variable principale : groupe d'âge du partenaire (V730)
# ----------------------------------------------------------
df = df[df['v730'].notna() & (df['v730'] < 99)]

df['groupe_partenaire'] = pd.cut(
    df['v730'],
    bins=[0, 29, 39, 49, 100],
    labels=['< 30 ans', '30-39 ans', '40-49 ans', '50 ans et +']
)

print(f"\n    Enfants avec age partenaire renseigné : {len(df):,}")
print("\n    Répartition par groupe d'âge du partenaire :")
print(df['groupe_partenaire'].value_counts().sort_index().to_string())

# ----------------------------------------------------------
# Covariables pour Cox
# ----------------------------------------------------------
df['residence']  = df['v025'].map({1.0: 'Urbain', 2.0: 'Rural'})
df['education']  = df['v106'].map({0.0: 'Aucune', 1.0: 'Primaire',
                                    2.0: 'Secondaire', 3.0: 'Superieur'})
df['richesse']   = df['v190'].map({1.0: 'Très pauvre', 2.0: 'Pauvre',
                                    3.0: 'Moyen', 4.0: 'Riche', 5.0: 'Très riche'})

# ============================================================
# 2. TABLE DE MORTALITÉ (Life Table)
# ============================================================
print("\n" + "=" * 60)
print("[3] TABLE DE MORTALITÉ")
print("=" * 60)

from lifelines import KaplanMeierFitter

# Intervalles de temps en mois pour la table
intervalles = [0, 1, 3, 6, 12, 24, 36, 48, 60]

def table_mortalite(durees, evenements, intervalles, titre=""):
    """Calcule une table de mortalité actuarielle."""
    rows = []
    T = np.array(durees)
    E = np.array(evenements)

    for i in range(len(intervalles) - 1):
        t0, t1 = intervalles[i], intervalles[i + 1]

        # Exposés au risque au début de l'intervalle
        exposés = np.sum(T >= t0)

        # Décès dans l'intervalle
        deces = np.sum((T >= t0) & (T < t1) & (E == 1))

        # Censurés dans l'intervalle
        censures = np.sum((T >= t0) & (T < t1) & (E == 0))

        # Exposés ajustés (méthode actuarielle : retirer la moitié des censurés)
        exposés_adj = exposés - censures / 2

        # Quotient de mortalité (q)
        q = deces / exposés_adj if exposés_adj > 0 else np.nan

        # Probabilité de survie dans l'intervalle (p)
        p = 1 - q

        rows.append({
            'Intervalle': f'[{t0}, {t1}[',
            'Exposés': int(exposés),
            'Décès': int(deces),
            'Censurés': int(censures),
            'Exposés ajustés': round(exposés_adj, 1),
            'q (mortalité)': round(q, 4) if not np.isnan(q) else np.nan,
            'p (survie)': round(p, 4) if not np.isnan(q) else np.nan,
        })

    table = pd.DataFrame(rows)

    # Probabilité de survie cumulée S(t)
    table['S(t) cumulée'] = table['p (survie)'].cumprod().round(4)

    if titre:
        print(f"\n  {titre}")
    print(table.to_string(index=False))
    return table


print("\n--- Table globale (tous groupes) ---")
table_globale = table_mortalite(
    df['temps'], df['event'], intervalles,
    "Table de mortalité globale"
)

print("\n--- Tables par groupe d'âge du partenaire ---")
tables_groupes = {}
for groupe in df['groupe_partenaire'].cat.categories:
    sous = df[df['groupe_partenaire'] == groupe]
    if len(sous) < 30:
        continue
    tables_groupes[groupe] = table_mortalite(
        sous['temps'], sous['event'], intervalles,
        f"Groupe : Partenaire {groupe} (n={len(sous):,})"
    )

# ============================================================
# 3. COURBES DE KAPLAN-MEIER
# ============================================================
print("\n" + "=" * 60)
print("[4] COURBES DE KAPLAN-MEIER")
print("=" * 60)

couleurs = ['#2196F3', '#4CAF50', '#FF9800', '#F44336']
fig, axes = plt.subplots(1, 2, figsize=(16, 6))

# --- Courbe KM globale ---
ax = axes[0]
kmf = KaplanMeierFitter()
kmf.fit(df['temps'], df['event'], label='Population totale')
kmf.plot_survival_function(ax=ax, color='steelblue', ci_show=True)

ax.set_title("Courbe de Kaplan-Meier globale\n(Survie des enfants ≤5 ans)", fontsize=13, fontweight='bold')
ax.set_xlabel("Temps (mois)", fontsize=11)
ax.set_ylabel("Probabilité de survie S(t)", fontsize=11)
ax.set_ylim(0.85, 1.01)
ax.axvline(x=12, color='grey', linestyle='--', alpha=0.5, label='12 mois')
ax.axvline(x=60, color='grey', linestyle=':', alpha=0.5, label='60 mois')
ax.legend(fontsize=10)
ax.grid(alpha=0.3)

# Annotation probabilité à 60 mois
s60 = kmf.survival_function_at_times([60]).values[0]
ax.annotate(f'S(60) = {s60:.3f}', xy=(60, s60),
            xytext=(45, s60 + 0.01), fontsize=9,
            arrowprops=dict(arrowstyle='->', color='black'))

# --- Courbes KM par groupe d'âge du partenaire ---
ax = axes[1]
resultats_km = {}

for i, groupe in enumerate(df['groupe_partenaire'].cat.categories):
    sous = df[df['groupe_partenaire'] == groupe]
    if len(sous) < 30:
        continue
    kmf_g = KaplanMeierFitter()
    kmf_g.fit(sous['temps'], sous['event'],
               label=f'Partenaire {groupe} (n={len(sous):,})')
    kmf_g.plot_survival_function(ax=ax, color=couleurs[i], ci_show=False)
    resultats_km[groupe] = kmf_g

ax.set_title("Courbes KM par groupe d'âge du partenaire\n(Survie des enfants ≤5 ans)", fontsize=13, fontweight='bold')
ax.set_xlabel("Temps (mois)", fontsize=11)
ax.set_ylabel("Probabilité de survie S(t)", fontsize=11)
ax.set_ylim(0.85, 1.01)
ax.grid(alpha=0.3)
ax.legend(fontsize=9, loc='lower left')

plt.tight_layout()
plt.savefig(r'C:\Users\FTAB TECH\EDS-Cameroon\outputs\survie_km_partenaire.png',
            dpi=150, bbox_inches='tight')
print("    Graphique KM sauvegardé : outputs/survie_km_partenaire.png")
plt.show()

# --- Test du Log-Rank ---
print("\n--- Test du Log-Rank (comparaison des courbes) ---")
groupes_valides = [g for g in df['groupe_partenaire'].cat.categories
                   if (df['groupe_partenaire'] == g).sum() >= 30]

df_test = df[df['groupe_partenaire'].isin(groupes_valides)].copy()

result_logrank = multivariate_logrank_test(
    df_test['temps'],
    df_test['groupe_partenaire'],
    df_test['event']
)
print(f"  Statistique du test : {result_logrank.test_statistic:.4f}")
print(f"  p-valeur            : {result_logrank.p_value:.4f}")
if result_logrank.p_value < 0.05:
    print("  => Différence SIGNIFICATIVE entre les groupes (p < 0.05)")
else:
    print("  => Différence NON significative entre les groupes (p >= 0.05)")

# Survie médiane par groupe
print("\n--- Survie médiane et à 60 mois par groupe ---")
print(f"  {'Groupe':<20} {'Médiane (mois)':>15} {'S(12 mois)':>12} {'S(60 mois)':>12}")
print("  " + "-" * 62)
for groupe, kmf_g in resultats_km.items():
    med = kmf_g.median_survival_time_
    s12 = kmf_g.survival_function_at_times([12]).values[0]
    s60 = kmf_g.survival_function_at_times([60]).values[0]
    med_str = f"{med:.0f}" if med != np.inf else "> 60"
    print(f"  {'Partenaire ' + str(groupe):<20} {med_str:>15} {s12:>12.4f} {s60:>12.4f}")

# ============================================================
# 4. MODÈLE DE COX
# ============================================================
print("\n" + "=" * 60)
print("[5] MODÈLE DE COX (Régression à risques proportionnels)")
print("=" * 60)

# Préparation des données pour Cox (variables numériques)
df_cox = df[['temps', 'event', 'v730', 'v025', 'v106', 'v190']].dropna().copy()

# Renommer pour lisibilité
df_cox.columns = ['temps', 'event', 'age_partenaire',
                  'residence', 'education', 'richesse']

# Centrer l'age du partenaire (pour interprétation)
df_cox['age_partenaire_c'] = df_cox['age_partenaire'] - df_cox['age_partenaire'].mean()

print(f"\n    Observations utilisées dans Cox : {len(df_cox):,}")
print(f"    Décès : {df_cox['event'].sum():,}")

# Modèle 1 : Brut (age partenaire seul)
print("\n--- Modèle 1 : Brut (age du partenaire seul) ---")
cph_brut = CoxPHFitter()
cph_brut.fit(df_cox[['temps', 'event', 'age_partenaire']],
             duration_col='temps', event_col='event')
cph_brut.print_summary()

# Modèle 2 : Ajusté (avec covariables)
print("\n--- Modèle 2 : Ajusté (age partenaire + résidence + éducation + richesse) ---")
cph_ajuste = CoxPHFitter()
cph_ajuste.fit(df_cox[['temps', 'event', 'age_partenaire',
                        'residence', 'education', 'richesse']],
               duration_col='temps', event_col='event')
cph_ajuste.print_summary()

# Graphique des Hazard Ratios
fig, axes = plt.subplots(1, 2, figsize=(16, 5))

# HR modèle brut
ax = axes[0]
cph_brut.plot(ax=ax)
ax.set_title("Hazard Ratio — Modèle brut\n(Age du partenaire)", fontsize=12, fontweight='bold')
ax.axvline(x=0, color='red', linestyle='--', alpha=0.7)
ax.grid(alpha=0.3)

# HR modèle ajusté
ax = axes[1]
cph_ajuste.plot(ax=ax)
ax.set_title("Hazard Ratio — Modèle ajusté\n(Age partenaire + covariables)", fontsize=12, fontweight='bold')
ax.axvline(x=0, color='red', linestyle='--', alpha=0.7)
ax.grid(alpha=0.3)

plt.tight_layout()
plt.savefig(r'C:\Users\FTAB TECH\EDS-Cameroon\outputs\survie_cox_hr.png',
            dpi=150, bbox_inches='tight')
print("\n    Graphique Cox sauvegardé : outputs/survie_cox_hr.png")
plt.show()

# Interprétation de l'age du partenaire
hr_age = np.exp(cph_ajuste.params_['age_partenaire'])
ci_low = np.exp(cph_ajuste.confidence_intervals_['95% lower-bound']['age_partenaire'])
ci_up  = np.exp(cph_ajuste.confidence_intervals_['95% upper-bound']['age_partenaire'])
pval   = cph_ajuste.summary['p']['age_partenaire']

print("\n--- Interprétation : Age du partenaire (modèle ajusté) ---")
print(f"  HR = {hr_age:.4f}  IC95% [{ci_low:.4f} ; {ci_up:.4f}]  p = {pval:.4f}")
if pval < 0.05:
    if hr_age > 1:
        print(f"  => Chaque année supplémentaire du partenaire augmente le risque de")
        print(f"     décès de l'enfant de {(hr_age-1)*100:.1f}% (p < 0.05)")
    else:
        print(f"  => Chaque année supplémentaire du partenaire réduit le risque de")
        print(f"     décès de l'enfant de {(1-hr_age)*100:.1f}% (p < 0.05)")
else:
    print(f"  => L'âge du partenaire n'a pas d'effet significatif (p = {pval:.4f})")

# ============================================================
# 5. RÉSUMÉ FINAL
# ============================================================
print("\n" + "=" * 60)
print("RÉSUMÉ DE L'ANALYSE")
print("=" * 60)
print(f"  Données       : EDSC Cameroun 2018")
print(f"  Enfants étudiés : {len(df):,} enfants ≤ 5 ans")
print(f"  Décès observés  : {df['event'].sum():,} ({df['event'].mean()*100:.1f}%)")
print(f"  Variable clé    : Age du partenaire (V730, moy={df['v730'].mean():.1f} ans)")
print(f"\n  Méthodes utilisées :")
print(f"    1. Table de mortalité (méthode actuarielle)")
print(f"    2. Courbes de Kaplan-Meier + Test Log-Rank")
print(f"    3. Modèle de Cox brut et ajusté")
print(f"\n  Fichiers sauvegardés :")
print(f"    - outputs/survie_km_partenaire.png")
print(f"    - outputs/survie_cox_hr.png")
print("=" * 60)
