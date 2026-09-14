// app/nav/useUnreadNotifications.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';

/**
 * بجِ ناوبری = تعداد اعلان‌های واقعیِ خوانده‌نشده (GET /notification/unread-count)
 *
 * ✅ فقط اعلان‌های واقعی شمرده می‌شوند — یادآوری‌های مشتق از دیتا (قیمتِ قدیمی،
 *    کاتالوگ ناقص و…) تسکِ اعلانی نیستند و بج را بی‌پایان روشن نگه نمی‌دارند؛
 *    آن‌ها در صفحه اعلان‌ها (بخش «یادآوری‌های کاتالوگ») دیده می‌شوند.
 * ✅ اعلان‌های اطلاع‌رسانی (تایید/رد و…) با دیدن صفحه اعلان‌ها خوانده می‌شوند
 *    و دکمهٔ «مشاهده شد» هر کارت هم آن را تک‌تک از جریان خارج می‌کند.
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
    return real?.count ?? 0;
}
