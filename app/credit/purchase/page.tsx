// app/credit/purchase/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { FormHeader } from '@/app/components';
import { useCreditBalance, usePurchaseCredit } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import { CreditCard, Banknote, Loader2, Shield, Check, Info, Phone, Sparkles, Users, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberInput } from "@/components/common";
import { FileUploader } from '@/components/common/FileUploader';
import { apiService } from '@/lib/api/apiService';

export default function PurchaseCreditPage() {
    const router = useRouter();
    const { currentArm } = useSelector((state: RootState) => state.arm);
    const { data: balance, refetch: refetchBalance } = useCreditBalance();
    const purchaseCredit = usePurchaseCredit();

    // ============================================================
    // ✅ State
    // ============================================================
    const [creditCount, setCreditCount] = useState(10);
    const [paymentMethod, setPaymentMethod] = useState<'online' | 'manual'>('online');
    const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
    const [receiptFileId, setReceiptFileId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    // ============================================================
    // ✅ خواندن تنظیمات از config بازو
    // ============================================================
    const armConfig = currentArm?.config as any || {};
    const paymentConfig = armConfig.payment || {};
    const economyConfig = armConfig.economy || {};
    const supportConfig = armConfig.support || {};

    const currency = economyConfig.currency || 'IRR';
    const currencySymbol = {
        'IRR': 'تومان',
        'IRR1': 'ریال',
        'USD': 'دلار',
        'EUR': 'یورو',
        'BTC': 'بیت‌کوین',
    }[currency] || 'تومان';

    const creditPrice = economyConfig.creditPrice || 2000;
    const totalAmount = creditCount * creditPrice;

    // ✅ درگاه‌های فعال
    const enabledGateways = useMemo(() => {
        const gateways = paymentConfig.gateways || [];
        return gateways.filter((g: any) => g.enabled === true);
    }, [paymentConfig.gateways]);

    const onlineAvailable = paymentConfig.paymentMode !== 'manual_only' && enabledGateways.length > 0;
    const manualAvailable = paymentConfig.paymentMode !== 'online_only' && paymentConfig.manual?.enabled === true;

    const quickCredits = [10, 20, 50, 100, 500, 1000];

    const gatewayNameMap: Record<string, string> = {
        'pec': 'پارسیان',
        'zarinpal': 'زرین‌پال',
        'rayanpay': 'رایان‌پی',
    };

    // ✅ شماره پشتیبان از تنظیمات بازو
    const supportPhone = supportConfig.mobile || supportConfig.phone || null;
    const supportName = supportConfig.name || 'پشتیبانی';

    // ✅ تنظیم پیش‌فرض روش پرداخت و درگاه
    useEffect(() => {
        if (!onlineAvailable && manualAvailable) {
            setPaymentMethod('manual');
        } else if (onlineAvailable && !manualAvailable) {
            setPaymentMethod('online');
        }

        if (enabledGateways.length === 1) {
            setSelectedGateway(enabledGateways[0].name);
        }
    }, [onlineAvailable, manualAvailable, enabledGateways]);

    // ============================================================
    // ✅ آپلود فیش
    // ============================================================
    const handleReceiptUpload = async (file: File) => {
        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('model', 'Credit');
            formData.append('modelId', 'temp');
            formData.append('fieldKey', 'receipt');

            const result = await apiService.file.upload(formData);
            setReceiptFileId(result.id);
            setSelectedFile(file);
            toast.success('تصویر رسید با موفقیت آپلود شد');
        } catch (error: any) {
            console.error('Upload error:', error);
            setUploadError(error?.message || 'خطا در آپلود تصویر');
            toast.error(error?.message || 'خطا در آپلود تصویر');
        } finally {
            setIsUploading(false);
        }
    };

    // ============================================================
    // ✅ حذف فیش
    // ============================================================
    const handleRemoveReceipt = () => {
        setReceiptFileId(null);
        setSelectedFile(null);
        setUploadError(null);
    };

    // ============================================================
    // ✅ پرداخت
    // ============================================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (creditCount <= 0) {
            toast.error('لطفاً تعداد اعتبار معتبر وارد کنید');
            return;
        }

        if (totalAmount < 1000) {
            toast.error('حداقل مبلغ خرید ۱۰۰۰ تومان است');
            return;
        }

        if (paymentMethod === 'manual' && !receiptFileId) {
            toast.error('لطفاً تصویر رسید را آپلود کنید');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await purchaseCredit.mutateAsync({
                amount: totalAmount,
                paymentMethod,
                armId: currentArm?.id,
                gateway: paymentMethod === 'online' ? selectedGateway || undefined : undefined,
                ...(paymentMethod === 'manual' && {
                    receiptImage: receiptFileId || undefined,
                }),
                description: `خرید ${creditCount} اعتبار (${creditPrice} تومان هر اعتبار)`,
                creditCount,
            });

            if (paymentMethod === 'online' && result.payment_url) {
                window.location.href = result.payment_url;
            } else {
                setShowSuccess(true);
                toast.success('فیش شما ارسال شد. پس از تایید مدیر، اعتبار شما افزایش می‌یابد.');
                await refetchBalance();
                setTimeout(() => {
                    router.push('/credit/payments');
                }, 2000);
            }
        } catch (error: any) {
            console.error('Purchase error:', error);
            toast.error(error?.message || 'خطا در پرداخت');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen flex flex-col bg-surface">
                <FormHeader title="خرید اعتبار" backUrl="/profile" />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center space-y-4 max-w-sm w-full">
                        <div className="w-20 h-20 mx-auto rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                            <Check className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-xl font-extrabold text-green-700">فیش شما ارسال شد</h2>
                        <p className="text-sm text-on-surface-variant">
                            پس از تایید توسط مدیر بازار، اعتبار شما به کیف پول اضافه می‌شود.
                        </p>
                        <p className="text-xs text-on-surface-variant/60">
                            در حال انتقال به صفحه پرداخت‌ها...
                        </p>
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-primary rounded-full animate-[progress_2s_ease-in-out] w-0" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-surface pb-24">
            <FormHeader title="خرید اعتبار" backUrl="/profile" />

            <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-20">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ⭐ کارت توضیحی اعتبار - جدید */}

                        {/* ⭐ کارت توضیحی اعتبار - جمع‌شونده */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-800 shadow-sm overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low dark:hover:bg-gray-800 transition-colors text-right"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-on-surface dark:text-gray-100">
                                        اعتبار چیست؟
                                    </h3>
                                </div>
                                <span className="text-on-surface-variant dark:text-gray-400">
            {isExpanded ? '▴' : '▾'}
        </span>
                            </button>

                            {isExpanded && (
                                <div className="p-4 pb-4 space-y-3">
                                    <p className="text-xs text-on-surface-variant dark:text-gray-400 leading-relaxed">
                                     با خرید اعتبار می توانید آگهی های خود را نردبان کنید و یا آگهی بیش از سهمیه رایگان ثبت کنید و در کل برای استفاده از امکانات غیر رایگان اعتبار نیاز دارید. همیچنین به زودی بستری فراهم می شود تا با فعالیتهایی مانند دعوت از دوستان اعتبار دریافت کنید.
                                    </p>

                                </div>
                            )}
                        </div>


                    {/* موجودی فعلی */}
                    <div className="bg-white p-5 rounded-2xl border border-outline-variant/50 shadow-sm text-center">
                        <p className="text-sm text-on-surface-variant">موجودی اعتبار من</p>
                        <p className="text-3xl font-bold text-primary mt-1">
                            {balance?.balance?.toLocaleString() || 0} <span className="text-base font-normal text-on-surface-variant">اعتبار</span>
                        </p>
                    </div>

                    {/* انتخاب تعداد اعتبار */}
                    <div className="bg-white p-5 rounded-2xl border border-outline-variant/50 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-on-surface">
                                تعداد اعتبار
                            </label>
                            <span className="text-xs text-on-surface-variant">
                                هر اعتبار = {creditPrice.toLocaleString()} {currencySymbol}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {quickCredits.map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => setCreditCount(q)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all",
                                        creditCount === q
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-outline-variant hover:border-primary/30"
                                    )}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        <NumberInput
                            value={creditCount}
                            onChange={(val) => setCreditCount(Math.max(1, val || 1))}
                            unit="اعتبار"
                            textAlign="center"
                            className="w-full h-12 bg-surface-container-lowest border border-outline text-center font-mono text-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded-lg"
                        />

                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                            <span className="text-sm text-on-surface-variant">مبلغ قابل پرداخت:</span>
                            <span className="text-xl font-bold text-primary">
                                {totalAmount.toLocaleString()} {currencySymbol}
                            </span>
                        </div>
                    </div>

                    {/* انتخاب روش پرداخت */}
                    <div className="bg-white p-5 rounded-2xl border border-outline-variant/50 shadow-sm space-y-4">
                        <label className="text-sm font-semibold text-on-surface block">
                            روش پرداخت
                        </label>

                        <div className="space-y-3">
                            {onlineAvailable && (
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('online')}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all text-right",
                                            paymentMethod === 'online'
                                                ? "border-primary bg-primary/5"
                                                : "border-outline-variant hover:border-primary/30"
                                        )}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <CreditCard className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-on-surface">پرداخت آنلاین</p>
                                            <p className="text-xs text-on-surface-variant">اتصال به درگاه بانکی</p>
                                        </div>
                                        {paymentMethod === 'online' && (
                                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>

                                    {paymentMethod === 'online' && enabledGateways.length > 0 && (
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-on-surface block">
                                                انتخاب درگاه پرداخت
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {enabledGateways.map((gateway: any) => {
                                                    const isSelected = selectedGateway === gateway.name;
                                                    const gatewayInfo: Record<string, { label: string; icon: string; color: string }> = {
                                                        'pec': {
                                                            label: 'پارسیان',
                                                            icon: '🏦',
                                                            color: '#8B0000'
                                                        },
                                                        'zarinpal': {
                                                            label: 'زرین‌پال',
                                                            icon: '🟣',
                                                            color: '#9B59B6'
                                                        },
                                                        'rayanpay': {
                                                            label: 'رایان‌پی',
                                                            icon: '🔵',
                                                            color: '#2196F3'
                                                        },
                                                    };
                                                    const info = gatewayInfo[gateway.name] || {
                                                        label: gateway.name,
                                                        icon: '💳',
                                                        color: '#666'
                                                    };

                                                    return (
                                                        <button
                                                            key={gateway.name}
                                                            type="button"
                                                            onClick={() => setSelectedGateway(gateway.name)}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all duration-200",
                                                                isSelected
                                                                    ? "border-primary bg-primary/5 shadow-md"
                                                                    : "border-outline-variant hover:border-primary/30 hover:bg-surface-container-low"
                                                            )}
                                                            style={{
                                                                borderColor: isSelected ? info.color : undefined,
                                                                backgroundColor: isSelected ? `${info.color}10` : undefined,
                                                            }}
                                                        >
                                                            <div className="text-3xl mb-1">{info.icon}</div>
                                                            <span className={cn(
                                                                "text-sm font-medium",
                                                                isSelected ? "text-primary" : "text-on-surface"
                                                            )}>
                                                                {info.label}
                                                            </span>
                                                            {isSelected && (
                                                                <span className="text-[10px] text-primary mt-0.5">✓ انتخاب شده</span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-[10px] text-on-surface-variant/60 text-center">
                                                با انتخاب درگاه، به صفحه پرداخت آن هدایت می‌شوید
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {manualAvailable && (
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('manual')}
                                    className={cn(
                                        "w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all text-right",
                                        paymentMethod === 'manual'
                                            ? "border-primary bg-primary/5"
                                            : "border-outline-variant hover:border-primary/30"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Banknote className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-on-surface">کارت به کارت (فیش)</p>
                                        <p className="text-xs text-on-surface-variant">واریز و ارسال تصویر رسید</p>
                                    </div>
                                    {paymentMethod === 'manual' && (
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            )}
                        </div>

                        {!onlineAvailable && !manualAvailable && (
                            <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg flex items-start gap-2 text-sm text-warning">
                                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>هیچ روش پرداختی برای این بازار فعال نیست. لطفاً با مالک بازار تماس بگیرید.</p>
                            </div>
                        )}
                    </div>

                    {/* اطلاعات کارت به کارت */}
                    {paymentMethod === 'manual' && manualAvailable && (
                        <div id="manual-payment-section" className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-amber-700">
                                <Shield className="w-4 h-4" />
                                <span className="text-sm font-medium">اطلاعات واریز</span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                                {paymentConfig.manual?.cardNumber && (
                                    <>
                                        <span className="text-on-surface-variant text-xs">شماره کارت</span>
                                        <span className="font-mono font-bold text-left" dir="ltr">{paymentConfig.manual.cardNumber}</span>
                                    </>
                                )}
                                {paymentConfig.manual?.accountOwner && (
                                    <>
                                        <span className="text-on-surface-variant text-xs">نام صاحب حساب</span>
                                        <span className="font-bold text-left">{paymentConfig.manual.accountOwner}</span>
                                    </>
                                )}
                                {paymentConfig.manual?.bankName && (
                                    <>
                                        <span className="text-on-surface-variant text-xs">بانک</span>
                                        <span className="font-bold text-left">{paymentConfig.manual.bankName}</span>
                                    </>
                                )}
                                {paymentConfig.manual?.shebaNumber && (
                                    <>
                                        <span className="text-on-surface-variant text-xs">شماره شبا</span>
                                        <span className="font-monom font-bold text-left" dir="ltr">{paymentConfig.manual.shebaNumber}</span>
                                    </>
                                )}
                            </div>

                            {paymentConfig.manual?.instructions && (
                                <p className="text-xs text-amber-800/70 bg-white/50 p-2 rounded-lg text-right">
                                    {paymentConfig.manual.instructions}
                                </p>
                            )}

                            <div className="border-t border-amber-200/40 pt-3">
                                <label className="text-sm font-medium text-on-surface block mb-2">
                                    تصویر رسید
                                </label>

                                <FileUploader
                                    model="Credit"
                                    modelId="temp"
                                    fieldKey="receipt"
                                    value={receiptFileId}
                                    onFileSelect={handleReceiptUpload}
                                    onRemove={handleRemoveReceipt}
                                    onSuccess={(fileId) => {
                                        setReceiptFileId(fileId);
                                        toast.success('تصویر رسید آپلود شد');
                                    }}
                                    onError={(error) => {
                                        setUploadError(error);
                                        toast.error(error);
                                    }}
                                    rounded={false}
                                    width={200}
                                    height={120}
                                    disabled={isUploading || isSubmitting}
                                    label="آپلود رسید"
                                    error={uploadError || undefined}
                                />

                                {isUploading && (
                                    <p className="text-xs text-on-surface-variant mt-1">در حال آپلود...</p>
                                )}
                                {receiptFileId && !isUploading && (
                                    <p className="text-xs text-green-600 mt-1">✅ تصویر رسید آپلود شد</p>
                                )}
                                <p className="text-[10px] text-on-surface-variant/60 mt-1">
                                    * لطفاً تصویر رسید واریز را آپلود کنید تا درخواست شما تأیید شود
                                </p>
                            </div>
                        </div>
                    )}

                    {/* دکمه پرداخت */}
                    <button
                        type="submit"
                        disabled={isSubmitting || isUploading || (!onlineAvailable && !manualAvailable) || (paymentMethod === 'manual' && !receiptFileId)}
                        className="w-full h-14 bg-primary text-on-primary text-base font-bold flex items-center justify-center gap-2 rounded-xl disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {paymentMethod === 'manual' ? (
                                    <>
                                        ارسال فیش واریز
                                        <span className="text-sm font-normal opacity-80">
                                            ({totalAmount.toLocaleString()} {currencySymbol})
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        خرید {creditCount} اعتبار
                                        <span className="text-sm font-normal opacity-80">
                                            ({totalAmount.toLocaleString()} {currencySymbol})
                                        </span>
                                    </>
                                )}
                            </>
                        )}
                    </button>

                    {/* راهنمای تکمیلی */}
                    {paymentMethod === 'manual' && (
                        <div className="text-center text-xs text-amber-700/70 bg-amber-50/50 border border-amber-200/30 rounded-xl p-3">
                            <p> اگر در زمینه پرداخت سوال دارید با پشتیبان تماس بگیرید.</p>
                        </div>
                    )}

                    {/* دکمه تماس با پشتیبان */}
                    {supportPhone && (
                        <div className="flex justify-center mt-2">
                            <button
                                type="button"
                                onClick={() => window.location.href = `tel:${supportPhone}`}
                                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                                <Phone className="w-4 h-4" />
                                <span>
                                    {supportName && `${supportName} - `}
                                    پشتیبان بخش پرداخت
                                </span>
                            </button>
                        </div>
                    )}

                    <div className="text-center text-xs text-on-surface-variant/60 space-y-1">
                        <p>پس از تایید فیش، اعتبار به کیف پول شما اضافه می‌شود</p>
                    </div>
                </form>
            </main>

            <style jsx>{`
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
            `}</style>
        </div>
    );
}