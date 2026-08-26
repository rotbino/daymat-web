// app/ad/components/AdCreationGate.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useArms, useActiveBusiness, useCreditBalance } from '@/lib/api/apiHooks';
import { Loader2, Wallet, CreditCard, Package, Layers } from 'lucide-react';

export function AdCreationGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);
    const { data: business, isLoading: businessLoading } = useActiveBusiness();
    const { data: arms, isLoading: armsLoading } = useArms();
    const { data: creditBalance, isLoading: creditLoading } = useCreditBalance();

    const [redirected, setRedirected] = useState(false);

    const isMember = arms?.some((a: any) => a.slug === currentSlug && a.status === 'active');

    // ─── تنظیمات بازار ───
    const armConfig = currentArm?.config as any || {};
    const priceTable = armConfig.modules?.priceTable || {};

    const maxActiveAdsPerUser = priceTable.maxActiveAdsPerUser ?? 5;
    const maxTotalFreeAdPerUser = priceTable.maxTotalFreeAdPerUser ?? 20;
    const extraActiveAdCostPerDay = priceTable.extraActiveAdCost ?? 2;
    const adCreationCost = priceTable.adCreationCost ?? 2;

    // ─── شمارش آگهی‌های کسب‌وکار در این بازار ───
    const { activeAdsCount, totalAdsCount } = useMemo(() => {
        const now = new Date();
        const armAds = (business?.ads || []).filter((ad: any) => ad.armId === currentArm?.id);
        const active = armAds.filter((ad: any) => ad.status === 'active' && new Date(ad.expiresAt) > now).length;
        const total = armAds.filter((ad: any) => ad.status !== 'deleted').length;
        return { activeAdsCount: active, totalAdsCount: total };
    }, [business, currentArm]);

    const hasReachedActiveLimit = activeAdsCount >= maxActiveAdsPerUser;
    const hasReachedTotalLimit = totalAdsCount >= maxTotalFreeAdPerUser;

    // ─── هزینه ثبت آگهی (بدون نردبان، با فرض ۱ روز اعتبار) ───
    const totalCreationCost = useMemo(() => {
        let cost = 0;
        if (hasReachedActiveLimit) {
            cost += extraActiveAdCostPerDay * 1; // حداقل ۱ روز
        }
        if (hasReachedTotalLimit) {
            cost += adCreationCost;
        }
        return cost;
    }, [hasReachedActiveLimit, hasReachedTotalLimit, extraActiveAdCostPerDay, adCreationCost]);

    const needsCredit = totalCreationCost > 0;
    const insufficientCredit = needsCredit && (creditBalance?.balance ?? 0) < totalCreationCost;

    // ─── هدایت‌ها ───
    useEffect(() => {
        if (redirected) return;

        // ۲. اگر کسب‌وکار ندارد → پروفایل
        if (!businessLoading && !business) {
            setRedirected(true);
            router.push('/profile');
            return;
        }

        // ۳. اگر عضو بازار نیست → پروفایل
        if (!armsLoading && !isMember) {
            setRedirected(true);
            router.push('/profile');
            return;
        }
    }, [businessLoading, business, armsLoading, isMember, currentSlug, router, redirected]);

    // ─── در حال بررسی شرایط ───
    if (!isAuthenticated || businessLoading || armsLoading || creditLoading || !business || !isMember) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // ─── اعتبار کافی نیست → کادر خرید اعتبار ───
    if (insufficientCredit) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface px-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/30 shadow-xl p-6 text-center space-y-5">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                        <Wallet className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold text-on-surface dark:text-gray-100">اعتبار کافی نیست</h2>
                        <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-2 leading-relaxed">
                            برای ثبت آگهی خارج از سهمیه حداقل به{' '}
                            <span className="font-bold text-primary">{totalCreationCost.toLocaleString('fa-IR')}</span>{' '}
                            اعتبار نیاز دارید.
                        </p>
                    </div>

                    <div className="bg-surface-container-low dark:bg-gray-800 rounded-xl p-4 space-y-2.5 text-xs text-right">
                        {hasReachedActiveLimit && (
                            <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5 text-amber-500" />
                                    آگهی اضافه روی تابلو:
                                </span>
                                <span className="font-bold text-on-surface">
                                    {extraActiveAdCostPerDay.toLocaleString('fa-IR')} اعتبار/روز
                                </span>
                            </div>
                        )}
                        {hasReachedTotalLimit && (
                            <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                                    آگهی اضافه (بیش از سهمیه کل):
                                </span>
                                <span className="font-bold text-on-surface">
                                    {adCreationCost.toLocaleString('fa-IR')} اعتبار/ماه
                                </span>
                            </div>
                        )}
                        <div className="border-t border-outline-variant/20 pt-2 flex items-center justify-between">
                            <span className="text-on-surface-variant flex items-center gap-1.5">
                                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                                موجودی فعلی:
                            </span>
                            <span className="font-bold text-red-500">
                                {creditBalance?.balance ?? 0} اعتبار
                            </span>
                        </div>
                    </div>

                    <Link href="/credit/purchase" className="block">
                        <button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            خرید اعتبار
                        </button>
                    </Link>
                    <button
                        onClick={() => router.back()}
                        className="text-xs text-on-surface-variant hover:text-on-surface"
                    >
                        بازگشت
                    </button>
                </div>
            </div>
        );
    }

    // ✅ همه شرایط برقرار است
    return <>{children}</>;
}