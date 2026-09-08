// app/components/EntityPicker.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Plus, Check, Loader2, AlertCircle, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface EntityValue {
    id: string;
    title: string;
    isByUser?: boolean;
    [key: string]: any;
}

interface Props {
    /** مقدار فعلی */
    value: EntityValue | null;
    onChange: (value: EntityValue | null) => void;
    /** label فیلد */
    label?: string;
    /** placeholder دکمه */
    placeholder?: string;
    /** required */
    required?: boolean;
    /** error */
    error?: string;
    /** آیکون */
    icon?: React.ReactNode;
    /** تابع fetch لیست همه‌ی آیتم‌ها (برای DropSelector) */
    listFn: () => Promise<{ items: any[] }>;
    /** تابع ایجاد آیتم جدید */
    createFn: (title: string) => Promise<any>;
    /** query key برای cache و invalidation */
    queryKey: string;
    /** رندر سفارشی هر آیتم در dropdown */
    renderItem?: (item: any) => React.ReactNode;
    /** رندر سفارشی مقدار انتخاب‌شده در دکمه */
    renderValue?: (value: EntityValue) => React.ReactNode;
    /** متن دکمه «ایجاد جدید» */
    createLabel?: string;
    /** حداقل طول برای جستجو در dropdown */
    minChars?: number;
}

/**
 * EntityPicker — کامپوننت انتخابگر DropSelector-style با قابلیت create
 *
 * ┌─────────────────────────────────────┐
 * │ [آیکون] انتخاب کنید...        ▼    │  ← دکمه
 * └─────────────────────────────────────┘
 *
 * کلیک → dropdown باز می‌شه:
 * ┌─────────────────────────────────────┐
 * │ [🔍 جستجو...]                       │
 * ├─────────────────────────────────────┤
 * │ آیتم ۱                              │
 * │ آیتم ۲                              │
 * │ ...                                 │
 * ├─────────────────────────────────────┤
 * │ [+ ایجاد «متن جستجو» به‌عنوان جدید] │  ← اگه پیدا نشد
 * └─────────────────────────────────────┘
 *
 * ✅ DropSelector-style (نه autocomplete تایپی)
 * ✅ جستجوی client-side (لیست یکجا fetch و cache می‌شه)
 * ✅ اگه چیزی پیدا نشد، دکمه «ایجاد جدید» ظاهر می‌شه
 * ✅ هشدار اگه تکراری باشه
 * ✅ isByUser badge برای آیتم‌های کاربر-ساخته
 */
export default function EntityPicker({
    value,
    onChange,
    label,
    placeholder = 'انتخاب کنید...',
    required = false,
    error,
    icon,
    listFn,
    createFn,
    queryKey,
    renderItem,
    renderValue,
    createLabel = 'ایجاد به‌عنوان جدید',
    minChars = 0,
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

            {/* دکمه انتخاب */}
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

            {/* Dropdown */}
            {isOpen && (
                <EntityPickerDropdown
                    value={value}
                    onChange={(v) => {
                        onChange(v);
                        setIsOpen(false);
                    }}
                    onClose={() => setIsOpen(false)}
                    listFn={listFn}
                    createFn={createFn}
                    queryKey={queryKey}
                    renderItem={renderItem}
                    createLabel={createLabel}
                    minChars={minChars}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// Dropdown — portal-based
// ═══════════════════════════════════════════════════════════
function EntityPickerDropdown({
    value,
    onChange,
    onClose,
    listFn,
    createFn,
    queryKey,
    renderItem,
    createLabel,
    minChars,
}: {
    value: EntityValue | null;
    onChange: (v: EntityValue) => void;
    onClose: () => void;
    listFn: () => Promise<{ items: any[] }>;
    createFn: (title: string) => Promise<any>;
    queryKey: string;
    renderItem?: (item: any) => React.ReactNode;
    createLabel: string;
    minChars: number;
}) {
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // fetch لیست
    const { data, isLoading } = useQuery({
        queryKey: [queryKey],
        queryFn: listFn,
        staleTime: 5 * 60 * 1000,
    });

    // mutation create
    const createMut = useMutation({
        mutationFn: createFn,
        onSuccess: (created: any) => {
            // ✅ invalidate cache تا لیست تازه بشه
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            onChange({
                id: created.id,
                title: created.title,
                isByUser: created.isByUser ?? true,
            });
        },
        onError: (err: any) => {
            setCreateError(err?.message || 'خطا در ایجاد');
        },
    });

    // فیلتر client-side
    const filtered = useMemo(() => {
        const items = data?.items || [];
        if (!search.trim()) return items;
        const q = search.trim().toLowerCase();
        return items.filter((item: any) =>
            item.title?.toLowerCase().includes(q) ||
            item.keywords?.some?.((k: string) => k.toLowerCase().includes(q))
        );
    }, [data, search]);

    const trimmedSearch = search.trim();
    const exactMatch = filtered.some((i: any) => i.title === trimmedSearch);
    const canCreate = trimmedSearch.length >= 2 && !exactMatch && !creating;

    const handleCreate = async () => {
        setCreateError(null);
        setCreating(true);
        try {
            await createMut.mutateAsync(trimmedSearch);
        } finally {
            setCreating(false);
        }
    };

    // کلیک خارج → بستن
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // delay برای جلوگیری از بسته شدن فوری
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
                <div className="flex-shrink-0 p-3 border-b border-outline-variant/20">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجو..."
                            className="w-full h-10 pr-9 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                {/* لیست */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    {isLoading ? (
                        <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-6 text-center">
                            <Tag className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-2" />
                            <p className="text-xs text-on-surface-variant">
                                {trimmedSearch ? 'موردی پیدا نشد' : 'لیست خالی است'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((item: any) => (
                            <button
                                key={item.id}
                                onClick={() => onChange({
                                    id: item.id,
                                    title: item.title,
                                    isByUser: item.isByUser,
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
                        ))
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
