from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RepresentanteBase(BaseModel):
    nombres: str = Field(..., min_length=2, max_length=100)
    apellidos: str = Field(..., min_length=2, max_length=100)
    telefono: Optional[str] = Field(None, max_length=30)
    telegram_chat_id: Optional[int] = None
    activo: bool = True


class RepresentanteCreate(RepresentanteBase):
    pass


class RepresentanteUpdate(BaseModel):
    nombres: Optional[str] = Field(None, min_length=2, max_length=100)
    apellidos: Optional[str] = Field(None, min_length=2, max_length=100)
    telefono: Optional[str] = Field(None, max_length=30)
    telegram_chat_id: Optional[int] = None
    activo: Optional[bool] = None


class RepresentanteResponse(RepresentanteBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
