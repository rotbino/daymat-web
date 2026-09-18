// app/components/BrandCategorySelect.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { Layers, Loader2, Search, X, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** ✅ لیست دسته‌بندی‌های برند — تاکسونومی ثابت (فقط خواندنی) */
export function useBrandCategories() {
    return useQuery({
        queryKey: ['brand-categories'],
        queryFn: () => apiService.brand.categories(),
        staleTime: 5 * 60_000,
    });
}

/** نرمال‌سازی سبک برای سرچ فارسی — ی/ك/نیم‌فاصله/فاصله اضافه */
const normalizeFa = (s: string) =>
    (s || '')
        .toLowerCase()
        .replace(/\u200c/g, ' ')
        .replace(/[ي]/g, 'ی')
        .replace(/[ك]/g, 'ک')
        .replace(/\s+/g, ' ')
        .trim();

interface Props {
    /** در فرم EntityPicker — مقدار خودکار در dataRef نوشته می‌شود (dataRef.categoryId) */
    dataRef?: React.MutableRefObject<{ [key: string]: any }>;
    /** پیش‌فرض در حالت ویرایش — از آیتم در حال ویرایش */
    initialData?: any;
    /** حالت کنترل‌شده (مثلاً پنل ادمین) */
    value?: string;
    onChange?: (v: string) => void;
    error?: string;
}

/**
 * BrandCategorySelect — فیلد الزامی «دستهٔ برند» با سلکتور سرچ‌دار
 *
 * ✅ دسته‌ها از لیست ثابت می‌آیند (GET /brands/categories) — کاربر دستهٔ جدید نمی‌سازد
 * ✅ به‌جای دراپ‌دان ساده، سلکتور سرچ‌دار (الگوی EntityPicker) — همیشه همین‌جا استفاده می‌شود
 * ✅ دستهٔ انتخاب‌شده همیشه روی خود فیلد نمایش داده می‌شود — از جمله در ویرایش برند (prefill)
 * ✅ انتخاب دسته موقع ثبت برند اجباری است تا بعداً برندهای هر بازو بشود محدود و تخصصی کرد
 */
