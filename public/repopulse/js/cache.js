// ============================================
// RepoPulse — Cache (localStorage with TTL)
// ============================================

/**
 * Handles localStorage caching with TTL (Time To Live), namespace prefixes,
 * and automatic cleanup of expired records.
 */
export const Cache = {
  PREFIX: 'repopulse_cache_',
  mem: new Map(),
  MAX_MEM_ITEMS: 100,

  // Default TTLs (in milliseconds)
  TTL: {
    META: 15 * 60 * 1000,          // 15 minutes for repo metadata
    STATS: 30 * 60 * 1000,         // 30 minutes for commit stats / activity
    LANGUAGES: 60 * 60 * 1000,     // 1 hour for tech stack / languages
    CONTRIBUTORS: 30 * 60 * 1000,  // 30 minutes for contributors
    COMMUNITY: 60 * 60 * 1000,     // 1 hour for community health profile
    RELEASES: 30 * 60 * 1000       // 30 minutes for releases
  },

  DEFAULT_TTL: 30 * 60 * 1000,

  /**
   * Generates a unique cache key for an endpoint and params
   */
  getKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    const sanitizedEndpoint = endpoint.replace(/^\/+/, '').replace(/\//g, '_');
    return `${this.PREFIX}${sanitizedEndpoint}${sortedParams ? '?' + sortedParams : ''}`;
  },

  /**
   * Stores data in memory and localStorage with TTL
   */
  set(key, data, ttl = this.DEFAULT_TTL) {
    const record = {
      value: data,
      timestamp: Date.now(),
      ttl: ttl
    };

    // Tier 1: In-memory cache
    if (this.mem.size >= this.MAX_MEM_ITEMS) {
      const oldestKey = this.mem.keys().next().value;
      if (oldestKey) this.mem.delete(oldestKey);
    }
    this.mem.set(key, record);

    // Tier 2: Persistent localStorage
    try {
      localStorage.setItem(key, JSON.stringify(record));
    } catch (e) {
      this.evictOldest(5);
      try {
        localStorage.setItem(key, JSON.stringify(record));
      } catch (retryErr) {}
    }
  },

  /**
   * Retrieves data from the cache (memory first, then storage) if not expired
   */
  get(key) {
    const now = Date.now();

    // 1. Check in-memory cache
    if (this.mem.has(key)) {
      const record = this.mem.get(key);
      if (record && now - record.timestamp <= record.ttl) {
        return record.value;
      }
      this.mem.delete(key);
    }

    // 2. Check localStorage
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const record = JSON.parse(item);
      if (!record || typeof record.timestamp !== 'number' || typeof record.ttl !== 'number') {
        this.remove(key);
        return null;
      }

      if (now - record.timestamp > record.ttl) {
        this.remove(key);
        return null;
      }

      // Populate memory cache for faster subsequent reads
      this.mem.set(key, record);
      return record.value;
    } catch (e) {
      return null;
    }
  },

  /**
   * Removes a specific key from cache
   */
  remove(key) {
    this.mem.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  },

  /**
   * Cleans all expired entries under the RepoPulse prefix
   */
  cleanExpired() {
    try {
      const now = Date.now();
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const record = JSON.parse(item);
              if (record && record.timestamp && record.ttl && (now - record.timestamp > record.ttl)) {
                localStorage.removeItem(key);
              }
            } catch (err) {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (e) {}
  },

  /**
   * Evicts the oldest N items in localStorage
   */
  evictOldest(count = 5) {
    try {
      const items = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '{}');
            items.push({ key, timestamp: parsed.timestamp || 0 });
          } catch (e) {
            items.push({ key, timestamp: 0 });
          }
        }
      }
      items.sort((a, b) => a.timestamp - b.timestamp);
      items.slice(0, count).forEach(item => localStorage.removeItem(item.key));
    } catch (e) {}
  },

  /**
   * Clears all cached repository data
   */
  clearAll() {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}
  }
};
