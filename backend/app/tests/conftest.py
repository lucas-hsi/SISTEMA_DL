import pytest
import asyncio
import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient

from app.main import app
from app.db.models import Base
from app.db.database import get_session
from app.core.config import get_settings

# Configurar variáveis de ambiente para testes
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:postgres@localhost:5432/dl_sistema_test"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["DEBUG"] = "true"

settings = get_settings()

# Engine de teste
test_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # Não mostrar SQL nos testes
    future=True
)

# Session factory para testes
TestSessionLocal = sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    """Criar event loop para toda a sessão de testes."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def setup_test_database():
    """Configurar banco de dados de teste."""
    # Criar todas as tabelas
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Cleanup final
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await test_engine.dispose()


@pytest.fixture
async def db_session(setup_test_database) -> AsyncGenerator[AsyncSession, None]:
    """Criar sessão de banco de dados para cada teste."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Criar cliente HTTP para testes."""
    
    # Override da dependência de sessão
    async def override_get_session():
        yield db_session
    
    app.dependency_overrides[get_session] = override_get_session
    
    async with AsyncClient(app=app, base_url="http://test") as test_client:
        yield test_client
    
    # Limpar overrides
    app.dependency_overrides.clear()


@pytest.fixture
def anyio_backend():
    """Configurar backend para anyio (usado pelo pytest-asyncio)."""
    return "asyncio"


# Configurações globais do pytest
pytestmark = pytest.mark.asyncio


# Fixtures de dados comuns
@pytest.fixture
def sample_tenant_data():
    """Dados de exemplo para tenant."""
    return {
        "name": "Test Company",
        "subdomain": "test",
        "is_active": True
    }


@pytest.fixture
def sample_user_data():
    """Dados de exemplo para usuário."""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "testpassword123",
        "role": "gestor"
    }


@pytest.fixture
def sample_admin_data():
    """Dados de exemplo para usuário administrador."""
    return {
        "email": "admin@example.com",
        "username": "admin",
        "full_name": "Admin User",
        "password": "adminpassword123",
        "role": "gestor"
    }


# Helpers para testes
class TestHelpers:
    """Classe com métodos auxiliares para testes."""
    
    @staticmethod
    async def create_test_tenant(session: AsyncSession, **kwargs):
        """Criar tenant de teste."""
        from app.db.models import Tenant
        
        tenant_data = {
            "name": "Test Company",
            "subdomain": "test",
            "is_active": True,
            **kwargs
        }
        
        tenant = Tenant(**tenant_data)
        session.add(tenant)
        await session.commit()
        await session.refresh(tenant)
        return tenant
    
    @staticmethod
    async def create_test_user(session: AsyncSession, tenant_id: int, **kwargs):
        """Criar usuário de teste."""
        from app.db.models import User
        from app.api.v1.schemas import UserRole
        from app.core.security import get_password_hash
        
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "full_name": "Test User",
            "hashed_password": get_password_hash("testpassword123"),
            "role": UserRole.GESTOR,
            "tenant_id": tenant_id,
            "is_active": True,
            "email_verified": True,
            **kwargs
        }
        
        user = User(**user_data)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user
    
    @staticmethod
    def create_test_token(user_id: int, email: str, tenant_id: int, role: str):
        """Criar token de teste."""
        from app.core.security import create_access_token
        
        return create_access_token({
            "sub": email,
            "user_id": user_id,
            "tenant_id": tenant_id,
            "role": role
        })


@pytest.fixture
def test_helpers():
    """Fixture para acessar helpers de teste."""
    return TestHelpers


# Configurações de logging para testes
import logging

# Reduzir verbosidade dos logs durante testes
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
logging.getLogger("asyncio").setLevel(logging.WARNING)


# Markers personalizados
def pytest_configure(config):
    """Configurar markers personalizados."""
    config.addinivalue_line(
        "markers", "integration: marca testes de integração"
    )
    config.addinivalue_line(
        "markers", "unit: marca testes unitários"
    )
    config.addinivalue_line(
        "markers", "slow: marca testes que demoram para executar"
    )
    config.addinivalue_line(
        "markers", "auth: marca testes relacionados à autenticação"
    )
    config.addinivalue_line(
        "markers", "users: marca testes relacionados a usuários"
    )