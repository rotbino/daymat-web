// app/my-catalogs/MyCatalogsContent.tsx
'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setUser } from '@/lib/store/slices/authSlice';
import { apiService } from '@/lib/api/apiService';
import {
    useArms, useMyUncategorized, useSetOwnAdCategory,
    useCreditBalance, useMyBusinesses, useUploadFile, useUpdateCatalog,
    useUpdateBusinessEntity,
} from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    BookOpen, Package, Clock, Pencil, Eye, Share2, Plus, ChevronLeft,
    Store, Layers, Loader2, RefreshCw, EyeOff, AlertTriangle, Key,
    Globe, ShieldCheck, Settings2, BadgeCheck, Hourglass, XCircle,
    Bookmark, User as UserIcon, X, Building2, PauseCircle, Wrench,
    Info, Phone, CheckCircle2, Camera, UserPlus, Check,
    Ellipsis, ChevronDown, Sparkles, Unlink, CameraIcon, MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import IndustryAutocomplete from '@/app/components/IndustryAutocomplete';
import BusinessTypeSelector from '@/app/components/BusinessTypeSelector';
import UnitSettingsModal from '@/app/ad/components/UnitSettingsModal';
import CategorySettingsModal from '@/app/ad/components/CategorySettingsModal';
import ShareKitModal from '@/app_/profile/components/ShareKitModal';
import { RefreshModal } from '@/app/ad/RefreshModal';
import { ChangePasswordModal } from '@/app_/register/ChangePasswordModal';
import { VerificationModal } from '@/app/business/VerificationModal';
import CreditsCard from '@/app_/profile/components/CreditsCard';
import BusinessSetupModal from '@/app/components/BusinessSetupModal';
import CategoryPicker from '@/app/ad/components/CategoryPicker';
import {IranLocationSelector} from '@/app/components/IranLocationSelector';
import SlugEditor from "./SlugEditor";
import PublishToMarketModal from './PublishToMarketModal';

// ═══ هلپرها ═══
const isAdExpired = (ad: any) => ad.status === 'expired' || new Date(ad.expiresAt).getTime() < Date.now();
const inMarket = (ad: any) => ad.publishToMarket !== false;
const isUncategorized = (ad: any) => inMarket(ad) && !!ad.armId && !ad.categoryId && !!ad.catalogCategoryId;
const fmt = (n: number | undefined) => n?.toLocaleString('fa-IR') ?? '۰';

type Tab = 'products' | 'publish' | 'stats';
type StatusFilter = 'all' | 'table' | 'catalog' | 'stale' | 'uncat';

