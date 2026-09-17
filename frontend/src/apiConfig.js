const rawUrl = process.env.REACT_APP_API_URL;

export const getApiBaseUrl = () => {
  if (!rawUrl) {
    return 'http://localhost:8000/api/v1';
  }
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  return `https://${rawUrl}`;
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
