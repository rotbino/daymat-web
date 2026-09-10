// app/my-catalogs/components/ConsoleTabs.tsx
// تب‌های حرفه‌ای کنسول — آندرلاین با آیکون و شمارنده؛ خوانا به‌عنوان «ناوبری» نه دکمه
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

/** نوار تب‌ها — استایل مرورگرهای حرفه‌ای: تب فعال = متن پررنگ + خط زیرین */
export default function ConsoleTabs({ items, active, onChange }: {
    items: ConsoleTabItem[];
    active: Tab;
    onChange: (t: Tab) => void;
}) {
    return (
        <nav aria-label="بخش‌های کاتالوگ"
             className="flex items-stretch border-b border-outline-variant/30 dark:border-gray-700/60
                 px-2 lg:px-6 overflow-x-auto scrollbar-hide">
            {items.map(({ key, label, icon: Icon, count }) => {
                const isActive = active === key;
                return (
                    <button key={key} type="button" onClick={() => onChange(key)} aria-current={isActive ? 'page' : undefined}
                            className={cn('relative flex items-center gap-1.5 h-11 lg:h-12 px-3.5 lg:px-4 text-xs lg:text-[13px] whitespace-nowrap transition-colors',
                                isActive
                                    ? 'text-primary font-extrabold'
                                    : 'text-on-surface-variant font-bold hover:text-on-surface hover:bg-surface-container-low/60 rounded-t-lg')}>
                        <Icon className="w-4 h-4" />
                        {label}
                        {typeof count === 'number' && (
                            <span className={cn('min-w-5 h-[18px] px-1.5 rounded-full text-[10px] grid place-items-center transition-colors',
                                isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-high dark:bg-gray-800 text-on-surface-variant')}>
                                {fmt(count)}
                            </span>
                        )}
                        {/* خط زیرین تب فعال */}
                        <span className={cn('absolute bottom-0 inset-x-2.5 lg:inset-x-3 h-[2.5px] rounded-t-full bg-primary transition-opacity',
                            isActive ? 'opacity-100' : 'opacity-0')} />
                    </button>
                );
            })}
        </nav>
    );
}
