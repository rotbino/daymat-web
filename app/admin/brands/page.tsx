// app/admin/brands/page.tsx
// ✅ مدیریت برندها — پنل ادمین سیستم
// نظارت بر برندهایی که کاربران ثبت می‌کنند: ویرایش، حذف، تأیید،
// مشاهدهٔ کالاهای مرجع و آگهی‌های وصل به هر برند
'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
    Tag, Search, Pencil, Trash2, Eye, Loader2, ChevronRight, ChevronLeft,
    X, ImageOff, Store, User, Link2, Package, CheckCircle2, Clock,
} from 'lucide-react';
import {
    useAdminBrands, useAdminBrand, useUpdateAdminBrand, useDeleteAdminBrand,
} from '@/lib/api/apiHooks';
import { Brand, ProductReference, AdRefItem } from '@/lib/api/apiTypes';

const PAGE_SIZE = 20;

const formatPrice = (p?: number | null) =>
    p == null ? '—' : `${p.toLocaleString('fa-IR')} تومان`;

export default function AdminBrandsPage() {
    const [searchInput, setSearchInput] = useState('');
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortBy, setSortBy] = useState<'createdAt' | 'usageCount'>('createdAt');
    const [page, setPage] = useState(1);

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

    const listQ = useAdminBrands(params);
    const updateMut = useUpdateAdminBrand();
    const deleteMut = useDeleteAdminBrand();

    const items: Brand[] = listQ.data?.items ?? [];
    const total: number = listQ.data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const [editing, setEditing] = useState<Brand | null>(null);
    const [viewing, setViewing] = useState<Brand | null>(null);
    const [deleting, setDeleting] = useState<Brand | null>(null);

    const confirmDelete = async () => {
        if (!deleting) return;
        deleteMut.mutate(deleting.id, {
            onSuccess: (res: any) => {
                const dAds = res?.detachedAds ?? 0;
                const dProds = res?.detachedProducts ?? 0;
                toast.success(`برند «${deleting.title}» حذف شد${dAds + dProds > 0 ? ` — ${dProds.toLocaleString('fa-IR')} کالا و ${dAds.toLocaleString('fa-IR')} آگهی جدا شد` : ''}`);
                setDeleting(null);
            },
            onError: (err: any) => toast.error(err?.message || 'خطا در حذف برند'),
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
                            placeholder="جستجوی نام برند یا کلمهٔ کلیدی…"
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
                    <>مجموع: <b className="text-on-surface">{total.toLocaleString('fa-IR')}</b> برند</>
                )}
            </div>

            {/* ─── لیست ─── */}
            {listQ.isPending ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-surface-container-low animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="border-2 border-dashed border-outline-variant/40 rounded-3xl p-10 text-center text-on-surface-variant text-sm">
                    برندی با این فیلترها پیدا نشد
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((b) => (
                        <div
                            key={b.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:border-outline-variant/60 transition-colors"
                        >
                            {/* لوگو */}
                            {b.logoUrl ? (
                                <img src={b.logoUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-surface-container-high" />
                            ) : (
                                <span className="w-12 h-12 rounded-xl bg-surface-container-high grid place-items-center flex-shrink-0">
                                    <Tag className="w-5 h-5 text-on-surface-variant/50" />
                                </span>
                            )}

                            {/* اطلاعات */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-bold text-on-surface truncate">{b.title}</h3>
                                    {b.confirmed ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                            <CheckCircle2 className="w-3 h-3" /> تأییدشده
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <Clock className="w-3 h-3" /> در انتظار
                                        </span>
                                    )}
                                    {!b.isActive && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error">غیرفعال</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant flex-wrap">
                                    <span>کالای مرجع: <b className="text-on-surface">{(b._count?.products ?? 0).toLocaleString('fa-IR')}</b></span>
                                    <span>آگهی: <b className="text-on-surface">{(b._count?.ads ?? 0).toLocaleString('fa-IR')}</b></span>
                                    {b.creator && (
                                        <span className="inline-flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {b.creator.fullName || '—'} ({b.creator.phone})
                                        </span>
                                    )}
                                    {b.arm && (
                                        <span className="inline-flex items-center gap-1">
                                            <Store className="w-3 h-3" />
                                            {b.arm.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* عملیات */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    onClick={() => setViewing(b)}
                                    title="جزئیات"
                                    className="w-9 h-9 grid place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setEditing(b)}
                                    title="ویرایش"
                                    className="w-9 h-9 grid place-items-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleting(b)}
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
                <EditBrandModal
                    brand={editing}
                    onClose={() => setEditing(null)}
                    onSave={async (data) => {
                        await new Promise<void>((resolve, reject) => {
                            updateMut.mutate(
                                { id: editing.id, data },
                                {
                                    onSuccess: () => {
                                        toast.success('برند با موفقیت ویرایش شد');
                                        setEditing(null);
                                        resolve();
                                    },
                                    onError: (err: any) => {
                                        toast.error(err?.message || 'خطا در ویرایش برند');
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
            {viewing && <BrandDetailModal brand={viewing} onClose={() => setViewing(null)} />}

            {/* ─── تأیید حذف ─── */}
            {deleting && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDeleting(null)}>
                    <div
                        className="bg-surface w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-5 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-black text-on-surface">حذف برند</h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                            برند «<b className="text-on-surface">{deleting.title}</b>» حذف شود؟
                            {((deleting._count?.products ?? 0) > 0 || (deleting._count?.ads ?? 0) > 0) && (
                                <> وصل‌شدگی <b className="text-error">{(deleting._count?.products ?? 0).toLocaleString('fa-IR')}</b> کالای مرجع و <b className="text-error">{(deleting._count?.ads ?? 0).toLocaleString('fa-IR')}</b> آگهی به‌صورت خودکار جدا می‌شود؛ آن‌ها حذف نمی‌شوند.</>
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
// مودال ویرایش برند
// ══════════════════════════════════════════════════
function EditBrandModal({
    brand, onClose, onSave, saving,
}: {
    brand: Brand;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    saving: boolean;
}) {
    const [title, setTitle] = useState(brand.title);
    const [category, setCategory] = useState(brand.category || '');
    const [keywords, setKeywords] = useState((brand.keywords || []).join('، '));
    const [logoUrl, setLogoUrl] = useState(brand.logoUrl || '');
    const [description, setDescription] = useState(brand.description || '');
    const [isActive, setIsActive] = useState(brand.isActive);
    const [confirmed, setConfirmed] = useState(brand.confirmed);

    const submit = async () => {
        if (!title.trim()) {
            toast.error('عنوان برند الزامی است');
            return;
        }
        const splitList = (s: string) => s.split(/[،,]/).map((x) => x.trim()).filter(Boolean);
        await onSave({
            title: title.trim(),
            category,
            keywords: splitList(keywords),
            logoUrl,
            description,
            isActive,
            confirmed,
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div
                className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-surface flex items-center justify-between px-5 py-4 border-b border-outline-variant/30 z-10">
                    <h3 className="text-base font-black text-on-surface flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" /> ویرایش برند
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-on-surface block mb-1.5">نام برند</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-on-surface block mb-1.5">دستهٔ برند</label>
                        <input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="مثلاً: مواد غذایی، شوینده"
                            className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-on-surface block mb-1.5">کلمات کلیدی (با «،» جدا کنید)</label>
                        <input
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-on-surface block mb-1.5">آدرس لوگو</label>
                        <input
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            dir="ltr"
                            className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-on-surface block mb-1.5">توضیحات</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <ToggleRow label="فعال (در سرچ دیده شود)" checked={isActive} onChange={setIsActive} />
                        <ToggleRow label="تأیید ادمین" checked={confirmed} onChange={setConfirmed} />
                    </div>
                </div>

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
// مودال جزئیات برند — کالاهای مرجع و آگهی‌های وصل
// ══════════════════════════════════════════════════
function BrandDetailModal({ brand, onClose }: { brand: Brand; onClose: () => void }) {
    const detailQ = useAdminBrand(brand.id);
    const detail = detailQ.data;
    const recentProducts: ProductReference[] = detail?.recentProducts ?? [];
    const recentAds: AdRefItem[] = detail?.recentAds ?? [];

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div
                className="bg-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-surface flex items-center justify-between px-5 py-4 border-b border-outline-variant/30 z-10">
                    <h3 className="text-base font-black text-on-surface flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" /> جزئیات برند
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container-high">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {detailQ.isPending ? (
                    <div className="p-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                    <div className="p-5 space-y-4">
                        {/* هویت برند */}
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
                            <Badge active={detail?.isByUser} ok="کاربر-ساخته" no="سیستمی" />
                        </div>

                        {/* کالاهای مرجع وصل */}
                        <Section title={`کالاهای مرجع وصل (${(detail?._count?.products ?? 0).toLocaleString('fa-IR')})`}>
                            {recentProducts.length === 0 ? (
                                <p className="text-xs text-on-surface-variant">هیچ کالای مرجعی به این برند وصل نیست</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {recentProducts.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between gap-2 text-xs bg-surface-container-low rounded-xl px-3 py-2.5">
                                            <span className="flex items-center gap-2 min-w-0">
                                                <Package className="w-3.5 h-3.5 text-on-surface-variant flex-shrink-0" />
                                                <span className="font-bold text-on-surface truncate">{p.title}</span>
                                            </span>
                                            <span className="flex-shrink-0 text-on-surface-variant">{p.usageCount.toLocaleString('fa-IR')} آگهی</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>

                        {/* آگهی‌های وصل */}
                        <Section title={`آگهی‌های وصل (${(detail?._count?.ads ?? 0).toLocaleString('fa-IR')}) — ۱۰ مورد اخیر`}>
                            {recentAds.length === 0 ? (
                                <p className="text-xs text-on-surface-variant">هنوز هیچ آگهی به این برند وصل نیست</p>
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
