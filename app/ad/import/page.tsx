// app/ad/import/page.tsx
// 📥 ورود سریع لیست قیمت — «به‌جای قلم‌به‌قلم، لیستت را بچسبان»
//    قاتلِ افتتاح حساب سمت عرضه را از بین می‌برد:
//    ۱) متن لیست را از واتساپ/دفترداری کپی کن و بچسبان
//    ۲) پیش‌نمایش: هر خط یک ردیف — نام و قیمت قابل ویرایش، خط‌های مشکل‌دار مشخص
//    ۳) ثبت همه با یک دکمه — بدون فرم چندمرحله‌ای
'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ClipboardPaste, Loader2, Check, AlertTriangle, Copy,
    Package, ListChecks, Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdImportParse, useAdImportCommit, useUnits } from '@/lib/api/apiHooks';
import { NumberInput } from '@/components/common/NumberInput';

const CARD_CLS = 'bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 dark:border-gray-700';

const SAMPLE_TEXT = 'پفک مینو کارتن ۴۸۵٬۰۰۰\nشیر کاکائو شیرین عاج ۳۲۰٬۰۰۰\nروغن سرخ کردنی ۱۶ لیتری ۱٬۲۵۰٬۰۰۰';

function ImportContent() {
    const router = useRouter();
    const params = useSearchParams();
    const catalogId = params.get('catalog');

    const parse = useAdImportParse();
    const commit = useAdImportCommit();
    const { data: units } = useUnits();

    const [text, setText] = useState('');
    const [rows, setRows] = useState<any[]>([]);
    const [unitId, setUnitId] = useState<string>('');
    const [doneCount, setDoneCount] = useState<number | null>(null);

    const summary = useMemo(() => ({
        checked: rows.filter((r) => r.checked && r.price > 0).length,
        invalid: rows.filter((r) => !r.valid).length,
    }), [rows]);

    const unitOptions = (units ?? []) as any[];
    const selectedUnitId = unitId || unitOptions.find((u) => u.isDefault)?.id || unitOptions[0]?.id || '';

    // ─── بدون بازوی فروش مقصد — پیام ساده ───
    if (!catalogId) {
        return (
            <div className="min-h-[60vh] grid place-items-center px-4">
                <div className={`${CARD_CLS} max-w-sm w-full p-6 text-center`}>
                    <Package className="w-10 h-10 mx-auto text-amber-500" />
                    <h1 className="mt-3 text-base font-black text-stone-900 dark:text-gray-100">بازوی فروش مقصد مشخص نیست</h1>
                    <p className="mt-2 text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                        برای ورود لیست قیمت، اول از صفحهٔ محصولاتِ بازوی فروشت شروع کن.
                    </p>
                    <Link href="/my-catalogs"
                        className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-5 text-xs font-extrabold text-white hover:bg-amber-600">
                        <Store className="w-4 h-4" /> بازوهای فروش من
                    </Link>
                </div>
            </div>
        );
    }

    const runParse = async () => {
        if (text.trim().length < 3) {
            toast.error('چیزی برای خواندن نیست — لیستت را بچسبان');
            return;
        }
        try {
            const res = await parse.mutateAsync({ catalogId, text });
            setRows((res.items || []).map((it: any) => ({ ...it, checked: !!it.valid })));
            if (!res.items?.length) toast.error('چیزی نفهمیدم — شکل خط‌ها را ببین');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'خواندن لیست ناموفق بود');
        }
    };

    const runCommit = async () => {
        const selected = rows.filter((r) => r.checked && r.valid && r.name?.trim() && r.price > 0);
        if (!selected.length) {
            toast.error('حداقل یک ردیف تیک‌خورده لازم است');
            return;
        }
        try {
            const res = await commit.mutateAsync({
                catalogId,
                unitId: selectedUnitId || undefined,
                items: selected.map((r) => ({ name: r.name, price: r.price, referenceId: r.referenceId || undefined })),
            });
            setDoneCount(res.created);
            toast.success(`${res.created.toLocaleString('fa-IR')} کالا اضافه شد`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ثبت لیست ناموفق بود');
        }
    };

    const patchRow = (idx: number, patch: any) =>
        setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

    // ─── مرحلهٔ ۳: تمام شد ───
    if (doneCount !== null) {
        return (
            <div className="min-h-[60vh] grid place-items-center px-4">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className={`${CARD_CLS} max-w-sm w-full p-6 text-center`}>
                    <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                        <Check className="size-7" />
                    </span>
                    <h1 className="mt-3 text-base font-black text-stone-900 dark:text-gray-100">
                        {doneCount.toLocaleString('fa-IR')} کالا به بازوی فروشت اضافه شد
                    </h1>
                    <p className="mt-2 text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                        هر وقت قیمت عوض شد، از صفحهٔ محصولات آپدیت کن تا خریدارها قیمت روز ببینند.
                    </p>
                    <div className="mt-4 grid gap-2">
                        <button onClick={() => router.push(`/my-catalogs?catalog=${catalogId}`)}
                            className="h-11 rounded-xl bg-amber-500 text-xs font-extrabold text-white hover:bg-amber-600">
                            دیدن محصولات
                        </button>
                        <button onClick={() => { setDoneCount(null); setRows([]); setText(''); }}
                            className="h-11 rounded-xl border border-outline-variant/50 text-xs font-bold text-stone-600 hover:border-amber-400 dark:text-gray-300">
                            ورود لیست دیگر
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl px-4 py-6">
            {/* سرصفحه — کوتاه و گویا */}
            <div className="mb-5">
                <h1 className="flex items-center gap-2 text-lg font-black text-stone-900 dark:text-gray-100">
                    <ClipboardPaste className="size-5 text-amber-500" />
                    ورود سریع لیست قیمت
                </h1>
                <p className="mt-1.5 text-[12.5px] font-bold leading-6 text-stone-500 dark:text-gray-400">
                    لیست قیمتت را از واتساپ یا متن دلخواه کپی کن و همین‌جا بچسبان. هر خط یک کالا؛
                    آخرین عددِ هر خط قیمت حساب می‌شود.
                </p>
            </div>

            {rows.length === 0 ? (
                /* ─── مرحلهٔ ۱: چسباندن متن ─── */
                <div className={`${CARD_CLS} p-4`}>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        dir="rtl"
                        rows={10}
                        placeholder={SAMPLE_TEXT}
                        className="w-full resize-y rounded-xl border border-outline-variant/50 bg-transparent p-3.5 text-[13px] font-bold leading-7 text-stone-800 outline-none transition-colors placeholder:text-stone-300 focus:border-amber-400 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-600"
                    />
                    <div className="mt-3 flex items-center gap-2">
                        <button onClick={runParse} disabled={parse.isPending}
                            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 text-[13px] font-extrabold text-white transition-colors hover:bg-amber-600 disabled:opacity-50">
                            {parse.isPending ? <Loader2 className="size-4 animate-spin" /> : <ListChecks className="size-4" />}
                            پیش‌نمایش لیست
                        </button>
                        <button
                            onClick={async () => {
                                try { const t = await navigator.clipboard.readText(); if (t) { setText(t); toast.success('چسبانده شد'); } } catch { toast.error('دسترسی به کلیپ‌بورد ممکن نشد — دستی بچسبان'); }
                            }}
                            className="grid size-11 place-items-center rounded-xl border border-outline-variant/50 text-stone-500 hover:border-amber-400 dark:text-gray-400"
                            title="چسباندن از کلیپ‌بورد" aria-label="چسباندن از کلیپ‌بورد">
                            <Copy className="size-4" />
                        </button>
                    </div>
                </div>
            ) : (
                /* ─── مرحلهٔ ۲: پیش‌نمایش و ویرایش ─── */
                <>
                    <div className={`${CARD_CLS} mb-3 flex flex-wrap items-center gap-2 p-3`}>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            {summary.checked.toLocaleString('fa-IR')} قلم آمادهٔ ثبت
                        </span>
                        {summary.invalid > 0 && (
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                {summary.invalid.toLocaleString('fa-IR')} قلم مشکل‌دار — تیک نخورد
                            </span>
                        )}
                        <span className="flex-1" />
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-500 dark:text-gray-400">
                            واحد همه:
                            <select value={selectedUnitId} onChange={(e) => setUnitId(e.target.value)}
                                className="h-8 rounded-lg border border-outline-variant/50 bg-transparent px-2 text-[11px] font-bold text-stone-700 outline-none focus:border-amber-400 dark:border-gray-700 dark:text-gray-200">
                                {unitOptions.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}
                            </select>
                        </label>
                    </div>

                    <div className="space-y-2">
                        {rows.map((row, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className={`${CARD_CLS} flex items-center gap-2.5 p-3 ${!row.valid ? 'opacity-70' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={!!row.checked}
                                    disabled={!row.valid}
                                    onChange={(e) => patchRow(idx, { checked: e.target.checked })}
                                    className="size-4 shrink-0 accent-amber-500 disabled:opacity-40"
                                    aria-label={`ثبت ${row.name}`}
                                />
                                <div className="min-w-0 flex-1">
                                    <input
                                        value={row.name}
                                        disabled={!row.valid}
                                        onChange={(e) => patchRow(idx, { name: e.target.value })}
                                        className="w-full bg-transparent text-[13px] font-black text-stone-800 outline-none disabled:text-stone-400 dark:text-gray-100"
                                    />
                                    {row.reason && (
                                        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-red-500">
                                            <AlertTriangle className="size-3" /> {row.reason}
                                        </p>
                                    )}
                                    {row.duplicateOfAdId && (
                                        <p className="mt-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                            این کالا را قبلاً داری — اگر تیک بزنی دوباره ثبت می‌شود
                                        </p>
                                    )}
                                    {row.referenceTitle && (
                                        <p className="mt-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                            با کالای مرجع «{row.referenceTitle}» وصل شد — در پیشنهادها دیده می‌شود
                                        </p>
                                    )}
                                </div>
                                <div className="w-32 shrink-0">
                                    {row.valid ? (
                                        <NumberInput
                                            value={row.price}
                                            onChange={(v) => patchRow(idx, { price: v })}
                                            unit="تومان"
                                            placeholder="قیمت"
                                        />
                                    ) : (
                                        <span className="block text-center text-[11px] font-bold text-stone-300 dark:text-gray-600">—</span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button onClick={runCommit} disabled={commit.isPending}
                            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
                            {commit.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                            ثبت {summary.checked.toLocaleString('fa-IR')} کالا در بازوی فروش
                        </button>
                        <button onClick={() => setRows([])}
                            className="h-12 rounded-xl border border-outline-variant/50 px-4 text-xs font-bold text-stone-500 hover:border-stone-400 dark:text-gray-400">
                            برگشت
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default function AdImportPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-6 animate-spin text-stone-300" /></div>}>
            <ImportContent />
        </Suspense>
    );
}
