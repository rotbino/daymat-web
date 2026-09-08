// app_/ad/AdForm.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { useCreateAd, useUpdateAd, useAd, useUploadFile, useDeleteFile } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    ArrowLeft, ArrowRight, Camera, Check, ChevronDown, ClipboardCheck, Clock, Images,
    Loader2, MapPin, Package, Pencil, Plus, Search, Store, Tag, Wallet, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberInput } from '@/components/common/NumberInput';
import { DropSelector } from '@/components/common/DropSelector';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import ProductReferencePicker, { ProductValue } from '@/app/components/ProductReferencePicker';
import UnitSettingsModal from './components/UnitSettingsModal';
import CategorySettingsModal from './components/CategorySettingsModal';
import CategoryPicker from './components/CategoryPicker';

const VALIDITY_OPTIONS = [
    { value: 24, label: '۱ روز' },
    { value: 48, label: '۲ روز' },
    { value: 72, label: '۳ روز' },
    { value: 168, label: '۵ روز' },
    { value: 240, label: '۱۰ روز' },
];
const MAX_IMAGES = 6;
const CURRENCY = 'تومان';

// ═══ ابزارهای درخت ═══
function findNodeInTree(nodes: any[], id: string): any {
    for (const n of nodes) {
        if (n.id === id || n.categoryId === id) return n;
        if (n.children) { const f = findNodeInTree(n.children, id); if (f) return f; }
    }
    return null;
}
interface UnitOption {
    unitId: string; unitTitle: string; unitShortCode: string;
    isVariableQty: boolean; qty: number | null; isDefault: boolean;
}
function getAvailableUnits(categoryId: string, categoryTree: any[]): UnitOption[] {
    const node = findNodeInTree(categoryTree, categoryId);
    if (!node) return [];
    const units: UnitOption[] = [];
    if (node.overrideUnitId) {
        units.push({
            unitId: node.overrideUnitId, unitTitle: node.overrideUnitTitle || '',
            unitShortCode: node.overrideUnitShortCode || node.overrideUnitTitle || '',
            isVariableQty: node.overrideUnitIsVariableQty === true,
            qty: node.overrideUnitQty ?? null, isDefault: true,
        });
    }
    (node.alternativeUnits || []).forEach((au: any) => {
        if (au.unitId && au.isActive !== false) {
            units.push({
                unitId: au.unitId, unitTitle: au.unitTitle || '', unitShortCode: au.unitShortCode || au.unitTitle || '',
                isVariableQty: au.isVariableQty === true, qty: au.qty ?? null, isDefault: false,
            });
        }
    });
    return units;
}
function getCategoryConstraints(categoryId: string, categoryTree: any[]) {
    const node = findNodeInTree(categoryTree, categoryId);
    return { min: node?.minQuantityOverride ?? null, max: node?.maxQuantityOverride ?? null };
}

interface ImageSlot {
    id?: string;        // فایل موجود روی سرور
    url?: string;       // آدرس نمایش فایل موجود
    file?: File;        // فایل جدید
    previewUrl?: string;
}

const STEP_TITLES = ['کالا', 'قیمت', 'موقعیت', 'بررسی'];

