from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int  # Tempo em segundos até expiração
    user_id: Optional[int] = None
    company_id: Optional[int] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None

class TokenData(BaseModel):
    email: str | None = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str
