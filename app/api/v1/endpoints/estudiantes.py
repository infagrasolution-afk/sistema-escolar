from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.enums import RolUsuario
from app.models.estudiante import Estudiante
from app.models.usuario import Usuario
from app.schemas.estudiante import EstudianteCreate, EstudianteResponse, EstudianteUpdate

router = APIRouter()


@router.get(
    "/",
    response_model=List[EstudianteResponse],
    summary="Listar y buscar estudiantes",
)
async def get_estudiantes(
    search: Optional[str] = Query(None, description="Búsqueda por nombres, apellidos, código opaco o RFID"),
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
    Retorna la lista de estudiantes registrados con soporte de búsqueda por texto.
    """
    query = select(Estudiante).order_by(Estudiante.apellidos.asc(), Estudiante.nombres.asc())

    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Estudiante.nombres.ilike(term),
                Estudiante.apellidos.ilike(term),
                Estudiante.codigo_opaco.ilike(term),
                Estudiante.rfid_uid.ilike(term),
                Estudiante.grado_seccion.ilike(term),
            )
        )

    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/",
    response_model=EstudianteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo estudiante",
)
async def create_estudiante(
    estudiante_in: EstudianteCreate,
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
    Registra un nuevo estudiante en la institución.
    Si no se especifica código opaco, se genera uno automático secuencial.
    """
    codigo_final = estudiante_in.codigo_opaco
    if not codigo_final:
        codigo_final = f"EST-2026-{uuid.uuid4().hex[:6].upper()}"

    # Validar duplicados de código opaco o rfid
    query_check = select(Estudiante).where(
        or_(
            Estudiante.codigo_opaco == codigo_final,
            (Estudiante.rfid_uid == estudiante_in.rfid_uid) if estudiante_in.rfid_uid else False,
        )
    )
    res_check = await db.execute(query_check)
    if res_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un estudiante registrado con ese Código Opaco o Tarjeta RFID",
        )

    db_estudiante = Estudiante(
        codigo_opaco=codigo_final,
        nombres=estudiante_in.nombres,
        apellidos=estudiante_in.apellidos,
        grado_seccion=estudiante_in.grado_seccion,
        foto_url=estudiante_in.foto_url,
        rfid_uid=estudiante_in.rfid_uid,
        representante_id=estudiante_in.representante_id,
    )
    db.add(db_estudiante)
    await db.commit()
    await db.refresh(db_estudiante)
    return db_estudiante


@router.put(
    "/{estudiante_id}",
    response_model=EstudianteResponse,
    summary="Actualizar datos de estudiante",
)
async def update_estudiante(
    estudiante_id: uuid.UUID,
    estudiante_in: EstudianteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    query = select(Estudiante).where(Estudiante.id == estudiante_id)
    result = await db.execute(query)
    estudiante = result.scalar_one_or_none()

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado",
        )

    update_data = estudiante_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(estudiante, field, value)

    await db.commit()
    await db.refresh(estudiante)
    return estudiante


@router.delete(
    "/{estudiante_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar estudiante",
)
async def delete_estudiante(
    estudiante_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> None:
    query = select(Estudiante).where(Estudiante.id == estudiante_id)
    result = await db.execute(query)
    estudiante = result.scalar_one_or_none()

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado",
        )

    await db.delete(estudiante)
    await db.commit()
