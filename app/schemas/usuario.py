from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import RolUsuario


class UsuarioBase(BaseModel):
    email: EmailStr
    rol: RolUsuario
    activo: bool = True


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    rol: Optional[RolUsuario] = None
    activo: Optional[bool] = None


class UsuarioResponse(UsuarioBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
