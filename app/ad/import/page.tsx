// app/ad/import/page.tsx
// 📥 افزودن گروهی محصول — «موتور رشد کالاهای بازار»
//    پنج منبع ورود، هرکدام یک تب: اکسل | متن | جدول | هوش مصنوعی | از سایت
//    جریان مشترک: انتخاب منبع → پیش‌نمایش ویرایش‌پذیر → ثبت → گزارش کامل (چند موفق/چند رد/چه چیزهای تازه ساخته شد)
//    واحد و برند و کالای مرجعِ نبود، خودکار توسط بک‌اند ساخته می‌شود — هیچ تکراری هم ثبت نمی‌شود.
//    ✅ بازطراحی موبایل‌محور: هدر تمام‌عرض چسبان با سایه (فلش بازگشت استاندارد همهٔ صفحات) +
//       تب‌های زیرخط‌دار به‌سبک تب‌ویو کنسول + جدولِ سریعِ کارت‌شده در موبایل + نوار ثبتِ چسبان
'use client';

import React, { Suspense, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ClipboardPaste, Loader2, Check, AlertTriangle, Copy,
    Package, ListChecks, Store, FileSpreadsheet, Type, Table2,
    Sparkles, Globe, Plus, Trash2, ExternalLink, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdImportParse, useAdImportParseFile, useAdImportCommit, useUnits, useCatalog } from '@/lib/api/apiHooks';
import { NumberInput } from '@/components/common/NumberInput';
import type { ImportItem, ImportReport, ImportSummary } from '@/lib/api/apiService';

const CARD_CLS = 'bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 dark:border-gray-700';

const SAMPLE_TEXT = 'پفک مینو کارتنی ۴۸۵٬۰۰۰\nشیر کاکائو شیرین عاج ۳۲۰٬۰۰۰\nروغن سرخ کردنی ۱۶ لیتری ۱٬۲۵۰٬۰۰۰';

type SourceTab = 'excel' | 'text' | 'grid' | 'ai' | 'site';

