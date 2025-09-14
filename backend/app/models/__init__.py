# Importa todos os modelos para que o Alembic possa encontrá-los
from .base import Base
from .user import User
from .company import Company

__all__ = ["Base", "User", "Company"]