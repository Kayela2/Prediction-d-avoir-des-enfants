# Importer tous les modèles ici pour qu'Alembic et SQLAlchemy les détectent
from .user import User
from .simulation import Simulation
from .prediction_result import PredictionResult
from .audit_log import AuditLog

__all__ = ["User", "Simulation", "PredictionResult", "AuditLog"]
