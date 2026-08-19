// app/ad/components/CopyAdModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { NumberInput } from "@/components/common";
import { useCreateAd } from '@/lib/api/apiHooks';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';

interface CopyAdModalProps {
    isOpen: boolean;
    onClose: () => void;
    ad: any;
    onSuccess?: () => void;
}

export function CopyAdModal({ isOpen, onClose, ad, onSuccess }: CopyAdModalProps) {
    const [unitPrice, setUnitPrice] = useState(ad.unitPrice || 0);
    const [minQuantity, setMinQuantity] = useState(ad.minQuantity || 1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { currentSlug } = useSelector((state: RootState) => state.arm);
    const createAdMutation = useCreateAd();

    if (!isOpen || !ad) return null;

    const handleSubmit = async () => {
        if (unitPrice <= 0) {
            toast.error('قیمت را وارد کنید');
            return;
        }
        if (minQuantity <= 0) {
            toast.error('حداقل حجم را وارد کنید');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = {
                armSlug: currentSlug || 'barton',
                categoryId: ad.categoryId,
                customCategoryId: ad.customCategoryId,
                unitId: ad.unitId,
                title: ad.title,
                productType: ad.productType,
                unitPrice: unitPrice,
                minQuantity: minQuantity,
                availableQuantity: ad.availableQuantity,
                city: ad.city,
                cityCode: ad.cityCode,
                provinceCode: ad.provinceCode,
                validityHours: ad.validityHours || 24,
                isAnonymous: ad.isAnonymous,
                isBumped: false,
                description: ad.description,
                paymentMethods: ad.paymentMethods,
                specs: ad.specs,
            };
            await createAdMutation.mutateAsync(data);
            toast.success('آگهی با موفقیت کپی و ثبت شد');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در کپی آگهی');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">کپی آگهی</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        با کپی کردن این آگهی، یک آگهی جدید با همان مشخصات (به جز قیمت و حداقل حجم) ایجاد می‌شود.
                    </p>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                قیمت (تومان)
                            </label>
                            <NumberInput
                                value={unitPrice}
                                onChange={(val) => setUnitPrice(val || 0)}
                                unit="تومان"
                                className="h-10 bg-surface-container-lowest border border-gray-200 dark:border-gray-700 rounded-lg px-3 text-sm font-mono text-right"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                حداقل حجم
                            </label>
                            <NumberInput
                                value={minQuantity}
                                onChange={(val) => setMinQuantity(val || 1)}
                                unit={ad.unit?.shortCode || 'تن'}
                                className="h-10 bg-surface-container-lowest border border-gray-200 dark:border-gray-700 rounded-lg px-3 text-sm font-mono text-right"
                            />
                        </div>
                    </div>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                    <button onClick={onClose} className="flex-1 h-10 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        انصراف
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 h-10 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isSubmitting ? 'در حال ثبت...' : 'کپی و ثبت'}
                    </button>
                </div>
            </div>
        </div>
    );
}