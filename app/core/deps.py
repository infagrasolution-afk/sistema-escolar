from typing import Callable, List, Optional
import uuid

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_jwt_token
from app.models.enums import RolUsuario
from app.models.usuario import Usuario

# Configuración del esquema Bearer para la extracción de tokens en Swagger/OpenAPI
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(reusable_oauth2),
) -> Usuario:
    """
    Extrae y valida el JWT de la cabecera Authorization (Bearer).
    Carga y retorna el modelo Usuario activo desde la base de datos.
    """
    # Fallback si el token no viene en Authorization Header pero está en la cabecera directamente
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionaron credenciales de autenticación",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_jwt_token(token)
        token_type = payload.get("type")
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de acceso inválido (se esperaba un access token)",
            )

        user_id_str: str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Payload del token no contiene un identificador válido",
            )
        user_id = uuid.UUID(user_id_str)
    except (ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar el token de autenticación",
            headers={"WWW-Authenticate": "Bearer"},
        )

    query = select(Usuario).where(Usuario.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo en el sistema",
        )

    return user


class RoleChecker:
    """
    Dependencia de control de acceso basada en roles (RBAC).
    Permite el acceso si el usuario tiene uno de los roles permitidos o es SUPER_ADMIN.
    """

    def __init__(self, allowed_roles: List[RolUsuario]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: Usuario = Depends(get_current_user)) -> Usuario:
        # SUPER_ADMIN posee acceso total implícito por jerarquía
        if current_user.rol == RolUsuario.SUPER_ADMIN:
            return current_user

        if current_user.rol not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: El rol '{current_user.rol.value}' no posee permisos para esta operación",
            )
        return current_user


def require_role(roles: List[RolUsuario]) -> RoleChecker:
    """Función de ayuda para instanciar el verificador de roles de forma expresiva."""
    return RoleChecker(allowed_roles=roles)
