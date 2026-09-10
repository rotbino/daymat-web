// lib/api/networkGuard.ts
// ============================================================
// گارد خطاهای سطح شبکه — تصمیم‌گیری مقصد کاربر:
//   • اینترنت قطع (navigator.onLine = false) → /offline.html (سرویس‌ورکر)
//   • اینترنت هست ولی بک/دیتابیس در دسترس نیست → /server-unavailable
// صفحهٔ مقصد وقتی اتصال برقرار شد، خودش کاربر را به همین صفحه برمی‌گرداند
// (آدرس فعلی در sessionStorage ذخیره می‌شود).
// ============================================================

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
 */
export const handleNetworkFailure = () => {
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

    if (navigator.onLine === false) {
        // اینترنت واقعاً قطع است → صفحهٔ آفلاین (سرویس‌ورکر از کش سرو می‌کند)
        window.location.assign('/offline.html');
    } else {
        // اینترنت هست ولی بک/دیتابیس پاسخ نمی‌دهد → صفحهٔ سرور در دسترس نیست
        window.location.assign('/server-unavailable');
    }
};
