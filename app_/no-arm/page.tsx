// app/no-arm/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { Link } from 'lucide-react';

export default function NoArmPage() {
    const router = useRouter();
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);

    // ⭐ اگه بازار وجود داره، سریع برگرد به صفحه اصلی
    useEffect(() => {
        if (currentSlug && currentArm) {
            router.replace('/');
        }
    }, [currentSlug, currentArm, router]);

    // ⭐ اگه داره ریدایرکت میشه، چیزی نشون نده (فلش نزنه)
    if (currentSlug && currentArm) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-24 pb-24 flex flex-col items-center justify-center">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-primary-container/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Link className="w-10 h-10 text-primary" strokeWidth={1.5} />
                    </div>

                    <p className="text-on-surface-variant max-w-md leading-7">
                        ورود به Daymat در حال حاضر تنها از طریق لینک دعوت امکان‌پذیر است.

                    </p>
                </div>
            </main>
        </div>
    );
}