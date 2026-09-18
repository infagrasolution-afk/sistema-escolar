from typing import Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str  # Permite tanto nombre de usuario (ej: linfante) como correo electrónico
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None
    exp: Optional[int] = None
