// app/arm-admin/settings/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Save,
    Loader2,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

import { GeneralSection } from '@/app/admin/arm/components/GeneralSection';
import { PaymentSection } from '@/app/admin/arm/components/PaymentSection';
import { ModuleSettingsSection } from '@/app/admin/arm/components/ModuleSettingsSection';
import { AccessRulesSection } from '@/app/admin/arm/components/AccessRulesSection';
import { EconomySection } from '@/app/admin/arm/components/EconomySection';
import { FormLabelsSection } from '@/app/admin/arm/components/FormLabelsSection';
import { ArmPermissionSection } from '@/app/admin/arm/components/ArmPermissionSection';
import { CategorySelector } from '@/app/admin/arm/components/CategorySelector';
import { CategoryScopeSelector } from '@/app/admin/arm/components/CategoryScopeSelector';
import { IndustrySelector } from '@/app/admin/arm/components/IndustrySelector';
import { LocationSelector } from '@/app/admin/arm/components/LocationSelector';

type SettingsTab = 'general' | 'modules' | 'access' | 'payment' | 'labels' | 'economy' | 'permissions' | 'categories' | 'industries' | 'locations';

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'general', label: 'عمومی', icon: '🏠' },
    { id: 'payment', label: 'درگاه پرداخت', icon: '💳' },
    { id: 'economy', label: 'اقتصاد', icon: '💰' },
    { id: 'modules', label: 'ماژول‌ها', icon: '🧩' },
    { id: 'access', label: 'دسترسی', icon: '🔐' },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: '📂' },
   /* { id: 'industries', label: 'صنوف', icon: '🏭' },*/
    { id: 'locations', label: 'موقعیت‌ها', icon: '📍' },
    { id: 'labels', label: 'برچسب‌ها', icon: '🏷️' },
    { id: 'permissions', label: 'دسترسی های من', icon: '🛡️' },
];

