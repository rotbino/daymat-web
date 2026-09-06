// app/ad/components/JoinMarketButton.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useArms, useMyBusinesses } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import {
    LogIn, Building2, Loader2, UserPlus, Check, Info,
} from 'lucide-react';
import BusinessSetupModal from '@/app/components/BusinessSetupModal';
import { cn } from '@/lib/utils';

interface Props {
    slug: string;
    className?: string;
    label?: string;
}

type State =
    | 'loading'
    | 'guest'
    | 'no-business'
    | 'can-join'
    | 'pending'
    | 'active'
    | 'private'
    | 'removed';

/**
 * دکمهٔ هوشمند «پیوستن به بازار» — کاملاً خودکفا:
 *   - از arms و businesses و config بازارِ خودش، وضعیت را می‌فهمد
 *   - قوانین accessRules بازار را رعایت می‌کند (allowPublicJoin، تایید مدیر، نهاد، تلفن، جغرافیا)
 *   - هر مرحله را به کاربر هدایت می‌کند: ورود → ثبت کسب‌وکار → عضویت دیدن
 *   - MarketContent فقط همین دکمه را رندر می‌کند — هیچ منطق عضویتی بیرون نیست
 */
export function JoinMarketButton({ slug, className, label = 'پیوستن به بازار' }: Props) {
    const router = useRouter();
    const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
    const { data: arms, isLoading: armsLoading } = useArms();
    const { data: bizData, isLoading: bizLoading } = useMyBusinesses();

    const [bizModalOpen, setBizModalOpen] = useState(false);
    const [joining, setJoining] = useState(false);

    const membership = useMemo(
        () => (arms ?? []).find((a: any) => a.slug === slug),
        [arms, slug],
    );

    const armConfig = (membership as any)?.arm?.config as any || {};
    const accessRules = armConfig.accessRules || {};
    const requireApproval = accessRules.requireAdminApprovalForMembership ?? false;
    const allowPublicJoin = accessRules.allowPublicJoin !== false;
    const requireBusiness = accessRules.requireBusinessForMembership ?? false;
    const requirePhone = accessRules.requirePhoneVerification ?? false;
    const restrictByLocation = accessRules.restrictMembershipByLocation ?? false;
    const locationSelections = armConfig.locationSelections || [];

    const hasBusiness = (bizData?.items ?? []).length > 0;
    const firstBiz = (bizData?.items ?? [])[0];

    const state: State = useMemo(() => {
        if (armsLoading || bizLoading) return 'loading';
        if (!isAuthenticated) return 'guest';
        if (!allowPublicJoin) return 'private';
        if (requirePhone && !user?.isPhoneVerified) return 'pending';
        if (requireBusiness && !hasBusiness) return 'no-business';

        if (!membership) return 'can-join';
        if (['active', 'pending', 'paused'].includes(membership.status)) {
            return membership.status === 'pending' ? 'pending' : 'active';
        }
        if (['removed', 'rejected', 'banned'].includes(membership.status)) return 'removed';

        return 'can-join';
    }, [armsLoading, bizLoading, isAuthenticated, allowPublicJoin, requirePhone, user, requireBusiness, hasBusiness, membership]);

    const locationBlocked = useMemo(() => {
        if (state !== 'can-join' || !restrictByLocation) return false;
        const userBiz = firstBiz;
        const userCity = userBiz?.cityCode;
        const userProvince = userBiz?.provinceCode;
        const allowedCity = locationSelections.filter((s: any) => s.isActive).map((s: any) => s.cityCode).filter(Boolean);
        const allowedProvince = locationSelections.filter((s: any) => s.isActive).map((s: any) => s.provinceCode).filter(Boolean);
        const cityOk = userCity && allowedCity.includes(userCity);
        const provinceOk = userProvince && allowedProvince.includes(userProvince);
        return !cityOk && !provinceOk;
    }, [state, restrictByLocation, locationSelections, firstBiz]);

    const handleLogin = () => {
        router.push(`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`);
    };

    const handleJoin = async () => {
        if (locationBlocked) {
            toast.error('این بازار فقط به کسب‌وکارهای محلیِ انتخاب‌شده سرویس می‌دهد — موقعیت کسب‌وکارت را در پروفایل تکمیل کن');
            return;
        }
        setJoining(true);
        try {
            await apiService.arm.join(slug, 'buyer');
            if (requireApproval) {
                toast.success('درخواست عضویت شما ثبت شد — منتظر تایید مدیر بازار');
            } else {
                toast.success('پیوستن با موفقیت انجام شد 🎉');
            }
            window.location.reload();
        } catch (e: any) {
            if (e?.data?.errorCode === 'ALREADY_MEMBER') {
                toast.info('قبلاً عضو این بازار شده‌ای');
            } else if (e?.data?.errorCode === 'BUSINESS_REQUIRED') {
                setBizModalOpen(true);
            } else if (e?.data?.errorCode === 'PHONE_VERIFICATION_REQUIRED') {
                toast.error('ابتدا شماره موبایل خود را تایید کن');
            } else if (e?.data?.errorCode === 'LOCATION_NOT_ALLOWED') {
                toast.error(e?.data?.message || 'محدودیت جغرافیایی');
            } else if (e?.data?.errorCode === 'PUBLIC_JOIN_DISABLED') {
                toast.error('این بازار فقط با دعوت مدیر اعضا می‌پذیرد');
            } else {
                toast.error(e?.data?.message || e?.message || 'خطا در عضویت');
            }
        } finally {
            setJoining(false);
        }
    };

    const handleBizCreated = async (biz: any) => {
        try {
            await apiService.arm.join(slug, 'buyer');
            toast.success(requireApproval
                ? 'درخواست عضویت شما ثبت شد — منتظر تایید مدیر بازار'
                : 'پیوستن با موفقیت انجام شد 🎉');
            setBizModalOpen(false);
            window.location.reload();
        } catch (e: any) {
            toast.error(e?.data?.message || 'خطا در عضویت');
            setBizModalOpen(false);
        }
    };

    const baseCls = cn(
        'inline-flex items-center justify-center gap-1.5 font-extrabold transition-all active:scale-95',
        className,
    );

    // ✅ مودال نهاد — یک‌بار رندر می‌شود؛ باز/بسته با isOpen
    const bizModal = (
        <BusinessSetupModal
            isOpen={bizModalOpen}
            onClose={() => setBizModalOpen(false)}
            onSaved={handleBizCreated}
        />
    );

    switch (state) {
        case 'loading':
            return (
                <button disabled className={cn(baseCls, 'opacity-60')}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                </button>
            );

        case 'guest':
            return (
                <>
                    <button onClick={handleLogin} className={cn(baseCls, 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm')}>
                        <LogIn className="w-4 h-4" />
                        {label}
                    </button>
                    {bizModal}
                </>
            );

        case 'no-business':
            return (
                <>
                    <button onClick={() => setBizModalOpen(true)} className={cn(baseCls, 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm')}>
                        <Building2 className="w-4 h-4" />
                        {label}
                    </button>
                    {bizModal}
                </>
            );

        case 'private':
            return (
                <>
                    <button disabled title="این بازار فقط با دعوتِ مدیرِ بازار اعضا می‌پذیرد"
                            className={cn(baseCls, 'bg-surface-container-high text-on-surface-variant/70 cursor-not-allowed')}>
                        <Info className="w-4 h-4" />
                        {label}
                    </button>
                    {bizModal}
                </>
            );

        case 'pending':
            return (
                <>
                    <button disabled title="درخواست عضویت شما منتظر تایید مدیر است"
                            className={cn(baseCls, 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 cursor-default')}>
                        <Loader2 className="w-4 h-4" />
                        در انتظار تایید
                    </button>
                    {bizModal}
                </>
            );

        case 'active':
            return (
                <>
                    <button disabled title="شما عضو این بازار هستید"
                            className={cn(baseCls, 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 cursor-default')}>
                        <Check className="w-4 h-4" />
                        عضو هستی ✓
                    </button>
                    {bizModal}
                </>
            );

        case 'removed':
            return (
                <>
                    <button onClick={handleJoin} disabled={joining}
                            className={cn(baseCls, 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm')}>
                        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {label}
                    </button>
                    {bizModal}
                </>
            );

        case 'can-join':
        default:
            return (
                <>
                    <button onClick={handleJoin} disabled={joining || locationBlocked}
                            title={locationBlocked ? 'محدودیت جغرافیایی' : undefined}
                            className={cn(baseCls, 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm',
                                locationBlocked && 'opacity-60 cursor-not-allowed')}>
                        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {label}
                    </button>
                    {bizModal}
                </>
            );
    }
}