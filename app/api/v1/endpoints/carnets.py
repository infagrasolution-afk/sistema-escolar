from typing import Any, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.enums import RolUsuario
from app.models.estudiante import Estudiante
from app.models.usuario import Usuario
from app.services.pdf_carnet_service import generar_pdf_carnets_batch

router = APIRouter()


class BatchPdfRequest(BaseModel):
    estudiante_ids: List[uuid.UUID]


@router.get(
    "/{estudiante_id}/pdf",
    response_class=StreamingResponse,
    summary="Descargar carnet individual en PDF formato CR-80 Zebra ZXP 7",
)
async def get_carnet_pdf(
    estudiante_id: uuid.UUID,
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

    pdf_buffer = generar_pdf_carnets_batch([estudiante])

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

    pdf_buffer = generar_pdf_carnets_batch(list(estudiantes))

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=lote_carnets_zebra_zxp7.pdf"
        },
    )
