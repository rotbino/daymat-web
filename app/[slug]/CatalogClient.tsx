// app/[slug]/CatalogClient.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { RootState } from '@/lib/store/store';
import { useCatalogBySlug, useCatalogAds, useCatalogSaved, useCatalogStats, useSavedCatalogs } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { Building2, Phone } from 'lucide-react';
import CatalogHeader from './components/CatalogHeader';
import CatalogProductList from './components/CatalogProductList';
import CatalogFooter from './components/CatalogFooter';
import CoopRequestModal from './components/CoopRequestModal';
import { LoginModal } from '@/components/LoginModal';
import EditBusinessModal from "@/app/[slug]/components/EditBusinessModal";
import EditProfileModal from "@/app/[slug]/components/EditProfileModal";

interface CatalogClientProps {
    slug: string;
    initialCatalog?: any;
    initialSearch?: string;
}

export default function CatalogClient({ slug, initialCatalog, initialSearch = '' }: CatalogClientProps) {
    const router = useRouter();
    const queryClient = useQueryClient();




    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [query, setQuery] = useState(initialSearch || '');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [allAds, setAllAds] = useState<any[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [localSaved, setLocalSaved] = useState<boolean | null>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [pendingSave, setPendingSave] = useState(false);
    // ✅ درخواست ارتباط تجاری — وضعیت من در کاتالوگ + مودال
    const [coopOpen, setCoopOpen] = useState(false);
    const [pendingCoopAfterLogin, setPendingCoopAfterLogin] = useState(false);
    // ✅ ویرایش درجا: مدال پروفایل شخصی
    const [profileEditOpen, setProfileEditOpen] = useState(false);
    const loadMoreRef = React.useRef<HTMLDivElement>(null);

    const { data: catalog, refetch: refetchCatalog } = useCatalogBySlug(slug);
    const displayCatalog = catalog || initialCatalog;

    const { data: adsData, isLoading: adsLoading, isFetching, refetch: refetchAds } = useCatalogAds(
        displayCatalog?.id || '', page, 10, undefined,
    );
    const { data: savedData, refetch: refetchSaved } = useCatalogSaved(displayCatalog?.id || '');
    const { data: statsData, refetch: refetchStats } = useCatalogStats(displayCatalog?.id || '');
    const { refetch: refetchSavedList } = useSavedCatalogs();

    const isSaved = localSaved !== null ? localSaved : (savedData?.isSaved || false);
    // ✅ وضعیت همکاری من با این کاتالوگ — برای دکمهٔ هدر (none | pending | member)
    const [coopState, setCoopState] = useState<'none' | 'pending' | 'member'>('none');
    const refetchMyMembershipRef = React.useRef<(() => void) | null>(null);
    React.useEffect(() => {
        if (!isAuthenticated || !displayCatalog?.id) { setCoopState('none'); return; }
        let alive = true;
        const fetchState = () => apiService.catalog.team.getMyMembership(displayCatalog.id)
            .then((res: any) => {
                if (!alive) return;
                const m = res?.member;
                const active = !!m && (m.sellerStatus === 'active' || m.customerStatus === 'active' || m.supplierStatus === 'active');
                const pending = !!m && (m.sellerStatus === 'pending' || m.customerStatus === 'pending' || m.supplierStatus === 'pending');
                setCoopState(active ? 'member' : pending ? 'pending' : 'none');
            })
            .catch(() => { if (alive) setCoopState('none'); });
        fetchState();
        refetchMyMembershipRef.current = fetchState;
        return () => { alive = false; };
    }, [isAuthenticated, displayCatalog?.id]);
    // ✅ مالکیت
    const isOwner = useMemo(() => {
        if (!user?.id || !displayCatalog?.owner?.id) return false;
        return user.id === displayCatalog.owner.id;
    }, [user?.id, displayCatalog?.owner?.id]);
    const [catalogEditOpen, setCatalogEditOpen] = useState(false)
    // const router = useRouter(); از قبل هست. اضافه:
    const searchParams = useSearchParams();

// ✅ مد ویرایش: فقط برای مالک معنا دارد
    const isEditMode = searchParams.get('edit') === '1' && isOwner;
    const exitEditMode = () => router.replace(`/${slug}`);

    // ✅ ویرایش درجا: وقتی مالک از صفحه ویرایش برمی‌گردد (remount)، دیتای کاتالوگ تازه شود
    useEffect(() => {
        if (!isOwner || !slug) return;
        queryClient.invalidateQueries({ queryKey: ['catalog', 'by-slug', slug] });
        queryClient.invalidateQueries({ queryKey: ['catalog-ads'] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ ثبت ویو
    useEffect(() => {
        if (!displayCatalog?.id) return;
        const viewKey = `catalog-view-${displayCatalog.id}`;
        if (!sessionStorage.getItem(viewKey)) {
            sessionStorage.setItem(viewKey, '1');
            apiService.catalog.trackView(displayCatalog.id)
                .then(() => refetchStats())
                .catch(() => {});
        }
    }, [displayCatalog?.id]);

    // ✅ جمع‌آوری محصولات
    useEffect(() => {
        if (!adsData?.ads?.length) return;
        setAllAds(prev => {
            if (page === 1) return adsData.ads;
            const seen = new Set(prev.map(a => a.id));
            return [...prev, ...adsData.ads.filter(a => !seen.has(a.id))];
        });
    }, [adsData, page]);

    // ✅ Infinite Scroll
    useEffect(() => {
        if (!loadMoreRef.current || isLoadingMore || adsLoading || isFetching) return;
        const totalPages = adsData?.pagination?.totalPages || 1;
        if (page >= totalPages) return;

        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                setIsLoadingMore(true);
                setPage(p => p + 1);
                setTimeout(() => setIsLoadingMore(false), 300);
            }
        }, { rootMargin: '400px' });
        obs.observe(loadMoreRef.current);
        return () => obs.disconnect();
    }, [isLoadingMore, adsLoading, isFetching, page, adsData]);

    // ✅ بازیابی حالت نمایش
    useEffect(() => {
        const v = localStorage.getItem('catalog-view');
        if (v === 'grid' || v === 'list') setView(v);
    }, []);

    const total = adsData?.pagination?.total || 0;
    const activeCount = allAds.filter(ad => ad.status === 'active').length;

    // ═══════════════════════════════════════════
    // ✅ ذخیره کاتالوگ
    // ═══════════════════════════════════════════
    const handleSaveToggle = useCallback(async () => {
        if (!displayCatalog?.id) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setPendingSave(true);
            setShowLogin(true);
            return;
        }

        try {
            if (isSaved) {
                await apiService.catalog.unsave(displayCatalog.id);
                setLocalSaved(false);
                toast.success('حذف از ذخیره‌ها');
            } else {
                await apiService.catalog.save(displayCatalog.id);
                setLocalSaved(true);
                toast.success('کاتالوگ ذخیره شد');
            }
            refetchSaved();
            refetchStats();
            refetchSavedList();
        } catch (error: any) {
            // ...
        }
    }, [displayCatalog?.id, isSaved, refetchSaved, refetchStats, refetchSavedList]);

    // ✅ بعد از ورود موفق
    const handleLoginSuccess = useCallback(() => {
        setShowLogin(false);

        if (pendingCoopAfterLogin) {
            setPendingCoopAfterLogin(false);
            setTimeout(() => setCoopOpen(true), 400);
            return;
        }

        if (pendingSave) {
            setPendingSave(false);
            setTimeout(async () => {
                if (!displayCatalog?.id) return;

                try {
                    await refetchSaved();

                    const token = localStorage.getItem('accessToken');
                    if (!token) return;

                    const { data: freshSavedData } = await refetchSaved();
                    const currentSaved = freshSavedData?.isSaved || false;

                    if (currentSaved) {
                        await apiService.catalog.unsave(displayCatalog.id);
                        setLocalSaved(false);
                        toast.success('حذف از ذخیره‌ها');
                    } else {
                        await apiService.catalog.save(displayCatalog.id);
                        setLocalSaved(true);
                        toast.success('کاتالوگ ذخیره شد');
                    }
                    refetchSaved();
                    refetchStats();
                } catch (error: any) {
                    const errorMessage = error?.data?.message || error?.message || 'خطا در ذخیره';
                    toast.error(errorMessage);
                }
            }, 500);
        }
    }, [pendingSave, pendingCoopAfterLogin, displayCatalog?.id, refetchSaved, refetchStats]);

    const handleContact = useCallback(() => {
        const phone = displayCatalog?.owner?.phone || displayCatalog?.phone;
        if (!phone) { toast.error('شماره تماس ثبت نشده است'); return; }
        if (window.innerWidth < 768) window.location.href = `tel:${phone}`;
        else { navigator.clipboard.writeText(phone).catch(() => {}); toast.success('شماره تماس کپی شد', { description: phone, duration: 6000 }); }
    }, [displayCatalog]);

    const handleShare = async () => {
        try {
            const url = window.location.href;
            if (navigator.share) await navigator.share({ title: `کاتالوگ ${displayCatalog?.name}`, url });
            else { await navigator.clipboard.writeText(url); toast.success('لینک کاتالوگ کپی شد'); }
        } catch {}
    };

    // ✅ درخواست ارتباط تجاری — بدون لاگین: اول ورود، بعد مودال
    const handleCoopRequest = useCallback(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setPendingCoopAfterLogin(true);
            setShowLogin(true);
            return;
        }
        setCoopOpen(true);
    }, []);

    // ═══════════════════════════════════════════
    // ✅ ویرایش درجا (فقط مالک)
    // ═══════════════════════════════════════════
    const handleEditCatalog = useCallback(() => {
        setCatalogEditOpen(true);
    }, []);


