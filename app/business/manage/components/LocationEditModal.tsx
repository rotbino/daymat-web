// app/business/manage/components/LocationEditModal.tsx
// 📍 موقعیت مکانی کسب‌وکار — استان/شهر + لوکیشن دقیق روی نقشه — ذخیره با PUT /business/:id
//    لوکیشن دقیق اختیاری و بی‌اصرار است (LocationPicker خودش مزیتش را توضیح می‌دهد)
//    🌍 از روی لوکیشن انتخابی: کشور/استان/شهر خودکار آپدیت می‌شوند (حتی اگر قبلاً انتخاب شده باشند)
//    و آدرسِ دست‌نخورده خودکار پر می‌شود (قابل ویرایش) — جستجوی معکوس Nominatim
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Loader2, Check, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';
import { useLocationsTree } from '@/lib/api/apiHooks';
import { matchLocationFromTree, ReverseGeoResult } from '@/lib/reverseGeo';
import LocationPicker, { LatLngValue } from '@/app/components/LocationPicker';

export interface LocationValue {
    province?: string | null;
    provinceCode?: string | null;
    city?: string | null;
    cityCode?: string | null;
}

export interface LocationSaveValue extends LocationValue {
    locationLat?: number | null;
    locationLng?: number | null;
    address?: string | null;
}

const SELECT_CLS =
    'w-full h-11 px-3 text-sm text-right rounded-xl bg-surface-container-lowest border border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none';

export function LocationEditModal({
    isOpen,
    onClose,
    initial,
    initialLocation,
    initialAddress,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    initial: LocationValue;
    /** لوکیشن دقیقِ ثبت‌شدهٔ قبلی (اختیاری) */
    initialLocation?: LatLngValue | null;
    /** آدرسِ ثبت‌شدهٔ قبلی (اختیاری) — با لوکیشنِ تازه خودکار به‌روز می‌شود اگر دستی ویرایش نشده باشد */
    initialAddress?: string | null;
    onSave: (value: LocationSaveValue) => Promise<void>;
}) {
    const [provinceCode, setProvinceCode] = useState(initial.provinceCode || '');
    const [cityCode, setCityCode] = useState(initial.cityCode || '');
    const [location, setLocation] = useState<LatLngValue | null>(initialLocation ?? null);
    const [address, setAddress] = useState(initialAddress || '');
    const addressTouchedRef = useRef(false);
    const [saving, setSaving] = useState(false);

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

    // 🌍 درخت لوکیشن — برای تطبیق استان/شهرِ برگشتی از جستجوی معکوس
    const { data: locTree } = useLocationsTree({ enabled: isOpen });

    // همگام‌سازی وقتی مودال باز می‌شود
    useEffect(() => {
        if (isOpen) {
            setProvinceCode(initial.provinceCode || '');
            setCityCode(initial.cityCode || '');
            setLocation(initialLocation ?? null);
            setAddress(initialAddress || '');
            addressTouchedRef.current = false;
            setSaving(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // 🌍 نتیجهٔ جستجوی معکوس — استان/شهر از روی نقطهٔ انتخابی آپدیت می‌شوند
    //    حتی اگر کاربر قبلاً انتخاب کرده باشد (خواستهٔ صریح مالک)؛ آدرس فقط اگر دستی ویرایش نشده باشد.
    const handleLocationResolved = (geo: ReverseGeoResult | null) => {
        if (!geo) return;
        if (geo.outsideIran) {
            toast.info('لوکیشن انتخابی خارج از ایرانه — کشور، استان و شهر را دستی انتخاب کن.');
            return;
        }
        const m = matchLocationFromTree(locTree, geo);
        if (!m) return; // در درخت پیدا نشد — انتخابِ فعلی دست‌نخورده می‌ماند
        setProvinceCode(m.provinceCode);
        setCityCode(m.cityCode || ''); // شهرِ تطبیق‌نیافته = خالی (به استانِ تازه تعلق ندارد)
        if (!addressTouchedRef.current) {
            const auto = geo.addressLine || [m.cityTitle, m.provinceTitle].filter(Boolean).join('، ');
            if (auto) setAddress(auto);
        }
    };

    const provinceTitle = useMemo(
        () => provinces?.items?.find((p) => p.provinceCode === provinceCode)?.title || initial.province || '',
        [provinces, provinceCode, initial.province],
    );
    const cityTitle = useMemo(
        () => cities?.items?.find((c) => c.cityCode === cityCode)?.title || initial.city || '',
        [cities, cityCode, initial.city],
    );

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!provinceCode || !cityCode || saving) return;
        setSaving(true);
        try {
            await onSave({
                province: provinceTitle,
                provinceCode,
                city: cityTitle,
                cityCode,
                // ✅ لوکیشن دقیق — با null حذف می‌شود (بک‌اند پشتیبانی می‌کند)
                locationLat: location?.lat ?? null,
                locationLng: location?.lng ?? null,
                // 🌍 آدرس — خالی یعنی حذف
                address: address.trim() || null,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
                {/* هدر */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-primary/5 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center">
                            <MapPin className="w-4 h-4 text-primary" />
                        </span>
                        <h3 className="text-sm font-extrabold text-on-surface">موقعیت مکانی</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
                        aria-label="بستن"
                    >
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto scrollbar-slim">
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

                    {/* ✅ لوکیشن دقیق روی نقشه — اختیاری و بی‌اصرار */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-on-surface-variant">لوکیشن دقیق (اختیاری)</label>
                        <LocationPicker value={location} onChange={(v) => setLocation(v)} onResolved={(geo) => handleLocationResolved(geo)} />
                    </div>

                    {/* 🌍 آدرس — با انتخاب لوکیشن خودکار پر می‌شود؛ کاربر می‌تواند ویرایشش کند */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-on-surface-variant">آدرس (اختیاری)</label>
                        <input type="text" value={address} maxLength={200}
                               onChange={(e) => { setAddress(e.target.value); addressTouchedRef.current = true; }}
                               placeholder="با انتخاب لوکیشن، خودش پر می‌شود — مثل: خیابان آزادی، پلاک ۱۲"
                               className={SELECT_CLS} />
                    </div>
                </div>

                {/* دکمه‌ها */}
                <div className="flex gap-2 pt-1 px-5 pb-5 flex-shrink-0">
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
                        disabled={!provinceCode || !cityCode || saving}
                        className={cn(
                            'flex-1 h-10 rounded-xl bg-primary text-on-primary text-xs font-extrabold flex items-center justify-center gap-1.5',
                            'hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm shadow-primary/25',
                        )}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} ذخیره
                    </button>
                </div>
            </div>
        </div>
    );
}
