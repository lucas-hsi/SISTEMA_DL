from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal


# Schema base para OrderItem
class OrderItemBase(BaseModel):
    quantity: int = Field(..., gt=0, description="Quantidade do produto")
    sale_price: Decimal = Field(..., gt=0, description="Preço de venda do produto")
    product_id: int = Field(..., description="ID do produto")


# Schema para criação de OrderItem
class OrderItemCreate(OrderItemBase):
    pass


# Schema para atualização de OrderItem
class OrderItemUpdate(BaseModel):
    quantity: Optional[int] = Field(None, gt=0, description="Quantidade do produto")
    sale_price: Optional[Decimal] = Field(None, gt=0, description="Preço de venda do produto")
    product_id: Optional[int] = Field(None, description="ID do produto")


# Schema para resposta de OrderItem (incluindo dados do banco)
class OrderItem(OrderItemBase):
    id: int
    order_id: int
    total_price: Decimal = Field(..., description="Preço total do item (quantidade * preço)")
    
    class Config:
        from_attributes = True


# Schema para OrderItem com dados do produto
class OrderItemWithProduct(OrderItem):
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    
    class Config:
        from_attributes = True