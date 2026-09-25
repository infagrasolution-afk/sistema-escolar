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
  Slider,
  Switch,
  FormControlLabel,
  Chip,
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
    color_fondo: '#ffffff',
    fondo_opacidad: 0.20,
    mostrar_barra_encabezado: false,
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

            {/* Color de Fondo del Carnet */}
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" gap={0.8}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                  Color de Fondo del Carnet
                </Typography>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <TextField
                    size="small"
                    name="color_fondo"
                    value={config.color_fondo || '#ffffff'}
                    onChange={handleChange}
                    sx={{ flex: 1 }}
                  />
                  <input
                    type="color"
                    name="color_fondo"
                    value={config.color_fondo || '#ffffff'}
                    onChange={handleChange}
                    style={{ width: 40, height: 40, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                  />
                </Box>
                <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                  {[
                    { label: 'Blanco', color: '#ffffff' },
                    { label: 'Crema', color: '#fefce8' },
                    { label: 'Gris Suave', color: '#f8fafc' },
                    { label: 'Celeste', color: '#f0f9ff' },
                  ].map((preset) => (
                    <Chip
                      key={preset.color}
                      label={preset.label}
                      size="small"
                      onClick={() => setConfig((prev) => ({ ...prev, color_fondo: preset.color }))}
                      sx={{
                        fontSize: '0.68rem',
                        height: 22,
                        bgcolor: (config.color_fondo || '#ffffff').toLowerCase() === preset.color.toLowerCase() ? '#0284c7' : '#e2e8f0',
                        color: (config.color_fondo || '#ffffff').toLowerCase() === preset.color.toLowerCase() ? '#ffffff' : '#1e293b',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Estilo de Barra Superior */}
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" gap={0.8}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                  Estilo de Barra Superior
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(config.mostrar_barra_encabezado)}
                      onChange={(e) => setConfig((prev) => ({ ...prev, mostrar_barra_encabezado: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {config.mostrar_barra_encabezado ? 'Con Franja de Color' : 'Todo Blanco / Limpio (Sin barra)'}
                    </Typography>
                  }
                />
                <Typography variant="caption" color="text.secondary">
                  {config.mostrar_barra_encabezado ? 'Muestra franja de color en encabezado' : 'Encabezado blanco integrado (Recomendado)'}
                </Typography>
              </Box>
            </Grid>

            {/* Color Primario / Franja */}
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" gap={0.8}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                  {config.mostrar_barra_encabezado ? 'Color de Franja Superior' : 'Color de Acento Secundario'}
                </Typography>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <TextField
                    size="small"
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
                    style={{ width: 40, height: 40, padding: 0, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                  />
                </Box>
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
                    <i>La imagen se aplicará con transparencia (marca de agua) para que los textos, foto y códigos resalten.</i>
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

                  {/* Control de Transparencia si hay imagen de fondo */}
                  {config.fondo_url && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="body2" fontWeight="bold">
                            Transparencia / Opacidad de Imagen: {Math.round((config.fondo_opacidad ?? 0.20) * 100)}%
                          </Typography>
                          <Chip
                            label={(config.fondo_opacidad ?? 0.20) <= 0.3 ? 'Marca de Agua Óptima' : 'Opacidad Alta'}
                            color={(config.fondo_opacidad ?? 0.20) <= 0.3 ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                        <Slider
                          value={Math.round((config.fondo_opacidad ?? 0.20) * 100)}
                          min={5}
                          max={100}
                          step={5}
                          onChange={(e, val) => setConfig((prev) => ({ ...prev, fondo_opacidad: val / 100 }))}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Recomendado: 15% - 25% para que la imagen actúe como marca de agua transparente y resalte el carnet.
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Vista previa de miniatura con color y opacidad */}
                  {config.fondo_url && (
                    <Grid item xs={12} display="flex" flexDirection="column" alignItems="center" mt={1}>
                      <Typography variant="caption" color="text.secondary" mb={0.5}>
                        Vista Previa Miniatura (Fondo + Marca de Agua):
                      </Typography>
                      <Box
                        sx={{
                          width: config.orientacion_predeterminada === 'VERTICAL' ? 120 : 180,
                          height: config.orientacion_predeterminada === 'VERTICAL' ? 180 : 120,
                          bgcolor: config.color_fondo || '#ffffff',
                          border: '2px dashed #0284c7',
                          borderRadius: 2,
                          overflow: 'hidden',
                          position: 'relative',
                          boxShadow: 2,
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `url("${config.fondo_url}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: config.fondo_opacidad ?? 0.20,
                          }}
                        />
                      </Box>
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