export default function BrandCategorySelect({ dataRef, initialData, value: controlledValue, onChange, error }: Props) {
    const { data: categories, isLoading } = useBrandCategories();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    // ─── حل مقدار اولیه از آیتم در حال ویرایش ───
    // ترتیب: id مستقیم → brandCategory.id → categoryId → تطبیق با نام دسته
    const resolveInitialId = (): string => {
        if (controlledValue !== undefined) return controlledValue;
        const direct =
            initialData?.brandCategoryId ??
            initialData?.brandCategory?.id ??
            initialData?.categoryId ??
            '';
        if (direct) return direct;
        // ✅ فال‌بک با نام — اگه هنوز id در پاسخ API نبود، نام دسته همگام ذخیره می‌شود
        const name = initialData?.brandCategory?.name ?? initialData?.category;
        if (name && categories?.length) {
            const hit = categories.find((c: any) => c.name === name);
            if (hit) return hit.id;
        }
        return '';
    };

    const [internalValue, setInternalValue] = useState<string>(() => resolveInitialId());
    const value = controlledValue ?? internalValue;

    // ✅ سینک با آیتم ویرایش — اگه آیتم عوض شد (یا لیست دسته‌ها دیر رسید) مقدار تازه شود
    const initialKey = initialData?.id ?? null;
    const seenKey = React.useRef<string | null>(null);
    useEffect(() => {
        if (controlledValue !== undefined) return;
        if (initialKey && seenKey.current !== initialKey) {
            seenKey.current = initialKey;
            setInternalValue(resolveInitialId());
            return;
        }
        // آیتم همان است ولی id هنوز نیامده بود و حالا با نام پیدا شد
        if (initialKey && !internalValue) {
            const resolved = resolveInitialId();
            if (resolved) setInternalValue(resolved);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialKey, categories, controlledValue]);

    // ✅ سینک مقدار به dataRef فرم EntityPicker — خالی بودن یعنی نامعتبر
    useEffect(() => {
        if (dataRef) {
            dataRef.current = { ...dataRef.current, categoryId: internalValue || undefined };
        }
    }, [internalValue, dataRef]);

    const selected = useMemo(
        () => (categories || []).find((c: any) => c.id === value),
        [categories, value],
    );

    const filtered = useMemo(() => {
        const q = normalizeFa(search);
        if (!q) return categories || [];
        return (categories || []).filter((c: any) => normalizeFa(c.name).includes(q));
    }, [categories, search]);

    const handleSelect = (id: string) => {
        if (controlledValue !== undefined) onChange?.(id);
        else setInternalValue(id);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface block flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-on-surface-variant" />
                دستهٔ برند
                <span className="text-primary">*</span>
            </label>

            {isLoading ? (
                <div className="w-full h-11 px-3 flex items-center gap-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm text-on-surface-variant/70">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    در حال دریافت دسته‌ها...
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => { setSearch(''); setIsOpen(true); }}
                    className={cn(
                        'w-full h-11 px-3 flex items-center gap-2 rounded-xl bg-surface-container-lowest border text-sm transition-all text-right',
                        error
                            ? 'border-error/70 focus:ring-2 focus:ring-error/25'
                            : 'border-outline-variant/40 hover:border-primary/45 focus:ring-2 focus:ring-primary/30 focus:border-primary',
                    )}
                >
                    {selected ? (
                        <span className="flex-1 text-sm font-bold text-on-surface truncate">{selected.name}</span>
                    ) : (
                        <span className="flex-1 text-sm text-on-surface-variant/70">انتخاب دستهٔ برند...</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-on-surface-variant/50 flex-shrink-0" />
                </button>
            )}
            {error && <p className="text-error text-[11px]">{error}</p>}

            {isOpen && (
                <BrandCategoryModal
                    categories={categories || []}
                    value={value}
                    onSelect={handleSelect}
                    onClose={() => setIsOpen(false)}
                    search={search}
                    setSearch={setSearch}
                    filtered={filtered}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// مودال سرچ‌دار انتخاب دسته — الگوی EntityPicker
// ═══════════════════════════════════════════════════════════
function BrandCategoryModal({
    categories,
    value,
    onSelect,
    onClose,
    search,
    setSearch,
    filtered,
}: any) {
    // کلیک روی پردهٔ خودش ببندد — همان قرارداد EntityPicker
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.dataset.entityPickerOverlay === 'true') {
                onClose();
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handler);
        }, 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handler);
        };
    }, [onClose]);

    return createPortal(
        <div
            data-entity-picker-overlay="true"
            className="fixed inset-0 z-[110] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl
                    min-h-[50dvh] max-h-[80dvh] flex flex-col overflow-hidden
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            >
                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low/40">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-primary/10 grid place-items-center flex-shrink-0">
                            <Layers className="w-4 h-4 text-primary" />
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-sm font-extrabold text-on-surface truncate">انتخاب دستهٔ برند</h3>
                            {categories.length > 0 && (
                                <p className="text-[10px] text-on-surface-variant/70">
                                    {categories.length.toLocaleString('fa-IR')} دسته
                                </p>
                            )}
                        </div>
                    </div>
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
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجوی دسته..."
                            autoFocus
                            className="w-full h-10 pr-9 pl-9 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full grid place-items-center text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container-high transition-colors"
                                title="پاک کردن"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* لیست دسته‌ها */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim p-2.5 space-y-1.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    {filtered.length === 0 ? (
                        <div className="p-8 text-center">
                            <span className="w-14 h-14 rounded-2xl bg-surface-container-high grid place-items-center mx-auto mb-3">
                                <Layers className="w-6 h-6 text-on-surface-variant/30" />
                            </span>
                            <p className="text-xs font-bold text-on-surface-variant">دسته‌ای با این نام پیدا نشد.</p>
                        </div>
                    ) : (
                        filtered.map((c: any) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => onSelect(c.id)}
                                className={cn(
                                    'w-full flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all text-right',
                                    value === c.id
                                        ? 'bg-primary/[0.06] border-primary/40 shadow-sm'
                                        : 'bg-surface-container-lowest border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low/50',
                                )}
                            >
                                <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                                    <Layers className="w-4 h-4 text-on-surface-variant/60" />
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-medium text-on-surface truncate">{c.name}</span>
                                </span>
                                {value === c.id && (
                                    <span className="w-5 h-5 rounded-full bg-primary grid place-items-center flex-shrink-0 shadow-sm">
                                        <Check className="w-3 h-3 text-on-primary" />
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
