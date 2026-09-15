# XWise Blocker v2.0.0

A Chrome extension for X (Twitter) that adds **smart content filtering** (keywords, emojis, symbols), **per-video volume sliders**, **native inline Block buttons**, and a **customizable keyboard shortcut** — all from a clean, Persian/English bilingual settings panel with Vazirmatn font.

---

## ✨ What's New in v2.0.0

| Feature | Description |
|---------|-------------|
| **Smart Filter Engine** | Unicode-aware matching for keywords, *any emoji* (flags, skin tones, ZWJ sequences, compound emojis), and symbols |
| **Dry-Run Mode** | Preview matches with subtle inline badges — **zero accidental blocks** |
| **Auto-Block Mode** | Automatically blocks accounts matching your filters via X's native menu |
| **Targeted Scopes** | Scan **Display Name** and **Bio** by default (tweet text optional) |
| **Vazirmatn Font** | Built-in Persian/Arabic font — beautiful RTL & LTR support without external CDN |
| **Bilingual UI** | Full Persian/English interface with one-click language switch |
| **Preserved v1 Features** | Volume sliders, inline Block button, keyboard shortcut — all refined |

---

## 🧠 Filter Engine Details

The filter engine uses **NFKC Unicode normalization** with Arabic/Persian letter canonicalization (`ي`→`ی`, `ك`→`ک`) and variation-selector stripping. This ensures:

- ✅ **Emojis work perfectly**: `🇮🇷`, `👨‍👩‍👧‍👦`, `🏳️‍🌈`, `🤲🏽`, `😀`, `❤️`, `⚡`, all skin-tone & ZWJ sequences
- ✅ **Keywords match correctly**: case-insensitive, whole-word option, Arabic/Persian diacritic-insensitive
- ✅ **No false positives**: scope limited to display name + bio (tweet text opt-in)
- ✅ **Dry-Run first**: subtle badge shows *what* matched *where* before any action

---

## 🚀 Installation (Developer Mode)

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `XWise Blocker v1` folder
5. Click the extension icon in your toolbar to open settings

---

## ⚙️ Settings — Three Tabs

### 1️⃣ Filters (New in v2)
- **Master toggle** — enable/disable filter engine
- **Mode selector** — **Dry-Run** (amber badge preview) or **Auto-Block** (red, executes native block)
- **Add filters** — type any word, phrase, emoji, symbol, flag (max 100)
- **Scope checkboxes** — Display Name ✓, Bio ✓, Tweet Text (off by default)
- **Active chips** — live list with one-click delete

### 2️⃣ Features (Classic v1)
| Setting | Default | Description |
|---------|---------|-------------|
| Volume sliders | ✅ On | Floating pill over timeline videos |
| Remember volume | ✅ On | Last volume persists across videos |
| Inline Block button | ✅ On | Native-styled button in every tweet action bar |
| Keyboard shortcut | ✅ On | Hover tweet + `Ctrl+Alt+B` (customizable) |
| Shortcut modifiers | `Ctrl` + `Alt` | Click to toggle, type letter to remap |
| Confirm before block | ✅ On | 2-second cancel toast on shortcut |

### 3️⃣ Statistics
- **Direct Blocks** — manual blocks via button/shortcut
- **Dry-Run Matches** — tweets flagged in test mode
- **Filter Auto-Blocks** — blocks executed by auto mode
- **Total Blocked** — cumulative counter
- **Reset** — one-click counter wipe

---

## 📦 Packaging with Same Extension ID

If you have the private key (`.pem`) from a previous release:

1. Go to `chrome://extensions`
2. Click **Pack extension**
3. **Extension root directory**: select this folder
4. **Private key file**: select your `.pem` file
5. Click **Pack extension** — produces a `.crx` with the same ID

> ⚠️ **Security**: Never share or commit your `.pem` file. Anyone with it can publish updates as your extension ID.

---

## 🐛 Known Limitations

- Filter matching relies on DOM text + `img[alt]` for emojis (X renders Twemoji as images)
- Bio caching is session-scoped; hovercards enrich cache dynamically
- Works on `x.com` and `twitter.com` only
- Auto-block uses X's native "More → Block → Confirm" flow — no private APIs

---

## 🛠 Technical Highlights

- **Unicode Engine**: NFKC normalization + Arabic/Persian canonicalization + variation-selector stripping
- **Emoji Handling**: Full support for flags, skin tones, ZWJ sequences, compound emojis
- **Performance**: Scoped `MutationObserver` + `requestIdleCallback` — no full-page rescans
- **Reliability**: `waitFor()` helper replaces fragile `setTimeout` chains; waits for actual menu/confirmation elements
- **Memory**: `WeakSet` tracking lets GC reclaim removed DOM nodes
- **Theme Detection**: Reads computed `background-color` on `<body>` to infer light/dark/dim
- **Font Loading**: Local `woff2` via `chrome.runtime.getURL()` — zero network requests, works offline
- **Manifest V3**: Service worker background, `storage` + `scripting` permissions only

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## XWise Blocker v2.0.0 (فارسی)

