from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Integration(Base):
    __tablename__ = "integrations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    service_type = Column(String(100), nullable=False, index=True)
    credentials = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relacionamento com a tabela companies
    company = relationship("Company", back_populates="integrations")
    
    # Índice composto para otimizar consultas por company_id e service_type
    __table_args__ = (
        Index('idx_company_service', 'company_id', 'service_type'),
    )
    
    def __repr__(self):
        return f"<Integration(id={self.id}, name='{self.name}', service_type='{self.service_type}', company_id={self.company_id})>"