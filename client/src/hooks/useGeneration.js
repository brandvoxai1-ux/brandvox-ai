// client/src/hooks/useGeneration.js
import { useState, useCallback } from 'react';
import api from '../lib/api';

export function useGeneration() {
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGenerations = useCallback(async (page = 1, limit = 12) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/generate?page=${page}&limit=${limit}`);
      setGenerations(res.data.generations || []);
      return res.data; // Returns full paginated payload with watermarkRequired
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to load videos library.';
      setError(errMsg);
      return { generations: [], watermarkRequired: true };
    } finally {
      setLoading(false);
    }
  }, []);

  const createGeneration = async (payload) => {
    setError(null);
    try {
      const res = await api.post('/generate', payload);
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to dispatch generation job.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const createImageGeneration = async (payload) => {
    setError(null);
    try {
      const res = await api.post('/generate/image', payload);
      return res.data; // { success, generationId, image_url, cost }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to generate image.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };


  const getStatus = async (id) => {
    try {
      const res = await api.get(`/generate/${id}/status`);
      return res.data;
    } catch (err) {
      console.error('[useGeneration] Status inquiry failed:', err);
      throw err;
    }
  };

  const updateGeneration = async (id, updates) => {
    try {
      const res = await api.patch(`/generate/${id}`, updates);
      setGenerations((prev) => prev.map((g) => (g.id === id ? res.data : g)));
      return res.data;
    } catch (err) {
      throw err.response?.data?.error || err.message;
    }
  };

  const deleteGeneration = async (id) => {
    try {
      await api.delete(`/generate/${id}`);
      setGenerations((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      throw err.response?.data?.error || err.message;
    }
  };

  return {
    generations,
    loading,
    error,
    fetchGenerations,
    createGeneration,
    createImageGeneration,
    getStatus,
    updateGeneration,
    deleteGeneration
  };
}
