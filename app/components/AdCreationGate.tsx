// app/ad/components/AdCreationGate.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useArms, useActiveBusiness } from '@/lib/api/apiHooks';
import { Loader2 } from 'lucide-react';

export function AdCreationGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);
    const { currentSlug } = useSelector((s: RootState) => s.arm);
    const { data: business, isLoading: businessLoading } = useActiveBusiness();
    const { data: arms, isLoading: armsLoading } = useArms();

    const [redirected, setRedirected] = useState(false);

    const isMember = arms?.some((a: any) => a.slug === currentSlug && a.status === 'active');

    useEffect(() => {
        if (redirected) return;

      /*  // ۱. اگر کاربر وارد نشده → ورود با بازگشت به همین صفحه
        if (!isAuthenticated) {
            setRedirected(true);
            router.push(`/login?redirect=/ad/create?arm=${currentSlug}`);
            return;
        }*/

        // ۲. اگر کسب‌وکار ندارد → ثبت کسب‌وکار
        if (!businessLoading && !business) {
            setRedirected(true);
           // router.push('/business/register');
            router.push('/profile');
            return;
        }

        // ۳. اگر عضو بازار نیست → پروفایل (با push)
        if (!armsLoading && !isMember) {
            setRedirected(true);
            router.push('/profile');
            return;
        }
    }, [isAuthenticated, businessLoading, business, armsLoading, isMember, currentSlug, router, redirected]);

    // در حال بررسی شرایط
    if (!isAuthenticated || businessLoading || armsLoading || !business || !isMember) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // همه شرایط برقرار است
    return <>{children}</>;
}