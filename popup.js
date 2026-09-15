'use strict';

/**
 * XWise Blocker v2.0.0 — Popup Controller
 * Full bilingual support (FA / EN), Vazirmatn font, filter management,
 * mode switches, and live stats.
 */

// ============================================================================
// Internationalization (i18n) Dictionary
// ============================================================================
const I18N = {
  fa: {
    appTitle: 'XWise Blocker',
    appSubtitle: 'فیلتر هوشمند نام و بایو · اسلایدر صدا · بلاک سریع',
    tabFilters: 'فیلترها',
    tabFeatures: 'امکانات',
    tabStats: 'آمار',
    navFilters: 'فیلترها',
    navFeatures: 'امکانات',
    navStats: 'آمار',
    filterEngineTitle: 'موتور فیلتر هوشمند',
    filterEngineDesc: 'بررسی خودکار نام نمایشی و بایو کاربران',
    modeLabel: 'حالت عملکرد:',
    modeDryRun: 'آزمایشی (بدون بلاک)',
    modeAutoBlock: 'بلاک خودکار',
    addFilterHeading: 'افزودن فیلتر جدید',
    filterInputPlaceholder: 'کلمه، ایموجی (🚩، 🇮🇷، 🤡) یا عبارت...',
    btnAdd: 'افزودن',
    addFilterHint: 'پشتیبانی کامل از تمام ایموجی‌ها، پرچم‌ها، علائم و حروف فارسی/انگلیسی',
    scopesLabel: 'محدوده بررسی:',
    scopeDisplayName: 'نام نمایشی',
    scopeBio: 'بایو (بیوگرافی)',
    scopeTweetText: 'متن توییت (اختیاری)',
    activeFiltersHeading: 'فیلترهای فعال',
    emptyFilters: 'هیچ فیلتری افزوده نشده است. کلمه یا ایموجی مورد نظر خود را در بالا وارد کنید.',
    videoAudioSection: 'ویدیو و صوت',
    volumeSliderTitle: 'اسلایدر صدا روی ویدیوها',
    volumeSliderDesc: 'نمایش کنترل صدا هنگام حرکت موس روی ویدیوهای تایم‌لاین',
    rememberVolumeTitle: 'ذخیره میزان صدا',
    rememberVolumeDesc: 'میزان صدای انتخابی برای همه ویدیوهای بعدی حفظ شود',
    blockSection: 'ابزارهای بلاک دستی',
    blockButtonTitle: 'دکمه بلاک سریع در توییت',
    blockButtonDesc: 'افزودن دکمه مسدودسازی هماهنگ با طراحی خود توییتر',
    shortcutTitle: 'شورتکات کیبورد',
    shortcutDesc: 'بلاک آنی کاربری که موس روی توییت آن قرار دارد',
    confirmDelayTitle: 'فرصت لغو بلاک (۲ ثانیه)',
    confirmDelayDesc: 'نمایش پنجره تایید با دکمه لغو برای جلوگیری از بلاک تصادفی',
    showBlockToastsTitle: 'نمایش اعلان پس از بلاک',
    showBlockToastsDesc: 'نمایش پیام تایید کوتاه در پایین صفحه پس از مسدودسازی',
    statManual: 'بلاک‌های مستقیم',
    statMatches: 'شناسایی‌شده (آزمایشی)',
    statAuto: 'بلاک خودکار فیلترها',
    statTotal: 'مجموع حساب‌های مسدود',
    resetStatsTitle: 'صفر کردن آمار',
    resetStatsDesc: 'شمارنده‌ها مجدداً از صفر شروع خواهند شد',
    btnReset: 'صفر کردن',
    saved: 'ذخیره شد',
    filterAdded: 'فیلتر افزوده شد',
    filterRemoved: 'فیلتر حذف شد',
    filterDuplicate: 'این فیلتر قبلاً افزوده شده است',
    filterEmpty: 'لطفاً یک کلمه یا ایموجی وارد کنید',
    statsResetDone: 'آمار صفر شد',
  },
  en: {
    appTitle: 'XWise Blocker',
    appSubtitle: 'Smart Name & Bio Filter · Video Volume · Quick Block',
    tabFilters: 'Filters',
    tabFeatures: 'Features',
    tabStats: 'Stats',
    navFilters: 'Filters',
    navFeatures: 'Features',
    navStats: 'Stats',
    filterEngineTitle: 'Smart Filter Engine',
    filterEngineDesc: 'Automatic scan of user display names and bios',
    modeLabel: 'Operation mode:',
    modeDryRun: 'Dry Run (Test only)',
    modeAutoBlock: 'Auto Block',
    addFilterHeading: 'Add New Filter',
    filterInputPlaceholder: 'Keyword, emoji (🚩, 🇮🇷, 🤡) or phrase...',
    btnAdd: 'Add',
    addFilterHint: 'Full support for all emojis, flags, symbols, and multilingual text',
    scopesLabel: 'Scan scopes:',
    scopeDisplayName: 'Display Name',
    scopeBio: 'User Bio',
    scopeTweetText: 'Tweet Text (Optional)',
    activeFiltersHeading: 'Active Filters',
    emptyFilters: 'No filters added yet. Enter a word or emoji above to begin.',
    videoAudioSection: 'Video & Audio',
    volumeSliderTitle: 'Video Volume Sliders',
    volumeSliderDesc: 'Show volume slider on hover over timeline videos',
    rememberVolumeTitle: 'Remember Volume',
    rememberVolumeDesc: 'Persist last volume level across upcoming videos',
    blockSection: 'Manual Block Tools',
    blockButtonTitle: 'Inline Tweet Block Button',
    blockButtonDesc: 'Native-styled block button in tweet action bars',
    shortcutTitle: 'Keyboard Shortcut',
    shortcutDesc: 'Instantly block user under your mouse cursor',
    confirmDelayTitle: '2-Second Cancel Window',
    confirmDelayDesc: 'Show cancel toast before executing shortcut blocks',
    showBlockToastsTitle: 'Show block notification',
    showBlockToastsDesc: 'Show confirmation toast at the bottom after blocking',
    statManual: 'Direct Blocks',
    statMatches: 'Dry-run Matches',
    statAuto: 'Filter Auto-Blocks',
    statTotal: 'Total Blocked Users',
    resetStatsTitle: 'Reset Statistics',
    resetStatsDesc: 'Reset all counter metrics back to zero',
    btnReset: 'Reset',
    saved: 'Saved',
    filterAdded: 'Filter added',
    filterRemoved: 'Filter removed',
    filterDuplicate: 'This filter already exists',
    filterEmpty: 'Please enter a keyword or emoji',
    statsResetDone: 'Stats reset',
  }
};

