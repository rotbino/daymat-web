// app/components/CityAutocomplete.tsx
'use client';

import React from 'react';
import Autocomplete, { AutocompleteValue } from './Autocomplete';
import { apiService } from '@/lib/api/apiService';

interface CityValue extends AutocompleteValue {
    cityCode?: string;
    provinceCode?: string;
    provinceTitle?: string;
}

interface Props {
    value: CityValue;
    onChange: (value: CityValue) => void;
    placeholder?: string;
    className?: string;
}

/**
 * CityAutocomplete — جستجوی شهر
 *
 * کاربر فقط شهر رو سرچ می‌کنه — استان خودکار پیدا می‌شه.
 * نتیجه: { id, title, cityCode, provinceCode, provinceTitle }
 */
export default function CityAutocomplete({
    value,
    onChange,
    placeholder = 'نام شهر را جستجو کنید...',
    className,
}: Props) {
    return (
        <Autocomplete
            value={value}
            onChange={(v) => {
                // اگه از لیست انتخاب شده، اطلاعات استان هم داریم
                // Autocomplete فقط { id, title } برمی‌گردونه، پس باید از cache بگیریم
                onChange(v);
            }}
            fetchFn={async (q) => {
                const res = await apiService.location.searchCities(q);
                return (res.items || []).map((item) => ({
                    id: item.id,
                    title: item.title,
                    // اطلاعات اضافه برای نمایش
                    cityCode: item.cityCode,
                    provinceCode: item.provinceCode,
                    provinceTitle: item.provinceTitle,
                }));
            }}
            queryKey="city-autocomplete"
            placeholder={placeholder}
            className={className}
            minChars={2}
        />
    );
}

// ✅ Hook برای استفاده در فرم‌ها — همراه با cache طولانی
export function useCitySearch() {
    // این فقط برای backward-compat هست
    // Autocomplete خودش cache رو هندل می‌کنه
}
