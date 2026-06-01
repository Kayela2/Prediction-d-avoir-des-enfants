from datetime import datetime

from pydantic import BaseModel, field_validator


class SimulationCreate(BaseModel):
    title: str
    age: int
    niveau_instruction: int   # 0=Aucun 1=Primaire 2=Secondaire 3=Supérieur
    nb_enfants_vivants: int
    contraceptif: int         # 0=Non 1=Oui
    statut_matrimonial: int   # 1-5
    milieu_residence: int     # 1=Urbain 2=Rural
    quintile_richesse: int    # 1-5
    travail: int = 0          # 0=Non 1=Oui
    region_nord: int = 0      # 1=Septentrional 0=Autre
    religion_musulman: int = 0  # 1=Musulmane 0=Autre

    @field_validator("age")
    @classmethod
    def age_range(cls, v: int) -> int:
        if not (15 <= v <= 49):
            raise ValueError("L'âge doit être entre 15 et 49 ans")
        return v

    @field_validator("niveau_instruction")
    @classmethod
    def niveau_range(cls, v: int) -> int:
        if v not in (0, 1, 2, 3):
            raise ValueError("niveau_instruction doit être 0, 1, 2 ou 3")
        return v

    @field_validator("contraceptif")
    @classmethod
    def contraceptif_range(cls, v: int) -> int:
        if v not in (0, 1):
            raise ValueError("contraceptif doit être 0 ou 1")
        return v

    @field_validator("milieu_residence")
    @classmethod
    def residence_range(cls, v: int) -> int:
        if v not in (1, 2):
            raise ValueError("milieu_residence doit être 1 (Urbain) ou 2 (Rural)")
        return v

    @field_validator("quintile_richesse")
    @classmethod
    def quintile_range(cls, v: int) -> int:
        if not (1 <= v <= 5):
            raise ValueError("quintile_richesse doit être entre 1 et 5")
        return v


class SimulationOut(BaseModel):
    id: str
    user_id: str
    title: str
    status: str
    age: int
    niveau_instruction: int
    nb_enfants_vivants: int
    contraceptif: int
    statut_matrimonial: int
    milieu_residence: int
    quintile_richesse: int
    travail: int
    region_nord: int
    religion_musulman: int
    desire_enfant: bool | None
    probability: float | None
    confidence: int | None
    model_used: str | None
    created_at: datetime

    model_config = {"from_attributes": True, "protected_namespaces": ()}
