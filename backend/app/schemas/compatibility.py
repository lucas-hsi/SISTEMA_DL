from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class CompatibilityBase(BaseModel):
    vehicle_model: str
    year_start: int
    year_end: int
    notes: Optional[str] = None
    product_id: int


class CompatibilityCreate(CompatibilityBase):
    pass


class CompatibilityUpdate(BaseModel):
    vehicle_model: Optional[str] = None
    year_start: Optional[int] = None
    year_end: Optional[int] = None
    notes: Optional[str] = None
    product_id: Optional[int] = None


class CompatibilityInDBBase(CompatibilityBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int


class Compatibility(CompatibilityInDBBase):
    pass


class CompatibilityInDB(CompatibilityInDBBase):
    pass