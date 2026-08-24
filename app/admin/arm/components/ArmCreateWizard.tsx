// app/admin/arm/components/ArmCreateWizard.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { setArm } from '@/lib/store/slices/armSlice';
import {
    ArrowRight,
    ArrowLeft,
    Check,
    Loader2,
    Store,
    MapPin,
    Settings,
    Eye,
    TrendingUp,
    ShoppingCart,
    CreditCard,
    Palette,
    Building2,
    Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GeneralSection } from './GeneralSection';
import { CategoryScopeSelector } from './CategoryScopeSelector';
import { CategorySelector } from './CategorySelector';
import { LocationSelector } from './LocationSelector';
import { ModuleSettingsSection } from './ModuleSettingsSection';
import { AccessRulesSection } from './AccessRulesSection';
import { PaymentSection } from './PaymentSection';
import { EconomySection } from './EconomySection';
import { IndustrySelector } from './IndustrySelector';
import { FormLabelsSection } from './FormLabelsSection';
import { ArmPermissionSection } from './ArmPermissionSection';
import { IntroSection } from './IntroSection';
import { apiService } from '@/lib/api/apiService';
import {useIndustriesTree, useCategoriesFlat, useIndustriesLeaves} from '@/lib/api/apiHooks';

// ─── تعریف مراحل ───
const STEPS = [
    { id: 'intro', title: 'آشنایی', icon: Store, required: false },
    { id: 'basics', title: 'اطلاعات پایه', icon: Palette, required: true },
    { id: 'categories', title: 'دسته‌بندی', icon: Settings, required: true },
    { id: 'locations', title: 'موقعیت‌ها', icon: MapPin, required: true },
    { id: 'priceTable', title: 'تابلو قیمت', icon: TrendingUp, required: false },
    { id: 'buyLead', title: 'درخواست خرید', icon: ShoppingCart, required: false },
    { id: 'access', title: 'دسترسی', icon: Settings, required: false },
    { id: 'payment', title: 'پرداخت', icon: CreditCard, required: false },
    { id: 'economy', title: 'اقتصاد', icon: Store, required: false },
   /* { id: 'industries', title: 'صنوف', icon: Building2, required: true },*/
    { id: 'labels', title: 'برچسب‌ها', icon: Settings, required: false },
    { id: 'permissions', title: 'دسترسی مالک', icon: Settings, required: false },
    { id: 'review', title: 'بازبینی', icon: Eye, required: false },
];

