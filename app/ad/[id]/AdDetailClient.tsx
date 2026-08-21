// app/ad/[id]/AdDetailClient.tsx
'use client';

import React, { Suspense, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useAdDetail } from '@/lib/api/apiHooks';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// ✅ Lazy Loading کامپوننتها
const AdHeader = dynamic(() => import('./components/AdHeader'), {
    loading: () => <div className="h-14 bg-white/85 backdrop-blur-xl border-b animate-pulse" />,
});

const AdGallery = dynamic(() => import('./components/AdGallery'), {
    loading: () => <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />,
});

const AdSidebar = dynamic(() => import('./components/AdSidebar'), {
    loading: () => (
        <div className="space-y-3.5">
            <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
    ),
});

const AdTabs = dynamic(() => import('./components/AdTabs'), {
    loading: () => <div className="h-64 bg-gray-100 rounded-2xl animate-pulse mt-8" />,
});

interface AdDetailClientProps {
    adId: string;
    initialData?: any;
}

export default function AdDetailClient({ adId, initialData }: AdDetailClientProps) {
    const { user } = useSelector((state: RootState) => state.auth);

    // ✅ استفاده از initialData برای جلوگیری از loading
    const { data: ad, isLoading } = useAdDetail(adId, initialData);

    // اگه initialData داریم و data هنوز نیومده، از initialData استفاده کن
    const displayAd = ad || initialData;

    // ✅ محاسبه مالکیت
    const isOwner = useMemo(() => {
        if (!displayAd?.business?.owner?.id || !user?.id) return false;
        return displayAd.business.owner.id === user.id;
    }, [displayAd, user]);

    if (!displayAd) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-9 h-9 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* هدر */}
            <AdHeader ad={displayAd} />

            {/* محتوای اصلی */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-28 md:pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    {/* گالری */}
                    <div className="lg:col-span-3">
                        <Suspense fallback={<div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />}>
                            <AdGallery images={displayAd.files} title={displayAd.productType || displayAd.title} />
                        </Suspense>
                    </div>

                    {/* سایدبار */}
                    <div className="lg:col-span-2">
                        <Suspense fallback={
                            <div className="space-y-3.5">
                                <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
                                <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                            </div>
                        }>
                            <AdSidebar
                                ad={displayAd}
                                isOwner={isOwner}
                                onSaveToggle={() => {}}
                            />
                        </Suspense>
                    </div>
                </div>

                {/* تبها */}
                <Suspense fallback={<div className="h-64 bg-gray-100 rounded-2xl animate-pulse mt-8" />}>
                    <AdTabs ad={displayAd} isOwner={isOwner} />
                </Suspense>
            </main>
        </div>
    );
}