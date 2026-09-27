'use strict';

/**
 * XWise Blocker v3.0.0 Masterpiece — Complete Controller
 * High-performance bilingual controller managing 5-tab suite,
 * real-time relationship tracking, safety action queue, and caching.
 */

// ============================================================================
// i18n Localization Dictionary
// ============================================================================
const I18N = {
  fa: {
    appSubtitle: 'سوئیت فیلتر هوشمند، ردیاب آنفالو و پاک‌ساز X',
    navDashboard: 'پیشخوان',
    navFilters: 'فیلترها',
    navTracker: 'آنفالویاب',
    navMedia: 'رسانه و تمیز',
    navSettings: 'تنظیمات',

    // Dashboard
    followersLabel: 'دنبال‌کننده',
    followingLabel: 'دنبال‌شده',
    syncBtn: 'همگام‌سازی',
    shieldMasterTitle: 'سپر محافظتی XWise',
    shieldMasterDesc: 'فیلتر هوشمند و پاک‌سازی فعال است',
    statsHeading: 'آمار عملکرد',
    statAds: 'تبلیغات مسدود',
    statFiltered: 'توییت فیلترشده',
    statBlocked: 'بلاک رسمی',
    statLost: 'آنفالو کرده‌اند',
    activityHeading: 'گزارش آخرین اقدامات',
    btnClearLog: 'پاک کردن',
    noActivityYet: 'هنوز فعالیتی ثبت نشده است.',

    // Filters
    filterEngineTitle: 'موتور فیلتر هوشمند',
    filterEngineDesc: 'بررسی خودکار نام، بایو و متن با یونیکد و Regex',
    modeLabel: 'اقدام پیش‌فرض پس از تطابق:',
    modeHide: 'پنهان‌سازی',
    modeAutoBlock: 'بلاک',
    modeAutoMute: 'بی‌صدا',
    addFilterHeading: 'افزودن فیلتر جدید',
    filterInputPlaceholder: 'کلمه، ایموجی (مانند 🍉، 🎒، 🇵🇸، ☫) یا /regex/...',
    btnAdd: 'افزودن',
    scopesLabel: 'محدوده:',
    scopeDisplayName: 'نام',
    scopeBio: 'بایو',
    scopeTweetText: 'متن توییت',
    presetPacksHeading: 'پک‌های فیلتر آماده',
    packGovTitle: '🎒 سایبری و ارزشی',
    packBaitTitle: '🎣 طعمه تعامل',
    packBettingTitle: '🎰 بت و قمار',
    packCryptoTitle: '🪙 اسپم کریپتو',
    activeFiltersHeading: 'فیلترهای فعال',
    btnClearAll: 'حذف همه',
    searchFiltersPlaceholder: 'جستجو در فیلترها...',
    noFiltersYet: 'هیچ فیلتری تعریف نشده است.',
    whitelistHeading: 'لیست سفید (مصون)',
    whitelistNote: 'اکانت‌های این لیست هرگز بلاک، میوت یا پنهان نخواهند شد.',
    whitelistPlaceholder: 'نام کاربری (مثلاً user@)',

    // Relationship Tracker
    trackerSyncNow: 'بررسی و اسکن ارتباطات',
    lastSyncLabel: 'آخرین بررسی:',
    catUnfollowers: 'آنفالو کردند',
    catNonFollowers: 'بک نداده‌ها',
    catFans: 'طرفداران',
    catMutuals: 'متقابل',
    catNewFollowers: 'جدیدها',
    trackerSearchPlaceholder: 'جستجو بر اساس نام، آیدی یا بایو...',
    selectAll: 'انتخاب همه',
    deselectAll: 'لغو انتخاب',
    trackerEmptyTitle: 'داده‌ای ثبت نشده است',
    trackerEmptySub: 'روی دکمه «بررسی و اسکن ارتباطات» کلیک کنید تا وضعیت فالورها تحلیل شود.',
    safetyRunningTitle: 'صف ایمن ضد لیمیت توییتر',
    safetyRunningDesc: 'عملیات با فاصله زمانی تصادفی (۳ تا ۵ ثانیه) اجرا می‌شود تا حساب شما هرگز لیمیت نشود.',
    btnPause: 'مکث',
    btnResume: 'ادامه',
    btnCancel: 'لغو و توقف',
    unfollowAction: 'آنفالو',
    removeFollowerAction: 'حذف فالور',
    whitelistAction: 'مصون‌سازی',
    initialScanNotice: '✅ اولین اسکن با موفقیت انجام شد و وضعیت فعلی فالورهای شما ثبت گردید. از این پس هر کاربری شما را آنفالو کند، در این بخش با علامت قرمز و زمان نمایش داده می‌شود.',
    unfollowersNotice: '⚠️ کاربران شناسایی‌شده که شما را آنفالو کرده‌اند:',

    // Media & Cleaner
    videoSuiteHeading: 'سوئیت پیشرفته ویدیو (Pro Video)',
    volumeSliderTitle: 'اسلایدر ولوم و نوار ابزار روی ویدیوها',
    volumeSliderDesc: 'دسترسی سریع به کنترل صدا، سرعت و دانلود',
    rememberVolumeTitle: 'به‌خاطرسپاری بلندی صدا',
    rememberVolumeDesc: 'حفظ میزان صدای تنظیم‌شده برای تمام ویدیوهای بعدی',
    videoDownloadTitle: 'دکمه دانلود مستقیم ویدیوها (MP4)',
    videoDownloadDesc: 'دانلود ویدیوهای باکیفیت بدون نیاز به بات یا سایت جانبی',
    videoLoopTitle: 'پخش مکرر خودکار (Loop)',
    videoLoopDesc: 'تکرار نامحدود ویدیوها پس از پایان',
    defaultSpeedLabel: 'سرعت پیش‌فرض پخش:',
    cleanerHeading: 'پاک‌سازی تایم‌لاین و خلوت‌سازی',
    adBlockerTitle: 'مسدودساز تبلیغات و اسپانسرها (Ad Blocker)',
    adBlockerDesc: 'حذف بدون پرش و کامل توییت‌های Promoted و تبلیغاتی',
    zenModeTitle: 'حالت تمرکز و مطالعه (Zen Mode)',
    zenModeDesc: 'مخفی کردن ستون‌های کناری و متمرکز کردن تایم‌لاین',
    hideWhoToFollowTitle: 'مخفی کردن «چه کسانی را دنبال کنید»',
    hideWhoToFollowDesc: 'حذف پیشنهادهای فالو و کادرهای اضافه در تایم‌لاین',
    hideProfileWhoToFollowTitle: 'مخفی کردن «پیشنهاد فالو» در پروفایل‌ها',
    hideProfileWhoToFollowDesc: 'حذف افراد پیشنهادی و افراد مرتبط در صفحه پروفایل کاربران',
    hideGrokDrawerTitle: 'مخفی کردن هوش مصنوعی Grok',
    hideGrokDrawerDesc: 'حذف دکمه‌ها و کشوی Grok از سایدبار',
    hidePremiumUpsellTitle: 'مخفی کردن تبلیغ اشتراک Premium',
    hidePremiumUpsellDesc: 'حذف کادرهای تشویق به خرید تیک آبی و پرمیوم',
    hideViewCountsTitle: 'مخفی کردن تعداد بازدید (View Count)',
    hideViewCountsDesc: 'حذف آمار ویو از پایین توییت‌ها برای سادگی بیشتر',
    antiSpamHeading: 'مقابله با بات‌ها و هرزنامه‌ها',
    filterDefaultAvatarsTitle: 'فیلتر اکانت‌های با آواتار پیش‌فرض',
    filterDefaultAvatarsDesc: 'شناسایی اکانت‌های تخم‌مرغی و بات‌های تازه‌تاسیس',
    filterEngagementBaitTitle: 'فیلتر توییت‌های طعمه تعامل (Engagement Bait)',
    filterEngagementBaitDesc: 'پنهان‌سازی عبارات مثل «بک میدم»، «فالو+ریت»',
    blueCheckFilterLabel: 'فیلتر دارندگان تیک آبی:',
    optOff: 'خاموش',
    optRepliesOnly: 'فقط در ریپلای‌ها',
    optAll: 'همه جا',

    // Settings & Cache
    settingsGeneralHeading: 'تنظیمات عمومی و کاربری',
    langSettingTitle: 'زبان افزونه (Language)',
    langSettingDesc: 'فارسی راست‌چین یا English چپ‌چین',
    shortcutSettingTitle: 'کلید میانبر بلاک سریع',
    shortcutSettingDesc: 'هاور روی توییت و فشردن کلید',
    trackerIntervalTitle: 'بررسی دوره‌ای آنفالورها',
    trackerIntervalDesc: 'اسکن خودکار در پس‌زمینه و نمایش بج نوتیفیکیشن',
    intervalOff: 'خاموش',
    interval2h: 'هر ۲ ساعت',
    interval4h: 'هر ۴ ساعت',
    interval12h: 'هر ۱۲ ساعت',
    interval24h: 'روزی یک‌بار',
    cacheManagerHeading: 'مدیریت حافظه کش هوشمند',
    cacheManagerDesc: 'کش دو لایه باعث کاهش ۹۰٪ مصرف رم مرورگر و حذف لگ می‌شود.',
    cacheItemsLabel: 'آیتم ذخیره‌شده',
    cacheSizeLabel: 'حجم تقریبی',
    btnClearCache: 'پاک‌سازی کش',
    backupHeading: 'پشتیبان‌گیری و بازیابی تنظیمات',
    btnExport: 'خروجی JSON',
    btnImport: 'ورودی JSON',
    btnResetAll: 'بازنشانی تمام تنظیمات به حالت اولیه',

    // Toasts & Messages
    cacheCleared: 'کش با موفقیت پاک‌سازی شد',
    settingsSaved: 'تنظیمات ذخیره شد',
    syncSuccess: 'ارتباطات با موفقیت همگام‌سازی شد',
    syncFailed: 'خطا در همگام‌سازی. لطفاً لاگین بودن در توییتر را بررسی کنید.',
    actionComplete: 'عملیات با موفقیت پایان یافت',
  },
  en: {
    appSubtitle: 'Smart Shield, Relationship Tracker & Clean Suite',
    navDashboard: 'Dashboard',
    navFilters: 'Filters',
    navTracker: 'Tracker',
    navMedia: 'Media & Zen',
    navSettings: 'Settings',

    // Dashboard
    followersLabel: 'Followers',
    followingLabel: 'Following',
    syncBtn: 'Sync',
    shieldMasterTitle: 'XWise Protection Shield',
    shieldMasterDesc: 'Smart filters & timeline cleaner active',
    statsHeading: 'Performance Stats',
    statAds: 'Ads Blocked',
    statFiltered: 'Filtered Tweets',
    statBlocked: 'Accounts Blocked',
    statLost: 'Unfollowers',
    activityHeading: 'Recent Activity Log',
    btnClearLog: 'Clear',
    noActivityYet: 'No activity recorded yet.',

    // Filters
    filterEngineTitle: 'Smart Filter Engine',
    filterEngineDesc: 'Automatic check of name, bio & tweet text',
    modeLabel: 'Default Action on Match:',
    modeHide: 'Hide',
    modeAutoBlock: 'Block',
    modeAutoMute: 'Mute',
    addFilterHeading: 'Add New Filter',
    filterInputPlaceholder: 'Keyword, emoji or /regex/...',
    btnAdd: 'Add',
    scopesLabel: 'Scope:',
    scopeDisplayName: 'Name',
    scopeBio: 'Bio',
    scopeTweetText: 'Tweet',
    presetPacksHeading: 'Quick Preset Packs',
    packGovTitle: '🎒 State Trolls',
    packBaitTitle: '🎣 Engagement Bait',
    packBettingTitle: '🎰 Casino & Betting',
    packCryptoTitle: '🪙 Crypto Spam',
    activeFiltersHeading: 'Active Filters',
    btnClearAll: 'Clear All',
    searchFiltersPlaceholder: 'Search filters...',
    noFiltersYet: 'No filters defined yet.',
    whitelistHeading: 'Whitelist (Exempt)',
    whitelistNote: 'Accounts in this list will never be blocked, muted, or hidden.',
    whitelistPlaceholder: 'Username (e.g. @user)',

    // Relationship Tracker
    trackerSyncNow: 'Scan & Sync Relationships',
    lastSyncLabel: 'Last Sync:',
    catUnfollowers: 'Unfollowed',
    catNonFollowers: 'Non-Followers',
    catFans: 'Fans',
    catMutuals: 'Mutuals',
    catNewFollowers: 'New',
    trackerSearchPlaceholder: 'Search by name, handle, or bio...',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    trackerEmptyTitle: 'No Data Recorded',
    trackerEmptySub: 'Click "Scan & Sync Relationships" to analyze your followers.',
    safetyRunningTitle: 'Twitter Anti-Limit Safety Queue',
    safetyRunningDesc: 'Executing with random delays (3-5s) to protect your account from rate limits.',
    btnPause: 'Pause',
    btnResume: 'Resume',
    btnCancel: 'Cancel',
    unfollowAction: 'Unfollow',
    removeFollowerAction: 'Remove',
    whitelistAction: 'Whitelist',
    initialScanNotice: '✅ Initial scan complete! Follower baseline saved. From now on, any account that unfollows you will be highlighted here.',
    unfollowersNotice: '⚠️ Accounts that have unfollowed you:',

    // Media & Cleaner
    videoSuiteHeading: 'Pro Video Suite',
    volumeSliderTitle: 'Floating Toolbar on Videos',
    volumeSliderDesc: 'Quick access to volume, speed and download controls',
    rememberVolumeTitle: 'Remember Volume Level',
    rememberVolumeDesc: 'Persist customized volume across all videos',
    videoDownloadTitle: 'Direct MP4 Download Button',
    videoDownloadDesc: 'One-click high quality video downloads',
    videoLoopTitle: 'Auto Loop Video',
    videoLoopDesc: 'Loop videos seamlessly',
    defaultSpeedLabel: 'Default Playback Speed:',
    cleanerHeading: 'Timeline Cleaner',
    adBlockerTitle: 'Ad & Sponsored Tweet Blocker',
    adBlockerDesc: 'Instant zero-flicker removal of promoted tweets',
    zenModeTitle: 'Zen Focus Reader Mode',
    zenModeDesc: 'Hide clutter sidebars and center the feed',
    hideWhoToFollowTitle: 'Hide "Who to follow"',
    hideWhoToFollowDesc: 'Remove follow recommendations from timeline',
    hideProfileWhoToFollowTitle: 'Hide Who to follow on Profiles',
    hideProfileWhoToFollowDesc: 'Hide suggested & relevant users on profile pages',
    hideGrokDrawerTitle: 'Hide Grok AI Drawer',
    hideGrokDrawerDesc: 'Remove Grok prompts and sidebar links',
    hidePremiumUpsellTitle: 'Hide Premium Upsell Banners',
    hidePremiumUpsellDesc: 'Remove premium subscription prompts',
    hideViewCountsTitle: 'Hide View Counts',
    hideViewCountsDesc: 'Remove view counts below tweets',
    antiSpamHeading: 'Anti-Spam & Bot Shield',
    filterDefaultAvatarsTitle: 'Filter Default Avatars',
    filterDefaultAvatarsDesc: 'Filter fresh egg avatar bot accounts',
    filterEngagementBaitTitle: 'Filter Engagement Bait',
    filterEngagementBaitDesc: 'Hide spam tweets begging for follow/RT',
    blueCheckFilterLabel: 'Blue Checkmark Filter:',
    optOff: 'Off',
    optRepliesOnly: 'Replies Only',
    optAll: 'All Tweets',

    // Settings & Cache
    settingsGeneralHeading: 'General Settings',
    langSettingTitle: 'Extension Language',
    langSettingDesc: 'Persian (RTL) or English (LTR)',
    shortcutSettingTitle: 'Fast Block Shortcut',
    shortcutSettingDesc: 'Hover tweet and press shortcut key',
    trackerIntervalTitle: 'Periodic Unfollower Check',
    trackerIntervalDesc: 'Automatic background scans and badge alerts',
    intervalOff: 'Off',
    interval2h: 'Every 2 hours',
    interval4h: 'Every 4 hours',
    interval12h: 'Every 12 hours',
    interval24h: 'Once daily',
    cacheManagerHeading: 'Smart Cache Manager',
    cacheManagerDesc: 'Two-tier cache reduces RAM by 90% and eliminates lag.',
    cacheItemsLabel: 'Items in Cache',
    cacheSizeLabel: 'Approx. Size',
    btnClearCache: 'Clear Cache',
    backupHeading: 'Backup & Restore',
    btnExport: 'Export JSON',
    btnImport: 'Import JSON',
    btnResetAll: 'Reset All Settings to Defaults',

    // Toasts
    cacheCleared: 'Cache cleared successfully',
    settingsSaved: 'Settings saved',
    syncSuccess: 'Relationships synced successfully',
    syncFailed: 'Sync failed. Please ensure you are logged into X.com',
    actionComplete: 'Actions completed successfully',
  },
};

