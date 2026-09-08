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
    placeholder = 'انتخاب از مرکز کالا...',
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
                thumbnailUrl: data.imageUrl,  // ✅ فعلاً thumbnail همون imageUrl
            })}
            queryKey={`products-picker-${category || 'all'}`}
            createLabel="افزودن کالای جدید به مرکز"
            minSearchChars={2}
            pageSize={10}
            showMineOnly={true}
            mineLabel="فقط کالاهای اضافه‌شده توسط من"
            renderCreateFields={({ title, setTitle, dataRef }) => (
                <CreateProductExtraFields
                    title={title}
                    setTitle={setTitle}
                    category={category}
                    dataRef={dataRef}
                />
            )}
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
// فرم ایجاد کالای جدید — عکس + برند
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
    const [brandId, setBrandId] = useState<string>('');
    const [brandTitle, setBrandTitle] = useState<string>('');
    const [brandSearch, setBrandSearch] = useState('');
    const [brandResults, setBrandResults] = useState<any[]>([]);
    const [brandSearching, setBrandSearching] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const uploadMut = useUploadFile();

    // ✅ dataRef رو آپدیت کن تا EntityPicker بتونه imageUrl و brandId رو بخونه
    React.useEffect(() => {
        dataRef.current = {
            ...dataRef.current,
            imageUrl: imageUrl || undefined,
            brandId: brandId || undefined,
        };
    }, [imageUrl, brandId, dataRef]);

    // search brand
    React.useEffect(() => {
        if (brandSearch.trim().length < 2) {
            setBrandResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setBrandSearching(true);
            try {
                const res = await apiService.brand.search(brandSearch, category, 1, 10);
                setBrandResults(res.items);
            } finally {
                setBrandSearching(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [brandSearch, category]);

    const handleFileSelect = (file: File | null) => {
        if (!file) return;
        setPendingFile(file);
        const url = URL.createObjectURL(file);
        setLogoPreview(url);
        // ✅ فعلاً imageUrl رو با object URL ست کن — بعد از create، آپلود واقعی انجام می‌شه
        // این یه مشکل داره: object URL فقط تو همون مرورگر کار می‌کنه
        // راه بهتر: قبل از create، عکس رو آپلود کن
        // بذار اینجا آپلود رو انجام بدیم
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

            {/* برند (اختیاری) */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">برند (اختیاری)</label>
                {brandId ? (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/30">
                        <Tag className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="flex-1 text-sm font-bold text-on-surface truncate">{brandTitle}</span>
                        <button
                            type="button"
                            onClick={() => { setBrandId(''); setBrandTitle(''); setBrandSearch(''); }}
                            className="text-[10px] text-error/60 hover:text-error"
                        >
                            حذف
                        </button>
                    </div>
                ) : (
                    <>
                        <input
                            type="text"
                            value={brandSearch}
                            onChange={(e) => setBrandSearch(e.target.value)}
                            placeholder="جستجوی برند... (حداقل ۲ حرف)"
                            className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        {brandSearching && (
                            <p className="text-[10px] text-on-surface-variant">در حال جستجو...</p>
                        )}
                        {brandResults.length > 0 && (
                            <div className="border border-outline-variant/30 rounded-xl max-h-40 overflow-y-auto scrollbar-slim">
                                {brandResults.map((b: any) => (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => {
                                            setBrandId(b.id);
                                            setBrandTitle(b.title);
                                            setBrandSearch('');
                                            setBrandResults([]);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-surface-container-low transition-colors"
                                    >
                                        {b.logoUrl ? (
                                            <img src={b.logoUrl} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                                        ) : (
                                            <span className="w-7 h-7 rounded bg-surface-container-high flex items-center justify-center flex-shrink-0">
                                                <Tag className="w-3.5 h-3.5 text-on-surface-variant/50" />
                                            </span>
                                        )}
                                        <span className="flex-1 text-xs font-medium text-on-surface truncate">{b.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {brandSearch.trim().length >= 2 && !brandSearching && brandResults.length === 0 && (
                            <p className="text-[10px] text-on-surface-variant">
                                برندی پیدا نشد. می‌تونی بعداً اضافه کنی.
                            </p>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
