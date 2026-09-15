// app/[slug]/buyers/page.tsx
// ✅ صفحهٔ مستقل «خریداران» — تابلوی بازوهای خرید بازار (قرینهٔ فروشندگان: ‎/{slug})
//    فقط بازار؛ کاتالوگ و بازوی خریدِ تکی در این مسیر معنا ندارند → 404
//    لگسی ‎/{slug}?board=inquiry از سمت MarketContent به اینجا ریدایرکت می‌شود.

import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import BuyersBoard from './BuyersBoard';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug).replace(/\/+$/, '').trim();
    try {
        const arm = await apiService.arm.fetchArmData(slug);
        if (arm) {
            return {
                title: `دیوار خریداران بازار ${arm.name} | دیمت`,
                alternates: { canonical: `/${slug}/buyers` },
                description: arm.slogan || `دیوار خریداران بازار ${arm.name} — درخواست‌های خرید خریداران و پیشنهاد قیمت`,
            };
        }
    } catch {}
    return { title: 'تابلوی خریداران | دیمت' };
}

export default async function BuyersPage({ params }: Props) {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug).replace(/\/+$/, '').trim();
    if (!slug) notFound();

    // ✅ فقط بازار — اگر این slug کاتالوگ یا بازوی خرید بود، مسیر اشتباه است
    const arm = await apiService.arm.fetchArmData(slug).catch(() => null);
    if (!arm) notFound();

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        }>
            <BuyersBoard slug={slug} />
        </Suspense>
    );
}
