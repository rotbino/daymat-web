// app/components/BusinessSetupModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Loader2, X, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCreateBusinessEntity, useUpdateBusinessEntity } from '@/lib/api/apiHooks';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import IndustryAutocomplete from '@/app/components/IndustryAutocomplete';

interface BusinessEntityLite {
    id?: string;
    name?: string;
    type?: string;
    industryName?: string | null;
    shortDescription?: string | null;
    province?: string | null;
    provinceCode?: string | null;
    city?: string | null;
    cityCode?: string | null;
    phone?: string | null;
    logoUrl?: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    business?: BusinessEntityLite | null;
    onSaved?: (biz: any) => void;
}

const BIZ_TYPES = [
    { value: 'producer', label: 'تولیدی' },
    { value: 'wholesaler', label: 'عمده‌فروش' },
    { value: 'importer', label: 'واردکننده' },
    { value: 'exporter', label: 'صادرکننده' },
    { value: 'distributor', label: 'پخش‌کننده' },
    { value: 'retailer', label: 'خرده‌فروش' },
    { value: 'contractor', label: 'پیمانکار' },
    { value: 'service_provider', label: 'خدمات' },
    { value: 'other', label: 'سایر' },
];

export default function BusinessSetupModal({ isOpen, onClose, business, onSaved }: Props) {
    const isEdit = !!business?.id;
    const createMut = useCreateBusinessEntity();
    const updateMut = useUpdateBusinessEntity();

    const [name, setName] = useState('');
    const [type, setType] = useState('wholesaler');
    const [industry, setIndustry] = useState<{ id: string | null; title: string; isByUser?: boolean } | null>(null);
    const [provinceCode, setProvinceCode] = useState('');
    const [provinceLabel, setProvinceLabel] = useState('');
    const [cityCode, setCityCode] = useState('');
    const [cityLabel, setCityLabel] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        setName(business?.name || '');
        setType(business?.type || 'wholesaler');
        setIndustry(business?.industryId ? {
            id: business.industryId,
            title: business?.industryName || '',
        } : null);
        setProvinceCode(business?.provinceCode || '');
        setProvinceLabel(business?.province || '');
        setCityCode(business?.cityCode || '');
        setCityLabel(business?.city || '');
        setErrors({});
    }, [isOpen, business]);

    const busy = createMut.isPending || updateMut.isPending;

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'نام کسب‌وکار الزامی است';
        if (!industry?.title?.trim()) e.industryName = 'صنف الزامی است';
        if (!provinceCode) e.location = 'انتخاب موقعیت الزامی است';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            const payload = {
                name: name.trim(),
                type,
                industryName: industry?.title?.trim(),
                industryId: industry?.id,  // ✅ اگه از لیست انتخاب شده id داره
                province: provinceLabel,
                provinceCode,
                city: cityLabel,
                cityCode,
            };
            const res = isEdit
                ? await updateMut.mutateAsync({ id: business!.id!, data: payload })
                : await createMut.mutateAsync(payload);
            toast.success(
                isEdit
                    ? 'کسب‌وکار شما بروزرسانی شد'
                    : 'کسب‌وکار شما ثبت شد! ✅ اکنون با پر کردن فرم زیر، کاتالوگ خود را ایجاد کنید',
                { duration: 6000 },
            );
            onSaved?.(res);
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'خطا در ذخیره');
        }
    };

    if (!isOpen) return null;

    const inputCls = (err?: string) => cn(
        'w-full h-11 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border',
        'focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
        err ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
    );

    return createPortal(
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
             onClick={() => !busy && onClose()}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                     max-h-[92dvh] flex flex-col overflow-hidden
                     animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-4.5 h-4.5 text-primary" />
                        </span>
                        <div>
                            <h3 className="text-sm font-extrabold text-on-surface">{isEdit ? 'ویرایش کسب‌وکار' : 'ثبت کسب‌وکار'}</h3>
                            <p className="text-[10px] text-on-surface-variant/70">کمتر از یک دقیقه!</p>
                        </div>
                    </div>
                    <button onClick={() => !busy && onClose()} aria-label="بستن"
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* بدنه — مینیمال */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4 space-y-4">
                    {/* نام کسب‌وکار */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface block">
                            نام کسب‌وکار <span className="text-primary">*</span>
                        </label>
                        <input type="text" value={name}
                               onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
                               placeholder="مثلا: پخش خوشگوار" className={inputCls(errors.name)} />
                        {errors.name && <p className="text-error text-[11px]">{errors.name}</p>}
                    </div>

                    {/* صنف — با autocomplete */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface block">
                            صنف / زمینه فعالیت <span className="text-primary">*</span>
                        </label>
                        <IndustryAutocomplete
                            value={industry}
                            onChange={(v) => { setIndustry(v); setErrors((p) => ({ ...p, industryName: '' })); }}
                            placeholder="مثلا: پخش مواد غذایی، سوپرمارکت..."
                        />
                        {errors.industryName && <p className="text-error text-[11px]">{errors.industryName}</p>}
                    </div>

                    {/* نوع فعالیت */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-on-surface block">نوع فعالیت</label>
                        <div className="flex flex-wrap gap-1.5">
                            {BIZ_TYPES.map((t) => (
                                <button key={t.value} type="button" onClick={() => setType(t.value)}
                                        className={cn('h-8 px-3 rounded text-[11px] font-bold border transition-colors',
                                            type === t.value
                                                ? 'bg-primary/10 border-primary/40 text-primary'
                                                : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/30')}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* موقعیت */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-on-surface block">
                            استان و شهر <span className="text-primary">*</span>
                        </label>
                        <IranLocationSelector
                            provinceCode={provinceCode}
                            cityCode={cityCode}
                            onProvinceChange={(code, label) => { setProvinceCode(code); setProvinceLabel(label); setErrors((p) => ({ ...p, location: '' })); }}
                            onCityChange={(code, label) => { setCityCode(code); setCityLabel(label); }}
                        />
                        {errors.location && <p className="text-error text-[11px]">{errors.location}</p>}
                    </div>

                    {/* نکته */}
                    {isEdit && (
                        <p className="text-[10px] text-on-surface-variant/60 leading-5 pt-2">
                            برای افزودن لوگو، تلفن و معرفی کوتاه، از صفحه پروفایل استفاده کنید.
                        </p>
                    )}
                </div>

                {/* فوتر */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20">
                    <button onClick={handleSave} disabled={busy}
                            className="w-full h-11 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2
                                bg-primary text-on-primary hover:bg-primary/90 shadow-sm disabled:opacity-50 transition-all">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {isEdit ? 'ذخیره تغییرات' : 'ثبت کسب‌وکار'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
