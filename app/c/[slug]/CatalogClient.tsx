// app/c/[slug]/CatalogClient.tsx
'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {useBusinessBySlug, useCatalogAds, useCatalogSaved, useCatalogStats, useSavedCatalogs} from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { Building2, Phone, Loader2 } from 'lucide-react';
import CatalogHeader from './components/CatalogHeader';
import CatalogProductList from './components/CatalogProductList';
import CatalogFooter from './components/CatalogFooter';
import { LoginModal } from '@/app/components/LoginModal';

interface CatalogClientProps {
    slug: string;
    initialBusiness?: any;
    initialSearch?: string;
}

export default function CatalogClient({ slug, initialBusiness, initialSearch = '' }: CatalogClientProps) {
    const router = useRouter();

    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [query, setQuery] = useState(initialSearch || '');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [allAds, setAllAds] = useState<any[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [localSaved, setLocalSaved] = useState<boolean | null>(null);
    const [showLogin, setShowLogin] = useState(false);
    const [pendingSave, setPendingSave] = useState(false);
    const loadMoreRef = React.useRef<HTMLDivElement>(null);

    const { data: business } = useBusinessBySlug(slug);
    const displayBusiness = business || initialBusiness;

    const { data: adsData, isLoading: adsLoading, isFetching } = useCatalogAds(
        displayBusiness?.id || '', page, 10, undefined,
    );
    const { data: savedData, refetch: refetchSaved } = useCatalogSaved(displayBusiness?.id || '');
    const { data: statsData, refetch: refetchStats } = useCatalogStats(displayBusiness?.id || '');
    const { refetch: refetchSavedList } = useSavedCatalogs(); // ✅ برای رفرش لیست

    const isSaved = localSaved !== null ? localSaved : (savedData?.isSaved || false);
    // ✅ مالکیت
    const isOwner = useMemo(() => {
        if (!user?.id || !displayBusiness?.owner?.id) return false;
        return user.id === displayBusiness.owner.id;
    }, [user?.id, displayBusiness?.owner?.id]);

    // ✅ ثبت ویو
    useEffect(() => {
        if (!displayBusiness?.id) return;
        const viewKey = `catalog-view-${displayBusiness.id}`;
        if (!sessionStorage.getItem(viewKey)) {
            sessionStorage.setItem(viewKey, '1');
            apiService.catalog.trackView(displayBusiness.id)
                .then(() => refetchStats())
                .catch(() => {});
        }
    }, [displayBusiness?.id]);

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
        if (!displayBusiness?.id) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setPendingSave(true);
            setShowLogin(true);
            return;
        }

        try {
            if (isSaved) {
                await apiService.catalog.unsave(displayBusiness.id);
                setLocalSaved(false);
                toast.success('حذف از ذخیره‌ها');
            } else {
                await apiService.catalog.save(displayBusiness.id);
                setLocalSaved(true);
                toast.success('کاتالوگ ذخیره شد');
            }
            refetchSaved();
            refetchStats();
            refetchSavedList(); // ✅ رفرش لیست ذخیره‌ها
        } catch (error: any) {
            // ...
        }
    }, [displayBusiness?.id, isSaved, refetchSaved, refetchStats, refetchSavedList]);

    // ✅ بعد از ورود موفق
    const handleLoginSuccess = useCallback(() => {
        setShowLogin(false);

        if (pendingSave) {
            setPendingSave(false);
            setTimeout(async () => {
                if (!displayBusiness?.id) return;

                try {
                    await refetchSaved();

                    // چک کن الان ذخیره است یا نه
                    const token = localStorage.getItem('accessToken');
                    if (!token) return;

                    const { data: freshSavedData } = await refetchSaved();
                    const currentSaved = freshSavedData?.isSaved || false;

                    if (currentSaved) {
                        await apiService.catalog.unsave(displayBusiness.id);
                        setLocalSaved(false);
                        toast.success('حذف از ذخیره‌ها');
                    } else {
                        await apiService.catalog.save(displayBusiness.id);
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
    }, [pendingSave, displayBusiness?.id, refetchSaved, refetchStats]);

    const handleContact = useCallback(() => {
        const phone = displayBusiness?.owner?.phone || displayBusiness?.phone;
        if (!phone) { toast.error('شماره تماس ثبت نشده است'); return; }
        if (window.innerWidth < 768) window.location.href = `tel:${phone}`;
        else { navigator.clipboard.writeText(phone).catch(() => {}); toast.success('شماره تماس کپی شد', { description: phone, duration: 6000 }); }
    }, [displayBusiness]);

    const handleShare = async () => {
        try {
            const url = window.location.href;
            if (navigator.share) await navigator.share({ title: `کاتالوگ ${displayBusiness?.name}`, url });
            else { await navigator.clipboard.writeText(url); toast.success('لینک کاتالوگ کپی شد'); }
        } catch {}
    };

    if (!displayBusiness) {
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
                    business={displayBusiness}
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
                    isOwner={isOwner} // ✅
                    onOpenDashboard={() => router.push(`/c/${displayBusiness.slug}/dashboard`)}
                />

                {/* لیست محصولات */}
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
                />

                {/* فوتر */}
                <CatalogFooter business={displayBusiness} onGoHome={() => router.push('/')} />

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
                }}
                onSuccess={handleLoginSuccess}
                armSlug={displayBusiness?.slug}
            />
        </>
    );
}