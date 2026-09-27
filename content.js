'use strict';

/**
 * XWise Blocker v3.1.1 — Content Script
 * Seamless in-page native Twitter integration, flawless ad cleaner, and smart filter suite.
 */

const DEFAULT_SETTINGS = {
  // Video Suite
  volumeSliderEnabled: true,
  rememberVolume: true,
  lastVolume: 1,
  defaultPlaybackRate: 1,
  videoLoopEnabled: false,
  videoDownloadEnabled: true,

  // Timeline Cleaner
  cleanTimelineEnabled: true,
  hideWhoToFollow: true,
  hideProfileWhoToFollow: true,
  hideGrokDrawer: true,
  hidePremiumUpsell: true,
  hideViewCounts: false,
  zenModeEnabled: false,
  zenKeepSearch: true,

  // Manual Block & Shortcut
  blockButtonEnabled: true,
  shortcutEnabled: true,
  shortcutCtrl: true,
  shortcutAlt: true,
  shortcutShift: false,
  shortcutKey: 'b',
  confirmDelayOnShortcut: true,

  // Filter Engine
  filterEngineEnabled: true,
  filterMode: 'hide', // 'hide' | 'auto-mute' | 'auto-block' | 'dry-run'
  filterScopes: {
    displayName: true,
    bio: true,
    tweetText: false,
  },
  filters: [],
  filterCaseSensitive: false,
  filterWholeWord: false,

  // Anti-Spam
  filterDefaultAvatars: false,
  filterEngagementBait: false,

  // Fun & Special Filters (v3.0.1)
  hideBoysMode: false,
  boysWhitelist: [],

  // Ad Cleaner
  adBlockerEnabled: true,

  // Blue Checkmark Filter (Default off)
  blueCheckFilter: 'off',
  blueCheckAction: 'hide',

  // Whitelist
  whitelist: [],

  // UI
  showMatchBadges: true,
  language: 'fa',
  showBlockToasts: true,

  // Stats
  blockCount: 0,
  filterBlockCount: 0,
  muteCount: 0,
  hideCount: 0,
  adBlockCount: 0,
  blueCheckCount: 0,
  dryRunMatchCount: 0,
};

// Preset packs without Iran flag
const PRESET_PACKS = {
  gov: ['🇵🇸', '🇱🇧', '🍉', '🎒', '☫', 'ارزشی', 'ولایی', 'ساندیس', 'سایبری', 'حجاب'],
  bait: ['follow + rt', 'rt + follow', 'فالو + ریت', 'بک میدم', 'فالو = بک', 'ایردراپ قطعی', 'drop your wallet'],
  betting: ['بت', 'قمار', 'کازینو', 'انفجار', 'شرط بندی', 'بونوس', 'پیش‌بینی', '1xbet', 'bet90'],
  crypto: ['airdrop', 'giveaway', 'presale', 'crypto', 'web3', 'minting', 'free mint', 'claim now', 'memecoin'],
};

let settings = { ...DEFAULT_SETTINGS };
let lastVolume = 1;
let currentTheme = 'dark';

// Fast WeakSets to prevent redundant processing
const processedVideos = new WeakSet();
const processedTweets = new WeakSet();
const scannedTweetNodes = new WeakSet();
const hiddenTweetNodes = new WeakSet();
const processedAdNodes = new WeakSet();

// Lookup Sets & Caches
const blockedHandles = new Set();
const mutedHandles = new Set();
const inProgressHandles = new Set();
let whitelistSet = new Set();
let boysWhitelistSet = new Set();
const userBioCache = new Map();
const compiledRegexCache = new Map();
const genderDetectionCache = new Map();

// In-Page Elements
let inPageLauncher = null;
let inPageDrawer = null;

// ============================================================================
// Whitelist Helper
// ============================================================================

function updateWhitelistSet() {
  const list = settings.whitelist || [];
  whitelistSet = new Set(list.map((h) => String(h).toLowerCase().replace(/^@/, '').trim()));
}

function updateBoysWhitelistSet() {
  const list = settings.boysWhitelist || [];
  boysWhitelistSet = new Set(list.map((h) => String(h).toLowerCase().replace(/^@/, '').trim()));
}

function isHandleWhitelisted(handle) {
  if (!handle) return false;
  const clean = String(handle).toLowerCase().replace(/^@/, '').trim();
  return whitelistSet.has(clean);
}

function isHandleBoysWhitelisted(handle) {
  if (!handle) return false;
  const clean = String(handle).toLowerCase().replace(/^@/, '').trim();
  return whitelistSet.has(clean) || boysWhitelistSet.has(clean);
}

// ============================================================================
// Activity Logger
// ============================================================================

async function recordActivity({ handle, action, rule, scope }) {
  if (!chrome?.storage?.local) return;
  try {
    const data = await chrome.storage.local.get(['xwise.activityLog']);
    const list = Array.isArray(data['xwise.activityLog']) ? data['xwise.activityLog'] : [];

    const entry = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      handle: String(handle || '').replace(/^@/, ''),
      action,
      rule: rule || '',
      scope: scope || '',
      timestamp: Date.now(),
    };

    const updated = [entry, ...list].slice(0, 20);
    await chrome.storage.local.set({ 'xwise.activityLog': updated });
  } catch {
    // Non-blocking
  }
}

// ============================================================================
// Toast Notification
// ============================================================================

let toastContainer = null;
let currentToast = null;

function ensureToastContainer() {
  if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
  toastContainer = document.createElement('div');
  toastContainer.className = 'xe-toast-container';
  document.body.appendChild(toastContainer);
  return toastContainer;
}

function showToast(message, { duration = 2400, action, onAction, isWarning = false } = {}) {
  if (settings.showBlockToasts === false) return { cancel: () => {} };

  const container = ensureToastContainer();

  if (currentToast && container.contains(currentToast)) {
    currentToast._cancelTimer?.();
    replaceToastContent(currentToast, message, { isWarning, action, onAction, duration });
    return currentToast;
  }

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
      if (currentToast === null && actionQueue.length === 0) {
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
    }, 280);
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

function replaceToastContent(toast, message, { isWarning, action, onAction, duration }) {
  toast.classList.toggle('xe-toast-warning', isWarning);

  const textEl = toast.querySelector('.xe-toast-text');
  if (textEl) textEl.textContent = message;

  const existingBtn = toast.querySelector('.xe-toast-action');
  if (existingBtn) existingBtn.remove();

  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = action;
    btn.className = 'xe-toast-action';
    btn.addEventListener('click', () => {
      onAction?.();
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

  toast.classList.remove('xe-toast-in');
  toast.offsetHeight;
  requestAnimationFrame(() => toast.classList.add('xe-toast-in'));

  if (toast._cancelTimer) toast._cancelTimer();
  toast._cancelTimer = setTimeout(() => {
    if (currentToast === toast) currentToast = null;
    toast.classList.remove('xe-toast-in');
    toast.classList.add('xe-toast-out');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 280);
  }, duration);
}

// ============================================================================
// Action Helpers
// ============================================================================

const BLOCK_KEYWORDS = [
  'block', 'مسدود', 'bloquear', 'bloquer', 'blockieren', 'blocca',
  'блокировать', '屏蔽', 'ブロック', 'حظر', 'chặn', 'blokir', 'blokkeren',
];
const UNBLOCK_KEYWORDS = [
  'unblock', 'رفع مسدودی', 'لغو مسدود', 'desbloquear', 'débloquer',
  'entsperren', 'sblocca', 'разблокировать', '取消屏蔽', 'ブロック解除',
];

const MUTE_KEYWORDS = [
  'mute', 'بی‌صدا', 'silenciar', 'masquer', 'stummschalten', 'disattiva',
  'заглушить', 'игнорировать', '隐藏', 'ミュート', 'كتم',
];
const UNMUTE_KEYWORDS = [
  'unmute', 'لغو بی‌صدا', 'desilenciar', 'démasquer', 'laut schalten',
];

function isBlockMenuItem(node) {
  const text = node.textContent.trim().toLowerCase();
  if (!text) return false;
  if (UNBLOCK_KEYWORDS.some((k) => text.includes(k))) return false;
  return BLOCK_KEYWORDS.some((k) => text.includes(k));
}

function isMuteMenuItem(node) {
  const text = node.textContent.trim().toLowerCase();
  if (!text) return false;
  if (UNMUTE_KEYWORDS.some((k) => text.includes(k))) return false;
  return MUTE_KEYWORDS.some((k) => text.includes(k));
}

// Action Queue
const actionQueue = [];
let isProcessingActionQueue = false;

function enqueueAction(actionType, tweetNode, options = {}) {
  return new Promise((resolve) => {
    actionQueue.push({ actionType, tweetNode, options, resolve });
    processActionQueue();
  });
}

async function processActionQueue() {
  if (isProcessingActionQueue || actionQueue.length === 0) return;
  isProcessingActionQueue = true;

  while (actionQueue.length > 0) {
    const { actionType, tweetNode, options, resolve } = actionQueue.shift();
    try {
      let result = false;
      if (actionType === 'block') {
        result = await performBlockInternal(tweetNode, options);
      } else if (actionType === 'mute') {
        result = await performMuteInternal(tweetNode, options);
      }
      resolve(result);
    } catch {
      resolve(false);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  isProcessingActionQueue = false;
}

function isInsideQuoteTweet(element, rootTweet) {
  if (!element || element === rootTweet) return false;
  const quoteContainer = element.closest('[data-testid="quoteTweet"], [role="link"] [data-testid="User-Name"]');
  if (quoteContainer && quoteContainer !== rootTweet) return true;

  // Check if ancestor is a nested card/border link within rootTweet
  let curr = element.parentElement;
  while (curr && curr !== rootTweet) {
    if (curr.getAttribute('role') === 'link' || curr.getAttribute('data-testid') === 'quoteTweet') {
      return true;
    }
    curr = curr.parentElement;
  }
  return false;
}

function getHandleFromTweet(tweetNode) {
  if (!tweetNode) return 'user';

  // 1. Prioritize User-Name elements of the PRIMARY tweet author (strictly excluding quote tweets)
  const userNames = tweetNode.querySelectorAll('[data-testid="User-Name"]');
  for (let i = 0; i < userNames.length; i++) {
    const un = userNames[i];
    if (isInsideQuoteTweet(un, tweetNode)) continue;

    const link = un.querySelector('a[role="link"]');
    const href = link?.getAttribute('href') || '';
    if (href.startsWith('/')) {
      const part = href.slice(1).split('/')[0];
      if (part && !['home', 'explore', 'notifications', 'messages'].includes(part)) {
        return part;
      }
    }
  }

  // Fallback to first non-quote author link
  const allUserLinks = tweetNode.querySelectorAll('a[href^="/"][role="link"]:not([href*="/status/"])');
  for (let i = 0; i < allUserLinks.length; i++) {
    const l = allUserLinks[i];
    if (isInsideQuoteTweet(l, tweetNode)) continue;
    const h = l.getAttribute('href').slice(1).split('/')[0];
    if (h && !['home', 'explore', 'notifications', 'messages'].includes(h)) return h;
  }

  return 'user';
}

async function performBlockInternal(tweetNode, { requireConfirmDelay = false, source = 'manual', rule = '' } = {}) {
  const handle = getHandleFromTweet(tweetNode);

  if (isHandleWhitelisted(handle)) return false;
  if (blockedHandles.has(handle) || inProgressHandles.has(handle)) return false;

  inProgressHandles.add(handle);

  const moreBtn = tweetNode.querySelector('[data-testid="caret"], [aria-label="More" i], [aria-label*="بیشتر" i]');
  if (!moreBtn) {
    if (source === 'manual') showToast(settings.language === 'fa' ? `منوی کاربر @${handle} پیدا نشد` : `Menu not found for @${handle}`);
    inProgressHandles.delete(handle);
    return false;
  }
  moreBtn.click();

  const menuItem = await waitFor(document, isBlockMenuItem, 1800);
  if (!menuItem) {
    document.body.click();
    inProgressHandles.delete(handle);
    return false;
  }
  menuItem.click();

  const confirmBtn = await waitFor(document, '[data-testid="confirmationSheetConfirm"]', 1800);
  if (!confirmBtn) {
    inProgressHandles.delete(handle);
    return false;
  }

  if (requireConfirmDelay && settings.confirmDelayOnShortcut) {
    let cancelled = false;
    showToast(settings.language === 'fa' ? `در حال مسدودسازی @${handle}...` : `Blocking @${handle}...`, {
      duration: 2000,
      action: settings.language === 'fa' ? 'لغو' : 'Cancel',
      onAction: () => { cancelled = true; },
      isWarning: true,
    });
    await new Promise((r) => setTimeout(r, 2000));
    if (cancelled) {
      document.querySelector('[data-testid="confirmationSheetCancel"]')?.click();
      inProgressHandles.delete(handle);
      return false;
    }
  }

  confirmBtn.click();

  blockedHandles.add(handle);
  inProgressHandles.delete(handle);

  const metricKey = source === 'filter' ? 'filterBlockCount' : 'blockCount';
  incrementBlockMetric(metricKey);
  recordActivity({ handle, action: 'block', rule, scope: source });

  if (settings.showBlockToasts !== false) {
    const msg = settings.language === 'fa'
      ? (source === 'filter' ? `حساب @${handle} طبق فیلتر مسدود شد` : `حساب @${handle} مسدود شد`)
      : `@${handle} blocked`;
    showToast(msg);
  }

  return true;
}

async function performMuteInternal(tweetNode, { source = 'filter', rule = '' } = {}) {
  const handle = getHandleFromTweet(tweetNode);

  if (isHandleWhitelisted(handle)) return false;
  if (mutedHandles.has(handle) || blockedHandles.has(handle) || inProgressHandles.has(handle)) {
    return false;
  }

  inProgressHandles.add(handle);

  const moreBtn = tweetNode.querySelector('[data-testid="caret"], [aria-label="More" i], [aria-label*="بیشتر" i]');
  if (!moreBtn) {
    inProgressHandles.delete(handle);
    return false;
  }
  moreBtn.click();

  const menuItem = await waitFor(document, isMuteMenuItem, 1800);
  if (!menuItem) {
    document.body.click();
    inProgressHandles.delete(handle);
    return false;
  }
  menuItem.click();

  const confirmBtn = await waitFor(document, '[data-testid="confirmationSheetConfirm"]', 700);
  if (confirmBtn) confirmBtn.click();

  mutedHandles.add(handle);
  inProgressHandles.delete(handle);

  incrementBlockMetric('muteCount');
  recordActivity({ handle, action: 'mute', rule, scope: source });

  if (settings.showBlockToasts !== false) {
    const msg = settings.language === 'fa'
      ? `حساب @${handle} بی‌صدا (Mute) شد`
      : `@${handle} muted`;
    showToast(msg);
  }

  return true;
}

function performBlock(tweetNode, options = {}) {
  return enqueueAction('block', tweetNode, options);
}

function performMute(tweetNode, options = {}) {
  return enqueueAction('mute', tweetNode, options);
}

// ============================================================================
// Clean & Native-Feeling Tweet Hiding
// ============================================================================

function applyHideTweet(tweetNode, { rule = '', scope = '', handle = '' } = {}) {
  if (hiddenTweetNodes.has(tweetNode)) return;
  hiddenTweetNodes.add(tweetNode);

  tweetNode.classList.add('xe-tweet-hidden');
  tweetNode.setAttribute('data-xe-hidden', 'true');
  if (scope === 'gender') {
    tweetNode.setAttribute('data-xe-reason', 'gender');
  }

  const bar = document.createElement('div');
  bar.className = 'xe-filtered-bar';
  bar.setAttribute('role', 'region');
  if (scope === 'gender') {
    bar.setAttribute('data-xe-gender', 'true');
  }

  const label = document.createElement('span');
  label.className = 'xe-filtered-label';
  const cleanRule = rule || 'Filter';
  if (scope === 'gender') {
    label.textContent = settings.language === 'fa' ? 'پست پنهان شد (اکانت پسر)' : 'Post hidden (Boy account)';
  } else {
    label.textContent = settings.language === 'fa' ? `پست پنهان شد (${cleanRule})` : `Post hidden (${cleanRule})`;
  }

  const showBtn = document.createElement('button');
  showBtn.type = 'button';
  showBtn.className = 'xe-filtered-show-btn';
  showBtn.textContent = settings.language === 'fa' ? 'مشاهده' : 'View';

  showBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Reveal tweet as a 100% normal tweet
    bar.classList.add('xe-hidden-bar');
    tweetNode.classList.remove('xe-tweet-hidden');
    tweetNode.removeAttribute('data-xe-hidden');
    tweetNode.classList.add('xe-tweet-revealed');
    tweetNode.setAttribute('data-xe-revealed', 'true');

    // Attach native re-hide button under tweet in bottom action bar
    function attachRehideButton() {
      if (tweetNode.querySelector('.xe-rehide-btn-wrapper')) return;

      const actionBar = tweetNode.querySelector('[role="group"]');
      if (!actionBar) return;

      const rehideBtn = document.createElement('div');
      rehideBtn.className = 'xe-rehide-btn-wrapper';
      rehideBtn.setAttribute('role', 'button');
      rehideBtn.setAttribute('tabindex', '0');
      const tooltip = settings.language === 'fa' ? 'پنهان‌سازی مجدد توییت' : 'Hide tweet again';
      rehideBtn.setAttribute('aria-label', tooltip);
      rehideBtn.title = tooltip;

      rehideBtn.innerHTML = `
        <div class="xe-rehide-btn-inner">
          <div class="xe-rehide-btn-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.27 2L2 3.27l3.78 3.78C4.1 8.35 2.78 10.02 2 12c1.73 4.39 6 7.5 11 7.5 2.16 0 4.17-.6 5.86-1.64L20.73 22 22 20.73 3.27 2zM12 17c-2.76 0-5-2.24-5-5 0-.77.18-1.5.49-2.16l6.67 6.67c-.66.31-1.39.49-2.16.49zm-.5-10c.17 0 .33.02.5.03 2.74.19 4.95 2.4 5.14 5.14.01.17.03.33.03.5 0 .76-.17 1.48-.46 2.13l1.52 1.52C19.38 15.14 20.24 13.67 21 12c-1.73-4.39-6-7.5-11-7.5-1.07 0-2.1.16-3.08.43l1.7 1.7c.43-.09.89-.13 1.38-.13z"/>
            </svg>
          </div>
        </div>
      `;

      const onRehide = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        // Re-collapse back into the bar
        bar.classList.remove('xe-hidden-bar');
        tweetNode.classList.add('xe-tweet-hidden');
        tweetNode.setAttribute('data-xe-hidden', 'true');
        tweetNode.classList.remove('xe-tweet-revealed');
        tweetNode.removeAttribute('data-xe-revealed');
        rehideBtn.remove();
      };

      rehideBtn.addEventListener('click', onRehide);
      rehideBtn.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') onRehide(ev);
      });

      actionBar.appendChild(rehideBtn);
    }

    attachRehideButton();
    setTimeout(attachRehideButton, 120);
  });

  bar.addEventListener('click', (e) => e.stopPropagation());

  bar.appendChild(label);
  bar.appendChild(showBtn);
  tweetNode.prepend(bar);

  incrementBlockMetric('hideCount');
  recordActivity({ handle, action: 'hide', rule, scope });
}

