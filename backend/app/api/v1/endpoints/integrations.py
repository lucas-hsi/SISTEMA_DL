from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.v1.deps import get_db, get_current_user, get_current_manager
from app.models.user import User
from app.schemas.integration import (
    Integration,
    IntegrationCreate,
    IntegrationUpdate
)
from app.crud.crud_integration import integration as crud_integration

router = APIRouter()


@router.get("/", response_model=List[Integration])
def get_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca todas as integrações ativas da empresa do usuário
    """
    integrations = crud_integration.get_active_by_company(
        db=db, company_id=current_user.company_id
    )
    return integrations


@router.get("/{integration_id}", response_model=Integration)
def get_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca uma integração específica
    """
    integration = crud_integration.get(db=db, id=integration_id)
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integração não encontrada"
        )
    
    if integration.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    return integration


@router.post("/", response_model=Integration)
def create_integration(
    integration_in: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    """
    Cria uma nova integração (apenas gestores)
    """
    # Verificar se já existe uma integração ativa do mesmo tipo
    existing = crud_integration.get_by_company_and_service(
        db=db,
        company_id=current_user.company_id,
        service_type=integration_in.service_type
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe uma integração ativa do tipo {integration_in.service_type}"
        )
    
    integration = crud_integration.create_with_company(
        db=db, obj_in=integration_in, company_id=current_user.company_id
    )
    return integration


@router.put("/{integration_id}", response_model=Integration)
def update_integration(
    integration_id: int,
    integration_in: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    """
    Atualiza uma integração (apenas gestores)
    """
    integration = crud_integration.get(db=db, id=integration_id)
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integração não encontrada"
        )
    
    if integration.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    integration = crud_integration.update(
        db=db, db_obj=integration, obj_in=integration_in
    )
    return integration


@router.delete("/{integration_id}")
def deactivate_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_manager)
):
    """
    Desativa uma integração (apenas gestores)
    """
    integration = crud_integration.get(db=db, id=integration_id)
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integração não encontrada"
        )
    
    if integration.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    
    crud_integration.deactivate(db=db, db_obj=integration)
    return {"message": "Integração desativada com sucesso"}


@router.get("/service/{service_type}", response_model=Integration)
def get_integration_by_service(
    service_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca integração por tipo de serviço
    """
    integration = crud_integration.get_by_company_and_service(
        db=db,
        company_id=current_user.company_id,
        service_type=service_type
    )
    
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integração do tipo {service_type} não encontrada"
        )
    
    return integration