// ============================================================================
// Defaults & State
// ============================================================================
const DEFAULT_SETTINGS = {
  // v1
  volumeSliderEnabled: true,
  rememberVolume: true,
  blockButtonEnabled: true,
  shortcutEnabled: true,
  shortcutCtrl: true,
  shortcutAlt: true,
  shortcutShift: false,
  shortcutKey: 'b',
  confirmDelayOnShortcut: true,

  // v2
  filterEngineEnabled: true,
  filterMode: 'dry-run', // 'dry-run' | 'auto-block'
  filterScopes: {
    displayName: true,
    bio: true,
    tweetText: false,
  },
  filters: [], // { id, pattern, type, enabled, createdAt }
  filterCaseSensitive: false,
  filterWholeWord: false,
  showMatchBadges: true,
  badgeStyle: 'subtle',
  language: 'fa', // Default to Persian with Vazirmatn font
  showBlockToasts: true,

  // Stats
  blockCount: 0,
  filterBlockCount: 0,
  dryRunMatchCount: 0,
};

let settings = { ...DEFAULT_SETTINGS };
let statusTimer = null;

// ============================================================================
// DOM Elements
// ============================================================================
const els = {
  // Navigation
  tabs: document.querySelectorAll('.xe-tab'),
  tabPanes: document.querySelectorAll('.xe-tab-pane'),
  langToggle: document.getElementById('langToggle'),
  langText: document.getElementById('langText'),

  // Filter Engine
  filterEngineEnabled: document.getElementById('filterEngineEnabled'),
  btnDryRun: document.getElementById('btnDryRun'),
  btnAutoBlock: document.getElementById('btnAutoBlock'),
  filterInput: document.getElementById('filterInput'),
  btnAddFilter: document.getElementById('btnAddFilter'),
  filterList: document.getElementById('filterList'),
  emptyFiltersMsg: document.getElementById('emptyFiltersMsg'),
  filterCountBadge: document.getElementById('filterCountBadge'),
  scopeDisplayName: document.getElementById('scopeDisplayName'),
  scopeBio: document.getElementById('scopeBio'),
  scopeTweetText: document.getElementById('scopeTweetText'),

  // Classic Features
  volumeSliderEnabled: document.getElementById('volumeSliderEnabled'),
  rememberVolume: document.getElementById('rememberVolume'),
  blockButtonEnabled: document.getElementById('blockButtonEnabled'),
  shortcutEnabled: document.getElementById('shortcutEnabled'),
  shortcutRow: document.getElementById('shortcutRow'),
  kbdCtrl: document.getElementById('kbdCtrl'),
  kbdAlt: document.getElementById('kbdAlt'),
  kbdShift: document.getElementById('kbdShift'),
  shortcutKey: document.getElementById('shortcutKey'),
  confirmDelayOnShortcut: document.getElementById('confirmDelayOnShortcut'),
  showBlockToasts: document.getElementById('showBlockToasts'),

  // Stats
  statManualBlocks: document.getElementById('statManualBlocks'),
  statDryMatches: document.getElementById('statDryMatches'),
  statAutoBlocks: document.getElementById('statAutoBlocks'),
  statTotalBlocks: document.getElementById('statTotalBlocks'),
  btnResetStats: document.getElementById('btnResetStats'),

  // Status message
  statusMsg: document.getElementById('statusMsg'),
};

