// app/components/ProformaSheet.tsx
// 🧾 شیت ارسال پیش‌فاکتور — فروشنده (تامین‌کننده) برای پیشنهاد پذیرفته‌شده پیش‌فاکتور می‌فرستد.
//    خریدار داخل دیمت تایید می‌کند → معامله مُهر می‌شود و در «معامله‌های موفق» هر دو طرف می‌ماند.
//    فرم عمداً کوچک است: یک قلم شروع می‌شود (از روی پیشنهاد)، چند قلم می‌شود اضافه کرد.
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateProforma } from '@/lib/api/apiHooks';
import { faPrice } from '@/app/inquiries/utils';

export interface ProformaTarget {
    offerId: string;
    itemName?: string | null;
    unit?: string | null;
    unitPrice?: number | null;
}

export default function ProformaSheet({ target, onClose }: { target: ProformaTarget; onClose: () => void }) {
    const create = useCreateProforma();
    const [sending, setSending] = useState(false);

    const [items, setItems] = useState<{ name: string; quantity: number; unit: string; unitPrice: number }[]>([
        {
            name: target.itemName || '',
            quantity: 1,
            unit: target.unit && target.unit !== 'کل لیست' ? target.unit : '',
            unitPrice: target.unitPrice || 0,
        },
    ]);
    const [notes, setNotes] = useState('');

    const total = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);

    const patchItem = (idx: number, patch: Partial<(typeof items)[number]>) =>
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

    const submit = async () => {
        const clean = items.filter((it) => it.name.trim() && Number(it.unitPrice) > 0);
        if (!clean.length) {
            toast.error('حداقل یک ردیف با نام و قیمت لازم است');
            return;
        }
        setSending(true);
        try {
            const p = await create.mutateAsync({
                offerId: target.offerId,
                items: clean.map((it) => ({
                    name: it.name.trim(),
                    quantity: Number(it.quantity) || 1,
                    unit: it.unit.trim() || undefined,
                    unitPrice: Number(it.unitPrice),
                })),
                notes: notes.trim() || undefined,
            });
            toast.success(`پیش‌فاکتور ${p?.number ?? ''} فرستاده شد — خریدار داخل دیمت تایید می‌کند`);
            onClose();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ارسال پیش‌فاکتور ناموفق بود');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[96] flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
            onClick={sending ? undefined : onClose}>
            <motion.div
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900">
                <div className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                        <FileText className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-[14.5px] font-black text-stone-900 dark:text-gray-100">ارسال پیش‌فاکتور</h3>
                        <p className="text-[10.5px] font-bold text-stone-400 dark:text-gray-500">
                            خریدار داخل دیمت تایید می‌کند؛ معامله برای هر دو طرف ثبت می‌شود.
                        </p>
                    </div>
                    <button onClick={onClose} disabled={sending} aria-label="بستن"
                        className="grid size-8 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-gray-800">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="mt-4 space-y-2.5">
                    {items.map((it, idx) => (
                        <div key={idx} className="rounded-xl border border-stone-100 p-2.5 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <input
                                    value={it.name}
                                    onChange={(e) => patchItem(idx, { name: e.target.value })}
                                    placeholder="نام کالا"
                                    className="min-w-0 flex-1 bg-transparent text-[12.5px] font-black text-stone-800 outline-none placeholder:text-stone-300 dark:text-gray-100 dark:placeholder:text-gray-600"
                                />
                                {items.length > 1 && (
                                    <button onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                                        aria-label="حذف ردیف"
                                        className="grid size-7 shrink-0 place-items-center rounded-lg text-stone-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">
                                        <Trash2 className="size-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                                <label className="flex items-center gap-1 font-bold text-stone-400">
                                    تعداد
                                    <input
                                        value={it.quantity}
                                        onChange={(e) => patchItem(idx, { quantity: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })}
                                        inputMode="numeric"
                                        className="h-8 w-16 rounded-lg border border-stone-200 bg-transparent px-2 text-center font-black text-stone-700 outline-none focus:border-emerald-400 dark:border-gray-700 dark:text-gray-200"
                                    />
                                </label>
                                <input
                                    value={it.unit}
                                    onChange={(e) => patchItem(idx, { unit: e.target.value })}
                                    placeholder="واحد (مثلاً کارتن)"
                                    className="h-8 w-24 rounded-lg border border-stone-200 bg-transparent px-2 font-bold text-stone-600 outline-none focus:border-emerald-400 placeholder:text-stone-300 dark:border-gray-700 dark:text-gray-300 dark:placeholder:text-gray-600"
                                />
                                <span className="flex-1" />
                                <input
                                    value={it.unitPrice ? it.unitPrice.toLocaleString('fa-IR') : ''}
                                    onChange={(e) => patchItem(idx, { unitPrice: Number(e.target.value.replace(/[^\d۰-۹]/g, '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) ) || 0 })}
                                    inputMode="numeric"
                                    placeholder="قیمت"
                                    className="h-8 w-28 rounded-lg border border-stone-200 bg-transparent px-2 text-center font-black text-emerald-700 outline-none focus:border-emerald-400 placeholder:text-stone-300 dark:border-gray-700 dark:text-emerald-400 dark:placeholder:text-gray-600"
                                />
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={() => setItems((prev) => [...prev, { name: '', quantity: 1, unit: '', unitPrice: 0 }])}
                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-200 text-[11.5px] font-extrabold text-stone-500 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-gray-700 dark:text-gray-400">
                        <Plus className="size-3.5" /> افزودن قلم دیگر
                    </button>
                </div>

                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="توضیح (اختیاری) — مثلاً شرایط ارسال"
                    className="mt-3 w-full resize-none rounded-xl border border-stone-100 bg-transparent p-3 text-[11.5px] font-bold leading-6 text-stone-700 outline-none placeholder:text-stone-300 focus:border-emerald-400 dark:border-gray-800 dark:text-gray-200 dark:placeholder:text-gray-600"
                />

                <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50/70 px-3.5 py-2.5 dark:bg-emerald-500/10">
                    <span className="text-[11.5px] font-black text-emerald-800 dark:text-emerald-300">جمع کل</span>
                    <span className="text-[14px] font-black text-emerald-700 dark:text-emerald-400">
                        {faPrice(total)} <span className="text-[10px] font-bold">تومان</span>
                    </span>
                </div>

                <button onClick={submit} disabled={sending}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
                    {sending ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                    ارسال پیش‌فاکتور به خریدار
                </button>
            </motion.div>
        </div>
    );
}
