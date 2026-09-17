from datetime import date, datetime, time, timezone
from typing import Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asistencia import Asistencia
from app.models.enums import EstadoAsistencia
from app.models.estudiante import Estudiante
from app.schemas.asistencia import ScanResponse


# Hora umbral para consideración de puntualidad (08:00 AM)
HORA_LIMITE_PUNTUAL = time(8, 0, 0)


async def registrar_escaneo_rapido(
    codigo: str,
    operador_id: Optional[uuid.UUID],
    db: AsyncSession,
) -> tuple[Asistencia, ScanResponse]:
    """
    Procesa la lógica atómica de registro de asistencia en sub-50ms:
    1. Búsqueda directa del estudiante por índice B-Tree (codigo_opaco o rfid_uid).
    2. Evaluación del registro de la fecha actual (CURRENT_DATE).
    3. Determinación atómica de ENTRADA (PUNTUAL/RETARDO) o SALIDA.
    """
    ahora = datetime.now()
    hoy = ahora.date()

    # 1. Búsqueda ultrarrápida indexada
    query_estudiante = select(Estudiante).where(
        or_(
            Estudiante.codigo_opaco == codigo,
            Estudiante.rfid_uid == codigo,
        )
    )
    res_estudiante = await db.execute(query_estudiante)
    estudiante = res_estudiante.scalar_one_or_none()

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Código de identificación '{codigo}' no encontrado en el sistema",
        )

    # 2. Consultar asistencia registrada el día de hoy
    query_asistencia = select(Asistencia).where(
        Asistencia.estudiante_id == estudiante.id,
        Asistencia.fecha == hoy,
    )
    res_asistencia = await db.execute(query_asistencia)
    asistencia = res_asistencia.scalar_one_or_none()

    evento = "ENTRADA"
    mensaje = ""

    if not asistencia:
        # Registro de ENTRADA
        estado = (
            EstadoAsistencia.PUNTUAL
            if ahora.time() <= HORA_LIMITE_PUNTUAL
            else EstadoAsistencia.RETARDO
        )
        asistencia = Asistencia(
            estudiante_id=estudiante.id,
            fecha=hoy,
            hora_entrada=ahora,
            estado=estado,
            operador_id=operador_id,
        )
        db.add(asistencia)
        evento = "ENTRADA"
        mensaje = f"¡Entrada registrada ({estado.value})!"
    elif asistencia.hora_salida is None:
        # Registro de SALIDA
        asistencia.hora_salida = ahora
        evento = "SALIDA"
        mensaje = "¡Salida registrada exitosamente!"
    else:
        # Asistencia completa (ya registró Entrada y Salida hoy)
        evento = "INFORMACION"
        mensaje = "El estudiante ya registró Entrada y Salida el día de hoy."

    await db.commit()
    await db.refresh(asistencia)

    scan_response = ScanResponse(
        asistencia_id=asistencia.id,
        estudiante_id=estudiante.id,
        nombres=estudiante.nombres,
        apellidos=estudiante.apellidos,
        grado_seccion=estudiante.grado_seccion,
        foto_url=estudiante.foto_url,
        evento=evento,
        estado=asistencia.estado,
        hora_evento=ahora,
        mensaje=mensaje,
    )

    return asistencia, scan_response
