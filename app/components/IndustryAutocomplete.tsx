// app/components/IndustryAutocomplete.tsx
'use client';

import React from 'react';
import EntityPicker, { EntityValue } from './EntityPicker';
import { apiService } from '@/lib/api/apiService';
import { Building2 } from 'lucide-react';

interface Props {
    value: EntityValue | null;
    onChange: (value: EntityValue | null) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    required?: boolean;
    error?: string;
    allowCreate?: boolean;
}

/**
 * IndustryAutocomplete — انتخابگر صنف با DropSelector-style
 *
 * ✅ بر اساس EntityPicker (قابل استفاده مجدد)
 * ✅ جستجوی client-side (لیست یکجا fetch و cache می‌شه)
 * ✅ اگه چیزی پیدا نشد، دکمه «ایجاد صنف جدید» ظاهر می‌شه
 * ✅ هشدار اگه تکراری باشه
 * ✅ isByUser badge برای صنف‌های کاربر-ساخته
 *
 * allowCreate:
 *   - true (پیش‌فرض): کاربر می‌تونه صنف جدید بسازه
 *   - false: فقط انتخاب از لیست (برای فیلتر)
 */
export default function IndustryAutocomplete({
    value,
    onChange,
    placeholder = 'صنف خود را انتخاب کنید...',
    className,
    label,
    required,
    error,
    allowCreate = true,
}: Props) {
    return (
        <EntityPicker
            value={value}
            onChange={onChange}
            label={label}
            placeholder={placeholder}
            required={required}
            error={error}
            icon={<Building2 className="w-3.5 h-3.5 text-on-surface-variant" />}
            listFn={() => apiService.industry.list(false)}
            createFn={allowCreate
                ? (title) => apiService.industry.createByUser(title)
                : async () => { throw new Error('ایجاد مجاز نیست'); }
            }
            queryKey="industries-list-picker"
            createLabel="ایجاد صنف جدید"
            className={className}
        />
    );
}
