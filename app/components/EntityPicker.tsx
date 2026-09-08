// app/components/EntityPicker.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Plus, Check, Loader2, AlertCircle, ChevronDown, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EntityValue {
    id: string;
    title: string;
    isByUser?: boolean;
    isNew?: boolean;
    [key: string]: any;
}

interface FetchParams {
    q?: string;
    page: number;
    limit: number;
    mine?: boolean;
}

interface FetchResult {
    items: any[];
    hasMore?: boolean;
    total?: number;
}

interface Props {
    value: EntityValue | null;
    onChange: (value: EntityValue | null) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
    icon?: React.ReactNode;
    /** تابع fetch با pagination و search */
    fetchFn: (params: FetchParams) => Promise<FetchResult>;
    /** تابع ایجاد آیتم جدید */
    createFn: (title: string) => Promise<any>;
    /** query key برای cache */
    queryKey: string;
    /** رندر سفارشی هر آیتم */
    renderItem?: (item: any) => React.ReactNode;
    /** رندر سفارشی مقدار انتخاب‌شده */
    renderValue?: (value: EntityValue) => React.ReactNode;
    /** متن دکمه ایجاد */
    createLabel?: string;
    /** حداقل حرف برای سرچ (پیش‌فرض ۲) */
    minSearchChars?: number;
    /** تعداد آیتم در هر صفحه (پیش‌فرض ۱۰) */
    pageSize?: number;
    /** آیا toggle «فقط آیتم‌های من» نشون داده بشه */
    showMineOnly?: boolean;
}

/**
 * EntityPicker — انتخابگر DropSelector-style با pagination
 *
 * ✅ pagination: ۱۰ آیتم در هر صفحه + دکمه «بیشتر»
 * ✅ جستجوی server-side با حداقل ۲ حرف
 * ✅ اگه چیزی پیدا نشد، دکمه «ایجاد جدید»
 * ✅ هشدار اگه تکراری باشه
 * ✅ toggle «فقط آیتم‌های من» (برای ProductReference)
 * ✅ badge «جدید» برای آیتم‌های isByUser
 */
