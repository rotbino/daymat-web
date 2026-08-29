'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { MapPin, X, Check, ArrowRight, ChevronLeft, Globe2 } from 'lucide-react';
import { RootState } from '@/lib/store/store';
import { useFilters } from '@/lib/hooks/useFilters';
import { cn } from '@/lib/utils';

export function LocationFilter() {
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const locationTree = currentArm?.locationTree || [];
    const { location, setProvince, setCity, clearLocation } = useFilters();

    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState<'provinces' | 'cities'>('provinces');
    const [tempProvince, setTempProvince] = useState<string>('');
    // نشان می‌دهد برای کدام slug مقدار اولیه از storage خوانده شده (جلوی بازنویسی با state قبلی بازار دیگر را می‌گیرد)
    const [hydratedFor, setHydratedFor] = useState<string | null>(null);

    // ─── ساخت داده درخت ───
    const locationData = useMemo(() => {
        const provinces: { id: string; label: string; code: string }[] = [];
        const citiesByProvince: Record<string, { id: string; label: string; code: string }[]> = {};
        for (const node of locationTree) {
            if (node.type === 'province') {
                provinces.push({ id: node.id, label: node.title, code: node.provinceCode || node.id });
                const cities: { id: string; label: string; code: string }[] = [];
                for (const child of node.children || []) {
                    if (child.type === 'city') {
                        cities.push({ id: child.id, label: child.title, code: child.cityCode || child.id });
                    }
                }
                citiesByProvince[node.id] = cities;
            }
        }
        return { provinces, citiesByProvince };
    }, [locationTree]);

    // ─── ۱) ذخیره‌سازی: خواندن اولیه (per-arm) ───
    useEffect(() => {
        if (!currentSlug || hydratedFor === currentSlug) return;
        if (locationData.provinces.length === 0) return; // درخت هنوز نرسیده — بعداً دوباره تلاش می‌شود

        let applied = false;
        try {
            const raw = localStorage.getItem(`locfilter:${currentSlug}`);
            if (raw) {
                const saved = JSON.parse(raw);
                const prov = saved?.p ? locationData.provinces.find((x) => x.id === saved.p) : null;
                if (prov) {
                    setProvince(prov.id, prov.label, prov.code);
                    const city = saved?.c
                        ? (locationData.citiesByProvince[prov.id] || []).find((x) => x.id === saved.c)
                        : null;
                    if (city) setCity(city.id, city.label, city.code);
                    else setCity('', '', '');
                    applied = true;
                }
                // اگر آی‌دی ذخیره‌شده در درخت فعلی نبود → فیلتر پاک می‌شود (داده کهنه)
            }
        } catch { /* storage خراب — نادیده */ }

        if (!applied) clearLocation(); // هر بازار از صفرِ خودش شروع می‌شود
        setHydratedFor(currentSlug);
    }, [currentSlug, hydratedFor, locationData, setProvince, setCity, clearLocation]);

    // ─── ۲) ذخیره‌سازی: نوشتن با هر تغییر (حذف فیلتر هم ذخیره می‌شود) ───
    useEffect(() => {
        if (!currentSlug || hydratedFor !== currentSlug) return;
        try {
            localStorage.setItem(
                `locfilter:${currentSlug}`,
                JSON.stringify({ p: location.provinceId || '', c: location.cityId || '' }),
            );
        } catch { /* ignore */ }
    }, [currentSlug, hydratedFor, location.provinceId, location.cityId]);

    // ─── مشتقات ───
    const hasLocationData = locationData.provinces.length > 0;
    const hasSingleProvince = locationData.provinces.length === 1;
    const singleProvince = hasSingleProvince ? locationData.provinces[0] : null;
    const singleCityCount = hasSingleProvince ? (locationData.citiesByProvince[singleProvince!.id]?.length || 0) : 0;
    const hasSingleCity = hasSingleProvince && singleCityCount === 1;
    const singleCity = hasSingleCity ? locationData.citiesByProvince[singleProvince!.id][0] : null;
    const hasSingleProvinceMultipleCities = hasSingleProvince && !hasSingleCity;

    const availableCities = tempProvince ? (locationData.citiesByProvince[tempProvince] || []) : [];
    const currentProvinceLabel = locationData.provinces.find((p) => p.id === tempProvince)?.label || '';
    const wholeProvinceSelected = !!tempProvince && location.provinceId === tempProvince && !location.cityId;

    // ─── اکشن‌ها ───
    const openModal = () => {
        if (hasSingleProvinceMultipleCities) {
            setTempProvince(singleProvince!.id);
            setStep('cities');
        } else if (location.provinceId && (locationData.citiesByProvince[location.provinceId]?.length || 0) > 0) {
            // میان‌بر: استان فعلی → مستقیم روی مرحله شهرها (رفاینمنت سریع)
            setTempProvince(location.provinceId);
            setStep('cities');
        } else {
            setStep('provinces');
        }
        setShowModal(true);
    };

    const handleClose = () => setShowModal(false);

    const handleWholeProvince = () => {
        const prov = locationData.provinces.find((p) => p.id === tempProvince);
        if (prov) setProvince(prov.id, prov.label, prov.code);
        setCity('', '', '');
        setShowModal(false);
    };

    const handleCitySelect = (cityId: string) => {
        const prov = locationData.provinces.find((p) => p.id === tempProvince);
        if (prov) setProvince(prov.id, prov.label, prov.code);
        const city = availableCities.find((c) => c.id === cityId);
        if (city) setCity(city.id, city.label, city.code);
        setShowModal(false);
    };

    const handleClear = () => {
        clearLocation();
        setShowModal(false);
    };

    // Esc برای بستن
    useEffect(() => {
        if (!showModal) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [showModal]);

    if (!hasLocationData) return null;

    // تک‌شهر → نمایش ثابت، بدون تعامل
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
        return 'موقعیت';
    };

    const hasActiveFilter = !!location.cityId || !!location.provinceId;

    return (
        <>
            <button
                onClick={openModal}
                aria-label="انتخاب موقعیت"
                className={cn(
                    'flex h-8 items-center gap-1 py-1.5 px-2 text-[11px] transition-all duration-200 rounded-full border',
                    hasActiveFilter
                        ? 'text-primary border-primary/30 bg-primary/5'
                        : 'text-on-surface-variant border-outline-variant/50 hover:bg-surface-container-low',
                )}
            >
                <MapPin className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{getButtonLabel()}</span>
                {hasActiveFilter && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
            </button>

            {showModal && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={handleClose}
                >
                    <div
                        role="dialog"
                        aria-label="انتخاب موقعیت"
                        className="bg-surface w-full sm:max-w-[360px] rounded-t-3xl sm:rounded-2xl shadow-2xl
                            border border-outline-variant/50 overflow-hidden max-h-[85dvh] sm:max-h-[80vh] flex flex-col
                            animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* دستگیره — فقط موبایل */}
                        <div className="sm:hidden pt-2.5 pb-1 flex justify-center flex-shrink-0">
                            <div className="w-10 h-1 rounded-full bg-outline-variant/50" />
                        </div>

                        {/* هدر — زیرعنوان، دو سطح فیلتر را آموزش می‌دهد */}
                        <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                {step === 'cities' && (
                                    <button
                                        onClick={() => setStep('provinces')}
                                        aria-label="بازگشت به فهرست استان‌ها"
                                        className="w-8 h-8 -m-1 flex-shrink-0 flex items-center justify-center rounded-full
                                            text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="min-w-0">
                                    <h3 className="font-bold text-sm text-on-surface leading-tight truncate">
                                        {step === 'cities' ? currentProvinceLabel : 'محل بارگیری'}
                                    </h3>
                                    <p className="text-[10px] text-on-surface-variant/70 leading-tight mt-0.5">
                                        {step === 'cities'
                                            ? 'کل استان یا فقط یک شهر مشخص را انتخاب کنید'
                                            : 'استان مورد نظر را انتخاب کنید'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                aria-label="بستن"
                                className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full
                                    text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* بدنه */}
                        <div className="overflow-y-auto scrollbar-slim p-2 flex-1 min-h-0">
                            {step === 'provinces' ? (
                                <div className="space-y-0.5">
                                    {/* همه استان‌ها = حذف محدودیت */}
                                    <button
                                        onClick={handleClear}
                                        className={cn(
                                            'w-full flex items-center justify-between h-11 px-3 rounded-xl text-sm transition-colors',
                                            !location.provinceId && !location.cityId
                                                ? 'bg-primary/10 text-primary font-semibold'
                                                : 'text-on-surface hover:bg-surface-container-high',
                                        )}
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <Globe2 className="w-4 h-4 opacity-60" />
                                            همه استان‌ها
                                        </span>
                                        {!location.provinceId && !location.cityId && <Check className="w-4 h-4" />}
                                    </button>

                                    {locationData.provinces.map((province) => {
                                        const cityCount = locationData.citiesByProvince[province.id]?.length || 0;
                                        const isCurrentProv = location.provinceId === province.id;
                                        return (
                                            <button
                                                key={province.id}
                                                onClick={() => { setTempProvince(province.id); setStep('cities'); }}
                                                className={cn(
                                                    'w-full flex items-center justify-between h-11 px-3 rounded-xl text-sm transition-colors',
                                                    isCurrentProv ? 'text-primary font-medium' : 'text-on-surface hover:bg-surface-container-high',
                                                )}
                                            >
                                                <span className="flex items-center gap-2.5 min-w-0">
                                                    <MapPin className="w-4 h-4 opacity-50 flex-shrink-0" />
                                                    <span className="truncate">{province.label}</span>
                                                </span>
                                                <span className="flex items-center gap-1.5 flex-shrink-0 text-on-surface-variant/60">
                                                    {isCurrentProv && <Check className="w-3.5 h-3.5 text-primary" />}
                                                    {cityCount > 0 && (
                                                        <span className="flex items-center gap-0.5 text-[10px]">
                                                            {cityCount.toLocaleString('fa-IR')} شهر
                                                            <ChevronLeft className="w-3.5 h-3.5" />
                                                        </span>
                                                    )}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {/* ✅ کارت شفاف «کل استان» — اولین چیزی که کاربر می‌بیند */}
                                    <button
                                        onClick={handleWholeProvince}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-right transition-colors',
                                            wholeProvinceSelected
                                                ? 'bg-primary/10 border-primary/40'
                                                : 'border-outline-variant/40 hover:border-primary/30 hover:bg-surface-container-high/50',
                                        )}
                                    >
                                        <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Globe2 className="w-4 h-4 text-primary" />
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className={cn('block text-sm truncate', wholeProvinceSelected ? 'text-primary font-bold' : 'text-on-surface font-medium')}>
                                                کل استان {currentProvinceLabel}
                                            </span>
                                            <span className="block text-[10px] text-on-surface-variant/70 mt-0.5">
                                                نمایش آگهی‌های همه شهرهای فعال این استان
                                            </span>
                                        </span>
                                        {wholeProvinceSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                                    </button>

                                    <div className="px-1 pt-1.5 pb-0.5 text-[11px] font-bold text-on-surface-variant/70">
                                        یا یک شهر مشخص:
                                    </div>

                                    {availableCities.length === 0 && (
                                        <div className="px-3 py-4 text-xs text-on-surface-variant/60 text-center">
                                            شهر ثبت‌شده‌ای برای این استان وجود ندارد
                                        </div>
                                    )}

                                    {availableCities.map((city) => {
                                        const isSelected = location.cityId === city.id;
                                        return (
                                            <button
                                                key={city.id}
                                                onClick={() => handleCitySelect(city.id)}
                                                className={cn(
                                                    'w-full flex items-center justify-between h-11 px-3 rounded-xl text-sm transition-colors',
                                                    isSelected
                                                        ? 'bg-primary/10 text-primary font-semibold'
                                                        : 'text-on-surface hover:bg-surface-container-high',
                                                )}
                                            >
                                                 <span className="truncate">شهر {city.label}</span>
                                                {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* فوتر */}
                        <div
                            className="p-2.5 border-t border-outline-variant/20 flex-shrink-0
                                pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:pb-2.5"
                        >
                            <button
                                onClick={handleClear}
                                disabled={!hasActiveFilter}
                                className={cn(
                                    'w-full px-4 py-2 text-xs font-medium rounded-lg border transition-all',
                                    hasActiveFilter
                                        ? 'text-on-surface-variant hover:text-error border-outline-variant hover:border-error/50 hover:bg-error/5'
                                        : 'text-on-surface-variant/40 border-outline-variant/40 cursor-not-allowed',
                                )}
                            >
                                حذف فیلتر موقعیت
                            </button>
                        </div>
                    </div>
                </div>,
                document.body,
            )}
        </>
    );
}