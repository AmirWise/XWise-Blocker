# XWise Blocker v1.0.0

A Chrome extension for X (Twitter) that adds per-video volume sliders, an inline Block button on every tweet, and a customizable keyboard shortcut to block hovered tweets — all controlled from a clean settings panel.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Volume Sliders** | Per-video volume control that appears on hover over timeline videos |
| **Remember Volume** | Last volume level persists across videos |
| **Inline Block Button** | Adds a native-looking Block button to every tweet's action bar |
| **Keyboard Shortcut** | Hover a tweet and press a customizable shortcut (default: `Ctrl+Alt+B`) to block instantly |
| **Confirm Before Block** | Optional 2-second cancel window when using the shortcut (prevents accidental blocks) |
| **Theme Adaptive** | Automatically detects and matches X's light / dark / dim themes |
| **Multi-language Block Detection** | Recognizes "Block" in English, Persian, Spanish, French, German, Italian, Russian, Chinese, Japanese, Arabic, Vietnamese, Indonesian, Dutch, Polish, Turkish, Korean, and more |
| **Settings Panel** | Toggle features, remap shortcut, view block count — all from the extension popup |

---

## 🚀 Installation (Developer Mode)

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `XWise Blocker v1` folder
5. Click the extension icon in your toolbar to open settings

---

## ⚙️ Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Volume sliders | ✅ On | Show volume control on video hover |
| Remember volume | ✅ On | Persist last volume across videos |
| Inline block button | ✅ On | Add Block button to tweet action bars |
| Keyboard shortcut | ✅ On | Enable shortcut to block hovered tweet |
| Shortcut keys | `Ctrl` + `Alt` + `B` | Click `Ctrl`/`Alt`/`Shift` to toggle, type a letter to change |
| Confirm before blocking | ✅ On | 2-second toast with Cancel when using shortcut |

---

## 📦 Packaging with Same Extension ID

If you have the private key (`.pem` file) from a previous release:

1. Go to `chrome://extensions`
2. Click **Pack extension**
3. **Extension root directory**: select this folder
4. **Private key file**: select your `.pem` file
5. Click **Pack extension** — produces a `.crx` with the same ID

> ⚠️ **Security**: Never share or commit your `.pem` file. Anyone with it can publish updates as your extension ID.

---

## 🐛 Known Limitations

