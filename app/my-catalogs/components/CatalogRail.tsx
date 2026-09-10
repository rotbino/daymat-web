// app/my-catalogs/components/CatalogRail.tsx
// رِیل کاتالوگ‌ها — ستون باریک دسکتاپ برای جابه‌جایی سریع بین کاتالوگ‌ها + افزودن
'use client';

import React from 'react';
import Image from 'next/image';
import { LibraryBig, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/** ستون فهرست کاتالوگ‌ها — فقط دسکتاپ (lg+) */
export default function CatalogRail({ catalogs, currentId, onSelect, onNew }: {
    catalogs: any[];
    currentId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
}) {
    return (
        <aside className="hidden lg:flex flex-col w-[264px] flex-shrink-0 self-start lg:sticky lg:top-[84px]
                bg-white dark:bg-gray-900 rounded-3xl border border-outline-variant/50 dark:border-gray-700 p-3">
            <div className="flex items-center gap-1.5 px-2 pt-1 pb-2.5">
                <LibraryBig className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-extrabold text-on-surface-variant">کتابخانهٔ من</span>
                <span className="text-[10px] font-bold bg-surface-container-high dark:bg-gray-800 text-on-surface-variant rounded-full min-w-5 h-4.5 px-1.5 grid place-items-center">
                    {catalogs.length.toLocaleString('fa-IR')}
                </span>
            </div>

            <div className="flex flex-col gap-1">
                {catalogs.map((c) => {
                    const isActive = c.id === currentId;
                    const logoSrc = c.logoFile?.path || c.logoUrl;
                    return (
                        <button key={c.id} type="button" onClick={() => onSelect(c.id)}
                                className={cn('group w-full flex items-center gap-2.5 p-2 rounded-xl text-right border-s-[3px] transition-all',
                                    isActive
                                        ? 'border-primary bg-primary/5'
                                        : 'border-transparent hover:bg-surface-container-low/70')}>
                            <span className="w-9 h-9 rounded-lg overflow-hidden bg-surface-container-high dark:bg-gray-800
                                    flex items-center justify-center flex-shrink-0">
                                {logoSrc
                                    ? <Image src={logoSrc} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized />
                                    : <LibraryBig className="w-4 h-4 text-primary/70" />}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className={cn('block text-xs font-bold truncate', isActive ? 'text-primary' : 'text-on-surface')}>
                                    {c.name}
                                </span>
                                <span className="block text-[10px] text-on-surface-variant/60 truncate" dir="ltr">
                                    {c.slug ? `/${c.slug}` : 'بی‌آدرس'}
                                </span>
                            </span>
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                        </button>
                    );
                })}
            </div>

            <div className="border-t border-outline-variant/20 dark:border-gray-700/60 mt-2.5 pt-2.5">
                <button type="button" onClick={onNew}
                        className="w-full h-9 rounded-xl border border-dashed border-outline-variant/60 dark:border-gray-600
                            text-[11px] font-bold text-on-surface-variant hover:border-amber-500/60 hover:text-amber-600
                            flex items-center justify-center gap-1.5 transition-colors">
                    <Plus className="w-4 h-4" /> کاتالوگ جدید
                </button>
            </div>
        </aside>
    );
}
