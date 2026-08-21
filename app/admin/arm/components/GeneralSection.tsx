// app/admin/arm/components/GeneralSection.tsx
'use client';

import React, { useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { FileUploader } from '@/components/common/FileUploader';
import { useUploadFile } from '@/lib/api/apiHooks';
import { setArm } from '@/lib/store/slices/armSlice';
import { toast } from 'sonner';
import {Loader2, Upload, Check, Palette, Info, Lock, Phone, Mail, Clock, User} from 'lucide-react';
import { cn } from '@/lib/utils';
import {apiService} from "@/lib/api/apiService";

// ============================================================
// 📋 Props
// ============================================================
interface GeneralSectionProps {
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    armId?: string;
    isSystemAdmin?: boolean;
}

// ============================================================
// 🎨 پالت رنگی
// ============================================================
const THEME_PRESETS = [
    { id: 'divar-red', label: 'قرمز دیوار', category: 'صنعتی', primary: '#a11f2c', secondary: '#7a1721' },
    { id: 'industrial-orange', label: 'صنعتی', category: 'صنعتی', primary: '#e65100', secondary: '#bf360c' },
    { id: 'steel-blue', label: 'فولاد', category: 'صنعتی', primary: '#37474f', secondary: '#1a2327' },
    { id: 'navy', label: 'اداری', category: 'اداری', primary: '#1a237e', secondary: '#0d1137' },
    { id: 'teal', label: 'تجاری', category: 'اداری', primary: '#00695c', secondary: '#003d33' },
    { id: 'forest-green', label: 'جنگلی', category: 'طبیعت', primary: '#1b5e20', secondary: '#0d3311' },
    { id: 'earth-brown', label: 'خاکی', category: 'طبیعت', primary: '#4e342e', secondary: '#2a1c18' },
    { id: 'deep-purple', label: 'سلطنتی', category: 'لوکس', primary: '#4a148c', secondary: '#2a0d54' },
    { id: 'gold', label: 'طلایی', category: 'لوکس', primary: '#c79100', secondary: '#7a5a00' },
    { id: 'rose', label: 'صورتی', category: 'مدرن', primary: '#ad1457', secondary: '#6b0833' },
    { id: 'slate', label: 'مینیمال', category: 'مدرن', primary: '#455a64', secondary: '#1c262b' },
];

function lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ============================================================
// 🎯 کامپوننت اصلی
// ============================================================
export function GeneralSection({
                                   register,
                                   errors,
                                   watch,
                                   setValue,
                                   armId,
                                   isSystemAdmin = false,
                               }: GeneralSectionProps) {
    const dispatch = useDispatch();
    const { currentArm, currentSlug } = useSelector((state: RootState) => state.arm);
    const uploadMutation = useUploadFile();
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    // گرفتن دسترسی‌ها از config
    const armAdminPermission = watch('config.armAdminPermission') || {};
    const generalAccess = armAdminPermission.general || {};

    // اگر مدیر سیستم باشه، همه دسترسی‌ها بازه
    const canEditSlug = isSystemAdmin || generalAccess.canEditSlug === true;
    const canEditStatus = isSystemAdmin || generalAccess.canEditStatus === true;
    const canEditColors = isSystemAdmin || generalAccess.canEditColors !== false;
    const canUploadLogo = isSystemAdmin || generalAccess.canUploadLogo !== false;
    const canEditName = isSystemAdmin || generalAccess.canEditName !== false;
    const canEditShortName = isSystemAdmin || generalAccess.canEditShortName !== false;
    const canEditSlogan = isSystemAdmin || generalAccess.canEditSlogan !== false;
    const canEditDescription = isSystemAdmin || generalAccess.canEditDescription !== false;
    const canEditMission = isSystemAdmin || generalAccess.canEditMission !== false;
    const canEditIcon = isSystemAdmin || generalAccess.canEditIcon !== false;
    const canEditBanner = isSystemAdmin || generalAccess.canEditBanner !== false;

    // ✅ دسترسی ویرایش اطلاعات پشتیبانی - همیشه فعال (مگر اینکه صراحتاً false باشد)
    const supportAccess = armAdminPermission.support || {};
    const canEditSupport = isSystemAdmin || supportAccess.canEdit !== false;

    const logoFileId = watch('config.general.logoFileId');
    const currentPrimary = watch('colorPrimary') || '#e65100';

    const logoFile = watch('config.general.logoFile');
    const logoUrl = watch('config.general.logoUrl');
    const previewUrl = logoFile?.path || logoUrl || null;

// app/admin/arm/components/GeneralSection.tsx

    // app/admin/arm/components/GeneralSection.tsx

    const handleLogoUpload = async (file: File) => {
        if (!armId) { toast.error('ابتدا بازار را ذخیره کنید'); return; }
        if (file.size > 500 * 1024) { toast.error('حجم فایل نباید بیشتر از 500 کیلوبایت باشد'); return; }
        setIsUploadingLogo(true);
        try {
            const result = await uploadMutation.mutateAsync({ file, model: 'Arm', modelId: armId, fieldKey: 'logo' });

            // ✅ ۱. ذخیره در React Hook Form
            setValue('config.general.logoFileId', result.id, { shouldDirty: true });
            setValue('config.general.logoUrl', result.path, { shouldDirty: true });
            setValue('config.general.logoFile', {
                id: result.id,
                path: result.path,
                thumbnailPath: result.thumbnailPath,
                fieldKey: 'logo',
            }, { shouldDirty: true });

            // ✅ ۲. بلافاصله به بک‌اند ذخیره کن (تا با رفرش از بین نره)
            if (armId) {
                const currentConfig = watch('config');
                await apiService.admin.arms.update(armId, {
                    config: {
                        ...currentConfig,
                        general: {
                            ...currentConfig?.general,
                            logoFileId: result.id,
                            logoUrl: result.path,
                            logoFile: {
                                id: result.id,
                                path: result.path,
                                thumbnailPath: result.thumbnailPath,
                                fieldKey: 'logo',
                            },
                        },
                    },
                });
                toast.success('لوگو ذخیره شد');
            }

            // ✅ ۳. Redux رو به‌روز کن
            if (currentArm && currentSlug) {
                const updatedArm = {
                    ...currentArm,
                    config: {
                        ...currentArm.config,
                        general: {
                            ...currentArm.config?.general,
                            logoFileId: result.id,
                            logoUrl: result.path,
                            logoFile: {
                                id: result.id,
                                path: result.path,
                                thumbnailPath: result.thumbnailPath,
                                fieldKey: 'logo',
                            },
                        },
                    },
                };
                dispatch(setArm({ arm: updatedArm, slug: currentSlug }));
            }

            toast.success('لوگو با موفقیت آپلود و ذخیره شد');
        } catch (error: any) {
            toast.error(error?.message || 'خطا در آپلود لوگو');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleLogoRemove = () => {
        setValue('config.general.logoFileId', undefined, { shouldDirty: true });
        setValue('config.general.logoUrl', '', { shouldDirty: true });
        setValue('config.general.logoFile', undefined, { shouldDirty: true });

        // ✅ Redux رو هم به‌روز کن
        if (currentArm && currentSlug) {
            const updatedArm = {
                ...currentArm,
                config: {
                    ...currentArm.config,
                    general: {
                        ...currentArm.config?.general,
                        logoFileId: undefined,
                        logoUrl: '',
                        logoFile: undefined,
                    },
                },
            };
            dispatch(setArm({ arm: updatedArm, slug: currentSlug }));
        }

        toast.success('لوگو حذف شد');
    };

    const applyTheme = (primary: string, secondary: string) => {
        setValue('colorPrimary', primary, { shouldDirty: true });
        setValue('colorSecondary', secondary, { shouldDirty: true });

        const root = document.documentElement;
        const isDark = document.documentElement.classList.contains('dark');
        root.style.setProperty('--primary', isDark ? lightenColor(primary, 0.3) : primary);
        root.style.setProperty('--primary-container', primary);
        root.style.setProperty('--on-primary', isDark ? '#000000' : '#ffffff');

        if (currentArm && currentSlug) {
            dispatch(setArm({ arm: { ...currentArm, colorPrimary: primary, colorSecondary: secondary }, slug: currentSlug }));
        }
        toast.success(`تم "${primary}" اعمال شد`, { duration: 1500 });
    };

    return (
        <div className="space-y-8">
            {/* ═══════════════ اطلاعات پایه ═══════════════ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-on-surface dark:text-gray-100">اطلاعات عمومی</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* slug - فقط ادمین سیستم می‌تونه تغییر بده */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 flex items-center gap-1.5">
                            شناسه یکتا <span className="text-primary">*</span>
                            {!canEditSlug && <Lock className="w-3 h-3 text-purple-500" />}
                        </label>
                        <input
                            {...register('slug', { required: true })}
                            placeholder="barton"
                            readOnly={!canEditSlug}
                            className={cn(
                                "w-full border rounded-xl h-10 px-3 text-sm text-right placeholder:text-on-surface-variant/30",
                                !canEditSlug
                                    ? "bg-surface-container-low dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            )}
                        />
                        {errors.slug && <p className="text-error text-[11px]">شناسه یکتا الزامی است</p>}
                    </div>

                    {/* name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400">
                            نام بازار <span className="text-primary">*</span>
                        </label>
                        <input
                            {...register('name', { required: true })}
                            placeholder="مثلا، Daymat مصالح"
                            readOnly={!canEditName}
                            className={cn(
                                "w-full border rounded-xl h-10 px-3 text-sm text-right placeholder:text-on-surface-variant/30",
                                !canEditName
                                    ? "bg-surface-container-low dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            )}
                        />
                        {errors.name && <p className="text-error text-[11px]">نام بازار الزامی است</p>}
                    </div>

                    {/* slogan */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400">
                            شعار <span className="text-primary">*</span>
                        </label>
                        <input
                            {...register('slogan', { required: true })}
                            placeholder="قیمت روز تامین کنندگان مصالح ساختمانی"
                            readOnly={!canEditSlogan}
                            className={cn(
                                "w-full border rounded-xl h-10 px-3 text-sm text-right placeholder:text-on-surface-variant/30",
                                !canEditSlogan
                                    ? "bg-surface-container-low dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            )}
                        />
                        {errors.slogan && <p className="text-error text-[11px]">شعار الزامی است</p>}
                    </div>

                    {/* status - فقط ادمین سیستم می‌تونه تغییر بده */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 flex items-center gap-1.5">
                            وضعیت
                            {!canEditStatus && <Lock className="w-3 h-3 text-purple-500" />}
                        </label>
                        {canEditStatus ? (
                            <select
                                {...register('status')}
                                className="w-full rounded-xl h-10 px-3 text-sm text-right appearance-none cursor-pointer bg-white dark:bg-gray-900 border border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            >
                                <option value="active">فعال</option>
                                <option value="archived">بایگانی</option>
                            </select>
                        ) : (
                            <div className="w-full rounded-xl h-10 px-3 text-sm text-right flex items-center bg-surface-container-low dark:bg-gray-800 border border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed">
                                {watch('status') === 'active' ? 'فعال' : 'بایگانی'}
                            </div>
                        )}
                    </div>

                    {/* description */}
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400">توضیحات</label>
                        <textarea
                            {...register('description')}
                            rows={10}
                            placeholder="توضیحات کامل بازار..."
                            readOnly={!canEditDescription}
                            className={cn(
                                "w-full min-h-12 border rounded-xl px-3 py-2 text-sm text-right resize-none placeholder:text-on-surface-variant/30",
                                !canEditDescription
                                    ? "bg-surface-container-low dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            )}
                        />
                    </div>

                    {/* mission */}
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400">مأموریت</label>
                        <textarea
                            {...register('mission')}
                            rows={2}
                            placeholder="مأموریت و هدف بازار..."
                            readOnly={!canEditMission}
                            className={cn(
                                "w-full border  rounded-xl px-3 py-2 text-sm text-right resize-none placeholder:text-on-surface-variant/30",
                                !canEditMission
                                    ? "bg-surface-container-low dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            )}
                        />
                    </div>
                </div>
            </section>

            {/* ═══════════════ لوگو ═══════════════ */}
            {(armId && canUploadLogo) && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Upload className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold text-on-surface dark:text-gray-100">لوگوی بازار</h3>
                        {!canUploadLogo && <Lock className="w-3.5 h-3.5 text-purple-500" />}
                    </div>
                    <p className="text-[11px] text-on-surface-variant/60 dark:text-gray-500 mb-4">سایز پیشنهادی 200 * 200 پیکسل با پس‌زمینه شفاف</p>

                    <div className="flex items-start gap-4">

                        <FileUploader
                            value={logoFileId}
                            previewUrl={previewUrl}  // ✅ این خط را اضافه کن
                            onFileSelect={canUploadLogo ? handleLogoUpload : undefined}
                            onRemove={canUploadLogo ? handleLogoRemove : undefined}
                            rounded={false}
                            width={120}
                            height={120}
                            disabled={isUploadingLogo || !canUploadLogo}
                        />

                        <div className="flex-1 space-y-2">
                            {isUploadingLogo && (
                                <div className="flex items-center gap-2 text-sm text-primary">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    در حال آپلود...
                                </div>
                            )}
                            {logoFileId && !isUploadingLogo && (
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <Check className="w-4 h-4" />
                                    لوگو آپلود شد
                                </p>
                            )}
                            {!logoFileId && !isUploadingLogo && (
                                <p className="text-sm text-on-surface-variant/60 dark:text-gray-500">
                                    {canUploadLogo ? 'کلیک کنید' : 'آپلود لوگو نیازمند ارتقا حساب است'}
                                </p>
                            )}
                            <div className="text-[10px] text-on-surface-variant/40 dark:text-gray-600 space-y-0.5">
                                <p>PNG, JPG, SVG, WebP</p>
                                <p>حداکثر ۲۰۰ کیلوبایت</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* نمایش نشان نسخه آزمایشی */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-xs font-medium text-on-surface-variant dark:text-gray-400">
                      نمایش نسخه بازار
                    </h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                        type="checkbox"
                        checked={watch('config.general.showTestBadge') ?? true}
                        onChange={e => setValue('config.general.showTestBadge', e.target.checked, { shouldDirty: true })}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-200 peer-checked:after:translate-x-5" />
                </label>
            </div>

            {/* متن نشان نسخه آزمایشی */}
            {watch('config.general.showTestBadge') && (
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 block">
                        متن نشان
                    </label>
                    <input
                        type="text"
                        value={watch('config.general.testBadgeText')}
                        onChange={e => setValue('config.general.testBadgeText', e.target.value, { shouldDirty: true })}
                        className="w-full bg-white dark:bg-gray-900 border border-outline-variant/30 rounded-lg h-10 px-3 text-sm"
                        placeholder="مثلا نسخه 0.1.1"
                    />
                </div>
            )}
            {/* ═══════════════ تم رنگ ═══════════════ */}
            {canEditColors && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Palette className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-bold text-on-surface dark:text-gray-100">تم رنگ بازار</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full">
                        {THEME_PRESETS.map(preset => {
                            const isActive = currentPrimary === preset.primary;
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => applyTheme(preset.primary, preset.secondary)}
                                    className={cn(
                                        "group w-32 relative flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all duration-200 hover:scale-105",
                                        isActive
                                            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-2 ring-primary/20'
                                            : 'border-transparent hover:border-outline-variant/40 dark:hover:border-gray-700 hover:bg-surface-container-low/50 dark:hover:bg-gray-800/50'
                                    )}
                                    title={preset.label}
                                >
                                    <div
                                        className="w-6 h-6 rounded-full ring-2 ring-offset-2 ring-white/20 dark:ring-black/20 transition-shadow group-hover:ring-offset-2 flex-shrink-0"
                                        style={{ backgroundColor: preset.primary }}
                                    />
                                    <span className={cn(
                                        "text-xs font-medium transition-colors",
                                        isActive
                                            ? 'text-primary dark:text-primary-400'
                                            : 'text-on-surface-variant dark:text-gray-400 group-hover:text-on-surface dark:group-hover:text-gray-300'
                                    )}>
                                    {preset.label}
                                </span>
                                    {isActive && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-sm">
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-5 pt-5 border-t border-outline-variant/20 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            {/* انتخابگر رنگ */}
                            <div className="relative">
                                <input
                                    type="color"
                                    value={typeof currentPrimary === 'string' ? currentPrimary : '#e65100'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setValue('colorPrimary', val, { shouldDirty: true });
                                        applyTheme(val, val);
                                    }}
                                    className="absolute border inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div
                                    className="w-9 h-9 rounded-xl border-2 border-outline-variant/30 dark:border-gray-700 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                    style={{ backgroundColor: typeof currentPrimary === 'string' ? currentPrimary : '#e65100' }}
                                />
                            </div>

                            {/* ورودی کد HEX */}
                            <input
                                type="text"
                                value={typeof currentPrimary === 'string' ? currentPrimary : '#e65100'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                        setValue('colorPrimary', val, { shouldDirty: true });
                                        if (val.length === 7) {
                                            applyTheme(val, val);
                                        }
                                    }
                                }}
                                onBlur={(e) => {
                                    const val = e.target.value;
                                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                        applyTheme(val, val);
                                    }
                                }}
                                className="w-28 bg-white  dark:bg-gray-900 border border-outline-variant/30 dark:border-gray-700 rounded-xl h-9 px-3 text-xs text-center font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="#e65100"
                                maxLength={7}
                            />
                            <span className="text-[11px] text-on-surface-variant/40 dark:text-gray-600">کد HEX دلخواه</span>
                        </div>
                    </div>
                </section>
            )}


            {/* ═══════════════ 📞 اطلاعات پشتیبانی ═══════════════ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Phone className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-on-surface dark:text-gray-100">اطلاعات پشتیبانی</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant/60 dark:text-gray-500 mb-4">
                  اطلاعات پشتیبانی تلفنی بازار را وارد کنید. تا کاربران بتوانند با شما تماس بگیرند.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* نام پشتیبان */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> نام پشتیبان
                        </label>
                        <input
                            {...register('config.support.name')}
                            placeholder="علی محمدی"
                            readOnly={!canEditSupport}
                            className={cn(
                                "w-full border rounded-xl h-10 px-3 text-sm text-right placeholder:text-on-surface-variant/30",
                                !canEditSupport
                                    ? "bg-surface-container-low dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            )}
                        />
                    </div>
                    {/* موبایل پشتیبانی */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> همراه <span className="text-primary">*</span>
                        </label>
                        <input
                            {...register('config.support.mobile')}
                            placeholder="۰۹۱۲-۱۲۳-۴۵۶۷"
                            readOnly={!canEditSupport}
                            className={cn(
                                "w-full border rounded-xl h-10 px-3 text-sm text-right placeholder:text-on-surface-variant/30",
                                !canEditSupport
                                    ? "bg-surface-container-low dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            )}
                        />
                    </div>
                    {/* تلفن ثابت (اختیاری) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> تلفن ثابت
                        </label>
                        <input
                            {...register('config.support.phone')}
                            placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
                            readOnly={!canEditSupport}
                            className={cn(
                                "w-full rounded-xl border h-10 px-3 text-sm text-right placeholder:text-on-surface-variant/30",
                                !canEditSupport
                                    ? "bg-surface-container-low dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            )}
                        />
                    </div>



                    {/* ایمیل */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> ایمیل
                        </label>
                        <input
                            {...register('config.support.email')}
                            placeholder="support@barton.ir"
                            readOnly={!canEditSupport}
                            className={cn(
                                "w-full rounded-xl h-10 border px-3 text-sm text-right placeholder:text-on-surface-variant/30",
                                !canEditSupport
                                    ? "bg-surface-container-low dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            )}
                        />
                    </div>

                    {/* ساعات کاری */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> ساعات کاری
                        </label>
                        <input
                            {...register('config.support.workingHours')}
                            placeholder="شنبه تا چهارشنبه ۹ تا ۱۷"
                            readOnly={!canEditSupport}
                            className={cn(
                                "w-full rounded-xl h-10 border px-3 text-sm text-right placeholder:text-on-surface-variant/30",
                                !canEditSupport
                                    ? "bg-surface-container-low dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            )}
                        />
                    </div>

                    {/* توضیحات پشتیبانی */}
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" /> توضیحات
                        </label>
                        <textarea
                            {...register('config.support.description')}
                            rows={2}
                            placeholder="توضیحات اضافی برای بخش پشتیبانی..."
                            readOnly={!canEditSupport}
                            className={cn(
                                "w-full rounded-xl px-3 py-2 border text-sm text-right resize-none placeholder:text-on-surface-variant/30",
                                !canEditSupport
                                    ? "bg-surface-container-low dark:bg-gray-800 border-outline-variant/20 dark:border-gray-700 text-on-surface/50 dark:text-gray-500 cursor-not-allowed"
                                    : "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            )}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}