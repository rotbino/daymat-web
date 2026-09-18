// app/[slug]/page.tsx
// ✅ روت بازوی فروش + تابلوی بازار — فقط دو چیز ماندگار و «قیمتی»:
//    بازوی فروش (Catalog) و تابلوی بازار (Arm) روی ریشه می‌مانند (آدرس کوتاه = ویترین).
//    اعلان خریدها (بازوی خرید) اسلاگِ گذرا دارند و به فولدر /i منتقل شده‌اند؛
//    لینک‌های قدیمی ریشه‌ای اینجا گرفته شده و به /i/<slug> می‌پیوندند.

import React from 'react';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { notFound, redirect } from 'next/navigation';
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

    // ۳) اعلان خرید؟ — آدرس رسمی‌اش /i/<slug> است؛ متادیتا هم آن‌جا ساخته می‌شود
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

    // ─── اعلان خرید — آدرس رسمی /i/<slug>؛ لینک‌های قدیمی ریشه‌ای به آنجا می‌پیوندند ───
    if (inquiry) {
        const sp = await searchParams;
        const rest = new URLSearchParams();
        for (const [k, v] of Object.entries(sp)) {
            if (typeof v === 'string' && v) rest.set(k, v);
            else if (Array.isArray(v) && v[0]) rest.set(k, v[0]);
        }
        const qs = rest.toString();
        redirect(`/i/${slug}${qs ? `?${qs}` : ''}`);
    }

    // ─── هیچ‌کدام ───
    notFound();
}