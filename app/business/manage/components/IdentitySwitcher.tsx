// app/business/manage/components/IdentitySwitcher.tsx
// 🎛️ سوییچر کسب‌وکار — جلوی عنوان صفحه؛ اگر بیش از یک کسب‌وکار باشد دراپ‌داون باز می‌شود
'use client';

import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessLogo } from './BusinessLogo';

export interface ManageBusinessItem {
    id: string;
    name: string;
    city?: string | null;
    province?: string | null;
    industryName?: string | null;
    logoUrl?: string | null;
    canEdit?: boolean;
}

export function IdentitySwitcher({
    businesses,
    currentId,
    onSelect,
}: {
    businesses: ManageBusinessItem[];
    currentId?: string | null;
    onSelect: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const multi = businesses.length > 1;
    const current = businesses.find((b) => b.id === currentId) || businesses[0];
    if (!current) return null;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => multi && setOpen((o) => !o)}
                aria-label="انتخاب کسب‌وکار"
                className={cn(
                    'flex items-center gap-2 h-10 px-2.5 rounded-xl bg-white dark:bg-gray-900 border border-outline-variant/50 dark:border-gray-700 transition-colors max-w-[52vw] sm:max-w-none',
                    multi ? 'hover:border-primary/40 active:scale-[0.98]' : 'cursor-default',
                )}
            >
                <BusinessLogo logoUrl={current.logoUrl} name={current.name} className="w-6 h-6 rounded-lg" />
                <span className="flex flex-col items-start min-w-0">
                    <span className="text-[12px] font-extrabold text-on-surface truncate max-w-[140px] sm:max-w-[220px] leading-4">
                        {current.name}
                    </span>
                    <span className="text-[9px] text-on-surface-variant/60 leading-3">
                        {multi ? 'تغییر کسب‌وکار' : 'کسب‌وکار شما'}
                    </span>
                </span>
                {multi && (
                    <ChevronDown
                        className={cn('w-4 h-4 text-on-surface-variant/60 transition-transform flex-shrink-0', open && 'rotate-180')}
                    />
                )}
            </button>

            {open && multi && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 w-72 z-50 rounded-2xl border border-outline-variant/50 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden animate-in">
                        <p className="px-4 py-2.5 text-[11px] font-extrabold text-on-surface-variant border-b border-outline-variant/30 dark:border-gray-700/60">
                            کسب‌وکارها
                        </p>
                        <div className="max-h-72 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                            {businesses.map((b) => (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        onSelect(b.id);
                                    }}
                                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-container-low dark:hover:bg-gray-800 transition-colors text-right"
                                >
                                    <BusinessLogo logoUrl={b.logoUrl} name={b.name} className="w-8 h-8 rounded-lg" />
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-[12px] font-bold text-on-surface truncate">
                                            {b.name}
                                        </span>
                                        <span className="block text-[10px] text-on-surface-variant/60 truncate">
                                            {[b.city || b.province, b.industryName].filter(Boolean).join(' · ') || '—'}
                                        </span>
                                    </span>
                                    {b.id === current.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
