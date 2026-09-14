// app/admin/arm/components/BoardModulesSection.tsx
'use client';

import React from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Tags, ShoppingCart, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ✅ «دیوارهای بازار» — سوییچ روشن/خاموش دو دیوار اصلی در تب ماژول‌ها
 *   مقدار روی config.modules.{priceTable|buyLead}.enabled می‌نویسد (undefined = روشن).
 *   ناوبری سایت، صفحهٔ خریداران و API تابلوها همین فلاگ را ملاک قرار می‌دهند:
 *     - دیوار فروشندگان خاموش → لینک «فروشندگان» حذف و ‎/{slug} به خریداران می‌رود
 *     - دیوار خریداران خاموش → لینک «خریداران» حذف و GET /inquiry/arm/:slug خطای BOARD_DISABLED می‌دهد
 *   💡 ماژول‌های همیشه‌فعال (کاتالوگ فروش / تابلوی خرید) سوییچ ندارند — تنظیماتشان در کارت‌های زیرین است.
 */

const BOARDS = [
    {
        key: 'priceTable' as const,
        label: 'دیوار فروشندگان',
        sub: 'تابلوی قیمت — صفحهٔ اول بازار (هوم)',
        hint: 'آگهی‌ها و قیمت‌های عمدهٔ فروشندگانِ عضو روی این دیوار می‌نشیند',
        icon: Tags,
        accent: 'text-primary',
        activeCls: 'bg-primary/5 border-primary/30',
    },
    {
        key: 'buyLead' as const,
        label: 'دیوار خریداران',
        sub: 'تابلوهای خرید اعضا — صفحهٔ ‎/buyers',
        hint: 'تابلوی خریدِ هر خریدار را مدیر روی این دیوار می‌گذارد تا درخواست‌های همکاری‌اش دیده شود',
        icon: ShoppingCart,
        accent: 'text-amber-600 dark:text-amber-400',
        activeCls: 'bg-amber-500/5 border-amber-500/30',
    },
];

export function BoardModulesSection({ watch, setValue }: {
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
}) {
    const isEnabled = (moduleKey: 'priceTable' | 'buyLead') => {
        const v = watch(`config.modules.${moduleKey}.enabled`);
        return v !== false; // undefined = روشن (پیش‌فرض)
    };

    const toggle = (moduleKey: 'priceTable' | 'buyLead', next: boolean) => {
        setValue(`config.modules.${moduleKey}.enabled`, next, { shouldDirty: true });
    };

    const bothOff = BOARDS.every((b) => !isEnabled(b.key));

    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-extrabold text-on-surface">دیوارهای بازار</h3>
                <p className="text-[11px] text-on-surface-variant/70 mt-0.5">
                    تعیین کن این بازار کدام دیوارها را داشته باشد — ناوبری، صفحات و API همین‌جا کنترل می‌شود.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BOARDS.map((b) => {
                    const on = isEnabled(b.key);
                    return (
                        <div
                            key={b.key}
                            className={cn(
                                'rounded-xl border p-4 transition-all',
                                on ? b.activeCls : 'bg-surface-container-lowest border-outline-variant/20',
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={cn(
                                        'w-9 h-9 rounded-lg bg-white dark:bg-gray-800 border border-outline-variant/20 grid place-items-center flex-shrink-0',
                                    )}>
                                        <b.icon className={cn('w-4.5 h-4.5', on ? b.accent : 'text-on-surface-variant/40')} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={cn('text-[13px] font-extrabold', on ? 'text-on-surface' : 'text-on-surface-variant/60')}>
                                            {b.label}
                                        </p>
                                        <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{b.sub}</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={on}
                                        onChange={(e) => toggle(b.key, e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className={cn(
                                        "w-10 h-5.5 rounded-full relative transition-all duration-200",
                                        on
                                            ? b.key === 'buyLead' ? 'bg-amber-500 after:translate-x-4.5' : 'bg-primary after:translate-x-4.5'
                                            : 'bg-outline-variant after:translate-x-0',
                                        "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all after:duration-200 after:shadow-sm",
                                    )} />
                                </label>
                            </div>
                            <p className="text-[10px] text-on-surface-variant/50 mt-2.5 leading-4">{b.hint}</p>
                        </div>
                    );
                })}
            </div>

            {bothOff && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/50 px-3.5 py-2.5">
                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        هر دو دیوار خاموش است — بازاری بدون دیوار برای بازدیدکننده قابل استفاده نیست. حداقل یکی را روشن نگه دار.
                    </p>
                </div>
            )}

            <p className="text-[10px] text-on-surface-variant/50 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                پس از ذخیره، ناوبری سایت و دسترسی تابلوها بلافاصله به‌روز می‌شود.
            </p>
        </div>
    );
}

export default BoardModulesSection;
