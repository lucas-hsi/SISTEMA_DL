from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class CompetitorPrice(Base):
    __tablename__ = "competitor_prices"

    id = Column(Integer, primary_key=True, index=True)
    marketplace = Column(String(100), nullable=False, index=True)
    seller_name = Column(String(255), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    last_checked = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)

    # Relacionamento com Product
    product = relationship("Product", back_populates="competitor_prices")

    def __repr__(self):
        return f"<CompetitorPrice(id={self.id}, marketplace='{self.marketplace}', price={self.price})>"