// ============================================================================
// Clean Timeline & Zen Mode Management
// ============================================================================

function applyTimelineCleaners() {
  const root = document.documentElement;
  const isTimelineClean = settings.cleanTimelineEnabled !== false;

  root.classList.toggle('xe-clean-who-to-follow', isTimelineClean && !!settings.hideWhoToFollow);
  root.classList.toggle('xe-clean-profile-who-to-follow', isTimelineClean && (!!settings.hideProfileWhoToFollow || !!settings.hideWhoToFollow));
  root.classList.toggle('xe-clean-grok', isTimelineClean && !!settings.hideGrokDrawer);
  root.classList.toggle('xe-clean-premium', isTimelineClean && !!settings.hidePremiumUpsell);
  root.classList.toggle('xe-clean-view-counts', isTimelineClean && !!settings.hideViewCounts);
  root.classList.toggle('xe-zen-mode', !!settings.zenModeEnabled);
  root.classList.toggle('xe-zen-keep-search', !!settings.zenModeEnabled && settings.zenKeepSearch !== false);
  cleanZenSidebar();
}

const RECOMMENDATION_PHRASES = [
  'who to follow',
  'you might like',
  'relevant people',
  'suggested for you',
  'suggested creators',
  'creators you might like',
  'people you may know',
  'follow recommendations',
  'چه کسانی را دنبال کنید',
  'افرادی برای دنبال کردن',
  'افراد مرتبط',
  'شاید بپسندید',
  'پیشنهاد شده برای شما',
  'پیشنهاد برای دنبال کردن',
  'پیشنهادها برای شما',
  'پیشنهادهای دنبال‌کردن',
  'پیشنهادهای دنبال کردن',
  'پیشنهادها',
  'من قد تتابعه',
  'أشخاص قد تعجبك',
  'اقتراحات المتابعة',
  'wem du folgen solltest',
  'relevante personen',
  'das könnte dir gefallen',
  'a quién seguir',
  'personas relevantes',
  'tal vez te guste',
  'quem seguir',
];

function isRecommendationText(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return RECOMMENDATION_PHRASES.some((phrase) => lower.includes(phrase));
}

function hideRecommendationElement(el) {
  if (!el || el.classList.contains('xe-recommendation-hidden')) return;
  el.classList.add('xe-recommendation-hidden');
  el.style.setProperty('display', 'none', 'important');
  el.style.setProperty('visibility', 'hidden', 'important');
  el.style.setProperty('height', '0px', 'important');
  el.style.setProperty('min-height', '0px', 'important');
  el.style.setProperty('max-height', '0px', 'important');
  el.style.setProperty('margin', '0px', 'important');
  el.style.setProperty('padding', '0px', 'important');
  el.style.setProperty('border', 'none', 'important');
  el.style.setProperty('overflow', 'hidden', 'important');
}

function cleanZenSidebar() {
  const sidebar = document.querySelector?.('[data-testid="sidebarColumn"]');
  if (!sidebar) return;

  if (!settings.zenModeEnabled) {
    // If Zen mode is off, restore any element previously hidden by Zen
    sidebar.querySelectorAll('.xe-zen-hidden').forEach((el) => {
      el.classList.remove('xe-zen-hidden');
      el.style.removeProperty('display');
      el.style.removeProperty('visibility');
      el.style.removeProperty('height');
    });
    return;
  }

  // When Zen Mode is ON and zenKeepSearch is true: EXCLUSIVELY KEEP SEARCH & RECENT SEARCHES!
  if (settings.zenKeepSearch !== false) {
    const isSearchRelated = (el) => {
      if (!el) return false;
      if (el.querySelector('form[role="search"], [data-testid="SearchBox_Search_Input"], [data-testid*="typeahead" i], [role="listbox"]')) return true;
      if (el.matches?.('form[role="search"], [data-testid="SearchBox_Search_Input"], [data-testid*="typeahead" i], [role="listbox"]')) return true;
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();
      if (aria.includes('search') || aria.includes('recent') || aria.includes('جستجو') || aria.includes('اخیر')) return true;
      return false;
    };

    const allWidgets = sidebar.querySelectorAll('section, aside, nav, [data-testid="placementTracking"], div[data-testid*="timeline" i]');

    for (let i = 0; i < allWidgets.length; i++) {
      const w = allWidgets[i];
      if (isSearchRelated(w)) continue;
      w.classList.add('xe-zen-hidden');
      w.style.setProperty('display', 'none', 'important');
      w.style.setProperty('visibility', 'hidden', 'important');
      w.style.setProperty('height', '0px', 'important');
    }

    // Also check direct children of sidebar container to hide trends and who-to-follow containers
    const innerContainer = sidebar.querySelector('div > div > div');
    if (innerContainer && innerContainer.parentElement) {
      const siblings = innerContainer.parentElement.children;
      for (let i = 0; i < siblings.length; i++) {
        const sib = siblings[i];
        if (isSearchRelated(sib)) continue;
        sib.classList.add('xe-zen-hidden');
        sib.style.setProperty('display', 'none', 'important');
        sib.style.setProperty('visibility', 'hidden', 'important');
      }
    }
  }
}

function cleanWhoToFollowRecommendations(root = document) {
  if (!settings.hideWhoToFollow && !settings.hideProfileWhoToFollow) return;

  const path = window.location.pathname;
  const isIntentionalUserList =
    path.endsWith('/followers') ||
    path.endsWith('/following') ||
    path.endsWith('/verified_followers') ||
    path.endsWith('/followers_you_follow') ||
    (path.startsWith('/search') && new URLSearchParams(window.location.search).get('f') === 'user') ||
    path.includes('/lists/') ||
    path.startsWith('/i/connect_people');

  // 1. Sidebar recommendations (Who to follow / Relevant people / You might like)
  const sidebar = document.querySelector?.('[data-testid="sidebarColumn"]');
  if (sidebar) {
    const widgets = sidebar.querySelectorAll('aside, section, [data-testid="placementTracking"]');
    for (let i = 0; i < widgets.length; i++) {
      const w = widgets[i];
      if (w.classList.contains('xe-recommendation-hidden')) continue;

      const txt = w.textContent || '';
      const aria = w.getAttribute('aria-label') || '';
      const hasConnectLink = !!w.querySelector('a[href*="/connect_people"], a[href*="/i/connect_people"]');
      const hasUserCell = !!w.querySelector('[data-testid="UserCell"]');
      const isRecText = isRecommendationText(txt) || isRecommendationText(aria);

      if (hasConnectLink || isRecText || (hasUserCell && !w.querySelector('[data-testid="trend"]'))) {
        hideRecommendationElement(w);
      }
    }
  }

  // 2. Timeline / In-feed recommendations (Home, Profiles, Tweet details, etc.)
  if (!isIntentionalUserList) {
    const scope = root.querySelectorAll ? root : document;
    const cells = scope.querySelectorAll('[data-testid="cellInnerDiv"]');
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell.classList.contains('xe-recommendation-hidden') || cell.classList.contains('xe-ad-cell-hidden')) continue;

      // NEVER hide a genuine tweet article!
      if (cell.querySelector('article')) continue;

      // Connect people link
      if (cell.querySelector('a[href*="/connect_people"], a[href*="/i/connect_people"]')) {
        hideRecommendationElement(cell);
        continue;
      }

      // Aside recommendation
      const aside = cell.querySelector('aside');
      if (aside) {
        const aria = aside.getAttribute('aria-label') || '';
        if (isRecommendationText(aria) || isRecommendationText(aside.textContent)) {
          hideRecommendationElement(cell);
          continue;
        }
      }

      // Recommendation user rows (UserCell without article)
      if (cell.querySelector('[data-testid="UserCell"]')) {
        hideRecommendationElement(cell);
        continue;
      }

      // Carousel of users/creators
      if (cell.querySelector('[data-testid="Carousel"]')) {
        const txt = cell.textContent || '';
        if (isRecommendationText(txt) || cell.querySelector('[role="button"]') || cell.querySelector('a[href^="/"]')) {
          hideRecommendationElement(cell);
          continue;
        }
      }

      // Text match with follow button or link
      const txt = cell.textContent || '';
      if (isRecommendationText(txt)) {
        if (cell.querySelector('[role="button"]') || cell.querySelector('a[href^="/"]')) {
          hideRecommendationElement(cell);
          continue;
        }
      }
    }
  }
}

const cleanProfileRecommendations = cleanWhoToFollowRecommendations;

// ============================================================================
// Flawless Ad Cleaner (Fix: NEVER hides tweets on video playback)
// ============================================================================

const AD_INDICATORS = [
  'ad', 'promoted', 'sponsored', 'تبلیغ', 'تبلیغات', 'مروّج',
  'реклама', 'anuncio', 'sponsorisé', 'gesponsert', 'sponsorizzato',
  'sponsorlu', 'iklan',
];

function cleanAdElement(node) {
  if (processedAdNodes.has(node)) return;
  processedAdNodes.add(node);

  const cell = node.closest('[data-testid="cellInnerDiv"]') || node;
  cell.style.setProperty('display', 'none', 'important');
  cell.style.setProperty('height', '0', 'important');
  cell.style.setProperty('min-height', '0', 'important');
  cell.style.setProperty('padding', '0', 'important');
  cell.style.setProperty('margin', '0', 'important');
  cell.classList.add('xe-ad-cell-hidden');
  node.classList.add('xe-ad-hidden');

  incrementBlockMetric('adBlockCount');
}

/**
 * Checks if an element is a genuine sponsored/promoted ad
 * Explicitly guards against video player view tracking!
 */
function isGenuinePromotedAd(tweetNode) {
  if (!tweetNode) return false;

  // 1. Check socialContext (Standard Promoted Tweet label)
  const socialContext = tweetNode.querySelector('[data-testid="socialContext"]');
  if (socialContext) {
    const text = socialContext.textContent.trim().toLowerCase();
    if (text && AD_INDICATORS.some((k) => text === k || text.includes(k))) {
      return true;
    }
  }

  // 2. Check header text for ad/promoted indicators
  const spans = tweetNode.querySelectorAll('[dir] > span');
  for (let i = 0; i < spans.length; i++) {
    const text = spans[i].textContent.trim().toLowerCase();
    if (text && AD_INDICATORS.includes(text)) {
      return true;
    }
  }

  // 3. Promoted product URLs
  if (tweetNode.querySelector('a[href*="/quick_promote_web/"], a[href*="promoted-tweets"]')) {
    return true;
  }

  // 4. Placement tracking ONLY if outside video player and tweet has no video
  const tracking = tweetNode.querySelector('[data-testid="placementTracking"]');
  if (tracking) {
    // If tracking is inside a video player, it is video analytics, NOT an ad!
    if (tracking.closest('[data-testid="videoPlayer"], [data-testid="videoComponent"]')) {
      return false;
    }
    // If it has video, do NOT treat as ad unless explicitly marked promoted
    if (!tweetNode.querySelector('video')) {
      return true;
    }
  }

  return false;
}

function scanAndPurgeAds(root = document) {
  if (!settings.adBlockerEnabled) return;

  // 1. Selector search on genuine ad cells
  const tracked = root.querySelectorAll?.('[data-testid="placementTracking"]');
  if (tracked) {
    for (let i = 0; i < tracked.length; i++) {
      const node = tracked[i];
      // Skip if inside video player!
      if (node.closest('[data-testid="videoPlayer"], [data-testid="videoComponent"]')) {
        continue;
      }
      const cell = node.closest('[data-testid="cellInnerDiv"]');
      if (cell && isGenuinePromotedAd(cell)) {
        cleanAdElement(cell);
      }
    }
  }

  // 2. Links to promoted ad products
  const promoLinks = root.querySelectorAll?.('a[href*="/quick_promote_web/"], a[href*="promoted-tweets"]');
  if (promoLinks) {
    for (let i = 0; i < promoLinks.length; i++) {
      const cell = promoLinks[i].closest('[data-testid="cellInnerDiv"]');
      if (cell) cleanAdElement(cell);
    }
  }

  // 3. Promoted trend cards in sidebar
  const promoTrends = root.querySelectorAll?.('[data-testid="trend"]:has([data-testid="placementTracking"])');
  if (promoTrends) {
    for (let i = 0; i < promoTrends.length; i++) {
      promoTrends[i].style.setProperty('display', 'none', 'important');
    }
  }
}

function detectAndBlockAd(tweetNode) {
  if (!settings.adBlockerEnabled) return false;
  if (processedAdNodes.has(tweetNode)) return false;

  if (isGenuinePromotedAd(tweetNode)) {
    cleanAdElement(tweetNode);
    return true;
  }

  return false;
}

// ============================================================================
// Blue Checkmark Filter
// ============================================================================

function detectAndFilterBlueCheck(tweetNode) {
  if (!settings.blueCheckFilter || settings.blueCheckFilter === 'off') return false;

  const handle = getHandleFromTweet(tweetNode);
  if (isHandleWhitelisted(handle)) return false;

  const verifiedIcon = tweetNode.querySelector('[data-testid="User-Name"] [data-testid="icon-verified"]');
  if (!verifiedIcon) return false;

  if (tweetNode.querySelector('[data-testid="icon-verified-business"], [data-testid="icon-verified-government"]')) {
    return false;
  }

  if (settings.blueCheckFilter === 'replies-only') {
    const isReply = location.pathname.includes('/status/') ||
                    !!tweetNode.querySelector('a[href*="/status/"][dir="ltr"]') ||
                    !!tweetNode.closest('[data-testid="replies"]') ||
                    (tweetNode.previousElementSibling && tweetNode.previousElementSibling.matches('article'));
    if (!isReply) return false;
  }

  const act = settings.blueCheckAction || 'hide';
  incrementBlockMetric('blueCheckCount');

  if (act === 'hide') {
    applyHideTweet(tweetNode, { rule: 'Blue Checkmark', scope: 'verified', handle });
  } else if (act === 'mute') {
    performMute(tweetNode, { source: 'blue-check', rule: 'Blue Check' });
  } else if (act === 'block') {
    performBlock(tweetNode, { requireConfirmDelay: false, source: 'blue-check', rule: 'Blue Check' });
  }

  return true;
}

