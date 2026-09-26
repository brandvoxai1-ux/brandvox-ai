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
}, (error) => {
  return Promise.reject(error);
});

export default api;
