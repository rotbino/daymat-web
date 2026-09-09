// app/loading.tsx — صفحه لودینگ برند
// ✅ وسط صفحه: لوگو + نام + شعار + اسپینر
// ✅ برای صفحات عمومی دیمت
// ✅ برای بازارهای اختصاصی، از Redux store لوگوی بازار رو می‌خونه

'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import Image from 'next/image';

export default function Loading() {
    const currentArm = useSelector((s: RootState) => s.arm.currentArm);

    // ✅ اگه در صفحه بازار اختصاصی هستیم، لوگوی بازار رو نشون بده
    const logo = currentArm?.icon || '/images/logo.png';
    const name = currentArm?.name || 'دیمت';
    const slogan = currentArm?.slogan || 'بازار عمده‌فروشی ایران';

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40">
            {/* لوگو */}
            <div className="relative w-20 h-20 mb-4 animate-in zoom-in-50 duration-500">
                <Image
                    src={logo}
                    alt={name}
                    fill
                    className="object-contain"
                    unoptimized
                    priority
                />
            </div>

            {/* نام */}
            <h1 className="text-2xl font-black text-on-surface mb-1 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                {name}
            </h1>

            {/* شعار */}
            <p className="text-sm text-on-surface-variant/70 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                {slogan}
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
