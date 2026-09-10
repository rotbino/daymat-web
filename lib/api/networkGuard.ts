// lib/api/networkGuard.ts
// ============================================================
// گارد خطاهای سطح شبکه — تصمیم‌گیری مقصد کاربر:
//   • اینترنت واقعاً قطع → /offline.html (سرویس‌ورکر)
//   • اینترنت هست ولی بک/دیتابیس در دسترس نیست → /server-unavailable
// صفحهٔ مقصد وقتی اتصال برقرار شد، خودش کاربر را به همین صفحه برمی‌گرداند
// (آدرس فعلی در sessionStorage ذخیره می‌شود).
//
// ⚠️ تشخیص «قطع اینترنت» با پروب فعال انجام می‌شود نه navigator.onLine؛
// چون onLine وقتی وای‌فای به مودم وصل است ولی اینترنت واقعی قطع است،
// دروغ می‌گوید (true) → کاربرِ قطع‌شده اشتباهاً به صفحهٔ سرور می‌رفت.
// ============================================================

import { checkInternet, getCachedConnectivity } from './connectivity';

export const RETURN_URL_KEY = 'daymat:returnUrl';
export const API_BASE_KEY = 'daymat:apiBase';
const LAST_REDIRECT_KEY = 'daymat:lastNetRedirect';

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
 * روی خطای سطح شبکه (بدون پاسخ HTTP) کاربر را به صفحهٔ وضعیت می‌برد.
 * در برابر هدایت‌های تکراری/لوپ محافظت شده است.
 *
 * تشخیص مقصد:
 *   ۱) navigator.onLine = false → فوری صفحهٔ آفلاین (سریع‌ترین مسیر)
 *   ۲) کش تازهٔ «offline» → فوری صفحهٔ آفلاین
 *   ۳) در غیر این صورت پروب فعال اینترنت:
 *      پروب شکست خورد → قطع اینترنت واقعی است → صفحهٔ آفلاین
 *      پروب موفق بود   → اینترنت هست؛ مشکل از بک/دیتابیس → صفحهٔ سرور
 */
export const handleNetworkFailure = async () => {
    if (typeof window === 'undefined') return;

    // از داخل خود صفحهٔ وضعیت دوباره هدایت نکن (لوپ)
    if (window.location.pathname.startsWith('/server-unavailable')) return;

    // چند درخواست موازی خراب → فقط اولین هدایت
    const now = Date.now();
    try {
        const last = Number(sessionStorage.getItem(LAST_REDIRECT_KEY) || 0);
        if (now - last < 4000) return;
        sessionStorage.setItem(LAST_REDIRECT_KEY, String(now));
    } catch {
        /* بی‌صدا */
    }

    storeReturnUrl();

    // ۱) اینترفیز شبکه قطع است → بدون پروب، صفحهٔ آفلاین
    if (navigator.onLine === false) {
        window.location.assign('/offline.html');
        return;
    }

    // ۲) کش تازهٔ آفلاین (پروب لحظاتی قبل شکست خورده) → صفحهٔ آفلاین
    if (getCachedConnectivity() === 'offline') {
        window.location.assign('/offline.html');
        return;
    }

    // ۳) پروب فعال — تکلیف را روشن می‌کند (~۱۰۰-۴۰۰ms آنلاین / حداکثر ۳.۵s آفلاین)
    const online = await checkInternet();
    if (online) {
        // اینترنت هست ولی بک/دیتابیس پاسخ نمی‌دهد → صفحهٔ سرور در دسترس نیست
        window.location.assign('/server-unavailable');
    } else {
        // اینترنت واقعاً قطع است → صفحهٔ آفلاین
        window.location.assign('/offline.html');
    }
};
