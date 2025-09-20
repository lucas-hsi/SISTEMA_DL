from typing import Optional, List, Dict, Any, Union, Annotated, Literal
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict, field_validator, AliasChoices
from fastapi import UploadFile
from enum import Enum


class AdStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    INACTIVE = "inactive"


class MarketplaceType(str, Enum):
    MERCADO_LIVRE = "mercado_livre"
    SHOPEE = "shopee"
    AMAZON = "amazon"
    MAGALU = "magalu"
    AMERICANAS = "americanas"


class AdBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    marketplace: MarketplaceType
    status: AdStatus = AdStatus.DRAFT


class AdCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    marketplace: MarketplaceType
    product_id: int = Field(..., gt=0)
    status: AdStatus = AdStatus.DRAFT
    ai_prompt: Optional[str] = None
    ai_output: Optional[Dict[str, Any]] = None
    validation_flags: Optional[Dict[str, Any]] = None


class AdUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    marketplace: Optional[MarketplaceType] = None
    status: Optional[AdStatus] = None
    external_id: Optional[str] = Field(None, max_length=100)
    external_url: Optional[str] = Field(None, max_length=500)
    ai_prompt: Optional[str] = None
    ai_output: Optional[Dict[str, Any]] = None
    validation_flags: Optional[Dict[str, Any]] = None
    sku_generated: Optional[str] = None
    qr_code_path: Optional[str] = None


class AdResponse(AdBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    product_id: int
    user_id: int
    company_id: int
    external_id: Optional[str] = None
    external_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AdGenerateRequest(BaseModel):
    product_id: int = Field(..., gt=0)
    marketplace: MarketplaceType
    target_audience: Optional[str] = Field(None, max_length=500)
    key_features: Optional[List[str]] = Field(default_factory=list)
    tone: Optional[str] = Field("professional", max_length=50)
    include_technical_specs: bool = True
    max_title_length: int = Field(60, ge=10, le=255)
    max_description_length: int = Field(2000, ge=100, le=5000)


class AdGenerateResponse(BaseModel):
    title: str
    description: str
    suggested_price: Optional[Decimal] = None
    keywords: List[str] = Field(default_factory=list)
    marketplace_tips: Optional[str] = None


class AdListResponse(BaseModel):
    ads: List[AdResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class QuickGenerateRequest(BaseModel):
    """Schema para geração rápida de anúncios com PN + fotos"""
    part_number: Annotated[str, Field(min_length=3, max_length=64)] = Field(
        ..., 
        description="Número da peça (mínimo 3 caracteres)"
    )
    images: Annotated[List[str], Field(min_length=1)] = Field(
        ..., 
        description="URLs públicas ou base64 das imagens (mínimo 1)"
    )
    process_background: bool = Field(
        default=False, 
        description="Processar fundo branco nas imagens"
    )
    custom_prompt: Annotated[str | None, Field(max_length=1000)] = Field(
        default=None,
        description="Prompt customizado para IA (opcional)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": {
                "json_ok": {
                    "summary": "Exemplo JSON válido",
                    "value": {
                        "part_number": "ABC123",
                        "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
                        "process_background": False,
                        "custom_prompt": "Destaque a qualidade premium desta peça"
                    }
                },
                "multipart_ok": {
                    "summary": "Exemplo Multipart válido",
                    "description": "Para multipart/form-data, use: part_number (string), process_background (boolean), custom_prompt (string), files[] (array de arquivos)"
                }
            }
        }
    )


class QuickGenerateResponse(BaseModel):
    """Schema para resposta da geração rápida"""
    success: bool
    ad_id: Optional[int] = None
    product_id: Optional[int] = None
    sku_generated: Optional[str] = None
    qr_code_path: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    processed_images: List[str] = Field(default_factory=list)
    validation_flags: Optional[Dict[str, Any]] = None
    message: str
    processing_time: Optional[float] = None


class CreateZipRequest(BaseModel):
    """Request para criar ZIP com anúncios"""
    ad_ids: List[int] = Field(..., min_length=1, max_length=50)
    include_images: bool = True
    include_qr_codes: bool = True
    zip_format: str = Field(default="json", description="Formato dos dados (json, csv, xlsx)")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "ad_ids": [1, 2, 3],
                "include_images": True,
                "include_qr_codes": True,
                "zip_format": "json"
            }
        }
    )


class CreateZipResponse(BaseModel):
    """Schema para resposta da criação de ZIP"""
    success: bool
    zip_url: Optional[str] = None
    download_url: Optional[str] = None
    file_size: Optional[int] = None
    ads_count: int
    message: str


class PublishRequest(BaseModel):
    """Schema para publicação de anúncios (placeholder)"""
    ad_ids: List[int] = Field(..., min_length=1, max_length=20)
    marketplace: MarketplaceType
    schedule_time: Optional[datetime] = None


class PublishResponse(BaseModel):
    """Schema para resposta da publicação"""
    success: bool
    job_id: Optional[str] = None
    scheduled_ads: int
    message: str


class QuickGenerateMultipartRequest(BaseModel):
    """Schema para dados multipart/form-data do quick-generate"""
    part_number: str = Field(
        ..., 
        min_length=3, 
        max_length=64,
        description="Número da peça (mínimo 3 caracteres)"
    )
    marketplace: str = Field(
        default="mercado_livre",
        description="Marketplace de destino"
    )
    custom_prompt: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Prompt customizado para IA (opcional)"
    )
    process_background: bool = Field(
        default=True, 
        description="Processar fundo branco nas imagens"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "part_number": "ABC123",
                "marketplace": "mercado_livre",
                "process_background": True
            }
        }
    )


class HealthEnvResponse(BaseModel):
    """Resposta do endpoint de diagnóstico de ambiente"""
    provedor: str = Field(default="openai", description="Provedor de IA")
    model: str = Field(default="gpt-4", description="Modelo utilizado")
    openai_configured: bool = Field(description="Se a chave OpenAI está configurada")
    authenticated: bool = Field(description="Se a autenticação foi bem-sucedida")
    key_preview: str = Field(description="Preview mascarado da chave (sk-...XXXX)")
    sdk_version: str = Field(description="Versão do SDK OpenAI")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "provedor": "openai",
                "model": "gpt-4",
                "openai_configured": True,
                "authenticated": True,
                "key_preview": "sk-proj-...XXXX",
                "sdk_version": "1.3.0"
            }
        }
    )