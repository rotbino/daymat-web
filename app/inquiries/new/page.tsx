// app/inquiries/new/page.tsx
// فرم ساخت کاتالوگ خرید — نسخهٔ ۲ (بازطراحی بر اساس بازخورد مالک):
//   ۱) کسب‌وکار اول — مثل کاتالوگ فروش (انتخاب از کسب‌وکارهای من یا ثبت جدید)
//   ۲) اقلام از مرجع کالا (ProductReferencePicker) — کالا مشخصاتش (برند و…) را دارد؛
//      اگر نبود از همان پنجره به مرجع اضافه می‌شود. این اتصال، کلید معرفی
//      تامین‌کنندهٔ مرتبط به خریدار (یا بالعکس) در آینده است.
//   ۳) واحد از مرجع واحد (سلکت) + واحدهای اختصاصی کاتالوگ خرید با همان مدال کاتالوگ فروش
//   ۴) تم تاریک — متن همهٔ ورودی‌ها همیشه خوانا (باگ focus:bg-white قبلی رفع شد)
//   فلسفه همچنان: ساده — عنوان اگر خالی باشد خودکار ساخته می‌شود؛ بقیه اختیاری.
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useCreateInquiry, useMyBusinesses } from '@/lib/api/apiHooks';
import type { CreateInquiryItemPayload } from '@/lib/api/apiTypes';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import ProductReferencePicker, { ProductValue } from '@/app/components/ProductReferencePicker';
import BusinessSelector from '@/app/components/BusinessSelector';
import UnitSettingsModal from '@/app/ad/components/UnitSettingsModal';
import {
    ClipboardList, Plus, Trash2, ChevronDown, SlidersHorizontal,
    Loader2, FlaskConical, Package, Send, Building2, Boxes,
} from 'lucide-react';
import { faNum } from '../utils';

interface RowState {
    key: number;
    product: ProductValue | null;   // کالای مرجع
    quantity: string;
    unitId: string;                 // واحد از مرجع واحد
    unitTitle: string;
    advancedOpen: boolean;
    brand: string;                  // پیش‌فرض از کالای مرجع — قابل ویرایش
    note: string;
    referenceUrl: string;
    specs: { key: string; value: string }[];  // مشخصات اضافهٔ خودِ درخواست
}

const newRow = (key: number): RowState => ({
    key, product: null, quantity: '', unitId: '', unitTitle: '', advancedOpen: false,
    brand: '', note: '', referenceUrl: '', specs: [],
});

// پیشنهادهای پرکاربرد — اگر در مرجع واحد باشند اول لیست می‌آیند
const UNIT_SUGGESTIONS = ['کیلوگرم', 'کارتن', 'عدد', 'بسته', 'لیتر', 'متر', 'تان'];

// ✅ کلاس واحد ورودی — متن در هر دو تم خوانا (باگ دیده‌نشدن مقدار/واحد در تم تاریک)
const inp = 'h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold text-stone-900 outline-none transition-colors placeholder:font-medium placeholder:text-stone-400 focus:border-brand-amber dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-brand-amber dark:focus:bg-gray-950';
const inpSm = 'h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-900 outline-none transition-colors placeholder:font-medium placeholder:text-stone-400 focus:border-brand-amber dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-brand-amber dark:focus:bg-gray-950';

function SectionTitle({ n, title }: { n: number; title: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="grid size-5 flex-shrink-0 place-items-center rounded-full bg-brand-amber/15 text-[10px] font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">{n}</span>
            <h2 className="text-[13px] font-bold text-on-surface">{title}</h2>
        </div>
    );
}

