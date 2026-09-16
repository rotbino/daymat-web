// app/my-inquiries/components/AddItemSheet.tsx
// شیت افزودن/ویرایش قلم خرید — هر بار یک کالا (فلسفهٔ مالک: فرم قلم‌به‌قلم، بدون توضیح اضافه؛
// ساختار فرم خودش حرف می‌زند). کالا از مرجع (EntityPicker با امکان افزودن)، واحد از مرجع واحد،
// و تاگل قیمت‌گیری که قلم را بالای کاتالوگ عمومی می‌نشاند.
// ✅ ⚖️ قانون دیمت: هر فیلد الزامیِ خالی، علاوه بر CSS، الرتِ toast فیلدبه‌فیلد می‌گیرد
// ✅ واحد: سلکتور سرچ‌دار (Autocomplete) + واحدهای من با تیکِ افزودن + واحدهای ترکیبی (کارتن ۲۴ عددی)
// ✅ مهلت ارسال قیمت: ورودی عددی به ساعت (حداکثر ۲۴۰) — گروهی، روی خود بازو ذخیره می‌شود
// ✅ گارد تکراری: هر کالا فقط یک‌بار در لیست (خواستهٔ مالک)
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import ProductReferencePicker, { ProductValue } from '@/app/components/ProductReferencePicker';
import Autocomplete from '@/app/components/Autocomplete';
import SwitchRow from './SwitchRow';
import { inp, inpSm, UNIT_SUGGESTIONS, faNum } from '../../inquiries/utils';
import { toastFormErrors } from '@/lib/formAlerts';
import { cn } from '@/lib/utils';
import { X, ChevronDown, Plus, Loader2, Megaphone, Trash2, Clock } from 'lucide-react';
import type { CreateInquiryItemPayload, InquiryItem } from '@/lib/api/apiTypes';

interface Props {
    open: boolean;
    onClose: () => void;
    inquiryId: string;
    catalogUnits: { unitId: string; title?: string }[];
    /** ✅ اقلام موجود — گارد تکراری (هر کالا فقط یک‌بار در لیست) */
    existingItems?: { id: string; name: string }[];
    /** ✅ مهلت گروهی فعلی (ISO) — برای پیش‌فرض ساعت‌ها و نمایش باقی‌مانده */
    currentDeadline?: string | null;
    /** ✅ اولین قلم کاربر — تاکید تامین‌کننده‌یابی (خواستهٔ مالک) */
    isFirstItem?: boolean;
    /** در حالت ویرایش، قلمِ موجود */
    editItem?: InquiryItem | null;
}

interface SheetState {
    product: ProductValue | null;
    quantity: string;
    unitId: string;
    unitTitle: string;
    urgent: boolean;
    brand: string;
    note: string;
    referenceUrl: string;
    specs: { key: string; value: string }[];
}

const freshState = (): SheetState => ({
    product: null, quantity: '', unitId: '', unitTitle: '', urgent: false,
    brand: '', note: '', referenceUrl: '', specs: [],
});

// ✅ واحدهای تعداددار — انتخاب که شد، تعداد هم پرسیده می‌شود («کارتن ۲۴ عددی»)
const COUNTABLE_UNITS = ['کارتن', 'بسته', 'شانه', 'بند', 'جین', 'پالت', 'بوبین', 'رول'];
const MAX_DEADLINE_HOURS = 240; // ۱۰ روز — سقف مهلت (خواستهٔ مالک)

const baseUnitTitle = (t: string) => (t || '').replace(/\s*[0-9۰-۹]+\s*عددی\s*$/, '').trim();
const parseCountFromTitle = (t: string): string => {
    const m = (t || '').match(/([0-9۰-۹]+)\s*عددی/);
    if (!m) return '';
    const latin = m[1].replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    return latin;
};
const normalizeItemName = (s?: string | null) =>
    (s ?? '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ').trim().toLowerCase();
