from typing import Optional, TYPE_CHECKING
from pydantic import BaseModel, Field, ConfigDict

if TYPE_CHECKING:
    from .product import Product


class ProductImageBase(BaseModel):
    url: str = Field(..., min_length=1, max_length=500)
    order: int = Field(default=0, ge=0)
    product_id: int


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageUpdate(BaseModel):
    url: Optional[str] = Field(None, min_length=1, max_length=500)
    order: Optional[int] = Field(None, ge=0)


class ProductImage(ProductImageBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int


# Força a resolução da referência circular
ProductImage.model_rebuild()