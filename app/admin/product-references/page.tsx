// app/admin/product-references/page.tsx
// ✅ مدیریت کالاهای مرجع — پنل ادمین سیستم
// نظارت بر داده‌های پایه‌ای که کاربران وارد می‌کنند:
// ویرایش، حذف، تأیید/رد، مشاهدهٔ آگهی‌های وصل و ثبت‌کنندهٔ کالا
'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
    Package, Search, Pencil, Trash2, Eye, Loader2, ChevronRight, ChevronLeft,
    X, Plus, CheckCircle2, Clock, ImageOff, Store, User, Link2,
} from 'lucide-react';
import {
    useAdminProducts, useAdminProduct, useUpdateAdminProduct, useDeleteAdminProduct,
} from '@/lib/api/apiHooks';
import BrandPicker, { BrandValue } from '@/app/components/BrandPicker';
import { ProductReference, AdRefItem } from '@/lib/api/apiTypes';

const PAGE_SIZE = 20;

const formatPrice = (p?: number | null) =>
    p == null ? '—' : `${p.toLocaleString('fa-IR')} تومان`;

export default function AdminProductReferencesPage() {
    // ─── فیلترها ───
    const [searchInput, setSearchInput] = useState('');
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortBy, setSortBy] = useState<'createdAt' | 'usageCount'>('createdAt');
    const [page, setPage] = useState(1);

    // ✅ debounce سرچ
    useEffect(() => {
        const t = setTimeout(() => { setQ(searchInput); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const params = useMemo(() => ({
        ...(q.trim().length >= 2 ? { q: q.trim() } : {}),
        ...(statusFilter === 'confirmed' ? { confirmed: 'true' } : statusFilter === 'pending' ? { confirmed: 'false' } : {}),
        ...(activeFilter === 'active' ? { isActive: 'true' } : activeFilter === 'inactive' ? { isActive: 'false' } : {}),
        sortBy,
        sortOrder: 'desc' as const,
        page,
        limit: PAGE_SIZE,
    }), [q, statusFilter, activeFilter, sortBy, page]);

    const listQ = useAdminProducts(params);
    const updateMut = useUpdateAdminProduct();
    const deleteMut = useDeleteAdminProduct();

    const items: ProductReference[] = listQ.data?.items ?? [];
    const total: number = listQ.data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // ─── مودال‌ها ───
    const [editing, setEditing] = useState<ProductReference | null>(null);
    const [viewing, setViewing] = useState<ProductReference | null>(null);
    const [deleting, setDeleting] = useState<ProductReference | null>(null);

    const confirmDelete = async () => {
        if (!deleting) return;
        deleteMut.mutate(deleting.id, {
            onSuccess: (res: any) => {
                const detached = res?.detachedAds ?? 0;
                toast.success(`کالای «${deleting.title}» حذف شد${detached > 0 ? ` — ${detached.toLocaleString('fa-IR')} آگهی وصل جدا شد` : ''}`);
                setDeleting(null);
            },
            onError: (err: any) => toast.error(err?.message || 'خطا در حذف کالا'),
        });
    };

    return (
        <div className="space-y-4">
            {/* ─── نوار فیلتر ─── */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="جستجوی عنوان، برند یا کلمهٔ کلیدی…"
                            className="w-full h-11 pr-10 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
                        className="h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface focus:outline-none"
                    >
                        <option value="createdAt">جدیدترین</option>
                        <option value="usageCount">پراستفاده‌ترین</option>
                    </select>
                </div>

                <div className="flex flex-wrap gap-2">
                    {([
                        ['all', 'همه'],
                        ['confirmed', 'تأییدشده'],
                        ['pending', 'در انتظار تأیید'],
                    ] as const).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => { setStatusFilter(val); setPage(1); }}
                            className={`h-8 px-3 rounded-full text-xs font-bold transition-all border ${
                                statusFilter === val
                                    ? 'bg-primary text-on-primary border-primary'
                                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:text-on-surface'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                    <span className="w-px bg-outline-variant/40 mx-1" aria-hidden />
                    {([
                        ['all', 'همه وضعیت‌ها'],
                        ['active', 'فعال'],
                        ['inactive', 'غیرفعال'],
                    ] as const).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => { setActiveFilter(val); setPage(1); }}
                            className={`h-8 px-3 rounded-full text-xs font-bold transition-all border ${
                                activeFilter === val
                                    ? 'bg-primary text-on-primary border-primary'
                                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50 hover:text-on-surface'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── شمارنده ─── */}
            <div className="text-xs text-on-surface-variant">
                {listQ.isFetching ? (
                    <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> در حال بارگذاری…</span>
                ) : (
                    <>مجموع: <b className="text-on-surface">{total.toLocaleString('fa-IR')}</b> کالای مرجع</>
                )}
            </div>

            {/* ─── لیست ─── */}
            {listQ.isPending ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-surface-container-low animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="border-2 border-dashed border-outline-variant/40 rounded-3xl p-10 text-center text-on-surface-variant text-sm">
                    کالای مرجعی با این فیلترها پیدا نشد
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((p) => (
                        <div
                            key={p.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-outline-variant/60 transition-colors"
                        >
                            {/* تصویر */}
                            {p.imageUrl || p.thumbnailUrl ? (
                                <img src={(p.thumbnailUrl || p.imageUrl) || undefined} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-surface-container-high" />
                            ) : (
                                <span className="w-14 h-14 rounded-xl bg-surface-container-high grid place-items-center flex-shrink-0">
                                    <ImageOff className="w-5 h-5 text-on-surface-variant/50" />
                                </span>
                            )}

                            {/* اطلاعات */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-bold text-on-surface truncate">{p.title}</h3>
                                    {p.confirmed ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                            <CheckCircle2 className="w-3 h-3" /> تأییدشده
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <Clock className="w-3 h-3" /> در انتظار
                                        </span>
                                    )}
                                    {!p.isActive && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error">غیرفعال</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant flex-wrap">
                                    <span>برند: <b className="text-on-surface">{p.brand?.title || '—'}</b></span>
                                    <span>آگهی: <b className="text-on-surface">{(p._count?.ads ?? 0).toLocaleString('fa-IR')}</b></span>
                                    {p.specs && Object.keys(p.specs).length > 0 && (
                                        <span>ویژگی‌ها: <b className="text-on-surface">{Object.keys(p.specs).length.toLocaleString('fa-IR')}</b></span>
                                    )}
                                    {p.creator && (
                                        <span className="inline-flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {p.creator.fullName || '—'} ({p.creator.phone})
                                        </span>
                                    )}
                                    {p.arm && (
                                        <span className="inline-flex items-center gap-1">
                                            <Store className="w-3 h-3" />
                                            {p.arm.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* عملیات */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    onClick={() => setViewing(p)}
                                    title="جزئیات"
                                    className="w-9 h-9 grid place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setEditing(p)}
                                    title="ویرایش"
                                    className="w-9 h-9 grid place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleting(p)}
                                    title="حذف"
                                    className="w-9 h-9 grid place-items-center rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ─── صفحه‌بندی ─── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="w-9 h-9 grid place-items-center rounded-xl border border-outline-variant/40 text-on-surface-variant disabled:opacity-40 hover:bg-surface-container-high"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                        const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                        const pn = start + i;
                        if (pn > totalPages) return null;
                        return (
                            <button
                                key={pn}
                                onClick={() => setPage(pn)}
                                className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
                                    pn === page
                                        ? 'bg-primary text-on-primary'
                                        : 'text-on-surface-variant hover:bg-surface-container-high'
                                }`}
                            >
                                {pn.toLocaleString('fa-IR')}
                            </button>
                        );
                    })}
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="w-9 h-9 grid place-items-center rounded-xl border border-outline-variant/40 text-on-surface-variant disabled:opacity-40 hover:bg-surface-container-high"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ─── مودال ویرایش ─── */}
            {editing && (
                <EditProductModal
                    product={editing}
                    onClose={() => setEditing(null)}
                    onSave={async (data) => {
                        await new Promise<void>((resolve, reject) => {
                            updateMut.mutate(
                                { id: editing.id, data },
                                {
                                    onSuccess: () => {
                                        toast.success('کالای مرجع با موفقیت ویرایش شد');
                                        setEditing(null);
                                        resolve();
                                    },
                                    onError: (err: any) => {
                                        toast.error(err?.message || 'خطا در ویرایش کالا');
                                        reject();
                                    },
                                },
                            );
                        });
                    }}
                    saving={updateMut.isPending}
                />
            )}

            {/* ─── مودال جزئیات ─── */}
            {viewing && (
                <ProductDetailModal product={viewing} onClose={() => setViewing(null)} />
            )}

            {/* ─── تأیید حذف ─── */}
            {deleting && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDeleting(null)}>
                    <div
                        className="bg-surface w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-5 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-black text-on-surface">حذف کالای مرجع</h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                            کالای «<b className="text-on-surface">{deleting.title}</b>» حذف شود؟
                            {(deleting._count?.ads ?? 0) > 0 && (
                                <> این کالا به <b className="text-error">{(deleting._count?.ads ?? 0).toLocaleString('fa-IR')}</b> آگهی وصل است — وصل‌شدگی آگهی‌ها به‌صورت خودکار جدا می‌شود و آگهی‌ها حذف نمی‌شوند.</>
                            )}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDeleting(null)}
                                className="flex-1 h-10 rounded-xl border border-outline-variant/50 text-sm font-bold text-on-surface"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteMut.isPending}
                                className="flex-1 h-10 rounded-xl bg-error text-on-error text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                                {deleteMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════
// مودال ویرایش کالای مرجع
// ══════════════════════════════════════════════════
function EditProductModal({
    product, onClose, onSave, saving,
}: {
    product: ProductReference;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    saving: boolean;
}) {
    const [title, setTitle] = useState(product.title);
    const [brand, setBrand] = useState<BrandValue | null>(
        product.brand ? { id: product.brand.id, title: product.brand.title, logoUrl: product.brand.logoUrl || undefined } : null,
    );
    const [noBrand, setNoBrand] = useState(!product.brand);
    const [category, setCategory] = useState(product.category || '');
    const [keywords, setKeywords] = useState((product.keywords || []).join('، '));
    const [unitHints, setUnitHints] = useState((product.unitHints || []).join('، '));
    const [imageUrl, setImageUrl] = useState(product.imageUrl || '');
    const [thumbnailUrl, setThumbnailUrl] = useState(product.thumbnailUrl || '');
    const [description, setDescription] = useState(product.description || '');
    const [specs, setSpecs] = useState<Array<[string, string]>>(
        Object.entries(product.specs || {}) as Array<[string, string]>,
    );
    const [isActive, setIsActive] = useState(product.isActive);
    const [confirmed, setConfirmed] = useState(product.confirmed);

    const submit = async () => {
        if (!title.trim()) {
            toast.error('عنوان کالا الزامی است');
            return;
        }
        const specObj: Record<string, string> = {};
        specs.forEach(([k, v]) => { if (k.trim() && v.trim()) specObj[k.trim()] = v.trim(); });
        const splitList = (s: string) => s.split(/[،,]/).map((x) => x.trim()).filter(Boolean);
        await onSave({
            title: title.trim(),
            brandId: brand?.id || '',
            category,
            keywords: splitList(keywords),
            unitHints: splitList(unitHints),
            imageUrl,
            thumbnailUrl,
            description,
            specs: specObj,
            isActive,
            confirmed,
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div
                className="bg-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* سربرگ */}
                <div className="sticky top-0 bg-surface flex items-center justify-between px-5 py-4 border-b border-outline-variant/30 z-10">
                    <h3 className="text-base font-black text-on-surface flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" /> ویرایش کالای مرجع
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* فرم */}
                <div className="p-5 space-y-4">
                    <Field label="عنوان کالا">
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                    <BrandPicker
                        value={brand}
                        onChange={(b) => { setBrand(b); if (b) setNoBrand(false); }}
                        mode={noBrand ? false : brand ? true : null}
                        onModeChange={(m) => { setNoBrand(m === false); if (m === false) setBrand(null); }}
                        label="برند"
                    />

                    <Field label="دستهٔ کالا">
                        <input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="مثلاً: مواد غذایی / کنسرو"
                            className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                    <Field label="کلمات کلیدی (با «،» جدا کنید)">
                        <input
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="تن ماهی، کنسرو ماهی"
                            className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                    <Field label="واحدهای رایج (با «،» جدا کنید)">
                        <input
                            value={unitHints}
                            onChange={(e) => setUnitHints(e.target.value)}
                            placeholder="عدد، کارتن ۲۴تایی"
                            className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                    <Field label="آدرس تصویر کالا">
                        <input
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            dir="ltr"
                            className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                    <Field label="تصویر بندانگشتی (اختیاری)">
                        <input
                            value={thumbnailUrl}
                            onChange={(e) => setThumbnailUrl(e.target.value)}
                            dir="ltr"
                            className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </Field>

                    <Field label="توضیحات">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                    </Field>

                    {/* ویژگی‌ها (specs) */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-on-surface">ویژگی‌های کالا</label>
                            <button
                                type="button"
                                onClick={() => setSpecs((s) => [...s, ['', '']])}
                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                            >
                                <Plus className="w-3.5 h-3.5" /> افزودن ویژگی
                            </button>
                        </div>
                        {specs.length === 0 ? (
                            <p className="text-xs text-on-surface-variant">مثلاً: وزن = ۲۵۰ گرم، جنس = فلز</p>
                        ) : (
                            <div className="space-y-2">
                                {specs.map(([k, v], i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input
                                            value={k}
                                            onChange={(e) => setSpecs((s) => s.map((row, j) => (j === i ? [e.target.value, row[1]] : row)))}
                                            placeholder="نام ویژگی"
                                            className="flex-1 h-10 px-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-xs text-on-surface focus:outline-none"
                                        />
                                        <input
                                            value={v}
                                            onChange={(e) => setSpecs((s) => s.map((row, j) => (j === i ? [row[0], e.target.value] : row)))}
                                            placeholder="مقدار"
                                            className="flex-1 h-10 px-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-xs text-on-surface focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))}
                                            className="w-9 h-9 grid place-items-center rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* سوییچ‌های وضعیت */}
                    <div className="grid grid-cols-2 gap-2">
                        <ToggleRow
                            label="فعال (در سرچ عمده دیده شود)"
                            checked={isActive}
                            onChange={setIsActive}
                        />
                        <ToggleRow
                            label="تأیید ادمین (قفل ویرایش کاربر)"
                            checked={confirmed}
                            onChange={setConfirmed}
                        />
                    </div>
                </div>

                {/* دکمه‌ها */}
                <div className="sticky bottom-0 bg-surface px-5 py-4 border-t border-outline-variant/30 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 rounded-xl border border-outline-variant/50 text-sm font-bold text-on-surface"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={submit}
                        disabled={saving}
                        className="flex-[2] h-11 rounded-xl bg-primary text-on-primary text-sm font-black flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        ذخیرهٔ تغییرات
                    </button>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════
// مودال جزئیات — ثبت‌کننده، بازار، آگهی‌های وصل
// ══════════════════════════════════════════════════
function ProductDetailModal({ product, onClose }: { product: ProductReference; onClose: () => void }) {
    const detailQ = useAdminProduct(product.id);
    const detail = detailQ.data;
    const recentAds: AdRefItem[] = detail?.recentAds ?? [];

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div
                className="bg-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-surface flex items-center justify-between px-5 py-4 border-b border-outline-variant/30 z-10">
                    <h3 className="text-base font-black text-on-surface flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" /> جزئیات کالای مرجع
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {detailQ.isPending ? (
                    <div className="p-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                    <div className="p-5 space-y-4">
                        {/* هویت کالا */}
                        <div className="flex items-center gap-3">
                            {detail?.imageUrl || detail?.thumbnailUrl ? (
                                <img src={detail.thumbnailUrl || detail.imageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover bg-surface-container-high" />
                            ) : (
                                <span className="w-16 h-16 rounded-2xl bg-surface-container-high grid place-items-center">
                                    <ImageOff className="w-6 h-6 text-on-surface-variant/50" />
                                </span>
                            )}
                            <div className="min-w-0">
                                <h4 className="text-sm font-black text-on-surface truncate">{detail?.title}</h4>
                                <p className="text-xs text-on-surface-variant mt-0.5">
                                    برند: {detail?.brand?.title || '—'}
                                    {detail?.category ? ` • دسته: ${detail.category}` : ''}
                                </p>
                            </div>
                        </div>

                        {/* ثبت‌کننده و بازار */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <InfoCard
                                icon={<User className="w-4 h-4" />}
                                title="ثبت‌کننده"
                                lines={detail?.creator
                                    ? [detail.creator.fullName || 'بدون نام', detail.creator.phone]
                                    : ['کاربر قدیمی/سیستمی', 'بدون اطلاعات ثبت‌کننده']}
                            />
                            <InfoCard
                                icon={<Store className="w-4 h-4" />}
                                title="بازار مبدأ"
                                lines={detail?.arm ? [detail.arm.name, `اسلاگ: ${detail.arm.slug}`] : ['سراسری', 'از بازار خاصی ثبت نشده']}
                            />
                        </div>

                        {/* وضعیت‌ها */}
                        <div className="flex flex-wrap gap-1.5">
                            <Badge active={detail?.confirmed} ok="تأییدشده" no="در انتظار تأیید" />
                            <Badge active={detail?.isActive} ok="فعال" no="غیرفعال" />
                            <Badge active={detail?.isNew} ok="جدید (قابل ویرایش کاربر)" no="قفل‌شده" />
                            <Badge active={detail?.isByUser} ok="کاربر-ساخته" no="سیستمی" />
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                                {(detail?._count?.ads ?? 0).toLocaleString('fa-IR')} آگهی وصل
                            </span>
                        </div>

                        {/* ویژگی‌ها */}
                        {detail?.specs && Object.keys(detail.specs).length > 0 && (
                            <Section title="ویژگی‌های کالا">
                                <div className="grid grid-cols-2 gap-1.5">
                                    {Object.entries(detail.specs).map(([k, v]) => (
                                        <div key={k} className="text-xs bg-surface-container-low rounded-lg px-2.5 py-1.5">
                                            <span className="text-on-surface-variant">{k}: </span>
                                            <span className="font-bold text-on-surface">{String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* آگهی‌های وصل */}
                        <Section title="آگهی‌های وصل‌شده (۱۰ مورد اخیر)">
                            {recentAds.length === 0 ? (
                                <p className="text-xs text-on-surface-variant">هنوز هیچ آگهی به این کالا وصل نیست</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {recentAds.map((ad) => (
                                        <a
                                            key={ad.id}
                                            href="/admin/ads"
                                            className="flex items-center justify-between gap-2 text-xs bg-surface-container-low rounded-xl px-3 py-2.5 hover:bg-surface-container-high transition-colors"
                                        >
                                            <span className="flex items-center gap-2 min-w-0">
                                                <Link2 className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
                                                <span className="font-bold text-on-surface truncate">{ad.title}</span>
                                            </span>
                                            <span className="flex-shrink-0 text-on-surface-variant">{formatPrice(ad.unitPrice)}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </Section>
                    </div>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════
// اتم‌های کوچک UI
// ══════════════════════════════════════════════════
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`flex items-center justify-between gap-2 h-11 px-3 rounded-xl border text-xs font-bold transition-colors ${
                checked
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-surface-container-lowest border-outline-variant/50 text-on-surface-variant'
            }`}
        >
            <span className="text-right leading-tight">{label}</span>
            <span className={`w-9 h-5 rounded-full p-0.5 flex-shrink-0 transition-colors ${checked ? 'bg-primary' : 'bg-outline-variant/60'}`}>
                <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? '-translate-x-4' : ''}`} />
            </span>
        </button>
    );
}

function InfoCard({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
    return (
        <div className="bg-surface-container-low rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant mb-1.5">
                {icon} {title}
            </div>
            {lines.map((l, i) => (
                <p key={i} className={`text-xs truncate ${i === 0 ? 'font-black text-on-surface' : 'text-on-surface-variant'}`}>{l}</p>
            ))}
        </div>
    );
}

function Badge({ active, ok, no }: { active?: boolean; ok: string; no: string }) {
    return (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${active ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {active ? ok : no}
        </span>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h4 className="text-xs font-black text-on-surface mb-2">{title}</h4>
            {children}
        </div>
    );
}