export default function EntityPicker({
    value,
    onChange,
    label,
    placeholder = 'انتخاب کنید...',
    required = false,
    error,
    icon,
    fetchFn,
    createFn,
    queryKey,
    renderItem,
    renderValue,
    createLabel = 'ایجاد به‌عنوان جدید',
    minSearchChars = 2,
    pageSize = 10,
    showMineOnly = false,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-xs font-bold text-on-surface block flex items-center gap-1">
                    {icon}
                    {label}
                    {required && <span className="text-primary">*</span>}
                    {!required && value && (
                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            className="text-[10px] text-error/60 hover:text-error mr-2"
                        >
                            حذف
                        </button>
                    )}
                </label>
            )}

            {value ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="w-full h-11 px-3 flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/30 hover:border-primary/50 transition-all text-right"
                >
                    {renderValue ? renderValue(value) : (
                        <>
                            <span className="flex-1 text-sm font-bold text-on-surface truncate">{value.title}</span>
                            {value.isByUser && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex-shrink-0">
                                    جدید
                                </span>
                            )}
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        </>
                    )}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        'w-full h-11 px-3 flex items-center gap-2 rounded-xl bg-surface-container-lowest border transition-all text-right',
                        error ? 'border-error' : 'border-outline-variant/40 hover:border-primary/40',
                    )}
                >
                    {icon}
                    <span className="flex-1 text-sm text-on-surface-variant">{placeholder}</span>
                </button>
            )}

            {error && <p className="text-error text-[11px]">{error}</p>}

            {isOpen && (
                <EntityPickerModal
                    value={value}
                    onChange={(v) => {
                        onChange(v);
                        setIsOpen(false);
                    }}
                    onClose={() => setIsOpen(false)}
                    fetchFn={fetchFn}
                    createFn={createFn}
                    queryKey={queryKey}
                    renderItem={renderItem}
                    createLabel={createLabel}
                    minSearchChars={minSearchChars}
                    pageSize={pageSize}
                    showMineOnly={showMineOnly}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// Modal
// ═══════════════════════════════════════════════════════════
function EntityPickerModal({
    value,
    onChange,
    onClose,
    fetchFn,
    createFn,
    queryKey,
    renderItem,
    createLabel,
    minSearchChars,
    pageSize,
    showMineOnly,
}: {
    value: EntityValue | null;
    onChange: (v: EntityValue) => void;
    onClose: () => void;
    fetchFn: (params: FetchParams) => Promise<FetchResult>;
    createFn: (title: string) => Promise<any>;
    queryKey: string;
    renderItem?: (item: any) => React.ReactNode;
    createLabel: string;
    minSearchChars: number;
    pageSize: number;
    showMineOnly: boolean;
}) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [allItems, setAllItems] = useState<any[]>([]);
    const [mineOnly, setMineOnly] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
            setAllItems([]);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // reset when mineOnly changes
    useEffect(() => {
        setPage(1);
        setAllItems([]);
    }, [mineOnly]);

    // fetch
    const { data, isFetching } = useQuery({
        queryKey: [queryKey, debouncedSearch, page, mineOnly],
        queryFn: () => fetchFn({
            q: debouncedSearch || undefined,
            page,
            limit: pageSize,
            mine: mineOnly,
        }),
        staleTime: 30_000,
    });

    // accumulate items
    useEffect(() => {
        if (data?.items) {
            if (page === 1) {
                setAllItems(data.items);
            } else {
                setAllItems(prev => [...prev, ...data.items]);
            }
        }
    }, [data, page]);

    const hasMore = data?.hasMore ?? false;

    // mutation create
    const createMut = useMutation({
        mutationFn: createFn,
        onSuccess: (created: any) => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            onChange({
                id: created.id,
                title: created.title,
                isByUser: created.isByUser ?? true,
                isNew: created.isNew ?? true,
            });
        },
        onError: (err: any) => {
            setCreateError(err?.message || 'خطا در ایجاد');
        },
    });

    const trimmedSearch = debouncedSearch;
    const canSearch = trimmedSearch.length >= minSearchChars;
    const exactMatch = allItems.some((i: any) => i.title === trimmedSearch);
    const canCreate = canSearch && trimmedSearch.length >= 2 && !exactMatch && !creating;

    const handleCreate = async () => {
        setCreateError(null);
        setCreating(true);
        try {
            await createMut.mutateAsync(trimmedSearch);
        } finally {
            setCreating(false);
        }
    };

    // click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
            className="fixed inset-0 z-[110] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
            onClick={onClose}
        >
            <div
                ref={containerRef}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                    min-h-[60dvh] max-h-[88dvh] flex flex-col overflow-hidden
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            >
                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <h3 className="text-sm font-extrabold text-on-surface">انتخاب</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* جستجو */}
                <div className="flex-shrink-0 p-3 border-b border-outline-variant/20 space-y-2">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`جستجو... (حداقل ${minSearchChars} حرف)`}
                            className="w-full h-10 pr-9 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>
                    {showMineOnly && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mineOnly}
                                onChange={(e) => setMineOnly(e.target.checked)}
                                className="w-4 h-4 rounded accent-primary"
                            />
                            <span className="text-[11px] font-bold text-on-surface-variant">فقط کالاهای_added توسط من</span>
                        </label>
                    )}
                </div>

                {/* لیست */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    {isFetching && page === 1 ? (
                        <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
                    ) : allItems.length === 0 ? (
                        <div className="p-6 text-center">
                            <Tag className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-2" />
                            <p className="text-xs text-on-surface-variant">
                                {!canSearch && search.length > 0
                                    ? `حداقل ${minSearchChars} حرف تایپ کنید`
                                    : canSearch
                                        ? 'موردی پیدا نشد'
                                        : 'برای جستجو تایپ کنید'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {allItems.map((item: any) => (
                                <button
                                    key={item.id}
                                    onClick={() => onChange({
                                        id: item.id,
                                        title: item.title,
                                        isByUser: item.isByUser,
                                        isNew: item.isNew,
                                        ...item,
                                    })}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors',
                                        value?.id === item.id ? 'bg-primary/10' : 'hover:bg-surface-container-low',
                                    )}
                                >
                                    {renderItem ? renderItem(item) : (
                                        <>
                                            <span className="flex-1 text-sm font-medium text-on-surface truncate">
                                                {item.title}
                                            </span>
                                            {item.isByUser && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex-shrink-0">
                                                    جدید
                                                </span>
                                            )}
                                            {value?.id === item.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                                        </>
                                    )}
                                </button>
                            ))}
                            {hasMore && (
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={isFetching}
                                    className="w-full py-3 text-center text-xs font-bold text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                                >
                                    {isFetching ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'نمایش بیشتر...'}
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* هشدار تکراری */}
                {exactMatch && trimmedSearch.length >= 2 && (
                    <div className="flex-shrink-0 p-3 border-t border-amber-200/40 bg-amber-50/50 dark:bg-amber-900/10">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <p className="text-xs">
                                «{trimmedSearch}» از قبل وجود دارد. از لیست بالا انتخاب کنید.
                            </p>
                        </div>
                    </div>
                )}

                {/* دکمه ایجاد جدید */}
                {canCreate && (
                    <div className="flex-shrink-0 p-3 border-t border-outline-variant/20 bg-amber-50/50 dark:bg-amber-900/10">
                        <button
                            onClick={handleCreate}
                            disabled={createMut.isPending}
                            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-amber-400/60 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all text-right disabled:opacity-50"
                        >
                            <span className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin text-amber-600" /> : <Plus className="w-4 h-4 text-amber-600" />}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                                    {createLabel}: «{trimmedSearch}»
                                </p>
                                <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                                    این مورد تازه ثبت می‌شه و پس از تأیید ادمین فعال می‌شه
                                </p>
                            </div>
                        </button>
                        {createError && (
                            <p className="text-[10px] text-error mt-2 px-2">{createError}</p>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
