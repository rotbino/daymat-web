// app/components/OfferCallButton.tsx
// ☎️ دکمهٔ تماس با تامین‌کنندهٔ پیشنهاددهنده — خواستهٔ مالک:
//   موبایل: چیپ سبز «تماس» → tel: مستقیم | دسکتاپ (sm+): خودِ شماره دیده می‌شود (تماس مستقیم ندارد)
//   شمارهٔ ملاک = موبایل ثبت‌نام پیشنهاددهنده (بک خودکار پر می‌کند — قاعدهٔ Task 20)
'use client';

import { Phone } from 'lucide-react';

export default function OfferCallButton({ phone }: { phone: string }) {
    if (!phone) return null;
    return (
        <a
            href={`tel:${phone}`}
            dir="ltr"
            title="تماس با تامین‌کننده"
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-2.5 text-[10.5px] font-extrabold text-white shadow-sm transition-colors hover:bg-emerald-600"
        >
            <Phone className="size-3" />
            <span className="sm:hidden">تماس</span>
            <span className="hidden sm:inline">{phone}</span>
        </a>
    );
}
