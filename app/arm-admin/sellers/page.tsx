'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    useArmSellers, useArmSellerCandidates,
    useAddSeller, useToggleSellerPaused, useRemoveSeller,
} from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    Store, Search, X, Eye, PauseCircle, PlayCircle, Trash2, Loader2,
    Plus, AlertTriangle, Package, ExternalLink, MapPin, Building2, User, Phone,
    ChevronLeft, ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import LocationIndustryFilter, { FilterValue } from '@/app/components/LocationIndustryFilter';

// ═══ هلپرها ═══
const fmt = (n: number | undefined) => n?.toLocaleString('fa-IR') ?? '۰';

// ═══ ستون‌های جدول دسکتاپ ═══
const COLUMNS = [
    { key: 'name', label: 'نام کاتالوگ', sortable: true, minWidth: '180px' },
    { key: 'owner', label: 'صاحب کاتالوگ', sortable: false, minWidth: '140px' },
    { key: 'industry', label: 'صنف', sortable: false, minWidth: '120px' },
    { key: 'location', label: 'استان/شهر', sortable: false, minWidth: '120px' },
    { key: 'table', label: 'کالا', sortable: true, minWidth: '70px', align: 'center' as const },
    { key: 'actions', label: 'عملیات', sortable: false, minWidth: '120px', align: 'center' as const },
];

export default function SellersPage() {
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);

    if (!currentSlug) {
        return <div className="text-center py-16 text-sm text-on-surface-variant">ابتدا بازار را انتخاب کنید</div>;
    }

    return <SellersContent slug={currentSlug} armName={currentArm?.name || currentSlug} />;
}