اکستنشن کروم برای X (توییتر) که امکانات زیر رو اضافه می‌کنه:
- **موتور فیلتر هوشمند**: کلمات، *هر نوع ایموجی*، پرچم‌ها و علائم با پشتیبانی کامل یونیکد
- **حالت آزمایشی (Dry-Run)**: نشان ظریف روی توییت‌های تطبیق‌یافته، بدون هیچ بلاکی
- **حالت بلاک خودکار**: مسدودسازی اتوماتیک حساب‌های مطابق با فیلترها
- **اسپت‌های هدفمند**: بررسی نام نمایشی و بایو (متن توییت اختیاری)
- **فونت وزیرمتن**: فونت فارسی/عربی داخلی، پشتیبانی کامل RTL و LTR بدون CDN
- **رابط دو زبانه**: فارسی/انگلیسی با یک کلیک
- **اسلایدر صدا** روی هر ویدیو در تایم‌لاین
- **دکمه Block آنی** در نوار اکشن هر توییت
- **شورتکات کیبورد** قابل تنظیم برای بلاک کردن توییتِ هاورشده

همه از یک پنل تنظیمات تمیز، دو زبانه و حرفه‌ای کنترل میشن.

---

## ✨ امکانات جدید در v2.0.0

| قابلیت | توضیح |
|---------|---------|
| **موتور فیلتر هوشمند** | تطبیق یونیکد برای کلمات، *هر ایموجی* (پرچم، تن پوست، ZWJ، ایموجی ترکیبی)، و علائم |
| **حالت آزمایشی** | پیش‌نمایش تطابق‌ها با نشان ظریف درون‌خطی — **صفر بلاک تصادفی** |
| **حالت بلاک خودکار** | مسدودسازی اتوماتیک حساب‌های مطابق با فیلترها از طریق منوی رسمی X |
| **اسپت‌های هدفمند** | بررسی **نام نمایشی** و **بایو** به‌صورت پیش‌فرض (متن توییت اختیاری) |
| **فونت وزیرمتن** | فونت فارسی/عربی داخلی — پشتیبانی زیبا RTL و LTR بدون CDN خارجی |
| **رابط دو زبانه** | رابط کاربری کامل فارسی/انگلیسی با تغییر زبان فوری |
| **حفظ امکانات v1** | اسلایدر صدا، دکمه Block در توییت، شرتکات کیبورد — همه بازنویسی و بهینه‌شده |

---

## 🧠 جزئیات موتور فیلتر

موتور فیلتر از **نرمال‌سازی یونیکد NFKC** با قانون‌سازی حروف فارسی/عربی (`ي`→`ی`, `ك`→`ک`) و حذف سلکتورهای نمایش (VS15/VS16) استفاده می‌کند. این باعث می‌شود:

- ✅ **ایموجی‌ها بی‌نقص کار می‌کنند**: `🇮🇷`، `👨‍👩‍👧‍👦`، `🏳️‍🌈`، `🤲🏽`، `😀`، `❤️`، `⚡`، تمام توالی‌های تن پوست و ZWJ
- ✅ **کلمات به‌درستی تطبیق می‌یابند**: حروف بزرگ/کوچک، گزینه کلمه کامل، نادیده گرفتن حرکات عربی/فارسی
- ✅ **بدون مثبت‌کاذب**: محدوده محدود به نام نمایشی + بایو (متن توییت فقط با فعال‌سازی)
- ✅ **آزمایشی اول**: نشان ظریف می‌گوید *چه* فیلتری در *کجا* تطبیق داده — قبل از هر اقدامی

---

## 🚀 نصب (حالت Developer)

1. در کروم به `chrome://extensions` بروید
2. **Developer mode** (گوشه بالا راست) را فعال کنید
3. روی **Load unpacked** کلیک کنید
4. پوشه `XWise Blocker v1` را انتخاب کنید
5. آیکون اکستنشن در نوار ابزار ظاهر می‌شود — روش کلیک کنید تا تنظیمات باز شود

---

## ⚙️ تنظیمات — سه زبانه

