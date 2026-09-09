// lib/providers/auth-provider.tsx
'use client';

import { useEffect, useState } from 'react';
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
    '/catalog',
    '/ad/create',
    '/ad/edit',
    '/my-catalogs',
    '/notifications',
    '/credit',
    '/feedback',
    '/saved-ads',
    '/business',
];

// ✅ مسیرهای ادمین (دسترسی خاص)
const adminPrefixes = ['/admin'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const sessionExpired = useSelector((state: RootState) => state.auth.sessionExpired);
    
    // ✅ منتظر بمون تا redux-persist hydrate بشه
    // تا وقتی hydrate نشده، هیچ redirect ای نکن
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        // ✅ اگه هنوز hydrate نشده، کاری نکن
        if (!isHydrated) return;

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

        // ✅ اگر کاربر لاگین نیست و در مسیر محافظت‌شده است → به لاگین بفرست
        // اما فقط اگه sessionExpired=true باشه (یعنی واقعاً سشن خراب شده)
        // یا اگه从来没有 توکن ذخیره نشده (یعنی کاربر هیچ‌وقت لاگین نکرده)
        if (!isAuthenticated && isProtected) {
            // ✅ اگه sessionExpired=true هست، یعنی سنسن خراب شده → redirect به لاگین
            if (sessionExpired) {
                router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
                return;
            }
            // ✅ اگه توکن در localStorage هست ولی هنوز hydrate نشده، صبر کن
            const hasToken = typeof window !== 'undefined' && localStorage.getItem('accessToken');
            if (!hasToken) {
                // ✅ واقعاً لاگین نکرده → redirect
                router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
                return;
            }
            // ✅ توکن هست ولی isAuthenticated=false → یه مشکل موقتیه، redirect نکن
            // بذار API interceptor خودش هندل کنه
        }

        // ✅ اگر کاربر لاگین است و در لاگین/ثبت‌نام است → به صفحه اصلی بفرست
        if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
            router.push('/');
            return;
        }

    }, [isAuthenticated, pathname, router, isHydrated, sessionExpired]);

    return <>{children}</>;
}
