-- =============================================================================
-- DDL DE BASE DE DATOS POSTGRESQL 15+ PARA SISTEMA ESCOLAR
-- Control de Asistencia, Carnetización y Notificaciones
-- =============================================================================

-- Habilitar extensión pgcrypto por compatibilidad previa (PostgreSQL 13+ gen_random_uuid() es nativo)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- TIPOS ENUM NATIVOS
-- -----------------------------------------------------------------------------

CREATE TYPE rol_usuario_enum AS ENUM (
    'SUPER_ADMIN',
    'ADMIN_CARNET',
    'OPERADOR_IMPRESION',
    'ADMIN_ACCESO',
    'OPERADOR_ESCANEO'
);

CREATE TYPE estado_asistencia_enum AS ENUM (
    'PUNTUAL',
    'RETARDO',
    'FUERA_HORARIO'
);

CREATE TYPE canal_notificacion_enum AS ENUM (
    'TELEGRAM',
    'WHATSAPP'
);

-- -----------------------------------------------------------------------------
-- TABLA: usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario_enum NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuarios_email UNIQUE (email)
);

-- Índices B-Tree optimizados para usuarios
CREATE INDEX idx_usuarios_email ON usuarios USING btree (email);
CREATE INDEX idx_usuarios_rol ON usuarios USING btree (rol);
CREATE INDEX idx_usuarios_activo ON usuarios USING btree (activo);

-- -----------------------------------------------------------------------------
-- TABLA: representantes
-- -----------------------------------------------------------------------------
CREATE TABLE representantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(30) NULL,
    telegram_chat_id BIGINT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_representantes_telegram_chat_id UNIQUE (telegram_chat_id)
);

-- Índices B-Tree para representantes
CREATE INDEX idx_representantes_telegram_chat_id ON representantes USING btree (telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;
CREATE INDEX idx_representantes_telefono ON representantes USING btree (telefono);

-- -----------------------------------------------------------------------------
-- TABLA: estudiantes
-- -----------------------------------------------------------------------------
CREATE TABLE estudiantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_opaco VARCHAR(64) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    grado_seccion VARCHAR(50) NOT NULL,
    foto_url TEXT NULL,
    rfid_uid VARCHAR(64) NULL,
    representante_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_estudiantes_codigo_opaco UNIQUE (codigo_opaco),
    CONSTRAINT uq_estudiantes_rfid_uid UNIQUE (rfid_uid),
    CONSTRAINT fk_estudiantes_representante FOREIGN KEY (representante_id)
        REFERENCES representantes (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Índices B-Tree de alta concurrencia para escaneo rápido (Barcode/QR y RFID)
CREATE INDEX idx_estudiantes_codigo_opaco ON estudiantes USING btree (codigo_opaco);
CREATE INDEX idx_estudiantes_rfid_uid ON estudiantes USING btree (rfid_uid) WHERE rfid_uid IS NOT NULL;
CREATE INDEX idx_estudiantes_representante_id ON estudiantes USING btree (representante_id);
CREATE INDEX idx_estudiantes_grado_seccion ON estudiantes USING btree (grado_seccion);
CREATE INDEX idx_estudiantes_apellidos_nombres ON estudiantes USING btree (apellidos, nombres);

-- -----------------------------------------------------------------------------
-- TABLA: asistencias
-- -----------------------------------------------------------------------------
CREATE TABLE asistencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_entrada TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hora_salida TIMESTAMPTZ NULL,
    estado estado_asistencia_enum NOT NULL,
    operador_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_asistencias_estudiante FOREIGN KEY (estudiante_id)
        REFERENCES estudiantes (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_asistencias_operador FOREIGN KEY (operador_id)
        REFERENCES usuarios (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Índices B-Tree optimizados para consultas de asistencia por estudiante y rango de fecha
CREATE INDEX idx_asistencias_estudiante_fecha ON asistencias USING btree (estudiante_id, fecha DESC);
CREATE INDEX idx_asistencias_fecha_estado ON asistencias USING btree (fecha, estado);
CREATE INDEX idx_asistencias_operador_id ON asistencias USING btree (operador_id);

-- -----------------------------------------------------------------------------
-- TABLA: tokens_vinculacion
-- -----------------------------------------------------------------------------
CREATE TABLE tokens_vinculacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL,
    token VARCHAR(128) NOT NULL,
    expira_en TIMESTAMPTZ NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tokens_vinculacion_token UNIQUE (token),
    CONSTRAINT fk_tokens_estudiante FOREIGN KEY (estudiante_id)
        REFERENCES estudiantes (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices B-Tree para validación ultra rápida de tokens temporales
CREATE INDEX idx_tokens_token ON tokens_vinculacion USING btree (token);
CREATE INDEX idx_tokens_lookup ON tokens_vinculacion USING btree (token, usado, expira_en);
CREATE INDEX idx_tokens_estudiante_id ON tokens_vinculacion USING btree (estudiante_id);

-- -----------------------------------------------------------------------------
-- TABLA: logs_notificaciones
-- -----------------------------------------------------------------------------
CREATE TABLE logs_notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asistencia_id UUID NOT NULL,
    canal canal_notificacion_enum NOT NULL,
    estado_envio VARCHAR(50) NOT NULL,
    respuesta_api JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_asistencia FOREIGN KEY (asistencia_id)
        REFERENCES asistencias (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Índices B-Tree y GIN para auditoría y búsquedas de logs
CREATE INDEX idx_logs_asistencia_id ON logs_notificaciones USING btree (asistencia_id);
CREATE INDEX idx_logs_canal_estado ON logs_notificaciones USING btree (canal, estado_envio);
CREATE INDEX idx_logs_created_at ON logs_notificaciones USING btree (created_at DESC);
CREATE INDEX idx_logs_respuesta_api_gin ON logs_notificaciones USING gin (respuesta_api);
