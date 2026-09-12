// components/PostPriceButton.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import { RootState } from '@/lib/store/store';
import { cn } from '@/lib/utils';
import { postPriceHref, postPriceLabel } from '@/lib/utils/postPrice';

/**
 * دکمهٔ «ثبت قیمت» هدر — لیبل بر اساس نوع بازار (عمده/خرده/خدمات).
 * رفتار دقیقاً مثل دکمهٔ صفحهٔ اول: لاگین → /my-catalogs | مهمان → login با redirect به همان‌جا.
 * روی صفحات کاتالوگ (my-catalogs/business) که خودشان همین اکشن را دارند رندر نمی‌شود.
 */
export default function PostPriceButton({
    size = 'desktop',
    className,
}: {
    size?: 'desktop' | 'mobile';
    className?: string;
}) {
    const pathname = usePathname();
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);
    const { currentArm } = useSelector((s: RootState) => s.arm);

    // روی صفحات کاتالوگ خودِ همین اکشن هست — دکمه تکراری است
    if (pathname?.startsWith('/my-catalogs') || pathname?.startsWith('/business')) return null;

    const label = postPriceLabel(currentArm);

    return (
        <Link
            href={postPriceHref(isAuthenticated)}
            title={`${label} — مدیریت کاتالوگ`}
            className={cn(
                'flex-shrink-0 flex items-center justify-center bg-primary text-on-primary font-bold',
                'shadow-sm hover:bg-primary/90 active:scale-[0.97] transition-all',
                size === 'mobile'
                    ? // موبایل: خیلی جمع‌وجور و ریزفونت تا برای عنوان بازار جا بماند
                      'h-7 px-2 rounded-md text-[10px] leading-none'
                    : 'h-9 px-3.5 rounded-lg text-[13px] gap-1.5',
                className,
            )}
        >
            {size === 'desktop' && <Plus className="w-4 h-4" />}
            {label}
        </Link>
    );
}
