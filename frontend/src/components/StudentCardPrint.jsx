import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  Avatar,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import StyleIcon from '@mui/icons-material/Style';
import axios from 'axios';

export const StudentCardPrint = ({ estudiante }) => {
  const printRef = useRef(null);

  // Cargar configuración de la organización por defecto
  const [tipoOrg, setTipoOrg] = useState('COLEGIO');
  const [orientacion, setOrientacion] = useState('HORIZONTAL');
  const [colorPrimario, setColorPrimario] = useState('#1e3a8a');
  const [cara, setCara] = useState('FRONTAL');
  const [nombreInst, setNombreInst] = useState('UNIDAD EDUCATIVA PRIVADA COLEGIO SAN AGUSTÍN');
  const [subtitulo, setSubtitulo] = useState('CARNET DE IDENTIFICACIÓN ESCOLAR');

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

  useEffect(() => {
    fetchColegioConfig();
  }, []);

  const fetchColegioConfig = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/colegio/config`);
      if (res.data) {
        setTipoOrg(res.data.tipo_organizacion || 'COLEGIO');
        setOrientacion(res.data.orientacion_predeterminada || 'HORIZONTAL');
        setColorPrimario(res.data.color_primario || '#1e3a8a');
        if (res.data.nombre_institucion) setNombreInst(res.data.nombre_institucion);
        if (res.data.subtitulo_carnet) setSubtitulo(res.data.subtitulo_carnet);
      }
    } catch (err) {
      console.error('Error al obtener config institucional:', err);
    }
  };

  const data = estudiante || {
    id: '12345',
    nombres: 'CARLOS EDUARDO',
    apellidos: 'PÉREZ GÓMEZ',
    grado_seccion: '5TO GRADO SECCIÓN A',
    codigo_opaco: 'EST-99887766',
    foto_url: '',
  };

  const isVertical = orientacion === 'VERTICAL';
  const isCooperativa = tipoOrg === 'COOPERATIVA_TRANSPORTE';

  const cardWidth = isVertical ? '54mm' : '85.6mm';
  const cardHeight = isVertical ? '85.6mm' : '54mm';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const params = new URLSearchParams({
      tipo_organizacion: tipoOrg,
      orientacion: orientacion,
      color_primario: colorPrimario,
      cara: cara,
    });
    window.open(`${apiBaseUrl}/carnets/${data.id}/pdf?${params.toString()}`, '_blank');
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Panel de Personalización y Controles de Impresión (Oculto en Impresión CSS) */}
      <Paper
        className="no-print"
        elevation={3}
        sx={{ p: 3, mb: 4, width: '100%', maxWidth: 850, borderRadius: 2 }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <StyleIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Personalizador en Vivo y Generador de Carnet Zebra ZXP 7
          </Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Plantilla</InputLabel>
              <Select
                value={tipoOrg}
                label="Plantilla"
                onChange={(e) => setTipoOrg(e.target.value)}
              >
                <MenuItem value="COLEGIO">Colegio / Escuela</MenuItem>
                <MenuItem value="COOPERATIVA_TRANSPORTE">Cooperativa / Línea</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Orientación</InputLabel>
              <Select
                value={orientacion}
                label="Orientación"
                onChange={(e) => setOrientacion(e.target.value)}
              >
                <MenuItem value="HORIZONTAL">Horizontal (85.6x54mm)</MenuItem>
                <MenuItem value="VERTICAL">Vertical (54x85.6mm)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Cara a Imprimir</InputLabel>
              <Select
                value={cara}
                label="Cara a Imprimir"
                onChange={(e) => setCara(e.target.value)}
              >
                <MenuItem value="FRONTAL">Frontal</MenuItem>
                <MenuItem value="REVERSO">Reverso</MenuItem>
                <MenuItem value="AMBAS">Ambas (Doble Cara)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <TextField
                label="Color Membrete"
                size="small"
                value={colorPrimario}
                onChange={(e) => setColorPrimario(e.target.value)}
              />
              <input
                type="color"
                value={colorPrimario}
                onChange={(e) => setColorPrimario(e.target.value)}
                style={{ width: 36, height: 36, border: 'none', cursor: 'pointer' }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} display="flex" gap={2} justifyContent="flex-end" mt={1}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPdf}
              sx={{ fontWeight: 'bold' }}
            >
              Descargar PDF CR-80
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ fontWeight: 'bold' }}
            >
              Imprimir en Zebra ZXP 7
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Reglas CSS @media print */}
      <style>{`
        @media print {
          @page {
            size: ${cardWidth} ${cardHeight};
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

      {/* Previsualización Vista Frontal / Reverso */}
      <Box display="flex" flexDirection={isVertical ? 'row' : 'column'} gap={3} alignItems="center">
        {(cara === 'FRONTAL' || cara === 'AMBAS') && (
          <Paper
            ref={printRef}
            className="cr80-card-wrapper"
            elevation={6}
            sx={{
              width: cardWidth,
              height: cardHeight,
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '3.18mm',
              bgcolor: '#ffffff',
              border: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {/* Encabezado */}
            <Box
              sx={{
                height: isVertical ? '14mm' : '11mm',
                bgcolor: colorPrimario,
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
                  fontSize: isVertical ? '2.4mm' : '2.3mm',
                  fontWeight: 'bold',
                  lineHeight: 1.1,
                  textAlign: 'center',
                }}
              >
                {nombreInst.toUpperCase()}
              </Typography>
              <Typography sx={{ fontSize: '1.7mm', textAlign: 'center', opacity: 0.9 }}>
                {subtitulo.toUpperCase()}
              </Typography>
            </Box>

            {/* Cuerpo de Carnet */}
            {isVertical ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: '2mm' }}>
                <Box
                  sx={{
                    width: '22mm',
                    height: '26mm',
                    border: '1px solid #000000',
                    bgcolor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: '2mm',
                  }}
                >
                  {data.foto_url ? (
                    <img src={data.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Avatar variant="square" sx={{ width: '100%', height: '100%', bgcolor: '#cbd5e1', fontSize: '4mm' }}>
                      FOTO
                    </Avatar>
                  )}
                </Box>

                <Box sx={{ width: '100%', bgcolor: isCooperativa ? colorPrimario : '#0f172a', py: '0.8mm', mb: '2mm', textAlign: 'center' }}>
                  <Typography sx={{ color: '#ffffff', fontSize: '2mm', fontWeight: 'bold' }}>
                    {isCooperativa ? 'SOCIO / CONDUCTOR' : 'ESTUDIANTE ACTIVO'}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: '2.6mm', fontWeight: 'bold', color: '#000000 !important', textAlign: 'center' }}>
                  {data.nombres}
                </Typography>
                <Typography sx={{ fontSize: '2.6mm', fontWeight: 'bold', color: '#000000 !important', textAlign: 'center', mb: '1mm' }}>
                  {data.apellidos}
                </Typography>

                <Typography sx={{ fontSize: '1.8mm', color: '#000000 !important', textAlign: 'center' }}>
                  {isCooperativa ? 'UNIDAD / RUTA:' : 'GRADO / SECCIÓN:'} {data.grado_seccion}
                </Typography>

                {/* Código de barras */}
                <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                  <svg style={{ width: '44mm', height: '8mm' }} viewBox="0 0 200 40">
                    <rect x="10" y="2" width="4" height="26" fill="#000000" />
                    <rect x="18" y="2" width="2" height="26" fill="#000000" />
                    <rect x="25" y="2" width="5" height="26" fill="#000000" />
                    <rect x="35" y="2" width="3" height="26" fill="#000000" />
                    <rect x="42" y="2" width="6" height="26" fill="#000000" />
                    <rect x="52" y="2" width="2" height="26" fill="#000000" />
                    <rect x="60" y="2" width="4" height="26" fill="#000000" />
                    <rect x="70" y="2" width="3" height="26" fill="#000000" />
                    <rect x="80" y="2" width="5" height="26" fill="#000000" />
                    <text x="100" y="36" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#000000">
                      {data.codigo_opaco}
                    </text>
                  </svg>
                </Box>
              </Box>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', px: '3mm', py: '2mm', gap: '3mm' }}>
                <Box
                  sx={{
                    width: '18mm',
                    height: '22mm',
                    border: '1px solid #000000',
                    bgcolor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {data.foto_url ? (
                    <img src={data.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Avatar variant="square" sx={{ width: '100%', height: '100%', bgcolor: '#cbd5e1', fontSize: '4mm' }}>
                      FOTO
                    </Avatar>
                  )}
                </Box>

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '2.8mm', fontWeight: 'bold', color: '#000000 !important' }}>
                    {data.nombres}
                  </Typography>
                  <Typography sx={{ fontSize: '2.8mm', fontWeight: 'bold', color: '#000000 !important', mb: '1mm' }}>
                    {data.apellidos}
                  </Typography>
                  <Typography sx={{ fontSize: '1.9mm', color: '#475569', fontWeight: 'bold' }}>
                    {isCooperativa ? 'UNIDAD / RUTA:' : 'GRADO / SECCIÓN:'}
                  </Typography>
                  <Typography sx={{ fontSize: '2.2mm', fontWeight: 'bold', color: '#000000 !important', mb: '1mm' }}>
                    {data.grado_seccion}
                  </Typography>
                  <Typography sx={{ fontSize: '1.8mm', color: '#475569', fontWeight: 'bold' }}>
                    CÓDIGO: <span style={{ color: '#000000', fontWeight: 'bold' }}>{data.codigo_opaco}</span>
                  </Typography>
                </Box>
              </Box>
            )}

            {!isVertical && (
              <Box sx={{ height: '12mm', display: 'flex', alignItems: 'center', justifyContent: 'center', pb: '1mm' }}>
                <svg style={{ width: '60mm', height: '9mm' }} viewBox="0 0 200 40">
                  <rect x="10" y="2" width="3" height="26" fill="#000000" />
                  <rect x="15" y="2" width="1" height="26" fill="#000000" />
                  <rect x="18" y="2" width="4" height="26" fill="#000000" />
                  <rect x="25" y="2" width="2" height="26" fill="#000000" />
                  <rect x="30" y="2" width="5" height="26" fill="#000000" />
                  <rect x="42" y="2" width="3" height="26" fill="#000000" />
                  <rect x="48" y="2" width="2" height="26" fill="#000000" />
                  <text x="100" y="36" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#000000">
                    {data.codigo_opaco}
                  </text>
                </svg>
              </Box>
            )}
          </Paper>
        )}

        {(cara === 'REVERSO' || cara === 'AMBAS') && (
          <Paper
            className="cr80-card-wrapper"
            elevation={6}
            sx={{
              width: cardWidth,
              height: cardHeight,
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '3.18mm',
              bgcolor: '#ffffff',
              border: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              p: '2mm',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <Box sx={{ bgcolor: colorPrimario, color: '#ffffff', py: '1mm', px: '2mm', mb: '2mm', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '2mm', fontWeight: 'bold' }}>NORMATIVA DE USO</Typography>
            </Box>

            <Typography sx={{ fontSize: '1.6mm', color: '#000000 !important', mb: '1mm' }}>
              1. Este carnet es personal e intransferible.
            </Typography>
            <Typography sx={{ fontSize: '1.6mm', color: '#000000 !important', mb: '1mm' }}>
              2. Identifica al portador como miembro registrado.
            </Typography>
            <Typography sx={{ fontSize: '1.6mm', color: '#000000 !important', mb: '2mm' }}>
              3. En caso de pérdida, reportar a la administración.
            </Typography>

            <Box sx={{ mt: 'auto', border: '1px dashed #000000', p: '2mm', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.5mm', fontWeight: 'bold', color: '#000000' }}>
                FIRMA Y SELLO AUTORIZADO
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default StudentCardPrint;
