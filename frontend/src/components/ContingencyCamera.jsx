import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import { Html5QrcodeScanner } from 'html5-qrcode';

/**
 * Visor de cámara de contingencia para escaneo de códigos de barra / QR
 * utilizando la cámara web integrada vía html5-qrcode.
 */
export const ContingencyCamera = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        if (onScanSuccess) {
          onScanSuccess(decodedText);
        }
      },
      (error) => {
        // Ignorar errores de búsqueda cuadro por cuadro
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.error(err));
      }
    };
  }, [onScanSuccess]);

  return (
    <Paper
      elevation={6}
      sx={{
        p: 3,
        borderRadius: 3,
        textAlign: 'center',
        bgcolor: '#1a1a2e',
        color: '#ffffff',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
        <VideocamIcon color="primary" fontSize="large" />
        <Typography variant="h6" fontWeight="bold">
          Cámara de Contingencia (QR / Código de Barras)
        </Typography>
      </Box>

      <Typography variant="body2" color="gray" mb={2}>
        Presente el carnet con el código QR o código de barras frente a la cámara.
      </Typography>

      <Box
        id="reader"
        sx={{
          maxWidth: '400px',
          margin: '0 auto',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      />

      {onClose && (
        <Button
          variant="outlined"
          color="secondary"
          onClick={onClose}
          sx={{ mt: 3 }}
        >
          Cerrar Cámara
        </Button>
      )}
    </Paper>
  );
};

export default ContingencyCamera;
