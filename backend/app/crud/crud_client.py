from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate

def get_client_by_id(db: Session, *, client_id: int) -> Optional[Client]:
    """Buscar cliente por ID"""
    return db.query(Client).filter(Client.id == client_id).first()

def get_client_by_document(db: Session, *, document: str) -> Optional[Client]:
    """Buscar cliente por documento (CPF/CNPJ)"""
    return db.query(Client).filter(Client.document == document).first()

def get_clients_by_company(db: Session, *, company_id: int, skip: int = 0, limit: int = 100) -> List[Client]:
    """Listar todos os clientes de uma empresa"""
    return db.query(Client).filter(Client.company_id == company_id).offset(skip).limit(limit).all()

def get_clients_by_type(db: Session, *, company_id: int, client_type: str) -> List[Client]:
    """Buscar clientes por tipo (Cliente Final, Latoeiro, Mecânico)"""
    return db.query(Client).filter(
        Client.company_id == company_id,
        Client.client_type == client_type
    ).all()

def get_clients_by_lead_status(db: Session, *, company_id: int, lead_status: str) -> List[Client]:
    """Buscar clientes por status de lead (Quente, Frio, Neutro)"""
    return db.query(Client).filter(
        Client.company_id == company_id,
        Client.lead_status == lead_status
    ).all()

def search_clients(db: Session, *, company_id: int, search_term: str) -> List[Client]:
    """Buscar clientes por nome, email ou telefone"""
    search_pattern = f"%{search_term}%"
    return db.query(Client).filter(
        Client.company_id == company_id,
        or_(
            Client.name.ilike(search_pattern),
            Client.email.ilike(search_pattern),
            Client.phone.ilike(search_pattern)
        )
    ).all()

def create_client(db: Session, *, obj_in: ClientCreate) -> Client:
    """Criar novo cliente"""
    db_obj = Client(
        name=obj_in.name,
        client_type=obj_in.client_type,
        lead_status=obj_in.lead_status,
        lead_origin=obj_in.lead_origin,
        contact_person=obj_in.contact_person,
        email=obj_in.email,
        phone=obj_in.phone,
        document=obj_in.document,
        address=obj_in.address,
        notes=obj_in.notes,
        company_id=obj_in.company_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_client(db: Session, *, db_obj: Client, obj_in: ClientUpdate) -> Client:
    """Atualizar cliente existente"""
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_client(db: Session, *, client_id: int) -> Optional[Client]:
    """Deletar cliente"""
    obj = db.query(Client).get(client_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj

def count_clients_by_company(db: Session, *, company_id: int) -> int:
    """Contar total de clientes de uma empresa"""
    return db.query(Client).filter(Client.company_id == company_id).count()

def get_client_segments(db: Session, *, company_id: int) -> List[dict]:
    """Obter segmentação de clientes por tipo"""
    from sqlalchemy import func
    
    result = db.query(
        Client.client_type,
        func.count(Client.id).label('count')
    ).filter(
        Client.company_id == company_id
    ).group_by(Client.client_type).all()
    
    return [{'type': row.client_type, 'count': row.count} for row in result]