from io import BytesIO
from typing import List, Optional
import qrcode

from reportlab.graphics.barcode import code128
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from app.models.estudiante import Estudiante

# Regla de Color K-Resin para Impresora Zebra ZXP Series 7
K_RESIN_PURE_BLACK = colors.HexColor("#000000")


def generar_pdf_carnets_batch(
    estudiantes: List[Estudiante],
    tipo_organizacion: str = "COLEGIO",
    orientacion: str = "HORIZONTAL",
    color_primario_hex: str = "#1e3a8a",
    color_secundario_hex: str = "#000000",
    cara: str = "FRONTAL",
    nombre_institucion: str = "UNIDAD EDUCATIVA PRIVADA COLEGIO SAN AGUSTÍN",
    subtitulo_carnet: str = "CARNET DE IDENTIFICACIÓN",
    ano_escolar: str = "2025-2026",
    poliza_seguro: Optional[str] = "APES - 002001-38 - Oceánica de Seguros",
) -> BytesIO:
    """
    Genera un documento PDF multipágina con dimensiones CR-80 (85.6mm x 54.0mm)
    con soporte para plantillas Colegio vs Cooperativa/Transporte, orientación Horizontal/Vertical
    y caras Frontal/Reverso.
    """
    is_vertical = orientacion.upper() == "VERTICAL"
    width = 54.0 * mm if is_vertical else 85.6 * mm
    height = 85.6 * mm if is_vertical else 54.0 * mm

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(width, height))

    primary_color = colors.HexColor(color_primario_hex) if color_primario_hex else colors.HexColor("#1e3a8a")

    for estudiante in estudiantes:
        if cara.upper() in ["FRONTAL", "AMBAS"]:
            _dibujar_cara_frontal(
                c=c,
                estudiante=estudiante,
                w=width,
                h=height,
                is_vertical=is_vertical,
                tipo_org=tipo_organizacion,
                primary_color=primary_color,
                nombre_inst=nombre_institucion,
                subtitulo=subtitulo_carnet,
                ano_escolar=ano_escolar,
            )
            c.showPage()

        if cara.upper() in ["REVERSO", "AMBAS"]:
            _dibujar_cara_reverso(
                c=c,
                estudiante=estudiante,
                w=width,
                h=height,
                is_vertical=is_vertical,
                tipo_org=tipo_organizacion,
                primary_color=primary_color,
                nombre_inst=nombre_institucion,
                poliza_seguro=poliza_seguro,
            )
            c.showPage()

    c.save()
    buffer.seek(0)
    return buffer


