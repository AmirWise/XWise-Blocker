'use strict';

/**
 * XWise Blocker v2 — background service worker
 * Handles settings migration, block count sync, and storage events
 */

const STORAGE_VERSION = 2;
const SETTINGS_KEY = 'xwise.settings';
const BLOCK_COUNT_KEY = 'xwise.blockCount';
const LAST_VOLUME_KEY = 'xwise.lastVolume';

const DEFAULT_SETTINGS = {
  // Existing v1 features
  volumeSliderEnabled: true,
  rememberVolume: true,
  blockButtonEnabled: true,
  shortcutEnabled: true,
  shortcutCtrl: true,
  shortcutAlt: true,
  shortcutShift: false,
  shortcutKey: 'b',
  confirmDelayOnShortcut: true,

  // New v2 filter engine
  filterEngineEnabled: true,
  filterMode: 'dry-run', // 'dry-run' | 'auto-block'
  filterScopes: {
    displayName: true,
    bio: true,
    tweetText: false,
  },
  filters: [], // Array of {id, pattern, type: 'keyword'|'emoji'|'regex', enabled: true}
  filterCaseSensitive: false,
  filterWholeWord: false,

  // UI / behavior
  showMatchBadges: true,
  badgeStyle: 'subtle', // 'subtle' | 'prominent'
  language: 'en', // 'en' | 'fa'
  showBlockToasts: true,
};

async function loadSettings() {
  const stored = await chrome.storage.sync.get([SETTINGS_KEY, BLOCK_COUNT_KEY, LAST_VOLUME_KEY]);
  const settings = stored[SETTINGS_KEY] || {};
  const version = settings.__version || 1;

  if (version < STORAGE_VERSION) {
    await migrateSettings(settings, version);
  }

  return { ...DEFAULT_SETTINGS, ...settings, __version: STORAGE_VERSION };
}

async function migrateSettings(settings, fromVersion) {
  console.log(`[XWise] Migrating settings from v${fromVersion} to v${STORAGE_VERSION}`);

  // v1 -> v2: add new filter engine defaults, preserve existing settings
  if (fromVersion < 2) {
    settings.filterEngineEnabled = true;
    settings.filterMode = 'dry-run';
    settings.filterScopes = { displayName: true, bio: true, tweetText: false };
    settings.filters = [];
    settings.filterCaseSensitive = false;
    settings.filterWholeWord = false;
    settings.showMatchBadges = true;
    settings.badgeStyle = 'subtle';
    settings.language = 'en';
  }

  settings.__version = STORAGE_VERSION;
  await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
}

async function saveSettings(partial) {
  const current = await loadSettings();
  const merged = { ...current, ...partial };
  await chrome.storage.sync.set({ [SETTINGS_KEY]: merged });
  return merged;
}

async function incrementBlockCount() {
  const current = await loadSettings();
  const count = (current.blockCount || 0) + 1;
  await chrome.storage.sync.set({ [SETTINGS_KEY]: { ...current, blockCount: count } });
  return count;
}

async function getBlockCount() {
  const settings = await loadSettings();
  return settings.blockCount || 0;
}

async function saveLastVolume(v) {
  await chrome.storage.sync.set({ [LAST_VOLUME_KEY]: v });
}

async function getLastVolume() {
  const stored = await chrome.storage.sync.get(LAST_VOLUME_KEY);
  return stored[LAST_VOLUME_KEY] ?? 1;
}

// Listen for settings changes and broadcast to content scripts
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'sync') return;
  if (changes[SETTINGS_KEY]) {
    // Broadcast to all tabs
    const tabs = await chrome.tabs.query({ url: ['*://*.x.com/*', '*://*.twitter.com/*'] });
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'XWISE_SETTINGS_CHANGED',
          settings: changes[SETTINGS_KEY].newValue,
        });
      } catch (e) {
        // Tab might not have content script loaded
      }
    }
  }
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.sync.set({
      [SETTINGS_KEY]: { ...DEFAULT_SETTINGS, __version: STORAGE_VERSION, blockCount: 0 },
      [BLOCK_COUNT_KEY]: 0,
      [LAST_VOLUME_KEY]: 1,
    });
    console.log('[XWise] Installed v2.0.0 with default settings');
  } else if (details.reason === 'update') {
    // Migration handled lazily on loadSettings()
    console.log('[XWise] Updated, migration will run on next load');
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'XWISE_GET_SETTINGS') {
    loadSettings().then(sendResponse);
    return true;
  }
  if (message.type === 'XWISE_INCREMENT_BLOCK') {
    incrementBlockCount().then(sendResponse);
    return true;
  }
  if (message.type === 'XWISE_GET_BLOCK_COUNT') {
    getBlockCount().then(sendResponse);
    return true;
  }
  if (message.type === 'XWISE_SAVE_VOLUME') {
    saveLastVolume(message.volume).then(sendResponse);
    return true;
  }
  if (message.type === 'XWISE_GET_VOLUME') {
    getLastVolume().then(sendResponse);
    return true;
  }
  return false;
});