// ============================================================================
// State & Variables
// ============================================================================
let currentSettings = {};
let currentLang = 'fa';
let activeCategory = 'unfollowers';
let trackerCategories = {
  unfollowers: [],
  nonFollowers: [],
  fans: [],
  mutuals: [],
  newFollowers: [],
};
const selectedUserIds = new Set();
let safetyCountdownInterval = null;

// Preset Packs
const PRESET_PACKS = {
  gov: ['🇵🇸', '🇱🇧', '🍉', '🎒', '☫', 'ارزشی', 'ولایی', 'ساندیس', 'سایبری', 'حجاب'],
  bait: ['follow + rt', 'rt + follow', 'فالو + ریت', 'بک میدم', 'فالو = بک', 'ایردراپ قطعی', 'drop your wallet'],
  betting: ['بت', 'قمار', 'کازینو', 'انفجار', 'شرط بندی', 'بونوس', 'پیش‌بینی', '1xbet', 'bet90'],
  crypto: ['airdrop', 'giveaway', 'presale', 'crypto', 'web3', 'minting', 'free mint', 'claim now', 'memecoin'],
};

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Check if running inside iframe drawer
  if (window !== window.top) {
    const closeBtn = document.getElementById('iframeCloseBtn');
    if (closeBtn) {
      closeBtn.style.display = 'flex';
      closeBtn.addEventListener('click', () => {
        window.parent.postMessage({ type: 'XWISE_CLOSE_DRAWER' }, '*');
      });
    }

    window.addEventListener('message', (event) => {
      if (event.data?.type === 'XWISE_DRAWER_SYNC_RESULT') {
        const statusEl = document.getElementById('trackerSyncStatus');
        const syncBtn = document.getElementById('trackerSyncBtn');
        if (statusEl) statusEl.style.display = 'none';
        if (syncBtn) syncBtn.disabled = false;

        if (event.data.success) {
          handleSyncSuccess(event.data.categories, event.data.snapshot);
        } else {
          showPopupToast(event.data.error || 'Sync failed');
        }
      }
    });
  }

  // Load Settings
  let loaded = await sendMessageAsync({ type: 'XWISE_GET_SETTINGS' });
  if (!loaded || Object.keys(loaded).length === 0) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      loaded = await chrome.storage.sync.get(null);
    }
  }
  currentSettings = {
    filterEngineEnabled: true,
    filterMode: 'hide',
    filterScopes: { displayName: true, bio: true, tweetText: false },
    filters: [],
    whitelist: [],
    language: 'fa',
    ...loaded,
  };
  currentLang = currentSettings.language || 'fa';
  applyLocalization(currentLang);

  // Initialize Modules & Tracker
  if (globalThis.XWiseRelationshipTracker) {
    trackerCategories = await globalThis.XWiseRelationshipTracker.init();
  }

  // Bind All Event Handlers
  setupTabs();
  setupDashboard();
  setupFiltersTab();
  setupTrackerTab();
  setupMediaTab();
  setupSettingsTab();

  // Load Initial UI States
  renderDashboard();
  renderTrackerCounts();
  renderTrackerList();
  updateCacheStats();

  // Clear extension badge on open
  sendMessageAsync({ type: 'XWISE_CLEAR_BADGE' });
});

