// app/admin/arm/components/ArmForm.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useForm, FormProvider } from 'react-hook-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, TrendingUp, ShoppingCart } from 'lucide-react';

import { GeneralSection } from './GeneralSection';
import { PaymentSection } from './PaymentSection';
import { CategoryScopeSelector } from './CategoryScopeSelector';
import { LocationSelector } from './LocationSelector';
import { IndustrySelector } from './IndustrySelector';
import { AccessRulesSection } from './AccessRulesSection';
import { ModuleSettingsSection } from './ModuleSettingsSection';
import { FormLabelsSection } from './FormLabelsSection';
import { EconomySection } from './EconomySection';
import { ArmPermissionSection } from './ArmPermissionSection';
import { useIndustriesLeaves } from '@/lib/api/apiHooks';
import {ArmCategoryManager} from "@/app/admin/arm/components/ArmCategoryManager";


interface ArmFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
    isSubmitting?: boolean;
    isEditMode?: boolean;
}

export function ArmForm({ initialData, onSubmit, isSubmitting = false, isEditMode = false }: ArmFormProps) {
    const { user } = useSelector((state: RootState) => state.auth);
    const isSystemAdmin = user?.role === 'system_admin';
    const searchParams = useSearchParams();
    const router = useRouter();

    const tabFromUrl = (searchParams.get('tab') || 'general') as string;
    const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const { data: allIndustries = [] } = useIndustriesLeaves();

    // ✅ اصلاح defaultValues - خواندن از هر دو محل ممکن
    const getInitialValues = useCallback(() => {
        if (initialData) {
            return {
                ...initialData,
                // ✅ categoryTree از سطح بالا یا config
                categoryTree: initialData.categoryTree || initialData.config?.categoryTree || [],
                // ✅ allowedCategoryScopeTree از سطح بالا یا config
                allowedCategoryScopeTree: initialData.allowedCategoryScopeTree ||
                    initialData.config?.allowedCategoryScopeTree || [],
            };
        }

        return {
            status: 'draft',
            visibility: 'public',
            geoScopeType: 'multi_city',
            featuresEnabled: [],
            rankingAlgorithm: 'simple',
            categoryTree: [],
            allowedCategoryScopeTree: [],
            config: {
                general: {},
                payment: {
                    paymentMode: 'both',
                    defaultGateway: 'pec',
                    gateways: [],
                    manual: { enabled: false },
                    settlementAccount: { type: 'bank_card' },
                },
                modules: {
                    priceTable: {
                        enabled: true,
                        requireLoginToViewPrices: true,
                        requireMembershipToViewPrices: false,
                        requireMembershipToCall: true,
                        allowAnonymousPublishing: true,
                        autoApproveAds: true,
                        maxTotalFreeAdPerUser: 5,
                        adValidityDefaultHours: 7,
                        maxActiveAdsPerUser: 10,
                        bumpCost: 10,
                    },
                    buyLead: {
                        enabled: true,
                        requireMembershipToView: false,
                        requireMembershipToSubmit: true,
                        maxActiveRequestsPerUser: 5,
                    },
                },
                accessRules: {
                    restrictMembershipByIndustry: false,
                    allowManualRoleSelection: true,
                    requireAdminApprovalForMembership: false,
                    requirePhoneVerification: false,
                    requireBusinessVerification: false,
                    restrictMembershipByLocation: false,
                },
                locationSelections: [],
                supplierIndustryIds: [],
                buyerIndustryIds: [],
                localization: { timezone: 'Asia/Tehran', locale: 'fa' },
                integrations: {},
                custom: {},
                allowedCategoryScope: [],
                formLabels: {},
            },
        };
    }, [initialData]);

    const methods = useForm<any>({
        defaultValues: getInitialValues(),
    });

    const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors }, reset } = methods;

    // ✅ ریست فرم وقتی initialData تغییر می‌کند
    useEffect(() => {
        if (initialData) {
            reset(getInitialValues());
        }
    }, [initialData, reset, getInitialValues]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    // ✅ اصلاح handleAutoSave
    const handleAutoSave = useCallback(() => {
        if (!isSubmitting && !isAutoSaving) {
            setIsAutoSaving(true);

            const data = getValues();

            // ✅ مطمئن شوید فیلدها وجود دارند
            const submitData = {
                ...data,
                categoryTree: data.categoryTree || [],
                allowedCategoryScopeTree: data.allowedCategoryScopeTree || [],
            };

            // ✅ پردازش صنوف
            if (submitData.config) {
                const config = { ...submitData.config };
                const supplierIds: string[] = config.supplierIndustryIds || [];
                const buyerIds: string[] = config.buyerIndustryIds || [];
                config.supplierIndustries = allIndustries
                    .filter((ind: any) => supplierIds.includes(ind.id))
                    .map(({ id, title }: any) => ({ id, title }));
                config.buyerIndustries = allIndustries
                    .filter((ind: any) => buyerIds.includes(ind.id))
                    .map(({ id, title }: any) => ({ id, title }));
                submitData.config = config;
            }

            onSubmit(submitData);
            setTimeout(() => setIsAutoSaving(false), 500);
        }
    }, [isSubmitting, isAutoSaving, getValues, onSubmit, allIndustries]);

    // ✅ اصلاح watch subscription
    useEffect(() => {
        const subscription = watch((formValues, { name, type }) => {
            // ✅ فقط برای فیلدهایی که تغییر کرده‌اند
            if (name && type === 'change') {
                const timer = setTimeout(() => handleAutoSave(), 500);
                return () => clearTimeout(timer);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, handleAutoSave]);

    const tabs = [
        { id: 'general', label: 'عمومی', icon: '🏠' },
        { id: 'modules', label: 'ماژول‌ها', icon: '🧩' },
        { id: 'access', label: 'دسترسی', icon: '🔐' },
        { id: 'economy', label: 'اقتصاد', icon: '💰' },
        { id: 'payment', label: 'درگاه پرداخت', icon: '💳' },
        { id: 'categories', label: 'دسته‌بندی‌ها', icon: '📂' },
        { id: 'locations', label: 'موقعیت‌ها', icon: '📍' },
        { id: 'labels', label: 'برچسب‌ها', icon: '🏷️' },
        { id: 'permissions', label: 'دسترسی مالک', icon: '🛡️' },
    ];

    return (
        <FormProvider {...methods}>
            <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                {/* تب‌ها */}
                <div className="flex flex-wrap gap-1 border-b border-outline-variant pb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabChange(tab.id)}
                            className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg flex items-center gap-1.5 ${
                                activeTab === tab.id
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {/* تب‌ها - بدون پاس دادن watch و setValue */}
                    {activeTab === 'general' && (
                        <GeneralSection
                            register={register}
                            armId={initialData?.id}
                            errors={errors}
                            watch={watch}
                            setValue={setValue}
                            isSystemAdmin={isSystemAdmin}
                        />
                    )}

                    {activeTab === 'modules' && (
                        <div className="space-y-6">
                            <ModuleSettingsSection
                                watch={watch}
                                setValue={setValue}
                                onSave={handleAutoSave}
                                isSaving={isSubmitting || isAutoSaving}
                                moduleKey="priceTable"
                                moduleName="تابلوی قیمت"
                                moduleIcon={TrendingUp}
                                isAdmin={isSystemAdmin}
                            />
                            <ModuleSettingsSection
                                watch={watch}
                                setValue={setValue}
                                onSave={handleAutoSave}
                                isSaving={isSubmitting || isAutoSaving}
                                moduleKey="buyLead"
                                moduleName="تابلوی درخواست خرید"
                                moduleIcon={ShoppingCart}
                                isAdmin={isSystemAdmin}
                            />
                        </div>
                    )}

                    {activeTab === 'access' && (
                        <AccessRulesSection
                            watch={watch}
                            setValue={setValue}
                            onSave={handleAutoSave}
                            isSaving={isSubmitting || isAutoSaving}
                            isAdmin={isSystemAdmin}
                        />
                    )}

                    {activeTab === 'payment' && (
                        <PaymentSection
                            register={register}
                            errors={errors}
                            watch={watch}
                            setValue={setValue}
                            control={control}
                            isAdmin={isSystemAdmin}
                        />
                    )}

                    {/* ✅ دسته‌بندی‌ها - بدون پاس دادن watch و setValue */}
                    {activeTab === 'categories' && (
                        <ArmCategoryManager
                            onSave={handleAutoSave}
                            isAdmin={isSystemAdmin}
                        />
                    )}

                    {activeTab === 'locations' && (
                        <LocationSelector
                            control={control}
                            watch={watch}
                            setValue={setValue}
                            onSave={handleAutoSave}
                            isSaving={isSubmitting || isAutoSaving}
                            isAdmin={isSystemAdmin}
                        />
                    )}

                    {activeTab === 'labels' && (
                        <FormLabelsSection
                            watch={watch}
                            setValue={setValue}
                            onSave={handleAutoSave}
                            isSaving={isSubmitting || isAutoSaving}
                            isAdmin={isSystemAdmin}
                        />
                    )}

                    {activeTab === 'economy' && (
                        <EconomySection
                            watch={watch}
                            setValue={setValue}
                            onSave={handleAutoSave}
                            isSaving={isSubmitting || isAutoSaving}
                            isAdmin={isSystemAdmin}
                        />
                    )}

                    {activeTab === 'permissions' && (
                        <ArmPermissionSection
                            watch={watch}
                            setValue={setValue}
                            isAdmin={isSystemAdmin}
                            isSaving={isSubmitting || isAutoSaving}
                            onSave={handleAutoSave}
                        />
                    )}
                </div>
            </form>
        </FormProvider>
    );
}