import pytest
import asyncio
from datetime import datetime, timedelta
from httpx import AsyncClient
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch, MagicMock

from app.main import app
from app.db.database import get_session, init_database
from app.db.models import User, Tenant, RefreshToken
from app.core.security import create_access_token, verify_password, get_password_hash
from app.api.v1.services import AuthService
from app.api.v1.schemas import LoginRequest, UserRole


class TestAuthEndpoints:
    """Testes para endpoints de autenticação."""
    
    @pytest.fixture(autouse=True)
    async def setup_method(self):
        """Setup para cada teste."""
        # Inicializar banco de dados de teste
        await init_database()
        
        # Criar tenant de teste
        async with get_session() as session:
            self.test_tenant = Tenant(
                name="Test Company",
                subdomain="test",
                is_active=True
            )
            session.add(self.test_tenant)
            await session.commit()
            await session.refresh(self.test_tenant)
            
            # Criar usuário de teste
            self.test_user = User(
                email="test@example.com",
                username="testuser",
                full_name="Test User",
                hashed_password=get_password_hash("testpassword123"),
                role=UserRole.GESTOR,
                tenant_id=self.test_tenant.id,
                is_active=True,
                email_verified=True
            )
            session.add(self.test_user)
            await session.commit()
            await session.refresh(self.test_user)
    
    @pytest.mark.asyncio
    async def test_login_success(self):
        """Teste de login bem-sucedido."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "testpassword123"
                }
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["token_type"] == "bearer"
            assert data["user"]["email"] == "test@example.com"
            assert data["user"]["role"] == "gestor"
    
    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self):
        """Teste de login com credenciais inválidas."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "wrongpassword"
                }
            )
            
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            data = response.json()
            assert "access_token" not in data
    
    @pytest.mark.asyncio
    async def test_login_inactive_user(self):
        """Teste de login com usuário inativo."""
        # Desativar usuário
        async with get_session() as session:
            user = await session.get(User, self.test_user.id)
            user.is_active = False
            await session.commit()
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "testpassword123"
                }
            )
            
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.asyncio
    async def test_refresh_token_success(self):
        """Teste de refresh token bem-sucedido."""
        # Primeiro fazer login para obter tokens
        async with AsyncClient(app=app, base_url="http://test") as client:
            login_response = await client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "testpassword123"
                }
            )
            
            login_data = login_response.json()
            refresh_token = login_data["refresh_token"]
            
            # Usar refresh token
            response = await client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": refresh_token}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self):
        """Teste de refresh token inválido."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": "invalid_token"}
            )
            
            assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @pytest.mark.asyncio
    async def test_logout_success(self):
        """Teste de logout bem-sucedido."""
        # Fazer login primeiro
        async with AsyncClient(app=app, base_url="http://test") as client:
            login_response = await client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "testpassword123"
                }
            )
            
            login_data = login_response.json()
            access_token = login_data["access_token"]
            refresh_token = login_data["refresh_token"]
            
            # Fazer logout
            response = await client.post(
                "/api/v1/auth/logout",
                json={"refresh_token": refresh_token},
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["message"] == "Logout realizado com sucesso"
    
    @pytest.mark.asyncio
    async def test_password_recovery_request(self):
        """Teste de solicitação de recuperação de senha."""
        with patch('app.api.v1.services.AuthService.send_password_recovery_email') as mock_send:
            mock_send.return_value = True
            
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/v1/auth/password-recovery",
                    json={"email": "test@example.com"}
                )
                
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert "token enviado" in data["message"].lower()
                mock_send.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_password_recovery_invalid_email(self):
        """Teste de recuperação de senha com email inválido."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/auth/password-recovery",
                json={"email": "nonexistent@example.com"}
            )
            
            # Deve retornar sucesso mesmo para email inexistente (segurança)
            assert response.status_code == status.HTTP_200_OK
    
    @pytest.mark.asyncio
    async def test_2fa_enable_success(self):
        """Teste de habilitação do 2FA."""
        # Fazer login primeiro
        async with AsyncClient(app=app, base_url="http://test") as client:
            login_response = await client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "testpassword123"
                }
            )
            
            access_token = login_response.json()["access_token"]
            
            # Habilitar 2FA
            response = await client.post(
                "/api/v1/auth/2fa/enable",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert "secret" in data
            assert "qr_code" in data
            assert "backup_codes" in data
            assert len(data["backup_codes"]) == 10
    
    @pytest.mark.asyncio
    async def test_2fa_verify_success(self):
        """Teste de verificação do 2FA."""
        with patch('pyotp.TOTP.verify') as mock_verify:
            mock_verify.return_value = True
            
            # Fazer login primeiro
            async with AsyncClient(app=app, base_url="http://test") as client:
                login_response = await client.post(
                    "/api/v1/auth/login",
                    json={
                        "email": "test@example.com",
                        "password": "testpassword123"
                    }
                )
                
                access_token = login_response.json()["access_token"]
                
                # Habilitar 2FA primeiro
                enable_response = await client.post(
                    "/api/v1/auth/2fa/enable",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                # Verificar 2FA
                response = await client.post(
                    "/api/v1/auth/2fa/verify",
                    json={"code": "123456"},
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert data["message"] == "2FA verificado e ativado com sucesso"


class TestAuthService:
    """Testes para o serviço de autenticação."""
    
    @pytest.fixture(autouse=True)
    async def setup_method(self):
        """Setup para cada teste."""
        await init_database()
        
        async with get_session() as session:
            self.session = session
            self.auth_service = AuthService(session)
            
            # Criar tenant de teste
            self.test_tenant = Tenant(
                name="Test Company",
                subdomain="test",
                is_active=True
            )
            session.add(self.test_tenant)
            await session.commit()
            await session.refresh(self.test_tenant)
    
    @pytest.mark.asyncio
    async def test_authenticate_user_success(self):
        """Teste de autenticação de usuário bem-sucedida."""
        async with get_session() as session:
            auth_service = AuthService(session)
            
            # Criar usuário
            user = User(
                email="test@example.com",
                username="testuser",
                full_name="Test User",
                hashed_password=get_password_hash("testpassword123"),
                role=UserRole.GESTOR,
                tenant_id=self.test_tenant.id,
                is_active=True,
                email_verified=True
            )
            session.add(user)
            await session.commit()
            
            # Autenticar
            authenticated_user = await auth_service.authenticate_user(
                "test@example.com",
                "testpassword123"
            )
            
            assert authenticated_user is not None
            assert authenticated_user.email == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(self):
        """Teste de autenticação com senha incorreta."""
        async with get_session() as session:
            auth_service = AuthService(session)
            
            # Criar usuário
            user = User(
                email="test@example.com",
                username="testuser",
                full_name="Test User",
                hashed_password=get_password_hash("testpassword123"),
                role=UserRole.GESTOR,
                tenant_id=self.test_tenant.id,
                is_active=True,
                email_verified=True
            )
            session.add(user)
            await session.commit()
            
            # Tentar autenticar com senha errada
            authenticated_user = await auth_service.authenticate_user(
                "test@example.com",
                "wrongpassword"
            )
            
            assert authenticated_user is None
    
    @pytest.mark.asyncio
    async def test_create_tokens(self):
        """Teste de criação de tokens."""
        async with get_session() as session:
            auth_service = AuthService(session)
            
            # Criar usuário
            user = User(
                email="test@example.com",
                username="testuser",
                full_name="Test User",
                hashed_password=get_password_hash("testpassword123"),
                role=UserRole.GESTOR,
                tenant_id=self.test_tenant.id,
                is_active=True,
                email_verified=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            # Criar tokens
            tokens = await auth_service.create_tokens(user)
            
            assert "access_token" in tokens
            assert "refresh_token" in tokens
            assert tokens["token_type"] == "bearer"
            
            # Verificar se refresh token foi salvo no banco
            refresh_token_record = await session.get(
                RefreshToken,
                tokens["refresh_token"]
            )
            assert refresh_token_record is not None
            assert refresh_token_record.user_id == user.id


class TestSecurityFunctions:
    """Testes para funções de segurança."""
    
    def test_password_hashing(self):
        """Teste de hash de senha."""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert verify_password(password, hashed)
        assert not verify_password("wrongpassword", hashed)
    
    def test_jwt_token_creation(self):
        """Teste de criação de token JWT."""
        data = {"sub": "test@example.com", "user_id": 1}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_jwt_token_expiration(self):
        """Teste de expiração de token JWT."""
        data = {"sub": "test@example.com", "user_id": 1}
        
        # Token com expiração muito curta
        token = create_access_token(
            data,
            expires_delta=timedelta(seconds=-1)  # Já expirado
        )
        
        # Verificar se o token foi criado (a validação de expiração é feita na decodificação)
        assert isinstance(token, str)
        assert len(token) > 0


# Configuração do pytest
@pytest.fixture(scope="session")
def event_loop():
    """Criar event loop para testes assíncronos."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def cleanup_database():
    """Limpar banco de dados após cada teste."""
    yield
    
    # Cleanup após teste
    async with get_session() as session:
        # Remover dados de teste
        await session.execute("DELETE FROM refresh_tokens")
        await session.execute("DELETE FROM users")
        await session.execute("DELETE FROM tenants")
        await session.commit()