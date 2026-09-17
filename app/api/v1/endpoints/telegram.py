from typing import Any, Dict

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.enums import RolUsuario
from app.models.usuario import Usuario
from app.schemas.telegram import LinkTokenCreate, LinkTokenResponse
from app.services.telegram_service import (
    generar_token_vinculacion_telegram,
    procesar_webhook_telegram,
)

router = APIRouter()


@router.post(
    "/link-token",
    response_model=LinkTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generar URL segura efímera (24h) para vinculación Zero-Knowledge en Telegram",
)
async def create_telegram_link_token(
    data: LinkTokenCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    """
    Genera un token efímero de 24 horas y retorna el enlace t.me/ColegioBot?start=TOKEN
    para ser entregado o impreso en QR al representante.
    """
    return await generar_token_vinculacion_telegram(
        estudiante_id=data.estudiante_id,
        db=db,
    )


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Webhook oficial receptor de actualizaciones de la Telegram Bot API",
)
async def telegram_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Endpoint público de escucha del Webhook de Telegram.
    Captura la interacción /start {TOKEN}, vincula el telegram_chat_id y envía confirmación.
    """
    update_data: Dict[str, Any] = await request.json()
    return await procesar_webhook_telegram(update_data=update_data, db=db)
