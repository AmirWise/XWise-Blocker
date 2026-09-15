'use strict';

/**
 * XWise Blocker v2.0.0 — Content Script
 *
 * Core Capabilities:
 *  1. Per-video volume sliders with memory across timeline videos
 *  2. Native-matching inline Block button on every tweet
 *  3. Configurable keyboard shortcut to block hovered tweets
 *  4. NEW v2: Advanced Unicode-aware Filter Engine
 *     - Comprehensive emoji handling (sequences, flags, skin-tones, ZWJ)
 *     - Clean case-insensitive and whole-word keyword matching
 *     - Dry-Run preview mode (subtle inline pill badge, zero UI breakage)
 *     - Auto-Block mode (multi-language automated native block sequence)
 *     - Targeted Scopes: Display Name and Bio by default (tweet text optional)
 *  5. Local Vazirmatn font injection & adaptive theme matching (Light / Dark / Dim)
 *  6. High-performance scoped DOM scanning (MutationObserver + requestIdleCallback)
 */

// ============================================================================
// Defaults & State
// ============================================================================

const DEFAULT_SETTINGS = {
  // v1 Features
  volumeSliderEnabled: true,
  blockButtonEnabled: true,
  shortcutEnabled: true,
  shortcutCtrl: true,
  shortcutAlt: true,
  shortcutShift: false,
  shortcutKey: 'b',
  confirmDelayOnShortcut: true,
  rememberVolume: true,

  // v2 Filter Engine
  filterEngineEnabled: true,
  filterMode: 'dry-run', // 'dry-run' | 'auto-block'
  filterScopes: {
    displayName: true,
    bio: true,
    tweetText: false, // Default false to prevent accidental false positives
  },
  filters: [], // Array of { id, pattern, enabled, createdAt }
  filterCaseSensitive: false,
  filterWholeWord: false,
  showMatchBadges: true,
  badgeStyle: 'subtle',
  language: 'fa',
  showBlockToasts: true,
};

let settings = { ...DEFAULT_SETTINGS };
let lastVolume = 1;
let currentTheme = 'dark';

// Element tracking to avoid reprocessing (WeakSet allows garbage collection)
const processedVideos = new WeakSet();
const processedTweets = new WeakSet();
const scannedTweetNodes = new WeakSet();

// Cache user bios discovered from DOM / hovercards / profile headers
const userBioCache = new Map();

// ============================================================================
// Anti-Spam: Single Toast Controller + Handle Tracking + Block Queue
// ============================================================================

// Single active toast reference (replaces instead of stacking)
let toastContainer = null;
let currentToast = null;

// Track blocked handles to prevent duplicate blocks/toasts per session
const blockedHandles = new Set();

// Track in-progress blocks to prevent race conditions
const inProgressHandles = new Set();

// Sequential block queue to prevent DOM race conditions on X's menus
const blockQueue = [];
let isProcessingQueue = false;

/**
 * Enqueue a block operation to run sequentially
 */
async function enqueueBlock(tweetNode, options = {}) {
  return new Promise((resolve) => {
    blockQueue.push({ tweetNode, options, resolve });
    processBlockQueue();
  });
}

/**
 * Process the block queue one at a time
 */
async function processBlockQueue() {
  if (isProcessingQueue || blockQueue.length === 0) return;
  isProcessingQueue = true;

  while (blockQueue.length > 0) {
    const { tweetNode, options, resolve } = blockQueue.shift();
    try {
      const result = await performBlockInternal(tweetNode, options);
      resolve(result);
    } catch (err) {
      console.error('[XWise] Block queue error:', err);
      resolve(false);
    }
    // Small delay between blocks to let X's UI settle
    await new Promise(r => setTimeout(r, 300));
  }

  isProcessingQueue = false;
}

/**
 * Internal block logic without queue wrapping
 */
