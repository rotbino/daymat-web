// app_/profile/components/ShareKitModal.tsx
// کیت اشتراک‌گذاری کاتالوگ — لینک + پیام آماده + سه خروجی تصویری:
//   ۱) «دانلود برای چاپ» — پوستر ویترین: متن راهنما + QR بزرگ + لوگو و نام کسب‌وکار
//   ۲) «فقط تصویر QR» — خود QR با حاشیهٔ ساکت
//   ۳) «تولید کارت ویزیت» — کارت ویزیت ۹×۵ ترند روز با ویرایش کامل:
//      تم‌های آماده + کالر‌سلکتور آزاد + عکس پس‌زمینه (نمونه/آپلود) + اسلایدر تاریکی
//      + ویرایش لوگو/عنوان/شعار/تماس/متن زیر QR + دانلود PNG
// 🔧 لوگوی کسب‌وکار از مبدأ بدون CORS (آروان) با /api/img-proxy هم‌مبدأ می‌شود تا کانواس بکشد
// ⚠️ قانون: حالت تاریک همیشه چک شده
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Copy, MessageCircle, Send, Share2, QrCode, Check, Download, Loader2,
    Printer, IdCard, RefreshCw, ImageUp, XCircle, RotateCcw,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils/utils";

interface Props {
    open: boolean;
    onClose: () => void;
    catalogName: string;
    slug?: string;
    /** لوگوی کاتالوگ برای پوستر و کارت ویزیت — اختیاری؛ نبودش حرف اول نام می‌نشیند */
    logoUrl?: string;
    /** شمارهٔ تماس کسب‌وکار — پیش‌فرض کارت ویزیت */
    phone?: string;
    /** معرفی کوتاه کاتالوگ — پیش‌فرض شعار کارت ویزیت */
    description?: string;
}

const CANVAS_FONT = '"Vazirmatn", "Noto Sans Arabic", Tahoma, sans-serif';
const DEFAULT_CAPTION = 'برای دیدن کاتالوگ ما اسکن کنید';

/* ارقام فارسی برای خوانایی کارت */
const faDigits = (s: string) => s.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);

/* ─── تم‌های رنگی کارت ویزیت ─── */
const CARD_THEMES = [
    { key: 'night',   name: 'شب',      bg1: '#0b1220', bg2: '#27354f', text: '#ffffff', muted: 'rgba(255,255,255,0.72)', accent: '#f59e0b', accentText: '#ffffff' },
    { key: 'amber',   name: 'کهربایی', bg1: '#7c2d12', bg2: '#d97706', text: '#ffffff', muted: 'rgba(255,255,255,0.8)',  accent: '#fde68a', accentText: '#1a1c1e' },
    { key: 'emerald', name: 'زمردی',   bg1: '#064e3b', bg2: '#0d9488', text: '#ffffff', muted: 'rgba(255,255,255,0.76)', accent: '#a7f3d0', accentText: '#1a1c1e' },
    { key: 'navy',    name: 'سرمه‌ای', bg1: '#1e3a8a', bg2: '#3b82f6', text: '#ffffff', muted: 'rgba(255,255,255,0.78)', accent: '#bfdbfe', accentText: '#1a1c1e' },
    { key: 'classic', name: 'کلاسیک',  bg1: '#ffffff', bg2: '#e7ebf0', text: '#1a1c1e', muted: '#5b6472',                accent: '#f59e0b', accentText: '#1a1c1e' },
] as const;

/* ─── پس‌زمینه‌های آماده (Unsplash — از پروکسی خودی سرو می‌شود) ─── */
const CARD_BACKGROUNDS = [
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&q=85&auto=format&fit=crop', // دفتر مدرن
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1600&q=85&auto=format&fit=crop',   // گرادیان شب
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=85&auto=format&fit=crop', // ساختمان اداری
    'https://images.unsplash.com/photo-1524169358666-79f22534bc6e?w=1600&q=85&auto=format&fit=crop', // بافت تیره
    'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?w=1600&q=85&auto=format&fit=crop', // گرم و روشن
    'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?w=1600&q=85&auto=format&fit=crop', // انتزاعی ملایم
];

/* ─── ابزار رنگ برای تم دلخواه ─── */
type Rgb = [number, number, number];
const hexToRgb = (h: string): Rgb => {
    const s = h.replace('#', '');
    const v = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
    return [parseInt(v.slice(0, 2), 16) || 0, parseInt(v.slice(2, 4), 16) || 0, parseInt(v.slice(4, 6), 16) || 0];
};
const mixRgb = (a: Rgb, b: Rgb, f: number): Rgb =>
    [Math.round(a[0] + (b[0] - a[0]) * f), Math.round(a[1] + (b[1] - a[1]) * f), Math.round(a[2] + (b[2] - a[2]) * f)];