export default function ArmAdminSettings() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentSlug } = useSelector((state: RootState) => state.arm);
    const { user } = useSelector((state: RootState) => state.auth);

    const isSystemAdmin = user?.role === 'system_admin';

    const tabFromUrl = (searchParams.get('tab') as SettingsTab) || 'general';
    const [activeTab, setActiveTab] = useState<SettingsTab>(tabFromUrl);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeScopeId, setActiveScopeId] = useState<string | null>(null);

    // ✅ useForm
    const { register, watch, setValue, control, formState: { errors }, reset } = useForm({
        defaultValues: settings || {},
    });

    // ✅ تغییر تب با آپدیت URL
    const handleTabChange = (tab: SettingsTab) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    useEffect(() => {
        const tab = searchParams.get('tab') as SettingsTab;
        if (tab && TABS.some(t => t.id === tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // ✅ مانیتور تغییرات فرم
    useEffect(() => {
        const subscription = watch((value, { name, type }) => {
            if (name && type === 'change') {
                setHasChanges(true);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    const fetchSettings = useCallback(async () => {
        if (!currentSlug) return;
        setLoading(true);
        try {
            const arm = await apiService.armAdmin.getArm(currentSlug);
            const cfg = arm.config || {};
            const formData = {
                id: arm.id || '',
                name: arm.name || '',
                shortName: arm.shortName || '',
                slogan: arm.slogan || '',
                description: arm.description || '',
                status: arm.status || 'active',
                colorPrimary: arm.colorPrimary || '#e65100',
                colorSecondary: arm.colorSecondary || '#bf360c',
                logoFileId: cfg.general?.logoFileId || arm.logoUrl || undefined,
                mission: arm.mission || '',
                config: cfg,
            };
            setSettings(formData);
            reset(formData);
            setHasChanges(false);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در دریافت تنظیمات');
        } finally {
            setLoading(false);
        }
    }, [currentSlug, reset]);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const handleSave = async () => {
        if (!currentSlug || !settings) return;
        setSaving(true);
        try {
            const formData = watch();
            const updateData: any = {
                name: formData.name || settings.name,
                shortName: formData.shortName || settings.shortName,
                slogan: formData.slogan || settings.slogan,
                description: formData.description || settings.description,
                mission: formData.mission || settings.mission,
                status: formData.status || settings.status,
                colorPrimary: formData.colorPrimary || settings.colorPrimary,
                colorSecondary: formData.colorSecondary || settings.colorSecondary,
                config: formData.config || settings.config,
            };
            await apiService.armAdmin.updateSettings(currentSlug, updateData);
            toast.success('تنظیمات ذخیره شد');
            setHasChanges(false);
            await fetchSettings();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ذخیره');
        } finally {
            setSaving(false);
        }
    };

    const handleSetValue = useCallback((name: any, value: any) => {
        setValue(name, value, { shouldDirty: true });
        setHasChanges(true);
    }, [setValue]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="text-center py-16">
                <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
                <h3 className="text-lg font-semibold">خطا در بارگذاری</h3>
                <button onClick={fetchSettings} className="mt-4 px-6 py-2.5 bg-primary text-on-primary rounded-lg inline-flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />تلاش مجدد
                </button>
            </div>
        );
    }

    // ✅ اضافه کردن 'modules' به لیست تب‌های دارای دکمه ذخیره
    const showSaveButton = ['general', 'modules', 'economy', 'payment', 'labels'].includes(activeTab);

    return (
        <div className="space-y-6 pb-20">
            {/* تب‌ها */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full">
                    <div
                        className="no-scrollbar"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            overflowX: 'auto',
                            WebkitOverflowScrolling: 'touch',
                        }}
                    >
                        <div className="flex items-center gap-1 bg-surface-container-low dark:bg-gray-800 rounded-xl p-1 w-max h-full">
                            {TABS.map(tab => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={cn(
                                            "flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0",
                                            isActive
                                                ? 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 shadow-sm'
                                                : 'text-on-surface-variant dark:text-gray-400 hover:text-on-surface dark:hover:text-gray-200',
                                        )}
                                    >
                                        <span>{tab.icon}</span>
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div style={{ height: '52px' }}></div>
                </div>
            </div>

            {/* محتوای تب‌ها */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-outline-variant/20 dark:border-gray-800 p-4 sm:p-6">
                {activeTab === 'general' && (
                    <GeneralSection
                        register={register}
                        errors={errors}
                        watch={watch}
                        setValue={handleSetValue}
                        armId={settings.id}
                        isSystemAdmin={isSystemAdmin}
                    />
                )}

                {activeTab === 'modules' && (
                    <div className="space-y-6">
                        <ModuleSettingsSection
                            watch={watch}
                            setValue={handleSetValue}
                            onSave={() => {}}
                            isSaving={saving}
                            moduleKey="priceTable"
                            moduleName="تابلوی قیمت"
                            isAdmin={isSystemAdmin}
                        />
                        <ModuleSettingsSection
                            watch={watch}
                            setValue={handleSetValue}
                            onSave={() => {}}
                            isSaving={saving}
                            moduleKey="buyLead"
                            moduleName="تابلوی درخواست خرید"
                            isAdmin={isSystemAdmin}
                        />
                    </div>
                )}

                {activeTab === 'access' && (
                    <AccessRulesSection
                        watch={watch}
                        setValue={handleSetValue}
                        onSave={() => {}}
                        isSaving={saving}
                        isAdmin={isSystemAdmin}
                    />
                )}

                {activeTab === 'payment' && (
                    <PaymentSection
                        register={register}
                        errors={errors}
                        watch={watch}
                        setValue={handleSetValue}
                        control={control}
                        isAdmin={isSystemAdmin}
                    />
                )}

                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <CategoryScopeSelector
                            watch={watch}
                            setValue={setValue}
                            disabled={true}
                            categorySelections={watch('config.categorySelections')}
                            onSave={() => {}}
                            activeScopeId={activeScopeId}
                            onScopeSelect={setActiveScopeId}
                            isAdmin={isSystemAdmin}
                        />
                        <CategorySelector
                            control={control}
                            watch={watch}
                            setValue={setValue}
                            disabled={true}
                            onSave={() => {}}
                            activeScopeId={activeScopeId}
                            isAdmin={isSystemAdmin}
                        />
                    </div>
                )}

                {activeTab === 'industries' && (
                    <IndustrySelector
                        register={register}
                        watch={watch}
                        setValue={setValue}
                        isAdmin={isSystemAdmin}
                    />
                )}

                {activeTab === 'locations' && (
                    <LocationSelector
                        control={control}
                        watch={watch}
                        setValue={setValue}
                        onSave={() => {}}
                    />
                )}

                {activeTab === 'labels' && (
                    <FormLabelsSection
                        watch={watch}
                        setValue={handleSetValue}
                        onSave={() => {}}
                        isSaving={saving}
                        isAdmin={isSystemAdmin}
                    />
                )}

                {activeTab === 'economy' && (
                    <EconomySection
                        watch={watch}
                        setValue={handleSetValue}
                        onSave={() => {}}
                        isSaving={saving}
                        isAdmin={isSystemAdmin}
                    />
                )}

                {activeTab === 'permissions' && (
                    <ArmPermissionSection
                        watch={watch}
                        setValue={handleSetValue}
                        isAdmin={isSystemAdmin}
                        isSaving={saving}
                    />
                )}
            </div>

            {/* دکمه ذخیره */}
            {showSaveButton && (
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={cn(
                        "fixed top-4 left-4 z-50 flex items-center gap-1 px-4 py-3 rounded text-[10px] transition-all shadow-lg",
                        hasChanges
                            ? "bg-primary text-on-primary hover:bg-primary/90 shadow-primary/30"
                            : "bg-surface-container-high dark:bg-gray-800 text-on-surface-variant dark:text-gray-400 cursor-not-allowed shadow-none",
                    )}
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
            )}

            {/* دکمه ذخیره موبایل */}
            {showSaveButton && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-outline-variant/20 dark:border-gray-800 p-4 z-40 lg:hidden">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="w-full bg-primary text-on-primary py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        ذخیره تغییرات
                    </button>
                </div>
            )}
        </div>
    );
}