// app/c/[slug]/page.tsx
// ✅ Server Component

import React from 'react';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import CatalogClient from './CatalogClient';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ search?: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    try {
        const business = await apiService.business.getBySlug(slug);
        return {
            title: `کاتالوگ ${business.name} | دیمت`,
            description: business.shortDescription || business.description || `کاتالوگ محصولات ${business.name}`,
            openGraph: {
                title: `کاتالوگ ${business.name}`,
                description: business.shortDescription,
                images: business.logoUrl ? [business.logoUrl] : [],
            },
        };
    } catch {
        return { title: 'کاتالوگ | دیمت' };
    }
}

export default async function CatalogPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const { search = '' } = await searchParams;

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                retry: 1,
                refetchOnMount: false,
                refetchOnWindowFocus: false,
            },
        },
    });

    // ✅ Prefetch business در سرور
    let businessData = null;
    try {
        businessData = await queryClient.fetchQuery({
            queryKey: ['business', 'by-slug', slug],
            queryFn: () => apiService.business.getBySlug(slug),
        });
    } catch {}

    // ✅ Prefetch آگهی‌ها در سرور - فقط صفحه اول
    if (businessData?.id) {
        try {
            await queryClient.fetchQuery({
                queryKey: ['catalog-ads', businessData.id, 1, 24, search],
                queryFn: () => apiService.ad.getCatalogAds(businessData.id, 1, 24, search || undefined),
            });
        } catch {}
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CatalogClient
                slug={slug}
                initialBusiness={businessData}
                initialSearch={search}
            />
        </HydrationBoundary>
    );
}