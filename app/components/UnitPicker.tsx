// app/components/UnitPicker.tsx
// ✅ سلکتور واحد قابل استفاده در همهٔ فرم‌ها — خواستهٔ مالک: «یک بار بساز، همه‌جا استفاده کن»
//    سرچ‌دار (Autocomplete ریشه) + واحدهای منتخب بازو/بازوی فروش اولِ لیست با بج «واحدهای من»
//    + پرکاربردها + کل مرجع واحد؛ تیک اختیاری «افزودن به واحدهای بازو» (مدیریت ذخیره با والد)
'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import Autocomplete from '@/app/components/Autocomplete';
import { UNIT_SUGGESTIONS } from '@/app/inquiries/utils';
import { cn } from '@/lib/utils';

export interface UnitValue {
    id: string | null;
    title: string;
}

interface Props {
    value: UnitValue;
    onChange: (v: UnitValue) => void;
    /** ✅ واحدهای منتخب بازو/بازوی فروش — اول لیست با بج «واحدهای من» (واحدهای استفاده‌شده همه‌جا می‌آیند) */
    catalogUnits?: { unitId: string; title?: string }[];
    /** ⌨️ اجازهٔ عنوان آزاد (واحد دلخواه بی‌مرجع) — پیش‌فرض خاموش */
    allowCreate?: boolean;
    placeholder?: string;
    className?: string;
    /** خطای اعتبارسنجی — متن قرمز زیر سلکت */
    error?: string;
    /** ✅ تیک «افزودن به واحدهای بازو» — اختیاری؛ فقط وقتی onFavoriteChange داده شده باشد رندر می‌شود */
    favorite?: boolean;
    onFavoriteChange?: (v: boolean) => void;
    favoriteLabel?: string;
}

export default function UnitPicker({
    value,
    onChange,
    catalogUnits,
    allowCreate = false,
    placeholder = 'واحد — جستجو کن',
    className,
    error,
    favorite,
    onFavoriteChange,
    favoriteLabel = 'افزودن به واحدهای بازو — دفعه‌های بعد سرِ دستت باشد',
}: Props) {
    // مرجع واحد — کش مشترک با بقیهٔ فرم‌ها (یک درخواست برای کل اپ)
    const { data: allUnits = [] } = useQuery({
        queryKey: ['units-all'],
        queryFn: () => apiService.ad.getAllUnits(),
        staleTime: 1000 * 60 * 60,
    });

    // ترتیب: واحدهای من (بازو/بازوی فروش) → پرکاربردها → بقیهٔ مرجع
    const orderedUnits = useMemo(() => {
        const list = allUnits as any[];
        const refById = new Map<string, any>(list.map((u) => [u.id, u]));
        const mine: any[] = [];
        for (const u of (catalogUnits as any[]) || []) {
            const ref = refById.get(u.unitId);
            const title = u.title || ref?.title || '';
            if (!title && !ref) continue;
            mine.push({ id: u.unitId, title, refTitle: ref?.title || title, custom: !!u.title });
        }
        const mineBaseIds = new Set(mine.map((u) => u.id));
        const sug = UNIT_SUGGESTIONS
            .map((t) => list.find((u) => u.title === t))
            .filter((u): u is any => !!u && !mineBaseIds.has(u.id));
        const sugIds = new Set(sug.map((u) => u.id));
        const rest = list.filter((u) => !mineBaseIds.has(u.id) && !sugIds.has(u.id));
        return [...mine, ...sug, ...rest];
    }, [allUnits, catalogUnits]);

    return (
        <div className="min-w-0">
            <Autocomplete
                value={{ id: value.id || null, title: value.title }}
                onChange={(v) => onChange({ id: v.id || null, title: v.title })}
                fetchFn={async (q) => {
                    const t = (q || '').trim();
                    return orderedUnits
                        .filter((u: any) => !t || (u.title || '').includes(t))
                        .slice(0, 40);
                }}
                queryKey="units-autocomplete"
                placeholder={placeholder}
                allowCreate={allowCreate}
                minChars={0}
                className={cn('h-10!', className)}
                renderOption={(u: any) => (
                    <span className="flex w-full items-center justify-between gap-2">
                        <span className="truncate">{u.title}</span>
                        {u.custom && (
                            <span className="shrink-0 rounded-full bg-brand-contrast-soft px-1.5 py-0.5 text-[8.5px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                واحدهای من
                            </span>
                        )}
                    </span>
                )}
            />
            {error && <p className="mt-1 px-1 text-[10px] font-bold text-red-500">{error}</p>}
            {onFavoriteChange && value.id && (
                <button type="button" onClick={() => onFavoriteChange(!favorite)}
                    className="mt-1.5 flex w-full items-center gap-2 rounded-xl px-1 py-1 text-right">
                    <span className={cn('grid size-5 place-items-center rounded-md border-2 transition-colors',
                        favorite ? 'border-brand-contrast bg-brand-contrast text-white' : 'border-stone-300 dark:border-gray-600')}>
                        {favorite && <span className="text-[10px] font-black leading-none">✓</span>}
                    </span>
                    <span className="text-[11px] font-bold text-stone-500 dark:text-gray-400">{favoriteLabel}</span>
                </button>
            )}
        </div>
    );
}
