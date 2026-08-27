// app/ad/[id]/page.tsx
import { Suspense } from 'react';
import { apiService } from '@/lib/api/apiService';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import AdDetailClient from './AdDetailClient';
import { Loader2 } from 'lucide-react';

// ✅ params را await کن
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const ad = await apiService.ad.getDetail(id);
        return {
            title: `${ad.productType || ad.title} | Daymat`,
            description: ad.description?.slice(0, 160) || `قیمت ${ad.productType} در بازار عمده`,
            openGraph: {
                images: ad.files?.[0]?.path ? [ad.files[0].path] : [],
            },
        };
    } catch {
        return {
            title: 'آگهی | Daymat',
            description: 'مشاهده جزئیات آگهی در Daymat',
        };
    }
}

export default async function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // ✅ حتماً params را await کن
    const { id } = await params;

    console.log('🔍 AdDetailPage - id:', id);

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                retry: 1,
                refetchOnMount: false,
                refetchOnWindowFocus: false,
                refetchOnReconnect: false,
            },
        },
    });

    try {
        console.log('🔄 Fetching ad detail...');

        // ✅ Prefetch در سمت سرور
        const adData = await queryClient.fetchQuery({
            queryKey: ['ad', id, 'detail'],
            queryFn: () => apiService.ad.getDetail(id),
        });

        console.log('✅ Ad data fetched:', adData?.id);

        if (!adData) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <p>آگهی یافت نشد</p>
                </div>
            );
        }

        return (
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                        <Loader2 className="w-9 h-9 animate-spin text-primary" />
                    </div>
                }>
                    <AdDetailClient adId={id} initialData={adData} />
                </Suspense>
            </HydrationBoundary>
        );
    } catch (error) {
        console.error('❌ Error in AdDetailPage:', error);

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <p className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                        خطا در بارگذاری آگهی
                    </p>
                    <p className="text-sm text-gray-500">
                        لطفاً دوباره تلاش کنید
                    </p>
                </div>
            </div>
        );
    }
}