from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.usuario import Usuario
    from app.models.estudiante import Estudiante


class Colegio(Base):
    __tablename__ = "colegios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    nombre: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    rif_identificador: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    tipo_organizacion: Mapped[str] = mapped_column(
        String(50),
        default="COLEGIO",
        nullable=False,
    )
    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    notificaciones_activas: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    color_primario: Mapped[str] = mapped_column(
        String(50),
        default="#1e8a6f",
        nullable=False,
    )
    color_secundario: Mapped[str] = mapped_column(
        String(50),
        default="#0f172a",
        nullable=False,
    )
    logotipo_url: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    sello_url: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    poliza_seguro: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    orientacion: Mapped[str] = mapped_column(
        String(50),
        default="VERTICAL",
        nullable=False,
    )
    tipo_codigo: Mapped[str] = mapped_column(
        String(50),
        default="QR",
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relaciones
    usuarios: Mapped[List["Usuario"]] = relationship(
        "Usuario",
        back_populates="colegio",
        cascade="all, delete-orphan",
    )
    estudiantes: Mapped[List["Estudiante"]] = relationship(
        "Estudiante",
        back_populates="colegio",
        cascade="all, delete-orphan",
    )
