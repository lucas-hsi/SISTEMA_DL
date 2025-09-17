from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    sku = Column(String, unique=True, index=True, nullable=False)
    part_number = Column(String, index=True)
    brand = Column(String, index=True)
    cost_price = Column(Numeric(10, 2))
    sale_price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)
    weight = Column(Numeric(10, 3), nullable=True)  # Peso em kg
    height = Column(Numeric(10, 2), nullable=True)  # Altura em cm
    width = Column(Numeric(10, 2), nullable=True)   # Largura em cm
    length = Column(Numeric(10, 2), nullable=True)  # Comprimento em cm
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    # Relacionamentos
    company = relationship("Company", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.order")
    order_items = relationship("OrderItem", back_populates="product")
    compatibilities = relationship("Compatibility", back_populates="product", cascade="all, delete-orphan")
    competitor_prices = relationship("CompetitorPrice", back_populates="product", cascade="all, delete-orphan")
    
    # Índices compostos para otimização de consultas
    __table_args__ = (
        Index('idx_product_company_sku', 'company_id', 'sku'),
        Index('idx_product_company_brand', 'company_id', 'brand'),
        Index('idx_product_company_name', 'company_id', 'name'),
    )