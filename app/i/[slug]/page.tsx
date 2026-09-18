// app/i/[slug]/page.tsx
// ✅ آدرس رسمی صفحهٔ اعلان خرید (بازوی خرید): /i/<slug>
//    جدا از ریشه تا اسلاگ‌های گذرا (اعلام خریدها) با اسلاگ‌های قیمتیِ
//    بازوهای فروش و تابلوهای بازار (روت [slug]) درگیر نشوند.
//    لینک‌های قدیمی ریشه‌ای از app/[slug] به همین‌جا redirect می‌شوند.
import React from 'react';
import { apiService } from '@/lib/api/apiService';
import InquiryPublicClient from '../../inquiries/[id]/InquiryPublicClient';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug: rawSlug } = await params;
    const slug = (() => { try { return decodeURIComponent(rawSlug).replace(/\/+$/, '').trim(); } catch { return rawSlug; } })();
    if (!slug) return { title: 'آی مچ | بازوی خرید' };

    try {
        const inquiry = await apiService.inquiry.resolveSlug(slug);
        if (inquiry) {
            return {
                title: `${inquiry.title} | آی مچ`,
                alternates: { canonical: `/i/${slug}` },
                description: inquiry.description || `بازوی خرید ${inquiry.business?.name || ''} — ${inquiry.city || 'آی مچ'}`.trim(),
                openGraph: {
                    title: inquiry.title,
                    description: inquiry.description || undefined,
                    images: inquiry.business?.logoUrl ? [inquiry.business.logoUrl] : [],
                },
            };
        }
    } catch {}

    return { title: 'آی مچ | بازوی خرید' };
}

export default async function InquiryPublicPage({ params }: Props) {
    const { slug: rawSlug } = await params;
    // اسلش انتهایی + انکودینگ (درس باگ‌های قبلی resolver)
    const slug = (() => { try { return decodeURIComponent(rawSlug).replace(/\/+$/, '').trim(); } catch { return rawSlug; } })();
    return <InquiryPublicClient idOrSlug={slug} />;
}
