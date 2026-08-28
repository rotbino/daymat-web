// app/c/[slug]/dashboard/page.tsx
// ✅ صفحه مدیریت کاتالوگ (آمار + امکانات آینده)

'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useBusinessBySlug, useCatalogStats } from '@/lib/api/apiHooks';
import {
    ArrowRight, Eye, Bookmark, Share2, Users, User, Phone,
    Building2, MapPin, Clock, Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const WRAP = 'max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4';

function fmt(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

export default function CatalogDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const { user } = useSelector((state: RootState) => state.auth);

    const { data: business, isLoading: businessLoading } = useBusinessBySlug(slug);
    const { data: stats, isLoading: statsLoading } = useCatalogStats(business?.id || '');

    // ✅ بررسی مالکیت
    const isOwner = business?.owner?.id === user?.id;

    if (businessLoading || statsLoading) {
        return (
            <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
        );
    }

    if (!business) {
        return (
            <div className="min-h-screen grid place-items-center">
                <p>کسب‌وکار یافت نشد</p>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-950 px-4 text-center">
                <div>
                    <p className="text-lg font-bold">شما به این بخش دسترسی ندارید</p>
                    <button onClick={() => router.back()} className="mt-4 text-primary">بازگشت</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            {/* هدر */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200/60 dark:border-gray-800">
                <div className={cn(WRAP, 'flex items-center gap-3 py-3')}>
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-sm font-extrabold">مدیریت کاتالوگ</h1>
                        <p className="text-[10px] text-gray-400">{business.name}</p>
                    </div>
                </div>
            </div>

            <div className={cn(WRAP, 'py-6 space-y-6')}>
                {/* ═══ اطلاعات کسب‌وکار ═══ */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border p-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                            {business.logoUrl ? (
                                <Image src={business.logoUrl} alt={business.name} width={56} height={56} className="object-cover w-full h-full" unoptimized />
                            ) : (
                                <div className="w-full h-full grid place-items-center"><Building2 className="w-6 h-6 text-gray-400" /></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-extrabold">{business.name}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {[business.city, business.type].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                        <button
                            onClick={() => router.push(`/c/${slug}`)}
                            className="shrink-0 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            مشاهده کاتالوگ
                        </button>
                    </div>
                </div>

                {/* ═══ آمار کلی ═══ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border p-4 text-center">
                        <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-extrabold">{fmt(stats?.views || 0)}</p>
                        <p className="text-[11px] text-gray-400 mt-1">بازدید</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border p-4 text-center">
                        <Bookmark className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                        <p className="text-2xl font-extrabold">{fmt(stats?.saves || 0)}</p>
                        <p className="text-[11px] text-gray-400 mt-1">ذخیره</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border p-4 text-center">
                        <Share2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <p className="text-2xl font-extrabold">{fmt(stats?.shares || 0)}</p>
                        <p className="text-[11px] text-gray-400 mt-1">اشتراک‌گذاری</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border p-4 text-center">
                        <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-extrabold">
                            {fmt((stats?.savedBy?.length || 0) + (stats?.viewedBy?.length || 0))}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">افراد</p>
                    </div>
                </div>

                {/* ═══ چه کسانی ذخیره کرده‌اند ═══ */}
                <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-amber-500" />
                        چه کسانی ذخیره کرده‌اند
                        <span className="text-xs text-gray-400">({fmt(stats?.savedBy?.length || 0)})</span>
                    </h3>

                    {!stats?.savedBy?.length ? (
                        <p className="text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-xl border p-4 text-center">
                            هنوز کسی ذخیره نکرده است
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {stats.savedBy.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border p-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 grid place-items-center shrink-0 overflow-hidden">
                                        {item.user?.avatarUrl ? (
                                            <Image src={item.user.avatarUrl} alt="" width={40} height={40} className="object-cover w-full h-full" unoptimized />
                                        ) : (
                                            <User className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{item.user?.fullName || 'کاربر'}</p>
                                        {item.user?.phone && (
                                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                <Phone className="w-3 h-3" />
                                                <span dir="ltr">{item.user.phone}</span>
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                        {new Date(item.savedAt).toLocaleDateString('fa-IR')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ═══ چه کسانی بازدید کرده‌اند ═══ */}
                <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        بازدیدهای اخیر
                        <span className="text-xs text-gray-400">({fmt(stats?.viewedBy?.length || 0)})</span>
                    </h3>

                    {!stats?.viewedBy?.length ? (
                        <p className="text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-xl border p-4 text-center">
                            هنوز بازدیدی ثبت نشده است
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {stats.viewedBy.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border p-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 grid place-items-center shrink-0 overflow-hidden">
                                        {item.user?.avatarUrl ? (
                                            <Image src={item.user.avatarUrl} alt="" width={40} height={40} className="object-cover w-full h-full" unoptimized />
                                        ) : (
                                            <User className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{item.user?.fullName || 'کاربر مهمان'}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {item.user ? 'کاربر عضو' : 'کاربر مهمان'}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                        {new Date(item.viewedAt).toLocaleDateString('fa-IR')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ═══ اطلاعات بیشتر ═══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border p-4">
                        <h3 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" /> موقعیت
                        </h3>
                        <p className="text-sm">{business.city || '—'}</p>
                        {business.address && <p className="text-xs text-gray-400 mt-1">{business.address}</p>}
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border p-4">
                        <h3 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-primary" /> عضویت
                        </h3>
                        <p className="text-sm">
                            {business.createdAt
                                ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(new Date(business.createdAt))
                                : '—'}
                        </p>
                    </div>
                </div>

                {/* ═══ جایگاه‌های آینده ═══ */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed p-4 text-center">
                    <p className="text-xs text-gray-400">
                        امکانات بیشتری به زودی اضافه می‌شود
                    </p>
                </div>
            </div>
        </div>
    );
}