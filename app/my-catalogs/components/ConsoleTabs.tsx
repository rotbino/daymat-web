// app/my-catalogs/components/ConsoleTabs.tsx
// ناوبری بخش‌های کاتالوگ — تب‌چسبان (موبایل زیر ناوبری اصلی؛ دسکتاپ زیر هدر ۶۴px)
// ترند روز: تب‌افقی آندرلاین به‌سبک Stripe/اینستاگرام — آیکون + برچسب، بدون شبیه‌شدن به دکمه
// موبایل: آیکون بالا + برچسب ریز پایین (عمودی) — ۴ تب بدون اسکرول افقی جا می‌گیرند
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { fmt, Tab } from '../constants';

export interface ConsoleTabItem {
    key: Tab;
    label: string;
    icon: any;
    count?: number;
}

/** نوار تب‌های چسبان — تب فعال = متن پررنگ + خط زیرین */
export default function ConsoleTabs({ items, active, onChange }: {
    items: ConsoleTabItem[];
    active: Tab;
    onChange: (t: Tab) => void;
}) {
    return (
        <div className="sticky top-0 lg:top-16 z-30 -mx-4 px-4 bg-surface/95 dark:bg-gray-950/95 backdrop-blur-md
                border-b border-outline-variant/25 dark:border-gray-800/70">
            <nav aria-label="بخش‌های کاتالوگ"
                 className="flex items-stretch">
                {items.map(({ key, label, icon: Icon, count }) => {
                    const isActive = active === key;
                    return (
                        <button key={key} type="button" onClick={() => onChange(key)} aria-current={isActive ? 'page' : undefined}
                                className={cn('relative flex-1 lg:flex-none flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-1.5 h-14 lg:h-[52px] px-1 lg:px-5 text-[10px] lg:text-sm whitespace-nowrap transition-colors',
                                    isActive
                                        ? 'text-primary font-extrabold'
                                        : 'text-on-surface-variant font-bold hover:text-on-surface active:scale-[0.98]')}>
                            <Icon className="w-[22px] h-[22px] lg:w-[18px] lg:h-[18px]" />
                            <span className="flex items-center gap-1">
                                {label}
                                {typeof count === 'number' && (
                                    <span className={cn('min-w-4 h-4 lg:min-w-5 lg:h-[18px] px-1 lg:px-1.5 rounded-full text-[9px] lg:text-[10px] grid place-items-center transition-colors',
                                        isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-high dark:bg-gray-800 text-on-surface-variant')}>
                                        {fmt(count)}
                                    </span>
                                )}
                            </span>
                            {/* خط زیرین تب فعال */}
                            <span className={cn('absolute bottom-0 inset-x-3 lg:inset-x-4 h-[3px] rounded-t-full bg-primary transition-opacity',
                                isActive ? 'opacity-100' : 'opacity-0')} />
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
