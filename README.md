# XWise Blocker v3.5.6 🛡️✍️⚡

A powerful, ultra-fast, and native-feeling Chrome extension for X (Twitter). XWise Blocker purifies your timeline, protects your attention, and manages your social graph: **Followers & Following List Auto-Blocker & Filter**, **1-Click Quick Block in Retweets & User Lists**, **Bulletproof Sensitive Media Unblur Engine**, **RastNevis Smart Persian Editor & Proofreader**, **Follow/Unfollow Tracker**, **Relationship Manager (Non-followers, Fans, Mutuals, Lost followers)**, **Anti-Limit Safety Queue**, **Two-Tier LRU & TTL Caching**, **Instant CSS-First Ad Blocker**, **Pro Video Suite with MP4 Downloader & Loop**, **No-Boys Mode (Timeline Gender Filter)**, and **10/10 Modern Bilingual UI (FA/EN)** with embedded Vazirmatn font.

---

## ✨ Features Overview

### 1️⃣ Follow/Unfollow Tracker & Relationship Manager 👥
- **Logged-in Account Auto-Detection**: Seamlessly detects your current active Twitter account with zero login hassle.
- **5 Smart Relationship Categories**:
  - 💔 **Unfollowed (آنفالو کردند)**: Tracks accounts that unfollowed you between scans with historical timestamped logging.
  - 🚫 **Non-Followers (بک نداده‌ها)**: Accounts you follow that do not follow you back.
  - 🌟 **Fans (طرفداران)**: Accounts that follow you, but you do not follow.
  - 🤝 **Mutuals (متقابل)**: Mutual connections following each other.
  - 🎉 **New Followers (جدیدها)**: Recent additions to your followers.
- **1-Click Single & Batch Actions**: Unfollow or remove followers directly from user cards without visiting individual profiles.
- **🛡️ Anti-Limit Safety Queue**:
  - Random jittered delays (3.5s – 5.5s) between actions to keep your account 100% safe from Twitter action limits and shadowbans.
  - Live progress bar, countdown timer, pause/resume, and immediate stop controls.
- **Background Periodic Alerts**: Configurable alarm that scans in the background and updates the extension icon badge with new unfollower counts.

### 2️⃣ High-Performance Two-Tier Caching Engine ⚡
- **L1 In-Memory LRU Map**: $O(1)$ fast lookups for user bios and tweet checks, strictly capped under 5MB RAM.
- **L2 Persistent Storage with TTL**: Automatically prunes expired data after 24h/7d in `chrome.storage.local`.
- **Cache Dashboard**: Real-time statistics in the Settings tab with a 1-click "Clear Cache" button.

### 3️⃣ Smart Filters & Shield 🛡️
- **Master Shield Switch**: Instant one-click toggle to pause/resume all protections.
- **3 Action Modes**:
  - 🔵 **Hide (Default)**: Collapses matched tweets into a clean bar with a "Show" button.
  - 🔴 **Auto-Block**: Automatically blocks matching accounts natively.
  - 🟠 **Auto-Mute**: Automatically mutes matching accounts natively.
- **Targeted Inspection Scopes**: Choose any combination of **Display Name**, **User Bio**, **Tweet Text**, and now **Followers & Following lists** — filters now work on user list pages too via direct API block/mute.
- **Unicode & Emoji Normalization**: NFKC normalization, Arabic/Persian canonicalization (`ي`→`ی`, `ك`→`ک`), variation selector stripping. Matches flags, skin tones, ZWJ sequences, and complex compound emojis.
- **Curated 1-Click Preset Packs**:
  - 🎒 **Cyber & State Trolls**: Flag/symbol spam and coordinated state troll keywords.
  - 🎣 **Engagement Bait**: "Follow + RT", "بک میدم", fake giveaway traps.
  - 🎰 **Betting & Gambling**: Casino bots, betting sites, and prediction spam.
  - 🪙 **Crypto Spam**: Token spam, airdrop phishing, presale minting.
- **Whitelist (Immunity)**: Exempt trusted friends from all filtering and block actions.

### 4️⃣ Timeline Cleaner & Zen Mode 🧹
- **CSS-First Instant Ad Blocker**: Eliminates Promoted and sponsored tweets with zero layout shift (CLS) and zero flash of unstyled content (FOUC).
- **Clutter Purge**: Hides "Who to follow", "Relevant people", "You might like", Grok AI sidebar/drawer, Premium upsell banners, and view counts.
- **Balanced Zen Mode**: Centers timeline and hides sidebars for distraction-free reading.

### 5️⃣ Pro Video Suite 🎬
- **Floating Volume Toolbar**: Elegant pill over timeline videos with persistent volume memory across browser sessions.
- **1-Click MP4 Downloader**: Directly save high-quality MP4 videos to disk.
- **Auto Loop**: Continuous seamless video replay.
- **Playback Rate Selector**: Control video playback speed from 0.5x to 2x.

### 6️⃣ 10/10 Modern Bilingual UI (FA/EN) 🎨
- Designed to match official Twitter/X design tokens in dark, dim, and light themes.
- Dual view: Works as standard browser toolbar popup AND as an integrated in-page drawer inside X.com.
- Full RTL (Persian) and LTR (English) localization with embedded Vazirmatn variable font.

### 7️⃣ Fun & Special: No-Boys Mode 🚹🚫 (New in v3.1.1)
- **Automatic Timeline Hide for Guys**: Intelligently identifies male accounts and hides their tweets strictly on the "For you" timeline tab (hide only — no blocking, no muting; does not affect Following tab or Profile pages).
- **Dedicated Friends Whitelist (استثناها)**: Exempt specific male friends or accounts by handle so their tweets always appear on your timeline.
- **Colossal 3,590+ Super-Dictionary & Concatenation Engine**:
  - Detects glued/concatenated names with family names or nicknames without spaces (e.g. `علیرضایی`, `محمدحسینی`, `بابکراد`, `حسینپور`, `@amirrezaei`, `@rezamoradi`, `@sinadev`, `@kavehdesigner`).
  - Automatically handles Persian diacritics (erab/tashkeel), stretched letters (tatweel/kashida: عـــلـــی -> علی), ZWNJ, and repeated typo characters (علییی -> علی, reeeza -> reza).
  - Handles leetspeak in usernames (`m0hammad`, `r3za`, `s1na`, `4mir`) and common prefixes/suffixes (`mr_`, `_boy`, `_pv`, `_dev`, `_official`).
  - Recognizes street slang, colloquial nicknames (`ممد`, `حسی`, `مجی`, `اصی`, `اکبی`, `mamad`, `hosi`), regional Kurdish/Azeri/Balochi/Lori names, and compound names.
- **Female Guard (Zero False Positives)**: Absolute immunity for women accounts based on female names, pronouns (`she/her`), keywords, and emojis.
- **Native Inline Re-hide Action Button**: Clicking "Show" reveals the tweet completely normally, placing a sleek native action button in the bottom action bar (`[role="group"]`) to instantly re-collapse it without breaking tweet balance.
- **Disabled by Default**: Safe, optional, and easily toggled in the "Media & Zen" tab under "Fun & Special Filters".

### 8️⃣ RastNevis (راست‌نویس) — Smart Persian Editor & Proofreader ✍️ (Supercharged in v3.5.1)
- **Tweet Composer Check Button**: Injects a sleek RastNevis feather button right next to the Post/Reply button in Twitter/X composer. Check text in real-time, inspect errors, 1-click Auto-Fix directly into the editor with full Undo support, or copy corrected text.
- **Punctuation & Spacing Correction Pipeline**: Automatically standardizes spaces before and after commas, periods, colons, and question marks; converts English punctuation (?, ;) to standard Persian (؟ ، ؛).
- **Smart Persian Digits Normalization**: Converts numbers to Persian digits while strictly preserving hardware models (e.g. iPhone 16, RTX 4090, s500), English codes, hashtags, mentions (@user123), URLs, and emails.
- **Personal Dictionary (واژه‌نامه شخصی)**: Add custom words to ignore directly from the composer popover or manage and delete them from the popup dictionary panel.
- **Intelligent Syntactic Heksare Pipeline**: Precision multi-tier distinction between inherent «ه» (خانه، پروژه، توسعه), verbal copulas (هوا سرده = سرد است), colloquial definite markers (این پسره), and true heksare errors (کتابه من ➔ کتاب من) with zero false positives.
- **Reverse Heksare Detection**: Fixes trailing kasrah used erroneously in place of copula (آرادِ ➔ آراده).
- **Arabic to Persian Character Normalization**: Auto-replaces Arabic «ي» and «ك» with Persian «ی» and «ک» and standardizes «ة/ۀ».
- **Structural Half-Space (ZWNJ) Engine**: Distinguishes «می/نمی» prefixes and «ها/تر/ترین» suffixes while strictly honoring Persian non-joining letters (ر، ز، د، و، ا...).
- **Native Misspelling Dictionary**: Fixes high-frequency everyday typos (اسفاده ➔ استفاده، مشگل ➔ مشکل).
- **Subtle Stylistic Hints**: Optional suggestions for tanwin (واقعا ➔ واقعاً) and repeated character reduction (عالییی ➔ عالی).
- **Interactive Live Test Bench**: A built-in scratchpad inside the extension popup to paste or type any Persian text and receive instantaneous corrections with 1-click Auto-Fix and copy.
- **Timeline Underline, Tooltips & Revision Panel**: Wavy underlines on problematic words, hover/click tooltips with explanations, summary tweet badges, and interactive revision panels with 1-click full-text copy.
- **100% Offline & Private (Zero Data Collection)**: All natural language processing happens locally in the browser. Zero network requests, zero telemetry.

## 🆕 What's new in 3.5.6

### 🛡️ Bulletproof Sensitive Media Unblur Engine (رفع تاری محتوای حساس)
- **Native MAIN-World API Scrubber (`modules/sensitiveScrubber.js`)**:
  - Automatically intercepts Twitter GraphQL and timeline API responses at `document_start` before React parses them.
  - Recursively scrubs `possibly_sensitive`, `sensitive_media_warning`, `ext_sensitive_media_warning`, and `mediaVisibilityResults`, forcing `display_sensitive_media: true`.
  - Photos, videos, and autoplay render completely naturally and instantly across timelines, profile media, search media tabs, and grid cards.
- **Deep Grid & Media Tab Unblur (رفع تاری در تب رسانه‌ها)**:
  - Eliminates "Warning: Nudity", "Content warning: Adult Content", "Warning: Violence", and Persian warning banners («هشدار: برهنگی»، «محتوای حساس») in grid media tiles.
  - Automatically clears CSS `filter: blur(...)` and `-webkit-backdrop-filter` in real-time.
  - Unblur and overlay-removal CSS rules applied at root level with zero flicker.

### ⚡ 1-Click Quick Block Button in User Lists (دکمه بلاک سریع در لیست ریتوییت‌ها، فالوورها و فالووینگ)
- **Direct Action Button Next to Follow**:
  - Injects a native-matching Quick Block pill button (`.xe-quick-block-btn`) directly next to the Follow button on every `UserCell`.
  - Seamlessly available in **Retweets (Reposts)** of tweets, **Followers**, **Following**, Verified Followers, and Likes lists.
  - 1-click native API block with loading state, instant toast notification, red "Blocked" («مسدود شد») visual feedback, and zero page navigation or modal popups.
  - Configurable toggle in Popup Settings ("دکمه بلاک سریع در لیست کاربران").

## 🆕 What's new in 3.5.5

### ⚡ Trio of Power Features: Auto-Expand, Quote Finder & Sensitive Unblur
- **Auto-Expand Long Tweets (Show More)**:
  - Smart observer detects truncated long-form tweets and auto-expands full text without requiring constant manual clicks on "Show more" / «نمایش بیشتر».
  - Multi-lingual support (English, Persian, Arabic, Spanish, French, German, Turkish, etc.) with WeakSet memoization to prevent redundant clicks.
- **1-Click Quote Tweets Finder (دکمه مشاهده کوت‌ها)**:
  - Direct native-styled double-quotes button injected right into the tweet action bar (`[role="group"]`).
  - Seamlessly navigates to the official quote tweets timeline (`/status/{id}/quotes`) in 1 click (supports Ctrl/Cmd/middle click to open in new tab).
- **Auto-Reveal Sensitive Media (رفع خودکار تاری محتوای حساس)**:
  - Automatically dismisses sensitivity warning overlays on photos and videos, displaying media instantly without clicking "View" / «نمایش».
  - Precision scoping excludes the tweet author's text body to eliminate false triggers.

### 🚀 Follower & Following List Auto-Blocker & Filter (Core Feature)
- **`processUserCell()` Engine**: When viewing any profile's Followers or Following lists, your defined filters execute directly on each `UserCell`:
  - **Hide**: Hides the user cell cleanly from the list.
  - **Auto-Block**: Directly blocks the user via native Twitter API (no UI menu clicking required).
  - **Auto-Mute**: Directly mutes the user via native Twitter API.
  - **Blue Check Filter**: Full blue checkmark filtering support on followers and following lists.
  - **Bio Caching**: Pre-caches user bios from list views to accelerate subsequent timeline tweet filtering.
- **Bug Fixes & Hardening**:
  - `scannedUserCells` WeakSet added — page navigation correctly resets cache state.
  - `blockUser` / `unblockUser` handle sanitization — strips erroneous `@` prefixes in API payloads.
  - Added missing `muteUser` / `unmuteUser` endpoints to `twitterApi.js`.
  - Added new `userLists` filter scope across settings, `popup.js`, and `background.js`.
  - Storage migrator bumped to v10, all extension files synchronized to `v3.5.5`.
  - Added "Followers & Following" checkbox toggle to filter scopes in Popup UI (enabled by default).

### 🛡️ Enhanced Clean Share Links & Security Suite
- **Modern Linear Link Icon**: Replaced legacy icon with a razor-sharp, outline-styled chain link matching Twitter design, featuring green hover and animated success checkmark feedback.
- **Full Tracking Stripping**: Automatically strips `?s=...&t=...`, `ref_src`, `ref_url`, `twclid`, marketing UTM tags, and converts `twitter.com` to `x.com`.
- **Native Menu Sanitization**: Hooked into native X "Copy link to post" action to guarantee clean URLs even when copying from default dropdown menus.
- **Bulletproof Tweet ID Discovery**: Multi-tier fallback resolves tweet IDs even in notification/detail views without `<time>` tags.

### 📊 Total Account Block Statistics
- **Total X Block Counter**: Added `fetchTotalBlockedCount` on native `blocks/ids.json` endpoint to retrieve exact total accounts blocked across your entire X account history.
- **Dual Display & Manual Query**: Real-time counter on the Dashboard grid and dedicated query/refresh button in the Settings tab.

### 🚫 Precision Ad Blocker Upgrades
- **Persian & International Ad Indicators**: Added Persian «آگهی» and «تبلیغ» along with modern header badge detection.
- **Timeline Video Ad Purging**: Fixed video ad exclusion bug so promoted video tweets are blocked while non-promoted timeline videos play flawlessly.
- **CSS-First Zero-CLS Rules**: Enhanced zero-flicker CSS rules to collapse ads before layout rendering.

### 🎨 Native-Matching Floating Launcher & Animated Drawer
- **Twitter Message Dock Styling**: Redesigned floating launcher with dark glassmorphism (`rgba(0,0,0,0.82)` with 16px blur), soft borders, and Twitter cyan glow.
- **Spring Anchor Animation**: Drawer now smoothly scales and slides from the corner anchor point (`transform: scale + translateY` with cubic-bezier spring).
- **Morphing Shield Icon**: Launcher shield icon smoothly rotates and morphs into a close (✕) icon when active.

### 💎 High-Contrast Modern Logo & Vector Icons
- **Vector Identity**: New `icon.svg` featuring an aerodynamic cyber-shield with electric cyan and royal violet crossing X blades and a crisp white crest.
- **Multi-Resolution Generation**: Updated `build_icons.py` exporting optimized 16x16, 48x48, and 128x128 PNGs with high-contrast silhouette visibility at small sizes.

## 🆕 What's new in 3.5.2

- **Clean Share Links (کپی لینک تمیز)**: Auto-strips tracking parameters (`?s=...&t=...`) from copied X URLs with an instant action bar clean copy button.
- **Original Quality Image Downloader (دانلود تصویر با کیفیت اصلی)**: 1-click hover download on tweet images resolving directly to the uncompressed `name=orig` variant.
- **Pro Thread Reader Suite (سوئیت حرفه‌ای مطالعه رشته‌توییت)**:
  - **تشخیص دقیق رشته‌توییت واقعی**: تفکیک هوشمند ثردهای واقعی از توییت‌های تکی، و حذف کامل پاسخ‌های متفرقه نویسنده به کامنت‌ها و منشن‌های دیگران از داخل ثرد.
  - **دو حالت نمایش**: حالت کارت‌های مجزا یا حالت مقاله منسجم (Article/Blog View) بدون شماره‌های توییت برای مطالعه یکدست.
  - **پشتیبانی از تصاویر**: نمایش تصاویر پیوست‌شده به توییت‌ها درون پنجره ثرد با رزولوشن بالا.
  - **پویش خودکار (Deep Fetch)**: دکمه «بارگذاری ادامه‌ی ثرد» با اسکرول خودکار هوشمند جهت جمع‌آوری تمام بخش‌های ثرد از دامنه توییتر.
  - **آمار مطالعه زنده**: نمایش زمان تخمینی مطالعه، تعداد کل کلمات و تعداد توییت‌ها.
  - **کنترل فونت و حالت تمام‌صفحه**: دکمه‌های تغییر اندازه قلم (`A-` / `A+`) و دکمه فول‌اسکرین.
  - **سه روش خروجی**: کپی متن منسجم (برای وبلاگ/تلگرام)، کپی شماره‌دار (`1/..`) و دانلود به عنوان فایل Markdown (`.md`).
- **New Account Age Warning Badge (نشانگر اکانت‌های تازه‌تاسیس)**: Highlights accounts under 3 months old in timeline headers to identify bot/troll waves early.
- **RastNevis Precision Fixes**: Fixed ZWNJ conversion before «ها» for non-joining letters («کار ها» ➔ «کار‌ها»), expanded high-frequency typo dictionary (راجعبه, طپش, باطری, اطو, حتا, گاهاً, ناچاراً, دوماً, سوماً, پیشنهادات, گزارشات).
- **Blue Check Replies-Only Fix**: Fixed main focal tweet falsely collapsing on `/status/` URLs when blue check filter is set to replies-only.
- **Settings & Dictionary Preservation**: Fixed `sanitizeImportedSettings` and `background.js` default migrations preserving personal dictionaries and new toggles.
- **Composer Layout Optimization**: Removed aggressive container styling overrides on Twitter's native post toolbar.

## 🆕 What's new in 3.5.1

- **Tweet Composer Check Button**: Added instant RastNevis check button beside Twitter's Post/Reply button with auto-fix, undo, single-word copy, and ignore.
- **Punctuation Standardizer**: Intelligent spacing and conversion of punctuation marks (، ؛ ؟).
- **Smart Persian Digits**: Automated conversion of numbers to Persian with immunity for English models, code identifiers, hashtags, and links.
- **Personal Dictionary**: Save ignored words across sessions with a management chip list in the popup.
- **Live Test Bench Auto-Fix**: Added 1-click "Apply in Box" (اصلاح در کادر) button to the interactive test bench.

## 🆕 What's new in 3.5.0 (The Mega Update)

- **RastNevis Deep Integration**: Project RastNevis has been seamlessly integrated as a master 6th tab and a core in-page capability of XWise Blocker. Zero interference with existing filters, ad block, video suite, or relationship tracker.
- **Live Interactive Editor Test-Bench**: Added in the RastNevis tab for real-time Persian proofreading and 1-click copy.
- **New Mature Brand Identity & Cyber-Shield Logo**: Replaced the legacy pixelated forbidden icon with an ultra-sleek, modern, high-res cyber-shield emblem fused with a stylized "X" and wisdom checkmark crest in vibrant neon cyan and royal violet.
- **Comprehensive Rule Toggles**: Granular controls for heksare, Arabic letters, spelling, ZWNJ, stylistic hints, underlines, and inline badges.
- **Live Statistics & Privacy**: Tracks total proofread tweets with on-device storage and 1-click reset.

## 🆕 What's new in 3.2.1

- **Auto-block / auto-mute fixed**: menu items are now matched by their stable `data-testid` (`block`, `mute`) instead of localized text only, filters saved by older versions without an `enabled` flag are honored, legacy `block`/`mute` filter actions map correctly, and a warning toast appears if an automatic action cannot complete.

## 🆕 What's new in 3.2.0

- **Reliability**: batch unfollow / remove-follower now runs inside the X tab, so closing the popup no longer aborts it; progress is restored when the popup is reopened. A single action can no longer wipe the saved follower snapshot.
- **Accurate unfollower tracking**: stable timestamps, a persistent unfollower list, no false "unfollowers" after removing a follower, no false results from partially fetched lists, and a guard against account switches.
- **Ad blocker**: no longer flags reposts by users whose names contain "ad" (Hadi, Nadia...), and the CSS-first rules respect the toggle.
- **Filters apply live**: adding, editing or disabling a filter, the whitelist, or the master shield takes effect immediately, and hidden tweets are restored correctly.
- **Video download**: resolves real MP4 variants for the tweet (blob-only players previously failed).
- **Shortcut** works on non-Latin keyboard layouts (physical key fallback).
- **Master shield** is now a dedicated switch and no longer overwrites individual toggles.
- **Storage**: counters and the activity log are batched in local storage (no sync quota errors); the cache is stored per namespace and no longer loads all extension data on every page.
- **Popup UX**: paginated user lists, per-filter enable toggle, regex validation, import validation, readable error messages, live last-scan time.
- **Security**: in-page drawer messages are accepted only from the extension's own frame; web-accessible resources reduced to the minimum.

---

## 🚀 Installation (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/AmirWise/XWise-Blocker.git
   ```
2. Open your browser and navigate to `chrome://extensions` (compatible with Chrome, Brave, Edge, Arc, Opera).
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** (بارگذاری اکستنشن باز شده).
5. Select this project folder (`XWise-Blocker`).
6. Pin **XWise Blocker** to your browser toolbar and enjoy a cleaner, safer X!

---

## 🔒 Privacy & Security

- **100% Client-Side**: All filtering, relationship tracking, and calculations occur entirely within your browser.
- **Zero Remote Telemetry**: No external servers, no tracking scripts, no third-party analytics.
- **Secure Authentication**: Uses the browser's existing authenticated X.com session cookies (`ct0` CSRF token) without collecting or storing credentials.
- **Local Storage Only**: Your settings, filters, and cache remain stored exclusively in your browser's `chrome.storage`.

---

<div dir="rtl">

# راهنمای فارسی افزونه XWise Blocker نسخه 3.5.5 🛡️✍️⚡

افزونه اختصاصی و فوق‌العاده سریع برای مرورگرهای کرومیوم (Chrome, Brave, Edge, Arc, Opera) جهت پاک‌سازی تایم‌لاین، مدیریت شبکه ارتباطات، ویراستاری هوشمند خط و زبان فارسی با راست‌نویس و ارتقای امنیت در شبکه اجتماعی X (توییتر).

---

## 🌟 قابلیت‌های کلیدی

### ۱️⃣ آنفالویاب هوشمند و مدیریت ارتباطات 👥
- **شناسایی خودکار اکانت لاگین‌شده**: بدون نیاز به وارد کردن نام کاربری یا پسورد.
- **۵ دسته‌بندی هوشمند ارتباطی**:
  - 💔 **آنفالو کردند (Unfollowers)**: ردیابی اکانت‌هایی که شما را آنفالو کرده‌اند به همراه تاریخچه دقیق زمانی.
  - 🚫 **بک نداده‌ها (Non-Followers)**: افرادی که شما فالو کرده‌اید ولی آن‌ها به شما بک نداده‌اند.
  - 🌟 **طرفداران (Fans)**: کسانی که شما را دنبال کرده‌اند اما شما آن‌ها را فالو نکرده‌اید.
  - 🤝 **متقابل (Mutuals)**: ارتباطات دوطرفه که هر دو طرف یکدیگر را دنبال می‌کنند.
  - 🎉 **فالوورهای جدید (New Followers)**: فالوورهایی که اخیراً اضافه شده‌اند.
- **اقدام سریع با ۱ کلیک**: آنفالو کردن یا حذف فالوور مستقیماً از روی کارت‌های کاربری به صورت تکی یا دسته‌جمعی.
- **🛡️ صف ایمن ضد لیمیت (Anti-Limit Safety Queue)**: اعمال وقفه تصادفی ۳.۵ تا ۵.۵ ثانیه‌ای بین هر اقدام همراه با نوار پیشرفت زنده، تایمر معکوس، و کلیدهای مکث/ادامه/توقف جهت جلوگیری قطعی از لیمیت یا شادوبن شدن اکانت توییتر.
- **ردیابی دوره‌ای در پس‌زمینه**: هشدار تغییرات و نمایش تعداد آنفالوورها روی بج آیکون اکستنشن.

### ۲️⃣ سیستم کش دو لایه با سرعت نور (Two-Tier Caching) ⚡
- **لایه اول (L1) حافظه رم**: جستجوی آنی با پیچیدگی زمانی $O(1)$ و مصرف رم کمتر از ۵ مگابایت.
- **لایه دوم (L2) ذخیره‌سازی محلی با TTL**: ذخیره امن بایوها و اطلاعات در `chrome.storage.local` با منقضی شدن خودکار داده‌های قدیمی.
- **داشبورد وضعیت کش**: نمایش آنلاین تعداد آیتم‌ها و حجم کش در تنظیمات به همراه کلید پاک‌سازی آنی.

### ۳️⃣ موتور فیلتر هوشمند و شیلد امنیتی 🛡️
- **کلید شیلد مستر**: روشن/خاموش کردن کل فیلترها و بلاکرها با یک کلیک.
- **۳ حالت عملکرد**:
  - 🔵 **پنهان‌سازی (Hide)**: توییت به صورت یک کادر ظریف جمع می‌شود و با کلیک روی «نمایش» باز می‌شود.
  - 🔴 **بلاک خودکار (Auto-Block)**: مسدودسازی خودکار اکانت طبق قوانین از طریق منوی رسمی توییتر.
  - 🟠 **بی‌صدا کردن خودکار (Auto-Mute)**: میوت کردن اکانت‌ها بدون بلاک.
- **محدوده‌های هدفمند**: امکان اسکن دلخواه روی نام نمایشی، بایو و متن توییت.
- **پشتیبانی کامل از یونیکد و ایموجی‌ها**: نرمال‌سازی حروف عربی/فارسی (`ي` به `ی` و `ك` به `ک`)، حذف فواصل مجازی، و تطبیق دقیق پرچم‌ها، تن‌های رنگ پوست و ایموجی‌های چندبخشی (ZWJ).
- **پک‌های فیلتر آماده با یک کلیک**:
  - 🎒 اکانت‌های سایبری و ترول‌های حکومتی
  - 🎣 تله‌های تعامل و توییت‌های طعمه («فالو + ریتوییت»، «بک میدم»)
  - 🎰 بات‌های شرط‌بندی و پیش‌بینی فوتبال
  - 🪙 اسپم‌های رمزارز، ایردراپ و شت‌کوین‌ها
- **لیست سفید (Whitelist)**: مصونیت کامل دوستان و حساب‌های مورد اعتماد از فیلتر و بلاک.

### ۴️⃣ تمیزکننده تایم‌لاین و حالت تمرکز (Zen Mode) 🧹
- **حذف قطعی تبلیغات (CSS-First)**: مسدودسازی کامل توییت‌های پروموت‌شده و اسپانسری بدون پرش صفحه (Zero Shift).
- **پاک‌سازی محتوای اضافه**: حذف کامل کادرهای «چه کسانی را دنبال کنید»، افراد مرتبط، کشوی هوش مصنوعی Grok، تبلیغات اشتراک Premium و آمار بازدید (View Count).
- **حالت تمرکز (Zen Mode)**: مخفی‌سازی سایدبارها و متمرکز کردن فید برای مطالعه آرام.

### ۵️⃣ سوئیت چندرسانه‌ای و ویدیوی پرو 🎬
- **اسلایدر شناور صدا**: تنظیم ولوم روی هر ویدیو با ذخیره‌سازی پایدار میزان صدا برای دفعات بعدی.
- **دانلودر مستقیم MP4**: ذخیره ویدیوها با بالاترین کیفیت موجود روی سیستم با ۱ کلیک.
- **تکرار خودکار (Loop)**: پخش پیوسته و بدون وقفه ویدیوها.
- **تنظیم سرعت پخش**: تغییر سرعت ویدیو از ۰.۵x تا ۲x.

### ۶️⃣ رابط کاربری حرفه‌ای دو زبانه (FA/EN) 🎨
- کامپوننت‌های مدرن و هماهنگ با دیزاین سیستم اصلی X در تم‌های دارک، لایت و Dim.
- امکان باز شدن به صورت پاپ‌آپ نوار ابزار و همچنین دراور شناور اختصاصی درون خود صفحه X.com.
- مجهز به فونت متغیر وزیرمتن (Vazirmatn) بدون نیاز به اینترنت و بدون افت سرعت.

