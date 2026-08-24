// app/home/AdCard.tsx
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import {
    Clock, MapPin, Star, Verified, Lock,
    Banknote, Layers, Store, Package
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
    const diffDays = Math.floor(
        (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return 'امروز';
    if (diffDays === 1) return 'دیروز';
    if (diffDays === 2) return '۲ روز';
    if (diffDays <= 7) return `${diffDays} روز`;
    return `${diffDays} روز`;
}

const BIZ_TYPE: Record<string, { label: string; cls: string }> = {
    producer:         { label: 'تولیدی',       cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    wholesaler:       { label: 'عمده‌فروش',    cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    importer:         { label: 'واردکننده',    cls: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    exporter:         { label: 'صادرکننده',    cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    distributor:      { label: 'توزیع‌کننده',  cls: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    retailer:         { label: 'خرده‌فروش',    cls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    contractor:       { label: 'پیمانکار',     cls: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    service_provider: { label: 'خدمات',        cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    other:            { label: 'سایر',          cls: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const TIER: Record<string, { label: string; color: string; border: string }> = {
    gold:  { label: 'طلایی',   color: 'text-yellow-500 dark:text-yellow-400',   border: 'border-r-yellow-500' },
    silver:{ label: 'نقره‌ای',  color: 'text-gray-400 dark:text-gray-300',      border: 'border-r-gray-400' },
    blue:  { label: 'آبی',     color: 'text-blue-500 dark:text-blue-400',      border: 'border-r-blue-500' },
};

export default function AdCard({ ad, onContact, onDetail }: AdCardProps) {
    const router = useRouter();
    const [imgLoading, setImgLoading] = useState(true);
    const unit = ad.unit?.shortCode || '';

    // ✅ اطلاعات تعداد
    const unitQty = ad.unitQty ?? null;
    const unitTitle = ad.unit?.title || unit;
    const unitBaseTitle = ad.unitBaseTitle || 'واحد'; // ✅ این خط اضافه شد
    // ✅ پرداخت
    const pm  = ad.paymentMethods;
    const lpm = ad.customFields?.paymentMethods;
    const hasCheque      = (pm?.cheque?.length ?? 0) > 0 || (lpm?.cheque?.enabled ?? false);
    const hasInstallment = (pm?.installment?.length ?? 0) > 0 || (lpm?.installment?.enabled ?? false);

    // ✅ تاییدیه
    const tier       = ad.business?.verificationTier;
    const tierActive = tier && tier !== 'none';
    const tierInfo   = tierActive ? TIER[tier] : null;

    const file = ad.files?.[0];
    const imgUrl = file?.path || file?.thumbnailPath || '/images/no_product_image.jpg';
    const thumbUrl = file?.thumbnailPath || imgUrl;
    const isExternal = imgUrl.startsWith('https://');

    // ✅ زمان
    const relTime = getRelativeTime(ad.updatedAt || ad.createdAt);
    const isFresh = relTime === 'امروز' || relTime === 'دیروز';

    // ✅ نوع کسب‌وکار
    const bizInfo = BIZ_TYPE[ad.business?.type || ''] || BIZ_TYPE.other;

    const handleClick = () => {
        ad.isAnonymous ? onContact(ad.id) : router.push(`/ad/${ad.id}`);
    };

    const PaymentTags = ({ className }: { className?: string }) => (
        <div className={cn('flex items-center gap-1 flex-wrap', className)}>
            {hasCheque && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-medium">
                    <Banknote className="w-2.5 h-2.5" />چکی
                </span>
            )}
            {hasInstallment && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-[10px] font-medium">
                    <Layers className="w-2.5 h-2.5" />اقساط
                </span>
            )}
        </div>
    );

    const SellerBox = () => {
        if (ad.isAnonymous) {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200/60 dark:border-gray-700/40">
                    <Lock className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">ناشناس</span>
                </div>
            );
        }

        return (
            <div className={cn(
                "bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200/60 dark:border-gray-700/40 overflow-hidden",
                tierActive && tierInfo && "border-r-[3px]"
            )}>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5">
                    <Store className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate flex-1">
                        {ad.business?.name || 'فروشنده'}
                    </span>
                    {tierActive && tierInfo && (
                        <span className="flex items-center gap-0.5 flex-shrink-0">
                            <Verified className={cn("w-3.5 h-3.5", tierInfo.color)} strokeWidth={2.5} />
                            <span className={cn("text-[8px] font-bold", tierInfo.color)}>{tierInfo.label}</span>
                        </span>
                    )}
                    <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold flex-shrink-0",
                        bizInfo.cls
                    )}>
                        {bizInfo.label}
                    </span>
                </div>
                {(ad.business?.city || ad.business?.phone) && (
                    <div className="flex items-center gap-2.5 px-2.5 pb-1.5 text-[9px] text-gray-400 dark:text-gray-500">
                        {ad.business?.city && (
                            <span className="flex items-center gap-0.5">
                                <MapPin className="w-2 h-2" />{ad.business.city}
                            </span>
                        )}
                        {ad.business?.phone && (
                            <span className="flex items-center gap-0.5">📞 {ad.business.phone}</span>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ✅ کامپوننت نمایش تعداد در واحد
    const UnitQtyBadge = ({ compact = false }: { compact?: boolean }) => {
        if (!unitQty) return null;

        return (
            <span className={cn(
                "inline-flex items-center gap-1 bg-surface-container-high/80 text-on-surface-variant rounded-full font-medium",
                compact ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"
            )}>
                <Package className={cn(compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
                {unitQty.toLocaleString()} عدد
            </span>
        );
    };

    const MobileLayout = () => (
        <div className="flex flex-row-reverse bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">

            {/* تصویر */}
            <div className="w-28 flex-shrink-0 relative bg-gray-100 dark:bg-gray-800">
                {imgLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-[5]">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <Image
                    src={thumbUrl || imgUrl}
                    alt={ad.productType || ad.title}
                    width={112}
                    height={160}
                    className={cn(
                        "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500",
                        imgLoading && 'opacity-0'
                    )}
                    unoptimized={isExternal}
                    loading="lazy"
                    onLoadingComplete={() => setImgLoading(false)}
                    onError={() => setImgLoading(false)}
                />
                {ad.isBumped && (
                    <div className="absolute top-1.5 right-1.5 bg-error rounded-full p-0.5 z-10">
                        <Star className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                )}

                {/* ✅ زمان - ابزولوت بالای عکس */}
                {isFresh && (
                    <div className="absolute top-1.5 left-1.5 bg-primary/90 text-white px-1.5 py-0.5 rounded-full text-[8px] font-medium shadow-sm z-10">
                        {relTime === 'امروز' ? '📌 امروز' : '🔄 دیروز'}
                    </div>
                )}

                {/* گرادیان موقعیت */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4">
                    <div className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-white/90" />
                        <span className="text-[9px] text-white/90 truncate">{ad.city || 'نامشخص'}</span>
                    </div>
                </div>
            </div>

            {/* محتوا */}
            <div className="flex-1 flex flex-col justify-between p-2.5 min-w-0 gap-1">

                <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
                    {ad.productType || ad.title}
                </h3>

                {/* قیمت */}
                <div className="flex items-baseline gap-1">
                <span className="text-[16px] font-bold text-primary leading-none">
                    {formatNum(ad.unitPrice)}
                </span>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">تومان/{unit}</span>
                </div>

                {/* ✅ تعداد در واحد - خط جدا */}
                {unitQty && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-2 py-1">
                        <Package className="w-3 h-3 text-primary flex-shrink-0" />
                        <span>
                        تعداد در هر {unit}: <span className="font-bold text-gray-800 dark:text-gray-200">{unitQty.toLocaleString()} {unitBaseTitle}</span>
                    </span>
                    </div>
                )}

                {/* حداقل + موجودی */}
                <div className="flex items-center gap-2 text-[9px] text-gray-500 dark:text-gray-400">
                    <span>حداقل: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatNum(ad.minQuantity)} {unit}</span></span>
                    <span className="w-px h-2.5 bg-gray-200 dark:bg-gray-700" />
                    <span>موجودی: <span className="font-semibold text-gray-700 dark:text-gray-300">{ad.availableQuantity ? `${formatNum(ad.availableQuantity)} ${unit}` : 'موجود'}</span></span>
                </div>

                <SellerBox />

                <div className="flex items-center justify-end gap-1">
                    <PaymentTags />
                </div>
            </div>
        </div>
    );

    const DesktopLayout = () => (
        <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col h-full">

            {/* تصویر */}
            <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
                {imgLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-[5]">
                        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <Image
                    src={thumbUrl || imgUrl}
                    alt={ad.productType || ad.title}
                    fill
                    className={cn(
                        "object-cover transition-transform duration-500 group-hover:scale-105",
                        imgLoading && 'opacity-0'
                    )}
                    unoptimized={isExternal}
                    loading="lazy"
                    onLoadingComplete={() => setImgLoading(false)}
                    onError={() => setImgLoading(false)}
                />
                {ad.isBumped && (
                    <div className="absolute top-2 right-2 bg-error rounded-full p-1 shadow-sm z-10">
                        <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                )}
                {isFresh && (
                    <div className="absolute top-2 left-2 bg-primary/90 text-white px-2 py-0.5 rounded-full text-[9px] font-medium shadow-sm z-10">
                        {relTime === 'امروز' ? '📌 امروز' : '🔄 دیروز'}
                    </div>
                )}

                <div className="absolute bottom-2 right-2 z-10">
                    <PaymentTags />
                </div>
            </div>

            {/* بدنه */}
            <div className="p-3 flex-1 flex flex-col gap-1.5">
                <h4 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
                    {ad.productType || ad.title}
                </h4>

                {/* قیمت */}
                <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">هر {unit}:</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[15px] font-bold text-primary">{formatNum(ad.unitPrice)}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">تومان</span>
                    </div>
                </div>

                {/* ✅ تعداد در واحد - خط جدا */}
                {unitQty && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-2.5 py-1.5">
                        <Package className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>
                        تعداد در هر {unit}: <span className="font-bold text-gray-800 dark:text-gray-200">{unitQty.toLocaleString()} {unitBaseTitle}</span>
                    </span>
                    </div>
                )}

                {/* حداقل + موجودی */}
                <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                    <span>حداقل: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatNum(ad.minQuantity)} {unit}</span></span>
                    <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
                    <span>موجودی: <span className="font-semibold text-gray-700 dark:text-gray-300">{ad.availableQuantity ? `${formatNum(ad.availableQuantity)} ${unit}` : 'موجود'}</span></span>
                </div>

                <div className="mt-auto pt-1.5 border-t border-gray-100 dark:border-gray-800">
                    <SellerBox />
                </div>
            </div>
        </div>
    );

    return (
        <div onClick={handleClick} className="cursor-pointer">
            <div className="block md:hidden"><MobileLayout /></div>
            <div className="hidden md:block"><DesktopLayout /></div>
        </div>
    );
}