// app/nav/useUnreadNotifications.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';

/**
 * تعداد اعلان‌های حل‌نشده — فعلاً از دیتای مشتق (کالاهای نیازمند قیمت تازه + کاتالوگ ناقص)؛
 * وقتی اعلان واقعی آمد، همین هوک گسترش می‌یابد.
 * ✅ enabled: فقط با نشست rehydrate شده — وگرنه در بوت سرد، درخواست قبل از
 *    rehydrate بدون توکن 401 می‌خورد و force-logout نشست را پاک می‌کند (باگ خروج ناخواسته)
 */
export function useUnreadNotifications(): number {
    const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
    const { data } = useQuery({
        queryKey: ['notifications-derived'],
        queryFn: () => apiService.notification.getDerived(),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
    return data?.unread ?? 0;
}