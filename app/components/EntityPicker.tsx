// app/components/EntityPicker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Search, X, Plus, Check, Loader2, AlertCircle, Tag } from 'lucide-react';
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

interface CreateFormProps {
    title: string;
    setTitle: (v: string) => void;
    /** رندر فیلدهای اضافی فرم create (عکس، برند، ...) */
    extraFields?: React.ReactNode;
    /** ref برای ذخیره‌سازی داده‌های اضافی فرم create */
    dataRef: React.MutableRefObject<{ [key: string]: any }>;
}

interface Props {
    value: EntityValue | null;
    onChange: (value: EntityValue | null) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
    icon?: React.ReactNode;
    /** تابع fetch با pagination */
    fetchFn: (params: FetchParams) => Promise<FetchResult>;
    /** تابع ایجاد — data شامل title و فیلدهای اضافی */
    createFn: (data: { title: string; [key: string]: any }) => Promise<any>;
    /** query key */
    queryKey: string;
    /** رندر سفارشی هر آیتم */
    renderItem?: (item: any) => React.ReactNode;
    /** رندر سفارشی مقدار انتخاب‌شده */
    renderValue?: (value: EntityValue) => React.ReactNode;
    /** رندر فیلدهای اضافی در فرم create (عکس، برند) */
    renderCreateFields?: (props: CreateFormProps) => React.ReactNode;
    /** متن دکمه ایجاد */
    createLabel?: string;
    /** حداقل حرف برای سرچ */
    minSearchChars?: number;
    /** تعداد در هر صفحه */
    pageSize?: number;
    /** toggle «فقط آیتم‌های من» */
    showMineOnly?: boolean;
    /** متن راهنمای toggle mine */
    mineLabel?: string;
    /** پیام تکراری بودن */
    duplicateMessage?: string;
    /** پیام راهنمای دکمه ایجاد */
    createHint?: string;
    /** عنوان مدال در حالت انتخاب */
    selectTitle?: string;
    /** عنوان مدال در حالت ایجاد */
    createTitle?: string;
}

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
    renderCreateFields,
    createLabel = 'افزودن به مرکز کالا',
    minSearchChars = 2,
    pageSize = 10,
    showMineOnly = false,
    mineLabel = 'فقط موارد اضافه‌شده توسط من',
    duplicateMessage,
    createHint = 'این مورد در مرکز وجود ندارد؟ یک بار آن را اضافه کنید تا همه جا قابل استفاده باشد',
    selectTitle = 'انتخاب',
    createTitle = 'افزودن به مرکز کالا',
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
                    renderCreateFields={renderCreateFields}
                    createLabel={createLabel}
                    minSearchChars={minSearchChars}
                    pageSize={pageSize}
                    showMineOnly={showMineOnly}
                    mineLabel={mineLabel}
                    duplicateMessage={duplicateMessage}
                    createHint={createHint}
                    selectTitle={selectTitle}
                    createTitle={createTitle}
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
    renderCreateFields,
    createLabel,
    minSearchChars,
    pageSize,
    showMineOnly,
    mineLabel,
    duplicateMessage,
    createHint,
    selectTitle,
    createTitle: createFormTitle,
}: any) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [allItems, setAllItems] = useState<any[]>([]);
    const [mineOnly, setMineOnly] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const createDataRef = React.useRef<{ [key: string]: any }>({});
    const containerRef = React.useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // debounce search
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
        placeholderData: keepPreviousData,  // ✅ حل مشکل flash
    });

    // accumulate items
    useEffect(() => {
        if (data?.items) {
            if (page === 1) {
                setAllItems(data.items);
            } else {
                // ✅ فقط اگه آیتم‌ها جدید هستن اضافه کن (جلوگیری از duplicate)
                setAllItems(prev => {
                    const newItems = data.items.filter(
                        (ni: any) => !prev.some((pi: any) => pi.id === ni.id)
                    );
                    return [...prev, ...newItems];
                });
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
                ...created,
            });
        },
        onError: (err: any) => {
            setCreateError(err?.message || 'خطا در ایجاد');
        },
    });

    const trimmedSearch = debouncedSearch;
    const canSearch = trimmedSearch.length >= minSearchChars || trimmedSearch.length === 0;
    const exactMatch = allItems.some((i: any) =>
        i.title?.toLowerCase() === trimmedSearch.toLowerCase()
    );
    const canCreate = trimmedSearch.length >= 2 && !exactMatch && !showCreateForm;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (createTitle.trim().length < 2) return;
        setCreateError(null);
        try {
            // ✅ داده‌های اضافی از ref + title
            await createMut.mutateAsync({
                title: createTitle.trim(),
                ...createDataRef.current,
            });
        } catch (err) {
            // error handled in onError
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

    // وقتی showCreateForm=true می‌شه، title رو از search پر کن
    useEffect(() => {
        if (showCreateForm && !createTitle) {
            setCreateTitle(trimmedSearch);
        }
    }, [showCreateForm]);

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
                    <h3 className="text-sm font-extrabold text-on-surface">
                        {showCreateForm ? createFormTitle : selectTitle}
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {showCreateForm ? (
                    // ═══ فرم ایجاد کالای جدید ═══
                    <form onSubmit={handleCreate} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim p-4 space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-on-surface block">عنوان کالا *</label>
                                <input
                                    value={createTitle}
                                    onChange={(e) => setCreateTitle(e.target.value)}
                                    placeholder="مثلاً: کنسرو ماهی مکنزی ۲۰۰ گرمی"
                                    autoFocus
                                    className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                            </div>
                            {renderCreateFields && renderCreateFields({
                                title: createTitle,
                                setTitle: setCreateTitle,
                                dataRef: createDataRef,
                            })}
                            {createError && (
                                <p className="text-error text-[11px]">{createError}</p>
                            )}
                        </div>
                        <div className="flex-shrink-0 p-3 border-t border-outline-variant/20 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="flex-1 h-10 rounded-xl border border-outline-variant/60 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            >
                                انصراف
                            </button>
                            <button
                                type="submit"
                                disabled={createTitle.trim().length < 2 || createMut.isPending}
                                className="flex-1 h-10 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'افزودن و انتخاب'}
                            </button>
                        </div>
                    </form>
                ) : (
                    // ═══ حالت انتخاب ═══
                    <>
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
                                    <span className="text-[11px] font-bold text-on-surface-variant">{mineLabel}</span>
                                </label>
                            )}
                        </div>

                        {/* لیست */}
                        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim pb-[calc(1rem+env(safe-area-inset-bottom))]">
                            {isFetching && allItems.length === 0 ? (
                                <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
                            ) : allItems.length === 0 ? (
                                <div className="p-6 text-center">
                                    <Tag className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-2" />
                                    <p className="text-xs text-on-surface-variant">
                                        {!canSearch && search.length > 0
                                            ? `حداقل ${minSearchChars} حرف تایپ کنید`
                                            : canSearch && trimmedSearch
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
                                                    {value?.id === item.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                                                </>
                                            )}
                                        </button>
                                    ))}
                                    {hasMore && (
                                        <button
                                            onClick={() => setPage((p: number) => p + 1)}
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
                                        {duplicateMessage
                                            ? duplicateMessage.replace('{name}', trimmedSearch)
                                            : `«${trimmedSearch}» از قبل وجود دارد. از لیست بالا انتخاب کنید.`}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* دکمه ایجاد کالای جدید — وسط، رنگ برند */}
                        {canCreate && (
                            <div className="flex-shrink-0 p-3 border-t border-outline-variant/20">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="text-xs font-bold">
                                        {createLabel}
                                    </span>
                                </button>
                                <p className="text-[10px] text-center text-on-surface-variant/60 mt-1.5">
                                    {createHint}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>,
        document.body,
    );
}
