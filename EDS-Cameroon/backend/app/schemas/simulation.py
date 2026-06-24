from datetime import datetime

from pydantic import BaseModel, field_validator


class SimulationCreate(BaseModel):
    title: str
    age: int
    instruction: int          # 0=Aucun  1=Primaire  2=Secondaire  3=Supérieur
    nb_enfants: int
    nb_enfants_deces: int = 0

    # Contraceptif : 2 dummies (réf = Aucune méthode)
    contracep_trad: int = 0
    contracep_moderne: int = 0

    # Statut matrimonial : 5 dummies (réf = Jamais mariée)
    mariee: int = 0
    union_libre: int = 0
    veuve: int = 0
    divorcee: int = 0
    separee: int = 0

    residence_rural: int = 0  # 0=Urbaine  1=Rurale
    quintile: int = 3         # 1-5
    emploi: int = 0           # 0=Non  1=Oui
    region_nord: int = 0      # 1=Septentrional

    # Religion : 4 dummies (réf = Catholique)
    rel_protestant: int = 0
    rel_autres_chret: int = 0
    rel_musulman: int = 0
    rel_autres: int = 0

    @field_validator("age")
    @classmethod
    def age_range(cls, v: int) -> int:
        if not (15 <= v <= 49):
            raise ValueError("L'âge doit être entre 15 et 49 ans")
        return v

    @field_validator("instruction")
    @classmethod
    def instruction_range(cls, v: int) -> int:
        if v not in (0, 1, 2, 3):
            raise ValueError("instruction doit être 0, 1, 2 ou 3")
        return v

    @field_validator("quintile")
    @classmethod
    def quintile_range(cls, v: int) -> int:
        if not (1 <= v <= 5):
            raise ValueError("quintile doit être entre 1 et 5")
        return v


class SimulationOut(BaseModel):
    id: str
    user_id: str
    title: str
    status: str
    age: int
    instruction: int
    nb_enfants: int
    nb_enfants_deces: int
    contracep_trad: int
    contracep_moderne: int
    mariee: int
    union_libre: int
    veuve: int
    divorcee: int
    separee: int
    residence_rural: int
    quintile: int
    emploi: int
    region_nord: int
    rel_protestant: int
    rel_autres_chret: int
    rel_musulman: int
    rel_autres: int
    desire_enfant: bool | None
    probability: float | None
    confidence: int | None
    model_used: str | None
    created_at: datetime

    model_config = {"from_attributes": True, "protected_namespaces": ()}
