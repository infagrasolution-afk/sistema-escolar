from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import logging
import uuid

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.asistencia import Asistencia
from app.models.colegio import Colegio
from app.models.enums import CanalNotificacion
from app.models.estudiante import Estudiante
from app.models.log_notificacion import LogNotificacion
from app.models.representante import Representante
from app.models.token_vinculacion import TokenVinculacion
from app.schemas.telegram import LinkTokenResponse

logger = logging.getLogger("telegram_service")


async def generar_token_vinculacion_telegram(
    estudiante_id: uuid.UUID,
    db: AsyncSession,
) -> LinkTokenResponse:
    """
    Protocolo Zero-Knowledge: Genera una URL de vinculación efímera t.me/Bot?start=TOKEN
    con validez de 24 horas para el estudiante especificado.
    """
    query = select(Estudiante).where(Estudiante.id == estudiante_id)
    result = await db.execute(query)
    estudiante = result.scalar_one_or_none()

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado para generar token de vinculación",
        )

    token_str = uuid.uuid4().hex
    expira_en = datetime.now(timezone.utc) + timedelta(hours=24)

    token_obj = TokenVinculacion(
        estudiante_id=estudiante.id,
        token=token_str,
        expira_en=expira_en,
        usado=False,
    )
    db.add(token_obj)
    await db.commit()

    link_url = f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start={token_str}"

    return LinkTokenResponse(
        estudiante_id=estudiante.id,
        token=token_str,
        link_url=link_url,
        expira_en=expira_en,
    )


async def procesar_webhook_telegram(
    update_data: Dict[str, Any],
    db: AsyncSession,
) -> Dict[str, Any]:
    """
    Captura y procesa las peticiones Webhook enviadas por la Telegram Bot API.
    Parsea el comando '/start {TOKEN}', valida vigencia y asocia el telegram_chat_id al Representante.
    """
    message = update_data.get("message", {})
    text: str = message.get("text", "")
    chat = message.get("chat", {})
    chat_id = chat.get("id")
    from_user = message.get("from", {})

    if not chat_id or not text.startswith("/start"):
        return {"status": "ignored", "detail": "No es un comando /start válido"}

    parts = text.split(" ")
    if len(parts) < 2:
        # Petición /start sin token
        await _enviar_mensaje_telegram(
            chat_id,
            "👋 *Bienvenido al Bot de Asistencia Escolar*\n\n"
            "Para activar las notificaciones de su representado, escanee el código QR o utilice el enlace seguro facilitado por la institución.",
        )
        return {"status": "info_sent"}

    token_str = parts[1].strip()
    ahora = datetime.now(timezone.utc)

    # Buscar token válido y no consumido
    query = select(TokenVinculacion).where(
        TokenVinculacion.token == token_str,
        TokenVinculacion.usado == False,
        TokenVinculacion.expira_en > ahora,
    )
    result = await db.execute(query)
    token_obj = result.scalar_one_or_none()

    if not token_obj:
        await _enviar_mensaje_telegram(
            chat_id,
            "⚠️ *Token Inválido o Expirado*\n\n"
            "El enlace de vinculación ya fue utilizado o ha caducado (validez de 24 horas).\n"
            "Por favor solicite un nuevo código de vinculación en la administración del colegio.",
        )
        return {"status": "error", "detail": "Token inválido o expirado"}

    # Obtener estudiante asociado
    query_est = select(Estudiante).where(Estudiante.id == token_obj.estudiante_id)
    res_est = await db.execute(query_est)
    estudiante = res_est.scalar_one_or_none()

    if not estudiante:
        return {"status": "error", "detail": "Estudiante no encontrado"}

    # Asociar chat_id al representante
    if estudiante.representante:
        representante = estudiante.representante
        representante.telegram_chat_id = chat_id
    else:
        nombres = from_user.get("first_name", "Representante")
        apellidos = from_user.get("last_name", "")
        representante = Representante(
            nombres=nombres,
            apellidos=apellidos,
            telegram_chat_id=chat_id,
            activo=True,
        )
        db.add(representante)
        await db.flush()
        estudiante.representante_id = representante.id

    # Marcar token como consumido
    token_obj.usado = True
    await db.commit()

    # Enviar mensaje de confirmación exitosa
    msg_confirmacion = (
        f"✅ *Vinculación Completada con Éxito*\n\n"
        f"Estimado representante, su cuenta ha sido vinculada correctamente para recibir las notificaciones de asistencia de:\n\n"
        f"👤 *Estudiante:* {estudiante.nombres} {estudiante.apellidos}\n"
        f"🏫 *Grado/Sección:* {estudiante.grado_seccion}\n\n"
        f"A partir de este momento recibirá alertas automáticas de Entrada y Salida."
    )
    await _enviar_mensaje_telegram(chat_id, msg_confirmacion)

    return {"status": "success", "estudiante_id": str(estudiante.id), "chat_id": chat_id}


