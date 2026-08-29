// app/components/DesktopHeader.tsx
'use client';
import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { Store, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationFilter } from './LocationFilter';
import HeaderMenu from './HeaderMenu';
import SearchBox from '@/app/home/SearchBox';
import ArmSwitcher from "@/app/components/ArmSwitcher";

interface DesktopHeaderProps {
    showLocation?: boolean;
    fixed?: boolean;
    showBack?: boolean;
    showSearch?: boolean;
    logoSrc?: string;
}

export default function DesktopHeader({ showLocation = false, fixed = true, showBack = false, showSearch = false, logoSrc }: DesktopHeaderProps) {
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    const armName = currentArm?.name || 'بازار';
    // شعار: از تنظیمات بازار اگر موجود است؛ وگرنه از پراپ/ثابت
    const slogan = (currentArm as any)?.slogan || 'قیمت عمده، لحظه‌ای و شفاف';
    const armHref = currentSlug ? `/${currentSlug}` : '/';
    const loginHref = `/login?arm=${currentSlug ?? ''}&redirect=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`;
    const createAdHref = `/ad/create?arm=${currentSlug ?? ''}`;
    const logo = logoSrc || (currentArm as any)?.logoUrl || undefined;

    return (
        <header className={cn('hidden lg:block w-full bg-white dark:bg-gray-900 border-b border-outline-variant/20 dark:border-gray-800', fixed && 'sticky top-0 z-40')}>
            <div className="px-4 xl:px-6 h-16 flex items-center gap-3">
                {/* لوگو + نام + شعار */}
                <ArmSwitcher variant="mobile" />

                {showSearch ? (
                    <Suspense fallback={<div className="flex-1 max-w-2xl mx-auto h-10 rounded-xl bg-surface-container-high/70 animate-pulse" />}>
                        <div className="flex-1 max-w-2xl mx-auto min-w-0">
                            <SearchBox compact className="w-full" />
                        </div>
                    </Suspense>
                ) : (
                    <div className="flex-1" />
                )}

                {showLocation && <div className="flex-shrink-0"><LocationFilter /></div>}

                {/* عضویت / ثبت قیمت */}
                {isAuthenticated ? (
                    <Link href={createAdHref}
                          className="flex-shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-full bg-primary text-on-primary text-[12px] font-bold hover:bg-primary/90 shadow-sm transition-colors">
                        <Plus className="w-4 h-4" /> ثبت قیمت عمده
                    </Link>
                ) : (
                    <Link href={loginHref}
                          className="flex-shrink-0 flex items-center h-10 px-5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 shadow-sm transition-colors">
                        عضویت | ورود
                    </Link>
                )}



                {isAuthenticated && (
                    <Link href="/profile" aria-label="پروفایل"
                          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors">
                        <User className="w-5 h-5" />
                    </Link>
                )}

                <HeaderMenu />
            </div>
        </header>
    );
}