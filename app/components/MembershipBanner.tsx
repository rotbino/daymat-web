'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { UserPlus, Users, X, PhoneCall } from 'lucide-react';
import { useArms } from '@/lib/api/apiHooks';

export function MembershipBanner() {
    const router = useRouter();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const [isMember, setIsMember] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const { data: arms, refetch: refetchArms } = useArms();

    useEffect(() => {
        if (!isAuthenticated || !currentSlug || !arms) {
            setIsMember(false);
            return;
        }
        const member = arms.some((a: any) => a.slug === currentSlug);
        setIsMember(member);
    }, [isAuthenticated, currentSlug, arms]);

    if (!isAuthenticated || isMember || isDismissed || !currentSlug) {
        return null;
    }

    const handleJoinClick = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=${currentSlug}`);
            return;
        }

        setIsJoining(true);
        try {
            const slug = currentSlug || 'barton';
            await apiService.arm.join(slug);
            toast.success('با موفقیت در بازار عضو شدید');
            await refetchArms();
            setIsMember(true);
            setIsDismissed(true);
        } catch (error: any) {
            if (error?.data?.errorCode === 'ALREADY_MEMBER') {
               // toast.info('شما قبلاً عضو این بازار هستید');
                setIsMember(true);
                setIsDismissed(true);
            } else {
                toast.error(error?.message || 'خطا در عضویت در بازار');
            }
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="fixed top-16 left-0 right-0 z-40 bg-slate-800 border-b border-slate-700/50 shadow-lg shadow-black/10">
            <div className="max-w-7xl mx-auto px-1 sm:px-6">

                {/* ============================================================
                    موبایل: فشرده، متمرکز بر دکمه و متن کوتاه
                    ============================================================ */}
                <div className="sm:hidden py-3">
                    <div className="flex items-center gap-3">
                        {/* آیکون و متن */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 bg-slate-700/40 p-2 rounded-lg">
                            <div className="w-8 h-8  flex items-center justify-center rounded-md flex-shrink-0">
                                <PhoneCall className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed">
                                برای تماس با فروشندگان عضو شوید
                            </p>
                        </div>

                        {/* دکمه‌ها */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={handleJoinClick}
                                disabled={isJoining}
                                className="bg-primary hover:bg-primary/90 text-white px-2 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm shadow-black/20 min-w-[70px] justify-center"
                            >
                                {isJoining ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UserPlus className="w-3.5 h-3.5" />
                                        عضویت
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setIsDismissed(true)}
                                className="text-slate-500 hover:text-slate-300 py-1.5 rounded-md hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ============================================================
                    دسکتاپ: یک ردیف مرتب و حرفه‌ای
                    ============================================================ */}
                <div className="hidden sm:flex items-center justify-between py-3 gap-6">
                    {/* سمت راست (متن) */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-slate-700/50 flex items-center justify-center rounded-lg flex-shrink-0">
                            <Users className="w-5 h-5 text-primary-light text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm  text-slate-100">
                                برای تماس با فروشندگان عضو بازار{' '}
                                <span className="font-bold text-white"> {currentArm?.name || ''}</span>{' '}شوید
                            </p>
                        </div>
                    </div>

                    {/* سمت چپ (اکشن) */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            onClick={handleJoinClick}
                            disabled={isJoining}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.98] shadow-sm shadow-black/20 min-w-[130px] justify-center"
                        >
                            {isJoining ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    {" عضویت در "+currentArm?.name || "بازار"}
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setIsDismissed(true)}
                            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                            title="بستن"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}