async function performBlockInternal(tweetNode, { requireConfirmDelay = false, source = 'manual' } = {}) {
  const handle = getHandleFromTweet(tweetNode);

  // Prevent duplicate blocks for same handle
  if (blockedHandles.has(handle) || inProgressHandles.has(handle)) {
    return false;
  }
  inProgressHandles.add(handle);

  const moreBtn = tweetNode.querySelector('[data-testid="caret"], [aria-label="More" i]');
  if (!moreBtn) {
    if (source === 'manual') showToast(`منوی کاربر @${handle} پیدا نشد`);
    inProgressHandles.delete(handle);
    return false;
  }
  moreBtn.click();

  const menuItem = await waitFor(document, isBlockMenuItem, 2000);
  if (!menuItem) {
    if (source === 'manual') showToast(`گزینه مسدودسازی برای @${handle} یافت نشد`);
    document.body.click();
    inProgressHandles.delete(handle);
    return false;
  }
  menuItem.click();

  const confirmBtn = await waitFor(document, '[data-testid="confirmationSheetConfirm"]', 2000);
  if (!confirmBtn) {
    if (source === 'manual') showToast(`پنجره تایید مسدودسازی نمایش داده نشد`);
    inProgressHandles.delete(handle);
    return false;
  }

  if (requireConfirmDelay && settings.confirmDelayOnShortcut) {
    let cancelled = false;
    showToast(`در حال مسدودسازی @${handle}...`, {
      duration: 2200,
      action: 'لغو',
      onAction: () => { cancelled = true; },
      isWarning: true,
    });
    await new Promise((r) => setTimeout(r, 2200));
    if (cancelled) {
      document.querySelector('[data-testid="confirmationSheetCancel"]')?.click();
      inProgressHandles.delete(handle);
      return false;
    }
  }

  confirmBtn.click();

  // Mark as successfully blocked
  blockedHandles.add(handle);
  inProgressHandles.delete(handle);

  if (source === 'filter') {
    incrementBlockMetric('filterBlockCount');
    if (settings.showBlockToasts !== false) {
      showToast(`حساب @${handle} بر اساس فیلترها مسدود شد`);
    }
  } else {
    incrementBlockMetric('blockCount');
    if (settings.showBlockToasts !== false) {
      showToast(`حساب @${handle} مسدود شد`);
    }
  }

  return true;
}

/**
 * Public wrapper - now uses queue
 */
async function performBlock(tweetNode, options = {}) {
  return enqueueBlock(tweetNode, options);
}

/**
 * Single Toast Controller - Only ONE toast visible at a time
 * New toast replaces existing one with smooth transition
 */
function ensureToastContainer() {
  if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
  toastContainer = document.createElement('div');
  toastContainer.className = 'xe-toast-container';
  document.body.appendChild(toastContainer);
  return toastContainer;
}

function showToast(message, { duration = 2500, action, onAction, isWarning = false } = {}) {
  // Check if toasts are globally disabled
  if (settings.showBlockToasts === false) return { cancel: () => {} };

  const container = ensureToastContainer();

  // If a toast is already showing, replace it instead of stacking
  if (currentToast && container.contains(currentToast)) {
    // Cancel the old toast's timer and replace content
    currentToast._cancelTimer?.();
    replaceToastContent(currentToast, message, { isWarning, action, onAction, duration });
    return currentToast;
  }

  // Create new toast
  const toast = document.createElement('div');
  toast.className = 'xe-toast' + (isWarning ? ' xe-toast-warning' : '');
  currentToast = toast;

  const text = document.createElement('span');
  text.className = 'xe-toast-text';
  text.textContent = message;
  toast.appendChild(text);

  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    if (currentToast === toast) currentToast = null;
    toast.classList.remove('xe-toast-in');
    toast.classList.add('xe-toast-out');
    toast.addEventListener('transitionend', () => {
      toast.remove();
      if (currentToast === null && blockQueue.length === 0) {
        // Clean up container if no more toasts
        container.remove();
        toastContainer = null;
      }
    }, { once: true });
    setTimeout(() => {
      toast.remove();
      if (currentToast === null) {
        container.remove();
        toastContainer = null;
      }
    }, 300);
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
  toast.offsetHeight;
  requestAnimationFrame(() => toast.classList.add('xe-toast-in'));

  const timer = setTimeout(remove, duration);
  toast._cancelTimer = () => clearTimeout(timer);

  return { cancel: () => { clearTimeout(timer); remove(); } };
}

