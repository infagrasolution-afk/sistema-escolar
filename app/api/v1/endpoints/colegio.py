from typing import Any, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import require_role
from app.core.security import get_password_hash
from app.models.colegio import Colegio
from app.models.enums import RolUsuario
from app.models.usuario import Usuario
from app.models.estudiante import Estudiante
from app.schemas.colegio import (
    ColegioConfigBase,
    ColegioConfigUpdate,
    ColegioCreate,
    ColegioOut,
)

router = APIRouter()

# Configuración en memoria / fallback por defecto
_colegio_config_db = ColegioConfigBase()


@router.get(
    "",
    response_model=List[ColegioOut],
    summary="Listar todos los Clientes/Colegios (Exclusivo Super Admin)",
)
@router.get(
    "/",
    response_model=List[ColegioOut],
    include_in_schema=False,
)
async def list_colegios(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role([RolUsuario.SUPER_ADMIN, RolUsuario.ADMIN_CARNET, RolUsuario.ADMIN_ACCESO])),
) -> Any:
    """
    Lista todos los clientes/colegios registrados en la plataforma.
    """
    query = select(Colegio).order_by(Colegio.created_at.desc())
    if current_user.rol == RolUsuario.ADMIN_ACCESO and current_user.colegio_id:
        query = query.where(Colegio.id == current_user.colegio_id)

    result = await db.execute(query)
    colegios = result.scalars().all()
    
    # Calcular total de estudiantes por colegio
    output = []
    for col in colegios:
        count_res = await db.execute(
            select(func.count(Estudiante.id)).where(Estudiante.colegio_id == col.id)
        )
        total_est = count_res.scalar() or 0
        
        col_out = ColegioOut(
            id=col.id,
            nombre=col.nombre,
            rif_identificador=col.rif_identificador,
            tipo_organizacion=col.tipo_organizacion,
            activo=col.activo,
            notificaciones_activas=col.notificaciones_activas,
            color_primario=col.color_primario,
            color_secundario=col.color_secundario,
            logotipo_url=col.logotipo_url,
            sello_url=col.sello_url,
            poliza_seguro=col.poliza_seguro,
            orientacion=col.orientacion,
            tipo_codigo=col.tipo_codigo,
            created_at=col.created_at,
            total_estudiantes=total_est,
        )
        output.append(col_out)
        
    return output


@router.post(
    "",
    response_model=ColegioOut,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un Nuevo Cliente / Plantel / Empresa (Exclusivo Super Admin)",
)
@router.post(
    "/",
    response_model=ColegioOut,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def create_colegio(
    colegio_in: ColegioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role([RolUsuario.SUPER_ADMIN])),
) -> Any:
    """
    Crea un nuevo cliente en el sistema multi-tenancy y genera automáticamente
    las credenciales del Administrador de dicho plantel.
    """
    clean_email = colegio_in.admin_email.strip()
    clean_password = colegio_in.admin_password.strip()

    # Verificar si el usuario admin ya existe
    user_check = await db.execute(select(Usuario).where(func.lower(Usuario.email) == clean_email.lower()))
    if user_check.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El correo/usuario {clean_email} ya está registrado en la plataforma.",
        )

    # Crear la organización/colegio
    nuevo_colegio = Colegio(
        nombre=colegio_in.nombre.strip(),
        rif_identificador=colegio_in.rif_identificador.strip() if colegio_in.rif_identificador else None,
        tipo_organizacion=colegio_in.tipo_organizacion,
        color_primario=colegio_in.color_primario,
        color_secundario=colegio_in.color_secundario,
        notificaciones_activas=colegio_in.notificaciones_activas,
        activo=True,
    )
    db.add(nuevo_colegio)
    await db.flush()  # Obtener ID generado

    # Crear usuario Administrador asignado a este colegio (Rol ADMIN_ACCESO)
    nuevo_admin = Usuario(
        email=clean_email,
        password_hash=get_password_hash(clean_password),
        rol=RolUsuario.ADMIN_ACCESO,
        colegio_id=nuevo_colegio.id,
        activo=True,
    )
    db.add(nuevo_admin)
    await db.commit()
    await db.refresh(nuevo_colegio)

    return ColegioOut(
        id=nuevo_colegio.id,
        nombre=nuevo_colegio.nombre,
        rif_identificador=nuevo_colegio.rif_identificador,
        tipo_organizacion=nuevo_colegio.tipo_organizacion,
        activo=nuevo_colegio.activo,
        notificaciones_activas=nuevo_colegio.notificaciones_activas,
        color_primario=nuevo_colegio.color_primario,
        color_secundario=nuevo_colegio.color_secundario,
        logotipo_url=nuevo_colegio.logotipo_url,
        sello_url=nuevo_colegio.sello_url,
        poliza_seguro=nuevo_colegio.poliza_seguro,
        orientacion=nuevo_colegio.orientacion,
        tipo_codigo=nuevo_colegio.tipo_codigo,
        created_at=nuevo_colegio.created_at,
        total_estudiantes=0,
    )


