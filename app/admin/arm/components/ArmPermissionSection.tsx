// app/admin/arm/components/ArmPermissionSection.tsx
'use client';

import React from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Shield, Lock, Unlock, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArmPermissionSectionProps {
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    isAdmin?: boolean;
    isSaving?: boolean;
    onSave?: () => void;
}

type PermissionKey =
    | 'general.canEditName'
    | 'general.canEditShortName'
    | 'general.canEditSlogan'
    | 'general.canEditDescription'
    | 'general.canEditMission'
    | 'general.canEditSlug'
    | 'general.canEditStatus'
    | 'general.canEditIcon'
    | 'general.canEditColors'
    | 'general.canEditLogo'
    | 'general.canEditBanner'
    | 'modules.canEditPriceTable'
    | 'modules.canEditBuyLead'
    | 'accessRules.canEdit'
    | 'economy.canEdit'
    | 'payment.canEdit'
    | 'categories.canEdit'
    | 'categories.canAdd'
    | 'categories.canRemove'
    | 'locations.canEdit'
    | 'locations.canAdd'
    | 'locations.canRemove'
    | 'industries.canEdit'
    | 'industries.canAdd'
    | 'industries.canRemove'
    | 'formLabels.canEdit'
    | 'members.canView'
    | 'members.canEdit'
    | 'members.canChangeRole'
    | 'members.canBan'
    | 'ads.canView'
    | 'ads.canApprove'
    | 'ads.canDelete'
    | 'ads.canBump';

interface PermissionItem {
    key: PermissionKey;
    label: string;
    description?: string;
    category: 'general' | 'modules' | 'access' | 'economy' | 'payment' | 'categories' | 'locations' | 'industries' | 'formLabels' | 'members' | 'ads';
}

const PERMISSIONS: PermissionItem[] = [
    // ========== عمومی ==========
    { key: 'general.canEditName', label: 'ویرایش نام', category: 'general' },
    { key: 'general.canEditShortName', label: 'ویرایش نام کوتاه', category: 'general' },
    { key: 'general.canEditSlogan', label: 'ویرایش شعار', category: 'general' },
    { key: 'general.canEditDescription', label: 'ویرایش توضیحات', category: 'general' },
    { key: 'general.canEditMission', label: 'ویرایش مأموریت', category: 'general' },
    { key: 'general.canEditSlug', label: 'ویرایش شناسه', category: 'general', description: 'فقط مدیر سیستم' },
    { key: 'general.canEditStatus', label: 'ویرایش وضعیت', category: 'general', description: 'فقط مدیر سیستم' },
    { key: 'general.canEditIcon', label: 'ویرایش آیکون', category: 'general' },
    { key: 'general.canEditColors', label: 'ویرایش تم رنگ', category: 'general' },
    { key: 'general.canEditLogo', label: 'آپلود لوگو', category: 'general' },
    { key: 'general.canEditBanner', label: 'ویرایش بنر', category: 'general' },

    // ========== ماژول‌ها ==========
    { key: 'modules.canEditPriceTable', label: 'ویرایش تابلوی قیمت', category: 'modules' },
    { key: 'modules.canEditBuyLead', label: 'ویرایش درخواست خرید', category: 'modules' },

    // ========== قوانین دسترسی ==========
    { key: 'accessRules.canEdit', label: 'ویرایش قوانین دسترسی', category: 'access' },

    // ========== اقتصاد ==========
    { key: 'economy.canEdit', label: 'ویرایش تنظیمات اقتصادی', category: 'economy' },

    // ========== پرداخت ==========
    { key: 'payment.canEdit', label: 'ویرایش تنظیمات پرداخت', category: 'payment' },

    // ========== دسته‌بندی‌ها ==========
    { key: 'categories.canEdit', label: 'ویرایش دسته‌بندی‌ها', category: 'categories' },
    { key: 'categories.canAdd', label: 'افزودن دسته‌بندی', category: 'categories' },
    { key: 'categories.canRemove', label: 'حذف دسته‌بندی', category: 'categories' },

    // ========== موقعیت‌ها ==========
    { key: 'locations.canEdit', label: 'ویرایش موقعیت‌ها', category: 'locations' },
    { key: 'locations.canAdd', label: 'افزودن موقعیت', category: 'locations' },
    { key: 'locations.canRemove', label: 'حذف موقعیت', category: 'locations' },

    // ========== صنوف ==========
    { key: 'industries.canEdit', label: 'ویرایش صنوف', category: 'industries' },
    { key: 'industries.canAdd', label: 'افزودن صنف', category: 'industries' },
    { key: 'industries.canRemove', label: 'حذف صنف', category: 'industries' },

    // ========== برچسب‌ها ==========
    { key: 'formLabels.canEdit', label: 'ویرایش برچسب‌ها', category: 'formLabels' },

    // ========== مدیریت اعضا ==========
    { key: 'members.canView', label: 'مشاهده اعضا', category: 'members' },
    { key: 'members.canEdit', label: 'ویرایش اعضا', category: 'members' },
    { key: 'members.canChangeRole', label: 'تغییر نقش اعضا', category: 'members' },
    { key: 'members.canBan', label: 'بن کردن اعضا', category: 'members' },

    // ========== آگهی‌ها ==========
    { key: 'ads.canView', label: 'مشاهده آگهی‌ها', category: 'ads' },
    { key: 'ads.canApprove', label: 'تأیید آگهی‌ها', category: 'ads' },
    { key: 'ads.canDelete', label: 'حذف آگهی‌ها', category: 'ads' },
    { key: 'ads.canBump', label: 'نردبان آگهی‌ها', category: 'ads' },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: string; description: string }> = {
    general: { label: 'عمومی', icon: '🏠', description: 'تنظیمات عمومی بازار' },
    modules: { label: 'ماژول‌ها', icon: '🧩', description: 'تنظیمات ماژول‌های بازار' },
    access: { label: 'قوانین دسترسی', icon: '🔐', description: 'تنظیمات قوانین دسترسی' },
    economy: { label: 'اقتصاد', icon: '💰', description: 'تنظیمات اقتصادی بازار' },
    payment: { label: 'پرداخت', icon: '💳', description: 'تنظیمات درگاه پرداخت' },
    categories: { label: 'دسته‌بندی‌ها', icon: '📂', description: 'تنظیمات دسته‌بندی‌ها' },
    locations: { label: 'موقعیت‌ها', icon: '📍', description: 'تنظیمات موقعیت‌های جغرافیایی' },
    industries: { label: 'صنوف', icon: '🏭', description: 'تنظیمات صنوف مجاز' },
    formLabels: { label: 'برچسب‌ها', icon: '🏷️', description: 'تنظیمات برچسب‌های فرم‌ها' },
    members: { label: 'مدیریت اعضا', icon: '👥', description: 'تنظیمات دسترسی به مدیریت اعضا' },
    ads: { label: 'آگهی‌ها', icon: '📢', description: 'تنظیمات دسترسی به مدیریت آگهی‌ها' },
};

