// app/arm-admin/references/page.tsx
// ✅ مدیریت داده‌های پایهٔ بازار — پنل مالک بازار
// کالاهای مرجع و برندهایی که از طریق همین بازار و فروشندگانش ثبت شده‌اند
// ویرایش/حذف دادهٔ اشتباه + دیدن آگهی‌های وصل به هر کدام
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
    Package, Tag, Search, Pencil, Trash2, Eye, Loader2, ChevronRight, ChevronLeft,
    X, Plus, CheckCircle2, Clock, ImageOff, User, Link2, Store as StoreIcon,
} from 'lucide-react';
import { RootState } from '@/lib/store/store';
import {
    useArmReferenceProducts, useArmReferenceBrands,
    useUpdateArmReferenceProduct, useDeleteArmReferenceProduct,
    useUpdateArmReferenceBrand, useDeleteArmReferenceBrand,
} from '@/lib/api/apiHooks';
import BrandPicker, { BrandValue } from '@/app/components/BrandPicker';
import { ProductReference, Brand as BrandType, AdRefItem } from '@/lib/api/apiTypes';

const PAGE_SIZE = 20;

const formatPrice = (p?: number | null) =>
    p == null ? '—' : `${p.toLocaleString('fa-IR')} تومان`;

export default function ArmReferencesPage() {
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);
    const [tab, setTab] = useState<'products' | 'brands'>('products');

    if (!currentSlug) {
        return (
            <div className="border-2 border-dashed border-outline-variant/40 rounded-3xl p-10 text-center text-on-surface-variant text-sm">
                ابتدا یک بازار انتخاب کنید
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* سربرگ توضیح */}
            <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-4">
                <h2 className="text-sm font-black text-on-surface flex items-center gap-2">
                    <StoreIcon className="w-4 h-4 text-primary" />
                    داده‌های پایهٔ بازار «{currentArm?.name || currentSlug}»
                </h2>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    کالاهای مرجع و برندهایی که فروشندگان بازار شما هنگام ثبت آگهی ساخته‌اند. دادهٔ اشتباه را ویرایش یا حذف کنید تا دیتابیس مشترک تمیز بماند.
                </p>
            </div>

            {/* تب‌ها */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-container-high/60 border border-outline-variant/25">
                <button
                    onClick={() => setTab('products')}
                    className={`flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-bold transition-all ${
                        tab === 'products'
                            ? 'bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/25'
                            : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                    <Package className="w-4 h-4" />
                    کالاهای مرجع
                </button>
                <button
                    onClick={() => setTab('brands')}
                    className={`flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-bold transition-all ${
                        tab === 'brands'
                            ? 'bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/25'
                            : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                    <Tag className="w-4 h-4" />
                    برندها
                </button>
            </div>

            {tab === 'products'
                ? <ProductsTab slug={currentSlug} />
                : <BrandsTab slug={currentSlug} />}
        </div>
    );
}

// ══════════════════════════════════════════════════
// تب کالاهای مرجع
// ══════════════════════════════════════════════════
function ProductsTab({ slug }: { slug: string }) {
    const [searchInput, setSearchInput] = useState('');
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const t = setTimeout(() => { setQ(searchInput); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const params = useMemo(() => ({
        ...(q.trim().length >= 2 ? { q: q.trim() } : {}),
        ...(statusFilter === 'confirmed' ? { confirmed: 'true' } : statusFilter === 'pending' ? { confirmed: 'false' } : {}),
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
        page,
        limit: PAGE_SIZE,
    }), [q, statusFilter, page]);

    const listQ = useArmReferenceProducts(slug, params);
    const updateMut = useUpdateArmReferenceProduct(slug);
    const deleteMut = useDeleteArmReferenceProduct(slug);

    const items: ProductReference[] = listQ.data?.items ?? [];
    const total: number = listQ.data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const [editing, setEditing] = useState<ProductReference | null>(null);
    const [viewing, setViewing] = useState<ProductReference | null>(null);
    const [deleting, setDeleting] = useState<ProductReference | null>(null);

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="جستجوی کالای مرجع…"
                        className="w-full h-11 pr-10 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <div className="flex gap-2">
                    {([
                        ['all', 'همه'],
                        ['confirmed', 'تأییدشده'],
                        ['pending', 'در انتظار'],
                    ] as const).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => { setStatusFilter(val); setPage(1); }}
                            className={`h-11 px-3 rounded-xl text-xs font-bold transition-all border ${
                                statusFilter === val
                                    ? 'bg-primary text-on-primary border-primary'
                                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-xs text-on-surface-variant">
                {listQ.isFetching ? (
                    <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> بارگذاری…</span>
                ) : (
                    <>مجموع: <b className="text-on-surface">{total.toLocaleString('fa-IR')}</b> کالای مرجع</>
                )}
            </div>

            {listQ.isPending ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-surface-container-low animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="border-2 border-dashed border-outline-variant/40 rounded-3xl p-8 text-center text-on-surface-variant text-sm">
                    هنوز کالای مرجعی از طریق فروشندگان بازار شما ثبت نشده
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((p) => (
                        <ReferenceRow
                            key={p.id}
                            title={p.title}
                            imageUrl={p.thumbnailUrl || p.imageUrl}
                            icon={<Package className="w-5 h-5 text-on-surface-variant/50" />}
                            confirmed={p.confirmed}
                            isActive={p.isActive}
                            meta={
                                <>
                                    <span>برند: <b className="text-on-surface">{p.brand?.title || '—'}</b></span>
                                    <span>آگهی: <b className="text-on-surface">{(p._count?.ads ?? 0).toLocaleString('fa-IR')}</b></span>
                                    {p.creator && (
                                        <span className="inline-flex items-center gap-1">
                                            <User className="w-3 h-3" /> {p.creator.fullName || p.creator.phone}
                                        </span>
                                    )}
                                </>
                            }
                            onView={() => setViewing(p)}
                            onEdit={() => setEditing(p)}
                            onDelete={() => setDeleting(p)}
                        />
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <Pager page={page} totalPages={totalPages} onChange={setPage} />
            )}

            {editing && (
                <ArmEditProductModal
                    product={editing}
                    onClose={() => setEditing(null)}
                    saving={updateMut.isPending}
                    onSave={async (data) => {
                        await new Promise<void>((resolve, reject) => {
                            updateMut.mutate(
                                { id: editing.id, data },
                                {
                                    onSuccess: () => {
                                        toast.success('کالای مرجع ویرایش شد');
                                        setEditing(null);
                                        resolve();
                                    },
                                    onError: (err: any) => {
                                        toast.error(err?.message || 'خطا در ویرایش');
                                        reject();
                                    },
                                },
                            );
                        });
                    }}
                />
            )}
            {viewing && <ArmProductDetailModal slug={slug} product={viewing} onClose={() => setViewing(null)} />}
            {deleting && (
                <ConfirmDialog
                    title="حذف کالای مرجع"
                    message={
                        <>
                            کالای «<b className="text-on-surface">{deleting.title}</b>» حذف شود؟
                            {(deleting._count?.ads ?? 0) > 0 && (
                                <> وصل‌شدگی <b className="text-error">{(deleting._count?.ads ?? 0).toLocaleString('fa-IR')}</b> آگهی خودکار جدا می‌شود؛ آگهی‌ها حذف نمی‌شوند.</>
                            )}
                        </>
                    }
                    onCancel={() => setDeleting(null)}
                    onConfirm={() => {
                        deleteMut.mutate(deleting.id, {
                            onSuccess: () => {
                                toast.success('کالای مرجع حذف شد');
                                setDeleting(null);
                            },
                            onError: (err: any) => toast.error(err?.message || 'خطا در حذف'),
                        });
                    }}
                    pending={deleteMut.isPending}
                />
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════
// تب برندها
// ══════════════════════════════════════════════════
function BrandsTab({ slug }: { slug: string }) {
    const [searchInput, setSearchInput] = useState('');
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const t = setTimeout(() => { setQ(searchInput); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const params = useMemo(() => ({
        ...(q.trim().length >= 2 ? { q: q.trim() } : {}),
        ...(statusFilter === 'confirmed' ? { confirmed: 'true' } : statusFilter === 'pending' ? { confirmed: 'false' } : {}),
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
        page,
        limit: PAGE_SIZE,
    }), [q, statusFilter, page]);

    const listQ = useArmReferenceBrands(slug, params);
    const updateMut = useUpdateArmReferenceBrand(slug);
    const deleteMut = useDeleteArmReferenceBrand(slug);

    const items: BrandType[] = listQ.data?.items ?? [];
    const total: number = listQ.data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const [editing, setEditing] = useState<BrandType | null>(null);
    const [viewing, setViewing] = useState<BrandType | null>(null);
    const [deleting, setDeleting] = useState<BrandType | null>(null);

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="جستجوی برند…"
                        className="w-full h-11 pr-10 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <div className="flex gap-2">
                    {([
                        ['all', 'همه'],
                        ['confirmed', 'تأییدشده'],
                        ['pending', 'در انتظار'],
                    ] as const).map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => { setStatusFilter(val); setPage(1); }}
                            className={`h-11 px-3 rounded-xl text-xs font-bold transition-all border ${
                                statusFilter === val
                                    ? 'bg-primary text-on-primary border-primary'
                                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/50'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-xs text-on-surface-variant">
                {listQ.isFetching ? (
                    <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> بارگذاری…</span>
                ) : (
                    <>مجموع: <b className="text-on-surface">{total.toLocaleString('fa-IR')}</b> برند</>
                )}
            </div>

            {listQ.isPending ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-surface-container-low animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="border-2 border-dashed border-outline-variant/40 rounded-3xl p-8 text-center text-on-surface-variant text-sm">
                    هنوز برندی از طریق فروشندگان بازار شما ثبت نشده
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((b) => (
                        <ReferenceRow
                            key={b.id}
                            title={b.title}
                            imageUrl={b.logoUrl}
                            icon={<Tag className="w-5 h-5 text-on-surface-variant/50" />}
                            confirmed={b.confirmed}
                            isActive={b.isActive}
                            meta={
                                <>
                                    <span>کالا: <b className="text-on-surface">{(b._count?.products ?? 0).toLocaleString('fa-IR')}</b></span>
                                    <span>آگهی: <b className="text-on-surface">{(b._count?.ads ?? 0).toLocaleString('fa-IR')}</b></span>
                                    {b.creator && (
                                        <span className="inline-flex items-center gap-1">
                                            <User className="w-3 h-3" /> {b.creator.fullName || b.creator.phone}
                                        </span>
                                    )}
                                </>
                            }
                            onView={() => setViewing(b)}
                            onEdit={() => setEditing(b)}
                            onDelete={() => setDeleting(b)}
                        />
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <Pager page={page} totalPages={totalPages} onChange={setPage} />
            )}

            {editing && (
                <ArmEditBrandModal
                    brand={editing}
                    onClose={() => setEditing(null)}
                    saving={updateMut.isPending}
                    onSave={async (data) => {
                        await new Promise<void>((resolve, reject) => {
                            updateMut.mutate(
                                { id: editing.id, data },
                                {
                                    onSuccess: () => {
                                        toast.success('برند ویرایش شد');
                                        setEditing(null);
                                        resolve();
                                    },
                                    onError: (err: any) => {
                                        toast.error(err?.message || 'خطا در ویرایش');
                                        reject();
                                    },
                                },
                            );
                        });
                    }}
                />
            )}
            {viewing && <ArmBrandDetailModal slug={slug} brand={viewing} onClose={() => setViewing(null)} />}
            {deleting && (
                <ConfirmDialog
                    title="حذف برند"
                    message={
                        <>
                            برند «<b className="text-on-surface">{deleting.title}</b>» حذف شود؟
                            {((deleting._count?.products ?? 0) > 0 || (deleting._count?.ads ?? 0) > 0) && (
                                <> وصل‌شدگی <b className="text-error">{(deleting._count?.products ?? 0).toLocaleString('fa-IR')}</b> کالا و <b className="text-error">{(deleting._count?.ads ?? 0).toLocaleString('fa-IR')}</b> آگهی جدا می‌شود؛ آن‌ها حذف نمی‌شوند.</>
                            )}
                        </>
                    }
                    onCancel={() => setDeleting(null)}
                    onConfirm={() => {
                        deleteMut.mutate(deleting.id, {
                            onSuccess: () => {
                                toast.success('برند حذف شد');
                                setDeleting(null);
                            },
                            onError: (err: any) => toast.error(err?.message || 'خطا در حذف'),
                        });
                    }}
                    pending={deleteMut.isPending}
                />
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════
// ردیف مشترک لیست
// ══════════════════════════════════════════════════
function ReferenceRow({
    title, imageUrl, icon, confirmed, isActive, meta, onView, onEdit, onDelete,
}: {
    title: string;
    imageUrl?: string | null;
    icon: React.ReactNode;
    confirmed: boolean;
    isActive: boolean;
    meta: React.ReactNode;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-outline-variant/60 transition-colors">
            {imageUrl ? (
                <img src={imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-surface-container-high" />
            ) : (
                <span className="w-12 h-12 rounded-xl bg-surface-container-high grid place-items-center flex-shrink-0">{icon}</span>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-on-surface truncate">{title}</h3>
                    {confirmed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            <CheckCircle2 className="w-3 h-3" /> تأییدشده
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Clock className="w-3 h-3" /> در انتظار
                        </span>
                    )}
                    {!isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error">غیرفعال</span>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant flex-wrap">
                    {meta}
                </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={onView} title="جزئیات" className="w-9 h-9 grid place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
                    <Eye className="w-4 h-4" />
                </button>
                <button onClick={onEdit} title="ویرایش" className="w-9 h-9 grid place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors">
                    <Pencil className="w-4 h-4" />
                </button>
                <button onClick={onDelete} title="حذف" className="w-9 h-9 grid place-items-center rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════
// صفحه‌بند
// ══════════════════════════════════════════════════
function Pager({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
    return (
        <div className="flex items-center justify-center gap-1.5 pt-2">
            <button
                disabled={page <= 1}
                onClick={() => onChange(Math.max(1, page - 1))}
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
                        onClick={() => onChange(pn)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors ${
                            pn === page ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                    >
                        {pn.toLocaleString('fa-IR')}
                    </button>
                );
            })}
            <button
                disabled={page >= totalPages}
                onClick={() => onChange(Math.min(totalPages, page + 1))}
                className="w-9 h-9 grid place-items-center rounded-xl border border-outline-variant/40 text-on-surface-variant disabled:opacity-40 hover:bg-surface-container-high"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
        </div>
    );
}

// ══════════════════════════════════════════════════
// مودال ویرایش کالا (مالک بازار)
// ══════════════════════════════════════════════════
function ArmEditProductModal({
    product, onClose, onSave, saving,
}: {
    product: ProductReference;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    saving: boolean;
}) {
    const [title, setTitle] = useState(product.title);
    const [brand, setBrand] = useState<BrandValue | null>(
        product.brand ? { id: product.brand.id, title: product.brand.title } : null,
    );
    const [noBrand, setNoBrand] = useState(!product.brand);
    const [keywords, setKeywords] = useState((product.keywords || []).join('، '));
    const [imageUrl, setImageUrl] = useState(product.imageUrl || '');
    const [specs, setSpecs] = useState<Array<[string, string]>>(
        Object.entries(product.specs || {}) as Array<[string, string]>,
    );

    const submit = async () => {
        if (!title.trim()) {
            toast.error('عنوان کالا الزامی است');
            return;
        }
        const specObj: Record<string, string> = {};
        specs.forEach(([k, v]) => { if (k.trim() && v.trim()) specObj[k.trim()] = v.trim(); });
        await onSave({
            title: title.trim(),
            brandId: brand?.id || '',
            keywords: keywords.split(/[،,]/).map((x) => x.trim()).filter(Boolean),
            imageUrl,
            specs: specObj,
        });
    };

    return (
        <ModalShell title="ویرایش کالای مرجع" icon={<Package className="w-4 h-4 text-primary" />} onClose={onClose}>
            <div className="p-5 space-y-4">
                <LabeledInput label="عنوان کالا" value={title} onChange={setTitle} />
                <BrandPicker
                    value={brand}
                    onChange={(b) => { setBrand(b); if (b) setNoBrand(false); }}
                    mode={noBrand ? false : brand ? true : null}
                    onModeChange={(m) => { setNoBrand(m === false); if (m === false) setBrand(null); }}
                    label="برند"
                />
                <LabeledInput label="کلمات کلیدی (با «،» جدا کنید)" value={keywords} onChange={setKeywords} placeholder="تن ماهی، کنسرو ماهی" />
                <LabeledInput label="آدرس تصویر کالا" value={imageUrl} onChange={setImageUrl} ltr />

                {/* ویژگی‌ها */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-on-surface">ویژگی‌های کالا</label>
                        <button
                            type="button"
                            onClick={() => setSpecs((s) => [...s, ['', '']])}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                            <Plus className="w-3.5 h-3.5" /> افزودن
                        </button>
                    </div>
                    {specs.length === 0 ? (
                        <p className="text-xs text-on-surface-variant">مثلاً: وزن = ۲۵۰ گرم</p>
                    ) : (
                        <div className="space-y-2">
                            {specs.map(([k, v], i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        value={k}
                                        onChange={(e) => setSpecs((s) => s.map((row, j) => (j === i ? [e.target.value, row[1]] : row)))}
                                        placeholder="نام"
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
            </div>

            <ModalFooter
                onCancel={onClose}
                onSave={submit}
                saving={saving}
                saveLabel="ذخیرهٔ تغییرات"
            />
        </ModalShell>
    );
}

// ══════════════════════════════════════════════════
// مودال ویرایش برند (مالک بازار)
// ══════════════════════════════════════════════════
function ArmEditBrandModal({
    brand, onClose, onSave, saving,
}: {
    brand: BrandType;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    saving: boolean;
}) {
    const [title, setTitle] = useState(brand.title);
    const [keywords, setKeywords] = useState((brand.keywords || []).join('، '));
    const [logoUrl, setLogoUrl] = useState(brand.logoUrl || '');

    const submit = async () => {
        if (!title.trim()) {
            toast.error('نام برند الزامی است');
            return;
        }
        await onSave({
            title: title.trim(),
            keywords: keywords.split(/[،,]/).map((x) => x.trim()).filter(Boolean),
            logoUrl,
        });
    };

    return (
        <ModalShell title="ویرایش برند" icon={<Tag className="w-4 h-4 text-primary" />} onClose={onClose}>
            <div className="p-5 space-y-4">
                <LabeledInput label="نام برند" value={title} onChange={setTitle} />
                <LabeledInput label="کلمات کلیدی (با «،» جدا کنید)" value={keywords} onChange={setKeywords} />
                <LabeledInput label="آدرس لوگو" value={logoUrl} onChange={setLogoUrl} ltr />
            </div>
            <ModalFooter onCancel={onClose} onSave={submit} saving={saving} saveLabel="ذخیرهٔ تغییرات" />
        </ModalShell>
    );
}

// ══════════════════════════════════════════════════
// مودال جزئیات کالا (مالک بازار)
// ══════════════════════════════════════════════════
function ArmProductDetailModal({ slug, product, onClose }: { slug: string; product: ProductReference; onClose: () => void }) {
    const { currentSlug } = useSelector((s: RootState) => s.arm);
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [ads, setAds] = useState<AdRefItem[]>([]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const { apiService } = await import('@/lib/api/apiService');
                const [d, a] = await Promise.all([
                    apiService.armAdmin.references.getProduct(slug, product.id),
                    apiService.armAdmin.references.getProductAds(slug, product.id, { page: 1, limit: 10 }),
                ]);
                if (!alive) return;
                setDetail(d);
                setAds(a?.items || []);
            } catch {
                // اگر جزئیات لود نشد، از دادهٔ لیست استفاده می‌کنیم
                setDetail(product);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [slug, product.id]);

    return (
        <ModalShell title="جزئیات کالای مرجع" icon={<Package className="w-4 h-4 text-primary" />} onClose={onClose}>
            {loading ? (
                <div className="p-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
                <div className="p-5 space-y-4">
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
                            <p className="text-xs text-on-surface-variant mt-0.5">برند: {detail?.brand?.title || '—'}</p>
                        </div>
                    </div>

                    {detail?.creator && (
                        <div className="flex items-center gap-2 text-xs bg-surface-container-low rounded-xl px-3 py-2.5">
                            <User className="w-3.5 h-3.5 text-on-surface-variant" />
                            <span className="text-on-surface-variant">ثبت‌کننده:</span>
                            <b className="text-on-surface">{detail.creator.fullName || '—'}</b>
                            <span className="text-on-surface-variant">({detail.creator.phone})</span>
                        </div>
                    )}

                    {detail?.specs && Object.keys(detail.specs).length > 0 && (
                        <div>
                            <h4 className="text-xs font-black text-on-surface mb-2">ویژگی‌های کالا</h4>
                            <div className="grid grid-cols-2 gap-1.5">
                                {Object.entries(detail.specs).map(([k, v]) => (
                                    <div key={k} className="text-xs bg-surface-container-low rounded-lg px-2.5 py-1.5">
                                        <span className="text-on-surface-variant">{k}: </span>
                                        <span className="font-bold text-on-surface">{v as string}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-xs font-black text-on-surface mb-2">
                            آگهی‌های وصل در بازار شما ({(detail?._count?.ads ?? ads.length).toLocaleString('fa-IR')})
                        </h4>
                        {ads.length === 0 ? (
                            <p className="text-xs text-on-surface-variant">آگهی وصلی پیدا نشد</p>
                        ) : (
                            <div className="space-y-1.5">
                                {ads.map((ad) => (
                                    <div key={ad.id} className="flex items-center justify-between gap-2 text-xs bg-surface-container-low rounded-xl px-3 py-2.5">
                                        <span className="flex items-center gap-2 min-w-0">
                                            <Link2 className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
                                            <span className="font-bold text-on-surface truncate">{ad.title}</span>
                                        </span>
                                        <span className="flex-shrink-0 text-on-surface-variant">{formatPrice(ad.unitPrice)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </ModalShell>
    );
}

// ══════════════════════════════════════════════════
// مودال جزئیات برند (مالک بازار)
// ══════════════════════════════════════════════════
function ArmBrandDetailModal({ slug, brand, onClose }: { slug: string; brand: BrandType; onClose: () => void }) {
    const [detail, setDetail] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [ads, setAds] = useState<AdRefItem[]>([]);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                const { apiService } = await import('@/lib/api/apiService');
                const [d, a] = await Promise.all([
                    apiService.armAdmin.references.getBrand(slug, brand.id),
                    apiService.armAdmin.references.getBrandAds(slug, brand.id, { page: 1, limit: 10 }),
                ]);
                if (!alive) return;
                setDetail(d);
                setAds(a?.items || []);
            } catch {
                setDetail(brand);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [slug, brand.id]);

    return (
        <ModalShell title="جزئیات برند" icon={<Tag className="w-4 h-4 text-primary" />} onClose={onClose}>
            {loading ? (
                <div className="p-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        {detail?.logoUrl ? (
                            <img src={detail.logoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover bg-surface-container-high" />
                        ) : (
                            <span className="w-16 h-16 rounded-2xl bg-surface-container-high grid place-items-center">
                                <Tag className="w-6 h-6 text-on-surface-variant/50" />
                            </span>
                        )}
                        <div className="min-w-0">
                            <h4 className="text-sm font-black text-on-surface truncate">{detail?.title}</h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">{detail?.category || 'بدون دسته'}</p>
                        </div>
                    </div>

                    {detail?.creator && (
                        <div className="flex items-center gap-2 text-xs bg-surface-container-low rounded-xl px-3 py-2.5">
                            <User className="w-3.5 h-3.5 text-on-surface-variant" />
                            <span className="text-on-surface-variant">ثبت‌کننده:</span>
                            <b className="text-on-surface">{detail.creator.fullName || '—'}</b>
                            <span className="text-on-surface-variant">({detail.creator.phone})</span>
                        </div>
                    )}

                    <div>
                        <h4 className="text-xs font-black text-on-surface mb-2">
                            آگهی‌های وصل در بازار شما ({(detail?._count?.ads ?? ads.length).toLocaleString('fa-IR')})
                        </h4>
                        {ads.length === 0 ? (
                            <p className="text-xs text-on-surface-variant">آگهی وصلی پیدا نشد</p>
                        ) : (
                            <div className="space-y-1.5">
                                {ads.map((ad) => (
                                    <div key={ad.id} className="flex items-center justify-between gap-2 text-xs bg-surface-container-low rounded-xl px-3 py-2.5">
                                        <span className="flex items-center gap-2 min-w-0">
                                            <Link2 className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
                                            <span className="font-bold text-on-surface truncate">{ad.title}</span>
                                        </span>
                                        <span className="flex-shrink-0 text-on-surface-variant">{formatPrice(ad.unitPrice)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </ModalShell>
    );
}

// ══════════════════════════════════════════════════
// اتم‌های مشترک
// ══════════════════════════════════════════════════
function ModalShell({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div
                className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-surface flex items-center justify-between px-5 py-4 border-b border-outline-variant/30 z-10">
                    <h3 className="text-base font-black text-on-surface flex items-center gap-2">{icon} {title}</h3>
                    <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function ModalFooter({ onCancel, onSave, saving, saveLabel }: {
    onCancel: () => void; onSave: () => void; saving: boolean; saveLabel: string;
}) {
    return (
        <div className="sticky bottom-0 bg-surface px-5 py-4 border-t border-outline-variant/30 flex gap-2">
            <button onClick={onCancel} className="flex-1 h-11 rounded-xl border border-outline-variant/50 text-sm font-bold text-on-surface">
                انصراف
            </button>
            <button
                onClick={onSave}
                disabled={saving}
                className="flex-[2] h-11 rounded-xl bg-primary text-on-primary text-sm font-black flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saveLabel}
            </button>
        </div>
    );
}

function LabeledInput({ label, value, onChange, placeholder, ltr }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; ltr?: boolean;
}) {
    return (
        <div>
            <label className="text-xs font-bold text-on-surface block mb-1.5">{label}</label>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                dir={ltr ? 'ltr' : undefined}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
        </div>
    );
}

function ConfirmDialog({ title, message, onCancel, onConfirm, pending }: {
    title: string; message: React.ReactNode; onCancel: () => void; onConfirm: () => void; pending: boolean;
}) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCancel}>
            <div className="bg-surface w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-base font-black text-on-surface">{title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="flex-1 h-10 rounded-xl border border-outline-variant/50 text-sm font-bold text-on-surface">
                        انصراف
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={pending}
                        className="flex-1 h-10 rounded-xl bg-error text-on-error text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                        حذف
                    </button>
                </div>
            </div>
        </div>
    );
}
