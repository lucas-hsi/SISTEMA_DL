from sqlalchemy import Column, Integer, String, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class ProductImage(Base):
    __tablename__ = "product_images"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, nullable=False)
    order = Column(Integer, default=0)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Relacionamento com Product
    product = relationship("Product", back_populates="images")
    
    # Índices para otimização de consultas
    __table_args__ = (
        Index('idx_product_image_product_order', 'product_id', 'order'),
    )