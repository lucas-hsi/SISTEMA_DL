from pydantic import BaseSettings, validator
from typing import Optional, List
import secrets
from functools import lru_cache


class Settings(BaseSettings):
    """Configurações da aplicação com suporte a variáveis de ambiente."""
    
    # Configurações gerais da aplicação
    PROJECT_NAME: str = "DL Auto Peças API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    
    # Configurações de segurança JWT
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Configurações do banco de dados PostgreSQL
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "dl_sistema"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[str] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        """Monta a URL de conexão do banco se não fornecida."""
        if isinstance(v, str):
            return v
        return (
            f"postgresql+asyncpg://{values.get('POSTGRES_USER')}:"
            f"{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_SERVER')}:"
            f"{values.get('POSTGRES_PORT')}/{values.get('POSTGRES_DB')}"
        )
    
    # Configurações de CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://localhost:3000",
        "https://localhost:8000",
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Processa as origens CORS."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Configurações de email (para recuperação de senha)
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Configurações de WhatsApp (para notificações)
    WHATSAPP_API_URL: Optional[str] = None
    WHATSAPP_API_TOKEN: Optional[str] = None
    
    # Configurações de Redis (para cache e sessões)
    REDIS_URL: str = "redis://localhost:6379"
    
    # Configurações de auditoria
    ENABLE_AUDIT_LOG: bool = True
    AUDIT_LOG_RETENTION_DAYS: int = 90
    
    # Configurações multi-tenant
    DEFAULT_TENANT_ID: str = "default"
    TENANT_HEADER_NAME: str = "X-Tenant-ID"
    
    # Configurações de 2FA
    TOTP_ISSUER_NAME: str = "DL Auto Peças"
    BACKUP_CODES_COUNT: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Retorna uma instância singleton das configurações."""
    return Settings()


# Instância global das configurações
settings = get_settings()