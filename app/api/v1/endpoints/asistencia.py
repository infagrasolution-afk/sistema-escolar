from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.enums import RolUsuario
from app.models.usuario import Usuario
from app.schemas.asistencia import ScanRequest, ScanResponse
from app.services.asistencia_service import registrar_escaneo_rapido
from app.services.notification_service import enviar_notificacion_asistencia

router = APIRouter()


@router.post(
    "/scan",
    response_model=ScanResponse,
    status_code=status.HTTP_200_OK,
    summary="Registro ultrarrápido de asistencia de garita (<50ms)",
)
async def scan_asistencia(
    scan_data: ScanRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.OPERADOR_ESCANEO,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    """
    Endpoint de escaneo en tiempo real para kiosco / garita.
    - Registra Entrada/Salida atómica en sub-50ms.
    - Encola el envío de notificaciones a representantes mediante BackgroundTasks sin bloquear la respuesta HTTP.
    """
    asistencia, scan_response = await registrar_escaneo_rapido(
        codigo=scan_data.codigo,
        operador_id=current_user.id,
        db=db,
    )

    # Delegar notificación asíncrona en segundo plano
    background_tasks.add_task(enviar_notificacion_asistencia, asistencia.id)

    return scan_response
