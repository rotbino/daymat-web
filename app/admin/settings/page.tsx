// app/admin/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { toast } from 'sonner';
import { Save, Loader2, CreditCard, Shield, Globe, Palette } from 'lucide-react';
import {
    useCreditSettings,
    useUpdateCreditSettings,
    useGeneralSettings,
    useUpdateGeneralSettings,
    useSecuritySettings,
    useUpdateSecuritySettings,
    useAppearanceSettings,
    useUpdateAppearanceSettings,
} from '@/lib/api/apiHooks';

type SettingsTab = 'credit' | 'general' | 'security' | 'appearance';

// ============================================================
// ✅ تایپ‌ها
// ============================================================
interface CreditSettings {
    signupBonus: number;
    armJoinBonus: number;
    bumpCost: number;
    maxTotalFreeAdPerUser: number;
    dailyCallLimit: number;
}

interface GeneralSettings {
    appName: string;
    defaultLocale: string;
    supportPhone: string;
    supportEmail: string;
}

interface SecuritySettings {
    maxLoginAttempts: number;
    sessionTimeout: number;
    requireEmailVerification: boolean;
}

interface AppearanceSettings {
    defaultTheme: 'light' | 'dark' | 'system';
    defaultFont: string;
    primaryColor: string;
}

export default function AdminSettingsPage() {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);

    // ============================================================
    // ✅ هوک‌های React Query
    // ============================================================
    const { data: creditData, isLoading: creditLoading } = useCreditSettings();
    const { data: generalData, isLoading: generalLoading } = useGeneralSettings();
    const { data: securityData, isLoading: securityLoading } = useSecuritySettings();
    const { data: appearanceData, isLoading: appearanceLoading } = useAppearanceSettings();

    const updateCredit = useUpdateCreditSettings();
    const updateGeneral = useUpdateGeneralSettings();
    const updateSecurity = useUpdateSecuritySettings();
    const updateAppearance = useUpdateAppearanceSettings();

    // ============================================================
    // ✅ State
    // ============================================================
    const [activeTab, setActiveTab] = useState<SettingsTab>('credit');

    const [creditSettings, setCreditSettings] = useState<CreditSettings>({
        signupBonus: 50,
        armJoinBonus: 10,
        bumpCost: 10,
        maxTotalFreeAdPerUser: 5,
        dailyCallLimit: 20,
    });

    const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
        appName: 'Daymat',
        defaultLocale: 'fa',
        supportPhone: '09123456789',
        supportEmail: 'support@daymat.com',
    });

    const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
        maxLoginAttempts: 5,
        sessionTimeout: 3600,
        requireEmailVerification: false,
    });

    const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
        defaultTheme: 'light',
        defaultFont: 'Vazirmatn',
        primaryColor: '#610000',
    });

    const isLoading = creditLoading || generalLoading || securityLoading || appearanceLoading;

    // ============================================================
    // ✅ پر کردن دیتا از API
    // ============================================================
    useEffect(() => {
        if (creditData) {
            setCreditSettings(creditData);
        }
    }, [creditData]);

    useEffect(() => {
        if (generalData) {
            setGeneralSettings(generalData);
        }
    }, [generalData]);

    useEffect(() => {
        if (securityData) {
            setSecuritySettings(securityData);
        }
    }, [securityData]);

    useEffect(() => {
        if (appearanceData) {
            setAppearanceSettings(appearanceData);
        }
    }, [appearanceData]);

    // ============================================================
    // ✅ ذخیره تنظیمات
    // ============================================================
    const handleSave = async () => {
        try {
            await Promise.all([
                updateCredit.mutateAsync(creditSettings),
                updateGeneral.mutateAsync(generalSettings),
                updateSecurity.mutateAsync(securitySettings),
                updateAppearance.mutateAsync(appearanceSettings),
            ]);
        } catch (error) {
            // خطاها در هوک‌ها مدیریت می‌شوند
        }
    };

    // ============================================================
    // ✅ رندر تب‌ها
    // ============================================================
    const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'credit', label: 'اعتبار', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'general', label: 'عمومی', icon: <Globe className="w-4 h-4" /> },
        { id: 'security', label: 'امنیت', icon: <Shield className="w-4 h-4" /> },
        { id: 'appearance', label: 'ظاهر', icon: <Palette className="w-4 h-4" /> },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'credit':
                return renderCreditTab();
            case 'general':
                return renderGeneralTab();
            case 'security':
                return renderSecurityTab();
            case 'appearance':
                return renderAppearanceTab();
            default:
                return null;
        }
    };

    // ============================================================
    // ✅ تب اعتبار
    // ============================================================
    const renderCreditTab = () => (
        <div className="space-y-6">
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-on-surface mb-1">تنظیمات اعتبار</h3>
                <p className="text-xs text-on-surface-variant mb-4">مقادیر پیش‌فرض اعتبار برای کل سیستم</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            اعتبار هدیه ثبت‌نام
                        </label>
                        <input
                            type="number"
                            value={creditSettings.signupBonus}
                            onChange={(e) => setCreditSettings({
                                ...creditSettings,
                                signupBonus: parseInt(e.target.value) || 0
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                        <p className="text-[10px] text-on-surface-variant/60 mt-1">اعتباری که به هر کاربر جدید تعلق می‌گیرد</p>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            هزینه نردبان
                        </label>
                        <input
                            type="number"
                            value={creditSettings.bumpCost}
                            onChange={(e) => setCreditSettings({
                                ...creditSettings,
                                bumpCost: parseInt(e.target.value) || 0
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                        <p className="text-[10px] text-on-surface-variant/60 mt-1">هزینه هر بار نردبان کردن آگهی</p>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            سهمیه آگهی رایگان در ماه
                        </label>
                        <input
                            type="number"
                            value={creditSettings.maxTotalFreeAdPerUser}
                            onChange={(e) => setCreditSettings({
                                ...creditSettings,
                                maxTotalFreeAdPerUser: parseInt(e.target.value) || 0
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                        <p className="text-[10px] text-on-surface-variant/60 mt-1">حداکثر آگهی رایگان در هر ماه</p>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            محدودیت تماس روزانه
                        </label>
                        <input
                            type="number"
                            value={creditSettings.dailyCallLimit}
                            onChange={(e) => setCreditSettings({
                                ...creditSettings,
                                dailyCallLimit: parseInt(e.target.value) || 0
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                        <p className="text-[10px] text-on-surface-variant/60 mt-1">حداکثر تماس با فروشنده در روز</p>
                    </div>
                </div>

                {updateCredit.isPending && (
                    <div className="mt-4 flex items-center gap-2 text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">در حال ذخیره...</span>
                    </div>
                )}
            </div>
        </div>
    );

    // ============================================================
    // ✅ تب عمومی
    // ============================================================
    const renderGeneralTab = () => (
        <div className="space-y-6">
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-on-surface mb-1">تنظیمات عمومی</h3>
                <p className="text-xs text-on-surface-variant mb-4">تنظیمات کلی سیستم</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            نام برنامه
                        </label>
                        <input
                            type="text"
                            value={generalSettings.appName}
                            onChange={(e) => setGeneralSettings({
                                ...generalSettings,
                                appName: e.target.value
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            زبان پیش‌فرض
                        </label>
                        <select
                            value={generalSettings.defaultLocale}
                            onChange={(e) => setGeneralSettings({
                                ...generalSettings,
                                defaultLocale: e.target.value
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        >
                            <option value="fa">فارسی</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            شماره پشتیبانی
                        </label>
                        <input
                            type="text"
                            value={generalSettings.supportPhone}
                            onChange={(e) => setGeneralSettings({
                                ...generalSettings,
                                supportPhone: e.target.value
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            ایمیل پشتیبانی
                        </label>
                        <input
                            type="email"
                            value={generalSettings.supportEmail}
                            onChange={(e) => setGeneralSettings({
                                ...generalSettings,
                                supportEmail: e.target.value
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>

                {updateGeneral.isPending && (
                    <div className="mt-4 flex items-center gap-2 text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">در حال ذخیره...</span>
                    </div>
                )}
            </div>
        </div>
    );

    // ============================================================
    // ✅ تب امنیت
    // ============================================================
    const renderSecurityTab = () => (
        <div className="space-y-6">
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-on-surface mb-1">تنظیمات امنیتی</h3>
                <p className="text-xs text-on-surface-variant mb-4">تنظیمات امنیتی سیستم</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            حداکثر تلاش برای ورود
                        </label>
                        <input
                            type="number"
                            value={securitySettings.maxLoginAttempts}
                            onChange={(e) => setSecuritySettings({
                                ...securitySettings,
                                maxLoginAttempts: parseInt(e.target.value) || 0
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            مدت زمان نشست (ثانیه)
                        </label>
                        <input
                            type="number"
                            value={securitySettings.sessionTimeout}
                            onChange={(e) => setSecuritySettings({
                                ...securitySettings,
                                sessionTimeout: parseInt(e.target.value) || 0
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={securitySettings.requireEmailVerification}
                                onChange={(e) => setSecuritySettings({
                                    ...securitySettings,
                                    requireEmailVerification: e.target.checked
                                })}
                                className="w-4 h-4 border-outline text-primary focus:ring-0 rounded"
                            />
                            <span className="text-sm text-on-surface">نیاز به تأیید ایمیل برای ثبت‌نام</span>
                        </label>
                    </div>
                </div>

                {updateSecurity.isPending && (
                    <div className="mt-4 flex items-center gap-2 text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">در حال ذخیره...</span>
                    </div>
                )}
            </div>
        </div>
    );

    // ============================================================
    // ✅ تب ظاهر
    // ============================================================
    const renderAppearanceTab = () => (
        <div className="space-y-6">
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-on-surface mb-1">تنظیمات ظاهری</h3>
                <p className="text-xs text-on-surface-variant mb-4">تنظیمات ظاهر سیستم</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            تم پیش‌فرض
                        </label>
                        <select
                            value={appearanceSettings.defaultTheme}
                            onChange={(e) => setAppearanceSettings({
                                ...appearanceSettings,
                                defaultTheme: e.target.value as 'light' | 'dark' | 'system'
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        >
                            <option value="light">روشن</option>
                            <option value="dark">تاریک</option>
                            <option value="system">سیستم</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            فونت پیش‌فرض
                        </label>
                        <select
                            value={appearanceSettings.defaultFont}
                            onChange={(e) => setAppearanceSettings({
                                ...appearanceSettings,
                                defaultFont: e.target.value
                            })}
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        >
                            <option value="Vazirmatn">وزیرمتن</option>
                            <option value="IranSans">ایران‌سنس</option>
                            <option value="Yekan">یکان</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-xs font-medium text-on-surface-variant block mb-1">
                            رنگ اصلی
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={appearanceSettings.primaryColor}
                                onChange={(e) => setAppearanceSettings({
                                    ...appearanceSettings,
                                    primaryColor: e.target.value
                                })}
                                className="w-12 h-10 border border-outline rounded-lg cursor-pointer"
                            />
                            <input
                                type="text"
                                value={appearanceSettings.primaryColor}
                                onChange={(e) => setAppearanceSettings({
                                    ...appearanceSettings,
                                    primaryColor: e.target.value
                                })}
                                className="flex-1 bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all font-mono"
                            />
                        </div>
                    </div>
                </div>

                {updateAppearance.isPending && (
                    <div className="mt-4 flex items-center gap-2 text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">در حال ذخیره...</span>
                    </div>
                )}
            </div>
        </div>
    );

    // ============================================================
    // ✅ بارگذاری
    // ============================================================
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    <p className="mt-4 text-on-surface-variant">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    const isAnySaving = updateCredit.isPending || updateGeneral.isPending || updateSecurity.isPending || updateAppearance.isPending;

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            {/* هدر */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">تنظیمات سیستم</h1>
                    <p className="text-sm text-on-surface-variant">مدیریت تنظیمات کل سیستم</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isAnySaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium disabled:opacity-50"
                >
                    {isAnySaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    ذخیره تنظیمات
                </button>
            </div>

            {/* تب‌ها */}
            <div className="flex gap-2 border-b border-outline-variant mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 whitespace-nowrap
                            ${activeTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* محتوای تب */}
            <div className="mt-6">
                {renderTabContent()}
            </div>

            {/* دکمه ذخیره در پایین */}
            <div className="mt-8 pt-4 border-t border-outline-variant flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isAnySaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium disabled:opacity-50"
                >
                    {isAnySaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    ذخیره تنظیمات
                </button>
            </div>
        </div>
    );
}