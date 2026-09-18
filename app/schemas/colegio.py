from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class ColegioConfigBase(BaseModel):
    nombre_institucion: str = Field("UNIDAD EDUCATIVA PRIVADA COLEGIO SAN AGUSTÍN EL MARQUÉS", max_length=150)
    tipo_organizacion: str = Field("COLEGIO", description="COLEGIO, UNIVERSIDAD, EMPRESA o TRANSPORTE")
    subtitulo_carnet: str = Field("CARNET DE IDENTIFICACIÓN ESCOLAR", max_length=100)
    ano_escolar: str = Field("2025-2026", max_length=50)
    logo_url: Optional[str] = None
    sello_url: Optional[str] = None
    firma_url: Optional[str] = None
    fondo_url: Optional[str] = None
    poliza_seguro: Optional[str] = Field("APES - 002001-38 - Oceánica de Seguros", max_length=150)
    color_primario: str = Field("#1e8a6f", max_length=20)
    color_secundario: str = Field("#0f172a", max_length=20)
    orientacion_predeterminada: str = Field("VERTICAL", description="HORIZONTAL o VERTICAL")
    tipo_codigo: str = Field("QR", description="BARRA, QR o AMBOS")

    model_config = ConfigDict(from_attributes=True)


class ColegioConfigUpdate(ColegioConfigBase):
    pass


class ColegioCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=255)
    rif_identificador: Optional[str] = Field(None, max_length=100)
    tipo_organizacion: str = Field("COLEGIO", description="COLEGIO, UNIVERSIDAD, EMPRESA, TRANSPORTE")
    color_primario: str = Field("#1e8a6f", max_length=50)
    color_secundario: str = Field("#0f172a", max_length=50)
    notificaciones_activas: bool = True
    
    # Credenciales iniciales del Administrador del Plantel (nombre de usuario o email)
    admin_email: str = Field(..., min_length=3, max_length=255)
    admin_password: str = Field(..., min_length=6)



class ColegioOut(BaseModel):
    id: uuid.UUID
    nombre: str
    rif_identificador: Optional[str] = None
    tipo_organizacion: str
    activo: bool
    notificaciones_activas: bool = True
    color_primario: str
    color_secundario: str
    logotipo_url: Optional[str] = None
    sello_url: Optional[str] = None
    poliza_seguro: Optional[str] = None
    orientacion: str
    tipo_codigo: str
    created_at: datetime
    total_estudiantes: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
