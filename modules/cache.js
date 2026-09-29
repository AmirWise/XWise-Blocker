'use strict';

/**
 * XWise Blocker v3.2.1 - Two-tier cache
 * L1: in-memory LRU map per namespace.
 * L2: one chrome.storage.local record per namespace, written in debounced batches.
 */

const XWISE_CACHE_PREFIX = 'xwise.cache.ns.';
const XWISE_CACHE_LEGACY_FLAG = 'xwise.cache.legacyPurged';

class XWiseCacheEngine {
  constructor() {
    this.memoryCaches = new Map();
    this.dirtyNamespaces = new Set();
    this.flushTimers = new Map();
    this.flushDelayMs = 1500;

    this.limits = {
      bios: 500,
      verdicts: 1000,
      relationships: 100,
      general: 200,
      gender: 1000,
    };
    this.defaultTTLs = {
      bios: 7 * 24 * 60 * 60 * 1000,
      verdicts: 24 * 60 * 60 * 1000,
      relationships: 30 * 24 * 60 * 60 * 1000,
      general: 12 * 60 * 60 * 1000,
      gender: 7 * 24 * 60 * 60 * 1000,
    };

    this.initPromise = this.init();

    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this._flushAll());
    }
    if (this._hasStorage() && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => this._onStorageChanged(changes, area));
    }
  }

  _hasStorage() {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
  }

  _storageKey(namespace) {
    return XWISE_CACHE_PREFIX + namespace;
  }

  _getMemoryMap(namespace) {
    let map = this.memoryCaches.get(namespace);
    if (!map) {
      map = new Map();
      this.memoryCaches.set(namespace, map);
    }
    return map;
  }

  async init() {
    if (!this._hasStorage()) return;
    try {
      const namespaces = Object.keys(this.limits);
      const stored = await chrome.storage.local.get(namespaces.map((ns) => this._storageKey(ns)));
      const now = Date.now();

      for (const namespace of namespaces) {
        const blob = stored[this._storageKey(namespace)];
        if (!blob || !Array.isArray(blob.entries)) continue;
        for (const [key, value, expiresAt] of blob.entries) {
          if (expiresAt && now > expiresAt) continue;
          this._setMemory(namespace, key, value, expiresAt);
        }
      }

      await this._purgeLegacyEntries();
    } catch {
      // Storage unavailable
    }
  }

  async _purgeLegacyEntries() {
    const done = await chrome.storage.local.get(XWISE_CACHE_LEGACY_FLAG);
    if (done[XWISE_CACHE_LEGACY_FLAG]) return;

    const all = await chrome.storage.local.get(null);
    const legacyKeys = Object.keys(all).filter(
      (key) =>
        key.startsWith('xwise.cache.') &&
        !key.startsWith(XWISE_CACHE_PREFIX) &&
        key !== XWISE_CACHE_LEGACY_FLAG
    );
    if (legacyKeys.length > 0) await chrome.storage.local.remove(legacyKeys);
    await chrome.storage.local.set({ [XWISE_CACHE_LEGACY_FLAG]: true });
  }

  _onStorageChanged(changes, area) {
    if (area !== 'local') return;

    for (const [storageKey, change] of Object.entries(changes)) {
      if (!storageKey.startsWith(XWISE_CACHE_PREFIX)) continue;
      const namespace = storageKey.slice(XWISE_CACHE_PREFIX.length);

      if (!change.newValue) {
        this.memoryCaches.delete(namespace);
        this.dirtyNamespaces.delete(namespace);
        continue;
      }

      const now = Date.now();
      const map = this._getMemoryMap(namespace);
      for (const [key, value, expiresAt] of change.newValue.entries || []) {
        if (map.has(key) || (expiresAt && now > expiresAt)) continue;
        this._setMemory(namespace, key, value, expiresAt);
      }
    }
  }

  async get(namespace, key) {
    await this.initPromise;
    return this.getMemoryOnly(namespace, key);
  }

  getMemoryOnly(namespace, key) {
    if (!namespace || !key) return null;
    const cleanKey = String(key).toLowerCase().trim();
    const map = this._getMemoryMap(namespace);
    const entry = map.get(cleanKey);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      map.delete(cleanKey);
      this._markDirty(namespace);
      return null;
    }

    map.delete(cleanKey);
    map.set(cleanKey, entry);
    return entry.value;
  }

  async set(namespace, key, value, customTTL) {
    if (!namespace || !key) return;
    const cleanKey = String(key).toLowerCase().trim();
    const ttl = customTTL || this.defaultTTLs[namespace] || this.defaultTTLs.general;

    this._setMemory(namespace, cleanKey, value, Date.now() + ttl);
    this._markDirty(namespace);
  }

  _setMemory(namespace, key, value, expiresAt) {
    const map = this._getMemoryMap(namespace);
    const limit = this.limits[namespace] || this.limits.general;

    if (map.has(key)) {
      map.delete(key);
    } else if (map.size >= limit) {
      const oldestKey = map.keys().next().value;
      if (oldestKey !== undefined) map.delete(oldestKey);
    }
    map.set(key, { value, expiresAt });
  }

  _markDirty(namespace) {
    this.dirtyNamespaces.add(namespace);
    if (this.flushTimers.has(namespace)) return;

    const timer = setTimeout(() => {
      this.flushTimers.delete(namespace);
      this._flushNamespace(namespace);
    }, this.flushDelayMs);
    this.flushTimers.set(namespace, timer);
  }

  async _flushNamespace(namespace) {
    if (!this._hasStorage() || !this.dirtyNamespaces.has(namespace)) return;
    this.dirtyNamespaces.delete(namespace);

    const now = Date.now();
    const entries = [];
    for (const [key, entry] of this._getMemoryMap(namespace)) {
      if (!entry.expiresAt || entry.expiresAt > now) {
        entries.push([key, entry.value, entry.expiresAt]);
      }
    }

    try {
      await chrome.storage.local.set({ [this._storageKey(namespace)]: { entries, updatedAt: now } });
    } catch {
      // Write failed; the entries remain available in memory
    }
  }

  _flushAll() {
    for (const namespace of [...this.dirtyNamespaces]) {
      this._flushNamespace(namespace);
    }
  }

  async delete(namespace, key) {
    if (!namespace || !key) return;
    this._getMemoryMap(namespace).delete(String(key).toLowerCase().trim());
    this._markDirty(namespace);
  }

  async prune(namespace) {
    const now = Date.now();
    const namespaces = namespace ? [namespace] : [...this.memoryCaches.keys()];
    let removed = 0;

    for (const ns of namespaces) {
      const map = this._getMemoryMap(ns);
      for (const [key, entry] of [...map]) {
        if (entry.expiresAt && now > entry.expiresAt) {
          map.delete(key);
          removed++;
        }
      }
      if (removed > 0) this._markDirty(ns);
    }
    return removed;
  }

  async clear(namespace) {
    if (namespace) {
      this._getMemoryMap(namespace).clear();
      this.dirtyNamespaces.delete(namespace);
    } else {
      this.memoryCaches.clear();
      this.dirtyNamespaces.clear();
    }
    for (const timer of this.flushTimers.values()) clearTimeout(timer);
    this.flushTimers.clear();

    if (!this._hasStorage()) return;
    try {
      const all = await chrome.storage.local.get(null);
      const prefix = namespace ? this._storageKey(namespace) : XWISE_CACHE_PREFIX;
      const keys = Object.keys(all).filter((key) => key.startsWith(prefix));
      if (keys.length > 0) await chrome.storage.local.remove(keys);
    } catch {
      // Storage unavailable
    }
  }

  async getStats() {
    let memoryItems = 0;
    for (const map of this.memoryCaches.values()) memoryItems += map.size;

    let storageItems = 0;
    let estimatedBytes = 0;

    if (this._hasStorage()) {
      try {
        const all = await chrome.storage.local.get(null);
        for (const [key, blob] of Object.entries(all)) {
          if (!key.startsWith(XWISE_CACHE_PREFIX)) continue;
          storageItems += Array.isArray(blob?.entries) ? blob.entries.length : 0;
          estimatedBytes += JSON.stringify(blob).length * 2;
        }
      } catch {
        // Storage unavailable
      }
    }

    return {
      memoryItems,
      storageItems,
      totalItems: Math.max(storageItems, memoryItems),
      estimatedSizeKB: Math.round(estimatedBytes / 1024),
    };
  }
}

const XWiseCache = new XWiseCacheEngine();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { XWiseCache, XWiseCacheEngine };
}
if (typeof globalThis !== 'undefined') {
  globalThis.XWiseCache = XWiseCache;
}
if (typeof window !== 'undefined') {
  window.XWiseCache = XWiseCache;
}
