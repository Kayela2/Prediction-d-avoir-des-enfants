from pydantic import BaseModel


class PredictionRequest(BaseModel):
    # ── Variables continues ───────────────────────────────────────────────────
    age: int
    instruction: int          # 0=Aucun  1=Primaire  2=Secondaire  3=Supérieur
    nb_enfants: int
    nb_enfants_deces: int = 0 # non collecté dans le formulaire → défaut 0

    # ── Contraceptif : 2 dummies (réf = Aucune méthode) ─────────────────────
    contracep_trad: int = 0    # 1 = méthode folklorique ou traditionnelle
    contracep_moderne: int = 0 # 1 = méthode moderne

    # ── Statut matrimonial : 5 dummies (réf = Jamais mariée) ─────────────────
    mariee: int = 0
    union_libre: int = 0
    veuve: int = 0
    divorcee: int = 0
    separee: int = 0

    # ── Autres variables ──────────────────────────────────────────────────────
    residence_rural: int = 0  # 0=Urbaine (réf)  1=Rurale
    quintile: int = 3         # 1=Très pauvre … 5=Riche
    emploi: int = 0           # 0=Non  1=Oui
    region_nord: int = 0      # 1=Adamaoua / Extrême-Nord / Nord

    # ── Religion : 4 dummies (réf = Catholique) ──────────────────────────────
    rel_protestant: int = 0
    rel_autres_chret: int = 0
    rel_musulman: int = 0
    rel_autres: int = 0


class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    desire_enfant: bool
    probability: float
    confidence: int
    model_used: str
    feature_importances: dict[str, float]
    insights: list[str]