### ۷️⃣ فیلتر اختصاصی و سرگرمی: حالت بدون پسر (No-Boys Mode) 🚹🚫 (جدید در نسخه 3.1.1)
- **مخفی‌سازی خودکار اکانت‌های پسران صرفاً در تب For you**: شناسایی دقیق توییت‌های آقایان و جمع کردن آن‌ها از دید کاربر (فقط هاید — بدون هرگونه بلاک یا میوت؛ در تب Following یا صفحات پروفایل هیچ اثری ندارد).
- **وایت‌لیست اختصاصی دوستان (استثناها)**: امکان افزودن آیدی دوستان برای مصون ماندن از فیلتر و باقی ماندن در تایم‌لاین.
- **ابر دیکشنری عظیم با بیش از ۳,۵۹۰ نام و موتور شناسایی اسامی چسبیده**:
  - شناسایی نام‌های چسبیده به فامیلی یا لقب بدون فاصله (مانند `علیرضایی`, `محمدحسینی`, `بابکراد`, `حسینپور`, `@amirrezaei`, `@rezamoradi`, `@sinadev`, `@kavehdesigner`).
  - پشتیبانی کامل از انواع رسم‌الخط، حروف کشیده (تطویل: عـــلـــی -> علی)، اعراب و تنوین، نیم‌فاصله و تکرار کاراکترها (علییی -> علی، reeeza -> reza).
  - رمزگشایی هوشمند لیت‌اسپیک در آیدی‌ها (`m0hammad`, `r3za`, `s1na`, `4mir`) و حذف پیشوند/پسوندهای رایج (`mr_`, `_boy`, `_pv`, `_dev`, `_official`).
  - پشتیبانی از القاب، مخفف‌های عامیانه و کوچه بازاری توییتر فارسی (`ممد`, `ممدی`, `حسی`, `مجی`, `اصی`, `اکبی`, `mamad`, `hosi`)، اسامی قومیتی (کردی، ترکی/آذری، لری، بلوچی، گیلکی) و ترکیبات مختلف.
- **شیلد ایمنی بانوان (Female Guard)**: مصونیت ۱۰۰٪ برای خانم‌ها بر اساس نام‌ها، ضمایر (`she/her`)، کلمات کلیدی و ایموجی‌ها جهت جلوگیری قطعی از خطای مثبت.
- **دکمه بومی هاید مجدد زیر توییت**: با زدن «نمایش»، توییت کاملاً طبیعی لود می‌شود و دکمه بومی هاید مجدد در نوار ابزار پایین توییت قرار می‌گیرد تا توازن صفحه حفظ شود.
- **غیرفعال به صورت پیش‌فرض**: کاملاً اختیاری و قابل فعال‌سازی در تب «رسانه و تمیز» بخش فیلترهای اختصاصی.

### ۸️⃣ راست‌نویس (RastNevis) — ویراستار هوشمند و بومی خط فارسی ✍️ (ابر ویژگی نسخه 3.5.0)
- **موتور چندلایه‌ی هوشمند هکسره**: تفکیک قطعی «ه» ذاتی واژگان (خانه، پروژه، توسعه، خاطره)، افعال اسنادی و ربطی محاوره‌ای («است»: هوا سرده = سرد است)، معرفه‌سازهای عامیانه (این پسره) از خطاهای قطعی هکسره (کتابه من ➔ کتاب من) بدون هرگونه مثبت کاذب (Zero False Positives).
- **شکار هکسره معکوس**: اصلاح کسره‌های پایانی نامناسب بدون مضاف‌الیه (آرادِ ➔ آراده).
- **اصلاح خودکار نویسه‌های عربی به فارسی**: جایگزینی خودکار «ي» و «ك» به «ی» و «ک» و استانداردسازی «ة/ۀ».
- **مدیریت ساختاری نیم‌فاصله‌ها**: سامان‌دهی پیشوندهای «می/نمی» و پسوندهای «ها/تر/ترین» با رعایت دقیق حروف جدانویس فارسی (مانند ر، ز، د، و، ا...).
- **غلط‌یاب املایی بومی و پربسامد**: شناسایی لغات پرغلط روزمره در زبان فارسی و فضای مجازی (اسفاده ➔ استفاده، مشگل ➔ مشکل).
- **پیشنهادهای سبک نگارشی**: پیشنهاد تنوین نصب (واقعا ➔ واقعاً) و جلوگیری از کشیدگی مفرط حروف (عالییی ➔ عالی).
- **جعبه تست زنده ویراستار**: امکان تایپ یا پیست متن فارسی در تب راست‌نویس پاپ‌آپ و مشاهده آنی اشکالات به همراه کپی نسخه ویرایش‌شده با ۱ کلیک.
- **نشانه‌گذاری تعاملی در تایم‌لاین توییتر**: زیرخط مواج رنگی روی واژه‌های نادرست، تول‌تیپ تعاملی علت خطا، نشان روی توییت و پنل ویرایش با امکان کپی ۱ کلیکی کل متن اصلاح‌شده توییت.
- **۱۰۰٪ محلی و امن (Zero Data Collection)**: پردازش مستقیم در مرورگر کاربر بدون ارسال داده یا درخواست به هیچ سرور خارجی.

## 🆕 تغییرات نسخه 3.5.5 (به‌روزرسانی جامع)

### ⚡ سه‌گانه امکانات کاربردی جدید (توییت‌های بلند، کوت‌ها و رفع تاری)
- **باز کردن خودکار توییت‌های بلند (Auto-Expand Show More)**:
  - باز شدن خودکار و بی‌وقفه متن کامل توییت‌های طولانی پرمیوم در حین اسکرول بدون نیاز به کلیک مداوم روی «نمایش بیشتر / Show more».
  - پشتیبانی از زبان‌های فارسی، انگلیسی، عربی و زبان‌های بین‌المللی با حافظه WeakSet بدون افت فریم و بدون رندر مجدد زائد.
