from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import RolUsuario

if TYPE_CHECKING:
    from app.models.asistencia import Asistencia
    from app.models.colegio import Colegio


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    rol: Mapped[RolUsuario] = mapped_column(
        Enum(RolUsuario, name="rol_usuario_enum", create_type=False),
        nullable=False,
        index=True,
    )
    colegio_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("colegios.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    modulos_permitidos: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relaciones
    colegio: Mapped[Optional["Colegio"]] = relationship(
        "Colegio",
        back_populates="usuarios",
        lazy="selectin",
    )
    asistencias: Mapped[List["Asistencia"]] = relationship(
        "Asistencia",
        back_populates="operador",
        lazy="selectin",
    )

