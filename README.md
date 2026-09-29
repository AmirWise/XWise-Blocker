# XWise Blocker v3.2.1 🛡️⚡

A powerful, ultra-fast, and native-feeling Chrome extension for X (Twitter). XWise Blocker purifies your timeline, protects your attention, and manages your social graph: **Follow/Unfollow Tracker**, **Relationship Manager (Non-followers, Fans, Mutuals, Lost followers)**, **Anti-Limit Safety Queue**, **Two-Tier LRU & TTL Caching**, **Instant CSS-First Ad Blocker**, **Pro Video Suite with MP4 Downloader & Loop**, **No-Boys Mode (Timeline Gender Filter)**, and **10/10 Modern Bilingual UI (FA/EN)** with embedded Vazirmatn font.

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
- **Targeted Inspection Scopes**: Choose any combination of **Display Name**, **User Bio**, and **Tweet Text**.
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

# راهنمای فارسی افزونه XWise Blocker نسخه 3.2.1 🛡️⚡

افزونه اختصاصی و فوق‌العاده سریع برای مرورگرهای کرومیوم (Chrome, Brave, Edge, Arc, Opera) جهت پاک‌سازی تایم‌لاین، مدیریت شبکه ارتباطات و ارتقای امنیت در شبکه اجتماعی X (توییتر).

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
