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
} from '@mui/material';
import PeopleIcon from '@mui/icons-[#10b981]' || '@mui/icons-material/People';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export const OwnerDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };

      const [resMetrics, resLogs] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/metrics`, authHeader),
        axios.get(`${API_BASE_URL}/dashboard/audit-logs`, authHeader),
      ]);

      setMetrics(resMetrics.data);
      setAuditLogs(resLogs.data);
    } catch (err) {
      console.error('Error cargando métricas de owner:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <AdminPanelSettingsIcon sx={{ fontSize: 45, color: '#38bdf8' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Panel Owner Super Admin
              </Typography>
              <Typography variant="subtitle2" color="#94a3b8">
                Métricas Globales de Rendimiento y Registro de Auditoría
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={fetchDashboardData} sx={{ color: '#38bdf8' }}>
            <RefreshIcon />
          </IconButton>
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
                      Estudiantes Activos
                    </Typography>
                    <PeopleIcon sx={{ color: '#38bdf8' }} />
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="#ffffff">
                    {metrics?.total_estudiantes_activos || 0}
                  </Typography>
                  <Typography variant="caption" color="#34d399">
                    Padrón Escolar Registrado
                  </Typography>
                </Paper>
              </Grid>

              {/* Card 2: Asistencias de Hoy (Entradas vs Salidas) */}
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

              {/* Card 4: Notificaciones Telegram */}
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
                      Mensajes Telegram
                    </Typography>
                    <SendIcon sx={{ color: '#06b6d4' }} />
                  </Box>
                  <Typography variant="h3" fontWeight="bold" color="#ffffff">
                    {metrics?.notificaciones_enviadas || 0}
                  </Typography>
                  <Typography variant="caption" color="#ef4444">
                    {metrics?.notificaciones_fallidas || 0} Fallidos
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Tabla de Registro de Auditoría */}
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
                Registro de Auditoría y Logs del Sistema
              </Typography>

              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#0f172a' }}>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Fecha / Hora</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Tipo Evento</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Estudiante</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Detalles / Resultado</TableCell>
                    </TableRow>
                  </Head>
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
      </Container>
    </Box>
  );
};

export default OwnerDashboard;