export function ArmCreateWizard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch();

    const currentStepId = searchParams.get('step') || 'intro';
    const slug = searchParams.get('slug');
    const isEditMode = !!slug;

    const [submitting, setSubmitting] = useState(false);
    const [armLoaded, setArmLoaded] = useState(!isEditMode);
    const [armId, setArmId] = useState<string | null>(null);
    const [activeScopeId, setActiveScopeId] = useState<string | null>(null);
    const { data: allIndustries = [] } = useIndustriesLeaves();

    // پیش‌واکشی داده‌های سنگین
    useIndustriesTree();
    useCategoriesFlat();

    const defaultValues = {
        status: 'draft',             // همیشه draft تا تکمیل نهایی
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
    };

    const {
        register,
        control,
        watch,
        setValue,
        trigger,
        reset,
        formState: { errors },
    } = useForm({ defaultValues, mode: 'onTouched' });

    // ─── لود بازار (در صورت وجود slug) ───
    useEffect(() => {
        if (!slug || armLoaded) return;
        (async () => {
            try {
                const arm = await apiService.arm.fetchArmData(slug);
                reset({
                    name: arm.name,
                    slug: arm.slug,
                    slogan: arm.slogan,
                    description: arm.description,
                    mission: arm.mission,
                    colorPrimary: arm.colorPrimary,
                    colorSecondary: arm.colorSecondary,
                    status: arm.status,
                    visibility: arm.visibility,
                    geoScopeType: arm.geoScopeType,
                    config: arm.config,
                });
                setArmId(arm.id);
                setArmLoaded(true);
            } catch (error: any) {
                toast.error(error?.message || 'خطا در دریافت اطلاعات بازار');
                router.replace('/admin/arm/create');
            }
        })();
    }, [slug, armLoaded, reset, router]);

    const currentStepIndex = STEPS.findIndex((s) => s.id === currentStepId);

    // تغییر مرحله در URL
    const goToStep = useCallback(
        (stepId: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('step', stepId);
            if (slug) params.set('slug', slug);
            router.replace(`?${params.toString()}`, { scroll: false });
        },
        [searchParams, router, slug]
    );

    // ─── اعتبارسنجی مرحله فعلی ───
    const validateStep = (stepId: string): boolean => {
        const data = watch();
        switch (stepId) {
            case 'basics': {
                const name = data.name?.trim();
                const slugVal = data.slug?.trim();
                const sloganVal = data.slogan?.trim();
                if (!name || !slugVal || !sloganVal) {
                    toast.error('نام، شناسه و شعار بازار را وارد کنید');
                    return false;
                }
                if (!/^[a-z0-9-]+$/.test(slugVal)) {
                    toast.error('شناسه فقط حروف کوچک انگلیسی، اعداد و خط تیره باشد');
                    return false;
                }
                return true;
            }
            case 'categories': {
                const selections = data.config?.categorySelections || [];
                if (selections.length === 0) {
                    toast.error('حداقل یک گروه کالا انتخاب کنید');
                    return false;
                }
                return true;
            }
            case 'locations': {
                const locs = data.config?.locationSelections || [];
                if (locs.length === 0) {
                    toast.error('حداقل یک موقعیت جغرافیایی انتخاب کنید');
                    return false;
                }
                return true;
            }
            case 'industries': {
                const supplierIds = data.config?.supplierIndustryIds || [];
                const buyerIds = data.config?.buyerIndustryIds || [];
                if (supplierIds.length === 0 && buyerIds.length === 0) {
                    toast.error('حداقل یک صنف تأمین‌کننده یا خریدار انتخاب کنید');
                    return false;
                }
                return true;
            }
            default:
                return true;
        }
    };

    // ─── ایجاد اولیه بازار (فقط مرحله basics) ───
    const handleCreateArm = async () => {
        const data = watch();
        try {
            const payload = {
                slug: data.slug.trim(),
                name: data.name.trim(),
                slogan: data.slogan.trim(),
                description: data.description || '',
                mission: data.mission || '',
                colorPrimary: data.colorPrimary || '#610000',
                colorSecondary: data.colorSecondary || null,
                geoScopeType: data.geoScopeType,
                status: 'draft',
                visibility: data.visibility,
                config: { ...data.config, wizardStep: 'categories' },
            };
            const arm = await apiService.arm.create(payload);
            setArmId(arm.id);
            toast.success('بازار ساخته شد');
            return arm.id;
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ایجاد بازار');
            return null;
        }
    };

    // ─── ذخیره تنظیمات (برای مراحل بعد از basics) ───
    const handleUpdateConfig = async () => {
        if (!armId) return;
        const currentConfig = watch('config');

        // ساخت آرایه‌های عنوان‌دار بر اساس شناسه‌های انتخاب‌شده
        const supplierIndustries = (currentConfig.supplierIndustryIds || [])
            .map((id: string) => {
                const ind = allIndustries.find((i: any) => i.id === id);
                return ind ? { id: ind.id, title: ind.title } : null;
            })
            .filter(Boolean);

        const buyerIndustries = (currentConfig.buyerIndustryIds || [])
            .map((id: string) => {
                const ind = allIndustries.find((i: any) => i.id === id);
                return ind ? { id: ind.id, title: ind.title } : null;
            })
            .filter(Boolean);

        const updatedConfig = {
            ...currentConfig,
            wizardStep: currentStepId,
            supplierIndustries,
            buyerIndustries,
        };

        try {
            await apiService.arm.update(armId, { config: updatedConfig });
            // اگر بازار فعال است، Redux را هم به‌روز کن تا صفحه ثبت‌نام فوراً ببیند
            if (watch('status') === 'active' && slug) {
                const freshArm = await apiService.arm.fetchArmData(slug);
                dispatch(setArm({ arm: freshArm, slug }));
            }
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ذخیره تنظیمات');
        }
    };

    // ─── حرکت به مرحله بعد ───
    const handleNext = async () => {
        const currentStep = STEPS[currentStepIndex];

        // مرحله intro بدون اعتبارسنجی
        if (currentStep.id === 'intro') {
            goToStep('basics');
            return;
        }

        // اعتبارسنجی مرحله فعلی
        if (currentStep.required && !validateStep(currentStep.id)) {
            return;
        }

        // اگر در مرحله basics هستیم و هنوز armId نداریم، بازار را بساز
        if (currentStep.id === 'basics' && !armId) {
            const newArmId = await handleCreateArm();
            if (!newArmId) return;
            // حالا slug را در URL قرار بده
            const params = new URLSearchParams(searchParams.toString());
            params.set('slug', watch('slug'));
            params.set('step', 'categories');
            router.replace(`?${params.toString()}`, { scroll: false });
            return;
        }

        // برای مراحل بعد از basics، تنظیمات را ذخیره کن
        if (armId && currentStep.id !== 'basics') {
            await handleUpdateConfig();
        }

        if (currentStepIndex < STEPS.length - 1) {
            goToStep(STEPS[currentStepIndex + 1].id);
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            goToStep(STEPS[currentStepIndex - 1].id);
        }
    };

    // ─── فعال‌سازی نهایی (مرحله review) ───
    const handleActivate = async () => {
        if (!armId) return;
        try {
            await apiService.arm.update(armId, { status: 'active' });
            // حالا بازار فعال شده، ریداکس را به‌روز کن
            if (slug) {
                const freshArm = await apiService.arm.fetchArmData(slug);
                dispatch(setArm({ arm: freshArm, slug }));
            }
            toast.success('بازار فعال شد');
            router.push('/admin/arm');
        } catch (error: any) {
            toast.error(error?.message || 'خطا در فعال‌سازی');
        }
    };

    // ─── محتوای هر مرحله ───
    const renderStepContent = () => {
        switch (currentStepId) {
            case 'intro':
                return <IntroSection />;
            case 'basics':
                return (
                    <GeneralSection
                        register={register}
                        errors={errors}
                        watch={watch}
                        setValue={setValue}
                        isSystemAdmin={true}
                    />
                );
            case 'categories':
                return (
                    <div className="space-y-8">
                        <CategoryScopeSelector
                            watch={watch}
                            setValue={setValue}
                            categorySelections={watch('config.categorySelections')}
                            onSave={() => {}}
                            activeScopeId={activeScopeId}
                            onScopeSelect={setActiveScopeId}
                            armSlug={slug}
                            isAdmin={true}
                            canAddScope={true}
                            canRemoveScope={true}
                        />
                        <CategorySelector
                            control={control}
                            watch={watch}
                            setValue={setValue}
                            onSave={() => {}}
                            activeScopeId={activeScopeId}
                            armSlug={slug}
                            isAdmin={true}
                            canAddLeaf={true}
                            canRemoveLeaf={true}
                            canChangeUnit={true}
                        />
                    </div>
                );
            case 'locations':
                return (
                    <LocationSelector
                        control={control}
                        watch={watch}
                        setValue={setValue}
                        onSave={() => {}}
                        isSaving={false}
                        isAdmin={true}
                    />
                );
            case 'priceTable':
                return (
                    <ModuleSettingsSection
                        watch={watch}
                        setValue={setValue}
                        onSave={() => {}}
                        isSaving={false}
                        moduleKey="priceTable"
                        moduleName="تابلوی قیمت"
                        moduleIcon={TrendingUp}
                        isAdmin={true}
                    />
                );
            case 'buyLead':
                return (
                    <ModuleSettingsSection
                        watch={watch}
                        setValue={setValue}
                        onSave={() => {}}
                        isSaving={false}
                        moduleKey="buyLead"
                        moduleName="تابلوی درخواست خرید"
                        moduleIcon={ShoppingCart}
                        isAdmin={true}
                    />
                );
            case 'access':
                return (
                    <AccessRulesSection
                        watch={watch}
                        setValue={setValue}
                        onSave={() => {}}
                        isSaving={false}
                        isAdmin={true}
                    />
                );
            case 'payment':
                return (
                    <PaymentSection
                        register={register}
                        errors={errors}
                        watch={watch}
                        setValue={setValue}
                        control={control}
                        isAdmin={true}
                    />
                );
            case 'economy':
                return (
                    <EconomySection
                        watch={watch}
                        setValue={setValue}
                        onSave={() => {}}
                        isSaving={false}
                        isAdmin={true}
                    />
                );
            case 'industries':
                return (
                    <IndustrySelector
                        watch={watch}
                        setValue={setValue}
                        onSave={() => {}}
                        isSaving={false}
                        isAdmin={true}
                    />
                );
            case 'labels':
                return (
                    <FormLabelsSection
                        watch={watch}
                        setValue={setValue}
                        onSave={() => {}}
                        isSaving={false}
                        isAdmin={true}
                    />
                );
            case 'permissions':
                return (
                    <ArmPermissionSection
                        watch={watch}
                        setValue={setValue}
                        isAdmin={true}
                        isSaving={false}
                        onSave={() => {}}
                    />
                );
            case 'review':
                return (
                    <div className="space-y-6 text-right">
                        <h3 className="text-lg font-bold">خلاصه اطلاعات بازار</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-on-surface-variant">نام:</span>
                            <span className="font-medium">{watch('name')}</span>
                            <span className="text-on-surface-variant">شناسه:</span>
                            <span className="font-mono text-xs">{watch('slug')}</span>
                            <span className="text-on-surface-variant">شعار:</span>
                            <span>{watch('slogan')}</span>
                            <span className="text-on-surface-variant">دسته‌بندی‌ها:</span>
                            <span>{watch('config.categorySelections')?.length || 0} عدد</span>
                            <span className="text-on-surface-variant">موقعیت‌ها:</span>
                            <span>{watch('config.locationSelections')?.length || 0} شهر</span>
                        </div>
                        <button
                            onClick={handleActivate}
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
                        >
                            تکمیل و فعال‌سازی بازار
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    if (isEditMode && !armLoaded) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            {/* هدر */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-on-surface dark:text-gray-100">
                        {isEditMode ? 'ویرایش بازار' : 'ایجاد بازار جدید'}
                    </h1>
                    <p className="text-xs text-on-surface-variant/60 dark:text-gray-500 mt-1">
                        {isEditMode && slug ? `شناسه: ${slug}` : ''}
                    </p>
                </div>
                <button
                    onClick={() => router.push('/admin/arm')}
                    className="text-xs text-on-surface-variant dark:text-gray-400 hover:text-on-surface"
                >
                    انصراف
                </button>
            </div>

            {/* نوار پیشرفت */}
            <div className="relative">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, idx) => {
                        const isCompleted = idx < currentStepIndex;
                        const isActive = idx === currentStepIndex;
                        const isDisabled = idx > currentStepIndex;
                        const StepIcon = step.icon;

                        return (
                            <React.Fragment key={step.id}>
                                {/* دکمه مرحله */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (idx <= currentStepIndex) goToStep(step.id);
                                    }}
                                    disabled={isDisabled}
                                    className={cn(
                                        'relative z-10 flex flex-col items-center gap-1 transition-all',
                                        isDisabled && 'opacity-40 cursor-not-allowed',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                                            isCompleted
                                                ? 'bg-emerald-500 text-white shadow-md'
                                                : isActive
                                                    ? 'bg-primary text-white shadow-lg scale-110'
                                                    : 'bg-surface-container-low dark:bg-gray-800 text-on-surface-variant/50 dark:text-gray-600',
                                        )}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <StepIcon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span
                                        className={cn(
                                            'text-[11px] font-medium hidden sm:block',
                                            isActive
                                                ? 'text-primary dark:text-primary-400'
                                                : isCompleted
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-on-surface-variant/50 dark:text-gray-600',
                                        )}
                                    >
                    {step.title}
                  </span>
                                </button>

                                {/* خط اتصال (به جز آخرین آیتم) */}
                                {idx < STEPS.length - 1 && (
                                    <div className="flex-1 mx-1">
                                        <div
                                            className={cn(
                                                'h-1 rounded-full transition-all duration-300',
                                                idx < currentStepIndex
                                                    ? 'bg-emerald-500'
                                                    : idx === currentStepIndex
                                                        ? 'bg-gradient-to-r from-emerald-500 to-gray-300 dark:to-gray-700'
                                                        : 'bg-gray-300 dark:bg-gray-700',
                                            )}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* محتوای مرحله */}
            <div className="bg-white dark:bg-gray-900 border border-outline-variant/20 dark:border-gray-800 rounded-2xl p-5 md:p-6">
                <div className="min-h-[400px]">{renderStepContent()}</div>
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-outline-variant/20 dark:border-gray-800">
                    <button
                        onClick={handleBack}
                        disabled={currentStepIndex === 0}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
                            currentStepIndex === 0
                                ? 'text-on-surface-variant/30 cursor-not-allowed'
                                : 'text-on-surface-variant hover:bg-surface-container-low',
                        )}
                    >
                        <ArrowRight className="w-4 h-4" />
                        مرحله قبل
                    </button>

                    {currentStepIndex < STEPS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90"
                        >
                            مرحله بعد
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    ) : (
                        <div /> // در مرحله آخر دکمه ای نیست (فعال‌سازی در خود مرحله review است)
                    )}
                </div>
            </div>
        </div>
    );
}