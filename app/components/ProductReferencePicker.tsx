// app/components/ProductReferencePicker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Plus, Check, Loader2, Package, ImageIcon } from 'lucide-react';
import { useProductSearch, useCreateProduct } from '@/lib/api/apiHooks';
import { cn } from '@/lib/utils';
import BrandPicker, { BrandValue } from './BrandPicker';

export interface ProductValue {
    id: string;
    title: string;
    brandId?: string;
    brandTitle?: string;
    category?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
}

interface Props {
    value: ProductValue | null;
    onChange: (product: ProductValue | null) => void;
    /** دسته کالا برای فیلتر */
    category?: string;
    placeholder?: string;
    label?: string;
    required?: boolean;
    error?: string;
}

/**
 * ProductReferencePicker — انتخابگر کالای مرجع
 *
 * UX:
 * ۱. کاربر روی دکمه «انتخاب کالا» کلیک می‌کنه
 * ۲. مدال باز می‌شه با سرچ
 * ۳. سرش می‌کنه (حداقل ۲ حرف) → نتایج با عکس و برند
 * ۴. اگه پیدا نشد → دکمه «افزودن کالای جدید»
 * ۵. فرم کالای جدید: عنوان + برند (اختیاری) + عکس (اختیاری)
 * ۶. انتخاب → کالا با عکس روی دکمه
 *
 * ✅ سرچ روی title و keywords (مثلاً «تن» هم «کنسرو ماهی» رو پیدا می‌کنه)
 */
