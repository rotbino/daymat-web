// app/components/BusinessSetupModal.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Building2, Camera, Loader2, X, Check, Layers } from 'lucide-react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCreateBusinessEntity, useUpdateBusinessEntity, useUploadFile } from '@/lib/api/apiHooks';
import { getLegacyTypeFromRole } from '@/lib/api/data-types';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import IndustryAutocomplete from '@/app/components/IndustryAutocomplete';
import BusinessTypeSelector from '@/app/components/BusinessTypeSelector';

interface BusinessEntityLite {
    id?: string;
    name?: string;
    type?: string;
    businessSector?: string | null;
    businessRole?: string | null;
    industryId?: string | null;
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

export default function BusinessSetupModal({ isOpen, onClose, business, onSaved }: Props) {
    const isEdit = !!business?.id;
    const createMut = useCreateBusinessEntity();
    const updateMut = useUpdateBusinessEntity();
    const uploadMut = useUploadFile();
    const logoInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [businessSector, setBusinessSector] = useState('');
    const [businessRole, setBusinessRole] = useState('');
    const [industry, setIndustry] = useState<{ id: string | null; title: string; isByUser?: boolean } | null>(null);
    const [provinceCode, setProvinceCode] = useState('');
    const [provinceLabel, setProvinceLabel] = useState('');
    const [cityCode, setCityCode] = useState('');
    const [cityLabel, setCityLabel] = useState('');

    // ─── لوگو (ویرایش) — آپلود با model=Business → بک‌اند Business.logoUrl را sync می‌کند ───
    const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const uploadedLogoRef = useRef<{ id: string } | null>(null);
    const isUploadingLogo = uploadMut.isPending;
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) return;
        setName(business?.name || '');
        setBusinessSector(business?.businessSector || '');
        setBusinessRole(business?.businessRole || '');
        setIndustry(business?.industryId ? {
            id: business.industryId,
            title: business?.industryName || '',
        } : null);
        setProvinceCode(business?.provinceCode || '');
        setProvinceLabel(business?.province || '');
        setCityCode(business?.cityCode || '');
        setCityLabel(business?.city || '');
        setCurrentLogoUrl(business?.logoUrl || null);
        setPendingLogoFile(null);
        setLogoPreview(null);
        uploadedLogoRef.current = null;
        setErrors({});
    }, [isOpen, business]);

    // پیش‌نمایش لوگوی تازه
    useEffect(() => {
        if (!pendingLogoFile) { setLogoPreview(null); return; }
        const url = URL.createObjectURL(pendingLogoFile);
        setLogoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingLogoFile]);

    const busy = createMut.isPending || updateMut.isPending || isUploadingLogo;

    const handleLogoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPendingLogoFile(file);
        e.target.value = '';
    };

    // ✅ آپلود لوگو — sync سمت بک‌اند Business.logoUrl را می‌گذارد
    const uploadLogo = async (): Promise<void> => {
        if (!pendingLogoFile || !business?.id) return;
        if (uploadedLogoRef.current) return;
        const result: any = await uploadMut.mutateAsync({
            file: pendingLogoFile,
            model: 'Business',
            modelId: business.id,
            fieldKey: 'logo',
        });
        uploadedLogoRef.current = { id: result.id };
        setCurrentLogoUrl(result.thumbnailPath || result.path || null);
        setPendingLogoFile(null);
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'نام کسب‌وکار الزامی است';
        if (!industry?.title?.trim()) e.industryName = 'صنف الزامی است';
        if (!businessSector) e.bizType = 'دسته‌بندی کسب‌وکار را انتخاب کن';
        else if (!businessRole) e.bizType = 'نوع فعالیت را انتخاب کن';
        if (!provinceCode) e.location = 'انتخاب موقعیت الزامی است';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            // ۱) لوگوی تازه — قبل از ذخیره آپلود شود (sync بک‌اند: Business.logoUrl)
            if (pendingLogoFile && isEdit) await uploadLogo();
            const payload = {
                name: name.trim(),
                // ✅ فیلدهای اصلی جدید — درخت دو سطحی BUSINESS_TYPE (همسان با فرم ویرایش کاتالوگ)
                businessSector: businessSector || undefined,
                businessRole: businessRole || undefined,
                // پل سازگاری: نمایش‌هایی که هنوز type قدیمی را می‌خوانند
                type: getLegacyTypeFromRole(businessRole) || (isEdit ? business?.type : undefined),
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
                    : 'کسب‌وکار ثبت شد ✅ — همین حالا برایش کاتالوگ بساز',
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

    // عنوان بخش — همسان با فرم ویرایش کاتالوگ
    const SectionTitle = ({ icon: Icon, text }: any) => (
        <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-primary/70" /> {text}
        </p>
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
                            <h3 className="text-sm font-extrabold text-on-surface">{isEdit ? 'ویرایش کسب‌وکار' : 'ثبت کسب‌وکار جدید'}</h3>
                            <p className="text-[10px] text-on-surface-variant/70">
                                {isEdit ? 'کمتر از یک دقیقه!' : 'برای افرادی که بیش از یک کسب‌وکار دارند · کمتر از یک دقیقه'}
                            </p>
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

                    {/* لوگو — فقط در ویرایش (برای ساخت شناسهٔ بیزنس لازم است) */}
                    {isEdit && (
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => logoInputRef.current?.click()}
                                    className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0
                                        ring-1 ring-outline-variant/50 dark:ring-gray-700 hover:ring-primary/40
                                        transition-all bg-surface-container-high dark:bg-gray-800 grid place-items-center group">
                                {(logoPreview || currentLogoUrl)
                                    ? <Image src={(logoPreview || currentLogoUrl)!} alt="لوگو" width={64} height={64} className="w-full h-full object-cover" unoptimized />
                                    : (
                                        <span className="flex flex-col items-center gap-0.5">
                                            <Camera className="w-5 h-5 text-on-surface-variant/50 group-hover:text-primary transition-colors" />
                                            <span className="text-[8px] text-on-surface-variant/50 group-hover:text-primary">لوگو</span>
                                        </span>
                                    )}
                                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                                    <Camera className="w-4 h-4 text-white" />
                                </span>
                            </button>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-on-surface">لوگوی کسب‌وکار</p>
                                <p className="text-[10px] text-on-surface-variant/70 mt-0.5">کاتالوگ با لوگو اعتماد بیشتری می‌گیرد — مربع و واضح بهترین است</p>
                            </div>
                            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoPick} className="hidden" />
                        </div>
                    )}

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

                    {/* نوع کسب‌وکار — درخت دو سطحی (همسان با فرم ویرایش) — چیپ‌های قدیمی حذف شد */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2">
                        <SectionTitle icon={Layers} text="نوع کسب‌وکار" />
                        <BusinessTypeSelector
                            sector={businessSector}
                            role={businessRole}
                            onSectorChange={(v) => { setBusinessSector(v); setErrors((p) => ({ ...p, bizType: '' })); }}
                            onRoleChange={(v) => { setBusinessRole(v); setErrors((p) => ({ ...p, bizType: '' })); }}
                            label=""
                        />
                        {errors.bizType && <p className="text-error text-[11px]">{errors.bizType}</p>}
                    </section>

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
                            برای تلفن، معرفی کوتاه و جزئیات بیشتر، مشخصات کاتالوگ را ویرایش کنید.
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
