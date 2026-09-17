// app/[slug]/page.tsx
// ✅ روت واحد بازوی فروش + بازار + صفحهٔ اعلان خرید:
//    resolver سمت سرور تعیین می‌کند این slug بازوی فروش است یا تابلوی بازار یا صفحهٔ اعلان خرید.
//    اولویت با بازوی فروش (Catalog) است؛ تداخل اسلاگ با قید سه-جدولی (بازوی فروش/بازار/بازوی خرید)
//    در checkSlug هر دو سرویس جلوگیری می‌شود.
//    اسلش انتهایی و انکودینگ نرمال می‌شود.

import React from 'react';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { apiService } from '@/lib/api/apiService';
import CatalogClient from './CatalogClient';
import MarketShell from './components/MarketShell';
import InquiryPublicClient from '../inquiries/[id]/InquiryPublicClient';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ search?: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug).replace(/\/+$/, '').trim();
    if (!slug) return { title: 'دیمت | بازوی فروش روزانه قیمت' };

    // ۱) بازوی فروش؟
    try {
        const catalog = await apiService.catalog.getBySlug(slug);
        return {
            title: `بازوی فروش ${catalog.name} | دیمت`,
            alternates: { canonical: `/${slug}` },
            description: catalog.shortDescription || catalog.description || `بازوی فروش محصولات ${catalog.name}`,
            openGraph: {
                title: `بازوی فروش ${catalog.name}`,
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

    // ۳) صفحهٔ اعلان خرید؟ — رزولور سبک (بدون شمارش بازدید)
    try {
        const inquiry = await apiService.inquiry.resolveSlug(slug);
        if (inquiry) {
            return {
                title: `${inquiry.title} | دیمت`,
                alternates: { canonical: `/${slug}` },
                description: inquiry.description || `بازوی خرید ${inquiry.business?.name || ''} — ${inquiry.city || 'دیمت'}`.trim(),
                openGraph: {
                    title: inquiry.title,
                    description: inquiry.description || undefined,
                    images: inquiry.business?.logoUrl ? [inquiry.business.logoUrl] : [],
                },
            };
        }
    } catch {}

    return { title: 'دیمت | بازوی فروش روزانه قیمت' };
}

export default async function SlugPage({ params, searchParams }: Props) {
    const { slug: rawSlug } = await params;
    const { search = '' } = await searchParams;

    const slug = decodeURIComponent(rawSlug).replace(/\/+$/, '').trim(); // ✅ اسلش انتهایی + انکودینگ
    if (!slug) notFound();

    // ✅ resolver موازی — سه کوئری عمومی، سریع، بدون وابستگی به هم
    const [catalog, arm, inquiry] = await Promise.all([
        apiService.catalog.getBySlug(slug).catch(() => null),
        apiService.arm.fetchArmData(slug).catch(() => null),
        apiService.inquiry.resolveSlug(slug).catch(() => null),
    ]);

    // ─── بازوی فروش ───
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

        // Prefetch کالاهای بازوی فروش — فقط صفحه اول
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

    // ─── صفحهٔ اعلان خرید — همان کلاینت مسیر قدیمی /inquiries/[id] ───
    if (inquiry) {
        return <InquiryPublicClient idOrSlug={slug} />;
    }

    // ─── هیچ‌کدام ───
    notFound();
}