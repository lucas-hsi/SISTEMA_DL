from sqlalchemy import Column, Integer, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    quantity = Column(Integer, nullable=False)
    sale_price = Column(Numeric(10, 2), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Relacionamentos
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    
    # Índices para otimização de consultas
    __table_args__ = (
        Index('idx_order_item_order', 'order_id'),
        Index('idx_order_item_product', 'product_id'),
        Index('idx_order_item_order_product', 'order_id', 'product_id'),
    )
    
    @property
    def total_price(self):
        """Calcula o preço total do item (quantidade * preço unitário)"""
        return self.quantity * self.sale_price
    
    def __repr__(self):
        return f"<OrderItem(id={self.id}, quantity={self.quantity}, sale_price={self.sale_price})>"