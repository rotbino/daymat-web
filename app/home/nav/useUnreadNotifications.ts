// app/nav/useUnreadNotifications.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';

/**
 * تعداد اعلان‌های خوانده‌نشده — جمع دو منبع:
 *   ۱) اعلان‌های واقعی چرخهٔ عضویت/ارتباط تجاری (GET /notification/unread-count)
 *   ۲) اعلان‌های مشتق از دیتا (کالاهای نیازمند قیمت تازه + کاتالوگ ناقص)
 * ✅ enabled: فقط با نشست rehydrate شده — وگرنه در بوت سرد، درخواست قبل از
 *    rehydrate بدون توکن 401 می‌خورد و force-logout نشست را پاک می‌کند (باگ خروج ناخواسته)
 */
export function useUnreadNotifications(): number {
    const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
    const { data: real } = useQuery({
        queryKey: ['notifications-unread-count'],
        queryFn: () => apiService.notification.unreadCount(),
        enabled: isAuthenticated,
        refetchInterval: 60_000,
    });
    const { data: derived } = useQuery({
        queryKey: ['notifications-derived'],
        queryFn: () => apiService.notification.getDerived(),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
    return (real?.count ?? 0) + (derived?.unread ?? 0);
}
