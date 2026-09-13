'use strict';

/**
 * XWise Blocker v1 — content script
 *
 * Features:
 *  - Per-video volume sliders (remembers across videos)
 *  - Inline "Block" button on every tweet (matches Twitter's native UI)
 *  - Configurable keyboard shortcut to block hovered tweets
 *
 * Performance:
 *  - Scoped scanning (only scan added nodes, not the whole document)
 *  - WeakSet tracking to avoid reprocessing
 *  - requestIdleCallback for non-urgent work
 *  - Batched DOM mutations
 *  - Single passive mouseover listener
 *
 * Design:
 *  - Detects Twitter's light / dark / dim theme and adapts
 *  - Block button matches native Twitter action-bar buttons exactly
 *  - Toast matches Twitter's native snackbar
 */

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

let settings = { ...DEFAULT_SETTINGS };
let lastVolume = 1;
let blockCount = 0;

// Track processed elements — WeakSets let GC reclaim removed DOM nodes
const processedVideos = new WeakSet();
const processedTweets = new WeakSet();

// ---------------------------------------------------------------------
// Theme detection — Twitter uses a data-* attribute on <html> or
// background-color on <body> to distinguish light / dark / dim.
// We detect once and observe for changes.
// ---------------------------------------------------------------------
let currentTheme = 'dark'; // 'light' | 'dark' | 'dim'

function detectTheme() {
  const bg = getComputedStyle(document.body).backgroundColor;
  const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 'dark';
  const [, r, g, b] = match.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  if (luminance > 200) return 'light';
  if (luminance > 40)  return 'dim';
  return 'dark';
}

function applyTheme() {
  const theme = detectTheme();
  if (theme !== currentTheme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-xe-theme', theme);
  }
}

// ---------------------------------------------------------------------
// Settings: load once, then stay in sync live.
// ---------------------------------------------------------------------
function loadSettings() {
  return new Promise((resolve) => {
    if (!chrome?.storage?.sync) { resolve(settings); return; }
    chrome.storage.sync.get({ ...DEFAULT_SETTINGS, blockCount: 0 }, (stored) => {
      settings = { ...DEFAULT_SETTINGS, ...stored };
      blockCount = stored.blockCount || 0;
      if (stored.lastVolume !== undefined) lastVolume = stored.lastVolume;
      resolve(settings);
    });
  });
}

chrome.storage?.onChanged?.addListener((changes, area) => {
  if (area !== 'sync') return;
  for (const key in changes) {
    if (key in settings) settings[key] = changes[key].newValue;
  }
});

function saveVolume(v) {
  lastVolume = v;
  if (settings.rememberVolume && chrome?.storage?.sync) {
    chrome.storage.sync.set({ lastVolume: v });
  }
}

function incrementBlockCount() {
  blockCount++;
  if (chrome?.storage?.sync) {
    chrome.storage.sync.set({ blockCount });
  }
}

// ---------------------------------------------------------------------
// Toast feedback — styled to match Twitter's native snackbar
// ---------------------------------------------------------------------
let toastContainer = null;

function ensureToastContainer() {
  if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
  toastContainer = document.createElement('div');
  toastContainer.className = 'xe-toast-container';
  document.body.appendChild(toastContainer);
  return toastContainer;
}

function showToast(message, { duration = 2500, action, onAction } = {}) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = 'xe-toast';

  const text = document.createElement('span');
  text.className = 'xe-toast-text';
  text.textContent = message;
  toast.appendChild(text);

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    toast.classList.remove('xe-toast-in');
    toast.classList.add('xe-toast-out');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // Fallback for missed transitionend
    setTimeout(() => toast.remove(), 300);
  };

  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = action;
    btn.className = 'xe-toast-action';
    btn.addEventListener('click', () => {
      onAction?.();
      remove();
    });
    toast.appendChild(btn);
  }

  container.appendChild(toast);
  // Force reflow then animate in
  toast.offsetHeight;
  requestAnimationFrame(() => toast.classList.add('xe-toast-in'));
  const timer = setTimeout(remove, duration);
  return { cancel: () => { clearTimeout(timer); remove(); } };
}

