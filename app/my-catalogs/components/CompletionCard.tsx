// app/my-catalogs/components/CompletionCard.tsx
'use client';

import React, { useState } from 'react';
import { BadgeCheck, ChevronDown, ChevronLeft, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompletionItem {
    key: string;
    label: string;
    ok: boolean;
}

/** کارت پیشرفت تکمیل کاتالوگ — حلقهٔ درصد + چک‌لیست بازشدنی */
export default function CompletionCard({ percent, items, onItem, onShare }: {
    percent: number;
    items: CompletionItem[];
    onItem: (key: string) => void;
    onShare?: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const safeItems = items ?? [];

    // کامل — نوار سبز جمع‌وجور + دکمهٔ اشتراک‌گذاری (لحظهٔ طلایی شیرکردن)
    if (percent === 100) {
        return (
            <div className="rounded-2xl border border-emerald-300/50 bg-gradient-to-l from-emerald-50/80 to-emerald-50/30
                dark:from-emerald-900/15 dark:to-emerald-900/5 dark:border-emerald-800/50
                px-4 py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-emerald-500 grid place-items-center flex-shrink-0 shadow-sm shadow-emerald-500/30">
                    <BadgeCheck className="w-4.5 h-4.5 text-white" />
                </span>
                <p className="flex-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                    کاتالوگت کامل است ✓ — آمادهٔ دیده‌شدن و اعتماد گرفتن
                </p>
                {onShare && (
                    <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری کاتالوگ"
                            className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold
                                flex items-center gap-1.5 flex-shrink-0 shadow-sm shadow-emerald-600/30
                                hover:bg-emerald-700 active:scale-95 transition-all">
                        <Share2 className="w-3.5 h-3.5" /> اشتراک‌گذاری
                    </button>
                )}
            </div>
        );
    }

    const ringColor = percent >= 70 ? 'text-emerald-500' : percent >= 40 ? 'text-amber-500' : 'text-error';
    const missing = safeItems.filter((i) => !i.ok);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 overflow-hidden">
            <button type="button" onClick={() => setExpanded((o) => !o)}
                    className="w-full p-4 flex items-center gap-3.5 text-right hover:bg-surface-container-low/50 transition-colors">
                <span className="relative w-12 h-12 flex-shrink-0 grid place-items-center">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-outline-variant/30" strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="15.5" fill="none"
                                className={cn('stroke-current transition-all duration-700', ringColor)}
                                strokeWidth="3.5" strokeDasharray={`${percent} 100`} strokeLinecap="round" />
                    </svg>
                    <span className={cn('absolute text-[11px] font-black', ringColor)}>{percent}٪</span>
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-sm font-extrabold text-on-surface">کاتالوگت را کامل کن</span>
                    <span className="block text-[11px] text-on-surface-variant/70 mt-0.5">
                        {missing.length.toLocaleString('fa-IR')} مورد مانده — کاتالوگ کامل = اعتماد بیشتر مشتری
                        <span className="text-primary font-bold"> · {expanded ? 'بستن' : 'ببین چی کم است'}</span>
                    </span>
                </span>
                <ChevronDown className={cn('w-4 h-4 text-on-surface-variant/40 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-1.5 border-t border-outline-variant/20 pt-3">
                    {safeItems.map((item) => (
                        <button key={item.key} type="button"
                                onClick={() => !item.ok && onItem(item.key)}
                                disabled={item.ok}
                                className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-right transition-colors',
                                    item.ok ? 'opacity-60 cursor-default' : 'hover:bg-surface-container-high active:scale-[0.99]')}>
                            <span className={cn('w-5 h-5 rounded-full grid place-items-center flex-shrink-0',
                                item.ok ? 'bg-emerald-500' : 'border-2 border-outline-variant/50')}>
                                {item.ok && <BadgeCheck className="w-3.5 h-3.5 text-white" />}
                            </span>
                            <span className={cn('flex-1 text-xs font-bold',
                                item.ok ? 'text-on-surface-variant/60 line-through' : 'text-on-surface')}>
                                {item.label}
                            </span>
                            {!item.ok && (
                                <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                                    تکمیل <ChevronLeft className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
