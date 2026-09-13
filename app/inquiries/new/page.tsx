// app/inquiries/new/page.tsx
// فرم ساخت کاتالوگ خرید — فلسفه: ثبت استعلام نباید سخت باشد.
// پیش‌فرض: عنوان + چند قلم (اسم/مقدار/واحد). پیشرفته: اختیاری و جمع‌شده (قطعهٔ صنعتی و…)
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useCreateInquiry } from '@/lib/api/apiHooks';
import type { CreateInquiryItemPayload } from '@/lib/api/apiTypes';
import { toast } from 'sonner';
import {
    ClipboardList, Plus, Trash2, ChevronDown, SlidersHorizontal,
    Loader2, FlaskConical, Link2, ImagePlus, Package, Send,
} from 'lucide-react';
import { faNum } from '../utils';

interface RowState {
    key: number;
    name: string;
    quantity: string;
    unit: string;
    advancedOpen: boolean;
    brand: string;
    note: string;
    referenceUrl: string;
    specs: { key: string; value: string }[];
}

const newRow = (key: number): RowState => ({
    key, name: '', quantity: '', unit: '', advancedOpen: false,
    brand: '', note: '', referenceUrl: '', specs: [],
});

const UNIT_SUGGESTIONS = ['کیلوگرم', 'کارتن', 'عدد', 'بسته', 'لیتر', 'متر', 'تان'];

