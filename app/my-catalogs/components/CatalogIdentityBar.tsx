// app/my-catalogs/components/CatalogIdentityBar.tsx
// نوار هویت بازوی فروش — سوییچر سبک اینستاگرام (لوگو + نام + فلش پایین)
// شیر + چشم (مشاهدهٔ بازوی فروش عمومی) + ⋯
// ✅ سوییچر دو-محصولی: بازوهای فروشی قیمت و صفحه‌های بازوی خرید با برچسب پرانتزی
//    کنار نام — انتخاب بازوی خرید به مدیریت آن پرش می‌کند (درخواست کاربر)
// ✅ پایینِ سوییچر: لینک ساخت فقط برای نوعی که هنوز ندارد (ایدهٔ مالک:
//    هر کاربر از هر نوع یکی — سیستم پر از بازوی فروش سرگردان نشود؛ دومی‌ها از زیر ⋯ یا پروفایل کسب‌وکار)
// (کارت ویزیت به تب انتشار منتقل شد با نام «ساخت کارت ویزیت بازوی فروش» — بنا بر بازخورد کاربر)
// موبایل: دکمه‌ها کوچک‌تر (w-9) تا برای عنوان جا بماند (بازخورد کاربر)
// ⚠️ قانون: حالت تاریک همیشه چک شده
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, ClipboardList, Ellipsis, Eye, Key, LibraryBig, Plus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CatalogIdentityBar({ catalogs, inquiries = [], currentCatalog, canShare, onSelect, onSelectInquiry, onShare, onPreview, onNewCatalog, onNewInquiry, onChangePassword }: {
    catalogs: any[];
    /** بازوهای خرید من — در همان سوییچر کنار بازوهای فروشی قیمت (درخواست کاربر) */
    inquiries?: any[];
    currentCatalog: any;
    canShare: boolean;
    onSelect: (id: string) => void;
    onSelectInquiry?: (id: string) => void;
    onShare: () => void;
    onPreview: () => void;
    onNewCatalog: () => void;
    onNewInquiry?: () => void;
    onChangePassword: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const multi = catalogs.length + inquiries.length > 1;
    // ✅ ایدهٔ مالک: لینک ساخت در سوییچر فقط برای نوعی که هنوز ندارد — هر دو داشت، هیچ‌کدام
    const missingInquiry = inquiries.length === 0;
    const missingCatalog = catalogs.length === 0;
    // سوییچر حتی برای تک-آیتمی وقتی نوعی را ندارد باز می‌شود تا لینک ساخت را ببیند
    const canOpen = multi || missingInquiry || missingCatalog;
    const logoSrc = currentCatalog?.logoFile?.path || currentCatalog?.logoUrl;

    const identity = (
        <span className="flex flex-1 items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high dark:bg-gray-800
                    ring-1 ring-outline-variant/40 dark:ring-gray-700 flex items-center justify-center flex-shrink-0">
                {logoSrc
                    ? <Image src={logoSrc} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                    : <LibraryBig className="w-4.5 h-4.5 text-primary/70" />}
            </span>
            <span className="min-w-0">
                <span className="flex items-center gap-1 max-w-full">
                    <span className="text-[15px] font-black text-on-surface truncate">{currentCatalog?.name}</span>
                    {currentCatalog?.isTeamEntry && (
                        <span className="text-[9px] font-extrabold text-sky-700 dark:text-sky-300 bg-sky-500/10
                                px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {currentCatalog?.teamMode === 'admin' ? 'مدیر' : currentCatalog?.teamMode === 'pending' ? 'در انتظار' : 'فروشنده'}
                        </span>
                    )}
                </span>
                <span className="block text-[10px] text-on-surface-variant/70">
                    {multi ? 'برای تغییر لمس کن' : 'بازوی فروش شما'}
                </span>
            </span>
        </span>
    );

    return (
        <div className="relative flex items-center justify-between gap-1.5 lg:gap-2">
            {/* سوییچر / نمایش هویت */}
            {canOpen ? (
                <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
                        aria-label="سوییچ بین بازوهای فروش و بازوهای خرید"
                        className={cn('flex min-w-0 flex-1 items-center gap-2 rounded-2xl border-2 bg-white p-2 ps-2.5 text-right shadow-sm transition-all dark:bg-gray-900',
                            open ? 'border-primary/60 ring-2 ring-primary/10'
                                 : 'border-outline-variant/40 dark:border-gray-700 hover:border-primary/40 active:scale-[0.99]')}>
                    {identity}
                    {/* ✅ فلشِ درشتِ دراپ‌داون در چیپِ متمایز — کل هدر شکلیِ سلکت گرفت تا سوییچر بودنش مشهود باشد */}
                    <span className="grid w-8 h-8 place-items-center rounded-xl bg-surface-container-high dark:bg-gray-800 flex-shrink-0">
                        <ChevronDown className={cn('w-4.5 h-4.5 text-on-surface-variant transition-transform', open && 'rotate-180')} />
                    </span>
                </button>
            ) : (
                <div className="min-w-0 flex-1">{identity}</div>
            )}

            {/* اشتراک‌گذاری سریع — همیشه یک لمس فاصله دارد */}
            {canShare && (
                <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری بازوی فروش" title="اشتراک‌گذاری بازوی فروش"
                        className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg grid place-items-center flex-shrink-0
                            bg-primary/10 text-primary hover:bg-primary/15 active:scale-95 transition-all">
                    <Share2 className="w-4 h-4 lg:w-[18px] lg:h-[18px]" />
                </button>
            )}

            {/* 👁 مشاهدهٔ بازوی فروش عمومی — دم دست، بنا بر خواستهٔ کاربر */}
            {canShare && (
                <button type="button" onClick={onPreview} aria-label="مشاهدهٔ بازوی فروش" title="مشاهدهٔ بازوی فروش"
                        className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg grid place-items-center flex-shrink-0
                            bg-surface-container-high/70 dark:bg-gray-800 text-on-surface-variant
                            hover:text-primary hover:bg-surface-container-high dark:hover:bg-gray-700 active:scale-95 transition-all">
                    <Eye className="w-4 h-4 lg:w-[18px] lg:h-[18px]" />
                </button>
            )}

            {/* ⋯ گزینه‌های بیشتر — کنار شیر و چشم */}
            <div className="relative flex-shrink-0">
                <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="گزینه‌های بیشتر"
                        aria-expanded={menuOpen}
                        className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg grid place-items-center text-on-surface-variant
                            border border-outline-variant/40 dark:border-gray-700 hover:bg-surface-container-high dark:hover:bg-gray-800 transition-colors">
                    <Ellipsis className="w-4 h-4 lg:w-[18px] lg:h-[18px]" />
                </button>
                {menuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div className="absolute top-full end-0 mt-1 z-50 w-52 p-1.5 rounded-lg bg-white dark:bg-gray-900
                            border border-outline-variant/30 dark:border-gray-700 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                            {/* 📍 ساخت بازوی فروش جدید — هر دو محصول از همین منو (دسترسی راحت) */}
                            <button type="button" onClick={() => { setMenuOpen(false); onNewCatalog(); }}
                                    className="w-full flex items-center gap-2.5 h-10 px-3 rounded-md text-[13px] text-on-surface hover:bg-surface-container-high dark:hover:bg-gray-800 transition-colors">
                                <Plus className="w-4 h-4 text-primary" /> بازوی فروش جدید
                            </button>
                            {onNewInquiry && (
                                <button type="button" onClick={() => { setMenuOpen(false); onNewInquiry(); }}
                                        className="w-full flex items-center gap-2.5 h-10 px-3 rounded-md text-[13px] text-on-surface hover:bg-surface-container-high dark:hover:bg-gray-800 transition-colors">
                                    <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" /> بازوی خرید جدید
                                </button>
                            )}
                            <button type="button" onClick={() => { setMenuOpen(false); onChangePassword(); }}
                                    className="w-full flex items-center gap-2.5 h-10 px-3 rounded-md text-[13px] text-on-surface hover:bg-surface-container-high dark:hover:bg-gray-800 transition-colors">
                                <Key className="w-4 h-4 text-on-surface-variant" /> تغییر رمز عبور
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* منوی سوییچ — هر دو نوع بازوی فروش با برچسب پرانتزی (درخواست کاربر) */}
            {open && canOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div role="menu" className="absolute top-full start-0 mt-1.5 z-50 w-80 max-w-[calc(100vw-2rem)] p-1.5
                            rounded-xl bg-white dark:bg-gray-900 border border-outline-variant/30 dark:border-gray-700
                            shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[70vh] overflow-y-auto">
                        {catalogs.length > 0 && (
                            <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold text-on-surface-variant/70">
                                بازوهای فروشی قیمت
                            </p>
                        )}
                        {catalogs.map((c) => {
                            const active = c.id === currentCatalog?.id;
                            const src = c.logoFile?.path || c.logoUrl;
                            return (
                                <button key={c.id} type="button" role="menuitem"
                                        onClick={() => { setOpen(false); if (!active) onSelect(c.id); }}
                                        className={cn('w-full flex items-center gap-2.5 h-11 px-3 rounded-lg text-right transition-colors',
                                            active ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-surface-container-high dark:hover:bg-gray-800')}>
                                    <span className="w-7 h-7 rounded-md overflow-hidden bg-surface-container-high dark:bg-gray-800
                                            grid place-items-center flex-shrink-0">
                                        {src
                                            ? <Image src={src} alt="" width={28} height={28} className="w-full h-full object-cover" unoptimized />
                                            : <LibraryBig className="w-3.5 h-3.5 text-primary/70" />}
                                    </span>
                                    <span className="min-w-0 flex-1 flex items-center gap-1">
                                        <span className={cn('text-[13px] font-bold truncate', active ? 'text-primary' : 'text-on-surface')}>
                                            {c.name}
                                        </span>
                                        <span className="text-[9px] font-bold text-primary/70 whitespace-nowrap flex-shrink-0">(بازوی فروش)</span>
                                    </span>
                                    {c.isTeamEntry && (
                                        <span className="text-[9px] font-extrabold text-sky-700 dark:text-sky-300
                                                bg-sky-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                            {c.teamMode === 'admin' ? 'مدیر' : c.teamMode === 'pending' ? 'در انتظار' : 'فروشنده'}
                                        </span>
                                    )}
                                    {active && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                                </button>
                            );
                        })}
                        {inquiries.length > 0 && (
                            <>
                                <div className="my-1 border-t border-outline-variant/20 dark:border-gray-800" />
                                <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-on-surface-variant/70">
                                    بازوهای خرید
                                </p>
                                {inquiries.map((w) => (
                                    <button key={w.id} type="button" role="menuitem"
                                            onClick={() => { setOpen(false); onSelectInquiry?.(w.id); }}
                                            className="w-full flex items-center gap-2.5 h-11 px-3 rounded-lg text-right
                                                hover:bg-brand-contrast-soft/60 dark:hover:bg-amber-500/10 transition-colors">
                                        <span className="w-7 h-7 rounded-md bg-brand-contrast-soft dark:bg-amber-500/15
                                                grid place-items-center flex-shrink-0">
                                            <ClipboardList className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                        </span>
                                        <span className="min-w-0 flex-1 flex items-center gap-1">
                                            <span className="text-[13px] font-bold text-on-surface truncate">{w.title}</span>
                                            <span className="text-[9px] font-bold text-amber-600/90 dark:text-amber-400/90 whitespace-nowrap flex-shrink-0">(بازوی خرید)</span>
                                        </span>
                                        {w.status === 'closed' && (
                                            <span className="text-[9px] font-bold text-stone-400 bg-stone-100 dark:bg-gray-800
                                                    px-1.5 py-0.5 rounded-full flex-shrink-0">بسته</span>
                                        )}
                                    </button>
                                ))}
                            </>
                        )}

                        {/* ساخت — فقط برای نوعِ غایب (ایدهٔ مالک: جلوگیری از بازوهای فروشی سرگردان؛
                            دومی‌ها از زیر ⋯ یا پروفایل کسب‌وکار پیدا می‌شوند) */}
                        {(missingCatalog || missingInquiry) && (
                            <>
                                <div className="my-1 border-t border-outline-variant/20 dark:border-gray-800" />
                                {missingCatalog && (
                                    <button type="button" role="menuitem"
                                            onClick={() => { setOpen(false); onNewCatalog(); }}
                                            className="w-full flex items-center gap-2.5 h-11 px-3 rounded-lg text-right text-[13px] font-extrabold
                                                text-primary hover:bg-surface-container-high dark:hover:bg-gray-800 transition-colors">
                                        <Plus className="w-4 h-4" />
                                        ساخت بازوی فروش
                                    </button>
                                )}
                                {missingInquiry && onNewInquiry && (
                                    <button type="button" role="menuitem"
                                            onClick={() => { setOpen(false); onNewInquiry(); }}
                                            className="w-full flex items-center gap-2.5 h-11 px-3 rounded-lg text-right text-[13px] font-extrabold
                                                text-amber-700 hover:bg-brand-contrast-soft/60 dark:text-amber-400 dark:hover:bg-amber-500/10 transition-colors">
                                        <Plus className="w-4 h-4" />
                                        ساخت بازوی خرید
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
