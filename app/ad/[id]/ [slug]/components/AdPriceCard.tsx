// app/ad/[id]/[slug]/components/AdPriceCard.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import {
    Phone, Bookmark, Share2, ShoppingCart, MapPin, Timer, Eye,
    ArrowUpCircle, Layers, Package, Lock, Store, Banknote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';

interface Props {
    ad: any;
    isOwner: boolean;
    isSaved: boolean;
    onSaveToggle: () => void;
    onContact: () => void;
    onShare: () => void;
}

function fmt(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

function getUrl(file: any): string {
    if (!file) return '';
    if (file.path?.startsWith('https://') || file.fullUrl?.startsWith('https://')) {
        return file.path || file.fullUrl || '';
    }
    if (file.thumbnailPath?.startsWith('https://')) return file.thumbnailPath;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3011'}/file/${file.id}`;
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'لحظاتی پیش';
    if (m < 60) return `${m} دقیقه پیش`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ساعت پیش`;
    return `${Math.floor(h / 24)} روز پیش`;
}

export default function AdPriceCard({ ad, isOwner, isSaved, onSaveToggle, onContact, onShare }: Props) {
    const { currentArm } = useSelector((state: RootState) => state.arm);
    const brandColor = currentArm?.colorPrimary || '#a11f2c';

    const unit = ad.unit?.shortCode || '';
    const unitBase = ad.unitBaseTitle || 'واحد';
    const unitQty = ad.unitQty;

    // ═══ محاسبه سود ═══
    const singleP = ad.singleUnitPrice;
    const consumerP = ad.consumerPrice;
    const hasComparison = singleP > 0 && consumerP > 0;

    const profitPerUnit = hasComparison ? consumerP - singleP : 0;
    const profitPct = singleP > 0 ? Math.round((profitPerUnit / singleP) * 100) : 0;
    const profitTotal = unitQty && profitPerUnit > 0 ? profitPerUnit * unitQty : 0;

    // ═══ پرداخت ═══
    const hasCheque = ad.paymentMethods?.cheque?.length > 0;
    const hasInstallment = ad.paymentMethods?.installment?.length > 0;
    const chequeOptions = ad.paymentMethods?.cheque || [];
    const installmentOptions = ad.paymentMethods?.installment || [];

    // ═══ زمان ═══
    const hoursLeft = ad.expiresAt
        ? Math.max(0, Math.ceil((new Date(ad.expiresAt).getTime() - Date.now()) / 3600000))
        : 0;

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
    const bizType = bizTypeMap[ad.business?.type] || '';

    return (
        <div className="space-y-3.5">
            {/* ═══ کارت فروشنده ═══ */}
            {ad.isAnonymous ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/60 dark:border-gray-700/40 px-4 py-3 flex items-center gap-3">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">ناشناس</span>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm p-5 space-y-3">
                    <div className="flex items-start gap-3">
                        {ad.business?.owner?.avatarFile?.thumbnailPath ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <Image
                                    src={getUrl(ad.business.owner.avatarFile)}
                                    alt={ad.business?.owner?.fullName || ''}
                                    width={48}
                                    height={48}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                <Store className="w-6 h-6 text-gray-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-bold text-gray-800 dark:text-white">
                                    {ad.business?.name || 'فروشنده'}
                                </p>
                                {bizType && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                        {bizType}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                {ad.business?.owner?.fullName || ''}
                            </p>
                            {ad.business?.shortDescription && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                    {ad.business.shortDescription}
                                </p>
                            )}
                        </div>
                        {ad.business?.verificationTier && ad.business.verificationTier !== 'none' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 flex-shrink-0">
                                {ad.business.verificationTier === 'gold' ? 'طلایی' : ad.business.verificationTier === 'silver' ? 'نقره‌ای' : 'آبی'}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={onContact}
                        className="w-full h-12 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all duration-200"
                    >
                        <Phone className="w-5 h-5" />
                        تماس با فروشنده
                    </button>
                </div>
            )}
            {/* ═══ کارت قیمت اصلی (بدون عنوان) ═══ */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm">
                {/* قیمت */}
                <div className="flex items-end justify-between gap-1">
                    <div>
                        <p className="text-[11px] text-gray-400">قیمت هر {unit}</p>
                        <p className="text-[28px] font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">
                            {fmt(ad.unitPrice)}
                            <span className="text-sm text-gray-400 font-medium mr-1.5">تومان</span>
                        </p>
                    </div>
                    {unitQty && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            هر {unit}: <span className="text-gray-600 dark:text-gray-300 font-semibold">{unitQty.toLocaleString()} {unitBase}</span>
                        </p>
                    )}
                </div>

                {/* ✅ فی - اگر قیمت تکی عمده وجود دارد */}
                {singleP > 0 && !hasComparison && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs text-gray-400">فی: هر {unitBase}</span>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                {fmt(singleP)} تومان
                            </span>
                        </div>
                    </div>
                )}

                {/* حداقل خرید و موجودی */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400">حداقل خرید</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                {fmt(ad.minQuantity)} {unit}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400">موجودی</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                {ad.availableQuantity ? `${fmt(ad.availableQuantity)} ${unit}` : 'موجود'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ✅ اطلاعات تکمیلی - همیشه */}
                <div className="space-y-2.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {ad.city && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                محل تحویل
                            </span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {ad.city}
                            </span>
                        </div>
                    )}
                    {ad.updatedAt && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                <Timer className="w-3.5 h-3.5" />
                                آخرین به‌روزرسانی
                            </span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {timeAgo(ad.updatedAt)}
                            </span>
                        </div>
                    )}
                    {ad.viewCount > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5" />
                                بازدید
                            </span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {fmt(ad.viewCount)} بار
                            </span>
                        </div>
                    )}
                    {hoursLeft > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 flex items-center gap-1.5">
                                <Timer className="w-3.5 h-3.5" />
                                اعتبار قیمت
                            </span>
                            <span className={cn(
                                "text-sm font-medium",
                                hoursLeft <= 24 ? "text-red-500" : "text-gray-700 dark:text-gray-300"
                            )}>
                                {hoursLeft <= 24 ? `${hoursLeft} ساعت` : `${Math.ceil(hoursLeft / 24)} روز`} مانده
                            </span>
                        </div>
                    )}
                </div>

                {/* ✅ بج‌های پرداخت - همیشه */}
                {(hasCheque || hasInstallment) && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        {hasCheque && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 text-[10px] font-medium">
                                <Banknote className="w-3 h-3" />
                                چکی
                            </span>
                        )}
                        {hasInstallment && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 text-[10px] font-medium">
                                <Layers className="w-3 h-3" />
                                اقساطی
                            </span>
                        )}
                        {ad.isBumped && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 text-[10px] font-medium">
                                <ArrowUpCircle className="w-3 h-3" />
                                نردبان
                            </span>
                        )}
                    </div>
                )}

                {/* دکمه‌های ذخیره و اشتراک */}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={onSaveToggle}
                        className={cn(
                            'flex-1 h-10 rounded-xl border flex items-center justify-center gap-1.5 transition-all duration-150 text-xs',
                            isSaved
                                ? 'bg-primary/10 border-primary text-primary font-bold'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:text-primary hover:bg-primary/10',
                        )}
                    >
                        <Bookmark className={cn(
                            'w-4 h-4',
                            isSaved ? 'fill-primary text-primary' : 'text-gray-500',
                        )} />
                        {isSaved ? 'ذخیره شده' : 'ذخیره'}
                    </button>
                    <button
                        onClick={onShare}
                        className="flex-1 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-1.5 transition-all duration-150 text-xs"
                    >
                        <Share2 className="w-4 h-4" />
                        اشتراک‌گذاری
                    </button>
                </div>
            </div>

            {/* ═══ مقایسه قیمت (فقط وقتی هر دو قیمت هستند) ═══ */}
            {hasComparison && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="px-5 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">مقایسه قیمت</p>
                    </div>

                    <div className="p-4 space-y-3">
                        {singleP > 0 && (
                            <div className="flex items-center gap-3 rounded-xl p-3 border">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${brandColor}20` }}>
                                    <Package className="w-4 h-4" style={{ color: brandColor }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px]" style={{ color: brandColor }}>قیمت تکی عمده</p>
                                    <p className="text-gray-900 dark:text-white font-extrabold text-lg leading-none">
                                        {fmt(singleP)}
                                        <span className="text-xs text-gray-400 font-medium mr-1">تومان/{unitBase}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {consumerP > 0 && (
                            <div className="flex items-center gap-3 rounded-xl p-3 border" >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${brandColor}20` }}>
                                    <ShoppingCart className="w-4 h-4" style={{ color: brandColor }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px]" style={{ color: brandColor }}>قیمت مصرف‌کننده</p>
                                    <p className="text-gray-900 dark:text-white font-extrabold text-lg leading-none">
                                        {fmt(consumerP)}
                                        <span className="text-xs text-gray-400 font-medium mr-1">تومان/{unitBase}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {profitPerUnit > 0 && (
                            <div className="rounded-xl p-3.5 flex items-center justify-between border" style={{ }}>
                                <span className="font-bold text-sm" style={{ color: brandColor }}>
                                    💰 سود هر {unitBase}: +{fmt(profitPerUnit)} تومان
                                </span>
                                <span className="text-sm font-extrabold" style={{ color: brandColor }}>
                                    +{fmt(profitPct)}% سود
                                </span>
                            </div>
                        )}

                        {unitQty && profitTotal > 0 && (
                            <div className="rounded-xl p-3.5 flex items-center justify-between border" style={{ backgroundColor: `${brandColor}20`, borderColor: `${brandColor}30` }}>
                                <span className="text-sm font-medium" style={{ color: brandColor }}>
                                    سود هر {unit}: <span className="font-bold text-base">{fmt(profitTotal)} تومان</span>
                                </span>
                                <span className="text-xs" style={{ color: brandColor }}>
                                    ({unitQty} × {fmt(profitPerUnit)} تومان)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}


        </div>
    );
}