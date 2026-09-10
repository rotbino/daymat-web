// app/my-catalogs/components/CatalogSwitcher.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, LibraryBig, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/** سوییچر بین چند کاتالوگ — فقط وقتی بیش از یک کاتالوگ باشد رندر می‌شود */
export default function CatalogSwitcher({ catalogs, currentId, onSelect }: {
    catalogs: any[];
    currentId: string | null;
    onSelect: (id: string) => void;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const current = catalogs.find((c) => c.id === currentId) ?? catalogs[0];

    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen((o) => !o)}
                    className="h-9 px-3 rounded-xl bg-surface-container-high/60 dark:bg-gray-800
                        text-xs font-bold text-on-surface flex items-center gap-1.5 max-w-[180px]
                        hover:bg-surface-container-high transition-colors">
                <LibraryBig className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="truncate">{current?.name}</span>
                <ChevronLeft className={cn('w-3.5 h-3.5 text-on-surface-variant/60 rotate-[-90deg] transition-transform', open && 'rotate-90')} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full end-0 mt-1 z-50 w-64 p-1.5 rounded-2xl bg-white dark:bg-gray-900
                        border border-outline-variant/30 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        {catalogs.map((c) => {
                            const isActive = c.id === currentId;
                            return (
                                <button key={c.id} type="button"
                                        onClick={() => { setOpen(false); if (!isActive) onSelect(c.id); }}
                                        className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors text-right',
                                            isActive ? 'bg-primary/5' : 'hover:bg-surface-container-high')}>
                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0 flex items-center justify-center">
                                        {(c.logoFile?.path || c.logoUrl)
                                            ? <Image src={c.logoFile?.path || c.logoUrl} alt="" width={32} height={32} className="object-cover" unoptimized />
                                            : <LibraryBig className="w-4 h-4 text-primary" />}
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                        <p className={cn('text-xs font-bold truncate', isActive ? 'text-primary' : 'text-on-surface')}>{c.name}</p>
                                        {c.slug && <p className="text-[9px] text-on-surface-variant/50 truncate" dir="ltr">/{c.slug}</p>}
                                    </div>
                                    {isActive && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                                </button>
                            );
                        })}
                        <div className="border-t border-outline-variant/20 mt-1 pt-1">
                            <button type="button" onClick={() => router.push('/business/register')}
                                    className="w-full flex items-center gap-2.5 h-9 px-3 rounded-xl text-[12px]
                                        text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                                <Plus className="w-3.5 h-3.5" /> کاتالوگ جدید
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
