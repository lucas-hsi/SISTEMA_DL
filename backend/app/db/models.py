from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, Numeric, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from typing import Optional


Base = declarative_base()


class TenantMixin:
    """Mixin para suporte multi-tenant."""
    tenant_id = Column(String(50), nullable=False, index=True)


class TimestampMixin:
    """Mixin para campos de timestamp."""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Tenant(Base, TimestampMixin):
    """Modelo para gerenciamento de tenants (empresas)."""
    __tablename__ = "tenants"
    
    id = Column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    domain = Column(String(255), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    settings = Column(JSON, default=dict)
    
    # Configurações específicas do tenant
    max_users = Column(Integer, default=10)
    max_products = Column(Integer, default=1000)
    
    # Relacionamentos
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tenant", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Tenant(id={self.id}, name={self.name})>"


class User(Base, TenantMixin, TimestampMixin):
    """Modelo de usuário com suporte multi-tenant."""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Perfis de usuário
    profile_type = Column(String(50), nullable=False)  # 'gestor', 'vendedor', 'anuncios'
    
    # Campos para 2FA
    is_2fa_enabled = Column(Boolean, default=False, nullable=False)
    totp_secret = Column(String(32), nullable=True)
    backup_codes = Column(JSON, default=list)  # Lista de códigos de backup com hash
    
    # Campos para recuperação de senha
    last_login = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    
    # Relacionamentos
    tenant = relationship("Tenant", back_populates="users")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    
    # Índices compostos para performance
    __table_args__ = (
        Index('ix_users_tenant_email', 'tenant_id', 'email', unique=True),
        Index('ix_users_tenant_active', 'tenant_id', 'is_active'),
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, tenant_id={self.tenant_id})>"


class RefreshToken(Base, TenantMixin, TimestampMixin):
    """Modelo para tokens de refresh JWT."""
    __tablename__ = "refresh_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token = Column(String(500), nullable=False, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    
    # Informações do dispositivo/sessão
    device_info = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)  # Suporta IPv6
    user_agent = Column(Text, nullable=True)
    
    # Relacionamentos
    user = relationship("User", back_populates="refresh_tokens")
    
    __table_args__ = (
        Index('ix_refresh_tokens_tenant_user', 'tenant_id', 'user_id'),
        Index('ix_refresh_tokens_expires', 'expires_at'),
    )
    
    def __repr__(self):
        return f"<RefreshToken(id={self.id}, user_id={self.user_id})>"


class AuditLog(Base, TenantMixin, TimestampMixin):
    """Modelo para logs de auditoria."""
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # 'login', 'logout', 'create', 'update', 'delete'
    resource = Column(String(100), nullable=True)  # Recurso afetado
    resource_id = Column(String(100), nullable=True)  # ID do recurso
    
    # Detalhes da requisição
    method = Column(String(10), nullable=False)  # GET, POST, PUT, DELETE
    endpoint = Column(String(255), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Dados da requisição e resposta
    request_data = Column(JSON, default=dict)
    response_status = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    
    # Dados adicionais
    metadata = Column(JSON, default=dict)
    
    # Relacionamentos
    tenant = relationship("Tenant", back_populates="audit_logs")
    user = relationship("User")
    
    __table_args__ = (
        Index('ix_audit_logs_tenant_user', 'tenant_id', 'user_id'),
        Index('ix_audit_logs_action', 'action'),
        Index('ix_audit_logs_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, tenant_id={self.tenant_id})>"


class Product(Base, TenantMixin, TimestampMixin):
    """Modelo de produto com integração Mercado Livre."""
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Informações básicas do produto
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sku = Column(String(100), nullable=False)
    barcode = Column(String(50), nullable=True)
    
    # Preços e estoque
    cost_price = Column(Numeric(10, 2), nullable=False)
    sale_price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    min_stock = Column(Integer, default=0, nullable=False)
    
    # Categorização
    category = Column(String(100), nullable=True)
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    year = Column(Integer, nullable=True)
    
    # Integração Mercado Livre
    ml_item_id = Column(String(50), nullable=True, unique=True)
    ml_permalink = Column(String(500), nullable=True)
    ml_status = Column(String(50), nullable=True)  # 'active', 'paused', 'closed'
    ml_last_sync = Column(DateTime(timezone=True), nullable=True)
    ml_data = Column(JSON, default=dict)  # Dados completos do ML
    
    # Status e flags
    is_active = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    
    # Relacionamentos
    tenant = relationship("Tenant")
    
    __table_args__ = (
        Index('ix_products_tenant_sku', 'tenant_id', 'sku', unique=True),
        Index('ix_products_tenant_active', 'tenant_id', 'is_active'),
        Index('ix_products_ml_item_id', 'ml_item_id'),
        Index('ix_products_category', 'category'),
    )
    
    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, tenant_id={self.tenant_id})>"


class MLIntegration(Base, TenantMixin, TimestampMixin):
    """Modelo para configurações de integração com Mercado Livre."""
    __tablename__ = "ml_integrations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Credenciais do Mercado Livre
    app_id = Column(String(100), nullable=False)
    client_secret = Column(String(255), nullable=False)
    access_token = Column(String(500), nullable=True)
    refresh_token = Column(String(500), nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Configurações
    user_id = Column(String(50), nullable=True)  # User ID do ML
    nickname = Column(String(100), nullable=True)  # Nickname do vendedor
    site_id = Column(String(10), default='MLB', nullable=False)  # MLB = Brasil
    
    # Status da integração
    is_active = Column(Boolean, default=True, nullable=False)
    last_sync = Column(DateTime(timezone=True), nullable=True)
    sync_status = Column(String(50), default='pending')  # 'pending', 'syncing', 'completed', 'error'
    sync_error = Column(Text, nullable=True)
    
    # Estatísticas
    total_products_synced = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    
    # Relacionamentos
    tenant = relationship("Tenant")
    
    __table_args__ = (
        Index('ix_ml_integrations_tenant', 'tenant_id'),
        Index('ix_ml_integrations_active', 'is_active'),
    )
    
    def __repr__(self):
        return f"<MLIntegration(id={self.id}, tenant_id={self.tenant_id}, nickname={self.nickname})>"


class SystemConfig(Base, TimestampMixin):
    """Modelo para configurações globais do sistema."""
    __tablename__ = "system_configs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)  # Se pode ser acessado sem autenticação
    
    def __repr__(self):
        return f"<SystemConfig(key={self.key})>"