// app/my-catalogs/MyCatalogsContent.tsx
// ارکستراتور صفحهٔ «مدیریت کاتالوگ» — state و data fetching و ترکیب کامپوننت‌ها
// چیدمان: رِیل کاتالوگ‌ها (دسکتاپ) + پنل کنسول یکپارچه (هدر + تب‌ها + محتوا)
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setUser } from '@/lib/store/slices/authSlice';
import { apiService } from '@/lib/api/apiService';
import {
    useArms, useMyUncategorized, useSetOwnAdCategory,
} from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import { BarChart3, Globe, Loader2, Package } from 'lucide-react';

import UnitSettingsModal from '@/app/ad/components/UnitSettingsModal';
import CategorySettingsModal from '@/app/ad/components/CategorySettingsModal';
import ShareKitModal from '@/app_/profile/components/ShareKitModal';
import { RefreshModal } from '@/app/ad/RefreshModal';
import { ChangePasswordModal } from '@/app_/register/ChangePasswordModal';
import { VerificationModal } from '@/app/business/VerificationModal';

import { StatusFilter, Tab } from './constants';
import TopBar from './components/TopBar';
import EmptyCatalogState from './components/EmptyCatalogState';
import CatalogConsoleHeader from './components/CatalogConsoleHeader';
import ConsoleTabs from './components/ConsoleTabs';
import CatalogRail from './components/CatalogRail';
import CatalogChipStrip from './components/CatalogChipStrip';
import ProductsTab from './components/ProductsTab';
import PublishTab from './components/PublishTab';
import StatsTab from './components/StatsTab';
import CatalogCategoryModal from './components/CatalogCategoryModal';
import CatalogEditModal from './CatalogEditModal';
import PublishToMarketModal from './PublishToMarketModal';
import {
    CelebrationBanner, ProfileBanner, TemporaryPasswordBanner, UncategorizedBanner,
} from './components/AlertBanners';

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
    const [refreshAd, setRefreshAd] = useState<any>(null);
    const [catModalAd, setCatModalAd] = useState<any>(null);
    const [publishModalAd, setPublishModalAd] = useState<any>(null);
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [celebrateDismissed, setCelebrateDismissed] = useState(false);
    const hasTemporaryPassword = user?.temporaryPassword === true;

    // ─── داده ───
    const { data: catalogsRaw, isLoading } = useQuery({
        queryKey: ['catalogs'],
        queryFn: () => apiService.catalog.getAll(),
        staleTime: 60_000,
    });
    const catalogs = useMemo(
        () => (catalogsRaw ?? []).filter((b: any) => b.status === 'active'),
        [catalogsRaw],
    );

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

    // ─── اکشن‌ها ───
    const openShare = () => {
        setShareSlug(currentCatalog?.slug ?? null);
        setShareName(currentCatalog?.name ?? '');
    };
    // (تایپ Catalog در apiTypes هنوز slug ندارد — با cast تا فیکس apiTypes)
    const canShare = !!(currentCatalog as any)?.slug;

    const goNewCatalog = () => router.push('/business/register');
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
    if (!isLoading && catalogs.length === 0) {
        return <EmptyCatalogState hasTemporaryPassword={hasTemporaryPassword} user={user} />;
    }
    if (!currentCatalog) {
        return (
            <div className="py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            </div>
        );
    }

    const userAvatar = user?.avatarFile?.thumbnailPath || user?.avatarUrl;
    const userHasName = !!user?.fullName?.trim();

    const tabItems = [
        { key: 'products' as Tab, label: 'محصولات', icon: Package, count: products.length },
        { key: 'publish' as Tab, label: 'انتشار', icon: Globe, count: memberships.length > 0 ? memberships.length : undefined },
        { key: 'stats' as Tab, label: 'آمار', icon: BarChart3 },
    ];

    return (
        <div className="space-y-4">
            {/* 🔴 هشدار رمز موقت */}
            {hasTemporaryPassword && (
                <TemporaryPasswordBanner phone={user?.phone} onClick={() => setPasswordOpen(true)} />
            )}

            {/* هدر صفحه */}
            <TopBar onChangePassword={() => setPasswordOpen(true)} onNewCatalog={goNewCatalog} />

            {/* نوار چیپ کاتالوگ‌ها — موبایل، وقتی بیش از یک کاتالوگ است */}
            {catalogs.length > 1 && (
                <CatalogChipStrip
                    catalogs={catalogs}
                    currentId={currentId}
                    onSelect={selectCatalog}
                    onNew={goNewCatalog}
                />
            )}

            {/* ── چیدمان کنسول ──
                دسکتاپ (lg+): رِیل کاتالوگ‌ها (ستون باریک چسبان) + پنل کنسول یکپارچه
                موبایل: همه چیز تک‌ستونی — هدر، چیپ‌ها، کنسول */}
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:items-start lg:gap-5">
                {/* رِیل کاتالوگ‌ها — فقط دسکتاپ */}
                <CatalogRail
                    catalogs={catalogs}
                    currentId={currentId}
                    onSelect={selectCatalog}
                    onNew={goNewCatalog}
                />

                {/* ستون کنسول */}
                <div className="min-w-0 space-y-3.5">
                    {/* ⚠️ کالاهای بی‌دسته — بالای کنسول چون اکشن روی کالاست */}
                    {uncatItems.length > 0 && (
                        <UncategorizedBanner
                            count={uncatItems.length}
                            armName={uncatItems[0]?.armName}
                            onClick={() => { setTab('products'); setStatusFilter('uncat'); }}
                        />
                    )}

                    {/* 🎉 بنر جشن عضویت تازه */}
                    {freshMembership && !celebrateDismissed && (
                        <CelebrationBanner
                            membership={freshMembership}
                            uncatCount={uncatItems.length}
                            onDismiss={() => setCelebrateDismissed(true)}
                            onSetCategories={() => { setTab('products'); setStatusFilter('uncat'); }}
                        />
                    )}

                    {/* پنل کنسول کاتالوگ — یکپارچه: هدر + تب‌ها + محتوا */}
                    <section className="bg-white dark:bg-gray-900 rounded-3xl border border-outline-variant/50 dark:border-gray-700
                            shadow-sm overflow-hidden">
                        <CatalogConsoleHeader
                            catalog={currentCatalog}
                            stats={stats}
                            productsCount={products.length}
                            completion={completion}
                            canShare={canShare}
                            onShare={openShare}
                            onEdit={() => setCatalogEditOpen(true)}
                        />

                        <ConsoleTabs items={tabItems} active={tab} onChange={setTab} />

                        <div className="p-4 lg:p-6">
                            {/* تب محصولات */}
                            {tab === 'products' && (
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
                                />
                            )}

                            {/* تب انتشار */}
                            {tab === 'publish' && (
                                <PublishTab
                                    currentCatalog={currentCatalog}
                                    memberships={memberships}
                                    onShare={openShare}
                                    onVerify={() => setVerifyOpen(true)}
                                    onEditCatalog={() => setCatalogEditOpen(true)}
                                    onRefreshAll={refreshAll}
                                />
                            )}

                            {/* تب آمار — اعتبار فقط همین‌جا fetch می‌شود */}
                            {tab === 'stats' && (
                                <StatsTab currentCatalog={currentCatalog} stats={stats} productsCount={products.length} />
                            )}
                        </div>
                    </section>

                    {/* 👤 نکتهٔ پروفایل — کم‌اهمیت‌تر از کار کاتالوگ */}
                    {(!userHasName || !userAvatar) && (
                        <ProfileBanner avatarUrl={userAvatar} hasName={userHasName} onClick={() => router.push('/profile')} />
                    )}
                </div>
            </div>

            {/* مودال دستهٔ بازاری */}
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
            <PublishToMarketModal
                isOpen={!!publishModalAd}
                onClose={() => setPublishModalAd(null)}
                ad={publishModalAd}
                onPublished={() => refreshAll()}
            />
        </div>
    );
}
