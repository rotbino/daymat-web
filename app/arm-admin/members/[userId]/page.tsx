// app/arm-admin/members/[userId]/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    User,
    Building2,
    Package,
    CreditCard,
    AlertCircle,
    ArrowRight,
    Loader2,
    Crown,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Filter,
    RefreshCw,
    Inbox,
    Calendar as CalendarIcon,
    X,
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import DateObject from 'react-date-object';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';
import { BusinessCard } from './components/BusinessCard';
import { AdCard } from './components/AdCard';
import { AdDetailModal } from './components/AdDetailModal';
import { TransactionCard } from './components/TransactionCard';

type TabType = 'info' | 'business' | 'ads' | 'payments';
type TransactionStatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'success' | 'failed';

const QUICK_RANGES = [
    { label: 'امروز', days: 0 },
    { label: '۷ روز گذشته', days: 7 },
    { label: '۳۰ روز گذشته', days: 30 },
];

export default function MemberDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;
    const { currentSlug } = useSelector((state: RootState) => state.arm);

    const [member, setMember] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('info');
    const [selectedAd, setSelectedAd] = useState<any>(null);
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // فیلترهای تراکنش
    const [transactionFilter, setTransactionFilter] = useState<TransactionStatusFilter>('all');
    const [transactionSearch, setTransactionSearch] = useState('');
    const [startDate, setStartDate] = useState<DateObject | null>(null);
    const [endDate, setEndDate] = useState<DateObject | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // اسکرول تب‌ها
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // ⭐ stateهای تأیید/رد
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [removing, setRemoving] = useState(false);

    const [confirmAction, setConfirmAction] = useState<'remove' | 'reject' | null>(null);
    // واکشی اطلاعات عضو
    const fetchMember = async (showLoading = true) => {
        if (!currentSlug || !userId) { setLoading(false); return; }
        if (showLoading) setLoading(true); else setRefreshing(true);
        try {
            const data = await apiService.armAdmin.members.getOne(currentSlug, userId);
            setMember({ ...data, allTransactions: data?.allTransactions || [] });
            setError(null);
        } catch (error: any) {
            console.error('Error fetching member:', error);
            const msg = error?.message || 'خطا در دریافت اطلاعات عضو';
            setError(msg);
            toast.error(msg);
            if (error?.response?.status === 404) router.push('/arm-admin/members');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchMember(); }, [currentSlug, userId]);

    // ⭐ توابع تأیید/رد
    const handleApprove = async () => {
        setApproving(true);
        try {
            await apiService.armAdmin.members.approveMember(currentSlug as string, userId);
            toast.success('تایید پیوند با موفقیت انجام شد');
            fetchMember(false);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در تأیید پیوند');
        } finally {
            setApproving(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('اصلاح مورد نظر را وارد کنید');
            return;
        }
        setRejecting(true);
        try {
            await apiService.armAdmin.members.rejectMember(currentSlug as string, userId, rejectReason.trim());
            toast.success('درخواست اصلاح ارسال شد');
            setShowRejectInput(false);
            setRejectReason('');
            fetchMember(false);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ارسال');
        } finally {
            setRejecting(false);
        }
    };
    //حذف پیوستن به بازار
    const handleRemoveMember = async () => {
        if (!currentSlug || !userId) return;
        if (!confirm('آیا از حذف این عضو اطمینان دارید؟')) return;
        setRemoving(true);
        try {
            await apiService.armAdmin.members.removeMember(currentSlug, userId);
            toast.success('پیوند کاربر با بازار قطع شد');
            fetchMember(false);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در قطع پیوند');
        } finally {
            setRemoving(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: any; count?: number }[] = [
        { id: 'info', label: 'اطلاعات پایه', icon: User },
        { id: 'business', label: 'کسب‌وکار', icon: Building2, count: member?.business ? 1 : 0 },
        { id: 'ads', label: 'آگهی‌ها', icon: Package, count: member?.business?.ads?.length || 0 },
        { id: 'payments', label: 'تراکنش‌ها', icon: CreditCard, count: member?.allTransactions?.length || 0 },
    ];

    const checkScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const timer = setTimeout(() => checkScroll(), 100);
        container.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('resize', checkScroll);
        return () => {
            clearTimeout(timer);
            container.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [member]);

    useEffect(() => {
        const activeTabElement = document.getElementById(`tab-btn-${activeTab}`);
        if (activeTabElement) {
            activeTabElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, [activeTab]);

    const handleQuickRange = (days: number) => {
        const now = new DateObject({ calendar: persian, locale: persian_fa });
        const start = now.clone().subtract(days, 'days');
        const end = now.clone();
        setStartDate(start);
        setEndDate(end);
        setShowDatePicker(false);
    };

    const handleClearDateFilter = () => {
        setStartDate(null);
        setEndDate(null);
    };

    const filteredTransactions = useMemo(() => {
        const transactions = member?.allTransactions || [];
        if (!transactions.length) return [];
        let result = transactions;

        if (startDate && endDate) {
            const startTimestamp = startDate.valueOf();
            const endTimestamp = endDate.valueOf() + (24 * 60 * 60 * 1000) - 1;
            result = result.filter((tx: any) => {
                const txTime = new Date(tx.createdAt).getTime();
                return txTime >= startTimestamp && txTime <= endTimestamp;
            });
        }

        if (transactionFilter !== 'all') {
            result = result.filter((tx: any) => {
                const status = tx.status || tx.statusLabel;
                if (transactionFilter === 'pending') return status === 'pending' || status === 'در انتظار';
                if (transactionFilter === 'approved') return status === 'approved' || status === 'تأیید شده';
                if (transactionFilter === 'rejected') return status === 'rejected' || status === 'نیاز به اصلاح';
                if (transactionFilter === 'success') return status === 'success' || status === 'موفق';
                if (transactionFilter === 'failed') return status === 'failed' || status === 'ناموفق';
                return true;
            });
        }

        if (transactionSearch.trim()) {
            const query = transactionSearch.trim().toLowerCase();
            result = result.filter((tx: any) =>
                (tx.description || '').toLowerCase().includes(query) ||
                (tx.transactionType || '').toLowerCase().includes(query) ||
                (tx.id || '').toLowerCase().includes(query)
            );
        }

        return result;
    }, [member?.allTransactions, transactionFilter, transactionSearch, startDate, endDate]);

    const transactionStats = useMemo(() => {
        const transactions = member?.allTransactions || [];
        const total = transactions.length;
        const pending = transactions.filter((tx: any) => tx.status === 'pending' || tx.statusLabel === 'در انتظار').length;
        const approved = transactions.filter((tx: any) => tx.status === 'approved' || tx.statusLabel === 'تأیید شده').length;
        const rejected = transactions.filter((tx: any) => tx.status === 'rejected' || tx.statusLabel === 'رد شده').length;
        const success = transactions.filter((tx: any) => tx.status === 'success' || tx.statusLabel === 'موفق').length;
        const failed = transactions.filter((tx: any) => tx.status === 'failed' || tx.statusLabel === 'ناموفق').length;
        return { total, pending, approved, rejected, success, failed };
    }, [member?.allTransactions]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-500/10 text-green-600 border-green-200',
            pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
            paused: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
            banned: 'bg-red-500/10 text-red-600 border-red-200',
            removed: 'bg-gray-500/10 text-gray-600 border-gray-200',   // ✅ جدید
        };

        const labels: Record<string, string> = {
            active: 'فعال',
            pending: 'در انتظار',
            paused: 'تعلیق',
            banned: 'مسدود',
            removed: 'حذف شده',   // ✅ جدید
        };

        const icons: Record<string, any> = {
            active: CheckCircle,
            pending: Clock,
            paused: Clock,
            banned: XCircle,
            removed: XCircle,   // ✅ جدید
        };

        const Icon = icons[status] || AlertCircle;

        return (
            <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border",
                styles[status] || styles.active
            )}>
            <Icon className="w-3 h-3" />
                {labels[status] || status}
        </span>
        );
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            admin: 'bg-purple-500/10 text-purple-600 border-purple-200',
            seller: 'bg-blue-500/10 text-blue-600 border-blue-200',
            buyer: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
            viewer: 'bg-gray-500/10 text-gray-600 border-gray-200',
        };
        const labels: Record<string, string> = { admin: 'مدیر', seller: 'فروشنده', buyer: 'خریدار', viewer: 'بازدیدکننده' };
        return (
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border", styles[role] || styles.viewer)}>
                {role === 'system_admin' && <Crown className="w-3 h-3" />}{labels[role] || role}
            </span>
        );
    };

    const getDateRangeDisplay = () => {
        if (startDate && endDate) {
            if (startDate.valueOf() === endDate.valueOf()) {
                return startDate.format('dddd DD MMMM');
            }
            return `${startDate.format('YYYY/MM/DD')} تا ${endDate.format('YYYY/MM/DD')}`;
        }
        return 'انتخاب بازه';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-sm text-on-surface-variant">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    if (error && !member) {
        return (
            <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-error" />
                </div>
                <h3 className="text-lg font-semibold text-on-surface mb-2">خطا در بارگذاری</h3>
                <p className="text-sm text-on-surface-variant mb-6">{error}</p>
                <button onClick={() => fetchMember(true)} className="px-6 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />تلاش مجدد
                </button>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-on-surface-variant" />
                </div>
                <h3 className="text-lg font-semibold text-on-surface mb-2">عضو یافت نشد</h3>
                <button onClick={() => router.push(`/arm-admin/members`)} className="mt-4 px-6 py-2.5 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors">
                    بازگشت به لیست اعضا
                </button>
            </div>
        );
    }

    return (
        <div className="pb-8">


            {/* هدر */}
            <div className="mb-6 bg-surface-container-lowest dark:bg-gray-900 p-4 rounded-xl border border-outline-variant/30 dark:border-gray-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* اطلاعات کاربر + دکمه بازگشت + رفرش */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                            onClick={() => router.push(`/arm-admin/members`)}
                            className="p-2 hover:bg-surface-container-high dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                        >
                            <ArrowRight className="w-5 h-5 text-on-surface-variant dark:text-gray-400" />
                        </button>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-bold text-on-surface dark:text-gray-100 truncate">
                                    {member.user.fullName || 'کاربر ناشناس'}
                                </h1>
                                {getRoleBadge(member.role)}
                                {getStatusBadge(member.status)}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-sm text-on-surface-variant dark:text-gray-400" dir="ltr">
                                    {member.user.phone}
                                </p>
                                {member.business && (
                                    <span className="text-xs bg-surface-container-high dark:bg-gray-800 px-2 py-0.5 rounded-full text-on-surface-variant dark:text-gray-400 truncate max-w-[150px]">
              {member.business.name}
            </span>
                                )}
                            </div>
                        </div>

                        {/* رفرش فقط آیکون، بدون مزاحمت در موبایل */}
                        <button
                            onClick={() => fetchMember(false)}
                            disabled={refreshing}
                            className="p-2 hover:bg-surface-container-high md:pt-4 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                            title="بروزرسانی"
                        >
                            <RefreshCw
                                className={cn(
                                    'w-5 h-5 text-on-surface-variant dark:text-gray-400',
                                    refreshing && 'animate-spin'
                                )}
                            />
                        </button>
                    </div>

                    {/* دکمه‌های اقدام — در موبایل زیر اطلاعات کاربر */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto sm:ml-auto shrink-0">
                        {member.status === 'pending' ? (
                            <>
                                {/* تایید */}
                                <button
                                    onClick={handleApprove}
                                    disabled={approving}
                                    className="flex flex-1   min-w-[110px] items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    <span className="text-[9px]">تایید پیوند</span>
                                </button>

                                {/* نیاز به اصلاح */}
                                <button
                                    onClick={() => setShowRejectInput(!showRejectInput)}
                                    disabled={rejecting}
                                    className="flex flex-1 min-w-[110px] items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
                                >
                                    {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                                    <span className="text-[9px]">نیاز به اصلاح</span>
                                </button>

                                {/* رد پیوند */}
                                <button
                                    onClick={() => setConfirmAction('remove')}
                                    disabled={removing}
                                    className="flex flex-1  min-w-[90px] items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    <span className="text-[9px]">رد پیوند</span>
                                </button>
                            </>
                        ) : (
                            <>
                                {/* حذف پیوند برای سایر وضعیت‌ها */}
                                <button
                                    onClick={() => setConfirmAction('remove')}
                                    disabled={removing}
                                    className="flex flex-1  min-w-[90px] items-center justify-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    <span className="text-[9px]">حذف پیوند</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* فیلد دلیل رد / نیاز به اصلاح */}
                {member.status === 'pending' && showRejectInput && (
                    <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex flex-col sm:flex-row gap-2">
                           <textarea
                               value={rejectReason}
                               rows={3}
                               onChange={(e) => setRejectReason(e.target.value)}
                               placeholder="اصلاح مورد نظر را وارد کنید."
                               className="flex-1 min-h-16 p-2 bg-white dark:bg-gray-800 border border-outline dark:border-gray-700 rounded-lg h-10 px-3 text-sm text-on-surface dark:text-gray-200 placeholder:text-on-surface-variant/50 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-700 focus:border-red-400 dark:focus:border-red-600 outline-none"
                        />
                        <button
                            onClick={handleReject}
                            disabled={rejecting || !rejectReason.trim()}
                            className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors"
                        >
                            {rejecting ? 'در حال ارسال...' : 'ارسال به کاربر'}
                        </button>
                        <button
                            onClick={() => {
                                setShowRejectInput(false);
                                setRejectReason('');
                            }}
                            className="px-4 py-2 border border-outline dark:border-gray-700 text-on-surface dark:text-gray-200 rounded-lg text-sm hover:bg-surface-container-low dark:hover:bg-gray-700 transition-colors"
                        >
                            انصراف
                        </button>
                    </div>
                )}
            </div>



            {/* تب‌ها */}
            <div className="relative mb-0 bg-surface-container-lowest rounded-t-xl border border-b-0 border-outline-variant/30">
                <div ref={scrollContainerRef}
                     className="no-scrollbar"
                     style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ display: 'flex', gap: '4px', width: 'max-content', paddingLeft: '8px', paddingTop: '8px', height: '100%', alignItems: 'flex-end' }}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id}
                                        id={`tab-btn-${tab.id}`}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0",
                                            isActive
                                                ? "text-primary bg-surface border-b-[3px] border-primary rounded-t-lg z-10"
                                                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low border-b-[3px] border-transparent rounded-t-lg"
                                        )}>
                                    <Icon className="w-4 h-4" /><span>{tab.label}</span>
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className={cn("text-[10px] min-w-[20px] text-center px-1.5 py-0.5 rounded-full transition-colors", isActive ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant")}>
                                            {tab.count.toLocaleString('fa-IR')}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div style={{ height: '52px' }}></div>
                {canScrollRight && (
                    <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-l from-surface-container-lowest to-transparent pointer-events-none z-[5]" />
                )}
                {canScrollLeft && (
                    <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-r from-surface-container-lowest to-transparent pointer-events-none z-[5]" />
                )}
            </div>

            {/* محتوای تب‌ها */}
            <div className="bg-surface-container-lowest border border-t-0 border-outline-variant/30 rounded-b-xl p-4 sm:p-6 shadow-sm">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-surface p-4 rounded-xl border border-outline-variant/20">
                            <p className="text-xs text-on-surface-variant mb-1.5">شماره موبایل</p>
                            <p className="text-sm font-semibold text-on-surface tracking-wide" dir="ltr">{member.user.phone}</p>
                        </div>
                        <div className="bg-surface p-4 rounded-xl border border-outline-variant/20">
                            <p className="text-xs text-on-surface-variant mb-1.5">وضعیت تایید موبایل</p>
                            <p className="text-sm font-medium">
                                {member.user.isPhoneVerified ? (
                                    <span className="text-green-600 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" />تایید شده</span>
                                ) : (
                                    <span className="text-yellow-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />تایید نشده</span>
                                )}
                            </p>
                        </div>
                        <div className="bg-surface p-4 rounded-xl border border-outline-variant/20">
                            <p className="text-xs text-on-surface-variant mb-1.5">تاریخ پیوستن</p>
                            <p className="text-sm font-semibold text-on-surface">
                                {new Date(member.joinedAt).toLocaleDateString('fa-IR')}
                            </p>
                        </div>
                        <div className="bg-surface p-4 rounded-xl border border-outline-variant/20">
                            <p className="text-xs text-on-surface-variant mb-1.5">وضعیت حساب کاربری</p>
                            <div className="mt-1">{getStatusBadge(member.status)}</div>
                        </div>
                    </div>
                )}

                {activeTab === 'business' && (
                    <div>
                        {member.business ? (
                            <BusinessCard
                                businesses={[member.business]}
                                isPending={member.status === 'pending'}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                approving={approving}
                                rejecting={rejecting}
                            />
                        ) : (
                            <div className="text-center py-16 bg-surface border-2 border-dashed border-outline-variant/50 rounded-xl">
                                <Building2 className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
                                <p className="text-sm font-medium text-on-surface-variant">این کاربر هنوز کسب‌وکاری ثبت نکرده است</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ads' && (
                    <div>
                        {member.business?.ads && member.business.ads.length > 0 ? (
                            <div className="space-y-3">
                                {member.business.ads.map((ad: any) => (
                                    <AdCard key={ad.id} ad={ad} onView={() => { setSelectedAd(ad); setIsAdModalOpen(true); }} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-surface border-2 border-dashed border-outline-variant/50 rounded-xl">
                                <Package className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
                                <p className="text-sm font-medium text-on-surface-variant">این کاربر هیچ آگهی ثبت نکرده است</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="space-y-5">
                        {/* آمار تراکنش‌ها */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-primary">{transactionStats.total}</p>
                                <p className="text-[11px] text-on-surface-variant mt-1">کل</p>
                            </div>
                            <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{transactionStats.pending}</p>
                                <p className="text-[11px] text-on-surface-variant mt-1">در انتظار</p>
                            </div>
                            <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-green-600">{transactionStats.approved + transactionStats.success}</p>
                                <p className="text-[11px] text-on-surface-variant mt-1">موفق</p>
                            </div>
                            <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 text-center col-span-2 sm:col-span-1">
                                <p className="text-xl sm:text-2xl font-bold text-red-600">{transactionStats.rejected + transactionStats.failed}</p>
                                <p className="text-[11px] text-on-surface-variant mt-1">ناموفق</p>
                            </div>
                        </div>

                        {/* فیلترها */}
                        <div className="bg-surface p-4 sm:p-5 rounded-xl border border-outline-variant/20 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                                    <input
                                        type="text"
                                        value={transactionSearch}
                                        onChange={(e) => setTransactionSearch(e.target.value)}
                                        placeholder="جستجو در تراکنش‌ها..."
                                        className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 pr-10 pl-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowDatePicker(!showDatePicker)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-medium transition-all border flex-shrink-0",
                                        startDate ? "bg-primary/5 border-primary/30 text-primary" : "bg-surface-container-lowest border-outline text-on-surface-variant hover:border-primary/50"
                                    )}
                                >
                                    <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate max-w-[120px] sm:max-w-[180px]">{getDateRangeDisplay()}</span>
                                    {startDate && (
                                        <X className="w-4 h-4 flex-shrink-0 opacity-60" onClick={(e) => { e.stopPropagation(); handleClearDateFilter(); }} />
                                    )}
                                </button>
                                {(transactionFilter !== 'all' || transactionSearch || startDate) && (
                                    <button
                                        onClick={() => {
                                            setTransactionFilter('all');
                                            setTransactionSearch('');
                                            handleClearDateFilter();
                                        }}
                                        className="text-xs text-error hover:underline flex items-center gap-1 whitespace-nowrap h-10 px-2"
                                    >
                                        <X className="w-3 h-3" />پاک کردن همه
                                    </button>
                                )}
                            </div>

                            {showDatePicker && (
                                <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-on-surface-variant block mb-1.5 font-medium">از تاریخ</label>
                                            <DatePicker
                                                value={startDate}
                                                onChange={(date) => setStartDate(date as DateObject)}
                                                calendar={persian}
                                                locale={persian_fa}
                                                calendarPosition="bottom-right"
                                                format="YYYY/MM/DD"
                                                placeholder="شروع"
                                                maxDate={endDate || undefined}
                                                inputClass="w-full bg-surface border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                containerClassName="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-on-surface-variant block mb-1.5 font-medium">تا تاریخ</label>
                                            <DatePicker
                                                value={endDate}
                                                onChange={(date) => setEndDate(date as DateObject)}
                                                calendar={persian}
                                                locale={persian_fa}
                                                calendarPosition="bottom-right"
                                                format="YYYY/MM/DD"
                                                placeholder="پایان"
                                                minDate={startDate || undefined}
                                                inputClass="w-full bg-surface border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                containerClassName="w-full"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDatePicker(false)}
                                        className="w-full py-2 text-sm text-on-surface-variant hover:text-on-surface border-t border-outline-variant/30 pt-3 transition-colors"
                                    >
                                        بستن تقویم
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'all', label: 'همه', activeClass: 'bg-primary text-on-primary border-primary' },
                                    { id: 'pending', label: 'در انتظار', activeClass: 'bg-yellow-500 text-white border-yellow-500' },
                                    { id: 'approved', label: 'تایید شده', activeClass: 'bg-green-500 text-white border-green-500' },
                                    { id: 'rejected', label: 'رد شده', activeClass: 'bg-red-500 text-white border-red-500' },
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setTransactionFilter(f.id as TransactionStatusFilter)}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200",
                                            transactionFilter === f.id
                                                ? f.activeClass
                                                : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary/30"
                                        )}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredTransactions.length > 0 ? (
                            <div className="space-y-2">
                                {filteredTransactions.map((tx: any) => (
                                    <TransactionCard key={tx.id} tx={tx} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-surface border-2 border-dashed border-outline-variant/50 rounded-xl">
                                {transactionStats.total === 0 ? (
                                    <>
                                        <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Inbox className="w-7 h-7 text-on-surface-variant/40" />
                                        </div>
                                        <p className="text-sm font-medium text-on-surface-variant">هیچ تراکنشی برای این کاربر ثبت نشده است</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Filter className="w-7 h-7 text-on-surface-variant/40" />
                                        </div>
                                        <p className="text-sm font-medium text-on-surface-variant mb-3">
                                            {transactionFilter !== 'all' || transactionSearch || startDate
                                                ? 'هیچ تراکنشی با فیلترهای اعمال‌شده یافت نشد'
                                                : 'هیچ تراکنشی یافت نشد'}
                                        </p>
                                        {(transactionFilter !== 'all' || transactionSearch || startDate) && (
                                            <button
                                                onClick={() => {
                                                    setTransactionFilter('all');
                                                    setTransactionSearch('');
                                                    handleClearDateFilter();
                                                }}
                                                className="text-xs text-primary hover:underline font-medium"
                                            >
                                                پاک کردن تمام فیلترها
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AdDetailModal
                ad={selectedAd}
                isOpen={isAdModalOpen}
                onClose={() => { setIsAdModalOpen(false); setSelectedAd(null); }}
            />
            {confirmAction && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl border border-outline-variant p-6 text-center space-y-4 shadow-xl">
                        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                            <AlertCircle className="w-7 h-7 text-red-600" />
                        </div>

                        <h3 className="text-lg font-bold text-on-surface dark:text-gray-100">
                            {confirmAction === 'remove' ? 'حذف پیوند کاربر' : 'رد پیوند کاربر'}
                        </h3>
                        <p className="text-sm text-on-surface-variant dark:text-gray-400 leading-relaxed">
                            {confirmAction === 'remove'
                                ? 'با این عمل، پیوند کاربر با بازار قطع خواهد شد. آیا مطمئن هستید؟'
                                : 'درخواست پیوست این کاربر رد خواهد شد. این عمل قابل بازگشت نیست. ادامه می‌دهید؟'}
                        </p>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 py-2.5 border border-outline dark:border-gray-700 text-on-surface dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-surface-container-low dark:hover:bg-gray-800 transition-colors"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmAction === 'remove') handleRemoveMember();
                                    else handleReject();
                                    setConfirmAction(null);
                                }}
                                disabled={removing || rejecting}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {confirmAction === 'remove' ? (removing ? 'در حال حذف...' : 'تأیید حذف') : (rejecting ? 'در حال رد...' : 'تأیید رد')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}