// ============================================================================
// Messaging Helper
// ============================================================================
function sendMessageAsync(msg) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(msg, (response) => {
        resolve(response || {});
      });
    } else {
      resolve({});
    }
  });
}

async function saveSettings(updates) {
  currentSettings = { ...currentSettings, ...updates };
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    await chrome.storage.sync.set(currentSettings);
  }
  await sendMessageAsync({ type: 'XWISE_SAVE_SETTINGS', settings: currentSettings });
}

// ============================================================================
// Localization (i18n) Engine
// ============================================================================
function applyLocalization(lang) {
  currentLang = lang;
  const dict = I18N[lang] || I18N.fa;

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';

  const langTextEl = document.getElementById('langText');
  if (langTextEl) {
    langTextEl.textContent = lang === 'fa' ? 'EN' : 'فا';
  }

  // Translate all text elements
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });
}

// ============================================================================
// Navigation Tabs
// ============================================================================
function setupTabs() {
  const tabs = document.querySelectorAll('.xe-tab');
  const panes = document.querySelectorAll('.xe-tab-pane');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      tabs.forEach((t) => t.classList.remove('active'));
      panes.forEach((p) => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPane = document.getElementById(`tab-${targetTab}`);
      if (targetPane) {
        targetPane.classList.add('active');
      }

      if (targetTab === 'settings') {
        updateCacheStats();
      }
    });
  });

  // Language switcher in header
  const langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', async () => {
      const newLang = currentLang === 'fa' ? 'en' : 'fa';
      applyLocalization(newLang);
      await saveSettings({ language: newLang });
      showPopupToast(I18N[newLang].settingsSaved);
    });
  }
}

