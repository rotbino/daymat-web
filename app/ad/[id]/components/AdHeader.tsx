// app/ad/[id]/components/AdHeader.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdHeaderProps {
    ad: any;
}

function getTierBadge(tier: string | undefined) {
    if (tier === 'gold') return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40';
    if (tier === 'silver') return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    if (tier === 'blue') return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40';
    return '';
}

function getTierLabel(tier: string | undefined) {
    return { gold: 'طلایی', silver: 'نقره‌ای', blue: 'برنزی' }[tier || ''] || null;
}

export default function AdHeader({ ad }: AdHeaderProps) {
    const router = useRouter();
    const tierLabel = getTierLabel(ad.business?.verificationTier);
    const tierBadge = getTierBadge(ad.business?.verificationTier);

    return (
        <header className="sticky top-0 z-40 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14">
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[180px] sm:max-w-sm">
                                {ad.productType || ad.title}
                            </h1>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[180px] sm:max-w-sm">
                                {ad.business?.name}
                            </p>
                        </div>
                    </div>
                    {tierLabel && (
                        <span className={cn('flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0', tierBadge)}>
                            <BadgeCheck className="w-3 h-3" />
                            {tierLabel}
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}