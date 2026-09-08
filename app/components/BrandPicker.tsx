// app/components/BrandPicker.tsx
'use client';

import React, { useState } from 'react';
import EntityPicker, { EntityValue } from './EntityPicker';
import { apiService } from '@/lib/api/apiService';
import { Tag, Package } from 'lucide-react';
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
    allowNoBrand?: boolean;
}

export default function BrandPicker({
    value,
    onChange,
    category,
    placeholder = 'انتخاب برند...',
    label = 'برند',
    required = false,
    error,
    allowNoBrand = true,
}: Props) {
    const [hasBrand, setHasBrand] = useState<boolean>(!!value);

    const toggleHasBrand = (enabled: boolean) => {
        setHasBrand(enabled);
        if (!enabled) {
            onChange(null);
        }
    };

    return (
        <div className="space-y-2">
            {allowNoBrand && (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => toggleHasBrand(!hasBrand)}
                        className={cn(
                            'flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-bold border transition-all',
                            hasBrand
                                ? 'bg-primary/10 border-primary/40 text-primary'
                                : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant',
                        )}
                    >
                        <span className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                            hasBrand ? 'bg-primary border-primary' : 'border-outline-variant',
                        )}>
                            {hasBrand && <span className="text-white text-[10px]">✓</span>}
                        </span>
                        این کالا برند دارد
                    </button>
                    {!hasBrand && (
                        <span className="text-[10px] text-on-surface-variant/70 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            کالای بدون برند (عمومی)
                        </span>
                    )}
                </div>
            )}

            {hasBrand && (
                <EntityPicker
                    value={value}
                    onChange={onChange}
                    label={!allowNoBrand ? label : undefined}
                    placeholder={placeholder}
                    required={required || allowNoBrand}
                    error={error}
                    icon={<Tag className="w-3.5 h-3.5 text-on-surface-variant" />}
                    fetchFn={async (params) => {
                        const res = await apiService.brand.search(params.q, category, params.page, params.limit);
                        return { items: res.items, hasMore: res.hasMore };
                    }}
                    createFn={(title) => apiService.brand.create({ title, category })}
                    queryKey={`brands-picker-${category || 'all'}`}
                    createLabel="ایجاد برند جدید"
                    minSearchChars={2}
                    pageSize={10}
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
                            {v.isByUser && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex-shrink-0">
                                    جدید
                                </span>
                            )}
                            <span className="w-4 h-4 text-primary flex-shrink-0">✓</span>
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
                            {item.isByUser && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex-shrink-0">
                                    جدید
                                </span>
                            )}
                            {value?.id === item.id && <span className="w-4 h-4 text-primary flex-shrink-0">✓</span>}
                        </>
                    )}
                />
            )}
        </div>
    );
}