export function AdForm({ adId, onSuccess }: { adId?: string; onSuccess?: () => void }) {
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

    // ═══ کاتالوگ مقصد — از سه منبع ═══
    const catalogFromUrl = searchParams.get('catalog');
    const catalogId = catalogFromUrl || (existingAd?.catalogId as string) || '';
    const hasCatalogId = !!catalogId;

    // ✅ ویرایش: catalog داخل includeٔ آگهی هست — صفر درخواست اضافه
    const catalogFromAd = useMemo(
        () => (isEditMode ? (existingAd?.catalog as any) ?? null : null),
        [isEditMode, existingAd],
    );

    // ✅ ایجاد: کش pre-seed شده یا fetch سبک تک‌رکوردی (فقط deep-link)
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
    const catalogUnitSettings: { unitId: string; containsQty?: number; qtyIsFixed?: boolean }[] =
        catalogConfig.units || [];
    const catalogCategoryTree: any[] = catalogConfig.categoryTree || [];
    const [localUnitSettings, setLocalUnitSettings] =
        useState<{ unitId: string; containsQty?: number; qtyIsFixed?: boolean }[]>(catalogUnitSettings);
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
    const TOTAL_STEPS = 4;
    const [formData, setFormData] = useState({
        categoryId: '', productType: '',
        singleUnitPrice: 0, unitPrice: 0,
        minQuantity: 1, availableQuantity: 0,
        cityCode: '', cityLabel: '', provinceCode: '', provinceLabel: '',
        validityHours: 24, description: '',
        unitId: '', unitTitle: '',
        unitQty: null as number | null,
        unitIsVariableQty: false, isEditingQty: false,
        giftPrice: 0,
        volumeTiers: [] as { minQty: number; price: number }[],
        // ✅ کالای مرجع
        productReferenceId: '' as string,
        brandId: '' as string,
    });
    // ✅ state کالای انتخاب‌شده (برای نمایش در ProductReferencePicker)
    const [selectedProduct, setSelectedProduct] = useState<ProductValue | null>(null);
    const [images, setImages] = useState<ImageSlot[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [catModalOpen, setCatModalOpen] = useState(false);

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
    const { data: allUnits = [], isLoading: unitsLoading } = useQuery({
        queryKey: ['units-all'],
        queryFn: () => apiService.ad.getAllUnits(),
        staleTime: 1000 * 60 * 60,
    });
    const { data: suggestedUnits = [] } = useQuery({
        queryKey: ['units-ids', suggestedUnitIds.join(',')],
        queryFn: () => apiService.ad.getAllUnits(suggestedUnitIds),
        enabled: suggestedUnitIds.length > 0,
        staleTime: 1000 * 60 * 60,
    });

    // ═══ توابع واحد و قیمت ═══
    function recalcUnitPrice(single: number, qty: number | null): number {
        return single > 0 && qty ? Math.round(single * qty) : 0;
    }

    const selectUnit = (unitId: string, unitTitle: string) => {
        const catSetting = localUnitSettings.find((s) => s.unitId === unitId);
        const globalUnit = allUnits.find((u: any) => u.id === unitId) as any;
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

    // ═══ گزینه‌های DropSelector واحد ═══
    const unitOptions = useMemo(() => {
        const opts: { value: string; label: string; extra?: any }[] = [];
        for (const s of localUnitSettings) {
            const u = allUnits.find((x: any) => x.id === s.unitId);
            if (!u) continue;
            opts.push({ value: u.id, label: u.title, extra: { catQty: s.containsQty ?? null, suggested: true } });
        }
        for (const uid of suggestedUnitIds) {
            if (opts.some((o) => o.value === uid)) continue;
            const u = allUnits.find((x: any) => x.id === uid);
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

    // ═══ عکس‌ها — اسلات‌محور؛ موجود = {id, url}، جدید = {file, previewUrl} ═══
    useEffect(() => {
        if (isEditMode && existingAd) {
            const imgs = (existingAd.files || [])
                .filter((f: any) => f.fieldKey?.startsWith('ad-image'))
                .sort((a: any, b: any) =>
                    parseInt(a.fieldKey.split('-')[2] || '0') - parseInt(b.fieldKey.split('-')[2] || '0'));
            setImages(imgs.map((img: any) => ({
                id: img.id,
                url: img.thumbnailPath || img.path,
            })));
        } else {
            setImages([]);
        }
    }, [isEditMode, existingAd]);

    const uploadedCount = useMemo(() => images.filter((s) => s.id || s.file).length, [images]);

    const handleAddImageSlot = () => {
        if (images.length < MAX_IMAGES) imageInputRef.current?.click();
    };
    const handleRemoveImageSlot = async (index: number) => {
        const slot = images[index];
        if (slot?.previewUrl) URL.revokeObjectURL(slot.previewUrl);
        if (slot?.id) {
            try { await deleteFileMutation.mutateAsync(slot.id); } catch {}
        }
        setImages((p) => p.filter((_, j) => j !== index));
    };
    const handleImageSelected = (file: File | null) => {
        if (!file || images.length >= MAX_IMAGES) return;
        setImages((p) => [...p, { file, previewUrl: URL.createObjectURL(file) }]);
    };

    // ═══ پیش‌فرض شهر ═══
    useEffect(() => {
        if (isEditMode || !selectedCatalog) return;
        if (!formData.cityCode && selectedCatalog.cityCode) {
            setFormData((p) => ({
                ...p,
                cityCode: selectedCatalog.cityCode || '', cityLabel: selectedCatalog.city || '',
                provinceCode: selectedCatalog.provinceCode || '', provinceLabel: selectedCatalog.province || '',
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCatalog, isEditMode]);

    // ═══ لود آگهی (edit) — prefill کامل ═══
    useEffect(() => {
        if (isEditMode && existingAd) {
            setFormData((p) => ({
                ...p,
                categoryId: existingAd.categoryId || '',
                productType: existingAd.productType || existingAd.title || '',
                singleUnitPrice: existingAd.singleUnitPrice || 0,
                unitPrice: existingAd.unitPrice || 0,
                minQuantity: existingAd.minQuantity || 1,
                availableQuantity: existingAd.availableQuantity || 0,
                cityCode: existingAd.cityCode || '', cityLabel: existingAd.city || '',
                provinceCode: existingAd.provinceCode || '', provinceLabel: existingAd.province || '',
                validityHours: existingAd.validityHours || 24,
                description: existingAd.description || '',
                unitId: existingAd.unitId || '', unitTitle: existingAd.unit?.title || '',
                unitQty: existingAd.unitQty ?? null,
                unitIsVariableQty: existingAd.unitIsVariableQty ?? false, isEditingQty: false,
                giftPrice: (existingAd as any).giftPrice || 0,
                volumeTiers: (existingAd as any).volumeTiers || [],
                productReferenceId: (existingAd as any).productReferenceId || '',
                brandId: (existingAd as any).brandId || '',
            }));
            // ✅ اگه آگهی کالای مرجع داره، اون رو نمایش بده
            if ((existingAd as any).productReferenceId) {
                setSelectedProduct({
                    id: (existingAd as any).productReferenceId,
                    title: (existingAd as any).productRef?.title || existingAd.productType || existingAd.title || '',
                    brandId: (existingAd as any).brandId,
                    brandTitle: (existingAd as any).brand?.title,
                    imageUrl: (existingAd as any).productRef?.imageUrl,
                    thumbnailUrl: (existingAd as any).productRef?.thumbnailUrl,
                });
            }
        }
    }, [isEditMode, existingAd]);

    // ═══ validate ═══
    const validateStep = (step: number): boolean => {
        const errs: string[] = [];
        if (step === 1) {
            if (uploadedCount === 0) errs.push('حداقل یک تصویر انتخاب کن.');
            // ✅ اگه کالای مرجع انتخاب شده، productType الزامی نیست (از اون کپی می‌شه)
            if (!selectedProduct && !formData.productType.trim()) errs.push('کالا را انتخاب کن یا عنوان وارد کن.');
            if (!formData.unitId) errs.push('واحد فروش را انتخاب کن.');
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

    // ═══ عنوان ترکیبی ═══
    const composedTitle = useMemo(() => {
        const cat = selectedCategoryNode?.title || '';
        // ✅ اگه کالای مرجع انتخاب شده، از عنوان اون استفاده کن
        const baseTitle = selectedProduct?.title || formData.productType;
        return baseTitle ? `${cat ? cat + ' ' : ''}${baseTitle}`.trim() : baseTitle;
    }, [formData.productType, selectedCategoryNode, selectedProduct]);

    // ═══ submit ═══
    const handleSubmit = async () => {
        if (submitting) return;
        for (let s = 1; s < TOTAL_STEPS; s++) {
            if (!validateStep(s)) { setCurrentStep(s); return; }
        }
        setSubmitting(true);
        try {
            const newFiles = images.filter((s) => s.file).map((s) => s.file!);
            let adResultId: string | null = null;

            if (isEditMode) {
                await updateAdMutation.mutateAsync({
                    id: adId,
                    data: {
                        categoryId: formData.categoryId || undefined,
                        unitId: formData.unitId,
                        title: composedTitle,
                        productType: selectedProduct?.title || formData.productType,
                        // ✅ کالای مرجع
                        productReferenceId: selectedProduct?.id || null,
                        brandId: selectedProduct?.brandId || formData.brandId || null,
                        unitPrice: formData.unitPrice,
                        singleUnitPrice: formData.singleUnitPrice || null,
                        consumerPrice: formData.consumerPrice || null,
                        minQuantity: formData.minQuantity,
                        availableQuantity: formData.availableQuantity,
                        city: formData.cityLabel, cityCode: formData.cityCode,
                        provinceCode: formData.provinceCode,
                        validityHours: formData.validityHours,
                        description: formData.description,
                        unitQty: formData.unitQty,
                        unitIsVariableQty: formData.unitIsVariableQty,
                        giftPrice: formData.giftPrice || null,
                        volumeTiers: formData.volumeTiers.length > 0 ? formData.volumeTiers : null,
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
                    // ✅ کالای مرجع
                    productReferenceId: selectedProduct?.id || undefined,
                    brandId: selectedProduct?.brandId || formData.brandId || undefined,
                    unitPrice: formData.unitPrice,
                    singleUnitPrice: formData.singleUnitPrice || null,
                    consumerPrice: formData.consumerPrice || null,
                    minQuantity: formData.minQuantity,
                    availableQuantity: formData.availableQuantity || undefined,
                    city: formData.cityLabel, cityCode: formData.cityCode,
                    provinceCode: formData.provinceCode,
                    validityHours: formData.validityHours,
                    description: formData.description,
                    unitQty: formData.unitQty,
                    unitIsVariableQty: formData.unitIsVariableQty,
                    giftPrice: formData.giftPrice || null,
                    volumeTiers: formData.volumeTiers.length > 0 ? formData.volumeTiers : null,
                });
                if (!created?.id) throw new Error('پاسخ سرور ناقص است — آگهی ساخته نشد');
                adResultId = created.id;
                // عکس‌ها بعد از ساخت آگهی — الگوی relatedModel/relatedId + fieldKey ایندکسی
                for (let i = 0; i < newFiles.length; i++) {
                    await uploadMutation.mutateAsync({
                        file: newFiles[i], model: 'Ad', modelId: adResultId, fieldKey: `ad-image-${i}`,
                    });
                }
                toast.success('محصول اضافه شد — تا ۲۴ ساعت معتبر است');
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

    const inputCls = (hasErr?: string) => cn(
        'w-full h-11 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border',
        'focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all',
        hasErr ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
    );
    const SectionTitle = ({ icon: Icon, text }: any) => (
        <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 mb-2">
            <Icon className="w-3.5 h-3.5 text-amber-500" /> {text}
        </p>
    );
    const StepBadge = ({ n }: any) => (
        <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 flex items-center justify-center text-[10px] font-black">{n}</span>
    );

    // ═══ گاردها — بعد از همهٔ هوک‌ها ═══
    if (!hasCatalogId) {
        return (
            <div className="min-h-screen grid place-items-center bg-surface dark:bg-gray-950 text-center px-4">
                <div>
                    <Package className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
                    <p className="text-sm font-bold text-on-surface">کاتالوگ مقصد مشخص نیست</p>
                    <p className="text-xs text-on-surface-variant mt-2">از کاتالوگ موردنظرت دکمهٔ «افزودن محصول» را بزن.</p>
                    <button onClick={() => router.push('/my-catalogs')}
                            className="mt-4 text-primary text-sm font-bold">رفتن به کاتالوگ‌های من</button>
                </div>
            </div>
        );
    }
    if (catalogLoading || (isEditMode && !existingAd && adLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent" />
            </div>
        );
    }
    if (!selectedCatalog) {
        return (
            <div className="min-h-screen grid place-items-center bg-surface dark:bg-gray-950 text-center px-4">
                <div>
                    <Package className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
                    <p className="text-sm font-bold text-on-surface">کاتالوگ یافت نشد</p>
                    <button onClick={() => router.push('/my-catalogs')}
                            className="mt-4 text-primary text-sm font-bold">رفتن به کاتالوگ‌های من</button>
                </div>
            </div>
        );
    }

    // ═══ رندر ═══
    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-28">
            {/* هدر */}
            <header className="sticky top-0 z-40 bg-white/85 dark:bg-gray-950/85 backdrop-blur border-b border-outline-variant/20">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => router.back()} aria-label="بستن"
                            className="p-2 -m-1 rounded-full hover:bg-surface-container-high text-on-surface-variant">
                        <X className="w-5 h-5" />
                    </button>
                    <h1 className="flex-1 text-sm font-extrabold text-on-surface">
                        {isEditMode ? 'ویرایش کالا' : 'افزودن محصول'}
                    </h1>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        {isWholesale ? 'عمده‌فروشی' : 'تک‌فروشی'}
                    </span>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 pt-5 space-y-4">
                {/* نوار پیشرفت */}
                <div className="flex items-center justify-between px-1">
                    {STEP_TITLES.map((t, i) => {
                        const n = i + 1;
                        const active = n === currentStep, done = n < currentStep;
                        return (
                            <React.Fragment key={t}>
                                <div className={cn('flex flex-col items-center gap-1', !active && !done && 'opacity-40')}>
                                    <span className={cn('w-8 h-8 rounded-full grid place-items-center text-xs font-black border-2 transition-all',
                                        active && 'bg-amber-500 text-white border-amber-500 scale-110',
                                        done && 'bg-emerald-500 text-white border-emerald-500',
                                        !active && !done && 'bg-surface-container-high text-on-surface-variant border-outline-variant/40')}>
                                        {done ? <Check className="w-4 h-4" /> : n}
                                    </span>
                                    <span className={cn('text-[9px] font-bold',
                                        active ? 'text-amber-600 dark:text-amber-400' : done ? 'text-emerald-600' : 'text-on-surface-variant/70')}>{t}</span>
                                </div>
                                {i < 3 && <div className={cn('flex-1 h-[3px] rounded-full -mt-4', done ? 'bg-emerald-500' : 'bg-outline-variant/30')} />}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* ═══ مرحله ۱: کالا ═══ */}
                {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                            <SectionTitle icon={Images} text="تصویر کالا" />
                            <div className="flex flex-wrap gap-2.5 items-start">
                                {images.map((slot, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/40 flex-shrink-0">
                                        {slot.previewUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={slot.previewUrl} alt="" className="w-full h-full object-cover" />
                                        ) : slot.url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={slot.url} alt="" className="w-full h-full object-cover" />
                                        ) : null}
                                        <button type="button" onClick={() => handleRemoveImageSlot(idx)}
                                                className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white grid place-items-center">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {images.length < MAX_IMAGES && (
                                    <button type="button" onClick={() => imageInputRef.current?.click()}
                                            className="w-20 h-20 rounded-xl border-2 border-dashed border-outline-variant/50
                                                flex flex-col items-center justify-center gap-1 text-on-surface-variant/60
                                                hover:border-amber-500/50 hover:text-amber-500 transition-colors">
                                        <Camera className="w-5 h-5" />
                                        <span className="text-[9px] font-bold">عکس</span>
                                    </button>
                                )}
                                <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                                       onChange={(e) => { handleImageSelected(e.target.files?.[0] ?? null); e.target.value = ''; }} />
                            </div>
                            <p className="text-[10px] text-on-surface-variant/60">اولین عکس، عکس اصلی کارت می‌شود — تا {MAX_IMAGES} عکس</p>
                        </section>

                        <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                            <SectionTitle icon={Store} text="کاتالوگ" />
                            <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-900/10
                                border border-amber-200/50 dark:border-amber-800/40">
                                <Store className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                <span className="text-sm font-bold text-on-surface truncate flex-1">{selectedCatalog.name}</span>
                            </div>
                        </section>

                        <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                            <SectionTitle icon={Tag} text="کالا" />
                            {hasCategoryTree && (
                                <CategoryPicker
                                    value={formData.categoryId}
                                    onChange={(id) => setFormData((p) => ({ ...p, categoryId: id, unitId: '', unitTitle: '', unitQty: null }))}
                                    tree={categoryTree}
                                />
                            )}
                            <div className="space-y-1.5">
                                {/* ✅ انتخاب کالای مرجع — جایگزین input عنوان */}
                                <ProductReferencePicker
                                    value={selectedProduct}
                                    onChange={(product) => {
                                        setSelectedProduct(product);
                                        // ✅ productType رو هم ست کن برای backward-compat
                                        if (product) {
                                            setFormData((p) => ({ ...p, productType: product.title }));
                                        }
                                    }}
                                    label="کالا"
                                    required
                                    placeholder="انتخاب کالا از مرجع کالا..."
                                    error={!selectedProduct && !formData.productType.trim() ? 'کالا را انتخاب کن' : undefined}
                                />
                                {/* ✅ input عنوان (fallback) — اگه کاربر کالای مرجع انتخاب نکرد */}
                                {!selectedProduct && (
                                    <div className="space-y-1.5 pt-1">
                                        <label className="text-[10px] text-on-surface-variant block">
                                            یا عنوان را دستی وارد کن:
                                        </label>
                                        <input type="text" maxLength={60} value={formData.productType}
                                               onChange={(e) => setFormData((p) => ({ ...p, productType: e.target.value }))}
                                               placeholder="مثال: ماکارونی فرمی ۵۰۰ گرمی" className={inputCls()} />
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <SectionTitle icon={Package} text="واحد فروش" />
                                <button type="button" onClick={() => setUnitModalOpen(true)}
                                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400
                                            flex items-center gap-1 hover:gap-1.5 transition-all">
                                    <Plus className="w-3 h-3" /> واحدهای اختصاصی کاتالوگ
                                </button>
                            </div>

                            {(localUnitSettings.length > 0 || suggestedUnitIds.length > 0) && (
                                <div className="flex flex-wrap gap-1.5">
                                    {localUnitSettings.map((s) => {
                                        const u = allUnits.find((x: any) => x.id === s.unitId);
                                        if (!u) return null;
                                        const isSelected = formData.unitId === u.id;
                                        return (
                                            <button key={s.unitId} type="button" onClick={() => selectUnit(u.id, u.title)}
                                                    className={cn('h-8 px-3 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1',
                                                        isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-outline-variant/50 text-on-surface-variant hover:border-amber-500/50')}>
                                                {u.title}{s.containsQty ? ` (${s.containsQty} عددی)` : ''}
                                            </button>
                                        );
                                    })}
                                    {suggestedUnitIds.filter((uid) => !localUnitSettings.some((s) => s.unitId === uid)).map((uid) => {
                                        const u = allUnits.find((x: any) => x.id === uid);
                                        if (!u) return null;
                                        const isSelected = formData.unitId === u.id;
                                        return (
                                            <button key={uid} type="button" onClick={() => selectUnit(u.id, u.title)}
                                                    className={cn('h-8 px-3 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1',
                                                        isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-outline-variant/50 text-on-surface-variant hover:border-amber-500/50')}>
                                                {u.title}
                                                <span className="text-[8px] opacity-70">این دسته</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <DropSelector
                                label="واحد فروش"
                                value={formData.unitId}
                                options={unitOptions}
                                placeholder="انتخاب واحد…"
                                onChange={(val, opt) => selectUnit(val, opt.label)}
                                renderOption={(o) => (
                                    <span className="flex items-center gap-1.5 text-xs text-on-surface">
                                        {o.label}
                                        {o.extra?.catQty != null && (
                                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                                {o.extra.catQty} عددی
                                            </span>
                                        )}
                                        {o.extra?.suggested && o.extra?.catQty == null && (
                                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">این دسته</span>
                                        )}
                                    </span>
                                )}
                            />

                            {formData.unitQty != null && (
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5">
                                        <Pencil className="w-3 h-3 text-amber-500" />
                                        تعداد {baseUnitTitle} در هر {unitName}
                                        {!formData.unitIsVariableQty && <span className="text-[9px] text-on-surface-variant/50">(ثابت)</span>}
                                    </label>
                                    {formData.unitIsVariableQty ? (
                                        <NumberInput value={formData.unitQty || undefined}
                                                     onChange={(val) => handleUnitQtyChange(val || null)}
                                                     unit={baseUnitTitle} className="h-10" />
                                    ) : (
                                        <p className="text-xs font-bold text-on-surface bg-surface-container-high/60 px-3 py-2 rounded-lg">
                                            {formData.unitQty.toLocaleString('fa-IR')} {baseUnitTitle}
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* ═══ مرحله ۲: قیمت — دو شکلی ═══ */}
                {currentStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="rounded-2xl border border-amber-300/40 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10 p-4 flex items-center gap-2.5">
                            <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                                {isWholesale ? 'تعیین قیمت عمده' : 'تعیین قیمت فروش'}
                            </h3>
                        </div>

                        {isWholesale ? (
                            <>
                                <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                        <StepBadge n={1} /> حداقل حجم فروش ({unitName}) <span className="text-error">*</span>
                                    </label>
                                    <NumberInput value={formData.minQuantity || undefined}
                                                 onChange={(val) => setFormData((p) => ({ ...p, minQuantity: val || 0 }))}
                                                 unit={unitName} className="w-full h-14 font-extrabold" />
                                </section>
                                <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                        <StepBadge n={2} /> قیمت تکی (هر {baseUnitTitle}) <span className="text-error">*</span>
                                    </label>
                                    <p className="text-[10px] text-on-surface-variant/60">
                                        قیمت عمده هر {baseUnitTitle} برای خرید {formData.minQuantity.toLocaleString('fa-IR')} {unitName}
                                    </p>
                                    <NumberInput value={formData.singleUnitPrice || undefined}
                                                 onChange={handleSingleUnitPriceChange}
                                                 unit={`${CURRENCY}/${baseUnitTitle}`} className="w-full h-12" />
                                </section>
                                <section className="rounded-2xl bg-surface-container-low/60 border border-amber-500/30 p-4 space-y-2.5">
                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                        <StepBadge n={3} /> قیمت هر {unitName} (واحد فروش عمده) <span className="text-error">*</span>
                                    </label>
                                    <NumberInput value={formData.unitPrice || undefined}
                                                 onChange={handleUnitPriceChange}
                                                 unit={CURRENCY} className="w-full h-14 text-xl font-extrabold" />
                                    {formData.singleUnitPrice > 0 && formData.unitQty && (
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 rounded-lg px-3 py-2">
                                            💡 {formData.singleUnitPrice.toLocaleString('fa-IR')} × {formData.unitQty.toLocaleString('fa-IR')} {baseUnitTitle} = {formData.unitPrice.toLocaleString('fa-IR')} {CURRENCY}
                                        </p>
                                    )}
                                </section>
                                <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                        <StepBadge n={4} /> موجودی تضمینی ({unitName}) <span className="text-error">*</span>
                                    </label>
                                    <NumberInput value={formData.availableQuantity || undefined}
                                                 onChange={(val) => setFormData((p) => ({ ...p, availableQuantity: val || 0 }))}
                                                 unit={unitName} className="w-full h-12" />
                                </section>
                                <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                        <StepBadge n={5} /> قیمت تکی مصرف‌کننده (اختیاری)
                                    </label>
                                    <p className="text-[10px] text-on-surface-variant/60">سود خریدار عمده از این محاسبه می‌شود</p>
                                    <NumberInput value={formData.consumerPrice || undefined}
                                                 onChange={(val) => setFormData((p) => ({ ...p, consumerPrice: val || 0 }))}
                                                 unit={`${CURRENCY}/${baseUnitTitle}`} className="w-full h-12" />
                                    {liveProfit !== null && (
                                        liveProfit < 0
                                            ? <p className="text-[11px] text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg px-3 py-2">⚠️ قیمت مصرف‌کننده از قیمت عمده کمتر است!</p>
                                            : <p className="text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg px-3 py-2">💰 سود خریدار عمده از هر {baseUnitTitle}: {liveProfit.toLocaleString('fa-IR')} {CURRENCY}</p>
                                    )}
                                </section>

                                {/* ✅ تخفیف حجمی */}
                                <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <SectionTitle icon={Wallet} text="تخفیف حجمی (اختیاری)" />
                                        <button type="button"
                                                onClick={() => setFormData((p) => ({
                                                    ...p,
                                                    volumeTiers: [...p.volumeTiers, { minQty: (p.volumeTiers.at(-1)?.minQty ?? 0) + 5, price: 0 }],
                                                }))}
                                                className="h-7 px-2.5 rounded-lg border border-amber-500/40 text-amber-600 dark:text-amber-400
                                                    text-[10px] font-bold flex items-center gap-1 hover:bg-amber-500/10">
                                            <Plus className="w-3 h-3" /> پلهٔ جدید
                                        </button>
                                    </div>
                                    {formData.volumeTiers.map((tier, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="text-[10px] text-on-surface-variant/70 whitespace-nowrap">خرید {i + 2}+:</span>
                                            <NumberInput value={tier.minQty || undefined}
                                                         onChange={(v) => setFormData((p) => {
                                                             const u = [...p.volumeTiers]; u[i] = { ...u[i], minQty: v || 0 }; return { ...p, volumeTiers: u };
                                                         })}
                                                         unit={unitName} className="h-9 flex-1" />
                                            <span className="text-[10px] text-on-surface-variant/60 whitespace-nowrap">هر {baseUnitTitle}:</span>
                                            <NumberInput value={tier.price || undefined}
                                                         onChange={(v) => setFormData((p) => {
                                                             const u = [...p.volumeTiers]; u[i] = { ...u[i], price: v || 0 }; return { ...p, volumeTiers: u };
                                                         })}
                                                         unit={CURRENCY} className="h-9 flex-1" />
                                            <button type="button"
                                                    onClick={() => setFormData((p) => ({ ...p, volumeTiers: p.volumeTiers.filter((_, j) => j !== i) }))}
                                                    className="w-7 h-7 rounded-lg text-error hover:bg-error/10 flex items-center justify-center flex-shrink-0">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.volumeTiers.length === 0 && (
                                        <p className="text-[10px] text-on-surface-variant/60 leading-5">
                                            مثلاً: خرید ۵ کارتن، هر {baseUnitTitle} ۱۲۰ هزار تومان — برای مشتری‌های حجیم.
                                        </p>
                                    )}
                                </section>

                                {/* ✅ قیمت اشانتیون */}
                                <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                        <StepBadge n={7} /> قیمت اشانتیون (اختیاری)
                                    </label>
                                    <p className="text-[10px] text-on-surface-variant/60">برای کالاهایی که اشانتیون خرید دارند</p>
                                    <NumberInput value={formData.giftPrice || undefined}
                                                 onChange={(v) => setFormData((p) => ({ ...p, giftPrice: v }))}
                                                 unit={`${CURRENCY}/${baseUnitTitle}`} className="w-full h-12" />
                                </section>
                            </>
                        ) : (
                            <>
                                <section className="rounded-2xl bg-surface-container-low/60 border border-amber-500/30 p-4 space-y-2.5">
                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                        <StepBadge n={1} /> قیمت هر {unitName} <span className="text-error">*</span>
                                    </label>
                                    <NumberInput value={formData.unitPrice || undefined}
                                                 onChange={(v) => setFormData((p) => ({ ...p, unitPrice: v }))}
                                                 unit={CURRENCY} className="w-full h-14 text-xl font-extrabold" />
                                </section>
                                <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                        <StepBadge n={2} /> موجودی ({unitName}) <span className="text-on-surface-variant/50 text-[10px]">(اختیاری)</span>
                                    </label>
                                    <NumberInput value={formData.availableQuantity || undefined}
                                                 onChange={(val) => setFormData((p) => ({ ...p, availableQuantity: val || 0 }))}
                                                 unit={unitName} className="w-full h-12" />
                                </section>
                            </>
                        )}
                    </div>
                )}

                {/* ═══ مرحله ۳: موقعیت و اعتبار ═══ */}
                {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                            <SectionTitle icon={MapPin} text="محل کالا" />
                            <IranLocationSelector
                                provinceCode={formData.provinceCode}
                                cityCode={formData.cityCode}
                                onProvinceChange={(code, label) => setFormData((p) => ({ ...p, provinceCode: code, provinceLabel: label, cityCode: '', cityLabel: '' }))}
                                onCityChange={(code, label) => setFormData((p) => ({ ...p, cityCode: code, cityLabel: label }))}
                            />
                        </section>
                        <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                            <SectionTitle icon={Clock} text="مدت اعتبار قیمت" />
                            <div className="grid grid-cols-3 gap-2">
                                {VALIDITY_OPTIONS.map((opt) => (
                                    <button key={opt.value} type="button"
                                            onClick={() => setFormData((p) => ({ ...p, validityHours: opt.value }))}
                                            className={cn('h-12 rounded-xl text-sm font-medium border-2 transition-all',
                                                formData.validityHours === opt.value
                                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 font-bold'
                                                    : 'border-outline-variant/40 hover:border-amber-500/30')}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-on-surface-variant">این قیمت تا {formData.validityHours} ساعت روی کاتالوگت معتبر است.</p>
                        </section>
                        <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4">
                            <SectionTitle icon={Package} text="توضیحات (اختیاری)" />
                            <textarea value={formData.description}
                                      onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                                      rows={3} placeholder="توضیحات تکمیلی"
                                      className="w-full min-h-[72px] py-2.5 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest
                                          border border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-amber-500/30
                                          focus:border-amber-500 outline-none transition-all resize-none" />
                        </section>
                    </div>
                )}

                {/* ═══ مرحله ۴: بررسی ═══ */}
                {currentStep === 4 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-emerald-500 grid place-items-center shadow-sm shadow-emerald-500/30">
                                <ClipboardCheck className="w-5 h-5 text-white" />
                            </span>
                            <div>
                                <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">بررسی نهایی</h3>
                                <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70">پس از تأیید، کالا روی کاتالوگت منتشر می‌شود.</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
                            <div className="px-4 pb-4 pt-4 space-y-1.5">
                                <div className="flex justify-between text-xs"><span className="text-on-surface-variant">کاتالوگ</span><span className="font-medium text-on-surface">{selectedCatalog.name}</span></div>
                                {formData.categoryId && selectedCategoryNode && (
                                    <div className="flex justify-between text-xs"><span className="text-on-surface-variant">دسته</span><span className="font-medium text-on-surface">{selectedCategoryNode.title}</span></div>
                                )}
                                <div className="flex justify-between text-xs"><span className="text-on-surface-variant">کالا</span><span className="font-medium text-on-surface">{formData.productType || '—'}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-on-surface-variant">تصاویر</span><span className="font-medium text-on-surface">{uploadedCount} عدد</span></div>
                                <div className="flex justify-between text-xs"><span className="text-on-surface-variant">واحد</span><span className="font-medium text-on-surface">{unitName}{formData.unitQty ? ` (${formData.unitQty.toLocaleString('fa-IR')} ${baseUnitTitle})` : ''}</span></div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-on-surface-variant">{isWholesale ? 'حداقل حجم' : 'موجودی'}</span>
                                    <span className="font-medium text-on-surface">{(isWholesale ? formData.minQuantity : formData.availableQuantity).toLocaleString('fa-IR')} {unitName}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-on-surface-variant">{isWholesale ? 'قیمت عمده' : 'قیمت'}</span>
                                    <span className="font-extrabold text-amber-600 dark:text-amber-400">{formData.unitPrice.toLocaleString('fa-IR')} {CURRENCY}</span>
                                </div>
                                {isWholesale && formData.volumeTiers.length > 0 && (
                                    <div className="flex justify-between text-xs"><span className="text-on-surface-variant">تخفیف حجمی</span><span className="font-medium text-on-surface">{formData.volumeTiers.length.toLocaleString('fa-IR')} پله</span></div>
                                )}
                                {isWholesale && formData.giftPrice > 0 && (
                                    <div className="flex justify-between text-xs"><span className="text-on-surface-variant">قیمت اشانتیون</span><span className="font-medium text-on-surface">{formData.giftPrice.toLocaleString('fa-IR')} {CURRENCY}</span></div>
                                )}
                                {liveProfit !== null && liveProfit >= 0 && (
                                    <div className="flex justify-between text-xs"><span className="text-on-surface-variant">سود خریدار عمده</span><span className="font-bold text-emerald-600">{liveProfit.toLocaleString('fa-IR')} {CURRENCY}</span></div>
                                )}
                                <div className="flex justify-between text-xs"><span className="text-on-surface-variant">محل</span><span className="font-medium text-on-surface">{formData.cityLabel || '—'}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-on-surface-variant">اعتبار</span><span className="font-medium text-on-surface">{formData.validityHours} ساعت</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map((s) => (
                                <button key={s} type="button" onClick={() => goToStep(s)}
                                        className="h-9 rounded-xl border border-outline-variant/40 text-[11px] font-bold
                                            text-on-surface-variant hover:text-amber-600 hover:border-amber-500/40 transition-colors">
                                    ویرایش بخش {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ناوبری مراحل */}
                <div className="flex items-center justify-between pt-2">
                    {currentStep > 1 ? (
                        <button type="button" onClick={prevStep}
                                className="h-11 px-5 rounded-xl border-2 border-outline-variant/40 bg-white dark:bg-gray-900
                                    text-sm font-medium text-on-surface flex items-center gap-2 hover:bg-surface-container-lowest transition-all">
                            قبلی <ArrowLeft className="w-4 h-4" />
                        </button>
                    ) : <div />}
                    {currentStep < TOTAL_STEPS ? (
                        <button type="button" onClick={nextStep}
                                className="h-11 px-6 rounded-xl bg-amber-500 text-white text-sm font-bold flex items-center gap-2
                                    hover:bg-amber-600 transition-all active:scale-95 shadow-md shadow-amber-200/50 dark:shadow-none">
                            بعدی <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button type="button" onClick={handleSubmit} disabled={submitting}
                                className="h-11 px-6 rounded-xl bg-amber-500 text-white text-sm font-extrabold flex items-center gap-2
                                    hover:bg-amber-600 transition-all active:scale-95 shadow-md shadow-amber-200/50 dark:shadow-none
                                    disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> در حال ثبت…</>
                                : <><Check className="w-4 h-4" /> {isEditMode ? 'ذخیره تغییرات' : 'ثبت نهایی'}</>}
                        </button>
                    )}
                </div>
            </main>

            {/* مودال‌ها */}
            <UnitSettingsModal
                isOpen={unitModalOpen}
                onClose={() => setUnitModalOpen(false)}
                catalogId={catalogId}
                initialUnits={localUnitSettings}
                onSaved={(units) => {
                    setLocalUnitSettings(units);
                    queryClient.invalidateQueries({ queryKey: ['catalog', 'by-id', catalogId] });
                }}
            />
            <CategorySettingsModal
                isOpen={catModalOpen}
                onClose={() => setCatModalOpen(false)}
                catalogId={catalogId}
                initialTree={localCategoryTree}
                onSaved={(tree) => {
                    setLocalCategoryTree(tree);
                    queryClient.invalidateQueries({ queryKey: ['catalog', 'by-id', catalogId] });
                }}
            />
        </div>
    );
}