const rgbStr = (c: Rgb, alpha = 1) => `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
const luminance = (c: Rgb) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;

/** تم دلخواه از یک رنگ: تیره‌ها گرادیان رنگی + متن سفید، روشن‌ها تم روشن + متن تیره */
const buildCustomTheme = (hex: string) => {
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
type CardTheme = ReturnType<typeof buildCustomTheme> | (typeof CARD_THEMES)[number];

/* شعار پیش‌فرض از معرفی کوتاه کاتالوگ */
const deriveSlogan = (desc?: string) => {
    const first = (desc || '').trim().split('\n')[0].trim();
    return first ? first.slice(0, 80) : 'تازه‌ترین قیمت محصولات ما را آنلاین ببینید';
};

/* ─── ابزارهای تصویر (مشترک بین پوستر و کارت) ─── */
const triggerDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
};

const getQrCanvas = (): HTMLCanvasElement | null =>
    document.getElementById('dm-print-qr') as HTMLCanvasElement | null;

/** مبدأهای خارجی → پروکسی هم‌مبدأ (رفع باگ CORS لوگو)؛ data: و مسیرهای داخلی دست‌نخورده */
const toProxied = (src: string) => {
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
const loadImageCached = (src: string): Promise<HTMLImageElement | null> => {
    if (imgCache.has(src)) return Promise.resolve(imgCache.get(src)!);
    return loadImage(toProxied(src)).then((img) => {
        imgCache.set(src, img);
        return img;
    });
};

const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
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

export default function ShareKitModal({ open, onClose, catalogName, slug, logoUrl, phone, description }: Props) {
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [posterBusy, setPosterBusy] = useState(false);

    // ─── کارت ویزیت ───
    const [cardOpen, setCardOpen] = useState(false);
    const [themeIdx, setThemeIdx] = useState(0);
    const [customColor, setCustomColor] = useState<string | null>(null); // کالر‌سلکتور آزاد
    const [bgIdx, setBgIdx] = useState(-1); // -1 = بدون عکس (فقط تم)
    const [customBg, setCustomBg] = useState<string | null>(null);
    const [customLogo, setCustomLogo] = useState<string | null>(null); // لوگوی انتخابی کاربر
    const [overlayPct, setOverlayPct] = useState(45); // تاریکی پشت عکس
    const [cardName, setCardName] = useState('');
    const [slogan, setSlogan] = useState('');
    const [cardPhone, setCardPhone] = useState('');
    const [cardCaption, setCardCaption] = useState(DEFAULT_CAPTION);
    const [fontsReady, setFontsReady] = useState(false);
    const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const bgFileRef = useRef<HTMLInputElement | null>(null);
    const logoFileRef = useRef<HTMLInputElement | null>(null);
    const drawTokenRef = useRef(0);
    const canvasFontRef = useRef<string>(CANVAS_FONT); // نام واقعی خانوادهٔ فونت next/font

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // آماده‌شدن فونت وب + کشف نام واقعی خانواده (next/font نامش را هش می‌کند)
    useEffect(() => {
        let alive = true;
        try {
            document.fonts?.ready.then(() => {
                if (!alive) return;
                try {
                    for (const f of document.fonts as any) {
                        if (String(f.family).includes('Vazirmatn')) {
                            canvasFontRef.current = `"${f.family}", "Noto Sans Arabic", Tahoma, sans-serif`;
                            break;
                        }
                    }
                } catch {}
                setFontsReady(true);
            }).catch(() => setFontsReady(true));
        } catch { setFontsReady(true); }
        return () => { alive = false; };
    }, []);

    const url = mounted && slug && typeof window !== 'undefined'
        ? `${window.location.origin}/${slug}`   // ⚠️ اگر کاتالوگ هنوز در /c/ است: `/c/${slug}`
        : '';

    // شروع تازه با هر باز شدن — پیش‌فرض‌ها از مشخصات کاتالوگ (تم انتخابی می‌ماند)
    useEffect(() => {
        if (!open) return;
        setCardName(catalogName || '');
        setSlogan(deriveSlogan(description));
        setCardPhone(phone || '');
        setCardCaption(DEFAULT_CAPTION);
        setCardOpen(false);
        setBgIdx(-1);
        setCustomBg(null);
        setCustomLogo(null);
        setCustomColor(null);
        setOverlayPct(45);
    }, [open, catalogName, phone, description]);

    // ─── رسم کارت ویزیت ۱۰۵۰×۶۰۰ (استاندارد ۹×۵ سانتی‌متر در ۳۰۰dpi) ───
    const drawCard = useCallback(async () => {
        const canvas = cardCanvasRef.current;
        if (!canvas || !open) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const token = ++drawTokenRef.current;
        const F = canvasFontRef.current;

        const W = 1050, H = 600;
        const th: CardTheme = customColor ? buildCustomTheme(customColor) : CARD_THEMES[themeIdx];
        const RX = W - 64; // لبهٔ راست متن (RTL)
        canvas.width = W;
        canvas.height = H;

        try { await document.fonts.ready; } catch {}
        if (token !== drawTokenRef.current) return;

        // ─── پس‌زمینه: عکس + اسلایدر تاریکی | یا گرادیان تم ───
        const bgSrc = customBg ?? (bgIdx >= 0 ? CARD_BACKGROUNDS[bgIdx] : null);
        let painted = false;
        if (bgSrc) {
            const img = await loadImageCached(bgSrc);
            if (token !== drawTokenRef.current) return;
            if (img) {
                const scale = Math.max(W / img.width, H / img.height);
                const dw = img.width * scale, dh = img.height * scale;
                ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
                ctx.fillStyle = `rgba(0,0,0,${Math.min(0.85, Math.max(0, overlayPct / 100))})`;
                ctx.fillRect(0, 0, W, H);
                painted = true;
            }
        }
        if (!painted) {
            const g = ctx.createLinearGradient(0, 0, W, H);
            g.addColorStop(0, th.bg1);
            g.addColorStop(1, th.bg2);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }
        // روی عکس متن سفید می‌خواند؛ روی تم، رنگ خود تم
        const text = painted ? '#ffffff' : th.text;
        const muted = painted ? 'rgba(255,255,255,0.78)' : th.muted;
        const accent = th.accent;

        // ─── تزئینات ترند روز: حلقهٔ محو + نقطه‌چین + نوار لهجهٔ گرد ───
        ctx.save();
        ctx.globalAlpha = painted ? 0.35 : 0.25;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(150, 105, 190, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = text;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 2; j++) {
                ctx.beginPath();
                ctx.arc(RX - 180 + i * 36, 548 + j * 26, 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
        ctx.fillStyle = accent;
        roundRectPath(ctx, W - 26, 24, 10, H - 48, 5);
        ctx.fill();

        // ─── برچسب کوچک «کاتالوگ آنلاین» ───
        ctx.font = `bold 17px ${F}`;
        ctx.direction = 'rtl';
        const pillLabel = 'کاتالوگ آنلاین';
        const pillW = ctx.measureText(pillLabel).width + 36;
        const pillX = RX - pillW, pillY = 56;
        ctx.fillStyle = accent;
        roundRectPath(ctx, pillX, pillY, pillW, 34, 17);
        ctx.fill();
        ctx.fillStyle = th.accentText;
        ctx.textAlign = 'center';
        ctx.fillText(pillLabel, pillX + pillW / 2, pillY + 23);

        // ─── لوگو روی بشقاب سفید + حلقهٔ لهجه ───
        const logoCy = 166, plateR = 64, logoR = 52;
        const logoCx = RX - plateR;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(logoCx, logoCy, plateR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        const logoSrc = customLogo ?? logoUrl;
        const logo = logoSrc ? await loadImageCached(logoSrc) : null;
        if (token !== drawTokenRef.current) return;
        if (logo) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(logoCx, logoCy, logoR, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(logo, logoCx - logoR, logoCy - logoR, logoR * 2, logoR * 2);
            ctx.restore();
        } else {
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.arc(logoCx, logoCy, logoR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = th.accentText;
            ctx.textAlign = 'center';
            ctx.font = `800 50px ${F}`;
            ctx.fillText((cardName || 'ک').trim().charAt(0), logoCx, logoCy + 18);
        }
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(logoCx, logoCy, plateR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // ─── نام کسب‌وکار — با کوچک‌شدن خودکار ───
        ctx.textAlign = 'right';
        ctx.direction = 'rtl';
        ctx.fillStyle = text;
        let nameSize = 50;
        ctx.font = `800 ${nameSize}px ${F}`;
        while (ctx.measureText(cardName || '').width > 600 && nameSize > 30) {
            nameSize -= 3;
            ctx.font = `800 ${nameSize}px ${F}`;
        }
        ctx.fillText(cardName || '', RX, 318);

        // ─── شعار — حداکثر دو خط ───
        const sl = (slogan || '').trim();
        if (sl) {
            ctx.font = `26px ${F}`;
            const lines = wrapText(ctx, sl, 580).slice(0, 2);
            ctx.fillStyle = muted;
            lines.forEach((ln, i) => ctx.fillText(ln, RX, 368 + i * 38));
        }

        // ─── جداکنندهٔ لهجه ───
        ctx.strokeStyle = accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(RX - 150, 452);
        ctx.lineTo(RX, 452);
        ctx.stroke();

        // ─── تماس ───
        if (cardPhone.trim()) {
            ctx.textAlign = 'right';
            ctx.direction = 'rtl';
            ctx.fillStyle = text;
            ctx.font = `bold 30px ${F}`;
            ctx.fillText(`تماس: ${faDigits(cardPhone.trim())}`, RX, 510);
        }

        // ─── ستون چپ: QR روی بشقاب سفید + زیرنویس قابل ویرایش + اسلاگ ───
        const plateS = 300, plateX = 60, plateY = 118;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = '#ffffff';
        roundRectPath(ctx, plateX, plateY, plateS, plateS, 26);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        roundRectPath(ctx, plateX, plateY, plateS, plateS, 26);
        ctx.stroke();
        ctx.restore();
        const qr = getQrCanvas();
        if (qr) {
            const inner = plateS - 40;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(qr, plateX + 20, plateY + 20, inner, inner);
        }
        const cap = (cardCaption || '').trim();
        if (cap) {
            ctx.textAlign = 'center';
            ctx.direction = 'rtl';
            ctx.fillStyle = text;
            ctx.font = `bold 21px ${F}`;
            ctx.fillText(cap, plateX + plateS / 2, 452);
        }
        const shortUrl = url.replace(/^https?:\/\//, '');
        if (shortUrl) {
            let s = 17;
            ctx.textAlign = 'center';
            ctx.direction = 'ltr';
            ctx.fillStyle = muted;
            ctx.font = `bold ${s}px ${F}`;
            while (ctx.measureText(shortUrl).width > plateS + 80 && s > 12) {
                s -= 1;
                ctx.font = `bold ${s}px ${F}`;
            }
            ctx.fillText(shortUrl, plateX + plateS / 2, 486);
        }

        // ─── امضای کوچک دیمت ───
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = text;
        ctx.font = `17px ${F}`;
        ctx.fillText('ساخته‌شده با دیمت', W / 2, H - 20);
        ctx.globalAlpha = 1;
    }, [open, themeIdx, customColor, bgIdx, customBg, customLogo, overlayPct, cardName, slogan, cardPhone, cardCaption, logoUrl, url]);

    // رسم مجدد پیش‌نمایش با هر تغییر
    useEffect(() => {
        if (!open || !cardOpen) return;
        drawCard();
    }, [open, cardOpen, fontsReady, drawCard]);

    if (!mounted) return null;
    if (!open) return null;

    // ✅ کپی = فقط URL خالص (بدون متن فارسی)
    const copy = async () => {
        if (!url) return;
        await navigator.clipboard.writeText(url).catch(() => {});
        setCopied(true);
        toast.success('لینک کاتالوگ کپی شد');
        setTimeout(() => setCopied(false), 2000);
    };

    // پیام پیشنهادی — فقط برای واتساپ/تلگرام (خودشان URL را جدا می‌گیرند)
    const message = `کاتالوگ ${catalogName} — قیمت‌ها و محصولات:\n${url}`;

    const nativeShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: `کاتالوگ ${catalogName}`, url }); } catch {}
        } else copy();
    };

    /** ۲) فقط تصویر QR — با حاشیهٔ سفید کافی برای اسکن */
    const downloadSimpleQr = () => {
        const qr = getQrCanvas();
        if (!qr) return;
        try {
            const pad = 140; // ناحیهٔ ساکت برای اسکن مطمئن
            const c = document.createElement('canvas');
            c.width = qr.width + pad * 2;
            c.height = qr.height + pad * 2;
            const ctx = c.getContext('2d')!;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.drawImage(qr, pad, pad);
            triggerDownload(c.toDataURL('image/png'), `qr-${slug || 'catalog'}.png`);
            toast.success('تصویر QR دانلود شد');
        } catch {
            toast.error('دانلود تصویر ممکن نشد');
        }
    };

    /** ۱) پوستر چاپی — متن راهنما + QR بزرگ + لوگو و نام کسب‌وکار + آدرس */
    const downloadPrintPoster = async () => {
        const qr = getQrCanvas();
        if (!qr || posterBusy) return;
        setPosterBusy(true);
        try {
            try { await document.fonts.ready; } catch {}

            const W = 1080, H = 1350;
            const c = document.createElement('canvas');
            c.width = W; c.height = H;
            const ctx = c.getContext('2d')!;

            // زمینهٔ سفید چاپی
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);

            // قاب کهربایی دوخطی
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 5;
            roundRectPath(ctx, 40, 40, W - 80, H - 80, 32);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(245,158,11,0.35)';
            ctx.lineWidth = 2;
            roundRectPath(ctx, 58, 58, W - 116, H - 116, 24);
            ctx.stroke();

            // متن راهنما — همان چیزی که مشتری در ویترین می‌بیند
            ctx.textAlign = 'center';
            ctx.direction = 'rtl';
            ctx.fillStyle = '#1a1c1e';
            ctx.font = `bold 47px ${CANVAS_FONT}`;
            ctx.fillText('برای دیدن قیمت محصولات ما', W / 2, 210);
            ctx.fillText('کیوآر کد زیر را اسکن کنید', W / 2, 280);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(W / 2 - 60, 322);
            ctx.lineTo(W / 2 + 60, 322);
            ctx.stroke();

            // QR بزرگ وسط
            const qrSize = 560;
            ctx.drawImage(qr, (W - qrSize) / 2, 385, qrSize, qrSize);

            // ردیف لوگو + نام کسب‌وکار (لوگو راست، نام کنارش)
            const logoR = 62;
            const gap = 22;
            const rowY = 1105;
            ctx.font = `bold 42px ${CANVAS_FONT}`;
            const nameWidth = ctx.measureText(catalogName || '').width;
            const rowW = logoR * 2 + gap + nameWidth;
            const rowRight = W / 2 + rowW / 2;
            const logoCx = rowRight - logoR;

            const logo = logoUrl ? await loadImageCached(logoUrl) : null;
            if (logo) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(logoCx, rowY, logoR, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(logo, logoCx - logoR, rowY - logoR, logoR * 2, logoR * 2);
                ctx.restore();
                ctx.strokeStyle = 'rgba(26,28,30,0.12)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(logoCx, rowY, logoR, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // فال‌بک: دایرهٔ کهربایی با حرف اول نام
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(logoCx, rowY, logoR, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.font = `bold 58px ${CANVAS_FONT}`;
                ctx.fillText((catalogName || 'ک').trim().charAt(0), logoCx, rowY + 20);
            }

            // نام کسب‌وکار — کنار لوگو
            ctx.textAlign = 'right';
            ctx.direction = 'rtl';
            ctx.fillStyle = '#1a1c1e';
            ctx.font = `bold 42px ${CANVAS_FONT}`;
            ctx.fillText(catalogName || '', logoCx - logoR - gap, rowY + 15);

            // آدرس کاتالوگ — کوچک و خوانا پایین
            ctx.textAlign = 'center';
            ctx.direction = 'ltr';
            ctx.fillStyle = '#6b7280';
            ctx.font = `28px ${CANVAS_FONT}`;
            ctx.fillText(url.replace(/^https?:\/\//, ''), W / 2, 1258);

            triggerDownload(c.toDataURL('image/png'), `catalog-print-${slug || 'poster'}.png`);
            toast.success('پوستر چاپی دانلود شد');
        } catch {
            toast.error('ساخت تصویر چاپی ممکن نشد');
        } finally {
            setPosterBusy(false);
        }
    };

    /** ۳) کارت ویزیت — دانلود پیش‌نمایشِ رسم‌شده */
    const downloadCard = () => {
        const canvas = cardCanvasRef.current;
        if (!canvas) return;
        try {
            triggerDownload(canvas.toDataURL('image/png'), `business-card-${slug || 'catalog'}.png`);
            toast.success('کارت ویزیت دانلود شد — آمادهٔ چاپ ۹×۵');
        } catch {
            toast.error('دانلود کارت ممکن نشد');
        }
    };

    /** چرخش عکس پس‌زمینه: عکس خودم → نمونه‌ها → بدون عکس → ... */
    const changeBg = () => {
        if (customBg) {
            setCustomBg(null);
            setBgIdx(0);
            return;
        }
        setBgIdx((i) => (i + 1 >= CARD_BACKGROUNDS.length ? -1 : i + 1));
    };

    const onPickBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => setCustomBg(String(reader.result));
        reader.readAsDataURL(f);
        e.target.value = '';
    };

    const onPickLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => setCustomLogo(String(reader.result));
        reader.readAsDataURL(f);
        e.target.value = '';
    };

    /** بازگرداندن همه‌چیز به پیش‌فرض کاتالوگ */
    const resetCard = () => {
        setThemeIdx(0);
        setCustomColor(null);
        setBgIdx(-1);
        setCustomBg(null);
        setCustomLogo(null);
        setOverlayPct(45);
        setCardName(catalogName || '');
        setSlogan(deriveSlogan(description));
        setCardPhone(phone || '');
        setCardCaption(DEFAULT_CAPTION);
        toast.success('کارت به حالت پیش‌فرض برگشت');
    };

    const isPhotoActive = !!customBg || bgIdx >= 0;

    const ActionBtn = ({ icon: Icon, label, onClick }: any) => (
        <button onClick={onClick}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-outline-variant/40 dark:border-gray-700 hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-on-surface">
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    );

    const modalContent = (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[90dvh] overflow-y-auto scrollbar-slim text-on-surface">
                <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
                    <h3 className="text-sm font-extrabold">کیت اشتراک‌گذاری کاتالوگ</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container-high dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="bg-primary/5 border border-primary/15 dark:border-primary/25 rounded-xl p-3.5 text-xs leading-6 text-on-surface-variant">
                        کاتالوگ وقتی مشتری می‌آورد که <b>دیده شود</b>. لینک را در بیو اینستاگرام بگذار، برای مشتری‌های واتساپی‌ات بفرست یا در گروههای تلگرامی به اشتراک بگذار،
                        یا QR و کارت ویزیتت را چاپ کن.
                    </div>

                    {/* ✅ لینک خالص — قابل کپی */}
                    <div className="flex items-center gap-2 rounded-xl border border-outline-variant/40 dark:border-gray-700 bg-surface-container-low/60 dark:bg-gray-800/60 p-3">
                        <span dir="ltr" className="flex-1 text-[13px] font-bold text-on-surface truncate">
                            {url || '...'}
                        </span>
                        <button type="button" onClick={copy} disabled={!url}
                                aria-label="کپی لینک"
                                className={cn(
                                    'w-9 h-9 rounded-full grid place-items-center flex-shrink-0 transition-all',
                                    copied ? 'bg-emerald-500 text-white' : 'bg-primary text-on-primary active:scale-90',
                                )}>
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* اکشن‌ها */}
                    <div className="grid grid-cols-4 gap-2">
                        <ActionBtn icon={MessageCircle} label="واتساپ" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank')} />
                        <ActionBtn icon={Send} label="تلگرام" onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`کاتالوگ ${catalogName}`)}`, '_blank')} />
                        <ActionBtn icon={copied ? Check : Copy} label={copied ? 'کپی شد' : 'کپی لینک'} onClick={copy} />
                        <ActionBtn icon={Share2} label="سایر" onClick={nativeShare} />
                    </div>

                    {/* QR چاپی + کارت ویزیت — خروجی‌های تصویری */}
                    {url && (
                        <div className="rounded-xl border border-dashed border-outline-variant/50 dark:border-gray-700 p-3 space-y-3">
                            {/* 🔧 QR مخفیِ محلی برای رسم کانواس — بدون این، دانلودها بی‌صدا هیچ می‌کنند */}
                            <div className="hidden" aria-hidden="true">
                                <QRCodeCanvas id="dm-print-qr" value={url} size={1024} level="Q" marginSize={2}
                                              bgColor="#ffffff" fgColor="#111827" />
                            </div>

                            <div className="flex items-center gap-3">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`}
                                    alt="QR کاتالوگ"
                                    className="w-20 h-20 rounded-lg bg-white p-1 border border-outline-variant/30 dark:border-gray-700"
                                    loading="lazy"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-primary" /> QR کاتالوگ</p>
                                    <p className="text-[10px] text-on-surface-variant/70 leading-5 mt-1">
                                        برای ویترین مغازه یا کارت ویزیت — دانلود کن، چاپ کن؛ مشتری با اسکن مستقیم به کاتالوگت می‌رسد.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={downloadPrintPoster} disabled={posterBusy}
                                        className="h-10 rounded-lg bg-primary text-on-primary text-[11px] font-extrabold
                                            flex items-center justify-center gap-1.5 hover:bg-primary/90 active:scale-[0.97]
                                            disabled:opacity-60 transition-all">
                                    {posterBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                    دانلود برای چاپ
                                </button>
                                <button type="button" onClick={downloadSimpleQr}
                                        className="h-10 rounded-lg border border-outline-variant/50 dark:border-gray-700 text-[11px] font-bold
                                            text-on-surface-variant hover:text-primary hover:border-primary/40 active:scale-[0.97]
                                            flex items-center justify-center gap-1.5 transition-all">
                                    <Download className="w-4 h-4" /> فقط تصویر QR
                                </button>
                            </div>

                            {/* 🪪 تولید کارت ویزیت — گزینهٔ جداگانه بنا بر ایدهٔ کاربر */}
                            <button type="button" onClick={() => setCardOpen((o) => !o)}
                                    className={cn(
                                        'h-10 w-full rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]',
                                        cardOpen
                                            ? 'bg-primary/10 text-primary border border-primary/30 dark:border-primary/40'
                                            : 'bg-amber-500 text-white hover:bg-amber-600',
                                    )}>
                                <IdCard className="w-4 h-4" />
                                {cardOpen ? 'بستن کارت ویزیت' : 'تولید کارت ویزیت'}
                            </button>

                            {/* 🎨 سازندهٔ کارت ویزیت — پیش‌نمایش زنده + شخصی‌سازی کامل */}
                            {cardOpen && (
                                <div className="space-y-3 rounded-xl border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 p-3">
                                    <div>
                                        <p className="text-xs font-bold flex items-center gap-1.5 text-on-surface">
                                            <IdCard className="w-3.5 h-3.5 text-primary" /> کارت ویزیت حرفه‌ای
                                        </p>
                                        <p className="text-[10px] text-on-surface-variant/70 leading-5 mt-1">
                                            لوگو، عنوان، شعار، تماس و نوشتهٔ زیر QR همه قابل ویرایش‌اند — اندازهٔ استاندارد ۹×۵ سانتی‌متر.
                                        </p>
                                    </div>

                                    <canvas ref={cardCanvasRef} width={1050} height={600}
                                            className="w-full h-auto rounded-xl border border-outline-variant/30 dark:border-gray-700 bg-white shadow-sm" />

                                    {/* تم رنگ — آماده + کالر‌سلکتور آزاد */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold text-on-surface-variant">تم رنگ:</span>
                                        {CARD_THEMES.map((t, i) => (
                                            <button key={t.key} type="button"
                                                    onClick={() => { setThemeIdx(i); setCustomColor(null); }}
                                                    title={t.name} aria-label={`تم ${t.name}`}
                                                    className={cn(
                                                        'w-8 h-8 rounded-full transition-all',
                                                        !customColor && themeIdx === i
                                                            ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900 scale-110'
                                                            : 'ring-1 ring-outline-variant/50 dark:ring-gray-700 hover:scale-105',
                                                    )}
                                                    style={{ background: `linear-gradient(135deg, ${t.bg1}, ${t.bg2})` }} />
                                        ))}
                                        <label className={cn(
                                                'relative w-8 h-8 rounded-full cursor-pointer transition-all',
                                                customColor
                                                    ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900 scale-110'
                                                    : 'ring-1 ring-outline-variant/50 dark:ring-gray-700 hover:scale-105',
                                            )}
                                            style={{ background: 'conic-gradient(#f87171,#fbbf24,#34d399,#60a5fa,#c084fc,#f87171)' }}
                                            title="رنگ دلخواه">
                                            <input type="color" value={customColor || '#f59e0b'}
                                                   onChange={(e) => setCustomColor(e.target.value)}
                                                   aria-label="انتخاب رنگ دلخواه"
                                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        </label>
                                        {customColor && (
                                            <button type="button" onClick={() => setCustomColor(null)}
                                                    className="h-7 px-2.5 rounded-lg text-[10px] font-bold text-red-600 dark:text-red-400
                                                        hover:bg-red-500/10 active:scale-95 flex items-center gap-1 transition-all">
                                                <XCircle className="w-3.5 h-3.5" /> حذف رنگ دلخواه
                                            </button>
                                        )}
                                    </div>

                                    {/* پس‌زمینه + اسلایدر تاریکی */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button type="button" onClick={changeBg}
                                                className="h-8 px-3 rounded-lg border border-outline-variant/50 dark:border-gray-700 text-[10px] font-bold
                                                    text-on-surface hover:border-primary/40 hover:text-primary active:scale-95
                                                    flex items-center gap-1.5 transition-all">
                                            <RefreshCw className="w-3.5 h-3.5" /> تغییر عکس پس‌زمینه
                                        </button>
                                        <button type="button" onClick={() => bgFileRef.current?.click()}
                                                className="h-8 px-3 rounded-lg border border-outline-variant/50 dark:border-gray-700 text-[10px] font-bold
                                                    text-on-surface hover:border-primary/40 hover:text-primary active:scale-95
                                                    flex items-center gap-1.5 transition-all">
                                            <ImageUp className="w-3.5 h-3.5" /> عکس خودم
                                        </button>
                                        {isPhotoActive && (
                                            <button type="button" onClick={() => { setCustomBg(null); setBgIdx(-1); }}
                                                    className="h-8 px-3 rounded-lg text-[10px] font-bold text-red-600 dark:text-red-400
                                                        hover:bg-red-500/10 active:scale-95 flex items-center gap-1.5 transition-all">
                                                <XCircle className="w-3.5 h-3.5" /> حذف عکس
                                            </button>
                                        )}
                                        <input ref={bgFileRef} type="file" accept="image/*" hidden onChange={onPickBgFile} />
                                    </div>
                                    {isPhotoActive && (
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-[10px] font-bold text-on-surface-variant flex-shrink-0">تاریکی پشت متن‌ها:</span>
                                            <input type="range" min={0} max={85} value={overlayPct}
                                                   onChange={(e) => setOverlayPct(Number(e.target.value))}
                                                   aria-label="تاریکی پس‌زمینه"
                                                   className="flex-1 h-1.5 accent-amber-500 cursor-pointer" />
                                            <span className="text-[10px] font-bold text-on-surface w-8 text-center">{faDigits(String(overlayPct))}٪</span>
                                        </div>
                                    )}

                                    {/* لوگو — انتخابی یا لوگوی کاتالوگ */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold text-on-surface-variant">لوگو:</span>
                                        <button type="button" onClick={() => logoFileRef.current?.click()}
                                                className="h-8 px-3 rounded-lg border border-outline-variant/50 dark:border-gray-700 text-[10px] font-bold
                                                    text-on-surface hover:border-primary/40 hover:text-primary active:scale-95
                                                    flex items-center gap-1.5 transition-all">
                                            <ImageUp className="w-3.5 h-3.5" /> {customLogo ? 'تعویض لوگو' : 'لوگوی دلخواه'}
                                        </button>
                                        {customLogo && (
                                            <button type="button" onClick={() => setCustomLogo(null)}
                                                    className="h-8 px-3 rounded-lg text-[10px] font-bold text-red-600 dark:text-red-400
                                                        hover:bg-red-500/10 active:scale-95 flex items-center gap-1.5 transition-all">
                                                <XCircle className="w-3.5 h-3.5" /> برگشت به لوگوی کاتالوگ
                                            </button>
                                        )}
                                        <input ref={logoFileRef} type="file" accept="image/*" hidden onChange={onPickLogoFile} />
                                    </div>

                                    {/* متن‌های قابل ویرایش */}
                                    <div className="grid grid-cols-1 gap-2">
                                        <label className="block">
                                            <span className="text-[10px] font-bold text-on-surface-variant">عنوان:</span>
                                            <input value={cardName} onChange={(e) => setCardName(e.target.value)} maxLength={48} dir="rtl"
                                                   placeholder="نام کسب‌وکار"
                                                   className="mt-0.5 w-full h-9 rounded-lg border border-outline-variant/40 dark:border-gray-700
                                                       bg-white dark:bg-gray-900 px-3 text-xs text-on-surface placeholder:text-on-surface-variant/40
                                                       outline-none focus:border-primary/50 transition-colors" />
                                        </label>
                                        <label className="block">
                                            <span className="text-[10px] font-bold text-on-surface-variant">شعار:</span>
                                            <input value={slogan} onChange={(e) => setSlogan(e.target.value)} maxLength={80} dir="rtl"
                                                   placeholder="مثلاً بهترین قیمت عمده در شهر"
                                                   className="mt-0.5 w-full h-9 rounded-lg border border-outline-variant/40 dark:border-gray-700
                                                       bg-white dark:bg-gray-900 px-3 text-xs text-on-surface placeholder:text-on-surface-variant/40
                                                       outline-none focus:border-primary/50 transition-colors" />
                                        </label>
                                        <label className="block">
                                            <span className="text-[10px] font-bold text-on-surface-variant">شماره تماس:</span>
                                            <input value={cardPhone} onChange={(e) => setCardPhone(e.target.value)} maxLength={20} dir="ltr"
                                                   placeholder="09123456789"
                                                   className="mt-0.5 w-full h-9 rounded-lg border border-outline-variant/40 dark:border-gray-700
                                                       bg-white dark:bg-gray-900 px-3 text-xs text-on-surface placeholder:text-on-surface-variant/40
                                                       outline-none focus:border-primary/50 transition-colors text-left" />
                                        </label>
                                        <label className="block">
                                            <span className="text-[10px] font-bold text-on-surface-variant">نوشتهٔ زیر QR:</span>
                                            <input value={cardCaption} onChange={(e) => setCardCaption(e.target.value)} maxLength={50} dir="rtl"
                                                   placeholder={DEFAULT_CAPTION}
                                                   className="mt-0.5 w-full h-9 rounded-lg border border-outline-variant/40 dark:border-gray-700
                                                       bg-white dark:bg-gray-900 px-3 text-xs text-on-surface placeholder:text-on-surface-variant/40
                                                       outline-none focus:border-primary/50 transition-colors" />
                                        </label>
                                    </div>

                                    <button type="button" onClick={downloadCard}
                                            className="h-10 w-full rounded-lg bg-primary text-on-primary text-[11px] font-extrabold
                                                flex items-center justify-center gap-1.5 hover:bg-primary/90 active:scale-[0.98] transition-all">
                                        <Download className="w-4 h-4" /> دانلود کارت ویزیت
                                    </button>
                                    <div className="flex items-center justify-between gap-2">
                                        <button type="button" onClick={resetCard}
                                                className="text-[10px] font-bold text-on-surface-variant/80 hover:text-primary
                                                    flex items-center gap-1 transition-colors">
                                            <RotateCcw className="w-3 h-3" /> بازگرداندن پیش‌فرض‌ها
                                        </button>
                                        <p className="text-[10px] text-on-surface-variant/60 leading-5 text-left">
                                            فایل PNG آمادهٔ چاپخانه است.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <p className="text-[10px] text-on-surface-variant/60 leading-5">
                                نسخهٔ چاپی شامل متن راهنما، لوگو و نام کسب‌وکار توست — آمادهٔ قاب ویترین.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // ✅ الگوی استاندارد portal
    return createPortal(modalContent, document.body);
}
