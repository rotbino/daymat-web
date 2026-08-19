// app/admin/ads/components/LocationFilter.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { DropSelector } from '@/components/common/DropSelector';
import { apiService } from '@/lib/api/apiService';

interface LocationFilterProps {
    armSlug?: string;
    countryCode?: string;
    provinceCode?: string;
    cityCode?: string;
    onLocationChange: (countryCode?: string, provinceCode?: string, cityCode?: string) => void;
    onClear?: () => void;
    hasFilter?: boolean;
}

export function LocationFilter({
                                   armSlug,
                                   countryCode: initialCountryCode,
                                   provinceCode: initialProvinceCode,
                                   cityCode: initialCityCode,
                                   onLocationChange,
                                   onClear,
                                   hasFilter,
                               }: LocationFilterProps) {
    const [allCountries, setAllCountries] = useState<any[]>([]);
    const [allProvinces, setAllProvinces] = useState<any[]>([]);
    const [allCities, setAllCities] = useState<any[]>([]);
    const [armTree, setArmTree] = useState<any[]>([]);

    const [countryId, setCountryId] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [cityId, setCityId] = useState('');

    // کشوها: واکشی کشورها
    useEffect(() => {
        apiService.admin.locations.getCountries().then(d => {
            setAllCountries(d || []);
            // فقط وقتی مقدار اولیه نداریم، ایران پیش‌فرض شود
            if (!initialCountryCode) {
                const ir = d?.find((c: any) => c.countryCode === 'IR');
                if (ir && !armSlug) setCountryId(ir.id);
            }
        }).catch(() => {});
    }, []);

    // درخت بازو (در صورت وجود)
    useEffect(() => {
        if (!armSlug) {
            setArmTree([]);
            return;
        }
        apiService.admin.ads.getLocations(armSlug).then(data => {
            setArmTree(data || []);
        }).catch(() => setArmTree([]));
    }, [armSlug]);

    // استان‌ها (غیر بازو)
    useEffect(() => {
        if (armSlug || !countryId) return;
        apiService.admin.locations.getChildren(countryId).then(d => setAllProvinces(d || [])).catch(() => {});
    }, [countryId, armSlug]);

    // شهرها (غیر بازو)
    useEffect(() => {
        if (armSlug || !provinceId) return;
        apiService.admin.locations.getChildren(provinceId).then(d => setAllCities(d || [])).catch(() => {});
    }, [provinceId, armSlug]);

    // همگام‌سازی countryId با prop اولیه
    useEffect(() => {
        if (initialCountryCode && allCountries.length) {
            const c = allCountries.find(x => x.countryCode === initialCountryCode);
            if (c) setCountryId(c.id);
        }
    }, [initialCountryCode, allCountries]);

    // همگام‌سازی provinceId
    useEffect(() => {
        if (initialProvinceCode && allProvinces.length) {
            const p = allProvinces.find(x => x.provinceCode === initialProvinceCode);
            if (p) setProvinceId(p.id);
        }
    }, [initialProvinceCode, allProvinces]);

    // همگام‌سازی cityId
    useEffect(() => {
        if (initialCityCode && allCities.length) {
            const c = allCities.find(x => x.cityCode === initialCityCode);
            if (c) setCityId(c.id);
        }
    }, [initialCityCode, allCities]);

    const handleCountry = (v: string, opt: any) => {
        setCountryId(v);
        setProvinceId('');
        setCityId('');
        onLocationChange(opt?.extra?.countryCode, undefined, undefined);
    };

    const handleProvince = (v: string, opt: any) => {
        setProvinceId(v);
        setCityId('');
        onLocationChange(
            armTree.length ? 'IR' : allCountries.find(c => c.id === countryId)?.countryCode,
            opt?.extra?.provinceCode,
            undefined
        );
    };

    const handleCity = (v: string, opt: any) => {
        setCityId(v);
        onLocationChange(
            armTree.length ? 'IR' : allCountries.find(c => c.id === countryId)?.countryCode,
            armTree.length
                ? armTree.find(p => p.id === provinceId)?.provinceCode
                : allProvinces.find(p => p.id === provinceId)?.provinceCode,
            opt?.extra?.cityCode
        );
    };

    const clearLast = () => {
        if (cityId) {
            setCityId('');
            onLocationChange(
                armTree.length ? 'IR' : allCountries.find(c => c.id === countryId)?.countryCode,
                armTree.length
                    ? armTree.find(p => p.id === provinceId)?.provinceCode
                    : allProvinces.find(p => p.id === provinceId)?.provinceCode,
                undefined
            );
        } else if (provinceId) {
            setProvinceId('');
            onLocationChange(
                allCountries.find(c => c.id === countryId)?.countryCode,
                undefined,
                undefined
            );
        } else if (countryId) {
            setCountryId('');
            onLocationChange(undefined, undefined, undefined);
        }
    };

    const countries = allCountries.map(c => ({
        value: c.id,
        label: c.title,
        extra: { countryCode: c.countryCode },
    }));
    const provinces = armTree.length
        ? armTree.map(p => ({ value: p.id, label: p.title, extra: { provinceCode: p.provinceCode } }))
        : allProvinces.map(p => ({ value: p.id, label: p.title, extra: { provinceCode: p.provinceCode } }));
    const cities = armTree.length && provinceId
        ? (armTree.find(x => x.id === provinceId)?.children || []).map(c => ({ value: c.id, label: c.title, extra: { cityCode: c.cityCode } }))
        : allCities.map(c => ({ value: c.id, label: c.title, extra: { cityCode: c.cityCode } }));

    const showCountry = !armSlug;
    const showProvince = armSlug ? armTree.length > 0 : !!countryId;
    const showCity = !!provinceId;

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {showCountry && (
                <div className="w-28">
                    <DropSelector value={countryId} options={countries} placeholder="کشور" onChange={handleCountry} className="h-8 text-xs" />
                </div>
            )}
            {showProvince && (
                <div className="w-32">
                    <DropSelector value={provinceId} options={provinces} placeholder="استان" onChange={handleProvince} className="h-8 text-xs" />
                </div>
            )}
            {showCity && (
                <div className="w-32">
                    <DropSelector value={cityId} options={cities} placeholder="شهر" onChange={handleCity} className="h-8 text-xs" />
                </div>
            )}
            {(countryId || provinceId || cityId) && (
                <button type="button" onClick={clearLast} className="flex items-center justify-center w-8 h-8 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/30 transition-colors" title="حذف آخرین انتخاب">
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            )}
            {hasFilter && onClear && (
                <button type="button" onClick={onClear} className="flex items-center gap-1 px-2 py-1.5 text-xs text-error/70 hover:bg-error/5 rounded-lg transition-colors">
                    <X className="w-3 h-3" /> پاک کردن
                </button>
            )}
        </div>
    );
}