// ---------------------------------------------------------------------
// "Wait for element" helper — MutationObserver-based, replaces fragile
// setTimeout chains.
// ---------------------------------------------------------------------
function waitFor(root, matcher, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const test = () => {
      if (typeof matcher === 'string') return root.querySelector(matcher);
      for (const node of root.querySelectorAll('[role="menuitem"]')) {
        if (matcher(node)) return node;
      }
      return null;
    };

    const existing = test();
    if (existing) { resolve(existing); return; }

    const observer = new MutationObserver(() => {
      const match = test();
      if (match) {
        cleanup();
        resolve(match);
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    const timer = setTimeout(() => { cleanup(); resolve(null); }, timeoutMs);

    function cleanup() {
      observer.disconnect();
      clearTimeout(timer);
    }
  });
}

// ---------------------------------------------------------------------
// Multi-language block detection
// ---------------------------------------------------------------------
const BLOCK_KEYWORDS = [
  'block', 'مسدود', 'bloquear', 'bloquer', 'blockieren', 'blocca',
  'блокировать', '屏蔽', 'ブロック', 'حظر', 'chặn', 'blokir', 'blokkeren',
  'blokuj', 'engella', '차단',
];
const UNBLOCK_KEYWORDS = [
  'unblock', 'رفع مسدودی', 'لغو مسدود', 'desbloquear', 'débloquer',
  'entsperren', 'sblocca', 'разблокировать', '取消屏蔽', 'ブロック解除',
  'إلغاء الحظر', 'buka blokir', 'odblokuj', 'engeli kaldır', '차단 해제',
];

function isBlockMenuItem(node) {
  const text = node.textContent.trim().toLowerCase();
  if (!text) return false;
  if (UNBLOCK_KEYWORDS.some((k) => text.includes(k))) return false;
  return BLOCK_KEYWORDS.some((k) => text.includes(k));
}

// ---------------------------------------------------------------------
// Core blocking flow
// ---------------------------------------------------------------------
function getHandleFromTweet(tweetNode) {
  const link = tweetNode.querySelector('[data-testid="User-Name"] a[role="link"]');
  const href = link?.getAttribute('href') || '';
  return href.startsWith('/') ? href.slice(1).split('/')[0] : (href || 'user');
}

async function performBlock(tweetNode, { requireConfirmDelay = false } = {}) {
  const handle = getHandleFromTweet(tweetNode);

  const moreBtn = tweetNode.querySelector('[data-testid="caret"], [aria-label="More" i]');
  if (!moreBtn) {
    showToast(`Couldn't find the menu for @${handle}`);
    return;
  }
  moreBtn.click();

  const menuItem = await waitFor(document, isBlockMenuItem, 2000);
  if (!menuItem) {
    showToast(`Couldn't find a block option for @${handle}`);
    document.body.click();
    return;
  }
  menuItem.click();

  const confirmBtn = await waitFor(document, '[data-testid="confirmationSheetConfirm"]', 2000);
  if (!confirmBtn) {
    showToast(`Block confirmation didn't appear for @${handle}`);
    return;
  }

  if (requireConfirmDelay && settings.confirmDelayOnShortcut) {
    let cancelled = false;
    showToast(`Blocking @${handle}...`, {
      duration: 2200,
      action: 'Cancel',
      onAction: () => { cancelled = true; },
    });
    await new Promise((r) => setTimeout(r, 2200));
    if (cancelled) {
      document.querySelector('[data-testid="confirmationSheetCancel"]')?.click();
      return;
    }
  }

  confirmBtn.click();
  incrementBlockCount();
  showToast(`Blocked @${handle}`);
}

// ---------------------------------------------------------------------
// Feature 1: Volume sliders — minimal, auto-hiding, on each video
// ---------------------------------------------------------------------
function createVolumeSlider(video) {
  if (processedVideos.has(video)) return;
  processedVideos.add(video);

  if (settings.rememberVolume) video.volume = lastVolume;

  const parent = video.closest('[data-testid="videoPlayer"]') || video.parentElement;
  if (!parent) return;
  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'xe-volume-wrapper';

  const icon = document.createElement('button');
  icon.type = 'button';
  icon.className = 'xe-volume-icon';
  icon.setAttribute('aria-label', 'Toggle mute');

  const track = document.createElement('div');
  track.className = 'xe-volume-track';

  const fill = document.createElement('div');
  fill.className = 'xe-volume-fill';

  const thumb = document.createElement('div');
  thumb.className = 'xe-volume-thumb';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '1';
  slider.step = '0.02';
  slider.value = String(video.volume);
  slider.className = 'xe-volume-range';
  slider.setAttribute('aria-label', 'Volume');

  track.appendChild(fill);
  track.appendChild(thumb);

  const updateVisuals = (v) => {
    const pct = v * 100;
    fill.style.width = pct + '%';
    thumb.style.left = pct + '%';
    if (v === 0) {
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/></svg>';
    } else if (v < 0.5) {
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M18.5 12A4.5 4.5 0 0016 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>';
    } else {
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
    }
  };
  updateVisuals(video.volume);

  slider.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    video.volume = v;
    video.muted = v === 0;
    saveVolume(v);
    updateVisuals(v);
  });

  // Prevent video interactions when using slider
  const stopProp = (e) => e.stopPropagation();
  slider.addEventListener('mousedown', stopProp);
  slider.addEventListener('pointerdown', stopProp);
  slider.addEventListener('click', stopProp);

  // Toggle mute on icon click
  icon.addEventListener('click', (e) => {
    e.stopPropagation();
    if (video.volume > 0 && !video.muted) {
      video.muted = true;
      video.volume = 0;
      slider.value = '0';
      updateVisuals(0);
    } else {
      const restoreVol = lastVolume > 0 ? lastVolume : 0.5;
      video.muted = false;
      video.volume = restoreVol;
      slider.value = String(restoreVol);
      saveVolume(restoreVol);
      updateVisuals(restoreVol);
    }
  });

  wrapper.appendChild(icon);
  wrapper.appendChild(track);
  wrapper.appendChild(slider);
  parent.appendChild(wrapper);
}

