// app/components/BusinessSetupModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Loader2, X, Check, Camera } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCreateBusinessEntity, useUpdateBusinessEntity, useUploadFile } from '@/lib/api/apiHooks';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';

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
    const uploadMut = useUploadFile();

    const [name, setName] = useState('');
    const [type, setType] = useState('wholesaler');
    const [industryName, setIndustryName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [provinceCode, setProvinceCode] = useState('');
    const [provinceLabel, setProvinceLabel] = useState('');
    const [cityCode, setCityCode] = useState('');
    const [cityLabel, setCityLabel] = useState('');
    const [phone, setPhone] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        setName(business?.name || '');
        setType(business?.type || 'wholesaler');
        setIndustryName(business?.industryName || '');
        setShortDescription(business?.shortDescription || '');
        setProvinceCode(business?.provinceCode || '');
        setProvinceLabel(business?.province || '');
        setCityCode(business?.cityCode || '');
        setCityLabel(business?.city || '');
        setPhone(business?.phone || '');
        setLogoUrl(business?.logoUrl || null);
        setLogoPreview(null);
        setErrors({});
    }, [isOpen, business]);

    const busy = createMut.isPending || updateMut.isPending || uploadMut.isPending;

    const handleLogo = async (file: File | null) => {
        if (!file) return;
        try {
            const res = await uploadMut.mutateAsync({
                file,
                model: 'Business',
                modelId: business?.id || 'pending',
                fieldKey: 'logo',
            });
            setLogoUrl(res.path || res.thumbnailPath || null);
            setLogoPreview(res.thumbnailPath || res.path || null);
        } catch (e: any) {
            toast.error(e?.message || 'خطا در آپلود لوگو');
        }
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'نام کسب‌وکار الزامی است';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            const payload = {
                name: name.trim(),
                type,
                industryName: industryName.trim() || undefined,
                shortDescription: shortDescription.trim() || undefined,
                province: provinceLabel || undefined,
                provinceCode: provinceCode || undefined,
                city: cityLabel || undefined,
                cityCode: cityCode || undefined,
                phone: phone.trim() || undefined,
                ...(logoUrl ? { logoUrl } : {}),
            };
            const res = isEdit
                ? await updateMut.mutateAsync({ id: business!.id!, data: payload })
                : await createMut.mutateAsync(payload);
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

                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-4.5 h-4.5 text-primary" />
                        </span>
                        <div>
                            <h3 className="text-sm font-extrabold text-on-surface">{isEdit ? 'ویرایش کسب‌وکار' : 'ثبت کسب‌وکار جدید'}</h3>
                            <p className="text-[10px] text-on-surface-variant/70">یک دقیقه بیشتر وقت نمی‌گیرد</p>
                        </div>
                    </div>
                    <button onClick={() => !busy && onClose()} aria-label="بستن"
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4 space-y-4">
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <div className="flex items-center gap-4">
                            <label className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0
                                ring-2 ring-primary/15 hover:ring-primary/40 transition-all group cursor-pointer">
                                {logoPreview || business?.logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={(logoPreview || business?.logoUrl) as string} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="w-full h-full grid place-items-center bg-surface-container-high">
                                        <Building2 className="w-6 h-6 text-on-surface-variant/40" />
                                    </span>
                                )}
                                <input type="file" accept="image/*" className="hidden"
                                       onChange={(e) => { handleLogo(e.target.files?.[0] ?? null); e.target.value = ''; }} />
                                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                                    <Camera className="w-4 h-4 text-white" />
                                </span>
                            </label>
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-medium text-on-surface block">
                                    نام کسب‌وکار <span className="text-primary">*</span>
                                </label>
                                <input type="text" value={name}
                                       onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
                                       placeholder="مثلا: پخش خوشگوار" className={inputCls(errors.name)} />
                                {errors.name && <p className="text-error text-[11px]">{errors.name}</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">صنف / زمینه فعالیت</label>
                            <input type="text" value={industryName} onChange={(e) => setIndustryName(e.target.value)}
                                   placeholder="مثلاً: پخش مواد غذایی / سوپرمارکت / تولید نوشیدنی"
                                   className={inputCls()} />
                        </div>
                    </section>

                    <section className="space-y-2">
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
                        <p className="text-[10px] text-on-surface-variant/60">
                            چند کسب وکار داری؟ مهم نیست — بعدا برای بقیه هم می توانی بسازی.
                        </p>
                    </section>

                    <section className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface block">معرفی کوتاه کسب  و کار (اختیاری ولی در کاتالوگ می آید)</label>
                        <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2}
                                  placeholder="مثلا، نمایندگی پخش مواد غذایی، برند ستاره"
                                  className="w-full min-h-[56px] py-2.5 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest
                                      border border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-primary/20
                                      focus:border-primary outline-none transition-all resize-none" />
                    </section>

                    <section className="space-y-2">
                        <label className="text-xs font-medium text-on-surface block">موقعیت (اختیاری)</label>
                        <IranLocationSelector
                            provinceCode={provinceCode}
                            cityCode={cityCode}
                            onProvinceChange={(code, label) => { setProvinceCode(code); setProvinceLabel(label); }}
                            onCityChange={(code, label) => { setCityCode(code); setCityLabel(label); }}
                        />
                    </section>

                    <section className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface block">تلفن (اختیاری)</label>
                        <input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)}
                               placeholder="021..." className={cn(inputCls(), 'text-left')} />
                    </section>
                </div>

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