// در CatalogClient (کاتالوگ عمومی)، handler را به این تغییر بده:
    const handleAddProduct = useCallback(() => {
        router.push(`/ad/create?catalog=${displayCatalog.id}`);
    }, [displayCatalog?.id, router]);

    if (!displayCatalog) {
        return (
            <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>کسب‌وکار یافت نشد</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
                {/* هدر */}
                <CatalogHeader
                    catalog={displayCatalog}
                    total={total}
                    activeCount={activeCount}
                    shares={statsData?.shares || 0}
                    views={statsData?.views || 0}
                    saves={statsData?.saves || 0}
                    isSaved={isSaved}
                    onContact={handleContact}
                    onBack={() => router.back()}
                    onShare={handleShare}
                    onSaveToggle={handleSaveToggle}
                    isOwner={isOwner}
                    coopState={isOwner ? 'member' : coopState}
                    onCoopRequest={handleCoopRequest}
                    isEditMode={isEditMode}
                    onExitEditMode={exitEditMode}
                    onOpenDashboard={() => router.push(`/my-catalogs?catalog=${displayCatalog.id}`)}
                    onEditCatalog={handleEditCatalog}     // ✅ مداد باکس کسب‌وکار
                    onEditProfile={() => setProfileEditOpen(true)} // ✅ مداد باکس پروفایل شخصی
                />

                {/* ✅ مدیریت اعضا جای اصلی‌اش تب اعضا در پنل مدیریت کاتالوگ است؛
                    روی خود کاتالوگ فقط دکمهٔ «ارتباط تجاری» در هدر (مثل کانکت لینکدین) */}
                <CatalogProductList
                    ads={allAds}
                    total={total}
                    query={query}
                    setQuery={setQuery}
                    view={view}
                    setView={(v) => {
                        setView(v);
                        localStorage.setItem('catalog-view', v);
                    }}
                    isLoading={adsLoading && allAds.length === 0}
                    isFetching={isFetching}
                    loadMoreRef={loadMoreRef}
                    isLoadingMore={isLoadingMore}
                    isOwner={isOwner}              // ✅
                    onAddProduct={handleAddProduct} // ✅ افزودن محصول از خود کاتالوگ
                />

                {/* فوتر */}
                <CatalogFooter catalog={displayCatalog} />

                {/* نوار تماس موبایل */}
                <div className="fixed bottom-0 inset-x-0 z-40 md:hidden">
                    <div className="bg-white/85 dark:bg-gray-950/85 backdrop-blur border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                        <button onClick={handleContact} className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4" />تماس و سفارش
                        </button>
                    </div>
                </div>
            </div>

            {/* ✅ مدال لاگین */}
            <LoginModal
                isOpen={showLogin}
                onClose={() => {
                    setShowLogin(false);
                    setPendingSave(false);
                    setPendingCoopAfterLogin(false);
                }}
                onSuccess={handleLoginSuccess}
                armSlug={displayCatalog?.slug}
            />

            {/* ✅ درخواست ارتباط تجاری — یک در برای خریدار/تامین‌کننده/همکار فروش */}
            <CoopRequestModal
                open={coopOpen}
                onClose={() => setCoopOpen(false)}
                catalogId={displayCatalog.id}
                catalogName={displayCatalog.name}
                onSuccess={() => { refetchMyMembershipRef.current?.(); }}
            />

            {/* ✅ ویرایش درجا — کسب‌وکار */}
            <EditBusinessModal
                isOpen={catalogEditOpen}
                onClose={() => setCatalogEditOpen(false)}
                catalog={displayCatalog}
                onSaved={() => { refetchCatalog(); refetchStats(); }}
            />

            {/* ✅ ویرایش درجا — پروفایل شخصی */}
            <EditProfileModal
                isOpen={profileEditOpen}
                onClose={() => setProfileEditOpen(false)}
                onSaved={() => { refetchCatalog(); refetchStats(); }}
            />
        </>
    );
}