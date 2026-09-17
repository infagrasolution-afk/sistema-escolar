from datetime import date
from typing import Any, List

from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.asistencia import Asistencia
from app.models.enums import EstadoAsistencia, RolUsuario
from app.models.estudiante import Estudiante
from app.models.log_notificacion import LogNotificacion
from app.models.usuario import Usuario
from app.schemas.dashboard import AuditLogEntry, DashboardMetrics

router = APIRouter()


@router.get(
    "/metrics",
    response_model=DashboardMetrics,
    summary="Métricas globales del sistema escolar (Exclusivo SUPER_ADMIN)",
)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role([RolUsuario.SUPER_ADMIN])),
) -> Any:
    """
    Retorna los indicadores clave de rendimiento (KPIs) del colegio:
    - Estudiantes activos totales.
    - Asistencias, Entradas y Salidas del día actual.
    - Tasa de retardos (porcentaje).
    - Estado de notificaciones por Telegram (enviadas vs. fallidas).
    """
    hoy = date.today()

    # Total estudiantes activos
    res_est = await db.execute(select(func.count(Estudiante.id)))
    total_estudiantes = res_est.scalar_one() or 0

    # Asistencias de hoy
    res_asist_hoy = await db.execute(
        select(func.count(Asistencia.id)).where(Asistencia.fecha == hoy)
    )
    asistencias_hoy_total = res_asist_hoy.scalar_one() or 0

    # Entradas de hoy
    res_entradas = await db.execute(
        select(func.count(Asistencia.id)).where(
            Asistencia.fecha == hoy, Asistencia.hora_entrada.isnot(None)
        )
    )
    entradas_hoy = res_entradas.scalar_one() or 0

    # Salidas de hoy
    res_salidas = await db.execute(
        select(func.count(Asistencia.id)).where(
            Asistencia.fecha == hoy, Asistencia.hora_salida.isnot(None)
        )
    )
    salidas_hoy = res_salidas.scalar_one() or 0

    # Retardos de hoy
    res_retardos = await db.execute(
        select(func.count(Asistencia.id)).where(
            Asistencia.fecha == hoy, Asistencia.estado == EstadoAsistencia.RETARDO
        )
    )
    retardos_hoy = res_retardos.scalar_one() or 0

    tasa_retardos = (
        round((retardos_hoy / asistencias_hoy_total) * 100, 2)
        if asistencias_hoy_total > 0
        else 0.0
    )

    # Notificaciones Telegram
    res_env = await db.execute(
        select(func.count(LogNotificacion.id)).where(
            LogNotificacion.estado_envio == "ENVIADO"
        )
    )
    notificaciones_enviadas = res_env.scalar_one() or 0

    res_fal = await db.execute(
        select(func.count(LogNotificacion.id)).where(
            LogNotificacion.estado_envio == "FALLIDO"
        )
    )
    notificaciones_fallidas = res_fal.scalar_one() or 0

    return DashboardMetrics(
        total_estudiantes_activos=total_estudiantes,
        asistencias_hoy_total=asistencias_hoy_total,
        entradas_hoy=entradas_hoy,
        salidas_hoy=salidas_hoy,
        tasa_retardos_porcentaje=tasa_retardos,
        notificaciones_enviadas=notificaciones_enviadas,
        notificaciones_fallidas=notificaciones_fallidas,
    )


@router.get(
    "/audit-logs",
    response_model=List[AuditLogEntry],
    summary="Registro de auditoría de operaciones de operadores y notificaciones (Exclusivo SUPER_ADMIN)",
)
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role([RolUsuario.SUPER_ADMIN])),
) -> Any:
    """
    Retorna el historial reciente de auditoría para supervisar la actividad de los operadores en el colegio.
    """
    query = (
        select(LogNotificacion, Asistencia, Estudiante)
        .join(Asistencia, LogNotificacion.asistencia_id == Asistencia.id)
        .join(Estudiante, Asistencia.estudiante_id == Estudiante.id)
        .order_by(LogNotificacion.created_at.desc())
        .limit(50)
    )
    result = await db.execute(query)

    logs_list: List[AuditLogEntry] = []
    for log, asistencia, estudiante in result:
        detalles_str = f"Estado: {log.estado_envio} | Asistencia: {asistencia.estado.value}"
        logs_list.append(
            AuditLogEntry(
                id=log.id,
                tipo_evento=f"NOTIFICACION_{log.canal.value}",
                canal_o_rol=log.canal.value,
                estudiante_nombre=f"{estudiante.nombres} {estudiante.apellidos}",
                detalles=detalles_str,
                created_at=log.created_at,
            )
        )

    return logs_list
