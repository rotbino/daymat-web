// app/ad/import/page.tsx
// 📥 افزودن گروهی محصول — «موتور رشد کالاهای بازار»
//    شش منبع ورود، هرکدام یک تب: اکسل | متن | جدول | هوش مصنوعی | از سایت | از کاتالوگ
//    جریان مشترک: انتخاب منبع → پیش‌نمایش ویرایش‌پذیر → ثبت → گزارش کامل (چند موفق/چند رد/چه چیزهای تازه ساخته شد)
//    واحد و برند و کالای مرجعِ نبود، خودکار توسط بک‌اند ساخته می‌شود — هیچ تکراری هم ثبت نمی‌شود.
//    ✅ قیمت واردشده = قیمت عمدهٔ «یک عدد» — قیمت کارتن از تعداد محاسبه می‌شود (تعدادِ نبود = ۱)
//    ✅ مدال راهنمای هر تب — شکل درست ستون‌های اکسل + نمونهٔ دوردیفی + قالب پنج‌خطی متن
//    ✅ پرسش واحد پول قیمت‌ها — اگر فایل/خروجی ریالی بود، موقع پارس ده‌تا یکی می‌شود (تومان نداریم چون فیلتر بازار می‌شکند)
//    ✅ کالاهای ایمپورت‌شده با برچسب «نیاز به تکمیل» ثبت می‌شوند — تا ویرایش در کاتالوگ عمومی دیده نمی‌شوند
//    ✅ تب «از کاتالوگ» — جست‌وجوی کسب‌وکار، تیک کالاهای بازوی فروش دیگران (با اجازهٔ صاحب بازو) و کپی چندثانیه‌ای؛
//       صاحب بازو در تنظیماتش تیک «اجازهٔ کپی محصولات» را روشن/خاموش می‌کند — برای تیم‌های فروش که یک نفر لیست را می‌سازد
//    ✅ بازطراحی موبایل‌محور: هدر تمام‌عرض چسبان با سایه (فلش بازگشت استاندارد همهٔ صفحات) +
//       تب‌های زیرخط‌دار به‌سبک تب‌ویو کنسول + جدولِ سریعِ کارت‌شده در موبایل + نوار ثبتِ چسبان
'use client';

import React, { Suspense, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardPaste, Loader2, Check, AlertTriangle, Copy, CopyPlus,
    Package, ListChecks, Store, FileSpreadsheet, Type, Table2,
    Sparkles, Globe, Plus, Trash2, ExternalLink, CheckCircle2, ArrowRight,
    CircleHelp, X, Info, ImageIcon, Search, Lock, Phone, Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdImportParse, useAdImportParseFile, useAdImportCommit, useUnits, useCatalog } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { NumberInput } from '@/components/common/NumberInput';
import { currencyLabel } from '@/lib/utils/brand';
import type { ImportItem, ImportReport, ImportSummary } from '@/lib/api/apiService';

const CARD_CLS = 'bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/40 dark:border-gray-700';

/** قالب پنج‌خطی متن — هر خط یک کالا: نام | برند | واحد | تعداد در واحد | قیمت عمدهٔ یک عدد */
const SAMPLE_TEXT = [
    'کالای اول | برند کالای اول (ندارد؟ بنویس ندارد) | کارتن | ۲۴ | قیمت عمده یک عدد',
    'کالای دوم | برند دوم | بسته | ۱۰ | قیمت عمده یک عدد',
    'کالای سوم | ندارد | عدد | ۱ | قیمت عمده یک عدد',
    'کالای چهارم | برند چهارم | کیلوگرم | | قیمت عمده یک عدد',
    'کالای پنجم | برند پنجم | شانه | ۲۰ | قیمت عمده یک عدد',
].join('\n');

type SourceTab = 'excel' | 'text' | 'grid' | 'ai' | 'site' | 'copy';

const TABS: { key: SourceTab; title: string; icon: React.ReactNode }[] = [
    { key: 'excel', title: 'اکسل', icon: <FileSpreadsheet className="size-[18px] sm:size-4" /> },
    { key: 'text', title: 'متن', icon: <Type className="size-[18px] sm:size-4" /> },
    { key: 'grid', title: 'جدول', icon: <Table2 className="size-[18px] sm:size-4" /> },
    { key: 'ai', title: 'هوش مصنوعی', icon: <Sparkles className="size-[18px] sm:size-4" /> },
    { key: 'site', title: 'از سایت', icon: <Globe className="size-[18px] sm:size-4" /> },
    { key: 'copy', title: 'از کاتالوگ', icon: <CopyPlus className="size-[18px] sm:size-4" /> },
];

/** پرامپت آماده برای هوش مصنوعی — کاربر فایل/سایتش را با همین متن به ChatGPT/DeepSeek می‌دهد */
function buildAiPrompt(siteUrl?: string): string {
    const source = siteUrl
        ? `محصولات این صفحهٔ اینترنتی را بخوان و استخراج کن: ${siteUrl}`
        : 'من لیست قیمت محصولاتم را برایت می‌فرستم (فایل اکسل، عکس، PDF یا متن).';
    return `${source}
آن‌ها را دقیقاً به این شکل JSON برگردان — فقط JSON خالص، بدون هیچ توضیح اضافه:
[
  {"name": "نام کامل کالا", "price": 485000, "unit": "کارتن", "unitQty": 24, "brand": "نام برند", "priceBasis": "single"}
]
قواعد:
- price: قیمت عمدهٔ «یک عدد» به تومان — اگر کالا کارتنی است قیمتِ هر یک عددش را بده نه قیمت کل کارتن — عدد کامل و بدون اعشار و جداکننده. اگر قیمت‌ها ریال بود خودت تقسیم بر ۱۰ کن و به تومان بده
- priceBasis: اگر قیمتِ اصلیِ منبع «هر یک عدد» بود "single" بنویس (همین پیش‌فرض است). اگر فقط قیمتِ کلِ بسته/کارتن را داشتی، همان را در price بده و "priceBasis": "package" بنویس — در این حالت نوشتنِ unitQty (تعداد داخل بسته) الزامی است
- unit: واحد فروش مثل کارتن، بسته، عدد، کیلوگرم (اگر مشخص نیست این کلید را ننویس)
- unitQty: تعداد داخل واحد مثل ۲۴ برای کارتن ۲۴تایی (اگر مشخص نیست ننویس)
- brand: برند کالا (اگر مشخص نیست ننویس)`;
}

const AI_LINKS = [
    { name: 'ChatGPT', url: 'https://chatgpt.com' },
    { name: 'DeepSeek', url: 'https://chat.deepseek.com' },
    { name: 'Gemini', url: 'https://gemini.google.com' },
];

interface GridRow { name: string; brand: string; unit: string; qty: string; priceNum?: number }

