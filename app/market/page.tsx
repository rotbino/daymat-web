// app/market/page.tsx
// ✅ /market دیگر صفحهٔ مستقل نیست — مسیر قدیمی به /markets (لیست و جستجوی بازارها) ریدایرکت می‌شود.
//    صفحهٔ واقعی: app/markets/page.tsx — همیشه لیست، هیچ رفتار دیگری ندارد.

import { redirect } from 'next/navigation';

export default function MarketLegacyRedirect() {
    redirect('/markets');
}
