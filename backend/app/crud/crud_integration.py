from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.integration import Integration
from app.schemas.integration import IntegrationCreate, IntegrationUpdate


class CRUDIntegration(CRUDBase[Integration, IntegrationCreate, IntegrationUpdate]):
    def get_by_company_and_service(
        self, db: Session, *, company_id: int, service_type: str
    ) -> Optional[Integration]:
        """
        Busca integração por empresa e tipo de serviço
        """
        return (
            db.query(Integration)
            .filter(
                Integration.company_id == company_id,
                Integration.service_type == service_type,
                Integration.is_active == True
            )
            .first()
        )
    
    def get_active_by_company(
        self, db: Session, *, company_id: int
    ) -> List[Integration]:
        """
        Busca todas as integrações ativas de uma empresa
        """
        return (
            db.query(Integration)
            .filter(
                Integration.company_id == company_id,
                Integration.is_active == True
            )
            .all()
        )
    
    def create_with_company(
        self, db: Session, *, obj_in: IntegrationCreate, company_id: int
    ) -> Integration:
        """
        Cria uma nova integração associada a uma empresa
        """
        obj_in_data = obj_in.model_dump()
        obj_in_data["company_id"] = company_id
        db_obj = Integration(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def deactivate(
        self, db: Session, *, db_obj: Integration
    ) -> Integration:
        """
        Desativa uma integração
        """
        db_obj.is_active = False
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj


integration = CRUDIntegration(Integration)