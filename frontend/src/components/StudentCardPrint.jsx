import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
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
  LinearProgress,
  Tooltip,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import StyleIcon from '@mui/icons-material/Style';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import PeopleIcon from '@mui/icons-material/People';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import BatchPrintModal from './BatchPrintModal';
import API_BASE_URL from '../apiConfig';

export const StudentCardPrint = ({ estudiante }) => {
  const printRef = useRef(null);

  // Configuración dinámica
  const [tipoOrg, setTipoOrg] = useState('COLEGIO');
  const [orientacion, setOrientacion] = useState('HORIZONTAL');
  const [colorPrimario, setColorPrimario] = useState('#1e3a8a');
  const [cara, setCara] = useState('FRONTAL');
  const [tipoCodigo, setTipoCodigo] = useState('AMBOS');
  const [nombreInst, setNombreInst] = useState('UNIDAD EDUCATIVA PRIVADA COLEGIO SAN AGUSTÍN');
  const [subtitulo, setSubtitulo] = useState('CARNET DE IDENTIFICACIÓN ESCOLAR');

  // Estado del Plantel e Impresión por Lotes
  const [estudiantesList, setEstudiantesList] = useState([]);
  const [openBatchModal, setOpenBatchModal] = useState(false);

  const navigate = useNavigate();
  const apiBaseUrl = API_BASE_URL;

  useEffect(() => {
    fetchColegioConfig();
    fetchEstudiantesList();
  }, []);

  const fetchColegioConfig = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/colegio/config`);
      if (res.data) {
        setTipoOrg(res.data.tipo_organizacion || 'COLEGIO');
        setOrientacion(res.data.orientacion_predeterminada || 'HORIZONTAL');
        setColorPrimario(res.data.color_primario || '#1e3a8a');
        if (res.data.tipo_codigo) setTipoCodigo(res.data.tipo_codigo);
        if (res.data.nombre_institucion) setNombreInst(res.data.nombre_institucion);
        if (res.data.subtitulo_carnet) setSubtitulo(res.data.subtitulo_carnet);
      }
    } catch (err) {
      console.error('Error al obtener config institucional:', err);
    }
  };

  const fetchEstudiantesList = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const res = await axios.get(`${apiBaseUrl}/estudiantes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        setEstudiantesList(res.data);
      }
    } catch (err) {
      console.error('Error al cargar lista de estudiantes:', err);
    }
  };

  const totalCargados = estudiantesList.length;
  const conFotoCount = estudiantesList.filter((e) => Boolean(e.foto_url)).length;
  const sinFotoCount = totalCargados - conFotoCount;

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

  const handleDownloadPdf = async () => {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams({
      tipo_organizacion: tipoOrg,
      orientacion: orientacion,
      color_primario: colorPrimario,
      cara: cara,
      tipo_codigo: tipoCodigo,
      token: token || '',
    });

    try {
      const response = await axios.get(`${apiBaseUrl}/carnets/${data.id}/pdf`, {
        params: {
          tipo_organizacion: tipoOrg,
          orientacion: orientacion,
          color_primario: colorPrimario,
          cara: cara,
          tipo_codigo: tipoCodigo,
          token: token,
        },
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `carnet_${data.codigo_opaco || data.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Axios blob request fallback to direct window open:', err);
      // Fallback a apertura directa en pestaña usando el token de consulta
      window.open(`${apiBaseUrl}/carnets/${data.id}/pdf?${params.toString()}`, '_blank');
    }
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Card de Estado del Plantel / Empresa para la Administración de Carnetización */}
      {(() => {
        const porcentajeFotos = totalCargados > 0 ? Math.round((conFotoCount / totalCargados) * 100) : 0;
        return (
          <Paper
            className="no-print"
            elevation={6}
            sx={{
              p: 3.5,
              mb: 4,
              width: '100%',
              maxWidth: 900,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2.5}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    width: 52,
                    height: 52,
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 30 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold" letterSpacing={0.3}>
                    {nombreInst}
                  </Typography>
                  <Typography variant="body2" color="#94a3b8">
                    Estado de Información Institucional y Cola de Impresión Zebra ZXP Series 7
                  </Typography>
                </Box>
              </Box>

              <Chip
                icon={totalCargados > 0 ? <CheckCircleIcon sx={{ '&&': { color: '#10b981' } }} /> : <WarningIcon sx={{ '&&': { color: '#f59e0b' } }} />}
                label={totalCargados > 0 ? "DATOS CARGADOS Y LISTOS" : "PENDIENTE CARGA DE DATOS"}
                sx={{
                  bgcolor: totalCargados > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: totalCargados > 0 ? '#34d399' : '#fbbf24',
                  border: totalCargados > 0 ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(251, 191, 36, 0.4)',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  py: 2,
                  px: 1,
                  borderRadius: 2,
                }}
              />
            </Box>

            {/* Barra de Progreso de Cobertura de Fotos */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', borderRadius: 2, border: '1px solid #334155' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="#94a3b8" fontWeight="bold" display="flex" alignItems="center" gap={0.5}>
                  <CameraAltIcon sx={{ fontSize: 16, color: '#38bdf8' }} /> Cobertura de Fotos para Carnetización
                </Typography>
                <Typography variant="caption" color="#38bdf8" fontWeight="bold">
                  {porcentajeFotos}% Completado
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={porcentajeFotos}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: '#334155',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: porcentajeFotos === 100 ? '#10b981' : '#38bdf8',
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            {/* Indicadores KPI */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: '#0f172a',
                    borderRadius: 2.5,
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { transform: 'translateY(-2px)', borderColor: '#38bdf8' },
                  }}
                >
                  <Avatar sx={{ bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', width: 44, height: 44 }}>
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="#ffffff">
                      {totalCargados}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8">
                      Personas Cargadas
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: '#0f172a',
                    borderRadius: 2.5,
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { transform: 'translateY(-2px)', borderColor: '#10b981' },
                  }}
                >
                  <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: 44, height: 44 }}>
                    <CameraAltIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="#10b981">
                      {conFotoCount}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8">
                      Con Foto Lista
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: '#0f172a',
                    borderRadius: 2.5,
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { transform: 'translateY(-2px)', borderColor: sinFotoCount > 0 ? '#f59e0b' : '#334155' },
                  }}
                >
                  <Avatar sx={{ bgcolor: sinFotoCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(148, 163, 184, 0.1)', color: sinFotoCount > 0 ? '#f59e0b' : '#94a3b8', width: 44, height: 44 }}>
                    <PendingActionsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color={sinFotoCount > 0 ? '#f59e0b' : '#94a3b8'}>
                      {sinFotoCount}
                    </Typography>
                    <Typography variant="caption" color="#94a3b8">
                      Sin Foto (Pendientes)
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Box display="flex" gap={2} justifyContent="flex-end" flexWrap="wrap">
              <Button
                variant="outlined"
                color="info"
                startIcon={<ContactPageIcon />}
                onClick={() => navigate('/estudiantes')}
                sx={{ borderRadius: 2, px: 2.5, fontWeight: 'bold' }}
              >
                Padrón de Estudiantes
              </Button>

              <Button
                variant="contained"
                color="success"
                startIcon={<PrintIcon />}
                disabled={totalCargados === 0}
                onClick={() => setOpenBatchModal(true)}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 'bold',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  },
                }}
              >
                Impresión Masiva (Zebra ZXP 7)
              </Button>
            </Box>
          </Paper>
        );
      })()}

      {/* Panel de Personalización en Vivo */}
      <Paper
        className="no-print"
        elevation={3}
        sx={{ p: 3, mb: 4, width: '100%', maxWidth: 900, borderRadius: 2 }}
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
              <InputLabel>Tipo de Código</InputLabel>
              <Select
                value={tipoCodigo}
                label="Tipo de Código"
                onChange={(e) => setTipoCodigo(e.target.value)}
              >
                <MenuItem value="AMBOS">Ambos (Barras + QR)</MenuItem>
                <MenuItem value="BARRA">Solo Código de Barras</MenuItem>
                <MenuItem value="QR">Solo Código QR</MenuItem>
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

          <Grid item xs={12} sm={6} md={4}>
            <Box display="flex" alignItems="center" gap={1}>
              <TextField
                label="Color Membrete"
                size="small"
                fullWidth
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

          <Grid item xs={12} sm={6} md={8} display="flex" gap={2} justifyContent="flex-end">
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
              backgroundImage: colegioConfig?.fondo_url ? `url("${colegioConfig.fondo_url}")` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
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

                {/* Código según preferencia */}
                <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                  {tipoCodigo === 'QR' ? (
                    <Box sx={{ width: '12mm', height: '12mm', border: '1px solid #000', p: '1px', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: '1.5mm', fontWeight: 'bold', color: '#000' }}>QR</Typography>
                    </Box>
                  ) : (
                    <svg style={{ width: '44mm', height: '8mm' }} viewBox="0 0 200 40">
                      <rect x="10" y="2" width="4" height="26" fill="#000000" />
                      <rect x="18" y="2" width="2" height="26" fill="#000000" />
                      <rect x="25" y="2" width="5" height="26" fill="#000000" />
                      <rect x="35" y="2" width="3" height="26" fill="#000000" />
                      <rect x="42" y="2" width="6" height="26" fill="#000000" />
                      <rect x="52" y="2" width="2" height="26" fill="#000000" />
                      <rect x="60" y="2" width="4" height="26" fill="#000000" />
                      <text x="100" y="36" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#000000">
                        {data.codigo_opaco}
                      </text>
                    </svg>
                  )}
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

                {/* Si es solo QR en Horizontal */}
                {tipoCodigo === 'QR' && (
                  <Box sx={{ width: '14mm', height: '14mm', border: '1px solid #000', my: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '1.8mm', fontWeight: 'bold', color: '#000' }}>QR</Typography>
                  </Box>
                )}
              </Box>
            )}

            {!isVertical && (tipoCodigo === 'BARRA' || tipoCodigo === 'AMBOS') && (
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

      {/* Modal de Impresión por Lotes */}
      <BatchPrintModal
        open={openBatchModal}
        onClose={() => setOpenBatchModal(false)}
        estudiantes={estudiantesList}
      />
    </Box>
  );
};

export default StudentCardPrint;