// ============================================================================
// Bot & Bait Detection
// ============================================================================

const ENGAGEMENT_BAIT_PATTERNS = [
  'follow + rt', 'rt + follow', 'rt and follow', 'follow and rt',
  'فالو + ریت', 'ریت + فالو', 'بک میدم', 'فالو = بک', 'فالو بک قطعی',
  'ایردراپ قطعی', 'drop your sol', 'drop your wallet', 'retweet to win',
];

function detectBotOrBait(tweetNode) {
  const handle = getHandleFromTweet(tweetNode);
  if (isHandleWhitelisted(handle)) return null;

  if (settings.filterDefaultAvatars) {
    const avatarImg = tweetNode.querySelector('[data-testid="Tweet-User-Avatar"] img, [data-testid="UserAvatar-Container"] img');
    const src = avatarImg?.getAttribute('src') || '';
    if (src.includes('default_profile_images') || src.includes('default_profile_normal')) {
      return { rule: 'Default Avatar', type: 'bot', handle };
    }
  }

  if (settings.filterEngagementBait) {
    const tweetTextEl = tweetNode.querySelector('[data-testid="tweetText"]');
    if (tweetTextEl) {
      const text = tweetTextEl.textContent.toLowerCase();
      for (const bait of ENGAGEMENT_BAIT_PATTERNS) {
        if (text.includes(bait)) {
          return { rule: `Bait: ${bait}`, type: 'bait', handle };
        }
      }
    }
  }

  return null;
}

// ============================================================================
// No-Boys Mode: Smart Guy / Male Account Detection Engine (v3.0.1 Extended)
// Multi-layer detection:
// 1. Female Guard: Absolute immunity for female accounts (names, pronouns, bio keywords, emojis)
// 2. Male Pronouns (he/him, he/his) in bio, name, or handle
// 3. Male Emojis (👨, 👦, 🧔, ♂️, etc.) in bio or name
// 4. Male Identity Keywords (پسر, مرد, آقا, پدر, داداش, boy, guy, etc.)
// 5. Massive Persian & International Male First Names in Display Name & Handle
// 6. Typo & Orthographic resilience: Tatweel stripping, tashkeel removal, ZWNJ,
//    repetition collapsing (علیییی -> علی, reeeza -> reza), leetspeak decoding (m0hammad, r3za),
//    handle affix stripping (mr_, its_, _boy, _pv, _dev).
// ============================================================================

