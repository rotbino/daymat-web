// app/components/LocationIndustryFilter.tsx
'use client';

import React from 'react';
import { DropSelector } from '@/components/common/DropSelector';
import { useIndustriesList, useProvincesList, useCitiesList } from '@/lib/api/apiHooks';
import { Loader2, MapPin, Building2, Filter, X } from 'lucide-react';

export interface FilterValue {
    provinceCode?: string;
    provinceTitle?: string;
    cityCode?: string;
    cityTitle?: string;
    industry?: string;        // title صنف
    industryId?: string;
}

interface Props {
    value: FilterValue;
    onChange: (v: FilterValue) => void;
    /** اگه true باشه، فیلتر استان هم نشون داده بشه (پیش‌فرض true) */
    showProvince?: boolean;
    /** اگه true باشه، فیلتر شهر هم نشون داده بشه (پیش‌فرض true) */
    showCity?: boolean;
    /** اگه true باشه، فیلتر صنف هم نشون داده بشه (پیش‌فرض true) */
    showIndustry?: boolean;
}

/**
 * LocationIndustryFilter — کامپوننت فیلتر استان/شهر/صنف
 *
 * از DropSelector استفاده می‌کنه و جستجوی client-side انجام می‌ده.
 * لیست استان‌ها، شهرها و اصناف یک بار fetch می‌شه و بعد کش می‌شه.
 *
 * رفتار:
 * - اگه استان انتخاب بشه، لیست شهرها به شهرهای اون استان محدود می‌شه
 * - اگه استان عوض بشه، شهر انتخاب‌شده پاک می‌شه
 * - هر DropSelector سرچ داخلی داره (وقتی >۱۰ آیتم باشه)
 */
export default function LocationIndustryFilter({
    value,
    onChange,
    showProvince = true,
    showCity = true,
    showIndustry = true,
}: Props) {
    const industriesQ = useIndustriesList(true);
    const provincesQ = useProvincesList();
    const citiesQ = useCitiesList(value.provinceCode);

    const industries = (industriesQ.data?.items || []).map((i) => ({
        value: i.title,
        label: i.title,
        extra: { id: i.id },
    }));
    const provinces = (provincesQ.data?.items || []).map((p) => ({
        value: p.provinceCode,
        label: p.title,
        extra: { title: p.title },
    }));
    const cities = (citiesQ.data?.items || []).map((c) => ({
        value: c.cityCode,
        label: c.title,
        extra: { title: c.title, provinceCode: c.provinceCode },
    }));

    const hasActiveFilter = !!(value.provinceCode || value.cityCode || value.industry);

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {showProvince && (
                    <div className="relative">
                        <MapPin className="absolute right-2 top-3 w-3.5 h-3.5 text-on-surface-variant/40 pointer-events-none z-10" />
                        <div className="pr-6">
                            <DropSelector
                                value={value.provinceCode || ''}
                                options={provinces}
                                placeholder="همه استان‌ها"
                                disabled={provincesQ.isLoading}
                                onChange={(val, opt) => {
                                    if (!val) {
                                        // پاک کردن استان → شهر هم پاک می‌شه
                                        onChange({ ...value, provinceCode: undefined, provinceTitle: undefined, cityCode: undefined, cityTitle: undefined });
                                    } else {
                                        onChange({
                                            ...value,
                                            provinceCode: val,
                                            provinceTitle: opt.extra?.title || opt.label,
                                            cityCode: undefined,  // شهر قبلی پاک می‌شه
                                            cityTitle: undefined,
                                        });
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                {showCity && (
                    <div className="relative">
                        <MapPin className="absolute right-2 top-3 w-3.5 h-3.5 text-on-surface-variant/40 pointer-events-none z-10" />
                        <div className="pr-6">
                            <DropSelector
                                value={value.cityCode || ''}
                                options={cities}
                                placeholder={value.provinceCode ? 'همه شهرهای استان' : 'همه شهرها'}
                                disabled={citiesQ.isLoading || !provinces.length}
                                onChange={(val, opt) => {
                                    if (!val) {
                                        onChange({ ...value, cityCode: undefined, cityTitle: undefined });
                                    } else {
                                        onChange({
                                            ...value,
                                            cityCode: val,
                                            cityTitle: opt.extra?.title || opt.label,
                                            // اگه استان انتخاب نشده، از شهر انتخاب‌شده بگیر
                                            provinceCode: value.provinceCode || opt.extra?.provinceCode,
                                        });
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                {showIndustry && (
                    <div className="relative">
                        <Building2 className="absolute right-2 top-3 w-3.5 h-3.5 text-on-surface-variant/40 pointer-events-none z-10" />
                        <div className="pr-6">
                            <DropSelector
                                value={value.industry || ''}
                                options={industries}
                                placeholder="همه اصناف"
                                disabled={industriesQ.isLoading}
                                onChange={(val, opt) => {
                                    if (!val) {
                                        onChange({ ...value, industry: undefined, industryId: undefined });
                                    } else {
                                        onChange({
                                            ...value,
                                            industry: val,
                                            industryId: opt.extra?.id,
                                        });
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* دکمه پاک کردن همه فیلترها */}
            {hasActiveFilter && (
                <button
                    onClick={() => onChange({})}
                    className="flex items-center gap-1 text-[10px] font-bold text-error/70 hover:text-error transition-colors"
                >
                    <X className="w-3 h-3" />
                    پاک کردن همه فیلترها
                </button>
            )}
        </div>
    );
}
