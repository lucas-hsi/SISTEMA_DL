from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import verify_token, verify_token_payload
from app.crud import crud_user
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Dependency to get current authenticated user from JWT token with robust validation
    """
    # Verificar payload completo do token
    payload = verify_token_payload(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar se é um access token
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email = payload.get("sub")
    user_id = payload.get("user_id")
    
    if not email or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = crud_user.get_user_by_email(db, email=email)
    if user is None or user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or token mismatch",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def get_current_manager(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure current user is a manager (gestor)
    """
    if current_user.role != "gestor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Manager role required."
        )
    return current_user

def get_current_catalog_manager(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure current user is a catalog manager (anuncios)
    """
    if current_user.role != "anuncios":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Catalog manager role required."
        )
    return current_user

def get_current_user_any_role(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get current user with any role (for read operations)
    """
    return current_user

def get_current_sales_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure current user is a salesperson (vendedor) or manager (gestor)
    """
    if current_user.role not in ["vendedor", "gestor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Sales or manager role required."
        )
    return current_user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get current active user (alias for get_current_user)
    """
    return current_user
