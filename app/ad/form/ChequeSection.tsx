// app/ad/form/ChequeSection.tsx
// ✅ شرایط پرداخت — چک با سررسید آزاد: چیپ‌های قالبی میان‌بر + روزِ هر ردیف قابل ویرایش + «سررسید دلخواه»
//    مبلغ و روزِ هر چک جدا هستند؛ خالی‌گذاشتن مبلغ = همان قیمت نقدی

'use client';

import React from 'react';
import { Banknote, CalendarPlus, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberInput } from '@/components/common/NumberInput';
import { useAdForm } from './AdFormStore';
import { SectionTitle } from './ui-bits';
import { CURRENCY, CHEQUE_TERMS } from './constants';

export function ChequeSection() {
    const { payment, setChequeOn, toggleChequeTerm, addTerm, updateTermAt, setChequeNote, unitName, formData } = useAdForm();

    return (
        <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
            <SectionTitle icon={Banknote} text="شرایط پرداخت" />
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-container-high/60 border border-outline-variant/25">
                <button type="button" onClick={() => setChequeOn(false)}
                        className={cn('flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold transition-all',
                            !payment.chequeOn ? 'bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/25' : 'text-on-surface-variant hover:text-on-surface')}>
                    <Zap className="w-3.5 h-3.5" /> فقط نقدی
                </button>
                <button type="button" onClick={() => setChequeOn(true)}
                        className={cn('flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-bold transition-all',
                            payment.chequeOn ? 'bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/25' : 'text-on-surface-variant hover:text-on-surface')}>
                    <Banknote className="w-3.5 h-3.5" /> چک هم قبول می‌کنم
                </button>
            </div>
            {payment.chequeOn && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                    <p className="text-[10px] text-on-surface-variant/70 leading-4">
                        سررسید چک‌هایی که قبول می‌کنی رو انتخاب کن — روز و قیمت هر کدوم جداست و قابل تغییره (از ۲ روزه تا چند ماهه).
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {CHEQUE_TERMS.map((t) => {
                            const on = payment.terms.some((x) => x.days === t.days);
                            return (
                                <button key={t.days} type="button" onClick={() => toggleChequeTerm(t.days)}
                                        className={cn('h-8 px-3 rounded-full text-[11px] font-bold border transition-colors',
                                            on ? 'bg-primary border-primary text-on-primary shadow-sm shadow-primary/25' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/45 hover:text-primary')}>
                                    چک {t.label}
                                </button>
                            );
                        })}
                        <button type="button" onClick={() => addTerm(45)}
                                className="h-8 px-3 rounded-full text-[11px] font-bold border border-dashed border-primary/50 text-primary
                                    hover:bg-primary/[0.06] flex items-center gap-1 transition-colors">
                            <CalendarPlus className="w-3 h-3" /> سررسید دلخواه
                        </button>
                    </div>
                    {payment.terms.map((term, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-xl bg-primary/[0.04] border border-primary/15 px-3 py-2">
                            <NumberInput value={term.days || undefined}
                                         onChange={(v) => updateTermAt(idx, { days: v || 0 })}
                                         unit="روزه" className="h-9 w-[104px] flex-shrink-0" />
                            <NumberInput value={term.price || undefined}
                                         onChange={(v) => updateTermAt(idx, { price: v || 0 })}
                                         unit={`${CURRENCY}/${unitName}`}
                                         placeholder={formData.unitPrice ? formData.unitPrice.toLocaleString('fa-IR') : undefined}
                                         className="h-9 flex-1" />
                            <button type="button" onClick={() => updateTermAt(idx, null)}
                                    className="w-7 h-7 rounded-lg text-error hover:bg-error/10 flex items-center justify-center flex-shrink-0"
                                    title="حذف این سررسید">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    {payment.terms.length > 0 && (
                        <p className="text-[9px] text-on-surface-variant/50 -mt-1">
                            اگه قیمت چکی رو خالی بذاری، همون قیمت نقدی حساب می‌شه.
                        </p>
                    )}
                    <input type="text" value={payment.note}
                           onChange={(e) => setChequeNote(e.target.value)}
                           maxLength={120} placeholder="توضیح (اختیاری): مثلاً چک‌ها به نام شرکت باشد"
                           className="w-full h-10 px-3.5 text-xs text-right rounded-xl bg-surface-container-lowest border border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all" />
                </div>
            )}
        </section>
    );
}
