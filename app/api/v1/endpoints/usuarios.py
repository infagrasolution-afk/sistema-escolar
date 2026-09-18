import json
from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.core.security import get_password_hash
from app.models.enums import RolUsuario
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate

router = APIRouter()

ALLOWED_USER_MANAGERS = [
    RolUsuario.SUPER_ADMIN,
    RolUsuario.ADMIN_CARNET,
    RolUsuario.ADMIN_ACCESO,
]


def _to_modulos_str(modulos: Optional[List[str]]) -> Optional[str]:
    if not modulos:
        return None
    return json.dumps(modulos)


def _to_modulos_list(modulos_str: Optional[str]) -> Optional[List[str]]:
    if not modulos_str:
        return None
    try:
        return json.loads(modulos_str)
    except Exception:
        return [m.strip() for m in modulos_str.split(",") if m.strip()]


def _build_user_response(u: Usuario) -> UsuarioResponse:
    return UsuarioResponse(
        id=u.id,
        email=u.email,
        rol=u.rol,
        colegio_id=u.colegio_id,
        modulos_permitidos=_to_modulos_list(u.modulos_permitidos),
        activo=u.activo,
        created_at=u.created_at,
    )


@router.get(
    "",
    response_model=List[UsuarioResponse],
    summary="Listar usuarios asignados al cliente u organización",
)
@router.get(
    "/",
    response_model=List[UsuarioResponse],
    include_in_schema=False,
)
async def get_usuarios(
    colegio_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role(ALLOWED_USER_MANAGERS)),
) -> Any:
    """
    Retorna la lista de usuarios.
    - SUPER_ADMIN ve todos los usuarios o filtra por colegio_id.
    - Administradores de Plantel solo ven usuarios de su propia organización (colegio_id).
    """
    query = select(Usuario).order_by(Usuario.created_at.desc())

    if current_user.rol == RolUsuario.SUPER_ADMIN:
        if colegio_id:
            query = query.where(Usuario.colegio_id == colegio_id)
    else:
        # Aislamiento Tenant para administradores del plantel
        query = query.where(Usuario.colegio_id == current_user.colegio_id)

    result = await db.execute(query)
    users = result.scalars().all()
    return [_build_user_response(u) for u in users]


@router.post(
    "",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear nuevo usuario operador o administrador de cliente",
)
@router.post(
    "/",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def create_usuario(
    user_in: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role(ALLOWED_USER_MANAGERS)),
) -> Any:
    """
    Crea un nuevo usuario asignado a la organización actual y parametriza sus módulos asignados.
    """
    clean_email = user_in.email.strip()
    clean_password = user_in.password.strip()

    # Verificar disponibilidad del nombre de usuario / correo (insensible a mayúsculas)
    query = select(Usuario).where(func.lower(Usuario.email) == clean_email.lower())
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario registrado con este nombre de usuario / correo",
        )

    # Determinar colegio_id
    assigned_colegio_id = user_in.colegio_id
    if current_user.rol != RolUsuario.SUPER_ADMIN:
        # Forzar que pertenezca al mismo cliente que el admin creador
        assigned_colegio_id = current_user.colegio_id
        if user_in.rol in [RolUsuario.SUPER_ADMIN, RolUsuario.ADMIN_CARNET]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para asignar los roles exclusivas de ADMIN_CARNET o SUPER_ADMIN",
            )

    db_user = Usuario(
        email=clean_email,
        password_hash=get_password_hash(clean_password),
        rol=user_in.rol,
        colegio_id=assigned_colegio_id,
        modulos_permitidos=_to_modulos_str(user_in.modulos_permitidos),
        activo=user_in.activo,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return _build_user_response(db_user)


@router.put(
    "/{usuario_id}",
    response_model=UsuarioResponse,
    summary="Actualizar rol, empresa asignada o módulos permitidos de un usuario",
)
async def update_usuario(
    usuario_id: uuid.UUID,
    user_in: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role(ALLOWED_USER_MANAGERS)),
) -> Any:
    """
    Permite actualizar permisos o estado de usuarios pertenecientes al mismo cliente.
    """
    query = select(Usuario).where(Usuario.id == usuario_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    # Restricción de Tenant
    if current_user.rol != RolUsuario.SUPER_ADMIN:
        if user.colegio_id != current_user.colegio_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para modificar usuarios de otra organización",
            )
        if user_in.rol in [RolUsuario.SUPER_ADMIN, RolUsuario.ADMIN_CARNET]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para promover usuarios a ADMIN_CARNET o SUPER_ADMIN",
            )

    if user_in.email is not None and user_in.email.strip() != "":
        user.email = user_in.email.strip()
    if user_in.password is not None and user_in.password.strip() != "":
        user.password_hash = get_password_hash(user_in.password.strip())
    if user_in.rol is not None:
        user.rol = user_in.rol
    if user_in.activo is not None:
        user.activo = user_in.activo
    if user_in.modulos_permitidos is not None:
        user.modulos_permitidos = _to_modulos_str(user_in.modulos_permitidos)
    if user_in.colegio_id is not None and current_user.rol == RolUsuario.SUPER_ADMIN:
        user.colegio_id = user_in.colegio_id

    await db.commit()
    await db.refresh(user)
    return _build_user_response(user)


@router.delete(
    "/{usuario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar o desactivar usuario del sistema",
)
async def delete_usuario(
    usuario_id: uuid.UUID,
    hard_delete: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role(ALLOWED_USER_MANAGERS)),
) -> None:
    """
    Desactiva o elimina permanentemente la cuenta de un usuario.
    """
    query = select(Usuario).where(Usuario.id == usuario_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if current_user.rol != RolUsuario.SUPER_ADMIN and user.colegio_id != current_user.colegio_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para eliminar o desactivar usuarios de otra organización",
        )

    if hard_delete or current_user.rol == RolUsuario.SUPER_ADMIN:
        await db.delete(user)
    else:
        user.activo = False

    await db.commit()
