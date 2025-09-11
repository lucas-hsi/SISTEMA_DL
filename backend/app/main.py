import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import get_settings
from app.db.database import init_database, close_database, check_database_health
from app.middlewares.audit import setup_audit_middleware, get_audit_exclude_paths
from app.api.v1.routers import auth, users, products
from app.api.v1.schemas import ErrorResponse, HealthCheckResponse

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("app.log")
    ]
)

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação."""
    # Startup
    logger.info("Iniciando aplicação DL Auto Peças Backend...")
    
    try:
        # Inicializar banco de dados
        await init_database()
        logger.info("Banco de dados inicializado com sucesso")
        
        # Verificar saúde do banco
        db_health = await check_database_health()
        if db_health["status"] != "healthy":
            logger.error(f"Problema na conexão com banco: {db_health['message']}")
            raise Exception("Falha na conexão com banco de dados")
        
        logger.info("Aplicação iniciada com sucesso")
        
    except Exception as e:
        logger.error(f"Erro na inicialização: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Encerrando aplicação...")
    try:
        await close_database()
        logger.info("Conexões de banco encerradas")
    except Exception as e:
        logger.error(f"Erro no encerramento: {str(e)}")
    
    logger.info("Aplicação encerrada")


# Criar aplicação FastAPI
app = FastAPI(
    title="DL Auto Peças - Backend API",
    description="""
    API Backend para o sistema DL Auto Peças com:
    
    - Autenticação JWT com suporte a 2FA
    - Sistema multi-tenant
    - Auditoria completa de ações
    - Gestão de usuários e perfis
    - Integração com Mercado Livre
    
    ## Perfis de Usuário
    
    - **Gestor**: Acesso completo ao sistema
    - **Vendedor**: Gestão de vendas e clientes
    - **Anúncios**: Gestão de produtos e anúncios
    
    ## Autenticação
    
    Use o endpoint `/auth/login` para obter tokens de acesso.
    Inclua o token no header: `Authorization: Bearer <token>`
    """,
    version="1.0.0",
    contact={
        "name": "DL Auto Peças",
        "email": "contato@dlautopecas.com"
    },
    license_info={
        "name": "Proprietary",
        "url": "https://dlautopecas.com/license"
    },
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None
)


# Configurar CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Process-Time"]
    )
    logger.info(f"CORS configurado para: {settings.BACKEND_CORS_ORIGINS}")


# Configurar Trusted Hosts (segurança)
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS or ["*"]
    )


# Configurar middleware de auditoria
setup_audit_middleware(
    app,
    exclude_paths=get_audit_exclude_paths()
)


# Handlers de exceção personalizados
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handler para exceções HTTP."""
    logger.warning(
        f"HTTP Exception: {exc.status_code} - {exc.detail} "
        f"Path: {request.url.path} Method: {request.method}"
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=f"HTTP_{exc.status_code}",
            message=exc.detail,
            details={
                "path": request.url.path,
                "method": request.method,
                "timestamp": datetime.utcnow().isoformat()
            }
        ).dict()
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler para erros de validação."""
    logger.warning(
        f"Validation Error: {str(exc)} "
        f"Path: {request.url.path} Method: {request.method}"
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="ValidationError",
            message="Dados de entrada inválidos",
            details={
                "errors": exc.errors(),
                "path": request.url.path,
                "method": request.method,
                "timestamp": datetime.utcnow().isoformat()
            }
        ).dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handler para exceções gerais."""
    logger.error(
        f"Unhandled Exception: {str(exc)} "
        f"Path: {request.url.path} Method: {request.method}",
        exc_info=True
    )
    
    # Em produção, não expor detalhes do erro
    if settings.DEBUG:
        error_detail = str(exc)
        error_type = type(exc).__name__
    else:
        error_detail = "Erro interno do servidor"
        error_type = "InternalServerError"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error=error_type,
            message=error_detail,
            details={
                "path": request.url.path,
                "method": request.method,
                "timestamp": datetime.utcnow().isoformat()
            } if settings.DEBUG else None
        ).dict()
    )


# Rotas principais
@app.get(
    "/",
    summary="Root endpoint",
    description="Endpoint raiz da API"
)
async def root():
    """Endpoint raiz."""
    return {
        "message": "DL Auto Peças - Backend API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "docs": "/docs" if settings.DEBUG else "Documentação disponível apenas em desenvolvimento"
    }


@app.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Health Check",
    description="Verifica a saúde da aplicação e dependências"
)
async def health_check():
    """Endpoint de health check."""
    try:
        # Verificar saúde do banco de dados
        db_health = await check_database_health()
        
        # Determinar status geral
        overall_status = "healthy" if db_health["status"] == "healthy" else "unhealthy"
        
        return HealthCheckResponse(
            status=overall_status,
            version="1.0.0",
            timestamp=datetime.utcnow(),
            database=db_health
        )
        
    except Exception as e:
        logger.error(f"Erro no health check: {str(e)}")
        return HealthCheckResponse(
            status="unhealthy",
            version="1.0.0",
            timestamp=datetime.utcnow(),
            database={
                "status": "error",
                "message": "Erro ao verificar banco de dados"
            }
        )


# Incluir routers da API
app.include_router(
    auth.router,
    prefix="/api/v1",
    tags=["Autenticação"]
)

app.include_router(
    users.router,
    prefix="/api/v1",
    tags=["Usuários"]
)

app.include_router(
    products.router,
    prefix="/api/v1",
    tags=["Produtos"]
)


# Middleware para adicionar headers de segurança
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Adiciona headers de segurança às respostas."""
    response = await call_next(request)
    
    # Headers de segurança
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    if not settings.DEBUG:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response


# Middleware para logging de requisições
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log básico de requisições."""
    start_time = datetime.utcnow()
    
    # Processar requisição
    response = await call_next(request)
    
    # Calcular tempo de processamento
    process_time = (datetime.utcnow() - start_time).total_seconds()
    
    # Log da requisição
    logger.info(
        f"{request.method} {request.url.path} "
        f"-> {response.status_code} "
        f"({process_time:.3f}s)"
    )
    
    return response


if __name__ == "__main__":
    import uvicorn
    
    # Configuração para desenvolvimento
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )