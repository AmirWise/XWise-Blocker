'use strict';

/**
 * XWise Blocker v3.5.0 — Popup Controller
 * Bilingual controller for the dashboard, filters, relationship tracker,
 * media settings, Persian RastNevis editor and cache tabs.
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
    navRastnevis: 'راست‌نویس',
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
    statRastnevis: 'ویرایش راست‌نویس',
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
    safetyRunningDesc: 'عملیات با فاصله زمانی تصادفی (۳٫۵ تا ۵٫۵ ثانیه) اجرا می‌شود تا احتمال لیمیت شدن حساب کم شود.',
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
    zenModeDesc: 'خلوت‌سازی سایدبار راست و متمرکز کردن تایم‌لاین',
    zenKeepSearch: 'روشن ماندن کادر جستجو در سایدبار',
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
    funFiltersHeading: 'فیلتر اختصاصی و سرگرمی',
    hideBoysModeTitle: 'حالت بدون پسر (No-Boys Mode)',
    hideBoysModeDesc: 'مخفی‌سازی خودکار توییت‌های اکانت‌های پسر و آقایان در تایم‌لاین (شناسایی هوشمند نام، بایو و ضمایر)',
    boysWhitelistHeading: 'لیست دوستان پسر (استثناها):',
    boysWhitelistDesc: 'اکانت‌های این لیست در تایم‌لاین هرگز مخفی نخواهند شد.',
    boysWhitelistPlaceholder: 'آیدی توییتر دوستتان (مثلاً amir@)...',
    boysWhitelistAdded: 'به لیست دوستان مصون افزوده شد',
    boysWhitelistExists: 'این کاربر قبلاً در لیست دوستان وجود دارد',

    // RastNevis Smart Editor
    rnMasterTitle: 'ویراستار هوشمند راست‌نویس',
    rnMasterDesc: 'خطایابی خودکار هکسره، نیم‌فاصله، نویسه‌های عربی و غلط‌های املایی',
    rnRulesHeading: 'قواعد و خطایاب هوشمند',
    rnRuleHeksareTitle: 'خطایابی هکسره و هکسره معکوس',
    rnRuleHeksareDesc: 'تشخیص مضاف و مضاف‌الیه با آزمون نحوی (کتابه من ➔ کتاب من)',
    rnRuleArabicTitle: 'اصلاح نویسه‌های عربی به فارسی',
    rnRuleArabicDesc: 'تبدیل خودکار «ي» و «ك» به «ی» و «ک» و مدیریت «ة/ۀ»',
    rnRuleSpellingTitle: 'غلط‌یاب املایی بومی و پربسامد',
    rnRuleSpellingDesc: 'شناسایی لغات پرغلط روزمره (اسفاده ➔ استفاده، مشگل ➔ مشکل)',
    rnRuleZwnjTitle: 'مدیریت ساختاری نیم‌فاصله‌ها',
    rnRuleZwnjDesc: 'پیشوندهای «می/نمی» و پسوندهای «ها/تر/ترین» با بررسی حروف جدانویس',
    rnRuleHintsTitle: 'پیشنهادهای نگارشی ظریف',
    rnRuleHintsDesc: 'تنوین نصب (واقعا ➔ واقعاً) و تکرار بیش‌ازحد حروف (عالییی ➔ عالی)',
    rnDisplayHeading: 'نحوه نمایش در تایم‌لاین X',
    rnOptUnderlineTitle: 'زیرخط زدن تعاملی کلمات مشکل‌دار',
    rnOptUnderlineDesc: 'نمایش خط‌چین مواج رنگی با تول‌تیپ توضیحی و شکل اصلاح‌شده',
    rnOptShowBadgeTitle: 'نشان و پنل اصلاح زیر توییت',
    rnOptShowBadgeDesc: 'دکمه مشاهده گزارش خطاها و کپی یک‌کلیکی متن اصلاح‌شده توییت',
    rnTestHeading: 'جعبه تست زنده ویراستار',
    rnTestDesc: 'متن دلخواه خود را بنویسید یا پیست کنید تا خطایابی و اصلاح آنی انجام شود:',
    rnTestPlaceholder: 'متن تستی را اینجا بنویسید... مثلاً: توییته تستی برایه پروژه راست‌نویس اسفاده شد و خاهش میکنم کارو چک کن...',
    rnFixedLabel: 'متن اصلاح‌شده:',
    rnBtnCopy: 'کپی متن',
    rnCopied: 'کپی شد',
    rnCopyFailed: 'خطا در کپی',
    rnStatsHeading: 'آمار و حریم خصوصی',
    rnMarkedLabel: 'توییت نشانه‌گذاری‌شده',
    rnBtnReset: 'صفر کردن شمارنده',
    rnPrivacyNote: '۱۰۰٪ محلی و امن (Zero Data Collection) — پردازش درون دستگاه بدون ارسال داده به اینترنت',
    rnZeroIssues: 'متن بدون خطا است',
    rnIssuesFound: '{n} خطا یافت شد',
    rnCounterReset: 'شمارنده با موفقیت صفر شد',

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

    storageError: 'ذخیره‌سازی ناموفق بود؛ احتمالاً حافظه همگام‌سازی پر است',
    filterExists: 'این فیلتر قبلاً افزوده شده است',
    filterAdded: 'فیلتر افزوده شد',
    filterInvalidRegex: 'عبارت Regex نامعتبر است',
    filtersAdded: '{n} فیلتر اضافه شد',
    packAllExist: 'تمام فیلترهای این پک قبلاً افزوده شده‌اند',
    confirmClearFilters: 'آیا از حذف تمام فیلترها اطمینان دارید؟',
    filterToggleHint: 'کلیک برای فعال/غیرفعال کردن',
    whitelistExists: 'کاربر در لیست سفید وجود دارد',
    whitelistAdded: 'به لیست سفید افزوده شد',
    invalidHandle: 'آیدی کاربری نامعتبر است',
    shieldPaused: 'سپر محافظتی موقتاً غیرفعال شد',
    connecting: 'در حال برقراری ارتباط با تب X...',
    scanning: 'در حال اسکن دنبال‌کنندگان و دنبال‌شدگان...',
    progressAccount: 'در حال شناسایی اکانت...',
    progressFollowing: 'دریافت دنبال‌شدگان: {n} نفر',
    progressFollowers: 'دریافت دنبال‌کنندگان: {n} نفر',
    noXTab: 'هیچ تب فعالی از X باز نیست. تب X.com باز شود؟',
    openXFirst: 'لطفاً X را باز کنید و وارد حساب خود شوید',
    errNotLoggedIn: 'وارد حساب X نشده‌اید',
    errRateLimited: 'محدودیت نرخ درخواست X فعال شد. حدود {n} دقیقه بعد دوباره تلاش کنید.',
    errNoContent: 'ارتباط با صفحه X برقرار نشد. تب X را رفرش کنید.',
    errEmptyResult: 'X لیست خالی برگرداند؛ نتیجه نادیده گرفته شد',
    errGeneric: 'خطا: {msg}',
    newUnfollowersNotice: '{n} نفر از آخرین بررسی شما را آنفالو کرده‌اند',
    confirmAction: 'آیا از {action} کاربر @{handle} مطمئن هستید؟',
    confirmBatch: 'آیا از اجرای {action} برای {n} اکانت در صف ایمن مطمئن هستید؟',
    batchDone: 'عملیات پایان یافت: {ok} موفق، {fail} ناموفق',
    batchRateLimited: 'محدودیت نرخ فعال شد؛ صف متوقف شد',
    batchBusy: 'یک صف عملیات در حال اجراست',
    actionFailed: 'عملیات ناموفق بود',
    showMore: 'نمایش بیشتر ({n})',
    nextActionIn: 'اقدام بعدی در {n} ثانیه...',
    actionProgress: 'اقدام {current} از {total}',
    importInvalid: 'فایل JSON نامعتبر است',
    confirmReset: 'آیا از بازنشانی تمام تنظیمات به حالت اولیه اطمینان دارید؟',
    profileTooltip: 'مشاهده پروفایل @{handle} در تب جدید',
    unfollowedBadge: 'آنفالو کرده',
    noBio: 'بدون بایو',
    justNow: 'چند لحظه پیش',
    minutesAgo: '{n} دقیقه پیش',
    hoursAgo: '{n} ساعت پیش',
    daysAgo: '{n} روز پیش',
    notScannedYet: 'هنوز انجام نشده',
    trackerNothingFound: 'موردی یافت نشد',
    trackerEmptyScanned: 'در این دسته موردی وجود ندارد.',
    actionBlock: 'بلاک',
    actionMute: 'بی‌صدا',
    actionFilter: 'فیلتر',
  },
  en: {
    appSubtitle: 'Smart Shield, Relationship Tracker & Clean Suite',
    navDashboard: 'Dashboard',
    navFilters: 'Filters',
    navTracker: 'Tracker',
    navMedia: 'Media & Zen',
    navRastnevis: 'RastNevis',
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
    statRastnevis: 'RastNevis Edits',
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
    safetyRunningDesc: 'Actions run with random delays (3.5-5.5s) to reduce the risk of rate limits.',
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
    zenModeDesc: 'Clean right sidebar and center the timeline',
    zenKeepSearch: 'Keep Search Bar visible in sidebar',
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
    funFiltersHeading: 'Fun & Special Filters',
    hideBoysModeTitle: 'No-Boys Mode (Hide Guys)',
    hideBoysModeDesc: 'Automatically hide tweets from male accounts on timeline (smart detection by name, bio & pronouns)',
    boysWhitelistHeading: 'Exempt Friends Whitelist:',
    boysWhitelistDesc: 'Accounts in this list will never be hidden on timeline.',
    boysWhitelistPlaceholder: 'Friend username (e.g. @amir)...',
    boysWhitelistAdded: 'Added to exempt friends list',
    boysWhitelistExists: 'User already in exempt list',

    // RastNevis Smart Editor
    rnMasterTitle: 'RastNevis Smart Persian Editor',
    rnMasterDesc: 'Automatic Persian spell-checking, heksare, ZWNJ, and Arabic normalization',
    rnRulesHeading: 'Grammar Rules & Engine',
    rnRuleHeksareTitle: 'Heksare & Reverse Heksare',
    rnRuleHeksareDesc: 'Syntactic detection of ezāfe vs copula (کتابه من ➔ کتاب من)',
    rnRuleArabicTitle: 'Arabic to Persian Normalization',
    rnRuleArabicDesc: 'Converts Arabic «ي» and «ك» to Persian «ی» and «ک»',
    rnRuleSpellingTitle: 'Native Misspelling Dictionary',
    rnRuleSpellingDesc: 'Detects high-frequency typos (اسفاده ➔ استفاده, مشگل ➔ مشکل)',
    rnRuleZwnjTitle: 'Structural Half-Space (ZWNJ)',
    rnRuleZwnjDesc: 'Smart spacing for «می/نمی» and «ها/تر/ترین» suffixes',
    rnRuleHintsTitle: 'Subtle Stylistic Hints',
    rnRuleHintsDesc: 'Tanwin (واقعا ➔ واقعاً) and repeated character reduction (عالییی ➔ عالی)',
    rnDisplayHeading: 'Timeline Appearance on X',
    rnOptUnderlineTitle: 'Interactive Underline on Typos',
    rnOptUnderlineDesc: 'Wavy colored underlines with interactive tooltips on click',
    rnOptShowBadgeTitle: 'Inline Badge & Revision Panel',
    rnOptShowBadgeDesc: 'Summary badge under tweets with 1-click copy of fixed text',
    rnTestHeading: 'Live Interactive Editor',
    rnTestDesc: 'Type or paste Persian text below for real-time analysis and correction:',
    rnTestPlaceholder: 'Type sample text here... e.g. توییته تستی برایه پروژه راست‌نویس اسفاده شد...',
    rnFixedLabel: 'Corrected Text:',
    rnBtnCopy: 'Copy Text',
    rnCopied: 'Copied',
    rnCopyFailed: 'Copy failed',
    rnStatsHeading: 'Statistics & Privacy',
    rnMarkedLabel: 'Tweets Marked & Edited',
    rnBtnReset: 'Reset Counter',
    rnPrivacyNote: '100% Local & Safe (Zero Data Collection) — Processed entirely on-device',
    rnZeroIssues: 'No errors found in text',
    rnIssuesFound: '{n} errors found',
    rnCounterReset: 'Counter reset successfully',

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

    storageError: 'Saving failed. Sync storage may be full.',
    filterExists: 'Filter already exists',
    filterAdded: 'Filter added',
    filterInvalidRegex: 'Invalid regular expression',
    filtersAdded: '{n} filters added',
    packAllExist: 'All pack filters already exist',
    confirmClearFilters: 'Delete all filters?',
    filterToggleHint: 'Click to enable/disable',
    whitelistExists: 'User already in whitelist',
    whitelistAdded: 'Added to whitelist',
    invalidHandle: 'Invalid username',
    shieldPaused: 'Protection shield paused',
    connecting: 'Connecting to X tab...',
    scanning: 'Scanning followers & following...',
    progressAccount: 'Identifying account...',
    progressFollowing: 'Fetching following: {n}',
    progressFollowers: 'Fetching followers: {n}',
    noXTab: 'No X tab found. Open X.com?',
    openXFirst: 'Please open X and sign in',
    errNotLoggedIn: 'You are not signed in to X',
    errRateLimited: 'X rate limit reached. Try again in about {n} min.',
    errNoContent: 'Could not reach the X page. Reload the X tab.',
    errEmptyResult: 'X returned an empty list; the result was discarded',
    errGeneric: 'Error: {msg}',
    newUnfollowersNotice: '{n} accounts unfollowed you since the last scan',
    confirmAction: 'Confirm {action} @{handle}?',
    confirmBatch: 'Run safe {action} on {n} accounts?',
    batchDone: 'Complete: {ok} succeeded, {fail} failed',
    batchRateLimited: 'Rate limit reached; queue stopped',
    batchBusy: 'An action queue is already running',
    actionFailed: 'Action failed',
    showMore: 'Show more ({n})',
    nextActionIn: 'Next action in {n}s...',
    actionProgress: 'Action {current} of {total}',
    importInvalid: 'Invalid JSON file',
    confirmReset: 'Reset all settings?',
    profileTooltip: 'View @{handle} on X',
    unfollowedBadge: 'Unfollowed',
    noBio: 'No bio',
    justNow: 'Just now',
    minutesAgo: '{n}m ago',
    hoursAgo: '{n}h ago',
    daysAgo: '{n}d ago',
    notScannedYet: 'Not scanned yet',
    trackerNothingFound: 'Nothing found',
    trackerEmptyScanned: 'Nothing in this category.',
    actionBlock: 'Block',
    actionMute: 'Mute',
    actionFilter: 'Filter',
  },
};

// ============================================================================
// State
// ============================================================================
const STATS_KEY = 'xwise.stats';
const ACTIVITY_KEY = 'xwise.activityLog';
const RENDER_PAGE_SIZE = 100;
const SYNC_INJECT_FILES = [
  'modules/cache.js',
  'modules/twitterApi.js',
  'modules/relationshipTracker.js',
  'modules/rastnevis.js',
  'content.js',
];

const PRESET_PACKS = {
  gov: ['🇵🇸', '🇱🇧', '🍉', '🎒', '☫', 'ارزشی', 'ولایی', 'ساندیس', 'سایبری', 'حجاب'],
  bait: ['follow + rt', 'rt + follow', 'فالو + ریت', 'بک میدم', 'فالو = بک', 'ایردراپ قطعی', 'drop your wallet'],
  betting: ['بت', 'قمار', 'کازینو', 'انفجار', 'شرط بندی', 'بونوس', 'پیش‌بینی', '1xbet', 'bet90'],
  crypto: ['airdrop', 'giveaway', 'presale', 'crypto', 'web3', 'minting', 'free mint', 'claim now', 'memecoin'],
};

const MEDIA_TOGGLES = [
  'volumeSliderEnabled', 'rememberVolume', 'videoDownloadEnabled', 'videoLoopEnabled',
  'adBlockerEnabled', 'zenModeEnabled', 'zenKeepSearch', 'hideWhoToFollow', 'hideProfileWhoToFollow',
  'hideGrokDrawer', 'hidePremiumUpsell', 'hideViewCounts', 'filterDefaultAvatars',
  'filterEngagementBait', 'hideBoysMode',
];

const BOOLEAN_SETTINGS = [
  'shieldEnabled', 'trackerEnabled', 'trackerBadgeAlerts', 'volumeSliderEnabled', 'rememberVolume',
  'videoLoopEnabled', 'videoDownloadEnabled', 'cleanTimelineEnabled', 'hideWhoToFollow',
  'hideProfileWhoToFollow', 'hideGrokDrawer', 'hidePremiumUpsell', 'hideViewCounts', 'zenModeEnabled',
  'zenKeepSearch', 'scrollToTopEnabled', 'highResImagesEnabled', 'filterEngineEnabled',
  'filterCaseSensitive', 'filterWholeWord', 'filterDefaultAvatars', 'filterEngagementBait',
  'hideBoysMode', 'adBlockerEnabled', 'blockButtonEnabled', 'quickMenuEnabled', 'shortcutEnabled',
  'shortcutCtrl', 'shortcutAlt', 'shortcutShift', 'confirmDelayOnShortcut', 'showMatchBadges',
  'showBlockToasts', 'rastnevisEnabled', 'rastnevisHeksare', 'rastnevisArabic', 'rastnevisSpelling',
  'rastnevisZwnj', 'rastnevisHints', 'rastnevisShowBadge', 'rastnevisUnderline',
];
const ENUM_SETTINGS = {
  filterMode: ['hide', 'auto-mute', 'auto-block', 'dry-run'],
  blueCheckFilter: ['off', 'replies-only', 'all'],
  blueCheckAction: ['hide', 'mute', 'block'],
  language: ['fa', 'en'],
};
const TRACKER_INTERVALS = [0, 120, 240, 720, 1440];
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
const FILTER_ACTIONS = ['default', 'dry-run', 'hide', 'auto-mute', 'auto-block'];
const HANDLE_PATTERN = /^[A-Za-z0-9_]{1,15}$/;

const isEmbedded = window !== window.top;

let currentSettings = {};
let currentLang = 'fa';
let activeCategory = 'unfollowers';
let trackerCategories = emptyCategories();
let trackerQuery = '';
let filterQuery = '';
let visibleLimit = RENDER_PAGE_SIZE;
let activeBatchAction = null;
let batchPaused = false;
let syncInFlight = false;
let awaitingDrawerSync = false;
let safetyCountdownInterval = null;
let trackerRenderTimer = null;
let toastTimer = null;
const selectedUserIds = new Set();

function emptyCategories() {
  return {
    nonFollowers: [], fans: [], mutuals: [], unfollowers: [], newFollowers: [],
    newUnfollowerCount: 0, isInitialScan: true,
  };
}

const userId = (user) => user.id || String(user.handle || '').toLowerCase();
const $ = (id) => document.getElementById(id);

function t(key, vars) {
  const dict = I18N[currentLang] || I18N.fa;
  let text = dict[key] ?? I18N.fa[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (isEmbedded) setupEmbeddedMode();

  let loaded = await sendMessageAsync({ type: 'XWISE_GET_SETTINGS' });
  if ((!loaded || Object.keys(loaded).length === 0) && chrome?.storage?.sync) {
    loaded = await chrome.storage.sync.get(null);
  }
  currentSettings = {
    shieldEnabled: true,
    filterEngineEnabled: true,
    filterMode: 'hide',
    filterScopes: { displayName: true, bio: true, tweetText: false },
    filters: [],
    whitelist: [],
    language: 'fa',
    zenKeepSearch: true,
    boysWhitelist: [],
    rastnevisEnabled: true,
    rastnevisHeksare: true,
    rastnevisArabic: true,
    rastnevisSpelling: true,
    rastnevisZwnj: true,
    rastnevisHints: true,
    rastnevisShowBadge: true,
    rastnevisUnderline: true,
    ...loaded,
  };
  currentLang = currentSettings.language || 'fa';
  applyLocalization(currentLang);

  if (globalThis.XWiseRelationshipTracker) {
    trackerCategories = await globalThis.XWiseRelationshipTracker.init();
  }

  setupTabs();
  setupDashboard();
  setupFiltersTab();
  setupTrackerTab();
  setupMediaTab();
  setupRastnevisTab();
  setupSettingsTab();
  syncControlsFromSettings();

  renderDashboard();
  renderTrackerCounts();
  renderTrackerList();
  renderLastSync();
  updateCacheStats();

  listenForExternalChanges();
  sendMessageAsync({ type: 'XWISE_CLEAR_BADGE' });
  resumeBatchIfRunning();
});

function setupEmbeddedMode() {
  const closeBtn = $('iframeCloseBtn');
  if (closeBtn) {
    closeBtn.style.display = 'flex';
    closeBtn.addEventListener('click', () => postToParent({ type: 'XWISE_CLOSE_DRAWER' }));
  }

  window.addEventListener('message', async (event) => {
    if (event.source !== window.parent) return;
    const data = event.data || {};

    if (data.type === 'XWISE_DRAWER_SYNC_RESULT') {
      awaitingDrawerSync = false;
      finishSyncUi();
      if (data.success) await handleSyncSuccess(data.meta);
      else showPopupToast(humanizeSyncError(data.error));
    } else if (data.type === 'XWISE_DRAWER_SYNC_PROGRESS') {
      updateSyncProgress(data.payload);
    } else if (data.type === 'XWISE_DRAWER_BATCH_EVENT') {
      handleBatchEvent(data.payload);
    }
  });
}

function postToParent(message) {
  const origin = (location.ancestorOrigins && location.ancestorOrigins[0]) || '*';
  window.parent.postMessage(message, origin);
}

function listenForExternalChanges() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      let touched = false;
      for (const [key, change] of Object.entries(changes)) {
        if (JSON.stringify(currentSettings[key]) === JSON.stringify(change.newValue)) continue;
        currentSettings[key] = change.newValue;
        touched = true;
        if (key === 'language' && change.newValue && change.newValue !== currentLang) {
          applyLocalization(change.newValue);
        }
      }
      if (touched) syncControlsFromSettings();
    } else if (area === 'local' && (changes[STATS_KEY] || changes[ACTIVITY_KEY])) {
      renderDashboard();
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'XWISE_SYNC_PROGRESS') updateSyncProgress(message.payload);
    else if (message?.type === 'XWISE_BATCH_EVENT') handleBatchEvent(message.payload);
  });
}

// ============================================================================
// Messaging and storage helpers
// ============================================================================
function sendMessageAsync(msg) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(msg, (response) => {
        void chrome.runtime.lastError;
        resolve(response || {});
      });
    } else {
      resolve({});
    }
  });
}

function sendToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(response);
    });
  });
}

async function saveSettings(updates) {
  const previous = {};
  for (const key of Object.keys(updates)) previous[key] = currentSettings[key];
  currentSettings = { ...currentSettings, ...updates };

  if (!chrome?.storage?.sync) return true;
  try {
    await chrome.storage.sync.set(updates);
    return true;
  } catch {
    currentSettings = { ...currentSettings, ...previous };
    showPopupToast(t('storageError'), 3200);
    return false;
  }
}

function readLocal(keys) {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) {
      resolve({});
      return;
    }
    chrome.storage.local.get(keys, (res) => resolve(res || {}));
  });
}

// ============================================================================
// Localization
// ============================================================================
function applyLocalization(lang) {
  currentLang = lang;
  const dict = I18N[lang] || I18N.fa;

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';

  const langTextEl = $('langText');
  if (langTextEl) langTextEl.textContent = lang === 'fa' ? 'EN' : 'فا';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.placeholder = dict[key];
  });

  const langSelect = $('settingLanguage');
  if (langSelect) langSelect.value = lang;

  renderLastSync();
}

async function changeLanguage(lang) {
  applyLocalization(lang);
  syncControlsFromSettings();
  renderTrackerList();
  renderDashboard();
  await saveSettings({ language: lang });
  showPopupToast(t('settingsSaved'));
}

// ============================================================================
// Controls synchronisation
// ============================================================================
function setChecked(id, value) {
  const el = $(id);
  if (el) el.checked = !!value;
}

function syncControlsFromSettings() {
  const s = currentSettings;
  const shieldOn = s.shieldEnabled !== false;

  setChecked('dashMasterToggle', shieldOn);
  $('dashShieldDot')?.classList.toggle('active', shieldOn);
  const desc = $('dashShieldDesc');
  if (desc) desc.textContent = shieldOn ? t('shieldMasterDesc') : t('shieldPaused');

  setChecked('filterEngineEnabled', s.filterEngineEnabled);
  document.querySelectorAll('.xe-seg-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === (s.filterMode || 'hide'));
  });

  const scopes = s.filterScopes || {};
  setChecked('scopeDisplayName', scopes.displayName !== false);
  setChecked('scopeBio', scopes.bio !== false);
  setChecked('scopeTweetText', scopes.tweetText);

  MEDIA_TOGGLES.forEach((key) => setChecked(key, s[key]));
  const zenSub = $('zenSubOptions');
  if (zenSub) zenSub.style.display = s.zenModeEnabled ? 'flex' : 'none';

  setChecked('rastnevisMasterToggle', s.rastnevisEnabled !== false);
  setChecked('rnRuleHeksare', s.rastnevisHeksare !== false);
  setChecked('rnRuleArabic', s.rastnevisArabic !== false);
  setChecked('rnRuleSpelling', s.rastnevisSpelling !== false);
  setChecked('rnRuleZwnj', s.rastnevisZwnj !== false);
  setChecked('rnRuleHints', s.rastnevisHints !== false);
  setChecked('rnOptUnderline', s.rastnevisUnderline !== false);
  setChecked('rnOptShowBadge', s.rastnevisShowBadge !== false);

  const setValue = (id, value) => {
    const el = $(id);
    if (el) el.value = String(value);
  };
  setValue('defaultPlaybackRate', s.defaultPlaybackRate || 1);
  setValue('blueCheckFilter', s.blueCheckFilter || 'off');
  setValue('trackerCheckInterval', s.trackerCheckInterval ?? 240);
  setValue('settingLanguage', currentLang);

  const keyDisplay = $('shortcutKeyDisplay');
  if (keyDisplay) keyDisplay.textContent = String(s.shortcutKey || 'b').toUpperCase();

  renderFilterChips();
  renderWhitelistChips();
  renderBoysWhitelistChips();
}

// ============================================================================
// Tabs
// ============================================================================
function activateTab(name) {
  document.querySelectorAll('.xe-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === name);
  });
  document.querySelectorAll('.xe-tab-pane').forEach((pane) => {
    pane.classList.toggle('active', pane.id === `tab-${name}`);
  });
  if (name === 'settings') updateCacheStats();
  if (name === 'rastnevis') updateRastnevisStats();
}

function setupTabs() {
  document.querySelectorAll('.xe-tab').forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.getAttribute('data-tab')));
  });

  $('langToggle')?.addEventListener('click', () => {
    changeLanguage(currentLang === 'fa' ? 'en' : 'fa');
  });
}

// ============================================================================
// Dashboard
// ============================================================================
function setupDashboard() {
  $('dashMasterToggle')?.addEventListener('change', async (e) => {
    await saveSettings({ shieldEnabled: e.target.checked });
    syncControlsFromSettings();
  });

  $('dashSyncBtn')?.addEventListener('click', () => performSync({ fromDashboard: true }));

  const openMyProfile = () => {
    const handle = $('dashHandle')?.textContent?.replace(/^@/, '');
    if (handle && handle !== 'unknown') openProfile(handle);
  };
  for (const id of ['dashAvatar', 'dashHandle']) {
    const el = $(id);
    if (!el) continue;
    el.style.cursor = 'pointer';
    el.addEventListener('click', openMyProfile);
  }

  $('dashRastnevisStatBox')?.addEventListener('click', () => activateTab('rastnevis'));

  $('btnClearActivity')?.addEventListener('click', async () => {
    if (!chrome?.storage?.local) return;
    await chrome.storage.local.set({ [ACTIVITY_KEY]: [] });
    renderActivityLog([]);
  });
}

function openProfile(handle) {
  const url = `https://x.com/${handle}`;
  if (chrome?.tabs?.create) chrome.tabs.create({ url });
  else window.open(url, '_blank');
}

function formatCount(value) {
  return Number(value || 0).toLocaleString(currentLang === 'fa' ? 'fa-IR' : 'en-US');
}

async function updateRastnevisStats() {
  if (!chrome?.storage?.local) return;
  try {
    const res = await chrome.storage.local.get({ marked: 0 });
    const count = Number(res.marked || 0);
    const rnEl = $('rnMarkedCount');
    if (rnEl) rnEl.textContent = formatCount(count);
    const dashEl = $('statRastnevisCount');
    if (dashEl) dashEl.textContent = formatCount(count);
  } catch {}
}

async function renderDashboard() {
  const local = await readLocal([STATS_KEY, ACTIVITY_KEY, 'marked']);
  const stats = local[STATS_KEY] || {};

  $('statAdBlockCount').textContent = formatCount(stats.adBlockCount);
  $('statHideCount').textContent = formatCount(stats.hideCount);
  $('statBlockCount').textContent = formatCount((stats.blockCount || 0) + (stats.filterBlockCount || 0));
  $('statUnfollowCount').textContent = formatCount(trackerCategories.unfollowers?.length);
  const rnStatEl = $('statRastnevisCount');
  if (rnStatEl) rnStatEl.textContent = formatCount(local.marked || 0);
  const rnMarkedEl = $('rnMarkedCount');
  if (rnMarkedEl) rnMarkedEl.textContent = formatCount(local.marked || 0);

  const snapshot = globalThis.XWiseRelationshipTracker?.latestSnapshot;
  if (snapshot?.account) {
    const acc = snapshot.account;
    if (acc.avatar) $('dashAvatar').src = acc.avatar.replace('_normal', '_bigger');
    if (acc.name) $('dashName').textContent = acc.name;
    if (acc.handle) $('dashHandle').textContent = `@${acc.handle}`;
    $('dashFollowersCount').textContent = formatCount(snapshot.followerCount ?? snapshot.followers?.length);
    $('dashFollowingCount').textContent = formatCount(snapshot.followingCount ?? snapshot.following?.length);
  }

  renderActivityLog(local[ACTIVITY_KEY] || []);
}

function renderActivityLog(list) {
  const container = $('dashActivityList');
  if (!container) return;
  container.textContent = '';

  if (!list || list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'xe-empty-text';
    empty.textContent = t('noActivityYet');
    container.appendChild(empty);
    return;
  }

  const labels = { block: 'actionBlock', mute: 'actionMute' };
  list.slice(0, 15).forEach((item) => {
    const row = document.createElement('div');
    row.className = 'xe-activity-item';

    const handleSpan = document.createElement('span');
    handleSpan.className = 'xe-activity-handle';
    handleSpan.textContent = `@${item.handle}`;

    const ruleSpan = document.createElement('span');
    ruleSpan.className = 'xe-activity-rule';
    ruleSpan.textContent = item.rule || '';

    const badge = document.createElement('span');
    badge.className = `xe-activity-badge xe-act-${item.action}`;
    badge.textContent = t(labels[item.action] || 'actionFilter');

    row.append(handleSpan, ruleSpan, badge);
    container.appendChild(row);
  });
}

// ============================================================================
// Filters tab
// ============================================================================
function validateRegexPattern(raw) {
  const match = raw.match(/^\/(.*)\/([a-z]*)$/i);
  try {
    if (match) new RegExp(match[1], match[2].includes('u') ? match[2] : match[2] + 'u');
    else new RegExp(raw, 'u');
    return true;
  } catch {
    return false;
  }
}

function makeFilter(pattern, isRegex) {
  return {
    id: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    pattern,
    isRegex,
    action: 'default',
    enabled: true,
    createdAt: Date.now(),
  };
}

function setupFiltersTab() {
  $('filterEngineEnabled')?.addEventListener('change', (e) => {
    saveSettings({ filterEngineEnabled: e.target.checked });
  });

  document.querySelectorAll('.xe-seg-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await saveSettings({ filterMode: btn.getAttribute('data-mode') });
      syncControlsFromSettings();
    });
  });

  const scopeControls = { scopeDisplayName: 'displayName', scopeBio: 'bio', scopeTweetText: 'tweetText' };
  for (const [id, scopeKey] of Object.entries(scopeControls)) {
    $(id)?.addEventListener('change', (e) => {
      const scopes = { ...(currentSettings.filterScopes || {}), [scopeKey]: e.target.checked };
      saveSettings({ filterScopes: scopes });
    });
  }

  const addBtn = $('btnAddFilter');
  const input = $('filterInput');
  addBtn?.addEventListener('click', async () => {
    const raw = input.value.trim();
    if (!raw) return;

    const isRegex = raw.startsWith('/') && raw.lastIndexOf('/') > 0;
    if (isRegex && !validateRegexPattern(raw)) {
      showPopupToast(t('filterInvalidRegex'));
      return;
    }

    const filters = [...(currentSettings.filters || [])];
    if (filters.some((f) => f.pattern.toLowerCase() === raw.toLowerCase())) {
      showPopupToast(t('filterExists'));
      return;
    }

    filters.unshift(makeFilter(raw, isRegex));
    if (await saveSettings({ filters })) {
      input.value = '';
      renderFilterChips();
      showPopupToast(t('filterAdded'));
    }
  });
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBtn.click();
  });

  $('btnClearAllFilters')?.addEventListener('click', async () => {
    if (!confirm(t('confirmClearFilters'))) return;
    await saveSettings({ filters: [] });
    renderFilterChips();
  });

  $('filterSearchInput')?.addEventListener('input', (e) => {
    filterQuery = e.target.value.trim().toLowerCase();
    renderFilterChips();
  });

  document.querySelectorAll('.xe-preset-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const keywords = PRESET_PACKS[btn.getAttribute('data-pack')] || [];
      const filters = [...(currentSettings.filters || [])];
      let added = 0;

      for (const keyword of keywords) {
        if (filters.some((f) => f.pattern.toLowerCase() === keyword.toLowerCase())) continue;
        filters.unshift(makeFilter(keyword, false));
        added++;
      }

      if (added === 0) {
        showPopupToast(t('packAllExist'));
      } else if (await saveSettings({ filters })) {
        renderFilterChips();
        showPopupToast(t('filtersAdded', { n: added }));
      }
    });
  });

  setupHandleList({
    inputId: 'whitelistInput',
    buttonId: 'btnAddWhitelist',
    key: 'whitelist',
    render: renderWhitelistChips,
    existsMessage: 'whitelistExists',
    addedMessage: 'whitelistAdded',
  });
}

function normalizeHandle(raw) {
  const handle = String(raw || '').trim().replace(/^@+|@+$/g, '');
  return HANDLE_PATTERN.test(handle) ? handle : '';
}

function setupHandleList({ inputId, buttonId, key, render, existsMessage, addedMessage }) {
  const input = $(inputId);
  const button = $(buttonId);
  if (!input || !button) return;

  button.addEventListener('click', async () => {
    if (!input.value.trim()) return;
    const handle = normalizeHandle(input.value);
    if (!handle) {
      showPopupToast(t('invalidHandle'));
      return;
    }

    const list = [...(currentSettings[key] || [])];
    if (list.some((h) => h.toLowerCase() === handle.toLowerCase())) {
      showPopupToast(t(existsMessage));
      return;
    }

    list.unshift(handle);
    if (await saveSettings({ [key]: list })) {
      input.value = '';
      render();
      showPopupToast(t(addedMessage));
    }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') button.click();
  });
}

function renderFilterChips() {
  const container = $('filterList');
  const badge = $('filterCountBadge');
  if (!container) return;

  const filters = Array.isArray(currentSettings.filters) ? currentSettings.filters : [];
  if (badge) badge.textContent = filters.length;

  const visible = filterQuery
    ? filters.filter((f) => f.pattern.toLowerCase().includes(filterQuery))
    : filters;

  container.textContent = '';
  if (visible.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'xe-empty-text';
    empty.textContent = t('noFiltersYet');
    container.appendChild(empty);
    return;
  }

  visible.forEach((f) => {
    const chip = document.createElement('div');
    chip.className = 'xe-chip' + (f.enabled === false ? ' xe-chip-off' : '') + (f.isRegex ? ' xe-chip-regex' : '');

    const text = document.createElement('span');
    text.className = 'xe-chip-text';
    text.textContent = f.pattern;
    text.title = t('filterToggleHint');
    text.addEventListener('click', async () => {
      const updated = (currentSettings.filters || []).map((item) =>
        item.id === f.id ? { ...item, enabled: item.enabled === false } : item
      );
      await saveSettings({ filters: updated });
      renderFilterChips();
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'xe-chip-del';
    del.textContent = '×';
    del.addEventListener('click', async () => {
      const updated = (currentSettings.filters || []).filter((item) => item.id !== f.id);
      await saveSettings({ filters: updated });
      renderFilterChips();
    });

    chip.append(text, del);
    container.appendChild(chip);
  });
}

function renderHandleChips(containerId, badgeId, key, render) {
  const container = $(containerId);
  const badge = $(badgeId);
  if (!container) return;

  const list = Array.isArray(currentSettings[key]) ? currentSettings[key] : [];
  if (badge) badge.textContent = list.length;

  container.textContent = '';
  list.forEach((handle) => {
    const chip = document.createElement('div');
    chip.className = 'xe-chip';

    const text = document.createElement('span');
    text.textContent = `@${handle}`;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'xe-chip-del';
    del.textContent = '×';
    del.addEventListener('click', async () => {
      const updated = (currentSettings[key] || []).filter((h) => h.toLowerCase() !== handle.toLowerCase());
      await saveSettings({ [key]: updated });
      render();
    });

    chip.append(text, del);
    container.appendChild(chip);
  });
}

function renderWhitelistChips() {
  renderHandleChips('whitelistContainer', 'whitelistCountBadge', 'whitelist', renderWhitelistChips);
}

function renderBoysWhitelistChips() {
  renderHandleChips('boysWhitelistContainer', 'boysWhitelistCountBadge', 'boysWhitelist', renderBoysWhitelistChips);
}

// ============================================================================
// Relationship tracker: tab discovery
// ============================================================================
async function findXTab() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.url && /^https?:\/\/([\w-]+\.)?(x|twitter)\.com\//.test(activeTab.url)) return activeTab;

  const tabs = await chrome.tabs.query({ url: ['*://*.x.com/*', '*://*.twitter.com/*'] });
  return tabs[0] || null;
}

async function ensureContentScript(tab) {
  try {
    await sendToTab(tab.id, { type: 'XWISE_PING' });
    return;
  } catch {
    // Not injected yet (tab opened before install or reload)
  }
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: SYNC_INJECT_FILES });
  await sendToTab(tab.id, { type: 'XWISE_PING' });
}

async function requireXTab() {
  const tab = await findXTab();
  if (!tab) {
    if (confirm(t('noXTab'))) chrome.tabs.create({ url: 'https://x.com' });
    throw new Error('NO_X_TAB');
  }
  await ensureContentScript(tab);
  return tab;
}

function humanizeError(message = '') {
  if (message === 'NO_X_TAB') return t('openXFirst');
  if (message === 'NOT_LOGGED_IN') return t('errNotLoggedIn');
  if (message === 'EMPTY_RESULT') return t('errEmptyResult');
  if (message === 'BATCH_BUSY') return t('batchBusy');
  if (message.startsWith('RATE_LIMITED')) {
    const seconds = parseInt(message.split(':')[1], 10) || 900;
    return t('errRateLimited', { n: Math.max(1, Math.ceil(seconds / 60)) });
  }
  if (/Receiving end does not exist|Could not establish connection|TWITTER_API_NOT_LOADED|TRACKER_NOT_LOADED|Cannot access|context invalidated/i.test(message)) {
    return t('errNoContent');
  }
  return t('errGeneric', { msg: message });
}
const humanizeSyncError = humanizeError;

// ============================================================================
// Relationship tracker: sync
// ============================================================================
function setSyncUi(active, message) {
  const statusEl = $('trackerSyncStatus');
  const msgEl = $('trackerSyncMsg');
  const syncBtn = $('trackerSyncBtn');
  const dashBtn = $('dashSyncBtn');

  if (statusEl) statusEl.style.display = active ? 'flex' : 'none';
  if (msgEl && message) msgEl.textContent = message;
  if (syncBtn) syncBtn.disabled = active;
  if (dashBtn) dashBtn.disabled = active;
  if (active && $('trackerNotice')) $('trackerNotice').style.display = 'none';
}

function finishSyncUi() {
  syncInFlight = false;
  setSyncUi(false);
}

function updateSyncProgress(progress) {
  const msgEl = $('trackerSyncMsg');
  if (!progress || !msgEl) return;
  const keys = { account: 'progressAccount', following: 'progressFollowing', followers: 'progressFollowers' };
  const key = keys[progress.stage];
  if (key) msgEl.textContent = t(key, { n: formatCount(progress.count) });
}

async function performSync({ fromDashboard = false } = {}) {
  if (syncInFlight) return;
  syncInFlight = true;
  if (fromDashboard) activateTab('tracker');
  setSyncUi(true, t('connecting'));

  try {
    if (isEmbedded) {
      awaitingDrawerSync = true;
      postToParent({ type: 'XWISE_DRAWER_RUN_SYNC' });
      return;
    }

    const tab = await requireXTab();
    setSyncUi(true, t('scanning'));

    const response = await sendToTab(tab.id, { type: 'XWISE_RUN_RELATIONSHIP_SYNC' });
    if (!response?.success) throw new Error(response?.error || 'SYNC_FAILED');
    await handleSyncSuccess(response.meta);
  } catch (err) {
    console.error('[XWise] Sync failed:', err);
    showPopupToast(humanizeError(err.message), 3200);
  } finally {
    if (!awaitingDrawerSync) finishSyncUi();
  }
}

async function handleSyncSuccess(meta) {
  const tracker = globalThis.XWiseRelationshipTracker;
  if (tracker) trackerCategories = await tracker.init();
  selectedUserIds.clear();
  visibleLimit = RENDER_PAGE_SIZE;

  const noticeEl = $('trackerNotice');
  if (noticeEl) {
    if (meta?.isInitialScan) {
      noticeEl.style.display = 'block';
      noticeEl.textContent = t('initialScanNotice');
    } else if (meta?.newUnfollowerCount > 0) {
      noticeEl.style.display = 'block';
      noticeEl.textContent = t('newUnfollowersNotice', { n: meta.newUnfollowerCount });
    } else {
      noticeEl.style.display = 'none';
    }
  }

  renderDashboard();
  renderTrackerCounts();
  renderTrackerList();
  renderLastSync();
  showPopupToast(t('syncSuccess'));
}

function renderLastSync() {
  const el = $('trackerLastSyncTime');
  if (!el) return;
  const timestamp = globalThis.XWiseRelationshipTracker?.latestSnapshot?.timestamp;
  el.textContent = timestamp
    ? new Date(timestamp).toLocaleString(currentLang === 'fa' ? 'fa-IR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
    : t('notScannedYet');
}

// ============================================================================
// Relationship tracker: list
// ============================================================================
function setupTrackerTab() {
  $('trackerSyncBtn')?.addEventListener('click', () => performSync());

  const pills = document.querySelectorAll('.xe-cat-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-category');
      selectedUserIds.clear();
      visibleLimit = RENDER_PAGE_SIZE;
      renderTrackerList();
    });
  });

  $('trackerSearchInput')?.addEventListener('input', (e) => {
    trackerQuery = e.target.value.trim().toLowerCase();
    visibleLimit = RENDER_PAGE_SIZE;
    renderTrackerList();
  });

  $('btnBatchSelectAll')?.addEventListener('click', () => {
    const selectable = getSelectableUsers();
    const allSelected = selectable.length > 0 && selectable.every((u) => selectedUserIds.has(userId(u)));
    selectable.forEach((u) => {
      if (allSelected) selectedUserIds.delete(userId(u));
      else selectedUserIds.add(userId(u));
    });
    renderTrackerList();
  });

  $('btnBatchAction')?.addEventListener('click', startBatchAction);

  $('btnSafetyPause')?.addEventListener('click', () => {
    sendBatchControl(batchPaused ? 'resume' : 'pause');
  });
  $('btnSafetyStop')?.addEventListener('click', () => {
    sendBatchControl('stop');
    closeSafetyModal();
  });
}

function renderTrackerCounts() {
  const counts = {
    catCountUnfollowers: trackerCategories.unfollowers,
    catCountNonFollowers: trackerCategories.nonFollowers,
    catCountFans: trackerCategories.fans,
    catCountMutuals: trackerCategories.mutuals,
    catCountNewFollowers: trackerCategories.newFollowers,
  };
  for (const [id, list] of Object.entries(counts)) {
    const el = $(id);
    if (el) el.textContent = formatCount(list?.length);
  }

  const navBadge = $('navTrackerBadge');
  if (navBadge) {
    const fresh = trackerCategories.newUnfollowerCount || 0;
    navBadge.style.display = fresh > 0 ? 'block' : 'none';
    navBadge.textContent = fresh;
  }
}

function getFilteredCategoryList(query = trackerQuery) {
  const list = trackerCategories[activeCategory] || [];
  if (!query) return list;
  return list.filter(
    (u) =>
      String(u.handle || '').toLowerCase().includes(query) ||
      String(u.name || '').toLowerCase().includes(query) ||
      String(u.bio || '').toLowerCase().includes(query)
  );
}

function followingKeys() {
  const following = globalThis.XWiseRelationshipTracker?.latestSnapshot?.following || [];
  return new Set(following.map(userId));
}

function actionForUser(user, following = followingKeys()) {
  if (activeCategory === 'fans') return 'remove_follower';
  if (activeCategory === 'nonFollowers' || activeCategory === 'mutuals') return 'unfollow';
  if (activeCategory === 'unfollowers' || activeCategory === 'newFollowers') {
    return following.has(userId(user)) ? 'unfollow' : null;
  }
  return null;
}

function getSelectableUsers() {
  const following = followingKeys();
  return getFilteredCategoryList().filter((u) => actionForUser(u, following));
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return t('justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('minutesAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('hoursAgo', { n: hours });
  return t('daysAgo', { n: Math.floor(hours / 24) });
}

function scheduleTrackerRender() {
  clearTimeout(trackerRenderTimer);
  trackerRenderTimer = setTimeout(() => {
    renderTrackerCounts();
    renderTrackerList();
  }, 300);
}

function createUserCard(user, following) {
  const action = actionForUser(user, following);
  const card = document.createElement('div');
  card.className = 'xe-user-card';

  const left = document.createElement('div');
  left.className = 'xe-user-card-left';

  if (action) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'xe-user-card-checkbox';
    checkbox.checked = selectedUserIds.has(userId(user));
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedUserIds.add(userId(user));
      else selectedUserIds.delete(userId(user));
      updateBatchActionButton();
    });
    left.appendChild(checkbox);
  } else {
    const spacer = document.createElement('span');
    spacer.className = 'xe-user-card-spacer';
    left.appendChild(spacer);
  }

  const link = document.createElement('a');
  link.className = 'xe-user-card-link';
  link.href = `https://x.com/${user.handle}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.title = t('profileTooltip', { handle: user.handle });
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openProfile(user.handle);
  });

  const avatar = document.createElement('img');
  avatar.className = 'xe-user-card-avatar';
  avatar.loading = 'lazy';
  avatar.src = user.avatar ? user.avatar.replace('_normal', '_bigger') : 'icons/icon48.png';

  const textWrap = document.createElement('div');
  textWrap.className = 'xe-user-card-text';

  const nameRow = document.createElement('div');
  nameRow.className = 'xe-user-card-name-row';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'xe-user-card-name';
  nameSpan.textContent = user.name || user.handle;

  const handleSpan = document.createElement('span');
  handleSpan.className = 'xe-user-card-handle';
  handleSpan.textContent = `@${user.handle}`;
  nameRow.append(nameSpan, handleSpan);

  if (activeCategory === 'unfollowers') {
    const lostBadge = document.createElement('span');
    lostBadge.className = 'xe-activity-badge xe-act-block';
    lostBadge.textContent = t('unfollowedBadge');
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
  bioSpan.textContent = user.bio || t('noBio');

  textWrap.append(nameRow, bioSpan);
  link.append(avatar, textWrap);
  left.appendChild(link);

  const actions = document.createElement('div');
  actions.className = 'xe-user-card-actions';
  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = action === 'unfollow' ? 'xe-btn-danger xe-btn-compact' : 'xe-btn-secondary xe-btn-compact';
    btn.textContent = action === 'unfollow' ? t('unfollowAction') : t('removeFollowerAction');
    btn.addEventListener('click', () => singleAction(user, action));
    actions.appendChild(btn);
  }

  card.append(left, actions);
  return card;
}

function renderTrackerList() {
  const container = $('trackerUserList');
  if (!container) return;

  const users = getFilteredCategoryList();
  container.textContent = '';

  if (users.length === 0) {
    const scanned = !!globalThis.XWiseRelationshipTracker?.latestSnapshot;
    const empty = document.createElement('div');
    empty.className = 'xe-empty-state';
    empty.innerHTML = '<div class="xe-empty-icon"></div><p class="xe-empty-title"></p><p class="xe-empty-sub"></p>';
    empty.querySelector('.xe-empty-icon').textContent = activeCategory === 'unfollowers' ? '💔' : '👥';
    empty.querySelector('.xe-empty-title').textContent = t(scanned ? 'trackerNothingFound' : 'trackerEmptyTitle');
    empty.querySelector('.xe-empty-sub').textContent = t(scanned ? 'trackerEmptyScanned' : 'trackerEmptySub');
    container.appendChild(empty);
    updateBatchActionButton();
    return;
  }

  const following = followingKeys();
  const fragment = document.createDocumentFragment();
  users.slice(0, visibleLimit).forEach((user) => fragment.appendChild(createUserCard(user, following)));
  container.appendChild(fragment);

  if (users.length > visibleLimit) {
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'xe-btn-secondary xe-show-more';
    more.textContent = t('showMore', { n: formatCount(users.length - visibleLimit) });
    more.addEventListener('click', () => {
      visibleLimit += RENDER_PAGE_SIZE;
      renderTrackerList();
    });
    container.appendChild(more);
  }

  updateBatchActionButton();
}

function updateBatchActionButton() {
  const btn = $('btnBatchAction');
  const label = $('batchActionLabel');
  const selectAll = $('btnBatchSelectAll');
  if (!btn || !label) return;

  const selectable = getSelectableUsers();
  const allSelected = selectable.length > 0 && selectable.every((u) => selectedUserIds.has(userId(u)));
  if (selectAll) {
    selectAll.style.display = selectable.length > 0 ? '' : 'none';
    selectAll.textContent = allSelected ? t('deselectAll') : t('selectAll');
  }

  const count = selectedUserIds.size;
  btn.style.display = count === 0 ? 'none' : 'inline-flex';
  if (count > 0) {
    const actionText = activeCategory === 'fans' ? t('removeFollowerAction') : t('unfollowAction');
    label.textContent = `${actionText} (${count})`;
  }
}

// ============================================================================
// Relationship tracker: actions
// ============================================================================
function actionLabel(actionType) {
  return actionType === 'unfollow' ? t('unfollowAction') : t('removeFollowerAction');
}

async function singleAction(user, actionType) {
  if (!confirm(t('confirmAction', { action: actionLabel(actionType), handle: user.handle }))) return;

  if (isEmbedded) {
    activeBatchAction = actionType;
    postToParent({ type: 'XWISE_DRAWER_RUN_BATCH', targets: [user], actionType });
    return;
  }

  try {
    const tab = await requireXTab();
    const res = await sendToTab(tab.id, { type: 'XWISE_RUN_BATCH_ACTION', targets: [user], actionType });
    if (!res?.success) throw new Error(res?.error || 'ACTION_FAILED');

    selectedUserIds.delete(userId(user));
    if (globalThis.XWiseRelationshipTracker) {
      trackerCategories = await globalThis.XWiseRelationshipTracker.init();
    }
    renderTrackerCounts();
    renderTrackerList();
    showPopupToast(t('actionComplete'));
  } catch (err) {
    showPopupToast(err.message === 'ACTION_FAILED' ? t('actionFailed') : humanizeError(err.message), 3200);
  }
}

async function startBatchAction() {
  const following = followingKeys();
  const targets = getFilteredCategoryList().filter(
    (u) => selectedUserIds.has(userId(u)) && actionForUser(u, following)
  );
  if (targets.length === 0) return;

  const actionType = activeCategory === 'fans' ? 'remove_follower' : 'unfollow';
  if (!confirm(t('confirmBatch', { action: actionLabel(actionType), n: targets.length }))) return;

  activeBatchAction = actionType;
  const slimTargets = targets.map((u) => ({ id: u.id, handle: u.handle, name: u.name }));

  if (isEmbedded) {
    postToParent({ type: 'XWISE_DRAWER_RUN_BATCH', targets: slimTargets, actionType });
    openSafetyModal();
    return;
  }

  try {
    const tab = await requireXTab();
    const res = await sendToTab(tab.id, { type: 'XWISE_START_BATCH', targets: slimTargets, actionType });
    if (!res?.success) throw new Error(res?.error || 'ACTION_FAILED');
    openSafetyModal();
  } catch (err) {
    showPopupToast(humanizeError(err.message), 3200);
  }
}

async function sendBatchControl(command) {
  if (isEmbedded) {
    postToParent({ type: 'XWISE_DRAWER_BATCH_CONTROL', command });
    return;
  }
  try {
    const tab = await findXTab();
    if (tab) await sendToTab(tab.id, { type: 'XWISE_BATCH_CONTROL', command });
  } catch {
    // Content script unavailable
  }
}

async function resumeBatchIfRunning() {
  if (isEmbedded) return;
  try {
    const tab = await findXTab();
    if (!tab) return;
    const status = await sendToTab(tab.id, { type: 'XWISE_BATCH_STATUS' });
    if (status?.state === 'running' || status?.state === 'paused') {
      activeBatchAction = status.progress?.actionType || null;
      batchPaused = status.state === 'paused';
      openSafetyModal();
      if (status.progress) updateBatchProgress(status.progress);
      updatePauseButton();
    }
  } catch {
    // No content script in the tab
  }
}

function openSafetyModal() {
  const modal = $('safetyModal');
  if (modal) modal.style.display = 'flex';
}

function closeSafetyModal() {
  const modal = $('safetyModal');
  if (modal) modal.style.display = 'none';
  clearInterval(safetyCountdownInterval);
  batchPaused = false;
  updatePauseButton();
}

function updatePauseButton() {
  const btn = $('btnSafetyPause');
  if (btn) btn.textContent = batchPaused ? t('btnResume') : t('btnPause');
}

function updateBatchProgress(p) {
  const pct = Math.round((p.current / p.total) * 100);
  const fill = $('safetyProgressFill');
  if (fill) fill.style.width = `${pct}%`;
  const current = $('safetyProgressCurrent');
  if (current) current.textContent = t('actionProgress', { current: p.current, total: p.total });
  const target = $('safetyCurrentTarget');
  if (target && p.user) target.textContent = `@${p.user.handle} (${p.user.name || ''})`;

  clearInterval(safetyCountdownInterval);
  const countdown = $('safetyNextCountdown');
  if (!countdown || !p.delayMs) return;

  const deadline = Date.now() + p.delayMs;
  const tick = () => {
    const remaining = Math.max(0, (deadline - Date.now()) / 1000);
    countdown.textContent = remaining > 0 && !batchPaused ? t('nextActionIn', { n: remaining.toFixed(1) }) : '';
    if (remaining <= 0) clearInterval(safetyCountdownInterval);
  };
  tick();
  safetyCountdownInterval = setInterval(tick, 100);
}

function handleBatchEvent(payload) {
  switch (payload?.event) {
    case 'progress':
      openSafetyModal();
      updateBatchProgress(payload);
      break;

    case 'success':
      selectedUserIds.delete(payload.userId);
      globalThis.XWiseRelationshipTracker?._removeUserFromCategories(
        payload.userId,
        payload.actionType || activeBatchAction
      );
      trackerCategories = globalThis.XWiseRelationshipTracker?.categories || trackerCategories;
      scheduleTrackerRender();
      break;

    case 'state':
      batchPaused = payload.state === 'paused';
      updatePauseButton();
      break;

    case 'rejected':
      closeSafetyModal();
      showPopupToast(humanizeError(payload.error), 3200);
      break;

    case 'complete':
      finishBatch(payload);
      break;
  }
}

async function finishBatch(result) {
  closeSafetyModal();
  clearTimeout(trackerRenderTimer);
  if (globalThis.XWiseRelationshipTracker) {
    trackerCategories = await globalThis.XWiseRelationshipTracker.init();
  }
  activeBatchAction = null;
  renderDashboard();
  renderTrackerCounts();
  renderTrackerList();
  showPopupToast(
    result.rateLimited ? t('batchRateLimited') : t('batchDone', { ok: result.successful, fail: result.failed }),
    3200
  );
}

// ============================================================================
// Media tab
// ============================================================================
function setupMediaTab() {
  MEDIA_TOGGLES.forEach((key) => {
    $(key)?.addEventListener('change', async (e) => {
      await saveSettings({ [key]: e.target.checked });
      if (key === 'zenModeEnabled') syncControlsFromSettings();
    });
  });

  $('defaultPlaybackRate')?.addEventListener('change', (e) => {
    saveSettings({ defaultPlaybackRate: parseFloat(e.target.value) });
  });
  $('blueCheckFilter')?.addEventListener('change', (e) => {
    saveSettings({ blueCheckFilter: e.target.value });
  });

  setupHandleList({
    inputId: 'boysWhitelistInput',
    buttonId: 'btnAddBoysWhitelist',
    key: 'boysWhitelist',
    render: renderBoysWhitelistChips,
    existsMessage: 'boysWhitelistExists',
    addedMessage: 'boysWhitelistAdded',
  });
}

// ============================================================================
// Settings tab
// ============================================================================
function sanitizeImportedSettings(raw) {
  const clean = {};
  if (!raw || typeof raw !== 'object') return clean;

  for (const key of BOOLEAN_SETTINGS) {
    if (typeof raw[key] === 'boolean') clean[key] = raw[key];
  }
  for (const [key, allowed] of Object.entries(ENUM_SETTINGS)) {
    if (allowed.includes(raw[key])) clean[key] = raw[key];
  }
  if (TRACKER_INTERVALS.includes(Number(raw.trackerCheckInterval))) {
    clean.trackerCheckInterval = Number(raw.trackerCheckInterval);
  }
  if (PLAYBACK_RATES.includes(Number(raw.defaultPlaybackRate))) {
    clean.defaultPlaybackRate = Number(raw.defaultPlaybackRate);
  }
  const volume = Number(raw.lastVolume);
  if (Number.isFinite(volume) && volume >= 0 && volume <= 1) clean.lastVolume = volume;
  if (typeof raw.shortcutKey === 'string' && /^[a-z0-9]$/i.test(raw.shortcutKey)) {
    clean.shortcutKey = raw.shortcutKey.toLowerCase();
  }

  if (raw.filterScopes && typeof raw.filterScopes === 'object') {
    clean.filterScopes = {
      displayName: raw.filterScopes.displayName !== false,
      bio: raw.filterScopes.bio !== false,
      tweetText: !!raw.filterScopes.tweetText,
    };
  }

  if (Array.isArray(raw.filters)) {
    clean.filters = raw.filters
      .filter((f) => f && typeof f.pattern === 'string' && f.pattern.trim() && f.pattern.length <= 200)
      .map((f) => {
        const pattern = f.pattern.trim();
        const isRegex = pattern.startsWith('/') && pattern.lastIndexOf('/') > 0;
        return {
          id: typeof f.id === 'string' ? f.id : 'f_' + Math.random().toString(36).substring(2, 9),
          pattern,
          isRegex: isRegex && validateRegexPattern(pattern),
          action: FILTER_ACTIONS.includes(f.action) ? f.action : 'default',
          enabled: f.enabled !== false,
          createdAt: Number(f.createdAt) || Date.now(),
        };
      });
  }

  for (const key of ['whitelist', 'boysWhitelist']) {
    if (Array.isArray(raw[key])) {
      clean[key] = [...new Set(raw[key].map(normalizeHandle).filter(Boolean))];
    }
  }
  return clean;
}

// ============================================================================
// RastNevis Persian Smart Editor Tab (v3.5.0)
// ============================================================================
function setupRastnevisTab() {
  const bindToggle = (id, key) => {
    $(id)?.addEventListener('change', async (e) => {
      await saveSettings({ [key]: e.target.checked });
      runTestBench();
    });
  };

  bindToggle('rastnevisMasterToggle', 'rastnevisEnabled');
  bindToggle('rnRuleHeksare', 'rastnevisHeksare');
  bindToggle('rnRuleArabic', 'rastnevisArabic');
  bindToggle('rnRuleSpelling', 'rastnevisSpelling');
  bindToggle('rnRuleZwnj', 'rastnevisZwnj');
  bindToggle('rnRuleHints', 'rastnevisHints');
  bindToggle('rnOptUnderline', 'rastnevisUnderline');
  bindToggle('rnOptShowBadge', 'rastnevisShowBadge');

  $('rnBtnResetCount')?.addEventListener('click', async () => {
    if (!chrome?.storage?.local) return;
    await chrome.storage.local.set({ marked: 0 });
    const rnEl = $('rnMarkedCount');
    if (rnEl) rnEl.textContent = formatCount(0);
    const dashEl = $('statRastnevisCount');
    if (dashEl) dashEl.textContent = formatCount(0);
    showPopupToast(t('rnCounterReset'));
  });

  // Interactive Live Test Bench
  let testTimer = null;
  const testInput = $('rnTestInput');
  const testBadge = $('rnTestBadge');
  const testIssuesList = $('rnTestIssues');
  const testFixedBox = $('rnTestFixedBox');
  const testFixedText = $('rnTestFixedText');
  const btnCopyFixed = $('rnBtnCopyFixed');

  function runTestBench() {
    const engine = globalThis.RastNevisEngine;
    if (!engine) return;

    const text = testInput?.value || '';
    if (!text.trim()) {
      if (testBadge) testBadge.textContent = '0 ' + t('rnZeroIssues');
      if (testIssuesList) {
        testIssuesList.style.display = 'none';
        testIssuesList.textContent = '';
      }
      if (testFixedBox) testFixedBox.style.display = 'none';
      return;
    }

    const issues = engine.checkText(text, {
      heksare: currentSettings.rastnevisHeksare !== false,
      arabic: currentSettings.rastnevisArabic !== false,
      spelling: currentSettings.rastnevisSpelling !== false,
      zwnj: currentSettings.rastnevisZwnj !== false,
      hints: currentSettings.rastnevisHints !== false,
    });

    if (testBadge) {
      testBadge.textContent = issues.length > 0
        ? t('rnIssuesFound', { n: formatCount(issues.length) })
        : t('rnZeroIssues');
    }

    if (issues.length === 0) {
      if (testIssuesList) {
        testIssuesList.style.display = 'none';
        testIssuesList.textContent = '';
      }
      if (testFixedBox) testFixedBox.style.display = 'none';
      return;
    }

    if (testIssuesList) {
      testIssuesList.textContent = '';
      testIssuesList.style.display = 'flex';
      issues.forEach((issue) => {
        const item = document.createElement('div');
        item.className = `xe-rn-issue-item severity-${issue.severity}`;

        const wrong = document.createElement('span');
        wrong.className = 'xe-rn-wrong';
        wrong.textContent = issue.wrong;

        const arrow = document.createElement('span');
        arrow.className = 'xe-rn-arrow';
        arrow.textContent = '➔';

        const correct = document.createElement('span');
        correct.className = 'xe-rn-correct';
        correct.textContent = issue.correct;

        const reason = document.createElement('span');
        reason.className = 'xe-rn-reason';
        reason.textContent = issue.reason;

        item.appendChild(wrong);
        item.appendChild(arrow);
        item.appendChild(correct);
        item.appendChild(reason);
        testIssuesList.appendChild(item);
      });
    }

    const fixed = engine.applyCorrections(text, issues);
    if (testFixedBox && testFixedText) {
      testFixedText.textContent = fixed;
      testFixedBox.style.display = 'block';
    }
  }

  testInput?.addEventListener('input', () => {
    clearTimeout(testTimer);
    testTimer = setTimeout(runTestBench, 100);
  });

  btnCopyFixed?.addEventListener('click', async () => {
    const fixed = testFixedText?.textContent || '';
    if (!fixed) return;
    try {
      await navigator.clipboard.writeText(fixed);
      btnCopyFixed.textContent = t('rnCopied');
      setTimeout(() => {
        btnCopyFixed.textContent = t('rnBtnCopy');
      }, 1600);
    } catch {
      btnCopyFixed.textContent = t('rnCopyFailed');
    }
  });

  updateRastnevisStats();
}

function setupSettingsTab() {
  $('settingLanguage')?.addEventListener('change', (e) => changeLanguage(e.target.value));

  $('trackerCheckInterval')?.addEventListener('change', async (e) => {
    await saveSettings({ trackerCheckInterval: parseInt(e.target.value, 10) });
    showPopupToast(t('settingsSaved'));
  });

  $('btnClearCache')?.addEventListener('click', async () => {
    await sendMessageAsync({ type: 'XWISE_CLEAR_CACHE' });
    await updateCacheStats();
    showPopupToast(t('cacheCleared'));
  });

  $('btnExportSettings')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(currentSettings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xwise-settings-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $('importFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const imported = sanitizeImportedSettings(JSON.parse(evt.target.result));
        if (Object.keys(imported).length === 0) throw new Error('EMPTY');
        if (await saveSettings(imported)) location.reload();
      } catch {
        showPopupToast(t('importInvalid'));
      }
    };
    reader.readAsText(file);
  });

  $('btnResetSettings')?.addEventListener('click', async () => {
    if (!confirm(t('confirmReset'))) return;
    await chrome.storage.sync.clear();
    location.reload();
  });
}

async function updateCacheStats() {
  const totalEl = $('cacheTotalItems');
  const sizeEl = $('cacheEstimatedSize');
  if (!totalEl || !sizeEl) return;

  const stats = await sendMessageAsync({ type: 'XWISE_GET_CACHE_STATS' });
  totalEl.textContent = formatCount(stats.totalItems);
  sizeEl.textContent = `${formatCount(stats.estimatedSizeKB)} KB`;
}

// ============================================================================
// Toast
// ============================================================================
function showPopupToast(message, duration = 2200) {
  const toast = $('popupToast');
  if (!toast) return;

  toast.textContent = message;
  toast.style.display = 'block';

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = 'none';
  }, duration);
}