const MALE_PERSIAN_NAMES = [
  'آبتین', 'آتبین', 'آترین', 'آذرخش', 'آذرفر', 'آذرباد', 'آرتام', 'آرتان', 'آرتین', 'آرش',
  'آرشام', 'آرمان', 'آرمند', 'آرمین', 'آریا', 'آریابرزن', 'آریاراد', 'آریامهر', 'آریان', 'آریو',
  'آریوبرزن', 'آزاد', 'آروین', 'آوید', 'آیدین', 'آراد', 'آرسین', 'آریابد', 'آرسن', 'آرمیا',
  'آران', 'آیریک', 'آروان', 'آیین', 'آراز', 'آیهان', 'آسید', 'آصف', 'آقامیر', 'آشور',
  'آرتا', 'آرشین', 'ارجمند', 'ارمیا', 'اروند', 'اسکندر', 'افلاطون', 'انور', 'ایرج', 'ایلدرم',
  'ایلگار', 'ایلشن', 'ابراهیم', 'ابوالفضل', 'ابوالقاسم', 'ابوالحسن', 'ابومسلم', 'ابوطالب', 'احتشام', 'احسان',
  'احمد', 'احمدرضا', 'احمدعلی', 'ادریس', 'ارژنگ', 'ارسام', 'ارسلان', 'ارشا', 'ارشیا', 'ارغون',
  'اسد', 'اسدالله', 'اسفندیار', 'اسحاق', 'اشک', 'اشکان', 'اسماعیل', 'اصغر', 'اصی', 'افشار',
  'افشین', 'اکبر', 'اکبی', 'البرز', 'الیا', 'الیاس', 'الچین', 'الیار', 'الوند', 'امان',
  'امان‌الله', 'امید', 'امیدرضا', 'امیدعلی', 'امیر', 'امیری', 'امیرسام', 'امیرارسلان', 'امیرپاشا', 'امیرحافظ',
  'امیرطاها', 'امیرکیان', 'امیرکسری', 'امیرماهان', 'امیرنیک', 'امیرآریا', 'امیربهادر', 'امیرصدرا', 'امیرسامان', 'امیرپوریا',
  'امیرعلی', 'امیرحسین', 'امیرمحمد', 'امیررضا', 'امیرمهدی', 'امیرعباس', 'امیرامین', 'امیرجواد', 'امیرصادق', 'امیرحسن',
  'امیرکبیر', 'امیرخان', 'امیربخش', 'امیرمنصور', 'امیرمحسن', 'امیرمجید', 'امیرسجاد', 'امیرسعید', 'امین', 'انوش',
  'انوشیروان', 'اوکتای', 'اورنگ', 'اهورا', 'ایوب', 'ایزد', 'ایلیا', 'ایلخان', 'ایمان', 'بابان',
  'بابک', 'باربد', 'بارمان', 'بارزان', 'بامداد', 'بامشاد', 'بامین', 'باور', 'بختیار', 'بردیا',
  'برسام', 'برزو', 'برزین', 'برومند', 'بزرگمهر', 'بکتاش', 'بنیامین', 'بهبد', 'بهداد', 'بهراد',
  'بهرام', 'بهرنگ', 'بهروز', 'بهزاد', 'بهشاد', 'بهنام', 'بهمن', 'بهنیا', 'بهروش', 'بیژن',
  'بیستون', 'باقر', 'بشیر', 'برهان', 'باسط', 'بلال', 'بهروزان', 'باقرخان', 'باقی', 'بایرامعلی',
  'بختیارخان', 'بدیع', 'برات', 'براتعلی', 'برنا', 'پورنگ', 'پیروزفر', 'پیمان‌فر', 'پارسا', 'پاشا',
  'پاکان', 'پدرام', 'پرهام', 'پژمان', 'پژواک', 'پوریا', 'پویا', 'پویان', 'پیام', 'پیروز',
  'پیمان', 'پادرا', 'پولاد', 'پهلوان', 'پطرس', 'پندار', 'پارسیک', 'تارخ', 'تاجبخش', 'تایماز',
  'تقی', 'توفیق', 'تکین', 'تمیم', 'توما', 'تیرداد', 'تهمتن', 'تهمورث', 'تورج', 'توران',
  'تیمور', 'تیام', 'ثامن', 'ثابت', 'تاج‌الدین', 'تقی‌خان', 'تورنگ', 'توس', 'جابر', 'جاسب',
  'جاوید', 'جاماسب', 'جعفر', 'جلال', 'جمال', 'جمشید', 'جواد', 'جهان', 'جهانبخش', 'جهانگیر',
  'جهاندار', 'جهانبخت', 'جبار', 'جوزف', 'جعفرقلی', 'جمال‌الدین', 'جوانشیر', 'جهانگیرخان', 'چاووش', 'چیا',
  'چیاکو', 'چنگیز', 'چکاو', 'حاتم', 'حاجی', 'حاج', 'حامد', 'حامی', 'حبیب', 'حبیب‌الله',
  'حجت', 'حر', 'حسام', 'حسن', 'حسین', 'حسی', 'حسون', 'حمزه', 'حمید', 'حمیدرضا',
  'حمیدعلی', 'حیدر', 'حافظ', 'حنیف', 'حبیب‌قلی', 'حسام‌الدین', 'حسنعلی', 'حسینقلی', 'خسرو', 'خشایار',
  'خلیل', 'خلیل‌الله', 'خداداد', 'خدایار', 'خرم', 'خیام', 'خسروخان', 'خلیل‌قلی', 'دادمهر', 'دادور',
  'دارا', 'داراب', 'داریوش', 'داریو', 'داشا', 'دامیار', 'دامون', 'دانا', 'دانیار', 'دانیال',
  'داوود', 'داود', 'داوید', 'دلاور', 'دلیر', 'دلووان', 'دوران', 'دیاکو', 'داداش‌علی', 'دانش',
  'داور', 'درویش', 'ذبیح', 'ذبیح‌الله', 'ذوالفقار', 'رئوف', 'راد', 'رادان', 'رادبرد', 'رادمان',
  'رادمرز', 'رادمهر', 'رادین', 'رادوین', 'راستین', 'راشا', 'راشد', 'رامبد', 'رامتین', 'رامین',
  'راوش', 'رایان', 'رحمان', 'رحمت', 'رحمت‌الله', 'رحیم', 'رستم', 'رسول', 'رشید', 'رضا',
  'رضایی', 'رضاچی', 'رجب', 'روح‌الله', 'روزبه', 'روژان', 'روژمان', 'روژبین', 'روئین', 'ریبین',
  'ریوند', 'رها', 'رهام', 'روهام', 'رستم‌علی', 'رضاقلی', 'رمضان', 'رمضانعلی', 'روشن', 'زادان',
  'زاهد', 'زامیاد', 'زانا', 'زانیار', 'زرتشت', 'زکریا', 'زوبین', 'زواره', 'زین‌العابدین', 'ژوبین',
  'ژیان', 'ژیوار', 'ژیر', 'ساسان', 'ساتیار', 'ساجد', 'ساعد', 'سالار', 'سام', 'سامان',
  'سامین', 'سامیار', 'سامی', 'ساموئل', 'سبحان', 'سجاد', 'سدرا', 'سردار', 'سردشت', 'سرکش',
  'سروش', 'سهراب', 'سهند', 'سهیل', 'سیاوش', 'سیروان', 'سیروس', 'سینا', 'سینی', 'سیامک',
  'سیف‌الله', 'سنجر', 'سلجوق', 'سلیمان', 'ستار', 'سهروردی', 'سراج‌الدین', 'سعیدخان', 'سلطانعلی', 'سلیمان‌خان',
  'سیدرضا', 'سیدعلی', 'سیدمحمد', 'سیدحسین', 'شادمهر', 'شارو', 'شاهرخ', 'شاهروخ', 'شاهکار', 'شاهین',
  'شاهو', 'شایان', 'شایگان', 'شروین', 'شروان', 'شنتیا', 'شهاب', 'شهبار', 'شهباز', 'شهداد',
  'شهرام', 'شهرداد', 'شهروز', 'شهریار', 'شوان', 'شعیب', 'شفیع', 'شاکر', 'شمس‌الله', 'شمعون',
  'شیدوس', 'شیرزاد', 'شیردل', 'شیث', 'شمس‌الدین', 'شهبازخان', 'شیرعلی', 'صابر', 'صادق', 'صادی',
  'صالح', 'صبور', 'صدرا', 'صدیق', 'صفدر', 'صفر', 'صمد', 'صائب', 'صادق‌خان', 'صدرالدین',
  'ضیا', 'ضیاالدین', 'طارق', 'طالب', 'طاهر', 'طاها', 'طه', 'طیب', 'طغرل', 'ظفر',
  'ظهیر', 'عابد', 'عادل', 'عارف', 'عاصم', 'عامر', 'عباس', 'عباسی', 'عبدالحسین', 'عبدالحمید',
  'عبدالرضا', 'عبدالرسول', 'عبدالرحمان', 'عبدالصمد', 'عبدالعلی', 'عبدالغفور', 'عبدالکریم', 'عبدالمجید', 'عبدالمهدی', 'عبدالهادی',
  'عبدالله', 'عزت‌الله', 'عزیز', 'عسکر', 'عسکری', 'عطا', 'عطاالله', 'عقیل', 'علی', 'علیرضا',
  'علی‌رضا', 'علی‌اکبر', 'علیاکبر', 'علی‌اصغر', 'علیاصغر', 'علی‌محمد', 'علیمحمد', 'علی‌سینا', 'علی‌سام', 'علی‌پوریا',
  'علیو', 'علایی', 'عماد', 'عمار', 'عمران', 'عیسی', 'عرفان', 'عنایت‌الله', 'عباسقلی', 'عبدالباقی',
  'عبدالخالق', 'عطاخان', 'علیقلی', 'علیخان', 'غالب', 'غلام', 'غلامرضا', 'غلام‌رضا', 'غلامحسین', 'غلامعلی',
  'غلامعباس', 'غلامحسن', 'غفار', 'غفور', 'فاتح', 'فتاح', 'فرامرز', 'فربد', 'فربود', 'فرجاد',
  'فرخ', 'فرداد', 'فردین', 'فرزاد', 'فرزام', 'فرزین', 'فرشاد', 'فرشید', 'فرنام', 'فرناس',
  'فرنود', 'فرهاد', 'فرهام', 'فرهود', 'فرهوش', 'فرید', 'فریدون', 'فیروز', 'فاضل', 'فضل‌الله',
  'فاروق', 'فواد', 'فتحعلی', 'فخرالدین', 'فرامرزخان', 'فضل‌علی', 'قادر', 'قاسم', 'قاسی', 'قائم',
  'قباد', 'قدرت', 'قدرت‌الله', 'قربان', 'قنبر', 'قهرمان', 'قاسم‌علی', 'قدرت‌خان', 'قلی', 'قربانعلی',
  'کارن', 'کارو', 'کاظم', 'کامبیز', 'کامران', 'کامی', 'کامیار', 'کاوان', 'کاوه', 'کاوس',
  'کاووس', 'کسرا', 'کسری', 'کوروش', 'کورش', 'کوشا', 'کوهیار', 'کیا', 'کیابرزین', 'کیارش',
  'کیان', 'کیانوش', 'کیاوش', 'کیخسرو', 'کیداد', 'کیقباد', 'کیوان', 'کیومرث', 'کلیم', 'کمال',
  'کمیل', 'کاکا', 'کاکو', 'کرمعلی', 'کریم‌خان', 'کمال‌الدین', 'کوچک‌خان', 'گودرز', 'گوران', 'گیو',
  'لطیف', 'لطف‌الله', 'لقمان', 'لوقا', 'لطفعلی‌خان', 'مازیار', 'ماکان', 'ماتیار', 'مانلی', 'مانی',
  'ماهان', 'ماهبد', 'ماهد', 'ماهور', 'متین', 'مجتبی', 'مجتی', 'مجید', 'محسن', 'محمد',
  'ممد', 'ممدی', 'ممدعلی', 'ممدحسین', 'ممدصادق', 'ممدامین', 'ممدحسن', 'ممدجواد', 'ممدلی', 'ممدک',
  'ممدو', 'مملی', 'ممدوف', 'محمدرضا', 'محمدعلی', 'محمدحسین', 'محمدامین', 'محمدمهدی', 'محمدجواد', 'محمدصادق',
  'محمدحسن', 'محمدباقر', 'محمدطاها', 'محمدیاسین', 'محمدپارسا', 'محمدسبحان', 'محمدعرفان', 'محمدکسری', 'محمدکیان', 'محمدهادی',
  'محمدمبین', 'محمدامید', 'محمدامیر', 'محمود', 'مختار', 'مراد', 'مرتضی', 'مرشد', 'مرقس', 'مزدا',
  'مسعود', 'مسلم', 'مصطفی', 'مصطی', 'مظفر', 'معراج', 'معین', 'مقداد', 'منصور', 'منوچهر',
  'مهبد', 'مهدی', 'مدی', 'مهدیو', 'مهدی‌رضا', 'مهدی‌یار', 'مهران', 'مهربد', 'مهرپویا', 'مهرداد',
  'مهرزاد', 'مهرسام', 'مهرشاد', 'مهزیار', 'مهیار', 'میثاق', 'میثم', 'میران', 'میرزا', 'میلاد',
  'موسی', 'متی', 'مالک', 'محمدقلی', 'محمدخان', 'محمدتقی', 'مرادعلی', 'مرتضی‌قلی', 'مظفرالدین', 'معین‌الدین',
  'منصورخان', 'مهدیقلی', 'نادر', 'ناصح', 'ناصر', 'ناصری', 'ناظم', 'نامدار', 'نامور', 'نامی',
  'نریمان', 'نصرالله', 'نصیر', 'نوح', 'نوید', 'نویان', 'نیما', 'نیماک', 'نیو', 'نچیروان',
  'نعمت', 'نعمت‌الله', 'نادرشاه', 'ناصرالدین', 'نجفقلی', 'نصرت', 'نصرت‌الله', 'نظام', 'نظام‌الدین', 'نورالدین',
  'واحد', 'وریا', 'وریامهر', 'وحید', 'وحیدرضا', 'ولی', 'ولی‌الله', 'هادی', 'هارون', 'هاشم',
  'هامون', 'هرمز', 'هرمزد', 'هلمت', 'هوال', 'هوتن', 'هوداد', 'هوشمند', 'هوشنگ', 'هوشیار',
  'هومان', 'هومن', 'هیراد', 'هیربد', 'هیرسام', 'هیرمند', 'هیرش', 'هیوا', 'هیمن', 'هاشم‌خان',
  'هدایت', 'هدایت‌الله', 'همت', 'همت‌علی', 'یاسر', 'یاسین', 'یاشار', 'یحیی', 'یزدان', 'یزدگرد',
  'یعقوب', 'یلمان', 'یولداش', 'یونس', 'یوسف', 'یاران', 'یارین', 'یارمحمد', 'یوسفعلی', 'آبان',
  'آبدار', 'آتروپات', 'آتروان', 'آترینا', 'آرتوان', 'آرتمن', 'آرتور', 'آرشاوش', 'آرشاویر', 'آریارمن',
  'آریامنش', 'آریانوش', 'آریوبار', 'آژوان', 'آسا', 'آسام', 'آسو', 'آگین', 'آیدوغموش', 'ابطحی',
  'ابتهاج', 'ابوالعلا', 'اثنی‌عشری', 'اجلال', 'احسان‌الله', 'اختردان', 'اخشید', 'ارژنگ‌خان', 'ارسن', 'ارشاد',
  'ارم', 'ارنواز', 'اسحاق‌خان', 'اسدخان', 'اسفندیارخان', 'اسکندرخان', 'اشرف', 'اشرف‌خان', 'اعظم', 'اعلم',
  'افراسیاب', 'افرند', 'افشین‌خان', 'اقصی', 'اکبرخان', 'البرزخان', 'الیاس‌خان', 'الوندخان', 'امامقلی', 'امان‌الله‌خان',
  'امین‌الدین', 'امین‌الرعایا', 'امین‌السلطان', 'امین‌الضرب', 'انصاری', 'انوشه‌روان', 'انوری', 'ایزدبخش', 'ایزدپناه', 'ایلبیگی',
  'ایلدرم‌خان', 'ایلشاد', 'ایلقار', 'ایلکین', 'باباخان', 'بابامراد', 'باباشاه', 'بابک‌خان', 'بادین', 'باران',
  'باربدخان', 'بارسین', 'بارمان‌خان', 'بازان', 'باقرشاه', 'بالی', 'بامشادخان', 'باوان', 'بایزید', 'ببرک',
  'بختیاروند', 'بدرالدین', 'بدیر', 'برادران', 'براز', 'برزویه', 'برسام‌خان', 'برمک', 'برهان‌الدین', 'بزرگ',
  'بزرگ‌مهر', 'بهادر', 'بهادرخان', 'بهارلو', 'بهرام‌خان', 'بهرام‌شاه', 'بهرادخان', 'بهروزی', 'بهزادخان', 'بهشادخان',
  'بهمن‌خان', 'بهنیاخان', 'بهرام‌علی', 'بیات', 'بیدل', 'بیرام', 'بیرامی', 'بیرنگ', 'بیژن‌خان', 'پادشاه',
  'پارساخان', 'پاشاخان', 'پاکزاد', 'پاکمهر', 'پالیز', 'پامیر', 'پاینده', 'پدرام‌خان', 'پرهام‌خان', 'پرهام‌فر',
  'پرویز', 'پرویزخان', 'پروین‌خان', 'پژمان‌خان', 'پورابراهیم', 'پوراحمد', 'پوراسماعیل', 'پورجعفر', 'پورحسین', 'پورحیدر',
  'پورداد', 'پوررضا', 'پورصادق', 'پورعباس', 'پورعلی', 'پورغلام', 'پورقاسم', 'پورمحمد', 'پورمهدی', 'پورنادر',
  'پیراسته', 'پیروزخان', 'پیروزمهر', 'پیمان‌خان', 'تاریق', 'تالار', 'تامای', 'تانسو', 'تاوات', 'تجلی',
  'تحسین', 'ترخان', 'تقوی', 'تقی‌زاده', 'تمندر', 'توان', 'توانا', 'توران‌شاه', 'تورج‌خان', 'توفیق‌خان',
  'توماج', 'توکل', 'تهمتن‌خان', 'تهمورس', 'تیردادخان', 'تیمورخان', 'تیمورلنگ', 'ثابت‌قدم', 'ثاقب', 'ثانی',
  'ثمین', 'جابرقلی', 'جاجرمی', 'جارالله', 'جامی', 'جبارعلی', 'جباری', 'جبل‌عاملی', 'جعفرخان', 'جلال‌الدین',
  'جلال‌خان', 'جمشیدخان', 'جمشیدشاه', 'جناب', 'جنید', 'جوادخان', 'جوادمهر', 'جوانبخت', 'جوانه', 'جهانبخش‌خان',
  'جهانگیرشاه', 'جهاندیده', 'جهانشاه', 'جهانسوز', 'چابک', 'چاوش', 'چاوشان', 'چاور', 'چاووش‌باشی', 'چلیپا',
  'چمران', 'چوپان', 'چوپانی', 'حاتم‌خان', 'حاجی‌زاده', 'حاجی‌پور', 'حامدی', 'حامدخان', 'حبیب‌زاده', 'حبیب‌پور',
  'حجت‌الله', 'حرعاملی', 'حرآبادی', 'حریری', 'حسام‌خان', 'حسام‌مهر', 'حسنعلی‌خان', 'حسن‌زاده', 'حسن‌پور', 'حسینعلی‌خان',
  'حسین‌زاده', 'حسین‌پور', 'حسینی', 'حصاری', 'حفیظ', 'حفیظ‌الله', 'حق‌شناس', 'حق‌گو', 'حق‌پرست', 'حلاج',
  'حمدالله', 'حمزه‌خان', 'حمیدخان', 'حمیدزاده', 'حمیدپور', 'حیدرخان', 'حیدرعلی‌خان', 'خاتم', 'خادم', 'خادم‌الشریعه',
  'خالق', 'خالقداد', 'خاوران', 'خداپرست', 'خدابخش', 'خدادادخان', 'خداوردی', 'خدایاری', 'خسروشاه', 'خسروپناه',
  'خشنود', 'خلیل‌زاده', 'خلیل‌پور', 'خندان', 'خورشیدمهرداد', 'خوش‌بین', 'خوش‌چهره', 'خوش‌خبر', 'خوش‌دست', 'خوش‌رو',
  'خوش‌زبان', 'خوش‌فرجام', 'خوش‌قدم', 'خوش‌نژاد', 'خوش‌نویس', 'خورسند', 'داداشی', 'دادبخش', 'دادبه', 'دادجو',
  'دادخواه', 'دادفر', 'دادگر', 'دادگستر', 'دادمان', 'دادویه', 'دانیال‌خان', 'داودخان', 'داودزاده', 'داودپور',
  'داورمنش', 'داوری', 'دایان', 'درخشان', 'درخشنده', 'درویش‌علی', 'دستان', 'دلاورخان', 'دلفان', 'دلشاد',
  'دلیران', 'دهباشی', 'دهزاد', 'دهقان', 'دهکردی', 'دیانت', 'دیدار', 'دیده‌ور', 'دیلم', 'دیلمی',
  'دیلمان', 'دین‌پرور', 'ذاکر', 'ذاکری', 'ذبیحی', 'ذوالفقارخان', 'ذوالفنون', 'ذهن‌بین', 'رادپور', 'رادفر',
  'رادنژاد', 'رادور', 'رازدار', 'رازق', 'رازقی', 'راسخ', 'راستی', 'راشدین', 'رافع', 'راغب‌پور',
  'رام', 'رامپور', 'رامجردی', 'رامشگر', 'رامفر', 'راهبر', 'راهدار', 'راهنما', 'ربیع', 'ربیعی',
  'رجبی', 'رجایی', 'رجحان', 'رخشنده', 'رزم‌آرا', 'رزمجو', 'رزمخواه', 'رستم‌خان', 'رستم‌زاد', 'رسول‌زاده',
  'رسول‌پور', 'رسولی', 'رشادت', 'رشدیه', 'رشدین', 'رشیدالدین', 'رشیدپور', 'رضاپور', 'رضازاده', 'رضائیان',
  'رضامند', 'رضوان', 'رضوانی', 'روزبهان', 'روزبهانی', 'روزدار', 'روزگار', 'روشن‌بین', 'روشن‌روان', 'روشن‌ضمیر',
  'روشن‌علی', 'روحبخش', 'روحانی', 'رهبر', 'رهنما', 'رهی', 'ریاحی', 'ربیع‌زاده', 'زاهدخان', 'زاهدزاده',
  'زایر', 'زبید', 'زرآبادی', 'زرین', 'زرین‌دست', 'زرین‌کمر', 'زرین‌کوب', 'زرین‌نام', 'زعیم', 'زکایی',
  'زکریایی', 'زنگنه', 'زند', 'زندی', 'زهتاب', 'زوار', 'زیار', 'زیاری', 'ژاندارم', 'ژاو',
  'ژک', 'ژیان‌فر', 'ژیوان', 'ژیور', 'سابقی', 'ساعدی', 'ساعدالدین', 'ساغری', 'سالارالدین', 'سالاروند',
  'سالک', 'سالمی', 'سام‌پور', 'سام‌زاده', 'سامان‌پور', 'سامان‌زاده', 'سامانیان', 'سامری', 'سامور', 'ساوجی',
  'ساوه', 'ساوجبلاغی', 'سبحانی', 'سبزواری', 'سجادزاده', 'سجادپور', 'سراج', 'سراجی', 'سرتیپ', 'سرتیپ‌زاده',
  'سرحدی', 'سردارپور', 'سردارزاده', 'سردارنیا', 'سرمد', 'سرمدی', 'سرور', 'سروری', 'سزاوار', 'سدید',
  'سعیدزاده', 'سعیدپور', 'سعیدی', 'سعیدیان', 'سلیمی', 'سلیمیان', 'سمندر', 'سنایی', 'سنجری', 'سهراب‌خان',
  'سهندی', 'سهیل‌پور', 'سهروردیان', 'سیاوش‌خان', 'سیادت', 'سیامکی', 'سیدآبادی', 'سیدان', 'سیرجانی', 'سینایی',
  'شاد', 'شاداب', 'شادان', 'شادباش', 'شادفر', 'شادکام', 'شادلو', 'شادمان', 'شادمهرخان', 'شادنوش',
  'شادی', 'شاطر', 'شاطریان', 'شاهمرادی', 'شاه‌ولی', 'شاه‌علی', 'شاه‌محمد', 'شاه‌حسین', 'شاه‌عباس', 'شاه‌رضا',
  'شاه‌قاسم', 'شاه‌نواز', 'شاهین‌فر', 'شایسته‌مهر', 'شباهنگ', 'شباویز', 'شبستری', 'شبلی', 'شجاع', 'شجاع‌الدین',
  'شجاع‌پور', 'شجاعی', 'شجاعیان', 'شجریان', 'شریعت', 'شریعتی', 'شریف', 'شریف‌زاده', 'شریف‌پور', 'شریفیان',
  'شعبان', 'شعبان‌علی', 'شعبانی', 'شفا', 'شفایی', 'شفیعی', 'شفیعیان', 'شقاقی', 'شکیب', 'شکیبامهر',
  'شمس', 'شمس‌علی', 'شمسایی', 'شمسی', 'شمسیان', 'شنگول', 'شوکتی', 'شهرام‌خان', 'شهرام‌پور', 'شهرام‌زاده',
  'شهریارخان', 'شهریارپور', 'شهریاری', 'شهنازخان', 'شهنی', 'شهیدی', 'شیبانی', 'شیخ‌الاسلام', 'شیخ‌الاسلامی', 'شیخ‌علی',
  'شیخ‌محمد', 'شیرمحمد', 'شیرعلی‌خان', 'شیردل‌خان', 'شیرازی', 'شیروانی', 'شیرویه', 'صابرپور', 'صابری', 'صابریان',
  'صادق‌پور', 'صادق‌زاده', 'صادقیان', 'صالح‌پور', 'صالح‌زاده', 'صالحی', 'صالحیان', 'صامت', 'صامتی', 'صباحی',
  'صبحدم', 'صبح‌خیز', 'صبوری', 'صدر', 'صدرزاده', 'صدرالدین‌خان', 'صدری', 'صدوقی', 'صدیق‌پور', 'صدیق‌زاده',
  'صدیقی', 'صدیقیان', 'صراطی', 'صفار', 'صفاری', 'صفائیان', 'صفوی', 'صفویان', 'صفی', 'صفی‌الدین',
  'صفی‌الله', 'صفی‌پور', 'صفی‌زاده', 'صیاد', 'صیادی', 'صیادمنش', 'ضارب', 'ضامنی', 'ضیاپور', 'ضیازاده',
  'ضیایی', 'ضیائیان', 'طالب‌پور', 'طالب‌زاده', 'طالبی', 'طالبیان', 'طاهرپور', 'طاهرزاده', 'طاهری', 'طاهریان',
  'طاهرخان', 'طاووس', 'طباطبایی', 'طباطبائی', 'طبرسی', 'طبسی', 'طبیب', 'طبیب‌زاده', 'طراوت', 'طریقت',
  'طلوعی', 'طهماسب', 'طهماسبی', 'طهمورث', 'طهمورثی', 'طوفان', 'ظریف', 'ظریفی', 'ظفرپور', 'ظفرزاده',
  'ظفریان', 'ظهیرالدین', 'ظهوری', 'عابدی', 'عابدیان', 'عادل‌پور', 'عادل‌زاده', 'عادلی', 'عارف‌پور', 'عارف‌زاده',
  'عارفی', 'عاشور', 'عاشوری', 'عاصمی', 'عاطفی', 'عاقلی', 'عامری', 'عبادی', 'عباس‌پور', 'عباس‌زاده',
  'عباسیان', 'عبدالباسط', 'عبدالعظیم', 'عبدالغنی', 'عبدالواحد', 'عبدی', 'عبقر', 'عتیق', 'عتیقی', 'عتیق‌الله',
  'عثمان', 'عدل', 'عدلی', 'عدالت', 'عدالت‌خواه', 'عرب', 'عرب‌زاده', 'عرب‌پور', 'عراقی', 'عزیزی',
  'عزیزیان', 'عسگری', 'عسگریان', 'عشقی', 'عصاری', 'عطار', 'عطارزاده', 'عطاری', 'عطاریان', 'عطوفی',
  'عظیم', 'عظیمی', 'عظیم‌پور', 'عفیف', 'عفیفی', 'علائی', 'علامیر', 'علامه', 'علوی', 'علی‌اکبرپور',
  'علی‌اصغرپور', 'علی‌پور', 'علی‌زاده', 'علی‌نیا', 'علی‌دوست', 'علی‌بخش', 'علی‌مراد', 'علینژاد', 'علی‌وردی', 'عمادی',
  'عماری', 'عمید', 'عنایت‌پور', 'عنایتی', 'عهد', 'عهدی', 'عیسی‌پور', 'عیسی‌زاده', 'غازیان', 'غایب',
  'غریب', 'غریبی', 'غریب‌پور', 'غفارپور', 'غفارزاده', 'غفاری', 'غفوری', 'غفوریان', 'غلام‌پور', 'غلام‌زاده',
  'غلامیان', 'غنی', 'غنی‌زاده', 'غنی‌پور', 'فائق', 'فائقی', 'فتاح‌پور', 'فتاح‌زاده', 'فتاحی', 'فتاحیان',
  'فتح‌الله‌پور', 'فتح‌الله‌زاده', 'فتحی', 'فتحیان', 'فخر', 'فخری', 'فخرایی', 'فدایی', 'فراست', 'فراستی',
  'فرامرزی', 'فرامرزیان', 'فراهانی', 'فربدفر', 'فرجام', 'فرجام‌مهر', 'فرجامی', 'فرح‌بخش', 'فرخ‌رو', 'فرخ‌زاد',
  'فرخ‌منش', 'فرد', 'فردادفر', 'فردوس', 'فردوسی', 'فردین‌پور', 'فرزانه', 'فرزانه‌فر', 'فرزدق', 'فرزین‌پور',
  'فرسام', 'فرساد', 'فرشادفر', 'فرشیدفر', 'فرمان', 'فرمانبر', 'فرمانروا', 'فرهمند', 'فرهمندپور', 'فروتن',
  'فروزان', 'فریدپور', 'فریدزاده', 'فریدی', 'فریدونی', 'فصیح', 'فصیحی', 'فضائلی', 'فضل', 'فضلی',
  'فکور', 'فلاح', 'فلاحی', 'فولاد', 'فولادی', 'فولادوند', 'فیروزپور', 'فیروززاده', 'فیروزفام', 'فیروزکوهی',
  'قائم‌مقام', 'قادری', 'قادریان', 'قاسم‌پور', 'قاسم‌زاده', 'قاسمی', 'قاسمیان', 'قاضی', 'قاضی‌زاده', 'قاضی‌نور',
  'قانع', 'قانعیان', 'قانونی', 'قاهر', 'قدس', 'قدسی', 'قدس‌طینت', 'قدوسی', 'قدرت‌پور', 'قدرتی',
  'قدیمی', 'قربان‌پور', 'قربان‌زاده', 'قربانی', 'قربانیان', 'قریشی', 'قزوینی', 'قزل', 'قزل‌باش', 'قشم',
  'قشمی', 'قصاب', 'قصابی', 'قضاوت', 'قطب', 'قطبی', 'قلعه', 'قلعه‌بانی', 'قلی‌پور', 'قلی‌زاده',
  'قلیان', 'قمری', 'قنبری', 'قنبریان', 'قوامی', 'قویدل', 'قهرمانی', 'قهرمانیان', 'کاتب', 'کاتبی',
  'کاتوزیان', 'کاشانی', 'کاشف', 'کاشفی', 'کاظم‌پور', 'کاظم‌زاده', 'کاظمی', 'کاظمیان', 'کاظم‌خان', 'کاکایی',
  'کامیاب', 'کامرانی', 'کامرانیان', 'کامیارفر', 'کانونی', 'کانون', 'کاوش', 'کاوش‌مهر', 'کاویان', 'کاویانی',
  'کبیری', 'کبیریان', 'کتابی', 'کتیبه', 'کدیور', 'کرامت', 'کرامتی', 'کرد', 'کردپور', 'کردستانی',
  'کرمانی', 'کرمانشاهی', 'کریم‌پور', 'کریم‌زاده', 'کریمی', 'کریمیان', 'کسرایی', 'کلالی', 'کلهر', 'کمالی',
  'کمالیان', 'کنعانی', 'کواکب', 'کواکبی', 'کیامهر', 'کیان‌پور', 'کیان‌زاده', 'کیانی', 'کیانیان', 'کیخسروی',
  'کیقبادی', 'کیوانی', 'کیوانفر', 'کیومرثی', 'گنابادی', 'گودرزی', 'گیل', 'گیلانی', 'گیله‌مرد', 'لاچین',
  'لاله', 'لاری', 'لاریجانی', 'لاجوردی', 'لایق', 'لبیب', 'لشکری', 'لطفی', 'لطفیان', 'لقایی',
  'لهراسب', 'لهراسبی', 'لواسانی', 'ماجدی', 'مادح', 'مارلیک', 'مازندرانی', 'مالک‌پور', 'مالکی', 'مامانی',
  'مامش', 'ماموری', 'مانامانی', 'مانی‌فر', 'ماهر', 'ماهری', 'ماهوتی', 'ماهیار', 'مبشری', 'مبین‌پور',
  'مجاهد', 'مجاهدی', 'مجتهد', 'مجتهدزاده', 'مجتهدی', 'مجد', 'مجدی', 'مجدالدین', 'مجذوب', 'مجلل',
  'مجلسی', 'مجمر', 'مجیدی', 'مجیدیان', 'محامی', 'محتشم', 'محتشمی', 'محسنی', 'محسنیان', 'محقق',
  'محققی', 'محمدپور', 'محمدزاده', 'محمدیان', 'محمدیار', 'محمدی‌نژاد', 'محمودی', 'محمودیان', 'مختاری', 'مختاریان',
  'مختوم‌قلی', 'مختوم', 'مختومی', 'مددی', 'مدرس', 'مدرسی', 'مدنی', 'مدنیان', 'مدیر', 'مدیرزاده',
  'مدیری', 'مدیریان', 'مرادی', 'مرادیان', 'مرتضوی', 'مرتضویاء', 'مرجانی', 'مردانی', 'مرزبان', 'مرزوق',
  'مرعشی', 'مرودشتی', 'مروتی', 'مروج', 'مروجی', 'مروزی', 'مزید', 'مژدهی', 'مسعودپور', 'مسعودزاده',
  'مسعودی', 'مسعودیان', 'مسیح', 'مسیحا', 'مسیحی', 'مشاور', 'مشایخ', 'مشایخی', 'مشتاق', 'مشتاقی',
  'مشفق', 'مشفقی', 'مشکات', 'مشکاتی', 'مشکوه', 'مشکور', 'مشکی', 'مشکین', 'مشهدی', 'مصباح',
  'مصباحی', 'مصدق', 'مصدقی', 'مصری', 'مصلح', 'مصلحی', 'مصلحیان', 'مصور', 'مضطر', 'مطهری',
  'مطهریان', 'مظاهری', 'مظلوم', 'مظلومی', 'مظفری', 'مظفریان', 'معارفی', 'معتمد', 'معتمدی', 'معتمدنیا',
  'معتمدالملک', 'معتضد', 'معتضدی', 'معدل', 'معرفت', 'معروفی', 'معروفیان', 'معصوم', 'معصومی', 'معصومیان',
  'معظمی', 'معین‌پور', 'معین‌زاده', 'معینی', 'معینیان', 'مغازه‌ای', 'مقدم', 'مقدم‌مراغه‌ای', 'مقدسی', 'مقدسیان',
  'مقتدا', 'مقتدایی', 'مقرون', 'مکتوبی', 'مکرم', 'مکرومی', 'مکفی', 'مکی', 'مکیان', 'ممتاز',
  'ممتازی', 'منزه', 'منصف', 'منصفی', 'منطق', 'منطقی', 'منظوم', 'منظوری', 'منفرد', 'منوچهری',
  'منوچهریان', 'مهام', 'مهبودی', 'مهدوی', 'مهدویان', 'مهدی‌زاده', 'مهدی‌پور', 'مهدیان', 'مهرآرا', 'مهرآسا',
  'مهران‌پور', 'مهران‌زاده', 'مهرانفر', 'مهرانی', 'مهرآیین', 'مهربان', 'مهربانی', 'مهردادپور', 'مهردادزاده', 'مهرزادفر',
  'مهرگان', 'مهری', 'مهرویان', 'مهیاری', 'میر', 'میرآب', 'میرآبادی', 'میراحمدی', 'میربابایی', 'میرباقری',
  'میرپناه', 'میرتاج‌الدینی', 'میرجلیلی', 'میرحسینی', 'میرحیدری', 'میردامادی', 'میرزاآقا', 'میرزابابا', 'میرزایی', 'میرزائی',
  'میرسلیم', 'میرصادقی', 'میرطاهری', 'میرعابدینی', 'میرعلی', 'میرفتحی', 'میرفندرسکی', 'میرقاسمی', 'میرکمالی', 'میرلوحی',
  'میرمحمدی', 'میرمحمدرضایی', 'میرمرادی', 'میرمصطفی', 'میرمنصور', 'میرمؤمنی', 'میرمهدی', 'میرنظامی', 'میروالی', 'میرولی',
  'میزبانی', 'میثمی', 'ناصح‌پور', 'ناصحی', 'ناصحیان', 'ناصرپور', 'ناصرزاده', 'ناصریان', 'ناطق', 'ناطقی',
  'ناظر', 'ناظری', 'ناظمی', 'نامجو', 'نامدارپور', 'نامداری', 'نامی‌پور', 'نامیان', 'نایب', 'نایبی',
  'نبوی', 'نبی', 'نبی‌زاده', 'نبی‌پور', 'نبی‌الله', 'نجات', 'نجاتی', 'نجاتیان', 'نجف', 'نجف‌زاده',
  'نجف‌پور', 'نجفی', 'نجفیان', 'نجمی', 'نخجوانی', 'نخعی', 'ندام', 'ندایی', 'نداف', 'ندیمی',
  'نراقی', 'نرسی', 'نرسیس', 'نژاد', 'نژادحسینی', 'نژادعلی', 'نژادفلاح', 'نژادقلی', 'نصر', 'نصراصفهانی',
  'نصرتی', 'نصرتیان', 'نصیری', 'نصیریان', 'نظارت', 'نظر', 'نظرزاده', 'نظرپور', 'نظری', 'نظری‌منش',
  'نظمی', 'نظم‌الدین', 'نعمان', 'نعمتی', 'نعمتیان', 'نقی', 'نقی‌پور', 'نقی‌زاده', 'نقیب', 'نقیبی',
  'نمازی', 'نمازیان', 'نمود', 'نواب', 'نوابی', 'نور', 'نوراحمد', 'نورالله‌پور', 'نوربخش', 'نوروزی',
  'نوروزیان', 'نوری', 'نوریان', 'نوش‌آذر', 'نوش‌آفرین', 'نوشین‌مهر', 'نوین', 'نوینی', 'نهایتی', 'نهاوندی',
  'نهروانی', 'نیارکی', 'نیازی', 'نیک', 'نیک‌آیین', 'نیک‌اندیش', 'نیک‌بین', 'نیک‌پی', 'نیک‌دل', 'نیک‌رای',
  'نیک‌رو', 'نیک‌زاد', 'نیک‌فر', 'نیک‌فال', 'نیک‌قدم', 'نیک‌مرام', 'نیک‌نام', 'نیک‌نژاد', 'نیک‌خواه', 'نیک‌پور',
  'نیکبخت', 'نیکیان', 'نیلی', 'نیماپور', 'نیمافر', 'واعظ', 'واعظی', 'واقفی', 'والی', 'والی‌پور',
  'والی‌زاده', 'وحیدپور', 'وحیدزاده', 'وحیدی', 'وحیدیان', 'وحیدمنش', 'ورزنده', 'وزین', 'وزیری', 'وزیریان',
  'وفا', 'وفادار', 'وفایی', 'وفائی', 'ولی‌پور', 'ولی‌زاده', 'ولی‌خانی', 'ولی‌نژاد', 'هادی‌پور', 'هادیزاده',
  'هادیان', 'هادی‌فر', 'هادی‌منش', 'هانی', 'همتی', 'همتیان', 'همایونی', 'همدم', 'هوشنگی', 'هوشیارپور',
  'هوشیاری', 'هومنی', 'هیربدی', 'هیرمندی', 'هیبتی', 'هیدجی', 'یادگار', 'یادگاری', 'یاسمی', 'یاسی',
  'یاشارپور', 'یاشاری', 'یاوری', 'یحیوی', 'یحیی‌پور', 'یحیی‌زاده', 'یزدانی', 'یزدانیان', 'یعقوبی', 'یعقوبیان',
  'یگانگی', 'یگانه', 'یوسف‌پور', 'یوسف‌زاده', 'یوسفی', 'یوسفیان'
];

