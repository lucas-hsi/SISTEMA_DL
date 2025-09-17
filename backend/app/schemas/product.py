from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from .product_image import ProductImage


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    sku: str = Field(..., min_length=1, max_length=100)
    part_number: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    sale_price: Decimal = Field(..., gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    weight: Optional[Decimal] = Field(None, ge=0)  # Peso em kg
    height: Optional[Decimal] = Field(None, ge=0)  # Altura em cm
    width: Optional[Decimal] = Field(None, ge=0)   # Largura em cm
    length: Optional[Decimal] = Field(None, ge=0)  # Comprimento em cm


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    part_number: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    sale_price: Decimal = Field(..., gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    weight: Optional[Decimal] = Field(None, ge=0)  # Peso em kg
    height: Optional[Decimal] = Field(None, ge=0)  # Altura em cm
    width: Optional[Decimal] = Field(None, ge=0)   # Largura em cm
    length: Optional[Decimal] = Field(None, ge=0)  # Comprimento em cm


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    part_number: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    sale_price: Optional[Decimal] = Field(None, gt=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    weight: Optional[Decimal] = Field(None, ge=0)  # Peso em kg
    height: Optional[Decimal] = Field(None, ge=0)  # Altura em cm
    width: Optional[Decimal] = Field(None, ge=0)   # Largura em cm
    length: Optional[Decimal] = Field(None, ge=0)  # Comprimento em cm


class Product(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime
    images: List["ProductImage"] = []


class ProductWithCost(Product):
    """Schema que inclui cost_price para usuários autorizados"""
    cost_price: Optional[Decimal] = None


# Força a resolução da referência circular
Product.model_rebuild()