async def enviar_notificacion_asistencia_telegram(
    asistencia_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    """
    Envía la notificación asíncrona de Entrada (🟢) o Salida (🔴) por Telegram
    utilizando httpx.AsyncClient y registra la auditoría en logs_notificaciones.
    """
    query = select(Asistencia).where(Asistencia.id == asistencia_id)
    result = await db.execute(query)
    asistencia = result.scalar_one_or_none()

    if not asistencia or not asistencia.estudiante:
        logger.warning(f"No se encontró asistencia {asistencia_id} para notificación Telegram.")
        return

    estudiante = asistencia.estudiante

    # Verificar si las notificaciones están activas para esta organización / cliente
    if estudiante.colegio_id:
        query_col = select(Colegio).where(Colegio.id == estudiante.colegio_id)
        res_col = await db.execute(query_col)
        colegio = res_col.scalar_one_or_none()
        if colegio and not colegio.notificaciones_activas:
            logger.info(f"🚫 Notificaciones pausadas para el cliente '{colegio.nombre}' por el Super Admin.")
            return

    representante = estudiante.representante

    if not representante or not representante.telegram_chat_id:
        logger.info(f"El representante del estudiante {estudiante.id} no posee telegram_chat_id configurado.")
        return

    is_entrada = asistencia.hora_salida is None
    hora_str = (
        asistencia.hora_entrada.strftime("%H:%M:%S")
        if is_entrada
        else asistencia.hora_salida.strftime("%H:%M:%S")
    )

    if is_entrada:
        emoji_estado = "🟢" if asistencia.estado.value == "PUNTUAL" else "🟡"
        mensaje = (
            f"🟢 *ENTRADA REGISTRADA*\n\n"
            f"👤 *Estudiante:* {estudiante.nombres} {estudiante.apellidos}\n"
            f"🏫 *Grado/Sección:* {estudiante.grado_seccion}\n"
            f"⏰ *Hora Entrada:* {hora_str}\n"
            f"📌 *Estatus:* {emoji_estado} *{asistencia.estado.value}*"
        )
    else:
        mensaje = (
            f"🔴 *SALIDA REGISTRADA*\n\n"
            f"👤 *Estudiante:* {estudiante.nombres} {estudiante.apellidos}\n"
            f"🏫 *Grado/Sección:* {estudiante.grado_seccion}\n"
            f"⏰ *Hora Salida:* {hora_str}"
        )

    res_api = await _enviar_mensaje_telegram(representante.telegram_chat_id, mensaje)

    # Registrar Auditoría en logs_notificaciones
    estado_envio = "ENVIADO" if res_api.get("ok") else "FALLIDO"
    log = LogNotificacion(
        asistencia_id=asistencia.id,
        canal=CanalNotificacion.TELEGRAM,
        estado_envio=estado_envio,
        respuesta_api=res_api,
    )
    db.add(log)
    await db.commit()


async def _enviar_mensaje_telegram(chat_id: int, text: str) -> Dict[str, Any]:
    """Cliente HTTP asíncrono httpx para invocar la API sendMessage de Telegram."""
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(url, json=payload)
            return response.json()
    except Exception as e:
        logger.error(f"Error invocando Telegram API para chat_id {chat_id}: {str(e)}")
        return {"ok": False, "error": str(e)}
