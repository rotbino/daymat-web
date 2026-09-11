// app/admin/arm/components/AccessRulesSection.tsx
'use client';

import React, { useState } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Save, Loader2, Check, Shield, Users, Lock, Phone, MapPin, AlertTriangle, Zap, Building2, Layers } from 'lucide-react';
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
    const rules = watch('config.accessRules') || {};

    const armAdminPermission = watch('config.armAdminPermission') || {};
    const accessRulesAccess = armAdminPermission.accessRules || {};

    const canEdit = isAdmin || accessRulesAccess.canEdit === true;
    const isOwnerWithNoAccess = !isAdmin && !canEdit;

    const setRule = (key: string, value: any) => {
        if (!canEdit) return;
        const updated = { ...rules, [key]: value };
        setValue('config.accessRules', updated);
    };

    // انواع کاتالوگ پذیرفته‌شده — فیلد روت بازار (نه داخل config)
    const acceptedTypes: string[] = watch('acceptedCatalogTypes') || [];
    const toggleAcceptedType = (value: string) => {
        if (!canEdit) return;
        const next = acceptedTypes.includes(value)
            ? acceptedTypes.filter((t) => t !== value)
            : [...acceptedTypes, value];
        setValue('acceptedCatalogTypes', next, { shouldDirty: true });
    };

    const handleSave = () => {
        if (!canEdit) return;
        onSave?.();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const ruleGroups = [
        {
            title: 'پیوستن به بازار',
            icon: Users,
            rules: [
                {
                    key: 'autoJoinOnEntry',
                    label: 'پیوستن به بازار بصورت اتوماتیک هنگام ورود',
                    hint: 'کاربران لاگین‌کرده به‌محض ورود به بازار، عضو می‌شوند',
                    icon: Zap,
                    adminOnly: false,
                },
                {
                    key: 'requireCatalogForMembership',
                    label: 'نیاز به کسب‌وکار برای پیوستن به باار',
                    hint: 'اگر فعال باشد، کاربر باید کسب‌وکار خود را ثبت کرده و انتخاب کند',
                    icon: Building2,
                    adminOnly: true,
                },
                {
                    key: 'requireAdminApprovalForMembership',
                    label: 'نیاز به تایید مدیر برای پیوستن به بازار',
                    hint: 'هر درخواست پیوستن باید توسط مدیر تأیید شود',
                    icon: Lock,
                    adminOnly: false,
                },
                {
                    key: 'restrictMembershipByLocation',
                    label: 'محدودیت موقعیت مکانی',
                    hint: 'فقط کاربران شهر/استان‌های بازار می‌توانند عضو شوند',
                    icon: MapPin,
                    adminOnly: true,
                },
            ],
        },
        {
            title: 'تأیید هویت',
            icon: Shield,
            rules: [
                { key: 'requirePhoneVerification', label: 'تأیید موبایل اجباری', hint: 'کاربر باید شماره موبایلش تأیید شده باشد', icon: Phone, adminOnly: true },
                { key: 'requireCatalogVerification', label: 'نماد اعتماد اجباری', hint: 'کاربر باید نماد اعتماد داشته باشد', icon: Shield, adminOnly: true },
            ],
        },
    ];

    const renderRule = (rule: any) => {
        const Icon = rule.icon;
        const value = rules[rule.key];
        const disabled = !canEdit || (rule.adminOnly && !isAdmin);

        return (
            <div key={rule.key} className={cn(
                "bg-surface-container-lowest border rounded-xl p-3 transition-all",
                value === true ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/20'
            )}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Icon className={cn(
                            "w-4 h-4 flex-shrink-0",
                            value ? 'text-primary' : 'text-on-surface-variant/50'
                        )} />
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">{rule.label}</span>
                                {rule.adminOnly && (
                                    <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5" /> مدیر
                                    </span>
                                )}
                                {disabled && (
                                    <span className="text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        فقط مشاهده
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">{rule.hint}</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center flex-shrink-0">
                        <input
                            type="checkbox"
                            checked={value ?? false}
                            onChange={e => setRule(rule.key, e.target.checked)}
                            disabled={disabled}
                            className="sr-only peer"
                        />
                        <div className={cn(
                            "w-11 h-6 rounded-full relative transition-all duration-200",
                            disabled ? 'bg-outline-variant/50' : value ? 'bg-primary' : 'bg-outline-variant',
                            "after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200",
                            value && !disabled && 'after:translate-x-5'
                        )} />
                    </label>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* هدر با دکمه ذخیره */}
            <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                <div>
                    <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        قوانین دسترسی
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                        تنظیمات پیوستن به بازار و محدودیت‌ها
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

            {ruleGroups.map(group => (
                <div key={group.title} className="bg-surface-container-low p-5 border border-outline-variant rounded-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <group.icon className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">{group.title}</h4>
                        {isOwnerWithNoAccess && (
                            <span className="text-[9px] text-on-surface-variant/40 mr-auto">فقط مشاهده</span>
                        )}
                    </div>
                    <div className="space-y-2">{group.rules.map(renderRule)}</div>
                </div>
            ))}

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