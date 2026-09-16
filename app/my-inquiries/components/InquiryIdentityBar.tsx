// app/my-inquiries/components/InquiryIdentityBar.tsx
// نوار هویت بازوی خرید — قرینهٔ CatalogIdentityBar (سوییچر دو-محصولی)
// هر دو نوع کاتالوگ در منو با برچسب پرانتزی؛ انتخاب فروش → مدیریت کاتالوگ قیمت
// ✅ پایینِ سوییچر: لینک ساخت فقط برای نوعی که هنوز ندارد (ایدهٔ مالک:
//    هر کاربر از هر نوع یکی — سیستم پر از کاتالوگ سرگردان نشود)
// ✅ شیر + چشم + ⋯ کنار هویت — دسترسی سریع بدون رفتن به تبها (بنا بر خواستهٔ کاربر)
//    «ساخت صفحه جدید» هم داخل همین ⋯ است؛ قرینهٔ منوی ⋯ کاتالوگ قیمت
// پالت بازوی خرید: سنگی/کهربایی (هماهنگ با کارت‌های همین صفحه)
'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, ClipboardList, Ellipsis, Eye, LibraryBig, Plus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InquiryIdentityBar({ inquiries, catalogs, currentInquiryId, onSelectInquiry, onSelectCatalog, onNew, onNewCatalog, onShare, onPreview }: {
    inquiries: any[];
    catalogs: any[];
    currentInquiryId: string | null;
    onSelectInquiry: (id: string) => void;
    onSelectCatalog: (id: string) => void;
    onNew: () => void;
    /** ساخت کاتالوگ قیمت — از مدال «کاتالوگ جدید» (درخواست کاربر) */
    onNewCatalog: () => void;
    /** اشتراک‌گذاری سریع — یک لمس، بدون رفتن به تب انتشار (خواستهٔ کاربر) */
    onShare: () => void;
    /** مشاهدهٔ صفحهٔ عمومی — چشم، بنا بر خواستهٔ کاربر */
    onPreview: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const current = inquiries.find((w) => w.id === currentInquiryId) || null;
    const multi = inquiries.length + catalogs.length > 1;
    // ✅ ایدهٔ مالک: لینک ساخت در سوییچر فقط برای نوعی که هنوز ندارد — هر دو داشت، هیچ‌کدام
    const missingInquiry = inquiries.length === 0;
    const missingCatalog = catalogs.length === 0;
    // سوییچر حتی برای تک-آیتمی وقتی نوعی را ندارد باز می‌شود تا لینک ساخت را ببیند
    const canOpen = multi || missingInquiry || missingCatalog;

    return (
        <div className="relative flex items-center justify-between gap-1.5">
            {/* هویت — کلیک = باز شدن سوییچر */}
            <button type="button" onClick={() => { if (canOpen) setOpen((o) => !o); }} aria-expanded={open}
                    aria-label="سوییچ بین بازوهای خرید و کاتالوگ‌های قیمت"
                    className={cn('flex min-w-0 flex-1 items-center gap-3 rounded-3xl border-2 bg-white p-3 text-right shadow-sm transition-all dark:bg-gray-900',
                        open
                            ? 'border-brand-contrast/70 ring-2 ring-brand-contrast/10 dark:border-amber-500/60'
                            : canOpen
                                ? 'border-stone-200 hover:border-brand-contrast-tint active:scale-[0.995] dark:border-gray-700'
                                : 'border-stone-100 dark:border-gray-800')}>
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-contrast-soft dark:bg-amber-500/15">
                    <ClipboardList className="size-5 text-amber-600 dark:text-amber-400" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate text-[15px] font-black text-stone-900 dark:text-gray-100">
                            {current ? current.title : 'بازوهای خرید من'}
                        </span>
                    </span>
                    <span className="mt-0.5 block text-[10px] font-bold text-stone-400 dark:text-gray-500">
                        {current
                            ? (current.status === 'open' ? 'بازوی خرید کارنت — باز' : 'بازوی خرید کارنت — بسته')
                            : (multi ? 'برای تغییر لمس کن' : 'بازوی خرید شما')}
                    </span>
                </span>
                {/* ✅ فلشِ درشتِ دراپ‌داون در چیپِ متمایز — شکلیِ سلکت تا سوییچر بودن هدر مشهود باشد */}
                {canOpen && (
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-stone-100 dark:bg-gray-800">
                        <ChevronDown className={cn('size-4 text-stone-500 transition-transform dark:text-gray-400', open && 'rotate-180')} />
                    </span>
                )}
            </button>

            {/* اشتراک‌گذاری سریع — همان‌جا، بدون تب */}
            <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری بازوی خرید" title="اشتراک‌گذاری"
                    className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-contrast-soft text-amber-700
                        transition-all hover:bg-amber-500/25 active:scale-95 dark:bg-amber-500/15 dark:text-amber-400">
                <Share2 className="size-4" />
            </button>

            {/* 👁 مشاهدهٔ صفحهٔ عمومی — دم دست */}
            <button type="button" onClick={onPreview} aria-label="مشاهدهٔ صفحه" title="مشاهدهٔ صفحه"
                    className="grid size-9 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-500
                        transition-all hover:text-amber-700 hover:bg-stone-200 active:scale-95 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-amber-400">
                <Eye className="size-4" />
            </button>

            {/* ⋯ گزینه‌های بیشتر — ساخت صفحه جدید از همین منو (خواستهٔ کاربر) */}
            <div className="relative shrink-0">
                <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="گزینه‌های بیشتر"
                        aria-expanded={menuOpen}
                        className="grid size-9 place-items-center rounded-xl border border-stone-200 text-stone-500
                            transition-colors hover:bg-stone-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
                    <Ellipsis className="size-4" />
                </button>
                {menuOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div className="absolute top-full end-0 mt-1 z-50 w-56 p-1.5 rounded-xl bg-white dark:bg-gray-900
                            border border-stone-100 dark:border-gray-800 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                            {/* 📍 ساخت صفحه جدید — از همین منو، بدون باز کردن سوییچر */}
                            <button type="button" onClick={() => { setMenuOpen(false); onNew(); }}
                                    className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] text-stone-800 transition-colors hover:bg-stone-50 dark:text-gray-200 dark:hover:bg-gray-800">
                                <ClipboardList className="size-4 text-amber-600 dark:text-amber-400" /> بازوی خرید جدید
                            </button>
                            <button type="button" onClick={() => { setMenuOpen(false); onNewCatalog(); }}
                                    className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] text-stone-800 transition-colors hover:bg-stone-50 dark:text-gray-200 dark:hover:bg-gray-800">
                                <LibraryBig className="size-4 text-primary" /> کاتالوگ قیمت جدید
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* منوی سوییچ — هر دو نوع با برچسب پرانتزی */}
            {open && canOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div role="menu" className="absolute top-full start-0 mt-1.5 z-50 w-full min-w-72 max-w-md p-1.5
                            rounded-2xl bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800
                            shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[65vh] overflow-y-auto">
                        {inquiries.length > 0 && (
                            <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                بازوهای خرید
                            </p>
                        )}
                        {inquiries.map((w) => {
                            const active = w.id === currentInquiryId;
                            return (
                                <button key={w.id} type="button" role="menuitem"
                                        onClick={() => { setOpen(false); if (!active) onSelectInquiry(w.id); }}
                                        className={cn('w-full flex items-center gap-2.5 h-11 px-3 rounded-xl text-right transition-colors',
                                            active ? 'bg-brand-contrast-soft dark:bg-amber-500/10' : 'hover:bg-stone-50 dark:hover:bg-gray-800')}>
                                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-contrast-soft dark:bg-amber-500/15">
                                        <ClipboardList className="size-3.5 text-amber-600 dark:text-amber-400" />
                                    </span>
                                    <span className="flex min-w-0 flex-1 items-center gap-1">
                                        <span className={cn('truncate text-[13px] font-bold', active ? 'text-amber-700 dark:text-amber-400' : 'text-stone-800 dark:text-gray-200')}>
                                            {w.title}
                                        </span>
                                        <span className="shrink-0 whitespace-nowrap text-[9px] font-bold text-amber-600/90 dark:text-amber-400/90">(بازوی خرید)</span>
                                    </span>
                                    {w.status === 'closed' && (
                                        <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-bold text-stone-400 dark:bg-gray-800">بسته</span>
                                    )}
                                    {/* ✅ پروندهٔ بسته‌شده (فاز ۶ سناریو) — از لیست‌های زنده خارج است */}
                                    {w.status === 'archived' && (
                                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                                            (w as any).outcome === 'succeeded'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                                                : 'bg-stone-100 text-stone-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                            {(w as any).outcome === 'succeeded' ? 'موفق' : 'بسته'}
                                        </span>
                                    )}
                                    {active && <Check className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />}
                                </button>
                            );
                        })}
                        {catalogs.length > 0 && (
                            <>
                                <div className="my-1 border-t border-stone-100 dark:border-gray-800" />
                                <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                    کاتالوگ‌های قیمت
                                </p>
                                {catalogs.map((c) => (
                                    <button key={c.id} type="button" role="menuitem"
                                            onClick={() => { setOpen(false); onSelectCatalog(c.id); }}
                                            className="w-full flex items-center gap-2.5 h-11 px-3 rounded-xl text-right hover:bg-stone-50 dark:hover:bg-gray-800 transition-colors">
                                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-stone-100 dark:bg-gray-800">
                                            <LibraryBig className="size-3.5 text-stone-400" />
                                        </span>
                                        <span className="flex min-w-0 flex-1 items-center gap-1">
                                            <span className="truncate text-[13px] font-bold text-stone-800 dark:text-gray-200">{c.name}</span>
                                            <span className="shrink-0 whitespace-nowrap text-[9px] font-bold text-stone-400">(کاتالوگ قیمت)</span>
                                        </span>
                                    </button>
                                ))}
                            </>
                        )}
                        {/* ساخت — فقط برای نوعِ غایب (ایدهٔ مالک: دومی‌ها از زیر ⋯ پیدا می‌شوند) */}
                        {(missingCatalog || missingInquiry) && (
                            <>
                                <div className="my-1 border-t border-stone-100 dark:border-gray-800" />
                                {missingInquiry && (
                                    <button type="button" role="menuitem" onClick={() => { setOpen(false); onNew(); }}
                                            className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-right text-[13px] font-extrabold text-amber-700 transition-colors hover:bg-brand-contrast-soft dark:text-amber-400 dark:hover:bg-amber-500/10">
                                        <Plus className="size-4" />
                                        ساخت بازوی خرید
                                    </button>
                                )}
                                {missingCatalog && (
                                    <button type="button" role="menuitem" onClick={() => { setOpen(false); onNewCatalog(); }}
                                            className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-right text-[13px] font-extrabold text-primary transition-colors hover:bg-stone-50 dark:hover:bg-gray-800">
                                        <Plus className="size-4" />
                                        ساخت کاتالوگ قیمت
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
