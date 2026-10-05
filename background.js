'use strict';

/**
 * XWise Blocker v3.5.0 - Background Service Worker
 * Settings storage and migration, scheduled relationship scans,
 * video download resolution, and runtime messaging.
 */

import './modules/cache.js';
import './modules/twitterApi.js';
import './modules/relationshipTracker.js';
import './modules/rastnevis.js';

const STORAGE_VERSION = 7;
const TRACKER_ALARM_NAME = 'xwise_periodic_tracker';
const STATS_KEY = 'xwise.stats';
const X_TAB_PATTERNS = ['*://*.x.com/*', '*://*.twitter.com/*'];

const LEGACY_STAT_KEYS = [
  'blockCount',
  'filterBlockCount',
  'muteCount',
  'hideCount',
  'adBlockCount',
  'blueCheckCount',
  'dryRunMatchCount',
  'cleanerCount',
];

const DEFAULT_SETTINGS = {
  __version: STORAGE_VERSION,

  // Master switch for filtering, ad removal and timeline cleaning
  shieldEnabled: true,

  // Relationship tracker
  trackerEnabled: true,
  trackerCheckInterval: 240, // minutes; 0 = off
  trackerBadgeAlerts: true,

  // Video suite
  volumeSliderEnabled: true,
  rememberVolume: true,
  lastVolume: 1,
  defaultPlaybackRate: 1,
  videoLoopEnabled: false,
  videoDownloadEnabled: true,

  // Timeline and UI cleaner
  cleanTimelineEnabled: true,
  hideWhoToFollow: true,
  hideProfileWhoToFollow: true,
  hideGrokDrawer: true,
  hidePremiumUpsell: true,
  hideViewCounts: false,
  zenModeEnabled: false,
  zenKeepSearch: true,
  scrollToTopEnabled: true,
  highResImagesEnabled: true,

  // Filter engine
  filterEngineEnabled: true,
  filterMode: 'hide', // 'dry-run' | 'hide' | 'auto-mute' | 'auto-block'
  filterScopes: {
    displayName: true,
    bio: true,
    tweetText: false,
  },
  filters: [], // { id, pattern, action, isRegex, enabled, createdAt }
  filterCaseSensitive: false,
  filterWholeWord: false,

  // Anti-spam
  filterDefaultAvatars: false,
  filterEngagementBait: false,

  // Fun filters
  hideBoysMode: false,
  boysWhitelist: [],

  // RastNevis Persian Editor (New in v3.5.0)
  rastnevisEnabled: true,
  rastnevisHeksare: true,
  rastnevisArabic: true,
  rastnevisSpelling: true,
  rastnevisZwnj: true,
  rastnevisHints: true,
  rastnevisShowBadge: true,
  rastnevisUnderline: true,

  // Ads
  adBlockerEnabled: true,

  // Verified account filter
  blueCheckFilter: 'off', // 'off' | 'replies-only' | 'all'
  blueCheckAction: 'hide', // 'hide' | 'mute' | 'block'

  whitelist: [],

  // Manual block, shortcut and quick menu
  blockButtonEnabled: true,
  quickMenuEnabled: true,
  shortcutEnabled: true,
  shortcutCtrl: true,
  shortcutAlt: true,
  shortcutShift: false,
  shortcutKey: 'b',
  confirmDelayOnShortcut: true,

  // UI
  showMatchBadges: true,
  badgeStyle: 'subtle',
  language: 'fa',
  showBlockToasts: true,
};

// ----------------------------------------------------------------------------
// Settings
// ----------------------------------------------------------------------------

async function loadSettings() {
  const stored = await chrome.storage.sync.get(null);
  let current = { ...stored };
  const version = current.__version || 0;

  if (current['xwise.settings'] && typeof current['xwise.settings'] === 'object') {
    const legacy = current['xwise.settings'];
    current = { ...legacy, ...current };
    delete current['xwise.settings'];
    await chrome.storage.sync.remove('xwise.settings');
  }

  if (version > 0 && version < STORAGE_VERSION) {
    current = await migrateSettings(current, version);
  }

  const merged = { ...DEFAULT_SETTINGS, ...current, __version: STORAGE_VERSION };
  if (current.__version !== STORAGE_VERSION) {
    await chrome.storage.sync.set(merged);
  }
  return merged;
}