const emptyGridRow = (): GridRow => ({ name: '', brand: '', unit: '', qty: '', priceNum: undefined });

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
    // 💱 واحد پول قیمت‌های ورودی — پیش‌فرض تومان؛ اگر فایل/خروجی ریالی بود، موقع پارس ده‌تا یکی می‌شود
    const [priceCurrency, setPriceCurrency] = useState<'toman' | 'rial'>('toman');
    // 📦 مبنای قیمت — «یک عدد» یا «هر بسته/کارتن»؛ بسته‌ای بودن تعداد در بسته را اجباری می‌کند
    const [priceBasis, setPriceBasis] = useState<'single' | 'package'>('single');
    // 📖 مدال راهنما — per-tab محتوا دارد
    const [helpOpen, setHelpOpen] = useState(false);
    // 💾 آخرین ورودی هر منبع — برای بازخوانی بعد از تغییر واحد پول/مبنای قیمت در پیش‌نمایش
    const [lastSource, setLastSource] = useState<{ kind: 'text' | 'excel' | 'ai' | 'grid'; text?: string; file?: File; grid?: GridRow[] } | null>(null);

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
    const curLabel = currencyLabel(catalogData?.config?.currency); // واحد پول نمایشی بازوی فروش — پیش‌فرض تومان
    const parsePending = parseText.isPending || parseFile.isPending;

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

    /** 🖼️ گزارش عکس‌های گرفته‌شده از اکسل */
    const toastImages = (images?: { found: number; attached: number; skipped: number }) => {
        if (images?.attached) toast.success(`${images.attached.toLocaleString('fa-IR')} عکس از فایل اکسل گرفته شد — با ثبت به کالاها وصل می‌شود`);
        else if (images && images.found > 0 && images.attached === 0) toast.info('عکسِ قابل‌برداشت در فایل پیدا نشد — عکس‌ها باید کنار ردیفِ کالا و به فرمت PNG/JPG باشند');
    };

    const errToast = (e: any, fallback: string) =>
        toast.error(e?.response?.data?.message || e?.message || fallback);

    // ─── اجرای پارس برای هر تب ───
    const runExcel = async (file: File, cur?: 'toman' | 'rial', basis?: 'single' | 'package') => {
        try {
            const res = await parseFile.mutateAsync({ catalogId, file, priceCurrency: cur ?? priceCurrency, priceBasis: basis ?? priceBasis });
            setFileName(file.name);
            setLastSource({ kind: 'excel', file });
            showItems(res.items);
            toastImages(res.images);
        } catch (e: any) { errToast(e, 'خواندن فایل ناموفق بود'); }
    };

    const runText = async (cur?: 'toman' | 'rial', basis?: 'single' | 'package') => {
        if (text.trim().length < 3) { toast.error('چیزی برای خواندن نیست — لیستت را بچسبان یا تایپ کن'); return; }
        try {
            const res = await parseText.mutateAsync({ catalogId, text, source: 'text', priceCurrency: cur ?? priceCurrency, priceBasis: basis ?? priceBasis });
            setLastSource({ kind: 'text', text });
            showItems(res.items);
        } catch (e: any) { errToast(e, 'خواندن لیست ناموفق بود'); }
    };

    const gridJson = (g: GridRow[]) => JSON.stringify(g
        .filter((x) => x.name.trim() || (x.priceNum ?? 0) > 0)
        .map((x) => ({
            name: x.name.trim(),
            price: x.priceNum ?? 0,
            unitTitle: x.unit.trim(),
            unitQty: x.qty.trim(),
            brandTitle: x.brand.trim(),
        })));

    const runGrid = async (cur?: 'toman' | 'rial', basis?: 'single' | 'package') => {
        const filled = grid.filter((g) => g.name.trim() || (g.priceNum ?? 0) > 0);
        if (!filled.length) { toast.error('حداقل یک ردیف را پر کن'); return; }
        try {
            const res = await parseText.mutateAsync({
                catalogId,
                text: gridJson(grid),
                source: 'json',
                priceCurrency: cur ?? priceCurrency,
                priceBasis: basis ?? priceBasis,
            });
            setLastSource({ kind: 'grid', grid: grid.map((g) => ({ ...g })) });
            showItems(res.items);
        } catch (e: any) { errToast(e, 'خواندن ردیف‌ها ناموفق بود'); }
    };

    const runAi = async (isSite: boolean, cur?: 'toman' | 'rial', basis?: 'single' | 'package') => {
        const src = aiText.trim();
        if (src.length < 3) { toast.error(isSite ? 'خروجی هوش مصنوعی را بچسبان' : 'خروجی هوش مصنوعی را در کادر بچسبان'); return; }
        try {
            const res = await parseText.mutateAsync({ catalogId, text: src, source: 'json', priceCurrency: cur ?? priceCurrency, priceBasis: basis ?? priceBasis });
            setLastSource({ kind: 'ai', text: src });
            showItems(res.items);
        } catch (e: any) { errToast(e, 'خواندن خروجی هوش مصنوعی ناموفق بود'); }
    };

    /** 💱📦 تغییر سوییچ‌های قیمت (واحد پول/مبنای قیمت) در پیش‌نمایش — همان منبع دوباره خوانده می‌شود */
    const reparseWithSwitches = async (cur: 'toman' | 'rial', basis: 'single' | 'package') => {
        if (!lastSource) return;
        if (lastSource.kind === 'excel' && lastSource.file) { await runExcel(lastSource.file, cur, basis); return; }
        if (lastSource.kind === 'grid' && lastSource.grid) {
            try {
                const res = await parseText.mutateAsync({ catalogId, text: gridJson(lastSource.grid), source: 'json', priceCurrency: cur, priceBasis: basis });
                showItems(res.items);
            } catch (e: any) { errToast(e, 'خواندن ردیف‌ها ناموفق بود'); }
            return;
        }
        if (lastSource.kind === 'text' && lastSource.text != null) {
            try {
                const res = await parseText.mutateAsync({ catalogId, text: lastSource.text, source: 'text', priceCurrency: cur, priceBasis: basis });
                showItems(res.items);
            } catch (e: any) { errToast(e, 'خواندن لیست ناموفق بود'); }
            return;
        }
        if (lastSource.kind === 'ai' && lastSource.text != null) {
            try {
                const res = await parseText.mutateAsync({ catalogId, text: lastSource.text, source: 'json', priceCurrency: cur, priceBasis: basis });
                showItems(res.items);
            } catch (e: any) { errToast(e, 'خواندن خروجی هوش مصنوعی ناموفق بود'); }
        }
    };

    const switchCurrency = (cur: 'toman' | 'rial') => {
        if (cur === priceCurrency) return;
        setPriceCurrency(cur);
        if (rows.length) reparseWithSwitches(cur, priceBasis);
    };

    const switchBasis = (basis: 'single' | 'package') => {
        if (basis === priceBasis) return;
        setPriceBasis(basis);
        if (rows.length) reparseWithSwitches(priceCurrency, basis);
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
                    imageFileId: r.image?.fileId || undefined, // 🖼️ عکسِ اکسل — با ثبت به آگهی وصل می‌شود
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
                                {!!report.imagesAttached && report.imagesAttached > 0 && (
                                    <p className="text-[11.5px] font-bold leading-6 text-emerald-800 dark:text-emerald-300">
                                        🖼️ {fa(report.imagesAttached)} عکس از اکسل به کالاها وصل شد
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
                            {report.needsCompletion && report.needsCompletion > 0 ? (
                                <span className="mb-2 block rounded-xl bg-amber-50/80 px-3 py-2.5 text-[11.5px] font-bold leading-6 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                                    🏷️ این کالاها با برچسب «نیاز به تکمیل» ثبت شدند و تا وقتی ویرایش و تکمیلشان نکنی،
                                    در کاتالوگ عمومی و تابلوی بازار دیده نمی‌شوند — از تب «محصولات» با فیلتر
                                    «نیاز به تکمیل» پیدایشان کن، دکمهٔ ویرایش را بزن و عکس و جزئیات را کامل کن.
                                </span>
                            ) : null}
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

                    {/* 💱📦 سوییچ‌های قیمت — واحد پول + مبنای قیمت (تکی/بسته)؛ هر تغییری همان منبع را دوباره می‌خواند */}
                    <div className={`${CARD_CLS} mb-3 flex flex-wrap items-center gap-2 p-3`}>
                        <span className="text-[11px] font-black text-stone-500 dark:text-gray-400">قیمت‌های ورودی به:</span>
                        <div className="flex rounded-full border border-outline-variant/40 p-0.5 dark:border-gray-700">
                            {([['toman', 'تومان'], ['rial', 'ریال — ده‌تا یکی می‌شود']] as const).map(([v, label]) => (
                                <button key={v} onClick={() => switchCurrency(v)} disabled={parsePending}
                                        className={`h-7 rounded-full px-3 text-[10.5px] font-extrabold transition-colors disabled:opacity-50 ${
                                            priceCurrency === v
                                                ? 'bg-amber-500 text-white'
                                                : 'text-stone-500 hover:text-amber-600 dark:text-gray-400'
                                        }`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        {priceCurrency === 'rial' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                                <Info className="size-3" /> همهٔ قیمت‌ها به تومان تبدیل شدند
                            </span>
                        )}
                        <span className="hidden h-5 w-px bg-stone-200 sm:inline-block dark:bg-gray-700" />
                        <span className="text-[11px] font-black text-stone-500 dark:text-gray-400">قیمت هر:</span>
                        <div className="flex rounded-full border border-outline-variant/40 p-0.5 dark:border-gray-700">
                            {([['single', 'یک عدد'], ['package', 'بسته / کارتن']] as const).map(([v, label]) => (
                                <button key={v} onClick={() => switchBasis(v)} disabled={parsePending}
                                        className={`h-7 rounded-full px-3 text-[10.5px] font-extrabold transition-colors disabled:opacity-50 ${
                                            priceBasis === v
                                                ? 'bg-amber-500 text-white'
                                                : 'text-stone-500 hover:text-amber-600 dark:text-gray-400'
                                        }`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        {priceBasis === 'package' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-400">
                                <Info className="size-3" /> تعداد در بسته لازم است — قیمت تکی خودکار تقسیم می‌شود
                            </span>
                        )}
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
                        {rows.map((row, idx) => {
                            const qtyNum = Number(row.unitQty ?? 0);
                            const hasQty = Number.isFinite(qtyNum) && qtyNum >= 2;
                            const saleUnitPrice = hasQty ? row.price * Math.floor(qtyNum) : row.price;
                            // 📦 اگر قیمت «هر بسته» بود، قیمت بسته‌یِ اصلیِ کاربر دقیق‌تر از حاصل‌ضرب گردشده است
                            const packagePrice = row.inputPrice ?? saleUnitPrice;
                            const canFixQty = !row.valid && row.fixable === 'qty';
                            // 🛠️ نوشتنِ «تعداد در بسته» روی ردیفِ ردشده — همان‌جا زنده می‌شود
                            const onQtyChange = (raw: number | null) => {
                                if (canFixQty && raw != null && raw >= 1 && (row.inputPrice ?? 0) > 0) {
                                    const q = Math.floor(raw);
                                    const single = Math.round((row.inputPrice as number) / q);
                                    patchRow(idx, {
                                        unitQty: q, valid: true, price: single, fixable: null, reason: undefined, checked: true,
                                        warnings: [`${(row.inputPrice as number).toLocaleString('fa-IR')} ÷ ${q.toLocaleString('fa-IR')} = ${single.toLocaleString('fa-IR')} — قیمت یک عدد حساب شد`],
                                    });
                                } else {
                                    patchRow(idx, { unitQty: raw });
                                }
                            };
                            return (
                            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className={`${CARD_CLS} p-3 ${!row.valid ? 'opacity-70' : ''}`}>
                                <div className="flex items-center gap-2.5">
                                    <input type="checkbox" checked={!!row.checked} disabled={!row.valid}
                                           onChange={(e) => patchRow(idx, { checked: e.target.checked })}
                                           className="size-5 shrink-0 accent-amber-500 disabled:opacity-40 sm:size-4"
                                           aria-label={`ثبت ${row.name}`} />
                                    {/* 🖼️ عکسِ گرفته‌شده از اکسل — با ثبت به کالا وصل می‌شود */}
                                    {row.image && (
                                        <a href={row.image.url} target="_blank" rel="noreferrer" title="عکسِ گرفته‌شده از اکسل"
                                           className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-outline-variant/40 sm:size-11 dark:border-gray-700">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={row.image.thumbnailUrl || row.image.url} alt=""
                                                 className="size-full object-cover" />
                                        </a>
                                    )}
                                    <input value={row.name} disabled={!row.valid}
                                           onChange={(e) => patchRow(idx, { name: e.target.value })}
                                           placeholder="نام کالا"
                                           className="min-w-0 flex-1 bg-transparent text-[13px] font-black text-stone-800 outline-none disabled:text-stone-400 dark:text-gray-100" />
                                    <div className="w-28 shrink-0 sm:w-36">
                                        {row.valid ? (
                                            <NumberInput value={row.price} onChange={(v) => patchRow(idx, { price: v })}
                                                         placeholder="قیمت ۱ عدد" />
                                        ) : (
                                            <span className="block text-center text-[11px] font-bold text-stone-300 dark:text-gray-600">—</span>
                                        )}
                                    </div>
                                </div>

                                {/* 💰 دو قیمت کنار هم — قیمت تکی عمده (واردشده) + قیمت واحد فروش (محاسبه‌شده از تعداد) */}
                                {row.valid && row.price > 0 && (
                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-stone-50 px-3 py-2 dark:bg-gray-800/60">
                                        <span className="text-[10.5px] font-bold text-stone-500 dark:text-gray-400">
                                            قیمت عمدهٔ یک عدد:
                                            <b className="ms-1 text-[12px] text-stone-800 dark:text-gray-100">{row.price.toLocaleString('fa-IR')} {curLabel}</b>
                                        </span>
                                        <span className="text-[10.5px] font-bold text-stone-500 dark:text-gray-400">
                                            قیمت {row.unitTitle?.trim() || 'واحد فروش'}:
                                            <b className={`ms-1 text-[12px] ${hasQty ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-gray-500'}`}>{packagePrice.toLocaleString('fa-IR')} {curLabel}</b>
                                        </span>
                                        {!hasQty && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                <AlertTriangle className="size-3" />
                                                تعداد در واحد ندادی — فرض شد ۱؛ اگر این کالا کارتنی/بسته‌ای است، تعدادش را بنویس تا قیمت کارتن درست حساب شود
                                            </span>
                                        )}
                                    </div>
                                )}

                                {(row.valid || canFixQty) && (
                                    <div className="mt-2 grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-1.5 sm:ps-6.5">
                                        <input value={row.unitTitle ?? ''} onChange={(e) => patchRow(idx, { unitTitle: e.target.value })}
                                               list="unit-options" placeholder="کارتن"
                                               className={`${INP} h-9 w-full sm:w-28`} />
                                        <span className="hidden text-[10px] font-bold text-stone-400 sm:inline">×</span>
                                        <input type="number" min={1} value={row.unitQty ?? ''}
                                               onChange={(e) => onQtyChange(e.target.value ? Number(e.target.value) : null)}
                                               placeholder={canFixQty ? 'تعداد در بسته؟' : 'تعداد'}
                                               className={`${INP} h-9 w-full sm:w-24 ${canFixQty ? 'border-amber-400' : ''}`} />
                                        <input value={row.brandTitle ?? ''} onChange={(e) => patchRow(idx, { brandTitle: e.target.value })}
                                               placeholder="برند"
                                               className={`${INP} h-9 w-full sm:w-28`} />
                                    </div>
                                )}
                                {canFixQty && (
                                    <p className="mt-1.5 ps-6.5 text-[10px] font-bold leading-5 text-amber-600 dark:text-amber-400">
                                        💡 همین‌جا «تعداد در بسته» را بنویس — قیمت یک عدد خودش حساب می‌شود و ردیف زنده می‌شود
                                    </p>
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
                            );
                        })}
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
    const aiPrompt = buildAiPrompt(tab === 'site' ? siteUrl.trim() || 'https://…' : undefined);

    return (
        <>
            {header}
            <main className="mx-auto max-w-2xl px-4 pb-10 pt-4">
                {/* راهنما */}
                <p className="mb-4 text-[12px] font-bold leading-6 text-stone-500 dark:text-gray-400">
                    برای آسانیِ ورود محصولات، امکان ثبت از لیست‌های مختلف مثل اکسل، فایل ساده یا با استفاده از هوش مصنوعی فراهم شده است.
                    یکی از بهترین‌ها فایل اکسل است؛ اما اگر فایل اکسل محصولات را ندارید می‌توانید از روش‌های دیگر استفاده کنید.
                    اگر هم کاتالوگت را همکارت از تیم فروش ساخته، از تب «از کاتالوگ» با اجازهٔ او کپی کن — لازم نیست از صفر وارد کنی.
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
                    {/* نوار راهنما + سوییچ‌های قیمت (واحد پول + مبنای قیمت) — بالای همهٔ منبع‌ها؛ تب کپی سوییچ نمی‌خواهد */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2.5 dark:bg-gray-800/60">
                        <button onClick={() => setHelpOpen(true)}
                                className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-amber-700 transition-colors hover:text-amber-800 dark:text-amber-400">
                            <CircleHelp className="size-4" /> راهنمای این روش را ببین
                        </button>
                        {tab !== 'copy' && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10.5px] font-black text-stone-400">قیمت‌هایم به:</span>
                            <div className="flex rounded-full border border-outline-variant/40 p-0.5 dark:border-gray-700">
                                {([['toman', 'تومان'], ['rial', 'ریال']] as const).map(([v, label]) => (
                                    <button key={v} onClick={() => switchCurrency(v)}
                                            className={`h-6.5 rounded-full px-2.5 text-[10px] font-extrabold transition-colors ${
                                                priceCurrency === v
                                                    ? 'bg-amber-500 text-white'
                                                    : 'text-stone-500 hover:text-amber-600 dark:text-gray-400'
                                            }`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <span className="hidden h-5 w-px bg-stone-200 sm:inline-block dark:bg-gray-700" />
                            <span className="text-[10.5px] font-black text-stone-400">قیمت هر:</span>
                            <div className="flex rounded-full border border-outline-variant/40 p-0.5 dark:border-gray-700">
                                {([['single', 'یک عدد'], ['package', 'بسته/کارتن']] as const).map(([v, label]) => (
                                    <button key={v} onClick={() => switchBasis(v)}
                                            className={`h-6.5 rounded-full px-2.5 text-[10px] font-extrabold transition-colors ${
                                                priceBasis === v
                                                    ? 'bg-amber-500 text-white'
                                                    : 'text-stone-500 hover:text-amber-600 dark:text-gray-400'
                                            }`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        )}
                    </div>

                    {tab === 'copy' && <CopyTabContent catalogId={catalogId} catalogName={catalogName} />}

                    {tab === 'excel' && (
                        <>
                            <p className="text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                                فایل اکسل یا CSV را انتخاب کن. ستون‌های «نام کالا» و «قیمت» را خودم می‌شناسم؛
                                «برند»، «واحد» و «تعداد در واحد» هم اگر باشند بهتر. اگر ریالی قیمت دادی، بالا روی «ریال» بزن تا ده‌تا یکی شود،
                                و اگر قیمت‌هات مالِ هر بسته/کارتن است، روی «بسته/کارتن» بزن.
                            </p>
                            <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-emerald-50/70 px-3 py-2 text-[11px] font-bold leading-5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                                <ImageIcon className="mt-0.5 size-3.5 shrink-0" />
                                اگر کنار ردیفِ هر کالا داخل خود اکسل عکس گذاشته باشی، عکس‌ها را خودکار برمی‌دارم و با ثبت به کالاها می‌زنم
                                (فقط فایل xlsx و عکس‌های PNG/JPG/GIF/WEBP — عکس داخل سلول نباشد، کنار ردیف کافی است).
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
                                پنج خط برایت آماده کردم — به‌جای «کالای اول»، «برند کالای اول» و «قیمت عمده یک عدد» مقدار واقعی را بنویس.
                                فیلدی را نداری؟ خالی بگذار یا «ندارد» بنویس. خط‌های بیشتر هم مشکلی ندارد — هر خط یک کالا.
                            </p>
                            <textarea value={text} onChange={(e) => setText(e.target.value)} dir="rtl" rows={10}
                                      placeholder={SAMPLE_TEXT}
                                      className="mt-3 w-full resize-y rounded-xl border border-outline-variant/50 bg-transparent p-3.5 text-[13px] font-bold leading-7 text-stone-800 outline-none transition-colors placeholder:text-stone-300 focus:border-amber-400 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-600" />
                            <div className="mt-3 flex items-center gap-2">
                                <button onClick={() => runText()} disabled={parsePending}
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
                                ردیف‌به‌ردیف تایپ کن — قیمت را «عمدهٔ یک عدد» بنویس؛ قیمت کارتن خودش از تعداد حساب می‌شود.
                                اگر قیمت‌هات مالِ هر بسته/کارتن است، بالای فرم روی «بسته/کارتن» بزن — آن‌وقت نوشتنِ تعداد در بسته لازم است.
                                پر نکردن‌ها اشکالی ندارد.
                            </p>
                            <datalist id="unit-options">
                                {unitOptions.map((u) => <option key={u.id} value={u.title} />)}
                            </datalist>

                            {/* سرستون — فقط دسکتاپ؛ در موبایل هر ردیف کارت عمودی است */}
                            <div className="mt-3 hidden items-center gap-1.5 ps-9 text-[10px] font-black text-stone-400 sm:flex">
                                <span className="flex-1">نام کالا</span>
                                <span className="w-20 text-center">واحد</span>
                                <span className="w-16 text-center">{priceBasis === 'package' ? 'تعداد در بسته' : 'تعداد'}</span>
                                <span className="w-20 text-center">برند</span>
                                <span className="w-32 text-center">{priceBasis === 'package' ? 'قیمت هر بسته' : 'قیمت عمدهٔ ۱ عدد'}</span>
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
                                                {/* ✅ قیمت با نامبر اینپوت — همیشه با فرمت سه‌رقمی (خیلی مهم) */}
                                                <div className="mt-1.5 sm:hidden">
                                                    <NumberInput value={g.priceNum} onChange={(v) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, priceNum: v } : r)))}
                                                                 placeholder={priceBasis === 'package' ? 'قیمت هر بسته' : 'قیمت عمدهٔ ۱ عدد'} />
                                                </div>

                                                {/* دسکتاپ: همهٔ فیلدها در یک ردیف */}
                                                <div className="hidden items-center gap-1.5 sm:flex">
                                                    <input value={g.unit} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, unit: e.target.value } : r)))}
                                                           list="unit-options" placeholder="کارتن"
                                                           className={`${INP} h-9 w-20 shrink-0 text-center`} />
                                                    <input value={g.qty} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, qty: e.target.value } : r)))}
                                                           inputMode="numeric" placeholder={priceBasis === 'package' ? 'تعداد در بسته' : '۲۴'}
                                                           className={`${INP} h-9 w-20 shrink-0 text-center`} />
                                                    <input value={g.brand} onChange={(e) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, brand: e.target.value } : r)))}
                                                           placeholder="مینو"
                                                           className={`${INP} h-9 w-20 shrink-0 text-center`} />
                                                    <div className="w-32 shrink-0">
                                                        <NumberInput value={g.priceNum} onChange={(v) => setGrid((prev) => prev.map((r, j) => (j === i ? { ...r, priceNum: v } : r)))}
                                                                     placeholder={priceBasis === 'package' ? 'قیمت هر بسته' : '۴۸۵٬۰۰۰'} />
                                                    </div>
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
                                <button onClick={() => runGrid()} disabled={parsePending}
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

            {/* 📖 مدال راهنما — از نوار بالای کارت منبع‌ها باز می‌شود */}
            <AnimatePresence>
                {helpOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <HelpModal tab={tab} onClose={() => setHelpOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ═══════════════════════════════════════════════════════════
// 📋 تب «از کاتالوگ» — کپی کالاها از بازوی فروش کسب‌وکار دیگر
//    سرچ نام شرکت/بازو → لیست بازوها → تیک تک‌تک یا همهٔ کالاها → کپی به بازوی من.
//    شرط: صاحب بازو تیک «اجازهٔ کپی محصولات» را در تنظیماتش روشن کرده باشد؛
//    اگر نه، پیام تماس می‌بینیم تا ازش بخواهیم برای چند لحظه تیک را روشن کند.
// ═══════════════════════════════════════════════════════════
function CopyTabContent({ catalogId, catalogName }: { catalogId: string; catalogName?: string }) {
    const router = useRouter();

    // 🔎 جست‌وجو
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);

    // 📦 بازوی انتخاب‌شده و کالاهایش
    const [selected, setSelected] = useState<any | null>(null);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [checked, setChecked] = useState<Set<string>>(new Set());

    // 📋 کپی و گزارش
    const [copying, setCopying] = useState(false);
    const [report, setReport] = useState<{ copied: number; skipped: number; failed: { name: string; reason: string }[] } | null>(null);

    const fa = (n: number) => n.toLocaleString('fa-IR');

    // سرچ با تاخیر — حداقل دو حرف، ۴۰۰ms بعد از تایپ
    React.useEffect(() => {
        const q = query.trim();
        if (q.length < 2) { setResults([]); setSearched(false); return; }
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await apiService.catalog.copySearch(q);
                setResults(res.items || []);
                setSearched(true);
            } catch (e: any) { toast.error(e?.response?.data?.message || e?.message || 'جست‌وجو ناموفق بود'); }
            finally { setSearching(false); }
        }, 400);
        return () => clearTimeout(t);
    }, [query]);

    const openCatalog = async (c: any) => {
        if (!c.copyAllowed) return; // غیرفعال — فقط پیام تماس نشان داده می‌شود
        setSelected(c);
        setLoadingProducts(true);
        setReport(null);
        try {
            const res = await apiService.catalog.copyProducts(c.id);
            setProducts(res.items || []);
            setChecked(new Set((res.items || []).map((p: any) => p.id))); // پیش‌فرض: همه تیک
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'خواندن کالاهای این بازو ممکن نشد');
            setSelected(null);
        } finally { setLoadingProducts(false); }
    };

    const backToResults = () => { setSelected(null); setProducts([]); setChecked(new Set()); setReport(null); };

    const toggle = (id: string) =>
        setChecked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const allChecked = products.length > 0 && checked.size === products.length;

    const doCopy = async () => {
        if (!checked.size) { toast.error('حداقل یک کالا را تیک بزن'); return; }
        setCopying(true);
        try {
            const rep = await apiService.catalog.copyCommit({
                sourceCatalogId: selected.id,
                targetCatalogId: catalogId,
                adIds: Array.from(checked),
            });
            setReport({ copied: rep.copied ?? 0, skipped: rep.skipped ?? 0, failed: rep.failed || [] });
            toast.success(`${fa(rep.copied ?? 0)} کالا به «${catalogName || 'بازوی فروشت'}» کپی شد`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'کپی ناموفق بود');
        } finally { setCopying(false); }
    };

    // ── گزارش کپی ──
    if (report) {
        return (
            <div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl bg-emerald-50/70 p-4 dark:bg-emerald-500/10">
                    <div className="flex items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-6" />
                        </span>
                        <div>
                            <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">
                                {fa(report.copied)} کالا کپی شد به «{catalogName}»
                            </p>
                            {report.skipped > 0 && (
                                <p className="mt-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                    {fa(report.skipped)} قلم کپی نشد — تکراری بود
                                </p>
                            )}
                        </div>
                    </div>
                    {report.failed.length > 0 && (
                        <ul className="mt-3 space-y-1 border-t border-emerald-200/50 pt-2.5 dark:border-emerald-800/40">
                            {report.failed.slice(0, 6).map((f, i) => (
                                <li key={i} className="text-[10.5px] font-bold leading-5 text-stone-500 dark:text-gray-400">
                                    • {f.name} — {f.reason}
                                </li>
                            ))}
                            {report.failed.length > 6 && (
                                <li className="text-[10px] font-bold text-stone-400">و {fa(report.failed.length - 6)} مورد دیگر…</li>
                            )}
                        </ul>
                    )}
                </motion.div>
                <div className="mt-3 flex gap-2">
                    <button onClick={() => router.push(`/my-catalogs?catalog=${catalogId}`)}
                            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[12.5px] font-extrabold text-white hover:bg-emerald-700">
                        <Store className="size-4" /> دیدن کالاهای بازوی من
                    </button>
                    <button onClick={backToResults}
                            className="h-11 rounded-xl border border-outline-variant/50 px-4 text-[11.5px] font-bold text-stone-500 hover:border-amber-400 dark:text-gray-400">
                        کپی از بازوی دیگر
                    </button>
                </div>
            </div>
        );
    }

    // ── انتخاب کالاها از بازوی انتخاب‌شده ──
    if (selected) {
        return (
            <div>
                <div className="mb-3 flex items-center gap-2">
                    <button onClick={backToResults} aria-label="برگشت به نتایج"
                            className="grid size-8 shrink-0 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-gray-800">
                        <ArrowRight className="size-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-black text-stone-800 dark:text-gray-100">{selected.name}</p>
                        <p className="truncate text-[10px] font-bold text-stone-400">
                            {selected.businessName ? `کسب‌وکار: ${selected.businessName} · ` : ''}{fa(products.length)} کالا قابل‌کپی
                        </p>
                    </div>
                    <button onClick={() => setChecked(allChecked ? new Set() : new Set(products.map((p) => p.id)))}
                            className="h-8 shrink-0 rounded-lg border border-outline-variant/40 px-2.5 text-[10px] font-extrabold text-stone-500 hover:border-amber-400 dark:text-gray-400">
                        {allChecked ? 'برداشتن تیک‌ها' : 'تیک همه'}
                    </button>
                </div>

                {loadingProducts ? (
                    <div className="grid h-40 place-items-center"><Loader2 className="size-6 animate-spin text-stone-300" /></div>
                ) : products.length === 0 ? (
                    <div className="rounded-xl bg-stone-50 p-6 text-center dark:bg-gray-800/50">
                        <Package className="mx-auto size-8 text-stone-300" />
                        <p className="mt-2 text-[11.5px] font-bold leading-6 text-stone-500 dark:text-gray-400">
                            این بازو کالای کاملی برای کپی ندارد — کالاهای «نیاز به تکمیل» کپی نمی‌شوند
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="max-h-[420px] space-y-1.5 overflow-y-auto pe-1">
                            {products.map((p) => {
                                const on = checked.has(p.id);
                                return (
                                    <button key={p.id} type="button" onClick={() => toggle(p.id)}
                                            className={`flex w-full items-center gap-2.5 rounded-xl border p-2 text-right transition-all active:scale-[0.99] ${
                                                on ? 'border-amber-400/60 bg-amber-500/5' : 'border-outline-variant/30 hover:border-outline-variant/60 dark:border-gray-700/60'
                                            }`}>
                                        <span className={`grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors ${on ? 'border-amber-500 bg-amber-500' : 'border-stone-300 dark:border-gray-600'}`}>
                                            {on && <Check className="size-3 text-white" />}
                                        </span>
                                        {p.image
                                            ? <Image src={p.image} alt={p.title} width={40} height={40} unoptimized className="size-10 shrink-0 rounded-lg object-cover" />
                                            : <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-stone-100 dark:bg-gray-800"><Package className="size-4 text-stone-300" /></span>}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[12px] font-extrabold text-stone-700 dark:text-gray-200">{p.title}</span>
                                            <span className="mt-0.5 block truncate text-[10px] font-bold text-stone-400">
                                                {p.price != null && <>{fa(p.price)} تومان{p.unitQty ? ` / ${p.unitTitle || 'بسته'} ${fa(p.unitQty)}تایی` : ''}</>}
                                                {p.brandTitle ? ` · ${p.brandTitle}` : ''}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <button onClick={doCopy} disabled={copying || checked.size === 0}
                                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">
                            {copying ? <Loader2 className="size-4 animate-spin" /> : <CopyPlus className="size-4" />}
                            کپی {fa(checked.size)} کالا به «{catalogName || 'بازوی فروش من'}»
                        </button>
                    </>
                )}
            </div>
        );
    }

    // ── جست‌وجو و نتایج ──
    return (
        <div>
            <p className="text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                اسم کسب‌وکار یا بازوی فروشش را جست‌وجو کن — کالاهایش را تیک بزن و در چند ثانیه به بازوی خودت کپی کن.
                برای تیم‌های فروش عالی است: یکی لیست را می‌سازد، بقیه کپی می‌کنند.
            </p>
            <div className="relative mt-3">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-stone-300" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} dir="rtl"
                       placeholder="مثلاً: پخش مصالح نارین"
                       className="h-11 w-full rounded-xl border border-outline-variant/50 bg-transparent ps-9 pe-3 text-[13px] font-bold text-stone-700 outline-none placeholder:text-stone-300 focus:border-amber-400 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-600" />
                {searching && <Loader2 className="absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-amber-500" />}
            </div>

            {/* نتایج */}
            {searched && !searching && results.length === 0 && (
                <div className="mt-4 rounded-xl bg-stone-50 p-6 text-center dark:bg-gray-800/50">
                    <Search className="mx-auto size-8 text-stone-300" />
                    <p className="mt-2 text-[11.5px] font-bold leading-6 text-stone-500 dark:text-gray-400">
                        چیزی پیدا نشد — با نام کسب‌وکار یا نام بازوی فروشش امتحان کن
                    </p>
                </div>
            )}

            {results.length > 0 && (
                <div className="mt-3 space-y-2">
                    {results.map((c) => (
                        <div key={c.id}
                             className={`rounded-xl border p-3 transition-all ${c.copyAllowed ? 'border-outline-variant/40 hover:border-amber-400/60 dark:border-gray-700' : 'border-outline-variant/30 bg-stone-50/60 dark:border-gray-800 dark:bg-gray-800/40'}`}>
                            <button type="button" onClick={() => openCatalog(c)} disabled={!c.copyAllowed}
                                    className="flex w-full items-center gap-3 text-right disabled:cursor-not-allowed">
                                {c.logoUrl
                                    ? <Image src={c.logoUrl} alt={c.name} width={44} height={44} unoptimized className="size-11 shrink-0 rounded-xl object-cover" />
                                    : <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-[13px] font-black text-amber-600 dark:text-amber-400">{c.name?.[0] || '؟'}</span>}
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5">
                                        <span className="truncate text-[13px] font-black text-stone-800 dark:text-gray-100">{c.name}</span>
                                        {c.verified && <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />}
                                    </span>
                                    {c.businessName && (
                                        <span className="mt-0.5 block truncate text-[10px] font-bold text-stone-400">{c.businessName} · {fa(c.productCount)} کالا</span>
                                    )}
                                </span>
                                {c.copyAllowed ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9.5px] font-extrabold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                        <CopyPlus className="size-3" /> قابل‌کپی
                                    </span>
                                ) : (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[9.5px] font-extrabold text-stone-400 dark:bg-gray-800 dark:text-gray-500">
                                        <Lock className="size-3" /> کپی غیرفعال
                                    </span>
                                )}
                            </button>

                            {/* اجازهٔ کپی ندارد — راهنمای تماس با صاحب بازو */}
                            {!c.copyAllowed && (
                                <div className="mt-2.5 border-t border-outline-variant/20 pt-2.5 dark:border-gray-800">
                                    <p className="flex items-start gap-1.5 text-[10.5px] font-bold leading-5 text-stone-500 dark:text-gray-400">
                                        <Ban className="mt-0.5 size-3.5 shrink-0 text-stone-400" />
                                        صاحبش فعلاً اجازهٔ کپی نداده — اگر همکارِ تیم فروشت است، تماس بگیر و ازش بخواه
                                        در تنظیماتش تیک «اجازهٔ کپی محصولات» را برای چند لحظه روشن کند؛ بعد همین‌جا کپی کن.
                                        (می‌توانید رایگان یا با توافق مالی خودتان باشد — تیک را هر وقت بخواهد برمی‌دارد)
                                    </p>
                                    {c.phone && (
                                        <a href={`tel:${c.phone}`} dir="ltr"
                                           className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg border border-outline-variant/40 px-3 text-[11px] font-extrabold text-emerald-700 hover:border-emerald-400 dark:text-emerald-400 dark:border-gray-700">
                                            <Phone className="size-3.5" /> {c.phone}
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// 📖 مدال راهنما — به زبان ساده: ستون‌های اکسل، قالب پنج‌خطی متن، قیمتِ یک‌عددی
//    شامل جدول نمونهٔ دوردیفی (همان چیزی که مالک خواست) + نکتهٔ ریال + عکس‌ها
// ═══════════════════════════════════════════════════════════
const HELP_COL_SAMPLE: { head: string[]; rows: string[][] } = {
    head: ['نام کالا', 'برند', 'واحد', 'تعداد در واحد', 'قیمت (تومان)'],
    rows: [
        ['پفک مینو کارتنی', 'مینو', 'کارتن', '۲۴', '۸۵٬۰۰۰'],
        ['شیر کاکائو شیرین‌عاج', 'شیرین‌عاج', 'حلب', '۱۲', '۱۸۰٬۰۰۰'],
    ],
};

function HelpModal({ tab, onClose }: { tab: SourceTab; onClose: () => void }) {
    const cellCls = 'border border-stone-200 px-2 py-1.5 text-center text-[10.5px] font-bold text-stone-700 dark:border-gray-700 dark:text-gray-200';
    const headCls = `${cellCls} bg-stone-100 text-[10px] font-black text-stone-500 dark:bg-gray-800 dark:text-gray-400`;
    return (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 animate-in fade-in duration-200 sm:items-center sm:p-4"
             onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:rounded-2xl dark:bg-gray-900"
                 dir="rtl">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-black text-stone-900 dark:text-gray-100">
                        <CircleHelp className="size-5 text-amber-500" /> راهنمای افزودن گروهی
                    </h3>
                    <button onClick={onClose} aria-label="بستن"
                            className="grid size-9 place-items-center rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-gray-800">
                        <X className="size-5" />
                    </button>
                </div>

                {/* قاعدهٔ طلایی قیمت — همهٔ تب‌ها */}
                <div className="mb-4 rounded-xl bg-amber-50 px-3.5 py-3 dark:bg-amber-500/10">
                    <p className="text-[12px] font-black leading-6 text-amber-800 dark:text-amber-300">
                        ⭐ مهم‌ترین قاعده: قیمت = قیمت عمدهٔ «یک عدد» به تومان — یا بالای فرم روی «بسته/کارتن» بزن
                    </p>
                    <p className="mt-1 text-[11px] font-bold leading-6 text-amber-700/90 dark:text-amber-300/80">
                        اگر قیمت‌هات مالِ «یک عدد» است، همان را بنویس (پیش‌فرض). اگر قیمت‌هات مالِ «هر بسته/کارتن» است،
                        بالای فرم سوییچ را روی «بسته/کارتن» بگذار — آن‌وقت حتماً «تعداد در واحد» را هم بنویس (مثلاً ۲۴)
                        تا قیمت هر یک عدد خودش تقسیم و حساب شود؛ این تعداد با کالا ثبت می‌شود و یک بار نوشتن، همیشه کارت را راحت می‌کند.
                        اگر روی «یک عدد» مانده و کالا کارتنی است، قیمتِ «یک پفک» را بنویس نه قیمت کل کارتن —
                        مثلاً هر پفک ۸۵٬۰۰۰ تومان و کارتن ۲۴تایی می‌شود ۲٬۰۴۰٬۰۰۰.
                    </p>
                </div>

                {tab === 'excel' && (
                    <>
                        <p className="text-[12px] font-bold leading-6 text-stone-600 dark:text-gray-300">
                            اکسلت را این‌طوری بساز — سطر اول «سرستون» با همین عنوان‌ها باشد تا ستون‌ها را بشناسم.
                            ترتیب ستون‌ها مهم نیست و «قیمت» و «نام کالا» کافی است؛ بقیه اختیاری‌اند:
                        </p>
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full min-w-[420px] border-collapse rounded-xl text-right">
                                <thead>
                                    <tr>{HELP_COL_SAMPLE.head.map((h) => <th key={h} className={headCls}>{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {HELP_COL_SAMPLE.rows.map((r, i) => (
                                        <tr key={i}>{r.map((c, j) => <td key={j} className={cellCls}>{c}</td>)}</tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-2 text-[10.5px] font-bold leading-5 text-stone-400">
                            ↑ قیمت‌ها در این نمونه «قیمت یک عدد» است — کارتنِ پفک مینو خودکار ۸۵٬۰۰۰ × ۲۴ حساب می‌شود.
                        </p>
                        <ul className="mt-3 space-y-1.5 text-[11.5px] font-bold leading-6 text-stone-600 dark:text-gray-300">
                            <li>• قیمت‌ها بدون ویرگول و اعشار — فقط عدد (۴۸۵۰۰۰ نه ۴۸۵٫۰۰۰ تومان)</li>
                            <li>• 🖼️ عکس کنار هر ردیف داخل اکسل بگذار — خودکار برمی‌دارم و به کالا می‌زنم؛
                                در اکسل از منوی «Insert ← Pictures» عکس را همان‌جایی که ردیفِ کالاست بگذار
                                (فقط فایل xlsx با عکس‌های PNG/JPG/GIF/WEBP؛ عکسِ چسبانده‌شده از اسکرین‌شات ویندوز یعنی EMF پشتیبانی نمی‌شود —
                                اول فایل عکس را ذخیره و به‌صورت PNG درج کن). CSV و xls قدیمی عکس ندارند</li>
                            <li>• اگر قیمت‌هایت «ریال» است، بالای فرم روی «ریال» بزن تا همه ده‌تا یکی شوند</li>
                            <li>• اگر قیمت‌هات مالِ «هر بسته/کارتن» است، سوییچ «قیمت هر» را روی «بسته/کارتن» بگذار —
                                و ستون «تعداد در واحد» را حتماً پر کن؛ قیمت تکی خودش تقسیم می‌شود</li>
                            <li>• CSV هم قبول است — با جداکنندهٔ کاما و یک سطر سرستون مثل جدول بالا (ولی عکس ندارد)</li>
                            <li>• بعد از ثبت، همهٔ کالاها با برچسب «نیاز به تکمیل» می‌روند — عکس و دسته و جزئیاتشان را در ویرایش کامل کن تا در کاتالوگ دیده شوند</li>
                        </ul>
                    </>
                )}

                {tab === 'text' && (
                    <>
                        <p className="text-[12px] font-bold leading-6 text-stone-600 dark:text-gray-300">
                            پنج خط آماده برای پنج کالای اولت. با جداکنندهٔ «|» (پِیپ — دکمهٔ Shift + \) فیلدها را جدا کن. هر خط این شکل است:
                        </p>
                        <div className="mt-2.5 rounded-xl bg-stone-50 p-3 dark:bg-gray-800/60">
                            <p className="text-[11.5px] font-black leading-6 text-stone-700 dark:text-gray-200" dir="rtl">
                                نام کالا | برند | واحد | تعداد در واحد | قیمت عمدهٔ یک عدد
                            </p>
                            <p className="mt-1.5 text-[10.5px] font-bold leading-5 text-stone-400">
                                مثال: پفک مینو کارتنی | مینو | کارتن | ۲۴ | ۸۵٬۰۰۰
                            </p>
                        </div>
                        <ul className="mt-3 space-y-1.5 text-[11.5px] font-bold leading-6 text-stone-600 dark:text-gray-300">
                            <li>• به‌جای برند کالای اول، برند واقعی‌اش را بنویس — اگر برند ندارد بنویس «ندارد»</li>
                            <li>• فیلدی را نمی‌دانی؟ خالی بگذار یا «ندارد» بنویس — جای خالی اشکال ندارد</li>
                            <li>• اگر به شکل قدیمی (فقط نام و قیمت در هر خط) بچسبانی هم می‌خوانم — آخرین عددِ خط = قیمت یک عدد</li>
                            <li>• خط‌های بیشتر از پنج هم مشکلی ندارد — هر خط یک کالا</li>
                        </ul>
                    </>
                )}

                {tab === 'grid' && (
                    <ul className="space-y-1.5 text-[11.5px] font-bold leading-6 text-stone-600 dark:text-gray-300">
                        <li>• قیمت را «عمدهٔ یک عدد» بنویس — قیمت کارتن خودش از «تعداد» حساب می‌شود؛
                            اگر قیمت‌هات مالِ هر بسته/کارتن است، بالای فرم روی «بسته/کارتن» بزن و تعداد در بسته را حتماً بنویس</li>
                        <li>• قیمت‌ها با فرمت سه‌رقمی تایپ می‌شوند — نگران جداکننده نباش</li>
                        <li>• «واحد» مثل کارتن/بسته/کیلوگرم — از لیست پیشنهادی انتخاب کن یا بنویس؛ نبود، خودکار ساخته می‌شود
                            و با تعدادش به واحدهای بازوی فروشت هم اضافه می‌شود — یک بار بنویس، همیشه در لیستت می‌ماند</li>
                        <li>• بعد از ثبت، کالاها با برچسب «نیاز به تکمیل» می‌روند — در ویرایش، عکس و دسته‌شان را کامل کن</li>
                    </ul>
                )}

                {(tab === 'ai' || tab === 'site') && (
                    <ul className="space-y-1.5 text-[11.5px] font-bold leading-6 text-stone-600 dark:text-gray-300">
                        <li>• پرامپت پایین را کپی کن و همراه فایل/لینک به هوش مصنوعی بده</li>
                        <li>• به هوش مصنوعی گفته‌ای قیمت‌ها را به «تومانِ یک عدد» برگرداند؛ اگر خودش فقط قیمتِ بسته/کارتن داشت،
                            خودش priceBasis را "package" می‌گذارد و تعداد بسته را می‌دهد — یا بالای فرم سوییچ را روی «بسته/کارتن» بگذار</li>
                        <li>• خروجی JSON را کامل کپی و در کادر بچسبان — ناقص که شود نمی‌خوانم</li>
                        <li>• اگر خروجی خطا داد، دوباره از هوش مصنوعی بخواه «فقط JSON خالص» بدهد</li>
                    </ul>
                )}

                {tab === 'copy' && (
                    <>
                        <p className="text-[12px] font-bold leading-6 text-stone-600 dark:text-gray-300">
                            اگر کاتالوگت را همکارت از تیم فروش ساخته، لازم نیست از صفر وارد کنی —
                            اسم کسب‌وکار را جست‌وجو کن، بازوی فروشش را باز کن، هر کالایی را خواستی یا همه را تیک بزن
                            و کپی کن. کاتالوگت در چند ثانیه ساخته می‌شود.
                        </p>
                        <div className="mt-3 rounded-xl bg-amber-50 px-3.5 py-3 dark:bg-amber-500/10">
                            <p className="text-[11.5px] font-black leading-6 text-amber-800 dark:text-amber-300">
                                🔑 شرطش یک تیک است — «اجازهٔ کپی محصولات»
                            </p>
                            <p className="mt-1 text-[11px] font-bold leading-6 text-amber-700/90 dark:text-amber-300/80">
                                صاحب بازوی فروش باید در «تنظیمات» پنلش این تیک را روشن کرده باشد — هر وقت هم بخواهد برمی‌دارد
                                و کپی بسته می‌شود. اگر کسی از تو کپی می‌خواهد، همین تیک را برایش روشن کن؛ کارش که تمام شد خاموشش کن.
                            </p>
                        </div>
                        <ul className="mt-3 space-y-1.5 text-[11.5px] font-bold leading-6 text-stone-600 dark:text-gray-300">
                            <li>• تیکِ فعال نبود؟ کنار بازو می‌بینی «کپی غیرفعال» — با صاحبش تماس بگیر (شماره‌اش همان‌جاست) و
                                ازش بخواه تیک را برای چند لحظه روشن کند؛ رایگان یا با توافق مالی بین خودتان. بعد این‌جا کپی کن.</li>
                            <li>• با جست‌وجو همهٔ بازوها پیدا می‌شوند، حتی غیرفعال‌ها — تا بدانی چه چیزی هست و از کی بخواهی</li>
                            <li>• همه‌چیز با هم کپی می‌شود: قیمت تکی و کارتن، تعداد در بسته، برند، عکس و توضیحات —
                                تکراری‌های خودت کپی نمی‌شوند</li>
                            <li>• کالاهای ناقصِ «نیاز به تکمیل» کپی نمی‌شوند — اول صاحبش باید کاملشان کند</li>
                            <li>• کالاهای کپی‌شده در «بازوی تو» دیده می‌شوند و می‌توانی مثل بقیه ویرایششان کنی —
                                استان و شهرشان هم کسب‌وکار خودت می‌شود</li>
                        </ul>
                    </>
                )}

                <button onClick={onClose}
                        className="mt-5 h-11 w-full rounded-xl bg-amber-500 text-[13px] font-extrabold text-white hover:bg-amber-600">
                    فهمیدم
                </button>
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