const MALE_LATIN_NAMES = [
  'ali', 'alireza', 'alirezaa', 'alirez', 'alirezai', 'alirezaei', 'amirreza', 'amirali', 'amirhossein', 'amirmohammad',
  'amirabbas', 'amirmahdi', 'amirmehdi', 'amirjavad', 'amir', 'amiiir', 'amirwise', 'amiri', 'amirian', 'reza',
  'rezaa', 'reeeza', 'rezaw', 'rezoo', 'rezai', 'rezaee', 'rezam', 'mohammad', 'mohamad', 'muhammad',
  'mohamed', 'muhammed', 'mohammadreza', 'mohammadali', 'mohammadhossein', 'mohammadi', 'mamad', 'mammad', 'mamadi', 'mamo',
  'mamali', 'mamex', 'hossein', 'hosein', 'hossin', 'hosyn', 'hosi', 'hosseini', 'hassan', 'hasan',
  'hassani', 'mehdi', 'mahdi', 'mahdy', 'mehdy', 'madi', 'sajjad', 'sajad', 'sohrab', 'sina',
  'nima', 'parsa', 'arash', 'behzad', 'behnam', 'babak', 'pouya', 'pooya', 'puya', 'pourya',
  'porya', 'poorya', 'peyman', 'payman', 'pezhman', 'pejman', 'javad', 'javed', 'hamed', 'hamid',
  'danial', 'daniel', 'dani', 'ramin', 'roozbeh', 'ruzbeh', 'saman', 'sepehr', 'saeed', 'saeid',
  'said', 'soheil', 'shayan', 'shahin', 'sadegh', 'sadigh', 'abbas', 'erfan', 'farzad', 'farhad',
  'farid', 'kamran', 'kaveh', 'kasra', 'kourosh', 'kurosh', 'kian', 'kiyan', 'maziar', 'mazyar',
  'mani', 'majid', 'mohsen', 'morteza', 'mostafa', 'mehran', 'mehrdad', 'milad', 'navid', 'vahid',
  'vahyd', 'hadi', 'yashar', 'younes', 'yunus', 'yunes', 'ehsan', 'ahmad', 'ahmed', 'ashkan',
  'omid', 'omyd', 'iman', 'arman', 'armin', 'aydin', 'bardia', 'benyamin', 'benjamin', 'pedram',
  'parham', 'payam', 'dariush', 'daryoush', 'daryush', 'rasoul', 'rasool', 'soroush', 'soroosh', 'siavash',
  'shervin', 'shahab', 'shahriar', 'emad', 'masoud', 'masood', 'meysam', 'maysam', 'matin', 'nader',
  'houman', 'hooman', 'hootan', 'hirad', 'yasin', 'yazdan', 'arsalan', 'ebrahim', 'ibrahim', 'esmail',
  'ismail', 'akbar', 'asghar', 'behrooz', 'behruz', 'shahram', 'siroos', 'cyrus', 'adel', 'ghasem',
  'mahmoud', 'mahmood', 'mansour', 'mansoor', 'manouchehr', 'mehyar', 'nariman', 'habib', 'afshin', 'ario',
  'ariya', 'arya', 'khosro', 'khosrow', 'rostam', 'sam', 'salar', 'samiar', 'sami', 'fardin',
  'mojtaba', 'yousef', 'yosef', 'yahya', 'radin', 'rayan', 'roham', 'rooham', 'sourena', 'karen',
  'koosha', 'kusha', 'mahan', 'namee', 'nami', 'noyan', 'artin', 'ilia', 'ahura', 'taha',
  'faramarz', 'keyvan', 'kayvan', 'aria', 'aryan', 'shahrokh', 'toraj', 'jamshid', 'bahram', 'esfandiar',
  'bijan', 'bizhan', 'ardavan', 'ardeshir', 'hoshang', 'houshang', 'farrokh', 'farokh', 'farshid', 'farshad',
  'shapur', 'shapoor', 'homayoun', 'homayun', 'shahbaz', 'shervan', 'vario', 'voria', 'sardar', 'hesam',
  'hessam', 'khashayar', 'kamyar', 'kambiz', 'kayumars', 'kiyomars', 'araz', 'ayhan', 'baban', 'barzan',
  'bakhtiar', 'taymaz', 'tiam', 'chia', 'chiako', 'daniar', 'delir', 'ribin', 'zana', 'zhir',
  'zhiwar', 'soran', 'sirwan', 'shahu', 'shwan', 'hemen', 'hewal', 'hirsh', 'oktay', 'afshar',
  'tekin', 'damon', 'arad', 'arsin', 'aryabad', 'arsen', 'armia', 'aran', 'ayrik', 'arvan',
  'aeen', 'satyar', 'mehrad', 'yarin', 'john', 'david', 'michael', 'mike', 'james', 'robert',
  'bob', 'bobby', 'william', 'bill', 'billy', 'thomas', 'tom', 'tommy', 'dan', 'danny',
  'matthew', 'matt', 'alex', 'alexander', 'chris', 'christopher', 'mark', 'paul', 'george', 'steven',
  'steve', 'brian', 'kevin', 'jason', 'jeff', 'jeffrey', 'eric', 'scott', 'ryan', 'justin',
  'brandon', 'jake', 'jacob', 'luke', 'lucas', 'adam', 'nick', 'nicholas', 'jack', 'samuel',
  'ben', 'harry', 'oliver', 'jackson', 'liam', 'noah', 'ethan', 'mason', 'andrew', 'andy',
  'anthony', 'tony', 'charles', 'charlie', 'josh', 'joshua', 'nathan', 'nate', 'peter', 'pete',
  'henry', 'edward', 'ed', 'eddie', 'aaron', 'sean', 'shawn', 'simon', 'victor', 'vincent',
  'vince', 'patrick', 'pat', 'richard', 'rick', 'ricky', 'dick', 'gary', 'larry', 'terry',
  'tim', 'timothy', 'alan', 'allan', 'allen', 'bruce', 'carl', 'craig', 'dennis', 'douglas',
  'doug', 'frank', 'greg', 'gregory', 'raymond', 'ray', 'roger', 'ronald', 'ron', 'ronnie',
  'russell', 'russ', 'carlos', 'marco', 'marcus', 'leo', 'leon', 'leonardo', 'max', 'maximilian',
  'felix', 'isaac', 'joseph', 'oscar', 'louis', 'lewis', 'arthur', 'theo', 'theodore', 'sebastian',
  'jesse', 'gabriel', 'elias', 'julian', 'adrian', 'christian', 'dominic', 'colin', 'ian', 'jasper',
  'owen', 'kyle', 'tyler', 'dylan', 'caleb', 'austin', 'hunter', 'cameron', 'connor', 'travis',
  'shane', 'cody', 'dustin', 'jared', 'trevor', 'alavi', 'moradi', 'rezaei', 'ahmadi', 'mousavi',
  'kazemi', 'hashemi', 'ghasemi', 'abbasi', 'karimi', 'salehi', 'jafari', 'sadeghi', 'bagheri', 'rahimi',
  'ebrahimi', 'mohammadzadeh', 'rezazadeh', 'alizadeh', 'amirzadeh', 'hoseinzadeh'
];