// ============================================================================
// i18n & Localization
// ============================================================================
function applyLanguage(lang) {
  const dict = I18N[lang] || I18N.fa;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  els.langText.textContent = lang === 'fa' ? 'EN' : 'فا';

  // Translate all marked elements
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.placeholder = dict[key];
  });

  updateFilterCountBadge();
}

function t(key) {
  const dict = I18N[settings.language] || I18N.fa;
  return dict[key] || key;
}

// ============================================================================
// UI Render
// ============================================================================
function render() {
  // Apply language
  applyLanguage(settings.language || 'fa');

  // Filter Engine
  els.filterEngineEnabled.checked = !!settings.filterEngineEnabled;
  els.btnDryRun.classList.toggle('active', settings.filterMode === 'dry-run');
  els.btnAutoBlock.classList.toggle('active', settings.filterMode === 'auto-block');

  // Scopes
  const scopes = settings.filterScopes || { displayName: true, bio: true, tweetText: false };
  els.scopeDisplayName.checked = !!scopes.displayName;
  els.scopeBio.checked = !!scopes.bio;
  els.scopeTweetText.checked = !!scopes.tweetText;

  // Render Filters List
  renderFilters();

  // Classic features
  els.volumeSliderEnabled.checked = !!settings.volumeSliderEnabled;
  els.rememberVolume.checked = !!settings.rememberVolume;
  els.blockButtonEnabled.checked = !!settings.blockButtonEnabled;
  els.shortcutEnabled.checked = !!settings.shortcutEnabled;
  els.confirmDelayOnShortcut.checked = !!settings.confirmDelayOnShortcut;
  els.showBlockToasts.checked = !!settings.showBlockToasts;
  els.shortcutKey.value = (settings.shortcutKey || 'b').toUpperCase();
  els.kbdCtrl.classList.toggle('xe-kbd-active', !!settings.shortcutCtrl);
  els.kbdAlt.classList.toggle('xe-kbd-active', !!settings.shortcutAlt);
  els.kbdShift.classList.toggle('xe-kbd-active', !!settings.shortcutShift);

  if (els.shortcutRow) {
    els.shortcutRow.style.display = settings.shortcutEnabled ? 'flex' : 'none';
  }

  // Stats
  renderStats();
}

function renderStats() {
  const manual = settings.blockCount || 0;
  const auto = settings.filterBlockCount || 0;
  const matches = settings.dryRunMatchCount || 0;
  const total = manual + auto;

  if (els.statManualBlocks) els.statManualBlocks.textContent = manual.toLocaleString();
  if (els.statAutoBlocks) els.statAutoBlocks.textContent = auto.toLocaleString();
  if (els.statDryMatches) els.statDryMatches.textContent = matches.toLocaleString();
  if (els.statTotalBlocks) els.statTotalBlocks.textContent = total.toLocaleString();
}

function updateFilterCountBadge() {
  const count = (settings.filters || []).length;
  if (!els.filterCountBadge) return;

  if (settings.language === 'fa') {
    const persianDigits = String(count).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    els.filterCountBadge.textContent = `${persianDigits} فیلتر`;
  } else {
    els.filterCountBadge.textContent = `${count} filter${count !== 1 ? 's' : ''}`;
  }
}

function renderFilters() {
  const filters = settings.filters || [];
  updateFilterCountBadge();

  // Clear existing items (except empty message)
  els.filterList.querySelectorAll('.xe-chip').forEach(c => c.remove());

  if (filters.length === 0) {
    if (els.emptyFiltersMsg) els.emptyFiltersMsg.style.display = 'block';
    return;
  }

  if (els.emptyFiltersMsg) els.emptyFiltersMsg.style.display = 'none';

  filters.forEach((filter) => {
    const chip = document.createElement('div');
    chip.className = 'xe-chip';

    const textSpan = document.createElement('span');
    textSpan.className = 'xe-chip-text';
    textSpan.textContent = filter.pattern;
    textSpan.title = filter.pattern;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'xe-chip-del';
    delBtn.innerHTML = '&times;';
    delBtn.setAttribute('aria-label', `Delete ${filter.pattern}`);

    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFilter(filter.id);
    });

    chip.appendChild(textSpan);
    chip.appendChild(delBtn);
    els.filterList.appendChild(chip);
  });
}

