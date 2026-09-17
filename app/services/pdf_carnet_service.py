from io import BytesIO
from typing import List, Optional
import qrcode

from reportlab.graphics.barcode import code128
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from app.models.estudiante import Estudiante

# Especificaciones Estándar CR-80 (85.6 mm x 54.0 mm)
CR80_WIDTH = 85.6 * mm
CR80_HEIGHT = 54.0 * mm

# Regla de Color K-Resin para Impresora Zebra ZXP Series 7
# Negro Puro Absoluto (#000000) para forzar el panel K del ribbon YMCKO
K_RESIN_PURE_BLACK = colors.HexColor("#000000")
COLOR_HEADER_BG = colors.HexColor("#1e3a8a")  # Azul Institucional
COLOR_TEXT_SECONDARY = colors.HexColor("#334155")


def generar_pdf_carnets_batch(estudiantes: List[Estudiante]) -> BytesIO:
    """
    Genera un documento PDF multipágina con las dimensiones exactas CR-80 (85.6mm x 54mm)
    optimizado para la cola de impresión de la Zebra ZXP Series 7.
    """
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(CR80_WIDTH, CR80_HEIGHT))

    for estudiante in estudiantes:
        _dibujar_carnet_cr80(c, estudiante)
        c.showPage()  # Nueva página/tarjeta PVC en el documento PDF

    c.save()
    buffer.seek(0)
    return buffer


def _dibujar_carnet_cr80(c: canvas.Canvas, estudiante: Estudiante) -> None:
    """
    Dibuja un carnet escolar individual sobre el lienzo CR-80.
    Aplica regla estricta de negro puro (#000000) para código de barras y textos críticos.
    """
    # 1. Borde y Fondo Blanco Base
    c.setFillColor(colors.white)
    c.rect(0, 0, CR80_WIDTH, CR80_HEIGHT, fill=1, stroke=0)

    # 2. Encabezado Institucional
    header_height = 11.0 * mm
    c.setFillColor(COLOR_HEADER_BG)
    c.rect(0, CR80_HEIGHT - header_height, CR80_WIDTH, header_height, fill=1, stroke=0)

    # Texto Encabezado (Blanco)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(CR80_WIDTH / 2.0, CR80_HEIGHT - 4.5 * mm, "UNIDAD EDUCATIVA INSTITUCIONAL")
    c.setFont("Helvetica", 5.5)
    c.drawCentredString(CR80_WIDTH / 2.0, CR80_HEIGHT - 8.5 * mm, "CARNET DE IDENTIFICACIÓN ESCOLAR")

    # 3. Foto del Estudiante (O Marco Placeholder)
    photo_width = 18.0 * mm
    photo_height = 22.0 * mm
    photo_x = 4.0 * mm
    photo_y = CR80_HEIGHT - header_height - photo_height - 3.0 * mm

    c.setStrokeColor(K_RESIN_PURE_BLACK)
    c.setLineWidth(0.8)
    c.rect(photo_x, photo_y, photo_width, photo_height, fill=0, stroke=1)

    # Dibujar placeholder si no hay foto
    c.setFillColor(colors.HexColor("#e2e8f0"))
    c.rect(photo_x + 0.5, photo_y + 0.5, photo_width - 1.0, photo_height - 1.0, fill=1, stroke=0)
    c.setFillColor(COLOR_TEXT_SECONDARY)
    c.setFont("Helvetica", 6)
    c.drawCentredString(photo_x + photo_width / 2.0, photo_y + photo_height / 2.0 - 2, "FOTO")

    # 4. Datos del Estudiante (Texto Negro Puro - K-Resin)
    info_x = photo_x + photo_width + 4.0 * mm
    start_y = CR80_HEIGHT - header_height - 4.5 * mm

    # Nombres y Apellidos
    c.setFillColor(K_RESIN_PURE_BLACK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(info_x, start_y, f"{estudiante.nombres[:22]}")
    c.drawString(info_x, start_y - 3.5 * mm, f"{estudiante.apellidos[:22]}")

    # Grado y Sección
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(COLOR_TEXT_SECONDARY)
    c.drawString(info_x, start_y - 8.0 * mm, "GRADO / SECCIÓN:")
    c.setFillColor(K_RESIN_PURE_BLACK)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(info_x, start_y - 11.5 * mm, f"{estudiante.grado_seccion}")

    # Código Opaco
    c.setFont("Helvetica-Bold", 6)
    c.setFillColor(COLOR_TEXT_SECONDARY)
    c.drawString(info_x, start_y - 15.5 * mm, "CÓDIGO:")
    c.setFillColor(K_RESIN_PURE_BLACK)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawString(info_x + 11 * mm, start_y - 15.5 * mm, f"{estudiante.codigo_opaco}")

    # 5. Código de Barras Code 128 (Negro Puro K-Resin)
    barcode_value = estudiante.codigo_opaco
    barcode128 = code128.Code128(
        barcode_value,
        barHeight=9.0 * mm,
        barWidth=0.28 * mm,
        humanReadable=True,
    )
    # Forzar color de barras a negro absoluto
    barcode128.barColor = K_RESIN_PURE_BLACK
    barcode128.textColor = K_RESIN_PURE_BLACK

    # Dibujar código de barras en la parte inferior centrada
    barcode_x = (CR80_WIDTH - barcode128.width) / 2.0
    barcode_y = 2.0 * mm
    barcode128.drawOn(c, barcode_x, barcode_y)

    # 6. Código QR de Respaldo (Esquina Inferior Derecha)
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=2,
            border=1,
        )
        qr.add_data(barcode_value)
        qr.make(fit=True)
        img_qr = qr.make_image(fill_color="black", back_color="white")

        qr_buffer = BytesIO()
        img_qr.save(qr_buffer, format="PNG")
        qr_buffer.seek(0)

        qr_size = 12.0 * mm
        qr_x = CR80_WIDTH - qr_size - 2.5 * mm
        qr_y = 12.0 * mm
        c.drawImage(ImageReader(qr_buffer), qr_x, qr_y, width=qr_size, height=qr_size)
    except Exception:
        pass  # Omitir si hay fallo en QR
