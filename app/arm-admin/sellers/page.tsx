'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    useArmSellers, useArmSellerCandidates,
    useAddSeller, useToggleSellerPaused, useRemoveSeller,
    useArmNeedsCategory, armMemberKeys,
} from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    Store, Search, X, Eye, PauseCircle, PlayCircle, Trash2, Loader2,
    Plus, AlertTriangle, Package, ChevronLeft, Link as LinkIcon,
    Filter, MapPin, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import IndustryAutocomplete from '@/app/components/IndustryAutocomplete';
import CityAutocomplete from '@/app/components/CityAutocomplete';

// ═══ هلپرها ═══
const fmt = (n: number | undefined) => n?.toLocaleString('fa-IR') ?? '۰';

function RowSkeleton() {
    return <div className="h-20 rounded-xl bg-surface-container-high/50 animate-pulse" />;
}

// ═══ کامپوننت فیلتر مشترک ═══
function FilterBar({
    searchInput, setSearchInput,
    industryFilter, setIndustryFilter,
    cityFilter, setCityFilter,
    hasActiveFilters, onClearAll,
}: {
    searchInput: string;
    setSearchInput: (v: string) => void;
    industryFilter: { id: string | null; title: string };
    setIndustryFilter: (v: { id: string | null; title: string }) => void;
    cityFilter: { id: string | null; title: string; cityCode?: string; provinceCode?: string };
    setCityFilter: (v: any) => void;
    hasActiveFilters: boolean;
    onClearAll: () => void;
}) {
    return (
        <div className="space-y-2">
            {/* ردیف اول: جستجوی متنی */}
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

            {/* ردیف دوم: فیلتر صنف + شهر */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                    <Building2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/40 pointer-events-none z-10" />
                    <IndustryAutocomplete
                        value={industryFilter}
                        onChange={setIndustryFilter}
                        placeholder="همه اصناف..."
                        allowCreate={false}
                        className="!h-10 !pr-8"
                    />
                </div>
                <div className="relative">
                    <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/40 pointer-events-none z-10" />
                    <CityAutocomplete
                        value={cityFilter}
                        onChange={setCityFilter}
                        placeholder="همه شهرها..."
                        className="!h-10 !pr-8"
                    />
                </div>
            </div>

            {/* دکمه پاک کردن همه فیلترها */}
            {hasActiveFilters && (
                <button
                    onClick={onClearAll}
                    className="flex items-center gap-1 text-[10px] font-bold text-error/70 hover:text-error transition-colors"
                >
                    <X className="w-3 h-3" />
                    پاک کردن همه فیلترها
                </button>
            )}
        </div>
    );
}

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
    const [industryFilter, setIndustryFilter] = useState<{ id: string | null; title: string }>({ id: null, title: '' });
    const [cityFilter, setCityFilter] = useState<{ id: string | null; title: string; cityCode?: string; provinceCode?: string }>({ id: null, title: '' });

    const hasActiveFilters = !!(searchInput || industryFilter.title || cityFilter.title);

    const sellersQ = useArmSellers(slug, {
        search: searchInput || undefined,
        industry: industryFilter.title || undefined,
        cityCode: cityFilter.cityCode || undefined,
        provinceCode: cityFilter.provinceCode || undefined,
    });
    const pauseMut = useToggleSellerPaused(slug);
    const removeMut = useRemoveSeller(slug);

    const sellers: any[] = sellersQ.data?.items ?? [];

    const clearAllFilters = () => {
        setSearchInput('');
        setIndustryFilter({ id: null, title: '' });
        setCityFilter({ id: null, title: '' });
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
                    <p className="text-xs text-on-surface-variant mt-1">
                        کاتالوگ‌هایی که روی تابلوی قیمت این بازار می‌فروشند
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="h-10 px-4 rounded-xl bg-primary text-on-primary text-sm font-bold flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" /> افزودن فروشنده
                </button>
            </div>

            {/* ─── فیلترها ─── */}
            <FilterBar
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                industryFilter={industryFilter}
                setIndustryFilter={setIndustryFilter}
                cityFilter={cityFilter}
                setCityFilter={setCityFilter}
                hasActiveFilters={hasActiveFilters}
                onClearAll={clearAllFilters}
            />

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
                    {[0, 1, 2].map(i => <RowSkeleton key={i} />)}
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
                <div className="space-y-2.5">
                    {sellers.map((s) => {
                        const isPaused = s.businessStatus === 'paused';
                        const busyPause = pauseMut.isPending && pauseMut.variables?.catalogId === s.catalog.id;
                        const busyRemove = removeMut.isPending && removeMut.variables === s.catalog.id;
                        const confirming = confirmRemoveId === s.membershipId;

                        return (
                            <div
                                key={s.membershipId}
                                className={cn(
                                    'bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-all',
                                    isPaused
                                        ? 'border-outline-variant/20 opacity-50 bg-surface-container-low/30'
                                        : 'border-outline-variant/40 hover:shadow-md',
                                )}
                            >
                                <div className="flex items-start gap-3.5">
                                    {/* لوگو */}
                                    <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {s.catalog.logoUrl ? (
                                            <img src={s.catalog.logoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="w-5 h-5 text-on-surface-variant/50" />
                                        )}
                                    </div>

                                    {/* اطلاعات */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link
                                                href={`/${s.catalog.slug}`}
                                                target="_blank"
                                                className="text-sm font-extrabold text-on-surface hover:text-primary transition-colors truncate"
                                            >
                                                {s.catalog.name}
                                            </Link>
                                            {s.catalog.businessName && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                                                    {s.catalog.businessName}
                                                </span>
                                            )}
                                            {s.catalog.businessIndustry && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                                    {s.catalog.businessIndustry}
                                                </span>
                                            )}
                                            {isPaused && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                    متوقف
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-on-surface-variant/70 mt-1.5 flex-wrap">
                                            <span className="flex items-center gap-0.5">
                                                <Package className="w-3 h-3" />
                                                {fmt(s.activeOnTable)} کالا روی تابلو
                                            </span>
                                            {s.needsCategory > 0 && (
                                                <span className="flex items-center gap-0.5 text-amber-600">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {fmt(s.needsCategory)} بدون دسته
                                                </span>
                                            )}
                                            {s.catalog.city && (
                                                <span className="flex items-center gap-0.5">
                                                    <MapPin className="w-3 h-3" />
                                                    {s.catalog.city}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* اکشن‌ها */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {confirming ? (
                                            <>
                                                <button
                                                    onClick={() => removeMut.mutate(s.catalog.id, { onSuccess: () => setConfirmRemoveId(null) })}
                                                    disabled={busyRemove}
                                                    className="h-8 px-3 rounded-lg bg-error text-white text-[10px] font-bold inline-flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {busyRemove ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                    تایید حذف
                                                </button>
                                                <button onClick={() => setConfirmRemoveId(null)}
                                                    className="h-8 w-8 rounded-lg border border-outline-variant/50 grid place-items-center text-on-surface-variant">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => pauseMut.mutate({ catalogId: s.catalog.id, paused: !isPaused })}
                                                    disabled={busyPause}
                                                    title={isPaused ? 'فعال‌سازی مجدد فروشنده' : 'توقف موقت فروشنده'}
                                                    className={cn(
                                                        'h-9 w-9 rounded-lg grid place-items-center transition-colors',
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
                                                    title="حذف نقش فروشندگی"
                                                    className="h-9 w-9 rounded-lg text-error/60 hover:text-error hover:bg-error/10 grid place-items-center transition-colors"
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
            )}

            {/* ─── مدال افزودن فروشنده ─── */}
            {showAddModal && (
                <AddSellerModal
                    slug={slug}
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </div>
    );
}

// ═══ مدال افزودن فروشنده ═══
function AddSellerModal({ slug, onClose }: { slug: string; onClose: () => void }) {
    const [qInput, setQInput] = useState('');
    const [onlyMine, setOnlyMine] = useState(false);
    const [industryFilter, setIndustryFilter] = useState<{ id: string | null; title: string }>({ id: null, title: '' });
    const [cityFilter, setCityFilter] = useState<{ id: string | null; title: string; cityCode?: string; provinceCode?: string }>({ id: null, title: '' });

    const candidatesQ = useArmSellerCandidates(slug, qInput.trim(), onlyMine, true, {
        industry: industryFilter.title || undefined,
        cityCode: cityFilter.cityCode || undefined,
        provinceCode: cityFilter.provinceCode || undefined,
    });
    const addMut = useAddSeller(slug);

    const candidates: any[] = candidatesQ.data?.items ?? [];
    const hasActiveFilters = !!(qInput || industryFilter.title || cityFilter.title);

    return (
        <div
            className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl
                    max-h-[90dvh] flex flex-col overflow-hidden
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            >
                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Store className="w-4.5 h-4.5 text-primary" />
                        </span>
                        <h3 className="text-sm font-extrabold text-on-surface">افزودن فروشنده</h3>
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
                            className="w-full h-11 pr-9 pl-8 rounded-xl bg-surface-container-lowest border border-outline-variant/40
                                dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        {qInput && (
                            <button onClick={() => setQInput('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-on-surface-variant block mb-1">صنف</label>
                            <IndustryAutocomplete
                                value={industryFilter}
                                onChange={setIndustryFilter}
                                placeholder="همه اصناف..."
                                allowCreate={false}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-on-surface-variant block mb-1">شهر</label>
                            <CityAutocomplete
                                value={cityFilter}
                                onChange={(v) => setCityFilter({ ...v, cityCode: (v as any).cityCode, provinceCode: (v as any).provinceCode })}
                                placeholder="همه شهرها..."
                            />
                        </div>
                    </div>
                </div>

                {/* لیست کاندیداها */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-3">
                    {candidatesQ.isFetching ? (
                        <div className="space-y-2">
                            {[0, 1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-surface-container-high/50 animate-pulse" />)}
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="text-center py-10">
                            <Search className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-2" />
                            <p className="text-xs text-on-surface-variant">
                                {hasActiveFilters ? 'کاتالوگی با این فیلترها پیدا نشد' : 'برای جستجو تایپ کنید'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {candidates.map((c) => {
                                const busy = addMut.isPending && addMut.variables === c.id;
                                return (
                                    <div
                                        key={c.id}
                                        className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/30 hover:border-primary/30 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {c.logoUrl ? (
                                                <img src={c.logoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Store className="w-4 h-4 text-on-surface-variant/50" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-on-surface truncate">{c.name}</p>
                                            <p className="text-[10px] text-on-surface-variant/70 truncate">
                                                {[c.owner?.fullName, c.city, c.industryName || c.businessIndustry].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => addMut.mutate(c.id, { onSuccess: () => onClose() })}
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
                    )}
                </div>
            </div>
        </div>
    );
}
