// app/ad/AdForm.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    useCreateAd, useActiveBusiness, useCreditBalance,
    useUploadFile, useAd, useUpdateAd
} from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    Package, Send, Edit2, MapPin, Clock,
    ArrowLeft, ArrowRight, TrendingUp, Plus, Check,
    Settings, Layers, ClipboardCheck, CreditCard, AlertTriangle, FileText, Pencil,
    Info, Wallet, Lock, Star, X,
} from 'lucide-react';
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

function getCategoryConstraintsFromTree(categoryId: string, categoryTree: any[]): QuantityConstraints {
    const findNodeInTree = (nodes: any[], id: string): any => {
        for (const node of nodes) {
            if (node.id === id || node.categoryId === id) return node;
            if (node.children) {
                const found = findNodeInTree(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const node = findNodeInTree(categoryTree, categoryId);
    if (node) {
        return {
            min: node.minQuantityOverride ?? null,
            max: node.maxQuantityOverride ?? null,
        };
    }
    return { min: null, max: null };
}

function getAvailableUnits(categoryId: string, categoryTree: any[]): UnitOption[] {
    const findNodeInTree = (nodes: any[], id: string): any => {
        for (const node of nodes) {
            if (node.id === id || node.categoryId === id) return node;
            if (node.children) {
                const found = findNodeInTree(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const node = findNodeInTree(categoryTree, categoryId);
    if (node && (node.overrideUnitId || node.alternativeUnits?.length > 0)) {
        const units: UnitOption[] = [];

        if (node.overrideUnitId) {
            units.push({
                unitId: node.overrideUnitId,
                unitTitle: node.overrideUnitTitle || '',
                unitShortCode: node.overrideUnitShortCode || '',
                isVariableQty: node.overrideUnitIsVariableQty === true,
                qty: node.overrideUnitQty ?? null,
                isDefault: true,
            });
        }

        (node.alternativeUnits || []).forEach((au: any) => {
            if (au.unitId && au.isActive !== false) {
                units.push({
                    unitId: au.unitId,
                    unitTitle: au.unitTitle || '',
                    unitShortCode: au.unitShortCode || '',
                    isVariableQty: au.isVariableQty === true,
                    qty: au.qty ?? null,
                    isDefault: false,
                });
            }
        });

        return units;
    }
    return [];
}

function findCategoryPathInTree(tree: any[], categoryId: string): string[] {
    function search(nodes: any[], path: string[]): string[] | null {
        for (const node of nodes) {
            const currentPath = [...path, node.id || node.categoryId];
            if (node.id === categoryId || node.categoryId === categoryId) {
                return currentPath;
            }
            if (node.children && node.children.length > 0) {
                const found = search(node.children, currentPath);
                if (found) return found;
            }
        }
        return null;
    }
    return search(tree, []) || [];
}

export function AdForm({ adId, onSuccess }: AdFormProps) {
    const router = useRouter();
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const { data: business, isLoading: businessLoading } = useActiveBusiness();
    const { data: creditBalance, refetch: refetchBalance, isLoading: creditLoading } = useCreditBalance();
    const { data: existingAd, isLoading: adLoading } = useAd(adId || '');
    const uploadMutation = useUploadFile();
    const deleteFileMutation = useDeleteFile();

    const isEditMode = !!adId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [showCategorySelector, setShowCategorySelector] = useState(false);

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

    const categoryTree = useMemo(
        () => (Array.isArray(currentArm?.categoryTree) ? currentArm.categoryTree : []),
        [currentArm?.categoryTree]
    );

    const maxActiveAdsPerUser = useMemo(() => priceTable.maxActiveAdsPerUser ?? 5, [priceTable.maxActiveAdsPerUser]);
    const maxTotalFreeAdPerUser = useMemo(() => priceTable.maxTotalFreeAdPerUser ?? 20, [priceTable.maxTotalFreeAdPerUser]);
    const bumpCost = useMemo(() => priceTable.bumpCost ?? 10, [priceTable.bumpCost]);
    const adCreationCost = useMemo(() => priceTable.adCreationCost ?? 10, [priceTable.adCreationCost]);
    const extraActiveAdCostPerDay = useMemo(() => priceTable.extraActiveAdCost ?? 2, [priceTable.extraActiveAdCost]);
    const allowAnonymousPublishing = useMemo(() => priceTable.allowAnonymousPublishing ?? true, [priceTable.allowAnonymousPublishing]);
    const adValidityDefaultHours = useMemo(() => priceTable.adValidityDefaultHours ?? 24, [priceTable.adValidityDefaultHours]);
    const maxImagesPerAd = useMemo(() => priceTable.maxImagesPerAd ?? 1, [priceTable.maxImagesPerAd]);

    const validityOptions = useMemo(() => {
        const configValidity = adValidityDefaultHours;
        const defaultOptions = [
            { value: '24', label: '۱ روز' },
            { value: '48', label: '۲ روز' },
            { value: '72', label: '۳ روز' },
            { value: '168', label: '۵ روز' },
            { value: '240', label: '۱۰ روز' },
        ];
        if (configValidity && !defaultOptions.some(opt => opt.value === String(configValidity))) {
            defaultOptions.unshift({
                value: String(configValidity),
                label: `${configValidity} ساعت`,
            });
        }
        return defaultOptions;
    }, [adValidityDefaultHours]);

    const [formData, setFormData] = useState({
        categoryId: '',
        productType: '',
        singleUnitPrice: 0,
        unitPrice: 0,
        consumerPrice: 0,
        minQuantity: 0,
        availableQuantity: 0,
        cityCode: '',
        cityLabel: '',
        provinceCode: '',
        provinceLabel: '',
        validityHours: String(adValidityDefaultHours || validityOptions[0]?.value || '24'),
        isAnonymous: false,
        isBumped: false,
        description: '',
        unitId: '',
        unitTitle: '',
        unitQty: null as number | null,
        unitIsVariableQty: false,
        isEditingQty: false,
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
    const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([]);
    const [activeAdsCount, setActiveAdsCount] = useState(0);
    const [totalAdsCount, setTotalAdsCount] = useState(0);
    const [loadingAdsCounts, setLoadingAdsCounts] = useState(true);

    // ═══════════════════════════════════════
    // محاسبات نردبان (Bump)
    // ═══════════════════════════════════════
    const bumpOptions = useMemo(() => {
        const maxHours = parseInt(formData.validityHours) || 24;
        const options = [24, 48, 72];
        const validOptions = options.filter(h => h <= maxHours);
        if (validOptions.length === 0) {
            validOptions.push(maxHours);
        }
        if (maxHours > 72) {
            for (let h = 96; h <= maxHours; h += 24) {
                validOptions.push(h);
            }
        }
        return validOptions;
    }, [formData.validityHours]);

    const totalBumpCost = useMemo(() => {
        if (!formData.isBumped) return 0;
        const costPer24Hours = bumpCost || 10;
        const hours = bumpDurationHours || 24;
        return Math.round((hours / 24) * costPer24Hours);
    }, [formData.isBumped, bumpDurationHours, bumpCost]);

    useEffect(() => {
        if (formData.isBumped) {
            const maxAllowed = parseInt(formData.validityHours);
            if (maxAllowed && (!bumpDurationHours || bumpDurationHours > maxAllowed)) {
                setBumpDurationHours(maxAllowed);
            }
        }
    }, [formData.isBumped, formData.validityHours]);

    const findNodeById = (nodes: any[], id: string): any => {
        for (const node of nodes) {
            if (node.id === id || node.categoryId === id) return node;
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

    const unitName = formData.unitTitle || selectedCategoryData?.overrideUnitTitle || 'تن';
    const baseUnitTitle = selectedCategoryData?.baseUnitTitle || 'واحد';

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

    // ═══════════════════════════════════════
    // شمارش آگهی‌های کسب‌وکار
    // ═══════════════════════════════════════
    useEffect(() => {
        const fetchCounts = async () => {
            if (!business || !currentSlug) {
                setLoadingAdsCounts(false);
                return;
            }
            try {
                const now = new Date();
                const allBusinessAds = business.ads || [];
                const armAds = allBusinessAds.filter((ad: any) => ad.armId === currentArm?.id);

                const activeAds = armAds.filter(
                    (ad: any) => ad.status === 'active' && new Date(ad.expiresAt) > now
                );
                const totalAds = armAds.filter(
                    (ad: any) => ad.status !== 'deleted'
                );

                setActiveAdsCount(activeAds.length);
                setTotalAdsCount(totalAds.length);
            } catch {
                setActiveAdsCount(0);
                setTotalAdsCount(0);
            } finally {
                setLoadingAdsCounts(false);
            }
        };
        fetchCounts();
    }, [business, currentSlug, currentArm]);

    const isLoading = businessLoading || creditLoading || (isEditMode && adLoading) || loadingAdsCounts;

    // ═══════════════════════════════════════
    // محاسبه سهمیه‌ها و هزینه‌ها
    // ═══════════════════════════════════════
    const remainingActiveSlots = Math.max(0, maxActiveAdsPerUser - activeAdsCount);
    const remainingTotalSlots = Math.max(0, maxTotalFreeAdPerUser - totalAdsCount);

    const hasReachedActiveLimit = !isEditMode && activeAdsCount >= maxActiveAdsPerUser;
    const hasReachedTotalLimit = !isEditMode && totalAdsCount >= maxTotalFreeAdPerUser;

    const isAdFree = remainingActiveSlots > 0 && remainingTotalSlots > 0;

    // هزینه ثبت آگهی اضافه
    const totalCreationCost = useMemo(() => {
        if (isEditMode) return 0;
        let cost = 0;
        if (hasReachedActiveLimit) {
            const days = Math.max(1, Math.ceil(parseInt(formData.validityHours) / 24));
            cost += extraActiveAdCostPerDay * days;
        }
        if (hasReachedTotalLimit) cost += adCreationCost;
        return cost;
    }, [isEditMode, hasReachedActiveLimit, hasReachedTotalLimit, extraActiveAdCostPerDay, adCreationCost, formData.validityHours]);

    const totalCostWithBump = totalCreationCost + (formData.isBumped ? totalBumpCost : 0);

    const needsCredit = totalCreationCost > 0;
    const insufficientCredit = needsCredit && (creditBalance?.balance ?? 0) < totalCostWithBump;

    const isBumpActive = isEditMode && existingAd?.isBumped && existingAd?.bumpExpiresAt && new Date(existingAd.bumpExpiresAt) > new Date();
    const bumpExpiresAtLabel = existingAd?.bumpExpiresAt ? new Date(existingAd.bumpExpiresAt).toLocaleDateString('fa-IR') : '';

    const stepMeta = useMemo(() => {
        if (isEditMode) {
            return [
                { title: 'گروه', icon: Layers },
                { title: 'قیمت', icon: Package },
                { title: 'موقعیت', icon: MapPin },
                { title: 'انتشار', icon: Settings },
                { title: 'جزئیات', icon: CreditCard },
                { title: 'بررسی', icon: ClipboardCheck },
            ];
        }
        return BASE_STEPS;
    }, [isEditMode]);

    const TOTAL_STEPS = stepMeta.length;

    const [categoryConstraints, setCategoryConstraints] = useState<QuantityConstraints>({ min: null, max: null });

    // ✅ وقتی کتگوری تغییر میکنه
    useEffect(() => {
        if (formData.categoryId && categoryTree) {
            const constraints = getCategoryConstraintsFromTree(formData.categoryId, categoryTree);
            setCategoryConstraints(constraints);

            const units = getAvailableUnits(formData.categoryId, categoryTree);
            setAvailableUnits(units);

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
            }
        } else {
            setCategoryConstraints({ min: null, max: null });
            setAvailableUnits([]);
        }
    }, [formData.categoryId, categoryTree]);

    const recalculateUnitPrice = (singlePrice: number, qty: number | null) => {
        if (singlePrice > 0 && qty) {
            return Math.round(singlePrice * qty);
        }
        return 0;
    };

    const handleSingleUnitPriceChange = (value: number) => {
        const calculated = recalculateUnitPrice(value, formData.unitQty);
        setFormData(prev => ({
            ...prev,
            singleUnitPrice: value,
            unitPrice: calculated,
        }));
    };

    const handleUnitPriceChange = (value: number) => {
        const qty = formData.unitQty || 1;
        const calculatedSingle = qty > 0 ? Math.round(value / qty) : 0;
        setFormData(prev => ({
            ...prev,
            unitPrice: value,
            singleUnitPrice: calculatedSingle,
        }));
    };

    const handleUnitQtyChange = (value: number | null) => {
        const calculated = recalculateUnitPrice(formData.singleUnitPrice, value);
        setFormData(prev => ({
            ...prev,
            unitQty: value,
            unitPrice: calculated,
        }));
    };

    // ✅ اگر validityHours خالی است یا در لیست نیست
    useEffect(() => {
        if (!formData.validityHours || !validityOptions.some(opt => opt.value === formData.validityHours)) {
            const defaultValidity = validityOptions[0]?.value || '24';
            setFormData(prev => ({
                ...prev,
                validityHours: defaultValidity,
            }));
        }
    }, [validityOptions]);

    // ✅ لود داده‌های آگهی در حالت ویرایش
    useEffect(() => {
        if (isEditMode && existingAd) {
            setFormData({
                categoryId: existingAd.categoryId || '',
                productType: existingAd.productType || '',
                singleUnitPrice: existingAd.singleUnitPrice || 0,
                unitPrice: existingAd.unitPrice || 0,
                consumerPrice: existingAd.consumerPrice || 0,
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
                isEditingQty: false,
            });

            if (existingAd.paymentMethods) {
                const hasCheque = Array.isArray(existingAd.paymentMethods.cheque) && existingAd.paymentMethods.cheque.length > 0;
                const hasInstallment = Array.isArray(existingAd.paymentMethods.installment) && existingAd.paymentMethods.installment.length > 0;
                const hasDescription = existingAd.paymentMethods.description && existingAd.paymentMethods.description.trim().length > 0;

                setPaymentMethods({
                    enabled: hasCheque || hasInstallment || hasDescription,
                    description: existingAd.paymentMethods.description || '',
                    cheque: {
                        enabled: hasCheque,
                        description: existingAd.paymentMethods.chequeDescription || '',
                        options: hasCheque ? existingAd.paymentMethods.cheque : [],
                    },
                    installment: {
                        enabled: hasInstallment,
                        description: existingAd.paymentMethods.installmentDescription || '',
                        options: hasInstallment ? existingAd.paymentMethods.installment : [],
                    },
                });
            }

            if (existingAd.specs && Object.keys(existingAd.specs).length > 0) {
                setSpecs(existingAd.specs);
                setSpecsEnabled(true);
            }

            const images = (existingAd.files || [])
                .filter((f: any) => f.fieldKey?.startsWith('ad-image'))
                .sort((a: any, b: any) => parseInt(a.fieldKey.split('-')[2] || '0') - parseInt(b.fieldKey.split('-')[2] || '0'));
            setAdImageFiles(images.map((img: any) => ({ id: img.id })));

            if (existingAd.isBumped) {
                setBumpDurationHours(existingAd.bumpDurationHours || 24);
            }

            setShowCategorySelector(false);
        }
    }, [isEditMode, existingAd]);

    // ✅ ست کردن شهر از بیزینس در حالت ایجاد
    useEffect(() => {
        if (isEditMode) return;

        if (hasSingleCity && singleCityData) {
            setFormData(prev => ({
                ...prev,
                cityCode: singleCityData.city.cityCode || singleCityData.city.id || singleCityData.city.code,
                cityLabel: singleCityData.city.title,
                provinceCode: singleCityData.province.provinceCode || singleCityData.province.id || singleCityData.province.code,
                provinceLabel: singleCityData.province.title,
            }));
        } else if (business?.cityCode && !hasSingleCity) {
            setFormData(prev => ({
                ...prev,
                cityCode: business.cityCode || '',
                cityLabel: business.city || '',
                provinceCode: business.provinceCode || '',
                provinceLabel: business.province || '',
            }));
        }
    }, [business, hasSingleCity, singleCityData, isEditMode]);

    useEffect(() => {
        if (!isEditMode && adImageFiles.length === 0) {
            setAdImageFiles([{}]);
        }
    }, [isEditMode]);

    const uploadedCount = useMemo(() => adImageFiles.filter(s => s.id || s.file).length, [adImageFiles]);

    const validateStep = (step: number): boolean => {
        const errors: string[] = [];
        if (step === 1) {
            if (uploadedCount === 0) errors.push('تصویر آگهی را آپلود نکردی.');
            if (!formData.categoryId) errors.push('دسته‌بندی کالا را انتخاب کنید.');
            if (selectedCategoryData && !formData.productType.trim()) errors.push('عنوان کالا را وارد کنید.');
        } else if (step === 2) {
            if (formData.minQuantity <= 0) errors.push('حداقل حجم فروش را وارد کنید.');
            if (formData.unitPrice <= 0) errors.push('قیمت واحد را وارد کنید.');
            if (formData.availableQuantity <= 0) errors.push('موجودی تضمینی انبار را وارد کنید.');
            if (formData.minQuantity > formData.availableQuantity) {
                errors.push('حداقل حجم فروش نمی‌تواند از موجودی بیشتر باشد.');
            }
            if (categoryConstraints.min !== null && formData.minQuantity < categoryConstraints.min) {
                errors.push(`حداقل حجم فروش نمی‌تواند کمتر از ${categoryConstraints.min.toLocaleString()} ${unitName} باشد.`);
            }
            if (categoryConstraints.max !== null && formData.minQuantity > categoryConstraints.max) {
                errors.push(`حداقل حجم فروش نمی‌تواند بیشتر از ${categoryConstraints.max.toLocaleString()} ${unitName} باشد.`);
            }
            if (formData.consumerPrice > 0 && formData.singleUnitPrice > 0 &&
                formData.consumerPrice < formData.singleUnitPrice) {
                errors.push('قیمت مصرف‌کننده نمی‌تواند از قیمت عمده کمتر باشد.');
            }
        } else if (step === 3) {
            if (!formData.cityCode && !hasSingleCity) {
                errors.push('محل کالا را انتخاب کنید.');
            }
            if (!formData.validityHours) {
                errors.push('مدت اعتبار قیمت را انتخاب کنید.');
            }
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
            return isEditMode ? updated : (updated.length === 0 ? [{}] : updated);
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

    const handleSubmit = async () => {
        if (currentStep !== TOTAL_STEPS) return;
        if (isSubmitting) return;

        for (let s = 1; s <= 3; s++) {
            if (!validateStep(s)) {
                setCurrentStep(s);
                return;
            }
        }

        // بررسی اعتبار کافی برای هزینه‌ها (فقط در حالت ایجاد)
        // بررسی اعتبار کافی برای هزینه‌ها (فقط در حالت ایجاد)
        if (!isEditMode) {
            const balance = creditBalance?.balance ?? 0;
            const needed = totalCostWithBump;

            if (needed > balance && formData.isBumped) {
                // ✅ کاربر اعتبار کافی برای نردبان ندارد
                toast.warning('اعتبار شما برای نردبان کافی نیست. آگهی به‌صورت عادی ثبت می‌شود.');
                setFormData(prev => ({ ...prev, isBumped: false }));
            } else if (needed > balance) {
                toast.error(`اعتبار کافی نیست. نیاز به ${needed} اعتبار دارید.`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            let uploadedIds: string[] = [];
            const filesToUpload = adImageFiles.filter(slot => slot.file).map(slot => slot.file!);
            if (filesToUpload.length > 0) {
                const uploadPromises = filesToUpload.map((file, index) =>
                    uploadMutation.mutateAsync({
                        file,
                        model: 'Ad',
                        modelId: 'temp',
                        fieldKey: `ad-image-${index}`,
                    }).then(res => res.id)
                );
                uploadedIds = await Promise.all(uploadPromises);
            }

            const title = formData.productType
                ? `${selectedCategoryData?.title || ''} ${formData.productType}`
                : selectedCategoryData?.title || '';

            const paymentData = paymentMethods.enabled ? {
                description: paymentMethods.description || '',
                cheque: paymentMethods.cheque.enabled ? paymentMethods.cheque.options : [],
                chequeDescription: paymentMethods.cheque.description || '',
                installment: paymentMethods.installment.enabled ? paymentMethods.installment.options : [],
                installmentDescription: paymentMethods.installment.description || '',
            } : null;

            const specsData = Object.keys(specs).length > 0 ? specs : null;

            let ad;
            if (isEditMode) {
                ad = await updateAdMutation.mutateAsync({
                    id: adId,
                    data: {
                        categoryId: formData.categoryId,
                        unitId: formData.unitId,
                        title,
                        productType: formData.productType,
                        unitPrice: formData.unitPrice,
                        singleUnitPrice: formData.singleUnitPrice || null,
                        consumerPrice: formData.consumerPrice || null,
                        minQuantity: formData.minQuantity,
                        availableQuantity: formData.availableQuantity,
                        city: formData.cityLabel,
                        cityCode: formData.cityCode,
                        provinceCode: formData.provinceCode,
                        validityHours: parseInt(formData.validityHours),
                        isAnonymous: formData.isAnonymous,
                        description: formData.description,
                        unitQty: formData.unitQty,
                        unitIsVariableQty: formData.unitIsVariableQty,
                        paymentMethods: paymentData,
                        specs: specsData,
                    },
                });
                toast.success('آگهی ویرایش شد');
            } else {
                ad = await createAdMutation.mutateAsync({
                    armSlug: currentSlug || 'barton',
                    categoryId: formData.categoryId,
                    unitId: formData.unitId,
                    title,
                    productType: formData.productType,
                    unitPrice: formData.unitPrice,
                    singleUnitPrice: formData.singleUnitPrice || null,
                    consumerPrice: formData.consumerPrice || null,
                    minQuantity: formData.minQuantity,
                    availableQuantity: formData.availableQuantity,
                    city: formData.cityLabel,
                    cityCode: formData.cityCode,
                    provinceCode: formData.provinceCode,
                    locationDetail: '',
                    validityHours: parseInt(formData.validityHours),
                    isAnonymous: formData.isAnonymous,
                    isBumped: formData.isBumped,
                    description: formData.description,
                    unitQty: formData.unitQty,
                    unitIsVariableQty: formData.unitIsVariableQty,

                });
                toast.success('آگهی ثبت شد');
            }

            if (uploadedIds.length > 0 && ad?.id) {
                await Promise.all(uploadedIds.map(fileId => apiService.file.updateRelatedId(fileId, ad.id)));
            }

            await refetchBalance();
            onSuccess?.();
            router.push('/profile');
        } catch (error: any) {
            toast.error(error?.message || 'خطا');
        } finally {
            setIsSubmitting(false);
        }
    };



    if (isLoading || !business) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-surface pb-28">
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
                                        isActive && "bg-primary text-white border-primary ring-4 ring-primary/20 scale-110 shadow-lg",
                                        isDone && "bg-emerald-500 text-white border-emerald-500",
                                        !isActive && !isDone && "bg-surface-container-high text-on-surface-variant border-outline-variant/50",
                                        stepNum > currentStep && "opacity-40"
                                    )}>
                                        {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] sm:text-[11px] mt-2.5",
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
                                            "w-full h-[3px] rounded-full",
                                            isDone ? "bg-emerald-500" : "bg-outline-variant/20"
                                        )} />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="space-y-5">
                    {/* ═══════════════ مرحله ۱: گروه ═══════════════ */}
                    {currentStep === 1 && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                            {isEditMode && !showCategorySelector && selectedCategoryData ? (
                                <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm space-y-3">
                                    <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Layers className="w-3.5 h-3.5 text-primary" />
                                        </span>
                                        دسته‌بندی
                                    </label>
                                    <div className="flex items-center justify-between p-3.5 bg-surface-container-low border border-outline-variant/40 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-medium">{selectedCategoryData.title}</span>
                                            {selectedCategoryData.customCode && (
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                                    {selectedCategoryData.customCode}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowCategorySelector(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors text-xs font-medium"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            تغییر دسته‌بندی
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <CategoryGridSelector
                                        categoryTree={categoryTree || []}
                                        selectedCategoryId={formData.categoryId}
                                        onSelect={(categoryId) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                categoryId,
                                                minQuantity: 0,
                                                unitPrice: 0,
                                                singleUnitPrice: 0,
                                                consumerPrice: 0,
                                                unitId: '',
                                                unitTitle: '',
                                                unitQty: null,
                                            }));
                                            if (isEditMode) {
                                                setShowCategorySelector(false);
                                            }
                                        }}
                                    />
                                    {isEditMode && showCategorySelector && (
                                        <button
                                            type="button"
                                            onClick={() => setShowCategorySelector(false)}
                                            className="w-full h-11 rounded-xl border-2 border-outline-variant/40 text-sm text-on-surface-variant hover:bg-surface-container-lowest"
                                        >
                                            انصراف
                                        </button>
                                    )}
                                </>
                            )}

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
                                        placeholder="عنوان کوتاه کالا را وارد کنید."
                                        className="w-full h-12 bg-surface-container-lowest border border-outline/60 px-4 text-sm text-right rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            )}

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
                                            const isEditingQty = isSelected && unit.isVariableQty && formData.isEditingQty;
                                            return (
                                                <div key={idx} className={cn(
                                                    "rounded-xl border transition-all overflow-hidden",
                                                    isSelected ? "border-primary bg-primary/5" : "border-outline-variant/20 hover:border-primary/30"
                                                )}>
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                unitId: unit.unitId,
                                                                unitTitle: unit.unitTitle,
                                                                unitQty: unit.qty,
                                                                unitIsVariableQty: unit.isVariableQty,
                                                                isEditingQty: false,
                                                            }));
                                                            if (formData.singleUnitPrice > 0 && unit.qty) {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    unitPrice: Math.round(formData.singleUnitPrice * unit.qty),
                                                                }));
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                e.currentTarget.click();
                                                            }
                                                        }}
                                                        className="w-full text-right px-4 py-3 flex items-center justify-between gap-2 cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <div className={cn(
                                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                                                isSelected ? "border-primary bg-primary" : "border-outline-variant/40"
                                                            )}>
                                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <span className="font-medium text-sm truncate">{unit.unitTitle}</span>
                                                            {unit.isDefault && (
                                                                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">پیش‌فرض</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            {formData.unitQty != null && isSelected && (
                                                                <span className="text-[11px] text-on-surface-variant bg-surface-container-high/80 px-2 py-1 rounded-lg">
                                                                    {formData.unitQty.toLocaleString()} {baseUnitTitle}
                                                                </span>
                                                            )}
                                                            {isSelected && unit.isVariableQty && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFormData(prev => ({ ...prev, isEditingQty: !prev.isEditingQty }));
                                                                    }}
                                                                    className="p-1.5 hover:bg-primary/10 rounded-lg"
                                                                    title={`ویرایش تعداد ${baseUnitTitle} در هر ${unit.unitTitle}`}
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isEditingQty && (
                                                        <div className="px-4 pb-3 pt-1 border-t border-primary/10 bg-primary/5">
                                                            <NumberInput
                                                                value={formData.unitQty || undefined}
                                                                onChange={(val) => handleUnitQtyChange(val || null)}
                                                                placeholder={`مثلاً ${unit.qty || 24}`}
                                                                className="h-10"
                                                                autoFocus
                                                            />
                                                            <p className="text-[10px] text-on-surface-variant/50 mt-1.5">
                                                                💡 تعداد {baseUnitTitle} در هر {unit.unitTitle}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {(selectedCategoryData && maxImagesPerAd > 0) && (
                                <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm space-y-3">
                                    <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                                            </svg>
                                        </span>
                                        تصویر محصول
                                        <span className="text-error text-xs">*</span>
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
                                                className="w-20 h-20 border-2 border-dashed border-outline-variant/40 rounded-xl flex flex-col items-center justify-center text-on-surface-variant/40 hover:border-primary/50 hover:text-primary/60"
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

                    {/* ═══════════════ مرحله ۲: قیمت ═══════════════ */}
                    {currentStep === 2 && selectedCategoryData && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4">
                                <div className="flex items-center gap-2 text-primary">
                                    <Package className="w-5 h-5" />
                                    <h3 className="font-bold text-sm">تعیین قیمت عمده</h3>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-outline-variant/40 shadow-sm space-y-2.5">
                                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black">۱</span>
                                    حداقل حجم فروش ({unitName})
                                    {categoryConstraints.min && categoryConstraints.max
                                        ? ` بین ${categoryConstraints.min.toLocaleString()} تا ${categoryConstraints.max.toLocaleString()}`
                                        : categoryConstraints.min
                                            ? ` حداقل ${categoryConstraints.min.toLocaleString()}`
                                            : categoryConstraints.max
                                                ? ` حداکثر ${categoryConstraints.max.toLocaleString()}`
                                                : ``}
                                    <span className="text-error text-xs">*</span>
                                </label>
                                <NumberInput
                                    value={formData.minQuantity || undefined}
                                    onChange={(val) => setFormData(prev => ({ ...prev, minQuantity: val || 0 }))}
                                    unit={unitName}
                                    className="w-full h-14 font-extrabold"
                                />
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-outline-variant/40 shadow-sm space-y-2.5">
                                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">۲</span>
                                    قیمت تکی (هر {baseUnitTitle})
                                    <span className="text-error text-xs">*</span>
                                </label>
                                <p className="text-[10px] text-gray-400">
                                    {formData.minQuantity > 0
                                        ? `قیمت عمده هر ${baseUnitTitle} برای خرید ${formData.minQuantity.toLocaleString('fa-IR')} ${unitName}`
                                        : `قیمت عمده هر ${baseUnitTitle} را وارد کنید`}
                                </p>
                                <NumberInput
                                    value={formData.singleUnitPrice || undefined}
                                    onChange={handleSingleUnitPriceChange}
                                    unit={`${currencyUnit}/${baseUnitTitle}`}
                                    //placeholder={`قیمت عمده هر ${baseUnitTitle}`}
                                    className="w-full h-12"
                                />
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-primary/30 ring-1 ring-primary/10 shadow-sm space-y-2.5">
                                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center text-[10px] font-black">۳</span>
                                    قیمت هر {unitName} (واحد فروش عمده)
                                    <span className="text-error text-xs">*</span>
                                </label>
                                <NumberInput
                                    value={formData.unitPrice || undefined}
                                    onChange={handleUnitPriceChange}
                                    unit={currencyUnit}
                                    className="w-full h-14 text-xl font-extrabold"
                                />
                                {formData.singleUnitPrice > 0 && formData.unitQty && (
                                    <p className="text-[11px] text-primary/80 bg-primary/5 rounded-lg px-3 py-2">
                                        💡 {formData.singleUnitPrice.toLocaleString('fa-IR')} × {formData.unitQty.toLocaleString('fa-IR')} {baseUnitTitle} = {formData.unitPrice.toLocaleString('fa-IR')} {currencyUnit}
                                    </p>
                                )}
                                {formData.unitQty && !formData.singleUnitPrice && (
                                    <p className="text-[10px] text-gray-400">
                                        {formData.unitQty.toLocaleString('fa-IR')} {baseUnitTitle} در هر {unitName}
                                    </p>
                                )}
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-outline-variant/40 shadow-sm space-y-2.5">
                                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">۴</span>
                                    موجودی تضمینی انبار ({unitName})
                                    <span className="text-error text-xs">*</span>
                                </label>
                                <NumberInput
                                    value={formData.availableQuantity || undefined}
                                    onChange={(val) => setFormData(prev => ({ ...prev, availableQuantity: val || 0 }))}
                                    unit={unitName}
                                    className="w-full h-12"
                                    //placeholder="موجودی تضمینی را وارد کنید"
                                />
                            </div>

                            <div className="bg-white rounded-2xl p-4 border border-outline-variant/40 shadow-sm space-y-2.5">
                                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-black">۵</span>
                                    قیمت تکی برای مصرف‌کننده (اختیاری)
                                </label>
                                <p className="text-[10px] text-gray-400">
                                    قیمتی که مصرف‌کننده نهایی در خرده‌فروشی پرداخت می‌کند — برای محاسبه سود خریدار عمده
                                </p>
                                <NumberInput
                                    value={formData.consumerPrice || undefined}
                                    onChange={(val) => setFormData(prev => ({ ...prev, consumerPrice: val || 0 }))}
                                    unit={`${currencyUnit}/${baseUnitTitle}`}
                                    //placeholder={`مثلاً قیمت هر ${baseUnitTitle} برای مصرف‌کننده`}
                                    className="w-full h-12"
                                />
                                {formData.consumerPrice > 0 && formData.singleUnitPrice > 0 && (
                                    <>
                                        {formData.consumerPrice < formData.singleUnitPrice ? (
                                            <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                                ⚠️ قیمت مصرف‌کننده از قیمت عمده کمتر است!
                                                ({formData.consumerPrice.toLocaleString('fa-IR')} {'<'} {formData.singleUnitPrice.toLocaleString('fa-IR')})
                                            </p>
                                        ) : (
                                            <p className="text-[11px] text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                                                💰 سود خرده فروش یا خریدار عمده از هر {baseUnitTitle}: {(formData.consumerPrice - formData.singleUnitPrice).toLocaleString('fa-IR')} {currencyUnit}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════ مرحله ۳: موقعیت ═══════════════ */}
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
                                    <div className="flex items-center gap-2.5 p-3.5 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm">
                                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                        <span>{singleCityData?.city.title}</span>
                                    </div>
                                ) : (
                                    <ArmLocationSelector
                                        provinceCode={formData.provinceCode}
                                        cityCode={formData.cityCode}
                                        onProvinceChange={(code, label) =>
                                            setFormData(prev => ({ ...prev, provinceCode: code, provinceLabel: label, cityCode: '', cityLabel: '' }))
                                        }
                                        onCityChange={(code, label) =>
                                            setFormData(prev => ({ ...prev, cityCode: code, cityLabel: label }))
                                        }
                                    />
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-2xl border border-outline-variant/40 shadow-sm space-y-2.5">
                                <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                                    </span>
                                    توضیحات
                                    <span className="text-xs text-on-surface-variant/60">(اختیاری)</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    placeholder="توضیحات تکمیلی"
                                    className="w-full border border-outline/60 px-4 py-3 rounded-xl resize-none outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

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
                                                    : "border-outline-variant/40 hover:border-primary/30"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-on-surface-variant">
                                    آگهی شما تا {formData.validityHours} ساعت روی تابلو می‌ماند.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════ مرحله ۴: انتشار ═══════════════ */}
                    {currentStep === 4 && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {/* ✅ نمایش هزینه‌ها اگر وجود داشته باشد */}
                            {!isEditMode && needsCredit && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-amber-800">
                                        <Info className="w-4 h-4" />
                                        <span className="text-xs font-bold">هزینه‌های این آگهی</span>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        {hasReachedActiveLimit && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-amber-700">آگهی اضافه روی تابلو (روز):</span>
                                                <span className="font-bold">{extraActiveAdCostPerDay.toLocaleString('fa-IR')} اعتبار</span>
                                            </div>
                                        )}
                                        {hasReachedTotalLimit && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-amber-700">آگهی اضافه (بیش از سهمیه کل، ماهیانه):</span>
                                                <span className="font-bold">{adCreationCost.toLocaleString('fa-IR')} اعتبار</span>
                                            </div>
                                        )}
                                        {formData.isBumped && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-amber-700">نردبان:</span>
                                                <span className="font-bold">{totalBumpCost.toLocaleString('fa-IR')} اعتبار</span>
                                            </div>
                                        )}
                                        <div className="border-t border-amber-200 pt-2 flex items-center justify-between">
                                            <span className="text-amber-800 font-bold">مجموع:</span>
                                            <span className="font-extrabold text-amber-900">{totalCostWithBump.toLocaleString('fa-IR')} اعتبار</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-amber-600">موجودی فعلی:</span>
                                            <span className={cn(
                                                "font-bold",
                                                (creditBalance?.balance ?? 0) >= totalCostWithBump ? 'text-emerald-600' : 'text-red-600'
                                            )}>
                                                {creditBalance?.balance ?? 0} اعتبار
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* نردبان */}
                            <div className="bg-white rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
                                {isBumpActive ? (
                                    <div className="p-4 bg-blue-50/50 border-blue-200/60 text-blue-700">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <span className="text-sm font-bold block">نردبان فعال است</span>
                                                <span className="text-xs text-blue-600/70">
                                                    این آگهی تا تاریخ <span className="font-medium">{bumpExpiresAtLabel}</span> در حال نردبان است.
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
                                                           const willEnable = e.target.checked;
                                                           setFormData(prev => ({ ...prev, isBumped: willEnable }));
                                                           if (willEnable) {
                                                               const maxAllowed = parseInt(formData.validityHours);
                                                               setBumpDurationHours(maxAllowed);

                                                               // ✅ بررسی اعتبار کافی
                                                               const totalCost = totalCreationCost + (bumpCost * (maxAllowed / 24));
                                                               const currentBalance = creditBalance?.balance ?? 0;

                                                               if (currentBalance < totalCost) {
                                                                   toast.warning(
                                                                       'اعتبار شما برای نردبان کردن کافی نیست. فعلاً می‌توانید آگهی را به‌صورت عادی ثبت کنید، سپس با خرید اعتبار از قسمت ویرایش آن را نردبان کنید.',
                                                                       { duration: 6000 }
                                                                   );
                                                                   // ✅ تیک نردبان را بردار
                                                                   setFormData(prev => ({ ...prev, isBumped: false }));
                                                               } else {
                                                                   toast.info(`نردبان فعال شد. مدت: ${maxAllowed} ساعت، هزینه: ${totalBumpCost} اعتبار`, { duration: 4000 });
                                                               }
                                                           }
                                                       }}

                                                       className="sr-only peer" />
                                                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer
                                                    after:content-[''] after:absolute after:top-[3px] after:right-[3px]
                                                    after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all after:shadow-sm
                                                    peer-checked:bg-primary peer-checked:after:-translate-x-full" />
                                            </label>
                                        </div>
                                        {formData.isBumped && bumpOptions.length > 1 && (
                                            <div className="p-4 bg-amber-50/20 border-t border-amber-200/10">
                                                <label className="text-xs font-medium text-on-surface-variant mb-2 block">مدت زمان نردبان:</label>
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
                                            </div>
                                        )}
                                        {formData.isBumped && (
                                            <div className="mx-4 mb-4 bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex items-start gap-2.5">
                                                <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                <div className="text-xs text-amber-800/80 space-y-1">
                                                    <p><span className="font-bold">{totalBumpCost}</span> اعتبار از حساب شما کسر خواهد شد.</p>
                                                    {creditBalance && (creditBalance.balance < totalBumpCost) && (
                                                        <p className="text-red-600 font-bold">
                                                            ⚠️ اعتبار شما برای نردبان کافی نیست. می‌توانید آگهی را عادی ثبت کنید و بعداً از بخش ویرایش نردبان کنید.
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
                                {remainingActiveSlots > 0 && remainingTotalSlots > 0 && !isEditMode && (
                                    <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50/50 px-3 py-1.5 rounded-lg border border-emerald-200/50">
                                        <span className="text-[10px] font-medium">🎁 {Math.min(remainingActiveSlots, remainingTotalSlots)} آگهی رایگان باقیمانده</span>
                                    </div>
                                )}
                                {hasReachedActiveLimit && (
                                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50/50 px-3 py-1.5 rounded-lg border border-amber-200/50">
                                        <span className="text-[10px] font-medium">
                                            ⚠️ سهمیه آگهی فعال پر است. هر آگهی جدید {extraActiveAdCostPerDay.toLocaleString('fa-IR')} اعتبار در ماه مصرف می‌کند.
                                        </span>
                                    </div>
                                )}
                                {hasReachedTotalLimit && !hasReachedActiveLimit && (
                                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50/50 px-3 py-1.5 rounded-lg border border-amber-200/50">
                                        <span className="text-[10px] font-medium">
                                            ⚠️ سهمیه کل آگهی‌های شما پر شده است. هر آگهی جدید {adCreationCost.toLocaleString('fa-IR')} اعتبار در ماه مصرف می‌کند.
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════ مرحله ۵: جزئیات تکمیلی (فقط ویرایش) ═══════════════ */}
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

                    {/* ═══════════════ مرحله آخر: بررسی نهایی ═══════════════ */}
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

                            {/* خلاصه هزینه‌ها */}
                            {!isEditMode && needsCredit && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-amber-800">
                                        <Info className="w-4 h-4" />
                                        <span className="text-xs font-bold">هزینه‌های این آگهی</span>
                                    </div>
                                    <div className="space-y-1 text-xs text-amber-700">
                                        {hasReachedActiveLimit && <p>• آگهی اضافه روی تابلو: {extraActiveAdCostPerDay.toLocaleString('fa-IR')} اعتبار/ماه</p>}
                                        {hasReachedTotalLimit && <p>• آگهی اضافه (بیش از سهمیه کل): {adCreationCost.toLocaleString('fa-IR')} اعتبار/ماه</p>}
                                        {formData.isBumped && <p>• نردبان: {totalBumpCost.toLocaleString('fa-IR')} اعتبار</p>}
                                        <p className="font-bold text-amber-900 border-t border-amber-200 pt-2">مجموع: {totalCostWithBump.toLocaleString('fa-IR')} اعتبار</p>
                                    </div>
                                </div>
                            )}

                            {/* سایر بخش‌های بررسی */}
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
                                        <span className="font-medium text-on-surface">{selectedCategoryData?.title || '---'}</span>
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
                                    {formData.consumerPrice > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-on-surface-variant">قیمت مصرف‌کننده</span>
                                            <span className="font-medium text-on-surface">{formData.consumerPrice.toLocaleString()} {currencyUnit}</span>
                                        </div>
                                    )}
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