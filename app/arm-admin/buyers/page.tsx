'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    useArmBuyers, useArmBuyerCandidates,
    useAddBuyer, useRemoveBuyer, useToggleBuyerPaused,
} from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    ShoppingCart, Search, X, PauseCircle, PlayCircle, Trash2, Loader2,
    Plus, Building2, MapPin, ExternalLink, User, Phone, ArrowUpDown,
    Package, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import DivarFilterBar, { FilterValue } from '@/app/components/DivarFilterBar';

const fmt = (n: number | undefined) => n?.toLocaleString('fa-IR') ?? '۰';

// ═══ ستون‌های جدول دسکتاپ ═══
const COLUMNS = [
    { key: 'name', label: 'نام کسب‌وکار', sortable: true, minWidth: '180px' },
    { key: 'owner', label: 'صاحب', sortable: false, minWidth: '140px' },
    { key: 'industry', label: 'صنف', sortable: false, minWidth: '120px' },
    { key: 'location', label: 'استان/شهر', sortable: false, minWidth: '120px' },
    { key: 'type', label: 'نوع', sortable: false, minWidth: '80px' },
    { key: 'actions', label: 'عملیات', sortable: false, minWidth: '120px', align: 'center' as const },
];

export default function BuyersPage() {
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);

    if (!currentSlug) {
        return <div className="text-center py-16 text-sm text-on-surface-variant">ابتدا بازار را انتخاب کنید</div>;
    }

    return <BuyersContent slug={currentSlug} armName={currentArm?.name || currentSlug} />;
}

