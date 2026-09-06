// app/nav/useUnreadNotifications.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';

/**
 * تعداد اعلان‌های حل‌نشده — فعلاً از دیتای مشتق (کالاهای نیازمند قیمت تازه + کاتالوگ ناقص)؛
 * وقتی اعلان واقعی آمد، همین هوک گسترش می‌یابد.
 */
export function useUnreadNotifications(): number {
    const { data } = useQuery({
        queryKey: ['notifications-derived'],
        queryFn: () => apiService.notification.getDerived(),
        staleTime: 60_000,
    });
    return data?.unread ?? 0;
}