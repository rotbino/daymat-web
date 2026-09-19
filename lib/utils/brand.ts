// lib/utils/brand.ts
// 🎨 برندبوک هر بازو — رنگ برند + واحد پول نمایشی
//    هر بازوی فروش/خرید می‌تواند رنگ و واحد پول خودش را داشته باشد (ذخیره در config/metadata بازو)
//    رنگ با متغیرهای CSS تزریق می‌شود — چون کل تم فرانت روی var() سوار است، همهٔ صفحات بازو
//    (عمومی + پنل مدیریت) بدون بازنویسی کلاس‌ها رنگ برند می‌گیرند.
//    واحد پول فقط «برچسب نمایش» است — اعداد همان‌طور که وارد شده‌اند نشان داده می‌شوند؛
//    پیش‌فرض همیشه تومان است (ریال عمداً نداریم — فیلتر قیمت بازار به‌هم می‌ریزد).

// ─── واحد پول ────────────────────────────────────────────────
export interface CurrencyDef {
    code: string;
    /** برچسب فارسی کامل — کنار قیمت‌ها */
    label: string;
    /** علامت کوتاه لاتین — جاهای تنگ */
    sign: string;
    /** کشور/منطقه — زیرنویس انتخابگر */
    region: string;
}

export const ARM_CURRENCIES: CurrencyDef[] = [
    { code: 'toman', label: 'تومان', sign: 'T', region: 'ایران (پیش‌فرض)' },
    { code: 'usd', label: 'دلار آمریکا', sign: '$', region: 'آمریکا — تجارت بین‌الملل' },
    { code: 'eur', label: 'یورو', sign: '€', region: 'اروپا' },
    { code: 'afn', label: 'افغانی', sign: '؋', region: 'افغانستان' },
    { code: 'tjs', label: 'سامانی', sign: 'SM', region: 'تاجیکستان' },
    { code: 'aed', label: 'درهم', sign: 'DH', region: 'امارات' },
    { code: 'try', label: 'لیر', sign: '₺', region: 'ترکیه' },
];

const CURRENCY_BY_CODE = new Map(ARM_CURRENCIES.map((c) => [c.code, c]));

export const DEFAULT_CURRENCY = 'toman';

export function currencyOf(code?: string | null): CurrencyDef {
    return CURRENCY_BY_CODE.get(code || '') || CURRENCY_BY_CODE.get('toman')!;
}

/** برچسب واحد پول — «تومان»، «دلار آمریکا»، ... */
export function currencyLabel(code?: string | null): string {
    return currencyOf(code).label;
}

/** قالب‌بندی مبلغ + واحد پول — «۴۸۵٬۰۰۰ تومان» | «۲۵ دلار آمریکا» */
export function fmtMoney(n: number | undefined | null, code?: string | null): string {
    if (n == null || !Number.isFinite(n as number)) return '—';
    return `${(n as number).toLocaleString('fa-IR')} ${currencyLabel(code)}`;
}

// ─── رنگ برند ────────────────────────────────────────────────

/** رنگ‌های آمادهٔ برند — یک انتخاب ساده، همان‌طور که مالک خواست */
export const PRESET_BRAND_COLORS: { hex: string; name: string }[] = [
    { hex: '#0f7b52', name: 'سبز دیمت (پیش‌فرض)' },
    { hex: '#1d5fd1', name: 'آبی' },
    { hex: '#b91c1c', name: 'قرمز' },
    { hex: '#c2410c', name: 'نارنجی سوخته' },
    { hex: '#b45309', name: 'عسلی' },
    { hex: '#7c3aed', name: 'بنفش' },
    { hex: '#0e7490', name: 'فیروزه‌ای' },
    { hex: '#be185d', name: 'سرخابی' },
    { hex: '#4d7c0f', name: 'زیتونی' },
    { hex: '#334155', name: 'طوسی تیره' },
    { hex: '#a16207', name: 'خردخانه‌ای' },
    { hex: '#0f766e', name: 'سبزآبی' },
];

export const DEFAULT_BRAND_COLOR = '#0f7b52';

/** رنگ معتبر hex ۶ رقمی؟ */
export const isHexColor = (c?: string | null): boolean =>
    !!c && /^#[0-9a-fA-F]{6}$/.test(c.trim());

/** #RGB کوتاه را هم قبول کن */
export const normalizeHex = (c?: string | null): string | null => {
    if (!c) return null;
    let s = c.trim();
    if (/^#[0-9a-fA-F]{3}$/.test(s)) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    return isHexColor(s) ? s.toLowerCase() : null;
};

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

const hexToRgb = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const rgbToHex = (r: number, g: number, b: number): string =>
    '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');

/** روشن‌کردن به‌سمت سفید — amount بین ۰ و ۱ */
const mixWhite = (hex: string, amount: number): string => {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
};

/** تیره‌کردن به‌سمت مشکی — amount بین ۰ و ۱ */
const mixBlack = (hex: string, amount: number): string => {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
};

/** آیا رنگ روشن است؟ (برای انتخاب رنگ متن روی آن) */
export const isLightColor = (hex: string): boolean => {
    const [r, g, b] = hexToRgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 160;
};

/**
 * استایل تزریق رنگ برند — روی ریشهٔ صفحهٔ بازو پاشیده می‌شود.
 * فروش: توکن‌های سبز (--brand-primary* و --primary) رنگ برند می‌گیرند.
 * خرید: توکن‌های آبی (--brand-contrast*) هم هم‌رنگ می‌شوند تا هویت خرید یکدست بماند.
 * خروجی null = رنگ پیش‌فرض — هیچ استایلی تزریق نمی‌شود.
 */
export function brandVars(color?: string | null, mode: 'sales' | 'purchase' = 'sales'): React.CSSProperties | null {
    const hex = normalizeHex(color);
    if (!hex || hex === DEFAULT_BRAND_COLOR) return null;
    const style: Record<string, string> = {
        '--brand-primary': hex,
        '--brand-primary-strong': mixBlack(hex, 0.14),
        '--brand-primary-soft': mixWhite(hex, 0.92),
        '--brand-primary-tint': mixWhite(hex, 0.74),
        '--primary': hex,
    };
    if (mode === 'purchase') {
        style['--brand-contrast'] = hex;
        style['--brand-contrast-strong'] = mixBlack(hex, 0.14);
        style['--brand-contrast-soft'] = mixWhite(hex, 0.92);
        style['--brand-contrast-tint'] = mixWhite(hex, 0.74);
    }
    return style as React.CSSProperties;
}
