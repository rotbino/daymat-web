// app/saved-ads/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { AppHeader, AppFooter } from '@/app/components';
import { useSavedAds } from '@/lib/api/apiHooks';
import { Bookmark, Package, Loader2, Trash2 } from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import Image from 'next/image';
import { formatNum } from '@/app/ad/[id]/components/shared';
import { cn } from '@/lib/utils';

export default function SavedAdsPage() {
    const router = useRouter();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { data: savedAds, isLoading, refetch } = useSavedAds();
    const [removingId, setRemovingId] = useState<string | null>(null);

    // اگر کاربر وارد نشده، هدایت به لاگین
    React.useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/saved-ads');
        }
    }, [isAuthenticated, router]);

    const handleRemove = async (adId: string) => {
        setRemovingId(adId);
        try {
            await apiService.ad.unsave(adId);
            toast.success('از ذخیره‌ها حذف شد');
            refetch();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در حذف');
        } finally {
            setRemovingId(null);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-gray-950">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const ads = savedAds || [];

    return (
        <div className="min-h-screen bg-surface dark:bg-gray-950">
            <AppHeader showBack={true} showLocation={false} fixed={true} />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-24">
                {/* هدر */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Bookmark className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-on-surface dark:text-gray-100">
                            آگهی‌های ذخیره‌شده
                        </h1>
                        <p className="text-sm text-on-surface-variant dark:text-gray-400">
                            {ads.length > 0
                                ? `${ads.length.toLocaleString('fa-IR')} آگهی ذخیره شده`
                                : 'هنوز آگهی ذخیره نکرده‌اید'}
                        </p>
                    </div>
                </div>

                {/* لیست */}
                {ads.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-surface-container-high dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Bookmark className="w-10 h-10 text-on-surface-variant/30 dark:text-gray-600" />
                        </div>
                        <h2 className="text-lg font-bold text-on-surface dark:text-gray-100 mb-3">
                            هنوز آگهی ذخیره نکرده‌اید
                        </h2>
                        <p className="text-sm text-on-surface-variant dark:text-gray-400 mb-6">
                            آگهی‌های مورد علاقه خود را ذخیره کنید تا بعداً راحت‌تر پیدا کنید.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
                        >
                            مشاهده تابلو قیمت
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ads.map((ad: any) => {
                            const unit = ad.unit?.shortCode || '';
                            const file = ad.files?.[0];
                            const imgUrl = file?.path || file?.thumbnailPath || '/images/no_product_image.jpg';
                            const isExternal = imgUrl.startsWith('https://');

                            return (
                                <div
                                    key={ad.id}
                                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800 flex items-center gap-3 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => router.push(`/ad/${ad.id}`)}
                                >
                                    {/* تصویر */}
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 relative">
                                        <Image
                                            src={imgUrl}
                                            alt={ad.productType || ad.title}
                                            fill
                                            className="object-cover"
                                            unoptimized={isExternal}
                                        />
                                    </div>

                                    {/* اطلاعات */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                                            {ad.productType || ad.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="font-bold text-primary">
                                                {formatNum(ad.unitPrice)}
                                            </span>
                                            <span>تومان/{unit}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                                            <span>حداقل: {formatNum(ad.minQuantity)} {unit}</span>
                                            {ad.city && (
                                                <>
                                                    <span className="w-px h-2.5 bg-gray-200 dark:bg-gray-700" />
                                                    <span>{ad.city}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* دکمه حذف */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove(ad.id);
                                        }}
                                        disabled={removingId === ad.id}
                                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0 disabled:opacity-50"
                                    >
                                        {removingId === ad.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <AppFooter activeTab="saved" />
        </div>
    );
}