const TABS: { key: SourceTab; title: string; icon: React.ReactNode }[] = [
    { key: 'excel', title: 'اکسل', icon: <FileSpreadsheet className="size-[18px] sm:size-4" /> },
    { key: 'text', title: 'متن', icon: <Type className="size-[18px] sm:size-4" /> },
    { key: 'grid', title: 'جدول', icon: <Table2 className="size-[18px] sm:size-4" /> },
    { key: 'ai', title: 'هوش مصنوعی', icon: <Sparkles className="size-[18px] sm:size-4" /> },
    { key: 'site', title: 'از سایت', icon: <Globe className="size-[18px] sm:size-4" /> },
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

/** کلاس مشترک اینپوت‌های جدول/پیش‌نمایش — ارتفاع و عرض در محلِ استفاده داده می‌شود */
const INP = 'rounded-lg border border-outline-variant/40 bg-transparent px-2 text-[12px] font-bold text-stone-700 outline-none placeholder:text-stone-300 focus:border-amber-400 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600';

function ImportContent() {
    const router = useRouter();
    const params = useSearchParams();
    const catalogId = params.get('catalog');

    const parseText = useAdImportParse();
    const parseFile = useAdImportParseFile();
    const commit = useAdImportCommit();
    const { data: units } = useUnits();
    const { data: catalogData } = useCatalog(catalogId ?? '');
    const catalogName: string | undefined = catalogData?.name;

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

    // ─── هدر مشترک هر سه مرحله — نوار تمام‌عرض چسبان با سایه؛ فلش بازگشت استاندارد مثل همهٔ صفحات ───
    //     دسکتاپ هم تمام‌عرض است: دکمهٔ بازگشت در ابتدای هدر (لبهٔ صفحه) می‌نشیند
    const stage: 'source' | 'preview' | 'report' = report ? 'report' : rows.length > 0 ? 'preview' : 'source';
    const handleBack = () => {
        if (stage === 'preview') setRows([]);                                          // یک پله عقب: برگشت به منبع‌ها
        else if (stage === 'report') router.push(`/my-catalogs?catalog=${catalogId}`); // پایان کار: محصولات بازو
        else router.back();                                                            // تازه وارد صفحه شده: مسیر قبلی
    };

    const header = (
        <header className="sticky top-0 z-40 w-full border-b border-stone-200/70 bg-white/90 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.28)] backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90 dark:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.7)]">
            <div className="flex h-14 w-full items-center gap-1.5 px-4 sm:px-6">
                <button onClick={handleBack} aria-label="بازگشت"
                        className="grid size-10 shrink-0 place-items-center rounded-full text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-700 active:scale-90 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                    <ArrowRight className="size-5" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-[15px] font-black leading-6 text-stone-900 dark:text-gray-100">افزودن گروهی محصول</h1>
                    <p className="truncate text-[10.5px] font-bold leading-4 text-stone-400 dark:text-gray-500">
                        {catalogName ? `به بازوی فروش «${catalogName}»` : 'واحد و برندِ نبود، خودکار ساخته می‌شود'}
                    </p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <ClipboardPaste className="size-[18px]" />
                </span>
            </div>
        </header>
    );

    // ─── بدون بازوی فروش مقصد — پیام ساده ───
    if (!catalogId) {
        return (
            <>
                {header}
                <main className="grid min-h-[60vh] place-items-center px-4 py-6">
                    <div className={`${CARD_CLS} max-w-sm w-full p-6 text-center`}>
                        <Package className="w-10 h-10 mx-auto text-amber-500" />
                        <h2 className="mt-3 text-base font-black text-stone-900 dark:text-gray-100">بازوی فروش مقصد مشخص نیست</h2>
                        <p className="mt-2 text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                            برای افزودن گروهی محصول، اول از صفحهٔ محصولاتِ بازوی فروشت شروع کن.
                        </p>
                        <Link href="/my-catalogs"
                              className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-5 text-xs font-extrabold text-white hover:bg-amber-600">
                            <Store className="w-4 h-4" /> بازوهای فروش من
                        </Link>
                    </div>
                </main>
            </>
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
            <>
                {header}
                <main className="mx-auto max-w-2xl px-4 pb-10 pt-4">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`${CARD_CLS} p-5 sm:p-6`}>
                        <div className="flex items-center gap-3">
                            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                                <CheckCircle2 className="size-6" />
                            </span>
                            <div>
                                <h2 className="text-base font-black text-stone-900 dark:text-gray-100">
                                    {fa(report.created)} کالا به بازوی فروشت اضافه شد
                                </h2>
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
                                        {fa(report.createdReferences.length)} کالای مرجع جدید در آی مچ ثبت شد
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
                </main>
            </>
        );
    }

    // ─── مرحلهٔ ۲: پیش‌نمایش و ویرایش (مشترک همهٔ منبع‌ها) ───
    if (rows.length > 0) {
        return (
            <>
                {header}
                <main className="mx-auto max-w-2xl px-4 pt-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-black text-stone-900 dark:text-gray-100">
                            <ListChecks className="size-5 shrink-0 text-amber-500" />
                            پیش‌نمایش لیست
                        </h2>
                        <button onClick={() => setRows([])}
                                className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                            <ArrowRight className="size-3.5" /> برگشت به منبع‌ها
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
                                           className="size-5 shrink-0 accent-amber-500 disabled:opacity-40 sm:size-4"
                                           aria-label={`ثبت ${row.name}`} />
                                    <input value={row.name} disabled={!row.valid}
                                           onChange={(e) => patchRow(idx, { name: e.target.value })}
                                           placeholder="نام کالا"
                                           className="min-w-0 flex-1 bg-transparent text-[13px] font-black text-stone-800 outline-none disabled:text-stone-400 dark:text-gray-100" />
                                    <div className="w-28 shrink-0 sm:w-36">
                                        {row.valid ? (
                                            <NumberInput value={row.price} onChange={(v) => patchRow(idx, { price: v })}
                                                         unit="تومان" placeholder="قیمت" />
                                        ) : (
                                            <span className="block text-center text-[11px] font-bold text-stone-300 dark:text-gray-600">—</span>
                                        )}
                                    </div>
                                </div>

                                {row.valid && (
                                    <div className="mt-2 grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-1.5 sm:ps-6.5">
                                        <input value={row.unitTitle ?? ''} onChange={(e) => patchRow(idx, { unitTitle: e.target.value })}
                                               list="unit-options" placeholder="کارتن"
                                               className={`${INP} h-9 w-full sm:w-28`} />
                                        <span className="hidden text-[10px] font-bold text-stone-400 sm:inline">×</span>
                                        <input type="number" min={2} value={row.unitQty ?? ''} onChange={(e) => patchRow(idx, { unitQty: e.target.value ? Number(e.target.value) : null })}
                                               placeholder="تعداد"
                                               className={`${INP} h-9 w-full sm:w-24`} />
                                        <input value={row.brandTitle ?? ''} onChange={(e) => patchRow(idx, { brandTitle: e.target.value })}
                                               placeholder="برند"
                                               className={`${INP} h-9 w-full sm:w-28`} />
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

                    {/* نوار ثبت چسبان — دکمهٔ ثبت همیشه در دسترس است، حتی وسط لیست بلند */}
                    <div className="sticky bottom-0 -mx-4 mt-4 flex items-center gap-2 border-t border-stone-200/70 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_20px_-12px_rgba(15,23,42,0.35)] backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 dark:shadow-[0_-8px_20px_-12px_rgba(0,0,0,0.8)]">
                        <button onClick={runCommit} disabled={commit.isPending || summary.checked === 0}
                                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
                            {commit.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                            ثبت {fa(summary.checked)} کالا در بازوی فروش
                        </button>
                        <button onClick={() => setRows([])}
                                className="h-12 shrink-0 rounded-xl border border-outline-variant/50 px-4 text-xs font-bold text-stone-500 hover:border-stone-400 dark:text-gray-400">
                            برگشت
                        </button>
                    </div>
                </main>
            </>
        );
    }

    // ─── مرحلهٔ ۱: انتخاب منبع و ورود ───
    const parsePending = parseText.isPending || parseFile.isPending;
    const aiPrompt = buildAiPrompt(tab === 'site' ? siteUrl.trim() || 'https://…' : undefined);

    return (
        <>
            {header}
            <main className="mx-auto max-w-2xl px-4 pb-10 pt-4">
                {/* راهنما */}
                <p className="mb-4 text-[12px] font-bold leading-6 text-stone-500 dark:text-gray-400">
                    برای آسانیِ ورود محصولات، امکان ثبت از لیست‌های مختلف مثل اکسل، فایل ساده یا با استفاده از هوش مصنوعی فراهم شده است.
                    یکی از بهترین‌ها فایل اکسل است؛ اما اگر فایل اکسل محصولات را ندارید می‌توانید از روش‌های دیگر استفاده کنید.
                    دقت کنید این روش‌ها فقط برای ساده‌تر کردنِ ثبت لیست محصول است؛ قطعاً بعد از ورود محصولات باید جزئیات و قیمت‌های
                    آن‌ها را ویرایش و کامل کنید و در صورت نداشتن تصویر، تصویر تک‌تک محصولات را آپلود نمایید.
                </p>

                {/* تب منبع‌ها — سبک تب‌ویو سراسری: زیرخط‌دار؛ در موبایل آیکون بالای برچسب و پهنای مساوی */}
                <div className="-mx-4 mb-4 border-b border-stone-200/70 dark:border-gray-800">
                    <nav aria-label="روش ورود محصولات" className="no-scrollbar flex h-14 items-stretch overflow-x-auto">
                        {TABS.map((t) => {
                            const active = tab === t.key;
                            return (
                                <button key={t.key} type="button" onClick={() => setTab(t.key)} aria-current={active ? 'true' : undefined}
                                        className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 whitespace-nowrap px-1 transition-colors sm:flex-row sm:gap-1.5 sm:px-4 ${
                                            active
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-stone-400 hover:text-stone-600 active:scale-[0.98] dark:text-gray-500 dark:hover:text-gray-300'
                                        }`}>
                                    {t.icon}
                                    <span className={`truncate text-[10px] ${active ? 'font-black' : 'font-bold'} sm:text-[13px] sm:font-extrabold`}>{t.title}</span>
                                    <span className={`absolute bottom-0 inset-x-2 h-[3px] rounded-t-full bg-amber-500 transition-opacity sm:inset-x-3 ${active ? 'opacity-100' : 'opacity-0'}`} />
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className={`${CARD_CLS} p-4 sm:p-5`}>
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

                            {/* سرستون — فقط دسکتاپ؛ در موبایل هر ردیف کارت عمودی است */}
                            <div className="mt-3 hidden items-center gap-1.5 ps-9 text-[10px] font-black text-stone-400 sm:flex">
                                <span className="flex-1">نام کالا</span>
                                <span className="w-20 text-center">واحد</span>
                                <span className="w-16 text-center">تعداد</span>
                                <span className="w-20 text-center">برند</span>
                                <span className="w-28 text-center">قیمت (تومان)</span>
                            </div>

                            <div className="mt-2 space-y-2 sm:mt-3">
                                {grid.map((g, i) => (
                                    <div key={i} className="rounded-xl border border-outline-variant/30 p-2 dark:border-gray-700/60 sm:rounded-none sm:border-0 sm:p-0">
                                        <div className="flex items-start gap-1.5 sm:items-center">
                                            <button onClick={() => setGrid((prev) => prev.filter((_, j) => j !== i))}
                                                    disabled={grid.length <= 1}
                                                    className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30 sm:mt-0 sm:size-7 dark:hover:bg-red-500/10"
                                                    title="حذف این ردیف" aria-label="حذف این ردیف">
                                                <Trash2 className="size-4 sm:size-3.5" />
                                            </button>
                                            <div className="min-w-0 flex-1">
                                                <input value={g.name} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
                                                       placeholder="مثلاً: پفک مینو کارتنی"
                                                       className={`${INP} h-10 w-full sm:h-9`} />

                                                {/* موبایل: فیلدها زیر نام — بزرگ و لمس‌پذیر */}
                                                <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:hidden">
                                                    <input value={g.unit} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, unit: e.target.value } : r)))}
                                                           list="unit-options" placeholder="کارتن"
                                                           className={`${INP} h-9 w-full text-center`} />
                                                    <input value={g.qty} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, qty: e.target.value } : r)))}
                                                           inputMode="numeric" placeholder="تعداد"
                                                           className={`${INP} h-9 w-full text-center`} />
                                                    <input value={g.brand} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, brand: e.target.value } : r)))}
                                                           placeholder="برند"
                                                           className={`${INP} h-9 w-full text-center`} />
                                                </div>
                                                <input value={g.price} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))}
                                                       inputMode="numeric" placeholder="قیمت (تومان)"
                                                       className={`${INP} mt-1.5 h-10 w-full text-center sm:hidden`} />

                                                {/* دسکتاپ: همهٔ فیلدها در یک ردیف */}
                                                <div className="hidden items-center gap-1.5 sm:flex">
                                                    <input value={g.unit} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, unit: e.target.value } : r)))}
                                                           list="unit-options" placeholder="کارتن"
                                                           className={`${INP} h-9 w-20 shrink-0 text-center`} />
                                                    <input value={g.qty} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, qty: e.target.value } : r)))}
                                                           inputMode="numeric" placeholder="۲۴"
                                                           className={`${INP} h-9 w-16 shrink-0 text-center`} />
                                                    <input value={g.brand} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, brand: e.target.value } : r)))}
                                                           placeholder="مینو"
                                                           className={`${INP} h-9 w-20 shrink-0 text-center`} />
                                                    <input value={g.price} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)))}
                                                           inputMode="numeric" placeholder="۴۸۵٬۰۰۰"
                                                           className={`${INP} h-9 w-28 shrink-0 text-center`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button onClick={() => setGrid((prev) => [...prev, emptyGridRow()])}
                                        className="h-11 rounded-xl border border-dashed border-outline-variant/50 px-4 text-[11.5px] font-extrabold text-stone-500 hover:border-amber-400 dark:text-gray-400">
                                    <Plus className="me-1 inline size-3.5" /> ردیف
                                </button>
                                <button onClick={runGrid} disabled={parsePending}
                                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 text-[12.5px] font-extrabold text-white hover:bg-amber-600 disabled:opacity-50">
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
            </main>
        </>
    );
}

export default function AdImportPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-6 animate-spin text-stone-300" /></div>}>
            <ImportContent />
        </Suspense>
    );
}