@router.put(
    "/{colegio_id}/toggle-notificaciones",
    response_model=ColegioOut,
    summary="Activar o Desactivar Notificaciones para un Cliente (Exclusivo Super Admin)",
)
async def toggle_notificaciones_colegio(
    colegio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role([RolUsuario.SUPER_ADMIN])),
) -> Any:
    """
    Permite al Super Admin activar o pausar la funcionalidad de envío de notificaciones
    (ej. Telegram / WhatsApp) para un cliente específico.
    """
    result = await db.execute(select(Colegio).where(Colegio.id == colegio_id))
    colegio = result.scalar_one_or_none()

    if not colegio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado",
        )

    colegio.notificaciones_activas = not colegio.notificaciones_activas
    await db.commit()
    await db.refresh(colegio)

    count_res = await db.execute(
        select(func.count(Estudiante.id)).where(Estudiante.colegio_id == colegio.id)
    )
    total_est = count_res.scalar() or 0

    return ColegioOut(
        id=colegio.id,
        nombre=colegio.nombre,
        rif_identificador=colegio.rif_identificador,
        tipo_organizacion=colegio.tipo_organizacion,
        activo=colegio.activo,
        notificaciones_activas=colegio.notificaciones_activas,
        color_primario=colegio.color_primario,
        color_secundario=colegio.color_secundario,
        logotipo_url=colegio.logotipo_url,
        sello_url=colegio.sello_url,
        poliza_seguro=colegio.poliza_seguro,
        orientacion=colegio.orientacion,
        tipo_codigo=colegio.tipo_codigo,
        created_at=colegio.created_at,
        total_estudiantes=total_est,
    )


@router.get(
    "/config",
    response_model=ColegioConfigBase,
    summary="Obtener configuración de la Institución/Colegio/Cooperativa",
)
async def get_colegio_config() -> Any:
    """
    Retorna la información institucional (Nombre, Año Escolar, Colores, Logotipo, Sello y Póliza)
    utilizada por el módulo de carnetización.
    """
    return _colegio_config_db


@router.put(
    "/config",
    response_model=ColegioConfigBase,
    summary="Actualizar datos institucionales (Exclusivo Administrador)",
)
async def update_colegio_config(
    config_in: ColegioConfigUpdate,
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    """
    Permite al administrador del colegio o cooperativa actualizar los membretes, colores
    y sellos institucionales de los carnets.
    """
    global _colegio_config_db
    _colegio_config_db = config_in
    return _colegio_config_db


@router.delete(
    "/{colegio_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un Cliente/Colegio (Exclusivo Super Admin)",
)
async def delete_colegio(
    colegio_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role([RolUsuario.SUPER_ADMIN])),
) -> None:
    """
    Elimina un cliente/colegio registrado y sus datos asociados.
    """
    result = await db.execute(select(Colegio).where(Colegio.id == colegio_id))
    colegio = result.scalar_one_or_none()

    if not colegio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado",
        )

    await db.delete(colegio)
    await db.commit()

