// app/components/MobileHeader.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { ArrowRight, Store, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationFilter } from './LocationFilter';
import HeaderMenu from './HeaderMenu';
import ArmSwitcher from "@/app/components/ArmSwitcher";

interface MobileHeaderProps {
    showLocation?: boolean;
    fixed?: boolean;
    showBack?: boolean;
    logoSrc?: string;
}

export default function MobileHeader({ showLocation = false, fixed = true, showBack = false, logoSrc }: MobileHeaderProps) {
    const router = useRouter();
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    const armName = currentArm?.name || 'بازار';
    const armHref = currentSlug ? `/${currentSlug}` : '/';
    const logo = logoSrc || (currentArm as any)?.logoUrl || undefined;
    const userHref = isAuthenticated ? '/profile' : `/login?arm=${currentSlug ?? ''}`;

    return (
        <header className={cn('lg:hidden w-full bg-white dark:bg-gray-900', fixed && 'sticky top-0 z-40')}>
            <div className="h-12 px-1.5 flex items-center gap-0.5">

                {showBack && (
                    <button type="button" onClick={() => router.back()} aria-label="بازگشت"
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container-high transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                )}

                <ArmSwitcher variant="mobile" />

                <div className="flex-1" />

                {showLocation && <div className="flex-shrink-0"><LocationFilter /></div>}

                {/*<Link href={userHref} aria-label={isAuthenticated ? 'پروفایل' : 'ورود'}
                      className="flex-shrink-0 w-12 h-10 flex items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container-high transition-colors">
                    <User className="w-[21px] h-[21px]" />
                </Link>*/}
                <HeaderMenu />
            </div>
        </header>
    );
}