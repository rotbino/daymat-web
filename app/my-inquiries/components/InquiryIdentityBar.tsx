// app/my-inquiries/components/InquiryIdentityBar.tsx
// نوار هویت صفحه درخواست خرید — قرینهٔ CatalogIdentityBar (سوییچر دو-محصولی)
// هر دو نوع کاتالوگ در منو با برچسب پرانتزی؛ انتخاب فروش → مدیریت کاتالوگ فروش
// پایینِ سوییچر: «کاتالوگ جدید» → مدال دو-گزینه‌ای (خرید یا فروش؟) — قرینهٔ سوییچر فروش
// پالت صفحه درخواست خرید: سنگی/کهربایی (هماهنگ با کارت‌های همین صفحه)
'use client';

import React, { useState } from 'react';
import { Check, ChevronDown, ClipboardList, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import NewCatalogChoiceModal from '@/app/components/NewCatalogChoiceModal';

export default function InquiryIdentityBar({ inquiries, catalogs, currentInquiryId, onSelectInquiry, onSelectCatalog, onNew, onNewCatalog }: {
    inquiries: any[];
    catalogs: any[];
    currentInquiryId: string | null;
    onSelectInquiry: (id: string) => void;
    onSelectCatalog: (id: string) => void;
    onNew: () => void;
    /** ساخت کاتالوگ فروش — از مدال «کاتالوگ جدید» (درخواست کاربر) */
    onNewCatalog: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [newOpen, setNewOpen] = useState(false);
    const current = inquiries.find((w) => w.id === currentInquiryId) || null;
    const multi = inquiries.length + catalogs.length > 1;

    return (
        <div className="relative">
            {/* هویت — کلیک = باز شدن سوییچر */}
            <button type="button" onClick={() => { if (multi) setOpen((o) => !o); }} aria-expanded={open}
                    aria-label="تغییر کاتالوگ"
                    className={cn('flex w-full items-center gap-3 rounded-3xl border-2 border-stone-100 bg-white p-3.5 text-right shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900',
                        multi && 'hover:border-brand-amber-tint active:scale-[0.995]')}>
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-amber-soft dark:bg-amber-500/15">
                    <ClipboardList className="size-5 text-amber-600 dark:text-amber-400" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate text-[15px] font-black text-stone-900 dark:text-gray-100">
                            {current ? current.title : 'صفحه‌های خرید من'}
                        </span>
                        {multi && <ChevronDown className={cn('size-4 shrink-0 text-stone-400 transition-transform', open && 'rotate-180')} />}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-bold text-stone-400 dark:text-gray-500">
                        {current
                            ? (current.status === 'open' ? 'صفحه درخواست خرید کارنت — باز' : 'صفحه درخواست خرید کارنت — بسته')
                            : (multi ? 'برای تغییر کاتالوگ لمس کن' : 'صفحه درخواست خرید شما')}
                    </span>
                </span>
            </button>

            {/* منوی سوییچ — هر دو نوع با برچسب پرانتزی */}
            {open && multi && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div role="menu" className="absolute top-full start-0 mt-1.5 z-50 w-full min-w-72 max-w-md p-1.5
                            rounded-2xl bg-white dark:bg-gray-900 border border-stone-100 dark:border-gray-800
                            shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[65vh] overflow-y-auto">
                        {inquiries.length > 0 && (
                            <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                صفحه‌های خرید
                            </p>
                        )}
                        {inquiries.map((w) => {
                            const active = w.id === currentInquiryId;
                            return (
                                <button key={w.id} type="button" role="menuitem"
                                        onClick={() => { setOpen(false); if (!active) onSelectInquiry(w.id); }}
                                        className={cn('w-full flex items-center gap-2.5 h-11 px-3 rounded-xl text-right transition-colors',
                                            active ? 'bg-brand-amber-soft dark:bg-amber-500/10' : 'hover:bg-stone-50 dark:hover:bg-gray-800')}>
                                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-amber-soft dark:bg-amber-500/15">
                                        <ClipboardList className="size-3.5 text-amber-600 dark:text-amber-400" />
                                    </span>
                                    <span className="flex min-w-0 flex-1 items-center gap-1">
                                        <span className={cn('truncate text-[13px] font-bold', active ? 'text-amber-700 dark:text-amber-400' : 'text-stone-800 dark:text-gray-200')}>
                                            {w.title}
                                        </span>
                                        <span className="shrink-0 whitespace-nowrap text-[9px] font-bold text-amber-600/90 dark:text-amber-400/90">(صفحه درخواست خرید)</span>
                                    </span>
                                    {w.status === 'closed' && (
                                        <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-bold text-stone-400 dark:bg-gray-800">بسته</span>
                                    )}
                                    {active && <Check className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />}
                                </button>
                            );
                        })}
                        {catalogs.length > 0 && (
                            <>
                                <div className="my-1 border-t border-stone-100 dark:border-gray-800" />
                                <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                    کاتالوگ‌های فروش
                                </p>
                                {catalogs.map((c) => (
                                    <button key={c.id} type="button" role="menuitem"
                                            onClick={() => { setOpen(false); onSelectCatalog(c.id); }}
                                            className="w-full flex items-center gap-2.5 h-11 px-3 rounded-xl text-right hover:bg-stone-50 dark:hover:bg-gray-800 transition-colors">
                                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-stone-100 dark:bg-gray-800">
                                            <ClipboardList className="size-3.5 text-stone-400" />
                                        </span>
                                        <span className="flex min-w-0 flex-1 items-center gap-1">
                                            <span className="truncate text-[13px] font-bold text-stone-800 dark:text-gray-200">{c.name}</span>
                                            <span className="shrink-0 whitespace-nowrap text-[9px] font-bold text-stone-400">(کاتالوگ فروش)</span>
                                        </span>
                                    </button>
                                ))}
                            </>
                        )}
                        <div className="my-1 border-t border-stone-100 dark:border-gray-800" />
                        {/* صفحه جدید — اول می‌پرسد خرید یا فروش (ایدهٔ مالک) */}
                        <button type="button" role="menuitem" onClick={() => { setOpen(false); setNewOpen(true); }}
                                className="flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-right text-[13px] font-extrabold text-amber-700 transition-colors hover:bg-brand-amber-soft dark:text-amber-400 dark:hover:bg-amber-500/10">
                            <Plus className="size-4" />
                            صفحه جدید
                        </button>
                    </div>
                </>
            )}

            {/* مدال انتخاب نوع کاتالوگ */}
            <NewCatalogChoiceModal
                open={newOpen}
                onClose={() => setNewOpen(false)}
                onPick={(kind) => { setNewOpen(false); if (kind === 'purchase') onNew(); else onNewCatalog(); }}
            />
        </div>
    );
}
