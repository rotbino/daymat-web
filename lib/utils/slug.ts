// lib/utils/slug.ts

/** اسلاگ‌هایی که مسیر سیستمی سایت را می‌دزدند (/{slug}) */
export const RESERVED_SLUGS = [
    'dashboard', 'api', 'admin', 'login', 'register', 'profile',
    'c', 'ad', 'arm', 'arms', 'catalog', 'docs', 'feedback',
    'credit', 'saved-ads', 'no-arm', 'new-home', 'catalog', 'catalogs',
];

/**
 * ✅ قاعده تلگرام/اینستاگرام:
 * فقط a-z0-9 و خط‌تیره — هیچ یونیکدی (فارسی و...) اصلاً عبور نمی‌کند.
 * خط‌تیره‌های تکراری جمع، ابتدا/انتها حذف، حداکثر ۳۰ کاراکتر، حروف کوچک.
 */
export function normalizeSlug(input: string): string {
    return (input ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9\-_]/g, '')   // هرچی غیر لاتین/عدد/تیره → حذف کامل (فارسی هم)
        .replace(/[_\s]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30);
}

export function isReservedSlug(slug: string): boolean {
    return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/** آیا کل ورودی (پس از trim) قابل تبدیل به اسلاگ معتبر است؟ — برای پیام خطای دقیق */
export function hasAnyLatin(input: string): boolean {
    return /[a-z0-9]/i.test(input ?? '');
}

// ─── دیکشنری صنف → پیشوند انگلیسی آدرس ───
// (توسعه‌پذیر؛ بدون ترجمهٔ ماشینی — فقط واژه‌های پرتکرار صنف‌های ایران)
const INDUSTRY_SLUG_MAP: [RegExp, string][] = [
    [/سوپر\s*مارکت|سوپرمارکت|خواربار|خوارو?بار/, 'supermarket'],
    [/پخش/, 'distribution'],
    [/تولید/, 'producer'],
    [/عمده\s*فروش|عمده‌?فروش|بنکدار/, 'wholesale'],
    [/صادرات/, 'export'],
    [/واردات|وارد\s*کننده/, 'import'],
    [/قنادی|شیرینی/, 'bakery'],
    [/آهن|مصالح|ساختمان/, 'building'],
    [/پوشاک|لباس/, 'clothing'],
    [/آرایشی|بهداشتی/, 'cosmetics'],
    [/کافی\s*شاپ|قهوه/, 'coffee'],
    [/رستوران|غذا/, 'food'],
    [/گل|گلخانه/, 'flowers'],
    [/موبایل|موبایل‌?فروشی|گوشی/, 'mobile'],
    [/لوازم|کالای?\s*خانگی/, 'home'],
    [/دارو|عطاری/, 'herbal'],
];

/** از صنف، پیشوند انگلیسی منطقی بساز (یا fallback) */
export function slugFromIndustry(industryName?: string): string {
    const name = (industryName ?? '').trim();
    if (name) {
        for (const [pattern, slug] of INDUSTRY_SLUG_MAP) {
            if (pattern.test(name)) return slug;
        }
    }
    return 'catalog';
}

/** آدرس پیشنهادی کامل: پیشوند صنف + عدد یکتا — قابل اتکا و همیشه انگلیسی */
export function suggestSlug(industryName?: string): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${slugFromIndustry(industryName)}-${num}`;
}