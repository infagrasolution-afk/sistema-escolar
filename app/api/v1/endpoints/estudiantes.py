from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.enums import RolUsuario
from app.models.estudiante import Estudiante
from app.models.usuario import Usuario
from app.schemas.estudiante import EstudianteCreate, EstudianteResponse, EstudianteUpdate

router = APIRouter()


@router.get(
    "",
    response_model=List[EstudianteResponse],
    summary="Listar y buscar estudiantes",
)
@router.get(
    "/",
    response_model=List[EstudianteResponse],
    include_in_schema=False,
)
async def get_estudiantes(
    search: Optional[str] = Query(None, description="Búsqueda por nombres, apellidos, código opaco o RFID"),
    colegio_id: Optional[uuid.UUID] = Query(None, description="Filtrar por cliente u organización"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    """
    Retorna la lista de estudiantes registrados con soporte de búsqueda por texto y filtrado por cliente.
    """
    query = select(Estudiante).order_by(Estudiante.apellidos.asc(), Estudiante.nombres.asc())

    if current_user.rol not in [RolUsuario.SUPER_ADMIN, RolUsuario.ADMIN_CARNET] and current_user.colegio_id:
        query = query.where(Estudiante.colegio_id == current_user.colegio_id)
    elif colegio_id:
        query = query.where(Estudiante.colegio_id == colegio_id)

    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Estudiante.nombres.ilike(term),
                Estudiante.apellidos.ilike(term),
                Estudiante.codigo_opaco.ilike(term),
                Estudiante.rfid_uid.ilike(term),
                Estudiante.grado_seccion.ilike(term),
            )
        )

    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "",
    response_model=EstudianteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo estudiante",
)
@router.post(
    "/",
    response_model=EstudianteResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def create_estudiante(
    estudiante_in: EstudianteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    """
    Registra un nuevo estudiante en la institución.
    Si no se especifica código opaco, se genera uno automático secuencial.
    """
    codigo_final = estudiante_in.codigo_opaco.strip() if estudiante_in.codigo_opaco else f"EST-2026-{uuid.uuid4().hex[:6].upper()}"

    # Validar duplicados de código opaco o rfid
    query_check = select(Estudiante).where(
        or_(
            Estudiante.codigo_opaco == codigo_final,
            (Estudiante.rfid_uid == estudiante_in.rfid_uid) if estudiante_in.rfid_uid else False,
        )
    )
    res_check = await db.execute(query_check)
    if res_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una persona registrada con ese Código o Tarjeta RFID",
        )

    target_colegio_id = estudiante_in.colegio_id or (current_user.colegio_id if current_user else None)

    db_estudiante = Estudiante(
        colegio_id=target_colegio_id,
        codigo_opaco=codigo_final,
        nombres=estudiante_in.nombres.strip(),
        apellidos=estudiante_in.apellidos.strip(),
        grado_seccion=estudiante_in.grado_seccion.strip(),
        foto_url=estudiante_in.foto_url,
        rfid_uid=estudiante_in.rfid_uid.strip() if estudiante_in.rfid_uid else None,
        representante_id=estudiante_in.representante_id,
    )
    db.add(db_estudiante)
    await db.commit()
    await db.refresh(db_estudiante)
    return db_estudiante


@router.put(
    "/{estudiante_id}",
    response_model=EstudianteResponse,
    summary="Actualizar datos de estudiante",
)
async def update_estudiante(
    estudiante_id: uuid.UUID,
    estudiante_in: EstudianteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    query = select(Estudiante).where(Estudiante.id == estudiante_id)
    result = await db.execute(query)
    estudiante = result.scalar_one_or_none()

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado",
        )

    update_data = estudiante_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(estudiante, field, value)

    await db.commit()
    await db.refresh(estudiante)
    return estudiante


@router.delete(
    "/{estudiante_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar estudiante",
)
async def delete_estudiante(
    estudiante_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> None:
    query = select(Estudiante).where(Estudiante.id == estudiante_id)
    result = await db.execute(query)
    estudiante = result.scalar_one_or_none()

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado",
        )

    await db.delete(estudiante)
    await db.commit()


@router.get(
    "/plantilla-descarga",
    summary="Descargar plantilla CSV para carga masiva",
)
async def download_csv_template() -> Any:
    """
    Retorna un archivo CSV con la estructura requerida para importar la data de los carnets masivamente.
    """
    from fastapi.responses import Response
    from app.services.bulk_import_service import generate_bulk_import_csv_template

    csv_data = generate_bulk_import_csv_template()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="plantilla_carga_masiva_estudiantes.csv"'},
    )


@router.post(
    "/carga-masiva",
    summary="Carga masiva de estudiantes y representantes mediante CSV/Excel",
)
async def bulk_upload_estudiantes(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(
        require_role([
            RolUsuario.ADMIN_CARNET,
            RolUsuario.ADMIN_ACCESO,
            RolUsuario.SUPER_ADMIN,
        ])
    ),
) -> Any:
    """
    Procesa un archivo CSV o TXT con la lista de personas/estudiantes/socios para registro masivo en línea.
    """
    from app.services.bulk_import_service import process_bulk_import_csv

    content = await file.read()
    res = await process_bulk_import_csv(content, db)
    return res

