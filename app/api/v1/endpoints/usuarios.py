from typing import Any, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.core.security import get_password_hash
from app.models.enums import RolUsuario
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate

router = APIRouter()


@router.get(
    "/",
    response_model=List[UsuarioResponse],
    summary="Listar usuarios y sus roles asignados (Exclusivo SUPER_ADMIN)",
)
async def get_usuarios(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role([RolUsuario.SUPER_ADMIN])),
) -> Any:
    """
    Retorna la lista de usuarios del sistema con sus roles y permisos asignados.
     Permite al dueño del sistema controlar quién accede a qué módulo.
    """
    query = select(Usuario).order_by(Usuario.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo usuario y asignar rol/permiso de módulo (Exclusivo SUPER_ADMIN)",
)
async def create_usuario(
    user_in: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role([RolUsuario.SUPER_ADMIN])),
) -> Any:
    """
    Crea un nuevo operador o administrador y le asigna su rol (ej: ADMIN_CARNET, OPERADOR_ESCANEO).
    """
    query = select(Usuario).where(Usuario.email == user_in.email)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario registrado con este correo electrónico",
        )

    db_user = Usuario(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        rol=user_in.rol,
        activo=user_in.activo,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.put(
    "/{usuario_id}",
    response_model=UsuarioResponse,
    summary="Actualizar rol o estado activo de un usuario (Exclusivo SUPER_ADMIN)",
)
async def update_usuario(
    usuario_id: uuid.UUID,
    user_in: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role([RolUsuario.SUPER_ADMIN])),
) -> Any:
    """
    Permite al dueño cambiar el rol de un usuario (otorgar o revocar permiso a carnetización u otros módulos)
    o cambiar su estado a inactivo.
    """
    query = select(Usuario).where(Usuario.id == usuario_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if user_in.email is not None:
        user.email = user_in.email
    if user_in.password is not None and user_in.password != "":
        user.password_hash = get_password_hash(user_in.password)
    if user_in.rol is not None:
        user.rol = user_in.rol
    if user_in.activo is not None:
        user.activo = user_in.activo

    await db.commit()
    await db.refresh(user)
    return user


@router.delete(
    "/{usuario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desactivar usuario del sistema (Exclusivo SUPER_ADMIN)",
)
async def delete_usuario(
    usuario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role([RolUsuario.SUPER_ADMIN])),
) -> None:
    """
    Desactiva la cuenta de un usuario impidiéndole el acceso al sistema.
    """
    query = select(Usuario).where(Usuario.id == usuario_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    user.activo = False
    await db.commit()
