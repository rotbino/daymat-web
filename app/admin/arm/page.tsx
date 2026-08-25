// app/admin/arm/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setArm } from '@/lib/store/slices/armSlice';
import {
    Plus,
    Edit,
    Eye,
    Search,
    Store,
    Users,
    Package,
    ExternalLink,
    Copy,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

export default function AdminArmsPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [arms, setArms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

    // ⭐ debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isAuthenticated) {
                setPagination(prev => ({ ...prev, page: 1 }));
                fetchArms();
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    const fetchArms = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiService.admin.arms.getAll({
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
                status: statusFilter || undefined,
            });
            setArms(data.items);
            setPagination(data.pagination);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در دریافت لیست بازارها');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, statusFilter]);

    useEffect(() => {
        if (isAuthenticated) fetchArms();
    }, [pagination.page]);

    // ✅ ست کردن بازار به عنوان کارنت
    const handleSetCurrentArm = async (slug: string) => {
        try {
            const arm = await apiService.arm.fetchArmData(slug);
            if (arm) {
                dispatch(setArm({ arm, slug }));
                localStorage.setItem('lastArmSlug', slug);
            }
        } catch (e) {
            console.error('Error setting current arm:', e);
        }
    };

    // ✅ مشاهده — ست کردن کارنت + باز کردن تب جدید
    const handleViewArm = async (slug: string) => {
        await handleSetCurrentArm(slug);
        window.open(`/${slug}`, '_blank');
    };

    // ✅ ویرایش — ست کردن کارنت + رفتن به صفحه ویرایش
    const handleEditArm = async (slug: string, armData?: any) => {
        await handleSetCurrentArm(slug);

        if (armData?.status === 'draft') {
            router.push(`/admin/arm/create?slug=${slug}&step=${armData.config?.wizardStep || 'basics'}`);
        } else {
            router.push(`/admin/arm/${armData?.id}/edit`);
        }
    };

    const handleCopySlug = async (slug: string) => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
            setCopiedSlug(slug);
            toast.success('لینک بازار کپی شد');
            setTimeout(() => setCopiedSlug(null), 2000);
        } catch {
            toast.error('خطا در کپی لینک');
        }
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { className: string; label: string }> = {
            active: { className: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', label: 'فعال' },
            draft: { className: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800', label: 'پیش‌نویس' },
            archived: { className: 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700', label: 'بایگانی' },
        };
        const { className, label } = config[status] || config.archived;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${className}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                {label}
            </span>
        );
    };

    const Skeleton = () => (
        <>
            <div className="hidden md:block overflow-hidden bg-white dark:bg-gray-900 border border-outline-variant/20 dark:border-gray-800 rounded-2xl">
                <div className="animate-pulse p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-2 border-b border-outline-variant/10 dark:border-gray-800 last:border-0">
                            <div className="w-8 h-8 rounded-lg bg-surface-container-high dark:bg-gray-800" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 bg-surface-container-high dark:bg-gray-800 rounded" />
                                <div className="h-3 w-20 bg-surface-container-high dark:bg-gray-800 rounded" />
                            </div>
                            <div className="h-5 w-14 bg-surface-container-high dark:bg-gray-800 rounded-full" />
                            <div className="h-4 w-12 bg-surface-container-high dark:bg-gray-800 rounded" />
                            <div className="h-4 w-12 bg-surface-container-high dark:bg-gray-800 rounded" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="md:hidden grid grid-cols-1 gap-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 border border-outline-variant/20 dark:border-gray-800 rounded-2xl p-4 animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-surface-container-high dark:bg-gray-800" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-24 bg-surface-container-high dark:bg-gray-800 rounded" />
                                <div className="h-3 w-16 bg-surface-container-high dark:bg-gray-800 rounded" />
                            </div>
                            <div className="h-5 w-12 bg-surface-container-high dark:bg-gray-800 rounded-full" />
                        </div>
                        <div className="flex gap-3">
                            <div className="h-3 w-14 bg-surface-container-high dark:bg-gray-800 rounded" />
                            <div className="h-3 w-14 bg-surface-container-high dark:bg-gray-800 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </>
    );

    if (loading && arms.length === 0) return <Skeleton />;

    return (
        <div className="space-y-5">
            {/* نوار ابزار */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50 dark:text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجوی نام یا شناسه..."
                        className="w-full bg-white dark:bg-gray-900 border border-outline-variant/30 dark:border-gray-700 h-10 pr-10 pl-4 text-sm text-right rounded-xl focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-on-surface-variant/40 dark:placeholder:text-gray-600"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white dark:bg-gray-900 border border-outline-variant/30 dark:border-gray-700 h-10 px-3 text-sm text-right rounded-xl appearance-none cursor-pointer focus:ring-1 focus:ring-primary/50 outline-none transition-all text-on-surface-variant dark:text-gray-400"
                >
                    <option value="">همه وضعیت‌ها</option>
                    <option value="active">فعال</option>
                    <option value="draft">پیش‌نویس</option>
                    <option value="archived">بایگانی</option>
                </select>

                <Link
                    href="/admin/arm/create"
                    className="flex items-center justify-center w-10 h-10 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-md flex-shrink-0"
                    title="ایجاد بازار جدید"
                >
                    <Plus className="w-5 h-5" />
                </Link>
            </div>

            {/* حالت خالی */}
            {!loading && arms.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-gray-900 border border-outline-variant/20 dark:border-gray-800 rounded-2xl">
                    <Store className="w-12 h-12 text-on-surface-variant/20 dark:text-gray-700 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-on-surface dark:text-gray-300 mb-1">هیچ بازاری یافت نشد</h3>
                    <p className="text-xs text-on-surface-variant/60 dark:text-gray-500">
                        {search || statusFilter ? 'فیلترها رو تغییر بده' : 'اولین بازار رو بساز'}
                    </p>
                </div>
            )}

            {/* جدول - دسکتاپ */}
            {arms.length > 0 && (
                <>
                    <div className="hidden md:block overflow-hidden bg-white dark:bg-gray-900 border border-outline-variant/20 dark:border-gray-800 rounded-2xl">
                        <table className="w-full border-collapse">
                            <thead>
                            <tr className="border-b border-outline-variant/20 dark:border-gray-800 bg-surface-container-low/50 dark:bg-gray-900/50">
                                <th className="text-right py-3 px-5 text-[11px] font-semibold text-on-surface-variant/70 dark:text-gray-500 uppercase tracking-wider">بازار</th>
                                <th className="text-right py-3 px-5 text-[11px] font-semibold text-on-surface-variant/70 dark:text-gray-500 uppercase tracking-wider">شناسه</th>
                                <th className="text-center py-3 px-5 text-[11px] font-semibold text-on-surface-variant/70 dark:text-gray-500 uppercase tracking-wider">وضعیت</th>
                                <th className="text-center py-3 px-5 text-[11px] font-semibold text-on-surface-variant/70 dark:text-gray-500 uppercase tracking-wider">اعضا</th>
                                <th className="text-center py-3 px-5 text-[11px] font-semibold text-on-surface-variant/70 dark:text-gray-500 uppercase tracking-wider">آگهی‌ها</th>
                                <th className="text-center py-3 px-5 text-[11px] font-semibold text-on-surface-variant/70 dark:text-gray-500 uppercase tracking-wider">تاریخ</th>
                                <th className="text-center py-3 px-5 text-[11px] font-semibold text-on-surface-variant/70 dark:text-gray-500 uppercase tracking-wider">عملیات</th>
                            </tr>
                            </thead>
                            <tbody>
                            {arms.map((arm) => (
                                <tr
                                    key={arm.id}
                                    className="border-b border-outline-variant/10 dark:border-gray-800/50 hover:bg-surface-container-low/30 dark:hover:bg-gray-800/30 transition-colors group"
                                >
                                    <td className="py-3 px-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <Store className="w-4 h-4 text-primary dark:text-primary-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-sm text-on-surface dark:text-gray-100 truncate">
                                                    {arm.name}
                                                </div>
                                                {arm.slogan && (
                                                    <div className="text-[10px] text-on-surface-variant/50 dark:text-gray-500 truncate mt-0.5">
                                                        {arm.slogan}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-3 px-5">
                                        <button
                                            onClick={() => handleCopySlug(arm.slug)}
                                            className="flex items-center gap-1.5 text-xs text-on-surface-variant/60 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400 transition-colors font-mono"
                                        >
                                            {copiedSlug === arm.slug ? (
                                                <Check className="w-3 h-3 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-3 h-3" />
                                            )}
                                            /{arm.slug}
                                        </button>
                                    </td>

                                    <td className="py-3 px-5 text-center">{getStatusBadge(arm.status)}</td>

                                    <td className="py-3 px-5 text-center">
                                        <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant/70 dark:text-gray-400">
                                            <Users className="w-3.5 h-3.5" />
                                            {arm._count?.memberships || 0}
                                        </span>
                                    </td>

                                    <td className="py-3 px-5 text-center">
                                        <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant/70 dark:text-gray-400">
                                            <Package className="w-3.5 h-3.5" />
                                            {arm._count?.ads || 0}
                                        </span>
                                    </td>

                                    <td className="py-3 px-5 text-center text-xs text-on-surface-variant/50 dark:text-gray-500">
                                        {new Date(arm.createdAt).toLocaleDateString('fa-IR')}
                                    </td>

                                    <td className="py-3 px-5">
                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* مشاهده */}
                                            <button
                                                onClick={() => handleViewArm(arm.slug)}
                                                className="p-1.5 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                                                title="مشاهده بازار"
                                            >
                                                <ExternalLink className="w-4 h-4 text-on-surface-variant/50 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400" />
                                            </button>
                                            {/* ویرایش */}
                                            <button
                                                onClick={() => handleEditArm(arm.slug, arm)}
                                                className="p-1.5 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                                                title="ویرایش"
                                            >
                                                <Edit className="w-4 h-4 text-on-surface-variant/50 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* کارت‌ها - موبایل */}
                    <div className="md:hidden grid grid-cols-1 gap-3">
                        {arms.map((arm) => (
                            <div
                                key={arm.id}
                                className="bg-white dark:bg-gray-900 border border-outline-variant/20 dark:border-gray-800 rounded-2xl p-4 active:scale-[0.99] transition-transform"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                                            <Store className="w-5 h-5 text-primary dark:text-primary-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-sm text-on-surface dark:text-gray-100 truncate">
                                                {arm.name}
                                            </h3>
                                            <button
                                                onClick={() => handleCopySlug(arm.slug)}
                                                className="flex items-center gap-1 text-[11px] text-on-surface-variant/60 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400 transition-colors mt-0.5"
                                            >
                                                {copiedSlug === arm.slug ? (
                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                                /{arm.slug}
                                            </button>
                                        </div>
                                    </div>
                                    {getStatusBadge(arm.status)}
                                </div>

                                <div className="flex items-center gap-4 mb-3 text-[11px] text-on-surface-variant/70 dark:text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" />
                                        {arm._count?.memberships || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Package className="w-3.5 h-3.5" />
                                        {arm._count?.ads || 0}
                                    </span>
                                    <span className="text-[10px] text-on-surface-variant/40 dark:text-gray-600">
                                        {new Date(arm.createdAt).toLocaleDateString('fa-IR')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 pt-3 border-t border-outline-variant/10 dark:border-gray-800">
                                    <button
                                        onClick={() => handleViewArm(arm.slug)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        مشاهده
                                    </button>
                                    <button
                                        onClick={() => handleEditArm(arm.slug, arm)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        ویرایش
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* صفحه‌بندی */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-on-surface-variant/60 dark:text-gray-500">
                        {pagination.total} بازار
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            className="px-3 py-1.5 text-xs border border-outline-variant/30 dark:border-gray-700 rounded-lg hover:bg-surface-container-low dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            قبلی
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                            .map((p, idx, arr) => (
                                <React.Fragment key={p}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                                        <span className="text-on-surface-variant/30 dark:text-gray-600">...</span>
                                    )}
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                                        className={cn(
                                            "w-8 h-8 text-xs rounded-lg transition-colors font-medium",
                                            pagination.page === p
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'border border-outline-variant/30 dark:border-gray-700 hover:bg-surface-container-low dark:hover:bg-gray-800'
                                        )}
                                    >
                                        {p}
                                    </button>
                                </React.Fragment>
                            ))}
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.totalPages}
                            className="px-3 py-1.5 text-xs border border-outline-variant/30 dark:border-gray-700 rounded-lg hover:bg-surface-container-low dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            بعدی
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}