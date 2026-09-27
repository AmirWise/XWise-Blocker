'use strict';

/**
 * XWise Blocker v3.0.0 — Background Service Worker
 * Handles unified storage migration to v5, media download automation,
 * cross-tab synchronization, periodic relationship tracking, and runtime messaging.
 */

import './modules/cache.js';
import './modules/twitterApi.js';
import './modules/relationshipTracker.js';

const STORAGE_VERSION = 5;
const TRACKER_ALARM_NAME = 'xwise_periodic_tracker';

const DEFAULT_SETTINGS = {
  __version: STORAGE_VERSION,

  // Relationship Tracker & Manager (New in v3.0.0 Masterpiece)
  trackerEnabled: true,
  trackerCheckInterval: 240, // 4 hours in minutes (0 = off, 120, 240, 720, 1440)
  trackerBadgeAlerts: true,
  trackerLastCheck: null,

  // Video Suite
  volumeSliderEnabled: true,
  rememberVolume: true,
  lastVolume: 1,
  defaultPlaybackRate: 1,
  videoLoopEnabled: false,
  videoDownloadEnabled: true,

  // Timeline & UI Cleaner
  cleanTimelineEnabled: true,
  hideWhoToFollow: true,       // Hide "Who to follow" & connect modules
  hideProfileWhoToFollow: true,// Hide "Who to follow" & relevant people on profiles
  hideGrokDrawer: true,        // Hide Grok sidebar and prompts
  hidePremiumUpsell: true,     // Hide "Subscribe to Premium" boxes
  hideViewCounts: false,       // Hide view counts on tweets
  zenModeEnabled: false,       // Focus / Zen reader mode (hide sidebars)
  scrollToTopEnabled: true,    // Smooth floating scroll to top button
  highResImagesEnabled: true,  // Automatically load high-res images

  // Smart Filter Engine
  filterEngineEnabled: true,
  filterMode: 'hide', // 'dry-run' | 'hide' | 'auto-mute' | 'auto-block'
  filterScopes: {
    displayName: true,
    bio: true,
    tweetText: false,
  },
  filters: [], // Array of { id, pattern, action: 'default'|'dry-run'|'hide'|'mute'|'block', isRegex: boolean, enabled: true, createdAt }
  filterCaseSensitive: false,
  filterWholeWord: false,

  // Anti-Spam & Bot Detection
  filterDefaultAvatars: false, // Filter default egg avatars
  filterEngagementBait: false, // Filter obvious engagement bait

  // Ad Cleaner
  adBlockerEnabled: true,

  // Blue Checkmark / Premium Account Filter
  blueCheckFilter: 'off', // 'off' | 'replies-only' | 'all'
  blueCheckAction: 'hide', // 'hide' | 'mute' | 'block'

  // Whitelist / Safe List
  whitelist: [],

  // Manual Block, Shortcut & Quick Menu
  blockButtonEnabled: true,
  quickMenuEnabled: true, // XWise quick action menu on tweets
  shortcutEnabled: true,
  shortcutCtrl: true,
  shortcutAlt: true,
  shortcutShift: false,
  shortcutKey: 'b',
  confirmDelayOnShortcut: true,

  // UI & Display
  showMatchBadges: true,
  badgeStyle: 'subtle',
  language: 'fa', // 'fa' | 'en'
  showBlockToasts: true,

  // Statistics
  blockCount: 0,
  filterBlockCount: 0,
  muteCount: 0,
  hideCount: 0,
  adBlockCount: 0,
  blueCheckCount: 0,
  dryRunMatchCount: 0,
  cleanerCount: 0,
};

/**
 * Loads and migrates settings to schema version 5
 */
async function loadSettings() {
  const stored = await chrome.storage.sync.get(null);
  let current = { ...stored };
  let version = current.__version || 0;

  // Handle legacy nested 'xwise.settings' if present
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

/**
 * Migrates settings sequentially across versions
 */
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
    settings.muteCount = settings.muteCount || 0;
    settings.hideCount = settings.hideCount || 0;
    settings.adBlockCount = settings.adBlockCount || 0;
    settings.blueCheckCount = settings.blueCheckCount || 0;
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
    settings.cleanerCount = settings.cleanerCount || 0;

    if (Array.isArray(settings.filters)) {
      settings.filters = settings.filters.map((f) => ({
        ...f,
        isRegex: f.isRegex ?? (typeof f.pattern === 'string' && f.pattern.startsWith('/') && f.pattern.lastIndexOf('/') > 0),
      }));
    }
  }

  if (fromVersion < 5) {
    // v3.0.0 Masterpiece Upgrade
    settings.trackerEnabled = settings.trackerEnabled ?? true;
    settings.trackerCheckInterval = settings.trackerCheckInterval ?? 240;
    settings.trackerBadgeAlerts = settings.trackerBadgeAlerts ?? true;
    settings.trackerLastCheck = null;
  }

  settings.__version = STORAGE_VERSION;
  await chrome.storage.sync.set(settings);
  return settings;
}

