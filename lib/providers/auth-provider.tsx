// lib/auth-provider.tsx
'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { RootState } from '../store/store';

// ✅ مسیرهای عمومی (نیاز به لاگین ندارند)
const publicPaths = [
    '/',           // صفحه اصلی
    '/login',      // لاگین
    '/register',   // ثبت‌نام
    '/no-arm',     // صفحه بدون بازار
    '/forgot-password',
    '/reset-password',
    '/admin/login',
];

// ✅ مسیرهای محافظت‌شده (نیاز به لاگین دارند)
const protectedPrefixes = [
    '/dashboard',
    '/profile',
    '/business',
    '/ad/create',
    '/ad/edit',
];

// ✅ مسیرهای ادمین (دسترسی خاص)
const adminPrefixes = ['/admin'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    useEffect(() => {
        // ✅ اگر در مسیر ادمین هستیم، کاری نکن (AdminLayout مدیریت می‌کند)
        if (adminPrefixes.some((prefix) => pathname.startsWith(prefix))) {
            return;
        }

        // ✅ بررسی مسیرهای عمومی
        const isPublic = publicPaths.some(path =>
            pathname === path || pathname?.startsWith(`${path}/`)
        );

        // ✅ بررسی مسیرهای محافظت‌شده
        const isProtected = protectedPrefixes.some((prefix) =>
            pathname?.startsWith(prefix)
        );

        // ✅ اگر مسیر بازار است (مثلاً /barton) - عمومی است
        const isArmPath = pathname?.startsWith('/') &&
            !pathname?.startsWith('/_next') &&
            !pathname?.startsWith('/api') &&
            !pathname?.startsWith('/admin') &&
            !pathname?.startsWith('/arm-admin') &&  // ✅پنل مالک بازار
            !pathname?.startsWith('/login') &&
            !pathname?.startsWith('/register') &&
            !pathname?.startsWith('/no-arm') &&
            !pathname?.startsWith('/profile') &&
            !pathname?.startsWith('/business') &&
            !pathname?.startsWith('/dashboard') &&
            !pathname?.startsWith('/ad') &&
            pathname !== '/' &&
            !pathname?.includes('.') && // فایل‌های استاتیک
            pathname?.length > 1;

        // ✅ اگر کاربر لاگین نیست و در مسیر محافظت‌شده است → به لاگین بفرست
        if (!isAuthenticated && isProtected) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        // ✅ اگر کاربر لاگین است و در لاگین/ثبت‌نام است → به صفحه اصلی بفرست
        if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
            router.push('/');
            return;
        }

        // ✅ مسیرهای عمومی (صفحه اصلی، بازارها، لاگین، ثبت‌نام، no-arm) مجاز هستند
        // نیازی به هیچ اقدامی نیست

    }, [isAuthenticated, pathname, router]);

    return <>{children}</>;
}