from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LinkTokenCreate(BaseModel):
    estudiante_id: UUID = Field(..., description="ID único del estudiante a vincular con Telegram")


class LinkTokenResponse(BaseModel):
    estudiante_id: UUID
    token: str
    link_url: str = Field(..., description="Enlace seguro t.me/ColegioBot?start=TOKEN con 24h de validez")
    expira_en: datetime

    model_config = ConfigDict(from_attributes=True)
