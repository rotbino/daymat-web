// app/components/BusinessTypeSelector.tsx
'use client';

import React, { useMemo } from 'react';
import { BUSINESS_TYPE } from '@/lib/api/data-types';
import { ArrowRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    /** sector (سطح اول) */
    sector: string;
    /** role (سطح دوم) */
    role: string;
    onSectorChange: (sector: string) => void;
    onRoleChange: (role: string) => void;
    label?: string;
    required?: boolean;
}

/**
 * BusinessTypeSelector — انتخاب «نوع فعالیت» دو سطحی در یک نوار افقی
 *
 * سطح ۱: نوار افقی دسته‌ها (تولید و صنعت، بازرگانی، …)
 * بعد از انتخاب دسته: همان نوار → [↩ بازگشت] [دستهٔ انتخاب‌شده] | نقش‌ها به‌صورت افقی
 *
 * - sector: سطح اول (manufacturing, trade, distribution, retail, service)
 * - role: سطح دوم (raw_material, wholesaler, store, ...) — فیلد اصلی نمایش
 * - وقتی sector عوض شه، role پاک می‌شه.
 */
export default function BusinessTypeSelector({
    sector,
    role,
    onSectorChange,
    onRoleChange,
    label = 'نوع فعالیت',
    required = false,
}: Props) {
    const sectorOptions = useMemo(() =>
        BUSINESS_TYPE.map((s: any) => ({
            value: s.id,
            label: s.label,
        })),
    []);

    const sectorData = useMemo(
        () => BUSINESS_TYPE.find((s: any) => s.id === sector) as any,
        [sector],
    );

    const roleOptions = useMemo(() => {
        if (!sectorData?.children) return [];
        return sectorData.children.map((c: any) => ({
            value: c.id,
            label: c.label,
        }));
    }, [sectorData]);

    const backToSectors = () => {
        onSectorChange('');
        onRoleChange('');
    };

    const chipCls = (active: boolean) => cn(
        'flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors whitespace-nowrap',
        active
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-outline-variant/40 dark:border-gray-700 text-on-surface-variant hover:border-primary/40 hover:text-primary',
    );

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-xs font-bold text-on-surface block flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-on-surface-variant" />
                    {label}
                    {required && <span className="text-primary">*</span>}
                </label>
            )}

            {/* نوار افقی — سطح ۱ و سطح ۲ در همان نوار */}
            <div className="rounded-xl border border-outline-variant/40 dark:border-gray-700 bg-surface-container-lowest p-2">
                {!sector ? (
                    /* ── سطح ۱: انتخاب دسته ── */
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-slim">
                        {sectorOptions.map((s) => (
                            <button key={s.value} type="button"
                                    onClick={() => onSectorChange(s.value)}
                                    className={chipCls(false)}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    /* ── سطح ۲: بازگشت + دستهٔ انتخاب‌شده + نقش‌ها ── */
                    <div className="flex items-center gap-1.5">
                        <button type="button" onClick={backToSectors} title="تغییر دسته"
                                className="w-7 h-7 rounded-full grid place-items-center flex-shrink-0
                                    text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors">
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <span className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-extrabold
                                bg-primary text-on-primary">
                            {sectorData?.label}
                        </span>
                        <span className="w-px h-6 bg-outline-variant/40 dark:bg-gray-700 flex-shrink-0" />
                        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-slim">
                            {roleOptions.map((r) => (
                                <button key={r.value} type="button"
                                        onClick={() => onRoleChange(r.value)}
                                        className={chipCls(role === r.value)}>
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
