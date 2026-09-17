import csv
import io
import uuid
from typing import Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.estudiante import Estudiante
from app.models.representante import Representante


CSV_HEADER = [
    "codigo_opaco",
    "nombres",
    "apellidos",
    "grado_seccion",
    "rfid_uid",
    "cedula_representante",
    "nombres_representante",
    "apellidos_representante",
    "telefono_representante",
    "email_representante",
]


def generate_bulk_import_csv_template() -> str:
    output = io.StringIO()
    writer = csv.writer(output, delimiter=",", quoting=csv.QUOTE_MINIMAL)
    writer.writerow(CSV_HEADER)
    # Ejemplo 1 - Estudiante Escolar
    writer.writerow([
        "EST-2025-001",
        "Juan Carlos",
        "Pérez Gómez",
        "5to Grado A",
        "RF10203040",
        "V-12345678",
        "Carlos",
        "Pérez",
        "+584141234567",
        "carlos.perez@email.com",
    ])
    # Ejemplo 2 - Socio Cooperativa
    writer.writerow([
        "SOC-0042",
        "María Alejandra",
        "Rodríguez Ruiz",
        "Socio / Unidad 42",
        "RF99887766",
        "V-87654321",
        "María",
        "Rodríguez",
        "+584129876543",
        "maria.rodriguez@email.com",
    ])
    return output.getvalue()


async def process_bulk_import_csv(
    file_bytes: bytes,
    db: AsyncSession
) -> Dict[str, Any]:
    text_content = file_bytes.decode("utf-8-sig", errors="ignore")
    # Soporta comas o punto y coma
    delimiter = ";" if ";" in text_content.splitlines()[0] else ","
    reader = csv.DictReader(io.StringIO(text_content), delimiter=delimiter)
    
    creados = 0
    actualizados = 0
    errores = []

    for idx, row in enumerate(reader, start=2):
        try:
            codigo_opaco = row.get("codigo_opaco", "").strip()
            nombres = row.get("nombres", "").strip()
            apellidos = row.get("apellidos", "").strip()
            grado_seccion = row.get("grado_seccion", "").strip()
            rfid_uid = row.get("rfid_uid", "").strip() or None
            
            cedula_rep = row.get("cedula_representante", "").strip()
            nombres_rep = row.get("nombres_representante", "").strip()
            apellidos_rep = row.get("apellidos_representante", "").strip()
            tlf_rep = row.get("telefono_representante", "").strip()
            email_rep = row.get("email_representante", "").strip() or None

            if not codigo_opaco or not nombres or not apellidos:
                errores.append(f"Fila {idx}: Faltan campos obligatorios (codigo_opaco, nombres, apellidos)")
                continue

            representante_obj = None
            if cedula_rep:
                res_rep = await db.execute(select(Representante).where(Representante.cedula == cedula_rep))
                representante_obj = res_rep.scalars().first()
                if not representante_obj and nombres_rep:
                    representante_obj = Representante(
                        cedula=cedula_rep,
                        nombres=nombres_rep,
                        apellidos=apellidos_rep or "Sin Apellido",
                        telefono=tlf_rep or "+580000000000",
                        email=email_rep,
                    )
                    db.add(representante_obj)
                    await db.flush()

            # Buscar estudiante por codigo_opaco
            res_est = await db.execute(select(Estudiante).where(Estudiante.codigo_opaco == codigo_opaco))
            estudiante_obj = res_est.scalars().first()

            if estudiante_obj:
                estudiante_obj.nombres = nombres
                estudiante_obj.apellidos = apellidos
                estudiante_obj.grado_seccion = grado_seccion or estudiante_obj.grado_seccion
                if rfid_uid:
                    estudiante_obj.rfid_uid = rfid_uid
                if representante_obj:
                    estudiante_obj.representante_id = representante_obj.id
                actualizados += 1
            else:
                estudiante_obj = Estudiante(
                    codigo_opaco=codigo_opaco,
                    nombres=nombres,
                    apellidos=apellidos,
                    grado_seccion=grado_seccion or "General",
                    rfid_uid=rfid_uid,
                    representante_id=representante_obj.id if representante_obj else None,
                )
                db.add(estudiante_obj)
                creados += 1

        except Exception as e:
            errores.append(f"Fila {idx}: Error procesando registro ({str(e)})")

    await db.commit()
    return {
        "creados": creados,
        "actualizados": actualizados,
        "errores": errores,
        "total_procesados": creados + actualizados
    }
