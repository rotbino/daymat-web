// app/[slug]/page.tsx
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
        const catalog = await apiService.catalog.getBySlug(slug);
        return {
            title: `کاتالوگ ${catalog.name} | دیمت`,
            description: catalog.shortDescription || catalog.description || `کاتالوگ محصولات ${catalog.name}`,
            openGraph: {
                title: `کاتالوگ ${catalog.name}`,
                description: catalog.shortDescription,
                images: catalog.logoUrl ? [catalog.logoUrl] : [],
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

    // ✅ Prefetch catalog در سرور
    let catalogData = null;
    try {
        catalogData = await queryClient.fetchQuery({
            queryKey: ['catalog', 'by-slug', slug],
            queryFn: () => apiService.catalog.getBySlug(slug),
        });
    } catch {}

    // ✅ Prefetch آگهی‌ها در سرور - فقط صفحه اول
    if (catalogData?.id) {
        try {
            await queryClient.fetchQuery({
                queryKey: ['catalog-ads', catalogData.id, 1, 24, search],
                queryFn: () => apiService.catalog.getCatalogAds(catalogData.id, 1, 24, search || undefined),
            });
        } catch {}
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CatalogClient
                slug={slug}
                initialCatalog={catalogData}
                initialSearch={search}
            />
        </HydrationBoundary>
    );
}