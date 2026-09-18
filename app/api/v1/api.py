from fastapi import APIRouter

from app.api.v1.endpoints import (
    asistencia,
    auth,
    carnets,
    colegio,
    dashboard,
    estudiantes,
    representantes,
    telegram,
    usuarios,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(asistencia.router, prefix="/asistencia", tags=["Control de Asistencia Garita"])
api_router.include_router(carnets.router, prefix="/carnets", tags=["Impresión de Carnets Zebra ZXP 7"])
api_router.include_router(colegio.router, prefix="/colegio", tags=["Configuración de la Institución/Colegio"])
api_router.include_router(colegio.router, prefix="/colegios", tags=["Gestión de Clientes Multi-Tenancy"])
api_router.include_router(telegram.router, prefix="/telegram", tags=["Notificaciones Telegram Bot"])

api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Panel de Control Owner SUPER_ADMIN"])
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["Gestión de Usuarios y Permisos"])
api_router.include_router(estudiantes.router, prefix="/estudiantes", tags=["Administración de Estudiantes"])
api_router.include_router(representantes.router, prefix="/representantes", tags=["Administración de Representantes"])

