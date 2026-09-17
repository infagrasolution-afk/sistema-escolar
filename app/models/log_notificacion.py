from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional
import uuid

from sqlalchemy import DateTime, Enum, ForeignKey, Index, JSON, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import CanalNotificacion

if TYPE_CHECKING:
    from app.models.asistencia import Asistencia


class LogNotificacion(Base):
    __tablename__ = "logs_notificaciones"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    asistencia_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("asistencias.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )
    canal: Mapped[CanalNotificacion] = mapped_column(
        Enum(CanalNotificacion, name="canal_notificacion_enum", create_type=False),
        nullable=False,
    )
    estado_envio: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    respuesta_api: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON().with_variant(JSONB, "postgresql"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relaciones
    asistencia: Mapped["Asistencia"] = relationship(
        "Asistencia",
        back_populates="logs_notificaciones",
        lazy="selectin",
    )

    __table_args__ = (
        Index("idx_logs_canal_estado", "canal", "estado_envio"),
    )
