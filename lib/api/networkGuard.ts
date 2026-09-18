// lib/api/networkGuard.ts
// ============================================================
// گارد خطاهای سطح شبکه — تصمیم‌گیری مقصد کاربر:
//   • اینترنت واقعاً قطع → /offline.html (سرویس‌ورکر)
//   • اینترنت هست ولی بک/دیتابیس در دسترس نیست → /server-unavailable
//
// ⚠️ قاعدهٔ فاز جلسه (روایت کاربر):
//   ریدایرکت به صفحهٔ وضعیت فقط در «ورود به سایت / رفرش کامل صفحه» مجاز است.
//   در طول جلسه (بعد از اولین پاسخ موفق API یا ۲۰ ثانیه از لود) هرگز ریدایرکت
//   نمی‌کنیم؛ فقط رویداد issue منتشر می‌شود تا نوار پیام غیرمزاحم نمایش داده شود —
//   چون قطعیِ یک‌ثانیه‌ای نباید فرم نیمه‌کارهٔ کاربر را به صفحهٔ دیگری ببرد.
//
// ⚠️ تشخیص «قطع اینترنت» با پروب فعال انجام می‌شود نه navigator.onLine؛
// چون onLine وقتی وای‌فای به مودم وصل است ولی اینترنت واقعی قطع است،
// دروغ می‌گوید (true) → کاربرِ قطع‌شده اشتباهاً به صفحه سرور می‌رفت.
// ============================================================

import { checkInternet, getCachedConnectivity } from './connectivity';

export const RETURN_URL_KEY = 'imach:returnUrl';
export const API_BASE_KEY = 'imach:apiBase';
const LAST_REDIRECT_KEY = 'imach:lastNetRedirect';

/* ───────────────────────── فاز جلسه — ورود vs میان‌جلسه ─────────────────── */

// متغیر ماژول = با هر لود کامل صفحه (ورود/رفرش) ریست می‌شود → دقیقاً نقطهٔ ورود
const BOOTED_AT = Date.now();
const ENTRY_WINDOW_MS = 20_000; // تا ۲۰ ثانیهٔ اول اگر هنوز هیچ پاسخ موفقی نبود = ورود
let anyApiSuccess = false;      // بعد از اولین پاسخ موفق، همیشه «میان‌جلسه»

/** بعد از هر پاسخ موفق API صدا زده شود — از این لحظه دیگر هرگز ریدایرکت ممنوع */
export const noteSessionOnline = () => {
    anyApiSuccess = true;
    emitIssue(null); // اگر نوار قطعی باز بود، همین‌جا بسته شود
};

const isEntryPhase = () => !anyApiSuccess && Date.now() - BOOTED_AT < ENTRY_WINDOW_MS;

/* ───────────────────── رویداد وضعیت شبکه برای UI (نوار پیام) ────────────────── */

export type NetworkIssueKind = 'offline' | 'server';
type IssueListener = (kind: NetworkIssueKind | null) => void;

const issueListeners = new Set<IssueListener>();
let activeIssue: NetworkIssueKind | null = null;

/** UI (ConnectivityBanner) مشترک می‌شود؛ تابع لغو اشتراک برمی‌گردد */
export const onNetworkIssue = (fn: IssueListener): (() => void) => {
    issueListeners.add(fn);
    return () => issueListeners.delete(fn);
};

const emitIssue = (kind: NetworkIssueKind | null) => {
    if (activeIssue === kind) return; // بدون فلوئد؛ فقط تغییر وضعیت
    activeIssue = kind;
    issueListeners.forEach((fn) => {
        try { fn(kind); } catch { /* بی‌صدا */ }
    });
};

/** ذخیرهٔ مسیر فعلی برای بازگشت بعد از رفع قطعی */
export const storeReturnUrl = (url?: string) => {
    if (typeof window === 'undefined') return;
    try {
        const target = url || window.location.pathname + window.location.search;
        if (target.startsWith('/server-unavailable')) return;
        sessionStorage.setItem(RETURN_URL_KEY, target);
    } catch {
        /* حالت خصوصی مرورگر — بی‌صدا */
    }
};

