// app/ad/[id]/[slug]/AdDetailClient.tsx
'use client';

import React, { Suspense, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useAdDetail, useAdSaved } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const AdHeader = dynamic(() => import('./components/AdHeader'), {
    loading: () => <div className="h-14 bg-white/85 backdrop-blur-xl border-b animate-pulse" />,
});

const AdGallery = dynamic(() => import('./components/AdGallery'), {
    loading: () => <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />,
});

const AdPriceCard = dynamic(() => import('./components/AdPriceCard'), {
    loading: () => (
        <div className="space-y-3.5">
            <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
    ),
});

const AdTabs = dynamic(() => import('./components/AdTabs'), {
    loading: () => <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />,
});

interface Props {
    adId: string;
    initialData?: any;
}

export default function AdDetailClient({ adId, initialData }: Props) {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: ad, isLoading } = useAdDetail(adId, initialData);
    const { data: savedData, refetch: refetchSaved } = useAdSaved(adId);

    const [localSaved, setLocalSaved] = useState<boolean | null>(null);

    const isSaved = localSaved !== null ? localSaved : (savedData?.isSaved || false);

    const isOwner = useMemo(() => {
        if (!ad?.business?.owner?.id || !user?.id) return false;
        return ad.business.owner.id === user.id;
    }, [ad, user]);

    const displayAd = ad || initialData;

    const handleSaveToggle = useCallback(async () => {
        if (!user) {
            router.push(`/login?redirect=/ad/${adId}`);
            return;
        }

        try {
            if (isSaved) {
                await apiService.ad.unsave(adId);
                setLocalSaved(false);
                toast.success('حذف از ذخیره‌ها');
            } else {
                await apiService.ad.save(adId);
                setLocalSaved(true);
                toast.success('ذخیره شد');
            }
            refetchSaved();
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.message || 'خطا در ذخیره آگهی';
            toast.error(errorMessage);
        }
    }, [user, isSaved, adId, refetchSaved, router]);
// app/ad/[id]/[slug]/AdDetailClient.tsx

    const handleContact = useCallback(() => {
        const phone = displayAd?.business?.phone || displayAd?.business?.owner?.phone;
        if (!phone) {
            toast.error('شماره تماس ثبت نشده است');
            return;
        }
        if (window.innerWidth < 768) {
            window.location.href = `tel:${phone}`;
        } else {
            navigator.clipboard.writeText(phone).catch(() => {});
            toast.success('شماره تماس کپی شد', { description: phone, duration: 6000 });
        }
    }, [displayAd]);
    /*const handleContact = useCallback(async () => {
        if (!user) {
            router.push(`/login?redirect=/ad/${adId}`);
            return;
        }

        try {
            const info = await apiService.ad.getContact(adId);
            const phone = info.ownerPhone || info.phone;

            if (!phone) {
                toast.error('شماره تماس ثبت نشده است');
                return;
            }

            if (window.innerWidth < 768) {
                window.location.href = `tel:${phone}`;
            } else {
                toast.info(`${info.businessName}\n${phone}`, { duration: 8000 });
                navigator.clipboard.writeText(phone).catch(() => {});
            }
        } catch (error: any) {
            // ✅ بررسی خطای احراز هویت (توکن منقضی یا نامعتبر)
            if (error?.status === 401 || error?.response?.status === 401 || error?.data?.errorCode === 'UNAUTHORIZED') {
                // هدایت به صفحه لاگین با redirect به صفحه فعلی
                router.push(`/login?redirect=/ad/${adId}`);
                toast.error('نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.');
                return;
            }

            // سایر خطاها
            if (error?.data?.errorCode === 'DAILY_CALL_LIMIT_EXCEEDED') {
                toast.error(error?.data?.message || 'محدودیت تماس روزانه');
            } else if (error?.data?.errorCode === 'NOT_MEMBER') {
                toast.error('برای مشاهده شماره تماس، ابتدا به بازار بپیوندید');
            } else {
                toast.error(error?.message || 'خطا در دریافت شماره');
            }
        }
    }, [user, adId, router]);*/

    const handleShare = useCallback(async () => {
        try {
            const url = window.location.href;
            if (navigator.share) {
                await navigator.share({
                    title: displayAd?.productType || displayAd?.title,
                    url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('لینک کپی شد');
            }
        } catch (error: any) {
            if (error?.name !== 'AbortError') {
                console.error('Share error:', error);
            }
        }
    }, [displayAd]);

    if (!displayAd) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* هدر */}
            <AdHeader ad={displayAd} />

            {/* محتوای اصلی */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-20 md:pb-10">
                {/* گالری + کارت قیمت - هم‌ارتفاع */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5 lg:items-stretch">
                    {/* گالری - پرکننده ارتفاع */}
                    <div className="lg:col-span-3 lg:flex lg:flex-col">
                        <div className="lg:sticky lg:top-16 lg:flex-1 lg:flex lg:flex-col">
                            <AdGallery
                                images={displayAd.files}
                                title={displayAd.productType || displayAd.title}
                            />
                        </div>
                    </div>

                    {/* کارت قیمت */}
                    <div className="lg:col-span-2 space-y-3.5">
                        <AdPriceCard
                            ad={displayAd}
                            isOwner={isOwner}
                            isSaved={isSaved}
                            onSaveToggle={handleSaveToggle}
                            onContact={handleContact}
                            onShare={handleShare}
                        />
                    </div>
                </div>

                {/* تب‌ها */}
                <AdTabs ad={displayAd} isOwner={isOwner} />
            </main>
        </div>
    );
}