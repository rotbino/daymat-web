'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import {
    BookOpen, PlusCircle, Layers, UserPlus, Search, X,
    Eye, PauseCircle, PlayCircle, Trash2, Loader2, Package,
    Phone, MapPin, CheckCircle2, AlertTriangle, Users,
    Sparkles, ArrowLeft, Building2, Info, Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CategoryPicker from '@/app/ad/components/CategoryPicker';
import {
    useArmCatalogs, useArmCatalogCandidates, useArmCatalogNeeds,
    useArmCatalogReferrals, useAddCatalogToArm, useToggleCatalogPaused,
    useRemoveCatalogFromArm, useSetAdMarketCategory, armCatalogKeys,
} from '@/lib/api/apiHooks';
import { toast } from 'sonner'; // ✅ ایمپورت جامانده بود — toast در handleAdd/handleAssign استفاده می‌شد

// ═══════════════════════════════════════════
// تایپ‌ها
// ═══════════════════════════════════════════
interface CatalogCatalog {
    id: string; name: string; slug: string | null; salesType: string;
    type: string; city: string | null; logoUrl: string | null;
    owner: { fullName: string | null; phone: string } | null;
}
interface MemberCatalog {
    membershipId: string; status: string; publishState: string | null;
    roleType: string | null; joinedAt: string; catalog: CatalogCatalog;
    activeOnTable: number; needsCategory: number;
}
interface Candidate extends CatalogCatalog {
    _count: { ads: number }; isMember: boolean;
    /** ✅ این فروشنده خودش قبلاً از بازار خارج شده — اددِ مجدد نیاز به تایید صریح دارد */
    selfRemoved?: boolean;
}
interface NeedsItem {
    id: string; title: string; productType: string | null;
    catalogName: string; catalogCategoryTitle: string | null;
}
interface ReferralData {
    invitedCount: number;
    invitedUsers: { id: string; fullName: string | null; phone: string; catalogsCount: number; joinedAt: string }[];
    catalogs: (CatalogCatalog & { createdAt: string; isMember: boolean })[];
}
type TabId = 'members' | 'add' | 'uncategorized' | 'referrals';

const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'members', label: 'کاتالوگ‌های بازار', icon: BookOpen },
    { id: 'add', label: 'افزودن', icon: PlusCircle },
    { id: 'uncategorized', label: 'بی‌دسته', icon: Layers },
    { id: 'referrals', label: 'جذب من', icon: UserPlus },
];

// ═══════════════════════════════════════════
// هلپرها — هوک‌های تک‌مصرفی این فایل، همین‌جا
// ═══════════════════════════════════════════
const fmt = (n?: number | null) => (n ?? 0).toLocaleString('fa-IR');
const salesLabel = (s: string) => (s === 'retail' ? 'تک‌فروشی' : 'عمده‌فروشی');
const salesCls = (s: string) =>
    s === 'retail'
        ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';

/** هوک debounce — فقط همین صفحه استفاده می‌کند؛ پس همین‌جاست */
function useDebounced<T>(value: T, delay = 400): T {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}

