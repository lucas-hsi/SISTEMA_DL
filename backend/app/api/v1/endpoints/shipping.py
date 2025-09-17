from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.v1.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.shipping import (
    ShippingQuoteRequest,
    ShippingQuoteResponse,
    CEPValidationRequest,
    CEPValidationResponse
)
from app.services.shipping_service import get_frenet_service

router = APIRouter()


@router.post("/quote", response_model=ShippingQuoteResponse)
async def calculate_shipping(
    request: ShippingQuoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calcula o frete para uma lista de produtos
    
    - **recipient_cep**: CEP de destino (8 ou 9 dígitos)
    - **items**: Lista de itens com product_id e quantity
    
    Retorna as opções de frete disponíveis com preços e prazos.
    """
    try:
        # Validar CEP de destino
        frenet_service = get_frenet_service(db)
        
        if not await frenet_service.validate_cep(request.recipient_cep):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CEP de destino inválido"
            )
        
        # Converter items para formato esperado pelo serviço
        order_items = [
            {"product_id": item.product_id, "quantity": item.quantity}
            for item in request.items
        ]
        
        # Calcular frete
        result = await frenet_service.get_shipping_quote(
            recipient_cep=request.recipient_cep,
            order_items=order_items,
            company_id=current_user.company_id
        )
        
        return ShippingQuoteResponse(
            success=result["success"],
            shipping_options=result["shipping_options"],
            error=result.get("error")
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do servidor: {str(e)}"
        )


@router.post("/validate-cep", response_model=CEPValidationResponse)
async def validate_cep(
    request: CEPValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Valida se um CEP é válido
    
    - **cep**: CEP a ser validado (8 ou 9 dígitos)
    
    Retorna se o CEP é válido e sua versão formatada.
    """
    try:
        frenet_service = get_frenet_service(db)
        is_valid = await frenet_service.validate_cep(request.cep)
        
        # Formatar CEP se válido
        formatted_cep = None
        if is_valid:
            clean_cep = ''.join(filter(str.isdigit, request.cep))
            formatted_cep = f"{clean_cep[:5]}-{clean_cep[5:]}"
        
        return CEPValidationResponse(
            valid=is_valid,
            formatted_cep=formatted_cep
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do servidor: {str(e)}"
        )


@router.get("/health")
async def shipping_health_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verifica se o serviço de frete está funcionando
    
    Retorna o status do serviço e configurações básicas.
    """
    try:
        frenet_service = get_frenet_service(db)
        
        return {
            "status": "healthy",
            "service": "Frenet API",
            "api_url": frenet_service.api_url,
            "seller_cep": frenet_service.seller_cep,
            "has_token": bool(frenet_service.api_token)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro no health check: {str(e)}"
        )