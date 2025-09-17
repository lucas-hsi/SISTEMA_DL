from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Index, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
from app.schemas.order import OrderStatus


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.ORCAMENTO_NOVO, index=True, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relacionamentos
    client = relationship("Client", back_populates="orders")
    user = relationship("User", back_populates="orders")
    company = relationship("Company", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    
    # Índices para otimização de consultas
    __table_args__ = (
        Index('idx_order_status_created', 'status', 'created_at'),
        Index('idx_order_client_user', 'client_id', 'user_id'),
        Index('idx_order_company_status', 'company_id', 'status'),
    )
    
    def __repr__(self):
        return f"<Order(id={self.id}, status='{self.status}', total_amount={self.total_amount})>"