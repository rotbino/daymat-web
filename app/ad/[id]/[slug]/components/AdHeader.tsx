// app/ad/[id]/components/AdHeader.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BadgeCheck, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from "next/image";
import {useSelector} from "react-redux";
import {RootState} from "@/lib/store/store";

interface Props {
    ad: any;
}

function getTierBadge(tier: string | undefined) {
    if (tier === 'gold') return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40';
    if (tier === 'silver') return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    if (tier === 'blue') return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40';
    return '';
}

function getTierLabel(tier: string | undefined) {
    return { gold: 'طلایی', silver: 'نقره‌ای', blue: 'آبی' }[tier || ''] || null;
}

export default function AdHeader({ ad }: Props) {
    const router = useRouter();
    const tierLabel = getTierLabel(ad.business?.verificationTier);
    const tierBadge = getTierBadge(ad.business?.verificationTier);
    const { currentArm, currentSlug } = useSelector(
        (state: RootState) => state.arm
    );
    const logoFile = (currentArm as any)?.config?.general?.logoFile;
    const logoSrc =
        logoFile?.path ||
        (currentArm as any)?.config?.general?.logoUrl ||
        '/images/logo.png';
    const armName = currentArm?.name || 'Daymat';
    const armSlogan = currentArm?.slogan
    return (
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800">
            <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-1 px-4 sm:px-6 h-14  items-center gap-3">
                    {/* ✅ دکمه بازگشت با ArrowRight */}
                    <button
                        onClick={() => router.back()}
                        className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
                        aria-label="بازگشت"
                    >
                        <ArrowRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>

                    {/* ✅ عنوان کالا */}
                    <h1 className="flex-1 min-w-0 text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                        {ad.productType || ad.title}
                    </h1>

                    {/* ✅ بج تاییدیه */}
                    {tierLabel && (
                        <span className={cn(
                            'flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0',
                            tierBadge,
                        )}>
                        <BadgeCheck className="w-3 h-3" />
                            {tierLabel}
                    </span>
                    )}
                </div>
                <div
                    className="
                               h-14  items-center gap-3
                                cursor-pointer

                                rounded-lg
                                overflow-hidden
                                hover:opacity-80
                                transition-opacity
                                p-0.5
                                flex-shrink-0
                            "
                    style={{ width: 'auto', height: '60px' }}
                    onClick={() => router.push('/')}
                >
                    <Image
                        src={logoSrc}
                        alt={armName}
                        width={0}
                        height={60}
                        className="w-auto h-full object-contain"
                        unoptimized={logoSrc.startsWith('http')}
                        sizes="auto"
                    />
                </div>
            </div>

        </header>
    );
}