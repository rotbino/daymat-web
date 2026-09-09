// app/components/ProductReferencePicker.tsx
'use client';

import React, { useState } from 'react';
import EntityPicker, { EntityValue } from './EntityPicker';
import { apiService } from '@/lib/api/apiService';
import { useUploadFile } from '@/lib/api/apiHooks';
import { Package, Camera, Tag, Loader2, Check, X, Plus } from 'lucide-react';

export interface ProductValue extends EntityValue {
    brandId?: string;
    brandTitle?: string;
    category?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
}

interface Props {
    value: ProductValue | null;
    onChange: (product: ProductValue | null) => void;
    category?: string;
    placeholder?: string;
    label?: string;
    required?: boolean;
    error?: string;
}

/** ✅ نرمال‌سازی مقدار انتخاب‌شده — برند از آبجکت brand استخراج می‌شه تا «بدون برند» کاذب نبینیم */
function normalizeProductValue(v: any): ProductValue {
    if (!v) return v;
    return {
        ...v,
        brandId: v.brandId ?? v.brand?.id ?? undefined,
        brandTitle: v.brandTitle ?? v.brand?.title ?? undefined,
    };
}

/**
 * ProductReferencePicker — انتخابگر کالای مرجع
 *
 * ✅ برند جزء ویژگی‌های کالاست (نه آگهی)
 * ✅ فرم create/edit: عنوان + عکس + برند
 * ✅ سرچ روی عنوان، کلمات کلیدی و نام برند
 */
