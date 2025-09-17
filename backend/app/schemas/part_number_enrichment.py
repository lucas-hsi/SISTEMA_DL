from pydantic import BaseModel, Field
from typing import List, Optional
from decimal import Decimal
from datetime import datetime


class PartNumberEnrichRequest(BaseModel):
    """Schema para requisição de enriquecimento de part number"""
    product_id: int = Field(..., description="ID do produto a ser enriquecido")
    part_number: str = Field(..., min_length=1, max_length=100, description="Part number a ser pesquisado")


class CompatibilityData(BaseModel):
    """Schema para dados de compatibilidade retornados pela IA"""
    vehicle_model: str = Field(..., description="Modelo do veículo")
    year_start: int = Field(..., description="Ano de início da compatibilidade")
    year_end: int = Field(..., description="Ano de fim da compatibilidade")
    notes: Optional[str] = Field(None, description="Observações sobre a compatibilidade")


class CompetitorPriceData(BaseModel):
    """Schema para dados de preços de concorrentes retornados pela IA"""
    marketplace: str = Field(..., description="Nome do marketplace")
    seller_name: str = Field(..., description="Nome do vendedor")
    price: Decimal = Field(..., description="Preço do produto")


class OpenAIResponse(BaseModel):
    """Schema para resposta estruturada da OpenAI"""
    compatibilities: List[CompatibilityData] = Field(default_factory=list, description="Lista de compatibilidades")
    competitor_prices: List[CompetitorPriceData] = Field(default_factory=list, description="Lista de preços de concorrentes")


class PartNumberEnrichResponse(BaseModel):
    """Schema para resposta do endpoint de enriquecimento"""
    success: bool = Field(..., description="Indica se o enriquecimento foi bem-sucedido")
    message: str = Field(..., description="Mensagem de status")
    product_id: int = Field(..., description="ID do produto enriquecido")
    part_number: str = Field(..., description="Part number pesquisado")
    compatibilities_added: int = Field(default=0, description="Número de compatibilidades adicionadas")
    competitor_prices_added: int = Field(default=0, description="Número de preços de concorrentes adicionados")
    processing_time: Optional[float] = Field(None, description="Tempo de processamento em segundos")
    created_at: datetime = Field(default_factory=datetime.now, description="Data e hora do processamento")


class PartNumberEnrichError(BaseModel):
    """Schema para resposta de erro do endpoint"""
    success: bool = Field(default=False, description="Indica falha no processamento")
    error: str = Field(..., description="Descrição do erro")
    product_id: Optional[int] = Field(None, description="ID do produto (se fornecido)")
    part_number: Optional[str] = Field(None, description="Part number (se fornecido)")
    created_at: datetime = Field(default_factory=datetime.now, description="Data e hora do erro")