async function migrateSettings(settings, fromVersion) {
  console.log(`[XWise] Migrating settings from v${fromVersion} to v${STORAGE_VERSION}`);

  if (fromVersion < 2) {
    settings.filterEngineEnabled = settings.filterEngineEnabled ?? true;
    settings.filterMode = settings.filterMode || 'hide';
    settings.filterScopes = settings.filterScopes || { displayName: true, bio: true, tweetText: false };
    settings.filters = Array.isArray(settings.filters) ? settings.filters : [];
    settings.filterCaseSensitive = settings.filterCaseSensitive ?? false;
    settings.filterWholeWord = settings.filterWholeWord ?? false;
    settings.showMatchBadges = settings.showMatchBadges ?? true;
    settings.badgeStyle = settings.badgeStyle || 'subtle';
    settings.language = settings.language || 'fa';
  }

  if (fromVersion < 3) {
    if (settings.filterMode === 'dry-run' && (!settings.filters || settings.filters.length === 0)) {
      settings.filterMode = 'hide';
    }
    settings.adBlockerEnabled = settings.adBlockerEnabled ?? true;
    settings.blueCheckFilter = settings.blueCheckFilter || 'off';
    settings.blueCheckAction = settings.blueCheckAction || 'hide';
    settings.whitelist = Array.isArray(settings.whitelist) ? settings.whitelist : [];
    settings.defaultPlaybackRate = settings.defaultPlaybackRate || 1;
  }

  if (fromVersion < 4) {
    settings.videoLoopEnabled = settings.videoLoopEnabled ?? false;
    settings.videoDownloadEnabled = settings.videoDownloadEnabled ?? true;
    settings.cleanTimelineEnabled = settings.cleanTimelineEnabled ?? true;
    settings.hideWhoToFollow = settings.hideWhoToFollow ?? true;
    settings.hideGrokDrawer = settings.hideGrokDrawer ?? true;
    settings.hidePremiumUpsell = settings.hidePremiumUpsell ?? true;
    settings.hideViewCounts = settings.hideViewCounts ?? false;
    settings.zenModeEnabled = settings.zenModeEnabled ?? false;
    settings.quickMenuEnabled = settings.quickMenuEnabled ?? true;
    settings.filterDefaultAvatars = settings.filterDefaultAvatars ?? false;
    settings.filterEngagementBait = settings.filterEngagementBait ?? false;

    if (Array.isArray(settings.filters)) {
      settings.filters = settings.filters.map((f) => ({
        ...f,
        isRegex: f.isRegex ?? (typeof f.pattern === 'string' && f.pattern.startsWith('/') && f.pattern.lastIndexOf('/') > 0),
      }));
    }
  }

  if (fromVersion < 5) {
    settings.trackerEnabled = settings.trackerEnabled ?? true;
    settings.trackerCheckInterval = settings.trackerCheckInterval ?? 240;
    settings.trackerBadgeAlerts = settings.trackerBadgeAlerts ?? true;
    delete settings.trackerLastCheck;
  }

  if (fromVersion < 6) {
    settings.shieldEnabled = settings.shieldEnabled ?? true;
    await migrateLegacyStats(settings);
  }

  if (fromVersion < 7) {
    settings.rastnevisEnabled = settings.rastnevisEnabled ?? true;
    settings.rastnevisHeksare = settings.rastnevisHeksare ?? true;
    settings.rastnevisArabic = settings.rastnevisArabic ?? true;
    settings.rastnevisSpelling = settings.rastnevisSpelling ?? true;
    settings.rastnevisZwnj = settings.rastnevisZwnj ?? true;
    settings.rastnevisHints = settings.rastnevisHints ?? true;
    settings.rastnevisShowBadge = settings.rastnevisShowBadge ?? true;
    settings.rastnevisUnderline = settings.rastnevisUnderline ?? true;
  }

  settings.__version = STORAGE_VERSION;
  await chrome.storage.sync.set(settings);
  return settings;
}

// Counters used to live in sync storage, where frequent writes hit quota limits.
async function migrateLegacyStats(settings) {
  const carried = {};
  for (const key of LEGACY_STAT_KEYS) {
    const value = Number(settings[key]) || 0;
    if (value > 0) carried[key] = value;
    delete settings[key];
  }
  await chrome.storage.sync.remove(LEGACY_STAT_KEYS);

  if (Object.keys(carried).length === 0) return;
  const res = await chrome.storage.local.get(STATS_KEY);
  const stats = res[STATS_KEY] || {};
  for (const [key, value] of Object.entries(carried)) {
    stats[key] = (stats[key] || 0) + value;
  }
  await chrome.storage.local.set({ [STATS_KEY]: stats });
}

// ----------------------------------------------------------------------------
// Scheduled relationship scan
// ----------------------------------------------------------------------------

async function configureTrackerAlarm(settings) {
  await chrome.alarms.clear(TRACKER_ALARM_NAME);
  const interval = Number(settings.trackerCheckInterval);
  if (settings.trackerEnabled === false || !interval || interval <= 0) return;

  chrome.alarms.create(TRACKER_ALARM_NAME, {
    periodInMinutes: interval,
    delayInMinutes: 2,
  });
}

