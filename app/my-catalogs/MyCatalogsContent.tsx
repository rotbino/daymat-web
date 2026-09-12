// app/my-catalogs/MyCatalogsContent.tsx
// ارکستراتور صفحهٔ «مدیریت کاتالوگ» — نسخهٔ تب‌محور (ترند روز):
//   مشخصات | محصولات | آمار | انتشار — هر بخش در تب خودش، خلوت و متمرکز
// توسعه‌پذیر: امکان جدید (مثل سفارشات) = فقط یک آیتم جدید در tabItems
// ⚠️ قانون: حالت تاریک همیشه چک شده
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setUser } from '@/lib/store/slices/authSlice';
import { setCurrentCatalog } from '@/lib/store/slices/catalogSlice';
import { apiService } from '@/lib/api/apiService';
import {
    useArms, useMyUncategorized, useSetOwnAdCategory,
} from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BarChart3, Globe, IdCard, Loader2, Package, Users } from 'lucide-react';

import UnitSettingsModal from '@/app/ad/components/UnitSettingsModal';
import CategorySettingsModal from '@/app/ad/components/CategorySettingsModal';
import ShareKitModal from '@/components/profile/ShareKitModal';
import VisitCardModal from '@/components/profile/VisitCardModal';
import { RefreshModal } from '@/app/ad/RefreshModal';
import { ChangePasswordModal } from '@/components/register/ChangePasswordModal';
import { VerificationModal } from '@/app/business/VerificationModal';

import { StatusFilter, Tab } from './constants';
import EmptyCatalogState from './components/EmptyCatalogState';
import CatalogIdentityBar from './components/CatalogIdentityBar';
import ConsoleTabs from './components/ConsoleTabs';
import ProfileTab from './components/ProfileTab';
import ProductsTab from './components/ProductsTab';
import PublishTab from './components/PublishTab';
import StatsTab from './components/StatsTab';
import TeamTab from './components/TeamTab';
import CatalogCategoryModal from './components/CatalogCategoryModal';
import CatalogEditModal from './CatalogEditModal';
import PublishToMarketModal from './PublishToMarketModal';
import UpdatePriceModal from './components/UpdatePriceModal';
import {
    CelebrationBanner, TemporaryPasswordBanner, UncategorizedBanner,
} from './components/AlertBanners';