/**
 * Replace toast content without removing/creating new element
 */
function replaceToastContent(toast, message, { isWarning, action, onAction, duration }) {
  // Update warning class
  toast.classList.toggle('xe-toast-warning', isWarning);

  // Update text
  const textEl = toast.querySelector('.xe-toast-text');
  if (textEl) textEl.textContent = message;

  // Update action button
  const existingBtn = toast.querySelector('.xe-toast-action');
  if (existingBtn) existingBtn.remove();

  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = action;
    btn.className = 'xe-toast-action';
    btn.addEventListener('click', () => {
      onAction?.();
      // Find and call remove
      const container = toast.parentElement;
      if (container) {
        toast.classList.remove('xe-toast-in');
        toast.classList.add('xe-toast-out');
        toast.addEventListener('transitionend', () => {
          toast.remove();
          if (currentToast === toast) currentToast = null;
          container.remove();
          toastContainer = null;
        }, { once: true });
      }
    });
    toast.appendChild(btn);
  }

  // Reset animation
  toast.classList.remove('xe-toast-in');
  toast.offsetHeight;
  requestAnimationFrame(() => toast.classList.add('xe-toast-in'));

  // Reset timer
  if (toast._cancelTimer) toast._cancelTimer();
  toast._cancelTimer = setTimeout(() => {
    if (currentToast === toast) currentToast = null;
    toast.classList.remove('xe-toast-in');
    toast.classList.add('xe-toast-out');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================================
// Dynamic Font Injection (Guarantees Vazirmatn works in content script)
// ============================================================================

function injectVazirmatnFont() {
  if (document.getElementById('xwise-font-vazirmatn')) return;

  const arabicUrl = chrome.runtime.getURL('fonts/vazirmatn-arabic.woff2');
  const latinExtUrl = chrome.runtime.getURL('fonts/vazirmatn-latin-ext.woff2');
  const latinUrl = chrome.runtime.getURL('fonts/vazirmatn-latin.woff2');

  const style = document.createElement('style');
  style.id = 'xwise-font-vazirmatn';
  style.textContent = `
    @font-face {
      font-family: 'Vazirmatn';
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url('${arabicUrl}') format('woff2');
      unicode-range: U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC;
    }
    @font-face {
      font-family: 'Vazirmatn';
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url('${latinExtUrl}') format('woff2');
      unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF;
    }
    @font-face {
      font-family: 'Vazirmatn';
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url('${latinUrl}') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
  `;
  document.head.appendChild(style);
}

// ============================================================================
// Unicode Normalization & Emoji Handling Engine
// ============================================================================

/**
 * Strips zero-width characters and presentation selectors that cause
 * emojis or Arabic/Persian letters to fail matching.
 */
function normalizeUnicodeString(str, { caseSensitive = false } = {}) {
  if (!str) return '';

  let normalized = String(str)
    // NFKC decomposes presentation forms into canonical characters
    .normalize('NFKC')
    // Remove variation selector 15 (text) and 16 (emoji)
    .replace(/[︀-️]/gu, '')
    // Standardize Arabic/Persian letter variants (ی/ي and ک/ك)
    .replace(/ي/g, 'ی') // Arabic Yeh -> Persian Yeh
    .replace(/ك/g, 'ک') // Arabic Kaf -> Persian Kaf
    // Remove Arabic/Persian vowel diacritics (harakat / tashkeel)
    .replace(/[ً-ٰٟۖ-ۭ]/g, '');

  if (!caseSensitive) {
    normalized = normalized.toLocaleLowerCase();
  }

  return normalized;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if target string contains the filter pattern
 * Works seamlessly with words, phrases, compound emojis, flags, symbols.
 */
function testPatternMatch(targetText, pattern, { caseSensitive = false, wholeWord = false } = {}) {
  if (!targetText || !pattern) return false;

  const cleanTarget = normalizeUnicodeString(targetText, { caseSensitive });
  const cleanPattern = normalizeUnicodeString(pattern, { caseSensitive });

  if (!cleanPattern) return false;

  if (wholeWord) {
    const escaped = escapeRegExp(cleanPattern);
    const regex = new RegExp(`(^|[\\s\\p{P}\\p{S}]+)${escaped}($|[\\s\\p{P}\\p{S}]+)`, caseSensitive ? 'u' : 'iu');
    return regex.test(cleanTarget);
  }

  return cleanTarget.includes(cleanPattern);
}

// ============================================================================
// Theme Detection
// ============================================================================

function detectTheme() {
  const bg = getComputedStyle(document.body).backgroundColor;
  const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 'dark';
  const [, r, g, b] = match.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  if (luminance > 200) return 'light';
  if (luminance > 40) return 'dim';
  return 'dark';
}

function applyTheme() {
  const theme = detectTheme();
  if (theme !== currentTheme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-xe-theme', theme);
  }
}

// ============================================================================
// Settings Management
// ============================================================================

function loadSettings() {
  return new Promise((resolve) => {
    if (!chrome?.storage?.sync) { resolve(settings); return; }
    chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
      settings = { ...DEFAULT_SETTINGS, ...stored };
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

function incrementBlockMetric(key = 'blockCount') {
  if (!chrome?.storage?.sync) return;
  chrome.storage.sync.get([key], (stored) => {
    const count = (stored[key] || 0) + 1;
    chrome.storage.sync.set({ [key]: count });
  });
}

// ============================================================================
// Reliable Element Waiter
// ============================================================================

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

// ============================================================================
// Multi-language Block Detection
// ============================================================================

const BLOCK_KEYWORDS = [
  'block', 'مسدود', 'bloquear', 'bloquer', 'blockieren', 'blocca',
  'блокировать', '屏蔽', 'ブロック', 'حظر', 'chặn', 'blokir', 'blokkeren',
  'blokuj', 'engella', '차단',
];
const UNBLOCK_KEYWORDS = [
  'unblock', 'رفع مسدودی', 'لغو مسدود', 'desbloquear', 'débloquer',
  'entsperren', 'sblocca', 'разблокировать', '取消屏蔽', 'ブロック解除',
  'إلغاء الحظر', 'buka blokir', 'odblokuj', 'engeli kaldır', '차단 해制',
];

function isBlockMenuItem(node) {
  const text = node.textContent.trim().toLowerCase();
  if (!text) return false;
  if (UNBLOCK_KEYWORDS.some((k) => text.includes(k))) return false;
  return BLOCK_KEYWORDS.some((k) => text.includes(k));
}

// ============================================================================
// Core Native Blocking Flow
// ============================================================================

function getHandleFromTweet(tweetNode) {
  const link = tweetNode.querySelector('[data-testid="User-Name"] a[role="link"]');
  const href = link?.getAttribute('href') || '';
  return href.startsWith('/') ? href.slice(1).split('/')[0] : (href || 'user');
}

// ============================================================================
// Feature 1: Volume Sliders (Floating Pill over Videos)
// ============================================================================

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

  const stopProp = (e) => e.stopPropagation();
  slider.addEventListener('mousedown', stopProp);
  slider.addEventListener('pointerdown', stopProp);
  slider.addEventListener('click', stopProp);

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

// ============================================================================
// Feature 2: Inline Action-Bar Block Button
// ============================================================================

function createBlockButton(tweet) {
  if (processedTweets.has(tweet)) return;
  processedTweets.add(tweet);

  const actionBar = tweet.querySelector('[role="group"]');
  if (!actionBar) return;

  const btn = document.createElement('div');
  btn.className = 'xe-block-btn-wrapper';
  btn.setAttribute('role', 'button');
  btn.setAttribute('tabindex', '0');
  btn.setAttribute('aria-label', 'Block user');

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
    performBlock(tweet, { requireConfirmDelay: false, source: 'manual' });
  });

  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      performBlock(tweet, { requireConfirmDelay: false, source: 'manual' });
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

// ============================================================================
// Feature 3: Keyboard Shortcut (Ctrl+Alt+B default)
// ============================================================================

let hoveredElement = null;
document.addEventListener('mouseover', (e) => { hoveredElement = e.target; }, { passive: true });

document.addEventListener('keydown', (e) => {
  if (!settings.shortcutEnabled) return;

  // Prevent repeat triggers when holding keys
  if (e.repeat) return;

  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
  if (e.target.getAttribute('role') === 'textbox') return;

  const key = e.key.toLowerCase();
  const matches =
    key === (settings.shortcutKey || 'b').toLowerCase() &&
    e.ctrlKey === !!settings.shortcutCtrl &&
    e.altKey === !!settings.shortcutAlt &&
    e.shiftKey === !!settings.shortcutShift;
  if (!matches) return;
  if (!hoveredElement) return;

  const tweet = hoveredElement.closest('article');
  if (!tweet) return;

  e.preventDefault();
  e.stopPropagation();
  performBlock(tweet, { requireConfirmDelay: true, source: 'manual' });
});

// ============================================================================
// Feature 4: NEW v2 Unicode-aware Filter Engine
// ============================================================================

/**
 * Extracts complete text from DOM elements, including <img> with alt attributes
 * (X renders Twemoji images with alt="emoji")
 */
function extractFullTextWithAlt(element) {
  if (!element) return '';

  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'IMG' && node.hasAttribute('alt')) {
        text += node.getAttribute('alt');
      } else {
        text += extractFullTextWithAlt(node);
      }
    }
  }
  return text.trim();
}

/**
 * Extracts user's display name from tweet header (excluding @handle)
 */
function extractDisplayNameFromTweet(tweet) {
  const userNameContainer = tweet.querySelector('[data-testid="User-Name"]');
  if (!userNameContainer) return '';

  // The first direct anchor or first text element usually holds the display name
  const nameAnchor = userNameContainer.querySelector('a[role="link"]');
  if (nameAnchor) {
    return extractFullTextWithAlt(nameAnchor);
  }
  return extractFullTextWithAlt(userNameContainer);
}

/**
 * Extracts bio if present on the page (profile view, hovercards, or cached)
 */
function extractBioForUser(handle, tweet) {
  // 1. Check local cache
  if (userBioCache.has(handle)) {
    return userBioCache.get(handle);
  }

  // 2. Check if we're on user profile page
  const profileBio = document.querySelector('[data-testid="UserDescription"]');
  if (profileBio) {
    const bioText = extractFullTextWithAlt(profileBio);
    if (bioText) {
      userBioCache.set(handle, bioText);
      return bioText;
    }
  }

  // 3. Check inside tweet context if rendered (e.g. in search user cards)
  const cellBio = tweet?.querySelector?.('[data-testid="UserDescription"]');
  if (cellBio) {
    const bioText = extractFullTextWithAlt(cellBio);
    userBioCache.set(handle, bioText);
    return bioText;
  }

  return '';
}

/**
 * Inspect a tweet against all enabled filter rules
 */
function inspectTweetAgainstFilters(tweet) {
  if (!settings.filterEngineEnabled) return null;
  const filters = settings.filters || [];
  if (!filters.length) return null;

  const handle = getHandleFromTweet(tweet);
  const displayName = extractDisplayNameFromTweet(tweet);
  const bio = extractBioForUser(handle, tweet);
  const tweetText = settings.filterScopes?.tweetText ?
    extractFullTextWithAlt(tweet.querySelector('[data-testid="tweetText"]')) : '';

  const scopes = settings.filterScopes || { displayName: true, bio: true, tweetText: false };

  for (const filter of filters) {
    if (!filter.enabled) continue;
    const pattern = filter.pattern;

    // Check Display Name
    if (scopes.displayName && displayName) {
      if (testPatternMatch(displayName, pattern, { caseSensitive: settings.filterCaseSensitive, wholeWord: settings.filterWholeWord })) {
        return { matchedFilter: filter, matchedScope: 'displayName', handle };
      }
    }

    // Check Bio
    if (scopes.bio && bio) {
      if (testPatternMatch(bio, pattern, { caseSensitive: settings.filterCaseSensitive, wholeWord: settings.filterWholeWord })) {
        return { matchedFilter: filter, matchedScope: 'bio', handle };
      }
    }

    // Check Tweet Text (only if explicitly enabled)
    if (scopes.tweetText && tweetText) {
      if (testPatternMatch(tweetText, pattern, { caseSensitive: settings.filterCaseSensitive, wholeWord: settings.filterWholeWord })) {
        return { matchedFilter: filter, matchedScope: 'tweetText', handle };
      }
    }
  }

  return null;
}

/**
 * Apply dry-run badge without modifying tweet flow or colliding with X UI
 */
function applyDryRunBadge(tweet, match) {
  if (tweet.querySelector('.xe-filter-badge')) return;

  const badge = document.createElement('span');
  badge.className = 'xe-filter-badge xe-filter-badge-subtle';
  badge.textContent = `فیلتر: ${match.matchedFilter.pattern}`;
  badge.title = `شناسایی‌شده توسط XWise Blocker در ${match.matchedScope === 'displayName' ? 'نام نمایشی' : (match.matchedScope === 'bio' ? 'بایو' : 'متن')}`;

  // Insert seamlessly right after User-Name container
  const userNameEl = tweet.querySelector('[data-testid="User-Name"]');
  if (userNameEl) {
    userNameEl.appendChild(badge);
  } else {
    tweet.prepend(badge);
  }

  incrementBlockMetric('dryRunMatchCount');
}

/**
 * Process single tweet for filter engine
 */
async function processTweetFilter(tweet) {
  if (scannedTweetNodes.has(tweet)) return;
  scannedTweetNodes.add(tweet);

  const match = inspectTweetAgainstFilters(tweet);
  if (!match) return;

  if (settings.filterMode === 'dry-run') {
    applyDryRunBadge(tweet, match);
  } else if (settings.filterMode === 'auto-block') {
    const handle = match.handle;
    // Skip if already blocked or in progress
    if (!blockedHandles.has(handle) && !inProgressHandles.has(handle)) {
      await performBlock(tweet, { requireConfirmDelay: false, source: 'filter' });
    }
  }
}

// Observe hovercard bio pops to enrich bio cache dynamically
const hoverObserver = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const bioEl = node.querySelector?.('[data-testid="UserDescription"]') ||
                      (node.matches?.('[data-testid="UserDescription"]') ? node : null);
        if (bioEl) {
          const text = extractFullTextWithAlt(bioEl);
          // Find closest handle in the hover card
          const handleEl = node.querySelector?.('a[href^="/"]');
          const href = handleEl?.getAttribute('href');
          if (href && href.length > 1) {
            const handle = href.slice(1).split('/')[0];
            if (handle && text) userBioCache.set(handle, text);
          }
        }
      }
    }
  }
});

