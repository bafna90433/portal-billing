import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://stockbackend.bafnadaily.com/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;
    if (config) {
      config._retryCount = config._retryCount || 0;
      const MAX_RETRIES = 3;

      const isNetworkOrTimeout = 
        err.code === 'ECONNABORTED' || 
        err.message?.includes('timeout') || 
        !err.response;

      if (isNetworkOrTimeout && config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        const delay = Math.min(2000 * Math.pow(2, config._retryCount - 1), 8000);
        console.log(`[API Retry] Request to ${config.url} failed. Retrying in ${delay}ms... (Attempt ${config._retryCount}/${MAX_RETRIES})`);
        
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