export default function NewInquiryPage() {
    const router = useRouter();
    const { isAuthenticated, _hydrated } = useSelector((s: RootState) => s.auth) as any;
    const hydrated = _hydrated !== false;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [rows, setRows] = useState<RowState[]>([newRow(0), newRow(1), newRow(2)]);
    const [nextKey, setNextKey] = useState(3);
    const [moreOpen, setMoreOpen] = useState(false);
    const [deadline, setDeadline] = useState('');
    const [city, setCity] = useState('');
    const [tagsRaw, setTagsRaw] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public');

    const create = useCreateInquiry();
    const [submitting, setSubmitting] = useState(false);

    // گیت ورود — مهمان → لاگین با حفظ مقصد
    useEffect(() => {
        if (hydrated && !isAuthenticated) {
            router.replace(`/login?redirect=${encodeURIComponent('/inquiries/new')}`);
        }
    }, [hydrated, isAuthenticated, router]);

    const filledCount = useMemo(() => rows.filter((r) => r.name.trim()).length, [rows]);

    const patchRow = (key: number, patch: Partial<RowState>) =>
        setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

    const addRow = () => {
        setRows((rs) => [...rs, newRow(nextKey)]);
        setNextKey((k) => k + 1);
    };

    const removeRow = (key: number) => {
        setRows((rs) => (rs.length <= 1 ? [newRow(key)] : rs.filter((r) => r.key !== key)));
    };

    const submit = async () => {
        if (!title.trim()) {
            toast.error('یه عنوان بذار — مثلاً «لیست خرید هفتگی»');
            return;
        }
        if (filledCount === 0) {
            toast.error('حداقل یک قلم بنویس');
            return;
        }
        const items: CreateInquiryItemPayload[] = rows
            .filter((r) => r.name.trim())
            .map((r) => ({
                name: r.name.trim(),
                quantity: r.quantity.trim() ? Number(r.quantity.replace(/[^\d.]/g, '')) || undefined : undefined,
                unit: r.unit.trim() || undefined,
                brand: r.brand.trim() || undefined,
                note: r.note.trim() || undefined,
                referenceUrl: r.referenceUrl.trim() || undefined,
                specs: r.specs.filter((s) => s.key.trim() && s.value.trim()),
            }));

        setSubmitting(true);
        try {
            const res = await create.mutateAsync({
                title: title.trim(),
                description: description.trim() || undefined,
                items,
                visibility,
                deadline: deadline ? new Date(deadline).toISOString() : undefined,
                city: city.trim() || undefined,
                deliveryNote: deliveryNote.trim() || undefined,
                paymentTerms: paymentTerms.trim() || undefined,
                tags: tagsRaw.split(/[,،]/).map((t) => t.trim()).filter(Boolean).slice(0, 10),
            });
            toast.success('کاتالوگ خریدت ساخته شد 🎉');
            router.push(`/inquiries/${res.slug || res.id}`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ساختن کاتالوگ خرید ناموفق بود');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hydrated || !isAuthenticated) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#FFFDF7] dark:bg-gray-950">
                <Loader2 className="size-8 animate-spin text-brand-amber" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFDF7] text-stone-900 dark:bg-gray-950 dark:text-gray-100">
            {/* هدر */}
            <header className="sticky top-0 z-40 border-b border-brand-amber-tint/70 bg-[#FFFDF7]/85 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/85">
                <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
                    <Link href="/inquiries" className="flex items-center gap-1.5 text-sm font-bold text-stone-500 transition-colors hover:text-stone-900 dark:text-gray-400 dark:hover:text-gray-100">
                        دیوار کاتالوگ‌های خرید
                    </Link>
                    <Image src="/images/logo3.png" alt="دیمت" width={80} height={28} className="h-7 w-auto object-contain" unoptimized />
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 pb-32 pt-8">
                {/* معرفی */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-amber-tint bg-brand-amber-soft px-3 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        <ClipboardList className="size-3" />
                        کاتالوگ خرید جدید
                    </span>
                    <h1 className="mt-3 text-2xl font-black sm:text-3xl">چی می‌خوای بخری؟</h1>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500 dark:text-gray-400">
                        فقط عنوان و اقلام کافیه — بقیه‌ش اختیاریه. هر چی ساده‌تر، زودتر آماده می‌شه.
                    </p>
                </motion.div>

                {/* عنوان */}
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.08 }}
                    className="mt-8">
                    <label className="mb-1.5 block text-xs font-extrabold text-stone-500 dark:text-gray-400">عنوان لیست</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثلاً: لیست خرید هفتگی سوپرمارکت"
                        maxLength={140}
                        className="h-13 w-full rounded-2xl border-2 border-stone-200 bg-white px-4 py-3 text-base font-bold outline-none transition-colors
                        placeholder:font-medium placeholder:text-stone-300 focus:border-brand-amber
                        dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-gray-600"
                    />
                </motion.section>

                {/* اقلام */}
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.14 }}
                    className="mt-6">
                    <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-extrabold text-stone-500 dark:text-gray-400">
                            اقلام <span className="text-brand-amber">({faNum(filledCount)} قلم)</span>
                        </label>
                        {rows.length > 1 && (
                            <button onClick={() => setRows([newRow(0)])}
                                className="text-[11px] font-bold text-stone-400 hover:text-red-500">
                                پاک کردن همه
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence initial={false} mode="popLayout">
                            {rows.map((r, idx) => (
                                <motion.div
                                    key={r.key}
                                    layout
                                    initial={{ opacity: 0, y: -14, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    className="rounded-2xl border-2 border-stone-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-amber text-xs font-black text-white">
                                            {faNum(idx + 1)}
                                        </span>
                                        <input
                                            value={r.name}
                                            onChange={(e) => patchRow(r.key, { name: e.target.value })}
                                            placeholder={idx === 0 ? 'مثلاً: روغن ۱۶ لیتری' : 'نام کالا یا قطعه'}
                                            className="h-10 min-w-0 flex-1 rounded-xl border border-stone-100 bg-stone-50 px-3 text-sm font-bold outline-none
                                            focus:border-brand-amber focus:bg-white
                                            dark:border-gray-800 dark:bg-gray-950/60 dark:focus:bg-gray-950"
                                        />
                                        <input
                                            value={r.quantity}
                                            onChange={(e) => patchRow(r.key, { quantity: e.target.value })}
                                            inputMode="decimal"
                                            placeholder='مقدار'
                                            className="h-10 w-16 shrink-0 rounded-xl border border-stone-100 bg-stone-50 px-2 text-center text-sm font-bold outline-none
                                            focus:border-brand-amber focus:bg-white dark:border-gray-800 dark:bg-gray-950/60"
                                        />
                                        <input
                                            value={r.unit}
                                            onChange={(e) => patchRow(r.key, { unit: e.target.value })}
                                            placeholder="واحد"
                                            list="unit-suggestions"
                                            className="h-10 w-20 shrink-0 rounded-xl border border-stone-100 bg-stone-50 px-2 text-center text-sm outline-none
                                            focus:border-brand-amber focus:bg-white dark:border-gray-800 dark:bg-gray-950/60"
                                        />
                                        <button
                                            onClick={() => removeRow(r.key)}
                                            aria-label="حذف قلم"
                                            className="grid size-8 shrink-0 place-items-center rounded-lg text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    {/* پیشنهاد واحد — فقط ردیف فعال */}
                                    {!r.unit && r.name.trim() && (
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5 ps-9">
                                            {UNIT_SUGGESTIONS.slice(0, 4).map((u) => (
                                                <button key={u} onClick={() => patchRow(r.key, { unit: u })}
                                                    className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold text-stone-500 transition-colors hover:bg-brand-amber-soft hover:text-amber-700 dark:bg-gray-800 dark:text-gray-400">
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* پیشرفتهٔ هر قلم */}
                                    <button
                                        onClick={() => patchRow(r.key, { advancedOpen: !r.advancedOpen })}
                                        className="mt-2 flex items-center gap-1 ps-9 text-[11px] font-bold text-stone-400 transition-colors hover:text-amber-600">
                                        <SlidersHorizontal className="size-3" />
                                        {r.advancedOpen ? 'بستن جزئیات' : 'برند، مشخصات فنی، لینک نمونه…'}
                                        <ChevronDown className={`size-3 transition-transform ${r.advancedOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {r.advancedOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden">
                                                <div className="mt-2 space-y-2 ps-9">
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={r.brand}
                                                            onChange={(e) => patchRow(r.key, { brand: e.target.value })}
                                                            placeholder="برند/سازنده (اختیاری)"
                                                            className="h-9 min-w-0 flex-1 rounded-xl border border-stone-100 bg-stone-50 px-3 text-xs font-bold outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                                        />
                                                        <input
                                                            value={r.referenceUrl}
                                                            onChange={(e) => patchRow(r.key, { referenceUrl: e.target.value })}
                                                            dir="ltr"
                                                            placeholder="لینک نمونه (اختیاری)"
                                                            className="h-9 min-w-0 flex-1 rounded-xl border border-stone-100 bg-stone-50 px-3 text-xs outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                                        />
                                                    </div>
                                                    {/* مشخصات فنی */}
                                                    {r.specs.map((sp, si) => (
                                                        <div key={si} className="flex gap-2">
                                                            <input
                                                                value={sp.key}
                                                                onChange={(e) => patchRow(r.key, { specs: r.specs.map((x, xi) => xi === si ? { ...x, key: e.target.value } : x) })}
                                                                placeholder="ویژگی — مثلاً: قطر"
                                                                className="h-9 min-w-0 flex-1 rounded-xl border border-stone-100 bg-stone-50 px-3 text-xs outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                                            />
                                                            <input
                                                                value={sp.value}
                                                                onChange={(e) => patchRow(r.key, { specs: r.specs.map((x, xi) => xi === si ? { ...x, value: e.target.value } : x) })}
                                                                placeholder="مقدار — ۴۵ میلی‌متر"
                                                                className="h-9 min-w-0 flex-1 rounded-xl border border-stone-100 bg-stone-50 px-3 text-xs outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                                            />
                                                            <button
                                                                onClick={() => patchRow(r.key, { specs: r.specs.filter((_, xi) => xi !== si) })}
                                                                className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-300 hover:text-red-500">
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => patchRow(r.key, { specs: [...r.specs, { key: '', value: '' }] })}
                                                        className="flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-amber-600">
                                                        <FlaskConical className="size-3" />
                                                        {r.specs.length ? 'افزودن ویژگی دیگر' : 'افزودن مشخصات فنی (برای قطعه و کالای فنی)'}
                                                    </button>
                                                    <input
                                                        value={r.note}
                                                        onChange={(e) => patchRow(r.key, { note: e.target.value })}
                                                        placeholder="یادداشت برای این قلم (اختیاری)"
                                                        className="h-9 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-xs outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <datalist id="unit-suggestions">
                        {UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}
                    </datalist>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={addRow}
                        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-amber-tint text-sm font-extrabold text-amber-600 transition-colors hover:bg-brand-amber-soft dark:text-amber-400">
                        <Plus className="size-4" />
                        افزودن قلم
                    </motion.button>
                </motion.section>

                {/* بیشتر (اختیاری) */}
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 }}
                    className="mt-6">
                    <button
                        onClick={() => setMoreOpen(!moreOpen)}
                        className="flex w-full items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 py-3 text-sm font-extrabold text-stone-600 transition-colors hover:border-brand-amber-tint dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                        <span className="flex items-center gap-2">
                            <SlidersHorizontal className="size-4 text-amber-500" />
                            مهلت، شهر، برچسب و شرایط (همه اختیاری)
                        </span>
                        <ChevronDown className={`size-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {moreOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden">
                                <div className="mt-3 space-y-3 rounded-2xl border border-stone-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-[11px] font-extrabold text-stone-400">مهلت پاسخ</label>
                                            <input
                                                type="datetime-local"
                                                value={deadline}
                                                onChange={(e) => setDeadline(e.target.value)}
                                                className="h-10 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-xs outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[11px] font-extrabold text-stone-400">شهر</label>
                                            <input
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="مثلاً: تهران"
                                                className="h-10 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-xs outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-extrabold text-stone-400">برچسب‌ها (با ویرگول جدا کن)</label>
                                        <input
                                            value={tagsRaw}
                                            onChange={(e) => setTagsRaw(e.target.value)}
                                            placeholder="مثلاً: مواد غذایی، لبنیات"
                                            className="h-10 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-xs outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-[11px] font-extrabold text-stone-400">محل/شرایط تحویل</label>
                                            <input
                                                value={deliveryNote}
                                                onChange={(e) => setDeliveryNote(e.target.value)}
                                                placeholder="مثلاً: تحویل در انبار تهران"
                                                className="h-10 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-xs outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[11px] font-extrabold text-stone-400">شرایط پرداخت</label>
                                            <input
                                                value={paymentTerms}
                                                onChange={(e) => setPaymentTerms(e.target.value)}
                                                placeholder="مثلاً: نقدی / چک ۳۰ روزه"
                                                className="h-10 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-xs outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-extrabold text-stone-400">توضیح کلی</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={2}
                                            placeholder="هر توضیحی که تامین‌کننده باید بدونه"
                                            className="w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-xs outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-extrabold text-stone-400">دسترسی</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setVisibility('public')}
                                                className={`h-10 flex-1 rounded-xl border-2 text-xs font-extrabold transition-colors ${visibility === 'public' ? 'border-brand-amber bg-brand-amber-soft text-amber-800 dark:text-amber-300' : 'border-stone-100 text-stone-400 dark:border-gray-800'}`}>
                                                عمومی — روی دیوار دیده می‌شه
                                            </button>
                                            <button
                                                onClick={() => setVisibility('unlisted')}
                                                className={`h-10 flex-1 rounded-xl border-2 text-xs font-extrabold transition-colors ${visibility === 'unlisted' ? 'border-brand-amber bg-brand-amber-soft text-amber-800 dark:text-amber-300' : 'border-stone-100 text-stone-400 dark:border-gray-800'}`}>
                                                فقط با لینک
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>
            </main>

            {/* نوار ارسال چسبان */}
            <motion.div
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.2 }}
                className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-100 bg-white/95 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/95">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-400 dark:text-gray-500">
                        <Package className="size-4 text-brand-amber" />
                        {filledCount > 0 ? `${faNum(filledCount)} قلم آماده` : 'هنوز قلمی ننوشتی'}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        disabled={submitting || filledCount === 0 || !title.trim()}
                        onClick={submit}
                        className="flex h-12 items-center gap-2 rounded-full bg-brand-amber px-8 text-sm font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-all
                        hover:bg-brand-amber-strong disabled:cursor-not-allowed disabled:opacity-40">
                        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                        انتشار کاتالوگ خرید
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
