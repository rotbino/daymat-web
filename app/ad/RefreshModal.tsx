// components/ad/RefreshModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Construction, Lock, TrendingUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useExtendAd, useBumpAd } from '@/lib/api/apiHooks';
import { cn } from '@/lib/utils';

interface RefreshModalProps {
    isOpen: boolean;
    onClose: () => void;
    ad: {
        id: string;
        title: string;
        unitPrice: number;
        unit?: { title: string; shortCode: string };
        minQuantity: number;
        expiresAt: string;
        isBumped?: boolean;
        bumpExpiresAt?: string; // ✅ اضافه شد
    };
    onSuccess?: () => void;
}

export function RefreshModal({ isOpen, onClose, ad, onSuccess }: RefreshModalProps) {
    const [validityHours, setValidityHours] = useState('1');
    const [isBumped, setIsBumped] = useState(false);

    // خواندن bumpCost از تنظیمات بازار
    const armConfig = useSelector((state: RootState) => state.arm.currentArm?.config) as any || {};
    const bumpCost = armConfig?.economy?.bumpCost || 10;

    const extendAdMutation = useExtendAd();
    const bumpAdMutation = useBumpAd();

    if (!isOpen) return null;

    const validityOptions = [
        { value: '1', label: '۱ روز' },
        { value: '2', label: '۲ روز' },
        { value: '3', label: '۳ روز' },
    ];

    // بررسی اینکه آیا آگهی از قبل نردبان دارد
    const alreadyBumped = ad.isBumped === true;

    // فرمت‌دهی تاریخ و ساعت پایان نردبان (در صورت وجود)
    const bumpExpiresAt = ad.bumpExpiresAt ? new Date(ad.bumpExpiresAt) : null;
    const bumpExpiresAtLabel = bumpExpiresAt
        ? `${bumpExpiresAt.toLocaleDateString('fa-IR')} ساعت ${bumpExpiresAt.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
        : null;

    const handleConfirm = async () => {
        try {
            // تمدید آگهی با همان قیمت
            await extendAdMutation.mutateAsync({
                id: ad.id,
                validityHours: parseInt(validityHours),
            });

            // اگر نردبان هم فعال بود و قبلاً نردبان نداشته
            if (isBumped && !alreadyBumped) {
                try {
                    await bumpAdMutation.mutateAsync(ad.id);
                } catch (bumpError: any) {
                    if (bumpError?.data?.errorCode === 'INSUFFICIENT_CREDIT') {
                        toast.warning(`اعتبار کافی برای نردبان نیست. نیاز به ${bumpCost} اعتبار دارید.`);
                    } else {
                        toast.warning('آگهی تمدید شد اما نردبان انجام نشد');
                    }
                }
            }

            toast.success('آگهی با موفقیت تمدید شد');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در تمدید آگهی');
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl border border-outline-variant/20 dark:border-gray-800 shadow-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/20 dark:border-gray-800">
                    <div>
                        <h3 className="text-[10px] font-bold text-primary dark:text-primary-400">تمدید سریع قیمت قبلی و صعود به بالای لیست</h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-on-surface-variant dark:text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-3.5">
                    {/* Product Identity */}
                    <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
                        <Construction className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm text-on-surface dark:text-gray-100 truncate">
                            {ad.title}
                        </span>
                        <span className="text-xs text-primary dark:text-primary-400 font-bold mr-auto">
                            {ad.unitPrice.toLocaleString()} تومان
                        </span>
                    </div>

                    <div className="flex flex-col gap-3.5">
                        {/* Validity Selection - Three buttons */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400">مدت اعتبار</label>
                            <div className="grid grid-cols-3 gap-2">
                                {validityOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setValidityHours(opt.value)}
                                        className={cn(
                                            "py-2 rounded-lg text-sm font-medium border-2 transition-all",
                                            validityHours === opt.value
                                                ? "border-primary bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-400"
                                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/30"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bump Section - نمایش تاریخ و ساعت نردبان در صورت وجود */}
                        {alreadyBumped ? (
                            <div className="flex items-start gap-2 p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-sm font-medium text-green-700 dark:text-green-300">نردبان فعال است</span>
                                    {bumpExpiresAtLabel && (
                                        <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-0.5">
                                            تا تاریخ <span className="font-medium">{bumpExpiresAtLabel}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <label className="flex items-center gap-2 p-2.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isBumped}
                                    onChange={(e) => setIsBumped(e.target.checked)}
                                    className="w-4 h-5 max-w-5 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary focus:ring-2 shrink-0"
                                />
                                <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="text-sm font-medium text-primary dark:text-primary-400">
                                    نردبان (مصرف {bumpCost} اعتبار)
                                </span>
                            </label>
                        )}

                        {/* Other Specifications - جمع‌وجور شده */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50">
                                <span className="text-[11px] font-medium text-on-surface-variant dark:text-gray-400">سایر مشخصات</span>
                                <Lock className="w-3 h-3 text-on-surface-variant/60 dark:text-gray-500" />
                            </div>
                            <div className="px-3 py-2 bg-white dark:bg-gray-900">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-on-surface-variant dark:text-gray-400">حداقل خرید</span>
                                    <span className="font-medium text-on-surface dark:text-gray-200">
                                        {ad.minQuantity} {ad.unit?.shortCode || 'تن'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs mt-1">
                                    <span className="text-on-surface-variant dark:text-gray-400">اعتبار فعلی</span>
                                    <span className="font-medium text-on-surface dark:text-gray-200">
                                        {Math.ceil((new Date(ad.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} روز
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - دو دکمه کنار هم */}
                <div className="px-4 py-3.5 border-t border-outline-variant/20 dark:border-gray-800 flex items-center gap-2.5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs text-on-surface-variant dark:text-gray-400 hover:text-on-surface dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium flex-shrink-0"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={extendAdMutation.isPending}
                        className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm shadow-primary/20 text-sm"
                    >
                        {extendAdMutation.isPending ? 'در حال آپدیت...' : 'آپدیت و انتشار'}
                    </button>
                </div>
            </div>
        </div>
    );
}