- **دکمه ۱ کلیکی مشاهده کوت‌ها (1-Click Quote Tweets Finder)**:
  - اضافه شدن دکمه زیبا و وکتور نقل‌قول به نوار اکشن بومی توییتر (`[role="group"]`) کنار دکمه لینک تمیز.
  - هدایت مستقیم و فوری به صفحه رسمی کوت‌های همان توییت (`/status/{id}/quotes`) با ۱ کلیک (پشتیبانی از Ctrl/Cmd/وسط‌کلیک جهت باز شدن در تب جدید).
- **رفع خودکار تاری محتوای حساس (Auto-Reveal Sensitive Media)**:
  - کلیک خودکار روی لایه‌های پوششی هشدار حساسیت و نمایش مستقیم تصاویر و ویدیوها بدون نیاز به زدن مکرر دکمه «نمایش / View».
  - فیلتر هوشمند محدوده جهت تفکیک کامل متن توییت نویسنده و جلوگیری از هرگونه خطای فعال‌سازی ناخواسته.

### 🆕 اتوبلاکر در فالوور و فالووینگ (ویژگی اصلی)
- **موتور `processUserCell()`**: هنگام ورود به لیست فالوورها یا فالووینگ‌های هر کاربر، فیلترهای تعریف‌شده مستقیماً روی هر ردیف (`UserCell`) اعمال می‌شوند:
  - **پنهان‌سازی (Hide)**: مخفی‌سازی نامحسوس اکانت از لیست.
  - **بلاک خودکار (Auto-Block)**: مسدودسازی مستقیم و سریع از طریق API توییتر بدون نیاز به باز کردن منو.
  - **بی‌صدا کردن خودکار (Auto-Mute)**: میوت کردن مستقیم کاربر از طریق API.
  - **فیلتر تیک آبی**: اعمال فیلتر دارندگان تیک آبی روی لیست‌های فالوور و فالووینگ.
  - **کش هوشمند بایو**: ذخیره خودکار متن بایوها در حافظه موقت جهت سرعت‌بخشی به فیلتر توییت‌ها در تایم‌لاین.
- **🐛 باگ‌های فیکس شده و بهینه‌سازی‌ها**:
  - اضافه شدن `scannedUserCells` به صورت WeakSet — جابه‌جایی بین صفحات کش را ریست می‌کند.
  - رفع مشکل `blockUser` و `unblockUser` — حذف کاراکتر `@` اضافی از نام کاربری قبل از ارسال به API.
  - پیاده‌سازی متدهای `muteUser` و `unmuteUser` در `twitterApi.js` (قبلاً موجود نبود).
  - اضافه شدن محدوده جدید `userLists` در تنظیمات، `popup.js` و `background.js`.
  - ارتقای نسخه کل فایل‌ها به `v3.5.5` و ارتقای Storage migrator به v10.
  - اضافه شدن گزینه «فالوور و فالووینگ» به گزینه‌های محدوده فیلترها در پاپ‌آپ (پیش‌فرض: فعال).

### 🛡️ تقویت و ارتقای کپی لینک تمیز (Clean Share Links)
- **آیکون خطی مدرن و هماهنگ**: جایگزینی آیکون قبلی با نماد وکتور خطی مدرن زنجیر هماهنگ با طراحی توییتر، تغییر رنگ هاور به سبز امنیتی و نمایش انیمیشن تیک سبز پس از کپی موفق.
- **پاک‌سازی همه‌جانبه پارامترهای رهگیری**: حذف کامل کدهای ردگیری توییتر (`?s=...&t=...`، `ref_src`، `ref_url`، `twclid`، تگ‌های بازاریابی UTM) و تبدیل خودکار لینک‌های `twitter.com` به `x.com`.
- **پاک‌سازی منوی بومی X**: اتصال به رویداد کلیک دکمه اشتراک‌گذاری و گزینه Copy Link منوی اصلی توییتر برای پاک‌سازی خودکار کلیپ‌بورد.
- **شناسایی بدون خطا در تمام صفحات**: الگوریتم چندمرحله‌ای برای استخراج ID توییت در صفحات اعلان و توییت‌های بدون تگ زمان.

### 📊 استعلام آمار کل کاربران بلاک‌شده اکانت (Total X Blocked)
- **شمارشگر کل بلاک‌های حساب**: اتصال به اندپوینت رسمی `blocks/ids.json` بدون خطر لیمیت جهت شمارش مجموع کل افرادی که در تاریخچه حسابتان بلاک کرده‌اید.
- **نمایش دوگانه و دکمه استعلام**: نمایش آمار در گرید پیشخوان پاپ‌آپ و ایجاد کارت و دکمه مجزای «استعلام و به‌روزرسانی» در تب تنظیمات.

### 🚫 ارتقا و رفع باگ مسدودساز تبلیغات (Ad Blocker)
- **پشتیبانی از واژگان رسمی فارسی**: اضافه شدن کلمات رسمی «آگهی» و «تبلیغ» به نشانگرهای مسدودسازی.
- **رفع مشکل تبلیغات ویدیویی**: رفع باگی که مانع حذف تبلیغات ویدیویی تایم‌لاین می‌شد، با حفظ عملکرد ویدیوهای معمولی.
- **قوانین CSS بدون پرش (Zero CLS)**: تقویت قوانین حذف استاتیک قبل از رندر ری‌اکت.

### 🎨 دکمه شناور گلس‌مورفیک و دراور انیمیشنی
- **طراحی مطابق داک پیام‌های توییتر**: بازطراحی دکمه شناور با شیشه تیره مات (`rgba(0,0,0,0.82)` با بلور ۱۶px و بوردر ظریف).
- **انیمیشن فنری باز و بسته شدن**: باز شدن دراور با ترنزیشن نرم کشسانی (`transform: scale + translateY` با منشأ لنگر گوشه).
- **مورف آیکون**: چرخش و تبدیل روان آیکون سپر به ضربدر (✕) هنگام باز بودن دراور.

