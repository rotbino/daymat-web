// app/components/MobileHeader.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { ArrowRight, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationFilter } from './LocationFilter';
import HeaderMenu from './HeaderMenu';
import ArmSwitcher from '@/components/ArmSwitcher';
import PostPriceButton from '@/components/PostPriceButton';
import SaveArmButton from './SaveArmButton';
import { useUnreadNotifications } from '@/app/home/nav/useUnreadNotifications';

interface MobileHeaderProps {
    showLocation?: boolean;
    fixed?: boolean;
    showBack?: boolean;
    logoSrc?: string;
}

/**
 * هدر موبایل — مینیمال: هویت بازار + موقعیت + اعلان + منو.
 * ناوبری کامل از NavTabs (نوار پایین ثابت) می‌آید — اینجا تکرار نمی‌شود.
 */
export default function MobileHeader({ showLocation = false, fixed = true, showBack = false, logoSrc }: MobileHeaderProps) {
    const router = useRouter();
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const unread = useUnreadNotifications();

    return (
        <header className={cn(
            'lg:hidden w-full bg-white dark:bg-gray-900',
            'border-b border-outline-variant/15 dark:border-gray-800/60',
            'shadow-[0_2px_8px_rgba(0,0,0,0.05)]',
            fixed && 'sticky top-0 z-40',
        )}>
            <div className="h-12 px-1.5 flex items-center gap-0.5">
                {showBack && (
                    <button type="button" onClick={() => router.back()} aria-label="بازگشت"
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container-high transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                )}

                <ArmSwitcher variant="mobile" />

                {/* ✅ دکمهٔ ذخیره (فالو) کنار عنوان بازار — فقط برای غیرعضوها رندر می‌شود */}
                <SaveArmButton variant="mobile" />

                <div className="flex-1" />

                {showLocation && <div className="flex-shrink-0"><LocationFilter /></div>}

                {/* ✅ دکمهٔ ثبت قیمت — جمع‌وجور و ریزفونت تا برای عنوان بازار جا بماند */}
               {/* <PostPriceButton size="mobile" className="mx-0.5" />*/}

                {/* ✅ اعلان‌ها — بالا، همیشه در دسترس؛ جمع‌وجور تا به سه‌نقطه نزدیک بماند */}
                {isAuthenticated && (
                    <Link href="/notifications" aria-label="اعلان‌ها"
                          className="relative flex-shrink-0 w-9 h-10 flex items-center justify-center rounded-full
                              text-on-surface-variant active:bg-surface-container-high transition-colors">
                        <Bell className="w-[21px] h-[21px]" />
                        {unread > 0 && (
                            <span className="absolute top-0.5 end-1 min-w-[16px] h-4 px-1 flex items-center justify-center
                                rounded-full bg-error text-white text-[9px] font-extrabold">
                                {unread > 99 ? '۹۹+' : unread.toLocaleString('fa-IR')}
                            </span>
                        )}
                    </Link>
                )}

                <HeaderMenu />
            </div>
        </header>
    );
}