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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

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

      // Descargar archivo blob PDF resultante
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight="bold">
          Impresión por Lotes (Zebra ZXP Series 7)
        </Typography>
        <Chip
          label={`${selectedIds.length} Seleccionados`}
          color={selectedIds.length > 0 ? 'primary' : 'default'}
        />
      </DialogTitle>

      <DialogContent dividers>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Button size="small" onClick={handleSelectAll}>
            {selectedIds.length === estudiantes.length
              ? 'Deseleccionar Todos'
              : 'Seleccionar Todos'}
          </Button>
        </Box>

        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {estudiantes.map((estudiante) => {
            const labelId = `checkbox-list-label-${estudiante.id}`;
            return (
              <ListItem key={estudiante.id} button onClick={handleToggle(estudiante.id)}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedIds.indexOf(estudiante.id) !== -1}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{ 'aria-labelledby': labelId }}
                  />
                </ListItemIcon>
                <ListItemText
                  id={labelId}
                  primary={`${estudiante.nombres} ${estudiante.apellidos}`}
                  secondary={`${estudiante.grado_seccion} | Código: ${estudiante.codigo_opaco}`}
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PictureAsPdfIcon />}
          disabled={selectedIds.length === 0}
          onClick={handleExportBatchPdf}
        >
          Exportar PDF Masivo (CR-80)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchPrintModal;
