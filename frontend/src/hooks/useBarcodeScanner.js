import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para capturar la ráfaga de teclas de un lector de código de barras
 * o lector RFID USB en modo emulación de teclado (HID).
 * 
 * @param {Object} options Configuración del escáner
 * @param {Function} options.onScan Callback a ejecutar con el código escaneado
 * @param {number} [options.timeThreshold=50] Máximo tiempo (ms) entre teclas para considerar ráfaga de escáner
 * @param {number} [options.minLength=3] Longitud mínima del código válido
 * @param {boolean} [options.enabled=true] Estado activo/inactivo del listener
 */
export const useBarcodeScanner = ({
  onScan,
  timeThreshold = 50,
  minLength = 3,
  enabled = true,
}) => {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const timeoutIdRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      const target = e.target;
      // Si el foco está en un elemento editable de formulario, ignorar captura global
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Si pasa demasiado tiempo entre teclas, reiniciar el búfer (evita escritura manual)
      if (timeDiff > timeThreshold && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Limpiar timeout de reset anterior
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      // Al presionar Enter, se asume fin del escaneo por hardware
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          e.preventDefault();
          const scannedCode = bufferRef.current.trim();
          bufferRef.current = '';
          if (onScan) {
            onScan(scannedCode);
          }
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // Acumular solo caracteres imprimibles de longitud 1
      if (e.key && e.key.length === 1) {
        bufferRef.current += e.key;
      }

      // Resetear búfer por inactividad tras 200ms
      timeoutIdRef.current = setTimeout(() => {
        bufferRef.current = '';
      }, 200);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [onScan, timeThreshold, minLength, enabled]);
};

export default useBarcodeScanner;
