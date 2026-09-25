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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Snackbar,
  InputAdornment,
  CircularProgress,
  Slider,
  Switch,
  FormControlLabel,
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
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import BatchPrintModal from './BatchPrintModal';
import API_BASE_URL from '../apiConfig';

export const StudentCardPrint = ({ estudiante }) => {
  const printRef = useRef(null);

  // Configuración dinámica del Carnet
  const [tipoOrg, setTipoOrg] = useState('COLEGIO');
  const [orientacion, setOrientacion] = useState('HORIZONTAL');
  const [colorPrimario, setColorPrimario] = useState('#1e3a8a');
  const [colorFondo, setColorFondo] = useState('#ffffff');
  const [fondoOpacidad, setFondoOpacidad] = useState(0.20);
  const [mostrarBarraEncabezado, setMostrarBarraEncabezado] = useState(false);
  const [cara, setCara] = useState('FRONTAL');
  const [tipoCodigo, setTipoCodigo] = useState('AMBOS');
  const [nombreInst, setNombreInst] = useState('UNIDAD EDUCATIVA PRIVADA COLEGIO SAN AGUSTÍN');
  const [subtitulo, setSubtitulo] = useState('CARNET DE IDENTIFICACIÓN ESCOLAR');
  const [fondoUrl, setFondoUrl] = useState('');

  // Estado Multi-Tenancy de Clientes/Colegios
  const [colegiosList, setColegiosList] = useState([]);
  const [selectedColegioId, setSelectedColegioId] = useState('');
  const [activeColegio, setActiveColegio] = useState(null);

  // Estado del Listado de Personas e Impresión
  const [estudiantesList, setEstudiantesList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activeStudent, setActiveStudent] = useState(estudiante || null);
  const [openBatchModal, setOpenBatchModal] = useState(false);
  const [openPadronModal, setOpenPadronModal] = useState(false);
  const [searchPadron, setSearchPadron] = useState('');

  // Modal y Formulario de Registro Rápido de Persona
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [newNombres, setNewNombres] = useState('');
  const [newApellidos, setNewApellidos] = useState('');
  const [newGradoSeccion, setNewGradoSeccion] = useState('');
  const [newCodigoOpaco, setNewCodigoOpaco] = useState('');
  const [newRfidUid, setNewRfidUid] = useState('');
  const [newFotoUrl, setNewFotoUrl] = useState('');
  const [savingPerson, setSavingPerson] = useState(false);

  // Cámara web para captura de foto
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Feedback de Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();
  const apiBaseUrl = API_BASE_URL;

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      alert('No se pudo acceder a la cámara. Verifique los permisos en el navegador.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setNewFotoUrl(dataUrl);
      stopCamera();
    }
  };

  const handleOpenCreateModal = () => {
    stopCamera();
    setNewNombres('');
    setNewApellidos('');
    setNewGradoSeccion('');
    setNewCodigoOpaco('');
    setNewRfidUid('');
    setNewFotoUrl('');
    setOpenCreateModal(true);
  };

  const handleSaveNewPerson = async () => {
    if (!newNombres.trim() || !newApellidos.trim()) {
      setSnackbar({ open: true, message: 'Por favor ingrese Nombres y Apellidos', severity: 'warning' });
      return;
    }
    setSavingPerson(true);
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        nombres: newNombres.trim(),
        apellidos: newApellidos.trim(),
        grado_seccion: newGradoSeccion.trim() || (tipoOrg === 'COOPERATIVA_TRANSPORTE' ? 'Conductor / Socio' : 'General'),
        codigo_opaco: newCodigoOpaco.trim() || undefined,
        rfid_uid: newRfidUid.trim() || undefined,
        foto_url: newFotoUrl || null,
        colegio_id: selectedColegioId || undefined,
      };

      const res = await axios.post(`${apiBaseUrl}/estudiantes`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      stopCamera();
      setOpenCreateModal(false);
      setSnackbar({
        open: true,
        message: `¡${res.data.nombres} ${res.data.apellidos} registrado/a y seleccionado/a para carnetización!`,
        severity: 'success',
      });

      // Recargar lista y seleccionar automáticamente
      await fetchEstudiantesList(selectedColegioId);
      setActiveStudent(res.data);
      setSelectedStudentId(res.data.id);
    } catch (err) {
      console.error('Error al registrar persona:', err);
      const detail = err.response?.data?.detail || 'Error al guardar el registro';
      setSnackbar({ open: true, message: detail, severity: 'error' });
    } finally {
      setSavingPerson(false);
    }
  };

  useEffect(() => {
    fetchColegiosList();
    fetchColegioConfig();
  }, []);

  const fetchColegiosList = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const res = await axios.get(`${apiBaseUrl}/colegios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setColegiosList(res.data);
        setSelectedColegioId(res.data[0].id);
        setActiveColegio(res.data[0]);
        setNombreInst(res.data[0].nombre);
        setTipoOrg(res.data[0].tipo_organizacion || 'COLEGIO');
        fetchEstudiantesList(res.data[0].id);
      } else {
        fetchEstudiantesList();
      }
    } catch (err) {
      console.error('Error cargando lista de colegios/clientes:', err);
      fetchEstudiantesList();
    }
  };

  const fetchColegioConfig = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/colegio/config`);
      if (res.data) {
        if (!selectedColegioId) {
          setTipoOrg(res.data.tipo_organizacion || 'COLEGIO');
          setNombreInst(res.data.nombre_institucion || nombreInst);
        }
        setOrientacion(res.data.orientacion_predeterminada || 'HORIZONTAL');
        setColorPrimario(res.data.color_primario || '#1e3a8a');
        if (res.data.color_fondo) setColorFondo(res.data.color_fondo);
        if (res.data.fondo_opacidad !== undefined) setFondoOpacidad(res.data.fondo_opacidad);
        if (res.data.mostrar_barra_encabezado !== undefined) setMostrarBarraEncabezado(Boolean(res.data.mostrar_barra_encabezado));
        if (res.data.tipo_codigo) setTipoCodigo(res.data.tipo_codigo);
        if (res.data.subtitulo_carnet) setSubtitulo(res.data.subtitulo_carnet);
        if (res.data.fondo_url) setFondoUrl(res.data.fondo_url);
      }
    } catch (err) {
      console.error('Error al obtener config institucional:', err);
    }
  };

  const fetchEstudiantesList = async (colegioId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const url = colegioId
        ? `${apiBaseUrl}/estudiantes?colegio_id=${colegioId}`
        : `${apiBaseUrl}/estudiantes`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        setEstudiantesList(res.data);
        if (res.data.length > 0) {
          setActiveStudent(res.data[0]);
          setSelectedStudentId(res.data[0].id);
        } else {
          setActiveStudent(null);
          setSelectedStudentId('');
        }
      }
    } catch (err) {
      console.error('Error al cargar lista de personas/estudiantes:', err);
    }
  };

  const handleColegioChange = (colegioId) => {
    setSelectedColegioId(colegioId);
    const col = colegiosList.find((c) => c.id === colegioId);
    if (col) {
      setActiveColegio(col);
      setNombreInst(col.nombre);
      setTipoOrg(col.tipo_organizacion || 'COLEGIO');
      if (col.color_primario) setColorPrimario(col.color_primario);
      if (col.color_fondo) setColorFondo(col.color_fondo);
      if (col.fondo_opacidad !== undefined) setFondoOpacidad(col.fondo_opacidad);
      if (col.mostrar_barra_encabezado !== undefined) setMostrarBarraEncabezado(Boolean(col.mostrar_barra_encabezado));
      if (col.fondo_url !== undefined) setFondoUrl(col.fondo_url || '');
    }
    fetchEstudiantesList(colegioId);
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(studentId);
    const found = estudiantesList.find((e) => e.id === studentId);
    if (found) {
      setActiveStudent(found);
    }
  };

  const handleFondoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFondoUrl(reader.result);
        setSnackbar({
          open: true,
          message: 'Imagen de fondo cargada. Haga clic en "Guardar Diseño de Plantilla" para confirmar.',
          severity: 'info',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDesign = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `${apiBaseUrl}/colegio/config`,
        {
          nombre_institucion: nombreInst,
          tipo_organizacion: tipoOrg,
          subtitulo_carnet: subtitulo,
          color_primario: colorPrimario,
          color_fondo: colorFondo,
          fondo_opacidad: fondoOpacidad,
          mostrar_barra_encabezado: mostrarBarraEncabezado,
          orientacion_predeterminada: orientacion,
          tipo_codigo: tipoCodigo,
          fondo_url: fondoUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({
        open: true,
        message: `¡Plantilla de Diseño guardada exitosamente para ${nombreInst}!`,
        severity: 'success',
      });
    } catch (err) {
      console.error('Error guardando diseño:', err);
      setSnackbar({ open: true, message: 'Error al guardar la plantilla de diseño', severity: 'error' });
    }
  };

  const totalCargados = estudiantesList.length;
  const conFotoCount = estudiantesList.filter((e) => Boolean(e.foto_url)).length;
  const sinFotoCount = totalCargados - conFotoCount;

  const data = activeStudent || {
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
      color_fondo: colorFondo,
      fondo_opacidad: fondoOpacidad,
      mostrar_barra_encabezado: mostrarBarraEncabezado,
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
          color_fondo: colorFondo,
          fondo_opacidad: fondoOpacidad,
          mostrar_barra_encabezado: mostrarBarraEncabezado,
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
      window.open(`${apiBaseUrl}/carnets/${data.id}/pdf?${params.toString()}`, '_blank');
    }
  };

  const filteredPadron = estudiantesList.filter((e) => {
    if (!searchPadron) return true;
    const term = searchPadron.toLowerCase();
    return (
      e.nombres.toLowerCase().includes(term) ||
      e.apellidos.toLowerCase().includes(term) ||
      e.grado_seccion.toLowerCase().includes(term) ||
      (e.codigo_opaco && e.codigo_opaco.toLowerCase().includes(term))
    );
  });

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Selector de Cliente / Empresa / Plantel para Impresión */}
      <Paper
        className="no-print"
        elevation={4}
        sx={{
          p: 2.5,
          mb: 3,
          width: '100%',
          maxWidth: 950,
          borderRadius: 3,
          bgcolor: '#1e293b',
          border: '1px solid #38bdf8',
          color: '#ffffff',
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" color="#38bdf8" mb={1} display="flex" alignItems="center" gap={1}>
          <BusinessIcon sx={{ fontSize: 22 }} /> Seleccionar Cliente / Empresa / Plantel Activo para Carnetización
        </Typography>
        {colegiosList.length > 0 ? (
          <FormControl fullWidth size="small">
            <Select
              value={selectedColegioId}
              onChange={(e) => handleColegioChange(e.target.value)}
              sx={{ color: '#ffffff', bgcolor: '#0f172a', fieldset: { borderColor: '#475569' } }}
            >
              {colegiosList.map((col) => (
                <MenuItem key={col.id} value={col.id}>
                  🏢 {col.nombre} ({col.tipo_organizacion} — RIF: {col.rif_identificador || 'N/A'}) — {col.total_estudiantes} Personas Cargadas
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              fullWidth
              size="small"
              label="Institución / Empresa Activa"
              value={nombreInst}
              onChange={(e) => setNombreInst(e.target.value)}
              sx={{ input: { color: '#ffffff' }, label: { color: '#94a3b8' }, fieldset: { borderColor: '#475569' }, bgcolor: '#0f172a' }}
            />
          </Box>
        )}
      </Paper>

      {/* Card de Estado del Plantel / Empresa para la Impresión */}
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
              maxWidth: 950,
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
                    {activeColegio?.rif_identificador ? `RIF: ${activeColegio.rif_identificador} | ` : ''}
                    Cola de Impresión Zebra ZXP Series 7 ({tipoOrg})
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

            {/* Barra de Progreso */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', borderRadius: 2, border: '1px solid #334155' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="#94a3b8" fontWeight="bold" display="flex" alignItems="center" gap={0.5}>
                  <CameraAltIcon sx={{ fontSize: 16, color: '#38bdf8' }} /> Cobertura de Fotografías para Carnetización
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

            {/* Acciones de Consulta de Lista, Registro Rápido e Impresión Masiva */}
            <Box display="flex" gap={2} justifyContent="space-between" alignItems="center" flexWrap="wrap">
              <Box display="flex" gap={1.5} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<PersonAddIcon />}
                  onClick={handleOpenCreateModal}
                  sx={{ borderRadius: 2, px: 2.5, fontWeight: 'bold' }}
                >
                  ➕ Registrar Persona / Estudiante
                </Button>

                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<ContactPageIcon />}
                  onClick={() => setOpenPadronModal(true)}
                  sx={{ borderRadius: 2, px: 2.5, fontWeight: 'bold' }}
                >
                  📋 Consultar Listado
                </Button>
              </Box>

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

      {/* Panel de Diseñador de Carnet y Carga de Fondo Custom */}
      <Paper
        className="no-print"
        elevation={4}
        sx={{
          p: 3.5,
          mb: 4,
          width: '100%',
          maxWidth: 950,
          borderRadius: 3,
          bgcolor: '#1e293b',
          color: '#ffffff',
          border: '1px solid #334155',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <FormatPaintIcon sx={{ color: '#38bdf8', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Diseñador de Carnet y Carga de Imagen de Fondo
              </Typography>
              <Typography variant="subtitle2" color="#94a3b8">
                Personaliza la plantilla, carga tu fondo institucional y selecciona la persona a previsualizar
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            onClick={handleSaveDesign}
            sx={{ fontWeight: 'bold' }}
          >
            Guardar Diseño de Plantilla
          </Button>
        </Box>

        {/* Selector de Estudiante / Persona en Vivo */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#0f172a', borderRadius: 2, border: '1px solid #334155' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#94a3b8' }}>Persona / Estudiante en Vista Previa</InputLabel>
                <Select
                  value={selectedStudentId}
                  label="Persona / Estudiante en Vista Previa"
                  onChange={(e) => handleSelectStudent(e.target.value)}
                  sx={{ color: '#ffffff', fieldset: { borderColor: '#475569' } }}
                >
                  {estudiantesList.map((est) => (
                    <MenuItem key={est.id} value={est.id}>
                      {est.nombres} {est.apellidos} — {est.grado_seccion} ({est.foto_url ? '📷 Con Foto' : '⚠️ Sin Foto'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="outlined"
                color="info"
                startIcon={<VisibilityIcon />}
                onClick={() => setOpenPadronModal(true)}
                sx={{ py: 1 }}
              >
                Buscar en Lista Registrada
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Sección de Carga de Imagen de Fondo y Dimensiones Recomendadas */}
        {/* Sección de Personalización de Fondo, Color y Transparencia */}
        <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: '#0f172a', borderRadius: 2, border: '1px solid #334155' }}>
          <Typography variant="subtitle1" fontWeight="bold" color="#38bdf8" mb={1} display="flex" alignItems="center" gap={1}>
            <UploadFileIcon sx={{ fontSize: 20 }} /> Personalización de Fondo, Color y Transparencia (CR-80)
          </Typography>

          <Alert severity="info" sx={{ mb: 2, bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#e0f2fe', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <strong>Diseño Limpio y Marca de Agua:</strong> Por defecto, la barra verde superior está deshabilitada para ofrecer un carnet con <strong>fondo completamente blanco</strong>. Si agregas una imagen de fondo, se aplicará automáticamente con <strong>transparencia/marca de agua</strong> para que los datos, la foto y el código QR resalten al 100%.
          </Alert>

          <Grid container spacing={2.5} alignItems="center">
            {/* Color de Fondo del Carnet */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" flexDirection="column" gap={0.8}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>
                  Color de Fondo del Carnet
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    size="small"
                    fullWidth
                    value={colorFondo}
                    onChange={(e) => setColorFondo(e.target.value)}
                    placeholder="#ffffff"
                    sx={{ input: { color: '#ffffff' }, fieldset: { borderColor: '#475569' } }}
                  />
                  <input
                    type="color"
                    value={colorFondo || '#ffffff'}
                    onChange={(e) => setColorFondo(e.target.value)}
                    style={{ width: 40, height: 40, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                    title="Seleccionar color de fondo"
                  />
                </Box>
                {/* Botones de colores rápidos */}
                <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                  {[
                    { label: 'Blanco', color: '#ffffff' },
                    { label: 'Crema', color: '#fefce8' },
                    { label: 'Gris Suave', color: '#f8fafc' },
                    { label: 'Celeste Claro', color: '#f0f9ff' },
                  ].map((preset) => (
                    <Chip
                      key={preset.color}
                      label={preset.label}
                      size="small"
                      onClick={() => setColorFondo(preset.color)}
                      sx={{
                        fontSize: '0.68rem',
                        height: 22,
                        bgcolor: colorFondo.toLowerCase() === preset.color.toLowerCase() ? '#0284c7' : '#334155',
                        color: '#ffffff',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#0369a1' },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Estilo del Encabezado (Barra Superior) */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" flexDirection="column" gap={0.8}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>
                  Estilo de Barra Superior
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mostrarBarraEncabezado}
                      onChange={(e) => setMostrarBarraEncabezado(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                      {mostrarBarraEncabezado ? 'Con Franja de Color' : 'Todo Blanco / Limpio (Sin barra)'}
                    </Typography>
                  }
                />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {mostrarBarraEncabezado ? 'Muestra encabezado con el color seleccionado a la derecha' : 'Encabezado integrado sin franja sólida (Recomendado)'}
                </Typography>
              </Box>
            </Grid>

            {/* Color Primario / Franja */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" flexDirection="column" gap={0.8}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>
                  {mostrarBarraEncabezado ? 'Color de Franja Superior' : 'Color de Acento Secundario'}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    size="small"
                    fullWidth
                    value={colorPrimario}
                    onChange={(e) => setColorPrimario(e.target.value)}
                    sx={{ input: { color: '#ffffff' }, fieldset: { borderColor: '#475569' } }}
                  />
                  <input
                    type="color"
                    value={colorPrimario}
                    onChange={(e) => setColorPrimario(e.target.value)}
                    style={{ width: 40, height: 40, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                  />
                </Box>
              </Box>
            </Grid>

            {/* Carga de Imagen de Fondo */}
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                component="label"
                color="secondary"
                startIcon={<UploadFileIcon />}
                sx={{ py: 1.2, fontWeight: 'bold' }}
              >
                Subir Imagen de Fondo Local (PNG/JPG)
                <input type="file" accept="image/*" hidden onChange={handleFondoUpload} />
              </Button>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="o Ingresar URL de Imagen de Fondo"
                value={fondoUrl}
                onChange={(e) => setFondoUrl(e.target.value)}
                sx={{
                  input: { color: '#ffffff' },
                  label: { color: '#94a3b8' },
                  fieldset: { borderColor: '#475569' },
                }}
              />
            </Grid>

            {/* Configuración de Transparencia de la Imagen de Fondo */}
            {fondoUrl && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1e293b', borderColor: '#38bdf8', borderRadius: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4} display="flex" alignItems="center" gap={2}>
                      <Box sx={{ width: 60, height: 40, borderRadius: 1, overflow: 'hidden', border: '1px solid #38bdf8', flexShrink: 0 }}>
                        <img src={fondoUrl} alt="Fondo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" color="#34d399" fontWeight="bold">
                          ✓ Imagen de Fondo Activa
                        </Typography>
                        <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setFondoUrl('')} sx={{ p: 0, minWidth: 'auto', mt: 0.5 }}>
                          Quitar Fondo
                        </Button>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={8}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2" sx={{ color: '#e0f2fe', fontWeight: 'bold' }}>
                          Transparencia / Opacidad de Imagen: {Math.round(fondoOpacidad * 100)}%
                        </Typography>
                        <Chip
                          label={fondoOpacidad <= 0.3 ? 'Marca de Agua Óptima' : 'Opacidad Alta'}
                          color={fondoOpacidad <= 0.3 ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                      <Slider
                        value={Math.round(fondoOpacidad * 100)}
                        min={5}
                        max={100}
                        step={5}
                        onChange={(e, val) => setFondoOpacidad(val / 100)}
                        sx={{ color: '#38bdf8' }}
                      />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Recomendado: 15% - 25% para que la imagen actúe como marca de agua y resalten la foto, textos y código QR.
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Parámetros de Diseño de Carnet */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Nombre de la Institución / Empresa"
              value={nombreInst}
              onChange={(e) => setNombreInst(e.target.value)}
              sx={{ input: { color: '#ffffff' }, label: { color: '#94a3b8' }, fieldset: { borderColor: '#475569' } }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Subtítulo del Carnet"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              sx={{ input: { color: '#ffffff' }, label: { color: '#94a3b8' }, fieldset: { borderColor: '#475569' } }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Plantilla</InputLabel>
              <Select value={tipoOrg} label="Plantilla" onChange={(e) => setTipoOrg(e.target.value)} sx={{ color: '#ffffff', fieldset: { borderColor: '#475569' } }}>
                <MenuItem value="COLEGIO">Colegio / Escuela</MenuItem>
                <MenuItem value="COOPERATIVA_TRANSPORTE">Cooperativa / Línea</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Orientación</InputLabel>
              <Select value={orientacion} label="Orientación" onChange={(e) => setOrientacion(e.target.value)} sx={{ color: '#ffffff', fieldset: { borderColor: '#475569' } }}>
                <MenuItem value="HORIZONTAL">Horizontal (85.6x54mm)</MenuItem>
                <MenuItem value="VERTICAL">Vertical (54x85.6mm)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Tipo de Código</InputLabel>
              <Select value={tipoCodigo} label="Tipo de Código" onChange={(e) => setTipoCodigo(e.target.value)} sx={{ color: '#ffffff', fieldset: { borderColor: '#475569' } }}>
                <MenuItem value="AMBOS">Ambos (Barras + QR)</MenuItem>
                <MenuItem value="BARRA">Solo Código de Barras</MenuItem>
                <MenuItem value="QR">Solo Código QR</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: '#94a3b8' }}>Cara a Imprimir</InputLabel>
              <Select value={cara} label="Cara a Imprimir" onChange={(e) => setCara(e.target.value)} sx={{ color: '#ffffff', fieldset: { borderColor: '#475569' } }}>
                <MenuItem value="FRONTAL">Frontal</MenuItem>
                <MenuItem value="REVERSO">Reverso</MenuItem>
                <MenuItem value="AMBAS">Ambas (Doble Cara)</MenuItem>
              </Select>
            </FormControl>
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

      {/* Reglas CSS @media print para Aislamiento Total de Tarjeta CR-80 */}
      <style>{`
        @media print {
          @page {
            size: ${cardWidth} ${cardHeight};
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          .cr80-card-wrapper, .cr80-card-wrapper * {
            visibility: visible !important;
          }
          .cr80-card-wrapper {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav, footer, .MuiDialog-root {
            display: none !important;
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
              bgcolor: colorFondo || '#ffffff',
              border: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {/* Capa de Imagen de Fondo con Transparencia / Efecto Marca de Agua */}
            {fondoUrl && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url("${fondoUrl}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: Number(fondoOpacidad ?? 0.20),
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Encabezado */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                height: isVertical ? '14mm' : '11mm',
                bgcolor: mostrarBarraEncabezado ? colorPrimario : 'transparent',
                color: mostrarBarraEncabezado ? '#ffffff' : '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 1,
                borderBottom: mostrarBarraEncabezado ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              <Typography
                sx={{
                  fontSize: isVertical ? '2.4mm' : '2.3mm',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  textAlign: 'center',
                  color: mostrarBarraEncabezado ? '#ffffff' : '#0f172a',
                  letterSpacing: '0.2px',
                }}
              >
                {nombreInst.toUpperCase()}
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.7mm',
                  textAlign: 'center',
                  color: mostrarBarraEncabezado ? 'rgba(255,255,255,0.92)' : '#475569',
                  fontWeight: 600,
                  mt: '0.4mm',
                }}
              >
                {subtitulo.toUpperCase()}
              </Typography>
            </Box>

            {/* Cuerpo de Carnet */}
            {isVertical ? (
              <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: '2mm' }}>
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
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
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

                <Box sx={{ width: '100%', bgcolor: isCooperativa ? colorPrimario : '#0f172a', py: '0.8mm', mb: '2mm', textAlign: 'center', borderRadius: '0.5mm' }}>
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
                    <Box sx={{ width: '12mm', height: '12mm', bgcolor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #000', p: '1px', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                      <Typography sx={{ fontSize: '1.5mm', fontWeight: 'bold', color: '#000' }}>QR</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)', px: 0.5, py: 0.2, borderRadius: '0.5mm', display: 'inline-block' }}>
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
                    </Box>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', px: '3mm', py: '2mm', gap: '3mm' }}>
                <Box
                  sx={{
                    width: '18mm',
                    height: '22mm',
                    border: '1px solid #000000',
                    bgcolor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
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

                {tipoCodigo === 'QR' && (
                  <Box sx={{ width: '14mm', height: '14mm', bgcolor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #000', my: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                    <Typography sx={{ fontSize: '1.8mm', fontWeight: 'bold', color: '#000' }}>QR</Typography>
                  </Box>
                )}
              </Box>
            )}

            {!isVertical && (tipoCodigo === 'BARRA' || tipoCodigo === 'AMBOS') && (
              <Box sx={{ position: 'relative', zIndex: 1, height: '12mm', display: 'flex', alignItems: 'center', justifyContent: 'center', pb: '1mm' }}>
                <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)', px: 0.5, py: 0.2, borderRadius: '0.5mm', display: 'inline-block' }}>
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
              bgcolor: colorFondo || '#ffffff',
              border: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              p: '2mm',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {/* Capa de fondo transparente también en reverso si existe */}
            {fondoUrl && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url("${fondoUrl}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: Number(fondoOpacidad ?? 0.20),
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
            )}

            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                bgcolor: mostrarBarraEncabezado ? colorPrimario : 'transparent',
                color: mostrarBarraEncabezado ? '#ffffff' : '#0f172a',
                py: '1mm',
                px: '2mm',
                mb: '2mm',
                textAlign: 'center',
                borderBottom: mostrarBarraEncabezado ? 'none' : '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography sx={{ fontSize: '2mm', fontWeight: 'bold' }}>NORMATIVA DE USO</Typography>
            </Box>

            <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontSize: '1.6mm', color: '#000000 !important', mb: '1mm' }}>
                1. Este carnet es personal e intransferible.
              </Typography>
              <Typography sx={{ fontSize: '1.6mm', color: '#000000 !important', mb: '1mm' }}>
                2. Identifica al portador como miembro registrado.
              </Typography>
              <Typography sx={{ fontSize: '1.6mm', color: '#000000 !important', mb: '2mm' }}>
                3. En caso de pérdida, reportar a la administración.
              </Typography>

              <Box sx={{ mt: 'auto', border: '1px dashed #000000', p: '2mm', textAlign: 'center', bgcolor: 'rgba(255, 255, 255, 0.85)' }}>
                <Typography sx={{ fontSize: '1.5mm', fontWeight: 'bold', color: '#000000' }}>
                  FIRMA Y SELLO AUTORIZADO
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Modal Dialog para Consultar Lista de Personas Registradas */}
      <Dialog
        open={openPadronModal}
        onClose={() => setOpenPadronModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1e293b', color: '#ffffff', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <ContactPageIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">
              Lista de Personas Registradas ({totalCargados}) — {nombreInst}
            </Typography>
          </Box>
          <Chip label={`${conFotoCount} con Foto`} color="success" size="small" />
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#334155' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nombre, grado o código..."
            value={searchPadron}
            onChange={(e) => setSearchPadron(e.target.value)}
            sx={{ mb: 2, input: { color: '#ffffff' }, fieldset: { borderColor: '#475569' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
          />

          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#0f172a', color: '#94a3b8' }}>Foto</TableCell>
                  <TableCell sx={{ bgcolor: '#0f172a', color: '#94a3b8' }}>Persona / Estudiante</TableCell>
                  <TableCell sx={{ bgcolor: '#0f172a', color: '#94a3b8' }}>Grado / Sección</TableCell>
                  <TableCell sx={{ bgcolor: '#0f172a', color: '#94a3b8' }}>Código</TableCell>
                  <TableCell sx={{ bgcolor: '#0f172a', color: '#94a3b8' }}>Estado Foto</TableCell>
                  <TableCell sx={{ bgcolor: '#0f172a', color: '#94a3b8' }} align="right">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPadron.map((est) => (
                  <TableRow key={est.id} sx={{ '&:hover': { bgcolor: '#334155' } }}>
                    <TableCell>
                      <Avatar src={est.foto_url} sx={{ width: 36, height: 36, bgcolor: '#38bdf8' }}>
                        {est.nombres[0]}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                      {est.nombres} {est.apellidos}
                    </TableCell>
                    <TableCell sx={{ color: '#cbd5e1' }}>{est.grado_seccion}</TableCell>
                    <TableCell sx={{ color: '#38bdf8' }}>{est.codigo_opaco}</TableCell>
                    <TableCell>
                      <Chip
                        label={est.foto_url ? 'Con Foto' : 'Sin Foto'}
                        color={est.foto_url ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          handleSelectStudent(est.id);
                          setOpenPadronModal(false);
                        }}
                      >
                        Previsualizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPadronModal(false)} variant="outlined" color="inherit">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Dialog para Registrar Nueva Persona / Estudiante Directamente en Carnetización */}
      <Dialog
        open={openCreateModal}
        onClose={() => { stopCamera(); setOpenCreateModal(false); }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1e293b', color: '#ffffff', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonAddIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold">
            Registrar Persona / Estudiante — {nombreInst}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: '#334155', py: 3 }}>
          <Grid container spacing={2.5}>
            {/* Sección de Foto / Cámara */}
            <Grid item xs={12} md={4} display="flex" flexDirection="column" alignItems="center" justifyContent="center">
              <Paper
                elevation={3}
                sx={{
                  width: 140,
                  height: 160,
                  bgcolor: '#0f172a',
                  border: '2px dashed #38bdf8',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  mb: 1.5,
                }}
              >
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : newFotoUrl ? (
                  <img src={newFotoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Typography variant="caption" color="#94a3b8" textAlign="center" p={1}>
                    Sin Fotografía
                  </Typography>
                )}
              </Paper>

              {isCameraActive ? (
                <Box display="flex" gap={1}>
                  <Button variant="contained" color="success" size="small" onClick={capturePhoto}>
                    📸 Capturar
                  </Button>
                  <Button variant="outlined" color="error" size="small" onClick={stopCamera}>
                    Cancelar
                  </Button>
                </Box>
              ) : (
                <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
                  <Button
                    variant="outlined"
                    color="info"
                    size="small"
                    startIcon={<PhotoCameraIcon />}
                    onClick={startCamera}
                  >
                    Tomar Foto
                  </Button>

                  <Button variant="outlined" color="secondary" size="small" component="label" startIcon={<UploadFileIcon />}>
                    Subir Foto
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setNewFotoUrl(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </Button>
                </Box>
              )}
            </Grid>

            {/* Campos del Formulario */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label="Nombres"
                    value={newNombres}
                    onChange={(e) => setNewNombres(e.target.value)}
                    sx={{ input: { color: '#ffffff' }, label: { color: '#94a3b8' }, fieldset: { borderColor: '#475569' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    label="Apellidos"
                    value={newApellidos}
                    onChange={(e) => setNewApellidos(e.target.value)}
                    sx={{ input: { color: '#ffffff' }, label: { color: '#94a3b8' }, fieldset: { borderColor: '#475569' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={tipoOrg === 'COOPERATIVA_TRANSPORTE' ? 'Cargo / Rol / Unidad' : 'Grado / Sección / Depto'}
                    placeholder={tipoOrg === 'COOPERATIVA_TRANSPORTE' ? 'Ej: Conductor - Unidad 04' : 'Ej: 5to Grado A'}
                    value={newGradoSeccion}
                    onChange={(e) => setNewGradoSeccion(e.target.value)}
                    sx={{ input: { color: '#ffffff' }, label: { color: '#94a3b8' }, fieldset: { borderColor: '#475569' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Cédula / Código Opaco (Opcional)"
                    placeholder="Se auto-genera si queda vacío"
                    value={newCodigoOpaco}
                    onChange={(e) => setNewCodigoOpaco(e.target.value)}
                    sx={{ input: { color: '#ffffff' }, label: { color: '#94a3b8' }, fieldset: { borderColor: '#475569' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Código de Tarjeta RFID (Opcional)"
                    placeholder="Ej: RFID-887766"
                    value={newRfidUid}
                    onChange={(e) => setNewRfidUid(e.target.value)}
                    sx={{ input: { color: '#ffffff' }, label: { color: '#94a3b8' }, fieldset: { borderColor: '#475569' } }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #334155' }}>
          <Button
            onClick={() => { stopCamera(); setOpenCreateModal(false); }}
            variant="outlined"
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveNewPerson}
            variant="contained"
            color="primary"
            disabled={savingPerson}
            startIcon={savingPerson ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ fontWeight: 'bold' }}
          >
            {savingPerson ? 'Guardando...' : 'Guardar y Carnetizar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Impresión por Lotes */}
      <BatchPrintModal
        open={openBatchModal}
        onClose={() => setOpenBatchModal(false)}
        estudiantes={estudiantesList}
      />

      {/* Snackbar Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentCardPrint;
