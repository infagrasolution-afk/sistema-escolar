import React, { useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  Avatar,
  Button,
  Paper,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

/**
 * Generador e Impresor de Carnets PVC en Estándar CR-80 (85.6 mm x 54 mm)
 * Optimizado con regla de Negro Puro (#000000 / K-Resin) para impresoras Zebra ZXP Series 7.
 */
export const StudentCardPrint = ({ estudiante }) => {
  const printRef = useRef(null);

  // Valores por defecto de prueba si no se pasa estudiante
  const data = estudiante || {
    id: '12345',
    nombres: 'CARLOS EDUARDO',
    apellidos: 'PÉREZ GÓMEZ',
    grado_seccion: '5TO GRADO SECCIÓN A',
    codigo_opaco: 'EST-99887766',
    foto_url: '',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
    window.open(`${backendUrl}/carnets/${data.id}/pdf`, '_blank');
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Botones de Acción (Visibles solo en pantalla, ocultos en impresión) */}
      <Box className="no-print" display="flex" gap={2} mb={3}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ fontWeight: 'bold' }}
        >
          Imprimir Directo en Zebra ZXP 7
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          startIcon={<PictureAsPdfIcon />}
          onClick={handleDownloadPdf}
          sx={{ fontWeight: 'bold' }}
        >
          Descargar PDF CR-80
        </Button>
      </Box>

      {/* Contenedor con Estilos de Impresión CSS @media print */}
      <style>{`
        @media print {
          @page {
            size: 85.6mm 54mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .cr80-card-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Tarjeta PVC CR-80 (85.6 mm x 54 mm, Escala 300 DPI) */}
      <Paper
        ref={printRef}
        className="cr80-card-wrapper"
        elevation={6}
        sx={{
          width: '85.6mm',
          height: '54mm',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '3.18mm', // Borde redondeado estándar de tarjetas PVC CR-80
          bgcolor: '#ffffff',
          border: '1px solid #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Encabezado Institucional */}
        <Box
          sx={{
            height: '11mm',
            bgcolor: '#1e3a8a', // Azul Institucional
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: '2.5mm',
              fontWeight: 'bold',
              lineHeight: 1.1,
              textAlign: 'center',
              letterSpacing: '0.2px',
            }}
          >
            UNIDAD EDUCATIVA INSTITUCIONAL
          </Typography>

          <Typography
            sx={{
              fontSize: '1.8mm',
              lineHeight: 1.1,
              textAlign: 'center',
              opacity: 0.9,
            }}
          >
            CARNET DE IDENTIFICACIÓN ESCOLAR
          </Typography>
        </Box>

        {/* Cuerpo Principal del Carnet */}
        <Box sx={{ flex: 1, display: 'flex', px: '3mm', py: '2mm', gap: '3mm' }}>
          {/* Foto del Estudiante */}
          <Box
            sx={{
              width: '18mm',
              height: '22mm',
              border: '1px solid #000000', // K-Resin Negro Puro
              boxSizing: 'border-box',
              bgcolor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {data.foto_url ? (
              <img
                src={data.foto_url}
                alt={data.nombres}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Avatar
                variant="square"
                sx={{
                  width: '100%',
                  height: '100%',
                  bgcolor: '#cbd5e1',
                  color: '#475569',
                  fontSize: '4mm',
                }}
              >
                FOTO
              </Avatar>
            )}
          </Box>

          {/* Información del Estudiante (Textos en #000000 K-Resin) */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography
              sx={{
                fontSize: '2.8mm',
                fontWeight: 'bold',
                color: '#000000 !important', // Forzar Negro Puro K-Resin
                lineHeight: 1.1,
              }}
            >
              {data.nombres}
            </Typography>

            <Typography
              sx={{
                fontSize: '2.8mm',
                fontWeight: 'bold',
                color: '#000000 !important',
                lineHeight: 1.1,
                mb: '1mm',
              }}
            >
              {data.apellidos}
            </Typography>

            <Typography sx={{ fontSize: '1.9mm', color: '#475569', fontWeight: 'bold' }}>
              GRADO / SECCIÓN:
            </Typography>

            <Typography
              sx={{
                fontSize: '2.2mm',
                fontWeight: 'bold',
                color: '#000000 !important',
                mb: '1mm',
              }}
            >
              {data.grado_seccion}
            </Typography>

            <Typography sx={{ fontSize: '1.8mm', color: '#475569', fontWeight: 'bold' }}>
              CÓDIGO: <span style={{ color: '#000000', fontWeight: 'bold' }}>{data.codigo_opaco}</span>
            </Typography>
          </Box>
        </Box>

        {/* Sección Inferior: Código de Barras Code 128 (Negro Puro #000000) */}
        <Box
          sx={{
            height: '13mm',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#ffffff',
            pb: '1mm',
          }}
        >
          {/* SVG del Código de Barras Code 128 en Negro Puro para el Ribbon K de Zebra */}
          <svg
            style={{ width: '60mm', height: '10mm' }}
            viewBox="0 0 200 40"
            className="k-resin-pure-black"
          >
            {/* Simulación visual de barras Code 128 en negro puro #000000 */}
            <rect x="10" y="2" width="3" height="26" fill="#000000" />
            <rect x="15" y="2" width="1" height="26" fill="#000000" />
            <rect x="18" y="2" width="4" height="26" fill="#000000" />
            <rect x="25" y="2" width="2" height="26" fill="#000000" />
            <rect x="30" y="2" width="5" height="26" fill="#000000" />
            <rect x="38" y="2" width="1" height="26" fill="#000000" />
            <rect x="42" y="2" width="3" height="26" fill="#000000" />
            <rect x="48" y="2" width="2" height="26" fill="#000000" />
            <rect x="53" y="2" width="4" height="26" fill="#000000" />
            <rect x="60" y="2" width="1" height="26" fill="#000000" />
            <rect x="64" y="2" width="5" height="26" fill="#000000" />
            <rect x="72" y="2" width="2" height="26" fill="#000000" />
            <rect x="77" y="2" width="3" height="26" fill="#000000" />
            <rect x="83" y="2" width="1" height="26" fill="#000000" />
            <rect x="87" y="2" width="4" height="26" fill="#000000" />
            <rect x="94" y="2" width="2" height="26" fill="#000000" />
            <rect x="99" y="2" width="5" height="26" fill="#000000" />
            <rect x="107" y="2" width="1" height="26" fill="#000000" />
            <rect x="111" y="2" width="3" height="26" fill="#000000" />
            <rect x="117" y="2" width="2" height="26" fill="#000000" />
            <rect x="122" y="2" width="4" height="26" fill="#000000" />
            <rect x="129" y="2" width="1" height="26" fill="#000000" />
            <rect x="133" y="2" width="5" height="26" fill="#000000" />
            <rect x="141" y="2" width="2" height="26" fill="#000000" />
            <rect x="146" y="2" width="3" height="26" fill="#000000" />
            <rect x="152" y="2" width="1" height="26" fill="#000000" />
            <rect x="156" y="2" width="4" height="26" fill="#000000" />
            <rect x="163" y="2" width="2" height="26" fill="#000000" />
            <rect x="168" y="2" width="5" height="26" fill="#000000" />
            <rect x="176" y="2" width="3" height="26" fill="#000000" />
            <text x="100" y="36" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#000000">
              {data.codigo_opaco}
            </text>
          </svg>
        </Box>
      </Paper>
    </Box>
  );
};

export default StudentCardPrint;
