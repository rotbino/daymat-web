// app/arm-admin/financial/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    CreditCard,
    TrendingUp,
    Wallet,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Calendar,
    Coins
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';

interface FinancialStats {
    totalCredits: number;
    pendingPayments: number;
    totalIncome: number;
    monthlyIncome: number;
    todayIncome: number;
    weekIncome: number;
    lastTransactions: {
        id: string;
        amount: number;
        type: 'purchase' | 'spend';
        user: string;
        date: string;
        status: string;
    }[];
}

export default function FinancialDashboard() {
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!currentSlug) {
                setLoading(false);
                return;
            }

            try {
                const data = await apiService.credit.getArmFinancialStats(currentSlug);

                setStats({
                    totalCredits: data.totalCredits || 0,
                    pendingPayments: data.pendingPayments || 0,
                    totalIncome: data.totalIncome || 0,
                    monthlyIncome: data.monthlyIncome || 0,
                    todayIncome: data.todayIncome || 0,
                    weekIncome: data.weekIncome || 0,
                    lastTransactions: data.lastTransactions || [],
                });
            } catch (error: any) {
                console.error('Error fetching financial stats:', error);
                toast.error(error?.message || 'خطا در دریافت آمار مالی');

                setStats({
                    totalCredits: 0,
                    pendingPayments: 0,
                    totalIncome: 0,
                    monthlyIncome: 0,
                    todayIncome: 0,
                    weekIncome: 0,
                    lastTransactions: [],
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [currentSlug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
        );
    }

    // کارت‌های آماری اصلی
    const statCards = [
        {
            title: 'کل اعتبارات فروخته شده',
            value: stats?.totalCredits || 0,
            icon: Coins,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            suffix: 'اعتبار',
        },
        {
            title: 'فیش‌های در انتظار تایید',
            value: stats?.pendingPayments || 0,
            icon: Clock,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
            suffix: 'فیش',
        },
        {
            title: 'مجموع درآمد',
            value: stats?.totalIncome || 0,
            icon: Wallet,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            suffix: 'تومان',
        },
        {
            title: 'درآمد این ماه',
            value: stats?.monthlyIncome || 0,
            icon: TrendingUp,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            suffix: 'تومان',
        },
    ];

    // ✅ کارت‌های درآمد بازه‌های زمانی - همه به تومان
    const incomeCards = [
        {
            title: 'درآمد امروز',
            value: stats?.todayIncome || 0,
            icon: Calendar,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            suffix: 'تومان',
        },
        {
            title: 'درآمد ۷ روز اخیر',
            value: stats?.weekIncome || 0,
            icon: Calendar,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            suffix: 'تومان',
        },
        {
            title: 'درآمد ۳۰ روز اخیر',
            value: stats?.monthlyIncome || 0,
            icon: Calendar,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            suffix: 'تومان',
        },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-on-surface mb-2">داشبورد مالی</h1>
            <p className="text-sm text-on-surface-variant mb-6">
                {currentArm?.name || currentSlug} | خلاصه وضعیت مالی بازار
            </p>

            {/* کارت‌های آماری اصلی */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg ${card.bg}`}>
                                    <Icon className={`w-5 h-5 ${card.color}`} />
                                </div>
                                <span className="text-2xl font-bold text-on-surface">
                                    {card.value.toLocaleString('fa-IR')}
                                </span>
                            </div>
                            <p className="text-sm text-on-surface-variant mt-2">{card.title}</p>
                            <p className="text-xs text-on-surface-variant/60">{card.suffix}</p>
                        </div>
                    );
                })}
            </div>

            {/* ✅ کارت‌های درآمد بازه‌های زمانی - همه به تومان */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {incomeCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className="bg-gradient-to-br from-white to-surface-container-low border border-outline-variant p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${card.bg}`}>
                                    <Icon className={`w-5 h-5 ${card.color}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-on-surface-variant">{card.title}</p>
                                    <p className="text-2xl font-bold text-on-surface">
                                        {card.value.toLocaleString('fa-IR')}
                                    </p>
                                    <p className="text-[10px] text-on-surface-variant/60">{card.suffix}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* لینک‌های سریع */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Link
                    href="/arm-admin/financial/verify"
                    className="bg-primary/5 border border-primary/20 p-4 rounded-xl hover:bg-primary/10 transition-colors group"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-primary">تایید فیش‌های واریز</h3>
                            <p className="text-sm text-on-surface-variant mt-1">
                                {stats?.pendingPayments || 0} فیش در انتظار بررسی
                            </p>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </Link>

                <Link
                    href="/arm-admin/financial/reports"
                    className="bg-surface-container-low border border-outline-variant p-4 rounded-xl hover:bg-surface-container transition-colors group"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-on-surface">گزارش واریزها و درآمد</h3>
                            <p className="text-sm text-on-surface-variant mt-1">
                                مشاهده گزارشات کامل مالی
                            </p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </Link>
            </div>

            {/* آخرین تراکنش‌ها */}
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl">
                <h2 className="text-lg font-semibold text-on-surface mb-4">آخرین تراکنش‌ها</h2>
                {stats?.lastTransactions && stats.lastTransactions.length > 0 ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {stats.lastTransactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-outline-variant/30 last:border-0">
                                <div className="flex items-center gap-3">
                                    {tx.type === 'purchase' ? (
                                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                                    )}
                                    <div>
                                        <p className="text-sm text-on-surface">{tx.user}</p>
                                        <p className="text-xs text-on-surface-variant">{new Date(tx.date).toLocaleString('fa-IR')}</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <span className={`text-sm font-bold ${tx.type === 'purchase' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type === 'purchase' ? '+' : '-'}{tx.amount.toLocaleString()} اعتبار
                                    </span>
                                    <p className="text-xs text-on-surface-variant">{tx.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-on-surface-variant">هیچ تراکنشی ثبت نشده است</p>
                )}
            </div>
        </div>
    );
}