/** خواندن و پاک‌کردن مسیر ذخیره‌شده (برای هدایت برگشت) */
export const consumeReturnUrl = (): string => {
    if (typeof window === 'undefined') return '/';
    try {
        const url = sessionStorage.getItem(RETURN_URL_KEY) || '/';
        sessionStorage.removeItem(RETURN_URL_KEY);
        return url;
    } catch {
        return '/';
    }
};

/** خواندن مسیر ذخیره‌شده بدون پاک‌کردن — صفحات وضعیت از این استفاده می‌کنند
 *  تا آدرس برای offline.html (که خودش مستقیم از sessionStorage می‌خواند) باقی بماند */
export const peekReturnUrl = (): string => {
    if (typeof window === 'undefined') return '/';
    try {
        return sessionStorage.getItem(RETURN_URL_KEY) || '/';
    } catch {
        return '/';
    }
};

/** نوشتن آدرس API برای offline.html (که به کد اپ دسترسی ندارد) */
export const rememberApiBase = (base: string) => {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(API_BASE_KEY, base);
    } catch {
        /* بی‌صدا */
    }
};

/**
 * روی خطای سطح شبکه (بدون پاسخ HTTP) تصمیم می‌گیرد: ریدایرکت یا فقط پیام؟
 *
 *   فاز ورود (۲۰ ثانیهٔ اولِ لود کامل و هنوز هیچ پاسخ موفق API):
 *     → ریدایرکت به صفحهٔ وضعیت (offline.html / server-unavailable)
 *     کاربر هنوز محتوایی از دست نداده و صفحهٔ خالی را نمی‌بیند.
 *
 *   فاز میان‌جلسه (بعد از اولین موفقیت یا ۲۰ ثانیه):
 *     → فقط رویداد issue منتشر می‌شود؛ نوار پیام ظاهر می‌شود و هیچ
 *     ریدایرکتی اتفاق نمی‌افتد — فرم و کار نیمه‌کارهٔ کاربر حفظ می‌شود.
 *     (نوار در ConnectivityBanner با ۴ ثانیه تأخیر ظاهر می‌شود تا
 *     قطعی‌های یک‌ثانیه‌ای اصلاً به چشم نیایند.)
 *
 * تشخیص مقصد (offline vs server):
 *   ۱) navigator.onLine = false → فوری آفلاین (سریع‌ترین مسیر)
 *   ۲) کش تازهٔ «offline» → فوری آفلاین
 *   ۳) پروب فعال: شکست → آفلاین | موفق → بک/دیتابیس قطع است
 */
export const handleNetworkFailure = async () => {
    if (typeof window === 'undefined') return;

    // از داخل خود صفحه وضعیت دوباره هدایت نکن (لوپ)
    if (window.location.pathname.startsWith('/server-unavailable')) return;

    // چند درخواست موازی خراب → فقط اولین تصمیم
    const now = Date.now();
    try {
        const last = Number(sessionStorage.getItem(LAST_REDIRECT_KEY) || 0);
        if (now - last < 4000) return;
        sessionStorage.setItem(LAST_REDIRECT_KEY, String(now));
    } catch {
        /* بی‌صدا */
    }

    // مقصد را مشخص کن (بدون هدایت)
    let dest: 'offline' | 'server';
    if (navigator.onLine === false) {
        dest = 'offline';
    } else if (getCachedConnectivity() === 'offline') {
        dest = 'offline';
    } else {
        const online = await checkInternet();
        dest = online ? 'server' : 'offline';
    }

    // ⚠️ فاز ورود فقط: ریدایرکت مجاز
    if (isEntryPhase()) {
        storeReturnUrl();
        window.location.assign(dest === 'offline' ? '/offline.html' : '/server-unavailable');
        return;
    }

    // فاز میان‌جلسه: فقط پیام — هیچ هدایتی
    emitIssue(dest);
};
