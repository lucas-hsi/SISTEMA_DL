from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.api.v1.deps import get_db
from app.services import integration_service
from app.core.redis import get_redis_pool, is_redis_available
from app.core.config import settings
import httpx
import logging
from arq import create_pool

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/callback/mercadolivre")
@router.post("/callback/mercadolivre")
async def callback_mercadolivre(
    code: str = Query(..., description="Código de autorização do Mercado Livre"),
    state: str = Query(None, description="Estado para validação CSRF"),
    db: Session = Depends(get_db)
):
    """
    Endpoint de callback para autenticação OAuth do Mercado Livre.
    Recebe o código de autorização e troca por tokens de acesso.
    """
    try:
        # Configurações do Mercado Livre
        client_id = settings.MELI_APP_ID
        client_secret = settings.MELI_CLIENT_SECRET
        redirect_uri = settings.MELI_REDIRECT_URI
        
        if not client_id or not client_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Configurações do Mercado Livre não encontradas"
            )
        
        # Dados para trocar o código por tokens
        token_data = {
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri
        }
        
        # Fazer requisição para obter tokens
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.mercadolibre.com/oauth/token",
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                logger.error(f"Erro ao obter tokens do Mercado Livre: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Erro ao autenticar com o Mercado Livre"
                )
            
            tokens = response.json()
            
            # Preparar credenciais para salvar no banco
            credentials_data = {
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "token_type": tokens.get("token_type", "Bearer"),
                "expires_in": tokens.get("expires_in"),
                "scope": tokens.get("scope"),
                "user_id": tokens.get("user_id")
            }
            
            # FIXME: company_id deve vir do usuário autenticado no futuro
            company_id = 1
            
            # Salvar ou atualizar integração no banco
            integration = integration_service.create_or_update_integration(
                db=db,
                company_id=company_id,
                service_type="MERCADO_LIVRE",
                credentials_data=credentials_data
            )
            
            logger.info(f"Integração Mercado Livre salva com sucesso para company_id: {company_id}")
            
            return {
                "message": "Integração com Mercado Livre configurada com sucesso",
                "integration_id": integration.id,
                "service_type": integration.service_type
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro inesperado no callback do Mercado Livre: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )


@router.get("/mercadolivre/auth")
def get_mercadolivre_auth_url():
    """
    Retorna a URL de autorização do Mercado Livre para iniciar o fluxo OAuth.
    """
    client_id = settings.MELI_APP_ID
    redirect_uri = settings.MELI_REDIRECT_URI
    
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Configurações do Mercado Livre não encontradas"
        )
    
    auth_url = (
        f"https://auth.mercadolibre.com.br/authorization?"
        f"response_type=code&"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}"
    )
    
    return {
        "auth_url": auth_url,
        "message": "Acesse esta URL para autorizar a integração com o Mercado Livre"
    }


@router.post("/{integration_id}/import-products")
async def import_products(
    integration_id: int,
    db: Session = Depends(get_db)
):
    """
    Endpoint para iniciar a importação de produtos do Mercado Livre em segundo plano.
    
    Args:
        integration_id: ID da integração do Mercado Livre
        db: Sessão do banco de dados
    
    Returns:
        Dict: Confirmação de que a importação foi agendada
    """
    try:
        # Verifica se a integração existe e está ativa
        integration = integration_service.get_integration_by_company_and_service(
            db=db,
            company_id=1,  # FIXME: Deve vir do usuário autenticado
            service_type="MERCADO_LIVRE"
        )
        
        if not integration or integration.id != integration_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Integração não encontrada ou inativa"
            )
        
        # Verifica se Redis está disponível
        if is_redis_available():
            # Cria pool de conexão Redis para ARQ
            redis_pool = await get_redis_pool()
            
            # Enfileira a tarefa de importação
            job = await redis_pool.enqueue_job(
                'import_initial_products',
                integration_id
            )
            
            logger.info(f"Tarefa de importação enfileirada para integration_id: {integration_id}, job_id: {job.job_id}")
            
            return JSONResponse(
                status_code=status.HTTP_202_ACCEPTED,
                content={
                    "message": "A importação de produtos foi iniciada em segundo plano.",
                    "status": "accepted",
                    "integration_id": integration_id,
                    "job_id": job.job_id,
                    "estimated_time": "A importação será processada em segundo plano e pode levar alguns minutos"
                }
            )
        else:
            # Redis não disponível - executa importação diretamente
            logger.warning("Redis não disponível - executando importação diretamente")
            
            try:
                # Importa a função de importação diretamente
                from app.services.integration_service import import_initial_products
                
                # Executa a importação diretamente (sem contexto ARQ)
                result = await import_initial_products(None, integration_id)
                
                logger.info(f"Importação direta concluída para integration_id: {integration_id}")
                
                return JSONResponse(
                    status_code=status.HTTP_200_OK,
                    content={
                        "message": "A importação de produtos foi concluída com sucesso.",
                        "status": "completed",
                        "integration_id": integration_id,
                        "result": result,
                        "note": "Importação executada diretamente (Redis não disponível)"
                    }
                )
            except Exception as import_error:
                logger.error(f"Erro na importação direta: {str(import_error)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Erro na importação de produtos: {str(import_error)}"
                )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao agendar importação para integration_id {integration_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao agendar importação"
        )