// app/admin/arm/components/PaymentSection.tsx
'use client';

import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue, Control, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Lock, Edit2, CreditCard, Info, Wallet, Banknote, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentSectionProps {
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    control: Control<any>;
    isAdmin?: boolean;
}

const GATEWAY_NAMES: Record<string, string> = {
    pec: 'پارسیان',
    zarinpal: 'زرین‌پال',
    rayanpay: 'رایان‌پی',
};

export function PaymentSection({ register, errors, watch, setValue, control, isAdmin = false }: PaymentSectionProps) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'config.payment.gateways',
    });

    const armAdminPermission = watch('config.armAdminPermission') || {};
    const paymentAccess = armAdminPermission.payment || {};

    const canEdit = isAdmin || paymentAccess.canEdit === true;
    const isOwner = !isAdmin;

    const paymentMode = watch('config.payment.paymentMode');
    const manualEnabled = watch('config.payment.manual.enabled');
    const gateways = watch('config.payment.gateways') || [];

    const handlePinChange = (index: number, value: string) => {
        setValue(`config.payment.gateways.${index}.pin`, value, { shouldDirty: true });
    };

    const handleManualChange = (field: string, value: string) => {
        setValue(`config.payment.manual.${field}`, value, { shouldDirty: true });
    };

    // ============================================================
    // 👑 مدیر سیستم - نمایش کامل
    // ============================================================
    if (isAdmin) {
        return (
            <div className="space-y-4 bg-surface-container-low p-6 border border-outline-variant rounded-xl">
                <h3 className="text-lg font-semibold">تنظیمات پرداخت</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="font-label-md text-label-md text-on-surface-variant block">
                            حالت پرداخت
                        </label>
                        <select
                            {...register('config.payment.paymentMode')}
                            className="w-full bg-surface-container-lowest border border-outline h-12 px-4 font-body-md text-right appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        >
                            <option value="online_only">فقط آنلاین</option>
                            <option value="manual_only">فقط کارت به کارت (فیشی)</option>
                            <option value="both">هر دو</option>
                        </select>
                    </div>

                    {(paymentMode === 'online_only' || paymentMode === 'both') && (
                        <div className="space-y-2">
                            <label className="font-label-md text-label-md text-on-surface-variant block">
                                درگاه پیش‌فرض
                            </label>
                            <select
                                {...register('config.payment.defaultGateway')}
                                className="w-full bg-surface-container-lowest border border-outline h-12 px-4 font-body-md text-right appearance-none focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                            >
                                <option value="pec">پارسیان</option>
                                <option value="zarinpal">زرین‌پال</option>
                                <option value="rayanpay">رایان‌پی</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* درگاه‌های آنلاین */}
                {(paymentMode === 'online_only' || paymentMode === 'both') && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-on-surface-variant">درگاه‌های آنلاین</h4>
                        <div className="space-y-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2 p-3 border border-outline-variant bg-surface-container-lowest rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-error hover:bg-error/10 p-1 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <input
                                            {...register(`config.payment.gateways.${index}.name`)}
                                            placeholder="نام درگاه"
                                            className="bg-surface-container-lowest border border-outline px-2 py-1 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                                        />
                                        <input
                                            {...register(`config.payment.gateways.${index}.pin`)}
                                            placeholder="PIN یا Merchant ID"
                                            className="bg-surface-container-lowest border border-outline px-2 py-1 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded font-mono"
                                        />
                                        <input
                                            {...register(`config.payment.gateways.${index}.callbackUrl`)}
                                            placeholder="آدرس بازگشت"
                                            className="bg-surface-container-lowest border border-outline px-2 py-1 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                                        />
                                        <label className="flex items-center gap-1 text-sm">
                                            <input
                                                type="checkbox"
                                                {...register(`config.payment.gateways.${index}.sandbox`)}
                                                className="w-4 h-4"
                                            />
                                            حالت تست
                                        </label>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => append({ name: '', pin: '', callbackUrl: '', sandbox: true })}
                                className="flex items-center gap-2 text-primary hover:bg-primary/10 px-3 py-2 transition-colors rounded"
                            >
                                <Plus className="w-4 h-4" />
                                افزودن درگاه
                            </button>
                        </div>
                    </div>
                )}

                {/* پرداخت دستی (فیشی) */}
                {(paymentMode === 'manual_only' || paymentMode === 'both') && (
                    <div className="space-y-3 border-t border-outline-variant pt-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                {...register('config.payment.manual.enabled')}
                                id="manualEnabled"
                                className="w-4 h-4"
                            />
                            <label htmlFor="manualEnabled" className="font-semibold text-sm">
                                فعال بودن پرداخت کارت به کارت (فیشی)
                            </label>
                        </div>

                        {manualEnabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                    {...register('config.payment.manual.cardNumber')}
                                    placeholder="شماره کارت"
                                    className="bg-surface-container-lowest border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                                />
                                <input
                                    {...register('config.payment.manual.shebaNumber')}
                                    placeholder="شماره شبا"
                                    className="bg-surface-container-lowest border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                                />
                                <input
                                    {...register('config.payment.manual.accountOwner')}
                                    placeholder="نام صاحب حساب"
                                    className="bg-surface-container-lowest border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                                />
                                <input
                                    {...register('config.payment.manual.bankName')}
                                    placeholder="نام بانک"
                                    className="bg-surface-container-lowest border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                                />
                                <div className="md:col-span-2">
                                    <textarea
                                        {...register('config.payment.manual.instructions')}
                                        placeholder="توضیحات برای کاربر (متن راهنما)"
                                        rows={2}
                                        className="w-full bg-surface-container-lowest border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* حساب تسویه */}
                <div className="border-t border-outline-variant pt-4">
                    <h4 className="font-semibold text-sm text-on-surface-variant mb-3">حساب تسویه</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-on-surface-variant/60 block mb-0.5">نوع حساب</label>
                            <select
                                {...register('config.payment.settlementAccount.type')}
                                className="w-full bg-surface-container-lowest border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                            >
                                <option value="bank_card">شماره کارت</option>
                                <option value="sheba">شماره شبا</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-on-surface-variant/60 block mb-0.5">مقدار</label>
                            <input
                                {...register('config.payment.settlementAccount.value')}
                                placeholder="شماره حساب تسویه"
                                className="w-full bg-surface-container-lowest border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // 👤 مالک بازار - فقط کارت به کارت
    // ============================================================
    return (
        <div className="space-y-4 bg-surface-container-low p-6 border border-outline-variant rounded-xl">
            {/* ⭐ هدر */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">تنظیمات پرداخت</h3>
                    <p className="text-xs text-on-surface-variant/60">
                        اطلاعات حساب بانکی خود را برای دریافت فیش‌های واریزی وارد کنید
                    </p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="text-[10px]">قابل ویرایش</span>
                </div>
            </div>

            {/* ⭐ راهنما */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-300">
                    درآمد بازار، مستقیماً به حساب مدیر بازار واریز می‌شود.
                </p>
            </div>

            {/* ═══════════════ کارت به کارت (فیشی) ═══════════════ */}
            <div className="space-y-3 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl p-4">
                <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-semibold text-sm text-on-surface">شماره کارت خود را وارد کنید
                    </h4>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-on-surface-variant/60 block mb-0.5">شماره کارت</label>
                        <input
                            value={watch('config.payment.manual.cardNumber') || ''}
                            onChange={(e) => handleManualChange('cardNumber', e.target.value)}
                            placeholder="شماره کارت"
                            className="w-full bg-white dark:bg-gray-800 border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-on-surface-variant/60 block mb-0.5">شماره شبا</label>
                        <input
                            value={watch('config.payment.manual.shebaNumber') || ''}
                            onChange={(e) => handleManualChange('shebaNumber', e.target.value)}
                            placeholder="شماره شبا"
                            className="w-full bg-white dark:bg-gray-800 border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-on-surface-variant/60 block mb-0.5">نام صاحب حساب</label>
                        <input
                            value={watch('config.payment.manual.accountOwner') || ''}
                            onChange={(e) => handleManualChange('accountOwner', e.target.value)}
                            placeholder="نام صاحب حساب"
                            className="w-full bg-white dark:bg-gray-800 border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-on-surface-variant/60 block mb-0.5">نام بانک</label>
                        <input
                            value={watch('config.payment.manual.bankName') || ''}
                            onChange={(e) => handleManualChange('bankName', e.target.value)}
                            placeholder="نام بانک"
                            className="w-full bg-white dark:bg-gray-800 border border-outline px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded"
                        />
                    </div>
                </div>
            </div>

            {/* ═══════════════ درگاه آنلاین - به زودی ═══════════════ */}
            <div className="space-y-3 border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 rounded-xl p-4 opacity-60">
                <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <h4 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
                        درگاه آنلاین
                    </h4>
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        به زودی
                    </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 pr-7">
                  امکان پرداخت آنلاین به زودی برای بازار شما فعال می شود.
                </p>
            </div>
        </div>
    );
}