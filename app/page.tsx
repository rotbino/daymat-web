// app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useCataloges, useArms } from '@/lib/api/apiHooks';
import Landing from './home/Landing';
import { apiService } from '@/lib/api/apiService';

/**
 * روت سایت — نقطهٔ ورود و تعیین هویت:
 *   ۱) مهمان → لندینگ
 *   ۲) عضو فعالِ یک بازار → تابلوی همان بازار (تب «بازار» اول — دغدغهٔ جدید کاربر)
 *   ۳) کاتالوگ‌دار بدون عضویت → /my-catalogs
 *   ۴) لاگینِ بی‌کاتالوگ → لندینگ (CTA ساخت)
 */
export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, _hydrated } = useSelector((s: RootState) => s.auth) as any;
    const hydrated = _hydrated !== false;

    const { data: cataloges, isLoading: bizLoading } = useCataloges();
    const hasCatalog = (cataloges ?? []).length > 0;

    // عضویت‌ها — هم‌زمان با کاتالوگ‌ها لود می‌شود تا تصمیم تک‌مرحله‌ای باشد
    const { data: userArms, isLoading: armsLoading } = useArms();
    const loading = bizLoading || armsLoading;

    const [resolving, setResolving] = useState(true);

    useEffect(() => {
        if (!hydrated || loading) return;
        if (!isAuthenticated) { setResolving(false); return; }

        // ✅ اولویت ۱: بازار — اولین عضویتِ فعال
        const firstActiveArm = (userArms ?? []).find((m: any) => m.status === 'active');
        if (firstActiveArm?.slug) {
            router.replace(`/${firstActiveArm.slug}`);
            return;
        }

        // ✅ اولویت ۲: کاتالوگ
        if (hasCatalog) {
            router.replace('/my-catalogs');
            return;
        }

        // لاگینِ بی‌کاتالوگ و بی‌بازار → لندینگ
        setResolving(false);
    }, [hydrated, loading, isAuthenticated, userArms, hasCatalog, router]);

    // تا وقتی مسیر نهایی مشخص نشده، کاربر نباید لندینگ را برق ببیند
    if (!hydrated || loading || resolving || (isAuthenticated && (hasCatalog || (userArms ?? []).length > 0))) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    // مهمان و لاگینِ بی‌کاتالوگ → لندینگ
    return <Landing />;
}