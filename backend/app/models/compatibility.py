from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Compatibility(Base):
    __tablename__ = "compatibilities"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_model = Column(String(255), nullable=False, index=True)
    year_start = Column(Integer, nullable=False)
    year_end = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)

    # Relacionamento com Product
    product = relationship("Product", back_populates="compatibilities")

    def __repr__(self):
        return f"<Compatibility(id={self.id}, vehicle_model='{self.vehicle_model}', years={self.year_start}-{self.year_end})>"