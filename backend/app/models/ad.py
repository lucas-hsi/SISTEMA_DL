from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Index, Numeric, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum


class AdStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    ARCHIVED = "ARCHIVED"
    PENDING_PUBLISH = "PENDING_PUBLISH"
    PUBLISH_FAILED = "PUBLISH_FAILED"


class MarketplaceType(str, enum.Enum):
    MERCADO_LIVRE = "mercado_livre"
    SHOPEE = "shopee"
    AMAZON = "amazon"
    OLX = "olx"
    FACEBOOK = "facebook"
    INTERNO = "interno"


class Ad(Base):
    __tablename__ = "ads"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(precision=10, scale=2), nullable=True)
    status = Column(Enum(AdStatus), nullable=False, default=AdStatus.DRAFT, index=True)
    marketplace = Column(String(50), nullable=True, index=True)
    external_id = Column(String(100), nullable=True)
    
    # Novos campos para IA e processamento
    ai_prompt = Column(Text, nullable=True)
    ai_output = Column(JSON, nullable=True)
    validation_flags = Column(JSON, nullable=True)
    sku_generated = Column(String(100), nullable=True, index=True)
    qr_code_path = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    product = relationship("Product", back_populates="ads")
    user = relationship("User", back_populates="ads")
    company = relationship("Company", back_populates="ads")
    
    # Índices compostos para otimização de consultas
    __table_args__ = (
        Index('idx_ads_company_status', 'company_id', 'status'),
        Index('idx_ads_product_status', 'product_id', 'status'),
        Index('idx_ads_marketplace_external', 'marketplace', 'external_id'),
        Index('idx_ads_company_product', 'company_id', 'product_id'),
        Index('idx_ads_company_part_number', 'company_id', 'product_id'),
        Index('idx_ads_sku_generated', 'sku_generated'),
    )