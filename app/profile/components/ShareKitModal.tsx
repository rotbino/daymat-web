// app/profile/components/ShareKitModal.tsx
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { X, Copy, MessageCircle, Send, Share2, QrCode, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onClose: () => void;
    catalogName: string;
    slug?: string;
}

export default function ShareKitModal({ open, onClose, catalogName, slug }: Props) {
    const [copied, setCopied] = useState(false);
    if (!open) return null;

    const url = typeof window !== 'undefined' && slug ? `${window.location.origin}/c/${slug}` : '';
    const message = `کاتالوگ ${catalogName} — قیمت‌ها و محصولات:\n${url}`;

    const copy = async () => {
        await navigator.clipboard.writeText(message).catch(() => {});
        setCopied(true);
        toast.success('لینک کاتالوگ کپی شد — حالا در بیو اینستاگرام یا گروه واتساپت بگذار');
        setTimeout(() => setCopied(false), 2000);
    };

    const nativeShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: `کاتالوگ ${catalogName}`, text: message, url }); } catch {}
        } else copy();
    };

    const ActionBtn = ({ icon: Icon, label, onClick, cls }: any) => (
        <button onClick={onClick}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border border-outline-variant/40 hover:border-primary/40 hover:bg-primary/5 transition-colors ${cls}`}>
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    );

    return (
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
                        کاتالوگ وقتی مشتری می‌آورد که <b>دیده شود</b>. لینک را در بیو اینستاگرام بگذار، برای مشتری‌های واتساپی‌ات بفرست،
                        یا QR را روی ویترین/کارت‌ویزیتت چاپ کن.
                    </div>

                    {/* پیش‌نمایش پیام */}
                    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/60 p-3">
                        <p className="text-[10px] font-bold text-on-surface-variant/60 mb-1.5">پیام پیشنهادی:</p>
                        <p className="text-xs leading-6 whitespace-pre-line">{message || 'لینک کاتالوگ در دسترس نیست'}</p>
                    </div>

                    {/* اکشن‌ها */}
                    <div className="grid grid-cols-4 gap-2">
                        <ActionBtn icon={MessageCircle} label="واتساپ" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')} />
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
}