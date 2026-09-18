from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.asistencia import Asistencia
    from app.models.representante import Representante
    from app.models.token_vinculacion import TokenVinculacion
    from app.models.colegio import Colegio


class Estudiante(Base):
    __tablename__ = "estudiantes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    colegio_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("colegios.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    codigo_opaco: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )
    nombres: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    apellidos: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    grado_seccion: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )
    foto_url: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    rfid_uid: Mapped[Optional[str]] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=True,
    )
    representante_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("representantes.id", ondelete="SET NULL", onupdate="CASCADE"),
        index=True,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relaciones
    colegio: Mapped[Optional["Colegio"]] = relationship(
        "Colegio",
        back_populates="estudiantes",
        lazy="selectin",
    )
    representante: Mapped[Optional["Representante"]] = relationship(
        "Representante",
        back_populates="estudiantes",
        lazy="selectin",
    )
    asistencias: Mapped[List["Asistencia"]] = relationship(
        "Asistencia",
        back_populates="estudiante",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    tokens_vinculacion: Mapped[List["TokenVinculacion"]] = relationship(
        "TokenVinculacion",
        back_populates="estudiante",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("idx_estudiantes_apellidos_nombres", "apellidos", "nombres"),
    )
