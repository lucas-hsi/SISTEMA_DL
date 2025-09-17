from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.models.refresh_token import RefreshToken
from app.core.config import settings
from app.core.security import create_refresh_token


def create_refresh_token_for_user(db: Session, user_id: int) -> RefreshToken:
    """
    Cria um novo refresh token para o usuário
    """
    # Revogar todos os refresh tokens existentes do usuário
    revoke_all_user_tokens(db, user_id)
    
    # Criar novo refresh token
    token_string = create_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    db_token = RefreshToken(
        token=token_string,
        user_id=user_id,
        expires_at=expires_at
    )
    
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token


def get_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
    """
    Busca um refresh token pelo valor do token
    """
    return db.query(RefreshToken).filter(
        RefreshToken.token == token,
        RefreshToken.is_revoked == False
    ).first()


def revoke_refresh_token(db: Session, token: str) -> bool:
    """
    Revoga um refresh token específico
    """
    db_token = get_refresh_token(db, token)
    if db_token:
        db_token.is_revoked = True
        db.commit()
        return True
    return False


def revoke_all_user_tokens(db: Session, user_id: int) -> None:
    """
    Revoga todos os refresh tokens de um usuário
    """
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.is_revoked == False
    ).update({"is_revoked": True})
    db.commit()


def cleanup_expired_tokens(db: Session) -> int:
    """
    Remove tokens expirados do banco de dados
    Retorna o número de tokens removidos
    """
    now = datetime.now(timezone.utc)
    expired_tokens = db.query(RefreshToken).filter(
        RefreshToken.expires_at < now
    )
    count = expired_tokens.count()
    expired_tokens.delete()
    db.commit()
    return count


def rotate_refresh_token(db: Session, old_token: str, user_id: int) -> Optional[RefreshToken]:
    """
    Rotaciona um refresh token (revoga o antigo e cria um novo)
    """
    # Verificar se o token antigo é válido
    old_db_token = get_refresh_token(db, old_token)
    if not old_db_token or not old_db_token.is_valid():
        return None
    
    # Revogar o token antigo
    old_db_token.is_revoked = True
    
    # Criar novo refresh token diretamente (sem revogar todos os tokens)
    token_string = create_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    new_db_token = RefreshToken(
        token=token_string,
        user_id=user_id,
        expires_at=expires_at
    )
    
    db.add(new_db_token)
    db.commit()
    db.refresh(new_db_token)
    return new_db_token