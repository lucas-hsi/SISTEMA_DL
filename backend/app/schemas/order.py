from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator
from decimal import Decimal
from enum import Enum

from .order_item import OrderItem, OrderItemCreate, OrderItemWithProduct


# Enum para status do pedido
class OrderStatus(str, Enum):
    ORCAMENTO_NOVO = "Orçamento Novo"
    ORCAMENTO_ENVIADO = "Orçamento Enviado"
    VENDIDO = "Vendido"
    CANCELADO = "Cancelado"


# Schema base para Order
class OrderBase(BaseModel):
    status: OrderStatus = Field(default=OrderStatus.ORCAMENTO_NOVO, description="Status do pedido")
    client_id: int = Field(..., description="ID do cliente")
    user_id: int = Field(..., description="ID do vendedor")
    company_id: int = Field(..., description="ID da empresa")


# Schema para criação de Order
class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = Field(..., min_items=1, description="Lista de itens do pedido")
    
    @validator('items')
    def validate_items(cls, v):
        if not v:
            raise ValueError('O pedido deve ter pelo menos um item')
        return v


# Schema para atualização de Order
class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = Field(None, description="Status do pedido")
    client_id: Optional[int] = Field(None, description="ID do cliente")
    user_id: Optional[int] = Field(None, description="ID do vendedor")
    company_id: Optional[int] = Field(None, description="ID da empresa")


# Schema para resposta de Order (incluindo dados do banco)
class Order(OrderBase):
    id: int
    total_amount: Decimal = Field(..., description="Valor total do pedido")
    created_at: datetime
    updated_at: datetime
    items: List[OrderItem] = Field(default=[], description="Lista de itens do pedido")
    
    class Config:
        from_attributes = True


# Schema para Order com dados detalhados
class OrderWithDetails(Order):
    client_name: Optional[str] = None
    user_name: Optional[str] = None
    company_name: Optional[str] = None
    items: List[OrderItemWithProduct] = Field(default=[], description="Lista de itens com detalhes do produto")
    
    class Config:
        from_attributes = True


# Schema para listagem de Orders (resumido)
class OrderSummary(BaseModel):
    id: int
    status: OrderStatus
    total_amount: Decimal
    client_name: Optional[str] = None
    user_name: Optional[str] = None
    created_at: datetime
    items_count: int = Field(..., description="Quantidade de itens no pedido")
    
    class Config:
        from_attributes = True