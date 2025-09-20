from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.v1 import deps
from app.schemas.ad import (
    AdCreate, AdUpdate, AdResponse, AdGenerateRequest, 
    AdGenerateResponse, AdListResponse, AdStatus, MarketplaceType
)
from app.models.user import User as UserModel
from app.services.ad_service import ad_service

router = APIRouter()


@router.post("/", response_model=AdResponse, status_code=status.HTTP_201_CREATED)
def create_ad(
    *,
    db: Session = Depends(deps.get_db),
    ad_in: AdCreate,
    current_user: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Create a new ad.
    Only accessible by catalog managers (anuncios).
    """
    ad = ad_service.create_ad(
        db=db, 
        ad_create=ad_in, 
        user_id=current_user.id, 
        company_id=current_user.company_id
    )
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create ad. Check if product exists and belongs to your company."
        )
    
    return ad


@router.get("/", response_model=AdListResponse)
def get_ads(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[AdStatus] = Query(None, alias="status"),
    marketplace: Optional[MarketplaceType] = None,
    product_id: Optional[int] = None,
    current_user: UserModel = Depends(deps.get_current_user_any_role)
):
    """
    Get ads with filters and pagination.
    Accessible by all roles (gestor, vendedor, anuncios).
    """
    ads = ad_service.get_ads_list(
        db=db,
        company_id=current_user.company_id,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        status=status_filter,
        marketplace=marketplace,
        product_id=product_id
    )
    
    return ads


@router.get("/search", response_model=AdListResponse)
def search_ads(
    *,
    db: Session = Depends(deps.get_db),
    q: str = Query(..., min_length=1, description="Search query"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: UserModel = Depends(deps.get_current_user_any_role)
):
    """
    Search ads by title or description.
    Accessible by all roles (gestor, vendedor, anuncios).
    """
    ads = ad_service.search_ads(
        db=db,
        query=q,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit
    )
    
    return ads


@router.get("/stats")
def get_ads_stats(
    *,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user_any_role)
):
    """
    Get ads statistics for the current user.
    Accessible by all roles (gestor, vendedor, anuncios).
    """
    stats = ad_service.get_user_ads_stats(
        db=db,
        user_id=current_user.id,
        company_id=current_user.company_id
    )
    
    return stats


@router.get("/{ad_id}", response_model=AdResponse)
def get_ad(
    *,
    db: Session = Depends(deps.get_db),
    ad_id: int,
    current_user: UserModel = Depends(deps.get_current_user_any_role)
):
    """
    Get a specific ad by ID.
    Accessible by all roles (gestor, vendedor, anuncios).
    """
    ad = ad_service.get_ad(
        db=db,
        ad_id=ad_id,
        user_id=current_user.id,
        company_id=current_user.company_id
    )
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found"
        )
    
    return ad


@router.put("/{ad_id}", response_model=AdResponse)
def update_ad(
    *,
    db: Session = Depends(deps.get_db),
    ad_id: int,
    ad_in: AdUpdate,
    current_user: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Update an existing ad.
    Only accessible by catalog managers (anuncios).
    """
    ad = ad_service.update_ad(
        db=db,
        ad_id=ad_id,
        ad_update=ad_in,
        user_id=current_user.id,
        company_id=current_user.company_id
    )
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found or you don't have permission to update it"
        )
    
    return ad


@router.delete("/{ad_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ad(
    *,
    db: Session = Depends(deps.get_db),
    ad_id: int,
    current_user: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Delete an ad.
    Only accessible by catalog managers (anuncios).
    """
    success = ad_service.delete_ad(
        db=db,
        ad_id=ad_id,
        user_id=current_user.id,
        company_id=current_user.company_id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found or you don't have permission to delete it"
        )


@router.patch("/{ad_id}/status", response_model=AdResponse)
def update_ad_status(
    *,
    db: Session = Depends(deps.get_db),
    ad_id: int,
    status_update: AdStatus,
    current_user: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Update ad status.
    Only accessible by catalog managers (anuncios).
    """
    ad = ad_service.update_ad_status(
        db=db,
        ad_id=ad_id,
        status=status_update,
        user_id=current_user.id,
        company_id=current_user.company_id
    )
    
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ad not found or you don't have permission to update it"
        )
    
    return ad


@router.post("/bulk-status-update")
def bulk_update_ads_status(
    *,
    db: Session = Depends(deps.get_db),
    ad_ids: List[int],
    status_update: AdStatus,
    current_user: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Update status for multiple ads.
    Only accessible by catalog managers (anuncios).
    """
    if not ad_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No ad IDs provided"
        )
    
    updated_count = ad_service.bulk_update_status(
        db=db,
        ad_ids=ad_ids,
        status=status_update,
        user_id=current_user.id,
        company_id=current_user.company_id
    )
    
    return {
        "message": f"Updated {updated_count} ads",
        "updated_count": updated_count,
        "requested_count": len(ad_ids)
    }


# AI Generation Endpoints
@router.post("/generate", response_model=AdGenerateResponse)
async def generate_ad(
    *,
    db: Session = Depends(deps.get_db),
    request: AdGenerateRequest,
    current_user: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Generate an ad using AI without saving it.
    Only accessible by catalog managers (anuncios).
    """
    try:
        generated_ad = await ad_service.generate_ad(
            db=db,
            request=request,
            user_id=current_user.id,
            company_id=current_user.company_id
        )
        
        if not generated_ad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not generate ad. Check if product exists and AI service is available."
            )
        
        return generated_ad
        
    except ValueError as e:
        # Erro de autenticação ou validação da OpenAI
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while generating ad"
        )
    
    return generated_ad


