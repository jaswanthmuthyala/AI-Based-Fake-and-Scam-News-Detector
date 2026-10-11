
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.isNetworkError = true;
      error.friendlyMessage =
        'Backend unavailable. Please verify connection.';
      return Promise.reject(error);
    }

    const detail = error.response.data?.detail;

    if (detail) {
      error.friendlyMessage =
        typeof detail === 'string'
          ? detail
          : 'An unexpected error occurred.';
    } else {
      error.friendlyMessage =
        `Server responded with status ${error.response.status}`;
    }

    if (error.response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default api;