/** عدد فارسی/لاتین → لاتین */
const parseLatinInt = (s: string): number =>
    parseInt((s || '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d]/g, ''), 10) || 0;
const remainingHours = (iso?: string | null): number | null => {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    if (!isFinite(ms) || ms <= 0) return null;
    return Math.max(1, Math.ceil(ms / 3600e3));
};

export default function AddItemSheet({ open, onClose, inquiryId, catalogUnits, existingItems, currentDeadline, isFirstItem, editItem }: Props) {
    const qc = useQueryClient();
    // مرجع واحد (کش مشترک با کاتالوگ قیمت)
    const { data: allUnits = [] } = useQuery({
        queryKey: ['units-all'],
        queryFn: () => apiService.ad.getAllUnits(),
        staleTime: 1000 * 60 * 60,
        enabled: open,
    });

    const [st, setSt] = useState<SheetState>(freshState());
    const [unitCount, setUnitCount] = useState('');       // ✅ تعداد در واحد تعداددار («۲۴»)
    const [favUnit, setFavUnit] = useState(true);         // ✅ تیک افزودن به واحدهای من
    const [deadlineHours, setDeadlineHours] = useState(''); // ✅ مهلت ارسال قیمت (ساعت)
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [advOpen, setAdvOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const nextKey = useRef(100);

    // پرکردن فرم در حالت ویرایش
    useEffect(() => {
        if (!open) return;
        if (editItem) {
            setSt({
                product: editItem.referenceItemId
                    ? ({ id: editItem.referenceItemId, title: editItem.name } as ProductValue)
                    : ({ id: '', title: editItem.name } as ProductValue),
                quantity: editItem.quantity != null ? String(editItem.quantity) : '',
                unitId: editItem.unitId || '',
                unitTitle: editItem.unit || '',
                urgent: !!editItem.urgent,
                brand: editItem.brand || '',
                note: editItem.note || '',
                referenceUrl: editItem.referenceUrl || '',
                specs: Array.isArray(editItem.specs) ? editItem.specs.map((s) => ({ ...s })) : [],
            });
            setUnitCount(parseCountFromTitle(editItem.unit || ''));
            setAdvOpen(!!(editItem.brand || editItem.note || editItem.referenceUrl || (editItem.specs?.length ?? 0) > 0));
            setErrors({});
        } else {
            setSt(freshState());
            setUnitCount('');
            setAdvOpen(false);
            setErrors({});
        }
        setDeadlineHours('');
        setFavUnit(true);
    }, [open, editItem]);

    useEffect(() => setMounted(true), []);

    // ✅ مهلت گروهی فعال — ساعت باقی‌مانده (برای پیش‌فرض و جلوگیری از ریستِ دورِ جاری)
    const activeRemaining = remainingHours(currentDeadline);
    const showDeadlineInput = st.urgent && !(editItem?.urgent) && !activeRemaining;

    // گزینه‌های سلکت واحد: واحدهای من (با عنوان ترکیبی) + پرکاربرد + بقیهٔ مرجع
    const unitOptions = useMemo(() => {
        const list = allUnits as any[];
        const refById = new Map<string, any>(list.map((u) => [u.id, u]));
        // ✅ واحدهای من — با پشتیبانی عنوان ترکیبی («کارتن ۲۴ عددی»)
        const mine: any[] = [];
        for (const u of (catalogUnits as any[]) || []) {
            const ref = refById.get(u.unitId);
            const title = u.title || ref?.title || '';
            if (!title && !ref) continue;
            mine.push({ id: u.unitId, title, refTitle: ref?.title || title, custom: !!u.title });
        }
        const mineBaseIds = new Set(mine.map((u) => u.id));
        const sug = UNIT_SUGGESTIONS
            .map((t) => list.find((u) => u.title === t))
            .filter((u): u is any => !!u && !mineBaseIds.has(u.id));
        const sugIds = new Set(sug.map((u) => u.id));
        const rest = list.filter((u) => !mineBaseIds.has(u.id) && !sugIds.has(u.id));
        return { mine, sug, rest };
    }, [allUnits, catalogUnits]);

    const orderedUnits = useMemo(
        () => [...unitOptions.mine, ...unitOptions.sug, ...unitOptions.rest],
        [unitOptions],
    );

    const findUnit = (id: string): any => (allUnits as any[]).find((u) => u.id === id) || null;

    const patch = (p: Partial<SheetState>) => setSt((s) => ({ ...s, ...p }));

    const pickProduct = (p: ProductValue | null) => {
        patch({ product: p, brand: p?.brandTitle || '' });
        setErrors((e) => ({ ...e, product: '', brand: '' }));
    };

    const pickUnit = (v: { id: string | null; title: string }) => {
        const ref = v.id ? findUnit(v.id) : null;
        const title = v.title || ref?.title || '';
        patch({ unitId: v.id || '', unitTitle: title });
        setUnitCount(parseCountFromTitle(title));
        setErrors((e) => ({ ...e, unit: '' }));
    };

    // ⚖️ قانون دیمت: خطای CSSِ روی فیلد کافی نیست — الرتِ واضحِ toast هم با ذکرِ خودِ فیلد بده
    const validate = (): Record<string, string> | null => {
        const e: Record<string, string> = {};
        if (!st.product || !st.product.title.trim()) e.product = 'کالا انتخاب نشده';
        else if (existingItems?.some((i) => i.id !== editItem?.id && normalizeItemName(i.name) === normalizeItemName(st.product!.title))) {
            e.product = 'این کالا قبلا در لیست هست — ویرایشش کن';
        }
        if (!st.brand.trim()) e.brand = 'برند انتخاب نشده';
        // ✅ حجم خرید و واحد الزامی‌اند (خواستهٔ مالک: بدون انتخاب، الرت بدهد — قبلاً بی‌سوال ذخیره می‌شد)
        const q = Number(st.quantity.replace(/[^\d.]/g, ''));
        if (!st.quantity.trim() || !q || q <= 0) e.quantity = 'حجم خرید را وارد کن — مثلا ۲۵';
        if (!st.unitId && !st.unitTitle.trim()) e.unit = 'واحد را انتخاب کن — مثلا کیلوگرم یا کارتن';
        const h = parseLatinInt(deadlineHours);
        if (showDeadlineInput && (!h || h < 1 || h > MAX_DEADLINE_HOURS)) {
            e.deadline = `مهلت ارسال قیمت را به ساعت وارد کن — عددی بین ۱ تا ${faNum(MAX_DEADLINE_HOURS)}`;
        }
        setErrors(e);
        return Object.keys(e).length ? e : null;
    };

    const buildPayload = (): CreateInquiryItemPayload | null => {
        const qty = st.quantity.trim() ? Number(st.quantity.replace(/[^\d.]/g, '')) : undefined;
        const base = baseUnitTitle(st.unitTitle);
        const cnt = parseInt(unitCount.replace(/[^\d]/g, ''), 10);
        const isCountable = !!base && COUNTABLE_UNITS.includes(base);
        const finalUnit = isCountable && cnt > 0 ? `${base} ${faNum(cnt)} عددی` : st.unitTitle.trim();
        return {
            name: st.product?.title.trim() || '',
            referenceItemId: st.product?.id || undefined,
            unitId: st.unitId || undefined,
            unit: finalUnit || findUnit(st.unitId)?.title || undefined,
            quantity: qty && qty > 0 ? qty : undefined,
            brand: st.brand.trim() || undefined,
            note: st.note.trim() || undefined,
            referenceUrl: st.referenceUrl.trim() || undefined,
            specs: st.specs.filter((s) => s.key.trim() && s.value.trim()),
            urgent: st.urgent,
        };
    };

    /** ✅ واحدهای من + مهلت گروهی — در همان فراخوان update کنار هم ذخیره می‌شوند */
    const syncInquirySide = async (): Promise<void> => {
        const patchData: Record<string, any> = {};
        // واحدهای من — تیک افزودن (خواستهٔ مالک: واحدهای استفاده‌شده دم دست بمانند)
        if (favUnit && st.unitId) {
            const base = baseUnitTitle(st.unitTitle);
            const cnt = parseInt(unitCount.replace(/[^\d]/g, ''), 10);
            const isCountable = !!base && COUNTABLE_UNITS.includes(base);
            const desiredTitle = isCountable && cnt > 0 ? `${base} ${faNum(cnt)} عددی` : undefined;
            const cur = (catalogUnits as any[]) || [];
            const already = cur.some((u) => u.unitId === st.unitId && (u.title || undefined) === desiredTitle);
            if (!already) {
                patchData.units = [...cur, { unitId: st.unitId, ...(desiredTitle ? { title: desiredTitle } : {}) }];
            }
        }
        // مهلت گروهی — فقط وقتی قیمت‌گیری تازه روشن می‌شود و مهلت فعالی وجود ندارد (دورِ قیمت‌گیری جاری را به‌هم نزنیم)
        if (st.urgent && !(editItem?.urgent) && !activeRemaining) {
            const h = parseLatinInt(deadlineHours);
            if (h >= 1 && h <= MAX_DEADLINE_HOURS) {
                patchData.deadline = new Date(Date.now() + h * 3600e3).toISOString();
            }
        }
        if (Object.keys(patchData).length === 0) return;
        await apiService.inquiry.update(inquiryId, patchData);
        qc.invalidateQueries({ queryKey: ['inquiry', 'detail', inquiryId] });
    };

    const save = async (thenAnother: boolean) => {
        const validationErrors = validate();
        if (validationErrors) {
            toastFormErrors(validationErrors); // ⚖️ الرت واضح کنار خطای CSS فیلدها
            return;
        }
        const payload = buildPayload();
        if (!payload) return;
        setSaving(true);
        try {
            if (editItem) {
                await apiService.inquiry.updateItem(inquiryId, editItem.id, payload);
                await syncInquirySide().catch(() => {});
                qc.invalidateQueries({ queryKey: ['inquiry', 'detail', inquiryId] });
                qc.invalidateQueries({ queryKey: ['inquiries'] });
                toast.success('تغییرات ذخیره شد');
                onClose();
            } else {
                await apiService.inquiry.addItem(inquiryId, payload);
                await syncInquirySide().catch(() => {});
                // ✅ نمایش فوری در لیست — بدون رفرش دستی (خواستهٔ مالک)
                qc.invalidateQueries({ queryKey: ['inquiry', 'detail', inquiryId] });
                qc.invalidateQueries({ queryKey: ['inquiries'] });
                if (isFirstItem) {
                    toast.success('اولین قلمت ثبت شد 🎉', {
                        description: 'برای اینکه تامین‌کننده‌ها اقلامت را ببینند، از تب «تامین‌کنندگان» به تامین‌کننده‌های مناسب کالایت در شهرت درخواست همکاری بده.',
                        duration: 9000,
                    });
                } else if (st.urgent) {
                    toast.success('قلم ثبت شد و قیمت‌گیری‌اش فعال است');
                } else {
                    toast.success('قلم ثبت شد');
                }
                if (thenAnother) {
                    // برای ثبت زنجیره‌ای: کالا و جزئیات پاک، واحد/تعداد و وضعیت می‌ماند
                    setSt((s) => ({ ...freshState(), unitId: s.unitId, unitTitle: s.unitTitle, urgent: s.urgent }));
                    setAdvOpen(false);
                    setErrors({});
                } else {
                    onClose();
                }
            }
        } catch (e: any) {
            const code = e?.response?.data?.errorCode;
            if (code === 'DUPLICATE_ITEM') {
                toast.error(e?.response?.data?.message || 'این کالا قبلا در لیست هست');
                setErrors((p) => ({ ...p, product: 'این کالا قبلا در لیست هست — ویرایشش کن' }));
            } else {
                toast.error(e?.response?.data?.message || 'ثبت قلم ناموفق بود');
            }
        } finally {
            setSaving(false);
        }
    };

    const removeSpec = (i: number) => patch({ specs: st.specs.filter((_, si) => si !== i) });
    const addSpec = () => {
        patch({ specs: [...st.specs, { key: '', value: '' }] });
        nextKey.current += 1;
    };

    if (!mounted) return null;

    const unitBase = baseUnitTitle(st.unitTitle);
    const isCountable = !!unitBase && COUNTABLE_UNITS.includes(unitBase);

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50"
                        onClick={saving ? undefined : onClose}
                    />
                    <motion.div
                        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto scrollbar-slim
                            rounded-t-3xl sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
                        {/* سرآیند */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/95 px-5 py-3.5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                            <h2 className="flex items-center gap-2 text-[15px] font-black text-stone-900 dark:text-gray-100">
                                <Megaphone className="size-4 text-brand-contrast" />
                                {editItem ? 'ویرایش قلم' : 'قلم خرید جدید'}
                            </h2>
                            <button onClick={onClose} aria-label="بستن"
                                className="grid size-8 place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-gray-800">
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="space-y-4 px-5 py-4 pb-6">
                            {/* کالا */}
                            <ProductReferencePicker
                                value={st.product}
                                onChange={pickProduct}
                                placeholder="کالا"
                                error={errors.product}
                            />

                            {/* حجم خرید + واحد — سلکتور سرچ‌دار (خواستهٔ مالک: دراپ‌داون ساده بی‌سرچ نباشد)
                                ⚖️ هر دو الزامی — خطای CSS + الرت toast (toastFormErrors در save) */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="min-w-0">
                                    <input
                                        value={st.quantity}
                                        onChange={(e) => { patch({ quantity: e.target.value }); setErrors((p) => ({ ...p, quantity: '' })); }}
                                        inputMode="decimal"
                                        placeholder="حجم خرید"
                                        className={cn(inp, 'w-full text-center', errors.quantity && 'border-red-400')}
                                    />
                                    {errors.quantity && <p className="mt-1 px-1 text-[10px] font-bold text-red-500">{errors.quantity}</p>}
                                </div>
                                <div className="min-w-0">
                                    <Autocomplete
                                        value={{ id: st.unitId || null, title: st.unitTitle }}
                                        onChange={pickUnit}
                                        fetchFn={async (q) => {
                                            const t = (q || '').trim();
                                            return orderedUnits
                                                .filter((u: any) => !t || (u.title || '').includes(t))
                                                .slice(0, 40);
                                        }}
                                        queryKey="units-autocomplete"
                                        placeholder="واحد — جستجو کن"
                                        allowCreate={false}
                                        minChars={0}
                                        className="h-10!"
                                        renderOption={(u: any) => (
                                            <span className="flex w-full items-center justify-between gap-2">
                                                <span className="truncate">{u.title}</span>
                                                {u.custom && (
                                                    <span className="shrink-0 rounded-full bg-brand-contrast-soft px-1.5 py-0.5 text-[8.5px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                                        واحدهای من
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    />
                                    {errors.unit && <p className="mt-1 px-1 text-[10px] font-bold text-red-500">{errors.unit}</p>}
                                </div>
                            </div>

                            {/* ✅ تعداد در واحد تعداددار — «کارتن ۲۴ عددی» (خواستهٔ مالک) */}
                            {isCountable && (
                                <div className="flex items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 p-2.5 dark:border-gray-800 dark:bg-gray-950/60">
                                    <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <span className="shrink-0 text-[11px] font-bold text-stone-500 dark:text-gray-400">
                                        تعداد در هر {unitBase}:
                                    </span>
                                    <input
                                        value={unitCount}
                                        onChange={(e) => setUnitCount(e.target.value.replace(/[^\d۰-۹]/g, ''))}
                                        inputMode="numeric"
                                        placeholder="۲۴"
                                        className="h-8 w-20 rounded-lg border border-stone-200 bg-white px-2 text-center text-xs font-black text-stone-900 outline-none transition-colors focus:border-brand-contrast dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                                    />
                                    <span className="text-[10px] font-bold text-stone-400 dark:text-gray-500">عدد — با ذخیره، «{unitBase} {unitCount ? `${faNum(parseInt(unitCount.replace(/[^\d۰-۹]/g, ''), 10) || 0)} عددی` : '۲۴ عددی'}» می‌شود</span>
                                </div>
                            )}

                            {/* ✅ تیک افزودن به واحدهای من — دفعات بعد سرِ دست (خواستهٔ مالک) */}
                            {st.unitId && (
                                <button type="button" onClick={() => setFavUnit((v) => !v)}
                                    className="flex w-full items-center gap-2 rounded-xl px-1 py-1 text-right">
                                    <span className={cn('grid size-5 place-items-center rounded-md border-2 transition-colors',
                                        favUnit ? 'border-brand-contrast bg-brand-contrast text-white' : 'border-stone-300 dark:border-gray-600')}>
                                        {favUnit && <span className="text-[10px] font-black leading-none">✓</span>}
                                    </span>
                                    <span className="text-[11px] font-bold text-stone-500 dark:text-gray-400">
                                        افزودن به واحدهای بازوی خرید — دفعه‌های بعد سرِ دستت باشد
                                    </span>
                                </button>
                            )}

                            {/* قیمت‌گیری — سؤالِ روشن (جای «بازوی خرید»ی بی‌معنی بعد از ریپلیس) */}
                            <div className={`rounded-2xl border p-3.5 transition-colors ${
                                st.urgent
                                    ? 'border-brand-contrast/50 bg-brand-contrast-soft/60 dark:bg-amber-500/10'
                                    : 'border-stone-200 bg-stone-50 dark:border-gray-700 dark:bg-gray-950/60'
                            }`}>
                                <SwitchRow
                                    checked={st.urgent}
                                    onChange={(v) => {
                                        patch({ urgent: v });
                                        if (v && !editItem?.urgent && !deadlineHours) {
                                            setDeadlineHours(String(activeRemaining || 24));
                                        }
                                        if (!v) setErrors((e) => ({ ...e, deadline: '' }));
                                    }}
                                    label="اضافه به لیست در حال قیمت‌گیری"
                                    sub="با این کار کالای شما، غیر از کاتالوگ، در لیست درخواست قیمت تامین‌کننده‌های همکار شما قرار می‌گیرد."
                                />

                                {/* ✅ مهلت ارسال قیمت — عددی به ساعت، حداکثر ۲۴۰ (خواستهٔ مالک) */}
                                {showDeadlineInput && (
                                    <div className="mt-2.5 rounded-xl border border-stone-100 bg-white/70 p-2.5 dark:border-gray-800 dark:bg-gray-950/60">
                                        <label className="mb-1 block text-[10px] font-bold text-stone-400">
                                            مهلت ارسال قیمت — به ساعت (حداکثر {faNum(MAX_DEADLINE_HOURS)} ساعت)
                                        </label>
                                        <input
                                            value={deadlineHours}
                                            onChange={(e) => { setDeadlineHours(e.target.value.replace(/[^\d۰-۹]/g, '')); setErrors((p) => ({ ...p, deadline: '' })); }}
                                            inputMode="numeric"
                                            placeholder="مثلا ۲۴"
                                            className={cn(inpSm, 'w-full text-center', errors.deadline && 'border-red-400')}
                                        />
                                        <p className="mt-1 text-[9.5px] font-bold leading-4 text-stone-400 dark:text-gray-500">
                                            تامین‌کننده‌ها تا این فرصت می‌توانند قیمت ثبت کنند — در پنل‌شان ساعت باقی‌مانده دیده می‌شود.
                                        </p>
                                        {errors.deadline && <p className="mt-1 text-[10px] font-bold text-red-500">{errors.deadline}</p>}
                                    </div>
                                )}
                                {st.urgent && editItem?.urgent && (
                                    <p className="mt-2 text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                        {activeRemaining
                                            ? `مهلت گروهی فعلی: ${faNum(activeRemaining)} ساعت دیگر — از تب اقلام قابل تغییر است`
                                            : 'مهلت گروهی فعلی ندارد — از تب اقلام تنظیم کن'}
                                    </p>
                                )}
                            </div>

                            {/* ویژگی‌ها (اختیاری) — آکاردئون با هدر واضح سایه‌دار (خواستهٔ مالک:
                                کاربر کم‌سواد هم بفهمد باید بزند تا باز شود — برچسب صریح «باز کردن/بستن») */}
                            <div>
                                <button
                                    onClick={() => setAdvOpen((o) => !o)}
                                    aria-expanded={advOpen}
                                    className={cn('flex w-full items-center justify-between rounded-xl border px-3 py-2.5 shadow-sm transition-all',
                                        advOpen
                                            ? 'border-brand-contrast/50 bg-brand-contrast-soft/40 dark:border-amber-500/30 dark:bg-amber-500/10'
                                            : 'border-stone-200 bg-white hover:border-brand-contrast/60 dark:border-gray-700 dark:bg-gray-900')}>
                                    <span className="flex items-center gap-1.5 text-[12px] font-black text-stone-600 dark:text-gray-200">
                                        ویژگی‌ها (اختیاری)
                                        <ChevronDown className={cn('size-3.5 text-stone-500 transition-transform dark:text-gray-400', advOpen && 'rotate-180')} />
                                    </span>
                                    <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-black',
                                        advOpen
                                            ? 'bg-brand-contrast text-white'
                                            : 'bg-stone-100 text-stone-500 dark:bg-gray-800 dark:text-gray-400')}>
                                        {advOpen ? 'بستن' : 'باز کردن'}
                                    </span>
                                </button>
                                <p className="px-1 pb-1 text-[10px] font-bold leading-4 text-stone-400 dark:text-gray-500">
                                    اگر کالای سفارشی یا سفارش شما ویژگی‌های خاصی دارد مشخص کنید — مثل رنگ، تاریخ انقضا.
                                </p>
                                <AnimatePresence initial={false}>
                                    {advOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="overflow-hidden">
                                            <div className="space-y-2.5 pt-2">
                                                <input
                                                    value={st.brand}
                                                    onChange={(e) => { patch({ brand: e.target.value }); setErrors((p) => ({ ...p, brand: '' })); }}
                                                    placeholder="برند"
                                                    className={cn(inpSm, 'w-full', errors.brand && 'border-red-400')}
                                                />
                                                {errors.brand && <p className="px-1 text-[10px] font-bold text-red-500">{errors.brand}</p>}
                                                <input
                                                    value={st.referenceUrl}
                                                    onChange={(e) => patch({ referenceUrl: e.target.value })}
                                                    dir="ltr"
                                                    placeholder="لینک نمونه"
                                                    className={`${inpSm} w-full text-left`}
                                                />
                                                {st.specs.map((s, i) => (
                                                    <div key={i} className="flex items-center gap-1.5">
                                                        <input
                                                            value={s.key}
                                                            onChange={(e) => patch({ specs: st.specs.map((sp, si) => si === i ? { ...sp, key: e.target.value } : sp) })}
                                                            placeholder="ویژگی"
                                                            className={`${inpSm} min-w-0 flex-1`}
                                                        />
                                                        <input
                                                            value={s.value}
                                                            onChange={(e) => patch({ specs: st.specs.map((sp, si) => si === i ? { ...sp, value: e.target.value } : sp) })}
                                                            placeholder="مقدار"
                                                            className={`${inpSm} min-w-0 flex-1`}
                                                        />
                                                        <button onClick={() => removeSpec(i)} aria-label="حذف ویژگی"
                                                            className="grid size-8 shrink-0 place-items-center rounded-lg text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button onClick={addSpec}
                                                    className="flex items-center gap-1 ps-1 text-[11px] font-bold text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-400">
                                                    <Plus className="size-3" /> افزودن ویژگی
                                                </button>
                                                <input
                                                    value={st.note}
                                                    onChange={(e) => patch({ note: e.target.value })}
                                                    placeholder="یادداشت"
                                                    className={`${inpSm} w-full`}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* دکمه‌ها */}
                        <div className="sticky bottom-0 flex gap-2 border-t border-stone-100 bg-white/95 px-5 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                            {editItem ? (
                                <button
                                    onClick={() => save(false)}
                                    disabled={saving}
                                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-contrast text-sm font-extrabold text-white shadow-lg shadow-brand-contrast/25 transition-colors hover:bg-brand-contrast-strong disabled:opacity-50">
                                    {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                                    ذخیره تغییرات
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => save(false)}
                                        disabled={saving}
                                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-contrast text-sm font-extrabold text-white shadow-lg shadow-brand-contrast/25 transition-colors hover:bg-brand-contrast-strong disabled:opacity-50">
                                        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                                        ثبت قلم
                                    </button>
                                    <button
                                        onClick={() => save(true)}
                                        disabled={saving}
                                        className="h-11 rounded-xl border border-stone-200 px-4 text-xs font-bold text-stone-600 transition-colors hover:border-brand-contrast hover:text-amber-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300">
                                        ثبت و بعدی
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
