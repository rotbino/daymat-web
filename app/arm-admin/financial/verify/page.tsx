// app/arm-admin/financial/verify/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    Search,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    CreditCard,
    User,
    Loader2,
    Banknote,
    Calendar,
    Building2,
    Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

interface PaymentRequest {
    id: string;
    userId: string;
    user: {
        fullName: string | null;
        phone: string;
    };
    businessId: string;
    business: {
        name: string;
    };
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    receiptImage?: string;
    receiptNote?: string;
    createdAt: string;
    updatedAt: string;
    verifiedAt?: string;
    rejectReason?: string;
    metadata?: {
        creditCount?: number;
        creditPrice?: number;
        currency?: string;
    };
}

export default function VerifyPaymentsPage() {
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const [payments, setPayments] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // ============================================================
    // ✅ واکشی لیست فیش‌ها
    // ============================================================
    const fetchPayments = async () => {
        if (!currentSlug) return;
        setLoading(true);
        try {
            const data = await apiService.armAdmin.getPayments(currentSlug);
            setPayments(data);
        } catch (error: any) {
            console.error('Error fetching payments:', error);
            toast.error(error?.message || 'خطا در دریافت لیست فیش‌ها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [currentSlug]);

    // ============================================================
    // ✅ فیلتر کردن
    // ============================================================
    const filteredPayments = payments.filter((payment) => {
        const fullName = (payment.user?.fullName || '').toLowerCase();
        const phone = (payment.user?.phone || '').toLowerCase();
        const businessName = (payment.business?.name || '').toLowerCase();
        const search = searchTerm.trim().toLowerCase();

        if (!search) {
            return statusFilter === 'all' || payment.status === statusFilter;
        }

        const matchesSearch =
            fullName.includes(search) ||
            phone.includes(search) ||
            businessName.includes(search);

        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // ============================================================
    // ✅ تأیید فیش
    // ============================================================
    const handleApprove = async (paymentId: string) => {
        if (!currentSlug) return;

        setIsProcessing(true);
        try {
            await apiService.armAdmin.approvePayment(currentSlug, paymentId);
            toast.success('✅ فیش با موفقیت تأیید شد و اعتبار به حساب کاربر واریز شد');
            await fetchPayments();
            setIsModalOpen(false);
            setSelectedPayment(null);
        } catch (error: any) {
            console.error('Error approving payment:', error);
            toast.error(error?.message || 'خطا در تأیید فیش');
        } finally {
            setIsProcessing(false);
        }
    };

    // ============================================================
    // ✅ رد فیش
    // ============================================================
    const handleReject = async (paymentId: string, reason: string) => {
        if (!currentSlug) return;

        if (!reason.trim()) {
            toast.error('لطفاً دلیل رد را وارد کنید');
            return;
        }

        setIsProcessing(true);
        try {
            await apiService.armAdmin.rejectPayment(currentSlug, paymentId, reason);
            toast.success('❌ فیش با موفقیت رد شد');
            await fetchPayments();
            setIsModalOpen(false);
            setSelectedPayment(null);
        } catch (error: any) {
            console.error('Error rejecting payment:', error);
            toast.error(error?.message || 'خطا در رد فیش');
        } finally {
            setIsProcessing(false);
        }
    };

    // ============================================================
    // ✅ وضعیت‌ها
    // ============================================================
    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
            approved: 'bg-green-500/10 text-green-600 border-green-200',
            rejected: 'bg-red-500/10 text-red-600 border-red-200',
        };
        const icons = {
            pending: Clock,
            approved: CheckCircle,
            rejected: XCircle,
        };
        const labels = {
            pending: 'در انتظار بررسی',
            approved: 'تأیید شده',
            rejected: 'رد شده',
        };
        const Icon = icons[status as keyof typeof icons] || Clock;

        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
                    styles[status as keyof typeof styles] || styles.pending
                )}
            >
                <Icon className="w-3.5 h-3.5" />
                {labels[status as keyof typeof labels] || status}
            </span>
        );
    };

    // ============================================================
    // ✅ مودال جزئیات فیش
    // ============================================================
    const PaymentDetailModal = () => {
        if (!selectedPayment) return null;

        const [rejectReason, setRejectReason] = useState('');
        const creditCount = selectedPayment.metadata?.creditCount || Math.floor(selectedPayment.amount / 2000);
        const currencySymbol = selectedPayment.metadata?.currency === 'USD' ? '$' : 'تومان';

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-surface w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-outline-variant">
                    {/* هدر */}
                    <div className="flex items-center justify-between p-4 border-b border-outline-variant sticky top-0 bg-surface rounded-t-2xl">
                        <h3 className="text-base font-semibold text-on-surface">جزئیات فیش</h3>
                        <button
                            onClick={() => {
                                setIsModalOpen(false);
                                setSelectedPayment(null);
                            }}
                            className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors"
                        >
                            <XCircle className="w-5 h-5 text-on-surface-variant" />
                        </button>
                    </div>

                    {/* محتوا */}
                    <div className="p-4 space-y-4">
                        {/* کاربر */}
                        <div className="bg-surface-container-low p-3 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-on-surface truncate">
                                        {selectedPayment.user?.fullName || selectedPayment.user?.phone || 'کاربر ناشناس'}
                                    </p>
                                    <p className="text-sm text-on-surface-variant">
                                        {selectedPayment.user?.phone || 'شماره نامشخص'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* کسب‌وکار */}
                        <div className="flex items-center gap-2 text-sm bg-surface-container-low p-2.5 rounded-lg">
                            <Building2 className="w-4 h-4 text-on-surface-variant" />
                            <span className="text-on-surface-variant">کسب‌وکار:</span>
                            <span className="font-medium text-on-surface truncate">
                                {selectedPayment.business?.name || 'کسب‌وکار نامشخص'}
                            </span>
                        </div>

                        {/* تعداد اعتبار و مبلغ */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-center">
                                <p className="text-xs text-on-surface-variant">تعداد اعتبار</p>
                                <p className="text-xl font-bold text-primary">
                                    {creditCount.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-surface-container-low border border-outline-variant p-3 rounded-xl text-center">
                                <p className="text-xs text-on-surface-variant">مبلغ ({currencySymbol})</p>
                                <p className="text-xl font-bold text-on-surface">
                                    {selectedPayment.amount.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* وضعیت و تاریخ */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-on-surface-variant">وضعیت:</span>
                                {getStatusBadge(selectedPayment.status)}
                            </div>
                            <div className="flex items-center gap-1 text-on-surface-variant">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs">
                                    {new Date(selectedPayment.createdAt).toLocaleDateString('fa-IR')}
                                </span>
                            </div>
                        </div>

                        {/* تصویر رسید */}
                        {selectedPayment.receiptImage && (
                            <div>
                                <span className="text-xs text-on-surface-variant block mb-2">تصویر رسید</span>
                                <div className="bg-surface-container-low border border-outline-variant rounded-xl p-2 flex items-center justify-center">
                                    <img
                                        src={selectedPayment.receiptImage.startsWith('http')
                                            ? selectedPayment.receiptImage
                                            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${selectedPayment.receiptImage}`
                                        }
                                        alt="رسید"
                                        className="max-h-40 rounded-lg object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/no-image.png';
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* یادداشت کاربر */}
                        {selectedPayment.receiptNote && (
                            <div>
                                <span className="text-xs text-on-surface-variant block mb-1">یادداشت کاربر</span>
                                <p className="text-sm text-on-surface bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                                    {selectedPayment.receiptNote}
                                </p>
                            </div>
                        )}

                        {/* دلیل رد */}
                        {selectedPayment.status === 'rejected' && selectedPayment.rejectReason && (
                            <div className="bg-error/5 border border-error/20 p-3 rounded-xl">
                                <span className="text-xs text-error block mb-1">دلیل رد</span>
                                <p className="text-sm text-on-surface">{selectedPayment.rejectReason}</p>
                            </div>
                        )}

                        {/* دکمه‌های عملیات */}
                        {selectedPayment.status === 'pending' && (
                            <div className="border-t border-outline-variant pt-4 space-y-3">
                                <div>
                                    <label className="text-xs text-on-surface-variant block mb-1">
                                        دلیل رد (در صورت رد کردن)
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="دلیل رد فیش..."
                                        rows={2}
                                        className="w-full bg-surface-container-lowest border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded-lg"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApprove(selectedPayment.id)}
                                        disabled={isProcessing}
                                        className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
                                        )}
                                        تأیید و واریز
                                    </button>
                                    <button
                                        onClick={() => handleReject(selectedPayment.id, rejectReason)}
                                        disabled={isProcessing || !rejectReason.trim()}
                                        className="flex-1 bg-error text-white py-2.5 rounded-lg font-medium hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        رد فیش
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // ✅ رندر اصلی
    // ============================================================
    return (
        <div className="max-w-full">
            {/* هدر */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-on-surface">تایید فیش‌های واریز</h1>
                    <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                        {currentArm?.name || currentSlug}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg self-start sm:self-center">
                    <CreditCard className="w-4 h-4" />
                    <span>{payments.filter(p => p.status === 'pending').length} در انتظار</span>
                </div>
            </div>

            {/* فیلترها */}
            <div className="flex flex-col sm:flex-row gap-2 mb-5">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="جستجو..."
                        className="w-full bg-surface-container-lowest border border-outline h-10 px-3 pr-9 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded-lg"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-surface-container-lowest border border-outline h-10 px-3 text-sm appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded-lg min-w-[120px]"
                >
                    <option value="all">همه</option>
                    <option value="pending">در انتظار</option>
                    <option value="approved">تأیید شده</option>
                    <option value="rejected">رد شده</option>
                </select>
                <button
                    onClick={fetchPayments}
                    className="bg-surface-container border border-outline px-4 h-10 hover:bg-surface-container-high transition-colors rounded-lg text-sm font-medium whitespace-nowrap"
                >
                    بروزرسانی
                </button>
            </div>

            {/* لیست */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredPayments.length === 0 ? (
                <div className="text-center py-12 bg-surface-container-low border border-outline-variant rounded-xl">
                    <Banknote className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-on-surface">هیچ فیشی یافت نشد</h3>
                    <p className="text-sm text-on-surface-variant mt-1">
                        {searchTerm || statusFilter !== 'all'
                            ? 'با فیلترهای اعمال‌شده هیچ فیشی پیدا نشد'
                            : 'هیچ درخواست خرید اعتباری ثبت نشده است'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filteredPayments.map((payment) => {
                        const creditCount = payment.metadata?.creditCount || Math.floor(payment.amount / 2000);

                        return (
                            <div
                                key={payment.id}
                                className="bg-surface-container-lowest border border-outline-variant p-3 sm:p-4 rounded-xl hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    {/* اطلاعات کاربر */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-on-surface truncate">
                                                {payment.user?.fullName || payment.user?.phone || 'کاربر ناشناس'}
                                            </p>
                                            <p className="text-xs text-on-surface-variant">
                                                {payment.user?.phone || 'شماره نامشخص'}
                                            </p>
                                            <p className="text-[10px] text-on-surface-variant/60 truncate">
                                                {payment.business?.name || 'کسب‌وکار نامشخص'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* اطلاعات فیش */}
                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-3.5 h-3.5 text-primary" />
                                            <span className="font-bold text-primary text-sm">
                                                {creditCount.toLocaleString()} اعتبار
                                            </span>
                                        </div>
                                        <div className="text-xs text-on-surface-variant">
                                            {payment.amount.toLocaleString()} تومان
                                        </div>
                                        <div className="text-xs text-on-surface-variant">
                                            {new Date(payment.createdAt).toLocaleDateString('fa-IR')}
                                        </div>
                                        <div>{getStatusBadge(payment.status)}</div>
                                    </div>

                                    {/* دکمه‌ها */}
                                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                                        <button
                                            onClick={() => {
                                                setSelectedPayment(payment);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors"
                                            title="مشاهده جزئیات"
                                        >
                                            <Eye className="w-4 h-4 text-on-surface-variant" />
                                        </button>
                                        {payment.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setSelectedPayment(payment);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                                                >
                                                    تأیید
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedPayment(payment);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="bg-error text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-error/90 transition-colors"
                                                >
                                                    رد
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* مودال */}
            {isModalOpen && <PaymentDetailModal />}
        </div>
    );
}