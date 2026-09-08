// app/components/ProductReferencePicker.tsx
'use client';

import React from 'react';
import EntityPicker, { EntityValue } from './EntityPicker';
import { apiService } from '@/lib/api/apiService';
import { Package } from 'lucide-react';

export interface ProductValue extends EntityValue {
    brandId?: string;
    brandTitle?: string;
    category?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
}

interface Props {
    value: ProductValue | null;
    onChange: (product: ProductValue | null) => void;
    /** دسته کالا برای فیلتر */
    category?: string;
    placeholder?: string;
    label?: string;
    required?: boolean;
    error?: string;
}

/**
 * ProductReferencePicker — انتخابگر کالای مرجع با DropSelector-style
 *
 * ✅ بر اساس EntityPicker
 * ✅ جستجوی client-side (لیست یکجا fetch و cache می‌شه)
 * ✅ سرچ روی title و keywords
 * ✅ اگه پیدا نشد، دکمه «ایجاد کالای جدید» ظاهر می‌شه
 * ✅ هشدار اگه تکراری باشه
 * ✅ isByUser badge
 * ✅ نمایش عکس و برند کالا
 */
export default function ProductReferencePicker({
    value,
    onChange,
    category,
    placeholder = 'انتخاب کالا...',
    label = 'کالا',
    required = false,
    error,
}: Props) {
    return (
        <EntityPicker
            value={value}
            onChange={onChange}
            label={label}
            placeholder={placeholder}
            required={required}
            error={error}
            icon={<Package className="w-3.5 h-3.5 text-on-surface-variant" />}
            listFn={() => apiService.product.list(category, false)}
            createFn={(title) => apiService.product.create({ title, category })}
            queryKey={`products-list-picker-${category || 'all'}`}
            createLabel="ایجاد کالای جدید"
            renderValue={(v) => (
                <>
                    {(v as ProductValue).thumbnailUrl || (v as ProductValue).imageUrl ? (
                        <img src={(v as ProductValue).thumbnailUrl || (v as ProductValue).imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                        <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-primary" />
                        </span>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{v.title}</p>
                        {(v as ProductValue).brandTitle && (
                            <p className="text-[10px] text-on-surface-variant truncate">برند: {(v as ProductValue).brandTitle}</p>
                        )}
                    </div>
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
                    {item.thumbnailUrl || item.imageUrl ? (
                        <img src={item.thumbnailUrl || item.imageUrl} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                        <span className="w-11 h-11 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-on-surface-variant/50" />
                        </span>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{item.title}</p>
                        {item.brand?.title && (
                            <p className="text-[10px] text-on-surface-variant truncate">برند: {item.brand.title}</p>
                        )}
                    </div>
                    {item.isByUser && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex-shrink-0">
                            جدید
                        </span>
                    )}
                    {value?.id === item.id && <span className="w-4 h-4 text-primary flex-shrink-0">✓</span>}
                </>
            )}
        />
    );
}
