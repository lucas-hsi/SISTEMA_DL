from datetime import datetime, timedelta
from typing import Any, Union, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from passlib.hash import bcrypt
import secrets
import pyotp
import qrcode
from io import BytesIO
import base64
from fastapi import HTTPException, status
from .config import settings


# Contexto para hash de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    subject: Union[str, Any], 
    tenant_id: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Cria um token de acesso JWT.
    
    Args:
        subject: Identificador do usuário (geralmente user_id)
        tenant_id: ID do tenant para multi-tenancy
        expires_delta: Tempo de expiração customizado
        
    Returns:
        Token JWT codificado
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "tenant_id": tenant_id,
        "type": "access",
        "iat": datetime.utcnow()
    }
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    tenant_id: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Cria um token de atualização JWT.
    
    Args:
        subject: Identificador do usuário
        tenant_id: ID do tenant
        expires_delta: Tempo de expiração customizado
        
    Returns:
        Token de refresh JWT codificado
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "tenant_id": tenant_id,
        "type": "refresh",
        "iat": datetime.utcnow()
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> dict:
    """Verifica e decodifica um token JWT.
    
    Args:
        token: Token JWT para verificar
        token_type: Tipo do token (access ou refresh)
        
    Returns:
        Payload decodificado do token
        
    Raises:
        HTTPException: Se o token for inválido
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Verifica se é o tipo de token correto
        if payload.get("type") != token_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token type mismatch"
            )
        
        # Verifica se o token não expirou
        if datetime.utcnow() > datetime.fromtimestamp(payload.get("exp", 0)):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired"
            )
        
        return payload
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto plano corresponde ao hash.
    
    Args:
        plain_password: Senha em texto plano
        hashed_password: Hash da senha armazenado
        
    Returns:
        True se as senhas correspondem
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Gera hash da senha.
    
    Args:
        password: Senha em texto plano
        
    Returns:
        Hash da senha
    """
    return pwd_context.hash(password)


def generate_password_reset_token(email: str, tenant_id: str) -> str:
    """Gera token para recuperação de senha.
    
    Args:
        email: Email do usuário
        tenant_id: ID do tenant
        
    Returns:
        Token de recuperação de senha
    """
    delta = timedelta(hours=1)  # Token válido por 1 hora
    now = datetime.utcnow()
    expires = now + delta
    
    to_encode = {
        "exp": expires,
        "sub": email,
        "tenant_id": tenant_id,
        "type": "password_reset",
        "iat": now
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verifica token de recuperação de senha.
    
    Args:
        token: Token de recuperação
        
    Returns:
        Email do usuário se válido, None caso contrário
    """
    try:
        payload = verify_token(token, "password_reset")
        return payload.get("sub")
    except HTTPException:
        return None


def generate_totp_secret() -> str:
    """Gera uma chave secreta para TOTP (2FA).
    
    Returns:
        Chave secreta base32
    """
    return pyotp.random_base32()


def generate_totp_qr_code(secret: str, user_email: str) -> str:
    """Gera QR code para configuração do TOTP.
    
    Args:
        secret: Chave secreta TOTP
        user_email: Email do usuário
        
    Returns:
        QR code em base64
    """
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user_email,
        issuer_name=settings.TOTP_ISSUER_NAME
    )
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{qr_code_base64}"


def verify_totp_token(secret: str, token: str) -> bool:
    """Verifica token TOTP (2FA).
    
    Args:
        secret: Chave secreta TOTP
        token: Token fornecido pelo usuário
        
    Returns:
        True se o token for válido
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(token, valid_window=1)


def generate_backup_codes(count: int = None) -> list[str]:
    """Gera códigos de backup para 2FA.
    
    Args:
        count: Número de códigos a gerar
        
    Returns:
        Lista de códigos de backup
    """
    if count is None:
        count = settings.BACKUP_CODES_COUNT
    
    codes = []
    for _ in range(count):
        # Gera código de 8 dígitos
        code = secrets.randbelow(100000000)
        codes.append(f"{code:08d}")
    
    return codes


def hash_backup_codes(codes: list[str]) -> list[str]:
    """Gera hash dos códigos de backup.
    
    Args:
        codes: Lista de códigos em texto plano
        
    Returns:
        Lista de códigos com hash
    """
    return [get_password_hash(code) for code in codes]


def verify_backup_code(plain_code: str, hashed_codes: list[str]) -> bool:
    """Verifica se um código de backup é válido.
    
    Args:
        plain_code: Código fornecido pelo usuário
        hashed_codes: Lista de códigos com hash
        
    Returns:
        True se o código for válido
    """
    for hashed_code in hashed_codes:
        if verify_password(plain_code, hashed_code):
            return True
    return False


def generate_api_key() -> str:
    """Gera uma chave de API segura.
    
    Returns:
        Chave de API
    """
    return secrets.token_urlsafe(32)