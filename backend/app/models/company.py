from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    cnpj = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos usando string references para evitar dependências circulares
    users = relationship("User", back_populates="company", lazy="dynamic")
    products = relationship("Product", back_populates="company", lazy="dynamic")
    orders = relationship("Order", back_populates="company", lazy="dynamic")
    integrations = relationship("Integration", back_populates="company", lazy="dynamic")
