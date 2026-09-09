// app/ad/form/ui-bits.tsx
// ✅ المان‌های ریز مشترک ویزارد — آیکون + عنوان بخش، بج شماره، کلاس ورودی

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/** کلاس استاندارد ورودی فرم */
export const inputCls = (hasErr?: string) => cn(
    'w-full h-11 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border',
    'focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all',
    hasErr ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
);

/** عنوان بخش — آیکون در مربع رنگی + متن */
export function SectionTitle({ icon: Icon, text }: { icon: any; text: string }) {
    return (
        <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 mb-2">
            <span className="w-5 h-5 rounded-md bg-primary/10 grid place-items-center flex-shrink-0">
                <Icon className="w-3 h-3 text-primary" />
            </span>
            {text}
        </p>
    );
}

/** بج شماره‌دار مرحله داخل بخش قیمت */
export function StepBadge({ n }: { n: number }) {
    return (
        <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black tabular-nums">
            {n.toLocaleString ? n.toLocaleString('fa-IR') : n}
        </span>
    );
}
