// app/admin/arm/components/AccessRulesSection.tsx
'use client';

import React, { useState } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Save, Loader2, Check, Users, Lock, AlertTriangle, Layers, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

// انواع کاتالوگ پذیرفته‌شدهٔ بازار — هم‌راستا با فیلد درجه‌یک Arm.acceptedCatalogTypes در بک
const CATALOG_TYPE_OPTIONS = [
    { value: 'retail', label: 'تک‌فروشی', hint: 'کاتالوگ‌های خرده‌فروشی' },
    { value: 'wholesale', label: 'عمده‌فروشی', hint: 'کاتالوگ‌های عمده و پخش' },
    { value: 'service', label: 'خدماتی', hint: 'کاتالوگ‌های خدمات' },
] as const;

interface AccessRulesSectionProps {
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    onSave?: () => void;
    isSaving?: boolean;
    isAdmin?: boolean;
}

export function AccessRulesSection({ watch, setValue, onSave, isSaving, isAdmin = false }: AccessRulesSectionProps) {
    const [saved, setSaved] = useState(false);

    const armAdminPermission = watch('config.armAdminPermission') || {};
    const accessRulesAccess = armAdminPermission.accessRules || {};

    const canEdit = isAdmin || accessRulesAccess.canEdit === true;
    const isOwnerWithNoAccess = !isAdmin && !canEdit;

    // انواع کاتالوگ پذیرفته‌شده — فیلد روت بازار (نه داخل config)
    const acceptedTypes: string[] = watch('acceptedCatalogTypes') || [];
    const toggleAcceptedType = (value: string) => {
        if (!canEdit) return;
        const next = acceptedTypes.includes(value)
            ? acceptedTypes.filter((t) => t !== value)
            : [...acceptedTypes, value];
        setValue('acceptedCatalogTypes', next, { shouldDirty: true });
    };

    // ✅ بازار خصوصی + شرایط عضویت — فیلدهای ریشه‌ای Arm
    const isPrivate = watch('isPrivate') === true;
    const membershipTerms: string = watch('membershipTerms') || '';

    const handleSave = () => {
        if (!canEdit) return;
        onSave?.();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* هدر با دکمه ذخیره */}
            <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                <div>
                    <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        تنظیمات عضویت
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                        شرایط عضویت کسب‌وکارها در بازار و کنترل دسترسی به قیمت‌ها
                    </p>
                </div>
                {canEdit && (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'در حال ذخیره...' : saved ? 'ذخیره شد' : 'ذخیره'}
                    </button>
                )}
            </div>

            {/* پیام هشدار */}
            {isOwnerWithNoAccess && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        تغییر تنظیمات پیوستن به بازار برای شما فعال نیست. در صورت نیاز با پشتیبانی تماس بگیرید.
                    </p>
                </div>
            )}

            {/* مدل عضویت — توضیح کوتاه جای توگل‌های قدیمی */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <UserPlus className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs leading-6 text-on-surface">
                    <p className="font-semibold mb-1">عضویت در بازار همیشه از مسیر کسب‌وکار است</p>
                    <p className="text-on-surface-variant">
                        هر کاربر برای عضویت، «فروشنده» یا «خریدار» بودن خود را انتخاب می‌کند؛
                        خریدار با ثبت کسب‌وکار و فروشنده با ساخت کاتالوگ به بازار می‌پیوندد.
                        اگر بازار خصوصی باشد، ابتدا شرایط عضویت را می‌پذیرد و درخواستش برای تاییدِ شما می‌آید.
                    </p>
                </div>
            </div>

            {/* ✅ بازار خصوصی — مثل کانال خصوصی تلگرام؛ جایگزین مفهوم «مشاهده قیمت فقط برای اعضا» */}
            <div className={cn(
                'bg-surface-container-low p-5 border rounded-xl transition-all',
                isPrivate ? 'border-primary/40 bg-primary/5' : 'border-outline-variant',
            )}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Lock className={cn('w-4 h-4', isPrivate ? 'text-primary' : 'text-on-surface-variant/50')} />
                        <div>
                            <h4 className="text-sm font-semibold">بازار خصوصی</h4>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">
                                قیمت‌ها و امکانات فقط برای اعضای تاییدشده — درخواست عضویت به پنل مالک می‌آید
                            </p>
                        </div>
                    </div>
                    <label className={cn('relative inline-flex items-center flex-shrink-0', canEdit ? 'cursor-pointer' : 'cursor-default')}>
                        <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={e => setValue('isPrivate', e.target.checked, { shouldDirty: true })}
                            disabled={!canEdit}
                            className="sr-only peer"
                        />
                        <div className={cn(
                            'w-11 h-6 rounded-full relative transition-all duration-200',
                            !canEdit ? 'bg-outline-variant/50' : isPrivate ? 'bg-primary' : 'bg-outline-variant',
                            "after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200",
                            isPrivate && canEdit && 'after:translate-x-5'
                        )} />
                    </label>
                </div>

                {isPrivate && (
                    <div className="mt-4">
                        <label className="block text-xs font-semibold text-on-surface mb-1.5">
                            شرایط عضویت در بازار
                            <span className="text-[9px] font-normal text-on-surface-variant mr-1.5">
                                در مدال درخواست عضویت به کاربر نمایش داده می‌شود
                            </span>
                        </label>
                        <textarea
                            value={membershipTerms}
                            onChange={e => setValue('membershipTerms', e.target.value, { shouldDirty: true })}
                            disabled={!canEdit}
                            rows={5}
                            maxLength={2000}
                            placeholder={'مثلاً:\n• عضویت به‌عنوان خریدار: فقط سوپرمارکت‌ها و فروشگاه‌های زنجیره‌ای شهر همدان\n• عضویت به‌عنوان فروشنده: شرکت‌های پخش و عمده‌فروشی با کاتالوگ کامل\n• درخواست‌ها ابتدا بررسی و توسط مدیر تایید می‌شود'}
                            className={cn(
                                'w-full rounded-xl border bg-surface-container-lowest p-3 text-xs text-on-surface leading-6',
                                'border-outline-variant/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none',
                                'disabled:opacity-60 resize-y min-h-[110px]',
                            )}
                        />
                        <p className="text-[9px] text-on-surface-variant/60 mt-1 text-left">
                            {membershipTerms.length.toLocaleString('fa-IR')} / ۲۰۰۰
                        </p>
                    </div>
                )}
            </div>

            {/* ✅ انواع کاتالوگ پذیرفته‌شده — ملاک گارد عضویت و فیلتر تابلوی بازار */}
            <div className="bg-surface-container-low p-5 border border-outline-variant rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-semibold">انواع کاتالوگ پذیرفته‌شده</h4>
                    {isOwnerWithNoAccess && (
                        <span className="text-[9px] text-on-surface-variant/40 mr-auto">فقط مشاهده</span>
                    )}
                </div>
                <p className="text-[10px] text-on-surface-variant mb-4 leading-5">
                    مشخص می‌کند چه نوع کاتالوگ‌هایی می‌توانند در این بازار عضو شوند و آگهی بگذارند.
                    اگر هیچ نوعی انتخاب نشود، بازار همهٔ انواع را می‌پذیرد.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {CATALOG_TYPE_OPTIONS.map(opt => {
                        const active = acceptedTypes.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => toggleAcceptedType(opt.value)}
                                disabled={!canEdit}
                                className={cn(
                                    "text-right border rounded-xl p-3 transition-all disabled:opacity-60",
                                    active
                                        ? 'border-primary/50 bg-primary/5' 
                                        : 'border-outline-variant/30 bg-surface-container-lowest hover:border-outline-variant/60',
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className={cn(
                                        "text-sm font-bold",
                                        active ? 'text-primary' : 'text-on-surface-variant',
                                    )}>{opt.label}</span>
                                    <span className={cn(
                                        "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all",
                                        active ? 'bg-primary border-primary' : 'border-outline-variant/60',
                                    )}>
                                        {active && <Check className="w-3.5 h-3.5 text-on-primary" />}
                                    </span>
                                </div>
                                <p className="text-[10px] text-on-surface-variant/70 mt-1">{opt.hint}</p>
                            </button>
                        );
                    })}
                </div>
                {acceptedTypes.length === 0 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        هیچ نوعی انتخاب نشده — بازار بدون محدودیت است و همهٔ کاتالوگ‌ها می‌توانند عضو شوند.
                    </p>
                )}
            </div>
        </div>
    );
}