from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import CanalNotificacion


class LogNotificacionCreate(BaseModel):
    asistencia_id: UUID
    canal: CanalNotificacion
    estado_envio: str
    respuesta_api: Optional[Dict[str, Any]] = None


class LogNotificacionResponse(BaseModel):
    id: UUID
    asistencia_id: UUID
    canal: CanalNotificacion
    estado_envio: str
    respuesta_api: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