export default function ProductReferencePicker({
    value,
    onChange,
    category,
    placeholder = 'انتخاب کالا...',
    label = 'کالا',
    required = false,
    error,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const clear = () => onChange(null);

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-xs font-bold text-on-surface block flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-on-surface-variant" />
                    {label}
                    {required && <span className="text-primary">*</span>}
                    {!required && value && (
                        <button type="button" onClick={clear} className="text-[10px] text-error/60 hover:text-error mr-2">
                            حذف
                        </button>
                    )}
                </label>
            )}

            {/* دکمه انتخاب کالا */}
            {value ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="w-full h-14 px-3 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/30 hover:border-primary/50 transition-all text-right"
                >
                    {value.thumbnailUrl || value.imageUrl ? (
                        <img src={value.thumbnailUrl || value.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                        <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-primary" />
                        </span>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{value.title}</p>
                        {value.brandTitle && (
                            <p className="text-[10px] text-on-surface-variant truncate">برند: {value.brandTitle}</p>
                        )}
                    </div>
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        'w-full h-11 px-3 flex items-center gap-2 rounded-xl bg-surface-container-lowest border transition-all text-right',
                        error
                            ? 'border-error'
                            : 'border-outline-variant/40 hover:border-primary/40',
                    )}
                >
                    <Package className="w-4 h-4 text-on-surface-variant/50" />
                    <span className="flex-1 text-sm text-on-surface-variant">{placeholder}</span>
                </button>
            )}

            {error && <p className="text-error text-[11px]">{error}</p>}

            {/* مدال انتخاب کالا */}
            {isOpen && (
                <ProductPickerModal
                    selected={value}
                    category={category}
                    onSelect={(product) => {
                        onChange(product);
                        setIsOpen(false);
                    }}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// مدال انتخاب کالا
// ═══════════════════════════════════════════════════════════
function ProductPickerModal({
    selected,
    category,
    onSelect,
    onClose,
}: {
    selected: ProductValue | null;
    category?: string;
    onSelect: (product: ProductValue) => void;
    onClose: () => void;
}) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [creatingNew, setCreatingNew] = useState(false);
    const [newProductTitle, setNewProductTitle] = useState('');
    const [newBrand, setNewBrand] = useState<BrandValue | null>(null);
    const createMut = useCreateProduct();

    // debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isFetching } = useProductSearch(debouncedSearch, category, debouncedSearch.length >= 2);
    const items = data?.items || [];

    const trimmedSearch = search.trim();
    const canCreateNew = trimmedSearch.length >= 2
        && !items.some((i: any) => i.title === trimmedSearch)
        && !creatingNew;

    const handleConfirmCreate = async () => {
        const title = newProductTitle.trim() || trimmedSearch;
        if (title.length < 2) return;
        try {
            const created = await createMut.mutateAsync({
                title,
                brandId: newBrand?.id,
                category,
            });
            onSelect({
                id: created.id,
                title: created.title,
                brandId: created.brandId,
                brandTitle: created.brand?.title,
                category: created.category,
                imageUrl: created.imageUrl,
                thumbnailUrl: created.thumbnailUrl,
            });
            onClose();
        } catch (e: any) {
            console.error(e);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[110] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                    min-h-[60dvh] max-h-[88dvh] flex flex-col overflow-hidden
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            >
                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <h3 className="text-sm font-extrabold text-on-surface">انتخاب کالا</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* جستجو */}
                <div className="flex-shrink-0 p-3 border-b border-outline-variant/20">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCreatingNew(false);
                            }}
                            placeholder="عنوان کالا را جستجو کنید... (حداقل ۲ حرف)"
                            className="w-full h-10 pr-9 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>
                    <p className="text-[10px] text-on-surface-variant/60 mt-1.5">
                        جستجو در عنوان و کلمات کلیدی (مثلاً «تن» هم «کنسرو ماهی» رو پیدا می‌کنه)
                    </p>
                </div>

                {/* لیست کالاها */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    {isFetching ? (
                        <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
                    ) : items.length === 0 ? (
                        <div className="p-6 text-center">
                            <Package className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-2" />
                            <p className="text-xs text-on-surface-variant">
                                {debouncedSearch.length < 2
                                    ? 'برای جستجو حداقل ۲ حرف تایپ کنید'
                                    : 'کالایی با این نام پیدا نشد'}
                            </p>
                        </div>
                    ) : (
                        items.map((item: any) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onSelect({
                                        id: item.id,
                                        title: item.title,
                                        brandId: item.brandId,
                                        brandTitle: item.brand?.title,
                                        category: item.category,
                                        imageUrl: item.imageUrl,
                                        thumbnailUrl: item.thumbnailUrl,
                                    });
                                    onClose();
                                }}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors',
                                    selected?.id === item.id ? 'bg-primary/10' : 'hover:bg-surface-container-low',
                                )}
                            >
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
                                {selected?.id === item.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                            </button>
                        ))
                    )}
                </div>

                {/* بخش ساخت کالای جدید */}
                {canCreateNew && !creatingNew && (
                    <div className="flex-shrink-0 p-3 border-t border-outline-variant/20 bg-amber-50/50 dark:bg-amber-900/10">
                        <button
                            onClick={() => {
                                setCreatingNew(true);
                                setNewProductTitle(trimmedSearch);
                            }}
                            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-amber-400/60 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-right"
                        >
                            <span className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                <Plus className="w-4 h-4 text-amber-600" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                                    افزودن «{trimmedSearch}» به‌عنوان کالای جدید
                                </p>
                                <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                                    این کالا تازه ثبت می‌شه و پس از تأیید ادمین فعال می‌شه
                                </p>
                            </div>
                        </button>
                    </div>
                )}

                {/* فرم تأیید ساخت کالای جدید */}
                {creatingNew && (
                    <div className="flex-shrink-0 p-3 border-t border-outline-variant/20 bg-amber-50/50 dark:bg-amber-900/10 space-y-3">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-200">کالای جدید</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-on-surface-variant block">عنوان کالا</label>
                            <input
                                value={newProductTitle}
                                onChange={(e) => setNewProductTitle(e.target.value)}
                                placeholder="مثلاً: کنسرو ماهی مکنزی ۲۰۰ گرمی"
                                className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-amber-400/50 text-sm outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
                            />
                        </div>
                        <BrandPicker
                            value={newBrand}
                            onChange={setNewBrand}
                            category={category}
                            label="برند (اختیاری)"
                            placeholder="انتخاب برند..."
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCreatingNew(false)}
                                className="flex-1 h-9 rounded-xl border border-outline-variant/60 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={handleConfirmCreate}
                                disabled={newProductTitle.trim().length < 2 || createMut.isPending}
                                className="flex-1 h-9 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {createMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'تأیید و انتخاب'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
