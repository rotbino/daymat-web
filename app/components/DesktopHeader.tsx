// app/components/DesktopHeader.tsx
'use client';
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { Bell, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationFilter } from './LocationFilter';
import HeaderMenu from './HeaderMenu';
import SearchBox from '@/components/home/SearchBox';
import ArmSwitcher from '@/components/ArmSwitcher';
import SaveArmButton from './SaveArmButton';
import { useUnreadNotifications } from '@/app/home/nav/useUnreadNotifications';

interface DesktopHeaderProps {
    showLocation?: boolean;
    fixed?: boolean;
    showBack?: boolean;
    showSearch?: boolean;
    logoSrc?: string;
    /** صفحاتی که NavTabs هم دارند این را true می‌فرستند تا از تکرار CTA/سرچ/اعلان جلوگیری شود */
    slim?: boolean;
}

/**
 * هدر دسکتاپ:
 *   - حالت کامل (مهمان یا صفحات بدون NavTabs): برند فرزند + سرچ + موقعیت + اعلان + CTA + منو
 *   - حالت slim (صفحاتی که NavTabs ردیف اول را دارند): فقط برند فرزند — بدون تکرار سرویس‌ها
 */
export default function DesktopHeader({ showLocation = false, fixed = true, showBack = false, showSearch = false, logoSrc, slim = false }: DesktopHeaderProps) {
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const unread = useUnreadNotifications();

    const loginHref = `/login?redirect=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`;

    return (
        <header className={cn('hidden lg:block w-full bg-white dark:bg-gray-900 border-b border-outline-variant/20 dark:border-gray-800', fixed && 'sticky top-0 z-40')}>
            <div className="px-4 xl:px-6 h-16 flex items-center gap-3">
                <ArmSwitcher variant="mobile" />

                {/* ✅ دکمهٔ ذخیره (فالو) کنار عنوان بازار — فقط برای غیرعضوها رندر می‌شود */}
                <SaveArmButton variant="desktop" />

                {!slim && showSearch ? (
                    <Suspense fallback={<div className="flex-1 max-w-2xl mx-auto h-10 rounded-xl bg-surface-container-high/70 animate-pulse" />}>
                        <div className="flex-1 max-w-2xl mx-auto min-w-0">
                            <SearchBox compact className="w-full" />
                        </div>
                    </Suspense>
                ) : (
                    <div className="flex-1" />
                )}

                {!slim && showLocation && <div className="flex-shrink-0"><LocationFilter /></div>}

                {!slim && isAuthenticated && (
                    <Link href="/notifications" aria-label="اعلان‌ها"
                          className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors">
                        <Bell className="w-5 h-5" />
                        {unread > 0 && (
                            <span className="absolute top-0.5 end-0.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center rounded-full bg-error text-white text-[9px] font-extrabold">
                                {unread > 99 ? '۹۹+' : unread.toLocaleString('fa-IR')}
                            </span>
                        )}
                    </Link>
                )}

                {!slim && (
                    isAuthenticated ? (
                        <Link href="/my-catalogs"
                              className="flex-shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-full bg-primary text-on-primary text-[12px] font-bold hover:bg-primary/90 shadow-sm transition-colors">
                            <Plus className="w-4 h-4" /> افزودن کالا
                        </Link>
                    ) : (
                        <Link href={loginHref}
                              className="flex-shrink-0 flex items-center h-10 px-5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 shadow-sm transition-colors">
                            عضویت | ورود
                        </Link>
                    )
                )}

                {!slim && <HeaderMenu />}
            </div>
        </header>
    );
}