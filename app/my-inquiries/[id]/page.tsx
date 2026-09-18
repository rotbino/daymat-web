// app/my-inquiries/[id]/page.tsx
// تور ایمنی لینک عمیق — پنل بازوی خرید یک صفحهٔ واحد است و بازوی جاری را با
// «?catalog=<id>» می‌گیرد؛ هر آدرسی به شکل /my-inquiries/<id> (لینک اعلان‌های
// قدیمی، پیام‌های به‌اشتراک‌گذاشته، تایپ دستی) به قالب درست می‌پیچد تا 404 نبینیم.
import { redirect } from 'next/navigation';

export default async function MyInquiryDeepLinkPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { id } = await params;
    const sp = await searchParams;
    const qs = new URLSearchParams();
    qs.set('catalog', id);
    for (const [k, v] of Object.entries(sp)) {
        const val = Array.isArray(v) ? v[0] : v;
        if (val && k !== 'catalog') qs.set(k, val);
    }
    redirect(`/my-inquiries?${qs.toString()}`);
}
