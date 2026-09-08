// app/components/IndustryAutocomplete.tsx
'use client';

import React from 'react';
import Autocomplete, { AutocompleteValue } from './Autocomplete';
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
 * نکته: کاملاً خاموش — هیچ پیام «پیدا نشد» یا «از قبل وجود داره» نمی‌ده.
 * اگه کاربر چیزی تایپ کنه که match باشه، خودکار انتخاب می‌شه.
 * اگه نباشه، بک‌اند خودش می‌سازه.
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
            fetchFn={async (q) => {
                const res = await apiService.industry.autocomplete(q);
                return (res.items || []).map((item) => ({
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
