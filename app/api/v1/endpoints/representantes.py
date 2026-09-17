from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.enums import RolUsuario
from app.models.representante import Representante
from app.models.usuario import Usuario
from app.schemas.representante import RepresentanteCreate, RepresentanteResponse, RepresentanteUpdate

router = APIRouter()


@router.get(
    "/",
    response_model=List[RepresentanteResponse],
    summary="Listar y buscar representantes",
)
async def get_representantes(
    search: Optional[str] = Query(None, description="Búsqueda por nombres, apellidos, teléfono o telegram chat ID"),
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
    Retorna la lista de representantes registrados.
    """
    query = select(Representante).order_by(Representante.apellidos.asc(), Representante.nombres.asc())

    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Representante.nombres.ilike(term),
                Representante.apellidos.ilike(term),
                Representante.telefono.ilike(term),
            )
        )

    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/",
    response_model=RepresentanteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo representante",
)
async def create_representante(
    representante_in: RepresentanteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    db_representante = Representante(
        nombres=representante_in.nombres,
        apellidos=representante_in.apellidos,
        telefono=representante_in.telefono,
        telegram_chat_id=representante_in.telegram_chat_id,
        activo=representante_in.activo,
    )
    db.add(db_representante)
    await db.commit()
    await db.refresh(db_representante)
    return db_representante


@router.put(
    "/{representante_id}",
    response_model=RepresentanteResponse,
    summary="Actualizar datos de representante",
)
async def update_representante(
    representante_id: uuid.UUID,
    representante_in: RepresentanteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    query = select(Representante).where(Representante.id == representante_id)
    result = await db.execute(query)
    representante = result.scalar_one_or_none()

    if not representante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Representante no encontrado",
        )

    update_data = representante_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(representante, field, value)

    await db.commit()
    await db.refresh(representante)
    return representante


@router.delete(
    "/{representante_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar representante",
)
async def delete_representante(
    representante_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> None:
    query = select(Representante).where(Representante.id == representante_id)
    result = await db.execute(query)
    representante = result.scalar_one_or_none()

    if not representante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Representante no encontrado",
        )

    await db.delete(representante)
    await db.commit()
