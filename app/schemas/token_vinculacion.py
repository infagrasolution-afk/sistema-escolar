from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TokenVinculacionCreate(BaseModel):
    estudiante_id: UUID
    token: str = Field(..., max_length=128)
    expira_en: datetime
    usado: bool = False


class TokenVinculacionResponse(BaseModel):
    id: UUID
    estudiante_id: UUID
    token: str
    expira_en: datetime
    usado: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