function addVolumeSliders(root = document) {
  if (!settings.volumeSliderEnabled) return;
  const videos = root.querySelectorAll('video');
  for (let i = 0; i < videos.length; i++) {
    createVolumeSlider(videos[i]);
  }
}

// ---------------------------------------------------------------------
// Feature 2: Inline block button — matches Twitter's native action bar
// Uses the same icon size, color, hover behavior as reply/retweet/like
// ---------------------------------------------------------------------
function createBlockButton(tweet) {
  if (processedTweets.has(tweet)) return;
  processedTweets.add(tweet);

  const actionBar = tweet.querySelector('[role="group"]');
  if (!actionBar) return;

  // Don't add if tweet is by the logged-in user (optional)
  const btn = document.createElement('div');
  btn.className = 'xe-block-btn-wrapper';
  btn.setAttribute('role', 'button');
  btn.setAttribute('tabindex', '0');
  btn.setAttribute('aria-label', 'Block this user');

  btn.innerHTML = `
    <div class="xe-block-btn-inner">
      <div class="xe-block-btn-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3.75c-4.55 0-8.25 3.69-8.25 8.25 0 4.55 3.7 8.25 8.25 8.25 4.56 0 8.25-3.7 8.25-8.25 0-4.56-3.69-8.25-8.25-8.25zM2.25 12c0-5.38 4.37-9.75 9.75-9.75s9.75 4.37 9.75 9.75-4.37 9.75-9.75 9.75S2.25 17.38 2.25 12zm4.73-5.02a.75.75 0 011.06 0l9.98 9.98a.75.75 0 01-1.06 1.06l-9.98-9.98a.75.75 0 010-1.06z"/>
        </svg>
      </div>
    </div>
  `;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    performBlock(tweet, { requireConfirmDelay: false });
  });

  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      performBlock(tweet, { requireConfirmDelay: false });
    }
  });

  actionBar.appendChild(btn);
}

