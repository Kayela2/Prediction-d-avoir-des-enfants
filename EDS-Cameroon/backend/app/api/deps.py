from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from ..core.security import decode_token
from ..database.session import get_db

bearer_scheme = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """Extrait et valide le JWT. Retourne l'user_id (sub) ou lève 401."""
    try:
        payload = decode_token(credentials.credentials)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise ValueError("sub manquant")
        return user_id
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Retourne l'objet User complet depuis la DB. Importé par les routes."""
    from ..models.user import User  # import tardif pour éviter les imports circulaires

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable ou inactif",
        )
    return user