function Logo({ url, size = 44 }: { url?: string | null; size?: number }) {
    const [broken, setBroken] = useState(false);
    if (!url || broken) {
        return (
            <div style={{ width: size, height: size }}
                 className="rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0 overflow-hidden">
                <Store className="w-1/2 h-1/2 text-on-surface-variant/40" />
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

function SalesBadge({ salesType }: { salesType: string }) {
    return (
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', salesCls(salesType))}>
            {salesLabel(salesType)}
        </span>
    );
}

function RowSkeleton({ h = 100 }: { h?: number }) {
    return <div style={{ height: h }} className="rounded-2xl bg-surface-container-high/50 animate-pulse" />;
}
// ═══════════════════════════════════════════
// کنترل چندفروشندگی کاتالوگ — ارث‌بری از بازار + اورایت مالک بازار
// ═══════════════════════════════════════════
function MultiSellerControl({ slug, catalogId }: { slug: string; catalogId: string }) {
    const queryClient = useQueryClient();
    const qk = ['arm-admin', 'catalog-settings', slug, catalogId];

    const { data, isLoading } = useQuery({
        queryKey: qk,
        queryFn: () => apiService.armAdmin.catalogs.getCatalogSettings(slug, catalogId),
        staleTime: 30_000,
        retry: false,
    });

    const mut = useMutation({
        mutationFn: (value: boolean | 'inherit') =>
            apiService.armAdmin.catalogs.setCatalogSettings(slug, catalogId, value),
        onSuccess: (res: any) => {
            queryClient.setQueryData(qk, res);
            toast.success('تنظیم چندفروشندگی ذخیره شد');
        },
        onError: (e: any) => toast.error(e?.message || 'خطا در ذخیرهٔ تنظیم'),
    });

    const value: boolean | 'inherit' = data?.multiSeller?.override ?? 'inherit';
    const effective = data?.multiSeller?.effective;

    const optCls = (active: boolean) =>
        cn('h-7 px-2 rounded-lg text-[10px] font-bold transition-colors',
            active ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-gray-800');

    return (
        <div className="inline-flex items-center gap-1 bg-surface-container-low dark:bg-gray-800 rounded-lg p-0.5" title="چندفروشندگی: ارث از بازار یا اورایت برای همین کاتالوگ">
            <span className="text-[9px] text-on-surface-variant px-1.5">چندفروشندگی</span>
            {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-on-surface-variant mx-1" />
            ) : (
                <>
                    <button className={optCls(value === 'inherit')} onClick={() => mut.mutate('inherit')} disabled={mut.isPending}>
                        ارث از بازار
                    </button>
                    <button className={optCls(value === true)} onClick={() => mut.mutate(true)} disabled={mut.isPending}>
                        فعال
                    </button>
                    <button className={optCls(value === false)} onClick={() => mut.mutate(false)} disabled={mut.isPending}>
                        غیرفعال
                    </button>
                    <span className={cn('text-[9px] font-bold px-1.5', effective ? 'text-emerald-600' : 'text-error')}>
                        {effective ? 'مؤثر: بله' : 'مؤثر: خیر'}
                    </span>
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════
// صفحه
// ═══════════════════════════════════════════
export default function ArmAdminCatalogsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);

    // ─── تب (URL-synced) ───
    const initialTab = (searchParams.get('tab') as TabId) || 'members';
    const [tab, setTab] = useState<TabId>(
        TABS.some((t) => t.id === initialTab) ? initialTab : 'members',
    );
    const changeTab = (t: TabId) => {
        setTab(t);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', t);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    // ═══ React Query — دادهٔ سرور ═══
    const catalogsQ = useArmCatalogs(currentSlug);
    const [qInput, setQInput] = useState('');
    const [onlyMine, setOnlyMine] = useState(false);
    const q = useDebounced(qInput.trim(), 400);
    const candidatesQ = useArmCatalogCandidates(currentSlug, q, onlyMine, tab === 'add');
    const needsQ = useArmCatalogNeeds(currentSlug, tab === 'uncategorized');
    const referralsQ = useArmCatalogReferrals(currentSlug, tab === 'referrals');

    // ═══ Mutations — بدون state دستی؛ busy از variables تشخیص داده می‌شود ═══
    const addMut = useAddCatalogToArm(currentSlug);
    const pauseMut = useToggleCatalogPaused(currentSlug);
    const removeMut = useRemoveCatalogFromArm(currentSlug);
    const assignMut = useSetAdMarketCategory(currentSlug);

    // ═══ UI state (فقط چیزهایی که سرور ندارد) ═══
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [addResult, setAddResult] = useState<{ name: string; stamped: number; needs: number } | null>(null);

    // ═══ مشتقات ═══
    const members: MemberCatalog[] = catalogsQ.data?.items ?? [];
    const totals = useMemo(() => ({
        members: members.length,
        active: members.filter((m) => m.status === 'active').length,
        onTable: members.reduce((s, m) => s + (m.activeOnTable || 0), 0),
        needs: members.reduce((s, m) => s + (m.needsCategory || 0), 0),
    }), [members]);
    const candidates: Candidate[] = candidatesQ.data?.items ?? [];
    const needs: NeedsItem[] = needsQ.data?.items ?? [];
    const referrals: ReferralData | null = referralsQ.data ?? null;
    const categoryTree = useMemo<any[]>(() => (currentArm as any)?.categoryTree || [], [currentArm]);

    // ═══ اکشن‌ها ═══
    const handleAdd = (c: Candidate, confirmSelfRemoved = false) => {
        addMut.mutate(
            { catalogId: c.id, confirmSelfRemoved },
            {
                onSuccess: (res: any) => {
                    setAddResult({
                        name: c.name,
                        stamped: res?.stamped ?? 0,
                        needs: res?.needsCategory?.length ?? 0,
                    });
                    toast.success(res?.message || 'کاتالوگ به بازار اضافه شد');
                },
                onError: (error: any) => {
                    // ✅ فروشنده‌ای که خودش خارج شده را نباید اشتباهی دوباره ادد کرد
                    if (error?.data?.errorCode === 'SELF_REMOVED_CONFLICT') {
                        const ok = window.confirm(
                            `${c.name} خودش قبلاً از این بازار خارج شده است.\nآیا از افزودن مجدد مطمئنی؟ (فقط پس از هماهنگی با فروشنده)`,
                        );
                        if (ok) handleAdd(c, true);
                        return;
                    }
                    toast.error(error?.data?.message || error?.message || 'خطا در افزودن کاتالوگ');
                },
            },
        );
    };

    const handleAssign = (item: NeedsItem, categoryId: string) => {
        if (!categoryId) return;
        assignMut.mutate(
            { adId: item.id, categoryId },
            {
                onSuccess: () => {
                    // حذف خوش‌بینانه از کش — لیست فوراً بدون آیتم می‌شود، رفرش در پس‌زمینه
                    queryClient.setQueryData(armCatalogKeys.needs(currentSlug!), (old: any) => ({
                        items: (old?.items ?? []).filter((n: NeedsItem) => n.id !== item.id),
                    }));
                },
            },
        );
    };

    const handleRemove = (c: MemberCatalog) => {
        removeMut.mutate(c.catalog.id, {
            onSuccess: () => setConfirmRemoveId(null),
        });
    };

    // ═══ گارد رندر — بعد از همهٔ هوک‌ها ═══
    if (!currentSlug) {
        return (
            <div className="text-center py-16 text-sm text-on-surface-variant">
                ابتدا بازار را انتخاب کنید
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* ─── هدر ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-on-surface">مدیریت کاتالوگ‌ها</h1>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                        اتصال کاتالوگ‌ها به تابلوی {currentArm?.name || currentSlug}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs bg-surface-container-low border border-outline-variant/40 px-3 py-1.5 rounded-full text-on-surface-variant">
                        <BookOpen className="w-3.5 h-3.5 text-primary" /> {fmt(totals.members)} عضو
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs bg-surface-container-low border border-outline-variant/40 px-3 py-1.5 rounded-full text-on-surface-variant">
                        <Package className="w-3.5 h-3.5 text-emerald-600" /> {fmt(totals.onTable)} روی تابلو
                    </span>
                    {totals.needs > 0 && (
                        <button onClick={() => changeTab('uncategorized')}
                                className="inline-flex items-center gap-1.5 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-300/60 dark:border-amber-800 px-3 py-1.5 rounded-full text-amber-700 dark:text-amber-300 font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                            <AlertTriangle className="w-3.5 h-3.5" /> {fmt(totals.needs)} بی‌دسته
                            <ArrowLeft className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* ─── تب‌ها ─── */}
            <div className="flex items-center gap-1 bg-surface-container-low dark:bg-gray-800 rounded-xl p-1 overflow-x-auto scrollbar-hide">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    const badge = t.id === 'uncategorized' ? totals.needs : 0;
                    return (
                        <button key={t.id} onClick={() => changeTab(t.id)}
                                className={cn(
                                    'flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex-shrink-0',
                                    active
                                        ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                        : 'text-on-surface-variant hover:text-on-surface',
                                )}>
                            <Icon className="w-3.5 h-3.5" /> {t.label}
                            {badge > 0 && (
                                <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-extrabold">
                                    {fmt(badge)}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ═══ تب ۱ — کاتالوگ‌های عضو ═══ */}
            {tab === 'members' && (
                <div className="space-y-3">
                    {catalogsQ.isPending ? (
                        <><RowSkeleton h={110} /><RowSkeleton h={110} /><RowSkeleton h={110} /></>
                    ) : members.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-outline-variant/50 p-10 text-center">
                            <BookOpen className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-3" />
                            <h3 className="text-sm font-extrabold text-on-surface">هنوز کاتالوگی عضو بازار نشده</h3>
                            <p className="text-xs text-on-surface-variant mt-1.5 leading-6 max-w-sm mx-auto">
                                کاتالوگ‌های مناسب را پیدا کن و به تابلوی قیمت اضافه کن —
                                کالاهایشان بلافاصله کنار بقیه نمایش داده می‌شود.
                            </p>
                            <button onClick={() => changeTab('add')}
                                    className="mt-4 h-10 px-6 rounded-xl bg-primary text-on-primary text-xs font-extrabold inline-flex items-center gap-2 hover:bg-primary/90 shadow-sm">
                                <PlusCircle className="w-4 h-4" /> افزودن اولین کاتالوگ
                            </button>
                        </div>
                    ) : (
            members.map((c) => {
            const isPaused = c.status !== 'active';
            const busyPause = pauseMut.isPending && pauseMut.variables?.catalogId === c.catalog.id;
            const busyRemove = removeMut.isPending && removeMut.variables === c.catalog.id;
            const busy = busyPause || busyRemove;
            const confirming = confirmRemoveId === c.membershipId;
            return (
            <div key={c.membershipId}
            className={cn(
                'bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-all',
                isPaused
                    ? 'border-outline-variant/30 opacity-75'
                    : 'border-outline-variant/40 hover:shadow-md',
            )}>
            <div className="flex items-start gap-3.5">
                <Logo url={c.catalog.logoUrl} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-extrabold text-on-surface truncate">{c.catalog.name}</p>
                        <SalesBadge salesType={c.catalog.salesType} />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant/70 mt-1 flex-wrap">
                        {c.catalog.slug && (
                            <span dir="ltr" className="truncate max-w-[140px]">/{c.catalog.slug}</span>
                        )}
                        {c.catalog.city && (
                            <span className="inline-flex items-center gap-0.5">
                                                        <MapPin className="w-3 h-3" /> {c.catalog.city}
                                                    </span>
                        )}
                        {c.catalog.owner?.fullName && <span>{c.catalog.owner.fullName}</span>}
                        {c.catalog.owner?.phone && (
                            <span dir="ltr" className="inline-flex items-center gap-0.5">
                                                        <Phone className="w-3 h-3" /> {c.catalog.owner.phone}
                                                    </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {isPaused ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                        <PauseCircle className="w-3 h-3" /> عضویت متوقف
                                                    </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                        <CheckCircle2 className="w-3 h-3" /> عضو فعال
                                                    </span>
                        )}
                        {c.publishState === 'published' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                        <Sparkles className="w-3 h-3" /> انتشار روشن
                                                    </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                        انتشار خاموش
                                                    </span>
                        )}
                        {c.needsCategory > 0 && (
                            <button onClick={() => changeTab('uncategorized')}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors">
                                <AlertTriangle className="w-3 h-3" /> {fmt(c.needsCategory)} بی‌دسته
                            </button>
                        )}
                    </div>
                </div>
                <div className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/30 flex-shrink-0">
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
                    <a href={`/${c.catalog.slug}`} target="_blank" rel="noreferrer"
                       title="مشاهده کاتالوگ"
                       className="h-8 px-3 rounded-lg border border-outline-variant/50 text-[11px] font-bold text-on-surface-variant hover:text-primary hover:border-primary/40 inline-flex items-center gap-1.5 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> مشاهده
                    </a>
                )}
                <button
                    onClick={() => pauseMut.mutate({ catalogId: c.catalog.id, paused: !isPaused })}
                    disabled={busy}
                    title={isPaused ? 'ادامهٔ عضویت' : 'توقف عضویت'}
                    className={cn(
                        'h-8 px-3 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50',
                        isPaused
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
                    )}>
                    {busyPause
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : isPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    {isPaused ? 'ادامه' : 'توقف'}
                </button>
                <MultiSellerControl slug={currentSlug!} catalogId={c.catalog.id} />
                {confirming ? (
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => handleRemove(c)} disabled={busy}
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
                    <button onClick={() => setConfirmRemoveId(c.membershipId)}
                            title="حذف از بازار"
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
)}

{/* ═══ تب ۲ — افزودن ═══ */}
{tab === 'add' && (
    <div className="space-y-4">
        {addResult && (
            <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50/70 dark:bg-emerald-900/15 dark:border-emerald-800/50 p-4">
                <div className="flex items-start gap-3">
                                <span className="w-9 h-9 rounded-xl bg-emerald-500 grid place-items-center flex-shrink-0 shadow-sm shadow-emerald-500/30">
                                    <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                                </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                            «{addResult.name}» به بازار اضافه شد
                        </p>
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                            {fmt(addResult.stamped)} کالا منتشر شد
                            {addResult.needs > 0 && ` — ${fmt(addResult.needs)} کالا نیاز به تعیین دستهٔ بازاری دارد`}
                        </p>
                        {addResult.needs > 0 && (
                            <button onClick={() => changeTab('uncategorized')}
                                    className="mt-2.5 h-8 px-4 rounded-lg bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center gap-1.5 hover:bg-emerald-700 transition-colors">
                                تعیین دسته‌ها <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <button onClick={() => setAddResult(null)}
                            className="w-7 h-7 rounded-lg text-emerald-600/60 hover:bg-emerald-500/10 grid place-items-center flex-shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 p-4 space-y-3">
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder="جستجوی نام کاتالوگ، شماره یا نام مالک…"
                    className="w-full h-11 pr-10 pl-9 rounded-xl bg-surface-container-lowest border border-outline-variant/40 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {qInput && (
                    <button onClick={() => setQInput('')}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                <button type="button" role="switch" aria-checked={onlyMine}
                        onClick={() => setOnlyMine((v) => !v)}
                        className={cn('relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0',
                            onlyMine ? 'bg-primary' : 'bg-outline-variant/50')}>
                                <span className={cn('absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all',
                                    onlyMine ? 'right-0.5' : 'right-[1.375rem]')} />
                </button>
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                <UserPlus className="w-3.5 h-3.5 text-primary/70" />
                                فقط کاتالوگ‌های جذب‌شدهٔ من
                            </span>
                <span className="text-[10px] text-on-surface-variant/60 hidden sm:inline">
                                (کاربرانی که با لینک دعوت تو آمده‌اند)
                            </span>
            </label>
        </div>

        {candidatesQ.isPending ? (
            <><RowSkeleton h={72} /><RowSkeleton h={72} /><RowSkeleton h={72} /></>
        ) : candidates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/50 p-10 text-center">
                <Building2 className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-3" />
                <p className="text-sm font-bold text-on-surface">
                    {q || onlyMine ? 'کاتالوگی با این مشخصات پیدا نشد' : 'کاتالوگی برای افزودن نیست'}
                </p>
                <p className="text-xs text-on-surface-variant mt-1.5">
                    {q || onlyMine ? 'فیلترها را تغییر بده' : 'کاتالوگ‌های تازه در اینجا ظاهر می‌شوند'}
                </p>
            </div>
        ) : (
            <div className={cn('space-y-2.5', candidatesQ.isPlaceholderData && 'opacity-60 pointer-events-none')}>
                {candidates.map((c) => {
                    const busy = addMut.isPending && (addMut.variables as any)?.catalogId === c.id;
                    return (
                        <div key={c.id}
                             className={cn('bg-white dark:bg-gray-900 rounded-2xl border p-3.5 flex items-center gap-3.5 hover:shadow-sm transition-all',
                                 c.selfRemoved ? 'border-amber-300/70 dark:border-amber-700/50' : 'border-outline-variant/40')}>
                            <Logo url={c.logoUrl} size={40} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-[13px] font-extrabold text-on-surface truncate">{c.name}</p>
                                    <SalesBadge salesType={c.salesType} />
                                    {c.selfRemoved && (
                                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full
                                            bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex-shrink-0">
                                            <AlertTriangle className="w-3 h-3" /> خروج اختیاری — اددِ مجدد با هماهنگی
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/70 mt-0.5 flex-wrap">
                                    {c.owner?.fullName && <span>{c.owner.fullName}</span>}
                                    {c.owner?.phone && <span dir="ltr">{c.owner.phone}</span>}
                                    {c.city && <span>{c.city}</span>}
                                    <span className="inline-flex items-center gap-0.5">
                                                    <Package className="w-3 h-3" /> {fmt(c._count?.ads)} کالا
                                                </span>
                                </div>
                            </div>
                            {c.isMember ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 flex-shrink-0">
                                                <CheckCircle2 className="w-3 h-3" /> عضو بازار
                                            </span>
                            ) : (
                                <button onClick={() => handleAdd(c)} disabled={busy}
                                        className="h-9 px-4 rounded-xl bg-primary text-on-primary text-[11px] font-extrabold inline-flex items-center gap-1.5 hover:bg-primary/90 shadow-sm shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0">
                                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                                    افزودن به بازار
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
    </div>
)}

{/* ═══ تب ۳ — بی‌دسته ═══ */}
{tab === 'uncategorized' && (
    <div className="space-y-3">
        {categoryTree.length === 0 ? (
            <div className="rounded-2xl border border-amber-300/50 bg-amber-50/70 dark:bg-amber-900/10 dark:border-amber-800/50 p-5 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <p className="text-sm font-extrabold text-amber-800 dark:text-amber-300">بازار هنوز درخت دسته‌بندی ندارد</p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1.5">
                    از تب «تنظیمات ← گروه‌ها» درخت دسته‌بندی بازار را بساز، بعد کالاهای بی‌دسته را اینجا طبقه‌بندی کن.
                </p>
            </div>
        ) : needsQ.isPending ? (
            <><RowSkeleton h={96} /><RowSkeleton h={96} /><RowSkeleton h={96} /></>
        ) : needs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/50 p-10 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
                <p className="text-sm font-extrabold text-on-surface">همه‌چیز طبقه‌بندی شده ✓</p>
                <p className="text-xs text-on-surface-variant mt-1.5">کالای بدون دستهٔ بازاری وجود ندارد</p>
            </div>
        ) : (
            <>
                <div className="rounded-xl bg-surface-container-low border border-outline-variant/30 p-3 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-on-surface-variant leading-6">
                        این کالاها در تابلوی بازار نمایش داده می‌شوند ولی از فیلتر دسته‌بندی پیدا نمی‌شوند.
                        برای هر کالا، دستهٔ مناسب درخت بازار را انتخاب کن.
                    </p>
                </div>
                {needs.map((item) => (
                    <div key={item.id}
                         className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-extrabold text-on-surface truncate">{item.title}</p>
                                <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/70 mt-1 flex-wrap">
                                                <span className="inline-flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" /> {item.catalogName}
                                                </span>
                                    {item.catalogCategoryTitle && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                                                        دسته در کاتالوگ: {item.catalogCategoryTitle}
                                                    </span>
                                    )}
                                </div>
                            </div>
                            {assignMut.isPending && assignMut.variables?.adId === item.id && (
                                <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0 mt-1" />
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
            </>
        )}
    </div>
)}

            {/* ═══ تب ۴ — جذب من ═══ */}
            {tab === 'referrals' && (
                <div className="space-y-4">
                    {referralsQ.isPending ? (
                        <><RowSkeleton h={80} /><RowSkeleton h={160} /></>
                    ) : !referrals ? null : (
                        <>
                            <div className="grid grid-cols-3 gap-2.5">
                                {[
                                    { icon: Users, label: 'دعوت‌شده', value: referrals.invitedCount, cls: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
                                    { icon: BookOpen, label: 'کاتالوگ جذب‌شده', value: referrals.catalogs.length, cls: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
                                    { icon: Store, label: 'عضو این بازار', value: referrals.catalogs.filter((c) => c.isMember).length, cls: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
                                ].map((s) => (
                                    <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 p-3.5 text-center">
                                        <span className={cn('w-9 h-9 rounded-xl inline-flex items-center justify-center mb-1.5', s.bg)}>
                                            <s.icon className={cn('w-4 h-4', s.cls)} />
                                        </span>
                                        <p className="text-xl font-extrabold text-on-surface">{fmt(s.value)}</p>
                                        <p className="text-[9px] text-on-surface-variant/70 mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 overflow-hidden">
                                <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
                                    <h3 className="text-xs font-extrabold text-on-surface flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-primary" /> کاربرانی که با لینک تو آمده‌اند
                                    </h3>
                                    <span className="text-[10px] text-on-surface-variant/60">{fmt(referrals.invitedCount)} نفر</span>
                                </div>
                                {referrals.invitedUsers.length === 0 ? (
                                    <p className="text-xs text-on-surface-variant/70 text-center py-8 px-4 leading-6">
                                        هنوز کسی با لینک دعوت تو ثبت‌نام نکرده —
                                        لینک دعوتت را در بیو و گروه‌ها بگذار
                                    </p>
                                ) : (
                                    <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant/15">
                                        {referrals.invitedUsers.map((u) => (
                                            <div key={u.id} className="px-4 py-2.5 flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-full bg-primary/10 grid place-items-center flex-shrink-0 text-[11px] font-extrabold text-primary">
                                                    {(u.fullName || 'ک').trim().charAt(0)}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-on-surface truncate">{u.fullName || 'کاربر'}</p>
                                                    <p className="text-[10px] text-on-surface-variant/70" dir="ltr">{u.phone}</p>
                                                </div>
                                                <div className="text-left flex-shrink-0">
                                                    <p className="text-[10px] font-bold text-on-surface">{fmt(u.catalogsCount)} کاتالوگ</p>
                                                    <p className="text-[9px] text-on-surface-variant/60">
                                                        {new Date(u.joinedAt).toLocaleDateString('fa-IR')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 overflow-hidden">
                                <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
                                    <h3 className="text-xs font-extrabold text-on-surface flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-primary" /> کاتالوگ‌های جذب‌شده
                                    </h3>
                                    <button onClick={() => changeTab('add')}
                                            className="text-[10px] font-bold text-primary hover:underline">
                                        افزودن به بازار ←
                                    </button>
                                </div>
                                {referrals.catalogs.length === 0 ? (
                                    <p className="text-xs text-on-surface-variant/70 text-center py-8 px-4 leading-6">
                                        هنوز کاتالوگی با کد دعوت تو ساخته نشده —
                                        لینک «تو هم کاتالوگ خودت را بساز» را با دیگران به اشتراک بگذار
                                    </p>
                                ) : (
                                    <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/15">
                                        {referrals.catalogs.map((c) => (
                                            <div key={c.id} className="px-4 py-2.5 flex items-center gap-3">
                                                <Logo url={c.logoUrl} size={34} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-on-surface truncate">{c.name}</p>
                                                    <p className="text-[10px] text-on-surface-variant/70 truncate">
                                                        {c.owner?.fullName || c.owner?.phone || ''}
                                                        {c.city ? ` · ${c.city}` : ''}
                                                    </p>
                                                </div>
                                                {c.isMember ? (
                                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 flex-shrink-0">
                                                        عضو بازار
                                                    </span>
                                                ) : (
                                                    <button onClick={() => changeTab('add')}
                                                            className="text-[10px] font-bold text-primary hover:underline flex-shrink-0">
                                                        افزودن
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}