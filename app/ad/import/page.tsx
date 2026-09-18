// app/ad/import/page.tsx
// 📥 افزودن گروهی محصول — «موتور رشد کالاهای بازار»
//    پنج منبع ورود، هرکدام یک تب: اکسل | متن یا تایپ | گرید سریع | هوش مصنوعی | از سایت
//    جریان مشترک: انتخاب منبع → پیش‌نمایش ویرایش‌پذیر → ثبت → گزارش کامل (چند موفق/چند رد/چه چیزهای تازه ساخته شد)
//    واحد و برند و کالای مرجعِ نبود، خودکار توسط بک‌اند ساخته می‌شود — هیچ تکراری هم ثبت نمی‌شود.
'use client';

import React, { Suspense, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ClipboardPaste, Loader2, Check, AlertTriangle, Copy,
    Package, ListChecks, Store, FileSpreadsheet, Type, Table2,
    Sparkles, Globe, Plus, Trash2, ExternalLink, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdImportParse, useAdImportParseFile, useAdImportCommit, useUnits } from '@/lib/api/apiHooks';
import { NumberInput } from '@/components/common/NumberInput';
import type { ImportItem, ImportReport, ImportSummary } from '@/lib/api/apiService';

const CARD_CLS = 'bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 dark:border-gray-700';

const SAMPLE_TEXT = 'پفک مینو کارتنی ۴۸۵٬۰۰۰\nشیر کاکائو شیرین عاج ۳۲۰٬۰۰۰\nروغن سرخ کردنی ۱۶ لیتری ۱٬۲۵۰٬۰۰۰';

type SourceTab = 'excel' | 'text' | 'grid' | 'ai' | 'site';

const TABS: { key: SourceTab; title: string; icon: React.ReactNode }[] = [
    { key: 'excel', title: 'اکسل', icon: <FileSpreadsheet className="size-4" /> },
    { key: 'text', title: 'متن', icon: <Type className="size-4" /> },
    { key: 'grid', title: 'جدول', icon: <Table2 className="size-4" /> },
    { key: 'ai', title: 'هوش مصنوعی', icon: <Sparkles className="size-4" /> },
    { key: 'site', title: 'از سایت', icon: <Globe className="size-4" /> },
];

/** پرامپت آماده برای هوش مصنوعی — کاربر فایل/سایتش را با همین متن به ChatGPT/DeepSeek می‌دهد */
function buildAiPrompt(siteUrl?: string): string {
    const source = siteUrl
        ? `محصولات این صفحهٔ اینترنتی را بخوان و استخراج کن: ${siteUrl}`
        : 'من لیست قیمت محصولاتم را برایت می‌فرستم (فایل اکسل، عکس، PDF یا متن).';
    return `${source}
آن‌ها را دقیقاً به این شکل JSON برگردان — فقط JSON خالص، بدون هیچ توضیح اضافه:
[
  {"name": "نام کامل کالا", "price": 485000, "unit": "کارتن", "unitQty": 24, "brand": "نام برند"}
]
قواعد:
- price: قیمت به تومان، عدد کامل و بدون اعشار و جداکننده
- unit: واحد فروش مثل کارتن، بسته، عدد، کیلوگرم (اگر مشخص نیست این کلید را ننویس)
- unitQty: تعداد داخل واحد مثل ۲۴ برای کارتن ۲۴تایی (اگر مشخص نیست ننویس)
- brand: برند کالا (اگر مشخص نیست ننویس)`;
}

const AI_LINKS = [
    { name: 'ChatGPT', url: 'https://chatgpt.com' },
    { name: 'DeepSeek', url: 'https://chat.deepseek.com' },
    { name: 'Gemini', url: 'https://gemini.google.com' },
];

interface GridRow { name: string; brand: string; unit: string; qty: string; price: string }

const emptyGridRow = (): GridRow => ({ name: '', brand: '', unit: '', qty: '', price: '' });

