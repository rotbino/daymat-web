// app/ad/form/AdFormHeader.tsx
// ✅ هدر چسبان ویزارد — بستن + عنوان + شمارندهٔ مرحله + بج نوع فروش

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useAdForm } from './AdFormStore';
import { TOTAL_STEPS } from './constants';

export function AdFormHeader() {
    const router = useRouter();
    const { currentStep, isEditMode, isWholesale } = useAdForm();

    return (
        <header className="sticky top-0 z-40 bg-white/85 dark:bg-gray-950/85 backdrop-blur border-b border-outline-variant/20">
            <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
                <button onClick={() => router.back()} aria-label="بستن"
                        className="p-2 -m-1 rounded-full hover:bg-surface-container-high text-on-surface-variant">
                    <X className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-extrabold text-on-surface truncate leading-5">
                        {isEditMode ? 'ویرایش کالا' : 'افزودن محصول'}
                    </h1>
                    <p className="text-[10px] text-on-surface-variant/70 tabular-nums">
                        مرحله {currentStep.toLocaleString('fa-IR')} از {TOTAL_STEPS.toLocaleString('fa-IR')}
                    </p>
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2.5 py-1 flex-shrink-0">
                    {isWholesale ? 'عمده‌فروشی' : 'تک‌فروشی'}
                </span>
            </div>
        </header>
    );
}
