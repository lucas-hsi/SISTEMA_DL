import time
import json
import logging
from typing import Callable, Optional
from uuid import UUID, uuid4
from datetime import datetime

from fastapi import Request, Response
from fastapi.routing import APIRoute
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db_session
from app.db.models import AuditLog
from app.core.security import verify_token

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware para auditoria de requisições HTTP."""
    
    def __init__(self, app, exclude_paths: Optional[list] = None):
        super().__init__(app)
        # Paths que não devem ser auditados (para evitar spam de logs)
        self.exclude_paths = exclude_paths or [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico",
            "/health",
            "/metrics"
        ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> StarletteResponse:
        """Processa a requisição e registra auditoria."""
        start_time = time.time()
        
        # Extrair informações da requisição
        method = request.method
        url = str(request.url)
        path = request.url.path
        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        # Verificar se deve auditar esta requisição
        should_audit = self._should_audit_path(path)
        
        # Extrair informações do usuário se autenticado
        user_id = None
        tenant_id = None
        
        if should_audit:
            user_info = await self._extract_user_info(request)
            user_id = user_info.get("user_id")
            tenant_id = user_info.get("tenant_id")
        
        # Processar requisição
        response = await call_next(request)
        
        # Calcular tempo de resposta
        process_time = time.time() - start_time
        response_time_ms = int(process_time * 1000)
        
        # Registrar auditoria se necessário
        if should_audit:
            await self._log_request(
                user_id=user_id,
                tenant_id=tenant_id,
                method=method,
                endpoint=path,
                full_url=url,
                ip_address=ip_address,
                user_agent=user_agent,
                response_status=response.status_code,
                response_time_ms=response_time_ms,
                request=request
            )
        
        # Adicionar headers de resposta
        response.headers["X-Process-Time"] = str(process_time)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extrai o IP real do cliente."""
        # Verificar headers de proxy
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Pegar o primeiro IP da lista (cliente original)
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        # Fallback para IP direto
        return request.client.host if request.client else "unknown"
    
    def _should_audit_path(self, path: str) -> bool:
        """Verifica se o path deve ser auditado."""
        # Não auditar paths excluídos
        for exclude_path in self.exclude_paths:
            if path.startswith(exclude_path):
                return False
        
        # Não auditar arquivos estáticos
        static_extensions = [".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg"]
        if any(path.lower().endswith(ext) for ext in static_extensions):
            return False
        
        return True
    
    async def _extract_user_info(self, request: Request) -> dict:
        """Extrai informações do usuário da requisição."""
        user_info = {"user_id": None, "tenant_id": None}
        
        try:
            # Tentar extrair token do header Authorization
            authorization = request.headers.get("Authorization")
            if not authorization or not authorization.startswith("Bearer "):
                return user_info
            
            token = authorization.split(" ")[1]
            
            # Verificar e decodificar token
            payload = verify_token(token, "access")
            if payload:
                user_id_str = payload.get("sub")
                if user_id_str:
                    user_info["user_id"] = UUID(user_id_str)
                
                tenant_id = payload.get("tenant_id")
                if tenant_id:
                    user_info["tenant_id"] = tenant_id
            
        except Exception as e:
            # Log do erro mas não falhar a requisição
            logger.debug(f"Erro ao extrair informações do usuário: {str(e)}")
        
        return user_info
    
    async def _log_request(
        self,
        user_id: Optional[UUID],
        tenant_id: Optional[str],
        method: str,
        endpoint: str,
        full_url: str,
        ip_address: str,
        user_agent: str,
        response_status: int,
        response_time_ms: int,
        request: Request
    ) -> None:
        """Registra a requisição no banco de dados."""
        try:
            # Determinar ação baseada no método e endpoint
            action = self._determine_action(method, endpoint, response_status)
            
            # Extrair recurso e ID do recurso do path
            resource, resource_id = self._extract_resource_info(endpoint)
            
            # Criar sessão do banco
            async with get_db_session() as db:
                audit_log = AuditLog(
                    id=uuid4(),
                    user_id=user_id,
                    action=action,
                    resource=resource,
                    resource_id=resource_id,
                    method=method,
                    endpoint=endpoint,
                    ip_address=ip_address,
                    response_status=response_status,
                    response_time_ms=response_time_ms,
                    tenant_id=tenant_id or "default",
                    metadata={
                        "full_url": full_url,
                        "user_agent": user_agent[:500] if user_agent else None,  # Limitar tamanho
                        "query_params": dict(request.query_params) if request.query_params else None
                    }
                )
                
                db.add(audit_log)
                await db.commit()
                
        except Exception as e:
            # Log do erro mas não falhar a requisição
            logger.error(f"Erro ao registrar auditoria: {str(e)}")
    
    def _determine_action(self, method: str, endpoint: str, status_code: int) -> str:
        """Determina a ação baseada no método HTTP e endpoint."""
        # Mapear ações específicas por endpoint
        endpoint_actions = {
            "/auth/login": "LOGIN_ATTEMPT" if status_code != 200 else "LOGIN_SUCCESS",
            "/auth/logout": "LOGOUT",
            "/auth/refresh-token": "TOKEN_REFRESH",
            "/auth/password-recovery": "PASSWORD_RECOVERY_REQUEST",
            "/auth/password-reset": "PASSWORD_RESET",
            "/auth/2fa/enable": "2FA_ENABLE_ATTEMPT",
            "/auth/2fa/confirm": "2FA_CONFIRM",
            "/auth/2fa/disable": "2FA_DISABLE"
        }
        
        # Verificar ações específicas
        if endpoint in endpoint_actions:
            return endpoint_actions[endpoint]
        
        # Mapear por método HTTP
        method_actions = {
            "GET": "READ",
            "POST": "create",
            "PUT": "update",
            "PATCH": "update",
            "DELETE": "delete"
        }
        
        base_action = method_actions.get(method.upper(), "unknown")
        
        # Adicionar contexto baseado no status
        if status_code >= 400:
            return f"{base_action.upper()}_FAILED"
        else:
            return f"{base_action.upper()}_SUCCESS"
    
    def _extract_resource_info(self, endpoint: str) -> tuple:
        """Extrai informações de recurso do endpoint."""
        # Remover query parameters
        path = endpoint.split("?")[0]
        
        # Dividir path em segmentos
        segments = [s for s in path.split("/") if s]
        
        if not segments:
            return None, None
        
        # Mapear recursos conhecidos
        resource_mapping = {
            "auth": "authentication",
            "users": "user",
            "products": "product",
            "orders": "order",
            "tenants": "tenant"
        }
        
        resource = None
        resource_id = None
        
        # Identificar recurso principal
        for segment in segments:
            if segment in resource_mapping:
                resource = resource_mapping[segment]
                break
            elif segment in ["api", "v1"]:
                continue
            else:
                resource = segment
                break
        
        # Tentar identificar ID do recurso (UUID ou número)
        for segment in segments:
            # Verificar se é UUID
            try:
                UUID(segment)
                resource_id = segment
                break
            except ValueError:
                pass
            
            # Verificar se é número
            if segment.isdigit():
                resource_id = segment
                break
        
        return resource, resource_id


