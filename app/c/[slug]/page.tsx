// app/c/[slug]/page.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useBusinessBySlug, useBusinessAds } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import {
    Phone, Share2, MapPin, Building2, BadgeCheck, Package,
    ArrowRight, Shield, Eye, Store, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function fmt(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

function getUrl(file: any): string {
    if (!file) return '';
    if (file.path?.startsWith('https://') || file.fullUrl?.startsWith('https://')) {
        return file.path || file.fullUrl || '';
    }
    if (file.thumbnailPath?.startsWith('https://')) return file.thumbnailPath;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011'}/file/${file.id}`;
}

export default function CatalogPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const { data: business, isLoading: businessLoading } = useBusinessBySlug(slug);
    const { data: adsData, isLoading: adsLoading } = useBusinessAds(business?.id || '', 1, 100);

    const ads = adsData?.ads || [];

    // ═══ آمار ═══
    const totalAds = ads.length;
    const activeAds = ads.filter(ad => ad.status === 'active').length;
    const totalViews = ads.reduce((sum, ad) => sum + (ad.viewCount || 0), 0);

    const bizTypeMap: Record<string, string> = {
        producer: 'تولیدی',
        wholesaler: 'عمده‌فروش',
        importer: 'واردکننده',
        exporter: 'صادرکننده',
        distributor: 'توزیع‌کننده',
        retailer: 'خرده‌فروش',
        contractor: 'پیمانکار',
        service_provider: 'خدمات',
        other: 'سایر',
    };

    // app/c/[slug]/page.tsx

    const handleContact = useCallback(() => {
        // ✅ شماره موبایل کاربر (ثبت‌نام‌شده)
        const phone = business?.owner?.phone;

        if (!phone) {
            toast.error('شماره تماس ثبت نشده است');
            return;
        }

        if (window.innerWidth < 768) {
            window.location.href = `tel:${phone}`;
        } else {
            toast.info(`${business?.name}\n${phone}`, { duration: 8000 });
            navigator.clipboard.writeText(phone).catch(() => {});
        }
    }, [business]);

    const handleShare = async () => {
        try {
            const url = window.location.href;
            if (navigator.share) {
                await navigator.share({ title: `کاتالوگ ${business?.name}`, url });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('لینک کاتالوگ کپی شد');
            }
        } catch {}
    };

    if (businessLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    if (!business) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">کسب‌وکار یافت نشد</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* ═══ هدر کاتالوگ ═══ */}
            <div className="relative bg-gradient-to-b from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent pb-6">
                {/* دکمه بازگشت */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-full shadow-lg"
                >
                    <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>

                {/* دکمه اشتراک */}
                <button
                    onClick={handleShare}
                    className="absolute top-4 left-4 z-10 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-full shadow-lg"
                >
                    <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16">
                    <div className="flex flex-col items-center text-center">
                        {/* لوگو */}
                        <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-white dark:bg-gray-900 mb-4">
                            {business.logoUrl ? (
                                <Image
                                    src={business.logoUrl}
                                    alt={business.name}
                                    width={96}
                                    height={96}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                    <Building2 className="w-10 h-10 text-gray-400" />
                                </div>
                            )}
                        </div>

                        {/* نام و بج */}
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                                {business.name}
                            </h1>
                            {business.verificationTier && business.verificationTier !== 'none' && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 text-[11px] font-semibold">
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    {business.verificationTier === 'gold' ? 'طلایی' : business.verificationTier === 'silver' ? 'نقره‌ای' : 'آبی'}
                                </span>
                            )}
                        </div>

                        {/* نوع کسب‌وکار و موقعیت */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                            {business.type && (
                                <span className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 text-primary text-xs font-medium border border-primary/20">
                                    {bizTypeMap[business.type] || business.type}
                                </span>
                            )}
                            {business.city && (
                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {business.city}
                                </span>
                            )}
                        </div>

                        {/* توضیحات کوتاه */}
                        {business.shortDescription && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 max-w-md leading-6">
                                {business.shortDescription}
                            </p>
                        )}

                        {/* آمار */}
                        <div className="flex items-center gap-6 mt-5">
                            <div className="text-center">
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(totalAds)}</p>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500">محصول</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                            <div className="text-center">
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(activeAds)}</p>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500">فعال</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                            <div className="text-center">
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(totalViews)}</p>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500">بازدید</p>
                            </div>
                        </div>

                        {/* دکمه تماس */}
                        <button
                            onClick={handleContact}
                            className="mt-5 px-8 py-3 bg-primary hover:bg-primary/90 active:scale-[0.97] text-white rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/30 transition-all duration-200"
                        >
                            <Phone className="w-5 h-5" />
                            تماس با {business.name}
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ گرید محصولات ═══ */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        کاتالوگ محصولات
                    </h2>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        {fmt(totalAds)} محصول
                    </span>
                </div>

                {adsLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : ads.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-400 dark:text-gray-500">
                            هنوز محصولی ثبت نشده است. از بخش پروفایل آگهی‌های محصولات خود را ثبت کنید.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">


                        {ads.map((ad: any) => {
                            const unit = ad.unit?.shortCode || '';
                            const file = ad.files?.[0];
                            const imgUrl = file?.path || file?.thumbnailPath || '/images/no_product_image.jpg';

                            // ✅ ساخت slug فارسی برای URL
                            const persianSlug = (ad.productType || ad.title || 'ad')
                                .replace(/\s+/g, '-')
                                .replace(/[^\u0600-\u06FF\u0750-\u077F\w\-]/g, '')
                                .substring(0, 60);

                            return (
                                <button
                                    key={ad.id}
                                    onClick={() => router.push(`/ad/${ad.id}/${persianSlug}`)}
                                    className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                        <Image
                                            src={imgUrl}
                                            alt={ad.productType || ad.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            unoptimized
                                            loading="lazy"
                                        />
                                        {ad.isBumped && (
                                            <span className="absolute top-2 right-2 px-2 py-0.5 bg-primary text-white text-[9px] rounded-full">
                                                ویژه
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-2.5 text-right">
                                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
                                            {ad.productType || ad.title}
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-sm font-bold text-primary">
                                                {fmt(ad.unitPrice)}
                                            </span>
                                            <span className="text-[9px] text-gray-400 dark:text-gray-500">
                                                {unit}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* فوتر */}
            <div className="border-t border-gray-200 dark:border-gray-800 py-8 mt-8 bg-white dark:bg-gray-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
                    {/* اطلاعات کسب‌وکار */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-right">
                        {/* اطلاعات تماس */}
                        <div className="space-y-2.5">
                            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                اطلاعات تماس
                            </h3>
                            <div className="space-y-1.5">
                                {business.phone && (
                                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span dir="ltr">{business.phone}</span>
                                    </p>
                                )}
                                {business.owner?.phone && business.owner?.phone !== business.phone && (
                                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span dir="ltr">{business.owner.phone}</span>
                                    </p>
                                )}
                                {business.website && (
                                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span dir="ltr">{business.website}</span>
                                    </p>
                                )}
                                {business.owner?.fullName && (
                                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                                        {business.owner.fullName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* موقعیت */}
                        <div className="space-y-2.5">
                            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                موقعیت
                            </h3>
                            <div className="space-y-1.5">
                                {business.province && (
                                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                        استان {business.province}
                                    </p>
                                )}
                                {business.city && (
                                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                        شهر {business.city}
                                    </p>
                                )}
                                {business.address && (
                                    <p className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 leading-6">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-1" />
                                        {business.address}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* اطلاعات بیشتر */}
                        <div className="space-y-2.5">
                            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                اطلاعات بیشتر
                            </h3>
                            <div className="space-y-1.5">
                                {business.type && (
                                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Store className="w-3.5 h-3.5 flex-shrink-0" />
                                        {bizTypeMap[business.type] || business.type}
                                    </p>
                                )}
                                {business.verificationTier && business.verificationTier !== 'none' && (
                                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0" />
                                        {business.verificationTier === 'gold' ? 'طلایی' : business.verificationTier === 'silver' ? 'نقره‌ای' : 'آبی'}
                                    </p>
                                )}
                                {business.createdAt && (
                                    <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                        عضویت از {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(new Date(business.createdAt))}
                                    </p>
                                )}
                                {business.description && (
                                    <p className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 leading-6">
                                        <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-1" />
                                        {business.description.substring(0, 80)}...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* جداکننده */}
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">قدرت گرفته از</span>
                            <div className="relative w-20 h-6">
                                <Image
                                    src="/images/logo2.png"
                                    alt="دیمت"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}