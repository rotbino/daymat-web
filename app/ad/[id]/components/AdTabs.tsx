// app/ad/[id]/components/AdTabs.tsx
'use client';

import { useState, useMemo, Suspense } from 'react';
import { FileText, CreditCard, Building2, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// ✅ Lazy Loading تب‌ها
const AdDetailsTab = dynamic(() => import('./AdDetailsTab'), {
    loading: () => <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />,
});
const AdPaymentTab = dynamic(() => import('./AdPaymentTab'), {
    loading: () => <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />,
});
const AdBusinessTab = dynamic(() => import('./AdBusinessTab'), {
    loading: () => <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />,
});

// ✅ اصلاح: استفاده از named export
const AdStats = dynamic(
    () => import('@/app/arm-admin/ads/components/AdStats').then(mod => ({ default: mod.AdStats })),
    {
        loading: () => <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />,
        ssr: false
    }
);

interface AdTabsProps {
    ad: any;
    isOwner: boolean;
}

export default function AdTabs({ ad, isOwner }: AdTabsProps) {
    const [activeTab, setActiveTab] = useState('details');

    const tabs = useMemo(() => {
        const t: { id: string; label: string; icon: React.ReactNode }[] = [];
        if (isOwner) t.push({ id: 'stats', label: 'آمار', icon: <BarChart3 className="w-4 h-4" /> });
        if (ad.description?.trim() || Object.keys(ad.specs || {}).length > 0) {
            t.push({ id: 'details', label: 'توضیحات', icon: <FileText className="w-4 h-4" /> });
        }
        if (ad.paymentMethods?.cheque?.length > 0 || ad.paymentMethods?.installment?.length > 0) {
            t.push({ id: 'payment', label: 'پرداخت', icon: <CreditCard className="w-4 h-4" /> });
        }
        t.push({ id: 'business', label: 'فروشنده', icon: <Building2 className="w-4 h-4" /> });
        return t;
    }, [ad, isOwner]);

    if (tabs.length === 0) return null;

    return (
        <div className="mt-8">
            {/* نوار تب‌ها */}
            <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
                <div className="flex gap-1 border-b border-gray-200/60 dark:border-gray-800/60 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 -mb-px',
                                activeTab === tab.id
                                    ? 'text-primary bg-white dark:bg-gray-900 border border-b-0 border-gray-200/60 dark:border-gray-800/60'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* محتوای تب‌ها */}
            <div className="mt-5">
                {activeTab === 'details' && (
                    <Suspense fallback={<div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />}>
                        <AdDetailsTab ad={ad} />
                    </Suspense>
                )}
                {activeTab === 'payment' && (
                    <Suspense fallback={<div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />}>
                        <AdPaymentTab ad={ad} />
                    </Suspense>
                )}
                {activeTab === 'business' && (
                    <Suspense fallback={<div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />}>
                        <AdBusinessTab ad={ad} />
                    </Suspense>
                )}
                {activeTab === 'stats' && isOwner && (
                    <Suspense fallback={<div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />}>
                        <AdStats adId={ad.id} />
                    </Suspense>
                )}
            </div>
        </div>
    );
}