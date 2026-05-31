from fastapi import APIRouter, Depends

from ...api.deps import get_current_user
from ...ml.predictor import predictor
from ...models.user import User
from ...schemas.prediction import PredictionRequest, PredictionResponse

router = APIRouter()


@router.post("", response_model=PredictionResponse)
def predict(
    payload: PredictionRequest,
    current_user: User = Depends(get_current_user),
):
    result = predictor.predict(payload.model_dump())
    return PredictionResponse(**result)
