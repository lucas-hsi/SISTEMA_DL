from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.crud import crud_user
from app.api.v1 import deps
from app.schemas.user import User, UserCreate, UserUpdate
from app.models.user import User as UserModel

router = APIRouter()

@router.get("/me", response_model=User)
def get_current_user_profile(
    *,
    current_user: UserModel = Depends(deps.get_current_user)
):
    """
    Get current authenticated user profile.
    Accessible by any authenticated user.
    """
    return current_user

@router.get("/users/", response_model=List[User])
def get_users(
    *,
    db: Session = Depends(deps.get_db),
    current_manager: UserModel = Depends(deps.get_current_manager)
):
    """
    Get all users from the same company as the current manager.
    Only accessible by managers (gestores).
    """
    users = crud_user.get_users_by_company(db, company_id=current_manager.company_id)
    return users

@router.put("/users/{user_id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: UserUpdate,
    current_manager: UserModel = Depends(deps.get_current_manager)
):
    """
    Update user information including goals and discount limits.
    Only accessible by managers (gestores).
    """
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )
    
    # Verificar se o usuário pertence à mesma empresa do gestor
    if user.company_id != current_manager.company_id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage users from your own company."
        )
    
    user = crud_user.update_user(db, db_obj=user, obj_in=user_in)
    return user

@router.delete("/users/{user_id}", response_model=User)
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_manager: UserModel = Depends(deps.get_current_manager)
):
    """
    Deactivate (soft delete) a user.
    Only accessible by managers (gestores).
    """
    user = crud_user.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )
    
    # Verificar se o usuário pertence à mesma empresa do gestor
    if user.company_id != current_manager.company_id:
        raise HTTPException(
            status_code=403,
            detail="You can only manage users from your own company."
        )
    
    # Não permitir que o gestor desative a si mesmo
    if user.id == current_manager.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account."
        )
    
    user = crud_user.deactivate_user(db, user_id=user_id)
    return user

@router.post("/users/", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
):
    """
    Create new user (public endpoint for registration).
    """
    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Verificar se a empresa existe
    company = crud_user.get_company_by_id(db, company_id=user_in.company_id)
    if not company:
        raise HTTPException(
            status_code=400,
            detail="Company not found.",
        )
    
    user = crud_user.create_user(db, obj_in=user_in)
    return user

@router.post("/companies/", status_code=status.HTTP_201_CREATED)
def create_company(
    *,
    db: Session = Depends(deps.get_db),
    name: str,
):
    """
    Create new company.
    """
    company = crud_user.create_company(db, name=name)
    return {"id": company.id, "name": company.name, "created_at": company.created_at}
