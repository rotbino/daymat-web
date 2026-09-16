// app/components/OfferSheet.tsx
// شیت مشترک ثبت/ویرایش پیشنهاد قیمت — هم صفحه عمومی بازوی خرید و هم تب «سرنخ‌های فروش»ی پنل فروش
// ✅ عنوان حرفه‌ای «پیشنهاد قیمت» (خواستهٔ مالک — «قیمتت رو بذار» غیرحرفه‌ای بود)
// ✅ واحد پیشنهاد قبل از قیمت — پیش‌انتخاب: همان واحد قلم (کارتن ← کارتن) + لیست وصل به مرجع واحد
//    و واحدهای منتخب بازو (UnitPicker مشترک) — جای مبنای گنگ «جمع کل»
// ✅ قیمت پیشنهادی/زمان تحویل — NumberInput حرفه‌ای (فرمت سه‌رقمی + واحد تومان/روز)
// ✅ مزیت خرید از شما — مزیت رقابتی فروشنده برای این خریدار
// ✅ ویرایش پیشنهاد ارسال‌شده — تا وقتی خریدار تصمیم نگرفته (پذیرش/رد) قابل ویرایش است
// ☎️ بدون ورود شماره: شمارهٔ تماس خودکار از موبایل ثبت‌نام پیشنهاددهنده پر می‌شود (قاعدهٔ مالک)
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, X, Loader2, Send, Phone, ListOrdered, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAddOffer, useUpdateOfferContent } from '@/lib/api/apiHooks';
import { faNum } from '@/app/inquiries/utils';
import { toastFormErrors } from '@/lib/formAlerts';
import UnitPicker, { UnitValue } from '@/app/components/UnitPicker';
import { NumberInput } from '@/components/common/NumberInput';

const WHOLE_LIST_TITLE = 'کل لیست';

export interface OfferSheetItem {
    id?: string;
    name: string;
    quantity?: number | null;
    unit?: string | null;
    unitId?: string | null;
}

/** پیشنهاد ارسال‌شدهٔ همین قلم — حالت ویرایش (فقط تا تصمیم خریدار) */
export interface OfferSheetExisting {
    id: string;
    price?: number | null;
    unitId?: string | null;
    unit?: string | null;
    priceBasis?: string | null; // پیشنهادهای قدیمی — فقط برای پیش‌فرض نمایش
    deliveryDays?: number | null;
    message?: string | null;
    advantages?: string | null;
}

const labelCls = 'mb-1 block text-[11px] font-extrabold text-stone-400';