// ============================================================================
// TAB 1: DASHBOARD
// ============================================================================
async function setupDashboard() {
  const masterToggle = document.getElementById('dashMasterToggle');
  if (masterToggle) {
    masterToggle.checked = !!currentSettings.filterEngineEnabled;
    masterToggle.addEventListener('change', async () => {
      const isEnabled = masterToggle.checked;
      await saveSettings({
        filterEngineEnabled: isEnabled,
        adBlockerEnabled: isEnabled,
      });

      const dot = document.getElementById('dashShieldDot');
      if (dot) dot.classList.toggle('active', isEnabled);

      const desc = document.getElementById('dashShieldDesc');
      if (desc) {
        desc.textContent = isEnabled
          ? (I18N[currentLang].shieldMasterDesc || 'فیلتر هوشمند و پاک‌سازی فعال است')
          : (currentLang === 'fa' ? 'سپر محافظتی موقتاً غیرفعال شد' : 'Protection shield paused');
      }
    });
  }

  // Quick sync button
  const dashSyncBtn = document.getElementById('dashSyncBtn');
  if (dashSyncBtn) {
    dashSyncBtn.addEventListener('click', performSync);
  }

  // Click on account avatar/handle opens profile
  const dashAvatar = document.getElementById('dashAvatar');
  const dashHandle = document.getElementById('dashHandle');
  const openMyProfile = () => {
    const handle = dashHandle?.textContent?.replace(/^@/, '');
    if (handle && handle !== 'unknown') {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: `https://x.com/${handle}` });
      } else {
        window.open(`https://x.com/${handle}`, '_blank');
      }
    }
  };
  dashAvatar?.addEventListener('click', openMyProfile);
  dashHandle?.addEventListener('click', openMyProfile);
  if (dashAvatar) dashAvatar.style.cursor = 'pointer';
  if (dashHandle) dashHandle.style.cursor = 'pointer';

  // Clear Activity
  const btnClearActivity = document.getElementById('btnClearActivity');
  if (btnClearActivity) {
    btnClearActivity.addEventListener('click', async () => {
      if (chrome?.storage?.local) {
        await chrome.storage.local.set({ 'xwise.activityLog': [] });
        renderActivityLog([]);
      }
    });
  }
}

async function renderDashboard() {
  // Update stats
  document.getElementById('statAdBlockCount').textContent = currentSettings.adBlockCount || 0;
  document.getElementById('statHideCount').textContent = currentSettings.hideCount || 0;
  document.getElementById('statBlockCount').textContent = currentSettings.blockCount || 0;
  document.getElementById('statUnfollowCount').textContent = trackerCategories.unfollowers?.length || 0;

  // Update account card if latest snapshot exists
  const snapshot = globalThis.XWiseRelationshipTracker?.latestSnapshot;
  if (snapshot && snapshot.account) {
    const acc = snapshot.account;
    if (acc.avatar) document.getElementById('dashAvatar').src = acc.avatar;
    if (acc.name) document.getElementById('dashName').textContent = acc.name;
    if (acc.handle) document.getElementById('dashHandle').textContent = `@${acc.handle}`;
    document.getElementById('dashFollowersCount').textContent = snapshot.followerCount || (snapshot.followers?.length || 0);
    document.getElementById('dashFollowingCount').textContent = snapshot.followingCount || (snapshot.following?.length || 0);
  } else if (globalThis.XWiseTwitterApi) {
    // Try to detect user live
    globalThis.XWiseTwitterApi.getCurrentUser().then((user) => {
      if (user && user.handle) {
        if (user.avatar) document.getElementById('dashAvatar').src = user.avatar;
        if (user.name) document.getElementById('dashName').textContent = user.name;
        document.getElementById('dashHandle').textContent = `@${user.handle}`;
      }
    });
  }

  // Render recent activity log
  if (chrome?.storage?.local) {
    const res = await chrome.storage.local.get(['xwise.activityLog']);
    const list = res['xwise.activityLog'] || [];
    renderActivityLog(list);
  }
}

function renderActivityLog(list) {
  const container = document.getElementById('dashActivityList');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `<div class="xe-empty-text">${I18N[currentLang].noActivityYet}</div>`;
    return;
  }

  container.innerHTML = '';
  list.slice(0, 15).forEach((item) => {
    const row = document.createElement('div');
    row.className = 'xe-activity-item';

    const handleSpan = document.createElement('span');
    handleSpan.className = 'xe-activity-handle';
    handleSpan.textContent = `@${item.handle}`;

    const badge = document.createElement('span');
    badge.className = `xe-activity-badge xe-act-${item.action}`;
    badge.textContent = item.action === 'block' ? (currentLang === 'fa' ? 'بلاک' : 'Block')
      : item.action === 'mute' ? (currentLang === 'fa' ? 'بی‌صدا' : 'Mute')
      : (currentLang === 'fa' ? 'فیلتر' : 'Filter');

    row.appendChild(handleSpan);
    row.appendChild(badge);
    container.appendChild(row);
  });
}

