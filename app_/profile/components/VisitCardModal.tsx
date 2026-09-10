// app_/profile/components/VisitCardModal.tsx
// استودیوی کارت ویزیت — مستقل از کیت اشتراک‌گذاری (بنا بر خواستهٔ کاربر از کیت بیرون آمد)
//   • ۷ قالب پس‌زمینهٔ آمادهٔ /public/visit-card/1..7.jpg به‌صورت نوار افقی + «عکس دلخواه»
//   • پیش‌فرض: قالب ۱ — تاریکی عکس با اسلایدر (۰ تا ۸۵٪)
//   • پنل شیشه‌ای (شیشه‌مorphism ترند روز) پشت متن‌ها → خوانا روی هر قالبی
//   • لوگوی بزرگ بدون پدینگ و بدون بشقاب (خواستهٔ کاربر) + امکان تعویض لوگو
//   • ویرایش عنوان/شعار/تماس/نوشتهٔ زیر QR + تم‌های آماده + کالر‌سلکتور آزاد
//   • امضای برند: آیکون dm دیمت + اسلاگ (به‌جای چاپ آدرس کامل) — برندسازی دیمت
// ⚠️ قانون: حالت تاریک همیشه چک شده
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Download, Loader2, IdCard, ImageUp, XCircle, RotateCcw, Palette,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils/utils";
import {
    CANVAS_FONT, DEFAULT_CAPTION, DAYMAT_BADGE_SRC, faDigits,
    CARD_THEMES, buildCustomTheme,
    deriveSlogan, triggerDownload, getQrCanvas, loadImageCached,
    roundRectPath, wrapText, regionLuminance, drawWithHalo,
    type CardTheme,
} from './visitCardShared';

interface Props {
    open: boolean;
    onClose: () => void;
    catalogName: string;
    slug?: string;
    /** لوگوی کاتالوگ — نبودش حرف اول نام می‌نشیند */
    logoUrl?: string;
    /** شمارهٔ تماس کسب‌وکار — پیش‌فرض کارت */
    phone?: string;
    /** معرفی کوتاه کاتالوگ — پیش‌فرض شعار */
    description?: string;
}

/* ۷ قالب آمادهٔ برند — هم‌مبدأ و بدون دردسر CORS */
const BG_TEMPLATES = Array.from({ length: 7 }, (_, i) => `/visit-card/${i + 1}.jpg`);

const W = 1050, H = 600; // ۹×۵ سانتی‌متر در ۳۰۰dpi

