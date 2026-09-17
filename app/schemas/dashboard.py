from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DashboardMetrics(BaseModel):
    total_estudiantes_activos: int
    asistencias_hoy_total: int
    entradas_hoy: int
    salidas_hoy: int
    tasa_retardos_porcentaje: float
    notificaciones_enviadas: int
    notificaciones_fallidas: int


class AuditLogEntry(BaseModel):
    id: UUID
    tipo_evento: str
    canal_o_rol: str
    estudiante_nombre: str
    detalles: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