// ============================================================================
// Scoped Scanning & MutationObserver
// ============================================================================

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

    if (settings.filterEngineEnabled) {
      const articles = root.matches?.('article') ? [root] : root.querySelectorAll('article');
      for (let i = 0; i < articles.length; i++) {
        processTweetFilter(articles[i]);
      }
    }
  }
}

function scheduleScan(root) {
  pendingRoots.add(root || document);
  if (scanScheduled) return;
  scanScheduled = true;

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => flushScan(), { timeout: 180 });
  } else {
    setTimeout(flushScan, 80);
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
  if (shouldScan && !scanScheduled) {
    scanScheduled = true;
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => flushScan(), { timeout: 180 });
    } else {
      setTimeout(flushScan, 80);
    }
  }
});

const themeObserver = new MutationObserver(() => {
  requestAnimationFrame(applyTheme);
});

// ============================================================================
// Initialization
// ============================================================================

(async function init() {
  await loadSettings();
  injectVazirmatnFont();
  applyTheme();

  // Initial scan
  addVolumeSliders();
  addBlockButtons();

  const existingTweets = document.querySelectorAll('article');
  for (let i = 0; i < existingTweets.length; i++) {
    processTweetFilter(existingTweets[i]);
  }

  // Observers
  domObserver.observe(document.body, { childList: true, subtree: true });
  hoverObserver.observe(document.body, { childList: true, subtree: true });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });
})();
