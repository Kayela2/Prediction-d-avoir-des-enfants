from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    # Exemples : 'register', 'login', 'create_simulation', 'delete_simulation'

    resource_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Exemples : 'simulation', 'user'

    resource_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, index=True
    )

    # Relation
    user: Mapped["User | None"] = relationship("User", back_populates="audit_logs")  # noqa: F821

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} user={self.user_id}>"
