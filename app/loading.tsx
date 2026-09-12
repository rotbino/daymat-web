// app/loading.tsx — صفحه لودینگ برند
// ✅ همیشه لوگو + نام + شعار دیمت — حتی وقتی در صفحهٔ بازار جاری هستیم
// ✅ قبلاً «دو تیکه» بود: در بازار، لوگو/شعارِ بازار را نشان می‌داد؛
//     این باعث گیجی کاربر می‌شد (لودینگ = هویت پلتفرم، نه بازار) — یکدست شد

'use client';

import Image from 'next/image';

// ✅ هویت ثابت برند دیمت — مستقل از بازار جاری
const BRAND = {
    logo: '/images/logo.png',
    name: 'دیمت',
    slogan: 'بازار عمده‌فروشی ایران',
} as const;

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40">
            {/* لوگو */}
            <div className="relative w-20 h-20 mb-4 animate-in zoom-in-50 duration-500">
                <Image
                    src={BRAND.logo}
                    alt={BRAND.name}
                    fill
                    className="object-contain"
                    unoptimized
                    priority
                />
            </div>

            {/* نام */}
            <h1 className="text-2xl font-black text-on-surface mb-1 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                {BRAND.name}
            </h1>

            {/* شعار */}
            <p className="text-sm text-on-surface-variant/70 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                {BRAND.slogan}
            </p>

            {/* اسپینر */}
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />

            {/* نقطه‌های لودینگ */}
            <div className="flex gap-1.5 mt-4">
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '400ms' }} />
            </div>
        </div>
    );
}
