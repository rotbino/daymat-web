// app/arm-admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    Users, Package, CreditCard, TrendingUp, Loader2,
    ArrowLeft, Wallet, AlertTriangle, Clock
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

interface DashboardStats {
    totalMembers: number;
    activeMembers: number;
    pendingMembers: number;
    totalAds: number;
    activeAds: number;
    pendingAds: number;
    pendingPayments: number;
    totalCredits: number;
}

export default function ArmAdminDashboard() {
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!currentSlug) { setLoading(false); return; }
            setLoading(true);
            try {
                const armStats = await apiService.armAdmin.getStats(currentSlug);
                const financialStats = await apiService.credit.getArmFinancialStats(currentSlug);

                setStats({
                    totalMembers: armStats.totalMembers || 0,
                    activeMembers: armStats.activeMembers || 0,
                    pendingMembers: armStats.pendingMembers || 0,
                    totalAds: armStats.totalAds || 0,
                    activeAds: armStats.activeAds || 0,
                    pendingAds: armStats.pendingAds || 0,
                    pendingPayments: financialStats.pendingPayments || 0,
                    totalCredits: financialStats.totalCredits || 0,
                });
            } catch (error: any) {
                toast.error(error?.message || 'خطا در دریافت آمار');
                setStats({
                    totalMembers: 0,
                    activeMembers: 0,
                    pendingMembers: 0,
                    totalAds: 0,
                    activeAds: 0,
                    pendingAds: 0,
                    pendingPayments: 0,
                    totalCredits: 0,
                });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [currentSlug]);

    // ⭐ کارت‌های آماری با لینک
    const statCards = [
        {
            title: 'کل اعضا',
            value: stats?.totalMembers || 0,
            icon: Users,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/30',
            href: '/arm-admin/members',
            hoverColor: 'hover:border-blue-300 dark:hover:border-blue-700'
        },
        {
            title: 'اعضای فعال',
            value: stats?.activeMembers || 0,
            icon: Users,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/30',
            href: '/arm-admin/members?status=active',
            hoverColor: 'hover:border-emerald-300 dark:hover:border-emerald-700'
        },
        {
            title: 'کل آگهی‌ها',
            value: stats?.totalAds || 0,
            icon: Package,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-50 dark:bg-orange-900/30',
            href: '/arm-admin/ads',
            hoverColor: 'hover:border-orange-300 dark:hover:border-orange-700'
        },
        {
            title: 'آگهی‌های فعال',
            value: stats?.activeAds || 0,
            icon: Package,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-900/30',
            href: '/arm-admin/ads?status=active',
            hoverColor: 'hover:border-green-300 dark:hover:border-green-700'
        },
        {
            title: 'فیش‌های در انتظار',
            value: stats?.pendingPayments || 0,
            icon: CreditCard,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/30',
            href: '/arm-admin/financial/verify',
            hoverColor: 'hover:border-amber-300 dark:hover:border-amber-700'
        },
        {
            title: 'اعتبارات فروخته شده',
            value: stats?.totalCredits || 0,
            icon: Wallet,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-900/30',
            href: '/arm-admin/financial',
            hoverColor: 'hover:border-purple-300 dark:hover:border-purple-700'
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ✅ باکس هشدار عضویت‌های در انتظار تأیید */}
            {stats && stats.pendingMembers > 0 && (
                <Link
                    href="/arm-admin/members?status=pending"
                    className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded-xl p-4 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-800">
                            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                                {stats.pendingMembers.toLocaleString('fa-IR')} درخواست عضویت در انتظار تأیید
                            </p>
                            <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-0.5">
                                برای بررسی و تأیید یا رد کلیک کنید
                            </p>
                        </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
                </Link>
            )}

            {/* ✅ باکس هشدار فیش‌های در انتظار (فقط اگر تعداد > 0) */}
            {stats && stats.pendingPayments > 0 && (
                <Link
                    href="/arm-admin/financial/verify"
                    className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-800">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                {stats.pendingPayments.toLocaleString('fa-IR')} فیش در انتظار تأیید
                            </p>
                            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                                برای بررسی و تأیید یا رد کلیک کنید
                            </p>
                        </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                </Link>
            )}

            {/* ✅ باکس هشدار آگهی‌های در انتظار تایید (فقط اگر تعداد > 0) */}
            {stats && stats.pendingAds > 0 && (
                <Link
                    href="/arm-admin/ads"
                    className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-xl p-4 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                {stats.pendingAds.toLocaleString('fa-IR')} آگهی در انتظار تایید
                            </p>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                                برای بررسی و تایید یا رد کلیک کنید
                            </p>
                        </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </Link>
            )}

            {/* ⭐ کارت‌های آماری (قابل کلیک) */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    // اگر مقدار صفر است، لینک غیرفعال می‌شود (اما همچنان قابل کلیک است)
                    const isZero = card.value === 0;

                    return (
                        <Link
                            key={index}
                            href={card.href}
                            className={cn(
                                'bg-white dark:bg-gray-900 rounded-xl border border-outline-variant/20 dark:border-gray-800 p-4 shadow-sm transition-all group',
                                !isZero && card.hoverColor,
                                isZero ? 'cursor-default opacity-80' : 'hover:shadow-md hover:border-primary/30 dark:hover:border-primary/40'
                            )}
                            onClick={(e) => {
                                if (isZero) {
                                    e.preventDefault();
                                    toast.info('هیچ داده‌ای برای نمایش وجود ندارد');
                                }
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className={cn("p-2 rounded-lg", card.bg)}>
                                    <Icon className={cn("w-4 h-4", card.color)} />
                                </div>
                                {!isZero && (
                                    <ArrowLeft className="w-3.5 h-3.5 text-on-surface-variant/30 group-hover:text-primary transition-colors" />
                                )}
                            </div>
                            <p className="text-2xl font-bold text-on-surface dark:text-gray-100">
                                {card.value.toLocaleString('fa-IR')}
                            </p>
                            <p className="text-[11px] text-on-surface-variant dark:text-gray-400 mt-1">
                                {card.title}
                            </p>
                        </Link>
                    );
                })}
            </div>

            {/* ⭐ لینک مدیریت فیش‌ها (فقط اگر فیش تایید نشده وجود داشته باشد) */}
            {stats && stats.pendingPayments > 0 && (
                <div className="grid grid-cols-1 gap-3">
                    <Link
                        href="/arm-admin/financial/verify"
                        className="bg-white dark:bg-gray-900 rounded-xl border border-outline-variant/20 dark:border-gray-800 p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-all group shadow-sm hover:shadow-md"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                                    <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-on-surface dark:text-gray-100">مدیریت فیش‌ها</h3>
                                    <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-1">
                                        {stats.pendingPayments} فیش در انتظار بررسی
                                    </p>
                                </div>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-on-surface-variant/30 group-hover:text-primary transition-colors" />
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
}