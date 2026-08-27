// app/c/[slug]/CatalogClient.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useBusinessBySlug, useCatalogAds } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    Phone, Share2, MapPin, Building2, BadgeCheck, Package,
    ArrowRight, Eye, Store, Clock, Search, ChevronLeft,
    Sparkles, X, User, Globe, Shield, LayoutGrid, List, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const WRAP = 'max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4';

function fmt(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

function getUrl(file: any): string {
    if (!file) return '';
    if (file.path?.startsWith('https://')) return file.path;
    if (file.fullUrl?.startsWith('https://')) return file.fullUrl;
    if (file.thumbnailPath?.startsWith('https://')) return file.thumbnailPath;
    return '/images/no_product_image.jpg';
}

const bizTypeMap: Record<string, string> = {
    producer: 'تولیدی', wholesaler: 'عمده‌فروش', importer: 'واردکننده',
    exporter: 'صادرکننده', distributor: 'توزیع‌کننده', retailer: 'خرده‌فروش',
    contractor: 'پیمانکار', service_provider: 'خدمات', other: 'سایر',
};

interface CatalogClientProps {
    slug: string;
    initialBusiness?: any;
    initialSearch?: string;
}

export default function CatalogClient({ slug, initialBusiness, initialSearch = '' }: CatalogClientProps) {
    const router = useRouter();
    const [query, setQuery] = useState(initialSearch || '');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [items, setItems] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = React.useRef<HTMLDivElement>(null);

    const { data: business } = useBusinessBySlug(slug);
    const displayBusiness = business || initialBusiness;

    const { data: adsData, isLoading: adsLoading, isFetching } = useCatalogAds(
        displayBusiness?.id || '', page, 24, query.trim() || undefined,
    );

    // ✅ تجمیع
    useEffect(() => {
        if (!adsData?.ads?.length) return;
        setItems(prev => {
            if (page === 1) return adsData.ads;
            const seen = new Set(prev.map(a => a.id));
            return [...prev, ...adsData.ads.filter(a => !seen.has(a.id))];
        });
        setHasMore(page < (adsData.pagination?.totalPages || 1));
    }, [adsData, page]);

    // ✅ ریست در جستجو
    useEffect(() => {
        setPage(1);
        setItems([]);
    }, [query]);

    // ✅ Infinite Scroll
    useEffect(() => {
        if (!loadMoreRef.current || !hasMore || isLoadingMore || adsLoading || isFetching) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && hasMore) {
                setIsLoadingMore(true);
                setPage(p => p + 1);
                setTimeout(() => setIsLoadingMore(false), 500);
            }
        }, { rootMargin: '200px' });
        obs.observe(loadMoreRef.current);
        return () => obs.disconnect();
    }, [hasMore, isLoadingMore, adsLoading, isFetching]);

    useEffect(() => {
        const v = localStorage.getItem('catalog-view');
        if (v === 'grid' || v === 'list') setView(v);
    }, []);

    const total = adsData?.pagination?.total || items.length;
    const activeCount = items.filter(ad => ad.status === 'active').length;
    const viewCount = items.reduce((s, ad) => s + (ad.viewCount || 0), 0);

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

    const tier = displayBusiness.verificationTier;
    const ownerAvatar = displayBusiness.owner?.avatarUrl || displayBusiness.owner?.avatarFile?.thumbnailPath;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pt-4">
            {/* دکمه‌های شناور */}
            <div className="absolute top-4 inset-x-0 z-30">
                <div className={cn(WRAP, 'flex justify-between')}>
                    <button onClick={() => router.back()} className="p-2.5 rounded-full bg-white/80 dark:bg-gray-900/70 backdrop-blur border shadow-md"><ArrowRight className="w-5 h-5" /></button>
                    <button onClick={handleShare} className="p-2.5 rounded-full bg-white/80 dark:bg-gray-900/70 backdrop-blur border shadow-md"><Share2 className="w-5 h-5" /></button>
                </div>
            </div>

            {/* ═══ هدر ═══ */}
            <header className="relative pt-14 pb-3 ">
                <div className={cn(WRAP)}>
                    {/* ═══ دسکتاپ: کارت یکپارچه ═══ */}
                    <div className="hidden sm:block">
                        <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xl">
                            <div className="h-1 bg-gradient-to-l from-primary via-fuchsia-500 to-amber-400" />

                            <div className="px-6 py-5">
                                <div className="flex items-center gap-6">
                                    {/* لوگو - بدون چرخش */}
                                    <div className="relative w-20 h-20 shrink-0">
                                        <div className="w-full h-full rounded-2xl p-[2px] bg-gradient-to-tr from-primary via-fuchsia-500 to-amber-400">
                                            <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-950 overflow-hidden">
                                                {displayBusiness.logoUrl ? (
                                                    <Image src={displayBusiness.logoUrl} alt={displayBusiness.name} fill sizes="80px" className="object-cover" unoptimized />
                                                ) : (
                                                    <div className="w-full h-full grid place-items-center bg-gray-50 dark:bg-gray-800"><Building2 className="w-8 h-8 text-gray-300" /></div>
                                                )}
                                            </div>
                                        </div>
                                        {tier && tier !== 'none' && (
                                            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white grid place-items-center border-2 border-white dark:border-gray-950 shadow-md">
                                                <BadgeCheck className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </div>

                                    {/* اطلاعات کسب‌وکار */}
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-xl font-extrabold">{displayBusiness.name}</h1>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {[bizTypeMap[displayBusiness.type], displayBusiness.city].filter(Boolean).join(' · ')}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />{fmt(total)} محصول</span>
                                            <span className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                                            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" />{fmt(activeCount)} فعال</span>
                                        </div>
                                    </div>

                                    {/* جداکننده */}
                                    <div className="w-px h-16 bg-gray-200 dark:bg-gray-700" />

                                    {/* فروشنده + تماس */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        {ownerAvatar ? (
                                            <Image src={ownerAvatar} alt={displayBusiness.owner?.fullName || ''} width={52} height={52}
                                                   className="rounded-2xl object-cover w-13 h-13 ring-2 ring-white dark:ring-gray-800 shadow-md" unoptimized />
                                        ) : (
                                            <div className="w-13 h-13 rounded-2xl bg-gray-100 dark:bg-gray-800 grid place-items-center"><User className="w-6 h-6 text-gray-400" /></div>
                                        )}
                                        <div>
                                            <p className="text-sm font-bold">{displayBusiness.owner?.fullName}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">فروشنده</p>
                                            <button onClick={handleContact}
                                                    className="mt-1.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition">
                                                <Phone className="w-3.5 h-3.5" />تماس و سفارش
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {displayBusiness.shortDescription && (
                                    <p className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs leading-6 text-gray-600 dark:text-gray-300 line-clamp-2">
                                        {displayBusiness.shortDescription}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ═══ موبایل ═══ */}
                    <div className="sm:hidden">
                        <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg">
                            <div className="h-0.5 bg-gradient-to-l from-primary via-fuchsia-500 to-amber-400" />
                            <div className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-14 h-14 shrink-0">
                                        <div className="w-full h-full rounded-xl p-[2px] bg-gradient-to-tr from-primary via-fuchsia-500 to-amber-400">
                                            <div className="w-full h-full rounded-xl bg-white dark:bg-gray-950 overflow-hidden">
                                                {displayBusiness.logoUrl ? (
                                                    <Image src={displayBusiness.logoUrl} alt={displayBusiness.name} fill sizes="56px" className="object-cover" unoptimized />
                                                ) : (
                                                    <div className="w-full h-full grid place-items-center bg-gray-50 dark:bg-gray-800"><Building2 className="w-6 h-6 text-gray-300" /></div>
                                                )}
                                            </div>
                                        </div>
                                        {tier && tier !== 'none' && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white grid place-items-center border-2 border-white dark:border-gray-950">
                                                <BadgeCheck className="w-2.5 h-2.5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-base font-extrabold truncate">{displayBusiness.name}</h1>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {[bizTypeMap[displayBusiness.type], displayBusiness.city].filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-gray-800 my-3" />

                                {displayBusiness.owner?.fullName && (
                                    <div className="flex items-center gap-2.5">
                                        {ownerAvatar ? (
                                            <Image src={ownerAvatar} alt={displayBusiness.owner.fullName} width={36} height={36}
                                                   className="rounded-lg object-cover w-9 h-9" unoptimized />
                                        ) : (
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 grid place-items-center"><User className="w-4 h-4 text-gray-400" /></div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">{displayBusiness.owner.fullName}</p>
                                            <p className="text-[9px] text-gray-400">فروشنده</p>
                                        </div>
                                        <button onClick={handleContact}
                                                className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-[10px] font-bold">
                                            <Phone className="w-3 h-3" />تماس و سفارش
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
                                    <span>{fmt(total)} محصول</span>
                                    <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                                    <span>{fmt(activeCount)} فعال</span>
                                </div>

                                {displayBusiness.shortDescription && (
                                    <p className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] leading-5 text-gray-600 dark:text-gray-300 line-clamp-2">
                                        {displayBusiness.shortDescription}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ═══ جستجو + سوییچ ═══ */}
            <div className="sticky top-0 z-30 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/70">
                <div className={cn(WRAP, 'py-2.5')}>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو در محصولات…"
                                   className="w-full h-10 pr-10 pl-9 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/40" />
                            {query && <button onClick={() => setQuery('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400"><X className="w-3.5 h-3.5" /></button>}
                        </div>
                        <div className="flex p-0.5 rounded-xl bg-gray-100 dark:bg-gray-900">
                            <button onClick={() => { setView('grid'); localStorage.setItem('catalog-view', 'grid'); }} className={cn('p-1.5 rounded-lg transition', view === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400')}><LayoutGrid className="w-4 h-4" /></button>
                            <button onClick={() => { setView('list'); localStorage.setItem('catalog-view', 'list'); }} className={cn('p-1.5 rounded-lg transition', view === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-400')}><List className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ محصولات ═══ */}
            <main className="pb-16">
                <div className={cn(WRAP, 'pt-5')}>
                    {/* هدر بخش */}
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-primary" />محصولات
                            <span className="text-gray-400 text-xs">({fmt(total)})</span>
                        </h2>
                    </div>

                    {/* ✅ اول هدر رندر می‌شود، بعد آگهی‌ها lazy */}
                    <div className={cn('transition-opacity duration-300', isFetching && items.length > 0 ? 'opacity-50' : 'opacity-100')}>
                        {adsLoading && items.length === 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-14">
                                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">{query ? 'نتیجه‌ای پیدا نشد' : 'هنوز محصولی ثبت نشده است'}</p>
                            </div>
                        ) : view === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {items.map((ad: any, i: number) => {
                                    const unit = ad.unit?.shortCode || '';
                                    const imgUrl = getUrl(ad.files?.[0]);
                                    const title = ad.productType || ad.title || '';
                                    const persianSlug = title.replace(/\s+/g, '-').replace(/[^\u0600-\u06FF\w\-]/g, '').substring(0, 60);
                                    return (
                                        <button key={ad.id} onClick={() => router.push(`/ad/${ad.id}/${persianSlug}`)}
                                                className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
                                            <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                                                <Image src={imgUrl} alt={title} fill sizes="25vw" loading="lazy" className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                                                {ad.isBumped && <span className="absolute top-2 right-2 px-2 py-0.5 bg-primary text-white text-[9px] rounded-full">ویژه</span>}
                                            </div>
                                            <div className="p-2.5 text-right">
                                                <p className="text-xs font-bold line-clamp-1">{title}</p>
                                                <div className="flex justify-between mt-1">
                                                    <span className="text-sm font-extrabold text-primary">{fmt(ad.unitPrice)}</span>
                                                    {unit && <span className="text-[9px] text-gray-400">{unit}</span>}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {items.map((ad: any) => {
                                    const unit = ad.unit?.shortCode || '';
                                    const imgUrl = getUrl(ad.files?.[0]);
                                    const title = ad.productType || ad.title || '';
                                    const persianSlug = title.replace(/\s+/g, '-').replace(/[^\u0600-\u06FF\w\-]/g, '').substring(0, 60);
                                    return (
                                        <button key={ad.id} onClick={() => router.push(`/ad/${ad.id}/${persianSlug}`)}
                                                className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-gray-900 border shadow-sm hover:shadow-md transition">
                                            <div className="w-14 h-14 rounded-lg overflow-hidden relative shrink-0">
                                                <Image src={imgUrl} alt={title} fill sizes="56px" loading="lazy" className="object-cover" unoptimized />
                                            </div>
                                            <div className="flex-1 text-right">
                                                <p className="text-xs font-bold line-clamp-1">{title}</p>
                                                <p className="text-sm font-extrabold text-primary mt-1">{fmt(ad.unitPrice)} {unit && <span className="text-[9px] font-normal text-gray-400">{unit}</span>}</p>
                                            </div>
                                            <ChevronLeft className="w-4 h-4 text-gray-300" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* لود بیشتر */}
                    {hasMore && (
                        <div ref={loadMoreRef} className="flex justify-center py-6">
                            {isLoadingMore || isFetching ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <div className="h-1" />}
                        </div>
                    )}
                </div>
            </main>

            {/* ═══ فوتر ═══ */}
            <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className={cn(WRAP, 'py-8')}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">تماس</h3>
                            {displayBusiness.phone && <a href={`tel:${displayBusiness.phone}`} className="block text-gray-500" dir="ltr">{displayBusiness.phone}</a>}
                            {displayBusiness.owner?.phone && displayBusiness.owner?.phone !== displayBusiness.phone && <a href={`tel:${displayBusiness.owner.phone}`} className="block text-gray-500 mt-1" dir="ltr">{displayBusiness.owner.phone}</a>}
                            {displayBusiness.owner?.fullName && <p className="flex items-center gap-1.5 text-gray-500 mt-1"><User className="w-3 h-3" />{displayBusiness.owner.fullName}</p>}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">موقعیت</h3>
                            {displayBusiness.city && <p className="flex items-center gap-1.5 text-gray-500"><MapPin className="w-3 h-3" />{displayBusiness.city}</p>}
                            {displayBusiness.address && <p className="text-gray-500 mt-1">{displayBusiness.address}</p>}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">اطلاعات</h3>
                            {displayBusiness.type && <p className="flex items-center gap-1.5 text-gray-500"><Store className="w-3 h-3" />{bizTypeMap[displayBusiness.type]}</p>}
                            {displayBusiness.createdAt && <p className="flex items-center gap-1.5 text-gray-500 mt-1"><Clock className="w-3 h-3" />عضویت از {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(new Date(displayBusiness.createdAt))}</p>}
                        </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2">
                        <div className="relative h-10 w-40">
                            <Image src="/images/logo2.png" alt="دیمت" fill className="object-contain" unoptimized />
                        </div>
                        <p className="text-[16px] text-gray-500 dark:text-gray-400">دیمت نمایشگر قیمت عمده روزانه</p>
                        <p className="text-[10px] text-gray-400">© {new Date().toLocaleDateString('fa-IR', { year: 'numeric' })}</p>
                    </div>
                </div>
            </footer>

            {/* نوار تماس موبایل */}
            <div className="fixed bottom-0 inset-x-0 z-40 md:hidden">
                <div className="bg-white/85 dark:bg-gray-950/85 backdrop-blur border-t px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    <button onClick={handleContact} className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />تماس و استعلام قیمت
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin-slow { to { transform: rotate(360deg); } }
                .anim-spin-slow { animation: spin-slow 8s linear infinite; }
            `}</style>
        </div>
    );
}