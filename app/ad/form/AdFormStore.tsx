// app/ad/form/AdFormStore.tsx
// ✅ استور ویزارد آگهی — تک‌منبع حقیقت (Context + React Query)
// همهٔ منطق فرم اینجاست؛ کامپوننت‌های مرحله فقط از useAdForm() مصرف می‌کنند.
// دادهٔ سرور با React Query، وضعیت فرم با Context — بدون prop-drilling.

'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { useCreateAd, useUpdateAd, useAd, useUploadFile, useDeleteFile } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import type { ProductValue } from '@/app/components/ProductReferencePicker';
import type { BrandValue } from '@/app/components/BrandPicker';
import { TOTAL_STEPS, MAX_IMAGES } from './constants';
import { findNodeInTree, getAvailableUnits, getCategoryConstraints } from './tree-utils';
import type { AdFormValues, ImageSlot, PaymentState, UnitSettingEntry } from './types';

// ═══ مقدار اولیهٔ فرم ═══
function initialFormValues(): AdFormValues {
    return {
        categoryId: '', productType: '',
        singleUnitPrice: 0, unitPrice: 0,
        consumerPrice: 0,
        minQuantity: 1, availableQuantity: 0,
        cityCode: '', cityLabel: '', provinceCode: '', provinceLabel: '',
        description: '',
        unitId: '', unitTitle: '',
        unitQty: null,
        unitIsVariableQty: false, isEditingQty: false,
        giftPrice: 0,
        volumeTiers: [],
        productReferenceId: '',
        brandId: '',
        validityHours: 72,
    };
}

const initialPayment: PaymentState = {
    chequeOn: false, terms: [], note: '', installment: [], installmentDescription: '',
};

// ═══ چیزی که استور در اختیار کامپوننت‌ها می‌گذارد ═══
export interface AdFormStore {
    // شناسه‌ها و حالت
    adId?: string;
    isEditMode: boolean;
    catalogId: string;
    hasCatalogId: boolean;
    currentStep: number;
    submitting: boolean;

    // دادهٔ سرور (React Query)
    selectedCatalog: any;
    catalogLoading: boolean;
    adLoading: boolean;
    allUnits: any[];

    // مقادیر فرم
    formData: AdFormValues;
    selectedProduct: ProductValue | null;
    // ✅ برند آگهی — مستقل از کالای مرجع (پیش‌فرض از مرجع ارث می‌برد)
    selectedBrand: BrandValue | null;
    brandMode: boolean | null; // null=دست‌نخورده (ارث از مرجع) | true=دارای برند | false=بدون برند
    setSelectedBrand: (b: BrandValue | null) => void;
    setBrandMode: (m: boolean | null) => void;
    images: ImageSlot[];
    payment: PaymentState;
    showAdvanced: boolean;
    localUnitSettings: UnitSettingEntry[];
    localCategoryTree: any[];

    // مشتق‌شده‌ها
    salesType: 'wholesale' | 'retail';
    isWholesale: boolean;
    categoryTree: any[];
    hasCategoryTree: boolean;
    selectedCategoryNode: any;
    unitName: string;
    baseUnitTitle: string;
    suggestedUnitIds: string[];
    unitOptions: { value: string; label: string; extra?: any }[];
    liveProfit: number | null;
    advancedActiveCount: number;
    composedTitle: string;
    uploadedCount: number;

    // اکشن‌ها
    patchForm: (patch: Partial<AdFormValues>) => void;
    selectProduct: (product: ProductValue | null) => void;
    selectUnit: (unitId: string, unitTitle: string) => void;
    handleSingleUnitPriceChange: (v: number) => void;
    handleUnitPriceChange: (v: number) => void;
    handleUnitQtyChange: (v: number | null) => void;

    // عکس‌ها
    openImagePicker: () => void;
    removeImage: (index: number) => Promise<void>;
    addImageFile: (file: File | null) => void;
    imageInputRef: React.RefObject<HTMLInputElement | null>;

    // پرداخت چک
    setChequeOn: (on: boolean) => void;
    toggleChequeTerm: (days: number) => void;
    setTermPrice: (days: number, price: number) => void;
    setChequeNote: (note: string) => void;