// ============================================================================
// TAB 2: FILTERS & MODERATION
// ============================================================================
function setupFiltersTab() {
  const filterEngineToggle = document.getElementById('filterEngineEnabled');
  if (filterEngineToggle) {
    filterEngineToggle.checked = !!currentSettings.filterEngineEnabled;
    filterEngineToggle.addEventListener('change', async () => {
      await saveSettings({ filterEngineEnabled: filterEngineToggle.checked });
    });
  }

  // Mode buttons
  const modeButtons = document.querySelectorAll('.xe-seg-btn');
  const currentMode = currentSettings.filterMode || 'hide';
  modeButtons.forEach((btn) => {
    const mode = btn.getAttribute('data-mode');
    btn.classList.toggle('active', mode === currentMode);
    btn.addEventListener('click', async () => {
      const selectedMode = btn.getAttribute('data-mode');
      modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      await saveSettings({ filterMode: selectedMode });
    });
  });

  // Filter Scopes
  const scopes = currentSettings.filterScopes || { displayName: true, bio: true, tweetText: false };
  const scopeDisplayName = document.getElementById('scopeDisplayName');
  const scopeBio = document.getElementById('scopeBio');
  const scopeTweetText = document.getElementById('scopeTweetText');

  if (scopeDisplayName) {
    scopeDisplayName.checked = scopes.displayName !== false;
    scopeDisplayName.addEventListener('change', async () => {
      scopes.displayName = scopeDisplayName.checked;
      await saveSettings({ filterScopes: { ...scopes } });
    });
  }

  if (scopeBio) {
    scopeBio.checked = scopes.bio !== false;
    scopeBio.addEventListener('change', async () => {
      scopes.bio = scopeBio.checked;
      await saveSettings({ filterScopes: { ...scopes } });
    });
  }

  if (scopeTweetText) {
    scopeTweetText.checked = !!scopes.tweetText;
    scopeTweetText.addEventListener('change', async () => {
      scopes.tweetText = scopeTweetText.checked;
      await saveSettings({ filterScopes: { ...scopes } });
    });
  }

  // Add filter
  const btnAddFilter = document.getElementById('btnAddFilter');
  const filterInput = document.getElementById('filterInput');
  if (btnAddFilter && filterInput) {
    btnAddFilter.addEventListener('click', async () => {
      const raw = filterInput.value.trim();
      if (!raw) return;

      const isRegex = raw.startsWith('/') && raw.lastIndexOf('/') > 0;
      const filters = Array.isArray(currentSettings.filters) ? [...currentSettings.filters] : [];

      if (filters.some((f) => f.pattern.toLowerCase() === raw.toLowerCase())) {
        showPopupToast(currentLang === 'fa' ? 'این فیلتر قبلاً افزوده شده است' : 'Filter already exists');
        return;
      }

      filters.unshift({
        id: 'f_' + Date.now(),
        pattern: raw,
        isRegex,
        action: 'default',
        enabled: true,
        createdAt: Date.now(),
      });

      await saveSettings({ filters });
      filterInput.value = '';
      renderFilterChips();
      showPopupToast(currentLang === 'fa' ? 'فیلتر افزوده شد' : 'Filter added');
    });

    filterInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnAddFilter.click();
    });
  }

  // Clear all filters
  const btnClearAllFilters = document.getElementById('btnClearAllFilters');
  if (btnClearAllFilters) {
    btnClearAllFilters.addEventListener('click', async () => {
      if (confirm(currentLang === 'fa' ? 'آیا از حذف تمام فیلترها اطمینان دارید؟' : 'Delete all filters?')) {
        await saveSettings({ filters: [] });
        renderFilterChips();
      }
    });
  }

  // Filter Search
  const filterSearchInput = document.getElementById('filterSearchInput');
  if (filterSearchInput) {
    filterSearchInput.addEventListener('input', () => {
      renderFilterChips(filterSearchInput.value.trim().toLowerCase());
    });
  }

  // Preset packs
  document.querySelectorAll('.xe-preset-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const packKey = btn.getAttribute('data-pack');
      const keywords = PRESET_PACKS[packKey] || [];
      const filters = Array.isArray(currentSettings.filters) ? [...currentSettings.filters] : [];

      let added = 0;
      for (const kw of keywords) {
        if (!filters.some((f) => f.pattern.toLowerCase() === kw.toLowerCase())) {
          filters.unshift({
            id: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
            pattern: kw,
            isRegex: false,
            action: 'default',
            enabled: true,
            createdAt: Date.now(),
          });
          added++;
        }
      }

      if (added > 0) {
        await saveSettings({ filters });
        renderFilterChips();
        showPopupToast(currentLang === 'fa' ? `${added} فیلتر اضافه شد` : `${added} filters added`);
      } else {
        showPopupToast(currentLang === 'fa' ? 'تمام فیلترهای این پک قبلاً افزوده شده‌اند' : 'All pack filters already exist');
      }
    });
  });

  // Whitelist manager
  const btnAddWhitelist = document.getElementById('btnAddWhitelist');
  const whitelistInput = document.getElementById('whitelistInput');
  if (btnAddWhitelist && whitelistInput) {
    btnAddWhitelist.addEventListener('click', async () => {
      const raw = whitelistInput.value.trim().replace(/^@/, '');
      if (!raw) return;

      const list = Array.isArray(currentSettings.whitelist) ? [...currentSettings.whitelist] : [];
      if (list.some((h) => h.toLowerCase() === raw.toLowerCase())) {
        showPopupToast(currentLang === 'fa' ? 'کاربر در لیست سفید وجود دارد' : 'User already in whitelist');
        return;
      }

      list.unshift(raw);
      await saveSettings({ whitelist: list });
      whitelistInput.value = '';
      renderWhitelistChips();
      showPopupToast(currentLang === 'fa' ? 'به لیست سفید افزوده شد' : 'Added to whitelist');
    });

    whitelistInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnAddWhitelist.click();
    });
  }

  renderFilterChips();
  renderWhitelistChips();
}

function renderFilterChips(query = '') {
  const container = document.getElementById('filterList');
  const badge = document.getElementById('filterCountBadge');
  if (!container) return;

  const filters = Array.isArray(currentSettings.filters) ? currentSettings.filters : [];
  if (badge) badge.textContent = filters.length;

  const filtered = query
    ? filters.filter((f) => f.pattern.toLowerCase().includes(query))
    : filters;

  if (filtered.length === 0) {
    container.innerHTML = `<div class="xe-empty-text">${I18N[currentLang].noFiltersYet}</div>`;
    return;
  }

  container.innerHTML = '';
  filtered.forEach((f) => {
    const chip = document.createElement('div');
    chip.className = 'xe-chip';

    const text = document.createElement('span');
    text.textContent = f.pattern;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'xe-chip-del';
    del.innerHTML = '&times;';
    del.addEventListener('click', async () => {
      const updated = filters.filter((item) => item.id !== f.id);
      await saveSettings({ filters: updated });
      renderFilterChips(query);
    });

    chip.appendChild(text);
    chip.appendChild(del);
    container.appendChild(chip);
  });
}

function renderWhitelistChips() {
  const container = document.getElementById('whitelistContainer');
  const badge = document.getElementById('whitelistCountBadge');
  if (!container) return;

  const list = Array.isArray(currentSettings.whitelist) ? currentSettings.whitelist : [];
  if (badge) badge.textContent = list.length;

  container.innerHTML = '';
  list.forEach((handle) => {
    const chip = document.createElement('div');
    chip.className = 'xe-chip';

    const text = document.createElement('span');
    text.textContent = `@${handle}`;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'xe-chip-del';
    del.innerHTML = '&times;';
    del.addEventListener('click', async () => {
      const updated = list.filter((h) => h.toLowerCase() !== handle.toLowerCase());
      await saveSettings({ whitelist: updated });
      renderWhitelistChips();
    });

    chip.appendChild(text);
    chip.appendChild(del);
    container.appendChild(chip);
  });
}