// Alarms are not guaranteed to survive a browser restart, so verify on startup.
async function ensureTrackerAlarm() {
  const settings = await loadSettings();
  const interval = Number(settings.trackerCheckInterval);
  const wanted = settings.trackerEnabled !== false && interval > 0;
  const existing = await chrome.alarms.get(TRACKER_ALARM_NAME);

  if (wanted && (!existing || existing.periodInMinutes !== interval)) {
    await configureTrackerAlarm(settings);
  } else if (!wanted && existing) {
    await chrome.alarms.clear(TRACKER_ALARM_NAME);
  }
}

async function applyBadge(count) {
  await chrome.action.setBadgeText({ text: count > 0 ? `-${count}` : '' });
  if (count > 0) {
    await chrome.action.setBadgeBackgroundColor({ color: '#f4212e' });
  }
}

// Prefer running inside an open X tab, where the page session is fully available.
async function runRelationshipScan() {
  const tabs = await chrome.tabs.query({ url: X_TAB_PATTERNS });
  for (const tab of tabs) {
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: 'XWISE_RUN_RELATIONSHIP_SYNC' });
      if (res?.success) return res.meta;
    } catch {
      // Tab has no content script; try the next one
    }
  }

  const tracker = globalThis.XWiseRelationshipTracker;
  if (!tracker) throw new Error('TRACKER_NOT_LOADED');
  await tracker.init();
  const categories = await tracker.sync();
  return {
    isInitialScan: categories.isInitialScan,
    newUnfollowerCount: categories.newUnfollowerCount,
  };
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== TRACKER_ALARM_NAME) return;

  try {
    const settings = await loadSettings();
    if (!settings.trackerEnabled) return;

    const meta = await runRelationshipScan();
    if (settings.trackerBadgeAlerts) {
      await applyBadge(meta?.newUnfollowerCount || 0);
    }
  } catch (err) {
    console.warn('[XWise] Scheduled scan skipped:', err.message);
  }
});

// ----------------------------------------------------------------------------
// Video download
// ----------------------------------------------------------------------------

async function downloadVideo({ tweetId, url, handle }) {
  let target = '';

  if (tweetId && globalThis.XWiseTwitterApi) {
    try {
      const variants = await globalThis.XWiseTwitterApi.fetchVideoVariants(tweetId);
      target = variants[0]?.url || '';
    } catch (err) {
      console.warn('[XWise] Video variant lookup failed:', err.message);
    }
  }

  if (!target && url && !String(url).startsWith('blob:')) {
    target = String(url);
  }

  let parsed = null;
  try {
    parsed = new URL(target);
  } catch {
    // Handled below
  }
  if (!parsed || parsed.protocol !== 'https:') {
    return { success: false, error: 'NO_DOWNLOADABLE_SOURCE' };
  }

  const safeHandle = String(handle || '').replace(/[^\w]/g, '');
  const name = ['xwise', safeHandle, tweetId || Date.now()].filter(Boolean).join('-');
  const downloadId = await chrome.downloads.download({
    url: parsed.href,
    filename: `XWise/${name}.mp4`,
    saveAs: false,
  });
  return { success: true, downloadId };
}

// ----------------------------------------------------------------------------
// Lifecycle
// ----------------------------------------------------------------------------

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.trackerCheckInterval || changes.trackerEnabled) {
    ensureTrackerAlarm().catch(() => {});
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
    await chrome.storage.local.set({ 'xwise.activityLog': [], [STATS_KEY]: {} });
    console.log('[XWise] Installed v3.5.0');
  } else if (details.reason === 'update') {
    await loadSettings();
    console.log('[XWise] Updated to v3.5.0');
  }
  await ensureTrackerAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  ensureTrackerAlarm().catch(() => {});
});

// ----------------------------------------------------------------------------
// Messaging
// ----------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const respondWith = (promise) => {
    promise.then(sendResponse).catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  };

  switch (message?.type) {
    case 'XWISE_GET_SETTINGS':
      return respondWith(loadSettings());

    case 'XWISE_GET_CACHE_STATS':
      return respondWith(
        globalThis.XWiseCache
          ? globalThis.XWiseCache.getStats()
          : Promise.resolve({ totalItems: 0, estimatedSizeKB: 0 })
      );

    case 'XWISE_CLEAR_CACHE':
      return respondWith(
        (async () => {
          if (globalThis.XWiseCache) await globalThis.XWiseCache.clear();
          const stats = globalThis.XWiseCache
            ? await globalThis.XWiseCache.getStats()
            : { totalItems: 0, estimatedSizeKB: 0 };
          return { success: true, stats };
        })()
      );

    case 'XWISE_SYNC_RELATIONSHIPS':
      return respondWith(runRelationshipScan().then((meta) => ({ success: true, meta })));

    case 'XWISE_CLEAR_BADGE':
      return respondWith(applyBadge(0).then(() => ({ success: true })));

    case 'XWISE_DOWNLOAD_VIDEO':
      return respondWith(downloadVideo(message));

    default:
      return false;
  }
});
