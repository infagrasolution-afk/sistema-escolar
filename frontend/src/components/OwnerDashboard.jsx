import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

import API_BASE_URL from '../apiConfig';

export const OwnerDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [colegios, setColegios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal estado para crear cliente
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    tipo_organizacion: 'COLEGIO',
    rif_identificador: '',
    color_primario: '#1e8a6f',
    color_secundario: '#0f172a',
    notificaciones_activas: true,
    admin_email: '',
    admin_password: '',
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      const [resMetrics, resLogs, resColegios] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/metrics`, authHeader),
        axios.get(`${API_BASE_URL}/dashboard/audit-logs`, authHeader),
        axios.get(`${API_BASE_URL}/colegios`, authHeader).catch(() => ({ data: [] })),
      ]);

      setMetrics(resMetrics.data);
      setAuditLogs(resLogs.data);
      setColegios(resColegios.data || []);
    } catch (err) {
      console.error('Error cargando métricas de owner:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleToggleNotificaciones = async (colegioId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `${API_BASE_URL}/colegios/${colegioId}/toggle-notificaciones`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboardData();
    } catch (err) {
      console.error('Error cambiando estado de notificaciones:', err);
    }
  };

  const handleDeleteColegio = async (colegioId, colegioNombre) => {
    if (!window.confirm(`¿Está seguro de que desea ELIMINAR PERMANENTEMENTE el cliente "${colegioNombre}" y todos sus usuarios/estudiantes?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/colegios/${colegioId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar el cliente');
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${API_BASE_URL}/colegios`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage(`¡Cliente "${response.data.nombre}" creado exitosamente!`);
      setFormData({
        nombre: '',
        tipo_organizacion: 'COLEGIO',
        rif_identificador: '',
        color_primario: '#1e8a6f',
        color_secundario: '#0f172a',
        notificaciones_activas: true,
        admin_email: '',
        admin_password: '',
      });
      setTimeout(() => {
        setOpenCreateModal(false);
        setSuccessMessage('');
        fetchDashboardData();
      }, 1500);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.detail || 'Error al crear el cliente. Verifique los datos ingresados.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', color: '#f8fafc', py: 4, px: 2 }}>
      <Container maxWidth="xl">
        {/* Encabezado del Dashboard Owner */}
        <Paper
          elevation={4}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <AdminPanelSettingsIcon sx={{ fontSize: 45, color: '#38bdf8' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Panel Owner Super Admin
              </Typography>
              <Typography variant="subtitle2" color="#94a3b8">
                Gestión Multi-Tenancy de Clientes, Control de Alertas y Auditoría
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddBusinessIcon />}
              onClick={() => setOpenCreateModal(true)}
              sx={{
                bgcolor: '#38bdf8',
                color: '#0f172a',
                fontWeight: 'bold',
                px: 3,
                py: 1,
                borderRadius: 2,
                '&:hover': { bgcolor: '#0284c7', color: '#ffffff' },
              }}
            >
              + Crear Nuevo Cliente / Plantel
            </Button>
            <IconButton onClick={fetchDashboardData} sx={{ color: '#38bdf8' }}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={60} sx={{ color: '#38bdf8' }} />
          </Box>
        ) : (
          <>
            {/* Tarjetas KPI de Métricas Globales */}
            <Grid container spacing={3} mb={4}>
              {/* Card 1: Estudiantes Activos */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: '#1e293b',
                    border: '1px solid #334155',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" color="#94a3b8">
                      Estudiantes / Personal Activo
                    </Typography>
                    <PeopleIcon sx={{ color: '#38bdf8' }} />
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="#ffffff">
                    {metrics?.total_estudiantes_activos || 0}
                  </Typography>
                  <Typography variant="caption" color="#34d399">
                    Padrón Total Registrado
                  </Typography>
                </Paper>
              </Grid>

              {/* Card 2: Asistencias de Hoy */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: '#1e293b',
                    border: '1px solid #334155',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" color="#94a3b8">
                      Asistencias de Hoy
                    </Typography>
                    <HowToRegIcon sx={{ color: '#10b981' }} />
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="#ffffff">
                    {metrics?.asistencias_hoy_total || 0}
                  </Typography>
                  <Typography variant="caption" color="#94a3b8">
                    🟢 {metrics?.entradas_hoy || 0} Entradas | 🔴 {metrics?.salidas_hoy || 0} Salidas
                  </Typography>
                </Paper>
              </Grid>

              {/* Card 3: Tasa de Retardos */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: '#1e293b',
                    border: '1px solid #334155',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" color="#94a3b8">
                      Tasa de Retardos
                    </Typography>
                    <AccessTimeIcon sx={{ color: '#f59e0b' }} />
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="#f59e0b">
                    {metrics?.tasa_retardos_porcentaje || 0}%
                  </Typography>
                  <Typography variant="caption" color="#94a3b8">
                    Ingresos posteriores a 08:00 AM
                  </Typography>
                </Paper>
              </Grid>

              {/* Card 4: Clientes / Planteles Activos */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: '#1e293b',
                    border: '1px solid #334155',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" color="#94a3b8">
                      Clientes / Planteles
                    </Typography>
                    <BusinessIcon sx={{ color: '#a855f7' }} />
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="#a855f7">
                    {colegios.length}
                  </Typography>
                  <Typography variant="caption" color="#94a3b8">
                    Organizaciones Aisladas
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Tabla 1: Clientes Registrados */}
            <Paper
              elevation={4}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 3,
                bgcolor: '#1e293b',
                border: '1px solid #334155',
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={3} color="#ffffff">
                🏢 Clientes y Planteles Registrados (Multi-Tenancy & Control de Servicios)
              </Typography>

              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#0f172a' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Nombre del Cliente</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Tipo</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>RIF / Registro</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Padrón</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Alertas Telegram</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Estatus</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Fecha Registro</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }} align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {colegios.length > 0 ? (
                      colegios.map((col) => (
                        <TableRow key={col.id} sx={{ '&:hover': { bgcolor: '#334155' } }}>
                          <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>{col.nombre}</TableCell>
                          <TableCell sx={{ color: '#38bdf8' }}>
                            <Chip label={col.tipo_organizacion} size="small" color="secondary" />
                          </TableCell>
                          <TableCell sx={{ color: '#cbd5e1' }}>{col.rif_identificador || 'N/A'}</TableCell>
                          <TableCell sx={{ color: '#34d399', fontWeight: 'bold' }}>
                            {col.total_estudiantes} Registrados
                          </TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={col.notificaciones_activas !== false}
                                  onChange={() => handleToggleNotificaciones(col.id)}
                                  color="success"
                                  size="small"
                                />
                              }
                              label={
                                <Chip
                                  label={col.notificaciones_activas !== false ? 'ACTIVADAS' : 'PAUSADAS'}
                                  size="small"
                                  color={col.notificaciones_activas !== false ? 'success' : 'default'}
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={col.activo ? 'ACTIVO' : 'INACTIVO'}
                              size="small"
                              color={col.activo ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#94a3b8' }}>
                            {new Date(col.created_at).toLocaleDateString('es-ES')}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton onClick={() => handleDeleteColegio(col.id, col.nombre)} color="error" title="Eliminar Cliente">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ color: '#64748b', py: 4 }}>
                          No hay otros clientes creados. Utiliza el botón superior "+ Crear Nuevo Cliente"
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Tabla 2: Registro de Auditoría */}
            <Paper
              elevation={4}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: '#1e293b',
                border: '1px solid #334155',
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={3} color="#ffffff">
                📋 Registro de Auditoría y Logs del Sistema
              </Typography>

              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#0f172a' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Fecha / Hora</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Tipo Evento</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Estudiante / Sujeto</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Detalles / Resultado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLogs.length > 0 ? (
                      auditLogs.map((log) => (
                        <TableRow key={log.id} sx={{ '&:hover': { bgcolor: '#334155' } }}>
                          <TableCell sx={{ color: '#f8fafc' }}>
                            {new Date(log.created_at).toLocaleString('es-ES')}
                          </TableCell>
                          <TableCell sx={{ color: '#f8fafc' }}>
                            <Chip
                              label={log.tipo_evento}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#f8fafc', fontWeight: 'bold' }}>
                            {log.estudiante_nombre}
                          </TableCell>
                          <TableCell sx={{ color: '#94a3b8' }}>{log.detalles}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: '#64748b', py: 4 }}>
                          No hay registros de auditoría reciente
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}

        {/* Modal de Creación de Nuevo Cliente */}
        <Dialog
          open={openCreateModal}
          onClose={() => setOpenCreateModal(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#1e293b',
              color: '#ffffff',
              borderRadius: 3,
              border: '1px solid #334155',
            },
          }}
        >
          <form onSubmit={handleCreateClient}>
            <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid #334155' }}>
              🏢 Registrar Nuevo Cliente / Plantel / Empresa
            </DialogTitle>

            <DialogContent sx={{ py: 3 }}>
              {errorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMessage}
                </Alert>
              )}
              {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {successMessage}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Nombre de la Institución / Empresa"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="ej. Colegio San Agustín / Empresa ACME"
                    InputLabelProps={{ style: { color: '#94a3b8' } }}
                    InputProps={{ style: { color: '#ffffff' } }}
                    sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de Organización"
                    name="tipo_organizacion"
                    value={formData.tipo_organizacion}
                    onChange={handleInputChange}
                    InputLabelProps={{ style: { color: '#94a3b8' } }}
                    InputProps={{ style: { color: '#ffffff' } }}
                    sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } }}
                  >
                    <MenuItem value="COLEGIO">Colegio / Escuela</MenuItem>
                    <MenuItem value="UNIVERSIDAD">Universidad / Instituto</MenuItem>
                    <MenuItem value="EMPRESA">Empresa / Corporativo</MenuItem>
                    <MenuItem value="TRANSPORTE">Línea de Transporte</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="RIF / Registro Fiscal"
                    name="rif_identificador"
                    value={formData.rif_identificador}
                    onChange={handleInputChange}
                    placeholder="ej. J-12345678-0"
                    InputLabelProps={{ style: { color: '#94a3b8' } }}
                    InputProps={{ style: { color: '#ffffff' } }}
                    sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.notificaciones_activas}
                        onChange={handleInputChange}
                        name="notificaciones_activas"
                        color="success"
                      />
                    }
                    label={
                      <Typography variant="body2" color="#ffffff" fontWeight="bold">
                        Habilitar Notificaciones de Asistencia (Telegram / Alertas)
                      </Typography>
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="#38bdf8" mt={1} mb={1} fontWeight="bold">
                    🔑 Credenciales del Administrador del Plantel
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Usuario Administrador / Correo"
                    name="admin_email"
                    value={formData.admin_email}
                    onChange={handleInputChange}
                    placeholder="ej. admin_colegio o admin@colegio.com"
                    InputLabelProps={{ style: { color: '#94a3b8' } }}
                    InputProps={{ style: { color: '#ffffff' } }}
                    sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="password"
                    label="Contraseña Inicial"
                    name="admin_password"
                    value={formData.admin_password}
                    onChange={handleInputChange}
                    placeholder="******"
                    InputLabelProps={{ style: { color: '#94a3b8' } }}
                    InputProps={{ style: { color: '#ffffff' } }}
                    sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#475569' } }}
                  />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: '1px solid #334155' }}>
              <Button onClick={() => setOpenCreateModal(false)} sx={{ color: '#94a3b8' }}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{
                  bgcolor: '#38bdf8',
                  color: '#0f172a',
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#0284c7', color: '#ffffff' },
                }}
              >
                {submitting ? <CircularProgress size={24} /> : 'Guardar Cliente'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
};

export default OwnerDashboard;
