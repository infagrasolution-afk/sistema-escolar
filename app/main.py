from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.init_db import init_db_users


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db_users()
    except Exception as e:
        print(f"Error inicializando usuarios base en DB: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    redirect_slashes=False,
)

# Configuración de Middleware CORS (Soporta credenciales HTTP-Only y cualquier origen de Render/local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://escuela-frontend-9p9m.onrender.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar Router V1
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Health Check"])
async def root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
    }