@router.post("/generate-and-save", response_model=AdResponse, status_code=status.HTTP_201_CREATED)
async def generate_and_save_ad(
    *,
    db: Session = Depends(deps.get_db),
    request: AdGenerateRequest,
    current_user: UserModel = Depends(deps.get_current_catalog_manager)
):
    """
    Generate an ad using AI and save it to the database.
    Only accessible by catalog managers (anuncios).
    """
    try:
        created_ad = await ad_service.generate_and_create_ad(
            db=db,
            request=request,
            user_id=current_user.id,
            company_id=current_user.company_id
        )
        
        if not created_ad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not generate and save ad. Check if product exists and AI service is available."
            )
        
        return created_ad
        
    except ValueError as e:
        # Erro de autenticação ou validação da OpenAI
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error while generating and saving ad"
        )


@router.get(
    "/health/openai",
    summary="Health Check da OpenAI",
    description="Verifica se a autenticação OpenAI está funcionando"
)
async def openai_health_check(
    current_user: UserModel = Depends(deps.get_current_user)
):
    """
    Endpoint para verificar a saúde da integração OpenAI.
    Requer autenticação.
    
    Returns:
        dict: Status da OpenAI e configuração
    """
    
    try:
        from app.core.config import settings
        from app.core.openai_client import validate_openai_connection
        import logging
        import os
        
        logger = logging.getLogger(__name__)
        
        # Verificar se a chave está configurada
        openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        openai_configured = bool(openai_key)
        
        # Máscara da chave para logs
        masked_key = f"{openai_key[:7]}...{openai_key[-4:]}" if len(openai_key) > 11 else "***"
        
        if not openai_configured:
            return {
                "status": "error",
                "service": "openai",
                "openai_configured": False,
                "openai_authenticated": False,
                "openai_key_masked": "Not configured",
                "message": "OpenAI API key not configured",
                "user_role": current_user.role
            }
        
        # Testar autenticação com a OpenAI usando o provedor singleton
        openai_authenticated = validate_openai_connection()
        
        if openai_authenticated:
            return {
                "status": "healthy",
                "service": "openai",
                "openai_configured": True,
                "openai_authenticated": True,
                "openai_key_masked": masked_key,
                "message": "OpenAI API is working correctly",
                "user_role": current_user.role,
                "model": settings.OPENAI_MODEL
            }
        else:
            return {
                "status": "error",
                "service": "openai",
                "openai_configured": True,
                "openai_authenticated": False,
                "openai_key_masked": masked_key,
                "message": "Chave inválida ou projeto incorreto. Para chaves sk-proj, verifique se o projeto está ativo.",
                "user_role": current_user.role,
                "instructions": "1) Verifique OPENAI_API_KEY no .env, 2) Confirme créditos suficientes, 3) Reinicie o backend"
            }
        
    except Exception as e:
        logger.error(f"Erro no health check da OpenAI: {e}")
        openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        masked_key = f"{openai_key[:7]}...{openai_key[-4:]}" if len(openai_key) > 11 else "***"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro no health check da OpenAI: {str(e)}"
        )


@router.get(
    "/health/openai/public",
    summary="Health Check Público da OpenAI",
    description="Verifica se a autenticação OpenAI está funcionando (sem autenticação)"
)
async def openai_health_check_public():
    """
    Health check público da integração OpenAI com validação real
    Não requer autenticação - útil para diagnóstico.
    Usa o mesmo cliente OpenAI que é usado na geração de anúncios.
    
    Returns:
        dict: Status da OpenAI e configuração
    """
    
    try:
        from app.core.config import settings
        from app.core.openai_client import validate_openai_connection
        import logging
        import os
        
        logger = logging.getLogger(__name__)
        
        # Obter chave do ambiente com trim explícito
        raw_key = os.getenv("OPENAI_API_KEY", "")
        api_key = raw_key.strip().strip('"').strip("'").strip('\t\n\r ') if raw_key else ""
        
        if not api_key:
            return {
                "status": "error",
                "openai_authenticated": False,
                "message": "OPENAI_API_KEY não configurada",
                "instructions": {
                    "powershell": "$env:OPENAI_API_KEY = 'sua-chave-aqui'",
                    "note": "Use chaves sk- ou sk-proj- válidas"
                }
            }
        
        # Mascarar chave para logs seguros
        masked_key = f"{api_key[:8]}...{api_key[-6:]}" if len(api_key) > 14 else "***"
        
        # Validação real com endpoint de modelos
        is_valid = validate_openai_connection()
        
        if is_valid:
            return {
                "status": "success",
                "openai_authenticated": True,
                "message": "OpenAI autenticada com sucesso",
                "details": {
                    "masked_key": masked_key,
                    "model": "gpt-4o-mini",
                    "validation": "Endpoint de modelos respondeu OK",
                    "ready": "Pronto para gerar anúncios"
                }
            }
        else:
            return {
                "status": "error",
                "openai_authenticated": False,
                "message": "Chave inválida ou projeto/organização incorreta",
                "details": {
                    "masked_key": masked_key,
                    "validation": "Falha no endpoint de modelos"
                },
                "instructions": {
                    "check": "Verifique se a chave OpenAI é válida",
                    "powershell": "$env:OPENAI_API_KEY = 'sua-chave-correta'"
                }
            }
            
    except Exception as e:
        logger.error(f"Erro no health check OpenAI: {e}")
        return {
            "status": "error",
            "openai_authenticated": False,
            "message": f"Erro interno: {str(e)}",
            "instructions": {
                "powershell": "Verifique $env:OPENAI_API_KEY",
                "note": "Reinicie o backend após configurar"
            }
        }