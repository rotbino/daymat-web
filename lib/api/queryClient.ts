// lib/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 0, // ✅ داده‌ها همیشه fresh در نظر گرفته شوند
            gcTime: 1000 * 60 * 10, // ۱۰ دقیقه در کش نگهداری شوند
            retry: 1,
            refetchOnMount: 'always',
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
});