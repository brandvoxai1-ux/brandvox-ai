// client/src/hooks/useModels.js
import { useState, useEffect } from 'react';
import api from '../lib/api';

// Module-level client cache
let cachedModels = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes client cache

export function useModels() {
  const [models, setModels] = useState(() => cachedModels || []);
  const [loading, setLoading] = useState(() => !cachedModels);
  const [error, setError] = useState(null);

  const fetchActiveModels = async (force = false) => {
    const isStale = Date.now() - lastFetchTime > CACHE_TTL_MS;
    if (cachedModels && !isStale && !force) {
      setModels(cachedModels);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/models');
      const data = res.data || [];
      cachedModels = data;
      lastFetchTime = Date.now();
      setModels(data);
    } catch (err) {
      console.error('[useModels] Failed to fetch active models:', err);
      setError(err.message || 'Failed to fetch models list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveModels();
  }, []);

  return {
    models,
    loading,
    error,
    refetchModels: () => fetchActiveModels(true)
  };
}
