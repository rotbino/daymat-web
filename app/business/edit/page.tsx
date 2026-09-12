// app/business/edit/page.tsx
'use client';

/**
 * صفحهٔ ویرایش کسب‌وکار — دسترسی مستقیم (بدون پنهان‌شدن پشت کاتالوگ)
 *   • از اعلان «لوگو ندارد» با ?id= می‌آید
 *   • یا مستقیم: /business/edit (اولین کسب‌وکار فعال)
 * فرم همان BusinessSetupModal است — حالت ویرایش + آپلود لوگو.
 */

import React, { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { Building2, Loader2 } from 'lucide-react';
import { useMyBusinesses } from '@/lib/api/apiHooks';
import BusinessSetupModal from '@/app/components/BusinessSetupModal';

export default function BusinessEditPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen grid place-items-center bg-surface dark:bg-gray-950">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        }>
            <BusinessEditContent />
        </Suspense>
    );
}

function BusinessEditContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const wantedId = searchParams.get('id');

    const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
    const { data, isLoading } = useMyBusinesses();

    // گارد نشست — بدون لاگین → لاگین
    useEffect(() => {
        if (!isAuthenticated) router.replace('/login');
    }, [isAuthenticated, router]);

    const business = useMemo(() => {
        const items: any[] = ((data as any)?.items ?? []).filter((b: any) => b.canEdit !== false);
        if (items.length === 0) return null;
        return items.find((b) => b.id === wantedId) || items[0];
    }, [data, wantedId]);

    const loaded = !isLoading && isAuthenticated;

    if (!loaded) {
        return (
            <div className="min-h-screen grid place-items-center bg-surface dark:bg-gray-950">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!business) {
        return (
            <div className="min-h-screen grid place-items-center bg-surface dark:bg-gray-950 px-4">
                <div className="text-center">
                    <Building2 className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
                    <p className="text-sm font-bold text-on-surface mb-1">کسب‌وکاری یافت نشد</p>
                    <p className="text-xs text-on-surface-variant mb-4">اول کسب‌وکارت را ثبت کن.</p>
                    <button onClick={() => router.push('/business/register')}
                            className="h-10 px-5 rounded-xl bg-primary text-on-primary text-sm font-bold">
                        ثبت کسب‌وکار
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40">
            <BusinessSetupModal
                isOpen
                business={business}
                onClose={() => router.push('/my-catalogs')}
                onSaved={() => router.push('/my-catalogs')}
            />
        </div>
    );
}
