// app/ad/[id]/components/AdPaymentTab.tsx
'use client';

import { Zap, Banknote, Layers } from 'lucide-react';
import { formatNum } from './shared';

interface AdPaymentTabProps {
    ad: any;
}

export default function AdPaymentTab({ ad }: AdPaymentTabProps) {
    const unit = ad.unit?.shortCode || 'تن';
    const paymentMethods = ad.paymentMethods || {};
    const chequeOptions = paymentMethods.cheque || [];
    const installmentOptions = paymentMethods.installment || [];
    const hasCheque = chequeOptions.length > 0;
    const hasInstallment = installmentOptions.length > 0;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm space-y-3">
            {/* نقدی */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">نقدی</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white mt-0.5">
                        {formatNum(ad.unitPrice)} تومان / {unit}
                    </p>
                </div>
            </div>

            {/* چکی */}
            {hasCheque && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mt-0.5">
                        <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">پرداخت چکی</p>
                        <div className="space-y-1 mt-1.5">
                            {chequeOptions.map((opt: any, i: number) => (
                                <div key={i} className="flex items-baseline gap-2">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {formatNum(opt.price)} تومان
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        / {unit} — {opt.days} روزه
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* اقساطی */}
            {hasInstallment && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mt-0.5">
                        <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">پرداخت اقساطی</p>
                        <div className="space-y-1.5 mt-1.5">
                            {installmentOptions.map((opt: any, i: number) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {formatNum(opt.price)} تومان
                                    </span>
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                        / {unit} — {opt.months} ماهه
                                        {opt.prepaymentPercent ? ` (${opt.prepaymentPercent}٪ پیش‌پرداخت)` : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}