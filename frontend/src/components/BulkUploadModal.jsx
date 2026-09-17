import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import axios from 'axios';

import API_BASE_URL from '../apiConfig';

export const BulkUploadModal = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const apiBaseUrl = API_BASE_URL;

  const handleDownloadTemplate = () => {
    window.open(`${apiBaseUrl}/estudiantes/plantilla-descarga`, '_blank');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${apiBaseUrl}/estudiantes/carga-masiva`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setResult(response.data);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error en carga masiva:', err);
      setError(err.response?.data?.detail || 'Error procesando el archivo CSV.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight="bold">
        Carga Masiva de Datos para Carnetización
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" paragraph>
          Descargue la plantilla de carga masiva en formato CSV o Excel, llénela con los datos de sus estudiantes o socios y súbala aquí para procesar los carnets en línea.
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
          >
            Descargar Plantilla CSV
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            border: '2px dashed #94a3b8',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: '#f8fafc',
            cursor: 'pointer',
          }}
        >
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            id="bulk-file-input"
            style={{ display: 'none' }}
          />
          <label htmlFor="bulk-file-input" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
            <CloudUploadIcon sx={{ fontSize: 48, color: '#64748b', mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">
              {file ? file.name : 'Haga clic para seleccionar el archivo CSV / TXT'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Formato delimitado por comas o punto y coma (.csv)
            </Typography>
          </label>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              ¡Carga masiva completada! Total procesados: {result.total_procesados} (Creados: {result.creados}, Actualizados: {result.actualizados})
            </Alert>

            {result.errores && result.errores.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="error" fontWeight="bold">
                  Advertencias / Errores:
                </Typography>
                <List dense>
                  {result.errores.map((err, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={err} primaryTypographyProps={{ variant: 'caption', color: 'error' }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!file || uploading}
          startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
        >
          {uploading ? 'Procesando...' : 'Iniciar Carga Masiva'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkUploadModal;
