// app/my-catalogs/components/ConsoleTabs.tsx
// ناوبری بخش‌های بازوی فروش — داخل «هدر کنسول» (والد) سوار می‌شود:
// والد نوار سفید/سایه‌دار چسبان را می‌سازد؛ اینجا فقط خودِ تب‌هاست.
// ترند روز: تب‌افقی آندرلاین به‌سبک Stripe/اینستاگرام — آیکون + برچسب، بدون شبیه‌شدن به دکمه
// موبایل: آیکون بالا + برچسب ریز پایین (عمودی) — ۴ تب بدون اسکرول افقی جا می‌گیرند
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { fmt, Tab } from '../constants';

export interface ConsoleTabItem {
    key: Tab;
    label: string;
    /** برچسب کوتاه‌تر موبایل — وقتی برچسب اصلی جا نمی‌شود (مثل «بازوی خرید» → «خریدها») */
    mobileLabel?: string;
    icon: any;
    count?: number;
    alert?: number; // ✅ بج قرمز — تعداد موارد در انتظار تعیین تکلیف
}

/** نوار تب‌ها — تب فعال = متن پررنگ + خط زیرین */
export default function ConsoleTabs({ items, active, onChange }: {
    items: ConsoleTabItem[];
    active: Tab;
    onChange: (t: Tab) => void;
}) {
    return (
        <div className="pt-1 lg:pt-1.5">
            <nav aria-label="بخش‌های بازوی فروش"
                 className="flex items-stretch">
                {items.map(({ key, label, mobileLabel, icon: Icon, count, alert }) => {
                    const isActive = active === key;
                    return (
                        <button key={key} type="button" onClick={() => onChange(key)} aria-current={isActive ? 'page' : undefined}
                                className={cn('relative flex-1 lg:flex-none flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-1.5 h-14 lg:h-14 px-1 lg:px-5 text-[10px] lg:text-sm whitespace-nowrap transition-colors',
                                    isActive
                                        ? 'text-primary font-extrabold'
                                        : 'text-on-surface-variant font-bold hover:text-on-surface active:scale-[0.98]')}>
                            <span className="relative">
                                <Icon className="w-[22px] h-[22px] lg:w-[18px] lg:h-[18px]" />
                                {!!alert && alert > 0 && (
                                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white
                                        text-[9px] font-black grid place-items-center ring-2 ring-white dark:ring-gray-900 animate-pulse">
                                        {alert > 9 ? '۹+' : alert.toLocaleString('fa-IR')}
                                    </span>
                                )}
                            </span>
                            <span className="flex items-center gap-1">
                                {mobileLabel ? (
                                    <>
                                        <span className="lg:hidden">{mobileLabel}</span>
                                        <span className="hidden lg:inline">{label}</span>
                                    </>
                                ) : label}
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
