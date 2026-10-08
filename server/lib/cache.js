// server/lib/cache.js
/**
 * Lightweight In-Memory TTL Cache for BrandVox AI
 * Eliminates redundant Supabase queries for read-heavy datasets (models, templates, configurations).
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  /**
   * Fetch item from cache if not expired
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Set item in cache with TTL in seconds
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlSeconds 
   */
  set(key, value, ttlSeconds = 300) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  /**
   * Delete specific key
   * @param {string} key 
   */
  del(key) {
    this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  flush() {
    this.store.clear();
  }
}

const memoryCache = new MemoryCache();
module.exports = memoryCache;
