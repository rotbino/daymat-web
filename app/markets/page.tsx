// app/markets/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { Store, Users, Package, ArrowLeft, Search, Compass, X } from 'lucide-react';
import NavTabs from '@/app/home/nav/NavTabs';
import { cn } from '@/lib/utils';

/**
 * ✅ صفحهٔ لیست و جستجوی بازارها — «اکسپلور بازارها»
 *    این صفحه هیچ رفتار دیگری ندارد: همیشه لیست بازارهای عضو + سایر بازارها را نشان می‌دهد.
 *    نقطهٔ دسترسی: آیتم «سایر بازارها» در دراپ‌داون سوییچر بازار (هدر) — و تب «بازار» هنگامی که
 *    بازاری فعال روی redux نیست. دکمهٔ «ساخت بازار جدید» بعداً همین‌جا اضافه می‌شود.
 */

function MarketRow({ arm, mine }: { arm: any; mine?: boolean }) {
    return (
        <Link href={`/${arm.slug}`}
              className={cn(
                  'group w-full flex items-center gap-3.5 rounded-2xl border p-4 text-right transition-all hover:shadow-md',
                  mine
                      ? 'border-primary/25 bg-white dark:bg-gray-900 hover:border-primary/50'
                      : 'border-outline-variant/40 bg-white dark:bg-gray-900 hover:border-primary/40',
              )}>
            <div className="w-12 h-12 rounded-xl bg-surface-container-high dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {arm.logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={arm.logoUrl} alt="" className="w-full h-full object-cover" />
                    : <Store className={cn('w-5 h-5', mine ? 'text-primary' : 'text-on-surface-variant/50')} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-on-surface truncate group-hover:text-primary transition-colors">{arm.name}</p>
                {arm.slogan && <p className="text-[11px] text-on-surface-variant/70 truncate mt-0.5">{arm.slogan}</p>}
                <div className="flex items-center gap-3 text-[10px] text-on-surface-variant/60 mt-1">
                    <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{(arm._count?.memberships ?? 0).toLocaleString('fa-IR')} عضو</span>
                    <span className="flex items-center gap-0.5"><Package className="w-3 h-3" />{(arm._count?.ads ?? 0).toLocaleString('fa-IR')} کالا</span>
                </div>
            </div>
            {arm.status === 'paused' ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex-shrink-0">
                    متوقف
                </span>
            ) : (
                <ArrowLeft className="w-4 h-4 text-on-surface-variant/30 group-hover:text-primary group-hover:-translate-x-0.5 transition-all flex-shrink-0" />
            )}
        </Link>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <p className="text-[11px] font-bold text-on-surface-variant/70 px-1">{children}</p>;
}

export default function MarketsPage() {
    const [q, setQ] = useState('');

    const { data: userArms, isLoading: myLoading } = useQuery({
        queryKey: ['arms'],
        queryFn: () => apiService.arm.getUserArms(),
        staleTime: 60_000,
    });
    const { data: suggested, isLoading: sugLoading } = useQuery({
        queryKey: ['markets-explore'],
        queryFn: () => apiService.arm.getSuggestedArms(undefined, 30),
        staleTime: 1000 * 60 * 5,
    });

    const myMarkets = useMemo(() =>
        (userArms ?? []).filter((m: any) => m.status === 'active' || m.status === 'paused'),
    [userArms]);
    const otherMarkets = useMemo(() => suggested?.items ?? [], [suggested]);

    const query = q.trim().toLowerCase();
    const match = (m: any) => !query ||
        [m.name, m.slug, m.slogan, m.shortName].some((v: any) => (v || '').toString().toLowerCase().includes(query));
    const filteredMy = useMemo(() => myMarkets.filter(match), [myMarkets, query]);
    const filteredOther = useMemo(() => otherMarkets.filter(match), [otherMarkets, query]);

    const isLoading = myLoading || sugLoading;
    const nothingFound = !isLoading && !!query && filteredMy.length === 0 && filteredOther.length === 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-24">
            <NavTabs />
            <header className="max-w-3xl mx-auto px-4 pt-6 pb-3">
                <h1 className="text-lg font-black text-on-surface flex items-center gap-1.5">
                    <Compass className="w-5 h-5 text-primary" /> بازارها
                </h1>
                <p className="text-xs text-on-surface-variant mt-1">
                    لیست و جستجوی بازارها — بازارهای عضو و بازارهای دیگر را اینجا ببینید.
                </p>
            </header>

            {/* جستجو */}
            <div className="max-w-3xl mx-auto px-4 pb-3">
                <div className="relative">
                    <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="جستجوی بازار…"
                        className="w-full h-11 ps-10 pe-10 rounded-xl border border-outline-variant/40 bg-white dark:bg-gray-900
                            text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none
                            focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                    {q && (
                        <button type="button" onClick={() => setQ('')} aria-label="پاک کردن جستجو"
                                className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-container-high transition-colors">
                            <X className="w-3.5 h-3.5 text-on-surface-variant" />
                        </button>
                    )}
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 space-y-2.5">
                {isLoading ? (
                    <div className="min-h-[40vh] grid place-items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
                    </div>
                ) : (
                    <>
                        {filteredMy.length > 0 && (
                            <>
                                <SectionTitle>بازارهای شما</SectionTitle>
                                {filteredMy.map((m: any) => <MarketRow key={m.slug} arm={m} mine />)}
                            </>
                        )}

                        {filteredOther.length > 0 && (
                            <>
                                <p className="text-[11px] font-bold text-on-surface-variant/70 px-1 pt-3">
                                    {myMarkets.length > 0 ? 'سایر بازارها' : 'همهٔ بازارها'}
                                </p>
                                {filteredOther.map((arm: any) => <MarketRow key={arm.slug} arm={arm} />)}
                            </>
                        )}

                        {nothingFound && (
                            <div className="text-center py-14">
                                <Store className="w-11 h-11 text-on-surface-variant/20 mx-auto mb-3" />
                                <p className="text-sm font-bold text-on-surface">بازاری با این نام پیدا نشد</p>
                                <p className="text-xs text-on-surface-variant mt-1">عبارت دیگری را جستجو کنید.</p>
                            </div>
                        )}

                        {!query && filteredMy.length === 0 && filteredOther.length === 0 && (
                            <div className="text-center py-14">
                                <Store className="w-11 h-11 text-on-surface-variant/20 mx-auto mb-3" />
                                <p className="text-sm font-bold text-on-surface">بازاری فعال نشده است</p>
                                <p className="text-xs text-on-surface-variant mt-1">به‌زودی بازارهای جدیدی اضافه می‌شوند.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
