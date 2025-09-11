import pytest
import asyncio
from httpx import AsyncClient
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch

from app.main import app
from app.db.database import get_session, init_database
from app.db.models import User, Tenant
from app.core.security import create_access_token, get_password_hash
from app.api.v1.services import UserService
from app.api.v1.schemas import UserRole, UserCreate, UserUpdate


class TestUserEndpoints:
    """Testes para endpoints de usuários."""
    
    @pytest.fixture(autouse=True)
    async def setup_method(self):
        """Setup para cada teste."""
        await init_database()
        
        async with get_session() as session:
            # Criar tenant de teste
            self.test_tenant = Tenant(
                name="Test Company",
                subdomain="test",
                is_active=True
            )
            session.add(self.test_tenant)
            await session.commit()
            await session.refresh(self.test_tenant)
            
            # Criar usuário administrador
            self.admin_user = User(
                email="admin@example.com",
                username="admin",
                full_name="Admin User",
                hashed_password=get_password_hash("adminpassword123"),
                role=UserRole.GESTOR,
                tenant_id=self.test_tenant.id,
                is_active=True,
                email_verified=True
            )
            session.add(self.admin_user)
            await session.commit()
            await session.refresh(self.admin_user)
            
            # Criar token de acesso para admin
            self.admin_token = create_access_token({
                "sub": self.admin_user.email,
                "user_id": self.admin_user.id,
                "tenant_id": self.test_tenant.id,
                "role": self.admin_user.role.value
            })
            
            # Criar usuário comum
            self.regular_user = User(
                email="user@example.com",
                username="user",
                full_name="Regular User",
                hashed_password=get_password_hash("userpassword123"),
                role=UserRole.VENDEDOR,
                tenant_id=self.test_tenant.id,
                is_active=True,
                email_verified=True
            )
            session.add(self.regular_user)
            await session.commit()
            await session.refresh(self.regular_user)
            
            # Token para usuário comum
            self.user_token = create_access_token({
                "sub": self.regular_user.email,
                "user_id": self.regular_user.id,
                "tenant_id": self.test_tenant.id,
                "role": self.regular_user.role.value
            })
    
    @pytest.mark.asyncio
    async def test_create_user_success(self):
        """Teste de criação de usuário bem-sucedida."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/users/",
                json={
                    "email": "newuser@example.com",
                    "username": "newuser",
                    "full_name": "New User",
                    "password": "newpassword123",
                    "role": "vendedor"
                },
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            assert response.status_code == status.HTTP_201_CREATED
            data = response.json()
            
            assert data["email"] == "newuser@example.com"
            assert data["username"] == "newuser"
            assert data["role"] == "vendedor"
            assert data["is_active"] is True
            assert "password" not in data  # Senha não deve ser retornada
    
    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self):
        """Teste de criação de usuário com email duplicado."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/users/",
                json={
                    "email": "admin@example.com",  # Email já existe
                    "username": "newadmin",
                    "full_name": "New Admin",
                    "password": "newpassword123",
                    "role": "gestor"
                },
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
            data = response.json()
            assert "email" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_create_user_unauthorized(self):
        """Teste de criação de usuário sem autorização."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/users/",
                json={
                    "email": "newuser@example.com",
                    "username": "newuser",
                    "full_name": "New User",
                    "password": "newpassword123",
                    "role": "vendedor"
                },
                headers={"Authorization": f"Bearer {self.user_token}"}  # Usuário comum
            )
            
            assert response.status_code == status.HTTP_403_FORBIDDEN
    
    @pytest.mark.asyncio
    async def test_get_users_list(self):
        """Teste de listagem de usuários."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/users/",
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert "items" in data
            assert "total" in data
            assert "page" in data
            assert "size" in data
            
            # Deve ter pelo menos os 2 usuários criados no setup
            assert len(data["items"]) >= 2
            
            # Verificar se os dados estão corretos
            emails = [user["email"] for user in data["items"]]
            assert "admin@example.com" in emails
            assert "user@example.com" in emails
    
    @pytest.mark.asyncio
    async def test_get_users_list_with_filters(self):
        """Teste de listagem de usuários com filtros."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/users/?role=gestor&is_active=true",
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            # Deve retornar apenas usuários gestores ativos
            for user in data["items"]:
                assert user["role"] == "gestor"
                assert user["is_active"] is True
    
    @pytest.mark.asyncio
    async def test_get_user_by_id(self):
        """Teste de busca de usuário por ID."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/users/{self.regular_user.id}",
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["id"] == self.regular_user.id
            assert data["email"] == "user@example.com"
            assert data["role"] == "vendedor"
    
    @pytest.mark.asyncio
    async def test_get_user_not_found(self):
        """Teste de busca de usuário inexistente."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/users/99999",
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @pytest.mark.asyncio
    async def test_update_user_success(self):
        """Teste de atualização de usuário bem-sucedida."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/api/v1/users/{self.regular_user.id}",
                json={
                    "full_name": "Updated User Name",
                    "role": "anuncios"
                },
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["full_name"] == "Updated User Name"
            assert data["role"] == "anuncios"
            assert data["email"] == "user@example.com"  # Email não deve mudar
    
    @pytest.mark.asyncio
    async def test_update_user_unauthorized(self):
        """Teste de atualização de usuário sem autorização."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.put(
                f"/api/v1/users/{self.admin_user.id}",
                json={"full_name": "Hacked Name"},
                headers={"Authorization": f"Bearer {self.user_token}"}  # Usuário comum
            )
            
            assert response.status_code == status.HTTP_403_FORBIDDEN
    
    @pytest.mark.asyncio
    async def test_deactivate_user_success(self):
        """Teste de desativação de usuário bem-sucedida."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(
                f"/api/v1/users/{self.regular_user.id}",
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "desativado" in data["message"].lower()
            
            # Verificar se usuário foi desativado
            get_response = await client.get(
                f"/api/v1/users/{self.regular_user.id}",
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
            
            user_data = get_response.json()
            assert user_data["is_active"] is False
    
    @pytest.mark.asyncio
    async def test_change_password_success(self):
        """Teste de alteração de senha bem-sucedida."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/users/{self.regular_user.id}/change-password",
                json={
                    "current_password": "userpassword123",
                    "new_password": "newuserpassword123"
                },
                headers={"Authorization": f"Bearer {self.user_token}"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "alterada" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self):
        """Teste de alteração de senha com senha atual incorreta."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/users/{self.regular_user.id}/change-password",
                json={
                    "current_password": "wrongpassword",
                    "new_password": "newuserpassword123"
                },
                headers={"Authorization": f"Bearer {self.user_token}"}
            )
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    @pytest.mark.asyncio
    async def test_get_current_user(self):
        """Teste de obtenção do usuário atual."""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/v1/users/me",
                headers={"Authorization": f"Bearer {self.user_token}"}
            )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["email"] == "user@example.com"
            assert data["role"] == "vendedor"
            assert data["id"] == self.regular_user.id


