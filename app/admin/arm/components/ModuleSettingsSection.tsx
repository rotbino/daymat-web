// app/admin/arm/components/ModuleSettingsSection.tsx
'use client';

import React, { useState } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import {
    Save, Loader2, Check, Eye, Phone, Shield, Star, Clock,
    Package, TrendingUp, ShoppingCart, Lock, AlertCircle, Edit2,
    CreditCard, Layers, LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── نوع گره تنظیمات (درختواره) ───
type RuleNode = {
    key: string;
    label: string;
    hint?: string;
    icon?: string;
    isNumber?: boolean;
    min?: number;
    max?: number;
    suffix?: string;
    children?: RuleNode[];
    hasToggle?: boolean;
};

// ─── نوع گروه ───
type RuleGroup = {
    groupTitle: string;
    groupIcon: string;
    rules: RuleNode[];
};

// ─── نگاشت نام آیکون‌ها به کامپوننت ───
const ICON_MAP: Record<string, any> = {
    Eye,
    Shield,
    Phone,
    Check,
    Edit2,
    Star,
    Clock,
    Package,
    TrendingUp,
    ShoppingCart,
    CreditCard,
    Layers,
    LayoutGrid,
};

// ─── تعریف تنظیمات هر ماژول (گروه‌بندی شده) ───
const moduleConfigs: Record<string, { title: string; icon: any; groups: RuleGroup[] }> = {
    priceTable: {
        title: 'تابلوی قیمت',
        icon: TrendingUp,
        groups: [
            // ═══════════════════════════════════════
            // 📌 دسترسی و نمایش
            // ═══════════════════════════════════════
            {
                groupTitle: 'دسترسی و نمایش',
                groupIcon: 'Eye',
                rules: [
                    { key: 'requireLoginToViewPrices', label: 'مشاهده قیمت فقط برای اعضای سایت', hint: 'کاربر مهمان قیمت‌ها را نمی‌بیند', icon: 'Eye' },
                    { key: 'requireMembershipToViewPrices', label: 'پیوستن به بازار برای مشاهده قیمت', hint: 'تا عضو بازار نشده قیمت مخفی است', icon: 'Shield' },
                    { key: 'requireMembershipToCall', label: 'تماس فقط برای اعضای بازار', hint: 'دکمه تماس فقط برای اعضا فعال است', icon: 'Phone' },
                    { key: 'allowAnonymousPublishing', label: 'انتشار ناشناس آگهی', hint: 'فروشنده بدون نمایش نام کسب‌وکار آگهی دهد', icon: 'Shield' },
                    {
                        key: 'approval',
                        label: 'نیاز به تایید',
                        icon: 'Check',
                        children: [
                            { key: 'requiresApprovalOnCreate', label: 'در زمان ثبت', hint: 'آگهی پس از ثبت نیاز به تایید مدیر دارد' },
                            {
                                key: 'editApproval',
                                label: 'بعد از ویرایش',
                                hint: 'آگهی پس از ویرایش نیاز به تایید مدیر دارد',
                                icon: 'Edit2',
                                hasToggle: true,
                                children: [
                                    { key: 'title', label: 'عنوان آگهی' },
                                    { key: 'description', label: 'توضیحات' },
                                    { key: 'images', label: 'تصاویر' },
                                ],
                            },
                        ],
                    },
                ],
            },

            // ═══════════════════════════════════════
            // 📊 سهمیه‌ها
            // ═══════════════════════════════════════
            {
                groupTitle: 'سهمیه آگهی رایگان',
                groupIcon: 'Layers',
                rules: [
                    {
                        key: 'maxTotalFreeAdPerUser',
                        label: 'سهمیه کل آگهی رایگان',
                        hint: 'مجموع آگهی‌هایی که کاربر می‌تواند رایگان ثبت کند',
                        icon: 'Star',
                        isNumber: true,
                        min: 0,
                        max: 1000,
                        suffix: 'عدد'
                    },
                    {
                        key: 'maxActiveAdsPerUser',
                        label: 'سهمیه رایگان تابلو',
                        hint: 'آگهی‌های همزمان روی تابلو',
                        icon: 'Package',
                        isNumber: true,
                        min: 0,
                        max: 100,
                        suffix: 'عدد'
                    },
                ],
            },

            // ═══════════════════════════════════════
            // 💰 هزینه‌ها
            // ═══════════════════════════════════════
            {
                groupTitle: 'هزینه‌ها',
                groupIcon: 'CreditCard',
                rules: [
                    {
                        key: 'adCreationCost',
                        label: 'هزینه ماهیانه آگهی اضافه',
                        hint: 'برای ثبت بیش از سهمیه کل آگهی رایگان',
                        icon: 'Package',
                        isNumber: true,
                        min: 0,
                        max: 10000,
                        suffix: 'اعتبار/ماه'
                    },
                    {
                        key: 'extraActiveAdCost',
                        label: 'هزینه روزانه آگهی اضافه روی تابلو',
                        hint: 'برای داشتن بیش از سهمیه رایگان تابلو، به ازای هر روز',
                        icon: 'LayoutGrid',
                        isNumber: true,
                        min: 0,
                        max: 10000,
                        suffix: 'اعتبار/روز'
                    },
                    {
                        key: 'bumpCost',
                        label: 'هزینه نردبان',
                        hint: 'نمایش بالاتر در تابلو',
                        icon: 'TrendingUp',
                        isNumber: true,
                        min: 0,
                        max: 10000,
                        suffix: 'اعتبار/۲۴ساعت'
                    },
                ],
            },

            // ═══════════════════════════════════════
            // ⏰ سایر
            // ═══════════════════════════════════════
            {
                groupTitle: 'سایر تنظیمات',
                groupIcon: 'Clock',
                rules: [
                    {
                        key: 'adValidityDefaultHours',
                        label: 'اعتبار پیش‌فرض آگهی',
                        icon: 'Clock',
                        isNumber: true,
                        min: 1,
                        max: 240,
                        suffix: 'ساعت'
                    },
                ],
            },
        ],
    },
    buyLead: {
        title: 'تابلوی درخواست خرید',
        icon: ShoppingCart,
        groups: [
            {
                groupTitle: 'تنظیمات',
                groupIcon: 'Shield',
                rules: [
                    { key: 'requireMembershipToView', label: 'پیوستن به بازار برای مشاهده درخواست‌ها', hint: 'فقط اعضای بازار ببینند', icon: 'Shield' },
                    { key: 'requireMembershipToSubmit', label: 'پیوستن به بازار برای ثبت درخواست', hint: 'فقط اعضای بازار ثبت کنند', icon: 'Shield' },
                    { key: 'maxActiveRequestsPerUser', label: 'حداکثر درخواست فعال', icon: 'Package', isNumber: true, min: 1, max: 50, suffix: 'عدد' },
                ],
            },
        ],
    },
};

interface ModuleSettingsSectionProps {
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    onSave?: () => void;
    isSaving?: boolean;
    moduleKey: string;
    moduleName: string;
    isAdmin?: boolean;
}

export function ModuleSettingsSection({
                                          watch,
                                          setValue,
                                          onSave,
                                          isSaving,
                                          moduleKey,
                                          moduleName,
                                          isAdmin = false,
                                      }: ModuleSettingsSectionProps) {
    const [saved, setSaved] = useState(false);

    const armAdminPermission = watch('config.armAdminPermission') || {};
    const moduleAccess = armAdminPermission.modules || {};
    const canEdit = isAdmin || moduleAccess.canEdit === true;
    const isOwnerWithNoAccess = !isAdmin && !canEdit;

    const moduleSettings = watch(`config.modules.${moduleKey}`) || {};
    const isEnabled = moduleSettings.enabled ?? true;

    const config = moduleConfigs[moduleKey];
    if (!config) return null;

    const ModuleIcon = config.icon;

    // ─── تابع برای دریافت مقدار از path ───
    const getValueByPath = (path: string[]) => {
        let current: any = moduleSettings;
        for (const key of path) {
            if (current === undefined || current === null) return undefined;
            current = current[key];
        }
        return current;
    };

    // ─── تابع برای تنظیم مقدار در path ───
    const setValueByPath = (path: string[], value: any) => {
        if (!canEdit) return;
        const newSettings = { ...moduleSettings };
        let current: any = newSettings;
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[path[path.length - 1]] = value;
        setValue(`config.modules.${moduleKey}`, newSettings);
    };

    // ─── رندر بازگشتی یک گره ───
    const renderNode = (node: RuleNode, parentPath: string[] = []) => {
        const fullPath = [...parentPath, node.key];
        const value = getValueByPath(fullPath);
        const IconComponent = node.icon ? ICON_MAP[node.icon] : null;

        // اگر گره دارای فرزند باشد
        if (node.children && node.children.length > 0) {
            // اگر hasToggle: true باشد
            if (node.hasToggle) {
                const isActive = value?.enabled === true;
                return (
                    <div key={node.key} className="col-span-1 sm:col-span-2 lg:col-span-3">
                        <div className={cn(
                            "flex flex-col gap-2 p-3 rounded-lg border transition-all",
                            isActive ? 'bg-primary/5 border-primary/20' : 'bg-surface-container-lowest border-outline-variant/20',
                            !canEdit && 'cursor-default opacity-60'
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {IconComponent && (
                                        <IconComponent className={cn(
                                            "w-3.5 h-3.5 flex-shrink-0",
                                            isActive ? 'text-primary' : 'text-on-surface-variant/40'
                                        )} />
                                    )}
                                    <div>
                                        <p className="text-xs font-medium text-on-surface">{node.label}</p>
                                        {node.hint && <p className="text-[9px] text-on-surface-variant/50">{node.hint}</p>}
                                    </div>
                                </div>
                                <label className={cn(
                                    "relative inline-flex items-center",
                                    canEdit ? 'cursor-pointer' : 'cursor-default'
                                )}>
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setValueByPath([...fullPath, 'enabled'], e.target.checked)}
                                        disabled={!canEdit}
                                        className="sr-only peer"
                                    />
                                    <div className={cn(
                                        "w-9 h-5 rounded-full relative transition-all duration-200",
                                        isActive ? 'bg-primary after:translate-x-4' : 'bg-outline-variant after:translate-x-0',
                                        "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-200 after:shadow-sm",
                                        !canEdit && 'opacity-50'
                                    )} />
                                </label>
                            </div>

                            {isActive && (
                                <div className="flex flex-wrap items-center gap-2 pr-7 pt-1 border-t border-outline-variant/20">
                                    {node.children.map((child) => {
                                        const childFullPath = [...fullPath, child.key];
                                        const childValue = getValueByPath(childFullPath);
                                        const childIcon = child.icon ? ICON_MAP[child.icon] : null;
                                        if (child.children && child.children.length > 0) {
                                            return renderNode(child, fullPath);
                                        }
                                        return (
                                            <label key={child.key} className="flex items-center gap-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={childValue === true}
                                                    onChange={(e) => setValueByPath(childFullPath, e.target.checked)}
                                                    disabled={!canEdit}
                                                    className="w-3.5 h-3.5 text-primary focus:ring-primary rounded"
                                                />
                                                {childIcon && <childIcon className="w-3.5 h-3.5 text-on-surface-variant/40" />}
                                                <span className="text-xs text-on-surface-variant whitespace-nowrap">{child.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            // گروه ساده با زیرمجموعه
            return (
                <div key={node.key} className="col-span-1 sm:col-span-2 lg:col-span-3">
                    <div className="flex flex-col gap-2 p-3 rounded-lg border border-outline-variant/20 bg-surface-container-lowest/50">
                        <div className="flex items-center gap-2">
                            {IconComponent && <IconComponent className="w-3.5 h-3.5 text-on-surface-variant/60" />}
                            <span className="text-xs font-medium text-on-surface">{node.label}</span>
                            {node.hint && <span className="text-[9px] text-on-surface-variant/50">({node.hint})</span>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pr-6">
                            {node.children.map((child) => renderNode(child, fullPath))}
                        </div>
                    </div>
                </div>
            );
        }

        // گره برگ
        const isActive = node.isNumber ? (value > (node.min || 0)) : value === true;

        return (
            <div key={node.key} className={cn(
                "flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all",
                isActive ? 'bg-primary/5 border-primary/20' : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/50',
                !canEdit && 'cursor-default opacity-60'
            )}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {IconComponent && (
                        <IconComponent className={cn(
                            "w-3.5 h-3.5 flex-shrink-0",
                            isActive ? 'text-primary' : 'text-on-surface-variant/40'
                        )} />
                    )}
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-on-surface truncate">{node.label}</p>
                        {node.hint && <p className="text-[9px] text-on-surface-variant/50 hidden sm:block">{node.hint}</p>}
                    </div>
                </div>

                {node.isNumber ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <input
                            type="number"
                            value={value ?? node.min ?? 0}
                            onChange={(e) => setValueByPath(fullPath, parseFloat(e.target.value) || 0)}
                            min={node.min} max={node.max}
                            disabled={!canEdit}
                            className="w-14 bg-surface border border-outline rounded-md h-7 px-1.5 text-xs text-center focus:ring-1 focus:ring-primary/30 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-[9px] text-on-surface-variant/60 w-14">{node.suffix}</span>
                    </div>
                ) : (
                    <label className={cn(
                        "relative inline-flex items-center",
                        canEdit ? 'cursor-pointer' : 'cursor-default'
                    )}>
                        <input
                            type="checkbox"
                            checked={value ?? false}
                            onChange={(e) => setValueByPath(fullPath, e.target.checked)}
                            disabled={!canEdit}
                            className="sr-only peer"
                        />
                        <div className={cn(
                            "w-9 h-5 rounded-full relative transition-all duration-200",
                            value ? 'bg-primary after:translate-x-4' : 'bg-outline-variant after:translate-x-0',
                            "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-200 after:shadow-sm",
                            !canEdit && 'opacity-50'
                        )} />
                    </label>
                )}
            </div>
        );
    };

    return (
        <div className={cn(
            "bg-surface-container-low rounded-xl border transition-all",
            isEnabled ? 'border-outline-variant' : 'border-outline-variant/30 opacity-70',
            !canEdit && 'opacity-80'
        )}>
            {/* هدر ماژول */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        isEnabled ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant/50'
                    )}>
                        <ModuleIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-on-surface">{config.title}</h3>
                        <p className="text-[10px] text-on-surface-variant">{moduleName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canEdit ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={e => setValueByPath(['enabled'], e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className={cn(
                                "w-11 h-6 rounded-full relative transition-all duration-200",
                                isEnabled ? 'bg-primary after:translate-x-5' : 'bg-outline-variant after:translate-x-0.5',
                                "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 after:shadow-sm"
                            )} />
                        </label>
                    ) : (
                        <div className="flex items-center gap-1.5 text-on-surface-variant/50">
                            <Lock className="w-3.5 h-3.5" />
                            <span className="text-[10px]">فقط مشاهده</span>
                        </div>
                    )}

                    {canEdit && (
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            {isSaving ? 'ذخیره' : saved ? 'ذخیره شد' : 'ذخیره'}
                        </button>
                    )}
                </div>
            </div>

            {isOwnerWithNoAccess && (
                <div className="mx-4 mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-amber-800 dark:text-amber-300">
                        تغییر تنظیمات این قسمت فعلا برای شما فعال نیست.
                        در صورت نیاز با پشتیبانی Daymat تماس بگیرید.
                    </p>
                </div>
            )}

            <div className={cn(
                "transition-all duration-300 overflow-hidden",
                isEnabled ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
            )}>
                <div className="p-4 space-y-4">
                    {config.groups.map((group, groupIdx) => {
                        const GroupIcon = group.groupIcon ? ICON_MAP[group.groupIcon] : null;

                        return (
                            <div key={groupIdx} className="rounded-xl border-2 border-dashed border-outline-variant/30 bg-surface-container-lowest/30 overflow-hidden">
                                {/* هدر گروه */}
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-low/80 border-b border-outline-variant/20">
                                    {GroupIcon && (
                                        <GroupIcon className="w-4 h-4 text-primary" />
                                    )}
                                    <span className="text-xs font-bold text-on-surface">{group.groupTitle}</span>
                                </div>
                                {/* محتوای گروه */}
                                <div className="p-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {group.rules.map((rule) => renderNode(rule, []))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}