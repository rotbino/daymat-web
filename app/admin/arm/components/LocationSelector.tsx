// app/admin/arm/components/LocationSelector.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UseFormSetValue, UseFormWatch, useFieldArray, Control } from 'react-hook-form';
import { Plus, MapPin, Globe, X, AlertTriangle, Lock, Eye, AlertCircle } from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LocationSelectorProps {
    control: Control<any>;
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    onSave?: () => void;
    isAdmin?: boolean;
    isSaving?: boolean;
}

export function LocationSelector({
                                     control,
                                     watch,
                                     setValue,
                                     onSave,
                                     isAdmin = false,
                                     isSaving = false
                                 }: LocationSelectorProps) {
    if (!control) {
        console.error('❌ LocationSelector: control is undefined!');
        return <div className="text-center py-8 text-error">خطا: کنترل فرم در دسترس نیست. لطفاً صفحه را مجدداً بارگذاری کنید.</div>;
    }

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'config.locationSelections',
    });

    const [tree, setTree] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; city: string } | null>(null);

    // ✅ گرفتن دسترسی از armAdminPermission
    const armAdminPermission = watch('config.armAdminPermission') || {};
    const locationsAccess = armAdminPermission.locations || {};
    const canEdit = isAdmin || locationsAccess.canEdit === true;
    const canAdd = isAdmin || locationsAccess.canAdd === true;
    const canRemove = isAdmin || locationsAccess.canRemove === true;
    const isOwnerWithNoAccess = !isAdmin && !canAdd && !canRemove;

    // ⭐ فیلد محدودیت عضویت بر اساس موقعیت
    const restrictMembershipByLocation = watch('config.accessRules.restrictMembershipByLocation') ?? false;

    const handleToggleRestrictMembership = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue('config.accessRules.restrictMembershipByLocation', e.target.checked, { shouldDirty: true });
        if (onSave) onSave();
    };

    useEffect(() => {
        apiService.admin.locations.getTree()
            .then(data => {
                setTree(data || []);
                const iran = data?.find((c: any) => c.countryCode === 'IR');
                if (iran) setSelectedCountry(iran.id);
            })
            .catch((err) => {
                console.error('❌ Error fetching locations:', err);
                toast.error('خطا در دریافت موقعیت‌ها');
            })
            .finally(() => setLoading(false));
    }, []);

    const countries = useMemo(() => tree.filter(n => n.type === 'country'), [tree]);
    const activeCountry = useMemo(() => countries.find(c => c.id === selectedCountry), [countries, selectedCountry]);
    const provinces = useMemo(() => activeCountry?.children?.filter((c: any) => c.type === 'province') || [], [activeCountry]);
    const activeProvince = useMemo(() => provinces.find((p: any) => p.id === selectedProvince), [provinces, selectedProvince]);
    const cities = useMemo(() => activeProvince?.children?.filter((c: any) => c.type === 'city') || [], [activeProvince]);

    const currentSelections = watch('config.locationSelections') || [];

    const addCity = (city: any) => {
        if (!canAdd) return;
        if (currentSelections.some((s: any) => s.locationId === city.id)) {
            toast.info('این شهر قبلاً اضافه شده');
            return;
        }
        append({
            locationId: city.id,
            customLabel: '',
            displayPriority: currentSelections.length,
            isActive: true,
        });
        setTimeout(() => onSave?.(), 100);
        toast.success(`${city.title} اضافه شد`);
    };

    const addProvince = (province: any) => {
        if (!canAdd) return;
        const provinceCities = province.children?.filter((c: any) => c.type === 'city') || [];
        let added = 0;
        provinceCities.forEach((city: any) => {
            if (!currentSelections.some((s: any) => s.locationId === city.id)) {
                append({
                    locationId: city.id,
                    customLabel: '',
                    displayPriority: currentSelections.length + added,
                    isActive: true,
                });
                added++;
            }
        });
        if (added === 0) {
            toast.info('همه شهرهای این استان قبلاً اضافه شده‌اند');
        } else {
            toast.success(`${added} شهر از ${province.title} اضافه شد`);
            setTimeout(() => onSave?.(), 100);
        }
    };

    const confirmRemove = (index: number, cityName: string) => {
        if (!canRemove) return;
        setDeleteConfirm({ index, city: cityName });
    };

    const handleRemove = () => {
        if (deleteConfirm) {
            remove(deleteConfirm.index);
            setDeleteConfirm(null);
            toast.success('موقعیت حذف شد');
            setTimeout(() => onSave?.(), 100);
        }
    };

    const handleCustomLabelChange = (index: number, value: string) => {
        setValue(`config.locationSelections.${index}.customLabel`, value);
        setTimeout(() => onSave?.(), 300);
    };

    const findLocationName = (locationId: string) => {
        for (const country of countries) {
            for (const province of (country.children || [])) {
                for (const city of (province.children || [])) {
                    if (city.id === locationId) {
                        return { city: city.title, province: province.title, country: country.title };
                    }
                }
            }
        }
        return { city: locationId, province: '', country: '' };
    };

    if (loading) {
        return <div className="text-center py-8 text-on-surface-variant">در حال بارگذاری موقعیت‌ها...</div>;
    }

    return (
        <div className="space-y-4">
            {/* ⭐ پیام هشدار برای مالک بدون دسترسی */}
            {isOwnerWithNoAccess && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        ویرایش موقعیت‌ها فقط توسط مدیر سیستم قابل انجام است.
                        در صورت نیاز به تغییر، با پشتیبانی Daymat تماس بگیرید.
                    </p>
                </div>
            )}

            {/* ═══════════════ محدودیت عضویت بر اساس موقعیت ═══════════════ */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 flex items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        محدودیت عضویت بر اساس موقعیت
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                        فقط کسب‌وکارهای مستقر در شهرهای انتخاب‌شده بتوانند در این بازار عضو شوند.
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                        type="checkbox"
                        checked={restrictMembershipByLocation}
                        onChange={handleToggleRestrictMembership}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
            </div>

            {/* ═══════════════ موقعیت‌های انتخاب‌شده (بالا) ═══════════════ */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        موقعیت‌های انتخاب‌شده برای نمایش آگهی
                        <span className="text-xs text-on-surface-variant font-normal">({fields.length})</span>
                    </h3>
                    {!canEdit && (
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/60">
                            <Lock className="w-3.5 h-3.5" />
                            فقط مشاهده
                        </div>
                    )}
                </div>

                {fields.length === 0 ? (
                    <div className="text-center py-6 text-sm text-on-surface-variant">
                        هیچ موقعیتی انتخاب نشده. از بخش زیر شهرها را اضافه کنید.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {fields.map((field, index) => {
                            const { city, province } = findLocationName(field.locationId);
                            return (
                                <div key={field.id}
                                     className="inline-flex items-center gap-2 px-3 py-2 bg-surface border border-outline-variant/30 rounded-lg text-sm group">
                                    <MapPin className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                                    <span className="font-medium">{city}</span>
                                    <span className="text-[10px] text-on-surface-variant/60">({province})</span>

                                    {canRemove && (
                                        <button
                                            onClick={() => confirmRemove(index, city)}
                                            className="p-0.5 hover:bg-error/10 hover:text-error rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            type="button"
                                            title="حذف">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                    {!canRemove && !isAdmin && (
                                        <Eye className="w-3 h-3 text-gray-400" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══════════════ نوار کشورها ═══════════════ */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-3">
                <p className="text-[10px] text-on-surface-variant mb-2 font-medium flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> کشور
                </p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {countries.map(c => (
                        <button key={c.id} onClick={() => { setSelectedCountry(c.id); setSelectedProvince(''); }}
                                className={cn(
                                    "px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border flex-shrink-0",
                                    selectedCountry === c.id
                                        ? "bg-primary text-on-primary border-primary"
                                        : "bg-surface text-on-surface-variant border-outline-variant/50 hover:border-primary/30"
                                )}>
                            {c.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══════════════ استان‌ها و شهرها ═══════════════ */}
            {activeCountry && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* استان‌ها */}
                    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
                        <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> استان‌ها
                            </h4>
                            <span className="text-xs text-on-surface-variant">{provinces.length}</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto divide-y divide-outline-variant/10">
                            {provinces.map((province: any) => (
                                <div key={province.id}
                                     className={cn(
                                         "flex items-center justify-between px-4 py-2.5 hover:bg-surface-container-low transition-colors cursor-pointer",
                                         selectedProvince === province.id && "bg-primary/5"
                                     )}
                                     onClick={() => setSelectedProvince(selectedProvince === province.id ? '' : province.id)}>
                                    <span className="text-sm">{province.title}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-on-surface-variant/50">{province.children?.length || 0} شهر</span>
                                        {canAdd && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); addProvince(province); }}
                                                className="p-1 hover:bg-primary/10 hover:text-primary rounded transition-colors"
                                                title="افزودن همه شهرهای این استان">
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {!canAdd && !isAdmin && (
                                            <Lock className="w-3 h-3 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* شهرها */}
                    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
                        <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> شهرها
                            </h4>
                            <span className="text-xs text-on-surface-variant">{cities.length}</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {!selectedProvince ? (
                                <div className="text-center py-12 text-sm text-on-surface-variant">
                                    استانی را انتخاب کنید
                                </div>
                            ) : cities.length === 0 ? (
                                <div className="text-center py-12 text-sm text-on-surface-variant">
                                    شهری یافت نشد
                                </div>
                            ) : (
                                <div className="divide-y divide-outline-variant/10">
                                    {cities.map((city: any) => {
                                        const isAdded = currentSelections.some((s: any) => s.locationId === city.id);
                                        return (
                                            <div key={city.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-container-low transition-colors">
                                                <span className="text-sm">{city.title}</span>
                                                {canAdd ? (
                                                    <button
                                                        onClick={() => !isAdded && addCity(city)}
                                                        disabled={isAdded}
                                                        className={cn(
                                                            "p-1.5 rounded-lg transition-colors text-xs",
                                                            isAdded
                                                                ? "bg-green-50 text-green-600 cursor-default"
                                                                : "hover:bg-primary/10 hover:text-primary"
                                                        )}>
                                                        {isAdded ? '✓ اضافه شده' : <Plus className="w-3.5 h-3.5" />}
                                                    </button>
                                                ) : (
                                                    <span className={cn(
                                                        "text-xs",
                                                        isAdded ? "text-green-600" : "text-gray-400"
                                                    )}>
                                                        {isAdded ? '✓ اضافه شده' : '🔒'}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════ مودال تأیید حذف ═══════════════ */}
            {deleteConfirm && canRemove && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                هشدار
                            </h3>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 hover:bg-surface-container-high rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-sm text-on-surface">
                                حذف <span className="font-semibold">«{deleteConfirm.city}»</span> ممکن است روی آگهی‌های ثبت‌شده در این شهر تأثیر بگذارد.
                            </p>
                            <p className="text-xs text-on-surface-variant">
                                آگهی‌های موجود حذف نمی‌شوند اما این شهر دیگر در تنظیمات بازار نخواهد بود.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setDeleteConfirm(null)}
                                        className="flex-1 h-10 border border-outline rounded-xl text-sm">انصراف</button>
                                <button onClick={handleRemove}
                                        className="flex-1 h-10 bg-error text-on-error rounded-xl text-sm hover:bg-error/90">حذف</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}