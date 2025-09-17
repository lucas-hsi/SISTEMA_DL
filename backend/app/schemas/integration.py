from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class IntegrationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    service_type: str = Field(..., min_length=1, max_length=50)
    credentials: Optional[str] = None
    is_active: bool = Field(default=True)


class IntegrationCreate(IntegrationBase):
    pass


class IntegrationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    service_type: Optional[str] = Field(None, min_length=1, max_length=50)
    credentials: Optional[str] = None
    is_active: Optional[bool] = None


class Integration(IntegrationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime