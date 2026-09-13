// app/business/manage/components/BusinessPreviewCard.tsx
// 👀 «نمای مشتری» — خلاصهٔ کسب‌وکار همان‌طور که در دیمت دیده می‌شود
'use client';

import React from 'react';
import { Eye, BadgeCheck, MapPin } from 'lucide-react';
import { BusinessLogo } from './BusinessLogo';

const TIER_COLOR: Record<string, string> = {
    blue: 'text-blue-500',
    silver: 'text-gray-400',
    gold: 'text-green-500',
};

export interface PreviewBusiness {
    name: string;
    logoUrl?: string | null;
    shortDescription?: string | null;
    province?: string | null;
    city?: string | null;
    industryName?: string | null;
    verificationStatus?: string;
    verificationTier?: string;
    activities?: { activity?: { id?: string; title?: string } | null }[];
}

export function BusinessPreviewCard({ business }: { business: PreviewBusiness }) {
    const verified = business.verificationStatus === 'approved';
    const tierColor = TIER_COLOR[business.verificationTier || ''] || 'text-emerald-500';
    const activities = (business.activities || [])
        .map((a) => a?.activity?.title)
        .filter(Boolean)
        .slice(0, 4);
    const extra = (business.activities?.length || 0) - activities.length;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 sm:p-5 space-y-3">
            {/* هدر */}
            <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-primary" />
                </span>
                <div className="flex-1">
                    <p className="text-[13px] font-extrabold text-on-surface">نمای مشتری</p>
                    <p className="text-[10px] text-on-surface-variant/70">کسب‌وکار شما این‌طور در دیمت دیده می‌شود</p>
                </div>
            </div>

            {/* کارت نمونه */}
            <div className="rounded-xl border border-outline-variant/40 dark:border-gray-700/70 bg-surface-container-low/60 dark:bg-gray-800/40 p-3.5">
                <div className="flex items-center gap-3">
                    <BusinessLogo
                        logoUrl={business.logoUrl}
                        name={business.name}
                        className="w-12 h-12 rounded-xl"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <p className="text-[13px] font-black text-on-surface truncate">{business.name}</p>
                            {verified && (
                                <BadgeCheck className={`w-4 h-4 flex-shrink-0 ${tierColor}`} aria-label={`تیک ${business.verificationTier}`} />
                            )}
                        </div>
                        {(business.city || business.province || business.industryName) && (
                            <p className="text-[10px] text-on-surface-variant/70 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {[business.city || business.province, business.industryName].filter(Boolean).join(' · ')}
                            </p>
                        )}
                    </div>
                </div>

                {business.shortDescription && (
                    <p className="text-[11px] text-on-surface-variant mt-2.5 leading-4 line-clamp-2">
                        {business.shortDescription}
                    </p>
                )}

                {activities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {activities.map((t) => (
                            <span
                                key={t}
                                className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5"
                            >
                                {t}
                            </span>
                        ))}
                        {extra > 0 && (
                            <span className="text-[10px] font-bold text-on-surface-variant/60 bg-surface-container-high dark:bg-gray-700/60 rounded-full px-2 py-0.5">
                                +{extra.toLocaleString('fa-IR')}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