const FEMALE_PERSIAN_NAMES = [
  'فاطمه', 'زهرا', 'مریم', 'زینب', 'نرگس', 'سارا', 'نیلوفر', 'مهسا', 'پریسا', 'نگار',
  'نسترن', 'بهاره', 'بهار', 'شیما', 'رویا', 'الهام', 'سحر', 'عاطفه', 'یاسمن', 'یاس',
  'پروانه', 'فرشته', 'مرجان', 'مونا', 'آیدا', 'شقایق', 'کیمیا', 'هانیه', 'حانیه', 'سپیده',
  'ترانه', 'شبنم', 'مهشید', 'پگاه', 'غزل', 'صبا', 'حدیث', 'سمیه', 'ملیکا', 'سوگند',
  'نگین', 'نازنین', 'آتنا', 'یلدا', 'دنیا', 'روژان', 'روناک', 'باران', 'آناهیتا', 'بهنوش',
  'تینا', 'درسا', 'دلارام', 'دیبا', 'رکسانا', 'رونیکا', 'ساغر', 'ستایش', 'سونیا', 'شیدا',
  'طناز', 'عسل', 'فرناز', 'لادن', 'لیلا', 'مارال', 'مائده', 'ماندانا', 'مهتاب', 'مهدیس',
  'میترا', 'نوشین', 'نیکی', 'هدیه', 'هلیا', 'یکتا', 'آنیتا', 'اسما', 'پریا', 'تارا',
  'حسنا', 'حنا', 'خاطره', 'راحله', 'راحیل', 'رها', 'ریحانه', 'ژاله', 'سمانه', 'سمیرا',
  'شراره', 'شکوفه', 'شمیم', 'فرنوش', 'فریبا', 'گلناز', 'لاله', 'لعیا', 'محیا', 'مژده',
  'مژگان', 'مهناز', 'نادیا', 'نسرین', 'نغمه', 'هما', 'ویدا', 'گلرخ', 'لیدا', 'سیمین',
  'شیرین', 'پریناز', 'پانته‌آ', 'پانته‌ا', 'تهمینه', 'سودابه', 'فرانک', 'منیژه', 'کتایون',
  'گوهر', 'مهین', 'شهین', 'پروین', 'توران', 'ایران', 'اکرم', 'اقدس', 'ملوک', 'بتول',
  'صغری', 'کبری', 'طاهره', 'معصومه', 'اشرف', 'ستاره', 'سایه', 'شعله', 'شکیبا', 'شیوا',
  'طلا', 'فروغ', 'گیتی', 'مرمر', 'نوا', 'ونوس', 'هنگامه', 'آویشن', 'رژین', 'سروین',
  'طیبه', 'فائزه', 'مهلا', 'نیره', 'وجیهه', 'نازی', 'نازلی', 'ملودی', 'ملینا', 'مهرو',
  'هلن', 'هلنا', 'هانا', 'آیسان', 'آیلین', 'آیلا', 'الینا', 'المیرا', 'پرنیان', 'ترنم',
  'چشمه', 'دلربا', 'درنا', 'روژین', 'روجا', 'رومینا', 'ژوان', 'سوگل', 'شادن', 'شهرزاد',
  'عاطی', 'غزال', 'کژال', 'کیانا', 'مهسیما', 'مهنوش', 'مینو', 'نوشا', 'هیران', 'ونوشه',
  'تیدا', 'چکاوک', 'آرزو', 'ارغوان', 'افسانه', 'اکتای', 'انوشه', 'پگاه', 'پوپک', 'جوانه'
];

const FEMALE_LATIN_NAMES = [
  'fatemeh', 'fateme', 'ftm', 'zahra', 'zhra', 'maryam', 'mary', 'mrym', 'sara', 'sarah',
  'mahsa', 'mhsa', 'parisa', 'niloofar', 'niloufar', 'negar', 'nastaran', 'bahar', 'bahareh',
  'shima', 'roya', 'elham', 'sahar', 'atefeh', 'atefe', 'kimya', 'kimia', 'hanieh', 'sepideh',
  'taraneh', 'shabnam', 'mahshid', 'pegah', 'ghazal', 'saba', 'negin', 'nazanin', 'nazi',
  'melika', 'sogand', 'darya', 'yalda', 'donya', 'tina', 'dorsa', 'delaram', 'sheida',
  'asal', 'farnaz', 'leila', 'leyla', 'lila', 'maral', 'maedeh', 'mandana', 'mahtab',
  'mitra', 'noushin', 'nooshin', 'niki', 'helia', 'priya', 'reihaneh', 'samira', 'shirin',
  'parinaz', 'pantea', 'katayoun', 'simin', 'shahrzad', 'melina', 'atina', 'arezoo', 'arzu',
  'helen', 'helena', 'hana', 'aysan', 'aylin', 'elina', 'elmira', 'parnian', 'kiana',
  'minoo', 'minu', 'romina', 'sogol',
  'emma', 'olivia', 'sophia', 'isabella', 'mia', 'charlotte', 'amelia', 'emily', 'anna',
  'jessica', 'ashley', 'amanda', 'jennifer', 'taylor', 'lauren', 'rachel', 'megan', 'hannah',
  'victoria', 'elizabeth', 'chloe', 'samantha', 'nicole', 'stephanie', 'alyssa', 'kayla',
  'lucy', 'claire', 'grace', 'lily', 'zoe', 'natalie', 'audrey', 'allison', 'maya', 'leah'
];

function buildExpandedPersianSet(baseList) {
  const set = new Set();
  for (const raw of baseList) {
    if (!raw) continue;
    const clean = raw.trim();
    set.add(clean);
    if (clean.startsWith('آ')) set.add('ا' + clean.slice(1));
    else if (clean.startsWith('ا')) set.add('آ' + clean.slice(1));
    if (clean.includes('‌')) {
      set.add(clean.replace(/‌/g, ''));
      set.add(clean.replace(/‌/g, ' '));
    }
  }
  return set;
}

function buildExpandedLatinSet(baseList) {
  const set = new Set();
  for (const raw of baseList) {
    if (!raw) continue;
    const clean = raw.toLowerCase().trim();
    set.add(clean);
    set.add(clean.replace(/ou/g, 'oo'));
    set.add(clean.replace(/oo/g, 'ou'));
    set.add(clean.replace(/ou/g, 'u'));
    set.add(clean.replace(/oo/g, 'u'));
    set.add(clean.replace(/u/g, 'ou'));
    set.add(clean.replace(/u/g, 'oo'));
    set.add(clean.replace(/ee/g, 'i'));
    set.add(clean.replace(/ei/g, 'ey'));
    set.add(clean.replace(/ey/g, 'ei'));
    set.add(clean.replace(/ei/g, 'i'));
    set.add(clean.replace(/ey/g, 'i'));
    set.add(clean.replace(/kh/g, 'x'));
    set.add(clean.replace(/x/g, 'kh'));
    set.add(clean.replace(/gh/g, 'q'));
    set.add(clean.replace(/q/g, 'gh'));
    set.add(clean.replace(/([a-z])\1+/g, '$1'));
  }
  return set;
}

const MALE_PERSIAN_SET = buildExpandedPersianSet(MALE_PERSIAN_NAMES);
const MALE_LATIN_SET = buildExpandedLatinSet(MALE_LATIN_NAMES);
const FEMALE_PERSIAN_SET = buildExpandedPersianSet(FEMALE_PERSIAN_NAMES);
const FEMALE_LATIN_SET = buildExpandedLatinSet(FEMALE_LATIN_NAMES);

const HONORIFIC_TITLES = new Set([
  'دکتر', 'مهندس', 'سید', 'حاجی', 'حاج', 'کربلایی', 'شیخ', 'میرزا', 'استاد',
  'سرهنگ', 'سردار', 'dr', 'eng', 'mr', 'mrs', 'ms', 'seyed', 'seyyed', 'haj', 'haji', 'prof'
]);

const PERSIAN_SUFFIXES = ['خان', 'جان', 'آقا', 'اقا', 'زاده', 'پور', 'نیا', 'راد', 'فر', 'وند'];
const HANDLE_PREFIXES = ['mr', 'dr', 'seyed', 'haj', 'haji', 'its', 'iam', 'the', 'real', 'official', 'lord', 'king', 'sir', 'boy'];
const HANDLE_SUFFIXES = ['boy', 'pv', 'official', 'dev', 'tech', 'pro', 'music', 'fit', 'gym', 'iran', 'teh', 'ir'];

const LEET_MAP = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
};

function decodeLeetspeak(str) {
  if (!str) return '';
  return str.replace(/[0134578]/g, (ch) => LEET_MAP[ch] || ch);
}

function collapseRepeatedLetters(str) {
  if (!str) return '';
  return str.replace(/([a-z])\1+/g, '$1');
}

function normalizePersianText(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFKC')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[‌‍​­﻿]/g, ' ')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ةۀ]/g, 'ه')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ی')
    .toLowerCase();
}

function cleanPersianTokens(str) {
  if (!str) return [];
  const n = normalizePersianText(str);
  const candidates = new Set();
  const tokens = n.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);

  for (const t of tokens) {
    if (HONORIFIC_TITLES.has(t)) continue;
    if (t.length >= 2) {
      candidates.add(t);
      const collapsed3 = t.replace(/(.)\1{2,}/gu, '$1');
      candidates.add(collapsed3);
      for (const suff of PERSIAN_SUFFIXES) {
        if (t.endsWith(suff) && t.length - suff.length >= 2) {
          candidates.add(t.slice(0, -suff.length));
        }
      }
    }
  }
  return Array.from(candidates);
}

function getHandleCandidateTokens(handle) {
  if (!handle) return [];
  const clean = String(handle).replace(/^@/, '').toLowerCase();
  const rawParts = clean.split(/[^a-z0-9]+/).filter(Boolean);
  const candidates = new Set();

  for (const part of rawParts) {
    const pureAlpha = part.replace(/[0-9]/g, '');
    if (pureAlpha.length >= 3) {
      candidates.add(pureAlpha);
      candidates.add(collapseRepeatedLetters(pureAlpha));
    }
    const decoded = decodeLeetspeak(part).replace(/[0-9]/g, '');
    if (decoded.length >= 3) {
      candidates.add(decoded);
      candidates.add(collapseRepeatedLetters(decoded));
    }
    for (const pref of HANDLE_PREFIXES) {
      if (decoded.startsWith(pref) && decoded.length - pref.length >= 3) {
        const stripped = decoded.slice(pref.length);
        candidates.add(stripped);
        candidates.add(collapseRepeatedLetters(stripped));
      }
    }
    for (const suff of HANDLE_SUFFIXES) {
      if (decoded.endsWith(suff) && decoded.length - suff.length >= 3) {
        const stripped = decoded.slice(0, -suff.length);
        candidates.add(stripped);
        candidates.add(collapseRepeatedLetters(stripped));
      }
    }
  }
  return Array.from(candidates);
}

function extractDisplayNameCandidates(displayName) {
  if (!displayName) return { persianTokens: [], latinTokens: [] };
  const persianTokens = cleanPersianTokens(displayName);

  const latinClean = String(displayName).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const rawLatin = latinClean.split(/\s+/).filter(Boolean);
  const latinCandidates = new Set();

  for (const part of rawLatin) {
    const pureAlpha = part.replace(/[0-9]/g, '');
    if (pureAlpha.length >= 3) {
      latinCandidates.add(pureAlpha);
      latinCandidates.add(collapseRepeatedLetters(pureAlpha));
    }
    const decoded = decodeLeetspeak(part).replace(/[0-9]/g, '');
    if (decoded.length >= 3) {
      latinCandidates.add(decoded);
      latinCandidates.add(collapseRepeatedLetters(decoded));
    }
  }
  return { persianTokens, latinTokens: Array.from(latinCandidates) };
}

const FEMALE_HANDLE_KEYWORD_REGEX = /(?:^|[._\-])(girl|girly|woman|female|mother|mom|sister|wife|daughter|mrs|ms|miss|lady|queen|princess|dokhtar|dokhtare|khanom|khanome|banoo|maman)(?:[._\-]|$)/i;
const FEMALE_PRONOUNS_REGEX = /\b(she\/her|she\/hers|she \/ her|her\/hers|sheher|she\/they)\b/i;
const FEMALE_EMOJIS_REGEX = /(?:👩|👧|👱‍♀️|👩‍🦰|👩‍🦱|👩‍🦳|👩‍🦲|👸|👰|🤰|🤱|♀️|♀|🚺)/u;
const FEMALE_WORDS_REGEX = /(?:^|[^\p{L}\p{N}])(دختر(?:م|ونه|ام|مون)?|دخمل(?:ی)?|زن(?:م|ونه|انه|ام)?|خان[وم]م?(?:ی|ام|تون|مون)?|بانو(?:ی|هام|مون)?|دوشیزه|مادر(?:م|ام|مون)?|مامان(?:م|ام|تون|مون|ی)?|مامی|خواهر(?:م|ام|مون)?|[آا]بجی|ابجی|زنونه|عروس(?:م|مون)?|خاله|عمه|girl|girly|woman|female|mother|mom|sister|wife|daughter|mrs|ms|miss|lady|queen|princess)(?:$|[^\p{L}\p{N}])/ui;

const MALE_PRONOUNS_REGEX = /\b(he\/him|he\/his|he\/him\/his|he \/ him|him\/his|hehim|he\/they)\b/i;
const MALE_EMOJIS_REGEX = /(?:👨|👦|🧔|🧔‍♂️|👨‍🦰|👨‍🦱|👨‍🦳|👨‍🦲|🤴|🤵|♂️|♂|🚹)/u;
const MALE_WORDS_REGEX = /(?:^|[^\p{L}\p{N}])(پسر(?:م|ک|ونه|ام|مون)?|گل‌پسر|گل\s*پسر|شاه‌پسر|مرد(?:م|ونه|انه|ک|ام)?|جوانمرد|[آا]قا(?:مون|م|یی|ها|زاده)?|[آا]قای|پدر(?:م|ام|مون)?|بابا(?:م|ش|شم|یی|هام|مون)?|پاپا|داداش(?:م|ی|یا|یام|ام|تون|مون)?|دادا(?:م|ش)?|داش(?:ی|م)?|برادر(?:م|ام|مون)?|برار|کاکا|کاکو|شوهر(?:م|ام|تون|مون)?|داماد|شازده|سلطان|boy|guy|dude|man|father|dad|brother|husband|son|mister|gentleman|boyish|male|bro|bloke|chap|fella)(?:$|[^\p{L}\p{N}])/ui;
const MALE_HANDLE_KEYWORD_REGEX = /(?:^|[._\-])(boy|guy|dude|man|father|dad|brother|bro|husband|son|mister|mr|pesare?|marde?|shazdeh|dadash|dada|kaka)(?:[._\-]|$)/i;