export function ArmPermissionSection({
                                         watch,
                                         setValue,
                                         isAdmin = false,
                                         isSaving = false,
                                         onSave,
                                     }: ArmPermissionSectionProps) {
    const armAdminPermission = watch('config.armAdminPermission') || {};

    const getValue = (key: PermissionKey): boolean => {
        const parts = key.split('.');
        let current: any = armAdminPermission;
        for (const part of parts) {
            if (current === undefined || current === null) return false;
            current = current[part];
        }
        return current !== undefined ? current : false;
    };

    const togglePermission = (key: PermissionKey) => {
        if (!isAdmin) return;
        const current = getValue(key);
        const parts = key.split('.');

        // ✅ ساخت مسیر به صورت string با نقطه
        const path = ['config', 'armAdminPermission', ...parts].join('.');
        setValue(path, !current, { shouldDirty: true });

        if (onSave) onSave();
    };

    // گروه‌بندی بر اساس دسته‌بندی
    const groupedPermissions = PERMISSIONS.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, PermissionItem[]>);

    // اگر کاربر ادمین نیست، فقط نمایش بده (بدون قابلیت تغییر)
    const isReadOnly = !isAdmin;

    return (
        <div className="space-y-6">
            {/* هدر */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-bold text-on-surface dark:text-gray-100">
                        دسترسی‌های مالک بازار
                    </h3>
                </div>
                {isReadOnly && (
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/60 dark:text-gray-500">
                        <Lock className="w-3.5 h-3.5" />
                        فقط مشاهده
                    </div>
                )}
            </div>

            {/* دسته‌بندی‌ها */}
            <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, items]) => {
                    const catInfo = CATEGORY_LABELS[category];
                    if (!catInfo) return null;

                    return (
                        <div key={category} className="border border-outline-variant/20 dark:border-gray-700 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-base">{catInfo.icon}</span>
                                <span className="text-sm font-semibold text-on-surface dark:text-gray-100">
                                    {catInfo.label}
                                </span>
                                <span className="text-[10px] text-on-surface-variant/40 dark:text-gray-600">
                                    {catInfo.description}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {items.map((item) => {
                                    const value = getValue(item.key);
                                    const isDisabled = isReadOnly ||
                                        (item.key === 'general.canEditSlug' ||
                                            item.key === 'general.canEditStatus');

                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => togglePermission(item.key)}
                                            disabled={isDisabled}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-right",
                                                value
                                                    ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-400'
                                                    : 'border-outline-variant/30 dark:border-gray-700 text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-low dark:hover:bg-gray-800',
                                                isDisabled && 'opacity-60 cursor-not-allowed',
                                                !isReadOnly && 'cursor-pointer hover:border-primary/30'
                                            )}
                                        >
                                            {value ? (
                                                <Check className="w-4 h-4 flex-shrink-0 text-primary" />
                                            ) : (
                                                <X className="w-4 h-4 flex-shrink-0 text-on-surface-variant/30 dark:text-gray-600" />
                                            )}
                                            <span className="text-xs">{item.label}</span>
                                            {item.description && (
                                                <span className="text-[9px] text-on-surface-variant/40 dark:text-gray-600">
                                                    ({item.description})
                                                </span>
                                            )}
                                            {!value && !isDisabled && (
                                                <span className="mr-auto text-[9px] text-on-surface-variant/30 dark:text-gray-600">
                                                    غیرفعال
                                                </span>
                                            )}
                                            {value && (
                                                <span className="mr-auto text-[9px] text-emerald-500">
                                                    فعال
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* راهنما */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                    ⚠️ تغییرات این بخش فقط توسط مدیر سیستم قابل انجام است.
                    مالک بازار فقط می‌تواند این تنظیمات را مشاهده کند.
                </p>
            </div>
        </div>
    );
}