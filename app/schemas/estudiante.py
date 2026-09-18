from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.representante import RepresentanteResponse


class EstudianteBase(BaseModel):
    codigo_opaco: Optional[str] = Field(None, max_length=64)
    nombres: str = Field(..., min_length=2, max_length=100)
    apellidos: str = Field(..., min_length=2, max_length=100)
    grado_seccion: str = Field(..., max_length=50)
    foto_url: Optional[str] = None
    rfid_uid: Optional[str] = Field(None, max_length=64)
    colegio_id: Optional[UUID] = None
    representante_id: Optional[UUID] = None


class EstudianteCreate(EstudianteBase):
    pass


class EstudianteUpdate(BaseModel):
    codigo_opaco: Optional[str] = Field(None, min_length=4, max_length=64)
    nombres: Optional[str] = Field(None, min_length=2, max_length=100)
    apellidos: Optional[str] = Field(None, min_length=2, max_length=100)
    grado_seccion: Optional[str] = Field(None, max_length=50)
    foto_url: Optional[str] = None
    rfid_uid: Optional[str] = Field(None, max_length=64)
    representante_id: Optional[UUID] = None


class EstudianteResponse(EstudianteBase):
    id: UUID
    created_at: datetime
    representante: Optional[RepresentanteResponse] = None

    model_config = ConfigDict(from_attributes=True)