function containsMalePersianSubname(token) {
  if (!token || token.length < 2) return false;
  if (MALE_PERSIAN_SET.has(token)) return true;
  for (let i = 0; i < MALE_PERSIAN_NAMES.length; i++) {
    const name = MALE_PERSIAN_NAMES[i];
    if (name.length >= 3) {
      if (token.startsWith(name) || token.endsWith(name)) return true;
    } else if (name.length === 2 && (name === 'علی' || name === 'رضا')) {
      if (token.startsWith(name) || token.endsWith(name)) return true;
    }
  }
  return false;
}

function containsMaleLatinSubname(str) {
  if (!str || str.length < 3) return false;
  const decoded = decodeLeetspeak(str);
  const collapsed = collapseRepeatedLetters(decoded);
  if (MALE_LATIN_SET.has(str) || MALE_LATIN_SET.has(decoded) || MALE_LATIN_SET.has(collapsed)) {
    return true;
  }
  for (let i = 0; i < MALE_LATIN_NAMES.length; i++) {
    const name = MALE_LATIN_NAMES[i];
    if (name.length >= 4) {
      if (str.includes(name) || decoded.includes(name) || collapsed.includes(name)) return true;
    } else if (name.length === 3) {
      if (
        str.startsWith(name) || str.endsWith(name) ||
        decoded.startsWith(name) || decoded.endsWith(name) ||
        str.includes('_' + name) || str.includes(name + '_') ||
        decoded.includes('_' + name) || decoded.includes(name + '_')
      ) {
        return true;
      }
    }
  }
  return false;
}

function evaluateGuyAccount(displayName, bio, handle) {
  const normBio = normalizePersianText(bio);
  const normName = normalizePersianText(displayName);
  const rawHandle = String(handle || '').replace(/^@/, '');
  const normHandle = rawHandle.toLowerCase();

  // ---------------------------------------------------------
  // Step 1: Female Guard (Absolute Immunity for Women)
  // ---------------------------------------------------------
  if (FEMALE_HANDLE_KEYWORD_REGEX.test(rawHandle)) {
    return false;
  }

  if (FEMALE_PRONOUNS_REGEX.test(bio) || FEMALE_PRONOUNS_REGEX.test(displayName) || FEMALE_PRONOUNS_REGEX.test(normHandle)) {
    return false;
  }

  if (FEMALE_EMOJIS_REGEX.test(bio) || FEMALE_EMOJIS_REGEX.test(displayName)) {
    return false;
  }

  if (FEMALE_WORDS_REGEX.test(normBio) || FEMALE_WORDS_REGEX.test(normName)) {
    return false;
  }

  const { persianTokens: namePersian, latinTokens: nameLatin } = extractDisplayNameCandidates(displayName);
  const handleCandidates = getHandleCandidateTokens(rawHandle);

  for (const t of namePersian) {
    if (FEMALE_PERSIAN_SET.has(t) || FEMALE_LATIN_SET.has(t)) {
      return false;
    }
  }

  for (const t of nameLatin) {
    if (FEMALE_LATIN_SET.has(t) || FEMALE_PERSIAN_SET.has(t)) {
      return false;
    }
  }

  for (const t of handleCandidates) {
    if (FEMALE_LATIN_SET.has(t) || FEMALE_PERSIAN_SET.has(t)) {
      return false;
    }
  }

  // ---------------------------------------------------------
  // Step 2: Male Indicators
  // ---------------------------------------------------------
  // A. Male Pronouns
  if (MALE_PRONOUNS_REGEX.test(bio) || MALE_PRONOUNS_REGEX.test(displayName) || MALE_PRONOUNS_REGEX.test(normHandle)) {
    return true;
  }

  // B. Male Emojis
  if (MALE_EMOJIS_REGEX.test(bio) || MALE_EMOJIS_REGEX.test(displayName)) {
    return true;
  }

  // C. Male Identity Keywords
  if (MALE_WORDS_REGEX.test(normBio) || MALE_WORDS_REGEX.test(normName)) {
    return true;
  }

  // D. Male Handle Keywords (e.g., @pesare_tanha, @mr_reza, @bad_boy_99, @pouya_boy)
  if (MALE_HANDLE_KEYWORD_REGEX.test(rawHandle)) {
    return true;
  }

  // E. Male First Names or Concatenated Subnames in Display Name
  for (const t of namePersian) {
    if (containsMalePersianSubname(t) || containsMaleLatinSubname(t)) {
      return true;
    }
  }

  for (const t of nameLatin) {
    if (containsMaleLatinSubname(t) || containsMalePersianSubname(t)) {
      return true;
    }
  }

  // F. Male First Names or Concatenated Subnames in Handle
  if (containsMaleLatinSubname(rawHandle)) {
    return true;
  }

  for (const t of handleCandidates) {
    if (containsMaleLatinSubname(t) || containsMalePersianSubname(t)) {
      return true;
    }
  }
  return false;
}

function detectGuyAccount(tweet) {
  const handle = getHandleFromTweet(tweet);
  if (!handle || isHandleBoysWhitelisted(handle)) return false;

  const cleanHandle = String(handle).toLowerCase().replace(/^@/, '').trim();

  // Fast L1 memory cache
  if (genderDetectionCache.has(cleanHandle)) {
    return genderDetectionCache.get(cleanHandle);
  }

  // Check persistent cache
  if (typeof XWiseCache !== 'undefined' && XWiseCache.getMemoryOnly) {
    const memVerdict = XWiseCache.getMemoryOnly('gender', cleanHandle);
    if (typeof memVerdict === 'boolean') {
      genderDetectionCache.set(cleanHandle, memVerdict);
      return memVerdict;
    }
  }

  const displayName = extractDisplayNameFromTweet(tweet) || '';
  const bio = extractBioForUser(handle, tweet) || '';

  const isMale = evaluateGuyAccount(displayName, bio, cleanHandle);
  genderDetectionCache.set(cleanHandle, isMale);

  if (typeof XWiseCache !== 'undefined' && XWiseCache.set) {
    XWiseCache.set('gender', cleanHandle, isMale);
  }

  return isMale;
}

// ============================================================================
// Unicode Normalization & Filter Engine
// ============================================================================

function normalizeUnicodeString(str, { caseSensitive = false } = {}) {
  if (!str) return '';

  let normalized = String(str)
    .normalize('NFKC')
    .replace(/[︀-️]/gu, '')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
    .replace(/[​-‍﻿]/g, '');

  if (!caseSensitive) {
    normalized = normalized.toLocaleLowerCase();
  }

  return normalized;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseRegex(pattern, caseSensitive) {
  const cacheKey = pattern + '::' + caseSensitive;
  if (compiledRegexCache.has(cacheKey)) {
    return compiledRegexCache.get(cacheKey);
  }

  try {
    let re = null;
    const match = pattern.match(/^\/(.*?)\/([a-z]*)$/i);
    if (match) {
      const source = match[1];
      let flags = match[2];
      if (!caseSensitive && !flags.includes('i')) flags += 'i';
      if (!flags.includes('u')) flags += 'u';
      re = new RegExp(source, flags);
    } else {
      re = new RegExp(pattern, (caseSensitive ? '' : 'i') + 'u');
    }
    compiledRegexCache.set(cacheKey, re);
    return re;
  } catch {
    compiledRegexCache.set(cacheKey, null);
    return null;
  }
}

function testPatternMatch(targetText, pattern, { caseSensitive = false, wholeWord = false, isRegex = false } = {}) {
  if (!targetText || !pattern) return false;

  const isPatternRegex = isRegex || (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0);

  if (isPatternRegex) {
    const re = parseRegex(pattern, caseSensitive);
    if (!re) return false;
    return re.test(targetText) || re.test(normalizeUnicodeString(targetText, { caseSensitive }));
  }

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

function extractDisplayNameFromTweet(tweet) {
  // Strictly take User-Name of the primary author, not the quoted tweet
  const userNames = tweet.querySelectorAll('[data-testid="User-Name"]');
  for (let i = 0; i < userNames.length; i++) {
    const un = userNames[i];
    if (isInsideQuoteTweet(un, tweet)) continue;
    const nameAnchor = un.querySelector('a[role="link"]');
    if (nameAnchor) return extractFullTextWithAlt(nameAnchor);
    return extractFullTextWithAlt(un);
  }
  return '';
}

function extractBioForUser(handle, tweet) {
  if (!handle) return '';
  const cleanHandle = String(handle).toLowerCase().replace(/^@/, '').trim();

  if (userBioCache.has(cleanHandle)) return userBioCache.get(cleanHandle);
  if (typeof XWiseCache !== 'undefined') {
    const memBio = XWiseCache.getMemoryOnly('bios', cleanHandle);
    if (memBio) {
      userBioCache.set(cleanHandle, memBio);
      return memBio;
    }
  }

  // Only read profile bio if the current page actually IS this user's profile
  const path = window.location.pathname.toLowerCase();
  if (path === `/${cleanHandle}` || path === `/${cleanHandle}/`) {
    const profileBio = document.querySelector('[data-testid="UserDescription"]');
    if (profileBio) {
      const bioText = extractFullTextWithAlt(profileBio);
      if (bioText) {
        userBioCache.set(cleanHandle, bioText);
        if (typeof XWiseCache !== 'undefined') XWiseCache.set('bios', cleanHandle, bioText);
        return bioText;
      }
    }
  }

  // Inside a tweet cell, ensure UserDescription is NOT inside a quote tweet
  const bios = tweet?.querySelectorAll?.('[data-testid="UserDescription"]');
  if (bios && bios.length > 0) {
    for (let i = 0; i < bios.length; i++) {
      const b = bios[i];
      if (isInsideQuoteTweet(b, tweet)) continue;
      const bioText = extractFullTextWithAlt(b);
      if (bioText) {
        userBioCache.set(cleanHandle, bioText);
        if (typeof XWiseCache !== 'undefined') XWiseCache.set('bios', cleanHandle, bioText);
        return bioText;
      }
    }
  }

  return '';
}

function inspectTweetAgainstFilters(tweet) {
  if (!settings.filterEngineEnabled) return null;
  const filters = settings.filters || [];
  if (!filters.length) return null;

  const handle = getHandleFromTweet(tweet);
  if (isHandleWhitelisted(handle)) return null;

  const displayName = extractDisplayNameFromTweet(tweet);
  const bio = extractBioForUser(handle, tweet);
  const tweetText = settings.filterScopes?.tweetText
    ? extractFullTextWithAlt(tweet.querySelector('[data-testid="tweetText"]'))
    : '';

  const scopes = settings.filterScopes || { displayName: true, bio: true, tweetText: false };

  for (const filter of filters) {
    if (!filter.enabled) continue;
    const pattern = filter.pattern;
    const isRegex = !!filter.isRegex;

    const testOpts = {
      caseSensitive: settings.filterCaseSensitive,
      wholeWord: settings.filterWholeWord,
      isRegex,
    };

    if (scopes.displayName && displayName) {
      if (testPatternMatch(displayName, pattern, testOpts)) {
        return { matchedFilter: filter, matchedScope: 'displayName', handle };
      }
    }

    if (scopes.bio && bio) {
      if (testPatternMatch(bio, pattern, testOpts)) {
        return { matchedFilter: filter, matchedScope: 'bio', handle };
      }
    }

    if (scopes.tweetText && tweetText) {
      if (testPatternMatch(tweetText, pattern, testOpts)) {
        return { matchedFilter: filter, matchedScope: 'tweetText', handle };
      }
    }
  }

  return null;
}

function applyDryRunBadge(tweet, match) {
  if (tweet.querySelector('.xe-filter-badge')) return;

  const badge = document.createElement('span');
  badge.className = 'xe-filter-badge xe-filter-badge-subtle';
  badge.textContent = `فیلتر: ${match.matchedFilter.pattern}`;

  const userNameEl = tweet.querySelector('[data-testid="User-Name"]');
  if (userNameEl) {
    userNameEl.appendChild(badge);
  } else {
    tweet.prepend(badge);
  }

  incrementBlockMetric('dryRunMatchCount');
  recordActivity({ handle: match.handle, action: 'dry-run', rule: match.matchedFilter.pattern, scope: match.matchedScope });
}

async function processTweetFilter(tweet) {
  if (scannedTweetNodes.has(tweet)) return;
  scannedTweetNodes.add(tweet);

  const handle = getHandleFromTweet(tweet);
  if (isHandleWhitelisted(handle)) return;

  // Ad cleaner
  if (detectAndBlockAd(tweet)) return;

  // Blue check
  if (detectAndFilterBlueCheck(tweet)) return;

  // Bot & bait
  const botMatch = detectBotOrBait(tweet);
  if (botMatch) {
    applyHideTweet(tweet, { rule: botMatch.rule, scope: botMatch.type, handle: botMatch.handle });
    return;
  }

  // No-Boys Timeline Filter (Fun Feature — strictly on "For you" timeline tab!)
  if (settings.hideBoysMode && isForYouTab() && detectGuyAccount(tweet)) {
    applyHideTweet(tweet, {
      rule: settings.language === 'fa' ? 'اکانت پسر 🚹' : 'Boy Account 🚹',
      scope: 'gender',
      handle,
    });
    return;
  }

  // Filter Engine
  const match = inspectTweetAgainstFilters(tweet);
  if (!match) return;

  const action = (match.matchedFilter.action && match.matchedFilter.action !== 'default')
    ? match.matchedFilter.action
    : (settings.filterMode || 'hide');

  if (action === 'dry-run') {
    applyDryRunBadge(tweet, match);
  } else if (action === 'hide') {
    applyHideTweet(tweet, { rule: match.matchedFilter.pattern, scope: match.matchedScope, handle: match.handle });
  } else if (action === 'auto-mute') {
    await performMute(tweet, { source: 'filter', rule: match.matchedFilter.pattern });
  } else if (action === 'auto-block') {
    await performBlock(tweet, { requireConfirmDelay: false, source: 'filter', rule: match.matchedFilter.pattern });
  }
}

// ============================================================================
// Pro Video Suite (Volume, Speed, Loop & Downloader)
// ============================================================================

const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5, 2];

function getVideoMediaUrl(video) {
  if (video.currentSrc && !video.currentSrc.startsWith('blob:')) {
    return video.currentSrc;
  }
  if (video.src && !video.src.startsWith('blob:')) {
    return video.src;
  }

  const sources = video.querySelectorAll('source');
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i].src;
    if (s && !s.startsWith('blob:')) return s;
  }

  return video.currentSrc || video.src || '';
}

