// app/profile/components/BusinessCard.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Edit, BadgeCheck, Clock, XCircle, Shield, MapPin, Phone, Building2, Tag } from 'lucide-react';
import { getApiUrl } from '@/lib/api/apiRequest';
import { cn } from '@/lib/utils';
import Image from 'next/image';
interface BusinessCardProps {
    business: any;
    completionPercentage: number;
    isComplete: boolean;
    isPending: boolean;
    isRejected: boolean;
    hasApprovedTier: boolean;
    currentTier: string;
    canRequestInitial: boolean;
    canUpgrade: boolean;
    isGold: boolean;
    totalAds: number;
    activeAds: number;
    expiredAds: number;
    onVerificationClick: () => void;
}

// مپ کردن نوع کسب و کار به برچسب فارسی
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

export default function BusinessCard({
                                         business,
                                         isComplete,
                                         isPending,
                                         isRejected,
                                         hasApprovedTier,
                                         currentTier,
                                         canRequestInitial,
                                         canUpgrade,
                                         isGold,
                                         totalAds,
                                         activeAds,
                                         expiredAds,
                                         onVerificationClick,
                                     }: BusinessCardProps) {
    const router = useRouter();
    const logoUrl = business?.logoUrl || null;

    const tierColor =
        currentTier === 'gold' ? 'text-yellow-500 dark:text-yellow-400' :
            currentTier === 'silver' ? 'text-blue-500 dark:text-blue-400' :
                currentTier === 'blue' ? 'text-gray-400 dark:text-gray-300' : '';

    const tierLabel =
        currentTier === 'gold' ? 'طلایی' :
            currentTier === 'silver' ? 'نقره‌ای' :
                currentTier === 'blue' ? 'آبی' : '';

    const typeLabel = BUSINESS_TYPE_LABELS[business?.type] || business?.type || '';
    const typeColorClass = BUSINESS_TYPE_COLORS[business?.type] || BUSINESS_TYPE_COLORS.other;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
            {/* بخش بالایی: لوگو + دکمه ویرایش (چپ) | نام + تیک + موقعیت (راست) */}
            <div className="flex items-start gap-3">
                {/* ستون چپ: لوگو */}
                <div className="w-16 h-16 rounded-xl bg-surface-container-high dark:bg-gray-800 border border-outline dark:border-gray-700 flex items-center justify-center overflow-hidden relative">
                    {logoUrl ? (
                        <Image
                            src={logoUrl}
                            alt={business.name || 'لوگوی کسب‌وکار'}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            unoptimized={logoUrl.startsWith('https://daymatfilles.s3')}
                        />
                    ) : (
                        <Building2 className="w-8 h-8 text-primary" />
                    )}
                </div>

                {/* ستون راست: نام، نوع، موقعیت */}
                <div className="flex-1 min-w-0">
                    {/* خط اول: نام + تیک اعتماد */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <h2 className="text-lg font-semibold text-on-surface dark:text-gray-100 truncate">
                                {business.name}
                            </h2>
                            {hasApprovedTier && (
                                <span className={cn("flex items-center gap-1 text-xs font-medium flex-shrink-0", tierColor)}>
                                    <BadgeCheck className="w-4 h-4" />
                                    <span className="hidden sm:inline">{tierLabel}</span>
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => router.push(`/business/edit/${business.id}`)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-300 rounded-lg text-xs font-medium hover:bg-primary/20 dark:hover:bg-primary/30 active:scale-95 transition-all flex-shrink-0"
                        >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">ویرایش</span>
                        </button>
                    </div>

                    {/* خط دوم: نوع کسب‌وکار (برچسب رنگی) */}
                    {typeLabel && (
                        <div className="mt-1.5 flex items-center gap-2">
                            <span className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium",
                                typeColorClass
                            )}>
                                <Tag className="w-3 h-3" />
                                {typeLabel}
                            </span>
                        </div>
                    )}

                    {/* خط سوم: شهر و تلفن */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-on-surface-variant dark:text-gray-400">
                        {business.city && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {business.city}
                            </span>
                        )}
                        {business.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                {business.phone}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* وضعیت‌های دیگر (بدون border) */}
            {isPending && (
                <div className="mt-3 flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-lg">
                    <Clock className="w-4 h-4" />
                    <span>در انتظار دریافت تیک</span>
                </div>
            )}
            {isRejected && (
                <div className="mt-3 space-y-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span>درخواست شما رد شد</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant dark:text-gray-400">
                        {business.latestVerification?.notes ? `دلیل: ${business.latestVerification.notes}` : 'با پشتیبان خود تماس بگیرید.(09196421264).'}
                    </p>
                    <button onClick={onVerificationClick} className="text-[10px] font-medium text-primary hover:underline">
                        ارسال مجدد
                    </button>
                </div>
            )}
            {canRequestInitial && (
                <div className="mt-3 flex items-center justify-between bg-primary/5 dark:bg-primary/10 px-3 py-2 rounded-lg border border-primary/20 dark:border-primary/30">
                    <div className="flex items-center gap-2 text-xs text-on-surface dark:text-gray-200">
                        <Shield className="w-4 h-4 text-primary" />
                        <span>اطلاعات شما کامل است</span>
                    </div>
                    <button onClick={onVerificationClick} className="text-[10px] font-medium bg-primary text-on-primary px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
                        دریافت تیک اعتماد
                    </button>
                </div>
            )}

            {/* آمار */}
            <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-outline-variant/50 dark:border-gray-700">
                {[
                    { value: totalAds, label: 'کل آگهی‌ها', color: 'text-primary' },
                    { value: activeAds, label: 'فعال', color: 'text-emerald-600 dark:text-emerald-400' },
                    { value: expiredAds, label: 'منقضی', color: 'text-warning' },
                ].map(s => (
                    <div key={s.label} className="text-center">
                        <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                        <p className="text-[10px] text-on-surface-variant dark:text-gray-400">{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}