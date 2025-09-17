from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Union
import logging

from app.api.v1.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.part_number_enrichment import (
    PartNumberEnrichRequest,
    PartNumberEnrichResponse,
    PartNumberEnrichError
)
from app.services.part_number_enrichment_service import get_enrichment_service

# Configurar logging
logger = logging.getLogger(__name__)

# Criar router
router = APIRouter()


def check_user_permissions(current_user: User) -> bool:
    """Verifica se o usuário tem permissão para usar o enriquecimento"""
    allowed_roles = ["anuncios", "gestor"]
    return current_user.role in allowed_roles


@router.post(
    "/enrich",
    response_model=Union[PartNumberEnrichResponse, PartNumberEnrichError],
    status_code=status.HTTP_200_OK,
    summary="Enriquecer Part Number",
    description="""
    Enriquece um part number usando IA para buscar dados de compatibilidade 
    e preços de concorrentes. Disponível apenas para perfis 'anuncios' e 'gestor'.
    
    **Funcionalidades:**
    - Consulta IA especializada em autopeças
    - Busca compatibilidades com veículos
    - Pesquisa preços de concorrentes
    - Persiste dados estruturados no banco
    
    **Permissões:** Apenas usuários com role 'anuncios' ou 'gestor'
    """
)
async def enrich_part_number(
    request: PartNumberEnrichRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Union[PartNumberEnrichResponse, PartNumberEnrichError]:
    """
    Endpoint principal para enriquecimento de part numbers.
    
    Args:
        request: Dados da requisição (product_id e part_number)
        db: Sessão do banco de dados
        current_user: Usuário autenticado
    
    Returns:
        PartNumberEnrichResponse: Sucesso com dados do enriquecimento
        PartNumberEnrichError: Erro com detalhes do problema
    
    Raises:
        HTTPException: 403 se usuário não tem permissão
        HTTPException: 422 se dados de entrada são inválidos
        HTTPException: 500 para erros internos
    """
    
    try:
        # 1. Verificar permissões do usuário
        if not check_user_permissions(current_user):
            logger.warning(
                f"Usuário {current_user.email} (role: {current_user.role}) "
                f"tentou acessar enriquecimento sem permissão"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "Acesso negado",
                    "message": "Apenas usuários com perfil 'anuncios' ou 'gestor' podem usar esta funcionalidade",
                    "required_roles": ["anuncios", "gestor"],
                    "user_role": current_user.role
                }
            )
        
        # 2. Log da requisição
        logger.info(
            f"Iniciando enriquecimento - Usuário: {current_user.email}, "
            f"Product ID: {request.product_id}, Part Number: {request.part_number}"
        )
        
        # 3. Validar dados de entrada
        if not request.part_number.strip():
            return PartNumberEnrichError(
                error="Part number não pode estar vazio",
                product_id=request.product_id,
                part_number=request.part_number
            )
        
        if request.product_id <= 0:
            return PartNumberEnrichError(
                error="Product ID deve ser um número positivo",
                product_id=request.product_id,
                part_number=request.part_number
            )
        
        # 4. Executar enriquecimento
        enrichment_service = get_enrichment_service(db)
        result = await enrichment_service.enrich_part_number(request)
        
        # 5. Log do resultado
        if result.success:
            logger.info(
                f"Enriquecimento concluído com sucesso - "
                f"Product ID: {result.product_id}, "
                f"Compatibilidades: {result.compatibilities_added}, "
                f"Preços: {result.competitor_prices_added}, "
                f"Tempo: {result.processing_time:.2f}s"
            )
        else:
            logger.error(
                f"Falha no enriquecimento - "
                f"Product ID: {result.product_id}, "
                f"Erro: {result.message}"
            )
        
        return result
        
    except HTTPException:
        # Re-raise HTTPExceptions (como 403)
        raise
        
    except Exception as e:
        # Log de erro interno
        logger.error(
            f"Erro interno no enriquecimento - "
            f"Usuário: {current_user.email}, "
            f"Product ID: {request.product_id if 'request' in locals() else 'N/A'}, "
            f"Erro: {str(e)}",
            exc_info=True
        )
        
        # Retornar erro estruturado
        return PartNumberEnrichError(
            error=f"Erro interno do servidor: {str(e)}",
            product_id=request.product_id if 'request' in locals() else None,
            part_number=request.part_number if 'request' in locals() else None
        )


@router.get(
    "/health",
    summary="Health Check do Enriquecimento",
    description="Verifica se o serviço de enriquecimento está funcionando"
)
async def health_check(
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint para verificar a saúde do serviço de enriquecimento.
    
    Returns:
        dict: Status do serviço e suas dependências
    """
    
    try:
        # Verificar permissões
        has_permission = check_user_permissions(current_user)
        
        # Verificar configuração da OpenAI (sem fazer chamada real)
        from app.core.config import settings
        openai_configured = bool(settings.OPENAI_API_KEY)
        
        return {
            "status": "healthy",
            "service": "part-number-enrichment",
            "user_has_permission": has_permission,
            "user_role": current_user.role,
            "openai_configured": openai_configured,
            "allowed_roles": ["anuncios", "gestor"]
        }
        
    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro no health check: {str(e)}"
        )