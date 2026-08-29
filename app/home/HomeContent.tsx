// app/home/HomeContent.tsx
'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader, AppFooter } from '@/app/components';
import { useArms, useVitrine, vitrineKeys, normalizeVitrineParams } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { Package, RefreshCw, Archive, Clock, Wrench, Loader2 } from 'lucide-react';
import { useFilters } from '@/lib/hooks/useFilters';
import { cn } from '@/lib/utils';
import { buildFilterHref, findNodeById } from '@/lib/utils/filterUrl';
import SearchBox from './SearchBox';
import CategorySidebar from './CategorySidebar';
import { MobileFilterStrip, DesktopFilterToolbar } from './FilterToolbar';
import FilterSheet from './FilterSheet';
import AdCard from './AdCard';
import AdModal from './AdModal';

export default function HomeContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { currentSlug, currentArm, isLoading: armLoading } = useSelector((state: RootState) => state.arm);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { getFilterParams, addFilter, removeFilter, otherFilters } = useFilters();
    const { data: arms, refetch: refetchArms } = useArms();

    const [isCheckingArm, setIsCheckingArm] = useState(true);
    const [selectedAd, setSelectedAd] = useState<any>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const vitrineSlug = currentSlug || 'barton';

    const categoryFromUrl = searchParams.get('category');
    const searchFromUrl = searchParams.get('search');
    const pageFromUrl = searchParams.get('page');
    const minqFromUrl = searchParams.get('minq');
    const minstockFromUrl = searchParams.get('minstock');
    const sortFromUrl = searchParams.get('sort');

    const baseFilterParams = useMemo(() => getFilterParams(), [getFilterParams]);
    const categoryTree = useMemo(() => currentArm?.categoryTree || [], [currentArm]);
    const selectedNode = useMemo(() => (categoryFromUrl ? findNodeById(categoryTree, categoryFromUrl) : null), [categoryFromUrl, categoryTree]);

    const queryParams = useMemo(() => ({
        ...baseFilterParams,
        categoryId: categoryFromUrl || undefined,
        search: searchFromUrl || undefined,
        minQuantity: minqFromUrl ? Number(minqFromUrl) : undefined,
        minAvailableQuantity: minstockFromUrl ? Number(minstockFromUrl) : undefined,
        sort: sortFromUrl || undefined,
        page: pageFromUrl ? Math.max(1, parseInt(pageFromUrl, 10) || 1) : 1,
        limit: 10,
    }), [baseFilterParams, categoryFromUrl, searchFromUrl, minqFromUrl, minstockFromUrl, sortFromUrl, pageFromUrl]);

    const { data, isPending, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, isPlaceholderData } = useVitrine(vitrineSlug, queryParams);

    const ads = useMemo(() => data?.pages.flatMap((p: any) => p?.ads ?? []) ?? [], [data]);
    const total = data?.pages?.[0]?.pagination?.total;
    const totalPages = data?.pages?.[0]?.pagination?.totalPages || 1;
    const hasAds = ads.length > 0;
    const hasActiveFilters = !!(categoryFromUrl || searchFromUrl || minqFromUrl || minstockFromUrl);
    // کنار ref های موجود:
    const mainRef = useRef<HTMLElement>(null);
    const loggedSearchRef = useRef<string | null>(null);
    const prevCatRef = useRef(categoryFromUrl);




    useEffect(() => {
        if (!searchFromUrl || isPending || !data) return;
        if (loggedSearchRef.current === searchFromUrl) return; // ضد تکرار
        loggedSearchRef.current = searchFromUrl;
        apiService.ad.logSearch({
            term: searchFromUrl,
            resultCount: data?.pages?.[0]?.pagination?.total ?? 0,
            armSlug: vitrineSlug,
        }).catch(() => {});
    }, [searchFromUrl, isPending, data, vitrineSlug]);
// بعد از تعریف categoryFromUrl:
    useEffect(() => {
        if (prevCatRef.current !== categoryFromUrl) {
            prevCatRef.current = categoryFromUrl;
            mainRef.current?.scrollTo({ top: 0 });
        }
    }, [categoryFromUrl]);




    // Infinite Scroll
    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el || !hasNextPage || isFetchingNextPage || isFetching) return;
        const observer = new IntersectionObserver((e) => { if (e[0].isIntersecting) fetchNextPage(); }, { rootMargin: '400px' });
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage]);

    // URL → Redux (سازگاری با بقیه UI)
    useEffect(() => {
        const cat = otherFilters.find((f) => f.type === 'category');
        if (categoryFromUrl) {
            if (!cat || cat.value !== categoryFromUrl) {
                const node = findNodeById(categoryTree, categoryFromUrl);
                if (node) {
                    if (cat) removeFilter(cat.id);
                    addFilter({ id: `category-${categoryFromUrl}`, label: node.title, value: categoryFromUrl, type: 'category' });
                }
            }
        } else if (cat) removeFilter(cat.id);

        const srch = otherFilters.find((f) => f.type === 'search');
        if (searchFromUrl) {
            if (!srch || srch.value !== searchFromUrl) {
                if (srch) removeFilter(srch.id);
                addFilter({ id: `search-${searchFromUrl}`, label: `جستجو: ${searchFromUrl}`, value: searchFromUrl, type: 'search' });
            }
        } else if (srch) removeFilter(srch.id);
    }, [categoryFromUrl, searchFromUrl, categoryTree, otherFilters, addFilter, removeFilter]);

    // Prefetch زیردسته‌ها
    useEffect(() => {
        if (!categoryTree.length) return;
        const level = selectedNode?.children?.length ? selectedNode.children : categoryTree;
        level.slice(0, 4).forEach((node: any) => {
            const targetParams = normalizeVitrineParams({ ...queryParams, categoryId: node.id, page: 1 });
            queryClient.prefetchInfiniteQuery({
                queryKey: vitrineKeys.list(vitrineSlug, targetParams),
                queryFn: () => apiService.ad.getVitrine(vitrineSlug, { ...targetParams, page: 1, limit: (targetParams as any).limit ?? 10 }),
                initialPageParam: 1,
            });
        });
    }, [selectedNode, categoryTree, queryParams, vitrineSlug, queryClient]);

    // عنوان صفحه (سئو) — شعار هم برای صفحه اصلی
    useEffect(() => {
        if (!currentArm) return;
        const parts: string[] = [];
        if (selectedNode?.title) parts.push(selectedNode.title);
        if (searchFromUrl) parts.push(`«${searchFromUrl}»`);
        document.title = parts.length
            ? `${parts.join(' | ')} | بازار ${currentArm.name}`
            : `بازار ${currentArm.name} | تابلوی قیمت عمده و لحظه‌ای`;
    }, [selectedNode, searchFromUrl, currentArm]);

    const pageHref = useCallback((p: number) => buildFilterHref(pathname, searchParams, categoryTree, { page: String(p) }), [pathname, searchParams, categoryTree]);

    const handleContactClick = useCallback(async (adId: string) => {
        if (!isAuthenticated) { router.push(`/login?arm=${currentSlug}&redirect=/${currentSlug}`); return; }
        if (isCalling) return;
        setIsCalling(true);
        try {
            let isMemberOfArm = false;
            if (arms) isMemberOfArm = arms.some((a: any) => a.slug === currentSlug && a.status === 'active');
            if (!isMemberOfArm) {
                try {
                    await apiService.arm.join(currentSlug || 'barton');
                    await refetchArms();
                } catch (joinError: any) {
                    if (joinError?.data?.errorCode !== 'ALREADY_MEMBER') {
                        toast.error('برای مشاهده شماره تماس، ابتدا به بازار بپیوندید');
                        setIsCalling(false);
                        return;
                    }
                }
            }
            const contactInfo = await apiService.ad.getContact(adId);
            const phoneToUse = contactInfo.ownerPhone || contactInfo.phone;
            if (!phoneToUse) { toast.error('شماره تماس برای این آگهی ثبت نشده است.'); return; }
            if (window.innerWidth < 768) window.location.href = `tel:${phoneToUse}`;
            else {
                toast.info(`${contactInfo.businessName}\nشماره: ${phoneToUse}`, { duration: 8000 });
                navigator.clipboard.writeText(phoneToUse).catch(() => {});
            }
        } catch (error: any) {
            if (error?.data?.errorCode === 'DAILY_CALL_LIMIT_EXCEEDED') toast.error(error?.data?.message || 'محدودیت تماس روزانه');
            else if (error?.data?.errorCode === 'NOT_MEMBER') toast.error('برای مشاهده شماره تماس، ابتدا به بازار بپیوندید');
            else toast.error(error?.message || 'خطا');
        } finally { setIsCalling(false); }
    }, [isAuthenticated, isCalling, currentSlug, router, arms, refetchArms]);

    useEffect(() => {
        if (armLoading) return;
        if (!currentSlug || !currentArm) {
            const lastSlug = localStorage.getItem('lastArmSlug');
            if (lastSlug) router.replace(`/${lastSlug}`);
            else router.replace('/no-arm');
            return;
        }
        setIsCheckingArm(false);
    }, [currentSlug, currentArm, armLoading, router]);

    if (armLoading || isCheckingArm) {
        return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" /></div>;
    }

    if (currentArm) {
        switch (currentArm.status) {
            case 'draft': return (
                <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-gray-950"><div className="text-center px-6">
                    <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6"><Clock className="w-12 h-12 text-amber-500" /></div>
                    <h2 className="text-2xl font-bold text-on-surface dark:text-gray-100 mb-3">{' بازار ' + currentArm.name + ' هنوز تأیید نشده است '}</h2>
                    <p className="text-sm text-on-surface-variant dark:text-gray-400 mx-auto leading-relaxed">بازار در حال راه‌اندازی و تکمیل تنظیمات است اگر صاحب این بازار هستید تنظیمات بازار را تکمیل کنید.</p>
                </div></div>);
            case 'archived': return (
                <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-gray-950"><div className="text-center px-6">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6"><Archive className="w-12 h-12 text-gray-500" /></div>
                    <h2 className="text-2xl font-bold text-on-surface dark:text-gray-100 mb-3">این بازار در حال حاضر غیرفعال است</h2>
                </div></div>);
            case 'maintenance': return (
                <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-gray-950"><div className="text-center px-6">
                    <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6"><Wrench className="w-12 h-12 text-blue-500" /></div>
                    <h2 className="text-2xl font-bold text-on-surface dark:text-gray-100 mb-3">بازار در حال ارتقا است</h2>
                </div></div>);
            default: break;
        }
    }

    return (
        <div className="h-screen supports-[height:100dvh]:h-[100dvh] flex flex-col bg-surface dark:bg-gray-950">
            {/* ناحیه بالا: هدر + سرچ/نوار فیلتر موبایل + تولبار دسکتاپ — چون main اسکرول داخلی دارد، طبیعتاً ثابت است */}
            <div className="flex-shrink-0 z-40">
                <AppHeader showLocation showBack={false} showSearch fixed={false} />

                <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-outline-variant/20 dark:border-gray-800">
                    <div className="px-3 pt-1.5"><SearchBox compact /></div>
                    <div className="pt-1.5">
                        <MobileFilterStrip categoryTree={categoryTree} resultCount={total} onOpenCategories={() => setSheetOpen(true)} />
                    </div>
                </div>


            </div>

            <div className="flex-1 min-h-0 flex">
                <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 overflow-y-auto scrollbar-slim
                    border-e border-outline-variant/20 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <CategorySidebar categoryTree={categoryTree} />
                </aside>

                <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto scrollbar-slim">
                    <div className="hidden lg:block bg-white dark:bg-gray-900 border-b border-outline-variant/20 dark:border-gray-800">
                        <DesktopFilterToolbar categoryTree={categoryTree} resultCount={total} />
                    </div>
                    <div className="px-3 lg:px-6 py-5 max-w-[1440px] mx-auto">
                        {isPending ? (
                            <div className="text-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4" />
                                <p className="text-sm text-on-surface-variant dark:text-gray-400">در حال بارگذاری قیمت‌ها...</p>
                            </div>
                        ) : hasAds ? (
                            <>
                                {/* ✅ موبایل: تک‌ستون (کارت‌های افقی AdCard) — گرید از md */}
                                <div className={cn(
                                    'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 transition-opacity',
                                    isPlaceholderData && 'opacity-60 pointer-events-none',
                                )}>
                                    {ads.map((ad: any) => (
                                        <AdCard key={ad.id} ad={ad} onContact={handleContactClick} onDetail={setSelectedAd} />
                                    ))}
                                </div>

                                {hasNextPage && (
                                    <div ref={loadMoreRef} className="flex items-center justify-center py-8">
                                        {isFetchingNextPage || isFetching ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <div className="h-1" />}
                                    </div>
                                )}

                                {totalPages > 1 && (
                                    <nav className="hidden" aria-hidden="true">
                                        {Array.from({ length: Math.min(totalPages, 20) }, (_, i) => i + 1).map((p) => (
                                            <Link key={p} href={pageHref(p)} rel={p === 2 ? 'next' : undefined}>صفحه {p}</Link>
                                        ))}
                                    </nav>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-24 px-4">
                                <div className="w-20 h-20 bg-surface-container-high dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Package className="w-10 h-10 text-on-surface-variant/30 dark:text-gray-600" />
                                </div>
                                <h2 className="text-xl font-bold text-on-surface dark:text-gray-100 mb-2">
                                    {hasActiveFilters ? 'هیچ قیمتی با این فیلترها پیدا نشد' : 'هنوز قیمتی ثبت نشده است'}
                                </h2>
                                <p className="text-sm text-on-surface-variant dark:text-gray-400 mb-1">خرید و فروش عمده، شفاف و لحظه‌ای</p>
                                <p className="text-sm text-on-surface-variant dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                                    {hasActiveFilters ? 'فیلترهای انتخاب‌شده را تغییر دهید یا از دسته‌بندی‌های دیگر دیدن کنید.' : 'اگر فروشنده عمده هستید، همین حالا اولین قیمت خود را ثبت کنید.'}
                                </p>
                                <div className="flex items-center justify-center gap-3 flex-wrap">
                                    {hasActiveFilters && (
                                        <Link href={buildFilterHref(pathname, searchParams, categoryTree, { resetAll: true })} scroll={false}
                                              className="h-10 px-5 bg-surface-container dark:bg-gray-800 border border-outline-variant dark:border-gray-700 text-on-surface dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-surface-container-high transition-colors flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" /> پاک کردن فیلترها
                                        </Link>
                                    )}
                                    {isAuthenticated && (
                                        <button onClick={() => router.push(`/ad/create?arm=${currentSlug}`)} className="h-10 px-5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 shadow-sm">ثبت قیمت جدید</button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="hidden lg:block mt-10"><AppFooter /></div>
                    </div>
                </main>
            </div>

            <div className="lg:hidden flex-shrink-0"><AppFooter activeTab="dashboard" /></div>

            {selectedAd && <AdModal ad={selectedAd} onClose={() => setSelectedAd(null)} onContact={handleContactClick} />}

            <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} categoryTree={categoryTree} />
        </div>
    );
}