// app/[slug]/page.tsx
// ✅ روت واحد کاتالوگ + بازار:
//    resolver سمت سرور تعیین می‌کند این slug کاتالوگ است یا تابلوی بازار.
//    اولویت با کاتالوگ (Catalog) است؛ تداخل اسلاگ با قید دو-جدولی در checkSlug جلوگیری می‌شود.
//    اسلش انتهایی و انکودینگ نرمال می‌شود.

import React from 'react';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { apiService } from '@/lib/api/apiService';
import CatalogClient from './CatalogClient';
import MarketShell from './components/MarketShell';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ search?: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug).replace(/\/+$/, '').trim();
    if (!slug) return { title: 'دیمت | کاتالوگ روزانه قیمت' };

    // ۱) کاتالوگ؟
    try {
        const catalog = await apiService.catalog.getBySlug(slug);
        return {
            title: `کاتالوگ ${catalog.name} | دیمت`,
            alternates: { canonical: `/${slug}` },
            description: catalog.shortDescription || catalog.description || `کاتالوگ محصولات ${catalog.name}`,
            openGraph: {
                title: `کاتالوگ ${catalog.name}`,
                description: catalog.shortDescription,
                images: catalog.logoUrl ? [catalog.logoUrl] : [],
            },
        };
    } catch {}

    // ۲) بازار؟
    try {
        const arm = await apiService.arm.fetchArmData(slug);
        if (arm) {
            return {
                title: `${arm.name} | تابلوی قیمت عمده | دیمت`,
                alternates: { canonical: `/${slug}` },
                description: arm.slogan || arm.description || `تابلوی قیمت عمده ${arm.name}`,
            };
        }
    } catch {}

    return { title: 'دیمت | کاتالوگ روزانه قیمت' };
}

export default async function SlugPage({ params, searchParams }: Props) {
    const { slug: rawSlug } = await params;
    const { search = '' } = await searchParams;

    const slug = decodeURIComponent(rawSlug).replace(/\/+$/, '').trim(); // ✅ اسلش انتهایی + انکودینگ
    if (!slug) notFound();

    // ✅ resolver موازی — دو کوئری عمومی، سریع، بدون وابستگی به هم
    const [catalog, arm] = await Promise.all([
        apiService.catalog.getBySlug(slug).catch(() => null),
        apiService.arm.fetchArmData(slug).catch(() => null),
    ]);

    // ─── کاتالوگ ───
    if (catalog) {
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

        // Prefetch کالاهای کاتالوگ — فقط صفحه اول
        if (catalog.id) {
            try {
                await queryClient.fetchQuery({
                    queryKey: ['catalog-ads', catalog.id, 1, 24, search],
                    queryFn: () => apiService.catalog.getCatalogAds(catalog.id, 1, 24, search || undefined),
                });
            } catch {}
        }

        return (
            <HydrationBoundary state={dehydrate(queryClient)}>
                <CatalogClient slug={slug} initialCatalog={catalog} initialSearch={search} />
            </HydrationBoundary>
        );
    }

    // ─── بازار ───
    if (arm) {
        return <MarketShell slug={slug} search={search} />;
    }

    // ─── هیچ‌کدام ───
    notFound();
}