// app/my-catalogs/components/UpdatePriceModal.tsx
// ✅ مودال آپدیت سریع قیمت — یادآوری «اعتبار قیمت» تمام شده به فروشنده می‌رسد
//    قیمت تازه ثبت می‌شود، priceUpdatedAt/expiresAt از نو شروع می‌شود و آگهی در بازار می‌ماند
'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp, X, Info } from 'lucide-react';
import { NumberInput } from '@/components/common/NumberInput';
import { useBulkUpdateAd } from '@/lib/api/apiHooks';
import { fmt } from '../constants';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    ad: any;
    onSuccess?: () => void;
}

export default function UpdatePriceModal({ isOpen, onClose, ad, onSuccess }: Props) {
    const [newPrice, setNewPrice] = useState<number>(0);
    const bulkMut = useBulkUpdateAd();

    useEffect(() => {
        if (isOpen && ad) setNewPrice(ad.unitPrice || 0);
    }, [isOpen, ad]);

    if (!isOpen || !ad) return null;

    const unit = ad.unit?.title || ad.unit?.shortCode || '';
    const validityHours: number = ad.validityHours ?? 0;
    const changed = newPrice !== (ad.unitPrice || 0);

    const handleSubmit = async () => {
        if (!newPrice || newPrice <= 0) return;
        try {
            await bulkMut.mutateAsync({
                updates: [{ id: ad.id, unitPrice: newPrice }],
            });
            onSuccess?.();
            onClose();
        } catch {
            // toast در هوک هندل می‌شود
        }
    };

    return (
        <div
            className="fixed inset-0 z-[96] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
            onClick={() => !bulkMut.isPending && onClose()}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                    max-h-[90dvh] flex flex-col overflow-hidden
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            >
                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <TrendingUp className="w-4.5 h-4.5 text-red-600 dark:text-red-400" />
                        </span>
                        <div>
                            <h3 className="text-sm font-extrabold text-on-surface">آپدیت قیمت</h3>
                            <p className="text-[10px] text-on-surface-variant/70 truncate max-w-[220px]">
                                {ad.productType || ad.title}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={bulkMut.isPending}
                        aria-label="بستن"
                        className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* بدنه */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4 space-y-4">
                    <div className="rounded-xl bg-surface-container-low/60 border border-outline-variant/30 p-3 flex items-center justify-between">
                        <span className="text-[11px] text-on-surface-variant font-bold">قیمت فعلی</span>
                        <span className="text-sm font-extrabold text-on-surface">
                            {fmt(ad.unitPrice)} <span className="text-[9px] font-normal text-on-surface-variant">تومان/{unit}</span>
                        </span>
                    </div>

                    <section className="space-y-2">
                        <label className="text-xs font-bold text-on-surface">قیمت جدید (تومان/{unit})</label>
                        <NumberInput
                            value={newPrice || undefined}
                            onChange={(v) => setNewPrice(v || 0)}
                            unit="تومان"
                            className="w-full h-14 font-extrabold"
                        />
                    </section>

                    <div className="rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-200/50 dark:border-blue-800/40 p-3 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-blue-800 dark:text-blue-300 leading-5">
                            با ثبت قیمت تازه، اعتبار قیمت از نو شروع می‌شود
                            {validityHours > 0
                                ? ` (${validityHours >= 24 ? `${validityHours / 24} روز` : `${validityHours} ساعت`} دیگر)`
                                : ' (این آگهی بدون مهلت است)'}
                            — آگهی همچنان روی تابلوی بازار دیده می‌شود.
                        </p>
                    </div>
                </div>

                {/* فوتر */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20 flex items-center gap-2">
                    <button
                        onClick={onClose}
                        disabled={bulkMut.isPending}
                        className="h-11 px-4 rounded-lg border border-outline-variant/60 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={bulkMut.isPending || !newPrice || !changed}
                        className="flex-1 h-11 rounded-lg bg-red-600 text-white text-sm font-extrabold
                            hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                        {bulkMut.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <TrendingUp className="w-4 h-4" />
                        )}
                        ثبت قیمت جدید
                    </button>
                </div>
            </div>
        </div>
    );
}