export default function ProductReferencePicker({
    value,
    onChange,
    category,
    placeholder = 'مثلاً: تن ماهی ۲۵۰ گرمی مکنزی',
    label,
    required = false,
    error,
}: Props) {
    return (
        <EntityPicker
            value={value}
            onChange={(v) => onChange(v ? normalizeProductValue(v) : null)}
            label={label}
            placeholder={placeholder}
            required={required}
            error={error}
            icon={<Package className="w-3.5 h-3.5 text-on-surface-variant" />}
            fetchFn={async (params) => {
                const res = await apiService.product.search(params.q, category, params.page, params.limit, params.mine);
                return { items: res.items, hasMore: res.hasMore };
            }}
            createFn={(data) => apiService.product.create({
                title: data.title,
                brandId: data.brandId,
                category,
                imageUrl: data.imageUrl,
                thumbnailUrl: data.imageUrl,
                specs: data.specs,
            })}
            updateFn={(id, data) => apiService.product.update(id, data)}
            deleteFn={(id) => apiService.product.delete(id)}
            renderCreateFields={({ dataRef }) => (
                <CreateProductExtraFields dataRef={dataRef} category={category} />
            )}
            renderEditFields={({ dataRef, initialData }) => (
                <CreateProductExtraFields dataRef={dataRef} initialData={initialData} category={category} />
            )}
            queryKey={`products-picker-${category || 'all'}`}
            createLabel="افزودن کالای جدید به مرجع"
            addButtonLabel="کالای جدید"
            emptyHint="اگر این کالا در مرجع وجود ندارد؟ یک بار آن را اضافه کنید تا هم شما و هم بقیه از آن استفاده کنند."
            minSearchChars={2}
            pageSize={10}
            selectTitle="انتخاب از مرجع کالا"
            createTitle="افزودن کالای جدید"
            editTitle="ویرایش کالا"
            duplicateMessage="این کالا قبلاً در مرجع کالا اضافه شده. از لیست بالا انتخاب کنید."
            createHint="این کالا در مرجع وجود ندارد؟ یک بار آن را اضافه کنید تا همه جا قابل استفاده باشد"
            showMineOnly={true}
            mineToggleLabel="مرجع من"
            renderValue={(v) => (
                <>
                    {(v as ProductValue).thumbnailUrl || (v as ProductValue).imageUrl ? (
                        <img src={(v as ProductValue).thumbnailUrl || (v as ProductValue).imageUrl} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0 ring-1 ring-primary/20" />
                    ) : (
                        <span className="w-11 h-11 rounded-xl bg-primary/10 grid place-items-center flex-shrink-0">
                            <Package className="w-5 h-5 text-primary" />
                        </span>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{v.title}</p>
                        <div className="mt-1">
                            {(v as ProductValue).brandTitle ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.07] border border-primary/15 px-1.5 py-0.5">
                                    <Tag className="w-2.5 h-2.5 text-primary" />
                                    <span className="text-[9px] font-bold text-primary">{(v as ProductValue).brandTitle}</span>
                                </span>
                            ) : (
                                <span className="text-[9px] text-on-surface-variant/60">بدون برند</span>
                            )}
                        </div>
                    </div>
                </>
            )}
            renderItem={(item) => (
                <>
                    {item.thumbnailUrl || item.imageUrl ? (
                        <img src={item.thumbnailUrl || item.imageUrl} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                        <span className="w-11 h-11 rounded-xl bg-surface-container-high grid place-items-center flex-shrink-0">
                            <Package className="w-5 h-5 text-on-surface-variant/50" />
                        </span>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{item.title}</p>
                        {item.brand?.title && (
                            <p className="text-[10px] text-on-surface-variant truncate mt-0.5">برند: {item.brand.title}</p>
                        )}
                    </div>
                    {value?.id === item.id && (
                        <span className="w-6 h-6 rounded-full bg-primary grid place-items-center flex-shrink-0 shadow-sm">
                            <Check className="w-3.5 h-3.5 text-on-primary" />
                        </span>
                    )}
                </>
            )}
        />
    );
}

// ═══════════════════════════════════════════════════════════
// فرم create/edit کالا — عکس + برند
// ✅ برند جزء ویژگی‌های کالاست
// ═══════════════════════════════════════════════════════════
function CreateProductExtraFields({
    dataRef,
    initialData,
    category,
}: {
    dataRef: React.MutableRefObject<{ [key: string]: any }>;
    initialData?: any;
    category?: string;
}) {
    const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || initialData?.thumbnailUrl || '');
    const [brandValue, setBrandValue] = useState<EntityValue | null>(
        initialData?.brand ? { id: initialData.brand.id, title: initialData.brand.title } : null
    );
    // ✅ ویژگی‌های کالا — مال کالاست نه آگهی (JSON روی ProductReference)
    // ✅ unit: ویژگی‌های واحد‌دار مثل وزن — مقدار نهایی «۲۵۰ گرم» ذخیره می‌شه
    const [specs, setSpecs] = useState<{ key: string; value: string; unitOn: boolean; unit: string }[]>(() => {
        const s = initialData?.specs;
        if (s && typeof s === 'object' && !Array.isArray(s)) {
            const rows = Object.entries(s).map(([key, value]) => ({ key, value: String(value ?? ''), unitOn: false, unit: '' }));
            return rows.length > 0 ? rows : [{ key: '', value: '', unitOn: false, unit: '' }];
        }
        return [{ key: '', value: '', unitOn: false, unit: '' }];
    });
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const uploadMut = useUploadFile();

    React.useEffect(() => {
        dataRef.current = {
            ...dataRef.current,
            imageUrl: imageUrl || undefined,
            brandId: brandValue?.id || undefined,
        };
    }, [imageUrl, brandValue, dataRef]);

    // ✅ سینک specs به dataRef — فقط ردیف‌های کامل (کلید و مقدار هر دو پر)
    // ✅ ویژگی واحد‌دار: مقدار + واحد در یک رشته (مثل «۲۵۰ گرم») — سازگار با بک‌اند Record<string,string>
    React.useEffect(() => {
        const obj: Record<string, string> = {};
        for (const row of specs) {
            const k = row.key.trim();
            const v = row.value.trim();
            const u = row.unitOn ? row.unit.trim() : '';
            if (k && v) obj[k] = u ? `${v} ${u}` : v;
        }
        dataRef.current = {
            ...dataRef.current,
            specs: Object.keys(obj).length > 0 ? obj : undefined,
        };
    }, [specs, dataRef]);

    const handleFileSelect = (file: File | null) => {
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));
        uploadImage(file);
    };

    const uploadImage = async (file: File) => {
        setUploading(true);
        try {
            const result = await uploadMut.mutateAsync({
                file,
                model: 'ProductReference',
                modelId: 'temp',
                fieldKey: 'product-image',
            });
            setImageUrl(result.path || result.thumbnailPath || '');
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            {/* عکس کالا */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">تصویر کالا</label>
                <div className="flex items-center gap-3">
                    <label className="relative w-[4.5rem] h-[4.5rem] rounded-2xl overflow-hidden flex-shrink-0
                        border-2 border-dashed border-primary/35 hover:border-primary/70 hover:bg-primary/[0.06] hover:scale-[1.03]
                        transition-all cursor-pointer flex flex-col items-center justify-center gap-1 bg-primary/[0.02]">
                        {uploading ? (
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        ) : imagePreview || imageUrl ? (
                            <img src={imagePreview || imageUrl} alt="" className="w-full h-full object-cover absolute inset-0" />
                        ) : (
                            <>
                                <Camera className="w-6 h-6 text-primary/60" />
                                <span className="text-[9px] font-bold text-primary/60 text-center px-1">آپلود عکس</span>
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                        />
                    </label>
                    <p className="text-[10px] text-on-surface-variant/70 leading-5">
                        عکس کالا رو آپلود کن. این عکس برای همه‌ی آگهی‌های این کالا استفاده می‌شه.
                    </p>
                </div>
            </div>

            {/* برند — جزء ویژگی‌های کالا */}
            <EntityPicker
                value={brandValue}
                onChange={setBrandValue}
                label="برند کالا (اختیاری)"
                placeholder="مثلاً: مکنزی"
                icon={<Tag className="w-3.5 h-3.5 text-on-surface-variant" />}
                fetchFn={async (params) => {
                    const res = await apiService.brand.search(params.q, category, params.page, params.limit);
                    return { items: res.items, hasMore: res.hasMore };
                }}
                createFn={async (data) => {
                    return apiService.brand.create({ title: data.title, category });
                }}
                deleteFn={(id) => apiService.brand.delete(id)}
                queryKey={`brands-in-product-${category || 'all'}`}
                createLabel="افزودن برند جدید"
                addButtonLabel="ثبت برند جدید"
                emptyHint="اگر این برند در لیست برندها وجود ندارد؟ یک بار آن را اضافه کنید تا همه از آن استفاده کنن."
                minSearchChars={2}
                pageSize={10}
                selectTitle="انتخاب برند"
                createTitle="افزودن برند جدید"
                editTitle="ویرایش برند"
                duplicateMessage="این برند قبلاً اضافه شده. با جستجو آن را پیدا و انتخاب کنید."
                createHint="اگر این برند در لیست برندها وجود ندارد؟ یک بار آن را اضافه کنید تا همه از آن استفاده کنن."
                renderItem={(item) => (
                    <>
                        {item.logoUrl ? (
                            <img src={item.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                            <span className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                                <Tag className="w-4 h-4 text-on-surface-variant/50" />
                            </span>
                        )}
                        <span className="flex-1 text-sm font-medium text-on-surface truncate">{item.title}</span>
                        {brandValue?.id === item.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                    </>
                )}
            />

            {/* ✅ ویژگی‌های کالا — مال کالاست و همه‌جا استفاده می‌شه */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface block">ویژگی‌های کالا (اختیاری)</label>
                <p className="text-[10px] text-on-surface-variant/60 -mt-1.5 leading-4">
                    مثلاً: وزن = ۲۵۰ گرم، کشور سازنده = ایران — این ویژگی‌ها مال خود کالاست و در همه آگهی‌هایش نمایش داده می‌شود.
                    {` `}اگه ویژگی واحد داره (مثل وزن یا ابعاد)، دکمهٔ «واحد» رو بزن.
                </p>
                {specs.map((row, i) => (
                    <div key={i} className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <input
                                value={row.key}
                                onChange={(e) => setSpecs((p) => p.map((r, j) => j === i ? { ...r, key: e.target.value } : r))}
                                placeholder="نام ویژگی"
                                className="flex-1 h-9 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-right"
                            />
                            <span className="text-[10px] text-on-surface-variant/40 flex-shrink-0">=</span>
                            <input
                                value={row.value}
                                onChange={(e) => setSpecs((p) => p.map((r, j) => j === i ? { ...r, value: e.target.value } : r))}
                                placeholder={row.unitOn ? 'مثلاً ۲۵۰' : 'مقدار'}
                                className={row.unitOn
                                    ? 'flex-1 h-9 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-right'
                                    : 'flex-[1.3] h-9 px-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-right'}
                            />
                            {/* ✅ تیک واحد — برای ویژگی‌های واحد‌دار مثل وزن */}
                            {row.unitOn ? (
                                <div className="relative flex-shrink-0 w-[76px]">
                                    <input
                                        value={row.unit}
                                        onChange={(e) => setSpecs((p) => p.map((r, j) => j === i ? { ...r, unit: e.target.value } : r))}
                                        placeholder="کیلوگرم"
                                        list="daymat-spec-units"
                                        className="w-full h-9 pl-6 pr-2.5 rounded-lg bg-primary/[0.04] border border-primary/35 text-xs outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all text-right"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setSpecs((p) => p.map((r, j) => j === i ? { ...r, unitOn: false, unit: '' } : r))}
                                        className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/40 hover:text-error transition-colors"
                                        title="حذف واحد"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setSpecs((p) => p.map((r, j) => j === i ? { ...r, unitOn: true } : r))}
                                    className="flex-shrink-0 h-9 px-2 rounded-lg border border-outline-variant/40 text-[10px] font-bold text-on-surface-variant/70 hover:text-primary hover:border-primary/45 hover:bg-primary/[0.04] flex items-center gap-0.5 transition-colors"
                                    title="این ویژگی واحد داره (مثل وزن)"
                                >
                                    <Plus className="w-3 h-3" /> واحد
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setSpecs((p) => p.length > 1 ? p.filter((_, j) => j !== i) : [{ key: '', value: '', unitOn: false, unit: '' }])}
                                className="flex-shrink-0 w-7 h-7 rounded-lg text-on-surface-variant/40 hover:text-error hover:bg-error/10 grid place-items-center transition-colors"
                                title="حذف"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
                {/* ✅ واحدهای پرکاربرد — پیشنهاد سریع */}
                <datalist id="daymat-spec-units">
                    <option value="گرم" />
                    <option value="کیلوگرم" />
                    <option value="تن" />
                    <option value="لیتر" />
                    <option value="میلی‌لیتر" />
                    <option value="متر" />
                    <option value="سانتی‌متر" />
                    <option value="عدد" />
                    <option value="بسته" />
                    <option value="کارتن" />
                </datalist>
                <button
                    type="button"
                    onClick={() => setSpecs((p) => [...p, { key: '', value: '', unitOn: false, unit: '' }])}
                    className="h-7 px-2.5 rounded-lg border border-primary/40 text-primary text-[10px] font-bold flex items-center gap-1 hover:bg-primary/10 transition-colors"
                >
                    <Plus className="w-3 h-3" /> ویژگی جدید
                </button>
            </div>
        </>
    );
}
