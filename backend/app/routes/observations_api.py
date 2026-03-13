from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.observation_api import (
    ObservationCreate, ObservationUpdate, ObservationResponse,
    RfidObservationDetailCreate, RfidObservationDetailResponse,
    VisionObservationDetailCreate, VisionObservationDetailResponse
)
from app.services import observations_service


router = APIRouter(prefix="/api/observations", tags=["observations"])


@router.post("", response_model=ObservationResponse, status_code=status.HTTP_201_CREATED)
def create_observation(obs: ObservationCreate, db: Session = Depends(get_db)):
    return observations_service.create_observation(db, obs)


@router.get("", response_model=List[ObservationResponse])
def list_observations(
    session_id: Optional[int] = None,
    source_type: Optional[str] = None,
    review_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return observations_service.list_observations(db, session_id, source_type, review_status, skip, limit)


@router.get("/{observation_id}", response_model=ObservationResponse)
def get_observation(observation_id: int, db: Session = Depends(get_db)):
    return observations_service.get_observation_or_404(db, observation_id)


@router.patch("/{observation_id}", response_model=ObservationResponse)
def update_observation(observation_id: int, update: ObservationUpdate, db: Session = Depends(get_db)):
    return observations_service.update_observation(db, observation_id, update)


# RFID observation details
@router.post("/rfid-details", response_model=RfidObservationDetailResponse, status_code=status.HTTP_201_CREATED)
def create_rfid_detail(detail: RfidObservationDetailCreate, db: Session = Depends(get_db)):
    return observations_service.create_rfid_detail(db, detail)


@router.get("/rfid-details/{observation_id}", response_model=RfidObservationDetailResponse)
def get_rfid_detail(observation_id: int, db: Session = Depends(get_db)):
    return observations_service.get_rfid_detail_or_404(db, observation_id)


# Vision observation details
@router.post("/vision-details", response_model=VisionObservationDetailResponse, status_code=status.HTTP_201_CREATED)
def create_vision_detail(detail: VisionObservationDetailCreate, db: Session = Depends(get_db)):
    return observations_service.create_vision_detail(db, detail)


@router.get("/vision-details/{observation_id}", response_model=VisionObservationDetailResponse)
def get_vision_detail(observation_id: int, db: Session = Depends(get_db)):
    return observations_service.get_vision_detail_or_404(db, observation_id)


@router.get("/session/{session_id}/needs-review")
def get_observations_needing_review(session_id: int, db: Session = Depends(get_db)):
    return observations_service.list_observations_needing_review(db, session_id)