### ۱️⃣ فیلترها (جدید در v2)
- **مستر سوئیچ** — فعال/غیرفعال کردن موتور فیلتر
- **انتخاب حالت** — **آزمایشی** (نشان زرد پیش‌نمایش) یا **بلاک خودکار** (قرمز، اجرا از منوی رسمی)
- **افزودن فیلتر** — هر کلمه، عبارت، ایموجی، نماد، پرچم تایپ کنید (حداکثر ۱۰۰)
- **چک‌باکس‌های محدوده** — نام نمایشی ✓، بایو ✓، متن توییت (پیش‌فرض خاموش)
- **چیپ‌های فعال** — لیست زنده با حذف تک‌کلیک

### ۲️⃣ امکانات (کلاسیک v1)
| گزینه | پیش‌فرض | توضیح |
|---------|---------|---------|
| اسلایدر صدا | ✅ روشن | قرص شناور روی ویدیوهای تایم‌لاین |
| یادتان باشد صدا | ✅ روشن | آخرین سطح صدا در ویدیوهای بعد حفظ شود |
| دکمه Block در توییت | ✅ روشن | دکمه Block بومی در نوار اکشن هر توییت |
| شرتکات کیبورد | ✅ روشن | هاور روی توییت + `Ctrl+Alt+B` (قابل تغییر) |
| модиفایرهای شرتکات | `Ctrl` + `Alt` | کلیک برای فعال/غیرفعال، تایپ حرف برای تغییر |
| تأیید قبل از بلاک | ✅ روشن | تاست ۲ ثانیه‌ای با دکمه Cancel برای جلوگیری از بلاک تصادفی |

### ۳️⃣ آمار
- **بلاک‌های مستقیم** — بلاک دستی از طریق دکمه/شورتکات
- **تطابق‌های آزمایشی** — توییت‌های پرچم‌گذاری‌شده در حالت Dry-Run
- **بلاک‌های خودکار فیلتر** — بلاک‌های اجرا شده توسط حالت Auto
- **مجموع مسدودها** — شمارنده تجمعی
- **صفر کردن** — حذف تمام شمارنده‌ها با یک کلیک

---

## 📦 بسته‌بندی با همان Extension ID

اگر فایل کلید خصوصی (`.pem`) از نسخه قبلی را دارید:

1. به `chrome://extensions` بروید
2. روی **Pack extension** کلیک کنید
3. **Extension root directory**: این پوشه را انتخاب کنید
4. **Private key file**: فایل `.pem` قدیمی را انتخاب کنید
5. **Pack extension** بزنید — یک فایل `.crx` با همان Extension ID تولید می‌شود

> ⚠️ **نکته امنیتی**: فایل `.pem` را در هیچ nơi عمومی (گیت‌هاب پابلیک، پیام‌رسان‌های ناامن) آپلود نکنید. هر کسی که این فایل را داشته باشد می‌تواند به نام همان Extension ID آپدیت منتشر کند.

---

## 🐛 محدودیت‌های شناخته‌شده

- تطبیق فیلتر بر پایه متن DOM + `img[alt]` برای ایموجی‌ها است (X ایموجی‌ها را به‌صورت تصویر Twemoji رندر می‌کند)
- کش بایو در طول سشن معتبر است؛ هاورکارت‌ها به‌صورت پویا کش را غنی می‌کنند
- تنها روی `x.com` و `twitter.com` کار می‌کند
- بلاک خودکار از جریان بومی «بیشتر → مسدود → تایید» استفاده می‌کند — هیچ API خصوصی نیست

---

## 🛠 نکات فنی

- **موتور یونیکد**: نرمال‌سازی NFKC + قانون‌سازی حروف فارسی/عربی + حذف سلکتورهای نمایش
- **مدیریت ایموجی**: پشتیبانی کامل پرچم‌ها، تن‌های پوست، توالی‌های ZWJ، ایموجی‌های ترکیبی
- **پرفورمنس**: `MutationObserver` محدود + `requestIdleCallback` — هیچ اسکن مجدد کل صفحه
- **قابلیت اطمینان**: تابع `waitFor()` جایگزین زنجیرهای شکننده `setTimeout`؛ منتظر ظاهر شدن واقعی منو/دکمه تایید می‌ماند
- **حافظه**: ردیابی با `WeakSet` به GC اجازه می‌دهد گره‌های DOM حذف‌شده را بازیابی کند
- **تشخیص تم**: خواندن `background-color` محاسبه‌شده روی `<body>` برای استنتاج light/dark/dim
- **بارگذاری فونت**: `woff2` محلی عبر `chrome.runtime.getURL()` — هیچ درخواست شبکه‌ای، آفلاین کار می‌کند
- **Manifest V3**: Service Worker در پس‌زمینه، فقط مجوز `storage` و `scripting`

---

## 📄 مجوز

مجوز MIT — آزاد برای استفاده، تغییر و توزیع.