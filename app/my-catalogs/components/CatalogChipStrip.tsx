// app/my-catalogs/components/CatalogChipStrip.tsx
// نوار چیپ کاتالوگ‌ها — جابه‌جایی سریع وقتی بیش از یک کاتالوگ وجود دارد (موبایل و دسکتاپ)
// ⚠️ ایجاد کاتالوگ جدید اینجا نیست — فقط از منوی سه‌نقطه (سیاست MVP)
'use client';

import React from 'react';
import Image from 'next/image';
import { LibraryBig } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CatalogChipStrip({ catalogs, currentId, onSelect }: {
    catalogs: any[];
    currentId: string | null;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 py-0.5">
            {catalogs.map((c) => {
                const isActive = c.id === currentId;
                const logoSrc = c.logoFile?.path || c.logoUrl;
                return (
                    <button key={c.id} type="button" onClick={() => onSelect(c.id)}
                            className={cn('flex items-center gap-2 h-9 px-2.5 rounded-lg border flex-shrink-0 transition-colors',
                                isActive
                                    ? 'bg-primary/5 border-primary/40 dark:bg-primary/15'
                                    : 'bg-white dark:bg-gray-900 border-outline-variant/40 dark:border-gray-700 hover:border-primary/30')}>
                        <span className="w-6 h-6 rounded overflow-hidden bg-surface-container-high dark:bg-gray-800
                                flex items-center justify-center flex-shrink-0">
                            {logoSrc
                                ? <Image src={logoSrc} alt="" width={24} height={24} className="w-full h-full object-cover" unoptimized />
                                : <LibraryBig className="w-3 h-3 text-primary/70" />}
                        </span>
                        <span className={cn('text-[11px] font-bold max-w-[128px] truncate', isActive ? 'text-primary' : 'text-on-surface')}>
                            {c.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