### 💎 طراحی لوگوی مدرن و وکتور و تولید آیکون‌ها
- **هویت بصری وکتور**: طراحی فایل `icon.svg` با شیلد آیرودینامیک و پره‌های متقاطع X دو رنگ (الکتریک سایان و بنفش سلطنتی) و نشان تیک سفید.
- **تولید آیکون‌های ۱۶، ۴۸ و ۱۲۸**: اسکریپت `build_icons.py` بازنویسی و خروجی‌های PNG با فیلتر دقیق Lanczos جهت وضوح فوق‌العاده در ابعاد کوچک بازتولید شدند.

## 🆕 تغییرات نسخه 3.5.0 (ابر آپدیت بزرگ)

- **ادغام کامل پروژه راست‌نویس (RastNevis)**: اضافه شدن راست‌نویس به عنوان تب ششم مستقل در پاپ‌آپ و ماژول بومی پردازش زبان فارسی روی تایم‌لاین بدون کمترین تداخل با فیلترها و بلاکرها.
- **جعبه تست زنده ویراستار (Live Test Bench)**: امکان نوشتن متن و ویرایش در لحظه داخل پاپ‌آپ افزونه.
- **طراحی لوگوی فوق‌العاده مدرن، حرفه‌ای و بالغ**: جایگزینی لوگوی پیکسلی قدیمی با آیکون سایبر-شیلد باکیفیت و گرادیان نئونی توییتر-بنفش همراه با نشان تیک هوشمند.
- **کنترل‌های تفکیک‌شده قواعد نگارش**: قابلیت فعال/غیرفعال‌سازی تک‌تک بخش‌های هکسره، حروف عربی، نیم‌فاصله و غلط املایی.
- **آمار اختصاصی و صفر کردن شمارنده**: شمارش تعداد توییت‌های ویرایش‌شده و امکان ریست آمار.

## 🆕 تغییرات نسخه 3.2.1

- **رفع مشکل بلاک/میوت خودکار**: آیتم‌های منو حالا با `data-testid` ثابت (`block` و `mute`) شناسایی می‌شوند نه فقط متن ترجمه‌شده؛ فیلترهای نسخه‌های قدیمی بدون فیلد `enabled` هم اعمال می‌شوند؛ اکشن‌های قدیمی `block`/`mute` درست تبدیل می‌شوند؛ و اگر اجرای خودکار ناموفق باشد هشدار نمایش داده می‌شود.

## 🆕 تغییرات نسخه 3.2.0

- **پایداری**: صف آنفالو/حذف فالوور حالا داخل تب X اجرا می‌شود و با بستن پاپ‌آپ متوقف نمی‌شود؛ با بازکردن دوباره پاپ‌آپ پیشرفت نمایش داده می‌شود. اقدام تکی دیگر اسنپ‌شات ذخیره‌شده را پاک نمی‌کند.
- **ردیابی دقیق‌تر آنفالوها**: زمان ثابت، لیست ماندگار، بدون آنفالوی کاذب پس از حذف فالوور یا دریافت ناقص لیست، و محافظت در برابر تغییر اکانت.
- **مسدودساز تبلیغات**: ریپست کاربرانی مثل Hadi و Nadia دیگر به‌اشتباه تبلیغ حساب نمی‌شود و قوانین CSS از کلید خاموش/روشن پیروی می‌کنند.
- **اعمال آنی فیلترها**: افزودن، حذف یا غیرفعال‌کردن فیلتر، لیست سفید و سپر اصلی بلافاصله اعمال می‌شود و توییت‌های پنهان درست بازیابی می‌شوند.
- **دانلود ویدیو**: لینک واقعی MP4 از روی توییت پیدا می‌شود.
- **میانبر** روی کیبورد فارسی هم کار می‌کند.
- **سپر اصلی** کلید مستقل دارد و تنظیمات دیگر را بازنویسی نمی‌کند.
- **ذخیره‌سازی**: شمارنده‌ها و لاگ به‌صورت دسته‌ای در حافظه محلی ذخیره می‌شوند و کش دیگر کل داده‌های افزونه را در هر صفحه نمی‌خواند.
- **رابط**: صفحه‌بندی لیست‌ها، فعال/غیرفعال‌سازی هر فیلتر، اعتبارسنجی Regex و فایل ورودی، پیام‌های خطای خوانا و زمان آخرین اسکن.
- **امنیت**: پیام‌های دراور فقط از فریم خود افزونه پذیرفته می‌شوند.

---

## 🚀 راهنمای نصب

1. پروژه را دانلود یا کلون کنید:
   ```bash
   git clone https://github.com/AmirWise/XWise-Blocker.git
   ```
2. مرورگر کروم یا مرورگرهای مبتنی بر کرومیوم را باز کرده و به آدرس `chrome://extensions` بروید.
3. گزینه **Developer mode** را از گوشه بالا سمت راست فعال کنید.
4. روی دکمه **Load unpacked** کلیک کنید.
5. پوشه پروژه را انتخاب کنید.
6. آیکون **XWise Blocker** را به نوار ابزار پین کنید و از توییتر تمیز و سریع لذت ببرید!

---

## 🔒 حریم خصوصی و امنیت

- **کاملاً آفلاین و Client-Side**: هیچ داده‌ای به هیچ سرور خارجی ارسال نمی‌شود.
- **بدون ابزارهای ردیابی و آنالیتیکس**: هیچ تلمتری یا لاگی از رفتار شما برداشته نمی‌شود.
- **احراز هویت بومی**: استفاده مستقیم از سشن کوکی‌های خود مرورگر بدون دسترسی به رمز عبور شما.

---

## 📄 مجوز (License)

این پروژه تحت مجوز **MIT** منتشر شده است. استفاده، تغییر و بازتوزیع آن کاملاً آزاد و رایگان است.

</div>
