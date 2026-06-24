from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


def _normalize_email(v: str) -> str:
    """Normalise l'email (minuscules + espaces retirés) pour une reconnaissance
    cohérente entre l'inscription et la connexion."""
    return v.strip().lower()


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    sexe: str | None = None  # "homme" | "femme"

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return _normalize_email(v)

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Le nom est obligatoire")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Le mot de passe doit contenir au moins 6 caractères")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return _normalize_email(v)


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    sexe: str | None
    avatar_url: str | None
    plan: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    avatar_url: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return _normalize_email(v)
