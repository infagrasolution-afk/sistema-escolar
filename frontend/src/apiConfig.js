const rawUrl = process.env.REACT_APP_API_URL;

export const getApiBaseUrl = () => {
  if (!rawUrl) {
    return 'http://localhost:8000/api/v1';
  }

  let url = rawUrl.trim();

  // Asegurar protocolo https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Si Render inyectó el nombre interno del servicio (ej: 'escuela-backend-rcxn') sin '.onrender.com'
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      parsed.hostname = `${parsed.hostname}.onrender.com`;
      url = parsed.toString();
    }
  } catch (e) {
    // Si falla el constructor URL
  }

  // Asegurar sufijo /api/v1
  if (!url.includes('/api/v1')) {
    url = url.endsWith('/') ? `${url}api/v1` : `${url}/api/v1`;
  }

  return url;
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
