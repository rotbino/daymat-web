// app/components/OfferSheet.tsx
// شیت مشترک ثبت پیشنهاد قیمت — هم صفحه عمومی کاتالوگ قیمت و هم تب «کاتالوگ قیمت»ی پنل فروش
// برای یک قلم یا کل لیست؛ مبلغ + مبنا + تحویل + پیام + تلفن (همه حداقلی)
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, X, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAddOffer } from '@/lib/api/apiHooks';
import { faNum } from '@/app/inquiries/utils';

const BASIS_OPTIONS = ['جمع کل', 'هر کیلو', 'هر عدد', 'هر کارتن', 'هر متر'];

const fieldCls = 'h-11 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-sm font-bold outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100';
const labelCls = 'mb-1 block text-[11px] font-extrabold text-stone-400';

export default function OfferSheet({ inquiry, item, onClose }: {
    inquiry: { id: string } | null;
    item: { id?: string; name: string; quantity?: number | null; unit?: string | null } | null;
    onClose: () => void;
}) {
    const addOffer = useAddOffer();
    const [price, setPrice] = useState('');
    const [basis, setBasis] = useState('جمع کل');
    const [days, setDays] = useState('');
    const [message, setMessage] = useState('');
    const [phone, setPhone] = useState('');
    const [sending, setSending] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const submit = async () => {
        if (!inquiry) return;
        const p = Number((price || '').replace(/[^\d.]/g, ''));
        if (!p || p <= 0) {
            toast.error('مبلغ پیشنهاد را بنویس');
            return;
        }
        setSending(true);
        try {
            await addOffer.mutateAsync({
                inquiryId: inquiry.id,
                data: {
                    itemId: item?.id,
                    price: p,
                    priceBasis: basis || undefined,
                    deliveryDays: days ? Number(days.replace(/[^\d]/g, '')) : undefined,
                    message: message.trim() || undefined,
                    contactPhone: phone.trim() || undefined,
                },
            });
            toast.success('پیشنهادت ثبت شد — خریدار می‌بینتش');
            onClose();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ثبت پیشنهاد ناموفق بود');
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
                                <Store className="size-4 text-brand-amber" />
                                قیمتت رو بذار
                            </h2>
                            <button onClick={onClose} aria-label="بستن"
                                className="grid size-8 place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-gray-800">
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="px-5 py-4">
                            {/* زمینهٔ قلم */}
                            <div className="rounded-2xl border border-brand-amber-tint bg-brand-amber-soft/50 px-4 py-3 dark:bg-amber-500/10">
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
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className={labelCls}>مبلغ (تومان)</label>
                                        <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric"
                                            placeholder="مثلاً ۲٬۵۰۰٬۰۰۰" className={fieldCls} />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className={labelCls}>مبنا</label>
                                        <select value={basis} onChange={(e) => setBasis(e.target.value)}
                                            className={`${fieldCls} dark:[color-scheme:dark]`}>
                                            {BASIS_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>زمان تحویل (روز — اختیاری)</label>
                                    <input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" placeholder="مثلاً ۳"
                                        className={fieldCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>پیام به خریدار (اختیاری)</label>
                                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
                                        placeholder="مثلاً: تحویل درب انبار، فاکتور رسمی داریم"
                                        className="w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100" />
                                </div>
                                <div>
                                    <label className={labelCls}>تلفن تماس (اختیاری)</label>
                                    <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" placeholder="۰۹۱۲…"
                                        className={fieldCls} />
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={sending}
                                    onClick={submit}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-amber text-sm font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong disabled:opacity-50">
                                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                    ثبت پیشنهاد قیمت
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
