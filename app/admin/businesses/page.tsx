// app/admin/businesses/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import {
    Building2,
    Search,
    Filter,
    Loader2,
    BadgeCheck,
    Clock,
    XCircle,
    MapPin,
    Tag,
    ChevronDown,
    Users,
    Store,
    AlertCircle,
    Phone,
    Layers,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BUSINESS_TYPES } from '@/lib/api/data-types';

interface BusinessItem {
    id: string;
    name: string;
    shortDescription: string;
    type: string;
    city: string;
    province: string;
    phone: string;
    verificationTier: string;
    verificationStatus: string;
    trustScore: number;
    status: string;
    createdAt: string;
    _count: { ads: number; armMemberships: number };
}

interface Stats {
    totalBusinesses: number;
    pendingVerification: number;
    activeBusinesses: number;
    tierStats: { blue: number; silver: number; gold: number };
}

const typeLabelMap: Record<string, string> = Object.fromEntries(
    BUSINESS_TYPES.map(t => [t.value, t.label])
);

export default function AdminBusinessesPage() {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalBusinesses: 0,
        pendingVerification: 0,
        activeBusinesses: 0,
        tierStats: { blue: 0, silver: 0, gold: 0 },
    });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        type: 'all',
        verificationTier: 'all',
        verificationStatus: 'all',
        page: 1,
        limit: 20,
    });
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
    const [showFilters, setShowFilters] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiService.admin.businesses.getList(filters);
            setBusinesses(data.items);
            setStats(data.stats);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = (val: string) => {
        setFilters(prev => ({ ...prev, search: val, page: 1 }));
    };

    const tierBadge = (tier: string) => {
        if (tier === 'blue') return <BadgeCheck className="w-4 h-4 text-blue-500" />;
        if (tier === 'silver') return <BadgeCheck className="w-4 h-4 text-gray-400" />;
        if (tier === 'gold') return <BadgeCheck className="w-4 h-4 text-yellow-500" />;
        return null;
    };

    const statusIcon = (status: string) => {
        if (status === 'pending') return <Clock className="w-4 h-4 text-yellow-500" />;
        if (status === 'approved') return <BadgeCheck className="w-4 h-4 text-green-500" />;
        if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />;
        return null;
    };

    const statusText = (biz: BusinessItem) => {
        if (biz.verificationStatus === 'none') return 'ندارد';
        if (biz.verificationStatus === 'pending') return 'در انتظار';
        if (biz.verificationStatus === 'approved') return 'تأیید';
        if (biz.verificationStatus === 'rejected') return 'رد شده';
        return '';
    };

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-6">
                {/* باکس‌های آماری */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-outline-variant">
                        <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-2">
                            <Building2 className="w-4 h-4" /> کل کسب‌وکارها
                        </div>
                        <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-outline-variant">
                        <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-2">
                            <Store className="w-4 h-4" /> فعال
                        </div>
                        <div className="text-2xl font-bold">{stats.activeBusinesses}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-outline-variant">
                        <div className="flex items-center gap-2 text-yellow-500 text-xs mb-2">
                            <Clock className="w-4 h-4" /> در انتظار تیک
                        </div>
                        <div className="text-2xl font-bold">{stats.pendingVerification}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-outline-variant">
                        <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-2">
                            <BadgeCheck className="w-4 h-4 text-green-500" /> تیک طلایی
                        </div>
                        <div className="text-2xl font-bold">{stats.tierStats.gold}</div>
                    </div>
                </div>

                {/* جستجو و فیلترها */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                        <input
                            type="text"
                            placeholder="جستجوی کسب‌وکار..."
                            value={filters.search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full h-10 pr-10 pl-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 h-10 px-4 border border-outline-variant rounded-xl text-sm hover:bg-surface-container-low"
                    >
                        <Filter className="w-4 h-4" />
                        فیلترها
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
                        <div>
                            <label className="text-xs mb-1 block">وضعیت</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                                className="w-full h-9 rounded-lg border border-outline-variant bg-surface text-sm px-2"
                            >
                                <option value="all">همه</option>
                                <option value="active">فعال</option>
                                <option value="inactive">غیرفعال</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs mb-1 block">نوع</label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                                className="w-full h-9 rounded-lg border border-outline-variant bg-surface text-sm px-2"
                            >
                                <option value="all">همه</option>
                                {BUSINESS_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs mb-1 block">وضعیت تیک</label>
                            <select
                                value={filters.verificationStatus}
                                onChange={(e) => setFilters({ ...filters, verificationStatus: e.target.value, page: 1 })}
                                className="w-full h-9 rounded-lg border border-outline-variant bg-surface text-sm px-2"
                            >
                                <option value="all">همه</option>
                                <option value="none">بدون درخواست</option>
                                <option value="pending">در انتظار</option>
                                <option value="approved">تأیید شده</option>
                                <option value="rejected">رد شده</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs mb-1 block">سطح تیک</label>
                            <select
                                value={filters.verificationTier}
                                onChange={(e) => setFilters({ ...filters, verificationTier: e.target.value, page: 1 })}
                                className="w-full h-9 rounded-lg border border-outline-variant bg-surface text-sm px-2"
                            >
                                <option value="all">همه</option>
                                <option value="blue">آبی</option>
                                <option value="silver">نقره‌ای</option>
                                <option value="gold">طلایی</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* ========== نمای دسکتاپ (جدول) ========== */}
                <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-outline-variant overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin w-6 h-6" /></div>
                    ) : businesses.length === 0 ? (
                        <div className="text-center py-10 text-on-surface-variant">هیچ کسب‌وکاری یافت نشد</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-surface-container-low">
                                <tr>
                                    <th className="px-4 py-3 text-right">نام</th>
                                    <th className="px-4 py-3 text-right">نوع</th>
                                    <th className="px-4 py-3 text-right">شهر</th>
                                    <th className="px-4 py-3 text-right">وضعیت تیک</th>
                                    <th className="px-4 py-3 text-right">اعتبار</th>
                                    <th className="px-4 py-3 text-right">آگهی</th>
                                    <th className="px-4 py-3 text-right">تاریخ ثبت</th>
                                </tr>
                                </thead>
                                <tbody>
                                {businesses.map((biz) => (
                                    <tr
                                        key={biz.id}
                                        className="border-t border-outline-variant/50 hover:bg-surface-container-low cursor-pointer"
                                        onClick={() => router.push(`/admin/businesses/${biz.id}`)}
                                    >
                                        <td className="px-4 py-3 font-medium">{biz.name}</td>
                                        <td className="px-4 py-3">{typeLabelMap[biz.type] || biz.type}</td>
                                        <td className="px-4 py-3">{biz.city || '---'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {biz.verificationStatus === 'none' ? (
                                                    <span className="text-gray-400">ندارد</span>
                                                ) : (
                                                    <>
                                                        {statusIcon(biz.verificationStatus)}
                                                        {tierBadge(biz.verificationTier)}
                                                        <span>{statusText(biz)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{biz.trustScore}</td>
                                        <td className="px-4 py-3">{biz._count.ads}</td>
                                        <td className="px-4 py-3 text-xs text-on-surface-variant">
                                            {new Date(biz.createdAt).toLocaleDateString('fa-IR')}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ========== نمای موبایل (کارت‌ها) ========== */}
                <div className="md:hidden space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin w-6 h-6" /></div>
                    ) : businesses.length === 0 ? (
                        <div className="text-center py-10 text-on-surface-variant">هیچ کسب‌وکاری یافت نشد</div>
                    ) : (
                        businesses.map((biz) => (
                            <div
                                key={biz.id}
                                onClick={() => router.push(`/admin/businesses/${biz.id}`)}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-outline-variant p-4 active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-on-surface truncate">{biz.name}</h3>
                                        <p className="text-xs text-on-surface-variant mt-0.5">
                                            {typeLabelMap[biz.type] || biz.type} • {biz.city || 'بدون شهر'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 mr-3">
                                        {tierBadge(biz.verificationTier)}
                                        {statusIcon(biz.verificationStatus)}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-3.5 h-3.5" />
                                        {biz.phone || '---'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Building2 className="w-3.5 h-3.5" />
                                        {biz._count.ads} آگهی
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Layers className="w-3.5 h-3.5" />
                                        {biz._count.armMemberships} بازار
                                    </span>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-[11px] text-on-surface-variant">
                                        {new Date(biz.createdAt).toLocaleDateString('fa-IR')}
                                    </span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                                        biz.verificationStatus === 'pending' ? "bg-yellow-100 text-yellow-700" :
                                            biz.verificationStatus === 'approved' ? "bg-green-100 text-green-700" :
                                                biz.verificationStatus === 'rejected' ? "bg-red-100 text-red-700" :
                                                    "bg-gray-100 text-gray-600"
                                    )}>
                                        {statusText(biz)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* صفحه‌بندی */}
                {pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 flex-wrap">
                        {Array.from({ length: pagination.totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setFilters({ ...filters, page: i + 1 })}
                                className={cn(
                                    "w-8 h-8 rounded-lg text-sm",
                                    filters.page === i + 1 ? "bg-primary text-white" : "bg-surface-container-low"
                                )}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}