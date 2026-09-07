// app/market/page.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { Store, Users, Package, ArrowLeft } from 'lucide-react';
import NavTabs from '@/app/home/nav/NavTabs';
import { useRouter } from 'next/navigation';

const HomeContent = dynamic(() => import('@/app/market/MarketContent'), {
    loading: () => <FullSpinner />,
});

function FullSpinner() {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" /></div>;
}

/**
 * تب «بازار»: کارنت دارد → تابلوی بازار | کارنت ندارد → بازاهای من + پیشنهادها
 */
export default function MarketPage() {
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);

    if (currentSlug && currentArm) return <HomeContent />;
    return <MarketPicker />;
}

function MarketPicker() {
    const router = useRouter();
    const { data: userArms, isLoading: myLoading } = useQuery({
        queryKey: ['arms'],
        queryFn: () => apiService.arm.getUserArms(),
        staleTime: 60_000,
    });
    const { data: suggested, isLoading: sugLoading } = useQuery({
        queryKey: ['market-picker'],
        queryFn: () => apiService.arm.getSuggestedArms(undefined, 20),
        staleTime: 1000 * 60 * 5,
    });

    const myMarkets = (userArms ?? []).filter((m: any) =>
        m.status === 'active' || m.status === 'paused',
    );
    const isLoading = myLoading || sugLoading;

    if (!isLoading && myMarkets.length === 0) {
        return <SuggestedMarkets items={suggested?.items ?? []} loading={sugLoading} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-24">
            <NavTabs />
            <header className="max-w-3xl mx-auto px-4 pt-6 pb-4">
                <h1 className="text-lg font-black text-on-surface flex items-center gap-1.5">
                    <Store className="w-4.5 h-4.5 text-primary" /> بازارها
                </h1>
                <p className="text-xs text-on-surface-variant mt-1">کدام بازار را باز کنم؟ — انتخابت برای دفعات بعد می‌ماند.</p>
            </header>
            <main className="max-w-3xl mx-auto px-4 space-y-2.5">
                {myMarkets.length > 0 && (
                    <>
                        <p className="text-[11px] font-bold text-on-surface-variant/70 px-1 mt-1">بازاهای من</p>
                        {myMarkets.map((m: any) => (
                            <button key={m.slug} onClick={() => router.push(`/${m.slug}`)}
                                    className="group w-full flex items-center gap-3.5 rounded-2xl border border-primary/25
                                    bg-white dark:bg-gray-900 p-4 text-right hover:border-primary/50 hover:shadow-md transition-all">
                                <div className="w-12 h-12 rounded-xl bg-surface-container-high dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {m.logoUrl
                                        ? <img src={m.logoUrl} alt="" className="w-full h-full object-cover" />
                                        : <Store className="w-5 h-5 text-primary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-extrabold text-on-surface truncate group-hover:text-primary transition-colors">{m.name}</p>
                                    {m.slogan && <p className="text-[11px] text-on-surface-variant/70 truncate mt-0.5">{m.slogan}</p>}
                                </div>
                                {m.status === 'paused' ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex-shrink-0">
                                        متوقف
                                    </span>
                                ) : (
                                    <ArrowLeft className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </>
                )}
                {!isLoading && (suggested?.items ?? []).length > 0 && (
                    <>
                        <p className="text-[11px] font-bold text-on-surface-variant/70 px-1 pt-3">بازارهای دیگر</p>
                        {(suggested?.items ?? []).map((arm: any) => (
                            <button key={arm.slug} onClick={() => router.push(`/${arm.slug}`)}
                                    className="group w-full flex items-center gap-3.5 rounded-2xl border border-outline-variant/40
                                    bg-white dark:bg-gray-900 p-4 text-right hover:border-primary/40 hover:shadow-md transition-all">
                                <div className="w-12 h-12 rounded-xl bg-surface-container-high dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {arm.logoUrl
                                        ? <img src={arm.logoUrl} alt="" className="w-full h-full object-cover" />
                                        : <Store className="w-5 h-5 text-on-surface-variant/50" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-extrabold text-on-surface truncate group-hover:text-primary transition-colors">{arm.name}</p>
                                    {arm.slogan && <p className="text-[11px] text-on-surface-variant/70 truncate mt-0.5">{arm.slogan}</p>}
                                    <div className="flex items-center gap-3 text-[10px] text-on-surface-variant/60 mt-1">
                                        <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{(arm._count?.memberships ?? 0).toLocaleString('fa-IR')} عضو</span>
                                        <span className="flex items-center gap-0.5"><Package className="w-3 h-3" />{(arm._count?.ads ?? 0).toLocaleString('fa-IR')} کالا</span>
                                    </div>
                                </div>
                                <ArrowLeft className="w-4 h-4 text-on-surface-variant/30 group-hover:text-primary flex-shrink-0" />
                            </button>
                        ))}
                    </>
                )}
            </main>
        </div>
    );
}

function SuggestedMarkets({ items, loading }: { items: any[]; loading: boolean }) {
    const router = useRouter();
    if (loading) return <div className="min-h-screen grid place-items-center"><div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" /></div>;
    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-24">
            <NavTabs />
            <header className="max-w-3xl mx-auto px-4 pt-6 pb-4">
                <h1 className="text-lg font-black text-on-surface flex items-center gap-1.5"><Store className="w-4.5 h-4.5 text-primary" /> بازارها</h1>
                <p className="text-xs text-on-surface-variant mt-1">هنوز عضو هیچ بازاری نشده‌ای — یکی را انتخاب کن</p>
            </header>
            <main className="max-w-3xl mx-auto px-4 space-y-2.5">
                {items.length === 0 ? (
                    <div className="text-center py-14"><Store className="w-11 h-11 text-on-surface-variant/20 mx-auto mb-3" /><p className="text-sm text-on-surface-variant">بازاری فعال نشده است</p></div>
                ) : items.map((arm: any) => (
                    <button key={arm.slug} onClick={() => router.push(`/${arm.slug}`)}
                            className="group w-full flex items-center gap-3.5 rounded-2xl border border-outline-variant/40
                            bg-white dark:bg-gray-900 p-4 text-right hover:border-primary/40 hover:shadow-md transition-all">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-high dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {arm.logoUrl ? <img src={arm.logoUrl} alt="" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 text-on-surface-variant/50" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-extrabold text-on-surface truncate group-hover:text-primary transition-colors">{arm.name}</p>
                            {arm.slogan && <p className="text-[11px] text-on-surface-variant/70 truncate mt-0.5">{arm.slogan}</p>}
                            <div className="flex items-center gap-3 text-[10px] text-on-surface-variant/60 mt-1">
                                <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{(arm._count?.memberships ?? 0).toLocaleString('fa-IR')} عضو</span>
                                <span className="flex items-center gap-0.5"><Package className="w-3 h-3" />{(arm._count?.ads ?? 0).toLocaleString('fa-IR')} کالا</span>
                            </div>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-on-surface-variant/30 group-hover:text-primary flex-shrink-0" />
                    </button>
                ))}
            </main>
        </div>
    );
}