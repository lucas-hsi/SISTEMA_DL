from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.user import User
from app.models.company import Company
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

"""
PADRÃO CRUD DL_SISTEMA:
- Sempre db: Session como primeiro parâmetro
- Sempre tipagem completa (Type hints)
- Sempre tratamento de retorno (Optional/List)
- Sempre docstring explicativa
"""

def get_user_by_email(db: Session, *, email: str) -> Optional[User]:
    """Buscar usuário por email"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, *, user_id: int) -> Optional[User]:
    """Buscar usuário por ID"""
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, *, obj_in: UserCreate) -> User:
    """Criar novo usuário"""
    hashed_password = get_password_hash(obj_in.password)
    db_obj = User(
        email=obj_in.email,
        hashed_password=hashed_password,
        full_name=obj_in.full_name,
        role=obj_in.role,
        company_id=obj_in.company_id,
        sales_goal=obj_in.sales_goal,
        ads_goal=obj_in.ads_goal,
        discount_limit=obj_in.discount_limit
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def authenticate_user(db: Session, *, email: str, password: str) -> Optional[User]:
    """Autenticar usuário por email e senha"""
    from app.core.security import verify_password
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def get_company_by_id(db: Session, *, company_id: int) -> Optional[Company]:
    """Buscar empresa por ID"""
    return db.query(Company).filter(Company.id == company_id).first()

def get_users_by_company(db: Session, *, company_id: int) -> List[User]:
    """Buscar todos os usuários de uma empresa específica"""
    return db.query(User).filter(User.company_id == company_id).all()

def update_user(db: Session, *, db_obj: User, obj_in: UserUpdate) -> User:
    """Atualizar informações do usuário"""
    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_user(db: Session, *, user_id: int) -> bool:
    """Deletar usuário permanentemente"""
    user = get_user_by_id(db, user_id=user_id)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

def deactivate_user(db: Session, *, user_id: int) -> Optional[User]:
    """Desativar usuário (soft delete)"""
    user = get_user_by_id(db, user_id=user_id)
    if user:
        user.is_active = False
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def create_company(db: Session, *, name: str) -> Company:
    """Criar nova empresa"""
    db_obj = Company(name=name)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
