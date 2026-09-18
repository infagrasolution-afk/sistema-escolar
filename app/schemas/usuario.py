from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import RolUsuario


class UsuarioBase(BaseModel):
    email: str  # Nombre de usuario o correo electrónico
    rol: RolUsuario
    colegio_id: Optional[UUID] = None
    activo: bool = True


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[RolUsuario] = None
    colegio_id: Optional[UUID] = None
    activo: Optional[bool] = None


class UsuarioResponse(UsuarioBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
