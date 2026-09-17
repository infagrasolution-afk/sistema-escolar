from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EstadoAsistencia


class AsistenciaBase(BaseModel):
    estudiante_id: UUID
    fecha: Optional[date] = None
    hora_entrada: Optional[datetime] = None
    hora_salida: Optional[datetime] = None
    estado: EstadoAsistencia
    operador_id: Optional[UUID] = None


class AsistenciaCreate(BaseModel):
    estudiante_id: UUID
    estado: EstadoAsistencia
    operador_id: Optional[UUID] = None
    fecha: Optional[date] = None
    hora_entrada: Optional[datetime] = None
    hora_salida: Optional[datetime] = None


class AsistenciaUpdate(BaseModel):
    hora_salida: Optional[datetime] = None
    estado: Optional[EstadoAsistencia] = None
    operador_id: Optional[UUID] = None


class AsistenciaResponse(BaseModel):
    id: UUID
    estudiante_id: UUID
    fecha: date
    hora_entrada: datetime
    hora_salida: Optional[datetime] = None
    estado: EstadoAsistencia
    operador_id: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Schemas para Escaneo Rápido de Garita / Kiosco (<50ms)
class ScanRequest(BaseModel):
    codigo: str = Field(..., min_length=2, max_length=128, description="Código opaco QR, código de barras o RFID UID")


class ScanResponse(BaseModel):
    asistencia_id: UUID
    estudiante_id: UUID
    nombres: str
    apellidos: str
    grado_seccion: str
    foto_url: Optional[str] = None
    evento: str = Field(..., description="ENTRADA o SALIDA")
    estado: EstadoAsistencia
    hora_evento: datetime
    mensaje: str

    model_config = ConfigDict(from_attributes=True)
