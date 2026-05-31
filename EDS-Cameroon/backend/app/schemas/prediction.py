from pydantic import BaseModel


class PredictionRequest(BaseModel):
    age: int
    niveau_instruction: int
    nb_enfants_vivants: int
    contraceptif: int
    statut_matrimonial: int
    milieu_residence: int
    quintile_richesse: int


class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    desire_enfant: bool
    probability: float
    confidence: int
    model_used: str
    feature_importances: dict[str, float]
    insights: list[str]