function SellersContent({ slug, armName }: { slug: string; armName: string }) {
    const [searchInput, setSearchInput] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterValue>({});
    const [sortBy, setSortBy] = useState('joinedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const sellersQ = useArmSellers(slug, {
        search: searchInput || undefined,
        industry: filter.industry || undefined,
        cityCode: filter.cityCode || undefined,
        provinceCode: filter.provinceCode || undefined,
        sortBy,
        sortOrder,
    });
    const pauseMut = useToggleSellerPaused(slug);
    const removeMut = useRemoveSeller(slug);

    const sellers: any[] = sellersQ.data?.items ?? [];
    const hasActiveFilters = !!(searchInput || filter.provinceCode || filter.cityCode || filter.industry);

    const toggleSort = (col: string) => {
        if (sortBy === col) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(col);
            setSortOrder('desc');
        }
    };

    return (
        <div className="space-y-5">
            {/* ─── هدر ─── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-black text-on-surface flex items-center gap-2">
                        <Store className="w-5 h-5 text-primary" />
                        فروشندگان {armName}
                    </h1>

                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="h-10 px-2 rounded-xl bg-primary text-[14px] text-on-primary text-sm font-bold flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" /> افزودن فروشنده
                </button>
            </div>

            {/* ─── جستجو + فیلترها ─── */}
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="جستجوی نام کاتالوگ، صاحب، شماره…"
                        className="w-full h-10 pr-9 pl-8 rounded-xl bg-surface-container-lowest border border-outline-variant/40
                            dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    {searchInput && (
                        <button onClick={() => setSearchInput('')}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <LocationIndustryFilter value={filter} onChange={setFilter} />
            </div>

            {/* ─── آمار ─── */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-outline-variant/30 p-3 text-center">
                    <p className="text-xl font-black text-on-surface">{fmt(sellers.length)}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">کل فروشندگان</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-outline-variant/30 p-3 text-center">
                    <p className="text-xl font-black text-emerald-600">{fmt(sellers.filter(s => s.businessStatus !== 'paused').length)}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">فعال</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-outline-variant/30 p-3 text-center">
                    <p className="text-xl font-black text-amber-600">{fmt(sellers.filter(s => s.businessStatus === 'paused').length)}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">متوقف</p>
                </div>
            </div>

            {/* ─── لیست فروشندگان ─── */}
            {sellersQ.isPending ? (
                <div className="space-y-3">
                    {[0, 1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-surface-container-high/50 animate-pulse" />)}
                </div>
            ) : sellers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant/50 p-12 text-center">
                    <Store className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-3" />
                    <h4 className="text-sm font-extrabold text-on-surface">
                        {hasActiveFilters ? 'فروشنده‌ای با این فیلترها پیدا نشد' : 'هنوز فروشنده‌ای نداری'}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm mx-auto leading-6">
                        {hasActiveFilters
                            ? 'فیلترها را عوض کن یا پاک کن'
                            : 'کاتالوگ‌های فروشنده را از دکمه «افزودن فروشنده» اضافه کن'}
                    </p>
                </div>
            ) : (
                <>
                    {/* ═══ جدول دسکتاپ ═══ */}
                    <div className="hidden lg:block overflow-x-auto rounded-2xl border border-outline-variant/30 bg-white dark:bg-gray-900">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-outline-variant/30 bg-surface-container-low/40">
                                    {COLUMNS.map((col) => (
                                        <th
                                            key={col.key}
                                            className={cn(
                                                'px-3 py-2.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wide whitespace-nowrap',
                                                col.align === 'center' ? 'text-center' : 'text-right',
                                            )}
                                            style={{ minWidth: col.minWidth }}
                                        >
                                            {col.sortable ? (
                                                <button
                                                    onClick={() => toggleSort(col.key)}
                                                    className={cn(
                                                        'inline-flex items-center gap-1 hover:text-primary transition-colors',
                                                        sortBy === col.key && 'text-primary',
                                                    )}
                                                >
                                                    {col.label}
                                                    <ArrowUpDown className={cn('w-3 h-3', sortBy === col.key && sortOrder === 'asc' && 'rotate-180')} />
                                                </button>
                                            ) : col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sellers.map((s) => {
                                    const isPaused = s.businessStatus === 'paused';
                                    const busyPause = pauseMut.isPending && pauseMut.variables?.catalogId === s.catalog.id;
                                    const busyRemove = removeMut.isPending && removeMut.variables === s.catalog.id;
                                    const confirming = confirmRemoveId === s.membershipId;

                                    return (
                                        <tr
                                            key={s.membershipId}
                                            className={cn(
                                                'border-b border-outline-variant/15 transition-colors hover:bg-surface-container-low/30',
                                                isPaused && 'opacity-50 bg-surface-container-low/20',
                                            )}
                                        >
                                            {/* نام کاتالوگ */}
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {s.catalog.logoUrl ? (
                                                            <img src={s.catalog.logoUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Store className="w-4 h-4 text-on-surface-variant/50" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/${s.catalog.slug}`}
                                                            target="_blank"
                                                            className="text-xs font-bold text-on-surface hover:text-primary transition-colors truncate block"
                                                        >
                                                            {s.catalog.name}
                                                        </Link>
                                                        {s.catalog.businessName && (
                                                            <span className="text-[9px] text-on-surface-variant/60">{s.catalog.businessName}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* صاحب کاتالوگ */}
                                            <td className="px-3 py-2.5">
                                                <div className="text-[11px] text-on-surface truncate">
                                                    {s.catalog.owner?.fullName || '—'}
                                                </div>
                                                {s.catalog.owner?.phone && (
                                                    <div className="text-[9px] text-on-surface-variant/60" dir="ltr">{s.catalog.owner.phone}</div>
                                                )}
                                            </td>
                                            {/* صنف */}
                                            <td className="px-3 py-2.5">
                                                {s.catalog.businessIndustry ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                        {s.catalog.businessIndustry}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-on-surface-variant/40">—</span>
                                                )}
                                            </td>
                                            {/* استان/شهر */}
                                            <td className="px-3 py-2.5">
                                                <div className="text-[11px] text-on-surface flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-on-surface-variant/40" />
                                                    {s.catalog.city || '—'}
                                                </div>
                                            </td>
                                            {/* کالا */}
                                            <td className="px-3 py-2.5 text-center">
                                                <div className="text-xs font-bold text-on-surface">{fmt(s.activeOnTable)}</div>
                                                {s.needsCategory > 0 && (
                                                    <div className="text-[9px] text-amber-600 flex items-center justify-center gap-0.5 mt-0.5">
                                                        <AlertTriangle className="w-2.5 h-2.5" />
                                                        {fmt(s.needsCategory)}
                                                    </div>
                                                )}
                                            </td>
                                            {/* عملیات */}
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {confirming ? (
                                                        <>
                                                            <button
                                                                onClick={() => removeMut.mutate(s.catalog.id, { onSuccess: () => setConfirmRemoveId(null) })}
                                                                disabled={busyRemove}
                                                                className="h-7 px-2 rounded-lg bg-error text-white text-[9px] font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                                            >
                                                                {busyRemove ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                                تایید
                                                            </button>
                                                            <button onClick={() => setConfirmRemoveId(null)}
                                                                className="h-7 w-7 rounded-lg border border-outline-variant/50 grid place-items-center text-on-surface-variant">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => pauseMut.mutate({ catalogId: s.catalog.id, paused: !isPaused })}
                                                                disabled={busyPause}
                                                                title={isPaused ? 'فعال‌سازی' : 'توقف موقت'}
                                                                className={cn(
                                                                    'h-8 w-8 rounded-lg grid place-items-center transition-colors',
                                                                    isPaused
                                                                        ? 'text-emerald-600 hover:bg-emerald-500/10'
                                                                        : 'text-amber-600 hover:bg-amber-500/10',
                                                                )}
                                                            >
                                                                {busyPause ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                                                    isPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmRemoveId(s.membershipId)}
                                                                title="حذف"
                                                                className="h-8 w-8 rounded-lg text-error/60 hover:text-error hover:bg-error/10 grid place-items-center transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* ═══ کارت موبایل ═══ */}
                    <div className="lg:hidden space-y-2.5">
                        {sellers.map((s) => {
                            const isPaused = s.businessStatus === 'paused';
                            const busyPause = pauseMut.isPending && pauseMut.variables?.catalogId === s.catalog.id;
                            const busyRemove = removeMut.isPending && removeMut.variables === s.catalog.id;
                            const confirming = confirmRemoveId === s.membershipId;

                            return (
                                <div
                                    key={s.membershipId}
                                    className={cn(
                                        'bg-white dark:bg-gray-900 rounded-2xl border p-3.5 transition-all',
                                        isPaused
                                            ? 'border-outline-variant/20 opacity-60 bg-surface-container-low/30'
                                            : 'border-outline-variant/40 hover:shadow-md',
                                    )}
                                >
                                    {/* ردیف اول: لوگو + نام + لینک */}
                                    <div className="flex items-start gap-3 mb-2.5">
                                        <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {s.catalog.logoUrl ? (
                                                <img src={s.catalog.logoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Store className="w-5 h-5 text-on-surface-variant/50" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <Link
                                                    href={`/${s.catalog.slug}`}
                                                    target="_blank"
                                                    className="text-sm font-extrabold text-on-surface hover:text-primary transition-colors truncate flex items-center gap-1"
                                                >
                                                    {s.catalog.name}
                                                    <ExternalLink className="w-3 h-3 opacity-50" />
                                                </Link>
                                                {isPaused && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                        متوقف
                                                    </span>
                                                )}
                                            </div>
                                            {s.catalog.businessName && (
                                                <p className="text-[10px] text-on-surface-variant/70 truncate mt-0.5">{s.catalog.businessName}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* ردیف دوم: اطلاعات متمایز با آیکون */}
                                    <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
                                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                                            <User className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{s.catalog.owner?.fullName || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                                            <Phone className="w-3 h-3 flex-shrink-0" />
                                            <span dir="ltr" className="truncate">{s.catalog.owner?.phone || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                                            <Building2 className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{s.catalog.businessIndustry || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{s.catalog.city || '—'}</span>
                                        </div>
                                    </div>

                                    {/* ردیف سوم: آمار + اکشن‌ها */}
                                    <div className="flex items-center justify-between pt-2.5 border-t border-outline-variant/15">
                                        <div className="flex items-center gap-3 text-[10px]">
                                            <span className="flex items-center gap-1 text-on-surface-variant">
                                                <Package className="w-3 h-3" />
                                                <strong className="text-on-surface">{fmt(s.activeOnTable)}</strong> کالا
                                            </span>
                                            {s.needsCategory > 0 && (
                                                <span className="flex items-center gap-0.5 text-amber-600">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {fmt(s.needsCategory)} بدون دسته
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {confirming ? (
                                                <>
                                                    <button
                                                        onClick={() => removeMut.mutate(s.catalog.id, { onSuccess: () => setConfirmRemoveId(null) })}
                                                        disabled={busyRemove}
                                                        className="h-7 px-2 rounded-lg bg-error text-white text-[9px] font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                                    >
                                                        {busyRemove ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                        تایید
                                                    </button>
                                                    <button onClick={() => setConfirmRemoveId(null)}
                                                        className="h-7 w-7 rounded-lg border border-outline-variant/50 grid place-items-center text-on-surface-variant">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => pauseMut.mutate({ catalogId: s.catalog.id, paused: !isPaused })}
                                                        disabled={busyPause}
                                                        title={isPaused ? 'فعال‌سازی' : 'توقف موقت'}
                                                        className={cn(
                                                            'h-8 w-8 rounded-lg grid place-items-center transition-colors',
                                                            isPaused
                                                                ? 'text-emerald-600 hover:bg-emerald-500/10'
                                                                : 'text-amber-600 hover:bg-amber-500/10',
                                                        )}
                                                    >
                                                        {busyPause ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                            isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmRemoveId(s.membershipId)}
                                                        title="حذف"
                                                        className="h-8 w-8 rounded-lg text-error/60 hover:text-error hover:bg-error/10 grid place-items-center transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ─── مدال افزودن فروشنده ─── */}
            {showAddModal && (
                <AddSellerModal slug={slug} onClose={() => setShowAddModal(false)} />
            )}
        </div>
    );
}

// ═══ مدال افزودن فروشنده — با جدول دسکتاپ و کارت موبایل ═══
function AddSellerModal({ slug, onClose }: { slug: string; onClose: () => void }) {
    const [qInput, setQInput] = useState('');
    const [filter, setFilter] = useState<FilterValue>({});

    const candidatesQ = useArmSellerCandidates(slug, qInput.trim(), false, true, {
        industry: filter.industry || undefined,
        cityCode: filter.cityCode || undefined,
        provinceCode: filter.provinceCode || undefined,
    });
    const addMut = useAddSeller(slug);

    const candidates: any[] = candidatesQ.data?.items ?? [];
    const hasActiveFilters = !!(qInput || filter.provinceCode || filter.cityCode || filter.industry);

    return (
        <div
            className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full sm:max-w-3xl rounded-t-3xl sm:rounded-2xl shadow-2xl
                    max-h-[92dvh] flex flex-col overflow-hidden
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            >
                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Store className="w-4.5 h-4.5 text-primary" />
                        </span>
                        <h3 className="text-sm font-extrabold text-on-surface">افزودن فروشنده به بازار</h3>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* فیلترها */}
                <div className="flex-shrink-0 px-4 py-3 border-b border-outline-variant/20 space-y-2">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                        <input
                            value={qInput}
                            onChange={(e) => setQInput(e.target.value)}
                            placeholder="جستجوی نام، شماره، صاحب کاتالوگ…"
                            className="w-full h-10 pr-9 pl-8 rounded-xl bg-surface-container-lowest border border-outline-variant/40
                                dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        {qInput && (
                            <button onClick={() => setQInput('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <LocationIndustryFilter value={filter} onChange={setFilter} />
                </div>

                {/* لیست کاندیداها */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim">
                    {candidatesQ.isFetching ? (
                        <div className="p-4 space-y-2">
                            {[0, 1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-surface-container-high/50 animate-pulse" />)}
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-2" />
                            <p className="text-xs text-on-surface-variant">
                                {hasActiveFilters ? 'کاتالوگی با این فیلترها پیدا نشد' : 'برای جستجو تایپ کنید'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* جدول دسکتاپ */}
                            <table className="hidden md:table w-full text-sm">
                                <thead className="sticky top-0 bg-surface z-10">
                                    <tr className="border-b border-outline-variant/30 bg-surface-container-low/40">
                                        <th className="px-3 py-2 text-right text-[10px] font-bold text-on-surface-variant uppercase">کاتالوگ</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-bold text-on-surface-variant uppercase">صاحب</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-bold text-on-surface-variant uppercase">صنف</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-bold text-on-surface-variant uppercase">شهر</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-bold text-on-surface-variant uppercase">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidates.map((c) => {
                                        const busy = addMut.isPending && addMut.variables === c.id;
                                        return (
                                            <tr key={c.id} className="border-b border-outline-variant/15 hover:bg-surface-container-low/30 transition-colors">
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {c.logoUrl ? (
                                                                <img src={c.logoUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Store className="w-4 h-4 text-on-surface-variant/50" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-on-surface truncate">{c.name}</p>
                                                            {c.slug && (
                                                                <Link href={`/${c.slug}`} target="_blank" className="text-[9px] text-primary flex items-center gap-0.5 hover:underline">
                                                                    مشاهده کاتالوگ <ExternalLink className="w-2.5 h-2.5" />
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="text-[11px] text-on-surface truncate">{c.owner?.fullName || '—'}</div>
                                                    {c.owner?.phone && <div className="text-[9px] text-on-surface-variant/60" dir="ltr">{c.owner.phone}</div>}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {(c.industryName || c.businessIndustry) ? (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                            {c.industryName || c.businessIndustry}
                                                        </span>
                                                    ) : <span className="text-[10px] text-on-surface-variant/40">—</span>}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <span className="text-[11px] text-on-surface flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-on-surface-variant/40" />
                                                        {c.city || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <button
                                                        onClick={() => addMut.mutate(c.id, { onSuccess: () => { toast.success('فروشنده اضافه شد'); onClose(); } })}
                                                        disabled={busy}
                                                        className="h-8 px-3 rounded-lg bg-primary text-on-primary text-[10px] font-bold inline-flex items-center gap-1 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                                                    >
                                                        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                                        افزودن
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* کارت موبایل */}
                            <div className="md:hidden p-3 space-y-2">
                                {candidates.map((c) => {
                                    const busy = addMut.isPending && addMut.variables === c.id;
                                    return (
                                        <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/30 hover:border-primary/30 transition-colors">
                                            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {c.logoUrl ? (
                                                    <img src={c.logoUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Store className="w-4 h-4 text-on-surface-variant/50" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                    <p className="text-xs font-bold text-on-surface truncate">{c.name}</p>
                                                    {c.slug && (
                                                        <Link href={`/${c.slug}`} target="_blank" className="text-primary flex-shrink-0">
                                                            <ExternalLink className="w-3 h-3" />
                                                        </Link>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-on-surface-variant/70 truncate">
                                                    {[c.owner?.fullName, c.city, c.industryName || c.businessIndustry].filter(Boolean).join(' · ')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => addMut.mutate(c.id, { onSuccess: () => { toast.success('فروشنده اضافه شد'); onClose(); } })}
                                                disabled={busy}
                                                className="h-8 px-3 rounded-lg bg-primary text-on-primary text-[10px] font-bold inline-flex items-center gap-1 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
                                            >
                                                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                                افزودن
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
