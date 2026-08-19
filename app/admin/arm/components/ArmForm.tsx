// app/admin/arm/components/ArmForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useForm } from 'react-hook-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, TrendingUp, ShoppingCart } from 'lucide-react';

import { GeneralSection } from './GeneralSection';
import { PaymentSection } from './PaymentSection';
import { CategoryScopeSelector } from './CategoryScopeSelector';
import { CategorySelector } from './CategorySelector';
import { LocationSelector } from './LocationSelector';
import { IndustrySelector } from './IndustrySelector';
import { AccessRulesSection } from './AccessRulesSection';
import { ModuleSettingsSection } from './ModuleSettingsSection';
import { FormLabelsSection } from './FormLabelsSection';
import { EconomySection } from './EconomySection';
import { ArmPermissionSection } from './ArmPermissionSection';
import { useIndustriesLeaves } from '@/lib/api/apiHooks';
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
    const [activeScopeId, setActiveScopeId] = useState<string | null>(null);
    const { data: allIndustries = [] } = useIndustriesLeaves();

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
        defaultValues: initialData || {
            status: 'draft',
            visibility: 'public',
            geoScopeType: 'multi_city',
            featuresEnabled: [],
            rankingAlgorithm: 'simple',
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
                categorySelections: [],
                locationSelections: [],
                supplierIndustryIds: [],
                buyerIndustryIds: [],
                localization: { timezone: 'Asia/Tehran', locale: 'fa' },
                integrations: {},
                custom: {},
                allowedCategoryScope: [],
                formLabels: {},
            },
        },
    });

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const handleAutoSave = () => {
        if (!isSubmitting && !isAutoSaving) {
            setIsAutoSaving(true);
            handleSubmit((data) => {
                // غنی‌سازی data.config با supplierIndustries و buyerIndustries
                if (data.config) {
                    const config = data.config;
                    const supplierIds: string[] = config.supplierIndustryIds || [];
                    const buyerIds: string[] = config.buyerIndustryIds || [];
                    config.supplierIndustries = allIndustries
                        .filter((ind: any) => supplierIds.includes(ind.id))
                        .map(({ id, title }: any) => ({ id, title }));
                    config.buyerIndustries = allIndustries
                        .filter((ind: any) => buyerIds.includes(ind.id))
                        .map(({ id, title }: any) => ({ id, title }));
                }
                onSubmit(data);
                setTimeout(() => setIsAutoSaving(false), 500);
            })();
        }
    };

    useEffect(() => {
        const subscription = watch(() => {
            const timer = setTimeout(() => handleAutoSave(), 500);
            return () => clearTimeout(timer);
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    const tabs = [
        { id: 'general', label: 'عمومی', icon: '🏠' },
        { id: 'modules', label: 'ماژول‌ها', icon: '🧩' },
        { id: 'access', label: 'دسترسی', icon: '🔐' },
        { id: 'economy', label: 'اقتصاد', icon: '💰' },
        { id: 'payment', label: 'درگاه پرداخت', icon: '💳' },
        { id: 'categories', label: 'دسته‌بندی‌ها', icon: '📂' },
        { id: 'locations', label: 'موقعیت‌ها', icon: '📍' },
     /*   { id: 'industries', label: 'صنوف', icon: '🏭' },*/
        { id: 'labels', label: 'برچسب‌ها', icon: '🏷️' },
        { id: 'permissions', label: 'دسترسی مالک', icon: '🛡️' },
    ];

    return (
        <form className="space-y-6" onSubmit={e => e.preventDefault()}>
            {/*<div className="flex justify-end items-center gap-4">
                {isSubmitting || isAutoSaving ? (
                    <div className="fixed top-4 left-16 right-0 z-50 text-[11px] flex items-center gap-2  text-on-surface-variant">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        در حال ذخیره...
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-success">
                        <Check className="w-4 h-4" />
                        ذخیره شد
                    </div>
                )}
            </div>*/}

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
                {/* ==================== عمومی ==================== */}
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

                {/* ==================== ماژول‌ها ==================== */}
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

                {/* ==================== قوانین دسترسی ==================== */}
                {activeTab === 'access' && (
                    <AccessRulesSection
                        watch={watch}
                        setValue={setValue}
                        onSave={handleAutoSave}
                        isSaving={isSubmitting || isAutoSaving}
                        isAdmin={isSystemAdmin}
                    />
                )}

                {/* ==================== پرداخت ==================== */}
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

                {/* ==================== دسته‌بندی‌ها ==================== */}
                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <CategoryScopeSelector
                            watch={watch}
                            setValue={setValue}
                            disabled={isEditMode && !isSystemAdmin}
                            categorySelections={watch('config.categorySelections')}
                            onSave={handleAutoSave}
                            activeScopeId={activeScopeId}
                            onScopeSelect={setActiveScopeId}
                            isAdmin={isSystemAdmin}
                            canAddScope={true}
                            canRemoveScope={true}
                        />
                        <CategorySelector
                            control={control}
                            watch={watch}
                            setValue={setValue}
                            disabled={isEditMode && !isSystemAdmin}
                            onSave={handleAutoSave}
                            activeScopeId={activeScopeId}
                            isAdmin={isSystemAdmin}
                            canAddLeaf={true}
                            canRemoveLeaf={true}
                            canChangeUnit={true}
                        />
                    </div>
                )}

                {/* ==================== موقعیت‌ها ==================== */}
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

                {/* ==================== صنوف ==================== */}
                {activeTab === 'industries' && (
                    <IndustrySelector
                        watch={watch}
                        setValue={setValue}
                        onSave={handleAutoSave}
                        isSaving={isSubmitting || isAutoSaving}
                    />
                )}

                {/* ==================== برچسب‌ها ==================== */}
                {activeTab === 'labels' && (
                    <FormLabelsSection
                        watch={watch}
                        setValue={setValue}
                        onSave={handleAutoSave}
                        isSaving={isSubmitting || isAutoSaving}
                        isAdmin={isSystemAdmin}
                    />
                )}

                {/* ==================== اقتصاد ==================== */}
                {activeTab === 'economy' && (
                    <EconomySection
                        watch={watch}
                        setValue={setValue}
                        onSave={handleAutoSave}
                        isSaving={isSubmitting || isAutoSaving}
                        isAdmin={isSystemAdmin}
                    />
                )}

                {/* ==================== دسترسی مالک ==================== */}
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
    );
}

const Check = ({ className }: { className?: string }) => (
    <svg
        className={className}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);