export default function OfferSheet({ inquiry, item, existingOffer, onClose }: {
    inquiry: { id: string; units?: { unitId: string; title?: string }[] | null } | null;
    item: OfferSheetItem | null;
    existingOffer?: OfferSheetExisting | null;
    onClose: () => void;
}) {
    const addOffer = useAddOffer();
    const updateOffer = useUpdateOfferContent();
    const editing = !!existingOffer;

    const [price, setPrice] = useState<number | undefined>();
    const [unit, setUnit] = useState<UnitValue>({ id: null, title: '' });
    const [days, setDays] = useState<number | undefined>();
    const [advantages, setAdvantages] = useState('');
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [sending, setSending] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // پیش‌فرض‌ها هر بار باز شدن — واحد قلم، مبلغ/روز/متنِ پیشنهاد موجود در حالت ویرایش
    useEffect(() => {
        if (!item || !inquiry) return;
        if (existingOffer) {
            setPrice(existingOffer.price ?? undefined);
            setUnit({
                id: existingOffer.unitId || null,
                title: existingOffer.unit || existingOffer.priceBasis || item.unit || '',
            });
            setDays(existingOffer.deliveryDays ?? undefined);
            setAdvantages(existingOffer.advantages || '');
            setMessage(existingOffer.message || '');
        } else {
            setPrice(undefined);
            setUnit(item.id ? { id: item.unitId || null, title: item.unit || '' } : { id: null, title: WHOLE_LIST_TITLE });
            setDays(undefined);
            setAdvantages('');
            setMessage('');
        }
        setErrors({});
    }, [item, inquiry, existingOffer]);

    const isWholeList = !item?.id;
    const unitTitle = isWholeList ? WHOLE_LIST_TITLE : (unit.title || '');
    // راهنمای معنای قیمت — «هر کارتن ۲۴ عددی» یا «کل لیست» (جای گنگ «جمع کل»)
    const priceHint = isWholeList
        ? 'قیمت پیشنهادی برای کل لیست خرید'
        : unitTitle ? `قیمت پیشنهادی برای هر ${unitTitle}` : 'اول واحد را انتخاب کن';

    const submit = async () => {
        if (!inquiry) return;
        const e: Record<string, string> = {};
        if (!price || price <= 0) e.price = 'قیمت پیشنهادی را بنویس';
        if (!isWholeList && !unit.id && !unit.title.trim()) e.unit = 'واحد را انتخاب کن — مثلا کارتن یا کیلوگرم';
        if (Object.keys(e).length) {
            setErrors(e);
            toastFormErrors(e); // ⚖️ قانون دیمت: الرت واضح کنار خطای CSS فیلدها
            return;
        }
        setSending(true);
        try {
            if (editing && existingOffer) {
                await updateOffer.mutateAsync({
                    offerId: existingOffer.id,
                    data: {
                        price: price!,
                        unitId: unit.id || undefined,
                        unit: unitTitle || undefined,
                        deliveryDays: days || undefined,
                        advantages: advantages.trim() || undefined,
                        message: message.trim() || undefined,
                    },
                });
                toast.success('پیشنهادت به‌روز شد — خریدار نسخهٔ جدید را می‌بیند');
            } else {
                await addOffer.mutateAsync({
                    inquiryId: inquiry.id,
                    data: {
                        itemId: item?.id,
                        price: price!,
                        unitId: unit.id || undefined,
                        unit: unitTitle || undefined,
                        deliveryDays: days || undefined,
                        advantages: advantages.trim() || undefined,
                        message: message.trim() || undefined,
                    },
                });
                toast.success('پیشنهادت ثبت شد — خریدار می‌بینتش');
            }
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || (editing ? 'ویرایش پیشنهاد ناموفق بود' : 'ثبت پیشنهاد ناموفق بود'));
        } finally {
            setSending(false);
        }
    };

    if (!mounted) return null;
    return createPortal(
        <AnimatePresence>
            {item && inquiry && (
                <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center sm:p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50" onClick={sending ? undefined : onClose} />
                    <motion.div
                        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto scrollbar-slim
                            rounded-t-3xl sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/95 px-5 py-3.5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                            <h2 className="flex items-center gap-2 text-[15px] font-black">
                                <Store className="size-4 text-brand-contrast" />
                                پیشنهاد قیمت
                            </h2>
                            <button onClick={onClose} aria-label="بستن"
                                className="grid size-8 place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-gray-800">
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="px-5 py-4">
                            {/* زمینهٔ قلم */}
                            <div className="rounded-2xl border border-brand-contrast-tint bg-brand-contrast-soft/50 px-4 py-3 dark:bg-amber-500/10">
                                <p className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
                                    {item.id ? item.name : 'کل لیست خرید'}
                                </p>
                                {(item.quantity || item.unit) && (
                                    <p className="mt-0.5 text-[11px] font-bold text-amber-700/80 dark:text-amber-400/80">
                                        {item.quantity ? faNum(item.quantity) : ''} {item.unit}
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 space-y-3">
                                {/* ✅ واحد پیشنهاد — قبل از قیمت (خواستهٔ مالک)، پیش‌انتخاب واحد قلم */}
                                {isWholeList ? (
                                    <div>
                                        <label className={labelCls}>واحد</label>
                                        <div className="flex h-11 items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 px-3 text-sm font-bold text-stone-600 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-300">
                                            <ListOrdered className="size-4 text-stone-400" />
                                            {WHOLE_LIST_TITLE}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className={labelCls}>واحد پیشنهاد</label>
                                        <UnitPicker
                                            value={unit}
                                            onChange={(v) => { setUnit(v); setErrors((p) => ({ ...p, unit: '' })); }}
                                            catalogUnits={inquiry.units as any}
                                            placeholder="واحد — جستجو کن"
                                            error={errors.unit}
                                        />
                                    </div>
                                )}
                                <p className="-mt-1 px-1 text-[10px] font-bold text-stone-400 dark:text-gray-500">{priceHint}</p>

                                {/* ✅ قیمت پیشنهادی — NumberInput با فرمت سه‌رقمی + واحد تومان */}
                                <div>
                                    <label className={labelCls}>قیمت پیشنهادی</label>
                                    <NumberInput
                                        value={price}
                                        onChange={(v) => { setPrice(v || undefined); setErrors((p) => ({ ...p, price: '' })); }}
                                        unit="تومان"
                                        placeholder="مثلاً ۲٬۵۰۰٬۰۰۰"
                                        className={`h-11 rounded-xl text-sm font-bold ${errors.price ? 'border-red-400!' : 'border-stone-100! dark:border-gray-800!'}`}
                                    />
                                    {errors.price && <p className="mt-1 px-1 text-[10px] font-bold text-red-500">{errors.price}</p>}
                                </div>

                                {/* ✅ زمان تحویل — NumberInput با واحد روز */}
                                <div>
                                    <label className={labelCls}>زمان تحویل (اختیاری)</label>
                                    <NumberInput
                                        value={days}
                                        onChange={(v) => setDays(v || undefined)}
                                        unit="روز"
                                        placeholder="مثلاً ۳"
                                        className="h-11 rounded-xl text-sm font-bold border-stone-100! dark:border-gray-800!"
                                    />
                                </div>

                                {/* ✅ مزیت خرید از شما — مزیت رقابتی (خواستهٔ مالک) */}
                                <div>
                                    <label className={`${labelCls} flex items-center gap-1.5`}>
                                        <Sparkles className="size-3.5 text-brand-contrast" />
                                        مزیت خرید از شما
                                    </label>
                                    <textarea value={advantages} onChange={(e) => setAdvantages(e.target.value)} rows={2}
                                        placeholder="اگر خرید از شما برای این خریدار مزیت خاصی دارد به‌عنوان مزیت رقابتی وارد کنید"
                                        className="w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-brand-contrast dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100" />
                                </div>

                                <div>
                                    <label className={labelCls}>پیام به خریدار (اختیاری)</label>
                                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
                                        placeholder="مثلاً: تحویل درب انبار، فاکتور رسمی داریم"
                                        className="w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-brand-contrast dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100" />
                                </div>
                                <p className="flex items-center gap-1.5 text-[9.5px] font-bold leading-4 text-stone-400 dark:text-gray-500">
                                    <Phone className="size-3 shrink-0" />
                                    شمارهٔ موبایل ثبت‌نامت خودکار همراه پیشنهاد ثبت می‌شود — لازم نیست واردش کنی.
                                </p>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={sending}
                                    onClick={submit}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-contrast text-sm font-extrabold text-white shadow-lg shadow-brand-contrast/30 transition-colors hover:bg-brand-contrast-strong disabled:opacity-50">
                                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                    {editing ? 'ذخیرهٔ تغییرات پیشنهاد' : 'ثبت پیشنهاد قیمت'}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