function BuyersContent({ slug, armName }: { slug: string; armName: string }) {
    const [searchInput, setSearchInput] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterValue>({});
    const [sortBy, setSortBy] = useState('joinedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const buyersQ = useArmBuyers(slug, {
        search: searchInput || undefined,
        industry: filter.industry || undefined,
        cityCode: filter.cityCode || undefined,
        provinceCode: filter.provinceCode || undefined,
        sortBy,
        sortOrder,
    });
    const pauseMut = useToggleBuyerPaused(slug);
    const removeMut = useRemoveBuyer(slug);

    const buyers: any[] = buyersQ.data?.items ?? [];
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
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        خریداران {armName}
                    </h1>
                    <p className="text-xs text-on-surface-variant mt-1">
                        کسب‌وکارهایی که حق دیدن قیمت‌های بازار را دارند
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="h-10 px-4 rounded-xl bg-primary text-on-primary text-sm font-bold flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" /> افزودن خریدار
                </button>
            </div>

            {/* ─── جستجو + فیلترها ─── */}
            <div className="space-y-2">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="جستجوی نام، شماره، شهر…"
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

                <DivarFilterBar value={filter} onChange={setFilter} />
            </div>

            {/* ─── آمار ─── */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-outline-variant/30 p-3 text-center">
                    <p className="text-xl font-black text-on-surface">{fmt(buyers.length)}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">کل خریداران</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-outline-variant/30 p-3 text-center">
                    <p className="text-xl font-black text-emerald-600">{fmt(buyers.filter(b => b.businessStatus !== 'paused').length)}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">فعال</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-outline-variant/30 p-3 text-center">
                    <p className="text-xl font-black text-amber-600">{fmt(buyers.filter(b => b.businessStatus === 'paused').length)}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">متوقف</p>
                </div>
            </div>

            {/* ─── لیست خریداران ─── */}
            {buyersQ.isPending ? (
                <div className="space-y-3">
                    {[0, 1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-surface-container-high/50 animate-pulse" />)}
                </div>
            ) : buyers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant/50 p-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-3" />
                    <h4 className="text-sm font-extrabold text-on-surface">
                        {hasActiveFilters ? 'خریداری با این فیلترها پیدا نشد' : 'هنوز خریداری نداری'}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm mx-auto leading-6">
                        {hasActiveFilters
                            ? 'فیلترها را عوض کن یا پاک کن'
                            : 'سوپرمارکت‌ها، فروشگاه‌ها و کسب‌وکارهای مرتبط را اضافه کن'}
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
                                {buyers.map((b) => {
                                    const isPaused = b.businessStatus === 'paused';
                                    const busyPause = pauseMut.isPending && pauseMut.variables?.membershipId === b.membershipId;
                                    const busyRemove = removeMut.isPending && removeMut.variables === b.membershipId;
                                    const confirming = confirmRemoveId === b.membershipId;

                                    return (
                                        <tr
                                            key={b.membershipId}
                                            className={cn(
                                                'border-b border-outline-variant/15 transition-colors hover:bg-surface-container-low/30',
                                                isPaused && 'opacity-50 bg-surface-container-low/20',
                                            )}
                                        >
                                            {/* نام کسب‌وکار */}
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {b.business?.logoUrl ? (
                                                            <img src={b.business.logoUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Building2 className="w-4 h-4 text-on-surface-variant/50" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-on-surface truncate">
                                                            {b.business?.name || 'بدون کسب‌وکار'}
                                                        </p>
                                                        {b.business?.hasCatalog && b.business?.catalogName && (
                                                            <Link
                                                                href={`/${b.business.catalogSlug || '#'}`}
                                                                target="_blank"
                                                                className="text-[9px] text-primary flex items-center gap-0.5 hover:underline"
                                                            >
                                                                {b.business.catalogName} <ExternalLink className="w-2.5 h-2.5" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* صاحب */}
                                            <td className="px-3 py-2.5">
                                                <div className="text-[11px] text-on-surface truncate">
                                                    {b.user?.fullName || '—'}
                                                </div>
                                                {b.user?.phone && (
                                                    <div className="text-[9px] text-on-surface-variant/60" dir="ltr">{b.user.phone}</div>
                                                )}
                                            </td>
                                            {/* صنف */}
                                            <td className="px-3 py-2.5">
                                                {b.business?.industryName ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                        {b.business.industryName}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-on-surface-variant/40">—</span>
                                                )}
                                            </td>
                                            {/* استان/شهر */}
                                            <td className="px-3 py-2.5">
                                                <div className="text-[11px] text-on-surface flex items-center gap-1">
                                                    <MapPin className="w-3 h-3 text-on-surface-variant/40 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium">{b.business?.province || '—'}</div>
                                                        {b.business?.city && (
                                                            <div className="text-[9px] text-on-surface-variant/60 truncate">{b.business.city}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* نوع */}
                                            <td className="px-3 py-2.5">
                                                <span className="text-[10px] text-on-surface-variant">
                                                    {b.business?.type || '—'}
                                                </span>
                                            </td>
                                            {/* عملیات */}
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {confirming ? (
                                                        <>
                                                            <button
                                                                onClick={() => removeMut.mutate(b.membershipId, { onSuccess: () => setConfirmRemoveId(null) })}
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
                                                                onClick={() => pauseMut.mutate({ membershipId: b.membershipId, paused: !isPaused })}
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
                                                                onClick={() => setConfirmRemoveId(b.membershipId)}
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
                        {buyers.map((b) => {
                            const isPaused = b.businessStatus === 'paused';
                            const busyPause = pauseMut.isPending && pauseMut.variables?.membershipId === b.membershipId;
                            const busyRemove = removeMut.isPending && removeMut.variables === b.membershipId;
                            const confirming = confirmRemoveId === b.membershipId;

                            return (
                                <div
                                    key={b.membershipId}
                                    className={cn(
                                        'bg-white dark:bg-gray-900 rounded-2xl border p-3.5 transition-all',
                                        isPaused
                                            ? 'border-outline-variant/20 opacity-60 bg-surface-container-low/30'
                                            : 'border-outline-variant/40 hover:shadow-md',
                                    )}
                                >
                                    <div className="flex items-start gap-3 mb-2.5">
                                        <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {b.business?.logoUrl ? (
                                                <img src={b.business.logoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Building2 className="w-5 h-5 text-on-surface-variant/50" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="text-sm font-extrabold text-on-surface truncate">
                                                    {b.business?.name || 'بدون کسب‌وکار'}
                                                </p>
                                                {isPaused && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                        متوقف
                                                    </span>
                                                )}
                                            </div>
                                            {b.business?.hasCatalog && b.business?.catalogName && (
                                                <Link
                                                    href={`/${b.business.catalogSlug || '#'}`}
                                                    target="_blank"
                                                    className="text-[10px] text-primary flex items-center gap-0.5 hover:underline mt-0.5"
                                                >
                                                    {b.business.catalogName} <ExternalLink className="w-2.5 h-2.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
                                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                                            <User className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{b.user?.fullName || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                                            <Phone className="w-3 h-3 flex-shrink-0" />
                                            <span dir="ltr" className="truncate">{b.user?.phone || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                                            <Building2 className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{b.business?.industryName || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">
                                                {[b.business?.province, b.business?.city].filter(Boolean).join('، ') || '—'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end pt-2.5 border-t border-outline-variant/15">
                                        <div className="flex items-center gap-1.5">
                                            {confirming ? (
                                                <>
                                                    <button
                                                        onClick={() => removeMut.mutate(b.membershipId, { onSuccess: () => setConfirmRemoveId(null) })}
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
                                                        onClick={() => pauseMut.mutate({ membershipId: b.membershipId, paused: !isPaused })}
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
                                                        onClick={() => setConfirmRemoveId(b.membershipId)}
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

            {/* ─── مدال افزودن خریدار ─── */}
            {showAddModal && (
                <AddBuyerModal slug={slug} onClose={() => setShowAddModal(false)} />
            )}
        </div>
    );
}

// ═══ مدال افزودن خریدار — با جدول دسکتاپ و کارت موبایل ═══
function AddBuyerModal({ slug, onClose }: { slug: string; onClose: () => void }) {
    const [qInput, setQInput] = useState('');
    const [filter, setFilter] = useState<FilterValue>({});

    const candidatesQ = useArmBuyerCandidates(slug, qInput.trim(), false, true, {
        industry: filter.industry || undefined,
        cityCode: filter.cityCode || undefined,
        provinceCode: filter.provinceCode || undefined,
    });
    const addMut = useAddBuyer(slug);

    const candidates: any[] = candidatesQ.data?.items ?? [];
    const hasActiveFilters = !!(qInput || filter.provinceCode || filter.cityCode || filter.industry);

    return (
        <div
            className="fixed inset-0 z-[95] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full sm:max-w-3xl rounded-t-3xl sm:rounded-2xl shadow-2xl
                    min-h-[60dvh] max-h-[92dvh] flex flex-col overflow-hidden
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            >
                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <ShoppingCart className="w-4.5 h-4.5 text-primary" />
                        </span>
                        <h3 className="text-sm font-extrabold text-on-surface">افزودن خریدار به بازار</h3>
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
                            placeholder="جستجوی نام، شماره، صاحب کسب‌وکار…"
                            className="w-full h-10 pr-9 pl-8 rounded-xl bg-surface-container-lowest border border-outline-variant/40
                                dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        {qInput && (
                            <button onClick={() => setQInput('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <DivarFilterBar value={filter} onChange={setFilter} />
                </div>

                {/* لیست کاندیداها */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    {candidatesQ.isFetching ? (
                        <div className="p-4 space-y-2">
                            {[0, 1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-surface-container-high/50 animate-pulse" />)}
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-2" />
                            <p className="text-xs text-on-surface-variant">
                                {hasActiveFilters ? 'کسب‌وکاری با این فیلترها پیدا نشد' : 'برای جستجو تایپ کنید'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* جدول دسکتاپ */}
                            <table className="hidden md:table w-full text-sm">
                                <thead className="sticky top-0 bg-surface z-10">
                                    <tr className="border-b border-outline-variant/30 bg-surface-container-low/40">
                                        <th className="px-3 py-2 text-right text-[10px] font-bold text-on-surface-variant uppercase">کسب‌وکار</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-bold text-on-surface-variant uppercase">صاحب</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-bold text-on-surface-variant uppercase">صنف</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-bold text-on-surface-variant uppercase">استان/شهر</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-bold text-on-surface-variant uppercase">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidates.map((b) => {
                                        const busy = addMut.isPending && addMut.variables === b.id;
                                        return (
                                            <tr key={b.id} className="border-b border-outline-variant/15 hover:bg-surface-container-low/30 transition-colors">
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {b.logoUrl ? (
                                                                <img src={b.logoUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Building2 className="w-4 h-4 text-on-surface-variant/50" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-on-surface truncate">{b.name}</p>
                                                            {b.type && (
                                                                <span className="text-[9px] text-on-surface-variant/60">{b.type}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="text-[11px] text-on-surface truncate">{b.owner?.fullName || '—'}</div>
                                                    {b.owner?.phone && <div className="text-[9px] text-on-surface-variant/60" dir="ltr">{b.owner.phone}</div>}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {b.industryName ? (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                            {b.industryName}
                                                        </span>
                                                    ) : <span className="text-[10px] text-on-surface-variant/40">—</span>}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="text-[11px] text-on-surface flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-on-surface-variant/40 flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <div className="truncate font-medium">{b.province || '—'}</div>
                                                            {b.city && (
                                                                <div className="text-[9px] text-on-surface-variant/60 truncate">{b.city}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <button
                                                        onClick={() => addMut.mutate(b.id, { onSuccess: () => { toast.success('خریدار اضافه شد'); onClose(); } })}
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
                                {candidates.map((b) => {
                                    const busy = addMut.isPending && addMut.variables === b.id;
                                    return (
                                        <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/30 hover:border-primary/30 transition-colors">
                                            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {b.logoUrl ? (
                                                    <img src={b.logoUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Building2 className="w-4 h-4 text-on-surface-variant/50" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-on-surface truncate">{b.name}</p>
                                                <p className="text-[10px] text-on-surface-variant/70 truncate">
                                                    {[b.owner?.fullName, b.province, b.city, b.industryName].filter(Boolean).join(' · ')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => addMut.mutate(b.id, { onSuccess: () => { toast.success('خریدار اضافه شد'); onClose(); } })}
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