// ============================================================================
// TAB 3: RELATIONSHIP TRACKER & MANAGER (NEW MASTERPIECE)
// ============================================================================
function setupTrackerTab() {
  const syncBtn = document.getElementById('trackerSyncBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', performSync);
  }

  // Category Pills
  const catPills = document.querySelectorAll('.xe-cat-pill');
  catPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const cat = pill.getAttribute('data-category');
      catPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = cat;
      selectedUserIds.clear();
      renderTrackerList();
    });
  });

  // Search input
  const searchInput = document.getElementById('trackerSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderTrackerList(searchInput.value.trim().toLowerCase());
    });
  }

  // Batch Select All
  const btnSelectAll = document.getElementById('btnBatchSelectAll');
  if (btnSelectAll) {
    btnSelectAll.addEventListener('click', () => {
      const currentList = getFilteredCategoryList();
      if (selectedUserIds.size === currentList.length && currentList.length > 0) {
        selectedUserIds.clear();
        btnSelectAll.textContent = I18N[currentLang].selectAll;
      } else {
        currentList.forEach((u) => selectedUserIds.add(u.id));
        btnSelectAll.textContent = I18N[currentLang].deselectAll;
      }
      updateBatchActionButton();
      renderTrackerList();
    });
  }

  // Batch Action Button (Unfollow or Remove Follower)
  const btnBatchAction = document.getElementById('btnBatchAction');
  if (btnBatchAction) {
    btnBatchAction.addEventListener('click', startBatchAction);
  }

  // Safety Modal Controls
  const btnSafetyPause = document.getElementById('btnSafetyPause');
  if (btnSafetyPause) {
    btnSafetyPause.addEventListener('click', () => {
      if (globalThis.XWiseRelationshipTracker) {
        if (globalThis.XWiseRelationshipTracker.queueState === 'running') {
          globalThis.XWiseRelationshipTracker.pauseQueue();
          btnSafetyPause.textContent = I18N[currentLang].btnResume;
        } else if (globalThis.XWiseRelationshipTracker.queueState === 'paused') {
          globalThis.XWiseRelationshipTracker.resumeQueue();
          btnSafetyPause.textContent = I18N[currentLang].btnPause;
        }
      }
    });
  }

  const btnSafetyStop = document.getElementById('btnSafetyStop');
  if (btnSafetyStop) {
    btnSafetyStop.addEventListener('click', () => {
      if (globalThis.XWiseRelationshipTracker) {
        globalThis.XWiseRelationshipTracker.stopQueue();
      }
      closeSafetyModal();
    });
  }
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return currentLang === 'fa' ? 'چند لحظه پیش' : 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return currentLang === 'fa' ? `${diffMin} دقیقه پیش` : `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return currentLang === 'fa' ? `${diffHours} ساعت پیش` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return currentLang === 'fa' ? `${diffDays} روز پیش` : `${diffDays}d ago`;
}

async function performSync() {
  const statusEl = document.getElementById('trackerSyncStatus');
  const msgEl = document.getElementById('trackerSyncMsg');
  const syncBtn = document.getElementById('trackerSyncBtn');
  const noticeEl = document.getElementById('trackerNotice');

  if (statusEl) statusEl.style.display = 'flex';
  if (syncBtn) syncBtn.disabled = true;
  if (noticeEl) noticeEl.style.display = 'none';

  try {
    if (msgEl) msgEl.textContent = currentLang === 'fa' ? 'در حال برقراری ارتباط با تب X...' : 'Connecting to X tab...';

    // 1. If running inside in-page drawer iframe
    if (window !== window.top) {
      window.parent.postMessage({ type: 'XWISE_DRAWER_RUN_SYNC' }, '*');
      return;
    }

    // 2. Find an active or open X.com tab
    let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let targetTab = null;

    if (activeTab && activeTab.url && (activeTab.url.includes('x.com') || activeTab.url.includes('twitter.com'))) {
      targetTab = activeTab;
    } else {
      const allTabs = await chrome.tabs.query({ url: ['*://*.x.com/*', '*://*.twitter.com/*'] });
      if (allTabs && allTabs.length > 0) {
        targetTab = allTabs[0];
      }
    }

    if (!targetTab) {
      const openConfirm = confirm(
        currentLang === 'fa'
          ? 'هیچ تب فعالی از X (Twitter) باز نیست. برای اسکن ارتباطات، آیا می‌خواهید تب X.com باز شود؟'
          : 'No active X (Twitter) tab found. Open X.com to sync?'
      );
      if (openConfirm) {
        await chrome.tabs.create({ url: 'https://x.com' });
      }
      throw new Error(currentLang === 'fa' ? 'لطفاً وارد حساب خود در X شوید' : 'Please open and log into X.com');
    }

    // Ensure content script is injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        files: [
          'modules/cache.js',
          'modules/twitterApi.js',
          'modules/relationshipTracker.js',
          'content.js',
        ],
      });
    } catch {}

    if (msgEl) msgEl.textContent = currentLang === 'fa' ? 'در حال اسکن دنبال‌کنندگان و دنبال‌شدگان...' : 'Scanning followers & following...';

    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(targetTab.id, { type: 'XWISE_RUN_RELATIONSHIP_SYNC' }, (res) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(res);
        }
      });
    });

    if (!response || !response.success) {
      throw new Error(response?.error || (currentLang === 'fa' ? 'خطا در دریافت اطلاعات از توییتر' : 'Failed to fetch relationship data'));
    }

    handleSyncSuccess(response.categories, response.snapshot);
  } catch (err) {
    console.error('[XWise] Sync failed:', err);
    showPopupToast(currentLang === 'fa' ? `خطا: ${err.message}` : `Error: ${err.message}`);
    if (msgEl) msgEl.textContent = err.message;
  } finally {
    if (statusEl) statusEl.style.display = 'none';
    if (syncBtn) syncBtn.disabled = false;
  }
}

function handleSyncSuccess(categories, snapshot) {
  trackerCategories = categories || {};
  if (globalThis.XWiseRelationshipTracker) {
    globalThis.XWiseRelationshipTracker.categories = trackerCategories;
    if (snapshot) globalThis.XWiseRelationshipTracker.latestSnapshot = snapshot;
  }

  const noticeEl = document.getElementById('trackerNotice');
  if (noticeEl) {
    if (categories?.isInitialScan) {
      noticeEl.style.display = 'block';
      noticeEl.textContent = I18N[currentLang].initialScanNotice;
    } else if (categories?.unfollowers?.length > 0) {
      noticeEl.style.display = 'block';
      noticeEl.textContent = `${I18N[currentLang].unfollowersNotice} (${categories.unfollowers.length} نفر)`;
    } else {
      noticeEl.style.display = 'none';
    }
  }

  renderDashboard();
  renderTrackerCounts();
  renderTrackerList();
  showPopupToast(I18N[currentLang].syncSuccess);

  const timeEl = document.getElementById('trackerLastSyncTime');
  if (timeEl) {
    timeEl.textContent = new Date().toLocaleTimeString(currentLang === 'fa' ? 'fa-IR' : 'en-US');
  }
}

function renderTrackerCounts() {
  const un = trackerCategories.unfollowers?.length || 0;
  const nf = trackerCategories.nonFollowers?.length || 0;
  const fa = trackerCategories.fans?.length || 0;
  const mu = trackerCategories.mutuals?.length || 0;
  const nw = trackerCategories.newFollowers?.length || 0;

  document.getElementById('catCountUnfollowers').textContent = un;
  document.getElementById('catCountNonFollowers').textContent = nf;
  document.getElementById('catCountFans').textContent = fa;
  document.getElementById('catCountMutuals').textContent = mu;
  document.getElementById('catCountNewFollowers').textContent = nw;

  const navBadge = document.getElementById('navTrackerBadge');
  if (navBadge) {
    if (un > 0) {
      navBadge.style.display = 'block';
      navBadge.textContent = un;
    } else {
      navBadge.style.display = 'none';
    }
  }
}

function getFilteredCategoryList(query = '') {
  const list = trackerCategories[activeCategory] || [];
  if (!query) return list;
  return list.filter(
    (u) =>
      u.handle.toLowerCase().includes(query) ||
      u.name.toLowerCase().includes(query) ||
      (u.bio && u.bio.toLowerCase().includes(query))
  );
}

function renderTrackerList(query = '') {
  const container = document.getElementById('trackerUserList');
  if (!container) return;

  const users = getFilteredCategoryList(query);

  if (users.length === 0) {
    container.innerHTML = `
      <div class="xe-empty-state">
        <div class="xe-empty-icon">${activeCategory === 'unfollowers' ? '💔' : '👥'}</div>
        <p class="xe-empty-title">${I18N[currentLang].trackerEmptyTitle}</p>
        <p class="xe-empty-sub">${I18N[currentLang].trackerEmptySub}</p>
      </div>`;
    updateBatchActionButton();
    return;
  }

  container.innerHTML = '';
  users.forEach((user) => {
    const card = document.createElement('div');
    card.className = 'xe-user-card';

    // Left info
    const left = document.createElement('div');
    left.className = 'xe-user-card-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'xe-user-card-checkbox';
    checkbox.checked = selectedUserIds.has(user.id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedUserIds.add(user.id);
      else selectedUserIds.delete(user.id);
      updateBatchActionButton();
    });

    // Clickable profile container
    const profileLink = document.createElement('a');
    profileLink.className = 'xe-user-card-link';
    profileLink.href = `https://x.com/${user.handle}`;
    profileLink.target = '_blank';
    profileLink.rel = 'noopener noreferrer';
    profileLink.title = currentLang === 'fa' ? `مشاهده پروفایل @${user.handle} در تب جدید` : `View @${user.handle} on X`;
    profileLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: `https://x.com/${user.handle}` });
      } else {
        window.open(`https://x.com/${user.handle}`, '_blank');
      }
    });

    const avatar = document.createElement('img');
    avatar.className = 'xe-user-card-avatar';
    avatar.src = user.avatar || 'icons/icon48.png';

    const textWrap = document.createElement('div');
    textWrap.className = 'xe-user-card-text';

    const nameRow = document.createElement('div');
    nameRow.className = 'xe-user-card-name-row';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'xe-user-card-name';
    nameSpan.textContent = user.name;

    const handleSpan = document.createElement('span');
    handleSpan.className = 'xe-user-card-handle';
    handleSpan.textContent = `@${user.handle}`;

    nameRow.appendChild(nameSpan);
    nameRow.appendChild(handleSpan);

    if (activeCategory === 'unfollowers') {
      const lostBadge = document.createElement('span');
      lostBadge.className = 'xe-activity-badge xe-act-block';
      lostBadge.textContent = currentLang === 'fa' ? 'آنفالو کرده' : 'Unfollowed';
      nameRow.appendChild(lostBadge);

      if (user.lostAt) {
        const timeSpan = document.createElement('span');
        timeSpan.className = 'xe-stat-lbl';
        timeSpan.textContent = formatRelativeTime(user.lostAt);
        nameRow.appendChild(timeSpan);
      }
    }

    const bioSpan = document.createElement('span');
    bioSpan.className = 'xe-user-card-bio';
    bioSpan.textContent = user.bio || (currentLang === 'fa' ? 'بدون بایو' : 'No bio');

    textWrap.appendChild(nameRow);
    textWrap.appendChild(bioSpan);

    profileLink.appendChild(avatar);
    profileLink.appendChild(textWrap);

    left.appendChild(checkbox);
    left.appendChild(profileLink);

    // Right actions
    const actions = document.createElement('div');
    actions.className = 'xe-user-card-actions';

    if (activeCategory === 'fans') {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'xe-btn-secondary xe-btn-compact';
      removeBtn.textContent = I18N[currentLang].removeFollowerAction;
      removeBtn.addEventListener('click', () => singleAction(user, 'remove_follower'));
      actions.appendChild(removeBtn);
    } else {
      const unfollowBtn = document.createElement('button');
      unfollowBtn.className = 'xe-btn-danger xe-btn-compact';
      unfollowBtn.textContent = I18N[currentLang].unfollowAction;
      unfollowBtn.addEventListener('click', () => singleAction(user, 'unfollow'));
      actions.appendChild(unfollowBtn);
    }

    card.appendChild(left);
    card.appendChild(actions);
    container.appendChild(card);
  });

  updateBatchActionButton();
}