const PUB_CHIP: Record<string, { label: string; cls: string; icon: any }> = {
    active: { label: 'منتشر شده', cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/25', icon: BadgeCheck },
    pending: { label: 'در انتظار تایید مدیر', cls: 'text-amber-600 bg-amber-50 dark:bg-amber-900/25', icon: Hourglass },
    paused: { label: 'خاموش', cls: 'text-gray-500 bg-gray-100 dark:bg-gray-800', icon: PauseCircle },
    rejected: { label: 'رد شده', cls: 'text-red-600 bg-red-50 dark:bg-red-900/25', icon: XCircle },
};

const SALES_LABEL: Record<string, string> = {
    wholesale: 'فروش عمده',
    retail: 'فروش خرده',
    service: 'فروش خدمات',
};
const SALES_ICON: Record<string, any> = {
    wholesale: Store,
    retail: Package,
    service: Wrench,
};

function RowSkeleton({ h = 84 }: { h?: number }) {
    return <div style={{ height: h }} className="rounded-xl bg-surface-container-high/50 animate-pulse" />;
}

export default function MyCatalogsContent() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { user } = useSelector((s: RootState) => s.auth);

    // ─── UI state ───
    const [tab, setTab] = useState<Tab>('products');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [shareSlug, setShareSlug] = useState<string | null>(null);
    const [shareName, setShareName] = useState('');
    const [catalogEditOpen, setCatalogEditOpen] = useState(false);
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [refreshAd, setRefreshAd] = useState<any>(null);
    const [catModalAd, setCatModalAd] = useState<any>(null);
    const [publishModalAd, setPublishModalAd] = useState<any>(null);
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [bizModalOpen, setBizModalOpen] = useState(false);
    const [editBiz, setEditBiz] = useState<any | null>(null);
    const [celebrateDismissed, setCelebrateDismissed] = useState(false);
    const hasTemporaryPassword = user?.temporaryPassword === true;

    // ─── داده ───
    const { data: catalogsRaw, isLoading } = useQuery({
        queryKey: ['catalogs'],
        queryFn: () => apiService.catalog.getAll(),
        staleTime: 60_000,
    });
    const catalogs = useMemo(() => (catalogsRaw ?? []).filter((b: any) => b.status === 'active'), [catalogsRaw]);

    const [currentId, setCurrentId] = useState<string | null>(null);
    useEffect(() => {
        if (currentId || catalogs.length === 0) return;
        const fromUrl = new URLSearchParams(window.location.search).get('catalog');
        const initial = fromUrl && catalogs.some((c) => c.id === fromUrl) ? fromUrl : catalogs[0].id;
        setCurrentId(initial);
    }, [catalogs, currentId]);

    const currentCatalog = useMemo(
        () => catalogs.find((c) => c.id === currentId) ?? null,
        [catalogs, currentId],
    );

    const { data: userArms } = useArms();
    const { data: creditBalance } = useCreditBalance();
    const uncatQ = useMyUncategorized(!!currentId);
    const bizQ = useMyBusinesses(true);
    const myBizList: any[] = bizQ.data?.items ?? [];

    const [localUnitSettings, setLocalUnitSettings] = useState<{ unitId: string; containsQty?: number; qtyIsFixed?: boolean }[]>([]);
    const [localCatTree, setLocalCatTree] = useState<any[]>([]);
    useEffect(() => {
        if (!currentCatalog) return;
        setLocalUnitSettings(currentCatalog.config?.units || []);
        setLocalCatTree(currentCatalog.config?.categoryTree || []);
    }, [currentCatalog?.id]);

    const { data: adsRaw, isLoading: adsLoading } = useQuery({
        queryKey: ['catalog-products', currentId],
        queryFn: () => apiService.ad.getCatalogAds(currentId, 1, 100),
        enabled: !!currentId,
        staleTime: 30_000,
    });
    const products: any[] = useMemo(() => {
        const d: any = adsRaw;
        return d?.ads ?? d?.items ?? (Array.isArray(d) ? d : []);
    }, [adsRaw]);

    const { data: stats } = useQuery({
        queryKey: ['catalog-stats', currentId],
        queryFn: () => apiService.catalog.getStats(currentId),
        enabled: !!currentId,
        staleTime: 60_000,
    });

    const memberships = useMemo(
        () => (userArms ?? []).filter((m: any) => m?.catalogId === currentId),
        [userArms, currentId],
    );

    const uncatItems: any[] = useMemo(
        () => (uncatQ.data?.items ?? []).filter((u: any) => u.catalogId === currentId),
        [uncatQ.data, currentId],
    );
    // ─── عضویت تازه (۴۸ ساعت اول) — بنر جشن ───
    const freshMembership = useMemo(
        () => (memberships ?? []).find((m: any) =>
            m.roleType === 'seller' &&
            m.status === 'active' &&
            (m.publishState ?? (m.status === 'active' ? 'published' : null)) === 'published' &&
            Date.now() - new Date(m.joinedAt).getTime() < 48 * 60 * 60 * 1000,
        ),
        [memberships],
    );

    const salesTypeLocked = useMemo(
        () => products.length > 0 || memberships.some((m: any) => m.status === 'active'),
        [products, memberships],
    );

    const marketTree = useMemo<any[]>(() => {
        const m = (userArms ?? []).find((x: any) => x.slug === (uncatItems[0]?.armSlug) && x.status === 'active');
        return Array.isArray(m?.categoryTree) ? m.categoryTree : [];
    }, [userArms, uncatItems]);

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('filter') === 'uncat') {
            setTab('products');
            setStatusFilter('uncat');
            window.history.replaceState({}, '', '/my-catalogs');
        }
    }, []);

    const checklist = useMemo(() => ({
        hasName: !!currentCatalog?.name,
        hasSlug: !!currentCatalog?.slug,
        hasLogo: !!(currentCatalog?.logoUrl || currentCatalog?.logoFile?.path),
        hasDescription: !!currentCatalog?.shortDescription,
        hasPhone: !!currentCatalog?.phone,
        hasProducts: products.length > 0,
    }), [currentCatalog, products]);
    const isComplete = Object.values(checklist).every(Boolean);

    const completion = useMemo(() => {
        const items = [
            { key: 'name', label: 'نام کاتالوگ', ok: checklist.hasName, action: () => setCatalogEditOpen(true) },
            { key: 'slug', label: 'آدرس اختصاصی', ok: checklist.hasSlug, action: () => setCatalogEditOpen(true) },
            { key: 'logo', label: 'لوگو', ok: checklist.hasLogo, action: () => setCatalogEditOpen(true) },
            { key: 'desc', label: 'معرفی کوتاه', ok: checklist.hasDescription, action: () => setCatalogEditOpen(true) },
            { key: 'phone', label: 'شماره تماس', ok: checklist.hasPhone, action: () => setCatalogEditOpen(true) },
            { key: 'products', label: 'اولین محصول', ok: checklist.hasProducts, action: () => router.push(`/ad/create?catalog=${currentCatalog?.id}`) },
        ];
        const done = items.filter((i) => i.ok).length;
        return {
            items,
            percent: items.length ? Math.round((done / items.length) * 100) : 0,
            openItem: (key: string) => items.find((i) => i.key === key)?.action?.(),
        };
    }, [checklist, currentCatalog?.id, router]);

    // ─── آمار پروفایل کاربر (برای کارت پروفایل) ───
    const userAvatar = user?.avatarFile?.thumbnailPath || user?.avatarUrl;
    const userHasName = !!user?.fullName?.trim();
    const userHasAvatar = !!userAvatar;

    const counts = useMemo(() => ({
        all: products.length,
        table: products.filter((a) => a.status === 'active' && !isAdExpired(a) && inMarket(a) && !!a.armId).length,
        catalog: products.filter((a) => !inMarket(a)).length,
        stale: products.filter((a) => isAdExpired(a) && inMarket(a)).length,
        uncat: products.filter(isUncategorized).length,
    }), [products]);

    const filtered = useMemo(() => products.filter((ad) => {
        if (statusFilter === 'table') return ad.status === 'active' && !isAdExpired(ad) && inMarket(ad);
        if (statusFilter === 'catalog') return !inMarket(ad);
        if (statusFilter === 'stale') return isAdExpired(ad) && inMarket(ad);
        if (statusFilter === 'uncat') return isUncategorized(ad);
        return true;
    }), [products, statusFilter]);

    const refreshAll = () => {
        queryClient.invalidateQueries({ queryKey: ['catalogs'] });
        queryClient.invalidateQueries({ queryKey: ['catalog-products', currentId] });
        queryClient.invalidateQueries({ queryKey: ['catalog-stats', currentId] });
        queryClient.invalidateQueries({ queryKey: ['my-uncategorized'] });
        queryClient.invalidateQueries({ queryKey: ['vitrine'] });
        queryClient.invalidateQueries({ queryKey: ['businesses-entity'] });
    };

    const toggleMarket = async (ad: any) => {
        const next = !inMarket(ad);
        try {
            await apiService.ad.update(ad.id, { publishToMarket: next });
            toast.success(next
                ? 'کالا به تابلوی بازار اضافه شد (در صورت معتبر بودن قیمت)'
                : 'کالا از تابلوی بازار حذف شد — فقط در کاتالوگ شما دیده می‌شود');
            refreshAll();
        } catch (e: any) {
            toast.error(e?.message || 'خطا در تغییر وضعیت نمایش');
        }
    };

    const openCategoryModal = (ad: any) => {
        const m = (userArms ?? []).find((x: any) => x.slug === ad.armId);
        setCatModalTree(Array.isArray(m?.categoryTree) ? m.categoryTree : []);
        setCatModalArmName(m?.armName || m?.arm?.name || 'بازار');
        setCatModalAd(ad);
    };
    const [catModalTree, setCatModalTree] = useState<any[]>([]);
    const [catModalArmName, setCatModalArmName] = useState('');
    const setOwnCatMut = useSetOwnAdCategory();

    // ─── گارد بدون کاتالوگ ───
    if (!isLoading && catalogs.length === 0) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-2.5">
                    <h1 className="text-lg font-black text-on-surface flex items-center gap-1.5">
                        <BookOpen className="w-4.5 h-4.5 text-primary" /> کاتالوگ‌های من
                    </h1>
                </div>

                {hasTemporaryPassword && (
                    <button onClick={() => setPasswordOpen(true)}
                            className="w-full bg-error/5 border border-error/40 rounded-xl p-3 flex items-center gap-3 text-right hover:bg-error/10 transition-colors animate-pulse">
                        <Key className="w-4.5 h-4.5 text-error flex-shrink-0" />
                        <span className="text-xs text-on-surface flex-1">رمز عبور شما موقت است — <b className="text-error">همین حالا عوضش کن</b></span>
                    </button>
                )}

                <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/8 via-primary/5 to-transparent p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-base font-extrabold text-on-surface mb-1.5">کاتالوگ محصولاتت را بساز</h3>
                    <p className="text-xs text-on-surface-variant leading-6 max-w-sm mx-auto">
                        با عکس و قیمت، با لینک اختصاصی — چند دقیقه بیشتر وقت نمی‌گیرد.
                    </p>
                    <button onClick={() => router.push('/business/register')}
                            className="mt-4 h-11 px-7 rounded-xl bg-primary text-on-primary text-sm font-extrabold
                            hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all">
                        شروع کن — رایگان
                    </button>
                </div>

                <BusinessSetupModal
                    isOpen={bizModalOpen}
                    business={editBiz}
                    onClose={() => { setBizModalOpen(false); setEditBiz(null); }}
                    onSaved={() => bizQ.refetch()}
                />
                <ChangePasswordModal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)}
                                     onSuccess={() => dispatch(setUser({ ...user, temporaryPassword: false }))} />
            </div>
        );
    }

    if (!currentCatalog) {
        return <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" /></div>;
    }

    const FILTERS: readonly [StatusFilter, string][] = [
        ['all', `همه (${fmt(counts.all)})`],
        ['table', `روی تابلو (${fmt(counts.table)})`],
        ['catalog', `فقط کاتالوگ (${fmt(counts.catalog)})`],
        ['stale', `نیازمند قیمت تازه (${fmt(counts.stale)})`],
        ...(counts.uncat > 0 ? ([['uncat', `بی‌دسته در بازار (${fmt(counts.uncat)})`]] as const) : []),
    ];

    const SalesIcon = SALES_ICON[currentCatalog.salesType] || Store;
    const isService = currentCatalog.salesType === 'service';

    return (
        <div className="space-y-4">
            {/* ═══ هدر ═══ */}
            <div className="flex items-center justify-between">
                <h1 className="text-[14px] font-black text-on-surface flex items-center gap-1.5">
                    <BookOpen className="w-4.5 h-4.5 text-primary" /> کاتالوگ دیمت من
                </h1>
                <div className="flex items-center gap-2">
                    {catalogs.length > 1 && (
                        <CatalogSwitcher catalogs={catalogs} currentId={currentId}
                                         onSelect={(id: string) => { setCurrentId(id); setStatusFilter('all'); }} />
                    )}
                    <div className="relative">
                        <button onClick={() => setMenuOpen((o) => !o)} aria-label="گزینه‌های بیشتر"
                                className="w-9 h-9 rounded-full grid place-items-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
                            <Ellipsis />
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                                <div className="absolute top-full end-0 mt-1 z-50 w-52 p-1.5 rounded-2xl bg-white dark:bg-gray-900 border border-outline-variant/30 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                                    <button type="button" onClick={() => { setMenuOpen(false); router.push('/business/register'); }}
                                            className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-on-surface hover:bg-surface-container-high transition-colors">
                                        <Plus className="w-4 h-4 text-amber-500" /> کاتالوگ جدید
                                    </button>
                                    {currentCatalog.slug && (
                                        <button type="button" onClick={() => { setMenuOpen(false); setShareSlug(currentCatalog.slug); setShareName(currentCatalog.name); }}
                                                className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-on-surface hover:bg-surface-container-high transition-colors">
                                            <Share2 className="w-4 h-4 text-on-surface-variant" /> اشتراک‌گذاری کاتالوگ
                                        </button>
                                    )}
                                    <button type="button" onClick={() => { setMenuOpen(false); setPasswordOpen(true); }}
                                            className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-on-surface hover:bg-surface-container-high transition-colors">
                                        <Key className="w-4 h-4 text-on-surface-variant" /> تغییر رمز عبور
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ 🔴 هشدار رمز موقت ═══ */}
            {hasTemporaryPassword && (
                <div className="rounded-2xl border border-error/40 bg-error/5 overflow-hidden animate-pulse">
                    <button onClick={() => setPasswordOpen(true)}
                            className="w-full p-3 flex items-center gap-3 text-right hover:bg-error/10 transition-colors">
                        <Key className="w-4.5 h-4.5 text-error flex-shrink-0" />
                        <span className="text-xs text-on-surface flex-1">رمز عبور شما موقت است (۱۲۳۴۵۶) — <b className="text-error">همین حالا عوضش کن</b></span>
                        <span className="h-8 px-3 rounded-lg bg-error text-white text-[10px] font-bold flex items-center flex-shrink-0">تغییر رمز</span>
                    </button>
                    <div className="px-3 py-2 bg-error/[0.03] dark:bg-error/[0.06] border-t border-error/20 flex items-center gap-2">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-[10px] text-on-surface-variant leading-4">
                            حساب شما: <b className="text-on-surface" dir="ltr">{user?.phone}</b> — لطفاً چک کنید این شمارهٔ خودتان است
                        </span>
                    </div>
                </div>
            )}

            {/* ═══ ✅ کارت پروفایل کاربر — نام/آواتار (از ثبت‌نام نمی‌گیریم) ═══ */}
            {(!userHasName || !userHasAvatar) && (
                <button onClick={() => router.push('/profile')}
                        className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700
                        p-3.5 flex items-center gap-3 text-right hover:border-primary/40 transition-colors">
                    <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {userAvatar
                            ? <Image src={userAvatar} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                            : <UserPlus className="w-5 h-5 text-primary" />}
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-xs font-extrabold text-on-surface">
                            {userHasName ? 'عکس پروفایلت را بگذار' : 'نام و عکس پروفایلت را تکمیل کن'}
                        </span>
                        <span className="block text-[10px] text-on-surface-variant/70 mt-0.5">
                            مشتری‌ها در کاتالوگت به اسم و چهره اعتماد بیشتری می‌کنند
                        </span>
                    </span>
                    <span className="text-[10px] font-bold text-primary flex-shrink-0">تکمیل ←</span>
                </button>
            )}

            {/* ═══ کارت اصلی کاتالوگ ═══ */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4">
                <div className="flex items-start gap-3.5">
                    <button type="button" onClick={() => setCatalogEditOpen(true)} aria-label="ویرایش کاتالوگ"
                            className="relative w-18 h-18 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-primary/10 hover:ring-amber-500/40 transition-all flex items-center justify-center bg-gray-100 dark:bg-gray-800"
                    >
                        {(currentCatalog.logoFile?.path || currentCatalog.logoUrl)
                            ? <Image src={currentCatalog.logoFile?.path || currentCatalog.logoUrl} alt={currentCatalog.name} width={70} height={70} className="w-full h-full object-cover" unoptimized />
                            : <div className={"max-h-8"}>
                                <Camera className="w-6 h-6 text-gray-400" />
                                <span className={"text-[8px]"}>Logo</span>
                            </div>
                        }
                        <span className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity grid place-items-center">
                            <Pencil className="w-4 h-4 text-white" />
                        </span>
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="text-[15px] font-bold text-on-surface truncate">{currentCatalog.name}</p>
                            <button type="button" onClick={() => setCatalogEditOpen(true)} aria-label="ویرایش"
                                    className="w-6 h-6 rounded-full grid place-items-center text-on-surface-variant/60 hover:text-amber-600 hover:bg-amber-500/10 transition-colors flex-shrink-0">
                                <Pencil className="w-4 h-4" />
                            </button>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant flex-shrink-0">
                                <SalesIcon className="w-2.5 h-2.5" /> {SALES_LABEL[currentCatalog.salesType] || ''}
                            </span>
                        </div>
                        {currentCatalog.slug
                            ? <p className="text-[13px] text-on-surface-variant/60 mt-0.5 truncate" dir="ltr">{typeof window !== 'undefined' ? window.location.host : ''}/{currentCatalog.slug}</p>
                            : <p className="text-[10px] text-amber-600 mt-0.5">آدرس کاتالوگ تنظیم نشده — لمس لوگو</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-on-surface-variant flex-wrap">
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-blue-500/70" />{fmt(stats?.views)} بازدید</span>
                            <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5 text-amber-500/70" />{fmt(stats?.saves)} ذخیره</span>
                            <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-emerald-500/70" />{fmt(stats?.shares)} اشتراک</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3.5">
                    <button onClick={() => router.push(`/ad/create?catalog=${currentCatalog.id}`)}
                            className="h-9 px-3.5 rounded-xl bg-amber-500 text-white text-[10px] font-extrabold flex items-center gap-1.5 shadow-sm hover:bg-amber-600 active:scale-95 transition-all">
                        <Plus className="w-4 h-4" /> افزودن محصول
                    </button>
                    {currentCatalog.slug && (
                        <button onClick={() => router.push(`/${currentCatalog.slug}`)}
                                className="h-9 px-3.5 rounded-xl border border-outline-variant/60 text-[10px] font-bold text-on-surface flex items-center gap-1.5 hover:border-primary/40 hover:text-primary transition-colors">
                            <Eye className="w-4 h-4" /> مشاهده
                        </button>
                    )}
                </div>
            </div>
            {/* ═══ 🎉 بنر جشن عضویت تازه — ۴۸ ساعت اول ═══ */}
            {freshMembership && !celebrateDismissed && (
                <div className="rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-l
                    from-primary/15 via-primary/8 to-transparent relative">
                    <button onClick={() => setCelebrateDismissed(true)}
                            className="absolute top-2 left-2 w-6 h-6 rounded-full grid place-items-center
                                text-on-surface-variant/60 hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10">
                        <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-extrabold tracking-wider text-primary/80 uppercase">
                               تبریک
                            </span>
                        </div>
                        <h3 className="text-base font-black text-on-surface">
                             محصولات کاتالوگ شما در بازار  {freshMembership.armName || freshMembership.arm?.name}  قرار گرفت! 🎉
                        </h3>
                        <p className="text-xs text-on-surface-variant leading-6 mt-1.5 max-w-md">
                            حالا محصولات شما در کنار محصولات سایر فروشندگان در معرض دید هزاران خریدار قرار دارد و در صورت رعایت قوانین رشد در بازار، بازدید محصولات و در نتیجه فروش شما افزایش می یابد .
                            {uncatItems.length > 0
                                ? ' فقط یک قدم مانده: دسته‌بندی بازار را برای کالاهایت انتخاب کن تا در فیلترهای خریدارها پیدا شوی.'
                                : ' همه‌چیز آماده است — کالاهایت در فیلترهای بازار هم دیده می‌شوند.'}
                        </p>
                        <div className="flex items-center gap-2 mt-3.5">
                            {uncatItems.length > 0 && (
                                <button onClick={() => { setTab('products'); setStatusFilter('uncat'); }}
                                        className="h-10 px-5 rounded-xl bg-amber-500 text-white text-xs font-extrabold
                                            inline-flex items-center gap-1.5 hover:bg-amber-600 active:scale-95 transition-all shadow-sm">
                                    <Layers className="w-4 h-4" /> تنظیم دسته‌ها ({fmt(uncatItems.length)})
                                </button>
                            )}
                            <button onClick={() => router.push(`/${freshMembership.arm?.slug || freshMembership.slug}`)}
                                    className="h-10 px-5 rounded-xl border border-primary/40 text-primary text-xs font-extrabold
                                        inline-flex items-center gap-1.5 hover:bg-primary/5 active:scale-95 transition-all">
                                <Store className="w-4 h-4" /> دیدن تابلوی بازار
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ═══ کارت تکمیل — گسترده ═══ */}
            <CompletionCard percent={completion.percent} items={completion.items} onItem={completion.openItem} />

            {/* ═══ نوار بی‌دسته ═══ */}
            {uncatItems.length > 0 && (
                <button onClick={() => { setTab('products'); setStatusFilter('uncat'); }}
                        className="w-full bg-gradient-to-l from-amber-50 to-amber-50/40 dark:from-amber-900/15 dark:to-amber-900/5
                        border border-amber-300/60 dark:border-amber-800/50 rounded-2xl p-4
                        flex items-center gap-3.5 text-right hover:border-amber-400 transition-colors group">
                    <span className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-sm font-extrabold text-amber-800 dark:text-amber-300">
                            {fmt(uncatItems.length)} کالای تو در {uncatItems[0]?.armName || 'بازار'} دسته‌بندی نشده است
                        </span>
                        <span className="block text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-5">
                            در جستجو دیده می‌شوند ولی از فیلتر دسته‌بندی‌ها پیدا نمی‌شوند — دسته‌شان را مشخص کن
                        </span>
                    </span>
                    <span className="h-9 px-4 rounded-xl bg-amber-500 text-white text-[11px] font-extrabold inline-flex items-center flex-shrink-0 group-hover:bg-amber-600 transition-colors">
                        تنظیم دسته‌ها
                    </span>
                </button>
            )}

            {/* ═══ تب‌ها ═══ */}
            <div className="flex gap-1">
                {([['products', 'محصولات', Package], ['publish', 'انتشار', Globe], ['stats', 'آمار', Bookmark]] as const).map(([key, label, Icon]) => (
                    <button key={key} onClick={() => setTab(key as Tab)}
                            className={cn('flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold transition-colors',
                                tab === key ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high')}>
                        <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                ))}
            </div>

            {/* ═══ تب محصولات ═══ */}
            {tab === 'products' && (
                <div className="space-y-2.5">
                    {/* ✅ نوار نکته — دسته/واحد قبل از ورود کالاها */}
                    {/*{products.length === 0 && !isService && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-on-surface-variant leading-5">
                                <b className="text-on-surface">قبل از ورود کالاها:</b> از دو دکمهٔ
                                <button onClick={() => setCatModalOpen(true)}
                                        className="mx-1 text-primary font-bold underline underline-offset-2 inline-flex items-center gap-0.5">
                                    <BookOpen className="w-3 h-3" /> دسته‌بندی
                                </button>
                                و
                                <button onClick={() => setUnitModalOpen(true)}
                                        className="mx-1 text-primary font-bold underline underline-offset-2 inline-flex items-center gap-0.5">
                                    <Layers className="w-3 h-3" /> واحدها
                                </button>
                                گروه‌بندی و واحدهای کاتالوگت را بساز — اختیاری است اما ثبت کالا سریع‌تر و مرتب‌تر می‌شود.
                            </p>
                        </div>
                    )}*/}

                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                        {FILTERS.map(([k, label]) => (
                            <button key={k} onClick={() => setStatusFilter(k)}
                                    className={cn('h-8 px-3.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-colors',
                                        statusFilter === k ? 'bg-primary/10 border-primary/40 text-primary' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/30')}>
                                {label}
                            </button>
                        ))}
                        <span className="flex-1" />
                        {currentCatalog.salesType !== 'service' && (
                            <>
                                {/* ✅ دکمه‌های دسته/واحد — رنگ برند برای دیده‌شدن */}
                                <button onClick={() => setCatModalOpen(true)}
                                        title="دسته‌های کاتالوگ — گروه‌بندی کالاها"
                                        className="h-8 px-2.5 rounded-full border border-primary/40 bg-primary/5 text-primary
                                            hover:bg-primary/10 flex items-center gap-1 flex-shrink-0 transition-colors text-[10px] font-bold">
                                    <BookOpen className="w-3.5 h-3.5" /> دسته‌ها
                                </button>
                                <button onClick={() => setUnitModalOpen(true)}
                                        title="واحدهای کاتالوگ — کارتن، بسته و..."
                                        className="h-8 px-2.5 rounded-full border border-primary/40 bg-primary/5 text-primary
                                            hover:bg-primary/10 flex items-center gap-1 flex-shrink-0 transition-colors text-[10px] font-bold">
                                    <Layers className="w-3.5 h-3.5" /> واحدها
                                </button>
                            </>
                        )}
                    </div>

                    {adsLoading ? (
                        <div className="space-y-2.5">{[0, 1, 2].map((i) => <RowSkeleton key={i} />)}</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-10 rounded-2xl border border-dashed border-outline-variant/50">
                            <Package className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-2.5" />
                            <p className="text-sm text-on-surface-variant">
                                {isService ? ' خدمتی نیست' : ' محصولی نیست '}
                            </p>
                            <button onClick={() => router.push(`/ad/create?catalog=${currentCatalog.id}`)}
                                    className="mt-3 h-9 px-4 rounded-xl bg-amber-500 text-white text-xs font-extrabold">
                                {isService ? 'افزودن اولین خدمت' : 'افزودن اولین محصول'}
                            </button>
                        </div>
                    ) : (
                        filtered.map((ad) => {
                            const expired = isAdExpired(ad);
                            const market = inMarket(ad) && !!ad.armId;   // ✅ بدون عضویت، تابلو معنا ندارد
                            const onTable = ad.status === 'active' && !expired && market;
                            const uncat = isUncategorized(ad);
                            const unit = ad.unit?.title || ad.unit?.shortCode || '';
                            const hours = Math.ceil((new Date(ad.expiresAt).getTime() - Date.now()) / 36e5);
                            const armName = ad.arm?.name || 'بازار';
                            return (
                                <div key={ad.id}
                                     className={cn('rounded-xl border p-3 flex items-center gap-3 transition-colors',
                                         uncat ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-300/50 dark:border-amber-800/40'
                                             : onTable ? 'bg-white dark:bg-gray-900 border-outline-variant/40'
                                                 : expired ? 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/40'
                                                     : 'bg-surface-container-low/60 border-outline-variant/30 opacity-80')}>
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0 relative">
                                        {ad.files?.[0]?.thumbnailPath || ad.files?.[0]?.path ? (
                                            <Image src={ad.files[0].thumbnailPath || ad.files[0].path} alt="" fill sizes="48px" className="object-cover" unoptimized />
                                        ) : <Package className="w-5 h-5 text-on-surface-variant/40 m-auto absolute inset-0" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-on-surface truncate">{ad.productType || ad.title}</p>
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            {/* ✅ چیپس بازارهای فعال — لینک‌دار به صفحه بازار */}
                                            {ad.publications && ad.publications.length > 0 ? (
                                                ad.publications.map((pub: any) => (
                                                    <Link
                                                        key={pub.armId}
                                                        href={`/${pub.arm?.slug}`}
                                                        target="_blank"
                                                        title={`مشاهده در ${pub.arm?.name}`}
                                                        className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full transition-all hover:scale-105"
                                                        style={{
                                                            backgroundColor: (pub.arm?.colorPrimary || '#a11f2c') + '15',
                                                            color: pub.arm?.colorPrimary || '#a11f2c',
                                                        }}
                                                    >
                                                        <Store className="w-2.5 h-2.5" />
                                                        {pub.arm?.name}
                                                    </Link>
                                                ))
                                            ) : !market ? (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                    <EyeOff className="w-2.5 h-2.5" /> فقط کاتالوگ
                                                </span>
                                            ) : expired ? (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                                    <Clock className="w-2.5 h-2.5" /> نیازمند قیمت تازه
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">غیرفعال</span>
                                            )}
                                            {uncat && (
                                                <span title="این کالا در فیلترهای دسته‌بندی بازار پیدا نمی‌شود — لینک شکسته"
                                                      className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full
                                                          bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                                    <Unlink className="w-2.5 h-2.5" /> لینک دسته شکسته
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-extrabold text-primary mt-1">{fmt(ad.unitPrice)} <span className="text-[9px] font-normal text-on-surface-variant">تومان/{unit}</span></p>
                                    </div>
                                    {/* ✅ اکشن‌ها — سوییچ تابلو ته‌باکس، با نام بازار */}
                                    <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                                        {uncat && (
                                            <button onClick={() => openCategoryModal(ad)}
                                                    className="h-8 px-3 rounded-lg bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-transform">
                                                <Layers className="w-3 h-3" /> دسته بازار
                                            </button>
                                        )}
                                        {expired && market && (
                                            <button onClick={() => setRefreshAd(ad)}
                                                    className="h-8 px-3 rounded-lg bg-primary text-on-primary text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-transform">
                                                <RefreshCw className="w-3 h-3" /> تازه‌سازی
                                            </button>
                                        )}
                                        <button onClick={() => router.push(`/ad/edit/${ad.id}?catalog=${currentCatalog.id}`)}
                                                className="h-8 px-3 rounded-lg border border-outline-variant/50 text-[10px] font-bold text-on-surface-variant hover:text-primary hover:border-primary/40 flex items-center gap-1">
                                            <Pencil className="w-3 h-3" /> ویرایش
                                        </button>
                                        {/* ✅ دکمه مدیریت انتشار در بازارها — همیشه نشون داده می‌شه */}
                                        <button
                                            onClick={() => setPublishModalAd(ad)}
                                            title="مدیریت انتشار این آگهی در بازارها"
                                            className="h-8 px-3 rounded-lg border border-primary/40 bg-primary/5 text-[10px] font-bold text-primary hover:bg-primary/10 flex items-center gap-1 transition-colors"
                                        >
                                            <Store className="w-3 h-3" /> بازارها
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ═══ تب انتشار ═══ */}
            {tab === 'publish' && (
                <div className="space-y-3">
                    <button onClick={() => { setShareSlug(currentCatalog.slug); setShareName(currentCatalog.name); }}
                            className="w-full bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/25 rounded-2xl p-4 flex items-center gap-3.5 text-right hover:border-primary/50 transition-colors">
                        <span className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0"><Share2 className="w-5 h-5 text-primary" /></span>
                        <span className="flex-1 min-w-0">
                            <span className="block text-sm font-extrabold text-primary">کیت اشتراک‌گذاری کاتالوگ</span>
                            <span className="block text-[11px] text-on-surface-variant mt-0.5">لینک + پیام آماده + QR چاپی</span>
                        </span>
                    </button>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4">
                        <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-on-surface mb-1"><Globe className="w-4 h-4 text-primary" /> انتشار در بازارها</h3>
                        <p className="text-[11px] text-on-surface-variant leading-6 mb-3">با انتشار، کالاهای دارای قیمت معتبر در تابلوی قیمت بازار هم نمایش داده می‌شوند.</p>
                        {memberships.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-outline-variant/50 p-4 text-center">
                                <p className="text-xs text-on-surface-variant leading-6">این کاتالوگ هنوز عضو هیچ بازاری نیست.<br />وقتی مدیر بازار کاتالوگت را عضو کند، اینجا فعال می‌شود.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {memberships.map((m: any) => {
                                    const effectiveState = m.publishState ?? (m.status === 'active' ? 'published' : null);
                                    const chip = PUB_CHIP[effectiveState ?? m.status] ?? PUB_CHIP.paused;
                                    const isOn = effectiveState === 'published';
                                    return (
                                        <div key={m.slug} className="rounded-xl border border-outline-variant/40 p-3 flex items-center gap-3">
                                            <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0', chip.cls)}>
                                                <chip.icon className="w-3 h-3" /> {chip.label}
                                            </span>
                                            <span className="text-xs font-bold text-on-surface flex-1 min-w-0 truncate">{m.armName || m.arm?.name || m.slug}</span>
                                            {m.status === 'pending' ? (
                                                <span className="text-[10px] text-amber-600 font-bold flex-shrink-0">⏳ تایید مدیر</span>
                                            ) : m.status === 'paused' && m.publishState !== 'published' ? (
                                                <span className="text-[10px] font-bold text-amber-600 flex-shrink-0">عضویت متوقف شده</span>
                                            ) : (
                                                <button onClick={async () => {
                                                    try {
                                                        await apiService.arm.toggleCatalogPublish(m.slug, { catalogId: currentCatalog.id, published: !isOn });
                                                        toast.success(!isOn ? `منتشر شد در ${m.armName || m.name}` : 'انتشار خاموش شد');
                                                        queryClient.invalidateQueries({ queryKey: ['arms'] });
                                                        queryClient.invalidateQueries({ queryKey: ['notifications-derived'] });
                                                        refreshAll();
                                                    } catch (e: any) { toast.error(e?.data?.message || 'خطا'); }
                                                }}
                                                        className={cn('relative w-11 h-6 rounded-full transition-colors flex-shrink-0', isOn ? 'bg-primary' : 'bg-outline-variant/50')}>
                                                    <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', isOn ? 'right-0.5' : 'right-[1.375rem]')} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button onClick={() => setVerifyOpen(true)}
                            className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 flex items-center gap-3.5 text-right hover:border-primary/40 transition-colors">
                        <span className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0"><ShieldCheck className="w-5 h-5 text-on-surface-variant" /></span>
                        <span className="flex-1">
                            <span className="block text-sm font-bold text-on-surface">تیک اعتماد کسب‌وکار</span>
                            <span className="block text-[11px] text-on-surface-variant mt-0.5">
                                {currentCatalog.verificationStatus === 'approved' ? 'تایید شده' : 'با ارسال مدارک، نشان اعتماد بگیر'}
                            </span>
                        </span>
                    </button>

                    <button onClick={() => setCatalogEditOpen(true)}
                            className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 flex items-center gap-3.5 text-right hover:border-primary/40 transition-colors">
                        <span className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0"><Settings2 className="w-5 h-5 text-on-surface-variant" /></span>
                        <span className="flex-1">
                            <span className="block text-sm font-bold text-on-surface">ویرایش اطلاعات کاتالوگ</span>
                            <span className="block text-[11px] text-on-surface-variant mt-0.5">نام، لوگو، آدرس، صنف و تماس</span>
                        </span>
                    </button>
                </div>
            )}

            {/* ═══ تب آمار ═══ */}
            {tab === 'stats' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                            { icon: Eye, value: stats?.views, label: 'بازدید', cls: 'text-blue-500' },
                            { icon: Bookmark, value: stats?.saves, label: 'ذخیره', cls: 'text-amber-500' },
                            { icon: Share2, value: stats?.shares, label: 'اشتراک', cls: 'text-emerald-500' },
                            { icon: Package, value: products.length, label: 'محصول', cls: 'text-purple-500' },
                        ].map((s) => (
                            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 p-4 text-center">
                                <s.icon className={cn('w-5 h-5 mx-auto mb-1.5', s.cls)} />
                                <p className="text-xl font-extrabold text-on-surface">{fmt(s.value)}</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    <CreditsCard balance={creditBalance?.balance} />

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 p-4">
                        <h3 className="text-xs font-extrabold text-on-surface flex items-center gap-1.5 mb-3">
                            <Bookmark className="w-3.5 h-3.5 text-amber-500" /> چه کسانی کاتالوگت را ذخیره کرده‌اند
                            <span className="text-on-surface-variant/60">({fmt(stats?.savedBy?.length)})</span>
                        </h3>
                        {!stats?.savedBy?.length ? (
                            <p className="text-[11px] text-on-surface-variant/70 text-center py-4">هنوز کسی ذخیره نکرده — کیت اشتراک‌گذاری را امتحان کن</p>
                        ) : (
                            <div className="space-y-2">
                                {stats.savedBy.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-surface-container-high grid place-items-center overflow-hidden flex-shrink-0">
                                            {item.user?.avatarUrl ? <Image src={item.user.avatarUrl} alt="" width={32} height={32} className="object-cover" unoptimized /> : <UserIcon className="w-4 h-4 text-on-surface-variant/50" />}
                                        </div>
                                        <span className="text-xs font-bold text-on-surface truncate flex-1">{item.user?.fullName || 'کاربر'}</span>
                                        <span className="text-[10px] text-on-surface-variant/60">{new Date(item.savedAt).toLocaleDateString('fa-IR')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ مدال تعیین دستهٔ بازاری ═══ */}
            {catModalAd && (
                <div className="fixed inset-0 z-[95] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
                     onClick={() => setCatModalAd(null)}>
                    <div onClick={(e) => e.stopPropagation()}
                         className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl min-h-[60dvh] max-h-[90dvh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
                        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                            <div className="flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <Layers className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                                </span>
                                <div>
                                    <h3 className="text-sm font-extrabold text-on-surface">دسته‌بندی در بازار</h3>
                                    <p className="text-[10px] text-on-surface-variant/70 truncate max-w-[220px]">{catModalAd.productType || catModalAd.title}</p>
                                </div>
                            </div>
                            <button onClick={() => setCatModalAd(null)} aria-label="بستن"
                                    className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-4">
                            <div className="rounded-xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-300/40 dark:border-amber-800/40 p-3">
                                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-6">
                                    این دسته تعیین می‌کند کالای تو در کدام شاخهٔ <b>تابلوی قیمت {catModalArmName}</b> دیده شود —
                                    خریدارها از فیلتر همین دسته‌ها به تو می‌رسند.
                                </p>
                            </div>
                            {catModalTree.length === 0 ? (
                                <div className="rounded-xl border border-amber-300/50 bg-amber-50/60 dark:bg-amber-900/10 p-4 text-center">
                                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">درخت دسته‌بندی بازار هنوز ساخته نشده</p>
                                </div>
                            ) : (
                                <CategoryPicker
                                    value=""
                                    onChange={(categoryId: string) => {
                                        if (!categoryId) return;
                                        setOwnCatMut.mutate(
                                            { adId: catModalAd.id, categoryId },
                                            { onSuccess: () => { refreshAll(); setCatModalAd(null); } },
                                        );
                                    }}
                                    tree={catModalTree}
                                    disabled={setOwnCatMut.isPending}
                                />
                            )}
                        </div>
                        <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20">
                            <button onClick={() => setCatModalAd(null)}
                                    className="w-full h-10 rounded-xl border border-outline-variant/60 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">
                                بعداً انجام می‌دهم
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ مودال‌ها ═══ */}
            {/* ✅ key — تا مودال همیشه با دادهٔ تازه remount شود (فیکس «فیلدها پر نمی‌شوند») */}
            <CatalogEditModal
                key={`edit-${currentCatalog.id}-${catalogEditOpen}`}
                isOpen={catalogEditOpen}
                onClose={() => setCatalogEditOpen(false)}
                catalog={currentCatalog}
                salesTypeLocked={salesTypeLocked}
                onSaved={refreshAll}
            />
            <UnitSettingsModal isOpen={unitModalOpen} onClose={() => setUnitModalOpen(false)}
                               catalogId={currentCatalog.id} initialUnits={localUnitSettings}
                               onSaved={(units: any[]) => { setLocalUnitSettings(units); refreshAll(); }} />
            <CategorySettingsModal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)}
                                   catalogId={currentCatalog.id} initialTree={localCatTree}
                                   onSaved={(tree: any[]) => { setLocalCatTree(tree); refreshAll(); }} />
            <ShareKitModal open={!!shareSlug} onClose={() => setShareSlug(null)} catalogName={shareName} slug={shareSlug ?? undefined} />
            <ChangePasswordModal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)}
                                 onSuccess={() => dispatch(setUser({ ...user, temporaryPassword: false }))} />
            <VerificationModal isOpen={verifyOpen} onClose={() => setVerifyOpen(false)}
                               businessId={currentCatalog.businessId} businessName={currentCatalog.name}
                               currentLevel={currentCatalog.verificationTier || 'none'} isProfileComplete={isComplete}
                               onSuccess={() => { toast.success('مدارک ارسال شد'); refreshAll(); }} />
            {refreshAd && (
                <RefreshModal isOpen={!!refreshAd} onClose={() => setRefreshAd(null)} ad={refreshAd}
                              onSuccess={() => { setRefreshAd(null); refreshAll(); }} />
            )}
            <BusinessSetupModal
                isOpen={bizModalOpen}
                business={editBiz}
                onClose={() => { setBizModalOpen(false); setEditBiz(null); }}
                onSaved={() => bizQ.refetch()}
            />
            <PublishToMarketModal
                isOpen={!!publishModalAd}
                onClose={() => setPublishModalAd(null)}
                ad={publishModalAd}
                onPublished={() => refreshAll()}
            />
        </div>
    );
}

function CatalogSwitcher({ catalogs, currentId, onSelect }: any) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const current = catalogs.find((c: any) => c.id === currentId) ?? catalogs[0];

    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen((o) => !o)}
                    className="h-9 px-3 rounded-xl bg-surface-container-high/60 dark:bg-gray-800
                        text-xs font-bold text-on-surface flex items-center gap-1.5 max-w-[180px]
                        hover:bg-surface-container-high transition-colors">
                <LibraryBig className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="truncate">{current?.name}</span>
                <ChevronLeft className={cn('w-3.5 h-3.5 text-on-surface-variant/60 rotate-[-90deg] transition-transform', open && 'rotate-90')} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full end-0 mt-1 z-50 w-64 p-1.5 rounded-2xl bg-white dark:bg-gray-900
                        border border-outline-variant/30 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        {catalogs.map((c: any) => {
                            const isActive = c.id === currentId;
                            return (
                                <button key={c.id} type="button"
                                        onClick={() => { setOpen(false); if (!isActive) onSelect(c.id); }}
                                        className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors text-right',
                                            isActive ? 'bg-primary/5' : 'hover:bg-surface-container-high')}>
                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0 flex items-center justify-center">
                                        {(c.logoFile?.path || c.logoUrl)
                                            ? <Image src={c.logoFile?.path || c.logoUrl} alt="" width={32} height={32} className="object-cover" unoptimized />
                                            : <LibraryBig className="w-4 h-4 text-primary" />}
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                        <p className={cn('text-xs font-bold truncate', isActive ? 'text-primary' : 'text-on-surface')}>{c.name}</p>
                                        {c.slug && <p className="text-[9px] text-on-surface-variant/50 truncate" dir="ltr">/{c.slug}</p>}
                                    </div>
                                    {isActive && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                                </button>
                            );
                        })}
                        <div className="border-t border-outline-variant/20 mt-1 pt-1">
                            <button type="button" onClick={() => router.push('/business/register')}
                                    className="w-full flex items-center gap-2.5 h-9 px-3 rounded-xl text-[12px]
                                        text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                                <Plus className="w-3.5 h-3.5" /> کاتالوگ جدید
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
/* ─── کارت تکمیل — همان قبلی ─── */
function CompletionCard({ percent, items, onItem }: {
    percent: number;
    items: { key: string; label: string; ok: boolean }[];
    onItem: (key: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const safeItems = items ?? [];
    const isComplete = percent === 100;

    if (isComplete) {
        return (
            <div className="rounded-2xl border border-emerald-300/50 bg-gradient-to-l from-emerald-50/80 to-emerald-50/30
                dark:from-emerald-900/15 dark:to-emerald-900/5 dark:border-emerald-800/50
                px-4 py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-emerald-500 grid place-items-center flex-shrink-0 shadow-sm shadow-emerald-500/30">
                    <BadgeCheck className="w-4.5 h-4.5 text-white" />
                </span>
                <p className="flex-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                    کاتالوگت کامل است ✓ — آمادهٔ دیده‌شدن و اعتماد گرفتن
                </p>
            </div>
        );
    }

    const ringColor = percent >= 70 ? 'text-emerald-500' : percent >= 40 ? 'text-amber-500' : 'text-error';
    const missing = safeItems.filter((i) => !i.ok);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 overflow-hidden">
            <button type="button" onClick={() => setExpanded((o) => !o)}
                    className="w-full p-4 flex items-center gap-3.5 text-right hover:bg-surface-container-low/50 transition-colors">
                <span className="relative w-12 h-12 flex-shrink-0 grid place-items-center">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-outline-variant/30" strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="15.5" fill="none"
                                className={cn('stroke-current transition-all duration-700', ringColor)}
                                strokeWidth="3.5" strokeDasharray={`${percent} 100`} strokeLinecap="round" />
                    </svg>
                    <span className={cn('absolute text-[11px] font-black', ringColor)}>{percent}٪</span>
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-sm font-extrabold text-on-surface">کاتالوگت را کامل کن</span>
                    <span className="block text-[11px] text-on-surface-variant/70 mt-0.5">
                        {missing.length.toLocaleString('fa-IR')} مورد مانده — کاتالوگ کامل = اعتماد بیشتر مشتری
                        <span className="text-primary font-bold"> · {expanded ? 'بستن' : 'ببین چی کم است'}</span>
                    </span>
                </span>
                <ChevronDown className={cn('w-4 h-4 text-on-surface-variant/40 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-1.5 border-t border-outline-variant/20 pt-3">
                    {safeItems.map((item) => (
                        <button key={item.key} type="button"
                                onClick={() => !item.ok && onItem(item.key)}
                                disabled={item.ok}
                                className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-right transition-colors',
                                    item.ok ? 'opacity-60 cursor-default' : 'hover:bg-surface-container-high active:scale-[0.99]')}>
                            <span className={cn('w-5 h-5 rounded-full grid place-items-center flex-shrink-0',
                                item.ok ? 'bg-emerald-500' : 'border-2 border-outline-variant/50')}>
                                {item.ok && <BadgeCheck className="w-3.5 h-3.5 text-white" />}
                            </span>
                            <span className={cn('flex-1 text-xs font-bold',
                                item.ok ? 'text-on-surface-variant/60 line-through' : 'text-on-surface')}>
                                {item.label}
                            </span>
                            {!item.ok && (
                                <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                                    تکمیل <ChevronLeft className="w-3 h-3" />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   CatalogEditModal — ویرایش کاتالوگ (salesType-aware)
   ✅ با key remount می‌شود → همیشه با دادهٔ تازه initialize
   ═══════════════════════════════════════════════════════════ */
function CatalogEditModal({ isOpen, onClose, catalog, salesTypeLocked, onSaved }: {
    isOpen: boolean;
    onClose: () => void;
    catalog: any;
    salesTypeLocked: boolean;
    onSaved?: () => void;
}) {
    const queryClient = useQueryClient();
    const uploadMutation = useUploadFile();
    const updateCatalogMutation = useUpdateCatalog();
    const updateBusinessMutation = useUpdateBusinessEntity();
    const { user } = useSelector((s: RootState) => s.auth);

    const isService = catalog?.salesType === 'service';
    const typeLabel = SALES_LABEL[catalog?.salesType] || 'فروش';
    const SalesIcon = SALES_ICON[catalog?.salesType] || Store;

    // ✅ business data
    const biz = catalog?.business || {};
    const bizPhone = biz?.phone || user?.phone || '';
    const bizId = biz?.id;

    const [name, setName] = useState(catalog?.name || '');
    const [slug, setSlug] = useState(catalog?.slug || '');
    const [industry, setIndustry] = useState<{ id: string | null; title: string }>({
        id: biz?.industryId || null,
        title: biz?.industryName || '',
    });
    const [shortDescription, setShortDescription] = useState(catalog?.shortDescription || '');
    const [phone, setPhone] = useState(catalog?.phone || bizPhone);
    const [website, setWebsite] = useState(catalog?.website || '');
    const [logoUrl, setLogoUrl] = useState(biz?.logoUrl || catalog?.logoUrl || '');

    // ✅ فیلدهای Business — برای ویرایش کامل
    const [bizType, setBizType] = useState<string>(biz?.type || 'wholesaler');
    // ✅ businessRole + businessSector (دو سطحی)
    const [businessSector, setBusinessSector] = useState<string>(biz?.businessSector || '');
    const [businessRole, setBusinessRole] = useState<string>(biz?.businessRole || '');
    const [provinceCode, setProvinceCode] = useState<string>(biz?.provinceCode || '');
    const [provinceLabel, setProvinceLabel] = useState<string>(biz?.province || '');
    const [cityCode, setCityCode] = useState<string>(biz?.cityCode || '');
    const [cityLabel, setCityLabel] = useState<string>(biz?.city || '');
    const [address, setAddress] = useState<string>(biz?.address || '');
    const [description, setDescription] = useState<string>(biz?.description || catalog?.description || '');

    const [slugEditing, setSlugEditing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [savedTick, setSavedTick] = useState(false);
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const uploadedLogoRef = useRef<{ id: string } | null>(null);

    useEffect(() => {
        if (!pendingLogoFile) { setLogoPreview(null); return; }
        const url = URL.createObjectURL(pendingLogoFile);
        setLogoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingLogoFile]);

    const dirty = useMemo(() => {
        if (!catalog) return false;
        return (
            name !== (catalog.name || '') ||
            slug !== (catalog.slug || '') ||
            industry.title !== (biz?.industryName || '') ||
            shortDescription !== (catalog.shortDescription || '') ||
            phone !== (catalog.phone || bizPhone) ||
            website !== (catalog.website || '') ||
            !!pendingLogoFile ||
            // ✅ فیلدهای business
            bizType !== (biz?.type || 'wholesaler') ||
            businessSector !== (biz?.businessSector || '') ||
            businessRole !== (biz?.businessRole || '') ||
            provinceCode !== (biz?.provinceCode || '') ||
            cityCode !== (biz?.cityCode || '') ||
            address !== (biz?.address || '') ||
            description !== (biz?.description || catalog?.description || '')
        );
    }, [catalog, name, slug, industry, shortDescription, phone, website, pendingLogoFile, bizPhone, biz,
        bizType, businessSector, businessRole, provinceCode, cityCode, address, description]);

    const uploadLogo = async (): Promise<string | undefined> => {
        if (!pendingLogoFile) return undefined;
        if (uploadedLogoRef.current) return uploadedLogoRef.current.id;
        try {
            // ✅ لوگو رو روی Business آپلود کن
            const result = await uploadMutation.mutateAsync({
                file: pendingLogoFile,
                model: 'Business',
                modelId: bizId || catalog.id,
                fieldKey: 'logo',
            });
            uploadedLogoRef.current = { id: result.id };
            setLogoUrl(result.path || result.thumbnailPath || '');
            setPendingLogoFile(null);
            return result.id;
        } catch (err: any) {
            toast.error(err?.message || 'خطا در آپلود لوگو');
            throw err;
        }
    };

    const handleSave = async () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'نام کاتالوگ الزامی است';
        if (slug && slug.length < 3) e.slug = 'لینک حداقل ۳ حرف است';
        if (slug && slug !== catalog.slug) {
            const check = await apiService.catalog.checkSlug(slug, catalog.id);
            if (!check.available) {
                e.slug = check.reason === 'reserved' ? 'reserved' : 'taken';
            }
        }
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        try {
            const logoFileId = await uploadLogo();

            // ✅ ۱. آپدیت Business (صنف + لوگو + موقعیت + آدرس + سایر فیلدها)
            if (bizId) {
                const bizUpdate: any = {
                    industryName: industry.title.trim() || undefined,
                    industryId: industry.id,
                    type: bizType,
                    // ✅ فیلدهای جدید دو سطحی
                    businessRole: businessRole || undefined,
                    businessSector: businessSector || undefined,
                    phone: phone.trim() || undefined,
                    // ✅ موقعیت
                    province: provinceLabel || undefined,
                    provinceCode: provinceCode || undefined,
                    city: cityLabel || undefined,
                    cityCode: cityCode || undefined,
                    address: address.trim() || undefined,
                    // ✅ سایر فیلدهای مهم
                    description: description.trim() || undefined,
                };
                if (logoFileId) bizUpdate.logoUrl = logoUrl;

                await updateBusinessMutation.mutateAsync({
                    id: bizId,
                    data: bizUpdate,
                });
            }

            // ✅ ۲. آپدیت Catalog (نام + slug + معرفی + تماس + وب)
            await updateCatalogMutation.mutateAsync({
                id: catalog.id,
                data: {
                    name: name.trim(),
                    slug: slug || undefined,
                    shortDescription: shortDescription.trim() || undefined,
                    phone: phone.trim() || undefined,
                    website: website.trim() || undefined,
                    // ✅ لوگو رو هم در catalog کپی کن (برای نمایش سریع)
                    ...(logoFileId ? { logoUrl } : {}),
                },
            });

            queryClient.invalidateQueries({ queryKey: ['catalogs'] });
            queryClient.invalidateQueries({ queryKey: ['catalog', 'by-slug'] });
            queryClient.invalidateQueries({ queryKey: ['businesses-entity'] });
            onSaved?.();

            setSavedTick(true);
            setTimeout(() => onClose(), 450);
        } catch (err: any) {
            if (err?.data?.errorCode === 'SLUG_TAKEN') { setErrors((p) => ({ ...p, slug: 'taken' })); toast.error('این لینک قبلاً گرفته شده'); }
            else if (err?.data?.errorCode === 'SLUG_RESERVED') { setErrors((p) => ({ ...p, slug: 'reserved' })); toast.error('این لینک قابل انتخاب نیست'); }
            else toast.error(err?.message || 'خطا در ذخیره');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !catalog) return null;

    const inputCls = (err?: string) => cn(
        'w-full h-11 px-3.5 text-sm text-right rounded bg-surface-container-lowest border',
        'focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
        err ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
    );
    const SectionTitle = ({ icon: Icon, text }: any) => (
        <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 mb-2">
            <Icon className="w-3.5 h-3.5 text-amber-500" /> {text}
        </p>
    );
    const buttonState = uploadMutation.isPending ? 'uploading' : saving ? 'saving' : savedTick ? 'saved' : 'idle';

    return (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
             onClick={() => !saving && onClose()}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl
                     min-h-[60dvh] max-h-[92dvh] flex flex-col overflow-hidden
                     animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <BookOpen className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                        </span>
                        <div>
                            <h3 className="text-sm font-extrabold text-on-surface">ویرایش کاتالوگ</h3>
                            <p className="text-[10px] text-on-surface-variant/70 flex items-center gap-1">
                                <SalesIcon className="w-3 h-3" /> {typeLabel}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => !saving && onClose()} aria-label="بستن"
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-4">

                    {/* ═══ لوگو + نام ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <div className="flex items-center gap-4">
                            {/* ✅ آپلود لوگو — با آیکون دوربین و واضح‌تر */}
                            <label className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0
                                border-2 border-dashed border-primary/30
                                hover:border-primary/60 hover:bg-primary/5 transition-all group cursor-pointer
                                flex flex-col items-center justify-center gap-1">
                                {logoPreview || logoUrl ? (
                                    <img src={(logoPreview || logoUrl) as string} alt="لوگو" className="w-full h-full object-cover absolute inset-0" />
                                ) : (
                                    <>
                                        <Camera className="w-7 h-7 text-primary/60 group-hover:text-primary transition-colors" />
                                        <span className="text-[9px] font-bold text-primary/60 group-hover:text-primary transition-colors text-center px-1">
                                            آپلود لوگو
                                        </span>
                                    </>
                                )}
                                <input type="file" accept="image/*" className="hidden"
                                       onChange={(e) => { setPendingLogoFile(e.target.files?.[0] ?? null); e.target.value = ''; }} />
                                {/* overlay موقع hover */}
                                {(logoPreview || logoUrl) && (
                                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                        <Camera className="w-5 h-5 text-white" />
                                        <span className="text-[8px] font-bold text-white">تغییر لوگو</span>
                                    </span>
                                )}
                            </label>
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-medium text-on-surface block">
                                    نام کاتالوگ <span className="text-primary">*</span>
                                </label>
                                <input type="text" value={name}
                                       onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
                                       className={inputCls(errors.name)} />
                                {errors.name && <p className="text-error text-[11px]">{errors.name}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded bg-surface-container-high/50 px-3 py-2">
                            <SalesIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span className="text-[11px] font-bold text-on-surface flex-1">{typeLabel}</span>
                            {salesTypeLocked && (
                                <span className="text-[9px] text-on-surface-variant/60">قابل تغییر نیست</span>
                            )}
                        </div>
                    </section>

                    {/* ═══ صنف (با autocomplete) ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-1.5">
                        <SectionTitle icon={Building2} text="صنف / زمینه فعالیت" />
                        <IndustryAutocomplete
                            value={industry}
                            onChange={setIndustry}
                            placeholder="مثلا: پخش مواد غذایی، سوپرمارکت..."
                        />
                    </section>

                    {/* ═══ نوع کسب‌وکار (دو سطحی) ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2">
                        <SectionTitle icon={Layers} text="نوع کسب‌وکار" />
                        <BusinessTypeSelector
                            sector={businessSector}
                            role={businessRole}
                            onSectorChange={setBusinessSector}
                            onRoleChange={setBusinessRole}
                            required
                        />
                    </section>

                    {/* ═══ موقعیت (استان/شهر/آدرس) ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <SectionTitle icon={MapPin} text="موقعیت و آدرس" />
                        <IranLocationSelector
                            provinceCode={provinceCode}
                            cityCode={cityCode}
                            onProvinceChange={(code, label) => {
                                setProvinceCode(code);
                                setProvinceLabel(label);
                                setCityCode('');
                                setCityLabel('');
                            }}
                            onCityChange={(code, label) => {
                                setCityCode(code);
                                setCityLabel(label);
                            }}
                        />
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">آدرس کسب و کار (اختیاری)</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={2}
                                placeholder="خیابان، کوچه، پلاک..."
                                className={cn(inputCls(), 'h-auto py-2 resize-none')}
                            />
                        </div>
                    </section>

                    {/* ═══ معرفی کامل ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <SectionTitle icon={Settings2} text="معرفی و توضیحات" />
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">معرفی کوتاه</label>
                            <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)}
                                   maxLength={120}
                                   placeholder={isService ? 'مثلاً: خدمات حسابداری و مشاوره مالیاتی' : 'مثلاً: تولید و پخش انواع بلوک سیمانی'}
                                   className={inputCls()} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">توضیحات کامل</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="تاریخچه، خدمات، محصولات، توانمندی‌ها..."
                                className={cn(inputCls(), 'h-auto py-2 resize-none')}
                            />
                        </div>
                    </section>

                    {/* ═══ تماس ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <SectionTitle icon={Phone} text="اطلاعات تماس" />
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">شماره تماس (های) پشتیبانی مشتری</label>
                            <input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)}
                                   placeholder="0912..." className={cn(inputCls(), 'text-left')} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">وب‌سایت (اختیاری)</label>
                            <input type="url" dir="ltr" value={website} onChange={(e) => setWebsite(e.target.value)}
                                   placeholder="example.com" className={cn(inputCls(), 'text-left')} />
                        </div>
                    </section>

                    {/* ═══ لینک کاتالوگ (آخر) ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4">
                        <SectionTitle icon={Globe} text="لینک کاتالوگ" />

                        {!slugEditing ? (
                            <div className="flex items-center justify-between gap-2">
                                {catalog.slug ? (
                                    <span dir="ltr" className="text-[13px] font-bold text-on-surface truncate">
                                        daymat.ir/<span className="text-primary">{catalog.slug}</span>
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-amber-600">لینک تنظیم نشده</span>
                                )}
                                <button type="button" onClick={() => setSlugEditing(true)}
                                        aria-label="ویرایش لینک کاتالوگ"
                                        className="w-8 h-8 rounded-full bg-surface-container-high/50 grid place-items-center
                                            text-on-surface-variant hover:text-amber-600 hover:bg-amber-500/10 transition-colors flex-shrink-0">
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <SlugEditor
                                    value={slug}
                                    onChange={setSlug}
                                    excludeId={catalog.id}
                                />
                                {catalog.slug && (
                                    <div className="rounded bg-amber-50 dark:bg-amber-900/15 border border-amber-200/70 dark:border-amber-800/50 p-2.5 flex items-start gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-5">
                                            اگر لینک کاتالوگ را عوض کنی، کسانی که آدرس قبلی را دارند و ذخیره‌اش نکرده‌اند دیگر پیدایت نمی‌کنند.
                                        </p>
                                    </div>
                                )}
                                <button type="button" onClick={() => { setSlug(catalog.slug || ''); setSlugEditing(false); }}
                                        className="w-full h-9 rounded-lg border border-outline-variant/60 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">
                                    انصراف
                                </button>
                            </div>
                        )}
                        {errors.slug && !slugEditing && (
                            <p className="text-[10px] text-error mt-1.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> مشکل در لینک — دوباره ویرایشش کن
                            </p>
                        )}
                    </section>
                </div>

                <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20">
                    <button onClick={handleSave} disabled={saving || uploadMutation.isPending || !dirty}
                            className={cn('w-full h-11 rounded-lg text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                                savedTick ? 'bg-emerald-500 text-white' : 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm',
                                'disabled:opacity-50')}>
                        {buttonState === 'uploading' && <><Loader2 className="w-4 h-4 animate-spin" /> در حال آپلود…</>}
                        {buttonState === 'saving' && <><Loader2 className="w-4 h-4 animate-spin" /> در حال ذخیره…</>}
                        {buttonState === 'saved' && <><Check className="w-4 h-4" /> ذخیره شد</>}
                        {buttonState === 'idle' && 'ذخیره تغییرات'}
                    </button>
                </div>
            </div>
        </div>
    );
}