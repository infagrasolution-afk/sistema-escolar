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
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import BulkUploadModal from './BulkUploadModal';

import API_BASE_URL from '../apiConfig';

export const StudentManagement = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openBulkModal, setOpenBulkModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form State
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [gradoSeccion, setGradoSeccion] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [rfidUid, setRfidUid] = useState('');
  const [codigoOpaco, setCodigoOpaco] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const navigate = useNavigate();

  const fetchEstudiantes = async (searchTerm = '') => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/estudiantes`, {
        params: { search: searchTerm },
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setEstudiantes(response.data);
    } catch (err) {
      console.error('Error cargando estudiantes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstudiantes(search);
  }, [search]);

  const handleOpenCreate = () => {
    setSelectedStudent(null);
    setNombres('');
    setApellidos('');
    setGradoSeccion('');
    setFotoUrl('');
    setRfidUid('');
    setCodigoOpaco('');
    setErrorMsg(null);
    setOpenModal(true);
  };


  const handleOpenEdit = (est) => {
    setSelectedStudent(est);
    setNombres(est.nombres);
    setApellidos(est.apellidos);
    setGradoSeccion(est.grado_seccion);
    setFotoUrl(est.foto_url || '');
    setRfidUid(est.rfid_uid || '');
    setCodigoOpaco(est.codigo_opaco);
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
        grado_seccion: gradoSeccion,
        foto_url: fotoUrl || null,
        rfid_uid: rfidUid || null,
        codigo_opaco: codigoOpaco || undefined,
      };

      if (selectedStudent) {
        await axios.put(`${API_BASE_URL}/estudiantes/${selectedStudent.id}`, payload, headers);
      } else {
        await axios.post(`${API_BASE_URL}/estudiantes`, payload, headers);
      }

      setOpenModal(false);
      fetchEstudiantes(search);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Error al guardar el estudiante');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este estudiante del sistema?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/estudiantes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      fetchEstudiantes(search);
    } catch (err) {
      alert('Error al eliminar estudiante');
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
            <SchoolIcon sx={{ fontSize: 45, color: '#38bdf8' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Administración de Estudiantes
              </Typography>
              <Typography variant="subtitle2" color="#94a3b8">
                Registro del Padrón Escolar, Carnetización y Tarjetas RFID
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              color="info"
              onClick={() => setOpenBulkModal(true)}
              sx={{ fontWeight: 'bold' }}
            >
              Carga Masiva (CSV)
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenCreate}
              sx={{ fontWeight: 'bold' }}
            >
              Nuevo Estudiante
            </Button>
          </Box>
        </Paper>

        {/* Buscador */}
        <Paper elevation={4} sx={{ p: 2, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombres, apellidos, código opaco, RFID o grado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
            sx={{ input: { color: '#ffffff' }, fieldset: { borderColor: '#475569' } }}
          />
        </Paper>

        {/* Tabla de Estudiantes */}
        <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#0f172a' }}>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Foto</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Estudiante</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Grado / Sección</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Código Opaco (QR)</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Tarjeta RFID</TableCell>
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
                ) : estudiantes.map((est) => (
                  <TableRow key={est.id} sx={{ '&:hover': { bgcolor: '#334155' } }}>
                    <TableCell>
                      <Avatar src={est.foto_url} alt={est.nombres}>
                        {est.nombres[0]}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                      {est.nombres} {est.apellidos}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>{est.grado_seccion}</TableCell>
                    <TableCell sx={{ color: '#38bdf8', fontFamily: 'monospace' }}>{est.codigo_opaco}</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                      {est.rfid_uid || 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => navigate('/carnets')} sx={{ color: '#10b981' }} title="Ver Carnet Zebra">
                        <PrintIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpenEdit(est)} sx={{ color: '#38bdf8' }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(est.id)} sx={{ color: '#ef4444' }}>
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
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSave}>
            <DialogTitle fontWeight="bold">
              {selectedStudent ? 'Editar Estudiante' : 'Registrar Nuevo Estudiante'}
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
                label="Grado y Sección (Ej: 5to Grado A)"
                value={gradoSeccion}
                onChange={(e) => setGradoSeccion(e.target.value)}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label="URL de Foto de Perfil"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                margin="normal"
                placeholder="https://..."
              />

              <TextField
                fullWidth
                label="Código Opaco (Dejar en blanco para autogenerar)"
                value={codigoOpaco}
                onChange={(e) => setCodigoOpaco(e.target.value)}
                margin="normal"
              />

              <TextField
                fullWidth
                label="UID Tarjeta RFID USB (Opcional)"
                value={rfidUid}
                onChange={(e) => setRfidUid(e.target.value)}
                margin="normal"
              />
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenModal(false)} color="inherit">
                Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Guardar Estudiante
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <BulkUploadModal
          open={openBulkModal}
          onClose={() => setOpenBulkModal(false)}
          onSuccess={() => fetchEstudiantes(search)}
        />
      </Container>
    </Box>
  );
};


export default StudentManagement;