function updateBatchActionButton() {
  const btn = document.getElementById('btnBatchAction');
  const lbl = document.getElementById('batchActionLabel');
  if (!btn || !lbl) return;

  const count = selectedUserIds.size;
  if (count === 0) {
    btn.style.display = 'none';
    return;
  }

  btn.style.display = 'inline-flex';
  const actionText = activeCategory === 'fans'
    ? I18N[currentLang].removeFollowerAction
    : I18N[currentLang].unfollowAction;

  lbl.textContent = `${actionText} (${count})`;
}

async function singleAction(user, actionType) {
  const actionName = actionType === 'unfollow' ? I18N[currentLang].unfollowAction : I18N[currentLang].removeFollowerAction;
  if (!confirm(currentLang === 'fa' ? `آیا از ${actionName} کاربر @${user.handle} مطمئن هستید؟` : `Confirm ${actionName} @${user.handle}?`)) {
    return;
  }

  try {
    let [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let targetTab = (activeTab && activeTab.url && (activeTab.url.includes('x.com') || activeTab.url.includes('twitter.com'))) ? activeTab : null;
    if (!targetTab) {
      const allTabs = await chrome.tabs.query({ url: ['*://*.x.com/*', '*://*.twitter.com/*'] });
      if (allTabs && allTabs.length > 0) targetTab = allTabs[0];
    }

    if (targetTab) {
      await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(targetTab.id, {
          type: 'XWISE_RUN_BATCH_ACTION',
          targets: [user],
          actionType,
        }, (res) => {
          if (res?.success) resolve(res);
          else reject(new Error(res?.error || 'Action failed'));
        });
      });
    } else if (globalThis.XWiseRelationshipTracker) {
      await globalThis.XWiseRelationshipTracker.executeBatchAction([user], actionType);
    }

    selectedUserIds.delete(user.id);
    if (globalThis.XWiseRelationshipTracker) {
      globalThis.XWiseRelationshipTracker._removeUserFromCategories(user.id, actionType);
      trackerCategories = globalThis.XWiseRelationshipTracker.categories;
    }
    renderTrackerCounts();
    renderTrackerList();
    showPopupToast(I18N[currentLang].actionComplete);
  } catch (err) {
    showPopupToast(err.message);
  }
}

