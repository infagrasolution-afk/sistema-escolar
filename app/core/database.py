from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Adaptar URL de conexión de Render (postgresql:// -> postgresql+asyncpg://)
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Configuración de argumentos del motor según el dialecto
engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
    "pool_pre_ping": True,
}

if "sqlite" not in db_url:
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 10,
    })

# Configuración del Motor Asíncrono de SQLAlchemy 2.0
engine = create_async_engine(
    db_url,
    **engine_kwargs,
)

# Fabrica de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Generador de dependencia asíncrona para inyección de sesión en FastAPI endpoints."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
