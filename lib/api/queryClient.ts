// lib/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

/**
 * پیش‌فرض‌های کش کلاینت — هم‌راستا با کش سمت سرور (۵ دقیقه‌ای):
 * - staleTime ۶۰ ثانیه: در بازهٔ ۶۰ ثانیه، مونت مجدد کامپوننت از کش می‌خواند
 *   (قبلاً staleTime:0 + refetchOnMount:'always' بود = هر مونت یک راند‌تریپ به سرور!)
 * - کوئری‌هایی که تازگی فوری می‌خواهند می‌توانند staleTime: 0 خودشان را override کنند
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,          // ۱ دقیقه تازگی — جلوگیری از رفچ‌های بی‌مورد
            gcTime: 10 * 60 * 1000,        // ۱۰ دقیقه در کش نگهداری شوند
            retry: 1,
            refetchOnMount: true,          // فقط اگر stale شد رفچ کن (نه همیشه)
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
});
