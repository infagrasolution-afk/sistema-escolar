import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export const RepresentativeManagement = () => {
  const [representantes, setRepresentantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [selectedRep, setSelectedRep] = useState(null);

  // Form State
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchRepresentantes = async (searchTerm = '') => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/representantes`, {
        params: { search: searchTerm },
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setRepresentantes(response.data);
    } catch (err) {
      console.error('Error cargando representantes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepresentantes(search);
  }, [search]);

  const handleOpenCreate = () => {
    setSelectedRep(null);
    setNombres('');
    setApellidos('');
    setTelefono('');
    setTelegramChatId('');
    setErrorMsg(null);
    setOpenModal(true);
  };

  const handleOpenEdit = (rep) => {
    setSelectedRep(rep);
    setNombres(rep.nombres);
    setApellidos(rep.apellidos);
    setTelefono(rep.telefono || '');
    setTelegramChatId(rep.telegram_chat_id ? String(rep.telegram_chat_id) : '');
    setErrorMsg(null);
    setOpenModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('access_token');
      const headers = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        nombres,
        apellidos,
        telefono: telefono || null,
        telegram_chat_id: telegramChatId ? parseInt(telegramChatId, 10) : null,
      };

      if (selectedRep) {
        await axios.put(`${API_BASE_URL}/representantes/${selectedRep.id}`, payload, headers);
      } else {
        await axios.post(`${API_BASE_URL}/representantes`, payload, headers);
      }

      setOpenModal(false);
      fetchRepresentantes(search);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Error al guardar el representante');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este representante del sistema?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/representantes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      fetchRepresentantes(search);
    } catch (err) {
      alert('Error al eliminar representante');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0f172a', color: '#f8fafc', py: 4, px: 2 }}>
      <Container maxWidth="xl">
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
            <FamilyRestroomIcon sx={{ fontSize: 45, color: '#38bdf8' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Administración de Representantes
              </Typography>
              <Typography variant="subtitle2" color="#94a3b8">
                Gestión de Padres de Familia y Vinculación de Bot de Telegram
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
            Nuevo Representante
          </Button>
        </Paper>

        {/* Buscador */}
        <Paper elevation={4} sx={{ p: 2, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombres, apellidos o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ input: { color: '#ffffff' }, fieldset: { borderColor: '#475569' } }}
          />
        </Paper>

        {/* Tabla de Representantes */}
        <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#0f172a' }}>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Representante</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Teléfono</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Telegram Bot Status</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: '#38bdf8' }} />
                    </TableCell>
                  </TableRow>
                ) : representantes.map((rep) => (
                  <TableRow key={rep.id} sx={{ '&:hover': { bgcolor: '#334155' } }}>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                      {rep.nombres} {rep.apellidos}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>{rep.telefono || 'Sin teléfono'}</TableCell>
                    <TableCell>
                      {rep.telegram_chat_id ? (
                        <Chip label={`VINCULADO (Chat ID: ${rep.telegram_chat_id})`} color="success" size="small" />
                      ) : (
                        <Chip label="NO VINCULADO" color="warning" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenEdit(rep)} sx={{ color: '#38bdf8' }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(rep.id)} sx={{ color: '#ef4444' }}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Modal de Creación / Edición */}
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth>
          <form onSubmit={handleSave}>
            <DialogTitle fontWeight="bold">
              {selectedRep ? 'Editar Representante' : 'Registrar Nuevo Representante'}
            </DialogTitle>

            <DialogContent dividers>
              {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

              <TextField
                fullWidth
                label="Nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label="Apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label="Teléfono de Contacto"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                margin="normal"
              />

              <TextField
                fullWidth
                label="Telegram Chat ID (Opcional)"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                margin="normal"
              />
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenModal(false)} color="inherit">
                Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Guardar Representante
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
};

export default RepresentativeManagement;
