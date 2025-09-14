from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: Optional[int] = None
    company_id: Optional[int] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None

class TokenData(BaseModel):
    email: str | None = None
