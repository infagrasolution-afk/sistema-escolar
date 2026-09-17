import enum


class RolUsuario(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN_CARNET = "ADMIN_CARNET"
    OPERADOR_IMPRESION = "OPERADOR_IMPRESION"
    ADMIN_ACCESO = "ADMIN_ACCESO"
    OPERADOR_ESCANEO = "OPERADOR_ESCANEO"


class EstadoAsistencia(str, enum.Enum):
    PUNTUAL = "PUNTUAL"
    RETARDO = "RETARDO"
    FUERA_HORARIO = "FUERA_HORARIO"


class CanalNotificacion(str, enum.Enum):
    TELEGRAM = "TELEGRAM"
    WHATSAPP = "WHATSAPP"
