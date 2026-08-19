// app/components/IranLocationSelector.tsx
'use client';

import React, { useMemo } from 'react';
import { DropSelector } from '@/components/common/DropSelector';
import { useLocationsTree } from '@/lib/api/apiHooks';

interface IranLocationSelectorProps {
    provinceCode: string;
    cityCode: string;
    onProvinceChange: (provinceCode: string, provinceLabel: string) => void; // اکنون دو آرگومان دارد
    onCityChange: (cityCode: string, cityLabel: string) => void;             // اکنون دو آرگومان دارد
    disabled?: boolean;
    className?: string;
}

export function IranLocationSelector({
                                         provinceCode,
                                         cityCode,
                                         onProvinceChange,
                                         onCityChange,
                                         disabled = false,
                                         className = '',
                                     }: IranLocationSelectorProps) {
    const { data: tree, isLoading } = useLocationsTree();

    // ۱. گره کشور ایران
    const iranNode = useMemo(() => {
        if (!tree) return null;
        return tree.find((node: any) => node.type === 'country' && node.title === 'ایران');
    }, [tree]);

    // ۲. استان‌های ایران با کد رسمی
    const provinces = useMemo(() => {
        if (!iranNode?.children) return [];
        return iranNode.children
            .filter((node: any) => node.type === 'province')
            .map((node: any) => ({
                value: node.provinceCode || node.id,   // ✅ کد رسمی
                label: node.title,
                children: node.children || [],
            }));
    }, [iranNode]);

    // استان انتخاب‌شده بر اساس کد رسمی
    const selectedProvince = useMemo(() => {
        return provinces.find(p => p.value === provinceCode) || null;
    }, [provinces, provinceCode]);

    // ۳. شهرهای استان انتخاب‌شده با کد رسمی
    const cities = useMemo(() => {
        if (!selectedProvince) return [];
        return selectedProvince.children
            .filter((node: any) => node.type === 'city')
            .map((node: any) => ({
                value: node.cityCode || node.id,
                label: node.title,
            }));
    }, [selectedProvince]);

    const handleProvinceChange = (value: string, option: any) => {
        onProvinceChange(value, option?.label || '');
        onCityChange('', ''); // ریست شهر
    };

    const handleCityChange = (value: string, option: any) => {
        onCityChange(value, option?.label || '');
    };

    return (
        <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
            <div className="flex-1">
                <DropSelector
                    label="استان"
                    value={provinceCode}
                    options={provinces}
                    onChange={handleProvinceChange}
                    placeholder="انتخاب استان..."
                    disabled={disabled || isLoading || !iranNode}
                />
            </div>
            <div className="flex-1">
                <DropSelector
                    label="شهر"
                    value={cityCode}
                    options={cities}
                    onChange={handleCityChange}
                    placeholder={selectedProvince ? 'انتخاب شهر...' : 'ابتدا استان را انتخاب کنید'}
                    disabled={disabled || isLoading || !selectedProvince}
                />
            </div>
        </div>
    );
}