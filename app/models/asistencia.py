from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import EstadoAsistencia

if TYPE_CHECKING:
    from app.models.estudiante import Estudiante
    from app.models.log_notificacion import LogNotificacion
    from app.models.usuario import Usuario


class Asistencia(Base):
    __tablename__ = "asistencias"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    estudiante_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("estudiantes.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
        index=True,
    )
    fecha: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        server_default=func.current_date(),
    )
    hora_entrada: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    hora_salida: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    estado: Mapped[EstadoAsistencia] = mapped_column(
        Enum(EstadoAsistencia, name="estado_asistencia_enum", create_type=False),
        nullable=False,
    )
    operador_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relaciones
    estudiante: Mapped["Estudiante"] = relationship(
        "Estudiante",
        back_populates="asistencias",
        lazy="selectin",
    )
    operador: Mapped[Optional["Usuario"]] = relationship(
        "Usuario",
        back_populates="asistencias",
        lazy="selectin",
    )
    logs_notificaciones: Mapped[List["LogNotificacion"]] = relationship(
        "LogNotificacion",
        back_populates="asistencia",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("idx_asistencias_estudiante_fecha", "estudiante_id", "fecha"),
        Index("idx_asistencias_fecha_estado", "fecha", "estado"),
    )