def _dibujar_cara_frontal(
    c: canvas.Canvas,
    estudiante: Estudiante,
    w: float,
    h: float,
    is_vertical: bool,
    tipo_org: str,
    primary_color: colors.HexColor,
    nombre_inst: str,
    subtitulo: str,
    ano_escolar: str,
) -> None:
    # 1. Fondo Blanco Base
    c.setFillColor(colors.white)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # 2. Encabezado Institucional
    header_h = 14.0 * mm if is_vertical else 11.0 * mm
    c.setFillColor(primary_color)
    c.rect(0, h - header_h, w, header_h, fill=1, stroke=0)

    # Texto Encabezado
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 7.5 if is_vertical else 7.0)
    c.drawCentredString(w / 2.0, h - 4.5 * mm, nombre_inst[:38].upper())
    c.setFont("Helvetica", 5.5)
    c.drawCentredString(w / 2.0, h - 8.5 * mm, subtitulo.upper())
    if is_vertical:
        c.drawCentredString(w / 2.0, h - 11.5 * mm, f"PERÍODO: {ano_escolar}")

    is_cooperativa = "COOPERATIVA" in tipo_org.upper() or "TRANSPORTE" in tipo_org.upper()

    if is_vertical:
        # Layout Vertical
        photo_w, photo_h = 22.0 * mm, 26.0 * mm
        photo_x = (w - photo_w) / 2.0
        photo_y = h - header_h - photo_h - 4.0 * mm

        # Foto Placeholder / Borde K-Resin
        c.setStrokeColor(K_RESIN_PURE_BLACK)
        c.setLineWidth(0.8)
        c.rect(photo_x, photo_y, photo_w, photo_h, fill=0, stroke=1)
        c.setFillColor(colors.HexColor("#e2e8f0"))
        c.rect(photo_x + 0.5, photo_y + 0.5, photo_w - 1.0, photo_h - 1.0, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#475569"))
        c.setFont("Helvetica", 7)
        c.drawCentredString(photo_x + photo_w / 2.0, photo_y + photo_h / 2.0 - 2, "FOTO")

        # Banda de Rol para Cooperativa / Colegio
        role_band_y = photo_y - 4.5 * mm
        c.setFillColor(primary_color if is_cooperativa else colors.HexColor("#0f172a"))
        c.rect(4.0 * mm, role_band_y, w - 8.0 * mm, 4.0 * mm, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 6.5)
        role_txt = "SOCIO / CONDUCTOR" if is_cooperativa else "ESTUDIANTE ACTIVO"
        c.drawCentredString(w / 2.0, role_band_y + 1.2 * mm, role_txt)

        # Datos Nombre y Grado
        c.setFillColor(K_RESIN_PURE_BLACK)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(w / 2.0, role_band_y - 4.0 * mm, f"{estudiante.nombres[:22]}")
        c.drawCentredString(w / 2.0, role_band_y - 7.5 * mm, f"{estudiante.apellidos[:22]}")

        c.setFont("Helvetica", 6.5)
        c.setFillColor(K_RESIN_PURE_BLACK)
        label_det = "UNIDAD / RUTA:" if is_cooperativa else "GRADO / SECCIÓN:"
        c.drawCentredString(w / 2.0, role_band_y - 11.5 * mm, f"{label_det} {estudiante.grado_seccion}")

        # Code 128 Barcode
        _dibujar_codigo_barras(c, estudiante.codigo_opaco, w / 2.0, 4.0 * mm, bar_h=7.0 * mm)

    else:
        # Layout Horizontal
        photo_w, photo_h = 18.0 * mm, 22.0 * mm
        photo_x = 4.0 * mm
        photo_y = h - header_h - photo_h - 3.0 * mm

        c.setStrokeColor(K_RESIN_PURE_BLACK)
        c.setLineWidth(0.8)
        c.rect(photo_x, photo_y, photo_w, photo_h, fill=0, stroke=1)
        c.setFillColor(colors.HexColor("#e2e8f0"))
        c.rect(photo_x + 0.5, photo_y + 0.5, photo_w - 1.0, photo_h - 1.0, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#475569"))
        c.setFont("Helvetica", 6)
        c.drawCentredString(photo_x + photo_w / 2.0, photo_y + photo_h / 2.0 - 2, "FOTO")

        # Banda / Tag de Rol si es Cooperativa
        if is_cooperativa:
            c.setFillColor(primary_color)
            c.rect(photo_x, photo_y - 3.5 * mm, photo_w, 3.0 * mm, fill=1, stroke=0)
            c.setFillColor(colors.white)
            c.setFont("Helvetica-Bold", 5.5)
            c.drawCentredString(photo_x + photo_w / 2.0, photo_y - 2.7 * mm, "SOCIO")

        # Datos
        info_x = photo_x + photo_w + 4.0 * mm
        start_y = h - header_h - 4.5 * mm

        c.setFillColor(K_RESIN_PURE_BLACK)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(info_x, start_y, f"{estudiante.nombres[:22]}")
        c.drawString(info_x, start_y - 3.5 * mm, f"{estudiante.apellidos[:22]}")

        label_det = "UNIDAD / RUTA:" if is_cooperativa else "GRADO / SECCIÓN:"
        c.setFont("Helvetica", 6)
        c.drawString(info_x, start_y - 7.5 * mm, label_det)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(info_x, start_y - 11.0 * mm, f"{estudiante.grado_seccion}")

        c.setFont("Helvetica", 6)
        c.drawString(info_x, start_y - 14.5 * mm, "CÓDIGO ID:")
        c.setFont("Helvetica-Bold", 6.5)
        c.drawString(info_x + 13.0 * mm, start_y - 14.5 * mm, f"{estudiante.codigo_opaco}")

        # Barcode & QR
        _dibujar_codigo_barras(c, estudiante.codigo_opaco, 32.0 * mm, 2.0 * mm, bar_h=8.0 * mm)
        _dibujar_qr(c, estudiante.codigo_opaco, w - 14.0 * mm, 12.0 * mm, size=12.0 * mm)


def _dibujar_cara_reverso(
    c: canvas.Canvas,
    estudiante: Estudiante,
    w: float,
    h: float,
    is_vertical: bool,
    tipo_org: str,
    primary_color: colors.HexColor,
    nombre_inst: str,
    poliza_seguro: Optional[str],
) -> None:
    # Fondo Blanco
    c.setFillColor(colors.white)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Franja Superior
    c.setFillColor(primary_color)
    c.rect(0, h - 5.0 * mm, w, 5.0 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(w / 2.0, h - 3.8 * mm, "INFORMACIÓN Y NORMATIVA DE USO")

    # Texto de Términos
    c.setFillColor(K_RESIN_PURE_BLACK)
    c.setFont("Helvetica", 5)

    if is_vertical:
        lines = [
            "1. Este carnet es personal e e intransferible.",
            "2. Identifica al portador como miembro activo.",
            "3. En caso de extravío, notificar a la administración.",
            "4. Válido únicamente con sello y firma autorizada.",
        ]
        curr_y = h - 9.0 * mm
        for line in lines:
            c.drawString(4.0 * mm, curr_y, line)
            curr_y -= 3.2 * mm

        if poliza_seguro:
            c.setFont("Helvetica-Bold", 5)
            c.drawString(4.0 * mm, curr_y - 1.0 * mm, f"PÓLIZA DE SEGURO: {poliza_seguro[:30]}")
            curr_y -= 4.0 * mm

        # Cuadro Firma / Sello
        c.setStrokeColor(K_RESIN_PURE_BLACK)
        c.setLineWidth(0.5)
        c.rect(6.0 * mm, 12.0 * mm, w - 12.0 * mm, 16.0 * mm, fill=0, stroke=1)
        c.setFont("Helvetica", 5)
        c.drawCentredString(w / 2.0, 13.0 * mm, "SELLO Y FIRMA AUTORIZADA")

        # QR Reverso
        _dibujar_qr(c, estudiante.codigo_opaco, (w - 8.0 * mm) / 2.0, 3.0 * mm, size=8.0 * mm)

    else:
        lines = [
            "1. Este carnet es personal e intransferible.",
            "2. Debe presentarse obligatoriamente para el acceso a las instalaciones/unidades.",
            "3. En caso de pérdida o extravío, reportar inmediatamente a la administración.",
        ]
        curr_y = h - 9.0 * mm
        for line in lines:
            c.drawString(4.0 * mm, curr_y, line)
            curr_y -= 3.0 * mm

        if poliza_seguro:
            c.setFont("Helvetica-Bold", 5)
            c.drawString(4.0 * mm, curr_y - 1.0 * mm, f"PÓLIZA: {poliza_seguro[:45]}")

        # Cuadro Firma y Sello
        c.setStrokeColor(K_RESIN_PURE_BLACK)
        c.setLineWidth(0.5)
        c.rect(w - 32.0 * mm, 4.0 * mm, 28.0 * mm, 18.0 * mm, fill=0, stroke=1)
        c.setFont("Helvetica", 4.5)
        c.drawCentredString(w - 18.0 * mm, 5.0 * mm, "FIRMA / SELLO")

        # QR Reverso
        _dibujar_qr(c, estudiante.codigo_opaco, 4.0 * mm, 4.0 * mm, size=14.0 * mm)


def _dibujar_codigo_barras(c: canvas.Canvas, value: str, center_x: float, y: float, bar_h: float) -> None:
    try:
        barcode128 = code128.Code128(
            value,
            barHeight=bar_h,
            barWidth=0.26 * mm,
            humanReadable=True,
        )
        barcode128.barColor = K_RESIN_PURE_BLACK
        barcode128.textColor = K_RESIN_PURE_BLACK
        bx = center_x - (barcode128.width / 2.0)
        barcode128.drawOn(c, bx, y)
    except Exception:
        pass


def _dibujar_qr(c: canvas.Canvas, value: str, x: float, y: float, size: float) -> None:
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=2,
            border=1,
        )
        qr.add_data(value)
        qr.make(fit=True)
        img_qr = qr.make_image(fill_color="black", back_color="white")

        qr_buffer = BytesIO()
        img_qr.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)
        c.drawImage(ImageReader(qr_buffer), x, y, width=size, height=size)
    except Exception:
        pass
