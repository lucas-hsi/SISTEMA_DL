from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    client_type = Column(String, index=True)  # "Cliente Final", "Latoeiro", "Mecânico"
    lead_status = Column(String, nullable=True, index=True)  # "Quente", "Frio", "Neutro"
    lead_origin = Column(String, nullable=True)  # "WhatsApp", "Balcão", "Indicação"
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True, index=True)
    document = Column(String, nullable=True, unique=True, index=True)  # CPF/CNPJ
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)  # Histórico e anotações do vendedor
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamento
    company = relationship("Company")
    orders = relationship("Order", back_populates="client")