async function startBatchAction() {
  const count = selectedUserIds.size;
  if (count === 0) return;

  const actionType = activeCategory === 'fans' ? 'remove_follower' : 'unfollow';
  const actionName = actionType === 'unfollow' ? I18N[currentLang].unfollowAction : I18N[currentLang].removeFollowerAction;

  if (!confirm(currentLang === 'fa' ? `آیا از اجرای ${actionName} برای ${count} اکانت در صف ایمن مطمئن هستید؟` : `Run safe ${actionName} on ${count} accounts?`)) {
    return;
  }

  const allUsers = getFilteredCategoryList();
  const targetUsers = allUsers.filter((u) => selectedUserIds.has(u.id));

  // Open Safety Modal
  const modal = document.getElementById('safetyModal');
  const progressFill = document.getElementById('safetyProgressFill');
  const progressCurrent = document.getElementById('safetyProgressCurrent');
  const nextCountdown = document.getElementById('safetyNextCountdown');
  const currentTarget = document.getElementById('safetyCurrentTarget');

  if (modal) modal.style.display = 'flex';

  await globalThis.XWiseRelationshipTracker.executeBatchAction(targetUsers, actionType, {
    onProgress: (p) => {
      const pct = Math.round((p.current / p.total) * 100);
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (progressCurrent) progressCurrent.textContent = currentLang === 'fa' ? `اقدام ${p.current} از ${p.total}` : `Action ${p.current} of ${p.total}`;
      if (currentTarget) currentTarget.textContent = `@${p.user.handle} (${p.user.name})`;

      // Start Countdown Timer
      let remainingSec = (p.delayMs / 1000).toFixed(1);
      clearInterval(safetyCountdownInterval);
      safetyCountdownInterval = setInterval(() => {
        remainingSec = (remainingSec - 0.1).toFixed(1);
        if (remainingSec <= 0) {
          clearInterval(safetyCountdownInterval);
          if (nextCountdown) nextCountdown.textContent = '';
        } else {
          if (nextCountdown) nextCountdown.textContent = currentLang === 'fa' ? `اقدام بعدی در ${remainingSec} ثانیه...` : `Next action in ${remainingSec}s...`;
        }
      }, 100);
    },
    onSuccess: ({ user }) => {
      selectedUserIds.delete(user.id);
    },
    onComplete: ({ successful, failed }) => {
      clearInterval(safetyCountdownInterval);
      closeSafetyModal();
      renderTrackerCounts();
      renderTrackerList();
      showPopupToast(currentLang === 'fa' ? `عملیات پایان یافت: ${successful} موفق، ${failed} ناموفق` : `Complete: ${successful} succeeded, ${failed} failed`);
    },
  });
}

function closeSafetyModal() {
  const modal = document.getElementById('safetyModal');
  if (modal) modal.style.display = 'none';
  clearInterval(safetyCountdownInterval);
}

// ============================================================================
// TAB 4: MEDIA & CLEANER
// ============================================================================
function setupMediaTab() {
  const toggles = [
    'volumeSliderEnabled',
    'rememberVolume',
    'videoDownloadEnabled',
    'videoLoopEnabled',
    'adBlockerEnabled',
    'zenModeEnabled',
    'hideWhoToFollow',
    'hideProfileWhoToFollow',
    'hideGrokDrawer',
    'hidePremiumUpsell',
    'hideViewCounts',
    'filterDefaultAvatars',
    'filterEngagementBait',
  ];

  toggles.forEach((key) => {
    const el = document.getElementById(key);
    if (el) {
      el.checked = !!currentSettings[key];
      el.addEventListener('change', async () => {
        await saveSettings({ [key]: el.checked });
      });
    }
  });

  const speedSelect = document.getElementById('defaultPlaybackRate');
  if (speedSelect) {
    speedSelect.value = String(currentSettings.defaultPlaybackRate || 1);
    speedSelect.addEventListener('change', async () => {
      await saveSettings({ defaultPlaybackRate: parseFloat(speedSelect.value) });
    });
  }

  const blueCheckSelect = document.getElementById('blueCheckFilter');
  if (blueCheckSelect) {
    blueCheckSelect.value = currentSettings.blueCheckFilter || 'off';
    blueCheckSelect.addEventListener('change', async () => {
      await saveSettings({ blueCheckFilter: blueCheckSelect.value });
    });
  }
}

// ============================================================================
// TAB 5: SETTINGS & CACHE
// ============================================================================
function setupSettingsTab() {
  // Language Select
  const settingLang = document.getElementById('settingLanguage');
  if (settingLang) {
    settingLang.value = currentLang;
    settingLang.addEventListener('change', async () => {
      const newLang = settingLang.value;
      applyLocalization(newLang);
      await saveSettings({ language: newLang });
    });
  }

  // Periodic Tracker Interval
  const trackerInterval = document.getElementById('trackerCheckInterval');
  if (trackerInterval) {
    trackerInterval.value = String(currentSettings.trackerCheckInterval ?? 240);
    trackerInterval.addEventListener('change', async () => {
      await saveSettings({ trackerCheckInterval: parseInt(trackerInterval.value, 10) });
      showPopupToast(I18N[currentLang].settingsSaved);
    });
  }

  // Cache Clear Button
  const btnClearCache = document.getElementById('btnClearCache');
  if (btnClearCache) {
    btnClearCache.addEventListener('click', async () => {
      await sendMessageAsync({ type: 'XWISE_CLEAR_CACHE' });
      await updateCacheStats();
      showPopupToast(I18N[currentLang].cacheCleared);
    });
  }

  // Export JSON
  const btnExport = document.getElementById('btnExportSettings');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentSettings, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `xwise-settings-${Date.now()}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  // Import JSON
  const importInput = document.getElementById('importFileInput');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const imported = JSON.parse(evt.target.result);
          if (typeof imported === 'object' && imported !== null) {
            await saveSettings(imported);
            location.reload();
          }
        } catch {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    });
  }

  // Reset All
  const btnResetSettings = document.getElementById('btnResetSettings');
  if (btnResetSettings) {
    btnResetSettings.addEventListener('click', async () => {
      if (confirm(currentLang === 'fa' ? 'آیا از بازنشانی تمام تنظیمات به حالت اولیه اطمینان دارید؟' : 'Reset all settings?')) {
        await chrome.storage.sync.clear();
        location.reload();
      }
    });
  }
}

async function updateCacheStats() {
  const totalEl = document.getElementById('cacheTotalItems');
  const sizeEl = document.getElementById('cacheEstimatedSize');
  if (!totalEl || !sizeEl) return;

  const stats = await sendMessageAsync({ type: 'XWISE_GET_CACHE_STATS' });
  totalEl.textContent = stats.totalItems || 0;
  sizeEl.textContent = `${stats.estimatedSizeKB || 0} KB`;
}

// ============================================================================
// Popup Toast Notifications
// ============================================================================
let toastTimer = null;
function showPopupToast(message, duration = 2200) {
  const toast = document.getElementById('popupToast');
  if (!toast) return;

  toast.textContent = message;
  toast.style.display = 'block';

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = 'none';
  }, duration);
}