function addBlockButtons(root = document) {
  if (!settings.blockButtonEnabled) return;
  const articles = root.querySelectorAll('article');
  for (let i = 0; i < articles.length; i++) {
    createBlockButton(articles[i]);
  }
}

// ---------------------------------------------------------------------
// Scoped scanning — only process newly added subtrees, not the full DOM
// Uses requestIdleCallback when available for non-blocking work
// ---------------------------------------------------------------------
const pendingRoots = new Set();
let scanScheduled = false;

function flushScan() {
  scanScheduled = false;
  const roots = [...pendingRoots];
  pendingRoots.clear();

  for (const root of roots) {
    if (!root.isConnected) continue;
    addVolumeSliders(root);
    addBlockButtons(root);
  }
}

function scheduleScan(root) {
  pendingRoots.add(root || document);
  if (scanScheduled) return;
  scanScheduled = true;

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => flushScan(), { timeout: 200 });
  } else {
    setTimeout(flushScan, 100);
  }
}

const domObserver = new MutationObserver((mutations) => {
  let shouldScan = false;
  for (let i = 0; i < mutations.length; i++) {
    const m = mutations[i];
    if (m.addedNodes.length > 0) {
      for (let j = 0; j < m.addedNodes.length; j++) {
        const node = m.addedNodes[j];
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Only scan subtrees that could contain tweets or videos
          if (node.querySelector?.('article, video') ||
              node.matches?.('article') ||
              node.tagName === 'VIDEO') {
            pendingRoots.add(node);
            shouldScan = true;
          }
        }
      }
    }
  }
  if (shouldScan) {
    if (!scanScheduled) {
      scanScheduled = true;
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => flushScan(), { timeout: 200 });
      } else {
        setTimeout(flushScan, 100);
      }
    }
  }
});

// ---------------------------------------------------------------------
// Feature 3: Keyboard shortcut — block hovered tweet
// Default: Ctrl+Alt+B. Fully remappable from popup.
// Cancel toast guards against accidental triggers.
// ---------------------------------------------------------------------
let hoveredElement = null;
document.addEventListener('mouseover', (e) => { hoveredElement = e.target; }, { passive: true });

document.addEventListener('keydown', (e) => {
  if (!settings.shortcutEnabled) return;

  // Don't fire in text inputs
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
  // Also skip [role="textbox"] (Twitter's compose area)
  if (e.target.getAttribute('role') === 'textbox') return;

  const key = e.key.toLowerCase();
  const matches =
    key === settings.shortcutKey &&
    e.ctrlKey === !!settings.shortcutCtrl &&
    e.altKey === !!settings.shortcutAlt &&
    e.shiftKey === !!settings.shortcutShift;
  if (!matches) return;
  if (!hoveredElement) return;

  const tweet = hoveredElement.closest('article');
  if (!tweet) return;

  e.preventDefault();
  e.stopPropagation();
  performBlock(tweet, { requireConfirmDelay: true });
});

// ---------------------------------------------------------------------
// Theme observer — watches for Twitter theme changes
// ---------------------------------------------------------------------
const themeObserver = new MutationObserver(() => {
  requestAnimationFrame(applyTheme);
});

// ---------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------
(async function init() {
  await loadSettings();
  applyTheme();

  // Initial full scan
  addVolumeSliders();
  addBlockButtons();

  // Observe for new content
  domObserver.observe(document.body, { childList: true, subtree: true });

  // Observe theme changes (Twitter changes body bg or html attributes)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });
})();
