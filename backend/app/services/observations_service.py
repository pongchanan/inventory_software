from __future__ import annotations

from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.observation_core import Observation
from app.models.rfid_observation_detail_core import RfidObservationDetail
from app.models.vision_observation_detail_core import VisionObservationDetail
from app.schemas.observation_api import (
    ObservationCreate,
    ObservationUpdate,
    RfidObservationDetailCreate,
    VisionObservationDetailCreate,
)


def create_observation(db: Session, payload: ObservationCreate) -> Observation:
    if payload.source_type == "vision" and payload.location_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vision observations must have a location_id",
        )

    db_obs = Observation(**payload.model_dump())
    db.add(db_obs)
    db.commit()
    db.refresh(db_obs)
    return db_obs


def list_observations(
    db: Session,
    session_id: Optional[int],
    source_type: Optional[str],
    review_status: Optional[str],
    skip: int,
    limit: int,
) -> List[Observation]:
    query = db.query(Observation)
    if session_id:
        query = query.filter(Observation.session_id == session_id)
    if source_type:
        query = query.filter(Observation.source_type == source_type)
    if review_status:
        query = query.filter(Observation.review_status == review_status)
    return query.offset(skip).limit(limit).all()


def get_observation_or_404(db: Session, observation_id: int) -> Observation:
    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Observation not found")
    return obs


def update_observation(db: Session, observation_id: int, payload: ObservationUpdate) -> Observation:
    obs = get_observation_or_404(db, observation_id)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(obs, key, value)
    db.commit()
    db.refresh(obs)
    return obs


def create_rfid_detail(db: Session, payload: RfidObservationDetailCreate) -> RfidObservationDetail:
    obs = get_observation_or_404(db, payload.observation_id)
    if obs.source_type != "rfid":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Observation is not RFID type")

    detail = RfidObservationDetail(**payload.model_dump())
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return detail


def get_rfid_detail_or_404(db: Session, observation_id: int) -> RfidObservationDetail:
    detail = db.query(RfidObservationDetail).filter(RfidObservationDetail.observation_id == observation_id).first()
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFID detail not found")
    return detail


def create_vision_detail(db: Session, payload: VisionObservationDetailCreate) -> VisionObservationDetail:
    obs = get_observation_or_404(db, payload.observation_id)
    if obs.source_type != "vision":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Observation is not vision type")

    detail = VisionObservationDetail(**payload.model_dump())
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return detail


def get_vision_detail_or_404(db: Session, observation_id: int) -> VisionObservationDetail:
    detail = db.query(VisionObservationDetail).filter(VisionObservationDetail.observation_id == observation_id).first()
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vision detail not found")
    return detail


def list_observations_needing_review(db: Session, session_id: int) -> List[Observation]:
    return (
        db.query(Observation)
        .filter(Observation.session_id == session_id, Observation.review_status == "needs_review")
        .all()
    )
