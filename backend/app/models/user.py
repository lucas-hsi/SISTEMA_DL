from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False) # Ex: 'gestor', 'vendedor', 'anuncios'
    is_active = Column(Boolean(), default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    company_id = Column(Integer, ForeignKey("company.id"))
    company = relationship("Company")
    
    # Campos de metas e limites para funcionários
    sales_goal = Column(Numeric(10, 2), nullable=True)  # Meta de vendas
    ads_goal = Column(Integer, nullable=True)  # Meta de anúncios
    discount_limit = Column(Numeric(5, 2), nullable=True)  # Limite de desconto em %
