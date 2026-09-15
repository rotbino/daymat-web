// app/my-inquiries/components/AddItemSheet.tsx
// شیت افزودن/ویرایش قلم خرید — هر بار یک کالا (فلسفهٔ مالک: فرم قلم‌به‌قلم، بدون توضیح اضافه؛
// ساختار فرم خودش حرف می‌زند). کالا از مرجع (EntityPicker با امکان افزودن)، واحد از مرجع واحد،
// و تاگل «بازوی خرید» که قلم را بالای کاتالوگ عمومی می‌نشاند.
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import ProductReferencePicker, { ProductValue } from '@/app/components/ProductReferencePicker';
import SwitchRow from './SwitchRow';
import { inp, inpSm, UNIT_SUGGESTIONS } from '../../inquiries/utils';
import { X, ChevronDown, Plus, Loader2, Megaphone, Trash2 } from 'lucide-react';
import type { CreateInquiryItemPayload, InquiryItem } from '@/lib/api/apiTypes';

interface Props {
    open: boolean;
    onClose: () => void;
    inquiryId: string;
    catalogUnits: { unitId: string }[];
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

export default function AddItemSheet({ open, onClose, inquiryId, catalogUnits, editItem }: Props) {
    // مرجع واحد (کش مشترک با کاتالوگ قیمت)
    const { data: allUnits = [] } = useQuery({
        queryKey: ['units-all'],
        queryFn: () => apiService.ad.getAllUnits(),
        staleTime: 1000 * 60 * 60,
        enabled: open,
    });

    const [st, setSt] = useState<SheetState>(freshState());
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
            setAdvOpen(!!(editItem.brand || editItem.note || editItem.referenceUrl || (editItem.specs?.length ?? 0) > 0));
        } else {
            setSt(freshState());
            setAdvOpen(false);
        }
    }, [open, editItem]);

    useEffect(() => setMounted(true), []);

    // گزینه‌های سلکت واحد: واحدهای من + پرکاربرد + بقیهٔ مرجع
    const unitOptions = useMemo(() => {
        const list = allUnits as any[];
        const mineIds = new Set(catalogUnits.map((u) => u.unitId));
        const mine = list.filter((u) => mineIds.has(u.id));
        const sug = UNIT_SUGGESTIONS
            .map((t) => list.find((u) => u.title === t))
            .filter((u): u is any => !!u && !mineIds.has(u.id));
        const sugIds = new Set(sug.map((u) => u.id));
        const rest = list.filter((u) => !mineIds.has(u.id) && !sugIds.has(u.id));
        return { mine, sug, rest };
    }, [allUnits, catalogUnits]);

    const findUnit = (id: string): any => (allUnits as any[]).find((u) => u.id === id) || null;

    const patch = (p: Partial<SheetState>) => setSt((s) => ({ ...s, ...p }));

    const pickProduct = (p: ProductValue | null) => {
        patch({ product: p, brand: p?.brandTitle || '' });
    };

    const buildPayload = (): CreateInquiryItemPayload | null => {
        if (!st.product || !st.product.title.trim()) {
            toast.error('اول کالا رو انتخاب کن');
            return null;
        }
        const qty = st.quantity.trim() ? Number(st.quantity.replace(/[^\d.]/g, '')) : undefined;
        return {
            name: st.product.title.trim(),
            referenceItemId: st.product.id || undefined,
            unitId: st.unitId || undefined,
            unit: st.unitTitle || findUnit(st.unitId)?.title || undefined,
            quantity: qty && qty > 0 ? qty : undefined,
            brand: st.brand.trim() || undefined,
            note: st.note.trim() || undefined,
            referenceUrl: st.referenceUrl.trim() || undefined,
            specs: st.specs.filter((s) => s.key.trim() && s.value.trim()),
            urgent: st.urgent,
        };
    };

    const save = async (thenAnother: boolean) => {
        const payload = buildPayload();
        if (!payload) return;
        setSaving(true);
        try {
            if (editItem) {
                await apiService.inquiry.updateItem(inquiryId, editItem.id, payload);
                toast.success(st.urgent && !editItem.urgent ? 'ذخیره شد — بازوی خرید فعال شد' : 'تغییرات ذخیره شد');
                onClose();
            } else {
                await apiService.inquiry.addItem(inquiryId, payload);
                toast.success(st.urgent ? 'قلم ثبت شد و بازوی خریدش فعال است' : 'قلم ثبت شد');
                if (thenAnother) {
                    // برای ثبت زنجیره‌ای: کالا و جزئیات پاک، واحد و وضعیت می‌ماند
                    setSt((s) => ({ ...freshState(), unitId: s.unitId, unitTitle: s.unitTitle }));
                    setAdvOpen(false);
                } else {
                    onClose();
                }
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ثبت قلم ناموفق بود');
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
                            />

                            {/* مقدار + واحد — تا جایی که جا می‌شود یک خط */}
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    value={st.quantity}
                                    onChange={(e) => patch({ quantity: e.target.value })}
                                    inputMode="decimal"
                                    placeholder="مقدار"
                                    className={`${inp} w-full text-center`}
                                />
                                <select
                                    value={st.unitId}
                                    onChange={(e) => {
                                        const u = findUnit(e.target.value);
                                        patch({ unitId: e.target.value, unitTitle: u?.title || '' });
                                    }}
                                    className={`${inp} w-full cursor-pointer dark:[color-scheme:dark] [&>option]:bg-white [&>option]:text-stone-900 dark:[&>option]:bg-gray-950 dark:[&>option]:text-gray-100`}>
                                    <option value="">واحد</option>
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

                            {/* بازوی خرید — تاگل سرنوشت‌ساز */}
                            <div className={`rounded-2xl border p-3.5 transition-colors ${
                                st.urgent
                                    ? 'border-brand-contrast/50 bg-brand-contrast-soft/60 dark:bg-amber-500/10'
                                    : 'border-stone-200 bg-stone-50 dark:border-gray-700 dark:bg-gray-950/60'
                            }`}>
                                <SwitchRow
                                    checked={st.urgent}
                                    onChange={(v) => patch({ urgent: v })}
                                    label="بازوی خرید"
                                    sub="تامین‌کننده‌ها می‌تونن قیمت بدن"
                                />
                            </div>

                            {/* ویژگی‌ها (اختیاری) */}
                            <div>
                                <button
                                    onClick={() => setAdvOpen((o) => !o)}
                                    className="flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-[12px] font-bold text-stone-400 transition-colors hover:text-amber-600 dark:hover:text-amber-400">
                                    ویژگی‌ها (اختیاری)
                                    <ChevronDown className={`size-4 transition-transform ${advOpen ? 'rotate-180' : ''}`} />
                                </button>
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
                                                    onChange={(e) => patch({ brand: e.target.value })}
                                                    placeholder="برند"
                                                    className={`${inpSm} w-full`}
                                                />
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
