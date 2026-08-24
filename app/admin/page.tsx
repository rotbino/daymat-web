// app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    Store, Package, Users, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight,
    Clock, BadgeCheck, UserPlus, AlertCircle, Building2,
} from 'lucide-react';
import Link from 'next/link';
import { apiService } from '@/lib/api/apiService';

export default function AdminDashboard() {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // ✅ دریافت آمار واقعی از بک‌اند
                const data = await apiService.admin.arms.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
                // در صورت خطا، آمار صفر قرار بده
                setStats({
                    totalArms: 0,
                    activeArms: 0,
                    totalUsers: 0,
                    totalAds: 0,
                    totalCredits: 0,
                    pendingAds: 0,
                    pendingMemberships: 0,
                    pendingVerifications: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    <p className="mt-4 text-on-surface-variant">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    const cards = [
        { title: 'بازارها', value: stats?.totalArms || 0, icon: Store, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { title: 'بازارهای فعال', value: stats?.activeArms || 0, icon: Store, color: 'text-green-500', bg: 'bg-green-500/10' },
        { title: 'کاربران', value: stats?.totalUsers || 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { title: 'کسب‌وکارها', value: stats?.totalBusinesses || 0, icon: Building2, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        { title: 'آگهی‌ها', value: stats?.totalAds || 0, icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { title: 'اعتبارات', value: stats?.totalCredits || 0, icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    ];

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">داشبورد مدیریت</h1>
                    <p className="text-sm text-on-surface-variant">خلاصه وضعیت سیستم</p>
                </div>
                <span className="text-xs text-on-surface-variant">
                    {new Date().toLocaleDateString('fa-IR')}
                </span>
            </div>

            {/* ⭐ باکس‌های اطلاع‌رسانی */}
            {(stats?.pendingAds > 0 || stats?.pendingMemberships > 0 || stats?.pendingVerifications > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {stats?.pendingAds > 0 && (
                        <Link
                            href="/admin/ads?status=pending"
                            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all"
                        >
                            <Clock className="w-6 h-6 text-amber-600" />
                            <div>
                                <p className="font-semibold text-amber-800 dark:text-amber-200">
                                    {stats.pendingAds} آگهی در انتظار تأیید
                                </p>
                                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                                    برای بررسی کلیک کنید
                                </p>
                            </div>
                        </Link>
                    )}

                    {stats?.pendingMemberships > 0 && (
                        <Link
                            href="/admin/users?status=pending"
                            className="bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all"
                        >
                            <UserPlus className="w-6 h-6 text-purple-600" />
                            <div>
                                <p className="font-semibold text-purple-800 dark:text-purple-200">
                                    {stats.pendingMemberships} درخواست پیوستن  در انتظار تأیید
                                </p>
                                <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-0.5">
                                    مشاهده اعضای در انتظار
                                </p>
                            </div>
                        </Link>
                    )}

                    {stats?.pendingVerifications > 0 && (
                        <Link
                            href="/admin/businesses?verificationStatus=pending"
                            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all"
                        >
                            <BadgeCheck className="w-6 h-6 text-blue-600" />
                            <div>
                                <p className="font-semibold text-blue-800 dark:text-blue-200">
                                    {stats.pendingVerifications} درخواست تیک اعتماد
                                </p>
                                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                                    بررسی درخواست‌ها
                                </p>
                            </div>
                        </Link>
                    )}
                </div>
            )}

            {/* کارت‌های آماری */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-surface-container-low border border-outline-variant p-4">
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-lg ${card.bg}`}>
                                    <Icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                                <span className="text-2xl font-bold text-on-surface">
                                    {card.value.toLocaleString('fa-IR')}
                                </span>
                            </div>
                            <p className="text-sm text-on-surface-variant mt-2">{card.title}</p>
                        </div>
                    );
                })}
            </div>

            {/* لینک‌های سریع */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-on-surface mb-4">دسترسی سریع</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <a href="/admin/arm/create" className="bg-primary/5 border border-primary/20 p-4 hover:bg-primary/10 transition-colors">
                        <h3 className="font-semibold text-primary">ساخت بازارجدید</h3>
                        <p className="text-sm text-on-surface-variant mt-1">ایجاد یک بازارتخصصی با تنظیمات کامل</p>
                    </a>
                    <a href="/admin/arm" className="bg-surface-container-low border border-outline-variant p-4 hover:bg-surface-container transition-colors">
                        <h3 className="font-semibold text-on-surface">بازارها</h3>
                        <p className="text-sm text-on-surface-variant mt-1">لیست و ویرایش بازارهای موجود</p>
                    </a>
                    <a href="/admin/categories" className="bg-surface-container-low border border-outline-variant p-4 hover:bg-surface-container transition-colors">
                        <h5 className="font-semibold text-sm text-on-surface">مدیریت گروه‌های کالا</h5>
                        <p className="text-sm text-on-surface-variant mt-1">ایجاد و ویرایش دسته‌بندی‌ها</p>
                    </a>
                </div>
            </div>

            {/* آخرین فعالیت‌ها */}
            <div className="mt-8 bg-surface-container-low border border-outline-variant p-4">
                <h2 className="text-lg font-semibold text-on-surface mb-4">آخرین فعالیت‌ها</h2>
                <p className="text-sm text-on-surface-variant">هیچ فعالیتی ثبت نشده است</p>
            </div>
        </div>
    );
}