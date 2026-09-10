// app_/profile/components/visitCardShared.ts
// ابزار مشترک «کیت اشتراک‌گذاری» و «استودیو کارت ویزیت» — یک منبع حقیقت تا دو مودال از هم جدا نیفتند
// شامل: فونت کانواس، تم‌های رنگی، ابزار رنگ، لودر تصویر (با پروکسی CORS)، ابزارهای رسم
// ⚠️ قانون: حالت تاریک همیشه چک شده (این فایل UI ندارد — فقط منطق تصویر)

export const CANVAS_FONT = '"Vazirmatn", "Noto Sans Arabic", Tahoma, sans-serif';
export const DEFAULT_CAPTION = 'برای دیدن کاتالوگ ما اسکن کنید';

/** آیکون برند دیمت (نشان dm با گوشه‌های شفاف) — برای امضای برند پایین کارت */
export const DAYMAT_BADGE_SRC = '/icons/icon-512.png';

/** ارقام فارسی برای خوانایی کارت */
export const faDigits = (s: string) => s.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);

/* ─── تم‌های رنگی کارت ویزیت ─── */
export const CARD_THEMES = [
    { key: 'daymat',  name: 'دی‌متی',  bg1: '#0f2743', bg2: '#1d4e7e', text: '#ffffff', muted: 'rgba(255,255,255,0.78)', accent: '#f97316', accentText: '#ffffff' },
    { key: 'amber',   name: 'کهربایی', bg1: '#7c2d12', bg2: '#d97706', text: '#ffffff', muted: 'rgba(255,255,255,0.8)',  accent: '#fde68a', accentText: '#1a1c1e' },
    { key: 'night',   name: 'شب',      bg1: '#0b1220', bg2: '#27354f', text: '#ffffff', muted: 'rgba(255,255,255,0.72)', accent: '#f59e0b', accentText: '#ffffff' },
    { key: 'emerald', name: 'زمردی',   bg1: '#064e3b', bg2: '#0d9488', text: '#ffffff', muted: 'rgba(255,255,255,0.76)', accent: '#a7f3d0', accentText: '#1a1c1e' },
    { key: 'navy',    name: 'سرمه‌ای', bg1: '#1e3a8a', bg2: '#3b82f6', text: '#ffffff', muted: 'rgba(255,255,255,0.78)', accent: '#bfdbfe', accentText: '#1a1c1e' },
    { key: 'classic', name: 'کلاسیک',  bg1: '#ffffff', bg2: '#e7ebf0', text: '#1a1c1e', muted: '#5b6472',                accent: '#f59e0b', accentText: '#1a1c1e' },
] as const;

/* ─── ابزار رنگ برای تم دلخواه ─── */
type Rgb = [number, number, number];
export const hexToRgb = (h: string): Rgb => {
    const s = h.replace('#', '');
    const v = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
    return [parseInt(v.slice(0, 2), 16) || 0, parseInt(v.slice(2, 4), 16) || 0, parseInt(v.slice(4, 6), 16) || 0];
};
export const mixRgb = (a: Rgb, b: Rgb, f: number): Rgb =>
    [Math.round(a[0] + (b[0] - a[0]) * f), Math.round(a[1] + (b[1] - a[1]) * f), Math.round(a[2] + (b[2] - a[2]) * f)];
export const rgbStr = (c: Rgb, alpha = 1) => `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
export const luminance = (c: Rgb) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;

/** تم دلخواه از یک رنگ: تیره‌ها گرادیان رنگی + متن سفید، روشن‌ها تم روشن + متن تیره */
export const buildCustomTheme = (hex: string) => {
    const rgb = hexToRgb(hex);
    const light = luminance(rgb) > 0.7;
    const black: Rgb = [16, 18, 22];
    const white: Rgb = [255, 255, 255];
    return {
        key: 'custom',
        name: 'دلخواه',
        bg1: light ? '#ffffff' : rgbStr(mixRgb(rgb, black, 0.45)),
        bg2: light ? rgbStr(mixRgb(rgb, white, 0.55)) : rgbStr(rgb),
        text: light ? '#1a1c1e' : '#ffffff',
        muted: light ? '#5b6472' : 'rgba(255,255,255,0.78)',
        accent: light ? hex : rgbStr(mixRgb(rgb, white, 0.4)),
        accentText: light ? '#1a1c1e' : '#1a1c1e',
    };
};
export type CardTheme = ReturnType<typeof buildCustomTheme> | (typeof CARD_THEMES)[number];

/** شعار پیش‌فرض از معرفی کوتاه کاتالوگ */
export const deriveSlogan = (desc?: string) => {
    const first = (desc || '').trim().split('\n')[0].trim();
    return first ? first.slice(0, 80) : 'تازه‌ترین قیمت محصولات ما را آنلاین ببینید';
};

/* ─── ابزارهای تصویر ─── */
export const triggerDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
};

/** کانواس QR مخفی — هر مودال id خودش را می‌دهد تا با هم تداخل نکنند */
export const getQrCanvas = (id = 'dm-print-qr'): HTMLCanvasElement | null =>
    document.getElementById(id) as HTMLCanvasElement | null;

/** مبدأهای خارجی → پروکسی هم‌مبدأ (رفع باگ CORS لوگو)؛ data: و مسیرهای داخلی دست‌نخورده */
export const toProxied = (src: string) => {
    if (typeof window === 'undefined') return src;
    if (src.startsWith('data:') || src.startsWith('/') || src.startsWith(window.location.origin)) return src;
    return `/api/img-proxy?url=${encodeURIComponent(src)}`;
};

const loadImage = (src: string): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // فال‌بک بدون عکس
        img.src = src;
    });

/* کش تصاویر — تا هر تغییر تم/پس‌زمینه دوباره دانلود نشود (کلید = آدرس اصلی) */
const imgCache = new Map<string, HTMLImageElement | null>();
export const loadImageCached = (src: string): Promise<HTMLImageElement | null> => {
    if (imgCache.has(src)) return Promise.resolve(imgCache.get(src)!);
    return loadImage(toProxied(src)).then((img) => {
        imgCache.set(src, img);
        return img;
    });
};

export const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

export const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
        const t = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(t).width > maxWidth && cur) {
            lines.push(cur);
            cur = w;
        } else {
            cur = t;
        }
    }
    if (cur) lines.push(cur);
    return lines;
};

/**
 * روشنایی میانگین یک ناحیه از کانواسِ نهایی (بعد از تاریکی) —
 * برای انتخاب خودکار رنگ متنِ بیرون از پنل شیشه‌ای (زیرنویس QR، امضای برند)
 */
export const regionLuminance = (
    canvas: HTMLCanvasElement,
    rx: number, ry: number, rw: number, rh: number,
): number => {
    try {
        const sw = 24, sh = 12;
        const off = document.createElement('canvas');
        off.width = sw; off.height = sh;
        const octx = off.getContext('2d');
        if (!octx) return 0.5;
        octx.drawImage(canvas, rx, ry, rw, rh, 0, 0, sw, sh);
        const d = octx.getImageData(0, 0, sw, sh).data;
        let sum = 0;
        for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        return sum / (d.length / 4) / 255;
    } catch {
        return 0.5; // اگر کانواس تainted بود، خنثی
    }
};

/** متن با هالهٔ کم‌رنگ پشتش — خوانا روی هر پس‌زمینه‌ای */
export const drawWithHalo = (
    ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
    ink: string, halo: string,
) => {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = halo;
    ctx.lineWidth = 5;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = ink;
    ctx.fillText(text, x, y);
    ctx.restore();
};
