// app/credit/payments/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { FormHeader } from '@/app/components';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import {
    Loader2, Phone, CheckCircle, XCircle, Clock,
    CreditCard, Banknote, ChevronLeft, ChevronRight, PlusCircle,
    Calendar, RefreshCw, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Payment = {
    id: string;
    amount: number;
    creditCount: number;
    status: 'pending' | 'success' | 'failed' | 'approved' | 'rejected';
    description: string;
    createdAt: string;
    paymentMethod: 'online' | 'manual';
    isRequest: boolean;
    rejectReason?: string | null;
};

export default function PaymentsPage() {
    const router = useRouter();
    const { currentArm } = useSelector((state: RootState) => state.arm);
    const supportConfig = (currentArm?.config as any)?.support || {};
    const supportPhone = supportConfig.mobile || supportConfig.phone || null;
    const supportName = supportConfig.name || 'پشتیبانی';

    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'online' | 'manual'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'success' | 'failed' | 'approved' | 'rejected'>('all');
    const [pagination, setPagination] = useState({ limit: 10, offset: 0, total: 0 });
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchPayments();
    }, [filter, statusFilter, currentPage]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const params: any = {
                limit: pagination.limit,
                offset: (currentPage - 1) * pagination.limit,
            };
            if (filter !== 'all') params.paymentMethod = filter;
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await apiService.credit.getPaymentTransactions(params);
            setPayments(response.transactions || []);
            setPagination(response.pagination || { limit: 10, offset: 0, total: 0 });
        } catch (error: any) {
            toast.error(error?.message || 'خطا در دریافت پرداخت‌ها');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(pagination.total / pagination.limit);

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ─── برچسب وضعیت (فقط وضعیت، بدون دلیل رد) ───
    const getStatusBadge = (p: Payment) => {
        const status = p.status;
        if (status === 'success' || status === 'approved') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                    <CheckCircle className="w-3 h-3"/>
                    {p.isRequest ? 'تایید شده' : 'موفق'}
                </span>
            );
        }
        if (status === 'pending') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                    <Clock className="w-3 h-3"/>
                    در انتظار
                </span>
            );
        }
        if (status === 'failed' || status === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/50">
                    <XCircle className="w-3 h-3"/>
                    {p.isRequest ? 'رد شده' : 'ناموفق'}
                </span>
            );
        }
        return <span className="text-[10px] text-on-surface-variant/60">{status}</span>;
    };

    const getMethodIcon = (method: 'online' | 'manual') => {
        if (method === 'online') {
            return <CreditCard className="w-4 h-4 text-blue-500" />;
        }
        return <Banknote className="w-4 h-4 text-amber-500" />;
    };

    const getMethodLabel = (method: 'online' | 'manual') => {
        return method === 'online' ? 'آنلاین' : 'کارت به کارت';
    };

    // ─── دکمه ارسال مجدد فیش و نمایش دلیل رد ───
    const handleRetryManual = (p: Payment) => {
        const params = new URLSearchParams();
        params.set('amount', p.amount.toString());
        params.set('method', 'manual');
        const armId = (p.metadata as any)?.armId || currentArm?.id;
        if (armId) params.set('armId', armId);
        router.push(`/credit/purchase?${params.toString()}`);
    };

    // ─── نمای موبایل ───
    const MobileView = () => (
        <div className="space-y-3">
            {payments.map(p => (
                <div
                    key={p.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/30 dark:border-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <div className={cn(
                                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                    p.paymentMethod === 'online'
                                        ? "bg-blue-50 dark:bg-blue-950/30 text-blue-500"
                                        : "bg-amber-50 dark:bg-amber-950/30 text-amber-500"
                                )}>
                                    {getMethodIcon(p.paymentMethod)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm text-on-surface dark:text-gray-100 truncate">
                                        {p.description}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-[10px] text-on-surface-variant/60 flex items-center gap-0.5">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(p.createdAt).toLocaleDateString('fa-IR')}
                                        </span>
                                        <span className="text-[9px] text-on-surface-variant/50">
                                            {getMethodLabel(p.paymentMethod)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(p)}
                                    {p.isRequest && (
                                        <span className="text-[8px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
                                            فیش
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm text-on-surface dark:text-gray-100">
                                        {p.amount.toLocaleString()} تومان
                                    </p>
                                    <p className="text-[10px] text-on-surface-variant/60">
                                        {p.creditCount} اعتبار
                                    </p>
                                </div>
                            </div>
                            {/* دکمه ارسال مجدد و دلیل رد برای فیش‌های رد شده */}
                            {p.status === 'rejected' && p.isRequest && (
                                <div className="mt-3 pt-3 border-t border-outline-variant/20 dark:border-gray-800">
                                    {p.rejectReason && (
                                        <div className="flex items-start gap-1.5 text-[10px] text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/20 px-2 py-0.5 rounded-md border border-rose-200/40 dark:border-rose-800/40 mb-2">
                                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                            <span className="leading-tight">{p.rejectReason}</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleRetryManual(p)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-medium transition-colors"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        ارسال مجدد فیش
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // ─── نمای دسکتاپ ───
    const DesktopView = () => (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b bg-surface-container-low dark:bg-gray-800/50">
                        <th className="text-right py-3 px-4 text-xs font-semibold text-on-surface-variant">توضیحات</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-on-surface-variant">روش</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-on-surface-variant">وضعیت</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-on-surface-variant">تاریخ</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-on-surface-variant">مبلغ</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-on-surface-variant">عملیات</th>
                    </tr>
                    </thead>
                    <tbody>
                    {payments.map(p => (
                        <tr key={p.id} className="border-b hover:bg-surface-container-low transition-colors">
                            <td className="py-3 px-4">
                                <span className="font-medium text-sm text-on-surface">{p.description}</span>
                                {p.isRequest && (
                                    <span className="mr-1.5 text-[8px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
                                        فیش
                                    </span>
                                )}
                            </td>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                    {getMethodIcon(p.paymentMethod)}
                                    <span className="text-xs text-on-surface-variant">{getMethodLabel(p.paymentMethod)}</span>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                {getStatusBadge(p)}
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-xs text-on-surface-variant/60">
                                    {new Date(p.createdAt).toLocaleDateString('fa-IR')}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                                <span className="font-bold text-sm text-primary">{p.amount.toLocaleString()} تومان</span>
                                <div className="text-[10px] text-on-surface-variant/60">{p.creditCount} اعتبار</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                                {p.status === 'rejected' && p.isRequest && (
                                    <div className="flex flex-col items-center gap-1">
                                        {p.rejectReason && (
                                            <div className="flex items-start gap-1 text-[10px] text-rose-700 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/20 px-2 py-0.5 rounded-md border border-rose-200/40 dark:border-rose-800/40 text-left max-w-[180px]">
                                                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                                <span className="leading-tight">{p.rejectReason}</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleRetryManual(p)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-xs font-medium transition-colors"
                                        >
                                            <RefreshCw className="w-3 h-3" />
                                            ارسال مجدد
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface pb-28 relative">
            <button
                onClick={() => router.push('/credit/purchase')}
                className="fixed top-3 left-2 z-[999] flex items-center gap-1.5 bg-primary text-white px-3.5 py-2 rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-105 text-sm font-bold"
            >
                <PlusCircle className="w-4 h-4"/><span>خرید اعتبار</span>
            </button>
            <FormHeader title="گزارش پرداخت‌ها" backUrl="/profile" />

            <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-20">
                {/* فیلترها */}
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-outline-variant/30 dark:border-gray-800 mb-6">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="text-sm font-medium text-on-surface-variant">روش پرداخت:</span>
                        <div className="flex flex-wrap gap-1.5">
                            {(['all','online','manual'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setFilter(m)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all",
                                        filter === m
                                            ? "bg-primary text-white border-primary"
                                            : "border-outline-variant/40 hover:border-primary/30 text-on-surface-variant"
                                    )}
                                >
                                    {m === 'all' ? 'همه' : m === 'online' ? 'آنلاین' : 'کارت به کارت'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-on-surface-variant">وضعیت:</span>
                        <div className="flex flex-wrap gap-1">
                            {(['all','pending','success','failed','approved','rejected'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-xl text-[10px] font-medium border transition-all",
                                        statusFilter === s
                                            ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-on-surface dark:text-gray-100"
                                            : "border-outline-variant/30 text-on-surface-variant/60 hover:border-outline-variant"
                                    )}
                                >
                                    {s === 'all' ? 'همه' :
                                        s === 'pending' ? 'در انتظار' :
                                            s === 'success' ? 'موفق' :
                                                s === 'failed' ? 'ناموفق' :
                                                    s === 'approved' ? 'تایید شده' : 'رد شده'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* لیست پرداخت‌ها */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary"/>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto rounded-full bg-surface-container-low border border-outline-variant/30 flex items-center justify-center mb-4">
                            <Banknote className="w-10 h-10 text-on-surface-variant/30" />
                        </div>
                        <p className="text-base font-medium text-on-surface">هیچ پرداختی یافت نشد</p>
                        <p className="text-sm text-on-surface-variant/60 mt-1">برای خرید اعتبار، روی دکمه بالا کلیک کنید</p>
                    </div>
                ) : (
                    <>
                        <div className="block md:hidden">
                            <MobileView />
                        </div>
                        <div className="hidden md:block">
                            <DesktopView />
                        </div>

                        {/* صفحه‌بندی */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="w-9 h-9 rounded-xl border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => goToPage(pageNum)}
                                            className={cn(
                                                "w-9 h-9 rounded-xl text-sm font-medium transition-all",
                                                currentPage === pageNum
                                                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                                                    : "border border-outline-variant/30 hover:bg-surface-container-low"
                                            )}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="w-9 h-9 rounded-xl border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}