// ============================================================================
// Actions & Storage
// ============================================================================
function flash(msg) {
  els.statusMsg.textContent = msg;
  els.statusMsg.style.opacity = '1';
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    els.statusMsg.style.opacity = '0';
    setTimeout(() => { els.statusMsg.textContent = ''; }, 200);
  }, 1400);
}

function save(partial) {
  settings = { ...settings, ...partial };
  if (chrome?.storage?.sync) {
    chrome.storage.sync.set(partial, () => {
      flash(t('saved'));
    });
  }
  render();
}

function addFilter() {
  const val = els.filterInput.value.trim();
  if (!val) {
    flash(t('filterEmpty'));
    return;
  }

  const existing = (settings.filters || []).some(
    f => f.pattern.toLowerCase() === val.toLowerCase()
  );

  if (existing) {
    flash(t('filterDuplicate'));
    return;
  }

  const newFilter = {
    id: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    pattern: val,
    enabled: true,
    createdAt: Date.now(),
  };

  const updatedFilters = [...(settings.filters || []), newFilter];
  els.filterInput.value = '';
  save({ filters: updatedFilters });
  flash(t('filterAdded'));
}

function removeFilter(id) {
  const updatedFilters = (settings.filters || []).filter(f => f.id !== id);
  save({ filters: updatedFilters });
  flash(t('filterRemoved'));
}

function resetStats() {
  save({
    blockCount: 0,
    filterBlockCount: 0,
    dryRunMatchCount: 0,
  });
  flash(t('statsResetDone'));
}

// ============================================================================
// Event Listeners
// ============================================================================

// Tab Navigation
els.tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-tab');
    els.tabs.forEach(t => t.classList.toggle('active', t === tab));
    els.tabPanes.forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));
  });
});

// Language Switch
els.langToggle.addEventListener('click', () => {
  const newLang = settings.language === 'fa' ? 'en' : 'fa';
  save({ language: newLang });
});

// Mode Buttons
els.btnDryRun.addEventListener('click', () => {
  save({ filterMode: 'dry-run' });
});

els.btnAutoBlock.addEventListener('click', () => {
  save({ filterMode: 'auto-block' });
});

// Filter Toggle
els.filterEngineEnabled.addEventListener('change', (e) => {
  save({ filterEngineEnabled: e.target.checked });
});

// Add Filter on Click & Enter Key
els.btnAddFilter.addEventListener('click', addFilter);
els.filterInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addFilter();
  }
});

// Scopes
function updateScopes() {
  save({
    filterScopes: {
      displayName: els.scopeDisplayName.checked,
      bio: els.scopeBio.checked,
      tweetText: els.scopeTweetText.checked,
    }
  });
}
els.scopeDisplayName.addEventListener('change', updateScopes);
els.scopeBio.addEventListener('change', updateScopes);
els.scopeTweetText.addEventListener('change', updateScopes);

// Classic Controls
els.volumeSliderEnabled.addEventListener('change', (e) => save({ volumeSliderEnabled: e.target.checked }));
els.rememberVolume.addEventListener('change', (e) => save({ rememberVolume: e.target.checked }));
els.blockButtonEnabled.addEventListener('change', (e) => save({ blockButtonEnabled: e.target.checked }));
els.shortcutEnabled.addEventListener('change', (e) => save({ shortcutEnabled: e.target.checked }));
els.confirmDelayOnShortcut.addEventListener('change', (e) => save({ confirmDelayOnShortcut: e.target.checked }));
els.showBlockToasts.addEventListener('change', (e) => save({ showBlockToasts: e.target.checked }));

// Shortcut Modifier toggles
els.kbdCtrl.addEventListener('click', () => save({ shortcutCtrl: !settings.shortcutCtrl }));
els.kbdAlt.addEventListener('click', () => save({ shortcutAlt: !settings.shortcutAlt }));
els.kbdShift.addEventListener('click', () => save({ shortcutShift: !settings.shortcutShift }));

// Key Input
els.shortcutKey.addEventListener('input', (e) => {
  const v = (e.target.value || 'b').slice(-1).toLowerCase();
  e.target.value = v.toUpperCase();
  save({ shortcutKey: v });
});
els.shortcutKey.addEventListener('focus', () => els.shortcutKey.select());

// Reset Stats
els.btnResetStats.addEventListener('click', resetStats);

// ============================================================================
// Initialization & Live Sync
// ============================================================================
if (chrome?.storage?.sync) {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
    settings = { ...DEFAULT_SETTINGS, ...stored };
    render();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const key in changes) {
      if (key in settings) settings[key] = changes[key].newValue;
    }
    render();
  });
} else {
  // Local preview fallback
  render();
}
