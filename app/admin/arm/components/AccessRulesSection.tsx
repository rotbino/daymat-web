// app/admin/arm/components/AccessRulesSection.tsx
'use client';

import React, { useState } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Save, Loader2, Check, Shield, Users, Lock, Phone, MapPin, AlertTriangle, Zap, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    const handleSave = () => {
        if (!canEdit) return;
        onSave?.();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const ruleGroups = [
        {
            title: 'عضویت در بازار',
            icon: Users,
            rules: [
                {
                    key: 'autoJoinOnEntry',
                    label: 'عضویت خودکار هنگام ورود',
                    hint: 'کاربران لاگین‌کرده به‌محض ورود به بازار، عضو می‌شوند',
                    icon: Zap,
                    adminOnly: false,
                },
                {
                    key: 'requireBusinessForMembership',
                    label: 'نیاز به کسب‌وکار برای عضویت',
                    hint: 'اگر فعال باشد، کاربر باید کسب‌وکار خود را ثبت کرده و انتخاب کند',
                    icon: Building2,
                    adminOnly: true,
                },
                {
                    key: 'requireAdminApprovalForMembership',
                    label: 'تأیید مدیر برای عضویت',
                    hint: 'هر درخواست عضویت باید توسط مدیر تأیید شود',
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
                { key: 'requireBusinessVerification', label: 'تیک اعتماد اجباری', hint: 'کاربر باید تیک اعتماد داشته باشد', icon: Shield, adminOnly: true },
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
                        تنظیمات عضویت و محدودیت‌ها
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
                        تغییر تنظیمات عضویت برای شما فعال نیست. در صورت نیاز با پشتیبانی تماس بگیرید.
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
        </div>
    );
}