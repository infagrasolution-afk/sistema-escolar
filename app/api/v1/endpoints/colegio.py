from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.enums import RolUsuario
from app.models.usuario import Usuario
from app.schemas.colegio import ColegioConfigBase, ColegioConfigUpdate

router = APIRouter()

# Almacenamiento en memoria/configuración por defecto de la organización
_colegio_config_db = ColegioConfigBase()


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
