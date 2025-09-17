from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.crud import crud_client
from app.api.v1 import deps
from app.schemas.client import Client, ClientCreate, ClientUpdate
from app.models.user import User
from app.models.client import Client as ClientModel

router = APIRouter()

@router.get("/", response_model=List[Client])
def get_clients(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_sales_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    client_type: Optional[str] = Query(None),
    lead_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """
    Listar clientes da empresa do usuário atual.
    Filtros opcionais: client_type, lead_status, search (nome, email, telefone).
    Acessível por vendedores e gestores.
    """
    if search:
        clients = crud_client.search_clients(
            db, company_id=current_user.company_id, search_term=search
        )
    elif client_type:
        clients = crud_client.get_clients_by_type(
            db, company_id=current_user.company_id, client_type=client_type
        )
    elif lead_status:
        clients = crud_client.get_clients_by_lead_status(
            db, company_id=current_user.company_id, lead_status=lead_status
        )
    else:
        clients = crud_client.get_clients_by_company(
            db, company_id=current_user.company_id, skip=skip, limit=limit
        )
    return clients

@router.get("/{client_id}", response_model=Client)
def get_client(
    *,
    db: Session = Depends(deps.get_db),
    client_id: int,
    current_user: User = Depends(deps.get_current_sales_user)
):
    """
    Buscar cliente específico por ID.
    Acessível por vendedores e gestores.
    """
    client = crud_client.get_client_by_id(db, client_id=client_id)
    if not client:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado."
        )
    
    # Verificar se o cliente pertence à mesma empresa do usuário
    if client.company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="Você só pode acessar clientes da sua própria empresa."
        )
    
    return client

@router.post("/", response_model=Client, status_code=status.HTTP_201_CREATED)
def create_client(
    *,
    db: Session = Depends(deps.get_db),
    client_in: ClientCreate,
    current_user: User = Depends(deps.get_current_sales_user)
):
    """
    Criar novo cliente.
    Acessível por vendedores e gestores.
    """
    # Verificar se já existe cliente com o mesmo documento
    if client_in.document:
        existing_client = crud_client.get_client_by_document(db, document=client_in.document)
        if existing_client:
            raise HTTPException(
                status_code=400,
                detail="Já existe um cliente com este documento."
            )
    
    # Definir company_id automaticamente baseado no usuário atual
    client_in.company_id = current_user.company_id
    
    client = crud_client.create_client(db, obj_in=client_in)
    return client

@router.put("/{client_id}", response_model=Client)
def update_client(
    *,
    db: Session = Depends(deps.get_db),
    client_id: int,
    client_in: ClientUpdate,
    current_user: User = Depends(deps.get_current_sales_user)
):
    """
    Atualizar cliente existente.
    Acessível por vendedores e gestores.
    """
    client = crud_client.get_client_by_id(db, client_id=client_id)
    if not client:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado."
        )
    
    # Verificar se o cliente pertence à mesma empresa do usuário
    if client.company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="Você só pode atualizar clientes da sua própria empresa."
        )
    
    # Verificar se o documento não está sendo usado por outro cliente
    if client_in.document and client_in.document != client.document:
        existing_client = crud_client.get_client_by_document(db, document=client_in.document)
        if existing_client and existing_client.id != client_id:
            raise HTTPException(
                status_code=400,
                detail="Já existe outro cliente com este documento."
            )
    
    client = crud_client.update_client(db, db_obj=client, obj_in=client_in)
    return client

@router.delete("/{client_id}", response_model=Client)
def delete_client(
    *,
    db: Session = Depends(deps.get_db),
    client_id: int,
    current_user: User = Depends(deps.get_current_sales_user)
):
    """
    Deletar cliente.
    Acessível por vendedores e gestores.
    """
    client = crud_client.get_client_by_id(db, client_id=client_id)
    if not client:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado."
        )
    
    # Verificar se o cliente pertence à mesma empresa do usuário
    if client.company_id != current_user.company_id:
        raise HTTPException(
            status_code=403,
            detail="Você só pode deletar clientes da sua própria empresa."
        )
    
    client = crud_client.delete_client(db, client_id=client_id)
    return client

@router.get("/stats/count", response_model=dict)
def get_client_count(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_sales_user)
):
    """
    Obter contagem total de clientes da empresa e estatísticas por tipo e status.
    Acessível por gestores e vendedores.
    """
    # Obter contagem total
    total_clients = crud_client.count_clients_by_company(
        db, company_id=current_user.company_id
    )
    
    # Obter contagem por tipo de cliente
    by_type = {"cliente_final": 0, "latoeiro": 0, "mecanico": 0}
    client_types = db.query(ClientModel.client_type, func.count(ClientModel.id)).filter(
        ClientModel.company_id == current_user.company_id
    ).group_by(ClientModel.client_type).all()
    
    for client_type, count in client_types:
        if client_type in by_type:
            by_type[client_type] = count
    
    # Obter contagem por status de lead
    by_lead_status = {"quente": 0, "frio": 0, "neutro": 0}
    lead_statuses = db.query(ClientModel.lead_status, func.count(ClientModel.id)).filter(
        ClientModel.company_id == current_user.company_id
    ).group_by(ClientModel.lead_status).all()
    
    for lead_status, count in lead_statuses:
        if lead_status in by_lead_status:
            by_lead_status[lead_status] = count
    
    # Obter contagem por origem de lead
    by_lead_origin = {}
    lead_origins = db.query(ClientModel.lead_origin, func.count(ClientModel.id)).filter(
        ClientModel.company_id == current_user.company_id
    ).group_by(ClientModel.lead_origin).all()
    
    for lead_origin, count in lead_origins:
        if lead_origin:
            by_lead_origin[lead_origin] = count
    
    # Calcular taxa de conversão (simplificado)
    conversion_rate = 0
    if total_clients > 0:
        # Exemplo: considerar clientes com status "quente" como convertidos
        conversion_rate = (by_lead_status.get("quente", 0) / total_clients) * 100
    
    return {
        "total_clients": total_clients,
        "by_type": by_type,
        "by_lead_status": by_lead_status,
        "by_lead_origin": by_lead_origin,
        "conversion_rate": round(conversion_rate, 1)
    }

@router.get("/stats/segments", response_model=dict)
def get_client_segments(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    """
    Obter segmentação de clientes por valor, frequência e inatividade.
    Acessível apenas por gestores.
    """
    # Aqui implementaríamos lógica real para segmentação de clientes
    # Por enquanto, retornamos dados simulados no formato esperado pelo frontend
    
    # Contagem total de clientes
    total_clients = crud_client.count_clients_by_company(
        db, company_id=current_user.company_id
    )
    
    # Valores simulados para segmentação
    high_value = total_clients // 4 if total_clients > 0 else 0
    frequent_buyers = total_clients // 3 if total_clients > 0 else 0
    inactive = total_clients // 5 if total_clients > 0 else 0
    
    return {
        "high_value": high_value,
        "frequent_buyers": frequent_buyers,
        "inactive": inactive
    }