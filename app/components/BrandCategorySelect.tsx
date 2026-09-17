// app/components/BrandCategorySelect.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { Layers, Loader2 } from 'lucide-react';

/** ✅ لیست دسته‌بندی‌های برند — تاکسونومی ثابت (فقط خواندنی) */
export function useBrandCategories() {
    return useQuery({
        queryKey: ['brand-categories'],
        queryFn: () => apiService.brand.categories(),
        staleTime: 5 * 60_000,
    });
}

interface Props {
    /** در فرم EntityPicker — مقدار خودکار در dataRef نوشته می‌شود (dataRef.categoryId) */
    dataRef?: React.MutableRefObject<{ [key: string]: any }>;
    /** پیش‌فرض در حالت ویرایش — از آیتم در حال ویرایش */
    initialData?: any;
    /** حالت کنترل‌شده (مثلاً پنل ادمین) */
    value?: string;
    onChange?: (v: string) => void;
    error?: string;
}

/**
 * BrandCategorySelect — فیلد الزامی «دستهٔ برند»
 *
 * ✅ دسته‌ها از لیست ثابت می‌آیند (GET /brands/categories) — کاربر دستهٔ جدید نمی‌سازد
 * ✅ انتخاب دسته موقع ثبت برند اجباری است تا بعداً برندهای هر بازو بشود محدود و تخصصی کرد
 */
export default function BrandCategorySelect({ dataRef, initialData, value: controlledValue, onChange, error }: Props) {
    const { data: categories, isLoading } = useBrandCategories();
    const initialValue =
        controlledValue ??
        initialData?.brandCategoryId ??
        initialData?.brandCategory?.id ??
        initialData?.categoryId ??
        '';
    const [internalValue, setInternalValue] = useState<string>(initialValue);
    const value = controlledValue ?? internalValue;

    // ✅ سینک مقدار به dataRef فرم EntityPicker — خالی بودن یعنی نامعتبر
    useEffect(() => {
        if (dataRef) {
            dataRef.current = { ...dataRef.current, categoryId: internalValue || undefined };
        }
    }, [internalValue, dataRef]);

    const handleChange = (v: string) => {
        setInternalValue(v);
        onChange?.(v);
    };

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface block flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-on-surface-variant" />
                دستهٔ برند
                <span className="text-primary">*</span>
            </label>
            {isLoading ? (
                <div className="w-full h-11 px-3 flex items-center gap-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface-variant/70">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    در حال دریافت دسته‌ها...
                </div>
            ) : (
                <select
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    className={error
                        ? 'w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-error/70 text-sm text-on-surface outline-none focus:ring-2 focus:ring-error/25 transition-all text-right'
                        : 'w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-right'}
                >
                    <option value="">انتخاب دستهٔ برند...</option>
                    {(categories || []).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            )}
            {error && <p className="text-error text-[11px]">{error}</p>}
        </div>
    );
}
