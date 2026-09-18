import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SchoolIcon from '@mui/icons-material/School';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import API_BASE_URL from '../apiConfig';

export const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);

      // Obtener información del usuario autenticado
      const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const user = userRes.data;
      localStorage.setItem('user_role', user.rol);
      localStorage.setItem('user_email', user.email);
      if (user.modulos_permitidos) {
        localStorage.setItem('modulos_permitidos', JSON.stringify(user.modulos_permitidos));
      } else {
        localStorage.removeItem('modulos_permitidos');
      }

      // Redirigir según el rol y módulos permitidos del usuario
      const mods = user.modulos_permitidos || [];
      if (user.rol === 'SUPER_ADMIN') {
        navigate('/admin/dashboard');
      } else if (mods.length > 0) {
        if (mods.includes('carnets')) navigate('/carnets');
        else if (mods.includes('kiosco')) navigate('/kiosco');
        else if (mods.includes('estudiantes')) navigate('/estudiantes');
        else if (mods.includes('colegio') || mods.includes('colegio_config')) navigate('/colegio/config');
        else if (mods.includes('representantes')) navigate('/representantes');
        else if (mods.includes('usuarios')) navigate('/usuarios');
        else navigate('/estudiantes');
      } else if (user.rol === 'ADMIN_CARNET' || user.rol === 'OPERADOR_IMPRESION') {
        navigate('/carnets');
      } else if (user.rol === 'OPERADOR_ESCANEO' || user.rol === 'ADMIN_ACCESO') {
        navigate('/kiosco');
      } else {
        navigate('/estudiantes');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = 'Credenciales inválidas o error de servidor';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: '#1e293b',
            color: '#ffffff',
            border: '1px solid #334155',
            textAlign: 'center',
          }}
        >
          <Box display="flex" justifyContent="center" mb={1}>
            <SchoolIcon sx={{ fontSize: 50, color: '#38bdf8' }} />
          </Box>

          <Typography variant="h5" fontWeight="bold" mb={0.5}>
            Sistema Escolar
          </Typography>

          <Typography variant="body2" color="#94a3b8" mb={3}>
            Ingrese sus credenciales de acceso
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, bgcolor: '#7f1d1d', color: '#fef2f2' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Usuario / Correo Electrónico"
              type="text"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              sx={{
                input: { color: '#ffffff' },
                label: { color: '#94a3b8' },
                fieldset: { borderColor: '#475569' },
                '&:hover fieldset': { borderColor: '#38bdf8' },
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              sx={{
                input: { color: '#ffffff' },
                label: { color: '#94a3b8' },
                fieldset: { borderColor: '#475569' },
                '&:hover fieldset': { borderColor: '#38bdf8' },
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockOutlinedIcon />}
              sx={{
                mt: 3,
                mb: 1,
                py: 1.5,
                bgcolor: '#0284c7',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#0369a1' },
              }}
            >
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginView;