    // آکاردئون گزینه‌های پیشرفته
    toggleAdvanced: () => void;

    // ناوبری ویزارد
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (s: number) => void;
    validateStep: (step: number) => boolean;

    // مودال‌ها
    unitModalOpen: boolean;
    setUnitModalOpen: (open: boolean) => void;
    catModalOpen: boolean;
    setCatModalOpen: (open: boolean) => void;
    setLocalUnitSettings: (units: UnitSettingEntry[]) => void;
    setLocalCategoryTree: (tree: any[]) => void;
    invalidateCatalog: () => void;

    // ثبت
    submit: () => Promise<void>;
}

const AdFormContext = createContext<AdFormStore | null>(null);

/** دسترسی به استور ویزارد — فقط داخل AdFormProvider */
export function useAdForm(): AdFormStore {
    const ctx = useContext(AdFormContext);
    if (!ctx) throw new Error('useAdForm باید داخل AdFormProvider استفاده شود');
    return ctx;
}

// ═══ Provider ═══
export function AdFormProvider({ adId, onSuccess, children }: { adId?: string; onSuccess?: () => void; children: React.ReactNode }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const uploadMutation = useUploadFile();
    const deleteFileMutation = useDeleteFile();
    const createAdMutation = useCreateAd();
    const updateAdMutation = useUpdateAd();
    const { data: existingAd, isLoading: adLoading } = useAd(adId || '');
    const imageInputRef = useRef<HTMLInputElement>(null);

    const isEditMode = !!adId;

    // ═══ کاتالوگ مقصد — از سه منبع (URL / آگهی موجود / کش) ═══
    const catalogFromUrl = searchParams.get('catalog');
    const catalogId = catalogFromUrl || ((existingAd as any)?.catalogId as string) || '';
    const hasCatalogId = !!catalogId;

    const catalogFromAd = useMemo(
        () => (isEditMode ? (existingAd?.catalog as any) ?? null : null),
        [isEditMode, existingAd],
    );

    const { data: cachedCatalog, isLoading: cachedLoading } = useQuery({
        queryKey: ['catalog', 'by-id', catalogId],
        queryFn: () => apiService.catalog.getOne(catalogId),
        enabled: !isEditMode && hasCatalogId,
        staleTime: 60_000,
    });

    const selectedCatalog = useMemo(() => {
        if (isEditMode) return catalogFromAd;
        return (cachedCatalog as any) ?? null;
    }, [isEditMode, catalogFromAd, cachedCatalog]);

    const catalogLoading = !selectedCatalog && (isEditMode ? adLoading : cachedLoading);

    // ✅ نوع فروش کاتالوگ — عمده/تک
    const salesType: 'wholesale' | 'retail' = useMemo(() => {
        const st = selectedCatalog?.salesType;
        if (st === 'retail' || st === 'wholesale') return st;
        return selectedCatalog?.type === 'retailer' ? 'retail' : 'wholesale';
    }, [selectedCatalog]);
    const isWholesale = salesType === 'wholesale';

    // ✅ تنظیمات اختصاصی کاتالوگ
    const catalogConfig = (selectedCatalog?.config as any) || {};
    const catalogUnitSettings: UnitSettingEntry[] = catalogConfig.units || [];
    const catalogCategoryTree: any[] = catalogConfig.categoryTree || [];
    const [localUnitSettings, setLocalUnitSettings] = useState<UnitSettingEntry[]>(catalogUnitSettings);
    const [localCategoryTree, setLocalCategoryTree] = useState<any[]>(catalogCategoryTree);

    useEffect(() => {
        setLocalUnitSettings(catalogUnitSettings);
        setLocalCategoryTree(catalogCategoryTree);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catalogId, selectedCatalog?.id]);

    const { data: arms } = useQuery({
        queryKey: ['arms'],
        queryFn: () => apiService.arm.getUserArms(),
        staleTime: 60_000,
    });
    const armCategoryTree: any[] = useMemo(() => {
        if (!catalogId) return [];
        const m = (arms ?? []).find((x: any) => x.status === 'active' && x.catalogId === catalogId)
            ?? (arms ?? []).find((x: any) => x.status === 'active');
        const src = m?.arm?.categoryTree;
        return Array.isArray(src) ? src : [];
    }, [arms, catalogId]);
    const categoryTree: any[] = localCategoryTree.length > 0 ? localCategoryTree : armCategoryTree;
    const hasCategoryTree = categoryTree.length > 0;

    // ═══ state فرم ═══
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<AdFormValues>(initialFormValues);
    const [selectedProduct, setSelectedProduct] = useState<ProductValue | null>(null);
    // ✅ برند آگهی — انتخابگر مستقل؛ پیش‌فرض از کالای مرجع
    const [selectedBrand, setSelectedBrand] = useState<BrandValue | null>(null);
    const [brandMode, setBrandMode] = useState<boolean | null>(null);
    const [images, setImages] = useState<ImageSlot[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [payment, setPayment] = useState<PaymentState>(initialPayment);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const selectedCategoryNode = useMemo(
        () => (formData.categoryId ? findNodeInTree(categoryTree, formData.categoryId) : null),
        [formData.categoryId, categoryTree],
    );
    const unitName = formData.unitTitle || selectedCategoryNode?.overrideUnitTitle || 'واحد';
    const baseUnitTitle = selectedCategoryNode?.baseUnitTitle || 'واحد';

    // ═══ suggestedUnitIds ═══
    const suggestedUnitIds = useMemo(() => {
        if (!formData.categoryId) return [];
        const node = findNodeInTree(categoryTree, formData.categoryId);
        if (!node) return [];
        const ids: string[] = [];
        if (node.overrideUnitId) ids.push(node.overrideUnitId);
        if (node.baseUnitId) ids.push(node.baseUnitId);
        for (const alt of node.alternativeUnits ?? []) ids.push(alt.unitId);
        return [...new Set(ids)];
    }, [formData.categoryId, categoryTree]);

    // ═══ واحدها ═══
    const { data: allUnits = [] } = useQuery({
        queryKey: ['units-all'],
        queryFn: () => apiService.ad.getAllUnits(),
        staleTime: 1000 * 60 * 60,
    });

    // ═══ گزینه‌های DropSelector واحد ═══
    const unitOptions = useMemo(() => {
        const opts: { value: string; label: string; extra?: any }[] = [];
        for (const s of localUnitSettings) {
            const u = (allUnits as any[]).find((x: any) => x.id === s.unitId);
            if (!u) continue;
            opts.push({ value: u.id, label: u.title, extra: { catQty: s.containsQty ?? null, suggested: true } });
        }
        for (const uid of suggestedUnitIds) {
            if (opts.some((o) => o.value === uid)) continue;
            const u = (allUnits as any[]).find((x: any) => x.id === uid);
            if (!u) continue;
            opts.push({ value: u.id, label: u.title, extra: { suggested: true, catQty: null } });
        }
        for (const u of allUnits as any[]) {
            if (!opts.some((o) => o.value === u.id)) {
                opts.push({ value: u.id, label: u.title, extra: { suggested: false, catQty: null } });
            }
        }
        return opts;
    }, [localUnitSettings, suggestedUnitIds, allUnits]);

    // ═══ توابع واحد و قیمت ═══
    const recalcUnitPrice = (single: number, qty: number | null): number =>
        single > 0 && qty ? Math.round(single * qty) : 0;

    const patchForm = (patch: Partial<AdFormValues>) => setFormData((p) => ({ ...p, ...patch }));

    const selectUnit = (unitId: string, unitTitle: string) => {
        const catSetting = localUnitSettings.find((s) => s.unitId === unitId);
        const globalUnit = (allUnits as any[]).find((u: any) => u.id === unitId) as any;
        let qty: number | null = null;
        let isVariable = false;
        if (catSetting?.containsQty != null) {
            qty = catSetting.containsQty;
            isVariable = !catSetting.qtyIsFixed;
        } else if (globalUnit?.containsQty != null) {
            qty = globalUnit.containsQty;
            isVariable = !globalUnit.qtyIsFixed;
        }
        setFormData((p) => ({
            ...p, unitId, unitTitle,
            unitQty: qty,
            unitIsVariableQty: isVariable,
            isEditingQty: false,
            unitPrice: recalcUnitPrice(p.singleUnitPrice, qty),
        }));
    };

    const handleSingleUnitPriceChange = (v: number) => {
        setFormData((p) => ({ ...p, singleUnitPrice: v, unitPrice: recalcUnitPrice(v, p.unitQty) }));
    };
    const handleUnitPriceChange = (v: number) => {
        const qty = formData.unitQty || 1;
        setFormData((p) => ({ ...p, unitPrice: v, singleUnitPrice: qty > 0 ? Math.round(v / qty) : 0 }));
    };
    const handleUnitQtyChange = (v: number | null) => {
        setFormData((p) => ({ ...p, unitQty: v, unitPrice: recalcUnitPrice(p.singleUnitPrice, v) }));
    };

    const liveProfit = useMemo(() => {
        if (formData.consumerPrice > 0 && formData.singleUnitPrice > 0)
            return formData.consumerPrice - formData.singleUnitPrice;
        return null;
    }, [formData.consumerPrice, formData.singleUnitPrice]);

    const advancedActiveCount =
        (formData.consumerPrice > 0 ? 1 : 0) + formData.volumeTiers.length + (formData.giftPrice > 0 ? 1 : 0);

    // ═══ انتخاب کالا از مرجع + ارث‌بری عکس ═══
    const selectProduct = (product: ProductValue | null) => {
        setSelectedProduct(product);
        if (product) {
            setFormData((p) => ({ ...p, productType: product.title }));
            // ✅ برند از کالای مرجع ارث می‌برد (کاربر بعداً می‌تواند عوضش کند)
            if (product.brandId) {
                setBrandMode(true);
                setSelectedBrand({ id: product.brandId, title: (product as any).brandTitle || '' });
            } else {
                setBrandMode(null);
                setSelectedBrand(null);
            }
            // ✅ عکس کالای مرجع رو فقط اگه عکس موجود نباشه اضافه کن
            const imgUrl = product.thumbnailUrl || product.imageUrl;
            if (imgUrl) {
                setImages((prev) => {
                    if (prev.length === 0) {
                        return [{ url: imgUrl, _fromProduct: true } as ImageSlot];
                    }
                    const first = prev[0];
                    if (first?._fromProduct) {
                        const updated = [...prev];
                        updated[0] = { url: imgUrl, _fromProduct: true } as ImageSlot;
                        return updated;
                    }
                    return prev;
                });
            }
        }
    };

    // ═══ پرداخت چک ═══
    const setChequeOn = (on: boolean) => {
        setPayment((p) => on ? { ...p, chequeOn: true } : { chequeOn: false, terms: [], note: '', installment: [], installmentDescription: '' });
    };
    const toggleChequeTerm = (days: number) => {
        setPayment((p) => {
            if (p.terms.some((t) => t.days === days))
                return { ...p, terms: p.terms.filter((t) => t.days !== days) };
            return { ...p, terms: [...p.terms, { days, price: 0 }].sort((a, b) => a.days - b.days) };
        });
    };
    const setTermPrice = (days: number, price: number) => {
        setPayment((p) => ({
            ...p,
            terms: p.terms.map((x) => x.days === days ? { ...x, price: price || 0 } : x),
        }));
    };
    const setChequeNote = (note: string) => setPayment((p) => ({ ...p, note }));
    const toggleAdvanced = () => setShowAdvanced((v) => !v);

    // ═══ auto-select واحد پیش‌فرض ═══
    useEffect(() => {
        if (!formData.categoryId || !hasCategoryTree) return;
        const catUnits = getAvailableUnits(formData.categoryId, categoryTree);
        if (catUnits.length > 0) {
            const ok = catUnits.some((u) => u.unitId === formData.unitId);
            if (!ok) {
                const def = catUnits.find((u) => u.isDefault) || catUnits[0];
                selectUnit(def.unitId, def.unitTitle);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.categoryId, categoryTree]);

    // ═══ عکس‌ها — اسلات‌محور ═══
    // ✅ اگه آگهی عکس خودش رو نداره ولی کالای مرجع عکس داره، اون رو به‌عنوان fallback نشون بده
    useEffect(() => {
        if (isEditMode && existingAd) {
            const imgs = ((existingAd as any).files || [])
                .filter((f: any) => f.fieldKey?.startsWith('ad-image'))
                .sort((a: any, b: any) =>
                    parseInt(a.fieldKey.split('-')[2] || '0') - parseInt(b.fieldKey.split('-')[2] || '0'));
            const adImages = imgs.map((img: any) => ({
                id: img.id,
                url: img.thumbnailPath || img.path,
            }));
            if (adImages.length === 0) {
                const productRef = (existingAd as any).productRef || (existingAd as any).product_ref;
                const productImg = productRef?.thumbnailUrl || productRef?.imageUrl || productRef?.thumbnail_url || productRef?.image_url;
                if (productImg) {
                    setImages([{ url: productImg, _fromProduct: true } as ImageSlot]);
                } else {
                    setImages([]);
                }
            } else {
                setImages(adImages);
            }
        } else {
            setImages([]);
        }
    }, [isEditMode, existingAd]);

    const uploadedCount = useMemo(() => images.filter((s) => s.id || s.file).length, [images]);

    const openImagePicker = () => {
        if (images.length < MAX_IMAGES) imageInputRef.current?.click();
    };
    const removeImage = async (index: number) => {
        const slot = images[index];
        if (slot?.previewUrl) URL.revokeObjectURL(slot.previewUrl);
        if (slot?.id) {
            try { await deleteFileMutation.mutateAsync(slot.id); } catch {}
        }
        setImages((p) => p.filter((_, j) => j !== index));
    };
    const addImageFile = (file: File | null) => {
        if (!file || images.length >= MAX_IMAGES) return;
        setImages((p) => [...p, { file, previewUrl: URL.createObjectURL(file) }]);
    };

    // ═══ پیش‌پرکردن اعتبار قیمت در ویرایش ═══
    useEffect(() => {
        if (!isEditMode || !existingAd) return;
        const vh = (existingAd as any).validityHours;
        const exp = (existingAd as any).expiresAt;
        // آگهی قدیمی که expiresAt ندارد → بدون مهلت؛ اگه expiresAt دارد ولی validityHours ثبت نشده → ۷۲
        const effective = typeof vh === 'number' && vh > 0 ? vh : (exp ? 72 : 0);
        setFormData((p) => ({ ...p, validityHours: effective }));
    }, [isEditMode, existingAd]);

    // ═══ پیش‌فرض شهر — از کسب‌وکار ═══
    useEffect(() => {
        if (isEditMode || !selectedCatalog) return;
        const biz = (selectedCatalog as any).business || {};
        const cityCode = biz.cityCode || selectedCatalog.cityCode;
        const cityLabel = biz.city || selectedCatalog.city;
        const provinceCode = biz.provinceCode || selectedCatalog.provinceCode;
        const provinceLabel = biz.province || selectedCatalog.province;
        if (!formData.cityCode && cityCode) {
            setFormData((p) => ({
                ...p,
                cityCode: cityCode || '', cityLabel: cityLabel || '',
                provinceCode: provinceCode || '', provinceLabel: provinceLabel || '',
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCatalog, isEditMode]);

    // ═══ لود آگهی (edit) — prefill کامل ═══
    useEffect(() => {
        if (isEditMode && existingAd) {
            const ad = existingAd as any;
            setFormData((p) => ({
                ...p,
                categoryId: ad.categoryId || '',
                productType: ad.productType || ad.title || '',
                singleUnitPrice: ad.singleUnitPrice || 0,
                unitPrice: ad.unitPrice || 0,
                consumerPrice: ad.consumerPrice || 0,
                minQuantity: ad.minQuantity || 1,
                availableQuantity: ad.availableQuantity || 0,
                cityCode: ad.cityCode || '', cityLabel: ad.city || '',
                provinceCode: ad.provinceCode || '', provinceLabel: ad.province || '',
                description: ad.description || '',
                unitId: ad.unitId || '', unitTitle: ad.unit?.title || '',
                unitQty: ad.unitQty ?? null,
                unitIsVariableQty: ad.unitIsVariableQty ?? false, isEditingQty: false,
                giftPrice: ad.giftPrice || 0,
                volumeTiers: ad.volumeTiers || [],
                productReferenceId: ad.productReferenceId || '',
                brandId: ad.brandId || '',
            }));
            // ✅ برند آگهی موجود — تصمیم قبلی فروشنده بازگردانی می‌شود
            setBrandMode(ad.brandId ? true : false);
            setSelectedBrand(ad.brandId ? { id: ad.brandId, title: ad.brand?.title || '' } : null);
            // ✅ اگه آگهی کالای مرجع داره، اون رو نمایش بده (برند هم از مرجع ارث می‌بره)
            if (ad.productReferenceId) {
                setSelectedProduct({
                    id: ad.productReferenceId,
                    title: ad.productRef?.title || ad.productType || ad.title || '',
                    brandId: ad.brandId,
                    brandTitle: ad.brand?.title,
                    imageUrl: ad.productRef?.imageUrl,
                    thumbnailUrl: ad.productRef?.thumbnailUrl,
                });
            }
            // ✅ شرایط پرداخت چکی — از مدل قدیمی paymentMethods
            const pmOld = ad.paymentMethods;
            if (pmOld?.cheque?.length > 0) {
                setPayment({
                    chequeOn: true,
                    terms: (pmOld.cheque as any[])
                        .map((c) => ({ days: c.days || 30, price: c.price || 0 }))
                        .sort((a: any, b: any) => a.days - b.days),
                    note: pmOld.chequeDescription || '',
                    installment: pmOld.installment || [],
                    installmentDescription: pmOld.installmentDescription || '',
                });
            } else {
                setPayment({ chequeOn: false, terms: [], note: '', installment: pmOld?.installment || [], installmentDescription: pmOld?.installmentDescription || '' });
            }
            // ✅ اگه گزینه‌های پیشرفته پر شده، آکاردئون باز باشه
            if (ad.consumerPrice > 0 || ad.volumeTiers?.length > 0 || ad.giftPrice > 0) {
                setShowAdvanced(true);
            }
        }
    }, [isEditMode, existingAd]);

    // ═══ عنوان ترکیبی ═══
    const composedTitle = useMemo(() => {
        const cat = selectedCategoryNode?.title || '';
        const baseTitle = selectedProduct?.title || formData.productType;
        return baseTitle ? `${cat ? cat + ' ' : ''}${baseTitle}`.trim() : baseTitle;
    }, [formData.productType, selectedCategoryNode, selectedProduct]);

    // ═══ validate ═══
    const validateStep = (step: number): boolean => {
        const errs: string[] = [];
        if (step === 1) {
            // ✅ انتخاب کالا از مرجع کالا اجباری است
            if (!selectedProduct) {
                errs.push('کالا را از مرجع کالا انتخاب کن.');
            }
            if (selectedProduct) {
                if (!formData.unitId) errs.push('واحد فروش را انتخاب کن.');
            }
        } else if (step === 2) {
            if (isWholesale) {
                if (formData.minQuantity <= 0) errs.push('حداقل حجم فروش را وارد کن.');
                if (formData.singleUnitPrice <= 0) errs.push('قیمت تکی را وارد کن.');
                if (formData.unitPrice <= 0) errs.push('قیمت عمده را وارد کن.');
                if (formData.availableQuantity <= 0) errs.push('موجودی تضمینی را وارد کن.');
                if (formData.minQuantity > formData.availableQuantity)
                    errs.push('حداقل حجم فروش نمی‌تواند از موجودی بیشتر باشد.');
                const constraints = getCategoryConstraints(formData.categoryId, categoryTree);
                if (constraints.min !== null && formData.minQuantity < constraints.min)
                    errs.push(`حداقل حجم فروش نمی‌تواند کمتر از ${constraints.min.toLocaleString('fa-IR')} ${unitName} باشد.`);
                if (constraints.max !== null && formData.minQuantity > constraints.max)
                    errs.push(`حداقل حجم فروش نمی‌تواند بیشتر از ${constraints.max.toLocaleString('fa-IR')} ${unitName} باشد.`);
                if (formData.consumerPrice > 0 && formData.singleUnitPrice > 0 &&
                    formData.consumerPrice < formData.singleUnitPrice)
                    errs.push('قیمت مصرف‌کننده نمی‌تواند از قیمت عمده کمتر باشد.');
            } else {
                if (formData.unitPrice <= 0) errs.push('قیمت را وارد کن.');
            }
        } else if (step === 3) {
            if (!formData.cityCode) errs.push('محل کالا را انتخاب کن.');
        }
        if (errs.length) { errs.forEach((m) => toast.error(m)); return false; }
        return true;
    };

    const nextStep = () => {
        if (currentStep < TOTAL_STEPS && validateStep(currentStep)) {
            setCurrentStep((p) => p + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const prevStep = () => {
        setCurrentStep((p) => Math.max(1, p - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const goToStep = (s: number) => {
        if (s < currentStep) {
            setCurrentStep(s);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const invalidateCatalog = () => {
        queryClient.invalidateQueries({ queryKey: ['catalog', 'by-id', catalogId] });
    };

    // ═══ submit ═══
    const submit = async () => {
        if (submitting) return;
        for (let s = 1; s < TOTAL_STEPS; s++) {
            if (!validateStep(s)) { setCurrentStep(s); return; }
        }
        setSubmitting(true);
        try {
            const newFiles = images.filter((s) => s.file).map((s) => s.file!);
            let adResultId: string = '';

            // ✅ شرایط پرداخت چکی — همان shape مدل قدیمی (سازگار با نمایش جزئیات آگهی)
            // installment قدیمی حفظ می‌شه تا داده‌های اقساطی آگهی‌های قبلی موقع ویرایش از بین نره
            const paymentData = payment.chequeOn && payment.terms.length > 0 ? {
                description: '',
                cheque: payment.terms.map((t) => ({ days: t.days, price: t.price > 0 ? t.price : formData.unitPrice })),
                chequeDescription: payment.note.trim() || '',
                installment: payment.installment || [],
                installmentDescription: payment.installmentDescription || '',
            } : (payment.installment?.length > 0 ? {
                description: '',
                cheque: [],
                chequeDescription: '',
                installment: payment.installment,
                installmentDescription: payment.installmentDescription || '',
            } : null);

            if (isEditMode) {
                await updateAdMutation.mutateAsync({
                    id: adId as string,
                    data: {
                        categoryId: formData.categoryId || undefined,
                        unitId: formData.unitId,
                        title: composedTitle,
                        productType: selectedProduct?.title || formData.productType,
                        productReferenceId: selectedProduct?.id || null,
                        // ✅ برند: «بدون برند» صریح → null | انتخاب کاربر → ارث از مرجع
                        brandId: brandMode === false ? null : (selectedBrand?.id || selectedProduct?.brandId || null),
                        unitPrice: formData.unitPrice,
                        singleUnitPrice: formData.singleUnitPrice || null,
                        consumerPrice: formData.consumerPrice || null,
                        minQuantity: formData.minQuantity,
                        availableQuantity: formData.availableQuantity,
                        city: formData.cityLabel, cityCode: formData.cityCode,
                        provinceCode: formData.provinceCode,
                        description: formData.description,
                        unitQty: formData.unitQty as any,
                        unitIsVariableQty: formData.unitIsVariableQty,
                        giftPrice: formData.giftPrice || null,
                        volumeTiers: formData.volumeTiers.length > 0 ? formData.volumeTiers : null,
                        paymentMethods: paymentData,
                        validityHours: formData.validityHours,
                    },
                });
                adResultId = adId;
                // عکس‌های جدید — با modelId = آگهی موجود
                for (let i = 0; i < newFiles.length; i++) {
                    await uploadMutation.mutateAsync({
                        file: newFiles[i], model: 'Ad', modelId: adId, fieldKey: `ad-image-new-${i}`,
                    });
                }
                toast.success('کالا ویرایش شد');
            } else {
                const created: any = await createAdMutation.mutateAsync({
                    catalogId: catalogId,
                    categoryId: formData.categoryId || undefined,
                    unitId: formData.unitId,
                    title: composedTitle,
                    productType: selectedProduct?.title || formData.productType,
                    productReferenceId: selectedProduct?.id || undefined,
                    // ✅ برند: بدون برند → undefined | انتخاب کاربر → ارث از مرجع
                    brandId: brandMode === false ? undefined : ((selectedBrand as any)?.id || selectedProduct?.brandId || undefined),
                    unitPrice: formData.unitPrice,
                    singleUnitPrice: formData.singleUnitPrice || null,
                    consumerPrice: formData.consumerPrice || null,
                    minQuantity: formData.minQuantity,
                    availableQuantity: formData.availableQuantity || undefined,
                    city: formData.cityLabel, cityCode: formData.cityCode,
                    provinceCode: formData.provinceCode,
                    description: formData.description,
                    unitQty: formData.unitQty as any,
                    unitIsVariableQty: formData.unitIsVariableQty,
                    giftPrice: formData.giftPrice || null,
                    volumeTiers: formData.volumeTiers.length > 0 ? formData.volumeTiers : null,
                    paymentMethods: paymentData,
                    validityHours: formData.validityHours,
                });
                if (!created?.id) throw new Error('پاسخ سرور ناقص است — آگهی ساخته نشد');
                adResultId = created.id;
                // عکس‌ها بعد از ساخت آگهی — الگوی relatedModel/relatedId + fieldKey ایندکسی
                for (let i = 0; i < newFiles.length; i++) {
                    await uploadMutation.mutateAsync({
                        file: newFiles[i], model: 'Ad', modelId: adResultId, fieldKey: `ad-image-${i}`,
                    });
                }
                toast.success(formData.validityHours > 0
                    ? `محصول اضافه شد — بعد از ${formData.validityHours >= 24 ? `${formData.validityHours / 24} روز` : `${formData.validityHours} ساعت`} یادآوری تازه‌سازی قیمت می‌گیری`
                    : 'محصول اضافه شد');
            }

            queryClient.invalidateQueries({ queryKey: ['catalog', 'by-id', catalogId] });
            queryClient.invalidateQueries({ queryKey: ['catalog'] });
            queryClient.invalidateQueries({ queryKey: ['home-ads-summary'] });
            queryClient.invalidateQueries({ queryKey: ['catalog-ads'] });
            queryClient.invalidateQueries({ queryKey: ['catalog-products', adResultId] });
            onSuccess?.();
            router.push('/my-catalogs');
        } catch (err: any) {
            toast.error(err?.message || 'خطا در ثبت');
        } finally {
            setSubmitting(false);
        }
    };

    const store: AdFormStore = {
        adId, isEditMode,
        catalogId, hasCatalogId,
        currentStep, submitting,
        selectedCatalog, catalogLoading, adLoading, allUnits: allUnits as any[],
        formData, selectedProduct, selectedBrand, brandMode, setSelectedBrand, setBrandMode,
        images, payment, showAdvanced,
        localUnitSettings, localCategoryTree,
        salesType, isWholesale, categoryTree, hasCategoryTree,
        selectedCategoryNode, unitName, baseUnitTitle,
        suggestedUnitIds, unitOptions, liveProfit, advancedActiveCount,
        composedTitle, uploadedCount,
        patchForm, selectProduct, selectUnit,
        handleSingleUnitPriceChange, handleUnitPriceChange, handleUnitQtyChange,
        openImagePicker, removeImage, addImageFile, imageInputRef,
        setChequeOn, toggleChequeTerm, setTermPrice, setChequeNote,
        toggleAdvanced,
        nextStep, prevStep, goToStep, validateStep,
        unitModalOpen, setUnitModalOpen, catModalOpen, setCatModalOpen,
        setLocalUnitSettings, setLocalCategoryTree, invalidateCatalog,
        submit,
    };

    return <AdFormContext.Provider value={store}>{children}</AdFormContext.Provider>;
}

// ═══ المان مخفی انتخاب فایل — یک بار در شل رندر می‌شه ═══
export function ImageFileInput() {
    const { imageInputRef, addImageFile } = useAdForm();
    return (
        <input ref={imageInputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*" className="hidden"
               onChange={(e) => { addImageFile(e.target.files?.[0] ?? null); e.target.value = ''; }} />
    );
}
