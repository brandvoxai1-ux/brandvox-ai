// client/src/lib/api.js
import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
  timeout: 120000, // 120s (2 minutes) to ensure AI generation pipelines are never interrupted prematurely
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor injecting the active session access token
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('[APIInterceptor] Failed to resolve auth token:', err);
  }
  return config;
// Response interceptor with cold-start automatic retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // Retry once on network error (like Render waking up from cold sleep)
    if (!config || config.__isRetry || (error.response && error.response.status !== 502 && error.response.status !== 503)) {
      return Promise.reject(error);
    }
    
    // Only retry GET requests or safe queries
    const method = (config.method || 'get').toLowerCase();
    if (method === 'get') {
      config.__isRetry = true;
      console.warn('[API] Backend waking up from cold sleep, retrying request in 2s...', config.url);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
