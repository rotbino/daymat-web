'use client';

// lib/providers/RouteTracker.tsx
// مسیر فعلی را در sessionStorage ثبت می‌کند تا بعد از رفع قطعی اینترنت/سرور،
// offline.html و صفحهٔ server-unavailable کاربر را دقیقاً به همان‌جا برگردانند.
// روی صفحهٔ وضعیت خودش چیزی ثبت نمی‌کند (جلوگیری از لوپ بازگشت).
// نکته: به‌جای useSearchParams از window.location.search استفاده می‌کنیم
// تا نیازی به Suspense boundary در prerender نباشد.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { storeReturnUrl } from '@/lib/api/networkGuard';

export function RouteTracker() {
    const pathname = usePathname();

    useEffect(() => {
        if (!pathname) return;
        if (typeof window === 'undefined') return;
        const search = window.location.search;
        storeReturnUrl(pathname + (search || ''));
    }, [pathname]);

    return null;
}
