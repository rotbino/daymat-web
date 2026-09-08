// app/components/IndustryAutocomplete.tsx
'use client';

import React from 'react';
import Autocomplete, { AutocompleteValue, AutocompleteItem } from './Autocomplete';
import { apiService } from '@/lib/api/apiService';

interface Props {
    value: AutocompleteValue;
    onChange: (value: AutocompleteValue) => void;
    placeholder?: string;
    className?: string;
}

/**
 * IndustryAutocomplete — کامپوننت جستجوی صنف
 *
 * از Autocomplete generic استفاده می‌کنه.
 *
 * نکته: کاملاً خاموش — هیچ پیام «پیدا نشد» یا «از قبل وجود داره» نمی‌ده.
 * اگه کاربر چیزی تایپ کنه که match باشه، خودکار انتخاب می‌شه.
 * اگه نباشه، بک‌اند خودش می‌سازه.
 *
 * ✅ Defensive parsing: بک‌اند ممکنه هر کدوم از این فرمت‌ها رو برگردونه:
 *   - { items: [...] }         ← فرمت جدید (پس از fix)
 *   - { data: [...], total }   ← فرمت قدیمی (قبل از fix)
 *   - [...]                    ← آرایه مستقیم
 *   ما همه‌ی این موارد رو هندل می‌کنیم.
 */
export default function IndustryAutocomplete({
    value,
    onChange,
    placeholder = 'صنف خود را وارد کنید...',
    className,
}: Props) {
    return (
        <Autocomplete
            value={value}
            onChange={onChange}
            fetchFn={async (q): Promise<AutocompleteItem[]> => {
                const res: any = await apiService.industry.autocomplete(q);
                // ✅ Defensive parsing — هندل همه‌ی فرمت‌های ممکن
                let items: any[] = [];
                if (Array.isArray(res)) {
                    items = res;
                } else if (Array.isArray(res?.items)) {
                    items = res.items;
                } else if (Array.isArray(res?.data)) {
                    items = res.data;
                }
                return items.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                }));
            }}
            queryKey="industry-autocomplete"
            placeholder={placeholder}
            className={className}
            minChars={2}
        />
    );
}
