// app/components/BrandPicker.tsx
'use client';

import React, { useState } from 'react';
import EntityPicker, { EntityValue } from './EntityPicker';
import { apiService } from '@/lib/api/apiService';
import { Tag, Check, CircleSlash } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BrandValue extends EntityValue {
    category?: string;
    logoUrl?: string;
}

interface Props {
    value: BrandValue | null;
    onChange: (brand: BrandValue | null) => void;
    category?: string;
    placeholder?: string;
    label?: string;
    required?: boolean;
    error?: string;
    /** اگه true باشه، toggle «دارای برند / بدون برند» نشون داده می‌شه */
    allowNoBrand?: boolean;
    /** ✅ mode کنترل‌شده از parent: null=انتخاب نشده، true=دارای برند، false=بدون برند */
    mode?: boolean | null;
    onModeChange?: (mode: boolean | null) => void;
    /** ✅ اسلاگ بازار مبدأ — ثبت برند به این بازار منتسب می‌شود (برای نظارت مالک بازار) */
    armSlug?: string;
}

/**
 * BrandPicker — انتخابگر برند مستقل
 *
 * ✅ برند یه موجودیت مستقل از کالاست (استاندارد دیجیکالا/آمازون)
 * ✅ دو حالت: «دارای برند» / «بدون برند» (هیچ‌کدوم پیش‌فرض انتخاب نشده)
 * ✅ EntityPicker با pagination + create
 * ✅ پیام تکراری و راهنمای create
 */
export default function BrandPicker({
    value,
    onChange,
    category,
    placeholder = 'مثلاً: مکنزی',
    label = 'برند',
    required = false,
    error,
    allowNoBrand = true,
    mode,
    onModeChange,
    armSlug,
}: Props) {
    // ✅ controlled mode (از parent) یا uncontrolled (داخلی)
    const [internalMode, setInternalMode] = useState<boolean | null>(!!value ? true : null);
    const brandMode = mode !== undefined ? mode : internalMode;
    const setBrandMode = (m: boolean | null) => {
        if (onModeChange) onModeChange(m);
        else setInternalMode(m);
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-xs font-bold text-on-surface block flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-on-surface-variant" />
                    {label}
                    {required && <span className="text-primary">*</span>}
                </label>
            )}

            {allowNoBrand && (
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-container-high/60 border border-outline-variant/25">
                    <button
                        type="button"
                        onClick={() => { setBrandMode(true); }}
                        className={cn(
                            'flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold transition-all',
                            brandMode === true
                                ? 'bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/25'
                                : 'text-on-surface-variant hover:text-on-surface',
                        )}
                    >
                        <Tag className="w-3.5 h-3.5" />
                        دارای برند
                    </button>
                    <button
                        type="button"
                        onClick={() => { setBrandMode(false); onChange(null); }}
                        className={cn(
                            'flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold transition-all',
                            brandMode === false
                                ? 'bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/25'
                                : 'text-on-surface-variant hover:text-on-surface',
                        )}
                    >
                        <CircleSlash className="w-3.5 h-3.5" />
                        بدون برند
                    </button>
                </div>
            )}

            {brandMode === true && (
                <EntityPicker
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required || allowNoBrand}
                    error={error}
                    icon={<Tag className="w-3.5 h-3.5 text-on-surface-variant" />}
                    fetchFn={async (params) => {
                        const res = await apiService.brand.search(params.q, category, params.page, params.limit);
                        return { items: res.items, hasMore: res.hasMore };
                    }}
                    createFn={async (data) => {
                        return apiService.brand.create({ title: data.title, category, armSlug });
                    }}
                    deleteFn={(id) => apiService.brand.delete(id)}
                    queryKey={`brands-picker-${category || 'all'}`}
                    createLabel="افزودن برند جدید"
                    addButtonLabel="ثبت برند جدید"
                    emptyHint="اگر این برند در لیست برندها وجود ندارد؟ یک بار آن را اضافه کنید تا همه از آن استفاده کنن."
                    minSearchChars={2}
                    pageSize={10}
                    selectTitle="انتخاب برند"
                    createTitle="افزودن برند جدید"
                    editTitle="ویرایش برند"
                    duplicateMessage="این برند قبلاً اضافه شده. با جستجو آن را پیدا و انتخاب کنید."
                    createHint="اگر این برند در لیست برندها وجود ندارد؟ یک بار آن را اضافه کنید تا همه از آن استفاده کنن."
                    renderValue={(v) => (
                        <>
                            {(v as BrandValue).logoUrl ? (
                                <img src={(v as BrandValue).logoUrl} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                            ) : (
                                <span className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Tag className="w-3.5 h-3.5 text-primary" />
                                </span>
                            )}
                            <span className="flex-1 text-sm font-bold text-on-surface truncate">{v.title}</span>
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        </>
                    )}
                    renderItem={(item) => (
                        <>
                            {item.logoUrl ? (
                                <img src={item.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                                <span className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                                    <Tag className="w-4 h-4 text-on-surface-variant/50" />
                                </span>
                            )}
                            <span className="flex-1 text-sm font-medium text-on-surface truncate">{item.title}</span>
                            {value?.id === item.id && (
                                <span className="w-5 h-5 rounded-full bg-primary grid place-items-center flex-shrink-0 shadow-sm">
                                    <Check className="w-3 h-3 text-on-primary" />
                                </span>
                            )}
                        </>
                    )}
                />
            )}

            {error && <p className="text-error text-[11px]">{error}</p>}
        </div>
    );
}
