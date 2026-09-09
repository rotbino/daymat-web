// app/components/EntityPicker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X, Plus, Check, Loader2, AlertCircle, Tag, Pencil, Trash2 } from 'lucide-react';
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
    /** ✅ داده‌های اولیه آیتم (برای حالت ویرایش) */
    initialData?: any;
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
    /** تابع ویرایش آیتم (اختیاری) — اگه داده بشه، آیکون ویرایش برای isNew نمایش داده می‌شه */
    updateFn?: (id: string, data: any) => Promise<any>;
    /** رندر فیلدهای ویرایش (مشابه renderCreateFields) */
    renderEditFields?: (props: CreateFormProps) => React.ReactNode;
    /** عنوان مدال ویرایش */
    editTitle?: string;
    /** label کوتاه برای toggle mine */
    mineToggleLabel?: string;
    /** تابع حذف آیتم (اختیاری) — اگه داده بشه، آیکون حذف برای isNew نمایش داده می‌شه */
    deleteFn?: (id: string) => Promise<any>;
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
    createLabel = 'افزودن به مرجع کالا',
    minSearchChars = 2,
    pageSize = 10,
    showMineOnly = false,
    mineLabel = 'فقط موارد اضافه‌شده توسط من',
    duplicateMessage,
    createHint = 'این مورد در مرکز وجود ندارد؟ یک بار آن را اضافه کنید تا همه جا قابل استفاده باشد',
    selectTitle = 'انتخاب',
    createTitle = 'افزودن به مرجع کالا',
    editTitle = 'ویرایش',
    mineToggleLabel = 'فقط موارد من',
    // ✅ props اختیاری بدون default
    updateFn,
    renderEditFields,
    deleteFn,
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
                    updateFn={updateFn}
                    renderEditFields={renderEditFields}
                    editTitle={editTitle}
                    mineToggleLabel={mineToggleLabel}
                    deleteFn={deleteFn}
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
    updateFn,
    renderEditFields,
    editTitle = 'ویرایش',
    mineToggleLabel = 'فقط موارد من',
    deleteFn,
}: any) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [allItems, setAllItems] = useState<any[]>([]);
    const [mineOnly, setMineOnly] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [editTitleValue, setEditTitleValue] = useState('');
    const [createTitle, setCreateTitle] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const createDataRef = React.useRef<{ [key: string]: any }>({});
    const editDataRef = React.useRef<{ [key: string]: any }>({});
    const containerRef = React.useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // debounce search — فقط debouncedSearch و page رو آپدیت کن
    // ✅ allItems رو اینجا پاک نکن — در effect بعدی هندل می‌شه
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // ✅ وقتی debouncedSearch یا mineOnly عوض شد، allItems رو پاک کن
    // اما نه در mount اولیه — چون query همون لحظه اجرا می‌شه
    const isFirstRender = React.useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setAllItems([]);
    }, [debouncedSearch, mineOnly]);

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
        // ✅ بدون placeholderData — نتایج قدیمی نمایش داده نمی‌شن
        // flash اولیه با isFirstRender هندل می‌شه
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

    // ✅ mutation update
    const updateMut = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateFn(id, data),
        onSuccess: (updated: any) => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            setEditingItem(null);
            // اگه آیتم در حال انتخاب‌شده بود، آپدیتش کن
            if (value?.id === updated.id) {
                onChange({
                    id: updated.id,
                    title: updated.title,
                    isByUser: updated.isByUser ?? true,
                    isNew: updated.isNew ?? true,
                    ...updated,
                });
            }
        },
        onError: (err: any) => {
            setEditError(err?.message || 'خطا در ویرایش');
        },
    });

    // ✅ mutation delete
    const deleteMut = useMutation({
        mutationFn: (id: string) => deleteFn(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            setAllItems(prev => prev.filter((i: any) => i.id !== deleteMut.variables));
        },
        onError: (err: any) => {
            // ✅ پیام خطا از بک‌اند رو به کاربر نشون بده
            const msg = err?.data?.message || err?.message || 'خطا در حذف';
            alert(msg);
        },
    });

    const handleDelete = (item: any) => {
        if (window.confirm(`«${item.title}» حذف شود؟`)) {
            deleteMut.mutate(item.id);
        }
    };

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

    // ✅ شروع ویرایش آیتم
    const handleStartEdit = (item: any) => {
        setEditingItem(item);
        setEditTitleValue(item.title || '');
        setEditError(null);
        editDataRef.current = {};
    };

    // ✅ تأیید ویرایش
    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editTitleValue.trim().length < 2) return;
        setEditError(null);
        try {
            await updateMut.mutateAsync({
                id: editingItem.id,
                data: {
                    title: editTitleValue.trim(),
                    ...editDataRef.current,
                },
            });
        } catch (err) {
            // error handled in onError
        }
    };

    // click outside — ✅ با data-entity-picker-overlay هندل می‌شه
    // نه با containerRef — چون nested EntityPicker‌ها تداخل دارن
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // ✅ اگه روی overlay کلیک شد و این overlay خودشه (نه parent)
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

    // وقتی showCreateForm=true می‌شه، title رو از search پر کن
    useEffect(() => {
        if (showCreateForm && !createTitle) {
            setCreateTitle(trimmedSearch);
        }
    }, [showCreateForm]);

    return createPortal(
        <div
            data-entity-picker-overlay="true"
            className="fixed inset-0 z-[110] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
        >
            <div
                ref={containerRef}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                    min-h-[60dvh] max-h-[88dvh] flex flex-col overflow-hidden
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            >
                {/* هدر — با دکمه «جدید» */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <h3 className="text-sm font-extrabold text-on-surface">
                        {showCreateForm ? createFormTitle : editingItem ? editTitle : selectTitle}
                    </h3>
                    <div className="flex items-center gap-2">
                        {/* ✅ دکمه «جدید» — همیشه در هدر، فقط در حالت انتخاب */}
                        {!showCreateForm && !editingItem && (
                            <button
                                type="button"
                                onClick={() => {
                                    setCreateTitle(search.trim() || debouncedSearch);
                                    setShowCreateForm(true);
                                }}
                                className="flex items-center gap-1 h-8 px-3 rounded-lg bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                جدید
                            </button>
                        )}
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
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
                ) : editingItem ? (
                    // ═══ حالت ویرایش ═══
                    <form onSubmit={handleEdit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim p-4 space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-on-surface block">عنوان *</label>
                                <input
                                    value={editTitleValue}
                                    onChange={(e) => setEditTitleValue(e.target.value)}
                                    autoFocus
                                    className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                            </div>
                            {renderEditFields && renderEditFields({
                                title: editTitleValue,
                                setTitle: setEditTitleValue,
                                dataRef: editDataRef,
                                initialData: editingItem,
                            })}
                            {editError && (
                                <p className="text-error text-[11px]">{editError}</p>
                            )}
                        </div>
                        <div className="flex-shrink-0 p-3 border-t border-outline-variant/20 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="flex-1 h-10 rounded-xl border border-outline-variant/60 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            >
                                انصراف
                            </button>
                            <button
                                type="submit"
                                disabled={editTitleValue.trim().length < 2 || updateMut.isPending}
                                className="flex-1 h-10 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'ذخیره تغییرات'}
                            </button>
                        </div>
                    </form>
                ) : (
                    // ═══ حالت انتخاب ═══
                    <>
                        {/* جستجو + mine toggle کنار هم */}
                        <div className="flex-shrink-0 p-3 border-b border-outline-variant/20">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={`جستجو... (حداقل ${minSearchChars} حرف)`}
                                        className="w-full h-10 pr-9 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    />
                                </div>
                                {showMineOnly && (
                                    <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0 px-2.5 h-10 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={mineOnly}
                                            onChange={(e) => setMineOnly(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded accent-primary"
                                        />
                                        <span className="text-[10px] font-bold text-on-surface-variant whitespace-nowrap">{mineToggleLabel}</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* لیست */}
                        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim pb-[calc(1rem+env(safe-area-inset-bottom))]">
                            {isFetching && allItems.length === 0 ? (
                                <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
                            ) : allItems.length === 0 ? (
                                // ✅ پیام ساده «پیدا نشد» — دکمه create در هدر هست
                                <div className="p-6 text-center">
                                    <Tag className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-2" />
                                    <p className="text-xs text-on-surface-variant">
                                        {!canSearch && search.length > 0
                                            ? `حداقل ${minSearchChars} حرف تایپ کنید`
                                            : canSearch && trimmedSearch
                                                ? 'موردی با این نام پیدا نشد.'
                                                : 'موردی موجود نیست.'}
                                    </p>
                                    {canSearch && trimmedSearch && (
                                        <p className="text-[11px] text-on-surface-variant/70 leading-5 mt-1">
                                            با دکمه «جدید» در بالا می‌توانید اضافه کنید.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {allItems.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors',
                                                value?.id === item.id ? 'bg-primary/10' : 'hover:bg-surface-container-low',
                                            )}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => onChange({
                                                    id: item.id,
                                                    title: item.title,
                                                    isByUser: item.isByUser,
                                                    isNew: item.isNew,
                                                    ...item,
                                                })}
                                                className="flex items-center gap-3 flex-1 min-w-0 text-right"
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
                                            {updateFn && item.isNew && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleStartEdit(item); }}
                                                    className="flex-shrink-0 w-7 h-7 rounded-lg text-on-surface-variant/60 hover:text-primary hover:bg-primary/10 grid place-items-center transition-colors"
                                                    title="ویرایش"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {/* ✅ آیکون حذف — فقط برای isNew و اگه deleteFn وجود داشته باشه */}
                                            {deleteFn && item.isNew && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                                    disabled={deleteMut.isPending && deleteMut.variables === item.id}
                                                    className="flex-shrink-0 w-7 h-7 rounded-lg text-on-surface-variant/60 hover:text-error hover:bg-error/10 grid place-items-center transition-colors disabled:opacity-50"
                                                    title="حذف"
                                                >
                                                    {deleteMut.isPending && deleteMut.variables === item.id
                                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        : <Trash2 className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                        </div>
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

                        {/* هشدار تکراری — راهنمای ملایم */}
                        {exactMatch && trimmedSearch.length >= 2 && (
                            <div className="flex-shrink-0 p-3 border-t border-amber-200/40 bg-amber-50/50 dark:bg-amber-900/10">
                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <p className="text-xs">
                                        این مورد قبلاً با همین عنوان ثبت شده. از لیست بالا انتخاب کنید.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>,
        document.body,
    );
}
