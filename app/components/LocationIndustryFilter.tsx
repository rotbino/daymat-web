// app/components/LocationIndustryFilter.tsx
'use client';

import React from 'react';
import { DropSelector } from '@/components/common/DropSelector';
import { useIndustriesList, useProvincesList, useCitiesList } from '@/lib/api/apiHooks';
import { Loader2, MapPin, Building2, X } from 'lucide-react';

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

    // ✅ Defensive: اگه data به‌صورت آرایه مستقیم اومد هم هندل کن
    const industriesRaw = (industriesQ.data as any)?.items || (Array.isArray(industriesQ.data) ? industriesQ.data : []);
    const provincesRaw = (provincesQ.data as any)?.items || (Array.isArray(provincesQ.data) ? provincesQ.data : []);
    const citiesRaw = (citiesQ.data as any)?.items || (Array.isArray(citiesQ.data) ? citiesQ.data : []);

    const industries = industriesRaw.map((i: any) => ({
        value: i.title || i.industryName || '',
        label: i.title || i.industryName || '',
        extra: { id: i.id },
    }));
    const provinces = provincesRaw.map((p: any) => ({
        value: p.provinceCode || p.slug || '',
        label: p.title || '',
        extra: { title: p.title },
    }));
    const cities = citiesRaw.map((c: any) => ({
        value: c.cityCode || '',
        label: c.title || '',
        extra: { title: c.title, provinceCode: c.provinceCode },
    }));

    const hasActiveFilter = !!(value.provinceCode || value.cityCode || value.industry);

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {showProvince && (
                    <div>
                        <label className="text-[10px] font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            استان
                        </label>
                        <DropSelector
                            value={value.provinceCode || ''}
                            options={provinces}
                            placeholder="همه استان‌ها"
                            disabled={provincesQ.isLoading}
                            onChange={(val, opt) => {
                                if (!val) {
                                    onChange({ ...value, provinceCode: undefined, provinceTitle: undefined, cityCode: undefined, cityTitle: undefined });
                                } else {
                                    onChange({
                                        ...value,
                                        provinceCode: val,
                                        provinceTitle: opt.extra?.title || opt.label,
                                        cityCode: undefined,
                                        cityTitle: undefined,
                                    });
                                }
                            }}
                        />
                    </div>
                )}

                {showCity && (
                    <div>
                        <label className="text-[10px] font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            شهر
                        </label>
                        <DropSelector
                            value={value.cityCode || ''}
                            options={cities}
                            placeholder={value.provinceCode ? 'همه شهرهای استان' : 'همه شهرها'}
                            disabled={citiesQ.isLoading}
                            onChange={(val, opt) => {
                                if (!val) {
                                    onChange({ ...value, cityCode: undefined, cityTitle: undefined });
                                } else {
                                    onChange({
                                        ...value,
                                        cityCode: val,
                                        cityTitle: opt.extra?.title || opt.label,
                                        provinceCode: value.provinceCode || opt.extra?.provinceCode,
                                    });
                                }
                            }}
                        />
                    </div>
                )}

                {showIndustry && (
                    <div>
                        <label className="text-[10px] font-bold text-on-surface-variant block mb-1 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            صنف
                        </label>
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
