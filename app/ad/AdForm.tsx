// app/ad/AdForm.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    useCreateAd, useActiveBusiness, useCreditBalance, useArmCategoryTree,
    useUploadFile, useAd, useUpdateAd
} from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    Package, Send, Edit2, MapPin, Clock,
    ArrowDown, ArrowLeft, ArrowRight, TrendingUp, Plus, Check,
    Settings, Layers, ClipboardCheck, CreditCard, AlertTriangle, FileText, Pencil,
} from 'lucide-react';
import Image from 'next/image';
import { ArmLocationSelector } from '@/app/components/ArmLocationSelector';
import { NumberInput } from "@/components/common";
import { FileUploader } from '@/components/common/FileUploader';
import { cn } from '@/lib/utils';
import { CategoryGridSelector } from "@/app/ad/CategoryGridSelector";
import { apiService } from '@/lib/api/apiService';
import { FormHeader } from "@/app/components";
import { SpecsSection } from './components/SpecsSection';
import { PaymentMethodsSection } from './components/PaymentMethodsSection';
import { useDeleteFile } from '@/lib/api/apiHooks';

const BASE_STEPS = [
    { title: 'گروه', icon: Layers },
    { title: 'قیمت', icon: Package },
    { title: 'موقعیت', icon: MapPin },
    { title: 'انتشار', icon: Settings },
    { title: 'بررسی', icon: ClipboardCheck },
];

interface AdFormProps {
    adId?: string;
    onSuccess?: () => void;
}

interface QuantityConstraints {
    min: number | null;
    max: number | null;
}

interface UnitOption {
    unitId: string;
    unitTitle: string;
    unitShortCode: string;
    isVariableQty: boolean;
    qty: number | null;
    isDefault: boolean;
}

