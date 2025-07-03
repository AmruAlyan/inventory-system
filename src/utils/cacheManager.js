/**
 * Cache Manager for Shopping List and Product Data
 * Implements local caching with validation using updatedAt timestamps
 */

// Cache configuration
const CACHE_CONFIG = {
  SHOPPING_LIST: {
    key: 'shopping_list_cache',
    ttl: 5 * 60 * 1000, // 5 minutes
  },
  PRODUCTS: {
    key: 'products_cache',
    ttl: 10 * 60 * 1000, // 10 minutes
  },
  BUDGET: {
    key: 'budget_cache',
    ttl: 15 * 60 * 1000, // 15 minutes
  }
};

class CacheManager {
  constructor() {
    this.storage = localStorage;
    this.memoryCache = new Map();
    this.listeners = new Map();
    this.initializeCache();
  }

  initializeCache() {
    // Clear expired cache entries on initialization
    Object.values(CACHE_CONFIG).forEach(config => {
      this.clearExpiredCache(config.key);
    });
  }

  /**
   * Generate a cache key with version for invalidation
   */
  generateCacheKey(baseKey, version = '1.0') {
    return `${baseKey}_v${version}`;
  }

  /**
   * Set cached data with timestamp and TTL
   */
  setCache(key, data, ttl = 5 * 60 * 1000) {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl,
      version: '1.0',
      lastUpdated: data.lastUpdated || Date.now()
    };

    try {
      // Store in memory cache for faster access
      this.memoryCache.set(key, cacheItem);
      
      // Store in localStorage for persistence
      this.storage.setItem(key, JSON.stringify(cacheItem));
      
      // Notify listeners of cache update
      this.notifyListeners(key, data);
    } catch (error) {
      console.warn('Failed to set cache:', error);
      // If localStorage is full, clear expired items and try again
      this.clearExpiredCaches();
      try {
        this.storage.setItem(key, JSON.stringify(cacheItem));
      } catch (retryError) {
        console.error('Cache storage failed after cleanup:', retryError);
      }
    }
  }

  /**
   * Get cached data if valid
   */
  getCache(key) {
    try {
      // Try memory cache first
      let cacheItem = this.memoryCache.get(key);
      
      // Fallback to localStorage
      if (!cacheItem) {
        const cached = this.storage.getItem(key);
        if (cached) {
          cacheItem = JSON.parse(cached);
          // Restore to memory cache
          this.memoryCache.set(key, cacheItem);
        }
      }

      if (!cacheItem) return null;

      // Check if cache is expired
      const now = Date.now();
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        this.invalidateCache(key);
        return null;
      }

      return {
        data: cacheItem.data,
        timestamp: cacheItem.timestamp,
        lastUpdated: cacheItem.lastUpdated,
        isValid: true
      };
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Check if cached data needs validation against server
   */
  needsValidation(key, serverLastUpdated) {
    const cached = this.getCache(key);
    if (!cached) return true;

    // Compare with server's lastUpdated timestamp
    return serverLastUpdated > cached.lastUpdated;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidateCache(key) {
    try {
      this.memoryCache.delete(key);
      this.storage.removeItem(key);
      this.notifyListeners(key, null);
    } catch (error) {
      console.warn(`Failed to invalidate cache for key ${key}:`, error);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(key) {
    try {
      const cached = this.getCache(key);
      if (!cached || !cached.isValid) {
        this.invalidateCache(key);
      }
    } catch (error) {
      console.warn(`Error clearing expired cache for ${key}:`, error);
    }
  }

  /**
   * Clear all expired caches
   */
  clearExpiredCaches() {
    Object.values(CACHE_CONFIG).forEach(config => {
      this.clearExpiredCache(config.key);
    });
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    Object.values(CACHE_CONFIG).forEach(config => {
      this.invalidateCache(config.key);
    });
    this.memoryCache.clear();
  }

  /**
   * Subscribe to cache changes
   */
  subscribe(key, listener) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(listener);

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Notify listeners of cache changes
   */
  notifyListeners(key, data) {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Cache listener error:', error);
        }
      });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {
      memoryEntries: this.memoryCache.size,
      localStorageEntries: 0,
      totalSize: 0
    };

    try {
      Object.values(CACHE_CONFIG).forEach(config => {
        const item = this.storage.getItem(config.key);
        if (item) {
          stats.localStorageEntries++;
          stats.totalSize += item.length;
        }
      });
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }

    return stats;
  }

  /**
   * Export cache data for debugging
   */
  exportCache() {
    const cacheData = {};
    Object.values(CACHE_CONFIG).forEach(config => {
      const cached = this.getCache(config.key);
      if (cached) {
        cacheData[config.key] = {
          ...cached,
          size: JSON.stringify(cached.data).length
        };
      }
    });
    return cacheData;
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Export cache constants and instance
export { CACHE_CONFIG, cacheManager };
export default cacheManager;
