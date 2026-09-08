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
    Plus, Building2, MapPin, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import IndustryAutocomplete from '@/app/components/IndustryAutocomplete';
import CityAutocomplete from '@/app/components/CityAutocomplete';

const fmt = (n: number | undefined) => n?.toLocaleString('fa-IR') ?? '۰';

function RowSkeleton() {
    return <div className="h-20 rounded-xl bg-surface-container-high/50 animate-pulse" />;
}

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

    const buyersQ = useArmBuyers(slug, { search: searchInput || undefined });
    const pauseMut = useToggleBuyerPaused(slug);
    const removeMut = useRemoveBuyer(slug);

    const buyers: any[] = buyersQ.data?.items ?? [];

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
                        کسب‌وکارهایی که حق دیدن قیمت‌های این بازار را دارند
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="h-10 px-4 rounded-xl bg-primary text-on-primary text-sm font-bold flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" /> افزودن خریدار
                </button>
            </div>

            {/* ─── جستجو ─── */}
            <div className="relative max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="جستجوی کسب‌وکار، صنف، شهر…"
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
                    {[0, 1, 2].map(i => <RowSkeleton key={i} />)}
                </div>
            ) : buyers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant/50 p-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-3" />
                    <h4 className="text-sm font-extrabold text-on-surface">هنوز خریداری نداری</h4>
                    <p className="text-xs text-on-surface-variant mt-1.5 max-w-sm mx-auto leading-6">
                        سوپرمارکت‌ها، فروشگاه‌ها و کسب‌وکارهای مرتبط را اضافه کن تا تابلوی تو را هر روز ببینند
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {buyers.map((b) => {
                        const isPaused = b.businessStatus === 'paused';
                        const busyPause = pauseMut.isPending && pauseMut.variables?.membershipId === b.membershipId;
                        const busyRemove = removeMut.isPending && removeMut.variables === b.membershipId;
                        const confirming = confirmRemoveId === b.membershipId;

                        return (
                            <div
                                key={b.membershipId}
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
                                        {b.business?.logoUrl ? (
                                            <img src={b.business.logoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 className="w-5 h-5 text-on-surface-variant/50" />
                                        )}
                                    </div>

                                    {/* اطلاعات */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-extrabold text-on-surface truncate">
                                                {b.business?.name || 'بدون کسب‌وکار'}
                                            </p>
                                            {b.business?.type && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                                                    {b.business.type}
                                                </span>
                                            )}
                                            {isPaused && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                    متوقف
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-on-surface-variant/70 mt-1.5 flex-wrap">
                                            {b.business?.industryName && <span>{b.business.industryName}</span>}
                                            {b.business?.city && (
                                                <span className="flex items-center gap-0.5">
                                                    <MapPin className="w-3 h-3" />{b.business.city}
                                                </span>
                                            )}
                                            {b.user?.fullName && <span>{b.user.fullName}</span>}
                                            {b.user?.phone && <span dir="ltr">{b.user.phone}</span>}
                                        </div>
                                    </div>

                                    {/* اکشن‌ها */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {confirming ? (
                                            <>
                                                <button
                                                    onClick={() => removeMut.mutate(b.membershipId, { onSuccess: () => setConfirmRemoveId(null) })}
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
                                                {/* Pause/Resume */}
                                                <button
                                                    onClick={() => pauseMut.mutate({ membershipId: b.membershipId, paused: !isPaused })}
                                                    disabled={busyPause}
                                                    title={isPaused ? 'فعال‌سازی مجدد خریدار' : 'توقف موقت خریدار'}
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
                                                {/* Remove */}
                                                <button
                                                    onClick={() => setConfirmRemoveId(b.membershipId)}
                                                    title="حذف از خریداران"
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

            {/* ─── مدال افزودن خریدار ─── */}
            {showAddModal && (
                <AddBuyerModal slug={slug} onClose={() => setShowAddModal(false)} />
            )}
        </div>
    );
}

// ═══ مدال افزودن خریدار ═══
function AddBuyerModal({ slug, onClose }: { slug: string; onClose: () => void }) {
    const [qInput, setQInput] = useState('');
    const [onlyMine, setOnlyMine] = useState(false);
    const [industryFilter, setIndustryFilter] = useState<{ id: string | null; title: string }>({ id: null, title: '' });
    const [cityFilter, setCityFilter] = useState<{ id: string | null; title: string; cityCode?: string; provinceCode?: string }>({ id: null, title: '' });

    const candidatesQ = useArmBuyerCandidates(slug, qInput.trim(), onlyMine, true, {
        industry: industryFilter.title || undefined,
        cityCode: cityFilter.cityCode || undefined,
        provinceCode: cityFilter.provinceCode || undefined,
    });
    const addMut = useAddBuyer(slug);

    const candidates: any[] = candidatesQ.data?.items ?? [];

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
                            <ShoppingCart className="w-4.5 h-4.5 text-primary" />
                        </span>
                        <h3 className="text-sm font-extrabold text-on-surface">افزودن خریدار</h3>
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
                                className="h-9"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-on-surface-variant block mb-1">شهر</label>
                            <CityAutocomplete
                                value={cityFilter}
                                onChange={(v) => setCityFilter({ ...v, cityCode: (v as any).cityCode, provinceCode: (v as any).provinceCode })}
                                placeholder="همه شهرها..."
                                className="h-9"
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
                                {qInput || industryFilter.title || cityFilter.title ? 'کسب‌وکاری پیدا نشد' : 'برای جستجو تایپ کنید'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {candidates.map((b) => {
                                const busy = addMut.isPending && addMut.variables === b.id;
                                return (
                                    <div
                                        key={b.id}
                                        className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-lowest/60 border border-outline-variant/30 hover:border-primary/30 transition-colors"
                                    >
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
                                                {[b.industryName, b.type, b.city, b.owner?.fullName].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => addMut.mutate(b.id, { onSuccess: () => onClose() })}
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
