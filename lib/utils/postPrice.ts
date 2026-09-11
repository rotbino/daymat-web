// lib/utils/postPrice.ts

/**
 * لیبل دکمهٔ «ثبت قیمت» هدر — مطابق نوع بازار:
 *   بازار عمده → «ثبت قیمت عمده» | خرده‌فروشی → «ثبت قیمت» | خدمات → «ثبت خدمت»
 * ملاک نوع بازار: acceptedCatalogTypes (فیلد درجه‌یک Arm) → fallback لگسی
 *   config.modules.priceTable.visibleSalesTypes — هم‌راستا با getArmAcceptedCatalogTypes بک‌اند.
 * بازار بدون محدودیت یا چندنوعه → لیبل عمومی «ثبت قیمت».
 */
export function postPriceLabel(arm?: any | null): string {
    const own = arm?.acceptedCatalogTypes;
    const raw: string[] = Array.isArray(own) && own.length
        ? own
        : (arm?.config?.modules?.priceTable?.visibleSalesTypes || []);
    const types = new Set(raw.map((t) => String(t).toLowerCase()));
    if (types.size === 1) {
        if (types.has('service')) return 'ثبت خدمت';
        if (types.has('wholesale')) return 'ثبت قیمت عمده';
        if (types.has('retail')) return 'ثبت قیمت';
    }
    return 'ثبت قیمت';
}

/**
 * مقصد دکمه — دقیقاً مثل دکمهٔ صفحهٔ اول (Landing):
 *   لاگین → /my-catalogs (اگر کاتالوگ نداشته باشد همان‌جا کارت «ثبت کاتالوگ» را می‌بیند)
 *   مهمان → /login?redirect=/my-catalogs (بعد از ورود/ثبت‌نام به همان مسیر می‌رسد)
 */
export function postPriceHref(isAuthenticated: boolean): string {
    return isAuthenticated
        ? '/my-catalogs'
        : `/login?redirect=${encodeURIComponent('/my-catalogs')}`;
}
