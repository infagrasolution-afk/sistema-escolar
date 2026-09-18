import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  ListItemIcon,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import axios from 'axios';

import API_BASE_URL from '../apiConfig';

export const BatchPrintModal = ({ open, onClose, estudiantes = [] }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  const handleToggle = (id) => () => {
    const currentIndex = selectedIds.indexOf(id);
    const newChecked = [...selectedIds];

    if (currentIndex === -1) {
      newChecked.push(id);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setSelectedIds(newChecked);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === estudiantes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(estudiantes.map((e) => e.id));
    }
  };

  const handleExportBatchPdf = async () => {
    if (selectedIds.length === 0) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/carnets/pdf/batch`,
        { estudiante_ids: selectedIds },
        {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
          },
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lote_carnets_zebra_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exportando PDF por lotes:', err);
      alert('Error al generar el archivo PDF masivo.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1e293b',
          color: '#ffffff',
          borderRadius: 3,
          border: '1px solid #334155',
        },
      }}
    >
      <DialogTitle display="flex" justifyContent="space-between" alignItems="center" sx={{ borderBottom: '1px solid #334155', pb: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <PrintIcon sx={{ color: '#38bdf8' }} />
          <Typography variant="h6" fontWeight="bold">
            Cola de Impresión por Lotes Zebra ZXP 7
          </Typography>
        </Box>
        <Chip
          label={`${selectedIds.length} / ${estudiantes.length} Seleccionados`}
          color={selectedIds.length > 0 ? 'primary' : 'default'}
          sx={{ fontWeight: 'bold' }}
        />
      </DialogTitle>

      <DialogContent sx={{ py: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="caption" color="#94a3b8">
            Marque los carnets que enviará al controlador de impresión en formato CR-80.
          </Typography>
          <Button size="small" onClick={handleSelectAll} sx={{ color: '#38bdf8', fontWeight: 'bold' }}>
            {selectedIds.length === estudiantes.length
              ? 'Deseleccionar Todos'
              : 'Seleccionar Todos'}
          </Button>
        </Box>

        <List sx={{ maxHeight: 320, overflow: 'auto', bgcolor: '#0f172a', borderRadius: 2, p: 1, border: '1px solid #334155' }}>
          {estudiantes.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="#94a3b8">
                No hay estudiantes registrados para imprimir.
              </Typography>
            </Box>
          ) : (
            estudiantes.map((estudiante) => {
              const labelId = `checkbox-list-label-${estudiante.id}`;
              const isChecked = selectedIds.indexOf(estudiante.id) !== -1;
              return (
                <ListItem
                  key={estudiante.id}
                  button
                  onClick={handleToggle(estudiante.id)}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    bgcolor: isChecked ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                    border: isChecked ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                    '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.15)' },
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={isChecked}
                      tabIndex={-1}
                      disableRipple
                      sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#38bdf8' } }}
                      inputProps={{ 'aria-labelledby': labelId }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    id={labelId}
                    primary={`${estudiante.nombres} ${estudiante.apellidos}`}
                    primaryTypographyProps={{ fontWeight: 'bold', color: '#ffffff' }}
                    secondary={`${estudiante.grado_seccion} | ID: ${estudiante.codigo_opaco}`}
                    secondaryTypographyProps={{ color: '#94a3b8', variant: 'caption' }}
                  />
                </ListItem>
              );
            })
          )}
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid #334155' }}>
        <Button onClick={onClose} color="inherit" sx={{ color: '#94a3b8' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PictureAsPdfIcon />}
          disabled={selectedIds.length === 0}
          onClick={handleExportBatchPdf}
          sx={{
            fontWeight: 'bold',
            borderRadius: 2,
            px: 3,
            bgcolor: '#0284c7',
            '&:hover': { bgcolor: '#0369a1' },
          }}
        >
          Exportar PDF Masivo CR-80 ({selectedIds.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchPrintModal;
