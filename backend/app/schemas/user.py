from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    role: str
    sales_goal: float | None = None
    ads_goal: int | None = None
    discount_limit: float | None = None

class UserCreate(UserBase):
    password: str
    company_id: int

class UserUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None
    sales_goal: float | None = None
    ads_goal: int | None = None
    discount_limit: float | None = None
    is_active: bool | None = None

class UserInDBBase(UserBase):
    id: int
    is_active: bool
    company_id: int
    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass
