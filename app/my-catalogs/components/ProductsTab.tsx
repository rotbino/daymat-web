// app/my-catalogs/components/ProductsTab.tsx
'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Layers, Package, Plus } from 'lucide-react';
import { ProductRow } from './ProductRow';
import { cn } from '@/lib/utils';
import { fmt, isAdExpired, inMarket, isUncategorized, StatusFilter } from '../constants';

function RowSkeleton() {
    return <div style={{ height: 116 }} className="rounded-lg bg-surface-container-high/50 dark:bg-gray-800/60 animate-pulse" />;
}

interface Props {
    products: any[];
    adsLoading: boolean;
    statusFilter: StatusFilter;
    onFilterChange: (f: StatusFilter) => void;
    currentCatalog: any;
    onOpenCategorySettings: () => void;
    onOpenUnitSettings: () => void;
    onCategory: (ad: any) => void;
    onRefresh: (ad: any) => void;
    onPublish: (ad: any) => void;
}

/** تب محصولات — قلب پنل مدیریت کاتالوگ */
export default function ProductsTab({
    products, adsLoading, statusFilter, onFilterChange, currentCatalog,
    onOpenCategorySettings, onOpenUnitSettings, onCategory, onRefresh, onPublish,
}: Props) {
    const router = useRouter();
    const isService = currentCatalog.salesType === 'service';

    const counts = useMemo(() => ({
        all: products.length,
        table: products.filter((a) => a.status === 'active' && !isAdExpired(a) && inMarket(a) && !!a.armId).length,
        catalog: products.filter((a) => !inMarket(a)).length,
        stale: products.filter((a) => isAdExpired(a) && inMarket(a)).length,
        uncat: products.filter(isUncategorized).length,
    }), [products]);

    const filtered = useMemo(() => products.filter((ad) => {
        if (statusFilter === 'table') return ad.status === 'active' && !isAdExpired(ad) && inMarket(ad) && !!ad.armId;
        if (statusFilter === 'catalog') return !inMarket(ad);
        if (statusFilter === 'stale') return isAdExpired(ad) && inMarket(ad);
        if (statusFilter === 'uncat') return isUncategorized(ad);
        return true;
    }), [products, statusFilter]);

    const filters: readonly (readonly [StatusFilter, string])[] = [
        ['all', `همه (${fmt(counts.all)})`],
        ['table', `روی تابلو (${fmt(counts.table)})`],
        ['catalog', `فقط کاتالوگ (${fmt(counts.catalog)})`],
        ['stale', `نیازمند قیمت تازه (${fmt(counts.stale)})`],
        ...(counts.uncat > 0 ? ([['uncat', `بی‌دسته در بازار (${fmt(counts.uncat)})`]] as const) : []),
    ];

    return (
        <div className="space-y-2.5">
            {/* 🧰 نوار ابزار کالاها — آیکون‌های ساده بدون کانتینر (بنا بر بازخورد) + افزودن در انتها
                مارجین بالا/پایین برای تنفس بهتر المان‌ها */}
            <div className="flex items-center gap-1 my-3">
                {!isService && (
                    <>
                        <button onClick={onOpenCategorySettings} title="دسته‌بندی‌های کاتالوگ — گروه‌بندی کالاها" aria-label="دسته‌بندی‌های کاتالوگ"
                                className="w-9 h-9 -ms-1.5 grid place-items-center rounded-lg text-on-surface-variant
                                    hover:text-primary hover:bg-primary/5 active:scale-90 transition-all flex-shrink-0">
                            <BookOpen className="w-[21px] h-[21px]" />
                        </button>
                        <button onClick={onOpenUnitSettings} title="واحدهای کاتالوگ — کارتن، بسته و..." aria-label="واحدهای کاتالوگ"
                                className="w-9 h-9 grid place-items-center rounded-lg text-on-surface-variant
                                    hover:text-primary hover:bg-primary/5 active:scale-90 transition-all flex-shrink-0">
                            <Layers className="w-[21px] h-[21px]" />
                        </button>
                    </>
                )}
                <span className="flex-1" />
                {/* ✨ CTA اصلی — جمع‌وجور در انتهای نوار */}
                <button onClick={() => router.push(`/ad/create?catalog=${currentCatalog.id}`)}
                        className="h-9 px-3.5 rounded-lg bg-amber-500 text-white text-[12px] font-extrabold
                            flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap
                            hover:bg-amber-600 active:scale-[0.97] transition-all">
                    <Plus className="w-4 h-4" />
                    {isService ? 'افزودن خدمت' : 'افزودن محصول'}
                </button>
            </div>

            {/* نوار فیلتر وضعیت کالاها */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                {filters.map(([k, label]) => (
                    <button key={k} onClick={() => onFilterChange(k)}
                            className={cn('h-8 px-3.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-colors',
                                statusFilter === k
                                    ? 'bg-primary/10 border-primary/40 text-primary'
                                    : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/30')}>
                        {label}
                    </button>
                ))}
            </div>

            {adsLoading ? (
                <div className="space-y-2.5">{[0, 1, 2].map((i) => <RowSkeleton key={i} />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-10 rounded-lg border border-dashed border-outline-variant/50 dark:border-gray-700">
                    <Package className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-2.5" />
                    <p className="text-sm text-on-surface-variant">{isService ? ' خدمتی نیست' : ' محصولی نیست '}</p>
                    <button onClick={() => router.push(`/ad/create?catalog=${currentCatalog.id}`)}
                            className="mt-3 h-9 px-4 rounded-lg bg-amber-500 text-white text-xs font-extrabold hover:bg-amber-600 transition-colors">
                        {isService ? 'افزودن اولین خدمت' : 'افزودن اولین محصول'}
                    </button>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filtered.map((ad) => (
                        <ProductRow
                            key={ad.id}
                            ad={ad}
                            onEdit={(a) => router.push(`/ad/edit/${a.id}?catalog=${currentCatalog.id}`)}
                            onCategory={onCategory}
                            onRefresh={onRefresh}
                            onPublish={onPublish}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
