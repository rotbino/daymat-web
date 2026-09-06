// app/components/ArmLocationSelector.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, MapPin, Building2, MapPinned } from 'lucide-react';
import { RootState } from '@/lib/store/store';

interface LocationSelectorProps {
    provinceCode: string;
    cityCode: string;
    onProvinceChange: (code: string, label: string) => void;
    onCityChange: (code: string, label: string) => void;
    error?: string;
}

export function ArmLocationSelector({
                                        provinceCode,
                                        cityCode,
                                        onProvinceChange,
                                        onCityChange,
                                        error,
                                    }: LocationSelectorProps) {
    const { currentArm } = useSelector((state: RootState) => state.arm);
    const locationTree = currentArm?.locationTree || [];

    const [selectedProvince, setSelectedProvince] = useState<string>(provinceCode);
    const [selectedCity, setSelectedCity] = useState<string>(cityCode);

    console.log('🔍 ArmLocationSelector رندر شد:');
    console.log('  provinceCode:', provinceCode);
    console.log('  cityCode:', cityCode);
    console.log('  selectedProvince:', selectedProvince);
    console.log('  selectedCity:', selectedCity);

    // ============================================================
    // ✅ استخراج استان‌ها و شهرها از locationTree
    // ============================================================
    const locationData = useMemo(() => {
        const provinces: { id: string; label: string; code: string }[] = [];
        const citiesByProvince: Record<string, { id: string; label: string; code: string }[]> = {};

        for (const node of locationTree) {
            if (node.type === 'province') {
                provinces.push({
                    id: node.id,
                    label: node.title,
                    code: node.provinceCode || node.id,
                });

                const cities: { id: string; label: string; code: string }[] = [];
                if (node.children && node.children.length > 0) {
                    for (const child of node.children) {
                        if (child.type === 'city') {
                            cities.push({
                                id: child.id,
                                label: child.title,
                                code: child.cityCode || child.id,
                            });
                        }
                    }
                }
                citiesByProvince[node.id] = cities;
            }
        }

        return { provinces, citiesByProvince };
    }, [locationTree]);

    const hasLocationData = locationData.provinces.length > 0;
    const totalProvinces = locationData.provinces.length;

    // ============================================================
    // ✅ تشخیص سناریوها
    // ============================================================
    const hasSingleProvince = totalProvinces === 1;
    const singleProvince = hasSingleProvince ? locationData.provinces[0] : null;
    const hasSingleCity = hasSingleProvince && locationData.citiesByProvince[singleProvince!.id]?.length === 1;
    const singleCity = hasSingleCity ? locationData.citiesByProvince[singleProvince!.id][0] : null;
    const hasSingleProvinceMultipleCities = hasSingleProvince && locationData.citiesByProvince[singleProvince!.id]?.length > 1;

    // ============================================================
    // ✅ شهرهای استان انتخاب شده
    // ============================================================
    const getCitiesForProvince = (provinceId: string) => {
        return locationData.citiesByProvince[provinceId] || [];
    };

    // ============================================================
    // ✅ همگام‌سازی با props
    // ============================================================
    useEffect(() => {
        console.log('📍 Sync province:', provinceCode);
        if (provinceCode && provinceCode !== selectedProvince) {
            setSelectedProvince(provinceCode);
        }
    }, [provinceCode]);

    useEffect(() => {
        console.log('📍 Sync city:', cityCode);
        if (cityCode && cityCode !== selectedCity) {
            setSelectedCity(cityCode);
        }
    }, [cityCode]);

    // ============================================================
    // ✅ اگر locationTree عوض شد و selectedProvince معتبر نیست، ریست کن
    // ============================================================
    useEffect(() => {
        if (locationTree.length > 0 && selectedProvince) {
            const stillExists = locationData.provinces.some(p => p.code === selectedProvince);
            if (!stillExists) {
                setSelectedProvince('');
                setSelectedCity('');
                onProvinceChange('', '');
                onCityChange('', '');
            }
        }
    }, [locationTree, selectedProvince, locationData.provinces]);

    // ============================================================
    // ✅ اگر داده‌ای وجود نداشته باشد
    // ============================================================
    if (!hasLocationData) {
        return (
            <div className="text-sm text-warning p-3 border border-warning/30 rounded-lg bg-warning/5">
                ⚠️ برای این بازار هیچ استانی تعریف نشده است
            </div>
        );
    }

    // ============================================================
    // ✅ سناریو ۱: فقط یک شهر → فقط برچسب
    // ============================================================
    if (hasSingleCity) {
        useEffect(() => {
            if (singleProvince && singleCity) {
                if (!provinceCode || !cityCode) {
                    onProvinceChange(singleProvince.code, singleProvince.label);
                    onCityChange(singleCity.code, singleCity.label);
                }
            }
        }, []);

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="font-label-md text-label-md text-on-surface-variant block">
                            استان <span className="text-primary">*</span>
                        </label>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span>{singleProvince?.label}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="font-label-md text-label-md text-on-surface-variant block">
                            شهر <span className="text-primary">*</span>
                        </label>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface">
                            <MapPinned className="w-4 h-4 text-primary" />
                            <span>{singleCity?.label}</span>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-on-surface-variant/70">
                    * این بازار فقط در شهر {singleCity?.label} فعال است
                </p>
            </div>
        );
    }

    // ============================================================
    // ✅ سناریو ۲: یک استان با چند شهر
    // ============================================================
    if (hasSingleProvinceMultipleCities) {
        const province = singleProvince!;
        const cities = getCitiesForProvince(province.id);

        useEffect(() => {
            if (!provinceCode) {
                onProvinceChange(province.code, province.label);
                setSelectedProvince(province.code);
            }
        }, []);

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="font-label-md text-label-md text-on-surface-variant block">
                            استان <span className="text-primary">*</span>
                        </label>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded text-sm text-on-surface">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span>{province.label}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="font-label-md text-label-md text-on-surface-variant block">
                            شهر <span className="text-primary">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={selectedCity || ''}
                                onChange={(e) => {
                                    const code = e.target.value; // ✅ الان code است
                                    const city = cities.find(c => c.code === code);
                                    const label = city?.label || '';
                                    setSelectedCity(code);
                                    onCityChange(code, label);
                                }}
                                className={`w-full  px-4 py-2.5 pr-12 font-body-md text-right appearance-none focus:ring-1 focus:ring-primary  outline-none transition-all  border border-outline-variant rounded text-sm text-on-surface ${
                                    error ? 'border-error' : 'border-outline'
                                }`}
                            >
                                <option value="">انتخاب شهر...</option>
                                {cities.map((city) => (
                                    <option key={city.code} value={city.code}>
                                        {city.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant opacity-60 pointer-events-none">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div className="absolute inset-y-0 left-10 flex items-center text-on-surface-variant opacity-60 pointer-events-none">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                        {error && <p className="text-error text-xs mt-1">{error}</p>}
                    </div>
                </div>
                <p className="text-xs text-on-surface-variant/70">
                    * این بازار در استان {province.label} و چند شهر فعال است
                </p>
            </div>
        );
    }

    // ============================================================
    // ✅ سناریو ۳: چند استان
    // ============================================================
    const selectedProvinceObj = locationData.provinces.find(p => p.code === selectedProvince);
    const cities = selectedProvinceObj ? getCitiesForProvince(selectedProvinceObj.id) : [];

    console.log('📍 سناریو ۳:');
    console.log('  selectedProvince:', selectedProvince);
    console.log('  selectedProvinceObj:', selectedProvinceObj);
    console.log('  cities:', cities);
    console.log('  selectedCity:', selectedCity);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* استان - سلکت */}
            <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant block">
                    استان <span className="text-primary">*</span>
                </label>
                <div className="relative">
                    <select
                        value={selectedProvince || ''}
                        onChange={(e) => {
                            const code = e.target.value;
                            const province = locationData.provinces.find(p => p.code === code);
                            const label = province?.label || '';
                            console.log('🔄 استان انتخاب شد:', { code, label });
                            setSelectedProvince(code);
                            setSelectedCity(''); // ✅ ریست شهر
                            onProvinceChange(code, label);
                            onCityChange('', ''); // ✅ ریست شهر در والد
                        }}
                        className="w-full bg-surface-container-lowest border border-outline h-12 px-4 pr-12 font-body-md text-right appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    >
                        <option value="">انتخاب استان...</option>
                        {locationData.provinces.map((province) => (
                            <option key={province.code} value={province.code}>
                                {province.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant opacity-60 pointer-events-none">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div className="absolute inset-y-0 left-10 flex items-center text-on-surface-variant opacity-60 pointer-events-none">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* شهر - سلکت */}
            <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant block">
                    شهر <span className="text-primary">*</span>
                </label>
                <div className="relative">
                    <select
                        value={selectedCity || ''}
                        onChange={(e) => {
                            const code = e.target.value; // ✅ الان code است
                            const city = cities.find(c => c.code === code);
                            const label = city?.label || '';
                            console.log('🔄 شهر انتخاب شد:', { code, label });
                            setSelectedCity(code);
                            onCityChange(code, label);
                        }}
                        disabled={!selectedProvince || cities.length === 0}
                        className={`w-full bg-surface-container-lowest border h-12 px-4 pr-12 font-body-md text-right appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all ${
                            !selectedProvince || cities.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        } ${error ? 'border-error' : 'border-outline'}`}
                    >
                        <option value="">
                            {!selectedProvince
                                ? 'ابتدا استان را انتخاب کنید'
                                : cities.length === 0
                                    ? 'هیچ شهری موجود نیست'
                                    : 'انتخاب شهر...'}
                        </option>
                        {cities.map((city) => (
                            <option key={city.code} value={city.code}>
                                {city.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant opacity-60 pointer-events-none">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div className="absolute inset-y-0 left-10 flex items-center text-on-surface-variant opacity-60 pointer-events-none">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
                {error && <p className="text-error text-xs mt-1">{error}</p>}
            </div>
        </div>
    );
}