function ImportContent() {
    const router = useRouter();
    const params = useSearchParams();
    const catalogId = params.get('catalog');

    const parseText = useAdImportParse();
    const parseFile = useAdImportParseFile();
    const commit = useAdImportCommit();
    const { data: units } = useUnits();

    const [tab, setTab] = useState<SourceTab>('excel');
    const [rows, setRows] = useState<(ImportItem & { checked?: boolean })[]>([]);
    const [report, setReport] = useState<ImportReport | null>(null);

    // ورودی هر تب
    const [text, setText] = useState('');
    const [fileName, setFileName] = useState('');
    const [grid, setGrid] = useState<GridRow[]>([emptyGridRow(), emptyGridRow(), emptyGridRow(), emptyGridRow(), emptyGridRow(), emptyGridRow()]);
    const [aiText, setAiText] = useState('');
    const [siteUrl, setSiteUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const unitOptions = (units ?? []) as any[];

    const summary = useMemo(() => ({
        checked: rows.filter((r) => r.checked && r.valid && r.name?.trim() && r.price > 0).length,
        invalid: rows.filter((r) => !r.valid).length,
        duplicates: rows.filter((r) => r.duplicateOfAdId).length,
        newUnits: new Set(rows.filter((r) => r.valid && r.unitTitle?.trim() && r.unitResolved === false).map((r) => r.unitTitle)).size,
        newBrands: new Set(rows.filter((r) => r.valid && r.brandTitle?.trim() && r.brandResolved === false).map((r) => r.brandTitle)).size,
    }), [rows]);

    // ─── بدون بازوی فروش مقصد — پیام ساده ───
    if (!catalogId) {
        return (
            <div className="min-h-[60vh] grid place-items-center px-4">
                <div className={`${CARD_CLS} max-w-sm w-full p-6 text-center`}>
                    <Package className="w-10 h-10 mx-auto text-amber-500" />
                    <h1 className="mt-3 text-base font-black text-stone-900 dark:text-gray-100">بازوی فروش مقصد مشخص نیست</h1>
                    <p className="mt-2 text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                        برای افزودن گروهی محصول، اول از صفحهٔ محصولاتِ بازوی فروشت شروع کن.
                    </p>
                    <Link href="/my-catalogs"
                        className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-5 text-xs font-extrabold text-white hover:bg-amber-600">
                        <Store className="w-4 h-4" /> بازوهای فروش من
                    </Link>
                </div>
            </div>
        );
    }

    const patchRow = (idx: number, patch: Partial<ImportItem>) =>
        setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

    const showItems = (items: ImportItem[]) => {
        if (!items.length) {
            toast.error('چیزی نفهمیدم — شکل نمونه را ببین');
            return;
        }
        setRows(items.map((it) => ({ ...it, checked: !!it.valid })));
    };

    const errToast = (e: any, fallback: string) =>
        toast.error(e?.response?.data?.message || e?.message || fallback);

    // ─── اجرای پارس برای هر تب ───
    const runExcel = async (file: File) => {
        try {
            const res = await parseFile.mutateAsync({ catalogId, file });
            setFileName(file.name);
            showItems(res.items);
        } catch (e: any) { errToast(e, 'خواندن فایل ناموفق بود'); }
    };

    const runText = async () => {
        if (text.trim().length < 3) { toast.error('چیزی برای خواندن نیست — لیستت را بچسبان یا تایپ کن'); return; }
        try {
            const res = await parseText.mutateAsync({ catalogId, text, source: 'text' });
            showItems(res.items);
        } catch (e: any) { errToast(e, 'خواندن لیست ناموفق بود'); }
    };

    const runGrid = async () => {
        const filled = grid.filter((g) => g.name.trim() || g.price.trim());
        if (!filled.length) { toast.error('حداقل یک ردیف را پر کن'); return; }
        try {
            const res = await parseText.mutateAsync({
                catalogId,
                text: JSON.stringify(filled.map((g) => ({
                    name: g.name.trim(),
                    price: g.price.trim(),
                    unitTitle: g.unit.trim(),
                    unitQty: g.qty.trim(),
                    brandTitle: g.brand.trim(),
                }))),
                source: 'json',
            });
            showItems(res.items);
        } catch (e: any) { errToast(e, 'خواندن ردیف‌ها ناموفق بود'); }
    };

    const runAi = async (isSite: boolean) => {
        const src = aiText.trim();
        if (src.length < 3) { toast.error(isSite ? 'خروجی هوش مصنوعی را بچسبان' : 'خروجی هوش مصنوعی را در کادر بچسبان'); return; }
        try {
            const res = await parseText.mutateAsync({ catalogId, text: src, source: 'json' });
            showItems(res.items);
        } catch (e: any) { errToast(e, 'خواندن خروجی هوش مصنوعی ناموفق بود'); }
    };

    const copyPrompt = async (prompt: string) => {
        try {
            await navigator.clipboard.writeText(prompt);
            toast.success('پرامپت کپی شد — حالا به هوش مصنوعی بده');
        } catch { toast.error('کپی نشد — دستی انتخاب و کپی کن'); }
    };

    const runCommit = async () => {
        const selected = rows.filter((r) => r.checked && r.valid && r.name?.trim() && r.price > 0);
        if (!selected.length) { toast.error('حداقل یک ردیف تیک‌خورده لازم است'); return; }
        try {
            const rep = await commit.mutateAsync({
                catalogId,
                items: selected.map((r) => ({
                    name: r.name,
                    price: r.price,
                    referenceId: r.referenceId || undefined,
                    unitTitle: r.unitTitle || undefined,
                    unitQty: r.unitQty && r.unitQty >= 2 ? r.unitQty : undefined,
                    brandTitle: r.brandTitle || undefined,
                })),
            });
            setReport(rep);
        } catch (e: any) { errToast(e, 'ثبت لیست ناموفق بود'); }
    };

    const resetAll = () => {
        setRows([]); setReport(null); setText(''); setFileName('');
        setGrid([emptyGridRow(), emptyGridRow(), emptyGridRow(), emptyGridRow(), emptyGridRow(), emptyGridRow()]);
        setAiText(''); setSiteUrl('');
    };

    const fa = (n: number) => n.toLocaleString('fa-IR');

    // ─── مرحلهٔ ۳: گزارش ثبت ───
    if (report) {
        const failedToShow = report.failed.slice(0, 5);
        return (
            <div className="mx-auto max-w-2xl px-4 py-6">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`${CARD_CLS} p-6`}>
                    <div className="flex items-center gap-3">
                        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                            <CheckCircle2 className="size-6" />
                        </span>
                        <div>
                            <h1 className="text-base font-black text-stone-900 dark:text-gray-100">
                                {fa(report.created)} کالا به بازوی فروشت اضافه شد
                            </h1>
                            {report.skipped > 0 && (
                                <p className="mt-0.5 text-xs font-bold text-red-500">{fa(report.skipped)} قلم ثبت نشد</p>
                            )}
                        </div>
                    </div>

                    {/* چیزهای تازه‌ساخته‌شده */}
                    {(report.createdUnits.length > 0 || report.createdBrands.length > 0 || report.createdReferences.length > 0) && (
                        <div className="mt-4 space-y-1.5 rounded-xl bg-emerald-50/60 p-3 dark:bg-emerald-500/5">
                            {report.createdUnits.length > 0 && (
                                <p className="text-[11.5px] font-bold leading-6 text-emerald-800 dark:text-emerald-300">
                                    واحدهای تازه ساخته شد: {report.createdUnits.join('، ')}
                                </p>
                            )}
                            {report.createdBrands.length > 0 && (
                                <p className="text-[11.5px] font-bold leading-6 text-emerald-800 dark:text-emerald-300">
                                    برندهای تازه ساخته شد: {report.createdBrands.join('، ')}
                                </p>
                            )}
                            {report.createdReferences.length > 0 && (
                                <p className="text-[11.5px] font-bold leading-6 text-emerald-800 dark:text-emerald-300">
                                    {fa(report.createdReferences.length)} کالای مرجع جدید در دیمت ثبت شد
                                </p>
                            )}
                        </div>
                    )}

                    {/* ردیف‌های ناموفق */}
                    {report.failed.length > 0 && (
                        <div className="mt-3 rounded-xl bg-red-50/70 p-3 dark:bg-red-500/5">
                            <p className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-black text-red-700 dark:text-red-300">
                                <AlertTriangle className="size-3.5" /> ثبت‌نشده‌ها:
                            </p>
                            <ul className="space-y-1">
                                {failedToShow.map((f, i) => (
                                    <li key={i} className="text-[11px] font-bold leading-5 text-red-600 dark:text-red-400">
                                        {f.name} — {f.reason}
                                    </li>
                                ))}
                            </ul>
                            {report.failed.length > failedToShow.length && (
                                <p className="mt-1 text-[10.5px] font-bold text-red-500/80">
                                    و {fa(report.failed.length - failedToShow.length)} مورد دیگر…
                                </p>
                            )}
                        </div>
                    )}

                    <p className="mt-4 text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                        قیمت ناقص‌ها را با دکمهٔ «ویرایش» کامل کن و عکس کالاها را بگذار — هر وقت قیمت عوض شد همان‌جا آپدیت کن تا خریدارها قیمت روز ببینند.
                    </p>

                    <div className="mt-4 grid gap-2">
                        <button onClick={() => router.push(`/my-catalogs?catalog=${catalogId}`)}
                            className="h-11 rounded-xl bg-amber-500 text-xs font-extrabold text-white hover:bg-amber-600">
                            دیدن محصولات
                        </button>
                        <button onClick={resetAll}
                            className="h-11 rounded-xl border border-outline-variant/50 text-xs font-bold text-stone-600 hover:border-amber-400 dark:text-gray-300">
                            افزودن گروهی دیگر
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── مرحلهٔ ۲: پیش‌نمایش و ویرایش (مشترک همهٔ منبع‌ها) ───
    if (rows.length > 0) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="flex items-center gap-2 text-lg font-black text-stone-900 dark:text-gray-100">
                        <ListChecks className="size-5 text-amber-500" />
                        پیش‌نمایش
                    </h1>
                    <button onClick={() => setRows([])} className="text-[11px] font-bold text-stone-400 hover:text-stone-600">
                        ← برگشت به منبع‌ها
                    </button>
                </div>

                {/* نوار خلاصه */}
                <div className={`${CARD_CLS} mb-3 flex flex-wrap items-center gap-1.5 p-3`}>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {fa(summary.checked)} قلم آمادهٔ ثبت
                    </span>
                    {summary.invalid > 0 && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            {fa(summary.invalid)} مشکل‌دار
                        </span>
                    )}
                    {summary.duplicates > 0 && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            {fa(summary.duplicates)} تکراری
                        </span>
                    )}
                    {summary.newUnits > 0 && (
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-black text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                            {fa(summary.newUnits)} واحد جدید ساخته می‌شود
                        </span>
                    )}
                    {summary.newBrands > 0 && (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                            {fa(summary.newBrands)} برند جدید ساخته می‌شود
                        </span>
                    )}
                </div>

                {/* ردیف‌ها */}
                <datalist id="unit-options">
                    {unitOptions.map((u) => <option key={u.id} value={u.title} />)}
                </datalist>
                <div className="space-y-2">
                    {rows.map((row, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className={`${CARD_CLS} p-3 ${!row.valid ? 'opacity-70' : ''}`}>
                            <div className="flex items-center gap-2.5">
                                <input type="checkbox" checked={!!row.checked} disabled={!row.valid}
                                    onChange={(e) => patchRow(idx, { checked: e.target.checked })}
                                    className="size-4 shrink-0 accent-amber-500 disabled:opacity-40"
                                    aria-label={`ثبت ${row.name}`} />
                                <input value={row.name} disabled={!row.valid}
                                    onChange={(e) => patchRow(idx, { name: e.target.value })}
                                    placeholder="نام کالا"
                                    className="min-w-0 flex-1 bg-transparent text-[13px] font-black text-stone-800 outline-none disabled:text-stone-400 dark:text-gray-100" />
                                <div className="w-28 shrink-0">
                                    {row.valid ? (
                                        <NumberInput value={row.price} onChange={(v) => patchRow(idx, { price: v })}
                                            unit="تومان" placeholder="قیمت" />
                                    ) : (
                                        <span className="block text-center text-[11px] font-bold text-stone-300 dark:text-gray-600">—</span>
                                    )}
                                </div>
                            </div>

                            {row.valid && (
                                <div className="mt-2 flex flex-wrap items-center gap-1.5 ps-6.5">
                                    <input value={row.unitTitle ?? ''} onChange={(e) => patchRow(idx, { unitTitle: e.target.value })}
                                        list="unit-options" placeholder="واحد (مثل کارتن)"
                                        className="h-8 w-28 rounded-lg border border-outline-variant/40 bg-transparent px-2 text-[11px] font-bold text-stone-700 outline-none placeholder:text-stone-300 focus:border-amber-400 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600" />
                                    <span className="text-[10px] font-bold text-stone-400">×</span>
                                    <input type="number" min={2} value={row.unitQty ?? ''} onChange={(e) => patchRow(idx, { unitQty: e.target.value ? Number(e.target.value) : null })}
                                        placeholder="تعداد در واحد"
                                        className="h-8 w-24 rounded-lg border border-outline-variant/40 bg-transparent px-2 text-[11px] font-bold text-stone-700 outline-none placeholder:text-stone-300 focus:border-amber-400 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600" />
                                    <input value={row.brandTitle ?? ''} onChange={(e) => patchRow(idx, { brandTitle: e.target.value })}
                                        placeholder="برند"
                                        className="h-8 w-28 rounded-lg border border-outline-variant/40 bg-transparent px-2 text-[11px] font-bold text-stone-700 outline-none placeholder:text-stone-300 focus:border-amber-400 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600" />
                                </div>
                            )}

                            <div className="mt-1.5 space-y-0.5 ps-6.5">
                                {row.reason && (
                                    <p className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                                        <AlertTriangle className="size-3" /> {row.reason}
                                    </p>
                                )}
                                {(row.warnings || []).map((w, wi) => (
                                    <p key={wi} className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                        <AlertTriangle className="size-3" /> {w}
                                    </p>
                                ))}
                                {row.duplicateOfAdId && (
                                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                        این کالا را قبلاً داری — اگر تیک بزنی جای قبلی ثبت نمی‌شود و رد می‌شود
                                    </p>
                                )}
                                {row.referenceTitle && (
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                        با کالای مرجع «{row.referenceTitle}» وصل شد — در پیشنهادها دیده می‌شود
                                    </p>
                                )}
                                {row.unitTitle?.trim() && row.unitResolved === false && (
                                    <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                                        واحد «{row.unitTitle}» موجود نبود — موقع ثبت خودکار ساخته می‌شود
                                    </p>
                                )}
                                {row.brandTitle?.trim() && row.brandResolved === false && (
                                    <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                                        برند «{row.brandTitle}» موجود نبود — موقع ثبت خودکار ساخته می‌شود
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-4 flex gap-2">
                    <button onClick={runCommit} disabled={commit.isPending || summary.checked === 0}
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
                        {commit.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                        ثبت {fa(summary.checked)} کالا در بازوی فروش
                    </button>
                    <button onClick={() => setRows([])}
                        className="h-12 rounded-xl border border-outline-variant/50 px-4 text-xs font-bold text-stone-500 hover:border-stone-400 dark:text-gray-400">
                        برگشت
                    </button>
                </div>
            </div>
        );
    }

    // ─── مرحلهٔ ۱: انتخاب منبع و ورود ───
    const parsePending = parseText.isPending || parseFile.isPending;
    const aiPrompt = buildAiPrompt(tab === 'site' ? siteUrl.trim() || 'https://…' : undefined);

    return (
        <div className="mx-auto max-w-2xl px-4 py-6">
            {/* سرصفحه */}
            <div className="mb-5">
                <h1 className="flex items-center gap-2 text-lg font-black text-stone-900 dark:text-gray-100">
                    <ClipboardPaste className="size-5 text-amber-500" />
                    افزودن گروهی محصول
                </h1>
                <p className="mt-1.5 text-[12.5px] font-bold leading-6 text-stone-500 dark:text-gray-400">
                    برای آسانی ورود محصولات، امکان ورود محصولات از لیستهای مختلف مثل اکسل یا فایل ساده یا با استفاده از هوش مصنوعی فراهم شده است. یکی از بهترینها فایل اکسل است. اما اگر فایل اکسل محصولات را ندارید می توایند از روشهای دیگر استفاده کنیدو اما دقت کنید این روش فقط برای ساده تر کردن ثبت لیست محصول است . قطعا بعد از ورود محصولات باید جزئیات وقیمتهای آنرا ویرایش و کامل کنید  و در صورت نداشتن تصویر، تصویر تک تک محصولات را آپلود نمایید
                </p>
            </div>

            {/* تب منبع‌ها */}
            <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-hide">
                {TABS.map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex flex-col h-9 shrink-0 items-center gap-1.5  px-3.5 text-[11.5px] font-extrabold whitespace-nowrap border transition-colors ${
                            tab === t.key
                                ? 'border-amber-500 bg-amber-500 text-white'
                                : 'border-outline-variant/50 text-stone-500 hover:border-amber-400 dark:text-gray-400'
                        }`}>
                        <span className={"text-[10px]"}>
                            {t.icon} {t.title}
                        </span>
                    </button>
                ))}
            </div>

            <div className={`${CARD_CLS} p-4`}>
                {tab === 'excel' && (
                    <>
                        <p className="text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                            فایل اکسل یا CSV را انتخاب کن. ستون‌های «نام کالا» و «قیمت» را خودم می‌شناسم؛
                            «واحد»، «تعداد در واحد» و «برند» هم اگر باشند بهتر.
                        </p>
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv,.txt" className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) runExcel(f);
                                e.target.value = '';
                            }} />
                        <button onClick={() => fileInputRef.current?.click()} disabled={parseFile.isPending}
                            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-400/60 text-[13px] font-extrabold text-amber-600 transition-colors hover:bg-amber-500/5 disabled:opacity-50 dark:text-amber-400">
                            {parseFile.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                            {fileName ? `فایل: ${fileName} — انتخاب دوباره` : 'انتخاب فایل اکسل / CSV'}
                        </button>
                    </>
                )}

                {tab === 'text' && (
                    <>
                        <p className="text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                            هر خط یک کالا؛ آخرین عددِ هر خط قیمت حساب می‌شود. از هر جا داری کپی کن و بچسبان.
                        </p>
                        <textarea value={text} onChange={(e) => setText(e.target.value)} dir="rtl" rows={10}
                            placeholder={SAMPLE_TEXT}
                            className="mt-3 w-full resize-y rounded-xl border border-outline-variant/50 bg-transparent p-3.5 text-[13px] font-bold leading-7 text-stone-800 outline-none transition-colors placeholder:text-stone-300 focus:border-amber-400 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-600" />
                        <div className="mt-3 flex items-center gap-2">
                            <button onClick={runText} disabled={parsePending}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 text-[13px] font-extrabold text-white transition-colors hover:bg-amber-600 disabled:opacity-50">
                                {parseText.isPending ? <Loader2 className="size-4 animate-spin" /> : <ListChecks className="size-4" />}
                                پیش‌نمایش لیست
                            </button>
                            <button onClick={async () => {
                                try { const t = await navigator.clipboard.readText(); if (t) { setText(t); toast.success('چسبانده شد'); } } catch { toast.error('دسترسی به کلیپ‌بورد ممکن نشد — دستی بچسبان'); }
                            }}
                                className="grid size-11 place-items-center rounded-xl border border-outline-variant/50 text-stone-500 hover:border-amber-400 dark:text-gray-400"
                                title="چسباندن از کلیپ‌بورد" aria-label="چسباندن از کلیپ‌بورد">
                                <Copy className="size-4" />
                            </button>
                        </div>
                    </>
                )}

                {tab === 'grid' && (
                    <>
                        <p className="text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                            ردیف‌به‌ردیف تایپ کن — فقط فیلدهای مهم. پر نکردن‌ها اشکالی ندارد.
                        </p>
                        <datalist id="unit-options">
                            {unitOptions.map((u) => <option key={u.id} value={u.title} />)}
                        </datalist>
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-1.5 ps-9 text-[10px] font-black text-stone-400">
                                <span className="flex-1">نام کالا</span>
                                <span className="w-20 text-center">واحد</span>
                                <span className="w-16 text-center">تعداد</span>
                                <span className="w-20 text-center">برند</span>
                                <span className="w-24 text-center">قیمت (تومان)</span>
                            </div>
                            {grid.map((g, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <button onClick={() => setGrid((prev) => prev.filter((_, j) => j !== i))}
                                        disabled={grid.length <= 1}
                                        className="grid size-7 shrink-0 place-items-center rounded-lg text-stone-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                                        title="حذف این ردیف" aria-label="حذف این ردیف">
                                        <Trash2 className="size-3.5" />
                                    </button>
                                    <input value={g.name} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
                                        placeholder="مثلاً: پفک مینو کارتنی"
                                        className="h-9 min-w-0 flex-1 rounded-lg border border-outline-variant/40 bg-transparent px-2 text-[12px] font-bold text-stone-700 outline-none placeholder:text-stone-300 focus:border-amber-400 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600" />
                                    <input value={g.unit} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, unit: e.target.value } : r)))}
                                        list="unit-options" placeholder="کارتن"
                                        className="h-9 w-20 shrink-0 rounded-lg border border-outline-variant/40 bg-transparent px-2 text-center text-[12px] font-bold text-stone-700 outline-none placeholder:text-stone-300 focus:border-amber-400 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600" />
                                    <input value={g.qty} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, qty: e.target.value } : r)))}
                                        inputMode="numeric" placeholder="۲۴"
                                        className="h-9 w-16 shrink-0 rounded-lg border border-outline-variant/40 bg-transparent px-2 text-center text-[12px] font-bold text-stone-700 outline-none placeholder:text-stone-300 focus:border-amber-400 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600" />
                                    <input value={g.brand} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, brand: e.target.value } : r)))}
                                        placeholder="مینو"
                                        className="h-9 w-20 shrink-0 rounded-lg border border-outline-variant/40 bg-transparent px-2 text-center text-[12px] font-bold text-stone-700 outline-none placeholder:text-stone-300 focus:border-amber-400 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600" />
                                    <input value={g.price} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))}
                                        inputMode="numeric" placeholder="۴۸۵٬۰۰۰"
                                        className="h-9 w-24 shrink-0 rounded-lg border border-outline-variant/40 bg-transparent px-2 text-center text-[12px] font-bold text-stone-700 outline-none placeholder:text-stone-300 focus:border-amber-400 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button onClick={() => setGrid((prev) => [...prev, emptyGridRow()])}
                                className="h-10 rounded-xl border border-dashed border-outline-variant/50 px-3 text-[11.5px] font-extrabold text-stone-500 hover:border-amber-400 dark:text-gray-400">
                                <Plus className="me-1 inline size-3.5" /> ردیف
                            </button>
                            <button onClick={runGrid} disabled={parsePending}
                                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 text-[12.5px] font-extrabold text-white hover:bg-amber-600 disabled:opacity-50">
                                {parseText.isPending ? <Loader2 className="size-4 animate-spin" /> : <ListChecks className="size-4" />}
                                پیش‌نمایش
                            </button>
                        </div>
                    </>
                )}

                {(tab === 'ai' || tab === 'site') && (
                    <>
                        {tab === 'ai' ? (
                            <p className="text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                                فایلت (اکسل، عکس یا PDF) را با پرامپت آمادهٔ زیر به یکی از هوش مصنوعی‌ها بده،
                                بعد خروجی JSON آن را همین‌جا بچسبان.
                            </p>
                        ) : (
                            <>
                                <p className="text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                                    آدرس صفحهٔ محصولات سایتت را بگذار، پرامپت را کپی کن و به هوش مصنوعیِ
                                    صفحه‌خوان بده؛ خروجی JSON را همین‌جا بچسبان.
                                </p>
                                <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} dir="ltr"
                                    placeholder="https://mysite.com/products"
                                    className="mt-2 h-10 w-full rounded-xl border border-outline-variant/50 bg-transparent px-3 text-[12.5px] font-bold text-stone-700 outline-none placeholder:text-stone-300 focus:border-amber-400 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600" />
                            </>
                        )}

                        {/* آدرس هوش مصنوعی‌ها */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10.5px] font-black text-stone-400">هوش مصنوعی‌های معروف:</span>
                            {AI_LINKS.map((a) => (
                                <a key={a.name} href={a.url} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[10.5px] font-extrabold text-stone-600 transition-colors hover:bg-amber-100 hover:text-amber-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-amber-500/10">
                                    {a.name} <ExternalLink className="size-3" />
                                </a>
                            ))}
                        </div>

                        {/* پرامپت آماده */}
                        <div className="mt-2.5 rounded-xl bg-stone-50 p-3 dark:bg-gray-800/60">
                            <p className="max-h-36 overflow-y-auto whitespace-pre-wrap text-[11px] font-bold leading-6 text-stone-600 dark:text-gray-300" dir="rtl">
                                {aiPrompt}
                            </p>
                            <button onClick={() => copyPrompt(aiPrompt)}
                                className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-stone-800 text-[11.5px] font-extrabold text-white hover:bg-stone-700 dark:bg-gray-600 dark:hover:bg-gray-500">
                                <Copy className="size-3.5" /> کپی پرامپت
                            </button>
                        </div>

                        <textarea value={aiText} onChange={(e) => setAiText(e.target.value)} dir="ltr" rows={8}
                            placeholder='[{"name": "پفک مینو", "price": 485000, "unit": "کارتن", "unitQty": 24, "brand": "مینو"}, …]'
                            className="mt-3 w-full resize-y rounded-xl border border-outline-variant/50 bg-transparent p-3.5 text-left text-[12px] font-bold leading-6 text-stone-800 outline-none transition-colors placeholder:text-stone-300 focus:border-amber-400 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-600" />
                        <button onClick={() => runAi(tab === 'site')} disabled={parsePending}
                            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-[13px] font-extrabold text-white transition-colors hover:bg-amber-600 disabled:opacity-50">
                            {parseText.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                            خواندن خروجی هوش مصنوعی
                        </button>
                    </>
                )}
            </div>
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
