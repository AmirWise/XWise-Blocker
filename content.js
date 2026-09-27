'use strict';

/**
 * XWise Blocker v3.0.0 — Content Script
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
const userBioCache = new Map();
const compiledRegexCache = new Map();

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

function isHandleWhitelisted(handle) {
  if (!handle) return false;
  const clean = String(handle).toLowerCase().replace(/^@/, '').trim();
  return whitelistSet.has(clean);
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

function getHandleFromTweet(tweetNode) {
  if (!tweetNode) return 'user';
  const link = tweetNode.querySelector('[data-testid="User-Name"] a[role="link"]');
  const href = link?.getAttribute('href') || '';
  if (href.startsWith('/')) {
    const part = href.slice(1).split('/')[0];
    if (part && !['home', 'explore', 'notifications', 'messages'].includes(part)) {
      return part;
    }
  }
  const anyUserLink = tweetNode.querySelector('a[href^="/"][role="link"]:not([href*="/status/"])');
  if (anyUserLink) {
    const h = anyUserLink.getAttribute('href').slice(1).split('/')[0];
    if (h) return h;
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

  const bar = document.createElement('div');
  bar.className = 'xe-filtered-bar';
  bar.setAttribute('role', 'region');

  const label = document.createElement('span');
  label.className = 'xe-filtered-label';
  const cleanRule = rule || 'Filter';
  label.textContent = settings.language === 'fa'
    ? `این توییت فیلتر شده است (${cleanRule})`
    : `Tweet filtered (${cleanRule})`;

  const showBtn = document.createElement('button');
  showBtn.type = 'button';
  showBtn.className = 'xe-filtered-show-btn';
  showBtn.textContent = settings.language === 'fa' ? 'نمایش' : 'Show';

  showBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isRevealed = tweetNode.classList.toggle('xe-tweet-revealed');
    showBtn.textContent = isRevealed
      ? (settings.language === 'fa' ? 'بستن' : 'Hide')
      : (settings.language === 'fa' ? 'نمایش' : 'Show');
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
        const parentWrapper = w.closest('[data-testid="sidebarColumn"] > div > div, [data-testid="sidebarColumn"] > div');
        if (parentWrapper && parentWrapper !== sidebar) {
          hideRecommendationElement(parentWrapper);
        }
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
  const userNameContainer = tweet.querySelector('[data-testid="User-Name"]');
  if (!userNameContainer) return '';
  const nameAnchor = userNameContainer.querySelector('a[role="link"]');
  if (nameAnchor) return extractFullTextWithAlt(nameAnchor);
  return extractFullTextWithAlt(userNameContainer);
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

  const profileBio = document.querySelector('[data-testid="UserDescription"]');
  if (profileBio) {
    const bioText = extractFullTextWithAlt(profileBio);
    if (bioText) {
      userBioCache.set(cleanHandle, bioText);
      if (typeof XWiseCache !== 'undefined') XWiseCache.set('bios', cleanHandle, bioText);
      return bioText;
    }
  }

  const cellBio = tweet?.querySelector?.('[data-testid="UserDescription"]');
  if (cellBio) {
    const bioText = extractFullTextWithAlt(cellBio);
    userBioCache.set(cleanHandle, bioText);
    if (typeof XWiseCache !== 'undefined') XWiseCache.set('bios', cleanHandle, bioText);
    return bioText;
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

function handleNavigation() {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    applyTimelineCleaners();
    cleanWhoToFollowRecommendations(document);
  }
}

window.addEventListener('popstate', handleNavigation);

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