export default function NewInquiryPage() {
    const router = useRouter();
    const { isAuthenticated, _hydrated } = useSelector((s: RootState) => s.auth) as any;
    const hydrated = _hydrated !== false;
    const { currentSlug: armSlug } = useSelector((s: RootState) => s.arm);

    const [biz, setBiz] = useState<any | null>(null);
    const [rows, setRows] = useState<RowState[]>([newRow(0), newRow(1), newRow(2)]);
    const [nextKey, setNextKey] = useState(3);
    const [moreOpen, setMoreOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [city, setCity] = useState('');
    const [tagsRaw, setTagsRaw] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public');

    // واحدهای اختصاصیِ این کاتالوگ خرید (مثل کاتالوگ فروش) — در create ارسال می‌شود
    const [formUnits, setFormUnits] = useState<{ unitId: string }[]>([]);
    const [unitsOpen, setUnitsOpen] = useState(false);

    // مرجع واحد
    const { data: allUnits = [] } = useQuery({
        queryKey: ['units-all'],
        queryFn: () => apiService.ad.getAllUnits(),
        staleTime: 1000 * 60 * 60,
    });

    // گزینه‌های سلکت واحد: واحدهای من + پرکاربرد + بقیهٔ مرجع
    const unitOptions = useMemo(() => {
        const list = allUnits as any[];
        const mineIds = new Set(formUnits.map((u) => u.unitId));
        const mine = list.filter((u) => mineIds.has(u.id));
        const sug = UNIT_SUGGESTIONS
            .map((t) => list.find((u) => u.title === t))
            .filter((u): u is any => !!u && !mineIds.has(u.id));
        const sugIds = new Set(sug.map((u) => u.id));
        const rest = list.filter((u) => !mineIds.has(u.id) && !sugIds.has(u.id));
        return { mine, sug, rest };
    }, [allUnits, formUnits]);

    const findUnit = (id: string): any =>
        (allUnits as any[]).find((u) => u.id === id) || null;

    const create = useCreateInquiry();
    const [submitting, setSubmitting] = useState(false);

    // کسب‌وکار — پیش‌فرضِ زحمت‌کم: تک‌کسب‌وکار → خودکار؛ دیپ‌لینک ?bizId= هم پذیرفته می‌شود
    const { data: myBizData } = useMyBusinesses();
    const myBizs = useMemo(
        () => (myBizData?.items ?? []).filter((b: any) => b.canEdit),
        [myBizData],
    );
    const [bizParam] = useState(() =>
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('bizId') || '' : '',
    );
    useEffect(() => {
        if (biz || myBizs.length === 0) return;
        if (bizParam && myBizs.some((b: any) => b.id === bizParam)) setBiz(myBizs.find((b: any) => b.id === bizParam));
        else if (myBizs.length === 1) setBiz(myBizs[0]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myBizs]);

    const bizRef = useRef<HTMLDivElement | null>(null);

    // گیت ورود — مهمان → لاگین با حفظ مقصد
    useEffect(() => {
        if (hydrated && !isAuthenticated) {
            router.replace(`/login?redirect=${encodeURIComponent('/inquiries/new' + (bizParam ? `?bizId=${bizParam}` : ''))}`);
        }
    }, [hydrated, isAuthenticated, router, bizParam]);

    const validRows = useMemo(() => rows.filter((r) => r.product), [rows]);
    const filledCount = validRows.length;

    const patchRow = (key: number, patch: Partial<RowState>) =>
        setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

    const addRow = () => {
        setRows((rs) => [...rs, newRow(nextKey)]);
        setNextKey((k) => k + 1);
    };

    const removeRow = (key: number) => {
        setRows((rs) => (rs.length <= 1 ? [newRow(key)] : rs.filter((r) => r.key !== key)));
    };

    // انتخاب کالای مرجع → نام و برند از خودِ کالا می‌آید (اگر کالا برند داشت)
    const pickProduct = (key: number, p: ProductValue | null) => {
        patchRow(key, { product: p, brand: p?.brandTitle || '' });
    };

    const submit = async () => {
        if (!biz) {
            toast.error('اول کسب‌وکار را انتخاب یا ثبت کن — مثل کاتالوگ فروش');
            bizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        if (filledCount === 0) {
            toast.error('حداقل یک قلم از مرجع انتخاب کن — اگر نبود، در همان پنجره اضافه‌اش کن');
            return;
        }
        // عنوان خودکار — اگر کاربر خالی گذاشته باشد
        const first = validRows[0].product!;
        const autoTitle = filledCount > 1
            ? `خرید ${first.title} و ${faNum(filledCount - 1)} قلم دیگر`
            : `خرید ${first.title}`;
        const finalTitle = (title.trim() || autoTitle).slice(0, 140);

        const items: CreateInquiryItemPayload[] = validRows.map((r) => ({
            name: r.product!.title,
            referenceItemId: r.product!.id,
            unitId: r.unitId || undefined,
            unit: r.unitTitle || undefined,
            quantity: r.quantity.trim() ? Number(r.quantity.replace(/[^\d.]/g, '')) || undefined : undefined,
            brand: (r.brand.trim() || r.product!.brandTitle || undefined) as string | undefined,
            note: r.note.trim() || undefined,
            referenceUrl: r.referenceUrl.trim() || undefined,
            specs: r.specs.filter((s) => s.key.trim() && s.value.trim()),
        }));

        setSubmitting(true);
        try {
            const res = await create.mutateAsync({
                title: finalTitle,
                description: description.trim() || undefined,
                items,
                businessId: biz.id,
                units: formUnits.length > 0 ? formUnits.map((u) => ({ unitId: u.unitId })) : undefined,
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
                    <h1 className="mt-3 text-2xl font-black leading-9 sm:text-3xl">
                        قیمت چه اقلامی را می‌خواهی از تامین‌کننده‌ها بگیری؟
                    </h1>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500 dark:text-gray-400">
                        قلم یا اقلام را ثبت کن تا تامین‌کننده‌ها قیمت بدهند — بقیه‌ش اختیاری است.
                    </p>
                </motion.div>

                {/* ۱ — کسب‌وکار (اول — مثل کاتالوگ فروش) */}
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.06 }}
                    className="mt-8 rounded-2xl border border-stone-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                    ref={bizRef as any}>
                    <div className="mb-3 flex items-center justify-between">
                        <SectionTitle n={1} title="کسب‌وکار" />
                        {biz && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <Building2 className="size-3" /> وصل شد
                            </span>
                        )}
                    </div>
                    <BusinessSelector
                        value={biz}
                        onChange={setBiz}
                        label="این لیست خرید را برای کدام کسب‌وکار ثبت می‌کنی؟ اگر هنوز ثبت نشده، همین‌جا ثبتش کن"
                    />
                </motion.section>

                {/* ۲ — اقلام از مرجع */}
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.12 }}
                    className="mt-6">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                        <SectionTitle n={2} title="اقلام خرید" />
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-extrabold text-brand-amber">
                                {faNum(filledCount)} قلم
                            </span>
                            <button
                                type="button"
                                onClick={() => setUnitsOpen(true)}
                                className="flex items-center gap-1 rounded-full border border-stone-200 px-2.5 py-1 text-[10px] font-bold text-stone-500 transition-colors hover:border-brand-amber hover:text-amber-600 dark:border-gray-700 dark:text-gray-400">
                                <Boxes className="size-3" />
                                واحدهای من {formUnits.length > 0 && `(${faNum(formUnits.length)})`}
                            </button>
                        </div>
                    </div>
                    <p className="mb-3 text-[11px] leading-5 text-stone-400 dark:text-gray-500">
                        هر قلم را از مرجع کالا انتخاب کن — برند و مشخصاتش همراه کالا می‌آید. اگر در مرجع نبود، از همان پنجره یک بار اضافه‌اش کن.
                    </p>

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
                                    <div className="flex items-start gap-2">
                                        <span className="mt-2.5 grid size-7 flex-shrink-0 place-items-center rounded-full bg-brand-amber text-xs font-black text-white">
                                            {faNum(idx + 1)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <ProductReferencePicker
                                                value={r.product}
                                                onChange={(p) => pickProduct(r.key, p)}
                                                armSlug={armSlug || undefined}
                                                placeholder="انتخاب کالا از مرجع…"
                                            />
                                        </div>
                                        <button
                                            onClick={() => removeRow(r.key)}
                                            aria-label="حذف قلم"
                                            className="mt-1.5 grid size-8 flex-shrink-0 place-items-center rounded-lg text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    {/* مقدار + واحد — واحد از مرجع واحد */}
                                    <div className="mt-2 flex gap-2 ps-9">
                                        <input
                                            value={r.quantity}
                                            onChange={(e) => patchRow(r.key, { quantity: e.target.value })}
                                            inputMode="decimal"
                                            placeholder="مقدار (اختیاری)"
                                            className={`${inp} w-28 flex-shrink-0 text-center`}
                                        />
                                        <select
                                            value={r.unitId}
                                            onChange={(e) => {
                                                const u = findUnit(e.target.value);
                                                patchRow(r.key, { unitId: e.target.value, unitTitle: u?.title || '' });
                                            }}
                                            className={`${inp} min-w-0 flex-1 cursor-pointer dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-stone-900 dark:[&>option]:bg-gray-950 dark:[&>option]:text-gray-100`}>
                                            <option value="">واحد… (از مرجع انتخاب کن)</option>
                                            {unitOptions.mine.length > 0 && (
                                                <optgroup label="واحدهای من">
                                                    {unitOptions.mine.map((u: any) => (
                                                        <option key={u.id} value={u.id}>{u.title}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            {unitOptions.sug.length > 0 && (
                                                <optgroup label="پرکاربرد">
                                                    {unitOptions.sug.map((u: any) => (
                                                        <option key={u.id} value={u.id}>{u.title}</option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            <optgroup label="سایر واحدهای مرجع">
                                                {unitOptions.rest.map((u: any) => (
                                                    <option key={u.id} value={u.id}>{u.title}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>

                                    {/* پیشرفتهٔ هر قلم — مشخصات اضافهٔ خود درخواست */}
                                    <button
                                        onClick={() => patchRow(r.key, { advancedOpen: !r.advancedOpen })}
                                        className="mt-2 flex items-center gap-1 ps-9 text-[11px] font-bold text-stone-400 transition-colors hover:text-amber-600 dark:hover:text-amber-400">
                                        <SlidersHorizontal className="size-3" />
                                        {r.advancedOpen ? 'بستن جزئیات' : 'مشخصات فنی اضافه، لینک نمونه، یادداشت…'}
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
                                                    <input
                                                        value={r.brand}
                                                        onChange={(e) => patchRow(r.key, { brand: e.target.value })}
                                                        placeholder="برند/سازنده مدنظر (اختیاری — از کالا آمده)"
                                                        className={`${inpSm} w-full`}
                                                    />
                                                    <input
                                                        value={r.referenceUrl}
                                                        onChange={(e) => patchRow(r.key, { referenceUrl: e.target.value })}
                                                        dir="ltr"
                                                        placeholder="لینک نمونه (اختیاری)"
                                                        className={`${inpSm} w-full text-left`}
                                                    />
                                                    {/* مشخصات اضافه — روی خود درخواست */}
                                                    {r.specs.map((sp, si) => (
                                                        <div key={si} className="flex gap-2">
                                                            <input
                                                                value={sp.key}
                                                                onChange={(e) => patchRow(r.key, { specs: r.specs.map((x, xi) => xi === si ? { ...x, key: e.target.value } : x) })}
                                                                placeholder="ویژگی — مثلاً: قطر داخلی"
                                                                className={`${inpSm} min-w-0 flex-1`}
                                                            />
                                                            <input
                                                                value={sp.value}
                                                                onChange={(e) => patchRow(r.key, { specs: r.specs.map((x, xi) => xi === si ? { ...x, value: e.target.value } : x) })}
                                                                placeholder="مقدار — ۴۵ میلی‌متر"
                                                                className={`${inpSm} min-w-0 flex-1`}
                                                            />
                                                            <button
                                                                onClick={() => patchRow(r.key, { specs: r.specs.filter((_, xi) => xi !== si) })}
                                                                className="grid size-9 flex-shrink-0 place-items-center rounded-lg text-stone-300 hover:text-red-500">
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => patchRow(r.key, { specs: [...r.specs, { key: '', value: '' }] })}
                                                        className="flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-amber-600 dark:hover:text-amber-400">
                                                        <FlaskConical className="size-3" />
                                                        {r.specs.length ? 'افزودن ویژگی دیگر' : 'افزودن مشخصات فنی (برای قطعه و کالای فنی)'}
                                                    </button>
                                                    <input
                                                        value={r.note}
                                                        onChange={(e) => patchRow(r.key, { note: e.target.value })}
                                                        placeholder="یادداشت برای این قلم (اختیاری)"
                                                        className={`${inpSm} w-full`}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={addRow}
                        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-amber-tint text-sm font-extrabold text-amber-600 transition-colors hover:bg-brand-amber-soft dark:text-amber-400">
                        <Plus className="size-4" />
                        افزودن قلم
                    </motion.button>
                </motion.section>

                {/* ۳ — بیشتر (اختیاری) */}
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.18 }}
                    className="mt-6">
                    <button
                        onClick={() => setMoreOpen(!moreOpen)}
                        className="flex w-full items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 py-3 text-sm font-extrabold text-stone-600 transition-colors hover:border-brand-amber-tint dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                        <span className="flex items-center gap-2">
                            <SlidersHorizontal className="size-4 text-amber-500" />
                            عنوان، مهلت، شهر و شرایط (همه اختیاری)
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
                                    <div>
                                        <label className="mb-1 block text-[11px] font-extrabold text-stone-400">
                                            عنوان لیست — خالی بگذاری از اولین قلم می‌سازیم
                                        </label>
                                        <input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="مثلاً: لیست خرید هفتگی سوپرمارکت"
                                            maxLength={140}
                                            className={`${inp} w-full`}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-[11px] font-extrabold text-stone-400">مهلت پاسخ</label>
                                            <input
                                                type="datetime-local"
                                                value={deadline}
                                                onChange={(e) => setDeadline(e.target.value)}
                                                className={`${inp} w-full dark:[color-scheme:dark]`}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[11px] font-extrabold text-stone-400">شهر</label>
                                            <input
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="مثلاً: تهران"
                                                className={`${inp} w-full`}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-extrabold text-stone-400">برچسب‌ها (با ویرگول جدا کن)</label>
                                        <input
                                            value={tagsRaw}
                                            onChange={(e) => setTagsRaw(e.target.value)}
                                            placeholder="مثلاً: مواد غذایی، لبنیات"
                                            className={`${inp} w-full`}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-[11px] font-extrabold text-stone-400">محل/شرایط تحویل</label>
                                            <input
                                                value={deliveryNote}
                                                onChange={(e) => setDeliveryNote(e.target.value)}
                                                placeholder="مثلاً: تحویل در انبار تهران"
                                                className={`${inp} w-full`}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-[11px] font-extrabold text-stone-400">شرایط پرداخت</label>
                                            <input
                                                value={paymentTerms}
                                                onChange={(e) => setPaymentTerms(e.target.value)}
                                                placeholder="مثلاً: نقدی / چک ۳۰ روزه"
                                                className={`${inp} w-full`}
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
                                            className={`${inp} h-auto w-full py-2 font-medium`}
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

            {/* مدال واحدهای اختصاصی — همان تجربهٔ کاتالوگ فروش؛ اینجا فقط روی state فرم ذخیره می‌شود (با create ارسال می‌شود) */}
            <UnitSettingsModal
                isOpen={unitsOpen}
                onClose={() => setUnitsOpen(false)}
                catalogId="new-inquiry"
                initialUnits={formUnits}
                saveFn={async (units) => ({ units })}
                onSaved={(units) => setFormUnits(units.map((u) => ({ unitId: u.unitId })))}
                title="واحدهای کاتالوگ خرید"
                showQtyFields={false}
            />

            {/* نوار ارسال چسبان */}
            <motion.div
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.2 }}
                className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-100 bg-white/95 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/95">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-400 dark:text-gray-500">
                        <Package className="size-4 text-brand-amber" />
                        {filledCount > 0 ? `${faNum(filledCount)} قلم آماده` : 'هنوز قلمی انتخاب نکردی'}
                        {biz ? (
                            <span className="hidden max-w-[9rem] truncate text-emerald-600 sm:inline dark:text-emerald-400">· {biz.name}</span>
                        ) : (
                            <span className="hidden text-amber-600 sm:inline dark:text-amber-400">· کسب‌وکار لازم است</span>
                        )}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        disabled={submitting}
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
