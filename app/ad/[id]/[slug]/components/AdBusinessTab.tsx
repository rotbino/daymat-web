// app/ad/[id]/[slug]/components/AdBusinessTab.tsx
'use client';

import {
    Building2, MapPin, Shield, BadgeCheck, Phone, Globe, Package, BarChart3, Eye,
    Store, Tag, Clock, CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Props {
    ad: any;
}

function getTierLabel(tier: string | undefined) {
    return { gold: 'طلایی', silver: 'نقره‌ای', blue: 'آبی' }[tier || ''] || null;
}

function getTierBadge(tier: string | undefined) {
    if (tier === 'gold') return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40';
    if (tier === 'silver') return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    if (tier === 'blue') return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40';
    return '';
}

function getUrl(file: any): string {
    if (!file) return '';
    if (file.path?.startsWith('https://') || file.fullUrl?.startsWith('https://')) return file.path || file.fullUrl || '';
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3011'}/file/${file.id}`;
}

function fmt(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

export default function AdBusinessTab({ ad }: Props) {
    const seller = ad.business;
    if (!seller) return null;

    const tierLabel = getTierLabel(seller.verificationTier);
    const tierBadge = getTierBadge(seller.verificationTier);

    const ownerActivities = seller?.activities || [];
    const owner = seller?.owner;

    // ✅ اطلاعات تماس
    const phone = seller.phone || owner?.phone || '';
    const website = seller.website || '';
    const address = seller.address || '';
    const city = seller.city || '';
    const province = seller.province || '';
    const fullLocation = province && city ? `${province}، ${city}` : city || province || '';

    // ✅ آمار
    const trustScore = seller.trustScore || 0;
    const activeAdsCount = seller.activeAdsCount || seller._count?.ads || 0;
    const totalAdsCount = seller.totalAdsCount || 0;

    // ✅ تاریخ عضویت
    const createdAt = seller.createdAt ? new Date(seller.createdAt) : null;
    const memberSince = createdAt
        ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(createdAt)
        : '';

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

    const bizType = bizTypeMap[seller.type] || seller.type || null;

    // ✅ نوع تاییدیه
    const verificationStatus = seller.verificationStatus;
    const verificationLabel =
        verificationStatus === 'approved' ? 'تایید شده' :
            verificationStatus === 'pending' ? 'در انتظار تایید' :
                verificationStatus === 'rejected' ? 'رد شده' : '';

    return (
        <div className="space-y-4">
            {/* کارت فروشنده */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-sm">
                {/* هدر فروشنده */}
                <div className="flex items-start gap-4">
                    {/* لوگو */}
                    {seller.logoUrl ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <Image src={seller.logoUrl} alt={seller.name} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">{seller.name}</h2>
                            {tierLabel && (
                                <span className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                                    tierBadge,
                                )}>
                                    <BadgeCheck className="w-3 h-3" />
                                    {tierLabel}
                                </span>
                            )}
                            {bizType && (
                                <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                                    {bizType}
                                </span>
                            )}
                        </div>

                        {/* اطلاعات تماس */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {fullLocation && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {fullLocation}
                                </span>
                            )}
                            {phone && (
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span dir="ltr">{phone}</span>
                                </span>
                            )}
                            {website && (
                                <span className="flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5" />
                                    {website}
                                </span>
                            )}
                        </div>

                        {/* وضعیت تایید */}
                        {verificationLabel && (
                            <div className="mt-2 flex items-center gap-1.5">
                                <CheckCircle2 className={cn(
                                    "w-3.5 h-3.5",
                                    verificationStatus === 'approved' ? 'text-emerald-500' :
                                        verificationStatus === 'pending' ? 'text-amber-500' : 'text-red-500'
                                )} />
                                <span className={cn(
                                    "text-[11px] font-medium",
                                    verificationStatus === 'approved' ? 'text-emerald-600' :
                                        verificationStatus === 'pending' ? 'text-amber-600' : 'text-red-600'
                                )}>
                                    {verificationLabel}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* مالک */}
                {owner && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                        {owner?.avatarFile?.thumbnailPath ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                                <Image
                                    src={getUrl(owner.avatarFile)}
                                    alt={owner.fullName || ''}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                <Globe className="w-5 h-5 text-gray-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{owner.fullName}</p>
                            {owner.phone && (
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                    📞 {owner.phone}
                                </p>
                            )}
                        </div>
                        {memberSince && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                عضویت از {memberSince}
                            </span>
                        )}
                    </div>
                )}

                {/* توضیحات کوتاه */}
                {seller.shortDescription && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-7 text-justify">
                            {seller.shortDescription}
                        </p>
                    </div>
                )}

                {/* حوزه فعالیت */}
                {ownerActivities.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                        <h3 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            حوزه فعالیت
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {ownerActivities.map((act: any, idx: number) => (
                                <span
                                    key={act.id || idx}
                                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-lg border border-gray-100 dark:border-gray-700"
                                >
                                    {act.title || act.activity?.title}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* درباره ما */}
                {seller.description && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                        <h3 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            درباره ما
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-7 text-justify">
                            {seller.description}
                        </p>
                    </div>
                )}

                {/* آدرس */}
                {address && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                        <h3 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            آدرس
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-7">
                            {address}
                        </p>
                    </div>
                )}

                {/* آمار */}
                <div className="grid grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                    {[
                        { val: trustScore, label: 'امتیاز اعتماد', icon: Shield, color: 'text-emerald-500' },
                        { val: fmt(activeAdsCount), label: 'آگهی فعال', icon: Package, color: 'text-primary' },
                        { val: fmt(totalAdsCount), label: 'کل آگهی‌ها', icon: BarChart3, color: 'text-blue-500' },
                        { val: fmt(ad.viewCount || 0), label: 'بازدید آگهی', icon: Eye, color: 'text-gray-400' },
                    ].map((s) => {
                        const IconComponent = s.icon;
                        return (
                            <div key={s.label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                                <IconComponent className={cn("w-5 h-5 mx-auto", s.color)} />
                                <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">{s.val}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{s.label}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}