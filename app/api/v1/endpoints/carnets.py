from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.colegio import _colegio_config_db
from app.core.database import get_db
from app.core.deps import require_role
from app.models.enums import RolUsuario
from app.models.estudiante import Estudiante
from app.models.usuario import Usuario
from app.services.pdf_carnet_service import generar_pdf_carnets_batch

router = APIRouter()


class BatchPdfRequest(BaseModel):
    estudiante_ids: List[uuid.UUID]
    tipo_organizacion: Optional[str] = None
    orientacion: Optional[str] = None
    color_primario: Optional[str] = None
    cara: Optional[str] = "FRONTAL"


@router.get(
    "/{estudiante_id}/pdf",
    response_class=StreamingResponse,
    summary="Descargar carnet individual en PDF formato CR-80 Zebra ZXP 7",
)
async def get_carnet_pdf(
    estudiante_id: uuid.UUID,
    tipo_organizacion: Optional[str] = Query(None, description="COLEGIO o COOPERATIVA_TRANSPORTE"),
    orientacion: Optional[str] = Query(None, description="HORIZONTAL o VERTICAL"),
    color_primario: Optional[str] = Query(None, description="Hex color por ej. #1e3a8a"),
    cara: str = Query("FRONTAL", description="FRONTAL, REVERSO o AMBAS"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.OPERADOR_IMPRESION,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    """
    Genera y sirve el archivo PDF individual en estándar CR-80 (85.6mm x 54mm)
    con reglas K-Resin para la impresora Zebra ZXP Series 7.
    """
    query = select(Estudiante).where(Estudiante.id == estudiante_id)
    result = await db.execute(query)
    estudiante = result.scalar_one_or_none()

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado en la base de datos",
        )

    tipo_org = tipo_organizacion or _colegio_config_db.tipo_organizacion
    ori = orientacion or _colegio_config_db.orientacion_predeterminada
    color_p = color_primario or _colegio_config_db.color_primario

    pdf_buffer = generar_pdf_carnets_batch(
        estudiantes=[estudiante],
        tipo_organizacion=tipo_org,
        orientacion=ori,
        color_primario_hex=color_p,
        cara=cara,
        nombre_institucion=_colegio_config_db.nombre_institucion,
        subtitulo_carnet=_colegio_config_db.subtitulo_carnet,
        ano_escolar=_colegio_config_db.ano_escolar,
        poliza_seguro=_colegio_config_db.poliza_seguro,
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=carnet_{estudiante.codigo_opaco}.pdf"
        },
    )


@router.post(
    "/pdf/batch",
    response_class=StreamingResponse,
    summary="Exportar lote masivo de carnets en PDF CR-80 para cola de impresión Zebra",
)
async def get_carnets_batch_pdf(
    batch_data: BatchPdfRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.OPERADOR_IMPRESION,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    """
    Compila y exporta un documento PDF multipágina con las dimensiones CR-80 de cada carnet
    para ser enviado directamente a la cola del driver de la Zebra ZXP Series 7.
    """
    if not batch_data.estudiante_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar al menos un ID de estudiante para generar el lote",
        )

    query = select(Estudiante).where(Estudiante.id.in_(batch_data.estudiante_ids))
    result = await db.execute(query)
    estudiantes = result.scalars().all()

    if not estudiantes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontraron estudiantes para los IDs proporcionados",
        )

    tipo_org = batch_data.tipo_organizacion or _colegio_config_db.tipo_organizacion
    ori = batch_data.orientacion or _colegio_config_db.orientacion_predeterminada
    color_p = batch_data.color_primario or _colegio_config_db.color_primario
    cara = batch_data.cara or "FRONTAL"

    pdf_buffer = generar_pdf_carnets_batch(
        estudiantes=list(estudiantes),
        tipo_organizacion=tipo_org,
        orientacion=ori,
        color_primario_hex=color_p,
        cara=cara,
        nombre_institucion=_colegio_config_db.nombre_institucion,
        subtitulo_carnet=_colegio_config_db.subtitulo_carnet,
        ano_escolar=_colegio_config_db.ano_escolar,
        poliza_seguro=_colegio_config_db.poliza_seguro,
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=lote_carnets_zebra_zxp7.pdf"
        },
    )
