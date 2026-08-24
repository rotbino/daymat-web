// app/credit/verify/page.tsx
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { AppHeader } from '@/app/components';
import { useCreditBalance } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, Home, RefreshCw, CreditCard, ArrowLeft, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function VerifyPaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-gray-950">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            </div>
        }>
            <VerifyPaymentContent />
        </Suspense>
    );
}

function VerifyPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentArm } = useSelector((state: RootState) => state.arm);
    const { data: creditBalance, refetch: refetchBalance } = useCreditBalance();

    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [transactionDetails, setTransactionDetails] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // ⭐ پارامترهای callback
    const transid = searchParams.get('transid') || '';
    const statusParam = searchParams.get('status') || '';
    const tracking_number = searchParams.get('tracking_number') || '';
    const bank = searchParams.get('bank') || '';
    const cardnumber = searchParams.get('cardnumber') || '';

    // ⭐ تنظیمات بازار
    const armName = currentArm?.name || 'Daymat';
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3011';
    const armLogo = currentArm?.config?.general?.logoFileId
        ? `${API_BASE}/file/${currentArm.config.general.logoFileId}`
        : currentArm?.logoUrl || '/images/logo.png';
    const primaryColor = currentArm?.colorPrimary || '#e65100';

    useEffect(() => {
        const verifyPayment = async () => {
            if (!transid) {
                setStatus('failed');
                setErrorMessage('کد پیگیری تراکنش یافت نشد');
                return;
            }

            // ⭐ ناموفق
            if (statusParam === '0') {
                setStatus('failed');
                setErrorMessage('پرداخت توسط شما لغو یا ناموفق بود');
                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE}/credit/verify?transid=${transid}&status=${statusParam || '1'}`,
                );

                if (response.ok) {
                    setStatus('success');
                    await refetchBalance();

                    // ⭐ گرفتن جزئیات تراکنش
                    if (tracking_number) {
                        setTransactionDetails({
                            tracking_code: tracking_number,
                            transid,
                            bank,
                            cardnumber,
                        });
                    }
                } else {
                    setStatus('failed');
                    setErrorMessage('پرداخت ناموفق بود');
                }
            } catch (error) {
                setStatus('failed');
                setErrorMessage('خطا در تأیید پرداخت');
            }
        };

        verifyPayment();
    }, [transid, statusParam]);

    // ⭐ لودینگ
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex flex-col bg-surface dark:bg-gray-950">
                <AppHeader showBack={true} backUrl="/" />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                        <h1 className="text-xl font-bold text-on-surface dark:text-gray-100 mb-2">در حال تأیید پرداخت</h1>
                        <p className="text-sm text-on-surface-variant dark:text-gray-400">لطفاً چند لحظه صبر کنید...</p>
                    </div>
                </main>
            </div>
        );
    }

    // ⭐ موفقیت
    if (status === 'success') {
        const balance = creditBalance?.balance || 0;

        return (
            <div className="min-h-screen flex flex-col bg-surface dark:bg-gray-950">
                <AppHeader showBack={true} backUrl="/" />
                <main className="flex-1 flex items-center justify-center px-4 py-8">
                    <div className="w-full max-w-lg">
                        {/* کارت موفقیت */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/20 dark:border-gray-800 shadow-lg p-6 sm:p-8">
                            {/* هدر با لوگو */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <Image src={armLogo} alt={armName} width={48} height={48} className="object-contain" unoptimized />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-on-surface dark:text-gray-100">{armName}</h1>
                                    <p className="text-xs text-on-surface-variant/60 dark:text-gray-500">بازار تخصصی خرید و فروش عمده</p>
                                </div>
                            </div>

                            {/* آیکون موفقیت */}
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h2 className="text-lg font-bold text-on-surface dark:text-gray-100">پرداخت با موفقیت انجام شد! 🎉</h2>
                                <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-1">اعتبار به پنل شما اضافه شد</p>
                            </div>

                            {/* کارت اعتبار */}
                            <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl p-4 mb-4 border border-primary/20 dark:border-primary/30">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-primary" />
                                        <span className="text-sm font-medium text-on-surface dark:text-gray-200">موجودی کیف پول</span>
                                    </div>
                                    <span className="text-2xl font-bold text-primary">{balance.toLocaleString()}</span>
                                </div>
                                <p className="text-[10px] text-on-surface-variant/60 dark:text-gray-500 mt-1">اعتبار</p>
                            </div>

                            {/* جزئیات تراکنش */}
                            {transactionDetails && (
                                <div className="bg-surface-container-low dark:bg-gray-800 rounded-xl p-4 mb-6">
                                    <h3 className="text-xs font-semibold text-on-surface-variant dark:text-gray-400 mb-3 flex items-center gap-1.5">
                                        <ShoppingBag className="w-3.5 h-3.5" />جزئیات تراکنش
                                    </h3>
                                    <div className="space-y-2 text-xs">
                                        {transactionDetails.tracking_code && (
                                            <div className="flex justify-between">
                                                <span className="text-on-surface-variant dark:text-gray-400">کد رهگیری</span>
                                                <span className="font-mono font-medium text-on-surface dark:text-gray-200">{transactionDetails.tracking_code}</span>
                                            </div>
                                        )}
                                        {transactionDetails.transid && (
                                            <div className="flex justify-between">
                                                <span className="text-on-surface-variant dark:text-gray-400">کد تراکنش</span>
                                                <span className="font-mono text-[11px] text-on-surface-variant/70 dark:text-gray-500">{transactionDetails.transid}</span>
                                            </div>
                                        )}
                                        {transactionDetails.bank && (
                                            <div className="flex justify-between">
                                                <span className="text-on-surface-variant dark:text-gray-400">بانک</span>
                                                <span className="text-on-surface dark:text-gray-200">{transactionDetails.bank}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* دکمه‌ها */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => router.push('/profile')}
                                    className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    <CreditCard className="w-4 h-4" />پروفایل و خریدها
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    className="flex-1 py-2.5 border border-outline dark:border-gray-700 text-on-surface dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-surface-container-low dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Home className="w-4 h-4" />بازگشت به بازار
                                </button>
                            </div>
                        </div>

                        {/* نکات */}
                        <div className="mt-4 bg-surface-container-low dark:bg-gray-800 rounded-xl p-4">
                            <h3 className="text-xs font-semibold text-on-surface dark:text-gray-200 mb-2 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-primary" />راهنمایی
                            </h3>
                            <ul className="text-[11px] text-on-surface-variant dark:text-gray-400 space-y-1.5">
                                <li>• موجودی اعتبار شما در پروفایل قابل مشاهده است</li>
                                <li>• برای ثبت آگهی و نردبان از اعتبار استفاده کنید</li>
                                <li>• تاریخچه کامل خریدها در پروفایل موجود است</li>
                            </ul>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ⭐ ناموفق
    return (
        <div className="min-h-screen flex flex-col bg-surface dark:bg-gray-950">
            <AppHeader showBack={true} backUrl="/" />
            <main className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/20 dark:border-gray-800 shadow-lg p-6 sm:p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                            <Image src={armLogo} alt={armName} width={64} height={64} className="object-contain" unoptimized />
                        </div>
                        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-lg font-bold text-on-surface dark:text-gray-100 mb-2">پرداخت ناموفق</h1>
                        <p className="text-sm text-on-surface-variant dark:text-gray-400 mb-6">
                            {errorMessage || 'متأسفانه پرداخت شما با خطا مواجه شد'}
                        </p>

                        <p className="text-xs text-on-surface-variant/60 dark:text-gray-500 mb-6">
                            در صورت کسر مبلغ از حساب شما، وجه پرداختی طی ۷۲ ساعت کاری بازگردانده خواهد شد.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <button onClick={() => router.push('/credit/purchase')} className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
                                <RefreshCw className="w-4 h-4" />تلاش مجدد
                            </button>
                            <button onClick={() => router.push('/')} className="flex-1 py-2.5 border border-outline dark:border-gray-700 text-on-surface dark:text-gray-300 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                                <Home className="w-4 h-4" />بازگشت به بازار
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}