import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.enums import RolUsuario
from app.models.usuario import Usuario

logger = logging.getLogger(__name__)


async def init_db_users() -> None:
    """
    Inicializa los usuarios por defecto en la base de datos si no existen.
    Crea la cuenta de Dueño del Sistema / Super Admin para 'linfante'.
    """
    async with AsyncSessionLocal() as db:
        # Verificar si el usuario 'linfante' ya existe
        res = await db.execute(select(Usuario).where(Usuario.email.in_(["linfante", "linfante@colegio.com"])))
        super_admin = res.scalars().first()

        if not super_admin:
            hashed_pw = get_password_hash("linfante2026")
            super_admin = Usuario(
                email="linfante",
                password_hash=hashed_pw,
                rol=RolUsuario.SUPER_ADMIN,
                activo=True,
            )
            db.add(super_admin)
            await db.commit()
            logger.info("✅ Usuario Super Admin 'linfante' creado exitosamente.")
        else:
            # Asegurar que tenga rol SUPER_ADMIN y este activo
            super_admin.rol = RolUsuario.SUPER_ADMIN
            super_admin.activo = True
            await db.commit()
