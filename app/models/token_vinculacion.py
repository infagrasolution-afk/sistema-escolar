from datetime import datetime
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.estudiante import Estudiante


class TokenVinculacion(Base):
    __tablename__ = "tokens_vinculacion"

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
    token: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=False,
    )
    expira_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    usado: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relaciones
    estudiante: Mapped["Estudiante"] = relationship(
        "Estudiante",
        back_populates="tokens_vinculacion",
        lazy="selectin",
    )

    __table_args__ = (
        Index("idx_tokens_lookup", "token", "usado", "expira_en"),
    )
