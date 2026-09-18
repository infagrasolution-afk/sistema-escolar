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
} from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

import API_BASE_URL from '../apiConfig';

export const UserManagement = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('OPERADOR_ESCANEO');
  const [activo, setActivo] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setUsuarios(response.data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setEmail('');
    setPassword('');
    setRol('OPERADOR_ESCANEO');
    setActivo(true);
    setErrorMsg(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEmail(user.email);
    setPassword('');
    setRol(user.rol);
    setActivo(user.activo);
    setErrorMsg(null);
    setOpenModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('access_token');
      const headers = { headers: { Authorization: `Bearer ${token}` } };

      if (selectedUser) {
        // Actualizar usuario
        await axios.put(
          `${API_BASE_URL}/usuarios/${selectedUser.id}`,
          { email, password: password || undefined, rol, activo },
          headers
        );
      } else {
        // Crear nuevo usuario
        await axios.post(
          `${API_BASE_URL}/usuarios`,
          { email, password, rol, activo },
          headers
        );
      }

      setOpenModal(false);
      fetchUsuarios();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Error al guardar los permisos del usuario');
    }
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
                Asigna el rol de Carnetización u Operaciones a los usuarios del sistema
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenCreate}
            sx={{ fontWeight: 'bold' }}
          >
            Nuevo Usuario
          </Button>
        </Paper>

        {/* Tabla de Usuarios */}
        <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#0f172a' }}>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Correo Electrónico</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Rol Asignado</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Permisos del Módulo</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: '#38bdf8' }} />
                    </TableCell>
                  </TableRow>
                ) : usuarios.map((user) => (
                  <TableRow key={user.id} sx={{ '&:hover': { bgcolor: '#334155' } }}>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>{user.email}</TableCell>
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
                        <Chip label="🚪 Escaneo de Garita" color="primary" size="small" variant="outlined" />
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
                      <IconButton onClick={() => handleOpenEdit(user)} sx={{ color: '#38bdf8' }}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Modal de Creación / Edición de Usuario */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handleSave}>
            <DialogTitle fontWeight="bold">
              {selectedUser ? 'Editar Permisos de Usuario' : 'Crear Nuevo Usuario'}
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
                <InputLabel>Rol / Permiso Principal</InputLabel>
                <Select value={rol} label="Rol / Permiso Principal" onChange={(e) => setRol(e.target.value)}>
                  <MenuItem value="OPERADOR_ESCANEO">OPERADOR_ESCANEO (Solo Garita / Kiosco)</MenuItem>
                  <MenuItem value="ADMIN_CARNET">ADMIN_CARNET (Módulo de Carnets Zebra ZXP 7)</MenuItem>
                  <MenuItem value="ADMIN_ACCESO">ADMIN_ACCESO (Administración General)</MenuItem>
                  <MenuItem value="SUPER_ADMIN">SUPER_ADMIN (Dueño del Sistema)</MenuItem>
                </Select>
              </FormControl>

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
