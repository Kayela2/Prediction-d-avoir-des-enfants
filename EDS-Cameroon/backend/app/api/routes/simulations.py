from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...api.deps import get_current_user
from ...database.session import get_db
from ...ml.predictor import predictor
from ...models.audit_log import AuditLog
from ...models.simulation import Simulation
from ...models.user import User
from ...schemas.simulation import SimulationCreate, SimulationOut

router = APIRouter()


@router.post("", response_model=SimulationOut, status_code=status.HTTP_201_CREATED)
def create_simulation(
    payload: SimulationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = predictor.predict(payload.model_dump())

    sim = Simulation(
        user_id=current_user.id,
        title=payload.title,
        age=payload.age,
        niveau_instruction=payload.niveau_instruction,
        nb_enfants_vivants=payload.nb_enfants_vivants,
        contraceptif=payload.contraceptif,
        statut_matrimonial=payload.statut_matrimonial,
        milieu_residence=payload.milieu_residence,
        quintile_richesse=payload.quintile_richesse,
        desire_enfant=result["desire_enfant"],
        probability=result["probability"],
        confidence=result["confidence"],
        model_used=result["model_used"],
    )
    db.add(sim)
    db.flush()

    db.add(
        AuditLog(
            user_id=current_user.id,
            action="create_simulation",
            resource_type="simulation",
            resource_id=sim.id,
        )
    )
    db.commit()
    db.refresh(sim)
    return sim


@router.get("", response_model=list[SimulationOut])
def list_simulations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Simulation)
        .filter(Simulation.user_id == current_user.id)
        .order_by(Simulation.created_at.desc())
        .all()
    )


@router.get("/{sim_id}", response_model=SimulationOut)
def get_simulation(
    sim_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sim = (
        db.query(Simulation)
        .filter(Simulation.id == sim_id, Simulation.user_id == current_user.id)
        .first()
    )
    if not sim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation introuvable")
    return sim


@router.delete("/{sim_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_simulation(
    sim_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sim = (
        db.query(Simulation)
        .filter(Simulation.id == sim_id, Simulation.user_id == current_user.id)
        .first()
    )
    if not sim:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation introuvable")

    db.delete(sim)
    db.add(
        AuditLog(
            user_id=current_user.id,
            action="delete_simulation",
            resource_type="simulation",
            resource_id=sim_id,
        )
    )
    db.commit()
