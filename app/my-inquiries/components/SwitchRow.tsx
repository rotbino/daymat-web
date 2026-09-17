// app/my-inquiries/components/SwitchRow.tsx
// ردیف سوییچ RTL — مشترک بین شیت قلم و تنظیمات (هماهنگ با تاگل سفارشی بازوی فروش قیمت)
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export default function SwitchRow({ checked, onChange, label, sub, disabled }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: React.ReactNode;
    sub?: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn('flex w-full items-center justify-between gap-3 text-right', disabled && 'opacity-50')}>
            <span className="min-w-0">
                <span className={cn('block text-[13px] font-extrabold', checked ? 'text-amber-700 dark:text-amber-400' : 'text-stone-700 dark:text-gray-300')}>
                    {label}
                </span>
                {sub && <span className="mt-0.5 block text-[11px] font-bold text-stone-400 dark:text-gray-500">{sub}</span>}
            </span>
            <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors',
                checked ? 'bg-brand-contrast' : 'bg-stone-200 dark:bg-gray-700')}>
                <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-200',
                    checked ? 'start-[1.375rem]' : 'start-0.5')} />
            </span>
        </button>
    );
}
