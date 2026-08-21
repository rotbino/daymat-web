// app/ad/[id]/components/AdBusinessTab.tsx
'use client';

import { Building2, MapPin, Shield, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AdBusinessTabProps {
    ad: any;
}

function getTierLabel(tier: string | undefined) {
    return { gold: 'طلایی', silver: 'نقره‌ای', blue: 'برنزی' }[tier || ''] || null;
}

function getTierBadge(tier: string | undefined) {
    if (tier === 'gold') return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40';
    if (tier === 'silver') return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    if (tier === 'blue') return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40';
    return '';
}

export default function AdBusinessTab({ ad }: AdBusinessTabProps) {
    const seller = ad.business;
    if (!seller) return null;

    const tierLabel = getTierLabel(seller.verificationTier);
    const tierBadge = getTierBadge(seller.verificationTier);
    const bizType = {
        wholesaler: 'عمده‌فروش',
        producer: 'تولیدی',
        importer: 'واردکننده',
        exporter: 'صادرکننده'
    }[seller.type || ''] || seller.type || '';
    const locLabel = seller.province && seller.city ? `${seller.province}، ${seller.city}` : seller.city || seller.province || '';

    return (
        <div className="space-y-4">
            {/* هدر فروشنده */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
                        {seller.logoUrl ? (
                            <Image src={seller.logoUrl} alt={seller.name} width={56} height={56} className="object-cover w-full h-full" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-7 h-7 text-gray-400" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">{seller.name}</h2>
                            {tierLabel && (
                                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', tierBadge)}>
                                    <BadgeCheck className="w-3 h-3" />
                                    {tierLabel}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {bizType && (
                                <span className="px-2.5 py-0.5 bg-primary/[0.07] text-primary rounded-full text-[11px] font-medium">
                                    {bizType}
                                </span>
                            )}
                            {locLabel && (
                                <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {locLabel}
                                </span>
                            )}
                        </div>
                        {seller.shortDescription && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-6">{seller.shortDescription}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* اطلاعات تماس */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">اطلاعات تماس</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400 dark:text-gray-500">تلفن</span>
                        <span className="text-gray-800 dark:text-white font-mono font-medium" dir="ltr">
                            {seller.phone || '—'}
                        </span>
                    </div>
                    {seller.website && (
                        <div className="flex justify-between">
                            <span className="text-gray-400 dark:text-gray-500">وب‌سایت</span>
                            <a
                                href={seller.website.startsWith('http') ? seller.website : `https://${seller.website}`}
                                target="_blank"
                                rel="noopener"
                                className="text-primary hover:underline"
                                dir="ltr"
                            >
                                {seller.website}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* فعالیت‌ها */}
            {seller.activities?.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">حوزه فعالیت</h3>
                    <div className="flex flex-wrap gap-2">
                        {seller.activities.map((act: any) => (
                            <span key={act.id} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-lg border border-gray-100 dark:border-gray-700">
                                {act.title}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* درباره ما */}
            {seller.description && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">درباره ما</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-7 text-justify">{seller.description}</p>
                </div>
            )}

            {/* آمار اعتماد */}
            <div className="grid grid-cols-4 gap-2.5">
                {[
                    { val: seller.trustScore || 0, label: 'اعتماد' },
                    { val: '—', label: 'آگهی فعال' },
                    { val: '—', label: 'معامله' },
                    { val: '—', label: 'بازدید' },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800/60 p-3.5 text-center shadow-sm">
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{s.val}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}