from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.crud import crud_user
from app.crud import crud_refresh_token
from app.api.v1 import deps
from app.schemas.token import Token, RefreshTokenRequest

router = APIRouter()

@router.post("/logout")
def logout(
    refresh_request: RefreshTokenRequest,
    db: Session = Depends(deps.get_db)
):
    """
    Logout user by revoking refresh token
    """
    # Revogar o refresh token
    revoked = crud_refresh_token.revoke_refresh_token(db, refresh_request.refresh_token)
    
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {"message": "Successfully logged out"}

@router.post("/login", response_model=Token)
def login_for_access_token(
    db: Session = Depends(deps.get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token and refresh token for future requests
    """
    user = crud_user.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Criar access token com payload robusto
    token_data = {
        "sub": user.email,
        "user_id": user.id,
        "company_id": user.company_id,
        "role": user.role,
        "permissions": [user.role]  # Pode ser expandido futuramente
    }
    
    access_token, expires_at = security.create_access_token_with_refresh(data=token_data)
    
    # Criar refresh token
    refresh_token_obj = crud_refresh_token.create_refresh_token_for_user(db, user.id)
    
    # Calcular expires_in em segundos
    expires_in = int((expires_at - security.datetime.now(security.timezone.utc)).total_seconds())
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_obj.token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "user_id": user.id,
        "company_id": user.company_id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role
    }

@router.post("/refresh", response_model=Token)
def refresh_access_token(
    refresh_request: RefreshTokenRequest,
    db: Session = Depends(deps.get_db)
):
    """
    Refresh access token using refresh token
    """
    # Verificar se o refresh token é válido
    refresh_token_obj = crud_refresh_token.get_refresh_token(db, refresh_request.refresh_token)
    
    if not refresh_token_obj or not refresh_token_obj.is_valid():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuário
    user = crud_user.get_user_by_id(db, user_id=refresh_token_obj.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Rotacionar refresh token (criar novo e revogar o antigo)
    new_refresh_token = crud_refresh_token.rotate_refresh_token(
        db, refresh_request.refresh_token, user.id
    )
    
    if not new_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to rotate refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Criar novo access token
    token_data = {
        "sub": user.email,
        "user_id": user.id,
        "company_id": user.company_id,
        "role": user.role,
        "permissions": [user.role]
    }
    
    access_token, expires_at = security.create_access_token_with_refresh(data=token_data)
    
    # Calcular expires_in em segundos
    expires_in = int((expires_at - security.datetime.now(security.timezone.utc)).total_seconds())
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token.token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "user_id": user.id,
        "company_id": user.company_id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role
    }
