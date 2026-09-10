// app/my-catalogs/components/CatalogChipStrip.tsx
// نوار چیپ کاتالوگ‌ها — موبایل؛ جابه‌جایی سریع وقتی بیش از یک کاتالوگ وجود دارد
'use client';

import React from 'react';
import Image from 'next/image';
import { LibraryBig, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/** چیپ‌های افقی کاتالوگ‌ها — فقط موبایل (زیر lg) */
export default function CatalogChipStrip({ catalogs, currentId, onSelect, onNew }: {
    catalogs: any[];
    currentId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
}) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide lg:hidden -mx-1 px-1 py-0.5">
            {catalogs.map((c) => {
                const isActive = c.id === currentId;
                const logoSrc = c.logoFile?.path || c.logoUrl;
                return (
                    <button key={c.id} type="button" onClick={() => onSelect(c.id)}
                            className={cn('flex items-center gap-2 h-10 ps-1.5 pe-3.5 rounded-full border flex-shrink-0 transition-all',
                                isActive
                                    ? 'bg-primary/5 border-primary/50'
                                    : 'bg-white dark:bg-gray-900 border-outline-variant/50 dark:border-gray-700 hover:border-primary/30')}>
                        <span className="w-7 h-7 rounded-full overflow-hidden bg-surface-container-high dark:bg-gray-800
                                flex items-center justify-center flex-shrink-0">
                            {logoSrc
                                ? <Image src={logoSrc} alt="" width={28} height={28} className="w-full h-full object-cover" unoptimized />
                                : <LibraryBig className="w-3.5 h-3.5 text-primary/70" />}
                        </span>
                        <span className={cn('text-[11px] font-bold max-w-[128px] truncate', isActive ? 'text-primary' : 'text-on-surface')}>
                            {c.name}
                        </span>
                    </button>
                );
            })}
            <button type="button" onClick={onNew} aria-label="کاتالوگ جدید"
                    className="w-10 h-10 rounded-full border border-dashed border-outline-variant/60 dark:border-gray-600
                        grid place-items-center text-on-surface-variant hover:text-amber-600 hover:border-amber-500/60
                        flex-shrink-0 transition-colors">
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}
