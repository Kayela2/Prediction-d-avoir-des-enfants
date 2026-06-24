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

    # ── Données saisies — encodage corrigé EDSC-V ─────────────────────────────
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    instruction: Mapped[int] = mapped_column(Integer, nullable=False)
    # 0=Aucun  1=Primaire  2=Secondaire  3=Supérieur

    nb_enfants: Mapped[int] = mapped_column(Integer, nullable=False)
    nb_enfants_deces: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Contraceptif : 2 dummies (réf = Aucune méthode)
    contracep_trad: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    contracep_moderne: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Statut matrimonial : 5 dummies (réf = Jamais mariée)
    mariee: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    union_libre: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    veuve: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    divorcee: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    separee: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    residence_rural: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # 0=Urbaine (réf)  1=Rurale

    quintile: Mapped[int] = mapped_column(Integer, nullable=False)
    # 1=Très pauvre … 5=Riche

    emploi: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # 0=Non  1=Oui (v714)

    region_nord: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # 1=Adamaoua / Extrême-Nord / Nord

    # Religion : 4 dummies (réf = Catholique)
    rel_protestant: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rel_autres_chret: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rel_musulman: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rel_autres: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

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
