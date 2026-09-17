from typing import Any, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_jwt_token,
    verify_password,
)
from app.core.deps import get_current_user
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, Token
from app.schemas.usuario import UsuarioResponse

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
    login_data: Optional[LoginRequest] = None,
    form_data: Optional[OAuth2PasswordRequestForm] = Depends(),
) -> Any:
    """
    Endpoint de Autenticación de Usuarios.
    Soporta Payload JSON (LoginRequest) o Form-Data (OAuth2PasswordRequestForm).
    Entrega un access_token (15 min) en respuesta y un refresh_token (7 días) en Cookie HTTP-Only.
    """
    email = None
    password = None

    if login_data:
        email = login_data.email
        password = login_data.password
    elif form_data and form_data.username:
        email = form_data.username
        password = form_data.password

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar email y contraseña para autenticarse",
        )

    # Buscar usuario en la base de datos
    query = select(Usuario).where(Usuario.email == email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de acceso incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cuenta de usuario se encuentra inactiva",
        )

    # Generar Access Token y Refresh Token
    access_token = create_access_token(subject=user.id, role=user.rol.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.rol.value)

    # Configurar Refresh Token en Cookie HTTP-only, Secure y SameSite=Strict
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 60 * 60,  # 7 días en segundos
        path="/api/v1/auth/refresh",
    )

    return Token(access_token=access_token, token_type="bearer")


@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Renueva el Access Token utilizando la cookie segura HTTP-Only 'refresh_token'.
    """
    token_str = request.cookies.get("refresh_token")

    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se encontró la cookie de renovación 'refresh_token'",
        )

    try:
        payload = decode_jwt_token(token_str)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="El token proporcionado no es un refresh token válido",
            )
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Payload del refresh token inválido",
            )
        user_id = uuid.UUID(user_id_str)
    except (ValueError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido o expirado",
        )

    # Validar usuario en base de datos
    query = select(Usuario).where(Usuario.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo o ya no existe en el sistema",
        )

    # Emitir nuevo Access Token
    new_access_token = create_access_token(subject=user.id, role=user.rol.value)
    return Token(access_token=new_access_token, token_type="bearer")


@router.get("/me", response_model=UsuarioResponse)
async def read_current_user(
    current_user: Usuario = Depends(get_current_user),
) -> Any:
    """
    Retorna los datos de perfil del usuario actualmente autenticado en la sesión.
    """
    return current_user