export default function VisitCardModal({ open, onClose, catalogName, slug, logoUrl, phone, description }: Props) {
    const [mounted, setMounted] = useState(false);
    const [busy, setBusy] = useState(false);

    // ─── وضعیت کارت ───
    const [themeIdx, setThemeIdx] = useState(0);
    const [customColor, setCustomColor] = useState<string | null>(null); // کالر‌سلکتور آزاد
    const [bgIdx, setBgIdx] = useState(0);          // قالب ۱ = پیش‌فرض (خواستهٔ کاربر)؛ -1 = بدون عکس
    const [customBg, setCustomBg] = useState<string | null>(null);
    const [customLogo, setCustomLogo] = useState<string | null>(null);
    const [overlayPct, setOverlayPct] = useState(0); // قالب‌ها روشن‌اند — تاریکی پیش‌فرض صفر
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
        ? `${window.location.origin}/${slug}`
        : '';

    // شروع تازه با هر باز شدن — پیش‌فرض‌ها از مشخصات کاتالوگ (تم انتخابی می‌ماند)
    useEffect(() => {
        if (!open) return;
        setCardName(catalogName || '');
        setSlogan(deriveSlogan(description));
        setCardPhone(phone || '');
        setCardCaption(DEFAULT_CAPTION);
        setBgIdx(0);
        setCustomBg(null);
        setCustomLogo(null);
        setCustomColor(null);
        setOverlayPct(0);
    }, [open, catalogName, phone, description]);

    // ─── رسم کارت ۱۰۵۰×۶۰۰ ───
    const drawCard = useCallback(async () => {
        const canvas = cardCanvasRef.current;
        if (!canvas || !open) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const token = ++drawTokenRef.current;
        const F = canvasFontRef.current;

        canvas.width = W;
        canvas.height = H;
        try { await document.fonts.ready; } catch {}
        if (token !== drawTokenRef.current) return;

        const th: CardTheme = customColor ? buildCustomTheme(customColor) : CARD_THEMES[themeIdx];
        const accent = th.accent;

        // ─── پس‌زمینه: قالب/عکس دلخواه + اسلایدر تاریکی | یا گرادیان تم ───
        const bgSrc = customBg ?? (bgIdx >= 0 ? BG_TEMPLATES[bgIdx] : null);
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

        // ─── پنل شیشه‌ای پشت ستون متن (فقط حالت عکس) — گلس‌مورفیسم ترند روز ───
        let RX = W - 64;              // لبهٔ راست متن
        if (painted) {
            const px = 470, py = 34, pw = 536, ph = H - 68;
            ctx.save();
            ctx.shadowColor = 'rgba(15,23,42,0.20)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 8;
            ctx.fillStyle = 'rgba(255,255,255,0.74)';
            roundRectPath(ctx, px, py, pw, ph, 30);
            ctx.fill();
            ctx.restore();
            ctx.strokeStyle = 'rgba(255,255,255,0.65)';
            ctx.lineWidth = 1.5;
            roundRectPath(ctx, px, py, pw, ph, 30);
            ctx.stroke();
            // نوار لهجهٔ گرد لبهٔ راست پنل
            ctx.fillStyle = accent;
            roundRectPath(ctx, px + pw - 12, py + 24, 6, ph - 48, 3);
            ctx.fill();
            RX = px + pw - 34;
        }
        const CX = 504;               // لبهٔ چپ ستون متن
        // روی پنل شیشه‌ای جوهر تیره؛ روی تم گرادیانی رنگ خود تم
        const ink = painted ? '#101418' : th.text;
        const sub = painted ? '#4b5563' : th.muted;

        // ─── تزئینات کوچک لبهٔ بالا-چپ روی پس‌زمینه ───
        ctx.fillStyle = accent;
        roundRectPath(ctx, 54, 46, 64, 5, 2.5);
        ctx.fill();
        ctx.save();
        ctx.globalAlpha = 0.45;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(62 + i * 18, 66, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // ─── برچسب پیل «کاتالوگ آنلاین» ───
        ctx.font = `bold 17px ${F}`;
        ctx.direction = 'rtl';
        const pillLabel = 'کاتالوگ آنلاین';
        const pillW = ctx.measureText(pillLabel).width + 36;
        const pillX = RX - pillW, pillY = 58;
        ctx.fillStyle = accent;
        roundRectPath(ctx, pillX, pillY, pillW, 32, 16);
        ctx.fill();
        ctx.fillStyle = th.accentText;
        ctx.textAlign = 'center';
        ctx.fillText(pillLabel, pillX + pillW / 2, pillY + 22);

        // ─── لوگوی بزرگ — بدون پدینگ و بدون بشقاب (خواستهٔ کاربر) ───
        const logoTop = 104;
        const logoMaxH = 174, logoMaxW = RX - CX;
        const logoSrc = customLogo ?? logoUrl;
        const logo = logoSrc ? await loadImageCached(logoSrc) : null;
        if (token !== drawTokenRef.current) return;
        let logoBottom = logoTop + 112;
        if (logo) {
            const s = Math.min(logoMaxW / logo.width, logoMaxH / logo.height);
            const lw = logo.width * s, lh = logo.height * s;
            const lx = RX - lw, ly = logoTop;
            if (!painted) {
                // روی تمِ تیره، بک‌دراپ سفید دقیقاً هم‌اندازهٔ لوگو (نه پدینگ اضافه)
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.18)';
                ctx.shadowBlur = 14;
                ctx.fillStyle = 'rgba(255,255,255,0.94)';
                roundRectPath(ctx, lx - 10, ly - 10, lw + 20, lh + 20, 18);
                ctx.fill();
                ctx.restore();
            }
            ctx.drawImage(logo, lx, ly, lw, lh);
            logoBottom = ly + lh;
        } else {
            // فال‌بک: نشان حرف اول — مربع گرد لهجه
            const ms = 112, mx = RX - ms;
            ctx.fillStyle = accent;
            roundRectPath(ctx, mx, logoTop, ms, ms, 24);
            ctx.fill();
            ctx.fillStyle = th.accentText;
            ctx.textAlign = 'center';
            ctx.direction = 'rtl';
            ctx.font = `800 54px ${F}`;
            ctx.fillText((cardName || 'ک').trim().charAt(0), mx + ms / 2, logoTop + 74);
        }

        // ─── نام کسب‌وکار — کوچک‌شدن خودکار ───
        ctx.textAlign = 'right';
        ctx.direction = 'rtl';
        ctx.fillStyle = ink;
        const nameY = Math.min(352, Math.max(240, logoBottom + 58));
        let nameSize = 46;
        ctx.font = `800 ${nameSize}px ${F}`;
        while (ctx.measureText(cardName || '').width > RX - CX && nameSize > 28) {
            nameSize -= 3;
            ctx.font = `800 ${nameSize}px ${F}`;
        }
        ctx.fillText(cardName || '', RX, nameY);

        // ─── شعار — حداکثر دو خط ───
        const sl = (slogan || '').trim();
        let sloganLines: string[] = [];
        if (sl) {
            ctx.font = `25px ${F}`;
            sloganLines = wrapText(ctx, sl, RX - CX).slice(0, 2);
            ctx.fillStyle = sub;
            sloganLines.forEach((ln, i) => ctx.fillText(ln, RX, nameY + 48 + i * 38));
        }

        // ─── جداکنندهٔ لهجه + تماس ───
        const dividerY = nameY + (sloganLines.length ? 126 : 84);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(RX - 150, dividerY);
        ctx.lineTo(RX, dividerY);
        ctx.stroke();
        if (cardPhone.trim()) {
            ctx.textAlign = 'right';
            ctx.direction = 'rtl';
            ctx.fillStyle = ink;
            ctx.font = `bold 29px ${F}`;
            ctx.fillText(`تماس: ${faDigits(cardPhone.trim())}`, RX, dividerY + 56);
        }

        // ─── ستون چپ: QR روی بشقاب سفید + زیرنویس قابل ویرایش ───
        const plateS = 300, plateX = 54, plateY = 96;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
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
        const qr = getQrCanvas('dm-card-qr');
        if (qr) {
            const inner = plateS - 40;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(qr, plateX + 20, plateY + 20, inner, inner);
        }

        // رنگ خودکار متن بیرون از پنل — از روشنایی واقعی پس‌زمینه (زیر QR و امضا)
        const lum = painted ? regionLuminance(canvas, 40, 430, 410, 150) : (th.text === '#ffffff' ? 0.25 : 0.85);
        const outInk = lum > 0.55 ? '#0f172a' : '#ffffff';
        const outHalo = lum > 0.55 ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.5)';

        const cap = (cardCaption || '').trim();
        if (cap) {
            ctx.textAlign = 'center';
            ctx.direction = 'rtl';
            let cs = 21;
            ctx.font = `bold ${cs}px ${F}`;
            while (ctx.measureText(cap).width > plateS + 60 && cs > 15) {
                cs -= 1;
                ctx.font = `bold ${cs}px ${F}`;
            }
            drawWithHalo(ctx, cap, plateX + plateS / 2, 448, outInk, outHalo);
        }

        // ─── امضای برند دیمت: آیکون dm + اسلاگ (به‌جای آدرس کامل — خواستهٔ کاربر) ───
        const slugText = (slug || '').trim();
        if (slugText) {
            const isFa = /[\u0600-\u06FF]/.test(slugText);
            let ss = 22;
            ctx.font = `bold ${ss}px ${F}`;
            while (ctx.measureText(slugText).width > 300 && ss > 14) {
                ss -= 1;
                ctx.font = `bold ${ss}px ${F}`;
            }
            const textW = ctx.measureText(slugText).width;
            const badgeS = 42, gap = 12;
            const groupW = badgeS + gap + textW;
            const gx = plateX + plateS / 2 - groupW / 2;
            const badge = await loadImageCached(DAYMAT_BADGE_SRC);
            if (token !== drawTokenRef.current) return;
            const textY = 530;
            if (isFa) {
                // اسلاگ فارسی: آیکون سمت راستِ متن
                if (badge) ctx.drawImage(badge, gx + groupW - badgeS, textY - 30, badgeS, badgeS);
                ctx.textAlign = 'right';
                ctx.direction = 'rtl';
                drawWithHalo(ctx, slugText, gx + groupW - badgeS - gap, textY, outInk, outHalo);
            } else {
                if (badge) ctx.drawImage(badge, gx, textY - 30, badgeS, badgeS);
                ctx.textAlign = 'left';
                ctx.direction = 'ltr';
                drawWithHalo(ctx, slugText, gx + badgeS + gap, textY, outInk, outHalo);
            }
        }
    }, [open, themeIdx, customColor, bgIdx, customBg, customLogo, overlayPct, cardName, slogan, cardPhone, cardCaption, logoUrl, slug, url]);

    // رسم مجدد پیش‌نمایش با هر تغییر
    useEffect(() => {
        if (!open) return;
        drawCard();
    }, [open, fontsReady, drawCard]);

    if (!mounted) return null;
    if (!open) return null;

    const downloadCard = () => {
        const canvas = cardCanvasRef.current;
        if (!canvas || busy) return;
        setBusy(true);
        try {
            triggerDownload(canvas.toDataURL('image/png'), `business-card-${slug || 'catalog'}.png`);
            toast.success('کارت ویزیت دانلود شد — آمادهٔ چاپ ۹×۵');
        } catch {
            toast.error('دانلود کارت ممکن نشد');
        } finally {
            setBusy(false);
        }
    };

    const onPickBgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => { setCustomBg(String(reader.result)); setBgIdx(-1); };
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
        setBgIdx(0);
        setCustomBg(null);
        setCustomLogo(null);
        setOverlayPct(0);
        setCardName(catalogName || '');
        setSlogan(deriveSlogan(description));
        setCardPhone(phone || '');
        setCardCaption(DEFAULT_CAPTION);
        toast.success('کارت به حالت پیش‌فرض برگشت');
    };

    const isPhotoActive = !!customBg || bgIdx >= 0;
    const isNoPhoto = !customBg && bgIdx < 0; // کاشی «بدون عکس»
    const selectedBg: number | 'custom' = customBg ? 'custom' : bgIdx;

    const tileCls = (active: boolean) => cn(
        'flex-shrink-0 w-[68px] h-12 rounded-lg overflow-hidden transition-all grid place-items-center',
        active
            ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900 scale-105'
            : 'ring-1 ring-outline-variant/50 dark:ring-gray-700 hover:ring-primary/40 opacity-90 hover:opacity-100',
    );

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[92dvh] overflow-y-auto scrollbar-slim text-on-surface">
                {/* هدر مودال */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <h3 className="text-sm font-extrabold flex items-center gap-2">
                        <IdCard className="w-4 h-4 text-primary" /> استودیو کارت ویزیت
                    </h3>
                    <button onClick={onClose} aria-label="بستن"
                            className="p-1.5 rounded-full hover:bg-surface-container-high dark:hover:bg-gray-800 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4 space-y-3.5">
                    <p className="text-[11px] leading-5 text-on-surface-variant/80 bg-primary/5 border border-primary/15 dark:border-primary/25 rounded-xl p-3">
                        اندازهٔ استاندارد چاپ <b>۹×۵ سانتی‌متر</b> — قالب، لوگو، عنوان، شعار، تماس و نوشتهٔ زیر QR همه قابل تغییرند.
                    </p>

                    {/* 🔧 QR مخفیِ محلی برای رسم کانواس */}
                    {url && (
                        <div className="hidden" aria-hidden="true">
                            <QRCodeCanvas id="dm-card-qr" value={url} size={1024} level="Q" marginSize={2}
                                          bgColor="#ffffff" fgColor="#111827" />
                        </div>
                    )}

                    <canvas ref={cardCanvasRef} width={W} height={H}
                            className="w-full h-auto rounded-xl border border-outline-variant/30 dark:border-gray-700 bg-white shadow-sm" />

                    {/* 🖼 قالب‌های پس‌زمینه — نوار افقی ۱ تا ۷ + عکس دلخواه (خواستهٔ کاربر) */}
                    <div>
                        <p className="text-[10px] font-bold text-on-surface-variant mb-1.5">قالب پس‌زمینه:</p>
                        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-slim">
                            <button type="button" onClick={() => { setCustomBg(null); setBgIdx(-1); }}
                                    title="بدون عکس — فقط تم رنگی" aria-label="بدون عکس"
                                    className={cn(tileCls(isNoPhoto), 'flex-col gap-0.5')}>
                                <Palette className="w-4 h-4 text-primary" />
                                <span className="text-[8px] font-bold text-on-surface-variant">بدون عکس</span>
                            </button>
                            {BG_TEMPLATES.map((src, i) => (
                                <button key={src} type="button"
                                        onClick={() => { setCustomBg(null); setBgIdx(i); }}
                                        title={`قالب ${faDigits(String(i + 1))}`}
                                        aria-label={`قالب ${faDigits(String(i + 1))}`}
                                        className={tileCls(selectedBg === i)}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                                </button>
                            ))}
                            <button type="button" onClick={() => bgFileRef.current?.click()}
                                    title="عکس دلخواه" aria-label="عکس دلخواه"
                                    className={cn(tileCls(selectedBg === 'custom'), 'flex-col gap-0.5 bg-surface-container-high/60 dark:bg-gray-800')}>
                                {customBg
                                    ? // eslint-disable-next-line @next/next/no-img-element
                                      <img src={customBg} alt="" className="w-full h-full object-cover" />
                                    : (
                                        <>
                                            <ImageUp className="w-4 h-4 text-primary" />
                                            <span className="text-[8px] font-bold text-on-surface-variant">عکس دلخواه</span>
                                        </>
                                    )}
                            </button>
                            <input ref={bgFileRef} type="file" accept="image/*" hidden onChange={onPickBgFile} />
                        </div>
                    </div>

                    {/* 🌓 اسلایدر تاریکی عکس */}
                    {isPhotoActive && (
                        <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-bold text-on-surface-variant flex-shrink-0">تاریکی عکس:</span>
                            <input type="range" min={0} max={85} value={overlayPct}
                                   onChange={(e) => setOverlayPct(Number(e.target.value))}
                                   aria-label="تاریکی پس‌زمینه"
                                   className="flex-1 h-1.5 accent-amber-500 cursor-pointer" />
                            <span className="text-[10px] font-bold text-on-surface w-8 text-center">{faDigits(String(overlayPct))}٪</span>
                        </div>
                    )}

                    {/* 🎨 تم رنگ — آماده + کالر‌سلکتور آزاد */}
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

                    {/* 🪪 لوگو — تعویض یا برگشت به لوگوی کاتالوگ */}
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

                    {/* ✍️ متن‌های قابل ویرایش */}
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
                        <div className="grid grid-cols-2 gap-2">
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
                    </div>

                    <button type="button" onClick={downloadCard} disabled={busy}
                            className="h-10 w-full rounded-lg bg-primary text-on-primary text-[11px] font-extrabold
                                flex items-center justify-center gap-1.5 hover:bg-primary/90 active:scale-[0.98]
                                disabled:opacity-60 transition-all">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        دانلود کارت ویزیت (PNG چاپی)
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
            </div>
        </div>,
        document.body,
    );
}
