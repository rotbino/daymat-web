// app/arm-admin/members/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useQueryClient } from '@tanstack/react-query';
import {
    Store, Search, X, Eye, PauseCircle, PlayCircle, Trash2, Loader2,
    Package, Phone, MapPin, CheckCircle2, AlertTriangle, Users,
    Sparkles, ArrowLeft, Building2, Info, UserPlus, Layers,
    ShoppingCart, User as UserIcon, Plus, RefreshCw,
    LibraryBig,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CategoryPicker from '@/app/ad/components/CategoryPicker';
import { toast } from 'sonner';
import {
    useArmSellers, useArmSellerCandidates, useArmBuyers, useArmBuyerCandidates,
    useAddSeller, useToggleSellerPaused, useRemoveSeller,
    useAddBuyer, useRemoveBuyer, useToggleBuyerPaused, useSetAdMarketCategoryAdmin,
    useArmNeedsCategory, armMemberKeys,
} from '@/lib/api/apiHooks';

// ═══ هلپرها ═══
const fmt = (n?: number | null) => (n ?? 0).toLocaleString('fa-IR');
const salesLabel = (s: string) =>
    s === 'retail' ? 'فروش خرده' : s === 'service' ? 'فروش خدمات' : 'فروش عمده';
const salesCls = (s: string) =>
    s === 'retail'
        ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
        : s === 'service'
            ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';

function useDebounced<T>(value: T, delay = 400): T {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}

function Logo({ url, size = 44, fallback: FallbackIcon = Store }: { url?: string | null; size?: number; fallback?: any }) {
    const [broken, setBroken] = useState(false);
    if (!url || broken) {
        return (
            <div style={{ width: size, height: size }}
                 className="rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0 overflow-hidden">
                <FallbackIcon className="w-1/2 h-1/2 text-on-surface-variant/40" />
            </div>
        );
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" style={{ width: size, height: size }}
             onError={() => setBroken(true)}
             className="rounded-xl object-cover flex-shrink-0 border border-outline-variant/30" />
    );
}

function RowSkeleton({ h = 96 }: { h?: number }) {
    return <div style={{ height: h }} className="rounded-2xl bg-surface-container-high/50 animate-pulse" />;
}

// ═══════════════════════════════════════════
// صفحهٔ اعضای بازار — فروشندگان / خریداران
// ═══════════════════════════════════════════
export default function ArmAdminMembersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);

    const initialTab = searchParams.get('tab') === 'buyers' ? 'buyers' : 'sellers';
    const [tab, setTab] = useState<'sellers' | 'buyers'>(initialTab as any);

    const changeTab = (t: 'sellers' | 'buyers') => {
        setTab(t);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', t);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    if (!currentSlug) {
        return <div className="text-center py-16 text-sm text-on-surface-variant">ابتدا بازار را انتخاب کنید</div>;
    }

    return (
        <div className="space-y-5">
            {/* ─── هدر ─── */}
            <div>
                <h1 className=" font-bold text-on-surface"> فروشندگان و خریدارانِ تابلوی {currentArm?.name || currentSlug}</h1>
                <p className="text-sm text-on-surface-variant mt-0.5 p-2">
                   شما بعنوان مالک بازار و با توجه به صنف کسب و کار، تعیین می کنید چه کسی فروشنده و چه کسی خریدار بازار باشد.
                </p>
            </div>

            {/* ─── دو دنیا ─── */}
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => changeTab('sellers')}
                        className={cn(
                            'rounded-2xl border p-4 text-right transition-all',
                            tab === 'sellers'
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                : 'border-outline-variant/40 bg-white dark:bg-gray-900 hover:border-primary/30',
                        )}>
                    <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-2',
                        tab === 'sellers' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant')}>
                        <Store className="w-5 h-5" />
                    </span>
                    <span className="block text-sm font-extrabold text-on-surface">فروشندگان بازار</span>
                    <span className="block text-[10px] text-on-surface-variant/70 mt-0.5 leading-4">
                        کاتالوگ‌هایی که روی تابلوی قیمت می‌فروشند
                    </span>
                </button>
                <button onClick={() => changeTab('buyers')}
                        className={cn(
                            'rounded-2xl border p-4 text-right transition-all',
                            tab === 'buyers'
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                : 'border-outline-variant/40 bg-white dark:bg-gray-900 hover:border-primary/30',
                        )}>
                    <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-2',
                        tab === 'buyers' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant')}>
                        <ShoppingCart className="w-5 h-5" />
                    </span>
                    <span className="block text-sm font-extrabold text-on-surface">خریداران بازار</span>
                    <span className="block text-[10px] text-on-surface-variant/70 mt-0.5 leading-4">
                        کسب‌وکارهایی که مشتریِ تابلوی قیمت‌اند
                    </span>
                </button>
            </div>

            {tab === 'sellers' ? <SellersTab slug={currentSlug} /> : <BuyersTab slug={currentSlug} />}
        </div>
    );
}

