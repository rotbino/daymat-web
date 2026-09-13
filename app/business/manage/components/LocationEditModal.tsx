// app/business/manage/components/LocationEditModal.tsx
// 📍 انتخاب استان و شهر کسب‌وکار — ذخیره با PUT /business/:id
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Check, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';

export interface LocationValue {
    province?: string | null;
    provinceCode?: string | null;
    city?: string | null;
    cityCode?: string | null;
}

const SELECT_CLS =
    'w-full h-11 px-3 text-sm text-right rounded-xl bg-surface-container-lowest border border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none';

export function LocationEditModal({
    isOpen,
    onClose,
    initial,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    initial: LocationValue;
    onSave: (value: { province: string; provinceCode: string; city: string; cityCode: string }) => Promise<void>;
}) {
    const [provinceCode, setProvinceCode] = useState(initial.provinceCode || '');
    const [cityCode, setCityCode] = useState(initial.cityCode || '');

    const { data: provinces, isLoading: provincesLoading } = useQuery({
        queryKey: ['location-provinces'],
        queryFn: () => apiService.location.getProvinces(),
        enabled: isOpen,
        staleTime: 5 * 60_000,
    });

    const { data: cities, isLoading: citiesLoading } = useQuery({
        queryKey: ['location-cities', provinceCode],
        queryFn: () => apiService.location.getCities(provinceCode || undefined),
        enabled: isOpen && !!provinceCode,
        staleTime: 5 * 60_000,
    });

    // همگام‌سازی وقتی مودال باز می‌شود
    useEffect(() => {
        if (isOpen) {
            setProvinceCode(initial.provinceCode || '');
            setCityCode(initial.cityCode || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const provinceTitle = useMemo(
        () => provinces?.items?.find((p) => p.provinceCode === provinceCode)?.title || '',
        [provinces, provinceCode],
    );
    const cityTitle = useMemo(
        () => cities?.items?.find((c) => c.cityCode === cityCode)?.title || '',
        [cities, cityCode],
    );

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!provinceCode || !cityCode) return;
        await onSave({ province: provinceTitle, provinceCode, city: cityTitle, cityCode });
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                {/* هدر */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-primary/5">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center">
                            <MapPin className="w-4 h-4 text-primary" />
                        </span>
                        <h3 className="text-sm font-extrabold text-on-surface">استان و شهر</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
                        aria-label="بستن"
                    >
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* استان */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-on-surface-variant">استان</label>
                        {provincesLoading ? (
                            <div className="h-11 grid place-items-center rounded-xl bg-surface-container-low">
                                <Loader2 className="w-4 h-4 animate-spin text-primary/50" />
                            </div>
                        ) : (
                            <select
                                value={provinceCode}
                                onChange={(e) => {
                                    setProvinceCode(e.target.value);
                                    setCityCode('');
                                }}
                                className={SELECT_CLS}
                            >
                                <option value="">انتخاب استان…</option>
                                {(provinces?.items || []).map((p) => (
                                    <option key={p.id} value={p.provinceCode}>
                                        {p.title}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* شهر */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-on-surface-variant">شهر</label>
                        {!provinceCode ? (
                            <div className="h-11 grid place-items-center rounded-xl bg-surface-container-low text-[11px] text-on-surface-variant/50">
                                اول استان را انتخاب کن
                            </div>
                        ) : citiesLoading ? (
                            <div className="h-11 grid place-items-center rounded-xl bg-surface-container-low">
                                <Loader2 className="w-4 h-4 animate-spin text-primary/50" />
                            </div>
                        ) : (
                            <select value={cityCode} onChange={(e) => setCityCode(e.target.value)} className={SELECT_CLS}>
                                <option value="">انتخاب شهر…</option>
                                {(cities?.items || []).map((c) => (
                                    <option key={c.id} value={c.cityCode}>
                                        {c.title}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* دکمه‌ها */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-4 rounded-xl border border-outline-variant/50 text-on-surface-variant text-xs font-bold hover:bg-surface-container-low active:scale-95 transition-all"
                        >
                            انصراف
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!provinceCode || !cityCode}
                            className={cn(
                                'flex-1 h-10 rounded-xl bg-primary text-on-primary text-xs font-extrabold flex items-center justify-center gap-1.5',
                                'hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm shadow-primary/25',
                            )}
                        >
                            <Check className="w-4 h-4" /> ذخیره
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
