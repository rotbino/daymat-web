// app/profile/components/ManagedArmsList.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useArms } from '@/lib/api/apiHooks'; // ✅ اضافه کردن هوک
import { toast } from 'sonner';
import Link from 'next/link';
import {
    Store,
    Users,
    Package,
    TrendingUp,
    Settings,
    ChevronLeft,
    Shield,
    Calendar,
    Eye,
    BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// تایپ‌ها
// ============================================================
interface ManagedArm {
    id: string;
    slug: string;
    name: string;
    slogan: string;
    icon?: string;
    colorPrimary?: string;
    createdAt: string;
    _count?: {
        memberships: number;
        ads: number;
    };
    role: string; // 'system_admin'
}

interface ManagedArmsListProps {
    onRefresh?: () => void;
}

// ============================================================
// کامپوننت اصلی
// ============================================================
export function ManagedArmsList({ onRefresh }: ManagedArmsListProps) {
    const router = useRouter();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    // ✅ استفاده از هوک useArms به جای درخواست مستقیم
    const { data: arms, isLoading, refetch } = useArms();

    // ✅ فیلتر کردن بازارهایی که نقش system_admin دارند (با useMemo)
    const managedArms = useMemo(() => {
        if (!arms || !Array.isArray(arms)) return [];
        return arms.filter((arm: any) => arm.role === 'system_admin') as ManagedArm[];
    }, [arms]);

    // ============================================================
    // ✅ اگر در حال بارگذاری است
    // ============================================================
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-on-surface dark:text-gray-100 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        مدیریت
                    </h2>
                </div>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            </div>
        );
    }

    // ============================================================
    // ✅ اگر کاربر لاگین نیست یا مدیر هیچ بازاری نیست
    // ============================================================
    if (!isAuthenticated || !user || managedArms.length === 0) {
        return null; // اصلاً چیزی نمایش نده
    }

    // ============================================================
    // ✅ رندر اصلی
    // ============================================================
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 sm:p-6 shadow-sm mb-8">
            {/* هدر */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-on-surface dark:text-gray-100">
                        مدیریت بازار
                    </h2>
                    <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 px-2 py-0.5 rounded-full">
                        {managedArms.length}
                    </span>
                </div>
                <span className="text-[10px] text-on-surface-variant dark:text-gray-400">
                    شما مدیر این بازار هستید
                </span>
            </div>

            {/* لیست بازارها */}
            <div className="space-y-3">
                {managedArms.map((arm) => {
                    const membersCount = arm._count?.memberships || 0;
                    const adsCount = arm._count?.ads || 0;
                    const createdDate = new Date(arm.createdAt).toLocaleDateString('fa-IR');

                    return (
                        <div
                            key={arm.id}
                            className="border border-outline-variant/50 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all hover:border-primary/30 dark:hover:border-primary/40 group"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* اطلاعات بازار */}
                                <div className="flex items-start gap-3 min-w-0">
                                    {/* آیکون */}
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{
                                            backgroundColor: arm.colorPrimary ? `${arm.colorPrimary}15` : '#f0f0f0',
                                            color: arm.colorPrimary || '#610000',
                                        }}
                                    >
                                        <span className="material-symbols-outlined text-2xl">
                                            {arm.icon || 'storefront'}
                                        </span>
                                    </div>

                                    {/* نام و اطلاعات */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-sm text-on-surface dark:text-gray-100 truncate">
                                                {arm.name}
                                            </h3>
                                            <span className="text-[9px] bg-primary/5 dark:bg-primary/20 text-primary dark:text-primary-400 px-1.5 py-0.5 rounded-full border border-primary/10 dark:border-primary/30 whitespace-nowrap">
                                                مدیر
                                            </span>
                                        </div>
                                        {arm.slogan && (
                                            <p className="text-xs text-on-surface-variant dark:text-gray-400 truncate">
                                                {arm.slogan}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                            <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant/70 dark:text-gray-400">
                                                <Calendar className="w-3 h-3" />
                                                {createdDate}
                                            </span>
                                            <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant/70 dark:text-gray-400">
                                                <Users className="w-3 h-3" />
                                                {membersCount} عضو
                                            </span>
                                            <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant/70 dark:text-gray-400">
                                                <Package className="w-3 h-3" />
                                                {adsCount} آگهی
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* دکمه‌ها */}
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <Link
                                        href={`/${arm.slug}`}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 border border-outline-variant dark:border-gray-600 hover:border-primary/30 rounded-lg transition-colors"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        مشاهده
                                    </Link>

                                    <Link
                                        href={`/arm-admin`}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                                    >
                                        <Settings className="w-3.5 h-3.5" />
                                        مدیریت
                                    </Link>
                                </div>
                            </div>

                            {/* نوار پیشرفت یا آمار سریع */}
                            <div className="mt-3 pt-3 border-t border-outline-variant/30 dark:border-gray-700">
                                <div className="flex items-center gap-4 text-[10px] text-on-surface-variant dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span>فعال</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-primary" />
                                        <span>{adsCount} آگهی</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        <span>{membersCount} عضو</span>
                                    </div>
                                    <span className="text-[9px] text-on-surface-variant/50 dark:text-gray-500">
                                        شناسه: {arm.slug}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}