// ═══════════════════════════════════════════
// تب فروشندگان
// ═══════════════════════════════════════════
function SellersTab({ slug }: { slug: string }) {
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { currentArm } = useSelector((s: RootState) => s.arm);

    const [qInput, setQInput] = useState('');
    const [onlyMine, setOnlyMine] = useState(false);
    const q = useDebounced(qInput.trim(), 400);

    const sellersQ = useArmSellers(slug, {});
    const candidatesQ = useArmSellerCandidates(slug, q, onlyMine, true);
    const needsQ = useArmNeedsCategory(slug, true);

    const addMut = useAddSeller(slug);
    const pauseMut = useToggleSellerPaused(slug);
    const removeMut = useRemoveSeller(slug);
    const assignMut = useSetAdMarketCategoryAdmin(slug);

    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [addResult, setAddResult] = useState<{ name: string; stamped: number; needs: number } | null>(null);

    const sellers: any[] = sellersQ.data?.items ?? [];
    const candidates: any[] = candidatesQ.data?.items ?? [];
    const needs: any[] = needsQ.data?.items ?? [];
    const categoryTree = useMemo<any[]>(() => (currentArm as any)?.categoryTree || [], [currentArm]);

    const totals = useMemo(() => ({
        total: sellers.length,
        active: sellers.filter((s) => s.status === 'active').length,
        onTable: sellers.reduce((sum, s) => sum + (s.activeOnTable || 0), 0),
        needs: sellers.reduce((sum, s) => sum + (s.needsCategory || 0), 0),
    }), [sellers]);

    const handleAdd = (c: any) => {
        addMut.mutate(c.id, {
            onSuccess: (res: any) => {
                setAddResult({ name: c.name, stamped: res?.stamped ?? 0, needs: res?.needsCategory?.length ?? 0 });
                toast.success(res?.message || 'به بازار اضافه شد');
            },
        });
    };

    const handleAssign = (item: any, categoryId: string) => {
        if (!categoryId) return;
        assignMut.mutate(
            { adId: item.id, categoryId },
            {
                onSuccess: () => {
                    queryClient.setQueryData(armMemberKeys.needs(slug), (old: any) => ({
                        items: (old?.items ?? []).filter((n: any) => n.id !== item.id),
                    }));
                },
            },
        );
    };

    return (
        <div className="space-y-4">
            {/* ─── آمار ─── */}
            <div className="grid grid-cols-4 gap-2">
                {[
                    { label: 'فروشنده', value: totals.total, cls: 'text-primary' },
                    { label: 'فعال', value: totals.active, cls: 'text-emerald-600' },
                    { label: 'روی تابلو', value: totals.onTable, cls: 'text-emerald-600' },
                    { label: 'بی‌دسته', value: totals.needs, cls: 'text-amber-600' },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-outline-variant/40 p-2.5 text-center">
                        <p className={cn('text-lg font-extrabold', s.cls)}>{fmt(s.value)}</p>
                        <p className="text-[9px] text-on-surface-variant/70">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ─── جعبهٔ افزودن فروشنده — زنده ─── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-primary/25 overflow-hidden">
                <div className="px-4 pt-3.5 pb-2 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-extrabold text-on-surface">افزودن محصولات کاتالوگ به بازار</h3>
                    <span className="flex-1" />
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <button type="button" role="switch" aria-checked={onlyMine}
                                onClick={() => setOnlyMine((v) => !v)}
                                className={cn('relative w-8 h-4.5 rounded-full transition-colors',
                                    onlyMine ? 'bg-primary' : 'bg-outline-variant/50')}>
                            <span className={cn('absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all',
                                onlyMine ? 'right-0.5' : 'right-[1.125rem]')} />
                        </button>
                        <span className="text-[10px] font-bold text-on-surface-variant">جذب‌شده‌های من</span>
                    </label>
                </div>
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                        <input
                            value={qInput}
                            onChange={(e) => setQInput(e.target.value)}
                            placeholder="جستجوی کاتالوگ، کسب‌وکار، مالک…"
                            className="w-full h-10 pr-9 pl-8 rounded-xl bg-surface-container-lowest border border-outline-variant/40
                                dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        {qInput && (
                            <button onClick={() => setQInput('')}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* نتایج زنده */}
                {candidatesQ.isFetching && q ? (
                    <div className="px-4 pb-3"><RowSkeleton h={64} /></div>
                ) : candidates.length > 0 ? (
                    <div className="px-3 pb-3 space-y-1.5 max-h-72 overflow-y-auto scrollbar-slim">
                        {candidates.map((c) => {
                            const busy = addMut.isPending && addMut.variables === c.id;
                            return (
                                <div key={c.id}
                                     className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-lowest/60
                                         border border-outline-variant/30 hover:border-primary/30 transition-colors">
                                    <Logo url={c.logoUrl} size={38} fallback={LibraryBig} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-extrabold text-on-surface truncate">{c.name}</p>
                                        <p className="text-[10px] text-on-surface-variant/70 truncate">
                                            {[
                                                c.businessName,
                                                c.industryName,
                                                c.owner?.fullName,
                                                `${fmt(c._count?.ads)} کالا`,
                                            ].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0', salesCls(c.salesType))}>
                                        {salesLabel(c.salesType)}
                                    </span>
                                    <button onClick={() => handleAdd(c)} disabled={busy}
                                            className="h-8 px-3 rounded-lg bg-primary text-on-primary text-[10px] font-extrabold
                                                inline-flex items-center gap-1 hover:bg-primary/90 active:scale-95 transition-all
                                                disabled:opacity-50 flex-shrink-0">
                                        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                        افزودن
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : q || onlyMine ? (
                    <p className="text-xs text-on-surface-variant/70 text-center pb-4">
                        کاتالوگی با این مشخصات پیدا نشد
                    </p>
                ) : null}
            </div>

            {/* ─── نتیجهٔ آخرین افزودن ─── */}
            {addResult && (
                <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50/70 dark:bg-emerald-900/15 dark:border-emerald-800/50 p-4">
                    <div className="flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-emerald-500 grid place-items-center flex-shrink-0">
                            <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                                محصولات «{addResult.name}» به بازار اضافه شد
                            </p>
                            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                                {fmt(addResult.stamped)} کالا منتشر شد
                                {addResult.needs > 0 && ` — ${fmt(addResult.needs)} کالا نیاز به تعیین دسته دارد`}
                            </p>
                        </div>
                        <button onClick={() => setAddResult(null)}
                                className="w-7 h-7 rounded-lg text-emerald-600/60 hover:bg-emerald-500/10 grid place-items-center">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ─── هشدار بی‌دسته ─── */}
            {needs.length > 0 && (
                <button onClick={() => {}}
                        className="w-full bg-amber-50/70 dark:bg-amber-900/10 border border-amber-300/50 dark:border-amber-800/50
                        rounded-2xl p-3.5 flex items-center gap-3 text-right">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span className="flex-1 text-xs font-extrabold text-amber-800 dark:text-amber-300">
                        {fmt(needs.length)} کالای منتشرشده نیاز به تعیین دستهٔ بازاری دارد
                    </span>
                    <ArrowLeft className="w-4 h-4 text-amber-600 flex-shrink-0" />
                </button>
            )}

            {/* ─── لیست فروشندگان ─── */}
            <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-on-surface-variant px-1 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" /> فروشندگان بازار ({fmt(sellers.length)})
                </h3>

                {sellersQ.isPending ? (
                    <><RowSkeleton /><RowSkeleton /><RowSkeleton /></>
                ) : sellers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline-variant/50 p-10 text-center">
                        <Store className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-3" />
                        <h4 className="text-sm font-extrabold text-on-surface">هنوز فروشنده‌ای نداری</h4>
                        <p className="text-xs text-on-surface-variant mt-1.5">
                            از جعبهٔ بالا کاتالوگ‌های مناسب را پیدا کن و به تابلوی قیمت اضافه کن
                        </p>
                    </div>
                ) : (
                    sellers.map((c) => {
                        const isPaused = c.businessStatus === 'paused';
                        const busyPause = pauseMut.isPending && pauseMut.variables?.catalogId === c.catalog.id;
                        const busyRemove = removeMut.isPending && removeMut.variables === c.catalog.id;
                        const busy = busyPause || busyRemove;
                        const confirming = confirmRemoveId === c.membershipId;
                        return (
                            <div key={c.membershipId}
                                 className={cn('bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-all',
                                     isPaused ? 'border-outline-variant/20 opacity-50 bg-surface-container-low/30' : 'border-outline-variant/40 hover:shadow-md')}>
                                <div className="flex items-start gap-3.5">
                                    <Logo url={c.catalog.logoUrl} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-extrabold text-on-surface truncate">{c.catalog.name}</p>
                                            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', salesCls(c.catalog.salesType))}>
                                                {salesLabel(c.catalog.salesType)}
                                            </span>
                                        </div>
                                        {/* ✅ مشخصات کسب‌وکار مالک کاتالوگ — همان چیزی که مالک برای تصمیم می‌خواهد */}
                                        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/70 mt-1 flex-wrap">
                                            {c.catalog.businessName && (
                                                <span className="inline-flex items-center gap-0.5 font-bold text-on-surface-variant">
                                                    <Building2 className="w-3 h-3" /> {c.catalog.businessName}
                                                </span>
                                            )}
                                            {c.catalog.businessIndustry && <span>{c.catalog.businessIndustry}</span>}
                                            {c.catalog.owner?.fullName && <span>{c.catalog.owner.fullName}</span>}
                                            {c.catalog.owner?.phone && <span dir="ltr">{c.catalog.owner.phone}</span>}
                                            {c.catalog.city && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{c.catalog.city}</span>}
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                            {isPaused ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                    <PauseCircle className="w-3 h-3" /> متوقف
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                    <CheckCircle2 className="w-3 h-3" /> فعال
                                                </span>
                                            )}
                                            {c.publishState === 'published' && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                    <Sparkles className="w-3 h-3" /> روی تابلو
                                                </span>
                                            )}
                                            {c.needsCategory > 0 && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                    <AlertTriangle className="w-3 h-3" /> {fmt(c.needsCategory)} بی‌دسته
                                                </span>
                                            )}
                                            {c.isStale && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                                    <RefreshCw className="w-3 h-3" /> قیمت‌ها کهنه
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-xl bg-surface-container-high/50
                                        border border-outline-variant/30 flex-shrink-0">
                                        <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{fmt(c.activeOnTable)}</p>
                                        <p className="text-[9px] text-on-surface-variant/70">روی تابلو</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-outline-variant/20 flex-wrap">
                                    <span className="sm:hidden inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                        <Package className="w-3 h-3" /> {fmt(c.activeOnTable)} روی تابلو
                                    </span>
                                    <span className="flex-1" />
                                    {c.catalog.slug && (
                                        <a href={`/${c.catalog.slug}`} target="_blank" rel="noreferrer" title="مشاهده کاتالوگ"
                                           className="h-8 w-8 rounded-lg border border-outline-variant/50 grid place-items-center
                                               text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors">
                                            <Eye className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                    <button onClick={() => pauseMut.mutate({ catalogId: c.catalog.id, paused: !isPaused })}
                                            disabled={busy}
                                            title={isPaused ? 'فعال‌سازی مجدد فروشنده' : 'توقف موقت فروشنده'}
                                            className={cn('h-8 px-3 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50',
                                                isPaused ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20')}>
                                        {busyPause ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : isPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                                        {isPaused ? 'فعال‌سازی' : 'توقف موقت'}
                                    </button>
                                    {confirming ? (
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => removeMut.mutate(c.catalog.id, { onSuccess: () => setConfirmRemoveId(null) })}
                                                    disabled={busy}
                                                    className="h-8 px-3 rounded-lg bg-error text-white text-[11px] font-bold inline-flex items-center gap-1.5 disabled:opacity-50">
                                                {busyRemove ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                تایید حذف
                                            </button>
                                            <button onClick={() => setConfirmRemoveId(null)}
                                                    className="h-8 w-8 rounded-lg border border-outline-variant/50 grid place-items-center text-on-surface-variant">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmRemoveId(c.membershipId)} title="حذف از بازار"
                                                className="h-8 w-8 rounded-lg text-error/60 hover:text-error hover:bg-error/10 grid place-items-center transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ─── کالاهای بی‌دسته (پنل مالک) ─── */}
            {needs.length > 0 && categoryTree.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-on-surface-variant px-1 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-500" /> کالاهای نیازمند دستهٔ بازاری
                    </h3>
                    {needs.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-300/40 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-extrabold text-on-surface truncate">{item.title}</p>
                                    <p className="text-[10px] text-on-surface-variant/70 mt-1">
                                        {item.catalogName}
                                        {item.catalogCategoryTitle && ` · دسته در کاتالوگ: ${item.catalogCategoryTitle}`}
                                    </p>
                                </div>
                                {assignMut.isPending && assignMut.variables?.adId === item.id && (
                                    <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                                )}
                            </div>
                            <div className="mt-3">
                                <CategoryPicker
                                    value=""
                                    onChange={(id: string) => handleAssign(item, id)}
                                    tree={categoryTree}
                                    disabled={assignMut.isPending}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════
// تب خریداران
// ═══════════════════════════════════════════
function BuyersTab({ slug }: { slug: string }) {
    const [qInput, setQInput] = useState('');
    const [onlyMine, setOnlyMine] = useState(false);
    const q = useDebounced(qInput.trim(), 400);

    const buyersQ = useArmBuyers(slug, {});
    const candidatesQ = useArmBuyerCandidates(slug, q, onlyMine, true);
    const addMut = useAddBuyer(slug);
    const removeMut = useRemoveBuyer(slug);

    const buyers: any[] = buyersQ.data?.items ?? [];
    const candidates: any[] = candidatesQ.data?.items ?? [];

    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const pauseMut = useToggleBuyerPaused(slug);

    const buyerTypeLabel = (t: string) => {
        const map: Record<string, string> = {
            producer: 'تولیدی', wholesaler: 'عمده‌فروش', importer: 'واردکننده', exporter: 'صادرکننده',
            distributor: 'پخش‌کننده', retailer: 'خرده‌فروش', contractor: 'پیمانکار',
            service_provider: 'خدمات', other: 'سایر',
        };
        return map[t] || t;
    };

    return (
        <div className="space-y-4">
            {/* ─── توضیح ─── */}
            <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-3 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-on-surface-variant leading-5">
                    کسب‌وکارهایی که خریدار بازار تو هستند رو انتخاب کن.
                </p>
            </div>

            {/* ─── جعبهٔ افزودن خریدار ─── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-primary/25 overflow-hidden">
                <div className="px-4 pt-3.5 pb-2 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-extrabold text-on-surface">افزودن خریدار به بازار</h3>
                    <span className="flex-1" />
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <button type="button" role="switch" aria-checked={onlyMine}
                                onClick={() => setOnlyMine((v) => !v)}
                                className={cn('relative w-8 h-4.5 rounded-full transition-colors',
                                    onlyMine ? 'bg-primary' : 'bg-outline-variant/50')}>
                            <span className={cn('absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all',
                                onlyMine ? 'right-0.5' : 'right-[1.125rem]')} />
                        </button>
                        <span className="text-[10px] font-bold text-on-surface-variant">جذب‌شده‌های من</span>
                    </label>
                </div>
                <div className="px-4 pb-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                        <input
                            value={qInput}
                            onChange={(e) => setQInput(e.target.value)}
                            placeholder="جستجوی کسب‌وکار، صنف، مالک…"
                            className="w-full h-10 pr-9 pl-8 rounded-xl bg-surface-container-lowest border border-outline-variant/40
                                dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        {qInput && (
                            <button onClick={() => setQInput('')}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {candidatesQ.isFetching && q ? (
                    <div className="px-4 pb-3"><RowSkeleton h={64} /></div>
                ) : candidates.length > 0 ? (
                    <div className="px-3 pb-3 space-y-1.5 max-h-72 overflow-y-auto scrollbar-slim">
                        {candidates.map((b) => {
                            const busy = addMut.isPending && addMut.variables === b.id;
                            return (
                                <div key={b.id}
                                     className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-lowest/60
                                         border border-outline-variant/30 hover:border-primary/30 transition-colors">
                                    <Logo url={b.logoUrl} size={38} fallback={Building2} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-extrabold text-on-surface truncate">{b.name}</p>
                                        <p className="text-[10px] text-on-surface-variant/70 truncate">
                                            {[
                                                b.industryName,
                                                buyerTypeLabel(b.type),
                                                b.owner?.fullName,
                                                b.city,
                                            ].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    <button onClick={() => addMut.mutate(b.id)} disabled={busy}
                                            className="h-8 px-3 rounded-lg bg-primary text-on-primary text-[10px] font-extrabold
                                                inline-flex items-center gap-1 hover:bg-primary/90 active:scale-95 transition-all
                                                disabled:opacity-50 flex-shrink-0">
                                        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                        افزودن
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : q || onlyMine ? (
                    <p className="text-xs text-on-surface-variant/70 text-center pb-4">کسب‌وکاری پیدا نشد</p>
                ) : null}
            </div>

            {/* ─── لیست خریداران ─── */}
            <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-on-surface-variant px-1 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" /> خریداران بازار ({fmt(buyers.length)})
                </h3>

                {buyersQ.isPending ? (
                    <><RowSkeleton /><RowSkeleton /><RowSkeleton /></>
                ) : buyers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-outline-variant/50 p-10 text-center">
                        <ShoppingCart className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-3" />
                        <h4 className="text-sm font-extrabold text-on-surface">هنوز خریداری نداری</h4>
                        <p className="text-xs text-on-surface-variant mt-1.5">
                            سوپرمارکت‌ها، فروشگاه‌ها و کسب‌وکارهای مرتبط را از جعبهٔ بالا اضافه کن —
                            آن‌ها تابلوی تو را هر روز می‌بینند
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {buyers.map((b) => {
                            const busyRemove = removeMut.isPending && removeMut.variables === b.membershipId;
                            const confirming = confirmRemoveId === b.membershipId;
                            const BizIcon = b.business?.logoUrl ? null : Building2;
                            return (
                                <div key={b.membershipId}
                                     className={cn('bg-white dark:bg-gray-900 rounded-2xl border p-3.5 flex items-start gap-3.5 transition-all',
                                         b.businessStatus === 'paused' ? 'opacity-50 border-outline-variant/20 bg-surface-container-low/30' : 'border-outline-variant/40 hover:shadow-sm')}>
                                    <Logo url={b.business?.logoUrl} size={44} fallback={Building2} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-extrabold text-on-surface truncate">
                                                {b.business?.name || 'بدون کسب‌وکار ثبت‌شده'}
                                            </p>
                                            {b.business && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                                                    {buyerTypeLabel(b.business.type)}
                                                </span>
                                            )}
                                            {b.businessStatus === 'paused' && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                    متوقف
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/70 mt-1 flex-wrap">
                                            {b.business?.industryName && <span>{b.business.industryName}</span>}
                                            {b.business?.city && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{b.business.city}</span>}
                                            {b.user?.fullName && <span>{b.user.fullName}</span>}
                                            {b.user?.phone && <span dir="ltr">{b.user.phone}</span>}
                                            {b.business?.hasCatalog && (
                                                <span className="text-emerald-600 font-bold">· کاتالوگ دارد: {b.business.catalogName}</span>
                                            )}
                                        </div>
                                        {!b.business && (
                                            <p className="text-[10px] text-amber-600 mt-1">این عضو هنوز کسب‌وکار ثبت نکرده — پس از تکمیل، اینجا کامل می‌شود</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
                                        {confirming ? (
                                            <>
                                                <button onClick={() => removeMut.mutate(b.membershipId, { onSuccess: () => setConfirmRemoveId(null) })}
                                                        disabled={busyRemove}
                                                        className="h-8 px-3 rounded-lg bg-error text-white text-[10px] font-bold inline-flex items-center gap-1 disabled:opacity-50">
                                                    {busyRemove ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                    تایید
                                                </button>
                                                <button onClick={() => setConfirmRemoveId(null)}
                                                        className="h-8 w-8 rounded-lg border border-outline-variant/50 grid place-items-center text-on-surface-variant">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {/* ✅ دکمه Pause/Resume */}
                                                <button
                                                    onClick={() => pauseMut.mutate({ membershipId: b.membershipId, paused: b.businessStatus === 'active' })}
                                                    disabled={pauseMut.isPending}
                                                    title={b.businessStatus === 'active' ? 'توقف موقت نقش خریدار' : 'فعال‌سازی مجدد خریدار'}
                                                    className={cn(
                                                        'h-8 w-8 rounded-lg grid place-items-center transition-colors',
                                                        b.businessStatus === 'active'
                                                            ? 'text-amber-600/70 hover:text-amber-600 hover:bg-amber-500/10'
                                                            : 'text-emerald-600/70 hover:text-emerald-600 hover:bg-emerald-500/10'
                                                    )}
                                                >
                                                    {pauseMut.isPending && pauseMut.variables?.membershipId === b.membershipId ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : b.businessStatus === 'active' ? (
                                                        <PauseCircle className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <PlayCircle className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                                {/* ✅ دکمه حذف (نقش خریداری) */}
                                                <button onClick={() => setConfirmRemoveId(b.membershipId)} title="حذف نقش خریداری"
                                                        className="h-8 w-8 rounded-lg text-error/60 hover:text-error hover:bg-error/10 grid place-items-center transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}