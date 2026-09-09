// app/ad/form/StepPricing.tsx
// ✅ مرحله ۲: قیمت — دو شکلی (عمده/تک) + چک + آکاردئون گزینه‌های پیشرفته

'use client';

import React from 'react';
import { AlertTriangle, ChevronDown, Gift, Info, TrendingUp, Wallet, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberInput } from '@/components/common/NumberInput';
import { useAdForm } from './AdFormStore';
import { ChequeSection } from './ChequeSection';
import { SectionTitle, StepBadge } from './ui-bits';
import { CURRENCY } from './constants';

export function StepPricing() {
    const {
        isWholesale, formData, patchForm, unitName, baseUnitTitle,
        handleSingleUnitPriceChange, handleUnitPriceChange, liveProfit,
        showAdvanced, toggleAdvanced, advancedActiveCount,
    } = useAdForm();

    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-primary/10 grid place-items-center flex-shrink-0">
                    <Wallet className="w-4 h-4 text-primary" />
                </span>
                <div>
                    <h3 className="text-sm font-bold text-on-surface">
                        {isWholesale ? 'تعیین قیمت عمده (نقدی)' : 'تعیین قیمت فروش (نقدی)'}
                    </h3>
                    <p className="text-[10px] text-on-surface-variant/70">
                        {isWholesale ? 'قیمت‌ها به تومان — برای هر واحد فروش' : 'قیمت برای هر واحد فروش'}
                    </p>
                </div>
            </div>

            {isWholesale ? (
                <>
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                        <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <StepBadge n={1} /> حداقل حجم فروش ({unitName}) <span className="text-error">*</span>
                        </label>
                        <NumberInput value={formData.minQuantity || undefined}
                                     onChange={(val) => patchForm({ minQuantity: val || 0 })}
                                     unit={unitName} className="w-full h-14 font-extrabold" />
                    </section>
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                        <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <StepBadge n={2} /> قیمت تکی (هر {baseUnitTitle}) <span className="text-error">*</span>
                        </label>
                        <p className="text-[10px] text-on-surface-variant/60">
                            قیمت عمده هر {baseUnitTitle} برای خرید {formData.minQuantity.toLocaleString('fa-IR')} {unitName}
                        </p>
                        <NumberInput value={formData.singleUnitPrice || undefined}
                                     onChange={handleSingleUnitPriceChange}
                                     unit={`${CURRENCY}/${baseUnitTitle}`} className="w-full h-12" />
                    </section>
                    <section className="rounded-2xl bg-surface-container-low/60 border border-primary/35 ring-1 ring-primary/10 p-4 space-y-2.5">
                        <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <StepBadge n={3} /> قیمت هر {unitName} (واحد فروش عمده) <span className="text-error">*</span>
                        </label>
                        <NumberInput value={formData.unitPrice || undefined}
                                     onChange={handleUnitPriceChange}
                                     unit={CURRENCY} className="w-full h-14 text-xl font-extrabold" />
                        {formData.singleUnitPrice > 0 && formData.unitQty && (
                            <div className="flex items-center gap-2 text-[11px] text-primary bg-primary/[0.05] border border-primary/15 rounded-lg px-3 py-2">
                                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>
                                    {formData.singleUnitPrice.toLocaleString('fa-IR')} × {formData.unitQty.toLocaleString('fa-IR')} {baseUnitTitle} = <b>{formData.unitPrice.toLocaleString('fa-IR')}</b> {CURRENCY}
                                </span>
                            </div>
                        )}
                    </section>
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                        <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <StepBadge n={4} /> موجودی تضمینی ({unitName}) <span className="text-error">*</span>
                        </label>
                        <NumberInput value={formData.availableQuantity || undefined}
                                     onChange={(val) => patchForm({ availableQuantity: val || 0 })}
                                     unit={unitName} className="w-full h-12" />
                    </section>

                    {/* ✅ شرایط پرداخت — چک (اختیاری، جمع‌وجور) — هم برای عمده هم تک */}
                    <ChequeSection />

                    {/* ✅ گزینه‌های بیشتر — آکاردئون برای کوتاه نگه‌داشتن فرم */}
                    <AdvancedAccordion />
                </>
            ) : (
                <>
                    <section className="rounded-2xl bg-surface-container-low/60 border border-primary/35 ring-1 ring-primary/10 p-4 space-y-2.5">
                        <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <StepBadge n={1} /> قیمت هر {unitName} <span className="text-error">*</span>
                        </label>
                        <NumberInput value={formData.unitPrice || undefined}
                                     onChange={(v) => patchForm({ unitPrice: v })}
                                     unit={CURRENCY} className="w-full h-14 text-xl font-extrabold" />
                    </section>
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                        <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <StepBadge n={2} /> موجودی ({unitName}) <span className="text-on-surface-variant/50 text-[10px]">(اختیاری)</span>
                        </label>
                        <NumberInput value={formData.availableQuantity || undefined}
                                     onChange={(val) => patchForm({ availableQuantity: val || 0 })}
                                     unit={unitName} className="w-full h-12" />
                    </section>
                    {/* ✅ شرایط پرداخت — چک در تک‌فروشی هم */}
                    <ChequeSection />
                </>
            )}
        </div>
    );
}

