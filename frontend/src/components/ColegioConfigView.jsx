import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import PaletteIcon from '@mui/icons-material/Palette';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

import API_BASE_URL from '../apiConfig';

export const ColegioConfigView = () => {
  const [config, setConfig] = useState({
    nombre_institucion: '',
    tipo_organizacion: 'COLEGIO',
    subtitulo_carnet: '',
    ano_escolar: '',
    color_primario: '#1e3a8a',
    color_secundario: '#000000',
    orientacion_predeterminada: 'VERTICAL',
    tipo_codigo: 'QR',
    poliza_seguro: '',
    fondo_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const apiBaseUrl = API_BASE_URL;

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/colegio/config`);
      if (response.data) {
        setConfig(response.data);
      }
    } catch (err) {
      console.error('Error al cargar la configuración de la institución:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleFondoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig((prev) => ({ ...prev, fondo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFondo = () => {
    setConfig((prev) => ({ ...prev, fondo_url: '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(`${apiBaseUrl}/colegio/config`, config, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({
        open: true,
        message: '¡Configuración institucional guardada exitosamente!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      setSnackbar({
        open: true,
        message: 'Error al guardar datos. Verifique sus permisos de administrador.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <BusinessIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold" color="primary">
            Configuración de la Institución / Organización
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Aquí se parametriza la información institucional, membretes, plantilla, imagen de fondo y paleta de colores del carnet.
        </Alert>

        <form onSubmit={handleSave}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nombre de la Institución / Colegio / Cooperativa"
                name="nombre_institucion"
                value={config.nombre_institucion}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Organización</InputLabel>
                <Select
                  name="tipo_organizacion"
                  value={config.tipo_organizacion}
                  onChange={handleChange}
                  label="Tipo de Organización"
                >
                  <MenuItem value="COLEGIO">Colegio / Escuela (Estudiantil)</MenuItem>
                  <MenuItem value="COOPERATIVA_TRANSPORTE">Línea / Cooperativa de Transporte</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subtítulo en Carnet"
                name="subtitulo_carnet"
                value={config.subtitulo_carnet}
                onChange={handleChange}
                placeholder="ej. CARNET DE IDENTIFICACIÓN ESCOLAR"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Año Escolar / Período Vigente"
                name="ano_escolar"
                value={config.ano_escolar}
                onChange={handleChange}
                placeholder="ej. 2025-2026"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider align="left">
                <Typography variant="subtitle2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                  <PaletteIcon fontSize="small" /> Diseño y Orientación Predeterminada
                </Typography>
              </Divider>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" gap={2}>
                <TextField
                  label="Color Primario (Encabezado)"
                  name="color_primario"
                  value={config.color_primario}
                  onChange={handleChange}
                  sx={{ flex: 1 }}
                />
                <input
                  type="color"
                  name="color_primario"
                  value={config.color_primario || '#1e8a6f'}
                  onChange={handleChange}
                  style={{ width: 44, height: 44, padding: 0, border: 'none', cursor: 'pointer' }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Orientación Predeterminada</InputLabel>
                <Select
                  name="orientacion_predeterminada"
                  value={config.orientacion_predeterminada}
                  onChange={handleChange}
                  label="Orientación Predeterminada"
                >
                  <MenuItem value="HORIZONTAL">Horizontal (85.6mm x 54mm)</MenuItem>
                  <MenuItem value="VERTICAL">Vertical (54mm x 85.6mm)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Código de Lectura</InputLabel>
                <Select
                  name="tipo_codigo"
                  value={config.tipo_codigo || 'AMBOS'}
                  onChange={handleChange}
                  label="Tipo de Código de Lectura"
                >
                  <MenuItem value="AMBOS">Ambos (Código de Barras + QR)</MenuItem>
                  <MenuItem value="BARRA">Solo Código de Barras (Code 128)</MenuItem>
                  <MenuItem value="QR">Solo Código QR</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* SECCIÓN IMAGEN DE FONDO PERSONALIZADA DEL CARNET */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f8fafc', borderColor: '#cbd5e1' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <ImageIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    Imagen de Fondo Personalizada para Carnets PVC
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    📐 Dimensiones Sugeridas para Estándar Zebra ZXP 7 (CR-80 a 300 DPI):
                  </Typography>
                  <Typography variant="body2">
                    • <b>Vertical:</b> <code>638 × 1013 píxeles</code> (Relación de Aspecto 2:3)<br />
                    • <b>Horizontal:</b> <code>1013 × 638 píxeles</code> (Relación de Aspecto 3:2)<br />
                    <i>Formato recomendado: PNG o JPG de alta calidad con marcas o diseño institucional.</i>
                  </Typography>
                </Alert>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="URL de Imagen de Fondo o Archivo Cargado"
                      name="fondo_url"
                      value={config.fondo_url || ''}
                      onChange={handleChange}
                      placeholder="https://servidor.com/fondo_carnet.png o subir archivo"
                      helperText="Puedes pegar el enlace directo de la imagen o presionar el botón de subir"
                    />
                  </Grid>

                  <Grid item xs={12} sm={4} display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadFileIcon />}
                      fullWidth
                    >
                      Subir Imagen
                      <input type="file" accept="image/*" hidden onChange={handleFondoUpload} />
                    </Button>

                    {config.fondo_url && (
                      <IconButton color="error" onClick={handleRemoveFondo} title="Eliminar Imagen de Fondo">
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Grid>

                  {/* Vista previa de miniatura si existe fondo */}
                  {config.fondo_url && (
                    <Grid item xs={12} display="flex" justifyContent="center" mt={1}>
                      <Box
                        sx={{
                          width: config.orientacion_predeterminada === 'VERTICAL' ? 120 : 180,
                          height: config.orientacion_predeterminada === 'VERTICAL' ? 180 : 120,
                          border: '2px dashed #0284c7',
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundImage: `url("${config.fondo_url}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          boxShadow: 2,
                        }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Póliza de Seguro / Emergencias (Texto Reverso)"
                name="poliza_seguro"
                value={config.poliza_seguro}
                onChange={handleChange}
                placeholder="ej. APES - 002001-38 - Oceánica de Seguros"
              />
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="flex-end" mt={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                disabled={loading}
                sx={{ px: 4, fontWeight: 'bold' }}
              >
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ColegioConfigView;
