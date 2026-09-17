import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Chip,
  Grid,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  TextField,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import VideocamIcon from '@mui/icons-material/Videocam';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import axios from 'axios';

import useBarcodeScanner from '../hooks/useBarcodeScanner';
import ContingencyCamera from './ContingencyCamera';

import API_BASE_URL from '../apiConfig';

export const KioskScanner = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { success: bool, data: obj, error: str }
  const [showCamera, setShowCamera] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Actualizador de reloj digital en vivo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Función para simular audio de retroalimentación
  const playFeedbackSound = (isSuccess) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (isSuccess) {
        // Tono agudo de éxito
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else {
        // Tono grave de error
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.log('Audio Context error or blocked:', e);
    }
  };

  // Handler de procesamiento de escaneo
  const handleScanCode = useCallback(async (code) => {
    if (!code || loading) return;

    setLoading(true);
    setScanResult(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/asistencia/scan`,
        { codigo: code },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const data = response.data;
      setScanResult({
        success: true,
        data: data,
      });
      playFeedbackSound(true);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail || 'Error al procesar el código en el sistema';
      setScanResult({
        success: false,
        error: errorMsg,
        code: code,
      });
      playFeedbackSound(false);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Hook global de captura de escáner USB HID
  useBarcodeScanner({
    onScan: handleScanCode,
    timeThreshold: 50,
    minLength: 3,
    enabled: !showCamera,
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0f172a',
        color: '#f8fafc',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="lg">
        {/* Encabezado del Kiosco / Garita */}
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
            <SchoolIcon sx={{ fontSize: 40, color: '#38bdf8' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Kiosco de Garita Escolar
              </Typography>

              <Typography variant="subtitle2" color="#94a3b8">
                Control de Asistencia por Escaneo Rápido (RFID / QR / Código de Barras)
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1} bgcolor="#1e293b" px={3} py={1} borderRadius={2}>
            <AccessTimeIcon sx={{ color: '#38bdf8' }} />
            <Typography variant="h6" fontWeight="mono" color="#38bdf8">
              {currentTime.toLocaleTimeString('es-ES')}
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={4}>
          {/* Columna Izquierda: Visor del Escáner y Estado */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={4}
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: '#1e293b',
                border: '1px solid #334155',
                textAlign: 'center',
                minHeight: '420px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {loading ? (
                <Box py={6}>
                  <CircularProgress size={70} sx={{ color: '#38bdf8' }} />
                  <Typography variant="h6" mt={3} color="#94a3b8">
                    Procesando registro en sub-50ms...
                  </Typography>
                </Box>
              ) : showCamera ? (
                <ContingencyCamera
                  onScanSuccess={(code) => {
                    setShowCamera(false);
                    handleScanCode(code);
                  }}
                  onClose={() => setShowCamera(false)}
                />
              ) : (
                <>
                  <QrCodeScannerIcon sx={{ fontSize: 100, color: '#38bdf8', mb: 2 }} />
                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    Escanee su Carnet
                  </Typography>

                  <Typography variant="body1" color="#94a3b8" mb={3}>
                    Acerque el código QR, Código de Barras o Lector RFID USB a la garita
                  </Typography>

                  <Box display="flex" gap={2} mt={2}>
                    <Button
                      variant="outlined"
                      startIcon={<VideocamIcon />}
                      onClick={() => setShowCamera(true)}
                      sx={{
                        borderColor: '#38bdf8',
                        color: '#38bdf8',
                        '&:hover': { borderColor: '#7dd3fc', bgcolor: 'rgba(56,189,248,0.1)' },
                      }}
                    >
                      Usar Cámara de Contingencia
                    </Button>
                  </Box>
                </>
              )}
            </Paper>

            {/* Formulario Manual de Prueba */}
            <Paper sx={{ p: 2, mt: 2, bgcolor: '#1e293b', border: '1px solid #334155' }}>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Probar código manualmente (Ej: COD123456)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleScanCode(manualCode);
                      setManualCode('');
                    }
                  }}
                  sx={{ input: { color: 'white' }, fieldset: { borderColor: '#475569' } }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    handleScanCode(manualCode);
                    setManualCode('');
                  }}
                >
                  Enviar
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Columna Derecha: Banner Gigante de Respuesta / Datos del Estudiante */}
          <Grid item xs={12} md={5}>
            {scanResult ? (
              <Paper
                elevation={6}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  bgcolor: scanResult.success ? '#064e3b' : '#7f1d1d',
                  border: `2px solid ${scanResult.success ? '#10b981' : '#ef4444'}`,
                  textAlign: 'center',
                }}
              >
                {scanResult.success ? (
                  <>
                    <CheckCircleOutlineIcon sx={{ fontSize: 90, color: '#34d399', mb: 1 }} />
                    <Typography variant="h3" fontWeight="bold" color="#ecfdf5" mb={1}>
                      {scanResult.data.evento}
                    </Typography>

                    <Chip
                      label={scanResult.data.estado}
                      color={scanResult.data.estado === 'PUNTUAL' ? 'success' : 'warning'}
                      sx={{ fontSize: '1rem', px: 2, py: 2.5, fontWeight: 'bold', mb: 3 }}
                    />

                    {/* Foto y Datos del Estudiante */}
                    <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                      <Avatar
                        src={scanResult.data.foto_url}
                        alt={scanResult.data.nombres}
                        sx={{ width: 120, height: 120, mb: 2, border: '4px solid #10b981' }}
                      >
                        {scanResult.data.nombres?.[0]}
                      </Avatar>

                      <Typography variant="h5" fontWeight="bold" color="#ffffff">
                        {scanResult.data.nombres} {scanResult.data.apellidos}
                      </Typography>

                      <Typography variant="h6" color="#a7f3d0">
                        {scanResult.data.grado_seccion}
                      </Typography>
                    </Box>

                    <Alert severity="success" variant="filled" sx={{ bgcolor: '#047857' }}>
                      {scanResult.data.mensaje}
                    </Alert>
                  </>
                ) : (
                  <>
                    <ErrorOutlineIcon sx={{ fontSize: 90, color: '#fca5a5', mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color="#fef2f2" mb={2}>
                      Acceso Denegado
                    </Typography>

                    <Alert severity="error" variant="filled" sx={{ bgcolor: '#b91c1c', fontSize: '1.1rem' }}>
                      {scanResult.error}
                    </Alert>

                    <Typography variant="body2" color="#fca5a5" mt={2}>
                      Código escaneado: {scanResult.code}
                    </Typography>
                  </>
                )}
              </Paper>
            ) : (
              <Paper
                elevation={4}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  bgcolor: '#1e293b',
                  border: '1px dashed #475569',
                  textAlign: 'center',
                  minHeight: '420px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" color="#64748b">
                  Esperando lectura de carnet...
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default KioskScanner;
