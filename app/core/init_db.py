import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, engine
from app.core.security import get_password_hash
from app.models.base import Base

# Importar todos los modelos de la aplicación para registrarlos en Base.metadata
from app.models.usuario import Usuario
from app.models.representante import Representante
from app.models.estudiante import Estudiante
from app.models.asistencia import Asistencia
from app.models.token_vinculacion import TokenVinculacion
from app.models.log_notificacion import LogNotificacion
from app.models.enums import RolUsuario

logger = logging.getLogger(__name__)


async def init_db_users() -> None:
    """
    1. Ejecuta DDL automático (create_all) para asegurar que todas las tablas existan en PostgreSQL.
    2. Inicializa la cuenta del Dueño del Sistema ('linfante' con rol SUPER_ADMIN).
    """
    try:
        # Crear todas las tablas si no existen
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Tablas de la base de datos verificadas/creadas con éxito.")
    except Exception as e:
        logger.error(f"Error creando tablas en DB: {e}")

    try:
        async with AsyncSessionLocal() as db:
            # Verificar si el usuario 'linfante' ya existe
            res = await db.execute(
                select(Usuario).where(Usuario.email.in_(["linfante", "linfante@colegio.com"]))
            )
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
                # Asegurar que tenga rol SUPER_ADMIN y contraseña actualizada
                super_admin.rol = RolUsuario.SUPER_ADMIN
                super_admin.activo = True
                super_admin.password_hash = get_password_hash("linfante2026")
                await db.commit()
                logger.info("✅ Usuario Super Admin 'linfante' actualizado exitosamente.")
    except Exception as e:
        logger.error(f"Error sembrando usuario inicial: {e}")
