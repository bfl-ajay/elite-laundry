// Simple in-memory cache utility for search results and API responses

class SimpleCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  // Generate cache key from parameters
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  // Set cache entry
  set(key, value) {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: this.ttl
    });
  }

  // Get cache entry
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  // Check if key exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Clear all cache entries
  clear() {
    this.cache.clear();
  }

  // Clear expired entries
  clearExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

// Create singleton instances for different types of data
export const searchCache = new SimpleCache(50, 2 * 60 * 1000); // 2 minutes for search results
export const metricsCache = new SimpleCache(10, 30 * 1000); // 30 seconds for metrics
export const ordersCache = new SimpleCache(100, 60 * 1000); // 1 minute for orders

// Utility functions for common cache operations
export const cacheUtils = {
  // Cache search results
  cacheSearchResults: (filters, results) => {
    const key = searchCache.generateKey('search', filters);
    searchCache.set(key, results);
  },

  // Get cached search results
  getCachedSearchResults: (filters) => {
    const key = searchCache.generateKey('search', filters);
    return searchCache.get(key);
  },

  // Cache metrics data
  cacheMetrics: (metrics) => {
    metricsCache.set('current', metrics);
  },

  // Get cached metrics
  getCachedMetrics: () => {
    return metricsCache.get('current');
  },

  // Cache orders data
  cacheOrders: (filters, orders) => {
    const key = ordersCache.generateKey('orders', filters);
    ordersCache.set(key, orders);
  },

  // Get cached orders
  getCachedOrders: (filters) => {
    const key = ordersCache.generateKey('orders', filters);
    return ordersCache.get(key);
  },

  // Clear all caches
  clearAll: () => {
    searchCache.clear();
    metricsCache.clear();
    ordersCache.clear();
  },

  // Clear expired entries from all caches
  clearExpired: () => {
    searchCache.clearExpired();
    metricsCache.clearExpired();
    ordersCache.clearExpired();
  }
};

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  cacheUtils.clearExpired();
}, 5 * 60 * 1000);

export default SimpleCache;