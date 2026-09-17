from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ColegioConfigBase(BaseModel):
    nombre_institucion: str = Field("UNIDAD EDUCATIVA PRIVADA COLEGIO SAN AGUSTÍN EL MARQUÉS", max_length=150)
    tipo_organizacion: str = Field("COLEGIO", description="COLEGIO o COOPERATIVA_TRANSPORTE")
    subtitulo_carnet: str = Field("CARNET DE IDENTIFICACIÓN ESCOLAR", max_length=100)
    ano_escolar: str = Field("2025-2026", max_length=50)
    logo_url: Optional[str] = None
    sello_url: Optional[str] = None
    firma_url: Optional[str] = None
    poliza_seguro: Optional[str] = Field("APES - 002001-38 - Oceánica de Seguros", max_length=150)
    color_primario: str = Field("#1e3a8a", max_length=20)
    color_secundario: str = Field("#000000", max_length=20)
    orientacion_predeterminada: str = Field("HORIZONTAL", description="HORIZONTAL o VERTICAL")

    model_config = ConfigDict(from_attributes=True)


class ColegioConfigUpdate(ColegioConfigBase):
    pass
