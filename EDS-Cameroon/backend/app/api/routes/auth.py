from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ...core.security import create_access_token, hash_password, verify_password
from ...database.session import get_db
from ...models.audit_log import AuditLog
from ...models.user import User
from ...schemas.token import Token
from ...schemas.user import ForgotPasswordRequest, UserCreate, UserLogin, UserOut

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        sexe=payload.sexe,
    )
    db.add(user)
    db.flush()

    db.add(
        AuditLog(
            user_id=user.id,
            action="register",
            resource_type="user",
            ip_address=request.client.host if request.client else None,
        )
    )
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé",
        )

    token = create_access_token({"sub": user.id})

    db.add(
        AuditLog(
            user_id=user.id,
            action="login",
            resource_type="user",
            ip_address=request.client.host if request.client else None,
        )
    )
    db.commit()

    return Token(access_token=token)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # On vérifie silencieusement (on ne révèle pas si l'email existe ou non)
    db.query(User).filter(User.email == payload.email).first()
    return {"message": "Si cet email est enregistré, vous recevrez un lien de réinitialisation."}
