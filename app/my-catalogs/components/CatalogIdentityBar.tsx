// app/my-catalogs/components/CatalogIdentityBar.tsx
// نوار هویت کاتالوگ — سوییچر سبک اینستاگرام (لوگو + نام + فلش پایین)
// ⚠️ ایجاد کاتالوگ جدید اینجا نیست — فقط از منوی سه‌نقطهٔ بالای صفحه (سیاست MVP)
// ⚠️ قانون: حالت تاریک همیشه چک شده
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, LibraryBig, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CatalogIdentityBar({ catalogs, currentCatalog, canShare, onSelect, onShare }: {
    catalogs: any[];
    currentCatalog: any;
    canShare: boolean;
    onSelect: (id: string) => void;
    onShare: () => void;
}) {
    const [open, setOpen] = useState(false);
    const multi = catalogs.length > 1;
    const logoSrc = currentCatalog?.logoFile?.path || currentCatalog?.logoUrl;

    const identity = (
        <span className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high dark:bg-gray-800
                    ring-1 ring-outline-variant/40 dark:ring-gray-700 flex items-center justify-center flex-shrink-0">
                {logoSrc
                    ? <Image src={logoSrc} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                    : <LibraryBig className="w-4.5 h-4.5 text-primary/70" />}
            </span>
            <span className="min-w-0">
                <span className="flex items-center gap-1 max-w-full">
                    <span className="text-[15px] font-black text-on-surface truncate">{currentCatalog?.name}</span>
                    {multi && <ChevronDown className={cn('w-4 h-4 text-on-surface-variant/60 flex-shrink-0 transition-transform', open && 'rotate-180')} />}
                </span>
                <span className="block text-[10px] text-on-surface-variant/70">
                    {multi ? 'برای تغییر کاتالوگ لمس کن' : 'کاتالوگ شما'}
                </span>
            </span>
        </span>
    );

    return (
        <div className="relative flex items-center justify-between gap-2">
            {/* سوییچر / نمایش هویت */}
            {multi ? (
                <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
                        aria-label="تغییر کاتالوگ"
                        className="min-w-0 flex-1 text-right rounded-lg py-1 ps-1 pe-2 -ms-1 hover:bg-surface-container-high/60
                            dark:hover:bg-gray-800/60 active:scale-[0.99] transition-all">
                    {identity}
                </button>
            ) : (
                <div className="min-w-0 flex-1">{identity}</div>
            )}

            {/* اشتراک‌گذاری سریع — همیشه یک لمس فاصله دارد */}
            {canShare && (
                <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری کاتالوگ" title="اشتراک‌گذاری کاتالوگ"
                        className="w-10 h-10 rounded-lg grid place-items-center flex-shrink-0
                            bg-primary/10 text-primary hover:bg-primary/15 active:scale-95 transition-all">
                    <Share2 className="w-4.5 h-4.5" />
                </button>
            )}

            {/* منوی سوییچ کاتالوگ‌ها — بدون «کاتالوگ جدید» */}
            {open && multi && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div role="menu" className="absolute top-full start-0 mt-1.5 z-50 w-72 max-w-[calc(100vw-2rem)] p-1.5
                            rounded-xl bg-white dark:bg-gray-900 border border-outline-variant/30 dark:border-gray-700
                            shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold text-on-surface-variant/70">کاتالوگ‌های من</p>
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
                                    <span className={cn('flex-1 text-[13px] font-bold truncate', active ? 'text-primary' : 'text-on-surface')}>
                                        {c.name}
                                    </span>
                                    {active && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
