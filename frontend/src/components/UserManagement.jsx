import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  IconButton,
  Checkbox,
  FormGroup,
  Divider,
} from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

import API_BASE_URL from '../apiConfig';

const MODULE_OPTIONS = [
  { key: 'kiosco', label: '🚪 Kiosco de Garita / Escáner' },
  { key: 'carnets', label: '🪪 Carnetización PVC (Exclusivo Central)', superAdminOnly: true },
  { key: 'colegio_config', label: '🏢 Configuración Institucional' },
  { key: 'estudiantes', label: '🎓 Estudiantes / Personal y Fotos' },
  { key: 'representantes', label: '👨‍👩‍👧 Representantes y Telegram' },
  { key: 'usuarios', label: '👥 Gestión de Usuarios del Plantel' },
];

export const UserManagement = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [colegios, setColegios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('OPERADOR_ESCANEO');
  const [colegioId, setColegioId] = useState('');
  const [modulosPermitidos, setModulosPermitidos] = useState(['kiosco']);
  const [activo, setActivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const currentUserRole = localStorage.getItem('user_role') || '';
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  const fetchUsuariosAndColegios = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      const [resUsers, resColegios] = await Promise.all([
        axios.get(`${API_BASE_URL}/usuarios`, headers),
        isSuperAdmin
          ? axios.get(`${API_BASE_URL}/colegios`, headers).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);

      setUsuarios(resUsers.data || []);
      setColegios(resColegios.data || []);
    } catch (err) {
      console.error('Error cargando usuarios/colegios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuariosAndColegios();
  }, []);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setEmail('');
    setPassword('');
    setRol('OPERADOR_ESCANEO');
    setColegioId('');
    setModulosPermitidos(['kiosco']);
    setActivo(true);
    setErrorMsg(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEmail(user.email);
    setPassword('');
    setRol(user.rol);
    setColegioId(user.colegio_id || '');
    setModulosPermitidos(user.modulos_permitidos || []);
    setActivo(user.activo);
    setErrorMsg(null);
    setOpenModal(true);
  };

  const handleModuleToggle = (moduleKey) => {
    setModulosPermitidos((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((k) => k !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('access_token');
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        email,
        password: password || undefined,
        rol,
        colegio_id: colegioId || null,
        modulos_permitidos: modulosPermitidos,
        activo,
      };

      if (selectedUser) {
        await axios.put(`${API_BASE_URL}/usuarios/${selectedUser.id}`, payload, headers);
      } else {
        await axios.post(`${API_BASE_URL}/usuarios`, payload, headers);
      }

      setOpenModal(false);
      fetchUsuariosAndColegios();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Error al guardar los datos del usuario');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar permanentemente el usuario "${userEmail}"?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/usuarios/${userId}?hard_delete=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsuariosAndColegios();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar el usuario');
    }
  };

  const getColegioNombre = (cId) => {
    if (!cId) return 'Global / Sin Empresa';
    const match = colegios.find((c) => c.id === cId);
    return match ? match.nombre : 'Empresa Asignada';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', color: '#f8fafc', py: 4, px: 2 }}>
      <Container maxWidth="lg">
        {/* Encabezado */}
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
            <ManageAccountsIcon sx={{ fontSize: 45, color: '#38bdf8' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Gestión de Usuarios y Permisos
              </Typography>
              <Typography variant="subtitle2" color="#94a3b8">
                Asigna la Empresa y activa/desactiva los Módulos Permitidos para cada usuario
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={1}>
            <IconButton onClick={fetchUsuariosAndColegios} sx={{ color: '#38bdf8' }}>
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenCreate}
              sx={{ fontWeight: 'bold' }}
            >
              Nuevo Usuario
            </Button>
          </Box>
        </Paper>

        {/* Tabla de Usuarios */}
        <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#0f172a' }}>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Usuario / Email</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Empresa / Plantel</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Rol</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Módulos Permitidos</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: '#38bdf8' }} />
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((user) => (
                    <TableRow key={user.id} sx={{ '&:hover': { bgcolor: '#334155' } }}>
                      <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>{user.email}</TableCell>
                      <TableCell sx={{ color: '#38bdf8', fontWeight: 'bold' }}>
                        {getColegioNombre(user.colegio_id)}
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>
                        <Chip
                          label={user.rol}
                          color={
                            user.rol === 'SUPER_ADMIN'
                              ? 'error'
                              : user.rol === 'ADMIN_CARNET'
                              ? 'secondary'
                              : 'primary'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>
                        {user.rol === 'SUPER_ADMIN' ? (
                          <Chip label="Acceso Total Owner" color="error" size="small" variant="outlined" />
                        ) : user.rol === 'ADMIN_CARNET' ? (
                          <Chip label="🪪 Impresión Carnets Zebra ZXP 7" color="secondary" size="small" variant="outlined" />
                        ) : (
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {(user.modulos_permitidos || []).map((m) => (
                              <Chip key={m} label={m} size="small" color="primary" variant="outlined" />
                            ))}
                            {(!user.modulos_permitidos || user.modulos_permitidos.length === 0) && (
                              <Typography variant="caption" color="#64748b">Sin módulos asignados</Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff' }}>
                        <Chip
                          label={user.activo ? 'Activo' : 'Inactivo'}
                          color={user.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleOpenEdit(user)} sx={{ color: '#38bdf8' }} title="Editar Usuario">
                          <EditIcon />
                        </IconButton>
                        {user.rol !== 'SUPER_ADMIN' && (
                          <IconButton onClick={() => handleDeleteUser(user.id, user.email)} color="error" title="Eliminar Usuario">
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Modal de Creación / Edición de Usuario */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSave}>
            <DialogTitle fontWeight="bold">
              {selectedUser ? 'Editar Permisos y Módulos de Usuario' : 'Crear Nuevo Usuario'}
            </DialogTitle>

            <DialogContent dividers>
              {errorMsg && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMsg}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Usuario / Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label={selectedUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required={!selectedUser}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Rol Principal</InputLabel>
                <Select value={rol} label="Rol Principal" onChange={(e) => setRol(e.target.value)}>
                  <MenuItem value="OPERADOR_ESCANEO">OPERADOR_ESCANEO (Solo Garita / Kiosco)</MenuItem>
                  <MenuItem value="OPERADOR_IMPRESION">OPERADOR_IMPRESION (Solo Impresión Carnets)</MenuItem>
                  <MenuItem value="ADMIN_ACCESO">ADMIN_ACCESO (Administrador de la Empresa / Plantel)</MenuItem>
                  {isSuperAdmin && (
                    <MenuItem value="ADMIN_CARNET">ADMIN_CARNET (Administrador Exclusivo de Carnetización)</MenuItem>
                  )}
                  {isSuperAdmin && (
                    <MenuItem value="SUPER_ADMIN">SUPER_ADMIN (Dueño del Sistema)</MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* Selector de Empresa para Super Admin */}
              {isSuperAdmin && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Empresa / Plantel Asignado</InputLabel>
                  <Select
                    value={colegioId}
                    label="Empresa / Plantel Asignado"
                    onChange={(e) => setColegioId(e.target.value)}
                  >
                    <MenuItem value="">Global / Sin Empresa Específica</MenuItem>
                    {colegios.map((col) => (
                      <MenuItem key={col.id} value={col.id}>
                        {col.nombre} ({col.tipo_organizacion})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="primary" fontWeight="bold" mb={1}>
                🧩 Módulos Permitidos para este Usuario:
              </Typography>

              <FormGroup>
                {MODULE_OPTIONS.map((opt) => {
                  if (opt.superAdminOnly && !isSuperAdmin) return null;
                  const isChecked = modulosPermitidos.includes(opt.key);
                  return (
                    <FormControlLabel
                      key={opt.key}
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={() => handleModuleToggle(opt.key)}
                          color="primary"
                        />
                      }
                      label={opt.label}
                    />
                  );
                })}
              </FormGroup>

              <FormControlLabel
                control={
                  <Switch checked={activo} onChange={(e) => setActivo(e.target.checked)} color="success" />
                }
                label={activo ? 'Cuenta Activa' : 'Cuenta Inactiva'}
                sx={{ mt: 2 }}
              />
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenModal(false)} color="inherit">
                Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Guardar Permisos
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
};

export default UserManagement;