class TestUserService:
    """Testes para o serviço de usuários."""
    
    @pytest.fixture(autouse=True)
    async def setup_method(self):
        """Setup para cada teste."""
        await init_database()
        
        async with get_session() as session:
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
    async def test_create_user_service(self):
        """Teste de criação de usuário via serviço."""
        async with get_session() as session:
            user_service = UserService(session)
            
            user_data = UserCreate(
                email="service@example.com",
                username="serviceuser",
                full_name="Service User",
                password="servicepassword123",
                role=UserRole.VENDEDOR
            )
            
            created_user = await user_service.create_user(
                user_data,
                tenant_id=self.test_tenant.id
            )
            
            assert created_user.email == "service@example.com"
            assert created_user.username == "serviceuser"
            assert created_user.role == UserRole.VENDEDOR
            assert created_user.tenant_id == self.test_tenant.id
            assert created_user.is_active is True
    
    @pytest.mark.asyncio
    async def test_get_user_by_email(self):
        """Teste de busca de usuário por email."""
        async with get_session() as session:
            user_service = UserService(session)
            
            # Criar usuário
            user = User(
                email="findme@example.com",
                username="findme",
                full_name="Find Me",
                hashed_password=get_password_hash("password123"),
                role=UserRole.VENDEDOR,
                tenant_id=self.test_tenant.id,
                is_active=True,
                email_verified=True
            )
            session.add(user)
            await session.commit()
            
            # Buscar usuário
            found_user = await user_service.get_user_by_email(
                "findme@example.com",
                tenant_id=self.test_tenant.id
            )
            
            assert found_user is not None
            assert found_user.email == "findme@example.com"
    
    @pytest.mark.asyncio
    async def test_update_user_service(self):
        """Teste de atualização de usuário via serviço."""
        async with get_session() as session:
            user_service = UserService(session)
            
            # Criar usuário
            user = User(
                email="update@example.com",
                username="updateme",
                full_name="Update Me",
                hashed_password=get_password_hash("password123"),
                role=UserRole.VENDEDOR,
                tenant_id=self.test_tenant.id,
                is_active=True,
                email_verified=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            # Atualizar usuário
            update_data = UserUpdate(
                full_name="Updated Name",
                role=UserRole.ANUNCIOS
            )
            
            updated_user = await user_service.update_user(
                user.id,
                update_data,
                tenant_id=self.test_tenant.id
            )
            
            assert updated_user.full_name == "Updated Name"
            assert updated_user.role == UserRole.ANUNCIOS
            assert updated_user.email == "update@example.com"  # Não deve mudar
    
    @pytest.mark.asyncio
    async def test_deactivate_user_service(self):
        """Teste de desativação de usuário via serviço."""
        async with get_session() as session:
            user_service = UserService(session)
            
            # Criar usuário
            user = User(
                email="deactivate@example.com",
                username="deactivateme",
                full_name="Deactivate Me",
                hashed_password=get_password_hash("password123"),
                role=UserRole.VENDEDOR,
                tenant_id=self.test_tenant.id,
                is_active=True,
                email_verified=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            # Desativar usuário
            success = await user_service.deactivate_user(
                user.id,
                tenant_id=self.test_tenant.id
            )
            
            assert success is True
            
            # Verificar se foi desativado
            await session.refresh(user)
            assert user.is_active is False
    
    @pytest.mark.asyncio
    async def test_change_password_service(self):
        """Teste de alteração de senha via serviço."""
        async with get_session() as session:
            user_service = UserService(session)
            
            # Criar usuário
            original_password = "password123"
            user = User(
                email="changepass@example.com",
                username="changepass",
                full_name="Change Pass",
                hashed_password=get_password_hash(original_password),
                role=UserRole.VENDEDOR,
                tenant_id=self.test_tenant.id,
                is_active=True,
                email_verified=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            
            # Alterar senha
            new_password = "newpassword123"
            success = await user_service.change_password(
                user.id,
                original_password,
                new_password,
                tenant_id=self.test_tenant.id
            )
            
            assert success is True
            
            # Verificar se a nova senha funciona
            from app.core.security import verify_password
            await session.refresh(user)
            assert verify_password(new_password, user.hashed_password)
            assert not verify_password(original_password, user.hashed_password)


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
        await session.execute("DELETE FROM users")
        await session.execute("DELETE FROM tenants")
        await session.commit()