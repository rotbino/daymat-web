// app/my-catalogs/components/EmptyCatalogState.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setUser } from '@/lib/store/slices/authSlice';
import { setCurrentInquiry } from '@/lib/store/slices/catalogSlice';
import { BookOpen, Key, ClipboardList, ExternalLink, Settings2 } from 'lucide-react';
import { ChangePasswordModal } from '@/components/register/ChangePasswordModal';

/**
 * گارد «هنوز بازوی فروش نداری» — با هشدار رمز موقت و CTA ساخت بازوی فروش
 * ✅ فیکس: کاربری که فقط بازوی خرید دارد (بازوی فروش ندارد) دیگر دست‌خالی نمی‌ماند —
 *    بازوهایش همین‌جا با دکمهٔ «مدیریت» لیست می‌شوند (پرش به کنسول بازوی خرید)
 */
export default function EmptyCatalogState({ hasTemporaryPassword, user, inquiries = [], onOpenInquiry }: {
    hasTemporaryPassword: boolean;
    user: any;
    /** بازوهای خرید من — محصول دوم دیمت، حتی بدون بازوی فروش قابل مدیریت است */
    inquiries?: any[];
    /** پرش به کنسول مدیریت بازوی خرید (/my-inquiries?catalog=…) */
    onOpenInquiry?: (id: string) => void;
}) {
    const router = useRouter();
    const dispatch = useDispatch();
    const [passwordOpen, setPasswordOpen] = useState(false);

    const openInquiry = (id: string) => {
        if (onOpenInquiry) { onOpenInquiry(id); return; }
        dispatch(setCurrentInquiry(id));
        router.push(`/my-inquiries?catalog=${id}`);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2.5">
                <h1 className="text-lg font-black text-on-surface flex items-center gap-1.5">
                    <BookOpen className="w-4.5 h-4.5 text-primary" /> بازوهای فروش و بازوهای من
                </h1>
            </div>

            {hasTemporaryPassword && (
                <button onClick={() => setPasswordOpen(true)}
                        className="w-full bg-error/5 border border-error/40 rounded-xl p-3 flex items-center gap-3 text-right hover:bg-error/10 transition-colors animate-pulse">
                    <Key className="w-4.5 h-4.5 text-error flex-shrink-0" />
                    <span className="text-xs text-on-surface flex-1">رمز عبور شما موقت است — <b className="text-error">همین حالا عوضش کن</b></span>
                </button>
            )}

            {/* ✅ بازوهای خرید من — حتی وقتی هیچ بازوی فروشی نیست (سناریوی «بازو اول») */}
            {inquiries.length > 0 && (
                <div className="space-y-2">
                    <h2 className="text-[11px] font-bold text-on-surface-variant/70 px-1">بازوهای خرید من</h2>
                    {inquiries.map((w: any) => (
                        <div key={w.id}
                             className="rounded-xl border border-brand-contrast-tint bg-brand-contrast-soft/40 dark:bg-amber-500/5 p-3 flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-lg bg-brand-contrast-soft dark:bg-amber-500/15 grid place-items-center flex-shrink-0">
                                <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-on-surface truncate">{w.title || w.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {w.status && (
                                        <span className={`text-[9px] font-bold rounded-full px-1.5 py-px flex-shrink-0 ${
                                            w.status === 'open'
                                                ? 'text-emerald-700 bg-emerald-500/10'
                                                : 'text-stone-400 bg-stone-100 dark:bg-gray-800'
                                        }`}>
                                            {w.status === 'open' ? 'در حال قیمت‌گیری' : 'متوقف'}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-on-surface-variant/70">
                                        {(w._count?.items ?? 0).toLocaleString('fa-IR')} قلم
                                    </span>
                                </div>
                            </div>
                            {w.slug && (
                                <a href={`/${w.slug}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   aria-label="مشاهده بازوی خرید"
                                   className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-amber-600 hover:bg-amber-500/10 active:scale-90 transition-all flex-shrink-0">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                            <button type="button" onClick={() => openInquiry(w.id)}
                                    className="h-8 px-3 rounded-lg bg-amber-500 text-white text-[11px] font-extrabold flex items-center gap-1.5 hover:bg-amber-600 active:scale-95 transition-all flex-shrink-0 shadow-sm">
                                <Settings2 className="w-3.5 h-3.5" /> مدیریت
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-lg border-2 border-primary/25 bg-gradient-to-br from-primary/8 via-primary/5 to-transparent p-6 text-center">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-base font-extrabold text-on-surface mb-1.5">بازوی فروش محصولاتت را بساز</h3>
                <p className="text-xs text-on-surface-variant leading-6 max-w-sm mx-auto">
                    با عکس و قیمت، با لینک اختصاصی — چند دقیقه بیشتر وقت نمی‌گیرد.
                </p>
                <button onClick={() => router.push('/business/register')}
                        className="mt-4 h-11 px-7 rounded-lg bg-primary text-on-primary text-sm font-extrabold
                        hover:bg-primary/90 active:scale-[0.98] transition-all">
                    شروع کن — رایگان
                </button>
            </div>

            <ChangePasswordModal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)}
                                 onSuccess={() => dispatch(setUser({ ...user, temporaryPassword: false }))} />
        </div>
    );
}
