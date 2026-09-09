// app/ad/form/StepReview.tsx
// ✅ مرحله ۴: بررسی نهایی — خلاصهٔ کامل آگهی + دکمه‌های ویرایش هر بخش با نام واقعی

'use client';

import React from 'react';
import { Check, Package, Tag } from 'lucide-react';
import { useAdForm } from './AdFormStore';
import { CURRENCY, CHEQUE_TERMS, STEP_TITLES } from './constants';

export function StepReview() {
    const {
        isWholesale, formData, selectedProduct, selectedCatalog, unitName, baseUnitTitle,
        uploadedCount, liveProfit, payment, goToStep,
    } = useAdForm();

    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-emerald-500 grid place-items-center shadow-sm shadow-emerald-500/30">
                    <Check className="w-5 h-5 text-white" />
                </span>
                <div>
                    <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">بررسی نهایی</h3>
                    <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70">پس از تأیید، کالا روی کاتالوگت منتشر می‌شود.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 shadow-sm overflow-hidden">
                {/* کارت کالا */}
                <div className="flex items-center gap-3 p-4 border-b border-outline-variant/20 bg-surface-container-low/40">
                    {selectedProduct?.thumbnailUrl || selectedProduct?.imageUrl ? (
                        <img src={(selectedProduct.thumbnailUrl || selectedProduct.imageUrl) as string} alt="" className="w-14 h-14 rounded-xl object-cover ring-1 ring-outline-variant/40 flex-shrink-0" />
                    ) : (
                        <span className="w-14 h-14 rounded-xl bg-primary/10 grid place-items-center flex-shrink-0">
                            <Package className="w-6 h-6 text-primary" />
                        </span>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-on-surface truncate">{formData.productType || selectedProduct?.title}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {selectedProduct?.brandTitle && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.07] border border-primary/15 px-2 py-0.5">
                                    <Tag className="w-2.5 h-2.5 text-primary" />
                                    <span className="text-[9px] font-bold text-primary">{selectedProduct.brandTitle}</span>
                                </span>
                            )}
                            <span className="text-[9px] font-bold text-on-surface-variant bg-surface-container-high rounded-full px-2 py-0.5">
                                {formData.unitTitle || unitName}{formData.unitQty ? ' (' + formData.unitQty.toLocaleString('fa-IR') + ' ' + baseUnitTitle + ')' : ''}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="px-4 pb-4 pt-3 space-y-2.5">
                    <div className="flex justify-between text-xs"><span className="text-on-surface-variant">کاتالوگ</span><span className="font-medium text-on-surface">{selectedCatalog.name}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-on-surface-variant">تصاویر</span><span className="font-medium text-on-surface">{uploadedCount.toLocaleString('fa-IR')} عدد</span></div>
                    <div className="flex justify-between text-xs">
                        <span className="text-on-surface-variant">{isWholesale ? 'حداقل حجم' : 'موجودی'}</span>
                        <span className="font-medium text-on-surface">{(isWholesale ? formData.minQuantity : formData.availableQuantity).toLocaleString('fa-IR')} {unitName}</span>
                    </div>
                    <div className="flex justify-between text-xs items-center">
                        <span className="text-on-surface-variant">{isWholesale ? 'قیمت عمده (نقدی)' : 'قیمت (نقدی)'}</span>
                        <span className="font-extrabold text-primary text-sm tabular-nums">{formData.unitPrice.toLocaleString('fa-IR')} {CURRENCY}</span>
                    </div>
                    {isWholesale && formData.singleUnitPrice > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">قیمت تکی</span>
                            <span className="font-medium text-on-surface tabular-nums">{formData.singleUnitPrice.toLocaleString('fa-IR')} {CURRENCY} / {baseUnitTitle}</span>
                        </div>
                    )}
                    {formData.consumerPrice > 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">قیمت مصرف‌کننده</span>
                            <span className="font-medium text-on-surface tabular-nums">{formData.consumerPrice.toLocaleString('fa-IR')} {CURRENCY}</span>
                        </div>
                    )}
                    {liveProfit !== null && liveProfit >= 0 && (
                        <div className="flex justify-between text-xs">
                            <span className="text-on-surface-variant">سود خریدار عمده</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{liveProfit.toLocaleString('fa-IR')} {CURRENCY}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xs">
                        <span className="text-on-surface-variant">شرایط پرداخت</span>
                        <span className="font-medium text-on-surface text-left">
                            {payment.chequeOn && payment.terms.length > 0
                                ? 'نقدی + چک ' + payment.terms.map((t) => {
                                    const lbl = CHEQUE_TERMS.find((c) => c.days === t.days)?.label || t.days + ' روزه';
                                    return t.price > 0 ? `${lbl} (${t.price.toLocaleString('fa-IR')})` : lbl;
                                }).join('، ')
                                : 'نقدی'}
                        </span>
                    </div>
                    {isWholesale && formData.volumeTiers.length > 0 && (
                        <div className="flex justify-between text-xs"><span className="text-on-surface-variant">تخفیف حجمی</span><span className="font-medium text-on-surface">{formData.volumeTiers.length.toLocaleString('fa-IR')} پله</span></div>
                    )}
                    {formData.giftPrice > 0 && (
                        <div className="flex justify-between text-xs"><span className="text-on-surface-variant">قیمت اشانتیون</span><span className="font-medium text-on-surface">{formData.giftPrice.toLocaleString('fa-IR')} {CURRENCY}</span></div>
                    )}
                    <div className="flex justify-between text-xs"><span className="text-on-surface-variant">محل</span><span className="font-medium text-on-surface">{formData.cityLabel || '—'}</span></div>
                    {formData.description.trim() && (
                        <div className="pt-1">
                            <p className="text-[10px] font-bold text-on-surface-variant mb-1">نکات فروش</p>
                            <p className="text-[11px] text-on-surface-variant/80 bg-surface-container-low/60 rounded-lg px-3 py-2 leading-5 whitespace-pre-wrap">{formData.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ ویرایش بخش‌ها با نام واقعی — نه «بخش ۱/۲/۳» */}
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((s) => (
                    <button key={s} type="button" onClick={() => goToStep(s)}
                            className="h-9 rounded-xl border border-outline-variant/40 text-[11px] font-bold
                                text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors">
                        ویرایش {STEP_TITLES[s - 1]}
                    </button>
                ))}
            </div>
        </div>
    );
}
