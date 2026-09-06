// app_/profile/components/ShareKitModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, MessageCircle, Send, Share2, QrCode, Check } from 'lucide-react';
import { toast } from 'sonner';
import {cn} from "@/lib/utils/utils";

interface Props {
    open: boolean;
    onClose: () => void;
    catalogName: string;
    slug?: string;
}

export default function ShareKitModal({ open, onClose, catalogName, slug }: Props) {
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

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

    const ActionBtn = ({ icon: Icon, label, onClick }: any) => (
        <button onClick={onClick}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-outline-variant/40 hover:border-primary/40 hover:bg-primary/5 transition-colors">
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    );

    const modalContent = (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[90dvh] overflow-y-auto scrollbar-slim">
                <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 sticky top-0 bg-white dark:bg-gray-900">
                    <h3 className="text-sm font-extrabold">کیت اشتراک‌گذاری کاتالوگ</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container-high"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-3.5 text-xs leading-6 text-on-surface-variant">
                        کاتالوگ وقتی مشتری می‌آورد که <b>دیده شود</b>. لینک را در بیو اینستاگرام بگذار، برای مشتری‌های واتساپی‌ات بفرست یا در گروههای تلگرامی به اشتراک بگذار،
                        یا QR را روی ویترین/کارت‌ویزیتت چاپ کن.
                    </div>

                    {/* ✅ لینک خالص — قابل کپی */}
                    <div className="flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/60 p-3">
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

                    {/* QR چاپی */}
                    {url && (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-outline-variant/50 p-3">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`}
                                alt="QR کاتالوگ"
                                className="w-20 h-20 rounded-lg bg-white p-1 border border-outline-variant/30"
                                loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-primary" /> QR کاتالوگ</p>
                                <p className="text-[10px] text-on-surface-variant/70 leading-5 mt-1">
                                    روی ویترین مغازه یا کارت ویزیتت چاپ کن — مشتری با دوربین موبایلش مستقیم به کاتالوگ می‌رسد.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // ✅ الگوی استاندارد portal
    return createPortal(modalContent, document.body);
}