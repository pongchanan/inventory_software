from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class StorageUnitCreate(BaseModel):
    unit_type: str  # drawer, shelf, hanger_cabinet
    layout_type: str  # grid, zone, none


class StorageUnitUpdate(BaseModel):
    active: Optional[bool] = None


class StorageLocationCreate(BaseModel):
    unit_id: int
    level_no: int
    row_no: Optional[int] = None
    col_no: Optional[int] = None
    zone_code: Optional[str] = None


class StorageLocationResponse(BaseModel):
    id: int
    unit_id: int
    level_no: int
    row_no: Optional[int]
    col_no: Optional[int]
    zone_code: Optional[str]
    active: bool

    class Config:
        from_attributes = True


class StorageUnitResponse(BaseModel):
    id: int
    unit_type: str
    layout_type: str
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
