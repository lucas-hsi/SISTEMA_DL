from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal


class CompetitorPriceBase(BaseModel):
    marketplace: str
    seller_name: str
    price: Decimal
    product_id: int


class CompetitorPriceCreate(CompetitorPriceBase):
    pass


class CompetitorPriceUpdate(BaseModel):
    marketplace: Optional[str] = None
    seller_name: Optional[str] = None
    price: Optional[Decimal] = None
    product_id: Optional[int] = None


class CompetitorPriceInDBBase(CompetitorPriceBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    last_checked: datetime


class CompetitorPrice(CompetitorPriceInDBBase):
    pass


class CompetitorPriceInDB(CompetitorPriceInDBBase):
    pass