from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Configuración del contexto de hasheo de contraseñas (Bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Constantes para vigencia de tokens
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña plana coincide con el hash almacenado."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Genera el hash Bcrypt de la contraseña."""
    return pwd_context.hash(password)


def create_access_token(
    subject: str | Any,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Crea un Access Token JWT de vida corta (15 min por defecto)."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "role": str(role),
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    encoded_jwt = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def create_refresh_token(
    subject: str | Any,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Crea un Refresh Token JWT de vida larga (7 días por defecto)."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "role": str(role),
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    encoded_jwt = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Decodifica y valida la firma y vigencia de un token JWT."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except jwt.PyJWTError as e:
        raise ValueError(f"Token inválido o expirado: {str(e)}")
