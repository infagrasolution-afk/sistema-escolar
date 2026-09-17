from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema Escolar - Control de Asistencia y Carnetización"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Configuración PostgreSQL
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "escuela_db"

    # URL de conexión asíncrona para asyncpg
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/escuela_db"

    # Seguridad y JWT
    SECRET_KEY: str = "supersecretkey_change_me_in_production_1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Configuración de Telegram Bot
    TELEGRAM_BOT_TOKEN: str = "7123456789:AAEF_ExampleTelegramBotToken12345"
    TELEGRAM_BOT_USERNAME: str = "ColegioAsistenciaBot"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
