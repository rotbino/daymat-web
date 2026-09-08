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
    /**
     * اگه true باشه (پیش‌فرض)، وقتی کاربر چیزی تایپ کنه که نباشه،
     * راهنمای «صنف جدید ساخته می‌شه» نشون داده می‌شه و بک‌اند خودش می‌سازه.
     *
     * اگه false باشه (برای فیلتر/سرچ)، هیچ راهنمایی نشون داده نمی‌شه
     * و فقط از نتایج موجود استفاده می‌شه.
     */
    allowCreate?: boolean;
}

/**
 * IndustryAutocomplete — کامپوننت جستجوی صنف
 *
 * ✅ Silent operation — هیچ پیام «پیدا نشد» نمی‌ده
 * ✅ Auto-create — اگه allowCreate=true باشه و کاربر چیزی تایپ کنه که نباشه، بک‌اند خودش می‌سازه
 * ✅ Auto-select — اگه متن دقیقاً match باشه، خودکار انتخاب می‌شه
 * ✅ Defensive parsing — هندل همه‌ی فرمت‌های ممکن بک‌اند
 */
export default function IndustryAutocomplete({
    value,
    onChange,
    placeholder = 'صنف خود را وارد کنید...',
    className,
    allowCreate = true,
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
            allowCreate={allowCreate}
            createLabel="صنف"
        />
    );
}
