// app/arm-admin/ads/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    Loader2, Search, Filter, CheckCircle, XCircle, Clock,
    Eye, RefreshCw, ChevronLeft, ChevronRight,
    Package, TrendingUp, MapPin, Calendar, Users,
    AlertTriangle, Check, X, MoreVertical, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import CategoryFilter from '@/app/home/CategoryFilter';

type AdStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'inactive' | 'expired' | 'all';

interface AdItem {
    id: string;
    title: string;
    unitPrice: number;
    minQuantity: number;
    city: string;
    province: string;
    status: string;
    isAnonymous: boolean;
    isBumped: boolean;
    viewCount: number;
    callCount: number;
    createdAt: string;
    expiresAt: string;
    rejectionReason?: string;
    unit: { id: string; title: string; shortCode: string };
    category: { id: string; title: string };
    business: { id: string; name: string; verificationTier: string };
    arm: { id: string; slug: string; name: string };
    createdBy: { id: string; fullName: string; phone: string };
}

export default function ArmAdminAdsPage() {
    const router = useRouter();
    const { currentArm, currentSlug } = useSelector((state: RootState) => state.arm);

    const [ads, setAds] = useState<AdItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // فیلترها
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<AdStatus>('all');
    const [cityFilter, setCityFilter] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const armConfig = currentArm?.config as any || {};
    const armAdminPermission = armConfig.armAdminPermission || {};
    const adsAccess = armAdminPermission.ads || {};
    const categoryTree = currentArm?.categoryTree || [];

    const canApprove = adsAccess.canApprove !== false;
    const canDelete = adsAccess.canDelete !== false;
    const canView = adsAccess.canView !== false;

    useEffect(() => {
        fetchAds();
    }, [pagination.page, statusFilter, search, selectedCategoryId, cityFilter, sortBy, sortOrder]);

    const fetchAds = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: pagination.page,
                limit: pagination.limit,
                armSlug: currentSlug,
                status: statusFilter === 'all' ? undefined : statusFilter,
                search: search || undefined,
                categoryId: selectedCategoryId || undefined,
                city: cityFilter || undefined,
                sortBy,
                sortOrder,
            };
            const response = await apiService.armAdmin.ad.getAds(params);
            setAds(response.items || []);
            setPagination(response.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch (error: any) {
            toast.error(error?.message || 'خطا در دریافت آگهی‌ها');
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategoryId(categoryId || null);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleApprove = async (adId: string) => {
        setIsProcessing(true);
        try {
            await apiService.armAdmin.ad.approveAd(adId);
            toast.success('آگهی با موفقیت تایید شد');
            setShowDetailModal(false);
            fetchAds();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در تایید آگهی');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (adId: string) => {
        if (!rejectionReason || rejectionReason.trim().length === 0) {
            toast.error('لطفاً دلیل رد آگهی را وارد کنید');
            return;
        }

        setIsProcessing(true);
        try {
            await apiService.armAdmin.ad.rejectAd(adId, rejectionReason.trim());
            toast.success('آگهی با موفقیت رد شد');
            setShowRejectModal(false);
            setRejectionReason('');
            setShowDetailModal(false);
            fetchAds();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در رد آگهی');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (adId: string) => {
        if (!confirm('آیا از حذف این آگهی اطمینان دارید؟')) return;
        try {
            await apiService.armAdmin.ad.deleteAd(adId);
            toast.success('آگهی با موفقیت حذف شد');
            fetchAds();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در حذف آگهی');
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { label: string; className: string }> = {
            pending: { label: 'در انتظار تایید', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            active: { label: 'فعال', className: 'bg-green-100 text-green-700 border-green-200' },
            inactive: { label: 'غیرفعال', className: 'bg-gray-100 text-gray-600 border-gray-200' },
            expired: { label: 'منقضی', className: 'bg-red-100 text-red-600 border-red-200' },
            rejected: { label: 'رد شده', className: 'bg-red-100 text-red-700 border-red-200' },
        };
        const info = map[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${info.className}`}>
                {status === 'pending' && <Clock className="w-3 h-3" />}
                {status === 'active' && <CheckCircle className="w-3 h-3" />}
                {status === 'rejected' && <XCircle className="w-3 h-3" />}
                {info.label}
            </span>
        );
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatNum = (n: number) => n?.toLocaleString('fa-IR') || '۰';

    // تابع کمکی برای محاسبه وضعیت نردبان
    const isBumpActive = (ad: AdItem) => {
        if (!ad.isBumped) return false;
        // اگر bumpExpiresAt در پاسخ وجود داشته باشد، می‌توان بررسی کرد
        // اما در اینجا فعلاً فقط بر اساس isBumped نمایش می‌دهیم
        // در نسخه‌های بعدی می‌توان از bumpExpiresAt استفاده کرد
        return ad.isBumped;
    };

    return (
        <div className="space-y-6 pb-20">
            {/* هدر */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-on-surface dark:text-gray-100">مدیریت آگهی‌ها</h1>
                    <p className="text-sm text-on-surface-variant dark:text-gray-400">
                        {pagination.total} آگهی در بازار {currentArm?.name}
                    </p>
                </div>
                <button onClick={fetchAds} className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    بروزرسانی
                </button>
            </div>

            {/* فیلتر دسته‌بندی */}
            <CategoryFilter
                categoryTree={categoryTree}
                selectedCategoryId={selectedCategoryId}
                onSelect={handleCategorySelect}
                isLeaf={false}
                selectedUnit=""
                minQuantity={0}
                onVolumeChange={() => {}}
                onResetFilters={() => setSelectedCategoryId(null)}
            />

            {/* فیلترهای دیگر - بهینه برای موبایل */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/30 dark:border-gray-800 p-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                        <input
                            type="text"
                            placeholder="جستجو..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-9 pr-9 pl-3 bg-surface-container-lowest border border-outline-variant/50 dark:border-gray-700 rounded-lg text-sm text-right focus:ring-1 focus:ring-primary/30 outline-none transition-all text-xs"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as AdStatus)}
                        className="h-9 bg-surface-container-lowest border border-outline-variant/50 dark:border-gray-700 rounded-lg text-xs text-right px-2 appearance-none focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                    >
                        <option value="all">همه وضعیت‌ها</option>
                        <option value="pending">در انتظار تایید</option>
                        <option value="active">فعال</option>
                        <option value="inactive">غیرفعال</option>
                        <option value="expired">منقضی</option>
                        <option value="rejected">رد شده</option>
                    </select>

                    <input
                        type="text"
                        placeholder="شهر..."
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="h-9 bg-surface-container-lowest border border-outline-variant/50 dark:border-gray-700 rounded-lg text-sm text-right px-2 focus:ring-1 focus:ring-primary/30 outline-none transition-all text-xs"
                    />

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-9 bg-surface-container-lowest border border-outline-variant/50 dark:border-gray-700 rounded-lg text-xs text-right px-2 appearance-none focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                    >
                        <option value="createdAt">جدیدترین</option>
                        <option value="unitPrice">قیمت</option>
                        <option value="viewCount">بازدید</option>
                        <option value="callCount">تماس</option>
                        <option value="expiresAt">انقضا</option>
                    </select>
                </div>
            </div>

            {/* لیست آگهی‌ها - نسخه موبایل */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            ) : ads.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/30 dark:border-gray-800">
                    <Package className="w-16 h-16 mx-auto text-on-surface-variant/20 dark:text-gray-700" />
                    <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-4">هیچ آگهی با این فیلترها یافت نشد</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {ads.map((ad) => {
                        const bumpActive = isBumpActive(ad);
                        return (
                            <div
                                key={ad.id}
                                className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/30 dark:border-gray-800 p-4 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col gap-2">
                                    {/* ردیف اول: عنوان و وضعیت */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm text-on-surface dark:text-gray-100 truncate">
                                                    {ad.title || ad.productType || 'بدون عنوان'}
                                                </span>
                                                {bumpActive && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                                                        <TrendingUp className="w-3 h-3" />
                                                        نردبان
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">
                                                    {ad.unit?.shortCode} · {ad.category?.title || 'بدون دسته'}
                                                </span>
                                                <span className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">
                                                    {ad.city || 'نامشخص'}
                                                </span>
                                            </div>
                                        </div>
                                        {getStatusBadge(ad.status)}
                                    </div>

                                    {/* ردیف دوم: فروشنده و قیمت */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-on-surface dark:text-gray-200 font-medium">
                                                {ad.business?.name || 'نامشخص'}
                                            </span>
                                            <span className="text-[9px] text-on-surface-variant/60 dark:text-gray-500">
                                                {ad.createdBy?.fullName || ad.createdBy?.phone}
                                            </span>
                                        </div>
                                        <div className="text-left">
                                            <span className="font-bold text-sm text-primary">{formatNum(ad.unitPrice)}</span>
                                            <span className="text-[9px] text-on-surface-variant/60 mr-1">تومان</span>
                                        </div>
                                    </div>

                                    {/* ردیف سوم: تاریخ ثبت */}
                                    <div className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">
                                        {formatDate(ad.createdAt)}
                                    </div>

                                    {/* اکشن‌ها */}
                                    <div className="flex items-center justify-end gap-1.5 mt-1 pt-2 border-t border-outline-variant/10 dark:border-gray-800">
                                        {ad.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => { setSelectedAd(ad); setShowDetailModal(true); }}
                                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    تایید
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedAd(ad); setShowRejectModal(true); }}
                                                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    رد
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => router.push(`/ad/${ad.id}`)}
                                            className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
                                            title="مشاهده کامل آگهی"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(ad.id)}
                                                className="p-1.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-md transition-colors"
                                                title="حذف"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* پیجینیشن موبایل */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-2 py-3">
                            <span className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">
                                {pagination.page} از {pagination.totalPages}
                            </span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="w-8 h-8 rounded-lg border border-outline-variant/30 dark:border-gray-700 flex items-center justify-center hover:bg-surface-container-low disabled:opacity-40 transition-colors text-xs"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="w-8 h-8 rounded-lg border border-outline-variant/30 dark:border-gray-700 flex items-center justify-center hover:bg-surface-container-low disabled:opacity-40 transition-colors text-xs"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* مودال جزئیات آگهی (فقط برای تایید/رد) */}
            {showDetailModal && selectedAd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-outline-variant/20 dark:border-gray-800 shadow-2xl">
                        <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 py-3 border-b border-outline-variant/20 dark:border-gray-800 flex items-center justify-between">
                            <h3 className="text-base font-bold text-on-surface dark:text-gray-100">جزئیات آگهی</h3>
                            <button onClick={() => { setShowDetailModal(false); setSelectedAd(null); }} className="p-1.5 hover:bg-surface-container-low rounded-xl transition-colors">
                                <X className="w-5 h-5 text-on-surface-variant dark:text-gray-400" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">عنوان</p>
                                    <p className="text-sm font-medium text-on-surface dark:text-gray-200">{selectedAd.title || 'بدون عنوان'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">وضعیت</p>
                                    {getStatusBadge(selectedAd.status)}
                                </div>
                                <div>
                                    <p className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">قیمت</p>
                                    <p className="text-sm font-bold text-primary">{formatNum(selectedAd.unitPrice)} تومان</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">حداقل خرید</p>
                                    <p className="text-sm font-medium">{selectedAd.minQuantity} {selectedAd.unit?.shortCode}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">فروشنده</p>
                                    <p className="text-sm font-medium">{selectedAd.business?.name || 'نامشخص'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">ثبت‌کننده</p>
                                    <p className="text-sm font-medium">{selectedAd.createdBy?.fullName || selectedAd.createdBy?.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">شهر</p>
                                    <p className="text-sm font-medium">{selectedAd.city || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">تاریخ ثبت</p>
                                    <p className="text-sm font-medium">{formatDate(selectedAd.createdAt)}</p>
                                </div>
                            </div>

                            {/* نمایش نردبان در مودال */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">نردبان</p>
                                    <p className="text-sm font-medium">
                                        {selectedAd.isBumped ? (
                                            <span className="flex items-center gap-1 text-red-600">
                                                <TrendingUp className="w-4 h-4" />
                                                فعال
                                            </span>
                                        ) : (
                                            <span className="text-on-surface-variant/60">غیرفعال</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* نمایش دلیل رد (در صورت وجود) */}
                            {selectedAd.rejectionReason && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-[10px] text-red-700 font-medium">دلیل رد</p>
                                    <p className="text-xs text-red-600 mt-1">{selectedAd.rejectionReason}</p>
                                </div>
                            )}

                            {selectedAd.status === 'pending' && (
                                <div className="flex flex-col gap-2 pt-3 border-t border-outline-variant/20 dark:border-gray-800">
                                    <button
                                        onClick={() => handleApprove(selectedAd.id)}
                                        disabled={isProcessing}
                                        className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                                    >
                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin inline ml-2" /> : <Check className="w-4 h-4 inline ml-2" />}
                                        تایید آگهی
                                    </button>
                                    <button
                                        onClick={() => { setShowDetailModal(false); setShowRejectModal(true); }}
                                        className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors"
                                    >
                                        <X className="w-4 h-4 inline ml-2" />
                                        رد آگهی
                                    </button>
                                </div>
                            )}

                            {/* دکمه مشاهده کامل در مودال */}
                            <div className="pt-2 border-t border-outline-variant/20 dark:border-gray-800">
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setSelectedAd(null);
                                        router.push(`/ad/${selectedAd.id}`);
                                    }}
                                    className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <Eye className="w-4 h-4 inline ml-2" />
                                    مشاهده کامل آگهی
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* مودال رد آگهی */}
            {showRejectModal && selectedAd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl border border-outline-variant/20 dark:border-gray-800 shadow-2xl">
                        <div className="px-4 py-3 border-b border-outline-variant/20 dark:border-gray-800 flex items-center justify-between">
                            <h3 className="text-base font-bold text-on-surface dark:text-gray-100">رد آگهی</h3>
                            <button onClick={() => { setShowRejectModal(false); setSelectedAd(null); setRejectionReason(''); }} className="p-1.5 hover:bg-surface-container-low rounded-xl transition-colors">
                                <X className="w-5 h-5 text-on-surface-variant dark:text-gray-400" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <p className="text-sm text-on-surface dark:text-gray-200 font-medium mb-2">
                                    دلیل رد آگهی «{selectedAd.title || selectedAd.productType}»
                                </p>
                                <p className="text-xs text-on-surface-variant/60 dark:text-gray-400 mb-3">
                                    لطفاً دلیل رد را برای فروشنده توضیح دهید تا بتواند آن را اصلاح کند.
                                </p>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                    placeholder="مثال: تصویر کیفیت لازم را ندارد، لطفاً با کیفیت مناسب آپلود کنید..."
                                    className="w-full bg-surface-container-lowest dark:bg-gray-800 border border-outline-variant dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-right resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                                {rejectionReason.trim().length === 0 && (
                                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        وارد کردن دلیل رد الزامی است
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                                    className="flex-1 py-2.5 border border-outline-variant dark:border-gray-700 text-on-surface dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-surface-container-low transition-colors"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={() => handleReject(selectedAd.id)}
                                    disabled={isProcessing || !rejectionReason.trim()}
                                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin inline ml-2" /> : <X className="w-4 h-4 inline ml-2" />}
                                    رد آگهی
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}