from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...api.deps import get_current_user
from ...database.session import get_db
from ...models.user import User
from ...schemas.user import UserOut, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.name is not None:
        current_user.name = payload.name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    db.commit()
    db.refresh(current_user)
    return current_user
