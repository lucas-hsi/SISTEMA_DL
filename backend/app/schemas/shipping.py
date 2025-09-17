from typing import List, Optional
from pydantic import BaseModel, Field
from decimal import Decimal


class ShippingItem(BaseModel):
    """Item para cálculo de frete"""
    product_id: int = Field(..., description="ID do produto")
    quantity: int = Field(..., gt=0, description="Quantidade do produto")


class ShippingQuoteRequest(BaseModel):
    """Requisição para cálculo de frete"""
    recipient_cep: str = Field(..., min_length=8, max_length=9, description="CEP de destino")
    items: List[ShippingItem] = Field(..., min_items=1, description="Lista de itens")


class ShippingOption(BaseModel):
    """Opção de frete disponível"""
    service_name: str = Field(..., description="Nome do serviço")
    service_code: str = Field(..., description="Código do serviço")
    carrier: str = Field(..., description="Transportadora")
    price: float = Field(..., ge=0, description="Preço do frete")
    delivery_time: int = Field(..., ge=0, description="Prazo de entrega em dias")
    original_delivery_time: int = Field(..., ge=0, description="Prazo original sem adicionais")


class ShippingQuoteResponse(BaseModel):
    """Resposta do cálculo de frete"""
    success: bool = Field(..., description="Se a consulta foi bem-sucedida")
    shipping_options: List[ShippingOption] = Field(default=[], description="Opções de frete")
    error: Optional[str] = Field(None, description="Mensagem de erro, se houver")


class CEPValidationRequest(BaseModel):
    """Requisição para validação de CEP"""
    cep: str = Field(..., min_length=8, max_length=9, description="CEP a ser validado")


class CEPValidationResponse(BaseModel):
    """Resposta da validação de CEP"""
    valid: bool = Field(..., description="Se o CEP é válido")
    formatted_cep: Optional[str] = Field(None, description="CEP formatado")