function getCategoryConstraintsFromTree(
    categoryId: string,
    armConfig: any,
    categoryTree: any[]
): QuantityConstraints {
    const selection = armConfig?.categorySelections?.find(
        (s: any) => s.categoryId === categoryId
    );
    if (selection) {
        const min = selection.minQuantityOverride ?? null;
        const max = selection.maxQuantityOverride ?? null;
        if (min !== null || max !== null) {
            return { min, max };
        }
    }

    const findNodeInTree = (nodes: any[], id: string): any => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeInTree(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const node = findNodeInTree(categoryTree, categoryId);
    if (node?.parentId) {
        return getCategoryConstraintsFromTree(node.parentId, armConfig, categoryTree);
    }

    return { min: null, max: null };
}

// ✅ دریافت واحدهای قابل انتخاب برای کتگوری
function getAvailableUnits(
    categoryId: string,
    armConfig: any,
    categoryTree: any[]
): UnitOption[] {
    const selection = armConfig?.categorySelections?.find(
        (s: any) => s.categoryId === categoryId
    );

    if (!selection) return [];

    const units: UnitOption[] = [];

    // ✅ واحد پیش‌فرض
    if (selection.overrideUnitId) {
        units.push({
            unitId: selection.overrideUnitId,
            unitTitle: selection.overrideUnitTitle || '',
            unitShortCode: selection.overrideUnitShortCode || '',
            isVariableQty: selection.overrideUnitIsVariableQty !== false,
            qty: selection.overrideUnitQty ?? null,
            isDefault: true,
        });
    }

    // ✅ واحدهای فرعی
    const altUnits = selection.alternativeUnits || [];
    altUnits.forEach((au: any) => {
        if (au.unitId && au.isActive !== false) {
            units.push({
                unitId: au.unitId,
                unitTitle: au.unitTitle || '',
                unitShortCode: au.unitShortCode || '',
                isVariableQty: au.isVariableQty !== false,
                qty: au.qty ?? null,
                isDefault: false,
            });
        }
    });

    return units;
}

export function AdForm({ adId, onSuccess }: AdFormProps) {
    const router = useRouter();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const { data: business, isLoading: businessLoading } = useActiveBusiness();
    const { data: categoryTree, isLoading: categoriesLoading } = useArmCategoryTree(currentSlug || 'barton');
    const { data: creditBalance, refetch: refetchBalance, isLoading: creditLoading } = useCreditBalance();
    const { data: existingAd, isLoading: adLoading } = useAd(adId || '');
    const uploadMutation = useUploadFile();
    const deleteFileMutation = useDeleteFile();

    const isEditMode = !!adId;

    const [redirecting, setRedirecting] = useState(false);
    const [activeAdsCount, setActiveAdsCount] = useState(0);
    const [loadingActiveAds, setLoadingActiveAds] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const createAdMutation = useCreateAd();
    const updateAdMutation = useUpdateAd();

    const armConfig = currentArm?.config as any || {};
    const priceTable = armConfig.modules?.priceTable || {};

    const currencyUnit = useMemo(() => {
        const code = armConfig.economy?.currency || 'IRR';
        const currencyMap: Record<string, string> = {
            'IRR': 'تومان', 'IRR1': 'ریال', 'USD': 'دلار', 'EUR': 'یورو',
        };
        return currencyMap[code] || code || 'تومان';
    }, [armConfig.economy?.currency]);

    const maxActiveAdsPerUser = useMemo(() => priceTable.maxActiveAdsPerUser ?? 5, [priceTable.maxActiveAdsPerUser]);
    const maxTotalFreeAdPerUser = useMemo(() => priceTable.maxTotalFreeAdPerUser ?? 50, [priceTable.maxTotalFreeAdPerUser]);
    const bumpCost = useMemo(() => priceTable.bumpCost ?? 10, [priceTable.bumpCost]);
    const allowAnonymousPublishing = useMemo(() => priceTable.allowAnonymousPublishing ?? true, [priceTable.allowAnonymousPublishing]);
    const adValidityDefaultHours = useMemo(() => priceTable.adValidityDefaultHours ?? 24, [priceTable.adValidityDefaultHours]);
    const maxImagesPerAd = useMemo(() => priceTable.maxImagesPerAd ?? 1, [priceTable.maxImagesPerAd]);

    const [formData, setFormData] = useState({
        categoryId: '',
        productType: '',
        unitPrice: 0,
        minQuantity: 0,
        availableQuantity: 0,
        cityCode: '',
        cityLabel: '',
        provinceCode: '',
        provinceLabel: '',
        validityHours: String(adValidityDefaultHours || 24),
        isAnonymous: false,
        isBumped: false,
        description: '',
        // ✅ جدید
        unitId: '',
        unitTitle: '',
        unitQty: null as number | null,
        unitIsVariableQty: false,
    });

    const [bumpDurationHours, setBumpDurationHours] = useState<number>(24);

    const [specsEnabled, setSpecsEnabled] = useState(false);
    const [specs, setSpecs] = useState<Record<string, string>>({});
    const [paymentMethods, setPaymentMethods] = useState({
        enabled: false,
        description: '',
        cheque: { enabled: false, description: '', options: [] as { price: number; days: number }[] },
        installment: { enabled: false, description: '', options: [] as { price: number; months: number; prepaymentPercent: number }[] },
    });

    const [adImageFiles, setAdImageFiles] = useState<{ id?: string; file?: File; previewUrl?: string }[]>([]);

    // ✅ واحدهای قابل انتخاب
    const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([]);

    const findNodeById = (nodes: any[], id: string): any => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const selectedCategoryData = useMemo(() => {
        if (formData.categoryId && categoryTree) {
            return findNodeById(categoryTree, formData.categoryId);
        }
        return null;
    }, [formData.categoryId, categoryTree]);

    const unitName = formData.unitTitle || selectedCategoryData?.unitTitle || 'تن';
    const categoryExample = selectedCategoryData?.example || '';

    const locationTree = currentArm?.locationTree || [];
    const totalCities = useMemo(() => {
        let count = 0;
        for (const province of locationTree) {
            if (province.children) count += province.children.filter((c: any) => c.type === 'city').length;
        }
        return count;
    }, [locationTree]);

    const hasSingleCity = totalCities === 1;
    const singleCityData = useMemo(() => {
        if (hasSingleCity) {
            for (const province of locationTree) {
                const city = province.children?.find((c: any) => c.type === 'city');
                if (city) return { city, province };
            }
        }
        return null;
    }, [locationTree, hasSingleCity]);

    useEffect(() => {
        const fetchActiveAdsCount = async () => {
            if (!business || !currentSlug) {
                setLoadingActiveAds(false);
                return;
            }
            try {
                const now = new Date();
                const activeAds = business.ads?.filter(
                    (ad: any) => ad.status === 'active' && ad.armId === currentArm?.id && new Date(ad.expiresAt) > now
                ) || [];
                setActiveAdsCount(activeAds.length);
            } catch (error) {
                console.error(error);
                setActiveAdsCount(0);
            } finally {
                setLoadingActiveAds(false);
            }
        };
        fetchActiveAdsCount();
    }, [business, currentSlug, currentArm]);

    const isLoading = businessLoading || categoriesLoading || creditLoading || (isEditMode && adLoading) || loadingActiveAds;

    const remainingActiveSlots = Math.max(0, maxActiveAdsPerUser - activeAdsCount);
    const remainingTotalSlots = Math.max(0, maxTotalFreeAdPerUser - activeAdsCount);
    const hasReachedMaxAds = activeAdsCount >= maxActiveAdsPerUser;
    const hasReachedTotalLimit = activeAdsCount >= maxTotalFreeAdPerUser;
    const isAdFree = remainingActiveSlots > 0 && remainingTotalSlots > 0;

    const isBumpActive = isEditMode && existingAd?.isBumped && existingAd?.bumpExpiresAt && new Date(existingAd.bumpExpiresAt) > new Date();
    const bumpExpiresAtLabel = existingAd?.bumpExpiresAt ? new Date(existingAd.bumpExpiresAt).toLocaleDateString('fa-IR') : '';

    const stepMeta = useMemo(() => {
        if (isEditMode) {
            return [
                ...BASE_STEPS.slice(0, 4),
                { title: 'جزئیات', icon: CreditCard },
                ...BASE_STEPS.slice(4),
            ];
        }
        return BASE_STEPS;
    }, [isEditMode]);

    const TOTAL_STEPS = stepMeta.length;

    const [categoryConstraints, setCategoryConstraints] = useState<QuantityConstraints>({ min: null, max: null });

    // ✅ وقتی کتگوری تغییر میکنه، واحدها رو آپدیت کن
    useEffect(() => {
        if (formData.categoryId && armConfig && categoryTree) {
            const constraints = getCategoryConstraintsFromTree(
                formData.categoryId,
                armConfig,
                categoryTree
            );
            setCategoryConstraints(constraints);

            const units = getAvailableUnits(formData.categoryId, armConfig, categoryTree);
            setAvailableUnits(units);

            // ✅ اگه واحد فعلی در لیست نیست، اولین واحد رو انتخاب کن
            if (units.length > 0) {
                const currentUnitExists = units.some(u => u.unitId === formData.unitId);
                if (!currentUnitExists) {
                    const defaultUnit = units.find(u => u.isDefault) || units[0];
                    setFormData(prev => ({
                        ...prev,
                        unitId: defaultUnit.unitId,
                        unitTitle: defaultUnit.unitTitle,
                        unitQty: defaultUnit.qty,
                        unitIsVariableQty: defaultUnit.isVariableQty,
                    }));
                }
            } else {
                // ✅ هیچ واحد خاصی تعریف نشده - رفتار مثل قبل
                setFormData(prev => ({
                    ...prev,
                    unitId: selectedCategoryData?.defaultUnitId || '',
                    unitTitle: selectedCategoryData?.unitTitle || 'تن',
                    unitQty: null,
                    unitIsVariableQty: false,
                }));
            }
        } else {
            setCategoryConstraints({ min: null, max: null });
            setAvailableUnits([]);
        }
    }, [formData.categoryId, armConfig, categoryTree]);

    useEffect(() => {
        if (isEditMode && existingAd) {
            setFormData({
                categoryId: existingAd.categoryId || '',
                productType: existingAd.productType || '',
                unitPrice: existingAd.unitPrice || 0,
                minQuantity: existingAd.minQuantity || 0,
                availableQuantity: existingAd.availableQuantity || 0,
                cityCode: existingAd.cityCode || '',
                cityLabel: existingAd.city || '',
                provinceCode: existingAd.provinceCode || '',
                provinceLabel: existingAd.province || '',
                validityHours: String(existingAd.validityHours || adValidityDefaultHours || 24),
                isAnonymous: existingAd.isAnonymous || false,
                isBumped: existingAd.isBumped || false,
                description: existingAd.description || '',
                unitId: existingAd.unitId || '',
                unitTitle: existingAd.unit?.title || '',
                unitQty: existingAd.unitQty ?? null,
                unitIsVariableQty: existingAd.unitIsVariableQty ?? false,
            });

            if (existingAd.isBumped) {
                const storedDuration = existingAd.bumpDurationHours || parseInt(formData.validityHours) || 24;
                setBumpDurationHours(storedDuration);
            } else {
                setBumpDurationHours(parseInt(formData.validityHours) || 24);
            }

            const images = (existingAd.files || [])
                .filter((f: any) => f.fieldKey?.startsWith('ad-image'))
                .sort((a: any, b: any) => {
                    const idxA = parseInt(a.fieldKey.split('-')[2] || '0');
                    const idxB = parseInt(b.fieldKey.split('-')[2] || '0');
                    return idxA - idxB;
                });
            setAdImageFiles(images.map((img: any) => ({ id: img.id })));

            if (existingAd.specs && Object.keys(existingAd.specs).length > 0) {
                setSpecs(existingAd.specs);
                setSpecsEnabled(true);
            }

            if (existingAd.paymentMethods) {
                const pm = existingAd.paymentMethods;
                const hasCheque = Array.isArray(pm.cheque) && pm.cheque.length > 0;
                const hasInstallment = Array.isArray(pm.installment) && pm.installment.length > 0;
                const hasDescription = pm.description && pm.description.trim().length > 0;
                setPaymentMethods({
                    enabled: hasCheque || hasInstallment || hasDescription,
                    description: pm.description || '',
                    cheque: {
                        enabled: hasCheque,
                        description: pm.chequeDescription || '',
                        options: hasCheque ? pm.cheque : [],
                    },
                    installment: {
                        enabled: hasInstallment,
                        description: pm.installmentDescription || '',
                        options: hasInstallment ? pm.installment : [],
                    },
                });
            }

            if (existingAd.status === 'rejected') {
                setCurrentStep(1);
            }
        }
    }, [isEditMode, existingAd, adValidityDefaultHours]);

    useEffect(() => {
        if (isEditMode) return;
        if (business?.cityCode && !hasSingleCity) {
            setFormData(prev => ({
                ...prev,
                cityCode: business.cityCode || '',
                cityLabel: business.city || '',
                provinceCode: business.provinceCode || '',
                provinceLabel: business.province || '',
            }));
        } else if (hasSingleCity && singleCityData) {
            setFormData(prev => ({
                ...prev,
                cityCode: singleCityData.city.cityCode || singleCityData.city.id,
                cityLabel: singleCityData.city.title,
                provinceCode: singleCityData.province.provinceCode || singleCityData.province.id,
                provinceLabel: singleCityData.province.title,
            }));
        }
    }, [business, hasSingleCity, singleCityData, isEditMode]);

    useEffect(() => {
        const maxAllowed = parseInt(formData.validityHours, 10) || 24;
        let newDuration = bumpDurationHours;
        if (newDuration > maxAllowed) newDuration = maxAllowed;
        if (newDuration < 24) newDuration = 24;
        if (newDuration !== bumpDurationHours) setBumpDurationHours(newDuration);
    }, [formData.validityHours, bumpDurationHours]);

    const bumpOptions = useMemo(() => {
        const max = parseInt(formData.validityHours);
        const options = [];
        for (let h = 24; h <= max; h += 24) options.push(h);
        return options;
    }, [formData.validityHours]);

    const totalBumpCost = useMemo(() => {
        if (!formData.isBumped) return 0;
        return (bumpDurationHours / 24) * bumpCost;
    }, [formData.isBumped, bumpDurationHours, bumpCost]);

    useEffect(() => {
        if (!isEditMode && adImageFiles.length === 0) {
            setAdImageFiles([{}]);
        }
    }, [isEditMode]);

    const validateStep = (step: number): boolean => {
        const errors: string[] = [];
        if (step === 1) {
            if (!formData.categoryId) errors.push('دسته‌بندی کالا را انتخاب کنید.');
            if (selectedCategoryData && !formData.productType.trim()) errors.push('عنوان کالا را وارد کنید.');
        } else if (step === 2) {
            if (formData.minQuantity <= 0) errors.push('حداقل حجم فروش را وارد کنید.');
            if (formData.unitPrice <= 0) errors.push('قیمت واحد را وارد کنید.');
            if (formData.availableQuantity <= 0) errors.push('موجودی انبار را وارد کنید.');
            if (formData.minQuantity > formData.availableQuantity) {
                errors.push('حداقل حجم فروش نمی‌تواند از موجودی بیشتر باشد.');
            }

            if (categoryConstraints.min !== null && formData.minQuantity < categoryConstraints.min) {
                errors.push(`حداقل حجم فروش در این بازار نمی‌تواند کمتر از ${categoryConstraints.min.toLocaleString()} ${unitName} باشد.`);
            }
            if (categoryConstraints.max !== null && formData.minQuantity > categoryConstraints.max) {
                errors.push(`حداقل حجم فروش در این بازار نمی‌تواند بیشتر از ${categoryConstraints.max.toLocaleString()} ${unitName} باشد.`);
            }
        } else if (step === 3) {
            if (!formData.cityCode && !hasSingleCity) errors.push('محل کالا را انتخاب کنید.');
        }
        if (errors.length > 0) {
            errors.forEach(msg => toast.error(msg));
            return false;
        }
        return true;
    };

    const nextStep = () => {
        if (currentStep < TOTAL_STEPS && validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToStep = (step: number) => {
        if (step < currentStep) {
            setCurrentStep(step);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleAddImageSlot = () => {
        if (adImageFiles.length < maxImagesPerAd) {
            setAdImageFiles(prev => [...prev, {}]);
        }
    };

    const handleRemoveImageSlot = async (index: number) => {
        const slot = adImageFiles[index];
        if (slot?.previewUrl) URL.revokeObjectURL(slot.previewUrl);
        if (slot?.id) {
            try { await deleteFileMutation.mutateAsync(slot.id); } catch {}
        }
        setAdImageFiles(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated.length === 0 ? [{}] : updated;
        });
    };

    const handleSetImageFile = (index: number, file: File | null) => {
        setAdImageFiles(prev => {
            const updated = [...prev];
            if (updated[index]?.previewUrl) URL.revokeObjectURL(updated[index].previewUrl!);
            const previewUrl = file ? URL.createObjectURL(file) : undefined;
            updated[index] = { file: file ?? undefined, previewUrl };
            return updated;
        });
    };

    const uploadedCount = useMemo(() => adImageFiles.filter(s => s.id || s.file).length, [adImageFiles]);

    useEffect(() => {
        return () => {
            adImageFiles.forEach(slot => {
                if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
            });
        };
    }, []);

    const handleSubmit = async () => {
        if (currentStep !== TOTAL_STEPS) return;
        if (isSubmitting) return;

        if (formData.isBumped && creditBalance && creditBalance.balance < totalBumpCost) {
            toast.error(`اعتبار کافی نیست. برای نردبان به ${totalBumpCost} اعتبار نیاز دارید.`);
            setCurrentStep(4);
            return;
        }

        for (let s = 1; s <= 3; s++) {
            if (!validateStep(s)) {
                setCurrentStep(s);
                return;
            }
        }

        if (!isEditMode) {
            if (hasReachedMaxAds) {
                if (creditBalance && creditBalance.balance >= bumpCost) {
                    toast.info(`سهمیه آگهی فعال شما پر است. ${bumpCost} اعتبار از حساب شما کسر خواهد شد.`, { duration: 3000 });
                } else {
                    toast.error(`سهمیه آگهی فعال شما پر است. برای ثبت آگهی جدید، ${bumpCost} اعتبار نیاز دارید.`);
                    return;
                }
            } else if (hasReachedTotalLimit) {
                toast.error(`سهمیه کل آگهی‌های شما پر شده است. برای ثبت آگهی جدید، ${bumpCost} اعتبار نیاز دارید.`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            let uploadedIds: string[] = [];
            const filesToUpload = adImageFiles.filter(slot => slot.file).map(slot => slot.file!);
            if (filesToUpload.length > 0) {
                try {
                    const uploadPromises = filesToUpload.map((file, index) =>
                        uploadMutation.mutateAsync({
                            file,
                            model: 'Ad',
                            modelId: 'temp',
                            fieldKey: `ad-image-${index}`,
                        }).then(res => res.id)
                    );
                    uploadedIds = await Promise.all(uploadPromises);
                } catch (error: any) {
                    toast.error('خطا در آپلود تصاویر');
                    setIsSubmitting(false);
                    return;
                }
            }

            const title = formData.productType
                ? `${selectedCategoryData?.title || ''} ${formData.productType}`
                : selectedCategoryData?.title || '';

            let ad;
            if (isEditMode) {
                const updateData: any = {
                    categoryId: formData.categoryId,
                    unitId: formData.unitId || selectedCategoryData?.defaultUnitId || '',
                    title,
                    productType: formData.productType,
                    unitPrice: formData.unitPrice,
                    minQuantity: formData.minQuantity,
                    availableQuantity: formData.availableQuantity,
                    city: formData.cityLabel,
                    cityCode: formData.cityCode,
                    provinceCode: formData.provinceCode,
                    validityHours: parseInt(formData.validityHours),
                    isAnonymous: formData.isAnonymous,
                    description: formData.description,
                    // ✅ جدید
                    unitQty: formData.unitQty,
                    unitIsVariableQty: formData.unitIsVariableQty,
                };
                if (!isBumpActive) {
                    updateData.isBumped = formData.isBumped;
                    if (formData.isBumped) updateData.bumpDurationHours = bumpDurationHours;
                }
                if (specsEnabled && Object.keys(specs).length > 0) {
                    updateData.specs = specs;
                } else {
                    updateData.specs = null;
                }
                if (paymentMethods.enabled) {
                    updateData.paymentMethods = {
                        description: paymentMethods.description,
                        cheque: paymentMethods.cheque.enabled ? paymentMethods.cheque.options : [],
                        chequeDescription: paymentMethods.cheque.description || '',
                        installment: paymentMethods.installment.enabled ? paymentMethods.installment.options : [],
                        installmentDescription: paymentMethods.installment.description || '',
                    };
                } else {
                    updateData.paymentMethods = null;
                }
                ad = await updateAdMutation.mutateAsync({ id: adId, data: updateData });
                toast.success('آگهی با موفقیت ویرایش شد');
            } else {
                ad = await createAdMutation.mutateAsync({
                    armSlug: currentSlug || 'barton',
                    categoryId: formData.categoryId,
                    unitId: formData.unitId || selectedCategoryData?.defaultUnitId || '',
                    title,
                    productType: formData.productType,
                    unitPrice: formData.unitPrice,
                    minQuantity: formData.minQuantity,
                    availableQuantity: formData.availableQuantity,
                    city: formData.cityLabel,
                    cityCode: formData.cityCode,
                    provinceCode: formData.provinceCode,
                    locationDetail: '',
                    validityHours: parseInt(formData.validityHours),
                    isAnonymous: formData.isAnonymous,
                    isBumped: formData.isBumped,
                    bumpDurationHours: formData.isBumped ? bumpDurationHours : undefined,
                    description: formData.description,
                    unitQty: formData.unitQty,
                    unitIsVariableQty: formData.unitIsVariableQty,
                });
                toast.success('آگهی با موفقیت ثبت شد');
            }

            if (uploadedIds.length > 0 && ad?.id) {
                await Promise.all(uploadedIds.map(fileId => apiService.file.updateRelatedId(fileId, ad.id)));
            }

            await refetchBalance();
            onSuccess?.();
            router.push('/profile');
        } catch (error: any) {
            if (error?.data?.errorCode === 'INSUFFICIENT_CREDIT') {
                toast.error(error?.data?.message || 'اعتبار کافی نیست');
                setTimeout(() => router.push('/credit/purchase'), 1500);
            } else if (error?.data?.errorCode === 'MIN_QUANTITY_EXCEEDS_STOCK') {
                toast.error(error?.data?.message || 'حداقل حجم فروش نمی‌تواند از موجودی بیشتر باشد');
            } else {
                toast.error(error?.message || (isEditMode ? 'خطا در ویرایش آگهی' : 'خطا در ثبت آگهی'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (currentStep < TOTAL_STEPS) nextStep();
        }
    };

    if (isLoading || redirecting || !business) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <FormHeader title={isEditMode ? "ویرایش آگهی" : "ثبت قیمت"} backUrl="/profile" />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                        <p className="mt-4 text-on-surface-variant">{redirecting ? 'در حال انتقال...' : 'در حال بارگذاری...'}</p>
                    </div>
                </main>
            </div>
        );
    }

    const needsCreditPurchase = !isEditMode && !isAdFree && (creditBalance?.balance ?? 0) < bumpCost;

    if (needsCreditPurchase) {
        let title = '';
        let message = '';
        if (hasReachedMaxAds && hasReachedTotalLimit) {
            title = 'سقف آگهی‌ها پر شده است';
            message = `شما به هر دو سقف آگهی‌های فعال (${maxActiveAdsPerUser}) و کل آگهی‌های ثبت‌شده (${maxTotalFreeAdPerUser}) رسیده‌اید. برای ثبت آگهی جدید نیاز به خرید اعتبار دارید.`;
        } else if (hasReachedMaxAds) {
            title = 'سقف آگهی‌های فعال پر شده';
            message = `شما به سقف ${maxActiveAdsPerUser} آگهی فعال همزمان رسیده‌اید. برای ثبت آگهی جدید، باید اعتبار خریداری کنید یا یکی از آگهی‌های فعال را حذف کنید.`;
        } else if (hasReachedTotalLimit) {
            title = 'سقف کل آگهی‌های ثبت‌شده پر شده';
            message = `شما به سقف ${maxTotalFreeAdPerUser} آگهی ثبت‌شده رسیده‌اید. برای ثبت آگهی جدید، باید اعتبار خریداری کنید.`;
        } else {
            title = 'اعتبار کافی نیست';
            message = `موجودی اعتبار شما (${creditBalance?.balance ?? 0}) کمتر از هزینه ثبت آگهی (${bumpCost}) است. برای ثبت آگهی، اعتبار خریداری کنید.`;
        }

        return (
            <div className="min-h-screen flex flex-col bg-surface">
                <FormHeader title="ثبت قیمت" backUrl="/profile" />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center space-y-6 max-w-sm w-full">
                        <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                            <CreditCard className="w-10 h-10 text-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-extrabold text-on-surface">{title}</h2>
                            <p className="text-sm text-on-surface-variant leading-relaxed">
                                {message}<br />
                                موجودی فعلی: <span className="font-bold">{creditBalance?.balance ?? 0}</span> اعتبار.
                            </p>
                        </div>
                        <Link href="/credit/purchase" className="block">
                            <button className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white font-bold text-base rounded-2xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2.5">
                                <CreditCard className="w-5 h-5" /> خرید اعتبار
                            </button>
                        </Link>
                        <button onClick={() => router.push('/')} className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                            بازگشت به صفحه اصلی
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    const validityOptions = [
        { value: '24', label: '۲۴ ساعت' },
        { value: '48', label: '۴۸ ساعت' },
        { value: '72', label: '۷۲ ساعت' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-surface pb-28" onKeyDown={handleKeyDown}>
            <FormHeader title={isEditMode ? "ویرایش کامل آگهی" : "ثبت قیمت جدید"} backUrl="/profile" />

            <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-20">
                {/* نوار پیشرفت */}
                <div className="flex flex-row-reverse items-start mb-10">
                    {stepMeta.map((meta, idx) => {
                        const stepNum = idx + 1;
                        const isActive = stepNum === currentStep;
                        const isDone = stepNum < currentStep;
                        const isLast = idx === stepMeta.length - 1;
                        const Icon = meta.icon;
                        return (
                            <React.Fragment key={stepNum}>
                                <button
                                    type="button"
                                    onClick={() => goToStep(stepNum)}
                                    disabled={stepNum > currentStep}
                                    className="flex flex-col items-center flex-shrink-0 cursor-default"
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                                        isActive && "bg-primary text-white border-primary ring-4 ring-primary/20 scale-110 shadow-lg shadow-primary/20",
                                        isDone && "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20",
                                        !isActive && !isDone && "bg-surface-container-high text-on-surface-variant border-outline-variant/50",
                                        stepNum > currentStep && "opacity-40"
                                    )}>
                                        {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] sm:text-[11px] mt-2.5 text-center leading-tight font-medium",
                                        isActive && "text-primary",
                                        isDone && "text-emerald-600",
                                        !isActive && !isDone && "text-on-surface-variant/70"
                                    )}>
                    {meta.title}
                  </span>
                                </button>
                                {!isLast && (
                                    <div className="flex-1 flex items-center pt-[18px] px-1 min-w-[12px]">
                                        <div className={cn(
                                            "w-full h-[3px] rounded-full transition-all duration-500",
                                            isDone ? "bg-emerald-500" : "bg-outline-variant/20"
                                        )} />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="space-y-5">
                    {/* مرحله ۱ */}
                    {currentStep === 1 && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                            <CategoryGridSelector
                                categoryTree={categoryTree || []}
                                selectedCategoryId={formData.categoryId}
                                onSelect={(categoryId) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        categoryId,
                                        minQuantity: 0,
                                        unitPrice: 0,
                                        unitId: '',
                                        unitTitle: '',
                                        unitQty: null,
                                    }));
                                }}
                            />
                            {selectedCategoryData && (
                                <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm space-y-2.5">
                                    <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-3.5 h-3.5 text-primary" />
                    </span>
                                        عنوان کالا
                                        <span className="text-error text-xs">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={30}
                                        value={formData.productType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, productType: e.target.value }))}
                                        placeholder={"عنوان کوتاه کالا را وارد کنید."}
                                        className="w-full h-12 bg-surface-container-lowest border border-outline/60 px-4 text-sm text-right placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none rounded-xl transition-all"
                                    />
                                </div>
                            )}


                            {/* ✅ انتخاب واحد - فقط اگر واحدهای خاص تعریف شده باشه */}
                            {/* ✅ انتخاب واحد */}
                            {availableUnits.length > 0 && (
                                <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm space-y-3">
                                    <label className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-amber-600" />
            </span>
                                        واحد فروش
                                    </label>

                                    <div className="space-y-2">
                                        {availableUnits.map((unit, idx) => {
                                            const isSelected = formData.unitId === unit.unitId;
                                            const baseUnitTitle = selectedCategoryData?.baseUnitTitle || 'واحد';
                                            const isEditingQty = isSelected && unit.isVariableQty && formData.isEditingQty;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "rounded-xl border transition-all overflow-hidden",
                                                        isSelected
                                                            ? "border-primary bg-primary/5 shadow-sm shadow-primary/5"
                                                            : "border-outline-variant/20 hover:border-primary/30"
                                                    )}
                                                >
                                                    {/* سربرگ واحد - همیشه نمایش */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                unitId: unit.unitId,
                                                                unitTitle: unit.unitTitle,
                                                                unitQty: unit.qty,
                                                                unitIsVariableQty: unit.isVariableQty,
                                                                isEditingQty: false, // ✅ بستن حالت ویرایش
                                                            }));
                                                        }}
                                                        className="w-full text-right px-4 py-3 flex items-center justify-between gap-2"
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <div className={cn(
                                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                                                isSelected ? "border-primary bg-primary" : "border-outline-variant/40"
                                                            )}>
                                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                                            </div>

                                                            <span className="font-medium text-sm truncate">
                                    {unit.unitTitle}
                                </span>

                                                            {unit.isDefault && (
                                                                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                        پیش‌فرض
                                    </span>
                                                            )}
                                                        </div>

                                                        {/* تعداد + آیکون ویرایش */}
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            {formData.unitQty != null && isSelected && (
                                                                <span className="text-[11px] text-on-surface-variant bg-surface-container-high/80 px-2 py-1 rounded-lg">
                                        {formData.unitQty.toLocaleString()} {baseUnitTitle}
                                    </span>
                                                            )}

                                                            {/* ✅ آیکون ویرایش - فقط برای واحد انتخاب‌شده و متغیر */}
                                                            {isSelected && unit.isVariableQty && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            isEditingQty: !prev.isEditingQty, // ✅ toggle حالت ویرایش
                                                                        }));
                                                                    }}
                                                                    className={cn(
                                                                        "p-1.5 rounded-lg transition-colors",
                                                                        isEditingQty
                                                                            ? "bg-primary/10 text-primary"
                                                                            : "hover:bg-primary/10 hover:text-primary"
                                                                    )}
                                                                    title={`ویرایش تعداد ${baseUnitTitle} در هر ${unit.unitTitle}`}
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* ✅ ویرایش تعداد - فقط وقتی مداد زده شده */}
                                                    {isEditingQty && (
                                                        <div className="px-4 pb-3 pt-1 border-t border-primary/10 bg-primary/5">
                                                            <div className="flex items-center gap-2">
                                                                <label className="text-[11px] font-medium text-on-surface-variant whitespace-nowrap">
                                                                    تعداد {baseUnitTitle} در هر {unit.unitTitle}:
                                                                </label>
                                                                <NumberInput
                                                                    value={formData.unitQty || undefined}
                                                                    onChange={(val) => setFormData(prev => ({ ...prev, unitQty: val || null }))}
                                                                    placeholder={`مثلاً ${unit.qty || 24}`}
                                                                    className="flex-1 h-10 bg-white border border-outline/60 px-3 text-sm font-medium text-right rounded-lg"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                            <p className="text-[10px] text-on-surface-variant/50 mt-1.5">
                                                                💡 می‌توانید تعداد {baseUnitTitle} در هر {unit.unitTitle} را تغییر دهید
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {maxImagesPerAd > 0 && (
                                <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm space-y-3">
                                    <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    </span>
                                        تصویر محصول
                                        <span className="text-[10px] font-normal text-on-surface-variant/60 mr-auto">
                      {uploadedCount}/{maxImagesPerAd}
                    </span>
                                    </label>
                                    <div className="flex flex-wrap gap-3 items-start">
                                        {adImageFiles.map((slot, idx) => (
                                            <FileUploader
                                                key={idx}
                                                model="Ad"
                                                modelId="temp"
                                                fieldKey={`ad-image-${idx}`}
                                                value={slot.id || null}
                                                previewUrl={slot.previewUrl}
                                                onFileSelect={(file) => handleSetImageFile(idx, file)}
                                                onRemove={() => handleRemoveImageSlot(idx)}
                                                showDeleteBtn={!!slot.id || !!slot.file}
                                                rounded={false}
                                                width={80}
                                                height={80}
                                                disabled={isSubmitting}
                                                label={slot.id ? 'تعویض' : 'آپلود'}
                                            />
                                        ))}
                                        {adImageFiles.length < maxImagesPerAd && (
                                            <button
                                                type="button"
                                                onClick={handleAddImageSlot}
                                                className="w-20 h-20 border-2 border-dashed border-outline-variant/40 rounded-xl flex flex-col items-center justify-center text-on-surface-variant/40 hover:border-primary/50 hover:text-primary/60 hover:bg-primary/5 transition-all gap-1"
                                                disabled={isSubmitting}
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span className="text-[9px]">افزودن</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* مرحله ۲ */}
                    {currentStep === 2 && selectedCategoryData && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 space-y-1">
                                <div className="flex items-center gap-2 text-primary">
                                    <Package className="w-5 h-5" />
                                    <h3 className="font-bold text-sm">تعیین قیمت بر اساس حجم خرید</h3>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-outline-variant/40 shadow-sm space-y-2.5">
                                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black">۱</span>
                                    حداقل حجم فروش ({unitName})
                                    {categoryConstraints.min && categoryConstraints.max
                                        ? `بین ${categoryConstraints.min.toLocaleString()} تا ${categoryConstraints.max.toLocaleString()}`
                                        : categoryConstraints.min
                                            ? `حداقل ${categoryConstraints.min.toLocaleString()}`
                                            : categoryConstraints.max
                                                ? `حداکثر ${categoryConstraints.max.toLocaleString()}`
                                                : ``}
                                    <span className="text-error text-xs">*</span>
                                </label>
                                <NumberInput
                                    value={formData.minQuantity || undefined}
                                    onChange={(val) => setFormData(prev => ({ ...prev, minQuantity: val || 0 }))}
                                    unit={unitName}
                                    className="w-full h-14 bg-surface-container-lowest border border-outline/60 px-4 font-extrabold text-right focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none rounded-xl transition-all"
                                />
                                {(categoryConstraints.min || categoryConstraints.max) && (
                                    <p className="text-[10px] text-primary/70 mt-1">
                                        {categoryConstraints.min && categoryConstraints.max
                                            ? `محدوده مجاز: ${categoryConstraints.min.toLocaleString()} - ${categoryConstraints.max.toLocaleString()} ${unitName}`
                                            : categoryConstraints.min
                                                ? `حداقل مجاز: ${categoryConstraints.min.toLocaleString()} ${unitName}`
                                                : `حداکثر مجاز: ${categoryConstraints.max.toLocaleString()} ${unitName}`}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ArrowDown className="w-4 h-4 text-primary" />
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-primary/30 shadow-sm shadow-primary/5 space-y-2.5 ring-1 ring-primary/10">
                                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center text-[10px] font-black">۲</span>
                                    قیمت هر {unitName} برای خرید حداقل {formData.minQuantity || '...'} {unitName}
                                    <span className="text-error text-xs">*</span>
                                </label>
                                <NumberInput
                                    value={formData.unitPrice || undefined}
                                    onChange={(val) => setFormData(prev => ({ ...prev, unitPrice: val || 0 }))}
                                    unit={currencyUnit}
                                    className="w-full h-14 bg-surface-container-lowest border border-primary/40 px-4 text-xl font-extrabold text-right placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none rounded-xl transition-all"
                                />
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-outline-variant/40 shadow-sm space-y-2.5 mt-4">
                                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">۳</span>
                                    موجودی فعلی انبار ({unitName})
                                    <span className="text-error text-xs">*</span>
                                </label>
                                <NumberInput
                                    value={formData.availableQuantity || undefined}
                                    onChange={(val) => setFormData(prev => ({ ...prev, availableQuantity: val || 0 }))}
                                    unit={unitName}
                                    className="w-full h-12 bg-surface-container-lowest border border-outline/60 px-4 text-right placeholder:text-on-surface-variant/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none rounded-xl transition-all"
                                    placeholder="موجودی تضمینی را وارد کنید"
                                />
                            </div>
                        </div>
                    )}

                    {/* مرحله ۳ */}
                    {currentStep === 3 && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm space-y-2.5">
                                <label className="text-sm font-bold text-on-surface flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
          <MapPin className="w-3.5 h-3.5 text-rose-600" />
        </span>
                                    محل کالا
                                    <span className="text-error text-xs">*</span>
                                </label>

                                {hasSingleCity ? (
                                    <div className="flex items-center gap-2.5 p-3.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface">
                                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                        <span>{singleCityData?.city.title}</span>
                                    </div>
                                ) : (
                                    <ArmLocationSelector
                                        provinceCode={formData.provinceCode}
                                        cityCode={formData.cityCode}
                                        onProvinceChange={(code, label) =>
                                            setFormData(prev => ({ ...prev, provinceCode: code, provinceLabel: label }))
                                        }
                                        onCityChange={(code, label) =>
                                            setFormData(prev => ({ ...prev, cityCode: code, cityLabel: label }))
                                        }
                                    />
                                )}
                            </div>

                            {/* بخش توضیحات */}
                            <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm space-y-2.5">
                                <label className="text-sm font-bold text-on-surface flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-purple-600" />
        </span>
                                    توضیحات
                                    <span className="text-xs text-on-surface-variant/60 font-normal">(اختیاری)</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    placeholder="توضیحات تکمیلی درباره کالا، شرایط فروش، کیفیت، برند و ..."
                                    className="w-full bg-surface-container-lowest border border-outline/60 px-4 py-3 text-sm text-right placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none rounded-xl transition-all resize-none"
                                />
                                <p className="text-[10px] text-on-surface-variant/40 text-right">
                                    {formData.description.length > 0 ? `${formData.description.length} کاراکتر` : 'می‌توانید توضیحات بیشتری اضافه کنید'}
                                </p>
                            </div>

                            {/* بخش مدت اعتبار */}
                            <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm space-y-2.5">
                                <label className="text-sm font-bold text-on-surface flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
        </span>
                                    مدت اعتبار قیمت
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {validityOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, validityHours: opt.value }))}
                                            className={cn(
                                                "h-12 rounded-xl text-sm font-medium border-2 transition-all",
                                                formData.validityHours === opt.value
                                                    ? "border-primary bg-primary/10 text-primary font-bold"
                                                    : "border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:border-primary/30"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 p-3 bg-surface-container-low/60 rounded-xl border border-outline-variant/20 text-xs text-on-surface-variant leading-relaxed">
                                    آگهی شما تا <span className="font-medium text-primary">{formData.validityHours}</span> ساعت روی تابلو می‌ماند.
                                    و اگر آنرا به موقع آپدیت قیمت نکنید به آرشیو منتقل می شود،آما می توانید دوباره آنرا از آرشیو آپدیت و فعال کنید.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* مرحله ۴ */}
                    {currentStep === 4 && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
                                {isBumpActive ? (
                                    <div className="p-4 bg-blue-50/50 border-blue-200/60 text-blue-700">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <span className="text-sm font-bold block">نردبان فعال است</span>
                                                <span className="text-xs text-blue-600/70">
                          این آگهی تا تاریخ <span className="font-medium">{bumpExpiresAtLabel}</span> در حال نردبان است.
                          برای خرید نردبان جدید یا تغییر مدت، صبر کنید تا این دوره پایان یابد.
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
                                            <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/20">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </span>
                                                <div>
                                                    <span className="text-sm font-bold text-on-surface block">نردبان (بالاترین نمایش)</span>
                                                    <span className="text-[11px] text-on-surface-variant/70">
                            هر ۲۴ ساعت {bumpCost} اعتبار
                                                        {formData.isBumped && bumpOptions.length > 0 && ` • ${totalBumpCost} اعتبار`}
                          </span>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                                <input type="checkbox" checked={formData.isBumped}
                                                       onChange={(e) => {
                                                           setFormData(prev => ({ ...prev, isBumped: e.target.checked }));
                                                           if (e.target.checked) {
                                                               const maxAllowed = parseInt(formData.validityHours);
                                                               setBumpDurationHours(maxAllowed);
                                                               toast.info(`نردبان فعال شد. مدت: ${maxAllowed} ساعت، هزینه: ${totalBumpCost} اعتبار`, { duration: 4000 });
                                                           }
                                                       }} className="sr-only peer" />
                                                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer
                          after:content-[''] after:absolute after:top-[3px] after:right-[3px]
                          after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all after:shadow-sm
                          peer-checked:bg-primary peer-checked:after:-translate-x-full" />
                                            </label>
                                        </div>
                                        {formData.isBumped && bumpOptions.length > 1 && (
                                            <div className="p-4 bg-amber-50/20 border-t border-amber-200/10">
                                                <label className="text-xs font-medium text-on-surface-variant mb-2 block">
                                                    مدت زمان نردبان:
                                                </label>
                                                <div className="flex gap-2">
                                                    {bumpOptions.map(hours => (
                                                        <button
                                                            key={hours}
                                                            type="button"
                                                            onClick={() => setBumpDurationHours(hours)}
                                                            className={cn(
                                                                "flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all",
                                                                bumpDurationHours === hours
                                                                    ? "border-primary bg-primary/10 text-primary"
                                                                    : "border-outline-variant/30 text-on-surface-variant hover:border-primary/30"
                                                            )}
                                                        >
                                                            {hours} ساعت
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-amber-700/60 mt-2">
                                                    هزینه‌ی نردبان بر اساس مدت انتخاب‌شده محاسبه می‌شود.
                                                </p>
                                            </div>
                                        )}
                                        {formData.isBumped && (
                                            <div className="mx-4 mb-4 bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex items-start gap-2.5">
                                                <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                <div className="text-xs text-amber-800/80 space-y-1">
                                                    <p><span className="font-bold">{totalBumpCost}</span> اعتبار از حساب شما کسر خواهد شد.</p>
                                                    {creditBalance && creditBalance.balance < totalBumpCost && (
                                                        <p className="text-red-600 font-bold flex items-center gap-1">
                                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                            اعتبار ناکافی! موجودی: {creditBalance.balance}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {allowAnonymousPublishing && (
                                <div className="bg-white rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-sm shadow-slate-500/20">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </span>
                                            <div>
                                                <span className="text-sm font-bold text-on-surface block">انتشار ناشناس</span>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={formData.isAnonymous}
                                                onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                                                className="sr-only peer"
                                            />
                                            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer
                        after:content-[''] after:absolute after:top-[3px] after:right-[3px]
                        after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all after:shadow-sm
                        peer-checked:bg-primary peer-checked:after:-translate-x-full" />
                                        </label>
                                    </div>
                                    {formData.isAnonymous && (
                                        <div className="px-4 pb-4">
                                            <div className="p-3 bg-surface-container-low/60 rounded-xl border border-outline-variant/20 text-xs text-on-surface-variant leading-relaxed">
                                                کسی نمی‌داند این قیمت برای شماست. مگر آنکه تماس بگیرد.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-1.5">
                                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </span>
                                    <div className="text-sm">
                                        <span className="text-on-surface-variant">اعتبار فعلی:</span>{' '}
                                        <span className="font-bold text-on-surface">{creditBalance?.balance ?? '—'}</span>
                                    </div>
                                </div>
                                {remainingActiveSlots > 0 && remainingTotalSlots > 0 && (
                                    <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-200/50">
                                        <span className="text-[10px] font-medium">🎁 {Math.min(remainingActiveSlots, remainingTotalSlots)} آگهی رایگان باقیمانده</span>
                                    </div>
                                )}
                                {hasReachedMaxAds && (
                                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50/50 px-3 py-1.5 rounded-lg border border-amber-200/50">
                                        <span className="text-[10px] font-medium">⚠️ سهمیه آگهی فعال پر است. هر آگهی جدید {bumpCost} اعتبار مصرف می‌کند.</span>
                                    </div>
                                )}
                                {hasReachedTotalLimit && !hasReachedMaxAds && (
                                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50/50 px-3 py-1.5 rounded-lg border border-amber-200/50">
                                        <span className="text-[10px] font-medium">⚠️ سهمیه کل آگهی‌های شما پر شده است. هر آگهی جدید {bumpCost} اعتبار مصرف می‌کند.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* مرحله ۵: جزئیات تکمیلی (فقط ویرایش) */}
                    {isEditMode && currentStep === 5 && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <SpecsSection
                                specs={specs}
                                setSpecs={setSpecs}
                                enabled={specsEnabled}
                                setEnabled={setSpecsEnabled}
                            />
                            <PaymentMethodsSection
                                paymentMethods={paymentMethods}
                                setPaymentMethods={setPaymentMethods}
                            />
                        </div>
                    )}

                    {/* مرحله آخر: بررسی نهایی */}
                    {currentStep === TOTAL_STEPS && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="bg-gradient-to-l from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/30">
                  <ClipboardCheck className="w-5 h-5 text-white" />
                </span>
                                <div>
                                    <h3 className="font-bold text-sm text-emerald-800">اطلاعات را بررسی کنید</h3>
                                    <p className="text-[11px] text-emerald-700/70">پس از تأیید، آگهی منتشر خواهد شد.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
                                <button type="button" onClick={() => goToStep(1)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest/50 transition-colors">
                  <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> دسته‌بندی و کالا
                  </span>
                                    <Edit2 className="w-3.5 h-3.5 text-primary/50" />
                                </button>
                                <div className="px-4 pb-4 space-y-1.5 border-t border-outline-variant/20 pt-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-on-surface-variant">دسته‌بندی</span>
                                        <span className="font-medium text-on-surface">{selectedCategoryData?.name || '---'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-on-surface-variant">عنوان کالا</span>
                                        <span className="font-medium text-on-surface">{formData.productType || '---'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-on-surface-variant">تصاویر</span>
                                        <span className="font-medium text-on-surface">{uploadedCount > 0 ? `${uploadedCount} عدد` : 'بدون تصویر'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
                                <button type="button" onClick={() => goToStep(2)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest/50 transition-colors">
                  <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" /> قیمت و حجم
                  </span>
                                    <Edit2 className="w-3.5 h-3.5 text-primary/50" />
                                </button>
                                <div className="px-4 pb-4 space-y-1.5 border-t border-outline-variant/20 pt-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-on-surface-variant">حداقل حجم</span>
                                        <span className="font-medium text-on-surface">{formData.minQuantity.toLocaleString()} {unitName}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-on-surface-variant">قیمت هر {unitName}</span>
                                        <span className="font-bold text-primary">{formData.unitPrice.toLocaleString()} {currencyUnit}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-on-surface-variant">موجودی</span>
                                        <span className="font-medium text-on-surface">{formData.availableQuantity.toLocaleString()} {unitName}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
                                <button type="button" onClick={() => goToStep(3)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest/50 transition-colors">
                  <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> موقعیت و زمان
                  </span>
                                    <Edit2 className="w-3.5 h-3.5 text-primary/50" />
                                </button>
                                <div className="px-4 pb-4 space-y-1.5 border-t border-outline-variant/20 pt-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-on-surface-variant">شهر</span>
                                        <span className="font-medium text-on-surface">{formData.cityLabel || singleCityData?.city.title || '---'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-on-surface-variant">اعتبار قیمت</span>
                                        <span className="font-medium text-on-surface">{formData.validityHours} ساعت</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
                                <button type="button" onClick={() => goToStep(4)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest/50 transition-colors">
                  <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" /> تنظیمات انتشار
                  </span>
                                    <Edit2 className="w-3.5 h-3.5 text-primary/50" />
                                </button>
                                <div className="px-4 pb-4 space-y-1.5 border-t border-outline-variant/20 pt-3">
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-on-surface-variant">نردبان</span>
                                        {formData.isBumped ? (
                                            <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full text-[10px]">
                        فعال ({bumpDurationHours} ساعت − {totalBumpCost} اعتبار)
                      </span>
                                        ) : (
                                            <span className="text-on-surface-variant/50">غیرفعال</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-on-surface-variant">انتشار ناشناس</span>
                                        {formData.isAnonymous ? (
                                            <span className="font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full text-[10px]">فعال</span>
                                        ) : (
                                            <span className="text-on-surface-variant/50">غیرفعال</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isEditMode && (
                                <div className="bg-white rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
                                    <button type="button" onClick={() => goToStep(5)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest/50 transition-colors">
                    <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" /> جزئیات تکمیلی
                    </span>
                                        <Edit2 className="w-3.5 h-3.5 text-primary/50" />
                                    </button>
                                    <div className="px-4 pb-4 space-y-1.5 border-t border-outline-variant/20 pt-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-on-surface-variant">مشخصات فنی</span>
                                            {Object.keys(specs).length > 0 ? (
                                                <span className="font-medium text-on-surface">
                          {Object.keys(specs).length} ویژگی
                        </span>
                                            ) : (
                                                <span className="text-on-surface-variant/50">ثبت نشده</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-on-surface-variant">روش‌های پرداخت</span>
                                            {paymentMethods.enabled ? (
                                                <span className="font-medium text-on-surface">
                          {paymentMethods.cheque.enabled && 'چکی '}
                                                    {paymentMethods.installment.enabled && 'اقساطی'}
                        </span>
                                            ) : (
                                                <span className="text-on-surface-variant/50">ثبت نشده</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* دکمه‌های ناوبری */}
                <div className="flex flex-row-reverse items-center justify-between pt-6 mt-2 border-t border-outline-variant/20">
                    {currentStep > 1 ? (
                        <button type="button" onClick={prevStep}
                                className="h-12 px-5 rounded-xl border-2 border-outline-variant/40 bg-white text-sm font-medium text-on-surface flex items-center gap-2 hover:bg-surface-container-lowest transition-all active:scale-95">
                            قبلی <ArrowLeft className="w-4 h-4" />
                        </button>
                    ) : <div />}

                    {currentStep < TOTAL_STEPS ? (
                        <button type="button" onClick={nextStep}
                                className="h-12 px-6 rounded-xl bg-primary text-white text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20">
                            بعدی <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                                className="h-12 px-6 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? (
                                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> در حال ثبت...</>
                            ) : (
                                <><Send className="w-4 h-4" /> {isEditMode ? 'ویرایش آگهی' : 'ثبت نهایی آگهی'}</>
                            )}
                        </button>
                    )}
                </div>
            </main>


        </div>
    );
}