- Block menu detection relies on text matching (X doesn't provide a stable `data-testid` for the Block menu item). If X adds a new language not in `BLOCK_KEYWORDS` (in `content.js`), you may need to add the keyword.
- Works on `x.com` and `twitter.com` only.

---

## 🛠 Technical Highlights

- **Performance**: Scoped DOM scanning via `MutationObserver` + `requestIdleCallback` — no full-page rescans
- **Reliability**: `waitFor()` helper replaces fragile `setTimeout` chains; waits for actual menu/confirmation elements
- **Memory**: `WeakSet` tracking lets GC reclaim removed DOM nodes
- **Theme detection**: Reads computed `background-color` on `<body>` to infer light/dark/dim
- **Manifest V3**: Service worker background, `storage` permission only

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

# XWise Blocker v1.0.0 (فارسی)

اکستنشن کروم برای X (توییتر) که امکانات زیر رو اضافه می‌کنه:
- **اسلایدر صدا** روی هر ویدیو در تایم‌لاین
- **دکمه Block آنی** در نوار اکشن هر توییت
- **شورتکات صفحه‌کلید** قابل تنظیم برای بلاک کردن توییتِ هاورشده

همه از یک پنل تنظیمات تمیز و ساده کنترل میشن.

---

## ✨ امکانات

| قابلیت | توضیح |
|---------|---------|
| **اسلایدر صدا** | کنترل صدا برای هر ویدیو که با هاور روی ویدیو ظاهر می‌شه |
| **یادآوری صدا** | آخرین سطح صدا روی ویدیوهای بعدی هم اعمال می‌شه |
| **دکمه Block در توییت** | دکمه‌ی Block به نوار اکشن (Reply/Retweet/Like) هر توییت اضافه می‌شه |
| **شورتکات کیبورد** | با هاور روی توییت و فشردن ترکیب کلید (پیش‌فرض `Ctrl+Alt+B`) بلاک فوری |
| **تأیید قبل از بلاک** | پنجره ۲ ثانیه‌ای با دکمه Cancel برای جلوگیری از بلاک تصادفی (فقط در مسیر شورتکات) |
| **سازگاری با تم** | تشخیص و تطبیق خودکار با تم‌های Light / Dark / Dim توییتر |
| **تشخیص چندزبانه Block** | کلمه Block در انگلیسی، فارسی، اسپانیایی، فرانسوی، آلمانی، ایتالیایی، روسی، چینی، ژاپنی، عربی، ویتنامی، اندونزیایی، هلندی، لهستانی، ترکی، کره‌ای و غیره شناسایی می‌شه |
| **پنل تنظیمات** | فعال/غیرفعال کردن هر فیچر، تغییر شورتکات، مشاهده تعداد بلاک‌ها — همه از پاپ‌اپ اکستنشن |

---

## 🚀 نصب (حالت Developer)

1. در کروم به `chrome://extensions` بروید
2. **Developer mode** (گوشه بالا راست) را فعال کنید
3. روی **Load unpacked** کلیک کنید
4. پوشه `XWise Blocker v1` را انتخاب کنید
5. آیکون اکستنشن در نوار ابزار ظاهر می‌شود — روش کلیک کنید تا تنظیمات باز شود

---

## ⚙️ تنظیمات

| گزینه | پیش‌فرض | توضیح |
|---------|---------|---------|
| اسلایدر صدا | ✅ روشن | نمایش کنترل صدا هنگام هاور روی ویدیو |
| یادتان باشد صدا | ✅ روشن | آخرین سطح صدا در ویدیوهای بعد حفظ شود |
| دکمه Block در توییت | ✅ روشن | دکمه Block به نوار اکشن توییت‌ها اضافه شود |
| شورتکات کیبورد | ✅ روشن | فعال‌سازی شورتکات برای بلاک توییت هاورشده |
| ترکیب کلید | `Ctrl` + `Alt` + `B` | روی Ctrl/Alt/Shift کلیک کنید تا فعال/غیرفعال شوند، حرف دلخواه تایپ کنید |
| تأیید قبل از بلاک | ✅ روشن | تاست ۲ ثانیه‌ای با امکان Cancel هنگام استفاده از شورتکات |

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

- شناسایی آیتم «Block» در منوی X بر پایه متن انجام می‌شود (چون X برای این آیتم `data-testid` پایدار ارائه نمی‌دهد). اگر X زبانی جدید اضافه کند که در آرایه `BLOCK_KEYWORDS` (در `content.js`) نیست، ممکن است نیاز باشد کلمه‌ی جدید اضافه شود.
- تنها روی `x.com` و `twitter.com` کار می‌کند.

---

## 🛠 نکات فنی

- **پرفورمنس**: اسکن محدود دام با `MutationObserver` + `requestIdleCallback` — هیچ اسکن مجدد کل صفحه‌ای
- **قابلیت اطمینان**: تابع `waitFor()` جایگزین زنجیرهای شکننده `setTimeout`؛ منتظر ظاهر شدن واقعی منو/دکمه تأیید می‌ماند
- **حافظه**: ردیابی با `WeakSet` به GC اجازه می‌دهد گره‌های DOM حذف‌شده را بازیابی کند
- **تشخیص تم**: خواندن `background-color` محاسبه‌شده روی `<body>` برای استنتاج light/dark/dim
- **Manifest V3**: Service Worker در پس‌زمینه، فقط مجوز `storage`

---

## 📄 مجوز

مجوز MIT — آزاد برای استفاده، تغییر و توزیع.