/**
 * Configure recurring background alarm for relationship tracking
 */
async function configureTrackerAlarm(intervalMinutes) {
  if (typeof chrome.alarms === 'undefined') return;

  await chrome.alarms.clear(TRACKER_ALARM_NAME);
  if (intervalMinutes && intervalMinutes > 0) {
    chrome.alarms.create(TRACKER_ALARM_NAME, {
      periodInMinutes: Number(intervalMinutes),
      delayInMinutes: 2, // Initial run shortly after startup
    });
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === TRACKER_ALARM_NAME) {
    try {
      const s = await loadSettings();
      if (s.trackerEnabled && globalThis.XWiseRelationshipTracker) {
        await globalThis.XWiseRelationshipTracker.init();
        await globalThis.XWiseRelationshipTracker.sync();
        await chrome.storage.sync.set({ trackerLastCheck: Date.now() });
      }
    } catch (err) {
      console.warn('[XWise] Tracker alarm cycle skipped:', err.message);
    }
  }
});

/**
 * Listen for storage changes and broadcast to tabs
 */
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'sync') return;

  if (changes.trackerCheckInterval) {
    await configureTrackerAlarm(changes.trackerCheckInterval.newValue);
  }

  const tabs = await chrome.tabs.query({ url: ['*://*.x.com/*', '*://*.twitter.com/*'] });
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'XWISE_SETTINGS_CHANGED',
        changes,
      });
    } catch {
      // Content script may not be active
    }
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
    await chrome.storage.local.set({ 'xwise.activityLog': [] });
    await configureTrackerAlarm(DEFAULT_SETTINGS.trackerCheckInterval);
    console.log('[XWise] Fresh installation of v3.0.0 Masterpiece initialized');
  } else if (details.reason === 'update') {
    const s = await loadSettings();
    await configureTrackerAlarm(s.trackerCheckInterval);
    console.log('[XWise] Upgraded to v3.0.0 Masterpiece, storage & alarms verified');
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Settings operations
  if (message.type === 'XWISE_GET_SETTINGS') {
    loadSettings().then(sendResponse);
    return true;
  }

  if (message.type === 'XWISE_SAVE_SETTINGS') {
    const settingsToSave = { ...message.settings, __version: STORAGE_VERSION };
    chrome.storage.sync.set(settingsToSave).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  // Cache operations
  if (message.type === 'XWISE_GET_CACHE_STATS') {
    if (globalThis.XWiseCache) {
      globalThis.XWiseCache.getStats().then(sendResponse);
      return true;
    }
    sendResponse({ totalItems: 0, estimatedSizeKB: 0 });
    return false;
  }

  if (message.type === 'XWISE_CLEAR_CACHE') {
    if (globalThis.XWiseCache) {
      globalThis.XWiseCache.clear().then(async () => {
        const stats = await globalThis.XWiseCache.getStats();
        sendResponse({ success: true, stats });
      });
      return true;
    }
    sendResponse({ success: true });
    return false;
  }

  // Relationship Tracker operations
  if (message.type === 'XWISE_SYNC_RELATIONSHIPS') {
    if (globalThis.XWiseRelationshipTracker) {
      globalThis.XWiseRelationshipTracker.sync()
        .then((categories) => {
          chrome.storage.sync.set({ trackerLastCheck: Date.now() });
          sendResponse({ success: true, categories });
        })
        .catch((err) => {
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }
    sendResponse({ success: false, error: 'Tracker not initialized' });
    return false;
  }

  if (message.type === 'XWISE_CLEAR_BADGE') {
    if (chrome.action && chrome.action.setBadgeText) {
      chrome.action.setBadgeText({ text: '' });
    }
    sendResponse({ success: true });
    return false;
  }

  // Video download
  if (message.type === 'XWISE_DOWNLOAD_VIDEO') {
    if (chrome.downloads && message.url) {
      const filename = message.filename || `xwise-video-${Date.now()}.mp4`;
      chrome.downloads.download(
        {
          url: message.url,
          filename,
          saveAs: false,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true, downloadId });
          }
        }
      );
      return true;
    } else {
      sendResponse({ success: false, error: 'Downloads API unavailable' });
      return false;
    }
  }

  return false;
});
