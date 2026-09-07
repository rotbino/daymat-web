// app/ad/components/PaymentMethodsSection.tsx
'use client';

import React from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { NumberInput } from '@/components/common';
import { toast } from 'sonner';

interface PaymentMethodsSectionProps {
    paymentMethods: {
        enabled: boolean;
        description: string;
        cheque: {
            enabled: boolean;
            description: string;
            options: { price: number; days: number }[];
        };
        installment: {
            enabled: boolean;
            description: string;
            options: { price: number; months: number; prepaymentPercent: number }[];
        };
    };
    setPaymentMethods: (value: any) => void;
}

export function PaymentMethodsSection({ paymentMethods, setPaymentMethods }: PaymentMethodsSectionProps) {
    const addChequeOption = () => {
        setPaymentMethods((prev: any) => ({
            ...prev,
            cheque: {
                ...prev.cheque,
                options: [...prev.cheque.options, { price: 0, days: 30 }],
            },
        }));
    };

    const removeChequeOption = (index: number) => {
        const newOptions = [...paymentMethods.cheque.options];
        newOptions.splice(index, 1);
        setPaymentMethods((prev: any) => ({
            ...prev,
            cheque: { ...prev.cheque, options: newOptions },
        }));
    };

    const addInstallmentOption = () => {
        setPaymentMethods((prev: any) => ({
            ...prev,
            installment: {
                ...prev.installment,
                options: [...prev.installment.options, { price: 0, months: 6, prepaymentPercent: 30 }],
            },
        }));
    };

    const removeInstallmentOption = (index: number) => {
        const newOptions = [...paymentMethods.installment.options];
        newOptions.splice(index, 1);
        setPaymentMethods((prev: any) => ({
            ...prev,
            installment: { ...prev.installment, options: newOptions },
        }));
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    روش‌های پرداخت غیرنقدی (اختیاری)
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={paymentMethods.enabled}
                        onChange={(e) => setPaymentMethods((prev: any) => ({ ...prev, enabled: e.target.checked }))}
                    />
                    <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 after:content-[''] after:absolute after:top-[3px] after:right-[3px] after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all after:shadow-sm peer-checked:bg-primary peer-checked:after:-translate-x-full" />
                </label>
            </div>

            {paymentMethods.enabled && (
                <div className="space-y-4">
                    {/* توضیح کلی */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                            توضیحات کلی (اختیاری)
                        </label>
                        <textarea
                            value={paymentMethods.description}
                            onChange={(e) => setPaymentMethods((prev: any) => ({ ...prev, description: e.target.value }))}
                            rows={2}
                            className="w-full bg-surface-container-lowest dark:bg-gray-800 border border-outline-variant dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-right resize-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                            placeholder="مثال: تمامی چک‌ها باید به نام شرکت صادر شود..."
                        />
                    </div>

                    {/* چکی */}
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">فروش چکی</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={paymentMethods.cheque.enabled}
                                    onChange={(e) => setPaymentMethods((prev: any) => ({
                                        ...prev,
                                        cheque: { ...prev.cheque, enabled: e.target.checked },
                                    }))}
                                />
                                <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 after:content-[''] after:absolute after:top-[3px] after:right-[3px] after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all after:shadow-sm peer-checked:bg-primary peer-checked:after:-translate-x-full" />
                            </label>
                        </div>
                        {paymentMethods.cheque.enabled && (
                            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                {/* توضیحات چکی */}
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400">توضیحات (اختیاری)</label>
                                    <textarea
                                        value={paymentMethods.cheque.description}
                                        onChange={(e) => setPaymentMethods((prev: any) => ({
                                            ...prev,
                                            cheque: { ...prev.cheque, description: e.target.value },
                                        }))}
                                        rows={2}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-right resize-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                        placeholder="مثلاً: چک‌ها باید به نام شرکت صادر شوند"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={addChequeOption}
                                        className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        افزودن گزینه
                                    </button>
                                </div>
                                {paymentMethods.cheque.options.map((opt, idx) => (
                                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400">قیمت چکی (تومان)</label>
                                            <NumberInput
                                                value={opt.price}
                                                onChange={(val) => {
                                                    const newOptions = [...paymentMethods.cheque.options];
                                                    newOptions[idx] = { ...newOptions[idx], price: val || 0 };
                                                    setPaymentMethods((prev: any) => ({
                                                        ...prev,
                                                        cheque: { ...prev.cheque, options: newOptions },
                                                    }));
                                                }}
                                                unit="تومان"
                                                className="h-9 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 text-sm font-mono text-right"
                                            />
                                        </div>
                                        <div className="flex items-end gap-1">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400">مدت (روز)</label>
                                                <NumberInput
                                                    value={opt.days}
                                                    onChange={(val) => {
                                                        const newOptions = [...paymentMethods.cheque.options];
                                                        newOptions[idx] = { ...newOptions[idx], days: val || 30 };
                                                        setPaymentMethods((prev: any) => ({
                                                            ...prev,
                                                            cheque: { ...prev.cheque, options: newOptions },
                                                        }));
                                                    }}
                                                    unit="روز"
                                                    className="h-9 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 text-sm font-mono text-right"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeChequeOption(idx)}
                                                className="h-9 px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* اقساطی */}
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">فروش اقساطی</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={paymentMethods.installment.enabled}
                                    onChange={(e) => setPaymentMethods((prev: any) => ({
                                        ...prev,
                                        installment: { ...prev.installment, enabled: e.target.checked },
                                    }))}
                                />
                                <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 after:content-[''] after:absolute after:top-[3px] after:right-[3px] after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all after:shadow-sm peer-checked:bg-primary peer-checked:after:-translate-x-full" />
                            </label>
                        </div>
                        {paymentMethods.installment.enabled && (
                            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                {/* توضیحات اقساطی */}
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400">توضیحات (اختیاری)</label>
                                    <textarea
                                        value={paymentMethods.installment.description}
                                        onChange={(e) => setPaymentMethods((prev: any) => ({
                                            ...prev,
                                            installment: { ...prev.installment, description: e.target.value },
                                        }))}
                                        rows={2}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-right resize-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                        placeholder="مثلاً: اقساط هر ماه پرداخت می‌شود"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={addInstallmentOption}
                                        className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        افزودن گزینه
                                    </button>
                                </div>
                                {paymentMethods.installment.options.map((opt, idx) => (
                                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400">قیمت اقساطی (تومان)</label>
                                            <NumberInput
                                                value={opt.price}
                                                onChange={(val) => {
                                                    const newOptions = [...paymentMethods.installment.options];
                                                    newOptions[idx] = { ...newOptions[idx], price: val || 0 };
                                                    setPaymentMethods((prev: any) => ({
                                                        ...prev,
                                                        installment: { ...prev.installment, options: newOptions },
                                                    }));
                                                }}
                                                unit="تومان"
                                                className="h-9 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 text-sm font-mono text-right"
                                            />
                                        </div>
                                        <div className="flex items-end gap-1">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500 dark:text-gray-400">تعداد اقساط (ماه)</label>
                                                <NumberInput
                                                    value={opt.months}
                                                    onChange={(val) => {
                                                        const newOptions = [...paymentMethods.installment.options];
                                                        newOptions[idx] = { ...newOptions[idx], months: val || 6 };
                                                        setPaymentMethods((prev: any) => ({
                                                            ...prev,
                                                            installment: { ...prev.installment, options: newOptions },
                                                        }));
                                                    }}
                                                    unit="ماه"
                                                    className="h-9 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 text-sm font-mono text-right"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeInstallmentOption(idx)}
                                                className="h-9 px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-500 dark:text-gray-400">درصد پیش‌پرداخت</label>
                                            <NumberInput
                                                value={opt.prepaymentPercent}
                                                onChange={(val) => {
                                                    const newOptions = [...paymentMethods.installment.options];
                                                    newOptions[idx] = { ...newOptions[idx], prepaymentPercent: val || 30 };
                                                    setPaymentMethods((prev: any) => ({
                                                        ...prev,
                                                        installment: { ...prev.installment, options: newOptions },
                                                    }));
                                                }}
                                                unit="٪"
                                                className="h-9 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 text-sm font-mono text-right"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}