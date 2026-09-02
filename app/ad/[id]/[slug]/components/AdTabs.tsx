// app/ad/[id]/components/AdTabs.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { FileText, CreditCard, Building2, BarChart3 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from "@/lib/utils";

const AdDetailsTab = dynamic(() => import('./AdDetailsTab'), {
    loading: () => <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
});

const AdPaymentTab = dynamic(() => import('./AdPaymentTab'), {
    loading: () => <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
});

const AdBusinessTab = dynamic(() => import('./AdBusinessTab'), {
    loading: () => <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
});

const AdStats = dynamic(
    () => import('@/app/arm-admin/ads/components/AdStats').then(mod => ({ default: mod.AdStats })),
    {
        loading: () => <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />,
        ssr: false
    },
);

interface Props {
    ad: any;
    isOwner: boolean;
}

export default function AdTabs({ ad, isOwner }: Props) {
    const hasDescription = !!(ad.description?.trim() || Object.keys(ad.specs || {}).length > 0);
    const hasPayment = !!(ad.paymentMethods?.cheque?.length || ad.paymentMethods?.installment?.length);

    // ✅ تب اولیه: توضیحات اگر وجود داشت، وگرنه فروشنده
    const defaultTab = hasDescription ? 'details' : 'business';
    const [activeTab, setActiveTab] = useState(defaultTab);

    // ✅ اگر ad تغییر کرد، تب اولیه ریست شود
    useEffect(() => {
        setActiveTab(hasDescription ? 'details' : 'business');
    }, [ad?.id]);

    const tabs = useMemo(() => {
        const list = [
            { id: 'details', label: 'توضیحات', icon: <FileText className="w-4 h-4" />, show: hasDescription },
            { id: 'payment', label: 'پرداخت', icon: <CreditCard className="w-4 h-4" />, show: hasPayment },
            { id: 'business', label: 'فروشنده', icon: <Building2 className="w-4 h-4" />, show: true },
            ...(isOwner ? [{ id: 'stats', label: 'آمار', icon: <BarChart3 className="w-4 h-4" />, show: true }] : []),
        ];
        return list.filter(tab => tab.show);
    }, [hasDescription, hasPayment, isOwner]);

    if (tabs.length === 0) return null;

    return (
        <div className="mt-6">
            {/* نوار تب‌ها - استایل دیجی‌کالا */}
            <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0">
                <div className="flex min-w-max sm:min-w-0 px-4 sm:px-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'px-5 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap relative',
                                activeTab === tab.id
                                    ? 'text-primary font-bold'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300',
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* محتوای تب‌ها - همه تب‌ها لود می‌شوند ولی فقط فعال نمایش داده می‌شود */}
            <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden">
                {/* ✅ تب توضیحات */}
                {hasDescription && (
                    <div className={cn(activeTab === 'details' ? 'block' : 'hidden')}>
                        <AdDetailsTab ad={ad} />
                    </div>
                )}

                {/* ✅ تب پرداخت */}
                {hasPayment && (
                    <div className={cn(activeTab === 'payment' ? 'block' : 'hidden')}>
                        <AdPaymentTab ad={ad} />
                    </div>
                )}

                {/* ✅ تب فروشنده - همیشه نمایش داده می‌شود */}
                <div className={cn(activeTab === 'business' ? 'block' : 'hidden')}>
                    <AdBusinessTab ad={ad} />
                </div>

                {/* ✅ تب آمار - فقط مالک */}
                {isOwner && (
                    <div className={cn(activeTab === 'stats' ? 'block' : 'hidden')}>
                        <AdStats adId={ad.id} />
                    </div>
                )}
            </div>
        </div>
    );
}