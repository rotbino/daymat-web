// app/my-catalogs/components/StatsTab.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Bookmark, Eye, Package, Share2, User as UserIcon } from 'lucide-react';
import CreditsCard from '@/app_/profile/components/CreditsCard';
import { useCreditBalance } from '@/lib/api/apiHooks';
import { cn } from '@/lib/utils';
import { fmt } from '../constants';

/**
 * تب آمار — اعتبار فقط همین‌جا fetch می‌شود (perf: قبل از باز کردن تب لود نمی‌شود)
 */
export default function StatsTab({ currentCatalog, stats, productsCount }: {
    currentCatalog: any;
    stats: any;
    productsCount: number;
}) {
    // ✅ query فقط وقتی تب آمار باز است mount می‌شود
    const { data: creditBalance } = useCreditBalance();

    const cards = [
        { icon: Eye, value: stats?.views, label: 'بازدید', cls: 'text-blue-500' },
        { icon: Bookmark, value: stats?.saves, label: 'ذخیره', cls: 'text-amber-500' },
        { icon: Share2, value: stats?.shares, label: 'اشتراک', cls: 'text-emerald-500' },
        { icon: Package, value: productsCount, label: 'محصول', cls: 'text-purple-500' },
    ];

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {cards.map((s) => (
                    <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 p-4 text-center">
                        <s.icon className={cn('w-5 h-5 mx-auto mb-1.5', s.cls)} />
                        <p className="text-xl font-extrabold text-on-surface">{fmt(s.value)}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <CreditsCard balance={creditBalance?.balance} />

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 p-4">
                <h3 className="text-xs font-extrabold text-on-surface flex items-center gap-1.5 mb-3">
                    <Bookmark className="w-3.5 h-3.5 text-amber-500" /> چه کسانی کاتالوگت را ذخیره کرده‌اند
                    <span className="text-on-surface-variant/60">({fmt(stats?.savedBy?.length)})</span>
                </h3>
                {!stats?.savedBy?.length ? (
                    <p className="text-[11px] text-on-surface-variant/70 text-center py-4">
                        هنوز کسی ذخیره نکرده — کیت اشتراک‌گذاری را امتحان کن
                    </p>
                ) : (
                    <div className="space-y-2">
                        {stats.savedBy.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-surface-container-high grid place-items-center overflow-hidden flex-shrink-0">
                                    {item.user?.avatarUrl
                                        ? <Image src={item.user.avatarUrl} alt="" width={32} height={32} className="object-cover" unoptimized />
                                        : <UserIcon className="w-4 h-4 text-on-surface-variant/50" />}
                                </div>
                                <span className="text-xs font-bold text-on-surface truncate flex-1">{item.user?.fullName || 'کاربر'}</span>
                                <span className="text-[10px] text-on-surface-variant/60">{new Date(item.savedAt).toLocaleDateString('fa-IR')}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
