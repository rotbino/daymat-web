// app/inquiries/[id]/page.tsx
// مسیر قدیمی صفحهٔ اعلان خرید — لینک‌های قبلی (اسلاگِ خودکارِ عنوانی یا id) هنوز لود می‌شوند.
// ✅ آدرس رسمی حالا /i/<slug> است (فولدر جدا از ریشه) — resolver قدیمی app/[slug] لینک‌های
//    ریشه‌ای را به /i می‌پیچاند؛ اینجا فقط پارامتر دیکود می‌شود و کلاینت مشترک رندر می‌شود.
'use client';

import React, { use } from 'react';
import InquiryPublicClient from './InquiryPublicClient';

export default function InquiryLegacyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: rawId } = use(params);
    // ⚠️ Next.js این پارامتر را percent-encoded تحویل می‌دهد؛ دیکود کن (درس باگ /server-unavailable)
    const id = (() => { try { return decodeURIComponent(rawId); } catch { return rawId; } })();
    return <InquiryPublicClient idOrSlug={id} />;
}
