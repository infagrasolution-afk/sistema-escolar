from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import BigInteger, Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.estudiante import Estudiante


class Representante(Base):
    __tablename__ = "representantes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    nombres: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    apellidos: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    telefono: Mapped[Optional[str]] = mapped_column(
        String(30),
        nullable=True,
        index=True,
    )
    telegram_chat_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        unique=True,
        nullable=True,
        index=True,
    )
    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relaciones
    estudiantes: Mapped[List["Estudiante"]] = relationship(
        "Estudiante",
        back_populates="representante",
        lazy="selectin",
    )
