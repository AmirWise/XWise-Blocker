'use strict';

const DEFAULT_SETTINGS = {
  volumeSliderEnabled: true,
  blockButtonEnabled: true,
  shortcutEnabled: true,
  shortcutCtrl: true,
  shortcutAlt: true,
  shortcutShift: false,
  shortcutKey: 'b',
  confirmDelayOnShortcut: true,
  rememberVolume: true,
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // First install — set defaults + init block counter
    chrome.storage.sync.set({ ...DEFAULT_SETTINGS, blockCount: 0 });
  } else if (details.reason === 'update') {
    // On update — merge any new settings without overwriting user prefs
    chrome.storage.sync.get(null, (stored) => {
      const merged = {};
      for (const key in DEFAULT_SETTINGS) {
        if (!(key in stored)) {
          merged[key] = DEFAULT_SETTINGS[key];
        }
      }
      // Ensure blockCount exists
      if (!('blockCount' in stored)) {
        merged.blockCount = 0;
      }
      if (Object.keys(merged).length > 0) {
        chrome.storage.sync.set(merged);
      }
    });
  }
});