export default function MyCatalogsContent() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { user } = useSelector((s: RootState) => s.auth);
    // «کاتالوگ کارنت» پرسیست — همان الگوی بازار کارنت (فقط id اشتراک می‌شود تا snapshot نبود re-render اضافه بسازد)
    const persistedCatalogId = useSelector((s: RootState) => s.catalog.currentCatalogId);

    // ─── UI state ───
    const [tab, setTab] = useState<Tab>('products');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [shareSlug, setShareSlug] = useState<string | null>(null);
    const [shareName, setShareName] = useState('');
    const [cardOpen, setCardOpen] = useState(false); // 🪪 استودیو کارت ویزیت — از تب انتشار باز می‌شود
    const [catalogEditOpen, setCatalogEditOpen] = useState(false);
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [refreshAd, setRefreshAd] = useState<any>(null);
    const [catModalAd, setCatModalAd] = useState<any>(null);
    const [publishModalAd, setPublishModalAd] = useState<any>(null);
    const [updatePriceAd, setUpdatePriceAd] = useState<any>(null);
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [celebrateDismissed, setCelebrateDismissed] = useState(false);
    const hasTemporaryPassword = user?.temporaryPassword === true;

    // ─── داده ───
    const { data: catalogsRaw, isLoading, isFetching } = useQuery({
        queryKey: ['catalogs'],
        queryFn: () => apiService.catalog.getAll(),
        staleTime: 60_000,
    });
    const catalogs = useMemo(
        () => (catalogsRaw ?? []).filter((b: any) => b.status === 'active'),
        [catalogsRaw],
    );

    // کاتالوگ‌های فعالِ من — کنسول با همین‌ها کار می‌کند (کاتالوگ‌های تیمی داخل پاسخِ getAll ادغام شده‌اند)
    const allCatalogs = catalogs;

    const [currentId, setCurrentId] = useState<string | null>(null);
    // ── انتخاب اولیه با اولویت: ۱) لینک عمیق ?catalog= (مثلاً بعد از ساخت کاتالوگ جدید)
    // ۲) کاتالوگ کارنت پرسیست  ۳) اولین کاتالوگ
    // نکته: کش ممکن است کهنه باشد و کاتالوگ جدید هنوز در آن نباشد → قبل از fallback
    // صبر می‌کنیم رفetch تازه برسد (همان باگی که کاربر گزارش کرد)
    useEffect(() => {
        if (currentId && allCatalogs.some((c) => c.id === currentId)) return; // انتخاب معتبر — کاری نکن
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('catalog');
        const updatePriceParam = params.get('updatePrice'); // ✅ دیپ‌لینک اعلان «آپدیت قیمت» — با پاک‌سازی URL از بین نمی‌رود

        // ۱) لینک عمیق صریح — ارادهٔ کاربر/مسیرِ فرستنده (کاتالوگ خودم)
        if (fromUrl && allCatalogs.some((c) => c.id === fromUrl)) {
            setCurrentId(fromUrl);
            // انتخاب ماندگار شد (پرسیست پایین‌تر می‌نویسد) → پارامتر تمیز شود
            // تا رفرش بعدی، انتخابِ دستیِ آیندهٔ کاربر را بازنویسی نکند
            window.history.replaceState({}, '', '/my-catalogs' + (updatePriceParam ? `?updatePrice=${updatePriceParam}` : ''));
            return;
        }
        // ۲) کاتالوگ کارنت پرسیست — ادامهٔ کارِ قبلی (فقط کاتالوگِ خودم)
        if (!fromUrl && persistedCatalogId && catalogs.some((c) => c.id === persistedCatalogId)) {
            setCurrentId(persistedCatalogId);
            return;
        }
        // هنوز درخواست در جریان است (کش کهنه + رفetch) → قبل از تصمیم، دادهٔ تازه را ببین
        if (isFetching) return;
        // ۳) fallback نهایی: اولین کاتالوگ
        if (allCatalogs.length > 0) setCurrentId(allCatalogs[0].id);
    }, [allCatalogs, catalogs, currentId, persistedCatalogId, isFetching]);

    const currentCatalog = useMemo(
        () => allCatalogs.find((c) => c.id === currentId) ?? null,
        [allCatalogs, currentId],
    );
    // ✅ حالت اعضای کاتالوگ — عضوِ فروش/مدیر کاتالوگ دیگری (سناریوی بازار پخش)
    //    کاتالوگ‌های تیمی از قبل داخل پاسخِ getAll ادغام شده‌اند (isTeamEntry) و جزو catalogs هستند
    const teamMode = (currentCatalog as any)?.teamMode as string | undefined;
    const isTeamEntry = !!(currentCatalog as any)?.isTeamEntry;

    // ── نگه‌داری snapshot «کاتالوگ کارنت» همیشه تازه — برای مصرف در جای دیگر برنامه ──
    useEffect(() => {
        if (!currentCatalog) return;
        const cc = currentCatalog as any;
        dispatch(setCurrentCatalog({
            id: currentCatalog.id,
            name: currentCatalog.name,
            slug: cc.slug,
            businessId: typeof cc.businessId === 'string' ? cc.businessId : cc.businessId?.id,
            logoUrl: cc.logoUrl ?? cc.logoFile?.path ?? null,
            salesType: cc.salesType,
        }));
        // فقط روی تغییر فیلدهای کلیدی — تا dispatch حلقهٔ re-render نسازد
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCatalog?.id, currentCatalog?.name, (currentCatalog as any)?.slug, dispatch]);

    const { data: userArms } = useArms();
    const uncatQ = useMyUncategorized(!!currentId);

    const [localUnitSettings, setLocalUnitSettings] = useState<
        { unitId: string; containsQty?: number; qtyIsFixed?: boolean }[]
    >([]);
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

    // ✅ دیپ‌لینک اعلان «آپدیت قیمت» — ?updatePrice=ADID → مودال آپدیت سریع قیمت باز می‌شود
    useEffect(() => {
        const wanted = new URLSearchParams(window.location.search).get('updatePrice');
        if (!wanted || products.length === 0) return;
        const ad = products.find((p) => p.id === wanted);
        if (ad) {
            setUpdatePriceAd(ad);
            window.history.replaceState({}, '', '/my-catalogs');
        }
    }, [products]);

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

    // ✅ حالت اعضا — عضوِ فروش/درانتظار فقط تب اعضا؛ مدیر محصولات+اعضا
    useEffect(() => {
        if (!isTeamEntry) return;
        if (teamMode !== 'admin' && tab !== 'team') setTab('team');
        if (tab === 'profile' || tab === 'publish' || tab === 'stats') setTab('team');
    }, [isTeamEntry, teamMode, tab]);

    // ✅ دیپ‌لینک اعلان‌ها — ?tab=team (مثلاً «بررسی درخواست‌های فروشندگی»)
    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('tab') === 'team') {
            setTab('team');
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
            { key: 'products', label: 'اولین محصول', ok: checklist.hasProducts, action: () => setTab('products') },
        ];
        const done = items.filter((i) => i.ok).length;
        return {
            items,
            percent: items.length ? Math.round((done / items.length) * 100) : 0,
            openItem: (key: string) => items.find((i) => i.key === key)?.action?.(),
        };
    }, [checklist]);

    // ─── اکشن‌ها ───
    const openShare = () => {
        setShareSlug(currentCatalog?.slug ?? null);
        setShareName(currentCatalog?.name ?? '');
    };
    // (تایپ Catalog در apiTypes هنوز slug ندارد — با cast تا فیکس apiTypes)
    const canShare = !!(currentCatalog as any)?.slug;

    const goNewCatalog = () => router.push('/business/register');
    // 👁 مشاهدهٔ کاتالوگ عمومی — همان آدرسی که کیت اشتراک می‌سازد (app/[slug])
    const previewCatalog = () => {
        const slug = (currentCatalog as any)?.slug;
        if (slug) router.push(`/${slug}`);
    };
    const selectCatalog = (id: string) => { setCurrentId(id); setStatusFilter('all'); };

    const refreshAll = () => {
        queryClient.invalidateQueries({ queryKey: ['catalogs'] });
        queryClient.invalidateQueries({ queryKey: ['catalog-products', currentId] });
        queryClient.invalidateQueries({ queryKey: ['catalog-stats', currentId] });
        queryClient.invalidateQueries({ queryKey: ['my-uncategorized'] });
        queryClient.invalidateQueries({ queryKey: ['vitrine'] });
        queryClient.invalidateQueries({ queryKey: ['businesses-entity'] });
    };

    // ─── مودال دستهٔ بازاری ───
    const setOwnCatMut = useSetOwnAdCategory();
    const [catModalTree, setCatModalTree] = useState<any[]>([]);
    const [catModalArmName, setCatModalArmName] = useState('');
    const openCategoryModal = (ad: any) => {
        const m = (userArms ?? []).find((x: any) => x.slug === ad.armId);
        setCatModalTree(Array.isArray(m?.categoryTree) ? m.categoryTree : []);
        setCatModalArmName(m?.armName || m?.arm?.name || 'بازار');
        setCatModalAd(ad);
    };

    // ─── گاردها ───
    if (!isLoading && allCatalogs.length === 0) {
        return <EmptyCatalogState hasTemporaryPassword={hasTemporaryPassword} user={user} />;
    }
    if (!currentCatalog) {
        return (
            <div className="py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            </div>
        );
    }

    const userAvatar = user?.avatarFile?.thumbnailPath || user?.avatarUrl;
    const userHasName = !!user?.fullName?.trim();

    // ─── تب‌های بخش‌های کاتالوگ (RTL: مشخصات در راست) ───
    const tabItems = isTeamEntry
        ? teamMode === 'admin'
            ? [
                  { key: 'products' as Tab, label: 'محصولات', icon: Package, count: products.length },
                  { key: 'team' as Tab, label: 'اعضا', icon: Users },
              ]
            : [
                  { key: 'team' as Tab, label: 'اعضا', icon: Users },
              ]
        : [
              { key: 'products' as Tab, label: 'محصولات', icon: Package, count: products.length },
              { key: 'team' as Tab, label: 'اعضا', icon: Users },
              { key: 'profile' as Tab, label: 'مشخصات', icon: IdCard },
              { key: 'stats' as Tab, label: 'آمار', icon: BarChart3 },
              { key: 'publish' as Tab, label: 'انتشار', icon: Globe, count: memberships.length > 0 ? memberships.length : undefined },
          ];

    return (
        <div className="space-y-4">
            {/* 🔴 هشدار رمز موقت */}
            {hasTemporaryPassword && (
                <TemporaryPasswordBanner phone={user?.phone} onClick={() => setPasswordOpen(true)} />
            )}

            {/* 🎉 بنر جشن عضویت تازه — بالای تب‌ها؛ هدر و بدنهٔ کاتالوگ یکپارچه بمانند (درخواست کاربر) */}
            {freshMembership && !celebrateDismissed && (
                <CelebrationBanner
                    membership={freshMembership}
                    uncatCount={uncatItems.length}
                    onDismiss={() => setCelebrateDismissed(true)}
                    onSetCategories={() => { setTab('products'); setStatusFilter('uncat'); }}
                />
            )}

            {/* 🧭 هدر کنسول — هویت + تب‌ها در یک نوار سفید سایه‌دار، جدا از بدنه (درخواست کاربر) */}
            {/* موبایل: چسبان به لبهٔ بالا | دسکتاپ: زیر ناوبری ۶۴px — تم تاریک: سطح روشن‌تر + سایهٔ پررنگ‌تر */}
            <div className="sticky top-0 lg:top-16 z-30 -mx-4 px-4 bg-white dark:bg-gray-900
                    border-b border-outline-variant/20 dark:border-gray-800
                    shadow-[0_6px_16px_-8px_rgba(15,23,42,0.28)] dark:shadow-[0_6px_16px_-8px_rgba(0,0,0,0.7)]">
                <div className="pb-4 pt-2">
                    <CatalogIdentityBar
                        catalogs={allCatalogs}
                        currentCatalog={currentCatalog}
                        canShare={canShare}
                        onSelect={selectCatalog}
                        onShare={openShare}
                        onPreview={previewCatalog}
                        onNewCatalog={goNewCatalog}
                        onChangePassword={() => setPasswordOpen(true)}
                    />
                </div>
                <ConsoleTabs items={tabItems} active={tab} onChange={setTab} />
            </div>

            {/* 🏪 نوارِ حالت اعضای کاتالوگ — عضوِ فروش/مدیر کاتالوگ دیگری (بازار پخش) */}
            {isTeamEntry && (() => {
                const cfg: Record<string, { title: string; desc: string; cls: string }> = {
                    seller: {
                        title: 'عضوِ فروش این کاتالوگ',
                        desc: 'این کاتالوگ مالِ مالک کاتالوگ است — شما عضوِ فروش آن هستید؛ مشتری‌های منطقهٔ خودتان را ثبت کنید تا تماسشان به شما برسد',
                        cls: 'border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10',
                    },
                    admin: {
                        title: 'مدیر این کاتالوگ',
                        desc: 'مالک کاتالوگ به شما دسترسی ویرایش داده — محصولات و قیمت‌ها را مدیریت کنید و در مدیریت اعضا کمک کنید',
                        cls: 'border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10',
                    },
                    pending: {
                        title: 'درخواست فروشندگی در انتظار تایید',
                        desc: 'تا تایید مالک کاتالوگ، امکان ثبت مشتری ندارید',
                        cls: 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10',
                    },
                };
                const info = cfg[teamMode || 'seller'] || cfg.seller;
                return (
                    <div className={cn('rounded-xl border px-4 py-3 flex items-center gap-3', info.cls)}>
                        <span className="w-9 h-9 rounded-xl bg-white/60 dark:bg-black/20 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4.5 h-4.5" />
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-extrabold">{info.title}</p>
                            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-5">{info.desc}</p>
                        </div>
                    </div>
                );
})()}

            {/* ── محتوای تب فعال — بدون قاب اضافه، فلت ── */}
            <div className="pt-0.5 pb-2">
                {/* تب مشخصات — هویت + تکمیل + ویرایش */}
                {tab === 'profile' && (
                    <ProfileTab
                        catalog={currentCatalog}
                        completion={completion}
                        canShare={canShare}
                        onShare={openShare}
                        onEdit={() => setCatalogEditOpen(true)}
                        onVerify={() => setVerifyOpen(true)}
                        userAvatar={userAvatar}
                        userHasName={userHasName}
                        onProfile={() => router.push('/profile')}
                    />
                )}

                {/* تب محصولات — کاملاً جدا و متمرکز */}
                {tab === 'products' && (
                    <div className="space-y-2.5">
                        {uncatItems.length > 0 && (
                            <UncategorizedBanner
                                count={uncatItems.length}
                                armName={uncatItems[0]?.armName}
                                onClick={() => setStatusFilter('uncat')}
                            />
                        )}
                        <ProductsTab
                            products={products}
                            adsLoading={adsLoading}
                            statusFilter={statusFilter}
                            onFilterChange={setStatusFilter}
                            currentCatalog={currentCatalog}
                            onOpenCategorySettings={() => setCatModalOpen(true)}
                            onOpenUnitSettings={() => setUnitModalOpen(true)}
                            onCategory={openCategoryModal}
                            onRefresh={setRefreshAd}
                            onPublish={setPublishModalAd}
                            onPriceUpdate={setUpdatePriceAd}
                        />
                    </div>
                )}

                {/* تب آمار */}
                {tab === 'stats' && (
                    <StatsTab currentCatalog={currentCatalog} stats={stats} productsCount={products.length} />
                )}

                {/* تب اعضا — مالک/مدیر/عضوِ فروش (بازار پخش) */}
                {tab === 'team' && (
                    <TeamTab catalogId={currentCatalog.id} />
                )}

                {/* تب انتشار */}
                {tab === 'publish' && (
                    <PublishTab
                        currentCatalog={currentCatalog}
                        memberships={memberships}
                        onShare={openShare}
                        onEditCatalog={() => setCatalogEditOpen(true)}
                        onRefreshAll={refreshAll}
                        onOpenCard={() => setCardOpen(true)}
                        savedCard={(currentCatalog as any)?.metadata?.visitCard ?? null}
                    />
                )}
            </div>

            <CatalogCategoryModal
                ad={catModalAd}
                tree={catModalTree}
                armName={catModalArmName}
                pending={setOwnCatMut.isPending}
                onClose={() => setCatModalAd(null)}
                onPick={(categoryId) => {
                    setOwnCatMut.mutate(
                        { adId: catModalAd.id, categoryId },
                        { onSuccess: () => { refreshAll(); setCatModalAd(null); } },
                    );
                }}
            />

            {/* مودال‌های صفحه */}
            {/* ✅ key — تا مودال همیشه با دادهٔ تازه remount شود */}
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
            <ShareKitModal open={!!shareSlug} onClose={() => setShareSlug(null)} catalogName={shareName} slug={shareSlug ?? undefined}
                           logoUrl={(currentCatalog as any)?.logoFile?.path || currentCatalog?.logoUrl || undefined} />
            {/* 🪪 استودیو کارت ویزیت — از تب انتشار باز می‌شود؛ با ذخیره، spec روی کاتالوگ می‌ماند */}
            <VisitCardModal open={cardOpen} onClose={() => setCardOpen(false)} catalogName={currentCatalog.name}
                            slug={(currentCatalog as any)?.slug ?? undefined}
                            catalogId={currentCatalog.id}
                            savedSpec={(currentCatalog as any)?.metadata?.visitCard ?? null}
                            onSaved={refreshAll}
                            logoUrl={(currentCatalog as any)?.logoFile?.path || currentCatalog?.logoUrl || undefined}
                            phone={currentCatalog?.phone ?? undefined}
                            description={(currentCatalog as any)?.shortDescription ?? undefined} />
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
            {updatePriceAd && (
                <UpdatePriceModal isOpen={!!updatePriceAd} onClose={() => setUpdatePriceAd(null)} ad={updatePriceAd}
                                  onSuccess={() => refreshAll()} />
            )}
            <PublishToMarketModal
                isOpen={!!publishModalAd}
                onClose={() => setPublishModalAd(null)}
                ad={publishModalAd}
                catalogSalesType={(currentCatalog as any)?.salesType}
                onPublished={() => refreshAll()}
            />
        </div>
    );
}
