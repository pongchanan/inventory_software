from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.observation_core import Observation
from app.models.rfid_observation_detail_core import RfidObservationDetail
from app.models.vision_observation_detail_core import VisionObservationDetail
from app.schemas.observation_api import (
    ObservationCreate, ObservationUpdate, ObservationResponse,
    RfidObservationDetailCreate, RfidObservationDetailResponse,
    VisionObservationDetailCreate, VisionObservationDetailResponse
)


router = APIRouter(prefix="/api/observations", tags=["observations"])


@router.post("", response_model=ObservationResponse, status_code=status.HTTP_201_CREATED)
def create_observation(obs: ObservationCreate, db: Session = Depends(get_db)):
    """Create a new observation"""
    # Validate vision observations have location
    if obs.source_type == "vision" and obs.location_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                          detail="Vision observations must have a location_id")
    
    db_obs = Observation(**obs.dict())
    db.add(db_obs)
    db.commit()
    db.refresh(db_obs)
    return db_obs


@router.get("", response_model=List[ObservationResponse])
def list_observations(
    session_id: Optional[int] = None,
    source_type: Optional[str] = None,
    review_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List observations with optional filters"""
    query = db.query(Observation)
    
    if session_id:
        query = query.filter(Observation.session_id == session_id)
    if source_type:
        query = query.filter(Observation.source_type == source_type)
    if review_status:
        query = query.filter(Observation.review_status == review_status)
    
    observations = query.offset(skip).limit(limit).all()
    return observations


@router.get("/{observation_id}", response_model=ObservationResponse)
def get_observation(observation_id: int, db: Session = Depends(get_db)):
    """Get observation by ID"""
    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Observation not found")
    return obs


@router.patch("/{observation_id}", response_model=ObservationResponse)
def update_observation(observation_id: int, update: ObservationUpdate, db: Session = Depends(get_db)):
    """Update observation (for review purposes)"""
    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Observation not found")
    
    update_data = update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(obs, key, value)
    
    db.commit()
    db.refresh(obs)
    return obs


# RFID observation details
@router.post("/rfid-details", response_model=RfidObservationDetailResponse, status_code=status.HTTP_201_CREATED)
def create_rfid_detail(detail: RfidObservationDetailCreate, db: Session = Depends(get_db)):
    """Create RFID observation details"""
    obs = db.query(Observation).filter(Observation.id == detail.observation_id).first()
    if not obs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Observation not found")
    if obs.source_type != "rfid":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                          detail="Observation is not RFID type")
    
    db_detail = RfidObservationDetail(**detail.dict())
    db.add(db_detail)
    db.commit()
    db.refresh(db_detail)
    return db_detail


@router.get("/rfid-details/{observation_id}", response_model=RfidObservationDetailResponse)
def get_rfid_detail(observation_id: int, db: Session = Depends(get_db)):
    """Get RFID observation details"""
    detail = db.query(RfidObservationDetail).filter(
        RfidObservationDetail.observation_id == observation_id
    ).first()
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFID detail not found")
    return detail


# Vision observation details
@router.post("/vision-details", response_model=VisionObservationDetailResponse, status_code=status.HTTP_201_CREATED)
def create_vision_detail(detail: VisionObservationDetailCreate, db: Session = Depends(get_db)):
    """Create vision observation details"""
    obs = db.query(Observation).filter(Observation.id == detail.observation_id).first()
    if not obs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Observation not found")
    if obs.source_type != "vision":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                          detail="Observation is not vision type")
    
    db_detail = VisionObservationDetail(**detail.dict())
    db.add(db_detail)
    db.commit()
    db.refresh(db_detail)
    return db_detail


@router.get("/vision-details/{observation_id}", response_model=VisionObservationDetailResponse)
def get_vision_detail(observation_id: int, db: Session = Depends(get_db)):
    """Get vision observation details"""
    detail = db.query(VisionObservationDetail).filter(
        VisionObservationDetail.observation_id == observation_id
    ).first()
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vision detail not found")
    return detail


@router.get("/session/{session_id}/needs-review")
def get_observations_needing_review(session_id: int, db: Session = Depends(get_db)):
    """Get all observations in a session that need review"""
    observations = db.query(Observation).filter(
        Observation.session_id == session_id,
        Observation.review_status == "needs_review"
    ).all()
    return observations
