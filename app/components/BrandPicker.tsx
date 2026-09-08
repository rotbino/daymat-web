// app/components/BrandPicker.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Plus, Check, Loader2, Tag, AlertCircle } from 'lucide-react';
import { useBrandSearch, useCreateBrand } from '@/lib/api/apiHooks';
import { cn } from '@/lib/utils';

export interface BrandValue {
    id: string;
    title: string;
    category?: string;
    logoUrl?: string;
}

interface Props {
    value: BrandValue | null;
    onChange: (brand: BrandValue | null) => void;
    /** دسته برند برای فیلتر (مثلاً 'food') */
    category?: string;
    placeholder?: string;
    label?: string;
    required?: boolean;
    error?: string;
}

/**
 * BrandPicker — انتخابگر برند با مدال جستجو + ساخت برند جدید
 *
 * UX:
 * ۱. کاربر روی دکمه «انتخاب برند» کلیک می‌کنه
 * ۲. مدال باز می‌شه با سرچ
 * ۳. سرچ می‌کنه → نتایج رو می‌بینه
 * ۴. اگه پیدا نشد → دکمه «افزودن برند جدید»
 * ۵. انتخاب → badge برند روی دکمه
 */
export default function BrandPicker({
    value,
    onChange,
    category,
    placeholder = 'انتخاب برند...',
    label = 'برند',
    required = false,
    error,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const clear = () => onChange(null);

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-xs font-bold text-on-surface block flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-on-surface-variant" />
                    {label}
                    {required && <span className="text-primary">*</span>}
                    {!required && value && (
                        <button type="button" onClick={clear} className="text-[10px] text-error/60 hover:text-error mr-2">
                            حذف
                        </button>
                    )}
                </label>
            )}

            {/* دکمه انتخاب برند */}
            {value ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="w-full h-11 px-3 flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/30 hover:border-primary/50 transition-all text-right"
                >
                    {value.logoUrl ? (
                        <img src={value.logoUrl} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                    ) : (
                        <span className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Tag className="w-3.5 h-3.5 text-primary" />
                        </span>
                    )}
                    <span className="flex-1 text-sm font-bold text-on-surface truncate">{value.title}</span>
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
                    <Tag className="w-4 h-4 text-on-surface-variant/50" />
                    <span className="flex-1 text-sm text-on-surface-variant">{placeholder}</span>
                </button>
            )}

            {error && <p className="text-error text-[11px]">{error}</p>}

            {/* مدال انتخاب برند */}
            {isOpen && (
                <BrandPickerModal
                    selected={value}
                    category={category}
                    onSelect={(brand) => {
                        onChange(brand);
                        setIsOpen(false);
                    }}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// مدال انتخاب برند
// ═══════════════════════════════════════════════════════════
function BrandPickerModal({
    selected,
    category,
    onSelect,
    onClose,
}: {
    selected: BrandValue | null;
    category?: string;
    onSelect: (brand: BrandValue) => void;
    onClose: () => void;
}) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [creatingNew, setCreatingNew] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const createMut = useCreateBrand();

    // debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isFetching } = useBrandSearch(debouncedSearch, category, debouncedSearch.length >= 1);
    const items = data?.items || [];

    const trimmedSearch = search.trim();
    const canCreateNew = trimmedSearch.length >= 2
        && !items.some((i: any) => i.title === trimmedSearch)
        && !creatingNew;

    const handleConfirmCreate = async () => {
        const name = newBrandName.trim() || trimmedSearch;
        if (name.length < 2) return;
        try {
            const created = await createMut.mutateAsync({
                title: name,
                category,
            });
            onSelect({
                id: created.id,
                title: created.title,
                category: created.category,
                logoUrl: created.logoUrl,
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
                    <h3 className="text-sm font-extrabold text-on-surface">انتخاب برند</h3>
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
                            placeholder="نام برند را جستجو کنید..."
                            className="w-full h-10 pr-9 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                {/* لیست برندها */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    {isFetching ? (
                        <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
                    ) : items.length === 0 ? (
                        <div className="p-6 text-center">
                            <Tag className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-2" />
                            <p className="text-xs text-on-surface-variant">
                                {debouncedSearch.length < 1
                                    ? 'برای جستجو تایپ کنید'
                                    : 'برندی با این نام پیدا نشد'}
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
                                        category: item.category,
                                        logoUrl: item.logoUrl,
                                    });
                                    onClose();
                                }}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors',
                                    selected?.id === item.id ? 'bg-primary/10' : 'hover:bg-surface-container-low',
                                )}
                            >
                                {item.logoUrl ? (
                                    <img src={item.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                    <span className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                                        <Tag className="w-4 h-4 text-on-surface-variant/50" />
                                    </span>
                                )}
                                <span className="flex-1 text-sm font-medium text-on-surface truncate">{item.title}</span>
                                {selected?.id === item.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                            </button>
                        ))
                    )}
                </div>

                {/* بخش ساخت برند جدید */}
                {canCreateNew && !creatingNew && (
                    <div className="flex-shrink-0 p-3 border-t border-outline-variant/20 bg-amber-50/50 dark:bg-amber-900/10">
                        <button
                            onClick={() => {
                                setCreatingNew(true);
                                setNewBrandName(trimmedSearch);
                            }}
                            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-amber-400/60 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-right"
                        >
                            <span className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                <Plus className="w-4 h-4 text-amber-600" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                                    افزودن «{trimmedSearch}» به‌عنوان برند جدید
                                </p>
                                <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                                    این برند تازه ثبت می‌شه و پس از تأیید ادمین فعال می‌شه
                                </p>
                            </div>
                        </button>
                    </div>
                )}

                {/* فرم تأیید ساخت برند جدید */}
                {creatingNew && (
                    <div className="flex-shrink-0 p-3 border-t border-outline-variant/20 bg-amber-50/50 dark:bg-amber-900/10 space-y-2">
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-200">برند جدید</p>
                        </div>
                        <input
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                            placeholder="نام دقیق برند..."
                            className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-amber-400/50 text-sm outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-500 transition-all"
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
                                disabled={newBrandName.trim().length < 2 || createMut.isPending}
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