// ✅ آکاردئون گزینه‌های پیشرفته — قیمت مصرف‌کننده + تخفیف حجمی + اشانتیون
function AdvancedAccordion() {
    const {
        showAdvanced, toggleAdvanced, advancedActiveCount,
        formData, patchForm, baseUnitTitle, unitName, liveProfit,
    } = useAdForm();

    return (
        <div className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 overflow-hidden">
            <button type="button" onClick={toggleAdvanced}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-container-high/40 transition-colors">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    گزینه‌های بیشتر
                    <span className="text-[10px] font-medium text-on-surface-variant/60">(تخفیف حجمی، اشانتیون، قیمت مصرف‌کننده)</span>
                </span>
                <span className="flex items-center gap-2">
                    {advancedActiveCount > 0 && (
                        <span className="text-[9px] font-black text-primary bg-primary/10 rounded-full px-2 py-0.5 tabular-nums">
                            {advancedActiveCount.toLocaleString('fa-IR')} فعال
                        </span>
                    )}
                    <ChevronDown className={cn('w-4 h-4 text-on-surface-variant transition-transform duration-200', showAdvanced && 'rotate-180')} />
                </span>
            </button>
            {showAdvanced && (
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-outline-variant/15 animate-in fade-in duration-200">
                <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        قیمت تکی مصرف‌کننده
                    </label>
                    <p className="text-[10px] text-on-surface-variant/60">سود خریدار عمده از این محاسبه می‌شود</p>
                    <NumberInput value={formData.consumerPrice || undefined}
                                 onChange={(val) => patchForm({ consumerPrice: val || 0 })}
                                 unit={`${CURRENCY}/${baseUnitTitle}`} className="w-full h-12" />
                    {liveProfit !== null && (
                        liveProfit < 0
                            ? <div className="flex items-center gap-2 text-[11px] font-medium text-error bg-error/[0.06] border border-error/15 rounded-lg px-3 py-2"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /><span>قیمت مصرف‌کننده از قیمت عمده کمتر است!</span></div>
                            : <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-500/15 rounded-lg px-3 py-2"><TrendingUp className="w-3.5 h-3.5 flex-shrink-0" /><span>سود خریدار عمده از هر {baseUnitTitle}: <b>{liveProfit.toLocaleString('fa-IR')}</b> {CURRENCY}</span></div>
                    )}
                </section>

                {/* ✅ تخفیف حجمی */}
                <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <SectionTitle icon={Wallet} text="تخفیف حجمی" />
                        <button type="button"
                                onClick={() => patchForm({
                                    volumeTiers: [...formData.volumeTiers, { minQty: (formData.volumeTiers.at(-1)?.minQty ?? 0) + 5, price: 0 }],
                                })}
                                className="h-7 px-2.5 rounded-lg border border-primary/40 text-primary
                                    text-[10px] font-bold flex items-center gap-1 hover:bg-primary/10 transition-colors">
                            <Plus className="w-3 h-3" /> پلهٔ جدید
                        </button>
                    </div>
                    {formData.volumeTiers.map((tier, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-black grid place-items-center flex-shrink-0 tabular-nums" title={'خرید ' + (i + 2) + '+'}>
                                {(i + 2).toLocaleString('fa-IR')}
                            </span>
                            <NumberInput value={tier.minQty || undefined}
                                         onChange={(v) => {
                                             const u = [...formData.volumeTiers]; u[i] = { ...u[i], minQty: v || 0 }; patchForm({ volumeTiers: u });
                                         }}
                                         unit={unitName} className="h-9 flex-1" />
                            <span className="text-[10px] text-on-surface-variant/60 whitespace-nowrap">هر {baseUnitTitle}:</span>
                            <NumberInput value={tier.price || undefined}
                                         onChange={(v) => {
                                             const u = [...formData.volumeTiers]; u[i] = { ...u[i], price: v || 0 }; patchForm({ volumeTiers: u });
                                         }}
                                         unit={CURRENCY} className="h-9 flex-1" />
                            <button type="button"
                                    onClick={() => patchForm({ volumeTiers: formData.volumeTiers.filter((_, j) => j !== i) })}
                                    className="w-7 h-7 rounded-lg text-error hover:bg-error/10 flex items-center justify-center flex-shrink-0">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    {formData.volumeTiers.length === 0 && (
                        <p className="text-[10px] text-on-surface-variant/60 leading-5">
                            مثلاً: خرید ۵ کارتن، هر {baseUnitTitle} ۱۲۰ هزار تومان — برای مشتری‌های حجیم.
                        </p>
                    )}
                </section>

                {/* ✅ قیمت اشانتیون */}
                <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                    <SectionTitle icon={Gift} text="قیمت اشانتیون" />
                    <p className="text-[10px] text-on-surface-variant/60 -mt-1.5">برای کالاهایی که اشانتیون خرید دارند</p>
                    <NumberInput value={formData.giftPrice || undefined}
                                 onChange={(v) => patchForm({ giftPrice: v })}
                                 unit={`${CURRENCY}/${baseUnitTitle}`} className="w-full h-12" />
                </section>
            </div>
            )}
        </div>
    );
}
