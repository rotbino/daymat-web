// app/ad/[id]/[slug]/components/AdPaymentTab.tsx
'use client';

import { Zap, Banknote, Layers, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    ad: any;
}

function fmt(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

export default function AdPaymentTab({ ad }: Props) {
    const unit = ad.unit?.shortCode || '';
    const pm = ad.paymentMethods || {};
    const chequeOptions = pm.cheque || [];
    const installmentOptions = pm.installment || [];
    const hasCheque = chequeOptions.length > 0;
    const hasInstallment = installmentOptions.length > 0;

    const chequeDescription = pm.chequeDescription || '';
    const installmentDescription = pm.installmentDescription || '';
    const generalDescription = pm.description || '';

    return (
        <div className="space-y-4 p-6">
            {/* ═══ نقدی ═══ */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">پرداخت نقدی</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">پرداخت آنی و مستقیم</p>
                    </div>
                </div>
                <div className="text-left">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {fmt(ad.unitPrice)}
                        <span className="text-xs font-normal text-gray-400 dark:text-gray-500 mr-1">تومان</span>
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">/ {unit}</p>
                </div>
            </div>

            {/* ═══ چکی ═══ */}
            {hasCheque && (
                <div className="py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                            <Banknote className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">پرداخت چکی</p>
                            {chequeDescription && (
                                <p className="text-[11px] text-gray-400 dark:text-gray-500">{chequeDescription}</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1.5 pr-10">
                        {chequeOptions.map((opt: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    چک {opt.days} روزه
                                </span>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {fmt(opt.price)} تومان / {unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ اقساطی ═══ */}
            {hasInstallment && (
                <div className="py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <span className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">پرداخت اقساطی</p>
                            {installmentDescription && (
                                <p className="text-[11px] text-gray-400 dark:text-gray-500">{installmentDescription}</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1.5 pr-10">
                        {installmentOptions.map((opt: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {opt.months} ماهه
                                    {opt.prepaymentPercent ? ` (${opt.prepaymentPercent}% پیش‌پرداخت)` : ''}
                                </span>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {fmt(opt.price)} تومان / {unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ توضیحات کلی ═══ */}
            {generalDescription && (
                <div className="flex items-start gap-2.5 pt-1">
                    <CalendarClock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-6">
                        {generalDescription}
                    </p>
                </div>
            )}

            {/* ═══ فقط نقدی ═══ */}
            {!hasCheque && !hasInstallment && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    این کالا فقط به صورت نقدی فروخته می‌شود.
                </p>
            )}
        </div>
    );
}