class RequestLoggingRoute(APIRoute):
    """Route customizada para logging detalhado de requisições específicas."""
    
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()
        
        async def custom_route_handler(request: Request) -> Response:
            # Log de entrada da requisição
            logger.info(
                f"Incoming request: {request.method} {request.url.path} "
                f"from {request.client.host if request.client else 'unknown'}"
            )
            
            try:
                # Executar handler original
                response = await original_route_handler(request)
                
                # Log de sucesso
                logger.info(
                    f"Request completed: {request.method} {request.url.path} "
                    f"-> {response.status_code}"
                )
                
                return response
                
            except Exception as e:
                # Log de erro
                logger.error(
                    f"Request failed: {request.method} {request.url.path} "
                    f"-> Error: {str(e)}"
                )
                raise
        
        return custom_route_handler


def setup_audit_middleware(app, exclude_paths: Optional[list] = None):
    """Configura o middleware de auditoria na aplicação."""
    app.add_middleware(AuditMiddleware, exclude_paths=exclude_paths)
    logger.info("Middleware de auditoria configurado")


def get_audit_exclude_paths() -> list:
    """Retorna lista padrão de paths a serem excluídos da auditoria."""
    return [
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico",
        "/health",
        "/metrics",
        "/static"
    ]


# Decorator para marcar rotas que precisam de auditoria especial
def audit_action(action: str, resource: Optional[str] = None):
    """Decorator para marcar ações específicas de auditoria."""
    def decorator(func):
        func._audit_action = action
        func._audit_resource = resource
        return func
    return decorator


# Função utilitária para log manual de auditoria
async def manual_audit_log(
    db: AsyncSession,
    user_id: Optional[UUID],
    action: str,
    resource: Optional[str] = None,
    resource_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    metadata: Optional[dict] = None
) -> None:
    """Registra log de auditoria manualmente."""
    try:
        audit_log = AuditLog(
            id=uuid4(),
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            method="MANUAL",
            endpoint="/manual",
            tenant_id=tenant_id or "default",
            metadata=metadata
        )
        
        db.add(audit_log)
        await db.commit()
        
        logger.info(f"Auditoria manual registrada: {action}")
        
    except Exception as e:
        logger.error(f"Erro ao registrar auditoria manual: {str(e)}")
        await db.rollback()