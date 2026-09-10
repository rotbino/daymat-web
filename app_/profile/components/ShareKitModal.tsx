// app_/profile/components/ShareKitModal.tsx
// کیت اشتراک‌گذاری کاتالوگ — لینک + پیام آماده + QR چاپی با دو حالت دانلود:
//   ۱) «دانلود برای چاپ» — پوستر طراحی‌شده: متن راهنما + QR بزرگ + لوگو و نام کسب‌وکار (آمادهٔ ویترین/کارت)
//   ۲) «فقط تصویر QR» — خود QR با حاشیهٔ سفید
// ⚠️ قانون: حالت تاریک همیشه چک شده
'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, MessageCircle, Send, Share2, QrCode, Check, Download, Loader2, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils/utils";

interface Props {
    open: boolean;
    onClose: () => void;
    catalogName: string;
    slug?: string;
    /** لوگوی کاتالوگ برای پوستر چاپی — اختیاری؛ نبودش حرف اول نام می‌نشیند */
    logoUrl?: string;
}

const CANVAS_FONT = 'Vazirmatn, "Noto Sans Arabic", Tahoma, sans-serif';

export default function ShareKitModal({ open, onClose, catalogName, slug, logoUrl }: Props) {
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [posterBusy, setPosterBusy] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;
    if (!open) return null;

    // ✅ URL خالص
    const url = typeof window !== 'undefined' && slug
        ? `${window.location.origin}/${slug}`   // ⚠️ اگر کاتالوگ هنوز در /c/ است: `/c/${slug}`
        : '';

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

    // ─── ابزارهای خروجی تصویر ───
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

    const loadImage = (src: string): Promise<HTMLImageElement | null> =>
        new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null); // فال‌بک بدون لوگو
            img.src = src;
        });

    const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
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
            // فونت وب قبل از رسم حتماً لود شده باشد
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

            const logo = logoUrl ? await loadImage(logoUrl) : null;
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
                        یا QR را روی ویترین/کارت‌ویزیتت چاپ کن.
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

                    {/* QR چاپی — با دو حالت دانلود */}
                    {url && (
                        <div className="rounded-xl border border-dashed border-outline-variant/50 dark:border-gray-700 p-3 space-y-3">
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
