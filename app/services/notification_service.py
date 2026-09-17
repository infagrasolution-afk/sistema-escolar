from typing import Optional
import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.services.telegram_service import enviar_notificacion_asistencia_telegram

logger = logging.getLogger("notificaciones")


async def enviar_notificacion_asistencia(asistencia_id: uuid.UUID) -> None:
    """
    Tarea ejecutada de forma asíncrona mediante BackgroundTasks.
    Procesa y envía alertas vía Telegram / WhatsApp al representante
    sin demorar la respuesta HTTP del kiosco (<50ms).
    """
    async with AsyncSessionLocal() as db:
        try:
            await enviar_notificacion_asistencia_telegram(asistencia_id, db)
        except Exception as e:
            logger.error(f"Error procesando notificación asíncrona para asistencia {asistencia_id}: {str(e)}")
