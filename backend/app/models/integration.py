from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class Integration(Base):
    __tablename__ = "integrations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Nome da integração
    service_type = Column(String, index=True, nullable=False)  # Tipo do serviço (ex: "shipping", "payment")
    credentials = Column(Text, nullable=True)  # Credenciais criptografadas em JSON
    is_active = Column(Boolean, default=True)  # Se a integração está ativa
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamento com Company
    company = relationship("Company", back_populates="integrations")