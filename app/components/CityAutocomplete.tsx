// app/components/CityAutocomplete.tsx
'use client';

import React from 'react';
import Autocomplete, { AutocompleteValue, AutocompleteItem } from './Autocomplete';
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

// ✅ کش محلی برای حفظ اطلاعات استان وقتی کاربر از لیست انتخاب می‌کنه
const cityCache = new Map<string, CityValue>();

/**
 * CityAutocomplete — جستجوی شهر
 *
 * کاربر فقط شهر رو سرچ می‌کنه — استان خودکار پیدا می‌شه.
 * نمایش در dropdown: «استان > شهر»
 *
 * ✅ Defensive parsing: هندل همه‌ی فرمت‌های ممکن بک‌اند
 *   - { items: [...] }
 *   - { data: [...], total }
 *   - [...]
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
                // اگه از لیست انتخاب شده، اطلاعات کامل رو از cache بگیر
                const cached = cityCache.get(v.id || '');
                if (cached) {
                    onChange(cached);
                } else {
                    onChange(v);
                }
            }}
            fetchFn={async (q): Promise<AutocompleteItem[]> => {
                const res: any = await apiService.location.searchCities(q);
                // ✅ Defensive parsing — هندل همه‌ی فرمت‌های ممکن
                let items: any[] = [];
                if (Array.isArray(res)) {
                    items = res;
                } else if (Array.isArray(res?.items)) {
                    items = res.items;
                } else if (Array.isArray(res?.data)) {
                    items = res.data;
                }
                return items.map((item: any) => {
                    const cityVal: CityValue = {
                        id: item.id,
                        title: item.title,
                        cityCode: item.cityCode,
                        provinceCode: item.provinceCode,
                        provinceTitle: item.provinceTitle,
                    };
                    // کش کن برای استفاده موقع انتخاب
                    cityCache.set(item.id, cityVal);
                    return {
                        id: item.id,
                        title: item.title,
                        // ✅ نمایش «استان > شهر» در dropdown
                        provinceTitle: item.provinceTitle,
                    } as AutocompleteItem;
                });
            }}
            queryKey="city-autocomplete"
            placeholder={placeholder}
            className={className}
            minChars={2}
            renderOption={(item) => (
                <span className="text-xs text-on-surface truncate">
                    {item.provinceTitle && (
                        <span className="text-on-surface-variant/60">
                            {item.provinceTitle} <span className="text-on-surface-variant/30">›</span>{' '}
                        </span>
                    )}
                    <span className="font-medium">{item.title}</span>
                </span>
            )}
        />
    );
}
