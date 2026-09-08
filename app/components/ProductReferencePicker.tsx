// app/components/ProductReferencePicker.tsx
'use client';

import React, { useState } from 'react';
import EntityPicker, { EntityValue } from './EntityPicker';
import { apiService } from '@/lib/api/apiService';
import { useUploadFile } from '@/lib/api/apiHooks';
import { Package, Camera, Tag, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function ProductReferencePicker({
    value,
    onChange,
    category,
    placeholder = 'مثلاً: تن ماهی ۲۵۰ گرمی مکنزی',
    label = 'کالا',
    required = false,
    error,
}: Props) {
    return (
        <EntityPicker
            value={value}
            onChange={onChange}
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
            })}
            updateFn={(id, data) => apiService.product.update(id, data)}
            renderCreateFields={({ title, setTitle, dataRef }) => (
                <CreateProductExtraFields
                    title={title}
                    setTitle={setTitle}
                    category={category}
                    dataRef={dataRef}
                />
            )}
            renderEditFields={({ title, setTitle, dataRef }) => (
                <CreateProductExtraFields
                    title={title}
                    setTitle={setTitle}
                    category={category}
                    dataRef={dataRef}
                />
            )}
            queryKey={`products-picker-${category || 'all'}`}
            createLabel="افزودن کالای جدید به مرکز"
            minSearchChars={2}
            pageSize={10}
            selectTitle="انتخاب از مرکز کالا"
            createTitle="افزودن کالای جدید"
            editTitle="ویرایش کالا"
            duplicateMessage="این کالا قبلاً در مرکز کالا اضافه شده. از لیست بالا انتخاب کنید."
            createHint="این کالا در مرکز وجود ندارد؟ یک بار آن را اضافه کنید تا همه جا قابل استفاده باشد"
            showMineOnly={true}
            mineToggleLabel="کالاهای من"
            renderValue={(v) => (
                <>
                    {(v as ProductValue).thumbnailUrl || (v as ProductValue).imageUrl ? (
                        <img src={(v as ProductValue).thumbnailUrl || (v as ProductValue).imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                        <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-primary" />
                        </span>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{v.title}</p>
                        {(v as ProductValue).brandTitle && (
                            <p className="text-[10px] text-on-surface-variant truncate">برند: {(v as ProductValue).brandTitle}</p>
                        )}
                    </div>
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                </>
            )}
            renderItem={(item) => (
                <>
                    {item.thumbnailUrl || item.imageUrl ? (
                        <img src={item.thumbnailUrl || item.imageUrl} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                        <span className="w-11 h-11 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-on-surface-variant/50" />
                        </span>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{item.title}</p>
                        {item.brand?.title && (
                            <p className="text-[10px] text-on-surface-variant truncate">برند: {item.brand.title}</p>
                        )}
                    </div>
                    {value?.id === item.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </>
            )}
        />
    );
}

// ═══════════════════════════════════════════════════════════
// فرم ایجاد/ویرایش کالا — فقط عکس (بدون برند)
// ✅ برند موجودیت مستقل است — در فرم والد به‌صورت جداگانه انتخاب می‌شه
// ═══════════════════════════════════════════════════════════
function CreateProductExtraFields({
    title,
    setTitle,
    category,
    dataRef,
}: {
    title: string;
    setTitle: (v: string) => void;
    category?: string;
    dataRef: React.MutableRefObject<{ [key: string]: any }>;
}) {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const uploadMut = useUploadFile();

    React.useEffect(() => {
        dataRef.current = {
            ...dataRef.current,
            imageUrl: imageUrl || undefined,
        };
    }, [imageUrl, dataRef]);

    const handleFileSelect = (file: File | null) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setLogoPreview(url);
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
            const path = result.path || result.thumbnailPath || '';
            setImageUrl(path);
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
                    <label className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0
                        border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5
                        transition-all cursor-pointer flex flex-col items-center justify-center gap-1">
                        {uploading ? (
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        ) : logoPreview || imageUrl ? (
                            <img src={logoPreview || imageUrl} alt="" className="w-full h-full object-cover absolute inset-0" />
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
            {/* ✅ برند حذف شد — موجودیت مستقل است، در فرم والد انتخاب می‌شه */}
        </>
    );
}

