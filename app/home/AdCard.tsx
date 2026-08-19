// app/home/AdCard.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import {
    Clock, MapPin, Star, Verified, Lock,
    Banknote, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from "next/navigation";

interface AdCardProps {
    ad: any;
    onContact: (adId: string) => void;
    onDetail: (ad: any) => void;
}

function formatNum(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

function getRelativeTime(date: string) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'امروز';
    if (diffDays === 1) return 'دیروز';
    if (diffDays === 2) return '۲ روز';
    if (diffDays <= 7) return `${diffDays} روز`;
    return `${diffDays} روز`;
}

// ─── برچسب نوع کسب‌وکار ───
const BUSINESS_TYPE_LABELS: Record<string, string> = {
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

const BUSINESS_TYPE_COLORS: Record<string, string> = {
    producer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    wholesaler: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    importer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    exporter: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    distributor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    retailer: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    contractor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    service_provider: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export default function AdCard({ ad, onContact, onDetail }: AdCardProps) {
    const unit = ad.unit?.shortCode || '';

    // ✅ خواندن از فیلد جدید با fallback به قدیمی
    const paymentMethods = ad.paymentMethods;
    const legacyPayment = ad.customFields?.paymentMethods;

    const hasCheque = (paymentMethods?.cheque?.length ?? 0) > 0 ||
        (legacyPayment?.cheque?.enabled ?? false);
    const hasInstallment = (paymentMethods?.installment?.length ?? 0) > 0 ||
        (legacyPayment?.installment?.enabled ?? false);

    const tier = ad.business?.verificationTier;
    const router = useRouter();

    const adImage = ad.files?.find((f: any) => f.fieldKey?.startsWith('ad-image'));
    const thumbnailImageUrl = adImage
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${adImage.id}/thumbnail`
        : '/images/no_product_image.jpg';
    const imageUrl = adImage
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${adImage.id}`
        : '/images/no_product_image.jpg';

    const tierColor =
        tier === 'gold' ? 'text-yellow-500 dark:text-yellow-400' :
            tier === 'silver' ? 'text-gray-400 dark:text-gray-300' :
                tier === 'blue' ? 'text-blue-500 dark:text-blue-400' : '';

    const relativeTime = getRelativeTime(ad.updatedAt || ad.createdAt);

    // ─── نوع کسب‌وکار ───
    const businessType = ad.business?.type || '';
    const typeLabel = BUSINESS_TYPE_LABELS[businessType] || '';
    const typeColorClass = BUSINESS_TYPE_COLORS[businessType] || BUSINESS_TYPE_COLORS.other;

    // ─── برچسب‌های پرداخت (آیکون + متن) ───
    const PaymentBadges = () => (
        <div className="flex items-center gap-1 flex-wrap">
            {hasCheque && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-medium">
                    <Banknote className="w-3 h-3" />
                    چکی
                </span>
            )}
            {hasInstallment && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium">
                    <Layers className="w-3 h-3" />
                    اقساط
                </span>
            )}
        </div>
    );

    // ─── طرح موبایل ───
    const MobileLayout = () => (
        <div className="flex p-1 flex-row-reverse w-full bg-surface rounded-lg border border-gray-400 overflow-hidden premium-card-shadow transition-all duration-300 relative group">
            {/* تصویر */}
            <div className="w-24 h-28 sm:w-40 sm:h-40 flex-shrink-0 overflow-hidden bg-surface-container relative">
                {ad.isBumped && (
                    <div className="absolute top-2 p-1 right-2 flex justify-center gap-1 bg-error rounded-full">
                        <Star className="w-3 h-3 text-white" />
                    </div>
                )}
                <Image
                    src={imageUrl}
                    alt={ad.productType || ad.title}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                />
                {/* اوورلای موقعیت */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white p-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-body-md truncate">{ad.city || 'نامشخص'}</span>
                </div>
            </div>

            {/* محتوا */}
            <div className="p-2 flex-1 flex flex-col justify-between min-w-0">
                <div className="flex flex-col gap-0.5">
                    <h2 className="font-title-lg text-[15px] text-on-surface font-bold leading-tight line-clamp-2">
                        {ad.productType || ad.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-1">
                        {ad.isAnonymous ? (
                            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                <Lock className="w-3 h-3" />
                                انتشار ناشناس (فقط تماس)
                            </span>
                        ) : (
                            <>
                                <span className="font-label-md text-[11px] text-primary font-bold">
                                    {ad.business?.name || 'فروشنده'}
                                </span>
                                {tier && tier !== 'none' && (
                                    <Verified className={cn("w-4 h-4", tierColor)} />
                                )}
                                {/* برچسب نوع کسب‌وکار در موبایل زیر نام */}
                                {typeLabel && (
                                    <span className={cn(
                                        "inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium mt-0.5",
                                        typeColorClass
                                    )}>
                                        {typeLabel}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center border-t border-outline-variant/30 pt-0.5 mt-0.5">
                    <div className="flex items-center gap-0.5">
                        <span className="text-on-surface-variant text-[9px] font-label-md">حداقل خرید:</span>
                        <span className="text-on-surface text-[9px] font-bold">{formatNum(ad.minQuantity)} {unit}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                        <span className="text-on-surface-variant text-[9px] font-label-md">موجودی:</span>
                        <span className="text-on-surface text-[9px] font-bold">
                            {ad.availableQuantity ? `${formatNum(ad.availableQuantity)} ` : 'موجود'}
                        </span>
                    </div>
                </div>

                <div className="flex items-end justify-between mt-0.5">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-0.5 text-primary">
                            <span className="font-headline-md text-[17px] font-bold">{formatNum(ad.unitPrice)}</span>
                            <span className="font-label-md text-[9px]">تومان/{unit}</span>
                        </div>
                        <div className="absolute top-2 left-2 flex justify-center px-2 gap-1 bg-primary backdrop-blur-sm py-0.5 rounded-full shadow-md border border-gray-200/50 dark:border-white/10">
                            <Clock className="w-3 h-3 text-surface-container-lowest" />
                            <span className="text-surface-container-lowest text-[10px] font-bold">{relativeTime}</span>
                        </div>
                    </div>
                </div>

                {/* ردیف برچسب‌های پرداخت در موبایل */}
                <div className="mt-1 pt-1 border-t border-outline-variant/20 flex items-center justify-end">
                    <PaymentBadges />
                </div>
            </div>
        </div>
    );

    // ─── طرح دسکتاپ ───
    const DesktopLayout = () => (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-[4px] overflow-hidden premium-shadow card-hover transition-all duration-300  flex flex-col group">
            <div className="relative h-48 overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={ad.productType || ad.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                />

                {ad.isBumped && (
                    <div className="absolute top-2 p-1 right-2 flex justify-center gap-1 bg-error rounded-full">
                        <Star className="w-3 h-3 text-white" />
                    </div>
                )}

                {/* برچسب‌های پرداخت روی تصویر (پایین سمت راست) */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <PaymentBadges />
                </div>

                <div className="absolute top-2 left-2 flex justify-center p-2 gap-1 bg-blue-100 dark:bg-primary/20 py-1 rounded-full shadow-sm">
                    <Clock className="w-3 h-3 text-blue-950 dark:text-primary-300" />
                    <span className="text-blue-950 dark:text-primary-300 text-[9px] font-bold">{relativeTime}</span>
                </div>
            </div>

            <div className="p-3 flex-1 flex flex-col gap-1.5">
                <div className="flex items-start justify-between">
                    <h4 className="font-body-lg text-[13px] font-bold leading-tight line-clamp-2 pb-1">
                        {ad.productType || ad.title}
                    </h4>
                    {!ad.isAnonymous && (
                        <Verified className={cn("w-5 h-5 -current", tierColor)} />
                    )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {ad.isAnonymous ? (
                        <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            <Lock className="w-3 h-3" />
                            انتشار ناشناس (فقط تماس)
                        </span>
                    ) : (
                        <>
                            <span className="font-label-md text-[12px] text-on-surface-variant">
                                {ad.business?.name || 'فروشنده'}
                            </span>
                            {/* برچسب نوع کسب‌وکار در دسکتاپ کنار نام */}
                            {typeLabel && (
                                <span className={cn(
                                    "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium",
                                    typeColorClass
                                )}>
                                    {typeLabel}
                                </span>
                            )}
                        </>
                    )}
                </div>
                <div className="mt-auto pt-2 flex items-end justify-between border-t border-outline-variant/30">
                    <div className="flex flex-1 items-center justify-between">
                        <span className="font-label-md text-[11px] text-outline">هر {unit}:</span>
                        <span className="font-title-lg text-[14px] text-primary font-bold">
                            {formatNum(ad.unitPrice)} <span className="text-[13px] font-normal">تومان</span>
                        </span>
                    </div>
                </div>
            </div>
            <div className="bg-surface-container p-2 flex justify-between items-center px-3 border-t border-outline-variant">
                <div className="flex items-center gap-1 text-on-surface-variant">
                    <span className="font-label-md text-[10px]">موجودی: {ad.availableQuantity ? `${formatNum(ad.availableQuantity)} ${unit}` : 'موجود'}</span>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant">
                    <span className="font-label-md text-[10px]">حداقل: {formatNum(ad.minQuantity)} {unit}</span>
                </div>
            </div>
        </div>
    );

    // ─── کلیک روی کارت ───
    const handleCardClick = () => {
        if (ad.isAnonymous) {
            onContact(ad.id);
        } else {
            router.push(`/ad/${ad.id}`);
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className="cursor-pointer"
        >
            <div className="block md:hidden">
                <MobileLayout />
            </div>
            <div className="hidden md:block">
                <DesktopLayout />
            </div>
        </div>
    );
}