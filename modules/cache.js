'use strict';

/**
 * XWise Blocker v3.0.0 — High-Performance Two-Tier Caching Engine
 * L1: Ultra-fast in-memory LRU Map ($O(1)$) with strict memory bounds (<5MB RAM).
 * L2: Persistent chrome.storage.local with TTL-based eviction.
 */

class XWiseCacheEngine {
  constructor() {
    this.memoryCaches = new Map();
    this.limits = {
      bios: 500,
      verdicts: 1000,
      relationships: 100,
      general: 200,
    };
    this.defaultTTLs = {
      bios: 7 * 24 * 60 * 60 * 1000,        // 7 days
      verdicts: 24 * 60 * 60 * 1000,        // 24 hours
      relationships: 30 * 24 * 60 * 60 * 1000, // 30 days
      general: 12 * 60 * 60 * 1000,         // 12 hours
    };

    // Pending writes buffer to avoid hammering chrome.storage.local
    this.writeDebounceTimers = new Map();
    this.pendingWrites = new Map();

    // Auto-hydrate memory cache from persistent storage
    this.initPromise = this.init();

    // Auto-flush on page unload if in browser window
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this._flushStorageWrites());
      window.addEventListener('pagehide', () => this._flushStorageWrites());
    }
  }

  /**
   * Pre-load existing cache entries from chrome.storage.local into L1 memory
   */
  async init() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const all = await chrome.storage.local.get(null);
        const now = Date.now();
        for (const [sKey, entry] of Object.entries(all)) {
          if (sKey.startsWith('xwise.cache.') && entry && typeof entry === 'object') {
            if (entry.expiresAt && now > entry.expiresAt) continue;
            const parts = sKey.split('.');
            if (parts.length >= 4) {
              const namespace = parts[2];
              const key = parts.slice(3).join('.');
              this._setMemory(namespace, key, entry.value, entry.expiresAt);
            }
          }
        }
      }
    } catch {}
  }

  _getMemoryMap(namespace) {
    if (!this.memoryCaches.has(namespace)) {
      this.memoryCaches.set(namespace, new Map());
    }
    return this.memoryCaches.get(namespace);
  }

  _storageKey(namespace, key) {
    return `xwise.cache.${namespace}.${key}`;
  }

  _storagePrefix(namespace) {
    return `xwise.cache.${namespace}.`;
  }

  /**
   * Get value from L1 (Memory) or L2 (chrome.storage.local)
   */
  async get(namespace, key) {
    if (!namespace || !key) return null;
    const cleanKey = String(key).toLowerCase().trim();
    const l1 = this._getMemoryMap(namespace);

    // 1. Check L1 Memory (LRU re-insertion for true O(1))
    if (l1.has(cleanKey)) {
      const entry = l1.get(cleanKey);
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        l1.delete(cleanKey);
        this.delete(namespace, cleanKey);
        return null;
      }
      // Re-insert to mark recently used
      l1.delete(cleanKey);
      l1.set(cleanKey, entry);
      return entry.value;
    }

    // 2. Check L2 Storage
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const sKey = this._storageKey(namespace, cleanKey);
        const res = await chrome.storage.local.get(sKey);
        const entry = res[sKey];

        if (entry && typeof entry === 'object') {
          if (entry.expiresAt && Date.now() > entry.expiresAt) {
            await chrome.storage.local.remove(sKey);
            return null;
          }
          // Promote to L1
          this._setMemory(namespace, cleanKey, entry.value, entry.expiresAt);
          return entry.value;
        }
      }
    } catch {
      // Storage unavailable or disabled
    }

    return null;
  }

  /**
   * Synchronous L1 memory read (critical for real-time DOM filtering without async lag)
   */
  getMemoryOnly(namespace, key) {
    if (!namespace || !key) return null;
    const cleanKey = String(key).toLowerCase().trim();
    const l1 = this._getMemoryMap(namespace);

    if (l1.has(cleanKey)) {
      const entry = l1.get(cleanKey);
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        l1.delete(cleanKey);
        return null;
      }
      l1.delete(cleanKey);
      l1.set(cleanKey, entry);
      return entry.value;
    }

    // Background promotion from L2 to L1 if available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const sKey = this._storageKey(namespace, cleanKey);
      chrome.storage.local.get([sKey]).then((res) => {
        const entry = res?.[sKey];
        if (entry && typeof entry === 'object' && (!entry.expiresAt || Date.now() <= entry.expiresAt)) {
          this._setMemory(namespace, cleanKey, entry.value, entry.expiresAt);
        }
      }).catch(() => {});
    }

    return null;
  }

  /**
   * Store into L1 & L2
   */
  async set(namespace, key, value, customTTL) {
    if (!namespace || !key) return;
    const cleanKey = String(key).toLowerCase().trim();
    const ttl = customTTL || this.defaultTTLs[namespace] || this.defaultTTLs.general;
    const expiresAt = Date.now() + ttl;

    // 1. Write L1
    this._setMemory(namespace, cleanKey, value, expiresAt);

    // 2. Batch write L2
    this._queueStorageWrite(namespace, cleanKey, { value, expiresAt, updatedAt: Date.now() });
  }

  _setMemory(namespace, key, value, expiresAt) {
    const l1 = this._getMemoryMap(namespace);
    const limit = this.limits[namespace] || this.limits.general;

    if (l1.has(key)) {
      l1.delete(key);
    } else if (l1.size >= limit) {
      // Evict oldest (first key in insertion order)
      const oldestKey = l1.keys().next().value;
      if (oldestKey) l1.delete(oldestKey);
    }

    l1.set(key, { value, expiresAt });
  }

  _queueStorageWrite(namespace, key, record) {
    const sKey = this._storageKey(namespace, key);
    this.pendingWrites.set(sKey, record);

    if (!this.writeDebounceTimers.has(namespace)) {
      const timer = setTimeout(() => {
        this.writeDebounceTimers.delete(namespace);
        this._flushStorageWrites();
      }, 300);
      this.writeDebounceTimers.set(namespace, timer);
    }
  }

  async _flushStorageWrites() {
    if (this.pendingWrites.size === 0) return;
    const payload = {};
    for (const [k, v] of this.pendingWrites.entries()) {
      payload[k] = v;
    }
    this.pendingWrites.clear();

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set(payload);
      }
    } catch {
      // Silently handle storage write limits
    }
  }

  /**
   * Remove item from both layers
   */
  async delete(namespace, key) {
    if (!namespace || !key) return;
    const cleanKey = String(key).toLowerCase().trim();
    const l1 = this._getMemoryMap(namespace);
    l1.delete(cleanKey);

    const sKey = this._storageKey(namespace, cleanKey);
    this.pendingWrites.delete(sKey);

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(sKey);
      }
    } catch {}
  }

  /**
   * Prune expired entries from L2 storage
   */
  async prune(namespace) {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return 0;
      const all = await chrome.storage.local.get(null);
      const prefix = namespace ? this._storagePrefix(namespace) : 'xwise.cache.';
      const now = Date.now();
      const keysToRemove = [];

      for (const [k, entry] of Object.entries(all)) {
        if (k.startsWith(prefix)) {
          if (entry && entry.expiresAt && now > entry.expiresAt) {
            keysToRemove.push(k);
          }
        }
      }

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }
      return keysToRemove.length;
    } catch {
      return 0;
    }
  }

  /**
   * Clear cache completely
   */
  async clear(namespace) {
    if (namespace) {
      this._getMemoryMap(namespace).clear();
    } else {
      this.memoryCaches.clear();
    }
    this.pendingWrites.clear();

    try {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
      const all = await chrome.storage.local.get(null);
      const prefix = namespace ? this._storagePrefix(namespace) : 'xwise.cache.';
      const keysToRemove = Object.keys(all).filter((k) => k.startsWith(prefix));
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }
    } catch {}
  }

  /**
   * Calculate cache statistics for settings UI
   */
  async getStats() {
    let memoryCount = 0;
    for (const map of this.memoryCaches.values()) {
      memoryCount += map.size;
    }

    let storageCount = 0;
    let estimatedBytes = 0;

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const all = await chrome.storage.local.get(null);
        for (const [k, v] of Object.entries(all)) {
          if (k.startsWith('xwise.cache.') || k.startsWith('xwise.tracker.')) {
            storageCount++;
            estimatedBytes += JSON.stringify(v).length * 2; // rough UTF-16 byte calculation
          }
        }
      }
    } catch {}

    return {
      memoryItems: memoryCount,
      storageItems: storageCount,
      totalItems: Math.max(storageCount, memoryCount),
      estimatedSizeKB: Math.round(estimatedBytes / 1024),
    };
  }
}

// Global Singleton Instance
const XWiseCache = new XWiseCacheEngine();

// Export for ES modules and standard script inclusion
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { XWiseCache, XWiseCacheEngine };
}
if (typeof globalThis !== 'undefined') {
  globalThis.XWiseCache = XWiseCache;
}
if (typeof window !== 'undefined') {
  window.XWiseCache = XWiseCache;
}
