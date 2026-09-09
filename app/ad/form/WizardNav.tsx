// app/ad/form/WizardNav.tsx
// ✅ ناوبری چسبان پایین — قبلی/بعدی/ثبت نهایی + نوار پیشرفت
// ✅ RTL: سمت راست = قبلی، سمت چپ = بعدی یا ثبت

'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAdForm } from './AdFormStore';
import { TOTAL_STEPS } from './constants';

export function WizardNav() {
    const { currentStep, nextStep, prevStep, submit, submitting, selectedProduct, isEditMode } = useAdForm();

    return (
        <div className="fixed bottom-0 inset-x-0 z-40">
            {/* نوار پیشرفت */}
            <div className="h-0.5 bg-outline-variant/20">
                <div className="h-full bg-primary transition-all duration-500"
                     style={{ width: ((currentStep / TOTAL_STEPS) * 100) + '%' }} />
            </div>
            <div className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-outline-variant/20">
                <div className="max-w-lg mx-auto px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
                    {/* سمت راست = قبلی */}
                    {currentStep > 1 ? (
                        <button type="button" onClick={prevStep}
                                className="h-11 px-5 rounded-xl border border-outline-variant/40 bg-white dark:bg-gray-900
                                    text-sm font-bold text-on-surface flex items-center gap-1.5 hover:bg-surface-container-low transition-all flex-shrink-0">
                            <ArrowRight className="w-4 h-4" /> قبلی
                        </button>
                    ) : null}
                    <div className="flex-1" />
                    {/* سمت چپ = بعدی یا ثبت */}
                    {currentStep < TOTAL_STEPS ? (
                        <button type="button" onClick={nextStep}
                                disabled={currentStep === 1 && !selectedProduct}
                                className="h-11 px-7 rounded-xl bg-primary text-on-primary text-sm font-bold flex items-center gap-2
                                    hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/25 dark:shadow-none
                                    disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100">
                            بعدی <ArrowLeft className="w-4 h-4" />
                        </button>
                    ) : (
                        <button type="button" onClick={submit} disabled={submitting}
                                className="h-11 px-7 rounded-xl bg-primary text-on-primary text-sm font-extrabold flex items-center gap-2
                                    hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/25 dark:shadow-none
                                    disabled:opacity-50 disabled:cursor-not-allowed">
                            {submitting
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> در حال ثبت…</>
                                : <><Check className="w-4 h-4" /> {isEditMode ? 'ذخیره تغییرات' : 'ثبت نهایی'}</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