function createVolumeSlider(video) {
  if (processedVideos.has(video)) return;
  processedVideos.add(video);

  if (settings.rememberVolume) video.volume = lastVolume;
  if (settings.defaultPlaybackRate) video.playbackRate = settings.defaultPlaybackRate;
  if (settings.videoLoopEnabled) video.loop = true;

  const parent = video.closest('[data-testid="videoPlayer"]') || video.parentElement;
  if (!parent) return;
  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'xe-volume-wrapper';

  // 1. Mute Icon
  const icon = document.createElement('button');
  icon.type = 'button';
  icon.className = 'xe-volume-icon';
  icon.setAttribute('aria-label', 'Toggle mute');

  // 2. Track & Slider
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
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/></svg>';
    } else if (v < 0.5) {
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M18.5 12A4.5 4.5 0 0016 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>';
    } else {
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
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

  // 3. Playback Speed Button
  const speedBtn = document.createElement('button');
  speedBtn.type = 'button';
  speedBtn.className = 'xe-video-pill-btn xe-speed-btn';
  speedBtn.textContent = (video.playbackRate || 1) + 'x';
  speedBtn.title = settings.language === 'fa' ? 'سرعت پخش ویدیو' : 'Playback Speed';

  speedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const curSpeed = video.playbackRate || 1;
    const curIdx = PLAYBACK_SPEEDS.indexOf(curSpeed);
    const nextIdx = (curIdx + 1) % PLAYBACK_SPEEDS.length;
    const nextSpeed = PLAYBACK_SPEEDS[nextIdx];

    video.playbackRate = nextSpeed;
    speedBtn.textContent = nextSpeed + 'x';
    settings.defaultPlaybackRate = nextSpeed;
    if (chrome?.storage?.sync) {
      chrome.storage.sync.set({ defaultPlaybackRate: nextSpeed });
    }
  });

  // 4. Loop Button
  const loopBtn = document.createElement('button');
  loopBtn.type = 'button';
  loopBtn.className = 'xe-video-pill-btn xe-loop-btn' + (video.loop ? ' active' : '');
  loopBtn.title = settings.language === 'fa' ? 'تکرار ویدیو (Loop)' : 'Repeat Video';
  loopBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`;

  loopBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    video.loop = !video.loop;
    loopBtn.classList.toggle('active', video.loop);
  });

  // 5. Picture-in-Picture Button
  const pipBtn = document.createElement('button');
  pipBtn.type = 'button';
  pipBtn.className = 'xe-video-pill-btn xe-pip-btn';
  pipBtn.title = settings.language === 'fa' ? 'تصویر در تصویر (PiP)' : 'Picture-in-Picture';
  pipBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z"/></svg>`;

  pipBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // Browser PiP restriction
    }
  });

  // 6. Direct Video Download Button
  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.className = 'xe-video-pill-btn xe-download-btn';
  downloadBtn.title = settings.language === 'fa' ? 'دانلود فایل ویدیو' : 'Download Video';
  downloadBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;

  downloadBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const mediaUrl = getVideoMediaUrl(video);
    if (!mediaUrl) {
      showToast(settings.language === 'fa' ? 'لینک ویدیو پیدا نشد' : 'Video URL not found');
      return;
    }

    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'XWISE_DOWNLOAD_VIDEO',
        url: mediaUrl,
        filename: `xwise-video-${Date.now()}.mp4`,
      }, (resp) => {
        if (resp && resp.success) {
          showToast(settings.language === 'fa' ? 'دانلود آغاز شد' : 'Download started');
        } else {
          window.open(mediaUrl, '_blank');
        }
      });
    } else {
      window.open(mediaUrl, '_blank');
    }
  });

  const stopProp = (e) => e.stopPropagation();
  wrapper.addEventListener('click', stopProp);
  wrapper.addEventListener('mousedown', stopProp);
  wrapper.addEventListener('pointerdown', stopProp);
  slider.addEventListener('mousedown', stopProp);
  slider.addEventListener('pointerdown', stopProp);
  slider.addEventListener('click', stopProp);

  wrapper.appendChild(icon);
  wrapper.appendChild(track);
  wrapper.appendChild(slider);
  wrapper.appendChild(speedBtn);
  wrapper.appendChild(loopBtn);
  wrapper.appendChild(pipBtn);
  if (settings.videoDownloadEnabled !== false) {
    wrapper.appendChild(downloadBtn);
  }
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
// Single Native-Matching Block Button in Action Bar
// ============================================================================

function createBlockButton(tweet) {
  if (processedTweets.has(tweet)) return;
  processedTweets.add(tweet);

  if (settings.blockButtonEnabled === false) return;

  const actionBar = tweet.querySelector('[role="group"]');
  if (!actionBar) return;

  const btn = document.createElement('div');
  btn.className = 'xe-block-btn-wrapper';
  btn.setAttribute('role', 'button');
  btn.setAttribute('tabindex', '0');
  btn.setAttribute('aria-label', settings.language === 'fa' ? 'مسدودسازی کاربر' : 'Block user');
  btn.title = settings.language === 'fa' ? 'مسدودسازی کاربر' : 'Block user';

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
  const articles = root.querySelectorAll('article');
  for (let i = 0; i < articles.length; i++) {
    createBlockButton(articles[i]);
  }
}

// ============================================================================
// Keyboard Shortcut
// ============================================================================

let hoveredElement = null;
document.addEventListener('mouseover', (e) => { hoveredElement = e.target; }, { passive: true });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && inPageDrawer?.classList.contains('xe-open')) {
    closeInPageDrawer();
    return;
  }

  if (!settings.shortcutEnabled) return;
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

  if (!matches || !hoveredElement) return;

  const tweet = hoveredElement.closest('article');
  if (!tweet) return;

  e.preventDefault();
  e.stopPropagation();
  performBlock(tweet, { requireConfirmDelay: true, source: 'manual' });
});

// ============================================================================
// Element Waiter Helper
// ============================================================================

function waitFor(root, matcher, timeoutMs = 2000) {
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
// In-Page Floating Launcher & Twitter Native Settings Drawer
// ============================================================================

let currentInPageTab = 'filters';

function toggleInPageDrawer() {
  if (!inPageDrawer) {
    createInPageDrawer();
  }
  const isOpen = inPageDrawer.classList.toggle('xe-open');
  if (isOpen) {
    renderInPageDrawerContent();
  }
}

function closeInPageDrawer() {
  if (inPageDrawer) {
    inPageDrawer.classList.remove('xe-open');
  }
}

function ensureInPageLauncher() {
  if (inPageLauncher && document.body.contains(inPageLauncher)) return;

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'xe-inpage-launcher';
  launcher.setAttribute('aria-label', 'XWise Settings');
  launcher.title = settings.language === 'fa' ? 'تنظیمات XWise Blocker' : 'XWise Blocker Settings';

  // Crisp official-style verified protection shield SVG
  launcher.innerHTML = `
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 15.5l-3.5-3.5 1.41-1.41L11 13.67l5.09-5.09 1.41 1.41L11 16.5z"/>
    </svg>
  `;

  launcher.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleInPageDrawer();
  });

  document.body.appendChild(launcher);
  inPageLauncher = launcher;
}

function createInPageDrawer() {
  if (inPageDrawer && document.body.contains(inPageDrawer)) return;

  const drawer = document.createElement('div');
  drawer.className = 'xe-inpage-drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-label', 'XWise Settings');

  const isRtl = document.documentElement.dir === 'rtl' || document.body.dir === 'rtl' || settings.language === 'fa';
  drawer.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

  const iframe = document.createElement('iframe');
  iframe.className = 'xe-inpage-iframe';
  iframe.src = chrome.runtime.getURL('popup.html');
  iframe.setAttribute('frameborder', '0');

  drawer.appendChild(iframe);
  drawer.addEventListener('click', (e) => e.stopPropagation());

  document.body.appendChild(drawer);
  inPageDrawer = drawer;
}

function renderInPageDrawerContent() {
  // Synchronized via iframe running popup.html
}

// Close drawer on outside click, ESC key, or message from iframe
window.addEventListener('message', async (e) => {
  if (e.data?.type === 'XWISE_CLOSE_DRAWER') {
    closeInPageDrawer();
  }

  if (e.data?.type === 'XWISE_DRAWER_RUN_SYNC') {
    try {
      if (globalThis.XWiseRelationshipTracker) {
        await globalThis.XWiseRelationshipTracker.init();
        const categories = await globalThis.XWiseRelationshipTracker.sync();
        e.source.postMessage({
          type: 'XWISE_DRAWER_SYNC_RESULT',
          success: true,
          categories,
          snapshot: globalThis.XWiseRelationshipTracker.latestSnapshot,
        }, '*');
      }
    } catch (err) {
      e.source.postMessage({
        type: 'XWISE_DRAWER_SYNC_RESULT',
        success: false,
        error: err.message,
      }, '*');
    }
  }
});

document.addEventListener('click', (e) => {
  if (inPageDrawer?.classList.contains('xe-open')) {
    if (!inPageDrawer.contains(e.target) && !inPageLauncher?.contains(e.target)) {
      closeInPageDrawer();
    }
  }
});

// ============================================================================
// Font & Theme
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

function detectTheme() {
  const bg = getComputedStyle(document.body).backgroundColor;
  const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 'dark';
  const [, r, g, b] = match.map(Number);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
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
      updateWhitelistSet();
      updateBoysWhitelistSet();
      applyTimelineCleaners();
      cleanWhoToFollowRecommendations(document);
      resolve(settings);
    });
  });
}

chrome.storage?.onChanged?.addListener((changes, area) => {
  if (area !== 'sync') return;
  for (const key in changes) {
    if (key in settings) {
      settings[key] = changes[key].newValue;
    }
  }
  if ('whitelist' in changes) {
    updateWhitelistSet();
  }
  if ('boysWhitelist' in changes) {
    updateBoysWhitelistSet();
    document.querySelectorAll('article.xe-tweet-hidden[data-xe-reason="gender"]').forEach((tw) => {
      const h = getHandleFromTweet(tw);
      if (isHandleBoysWhitelisted(h)) {
        tw.classList.remove('xe-tweet-hidden');
        tw.removeAttribute('data-xe-reason');
        tw.querySelector('.xe-filtered-bar[data-xe-gender="true"]')?.remove();
        hiddenTweetNodes.delete(tw);
      }
    });
  }
  if ('hideBoysMode' in changes) {
    if (changes.hideBoysMode.newValue) {
      document.querySelectorAll('article[data-testid="tweet"]').forEach((tw) => {
        scannedTweetNodes.delete(tw);
        processTweetFilter(tw);
      });
    } else {
      document.querySelectorAll('article.xe-tweet-hidden[data-xe-reason="gender"]').forEach((tw) => {
        tw.classList.remove('xe-tweet-hidden');
        tw.removeAttribute('data-xe-reason');
        tw.querySelector('.xe-filtered-bar[data-xe-gender="true"]')?.remove();
        hiddenTweetNodes.delete(tw);
      });
    }
  }
  applyTimelineCleaners();
  cleanWhoToFollowRecommendations(document);
  if (inPageDrawer?.classList.contains('xe-open')) {
    renderInPageDrawerContent();
  }
});

chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
  if (message.type === 'XWISE_SETTINGS_CHANGED') {
    loadSettings();
  }

  if (message.type === 'XWISE_RUN_RELATIONSHIP_SYNC') {
    (async () => {
      try {
        if (!globalThis.XWiseRelationshipTracker) {
          sendResponse({ success: false, error: 'ماژول ردیاب در صفحه لود نشده است.' });
          return;
        }

        await globalThis.XWiseRelationshipTracker.init();
        const categories = await globalThis.XWiseRelationshipTracker.sync();
        sendResponse({
          success: true,
          categories,
          snapshot: globalThis.XWiseRelationshipTracker.latestSnapshot,
        });
      } catch (err) {
        console.error('[XWise] In-page sync failed:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep message channel open for async response
  }

  if (message.type === 'XWISE_RUN_BATCH_ACTION') {
    (async () => {
      try {
        if (!globalThis.XWiseRelationshipTracker) {
          sendResponse({ success: false, error: 'Tracker not loaded' });
          return;
        }

        const result = await globalThis.XWiseRelationshipTracker.executeBatchAction(
          message.targets,
          message.actionType
        );
        sendResponse({ success: true, result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
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
// Scoped Scanning & MutationObserver
// ============================================================================

const pendingRoots = new Set();
let scanScheduled = false;

let currentUrl = window.location.href;
let lastIsForYou = true;

function isForYouTab() {
  const path = window.location.pathname.toLowerCase();
  // 1. Must be on home timeline root (/ or /home)
  if (path !== '/' && path !== '/home') {
    return false;
  }

  // 2. Must be on 'For you' tab (not Following, not Lists, not Profiles)
  const tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    if (tabs.length >= 2) {
      const selected = tablist.querySelector('[role="tab"][aria-selected="true"]');
      if (selected && selected !== tabs[0]) {
        return false;
      }
    }
  }

  return true;
}

function handleNavigation() {
  const urlChanged = window.location.href !== currentUrl;
  const curForYou = isForYouTab();
  const forYouChanged = curForYou !== lastIsForYou;

  if (urlChanged || forYouChanged) {
    currentUrl = window.location.href;
    lastIsForYou = curForYou;

    applyTimelineCleaners();
    cleanWhoToFollowRecommendations(document);
    cleanZenSidebar();

    // If leaving For You tab (switching to Following or navigating to a Profile):
    if (!curForYou && settings.hideBoysMode) {
      document.querySelectorAll('article[data-xe-reason="gender"]').forEach((tw) => {
        tw.classList.remove('xe-tweet-hidden', 'xe-tweet-revealed');
        tw.removeAttribute('data-xe-hidden');
        tw.removeAttribute('data-xe-revealed');
        tw.removeAttribute('data-xe-reason');
        tw.querySelector('.xe-filtered-bar')?.remove();
        tw.querySelector('.xe-rehide-banner')?.remove();
        hiddenTweetNodes.delete(tw);
      });
    } else if (curForYou && settings.hideBoysMode) {
      // Re-scan when returning to For You tab
      document.querySelectorAll('article[data-testid="tweet"]').forEach((tw) => {
        scannedTweetNodes.delete(tw);
        processTweetFilter(tw);
      });
    }
  }
}

window.addEventListener('popstate', handleNavigation);
document.addEventListener('click', (e) => {
  if (e.target.closest?.('[role="tab"], a[href="/home"], a[role="tab"]')) {
    setTimeout(handleNavigation, 80);
    setTimeout(handleNavigation, 250);
  }
}, { passive: true });

function flushScan() {
  scanScheduled = false;
  const roots = [...pendingRoots];
  pendingRoots.clear();

  for (const root of roots) {
    if (!root.isConnected) continue;

    // Purge any genuine ads
    scanAndPurgeAds(root);

    // Clean recommendations (Who to follow / Relevant people / You might like)
    cleanWhoToFollowRecommendations(root);

    addVolumeSliders(root);
    addBlockButtons(root);

    const articles = root.matches?.('article') ? [root] : root.querySelectorAll('article');
    for (let i = 0; i < articles.length; i++) {
      processTweetFilter(articles[i]);
    }
  }

  // Sweep sidebar recommendations on full document
  cleanWhoToFollowRecommendations(document);
  cleanZenSidebar();

  ensureInPageLauncher();
}

function scheduleScan(root) {
  pendingRoots.add(root || document);
  if (scanScheduled) return;
  scanScheduled = true;

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => flushScan(), { timeout: 150 });
  } else {
    setTimeout(flushScan, 60);
  }
}

const domObserver = new MutationObserver((mutations) => {
  handleNavigation();
  let shouldScan = false;
  for (let i = 0; i < mutations.length; i++) {
    const m = mutations[i];
    if (m.addedNodes.length > 0) {
      for (let j = 0; j < m.addedNodes.length; j++) {
        const node = m.addedNodes[j];
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.querySelector?.('article, video, [data-testid="cellInnerDiv"], [data-testid="UserCell"], aside, section, [data-testid="placementTracking"]') ||
              node.matches?.('article, [data-testid="cellInnerDiv"], aside, section') ||
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
      requestIdleCallback(() => flushScan(), { timeout: 150 });
    } else {
      setTimeout(flushScan, 60);
    }
  }
});

const hoverObserver = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const bioEl = node.querySelector?.('[data-testid="UserDescription"]') ||
                      (node.matches?.('[data-testid="UserDescription"]') ? node : null);
        if (bioEl) {
          const text = extractFullTextWithAlt(bioEl);
          const handleEl = node.querySelector?.('a[href^="/"]');
          const href = handleEl?.getAttribute('href');
          if (href && href.length > 1) {
            const handle = href.slice(1).split('/')[0];
            if (handle && text) {
              const clean = String(handle).toLowerCase().replace(/^@/, '').trim();
              userBioCache.set(clean, text);
              if (typeof XWiseCache !== 'undefined') {
                XWiseCache.set('bios', clean, text);
              }
            }
          }
        }
      }
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
  if (typeof XWiseCache !== 'undefined' && XWiseCache.initPromise) {
    await XWiseCache.initPromise;
  }
  injectVazirmatnFont();
  applyTheme();
  applyTimelineCleaners();
  cleanWhoToFollowRecommendations(document);

  scanAndPurgeAds(document);
  addVolumeSliders();
  addBlockButtons();
  ensureInPageLauncher();

  const existingTweets = document.querySelectorAll('article');
  for (let i = 0; i < existingTweets.length; i++) {
    processTweetFilter(existingTweets[i]);
  }

  domObserver.observe(document.body, { childList: true, subtree: true });
  hoverObserver.observe(document.body, { childList: true, subtree: true });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['style'] });
})();
