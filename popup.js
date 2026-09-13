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

const els = {
  volumeSliderEnabled: document.getElementById('volumeSliderEnabled'),
  rememberVolume: document.getElementById('rememberVolume'),
  blockButtonEnabled: document.getElementById('blockButtonEnabled'),
  shortcutEnabled: document.getElementById('shortcutEnabled'),
  confirmDelayOnShortcut: document.getElementById('confirmDelayOnShortcut'),
  shortcutKey: document.getElementById('shortcutKey'),
  kbdCtrl: document.getElementById('kbdCtrl'),
  kbdAlt: document.getElementById('kbdAlt'),
  kbdShift: document.getElementById('kbdShift'),
  shortcutRow: document.getElementById('shortcutRow'),
  statusMsg: document.getElementById('statusMsg'),
  blockCountDisplay: document.getElementById('blockCountDisplay'),
};

let settings = { ...DEFAULT_SETTINGS };
let statusTimer = null;

function render() {
  els.volumeSliderEnabled.checked = settings.volumeSliderEnabled;
  els.rememberVolume.checked = settings.rememberVolume;
  els.blockButtonEnabled.checked = settings.blockButtonEnabled;
  els.shortcutEnabled.checked = settings.shortcutEnabled;
  els.confirmDelayOnShortcut.checked = settings.confirmDelayOnShortcut;
  els.shortcutKey.value = settings.shortcutKey.toUpperCase();
  els.kbdCtrl.classList.toggle('xe-kbd-active', settings.shortcutCtrl);
  els.kbdAlt.classList.toggle('xe-kbd-active', settings.shortcutAlt);
  els.kbdShift.classList.toggle('xe-kbd-active', settings.shortcutShift);

  // Show/hide shortcut row based on shortcut toggle
  if (els.shortcutRow) {
    els.shortcutRow.style.display = settings.shortcutEnabled ? 'flex' : 'none';
  }
}

function flash(msg) {
  els.statusMsg.textContent = msg;
  els.statusMsg.style.opacity = '1';
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    els.statusMsg.style.opacity = '0';
    setTimeout(() => { els.statusMsg.textContent = ''; }, 200);
  }, 1200);
}

function save(partial) {
  settings = { ...settings, ...partial };
  chrome.storage.sync.set(partial, () => {
    flash('Saved');
  });
  render();
}

// Load settings + block count
chrome.storage.sync.get({ ...DEFAULT_SETTINGS, blockCount: 0 }, (stored) => {
  settings = { ...DEFAULT_SETTINGS, ...stored };
  render();

  // Display block count
  const count = stored.blockCount || 0;
  if (els.blockCountDisplay) {
    els.blockCountDisplay.textContent = count.toLocaleString();
  }
});

// Listen for live changes (e.g., block count updates from content script)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.blockCount && els.blockCountDisplay) {
    els.blockCountDisplay.textContent = (changes.blockCount.newValue || 0).toLocaleString();
  }
});

// Toggle listeners
els.volumeSliderEnabled.addEventListener('change', (e) => save({ volumeSliderEnabled: e.target.checked }));
els.rememberVolume.addEventListener('change', (e) => save({ rememberVolume: e.target.checked }));
els.blockButtonEnabled.addEventListener('change', (e) => save({ blockButtonEnabled: e.target.checked }));
els.shortcutEnabled.addEventListener('change', (e) => save({ shortcutEnabled: e.target.checked }));
els.confirmDelayOnShortcut.addEventListener('change', (e) => save({ confirmDelayOnShortcut: e.target.checked }));

// Shortcut modifier toggles
els.kbdCtrl.addEventListener('click', () => save({ shortcutCtrl: !settings.shortcutCtrl }));
els.kbdAlt.addEventListener('click', () => save({ shortcutAlt: !settings.shortcutAlt }));
els.kbdShift.addEventListener('click', () => save({ shortcutShift: !settings.shortcutShift }));

// Key input
els.shortcutKey.addEventListener('input', (e) => {
  const v = (e.target.value || 'b').slice(-1).toLowerCase();
  e.target.value = v.toUpperCase();
  save({ shortcutKey: v });
});

// Select all on focus for easy replacement
els.shortcutKey.addEventListener('focus', () => {
  els.shortcutKey.select();
});
