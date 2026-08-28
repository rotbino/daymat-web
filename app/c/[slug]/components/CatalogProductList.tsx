// app/c/[slug]/components/CatalogProductList.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, LayoutGrid, List, Loader2, Package, Search, X } from 'lucide-react';
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

interface CatalogProductListProps {
    ads: any[];
    total: number;
    query: string;
    setQuery: (q: string) => void;
    view: 'grid' | 'list';
    setView: (v: 'grid' | 'list') => void;
    isLoading: boolean;
    isFetching: boolean;
    loadMoreRef: React.RefObject<HTMLDivElement>;
    isLoadingMore: boolean;
}

export default function CatalogProductList({
                                               ads, total, query, setQuery, view, setView,
                                               isLoading, isFetching, loadMoreRef, isLoadingMore,
                                           }: CatalogProductListProps) {
    const router = useRouter();

    // ✅ فیلتر کلاینتی
    const filteredAds = query.trim()
        ? ads.filter(ad => (ad.productType || ad.title || '').includes(query.trim()))
        : ads;

    return (
        <main className="pb-16">
            {/* جستجو */}
            <div className="sticky top-0 z-30 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/70">
                <div className={cn(WRAP, 'py-2.5')}>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو در محصولات…"
                                   className="w-full h-10 pr-10 pl-9 rounded-xl bg-white dark:bg-gray-900 border text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/40" />
                            {query && <button onClick={() => setQuery('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400"><X className="w-3.5 h-3.5" /></button>}
                        </div>
                        <div className="flex p-0.5 rounded-xl bg-gray-100 dark:bg-gray-900">
                            <button onClick={() => setView('grid')} className={cn('p-1.5 rounded-lg transition', view === 'grid' ? 'bg-white shadow-sm' : 'text-gray-400')}><LayoutGrid className="w-4 h-4" /></button>
                            <button onClick={() => setView('list')} className={cn('p-1.5 rounded-lg transition', view === 'list' ? 'bg-white shadow-sm' : 'text-gray-400')}><List className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cn(WRAP, 'pt-5')}>
                <div className="flex items-end justify-between gap-4 mb-5">
                    <div>
                        <h2 className="text-[14px] sm:text-[18px] font-black">کاتالوگ محصولات</h2>
                    </div>
                    <div className="flex items-center gap-3 pb-0.5">
                                <span className="text-xs font-semibold text-gray-400 tabular-nums whitespace-nowrap">
                                    {fmt(total)} محصول
                                </span>

                    </div>
                </div>


                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredAds.length === 0 ? (
                    <div className="text-center py-14">
                        <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">{query ? 'نتیجه‌ای پیدا نشد' : 'هنوز محصولی ثبت نشده است'}</p>
                    </div>
                ) : view === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredAds.map((ad) => {
                            const unit = ad.unit?.shortCode || '';
                            const imgUrl = getUrl(ad.files?.[0]);
                            const title = ad.productType || ad.title || '';
                            const persianSlug = title.replace(/\s+/g, '-').replace(/[^\u0600-\u06FF\w\-]/g, '').substring(0, 60);
                            return (
                                <button key={ad.id} onClick={() => router.push(`/ad/${ad.id}/${persianSlug}`)}
                                        className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
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
                        {filteredAds.map((ad) => {
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

                {/* لود بیشتر */}
                <div ref={loadMoreRef} className="flex justify-center py-4 h-8">
                    {isLoadingMore || isFetching ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : null}
                </div>
            </div>
        </main>
    );
}