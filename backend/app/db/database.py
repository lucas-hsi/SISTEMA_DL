from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import event
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import logging
from ..core.config import settings
from .models import Base


# Logger para operações de banco
logger = logging.getLogger(__name__)


# Engine assíncrono do SQLAlchemy
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries em modo debug
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,  # Verifica conexões antes de usar
    pool_recycle=3600,   # Recicla conexões a cada hora
)


# Session factory assíncrona
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=True,
    autocommit=False,
)


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Context manager para sessões de banco de dados.
    
    Yields:
        AsyncSession: Sessão de banco de dados
        
    Example:
        async with get_db_session() as db:
            result = await db.execute(select(User))
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency para injeção de dependência do FastAPI.
    
    Yields:
        AsyncSession: Sessão de banco de dados
        
    Example:
        @app.get("/users/")
        async def get_users(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(User))
            return result.scalars().all()
    """
    async with get_db_session() as session:
        yield session


async def init_db() -> None:
    """Inicializa o banco de dados criando todas as tabelas.
    
    Esta função deve ser chamada na inicialização da aplicação.
    """
    try:
        logger.info("Iniciando criação das tabelas do banco de dados...")
        
        async with engine.begin() as conn:
            # Cria todas as tabelas definidas nos modelos
            await conn.run_sync(Base.metadata.create_all)
            
        logger.info("Tabelas criadas com sucesso!")
        
        # Cria dados iniciais se necessário
        await create_initial_data()
        
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {e}")
        raise


async def create_initial_data() -> None:
    """Cria dados iniciais no banco de dados.
    
    Inclui:
    - Tenant padrão
    - Usuário administrador padrão
    - Configurações do sistema
    """
    from .models import Tenant, User, SystemConfig
    from ..core.security import get_password_hash
    import uuid
    
    async with get_db_session() as db:
        try:
            # Verifica se já existe tenant padrão
            from sqlalchemy import select
            result = await db.execute(
                select(Tenant).where(Tenant.id == settings.DEFAULT_TENANT_ID)
            )
            existing_tenant = result.scalar_one_or_none()
            
            if not existing_tenant:
                # Cria tenant padrão
                default_tenant = Tenant(
                    id=settings.DEFAULT_TENANT_ID,
                    name="DL Auto Peças - Principal",
                    domain="default.dl-autopecas.com",
                    is_active=True,
                    max_users=100,
                    max_products=10000,
                    settings={
                        "theme": "light",
                        "language": "pt-BR",
                        "timezone": "America/Sao_Paulo",
                        "currency": "BRL"
                    }
                )
                db.add(default_tenant)
                await db.flush()
                
                logger.info(f"Tenant padrão criado: {default_tenant.id}")
                
                # Cria usuário administrador padrão
                admin_user = User(
                    id=uuid.uuid4(),
                    tenant_id=settings.DEFAULT_TENANT_ID,
                    email="admin@dl-autopecas.com",
                    hashed_password=get_password_hash("admin123"),
                    full_name="Administrador do Sistema",
                    is_active=True,
                    is_superuser=True,
                    profile_type="gestor",
                    is_2fa_enabled=False
                )
                db.add(admin_user)
                
                logger.info(f"Usuário administrador criado: {admin_user.email}")
            
            # Cria configurações do sistema
            system_configs = [
                {
                    "key": "app_version",
                    "value": {"version": settings.VERSION},
                    "description": "Versão atual da aplicação",
                    "is_public": True
                },
                {
                    "key": "maintenance_mode",
                    "value": {"enabled": False, "message": ""},
                    "description": "Modo de manutenção do sistema",
                    "is_public": True
                },
                {
                    "key": "ml_api_settings",
                    "value": {
                        "base_url": "https://api.mercadolibre.com",
                        "auth_url": "https://auth.mercadolivre.com.br",
                        "site_id": "MLB",
                        "rate_limit": 1000
                    },
                    "description": "Configurações da API do Mercado Livre",
                    "is_public": False
                },
                {
                    "key": "email_settings",
                    "value": {
                        "templates_enabled": True,
                        "send_welcome_email": True,
                        "send_password_reset": True
                    },
                    "description": "Configurações de email",
                    "is_public": False
                }
            ]
            
            for config_data in system_configs:
                # Verifica se a configuração já existe
                result = await db.execute(
                    select(SystemConfig).where(SystemConfig.key == config_data["key"])
                )
                existing_config = result.scalar_one_or_none()
                
                if not existing_config:
                    config = SystemConfig(
                        key=config_data["key"],
                        value=config_data["value"],
                        description=config_data["description"],
                        is_public=config_data["is_public"]
                    )
                    db.add(config)
                    logger.info(f"Configuração criada: {config.key}")
            
            await db.commit()
            logger.info("Dados iniciais criados com sucesso!")
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Erro ao criar dados iniciais: {e}")
            raise


async def close_db() -> None:
    """Fecha as conexões do banco de dados.
    
    Esta função deve ser chamada no shutdown da aplicação.
    """
    try:
        await engine.dispose()
        logger.info("Conexões do banco de dados fechadas com sucesso!")
    except Exception as e:
        logger.error(f"Erro ao fechar conexões do banco: {e}")


# Event listeners para logging e monitoramento
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Configura pragmas específicos do banco (se necessário)."""
    pass


@event.listens_for(engine.sync_engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Log de queries SQL em modo debug."""
    if settings.DEBUG:
        logger.debug(f"SQL Query: {statement}")
        if parameters:
            logger.debug(f"Parameters: {parameters}")


class DatabaseHealthCheck:
    """Classe para verificação de saúde do banco de dados."""
    
    @staticmethod
    async def check_connection() -> dict:
        """Verifica se a conexão com o banco está funcionando.
        
        Returns:
            dict: Status da conexão
        """
        try:
            async with get_db_session() as db:
                # Executa uma query simples para testar a conexão
                from sqlalchemy import text
                result = await db.execute(text("SELECT 1"))
                result.scalar()
                
                return {
                    "status": "healthy",
                    "message": "Database connection is working",
                    "timestamp": str(datetime.utcnow())
                }
                
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "message": f"Database connection failed: {str(e)}",
                "timestamp": str(datetime.utcnow())
            }
    
    @staticmethod
    async def get_stats() -> dict:
        """Retorna estatísticas do banco de dados.
        
        Returns:
            dict: Estatísticas do banco
        """
        try:
            async with get_db_session() as db:
                from sqlalchemy import text, select
                from .models import User, Tenant, Product, AuditLog
                
                # Conta registros nas principais tabelas
                stats = {}
                
                # Tenants
                result = await db.execute(select(func.count(Tenant.id)))
                stats["tenants_count"] = result.scalar()
                
                # Usuários
                result = await db.execute(select(func.count(User.id)))
                stats["users_count"] = result.scalar()
                
                # Produtos
                result = await db.execute(select(func.count(Product.id)))
                stats["products_count"] = result.scalar()
                
                # Logs de auditoria (últimos 30 dias)
                from datetime import datetime, timedelta
                thirty_days_ago = datetime.utcnow() - timedelta(days=30)
                result = await db.execute(
                    select(func.count(AuditLog.id))
                    .where(AuditLog.created_at >= thirty_days_ago)
                )
                stats["audit_logs_30d"] = result.scalar()
                
                return {
                    "status": "success",
                    "data": stats,
                    "timestamp": str(datetime.utcnow())
                }
                
        except Exception as e:
            logger.error(f"Failed to get database stats: {e}")
            return {
                "status": "error",
                "message": str(e),
                "timestamp": str(datetime.utcnow())
            }