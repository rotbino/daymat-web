// app/components/LocationFilter.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom'; // ✅ ۱. ایمپورت پرتال
import { useSelector } from 'react-redux';
import {
    MapPin, ChevronDown, X, Check, ArrowRight
} from 'lucide-react';
import { RootState } from '@/lib/store/store';
import { useFilters } from '@/lib/hooks/useFilters';

export function LocationFilter() {
    const { currentArm } = useSelector((state: RootState) => state.arm);
    const locationTree = currentArm?.locationTree || [];

    const { location, setProvince, setCity, clearLocation } = useFilters();

    const [showModal, setShowModal] = useState(false);
    const [tempProvince, setTempProvince] = useState<string>(location.provinceId);
    const [step, setStep] = useState<'provinces' | 'cities'>('provinces');

    const locationData = useMemo(() => {
        const provinces: { id: string; label: string; code: string }[] = [];
        const citiesByProvince: Record<string, { id: string; label: string; code: string }[]> = {};

        for (const node of locationTree) {
            if (node.type === 'province') {
                provinces.push({ id: node.id, label: node.title, code: node.provinceCode || node.id });
                const cities: { id: string; label: string; code: string }[] = [];
                if (node.children) {
                    for (const child of node.children) {
                        if (child.type === 'city') {
                            cities.push({ id: child.id, label: child.title, code: child.cityCode || child.id });
                        }
                    }
                }
                citiesByProvince[node.id] = cities;
            }
        }
        return { provinces, citiesByProvince };
    }, [locationTree]);

    const hasLocationData = locationData.provinces.length > 0;
    const hasSingleProvince = locationData.provinces.length === 1;
    const singleProvince = hasSingleProvince ? locationData.provinces[0] : null;
    const hasSingleCity = hasSingleProvince && (locationData.citiesByProvince[singleProvince!.id]?.length || 0) === 1;
    const singleCity = hasSingleCity ? locationData.citiesByProvince[singleProvince!.id][0] : null;
    const hasSingleProvinceMultipleCities = hasSingleProvince && !hasSingleCity;

    const availableCities = tempProvince ? (locationData.citiesByProvince[tempProvince] || []) : [];
    const currentProvinceLabel = locationData.provinces.find(p => p.id === tempProvince)?.label || '';

    const handleOpenModal = () => {
        setTempProvince(location.provinceId);
        if (hasSingleProvinceMultipleCities) {
            setStep('cities');
            setTempProvince(singleProvince!.id);
        } else {
            setStep('provinces');
        }
        setShowModal(true);
    };

    const handleSelectProvinceDirectly = (provinceId: string) => {
        const province = locationData.provinces.find(p => p.id === provinceId);
        if (province) {
            setProvince(provinceId, province.label, province.code);
            setCity('', '', '');
        } else {
            clearLocation();
        }
        setShowModal(false);
    };

    const handleGoToCities = (provinceId: string) => {
        setTempProvince(provinceId);
        setStep('cities');
    };

    const handleCitySelect = (cityId: string) => {
        const province = locationData.provinces.find(p => p.id === tempProvince);
        if (province) {
            setProvince(tempProvince, province.label, province.code);
        }
        const city = availableCities.find(c => c.id === cityId);
        if (city) {
            setCity(cityId, city.label, city.code);
        } else {
            setCity('', '', '');
        }
        setShowModal(false);
    };

    if (!hasLocationData) return null;

    if (hasSingleCity) {
        return (
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-on-surface-variant border border-outline-variant/50 rounded-md bg-surface-container-low">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{singleCity.label}</span>
            </div>
        );
    }

    const getButtonLabel = () => {
        if (location.cityId) return location.cityLabel;
        if (location.provinceId) return `استان ${location.provinceLabel}`;
        if (hasSingleProvinceMultipleCities) return singleProvince!.label;
        return 'بارگیری';
    };

    const getButtonIcon = () => {
        if (location.cityId) return <MapPin className="w-3.5 h-3.5" />;
        if (location.provinceId || hasSingleProvince) return <MapPin className="w-3.5 h-3.5" />;
        return <MapPin className="w-3.5 h-3.5" />;
    };

    const hasActiveFilter = !!location.cityId;

    return (
        <>
            <button
                onClick={handleOpenModal}
                className={`flex  h-8 items-center gap-1  py-1.5 px-1 text-[11px]  transition-all duration-200 rounded-3xl  ${
                    hasActiveFilter
                        ? 'text-primary border-primary/30 bg-primary/5'
                        : 'text-on-surface-variant border-outline-variant/50 hover:bg-surface-container-low'
                }`}
            >
                {getButtonIcon()}
                <span>{getButtonLabel()}</span>
              {/*  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showModal ? 'rotate-180' : ''}`} />*/}
                {hasActiveFilter && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
            </button>

            {/* ✅ ۲. پیچیدن مودال در createPortal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 backdrop-blur-sm pt-12">
                    <div className="bg-surface w-full max-w-[300px] rounded-lg shadow-2xl border border-outline-variant/50 overflow-hidden max-h-[80vh] mt-12 flex flex-col">

                        <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low flex-shrink-0">
                            <div className="flex items-center gap-2">
                                {step === 'cities' && !hasSingleProvinceMultipleCities && (
                                    <button onClick={() => setStep('provinces')} className="p-1 hover:bg-surface-container rounded-md transition-colors">
                                        <ArrowRight className="w-4 h-4 text-on-surface-variant rotate-180" />
                                    </button>
                                )}
                                <h3 className="font-bold text-sm text-on-surface">
                                    {step === 'cities' ? `شهرهای ${currentProvinceLabel}` : 'محل بارگیری'}
                                </h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-surface-container rounded-md transition-colors">
                                <X className="w-4 h-4 text-on-surface-variant" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-2 flex-1">
                            {step === 'provinces' && !hasSingleProvinceMultipleCities && (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => handleSelectProvinceDirectly('')}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md transition-colors ${
                                            !location.provinceId && !location.cityId ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface hover:bg-surface-container-low'
                                        }`}
                                    >
                                        <span>همه استان‌ها</span>
                                        {!location.provinceId && !location.cityId && <Check className="w-4 h-4" />}
                                    </button>

                                    {locationData.provinces.map((province) => {
                                        const cityCount = locationData.citiesByProvince[province.id]?.length || 0;
                                        const isSelected = location.provinceId === province.id && !location.cityId;
                                        return (
                                            <div key={province.id} className={`flex items-center rounded-md transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                                                <button
                                                    onClick={() => handleSelectProvinceDirectly(province.id)}
                                                    className={`flex-1 flex items-center justify-between px-3 py-2.5 text-sm ${isSelected ? 'text-primary font-medium' : 'text-on-surface'}`}
                                                >
                                                    <span>{province.label}</span>
                                                    {isSelected && <Check className="w-4 h-4" />}
                                                </button>
                                                {cityCount > 0 && (
                                                    <button
                                                        onClick={() => handleGoToCities(province.id)}
                                                        className="px-3 py-2.5 text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 border-r border-outline-variant/30"
                                                    >
                                                        <span>{cityCount} شهر</span>
                                                        <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {(step === 'cities' || hasSingleProvinceMultipleCities) && (
                                <div className="space-y-1">
                                    {hasSingleProvinceMultipleCities && (
                                        <div className="px-3 py-2 text-xs text-on-surface-variant border-b border-outline-variant/20 mb-1 font-medium">
                                            استان: {singleProvince!.label}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleCitySelect('')}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md transition-colors ${
                                            location.provinceId && !location.cityId ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface hover:bg-surface-container-low'
                                        }`}
                                    >
                                        <span>همه شهرها</span>
                                        {location.provinceId && !location.cityId && <Check className="w-4 h-4" />}
                                    </button>

                                    {availableCities.map((city) => {
                                        const isSelected = location.cityId === city.id;
                                        return (
                                            <button
                                                key={city.id}
                                                onClick={() => handleCitySelect(city.id)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md transition-colors ${
                                                    isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface hover:bg-surface-container-low'
                                                }`}
                                            >
                                                <span>{city.label}</span>
                                                {isSelected && <Check className="w-4 h-4" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-2 border-t border-outline-variant/30 flex-shrink-0">
                            <button
                                onClick={() => { clearLocation(); setShowModal(false); }}
                                className="w-full px-4 py-2 text-xs font-medium text-on-surface-variant hover:text-error border border-outline-variant hover:border-error/50 rounded-md transition-all hover:bg-error/5"
                            >
                                حذف فیلتر موقعیت
                            </button>
                        </div>
                    </div>
                </div>,
                document.body // ✅ ۳. اتصال مستقیم به تگ body سایت
            )}
        </>
    );
}