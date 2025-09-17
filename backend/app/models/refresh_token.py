from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base_class import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relacionamento com User
    user = relationship("User", back_populates="refresh_tokens")
    
    def is_expired(self) -> bool:
        """Verifica se o token está expirado"""
        now = datetime.now(timezone.utc)
        # Garantir que expires_at tenha timezone para comparação
        if self.expires_at.tzinfo is None:
            expires_at_utc = self.expires_at.replace(tzinfo=timezone.utc)
        else:
            expires_at_utc = self.expires_at
        return now >= expires_at_utc
    
    def is_valid(self) -> bool:
        """Verifica se o token é válido (não expirado e não revogado)"""
        return not self.is_expired() and not self.is_revoked