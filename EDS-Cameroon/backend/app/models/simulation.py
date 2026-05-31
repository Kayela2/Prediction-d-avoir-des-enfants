import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Simulation(Base):
    __tablename__ = "simulations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="completed")

    # ── Données saisies par l'utilisateur ─────────────────────────────────────
    # Correspondent exactement aux variables du modèle EDSC-V
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    niveau_instruction: Mapped[int] = mapped_column(Integer, nullable=False)
    # 0=Aucun  1=Primaire  2=Secondaire  3=Supérieur

    nb_enfants_vivants: Mapped[int] = mapped_column(Integer, nullable=False)
    contraceptif: Mapped[int] = mapped_column(Integer, nullable=False)
    # 0=Non  1=Oui

    statut_matrimonial: Mapped[int] = mapped_column(Integer, nullable=False)
    # 1=Célibataire  2=Marié(e)  3=Union libre  4=Divorcé(e)/Séparé(e)  5=Veuf/Veuve

    milieu_residence: Mapped[int] = mapped_column(Integer, nullable=False)
    # 1=Urbain  2=Rural

    quintile_richesse: Mapped[int] = mapped_column(Integer, nullable=False)
    # 1=Le plus pauvre … 5=Le plus riche

    # ── Résultat de la prédiction ─────────────────────────────────────────────
    desire_enfant: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    probability: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model_used: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    # Relations
    user: Mapped["User"] = relationship("User", back_populates="simulations")  # noqa: F821
    prediction_result: Mapped["PredictionResult | None"] = relationship(  # noqa: F821
        "PredictionResult", back_populates="simulation", uselist=False,
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Simulation {self.id} | user={self.user_id}>"
