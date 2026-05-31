import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class PredictionResult(Base):
    __tablename__ = "prediction_results"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    simulation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("simulations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    # Probabilité brute retournée par le modèle [0.0, 1.0]
    probability: Mapped[float] = mapped_column(Float, nullable=False)

    # Importance de chaque variable — stockée en JSON (texte en SQLite, JSONB en PG)
    # Exemple : '{"age": 0.35, "nb_enfants_vivants": 0.28, ...}'
    feature_importances: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Insights textuels générés à partir des résultats
    # Exemple : '["L\'âge est le facteur dominant", "..."]'
    insights: Mapped[str | None] = mapped_column(Text, nullable=True)

    model_version: Mapped[str] = mapped_column(String(50), default="logistic_regression_v1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    # Relation
    simulation: Mapped["Simulation"] = relationship(  # noqa: F821
        "Simulation", back_populates="prediction_result"
    )

    def __repr__(self) -> str:
        return f"<PredictionResult sim={self.simulation_id} prob={self.probability:.2f}>"
