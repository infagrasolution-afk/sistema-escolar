import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Visor de cámara de contingencia para escaneo de códigos de barra / QR
 * utilizando la cámara web integrada vía html5-qrcode (Inicio directo sin botones intermedios).
 */
export const ContingencyCamera = ({ onScanSuccess, onClose }) => {
  const onScanSuccessRef = useRef(onScanSuccess);
  const [errorMsg, setErrorMsg] = useState(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    let html5QrcodeScanner = null;
    let isMounted = true;

    const startCamera = async () => {
      try {
        html5QrcodeScanner = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 240, height: 240 } };

        // 1. Intentar iniciar directamente con la cámara frontal / de laptop
        await html5QrcodeScanner.start(
          { facingMode: "user" },
          config,
          (decodedText) => {
            if (isMounted && onScanSuccessRef.current) {
              onScanSuccessRef.current(decodedText);
            }
          },
          () => {}
        );

        if (isMounted) setStarting(false);
      } catch (err) {
        console.warn("Fallo cámara 'user', intentando cámara por ID:", err);
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const cameraId = cameras[0].id;
            await html5QrcodeScanner.start(
              cameraId,
              { fps: 10, qrbox: { width: 240, height: 240 } },
              (decodedText) => {
                if (isMounted && onScanSuccessRef.current) {
                  onScanSuccessRef.current(decodedText);
                }
              },
              () => {}
            );
            if (isMounted) setStarting(false);
            return;
          }
        } catch (fallbackErr) {
          console.error("Fallback error:", fallbackErr);
        }

        if (isMounted) {
          setStarting(false);
          setErrorMsg("No se pudo iniciar la cámara de la laptop. Verifique que ha otorgado permisos de cámara en su navegador.");
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (html5QrcodeScanner) {
        if (html5QrcodeScanner.isScanning) {
          html5QrcodeScanner.stop().then(() => {
            html5QrcodeScanner.clear();
          }).catch((e) => console.error("Error al detener cámara:", e));
        } else {
          try {
            html5QrcodeScanner.clear();
          } catch (e) {}
        }
      }
    };
  }, []);

  return (
    <Paper
      elevation={6}
      sx={{
        p: 3,
        borderRadius: 3,
        textAlign: 'center',
        bgcolor: '#1e293b',
        color: '#ffffff',
        width: '100%',
        maxWidth: 480,
        mx: 'auto',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
        <VideocamIcon color="primary" fontSize="large" />
        <Typography variant="h6" fontWeight="bold">
          Cámara de Contingencia (QR / Barras)
        </Typography>
      </Box>

      <Typography variant="body2" color="#94a3b8" mb={2}>
        Presente el carnet con el código QR o código de barras frente a la cámara.
      </Typography>

      {starting && (
        <Box py={3}>
          <CircularProgress size={40} sx={{ color: '#38bdf8' }} />
          <Typography variant="caption" display="block" color="#94a3b8" mt={1}>
            Iniciando transmisión de cámara...
          </Typography>
        </Box>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      )}

      <Box
        id="reader"
        sx={{
          width: '100%',
          minHeight: '250px',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#0f172a',
          border: '1px solid #334155',
        }}
      />

      {onClose && (
        <Button
          variant="outlined"
          color="secondary"
          onClick={onClose}
          sx={{ mt: 3, fontWeight: 'bold' }}
        >
          Cerrar Cámara
        </Button>
      )}
    </Paper>
  );
};

export default ContingencyCamera;
