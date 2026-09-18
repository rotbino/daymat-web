// app/ad/components/UnitSettingsModal.tsx
// ✅ مدال «انتخاب واحد فروش» — سرچ کلی + فیلتر تکی/بسته + ثبت واحد جدید (کم‌مصرف)
//    ۱) سرچ همیشه کلی است — فیلتر دسته (تکی/بسته) هنگام جستجو نادیده گرفته می‌شود
//    ۲) واحد جدید: دکمهٔ کوچکِ بالا (بیشترِ واحدها از قبل ثبت‌اند) + نرمال‌سازی ی/ک/نیم‌فاصله
//       + برای بسته: تعداد داخل واحد (مثل ۲۴ عدد در هر کارتن) و ثابت/قابل‌تغییر
//    ۳) انتخاب‌شده‌ها فقط در سورتینگ بالای لیست می‌آیند — تک‌خطی و جمع‌وجور: نام (تعداد) + تیک + مداد
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Check, Loader2, Package, Search, X, Lock, Plus, Boxes, Store, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';
import { NumberInput } from '@/components/common/NumberInput';

// ✅ همان نرمال‌سازی بک‌اند — جلوگیری از تکرار با ظاهر متفاوت (ي/ی، ك/ک، نیم‌فاصله…)
function normUnit(raw: string): string {
    let s = (raw || '').trim().toLowerCase();
    s = s.replace(/[يىئكأإٱةؤ\u200c]/g, (ch) => ({
        'ي': 'ی', 'ى': 'ی', 'ئ': 'ی', 'ك': 'ک',
        'أ': 'ا', 'إ': 'ا', 'ٱ': 'ا', 'ة': 'ه', 'ؤ': 'و', '\u200c': ' ',
    }[ch] || ch));
    return s.replace(/\s+/g, ' ');
}

type Scope = 'wholesale' | 'retail';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    catalogId: string;
    initialUnits: { unitId: string; containsQty?: number; qtyIsFixed?: boolean }[];
    onSaved: (units: { unitId: string; containsQty?: number; qtyIsFixed?: boolean }[]) => void;
    /** ✅ عمومی‌شده: ذخیره‌ساز سفارشی (مثلاً بازوی خرید → PATCH استعلام) — پیش‌فرض: کانفیگ بازوی فروش */
    saveFn?: (units: { unitId: string; containsQty?: number; qtyIsFixed?: boolean }[]) => Promise<any>;
    /** ✅ عنوان مدال — پیش‌فرض: واحدهای اختصاصی بازوی فروش */
    title?: string;
    /** ✅ نمایش فیلدهای بسته‌بندی (تعداد داخلش / ثابت) — بازوی خرید اینها را ندارد */
    showQtyFields?: boolean;
}

export default function UnitSettingsModal({ isOpen, onClose, catalogId, initialUnits, onSaved, saveFn, title, showQtyFields = true }: Props) {
    const queryClient = useQueryClient();

    // ✅ همان متد و کشِ فرم آگهی — همیشه همگام
    const { data: allUnits = [], isLoading } = useQuery({
        queryKey: ['units-all'],
        queryFn: () => apiService.ad.getAllUnits(),
        staleTime: 1000 * 60 * 60,
    });

    const [selected, setSelected] = useState<Map<string, { containsQty: number | null; qtyIsFixed: boolean }>>(new Map());
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    // ✅ ویرایشگر تعداد — فقط با کلیک روی مداد باز می‌شود تا لیست جمع‌وجور بماند
    const [editingId, setEditingId] = useState<string | null>(null);

    // ✅ فیلتر دسته — تکی/بسته؛ هنگام جستجو نادیده گرفته می‌شود (سرچ همیشه کلی)
    const [scopeFilter, setScopeFilter] = useState<'all' | Scope>('all');

    // ✅ فرم ثبت واحد جدید
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newScope, setNewScope] = useState<Scope | null>(null);
    const [newQty, setNewQty] = useState<number | undefined>(undefined);
    const [newFixed, setNewFixed] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const map = new Map<string, { containsQty: number | null; qtyIsFixed: boolean }>();
        for (const s of initialUnits) {
            map.set(s.unitId, { containsQty: s.containsQty ?? null, qtyIsFixed: !!s.qtyIsFixed });
        }
        setSelected(map);
        setSearch('');
        setScopeFilter('all');
        setEditingId(null);
        setShowCreate(false);
        setNewTitle('');
        setNewScope(null);
        setNewQty(undefined);
        setNewFixed(false);
    }, [isOpen, initialUnits]);

    const toggleUnit = (unitId: string) => {
        setSelected((prev) => {
            const next = new Map(prev);
            if (next.has(unitId)) {
                next.delete(unitId);
            } else {
                const u = allUnits.find((x: any) => x.id === unitId) as any;
                // ✅ پیش‌فرض تعداد فقط از واحدهای تعدادیِ دیتابیس
                next.set(unitId, { containsQty: u?.containsQty ?? null, qtyIsFixed: !!u?.qtyIsFixed });
            }
            return next;
        });
    };

    const updateQty = (unitId: string, qty: number | null) => {
        setSelected((prev) => {
            const next = new Map(prev);
            const cur = next.get(unitId);
            if (cur) next.set(unitId, { ...cur, containsQty: qty && qty > 0 ? qty : null });
            return next;
        });
    };

    const toggleFixed = (unitId: string) => {
        setSelected((prev) => {
            const next = new Map(prev);
            const cur = next.get(unitId);
            if (cur) next.set(unitId, { ...cur, qtyIsFixed: !cur.qtyIsFixed });
            return next;
        });
    };

    // ✅ ثبت واحد جدید
    const handleCreate = async () => {
        const title = newTitle.trim();
        if (!title) {
            toast.error('عنوان واحد را بنویس');
            return;
        }
        if (!newScope) {
            toast.error('تکلیف واحد را روشن کن: بسته است یا تکی؟');
            return;
        }
        // ✅ چک تکراری محلی — قبل از رفتن به سرور
        const n = normUnit(title);
        const dup = (allUnits as any[]).find((u) =>
            normUnit(u.title || '') === n || normUnit(u.shortCode || '') === n);
        if (dup) {
            toast.error(`واحدی با عنوان «${dup.title}» از قبل هست — از لیست انتخابش کن`);
            return;
        }
        setCreating(true);
        try {
            const created = await apiService.ad.createUnit({
                title,
                scope: newScope,
                containsQty: newScope === 'wholesale' && newQty && newQty >= 2 ? newQty : undefined,
                qtyIsFixed: newScope === 'wholesale' && newQty && newQty >= 2 ? newFixed : false,
            });
            await queryClient.invalidateQueries({ queryKey: ['units-all'] });
            // ✅ واحد تازه‌ساخت فوری به بازوی فروش اضافه می‌شود
            setSelected((prev) => {
                const next = new Map(prev);
                next.set(created.id, { containsQty: created.containsQty ?? null, qtyIsFixed: !!created.qtyIsFixed });
                return next;
            });
            toast.success(`واحد «${created.title}» ثبت شد و به بازوی فروشت اضافه شد`);
            setNewTitle('');
            setNewScope(null);
            setNewQty(undefined);
            setNewFixed(false);
            setShowCreate(false);
            setScopeFilter('all');
        } catch (e: any) {
            toast.error(e?.message || 'خطا در ثبت واحد');
        } finally {
            setCreating(false);
        }
    };

    // ✅ فیلتر همه/تکی/بسته فقط وقتی سرچ خالی است اعمال می‌شود — سرچ همیشه کلی است
    const filtered = useMemo(() => {
        const q = search.trim();
        return (allUnits as any[]).filter((u) =>
            (!q || (u.title || '').includes(q) || (u.shortCode || '').includes(q))
            && (q || scopeFilter === 'all' || u.scope === scopeFilter));
    }, [allUnits, search, scopeFilter]);

    // ✅ انتخاب‌شده‌ها فقط با سورتینگ بالا می‌آیند — نه بخش جدای بزرگ
    const sorted = useMemo(() => {
        return [...(filtered as any[])].sort((a: any, b: any) =>
            Number(selected.has(b.id)) - Number(selected.has(a.id)));
    }, [filtered, selected]);

    const counts = useMemo(() => {
        const list = allUnits as any[];
        return {
            all: list.length,
            wholesale: list.filter((u) => u.scope === 'wholesale').length,
            retail: list.filter((u) => u.scope === 'retail').length,
        };
    }, [allUnits]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const units = [...selected.entries()].map(([unitId, v]) => ({
                unitId,
                containsQty: showQtyFields && v.containsQty && v.containsQty > 0 ? v.containsQty : undefined,
                qtyIsFixed: showQtyFields ? v.qtyIsFixed : false,
            }));
            const res = saveFn
                ? await saveFn(units)
                : await apiService.catalog.updateConfig(catalogId, { units });
            onSaved(res?.config?.units ?? units);
            toast.success('واحدها ذخیره شد');
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'خطا در ذخیره');
        } finally {
            setSaving(false);
        }
    };

    if (!mounted) return null;
    if (!isOpen) return null;

    const scopeBadge = (scope?: string) => scope === 'wholesale' ? (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 flex-shrink-0">بسته</span>
    ) : scope === 'retail' ? (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 flex-shrink-0">تکی</span>
    ) : null;

    const modalContent = (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
             onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                     max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden
                     animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Package className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                        </span>
                        <div>
                            <h3 className="text-sm font-extrabold text-on-surface">{title || 'انتخاب واحد فروش'}</h3>
                            <p className="text-[10px] text-on-surface-variant/70">
                                {selected.size > 0
                                    ? `${selected.size.toLocaleString('fa-IR')} واحد انتخاب شده`
                                    : 'واحدهای پرکاربردت را انتخاب کن'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="بستن"
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* جستجو + دکمهٔ کوچک «واحد جدید» */}
                <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-outline-variant/15 space-y-2.5">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            {/* ✅ با اولین حرفِ سرچ، فیلتر اتوماتیک روی «همه» می‌آید — جستجو روی همهٔ واحدها */}
                            <input value={search} onChange={(e) => { setSearch(e.target.value); setScopeFilter('all'); }}
                                   placeholder="جستجو و افزودن واحد…"
                                   className="w-full h-10 pr-9 rounded-xl bg-surface-container-lowest border border-outline-variant/40
                                       text-sm outline-none focus:border-amber-500 transition-colors" />
                        </div>
                        {/* ✅ دکمهٔ کوچک «واحد جدید» — بالا و همیشه در دسترس؛ بیشترِ واحدها از قبل ثبت‌اند */}
                        <button type="button" onClick={() => setShowCreate((v) => !v)} aria-label="ثبت واحد جدید"
                                className={cn('h-10 px-2.5 rounded-xl border border-dashed text-[10px] font-bold flex items-center gap-1 flex-shrink-0 transition-colors',
                                    showCreate
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                                        : 'border-amber-500/60 text-amber-600 dark:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-900/10')}>
                            <Plus className="w-3.5 h-3.5" />
                            واحد جدید
                        </button>
                    </div>
                    {/* ✅ فیلتر دسته — تکی/بسته با فول‌راند؛ سرچ همیشه از این فیلتر مستقل است */}
                    <div className="grid grid-cols-3 gap-1.5">
                        {([
                            { key: 'all' as const, label: 'همه', icon: null, count: counts.all },
                            { key: 'wholesale' as const, label: 'بسته', icon: Boxes, count: counts.wholesale },
                            { key: 'retail' as const, label: 'تکی', icon: Store, count: counts.retail },
                        ]).map((t) => {
                            const active = scopeFilter === t.key;
                            return (
                                <button key={t.key} type="button" onClick={() => setScopeFilter(t.key)}
                                        aria-pressed={active}
                                        className={cn('h-8 rounded-full text-[11px] font-bold border flex items-center justify-center gap-1 transition-colors',
                                            active
                                                ? 'bg-amber-500 text-white border-amber-500'
                                                : 'bg-surface text-on-surface-variant border-outline-variant/40 hover:border-amber-500/40')}>
                                    {t.icon && <t.icon className="w-3 h-3" />}
                                    {t.label}
                                    <span className={cn('text-[9px] tabular-nums', active ? 'text-white/80' : 'text-on-surface-variant/50')}>
                                        {t.count.toLocaleString('fa-IR')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* بدنه */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-3">

                    {/* ✅ فرم ثبت واحد جدید — فقط وقتی کاربر از دکمهٔ کوچک بالا بازش کرده */}
                    {showCreate && (
                        <div className="mb-3 rounded-xl border border-amber-500/40 bg-amber-50/40 dark:bg-amber-900/10 p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-extrabold text-on-surface">ثبت واحد جدید</p>
                                <button type="button" onClick={() => setShowCreate(false)} aria-label="بستن فرم"
                                        className="w-6 h-6 rounded-full text-on-surface-variant hover:bg-surface-container-high grid place-items-center">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                                   placeholder="عنوان واحد — مثلاً شیرینگ"
                                   maxLength={30}
                                   className="w-full h-9 px-3 rounded-lg bg-surface border border-outline-variant/40 text-sm
                                       outline-none focus:border-amber-500 transition-colors" />
                            {/* ✅ تکلیف صریح: بسته یا تکی */}
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { key: 'wholesale' as const, label: 'بسته', icon: Boxes },
                                    { key: 'retail' as const, label: 'تکی', icon: Store },
                                ]).map((s) => {
                                    const active = newScope === s.key;
                                    return (
                                        <button key={s.key} type="button" onClick={() => setNewScope(s.key)}
                                                aria-pressed={active}
                                                className={cn('h-9 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors',
                                                    active
                                                        ? 'bg-amber-500 text-white border-amber-500'
                                                        : 'bg-surface text-on-surface-variant border-outline-variant/40 hover:border-amber-500/40')}>
                                            <s.icon className="w-3.5 h-3.5" />
                                            {s.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* ✅ تعداد برای واحدهای بسته — مثل ۲۴ عدد در هر کارتن */}
                            {showQtyFields && newScope === 'wholesale' && (
                                <div className="space-y-2 rounded-lg bg-surface p-2.5 border border-outline-variant/25">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap">تعداد داخلش:</span>
                                        <NumberInput value={newQty} onChange={(v) => setNewQty(v || undefined)}
                                                     className="h-8 flex-1" />
                                    </div>
                                    <p className="text-[9px] text-on-surface-variant/60 leading-4">
                                        مثل ۲۴ عدد در هر کارتن — خالی بگذار اگر تعدادش فرقی نمی‌کند
                                    </p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {([
                                            { key: true, label: 'تعداد مشخص' },
                                            { key: false, label: 'قابل تغییر' },
                                        ]).map((f) => {
                                            const active = newFixed === f.key;
                                            return (
                                                <button key={String(f.key)} type="button" onClick={() => setNewFixed(f.key)}
                                                        aria-pressed={active}
                                                        className={cn('h-8 rounded-lg text-[11px] font-bold border transition-colors',
                                                            active
                                                                ? 'bg-amber-500 text-white border-amber-500'
                                                                : 'bg-surface text-on-surface-variant border-outline-variant/40 hover:border-amber-500/40')}>
                                                    {f.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <button type="button" onClick={handleCreate} disabled={creating}
                                    className="w-full h-9 rounded-lg bg-amber-500 text-white text-xs font-extrabold
                                        hover:bg-amber-600 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors">
                                {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                ثبت واحد
                            </button>
                        </div>
                    )}

                    {/* ✅ لیست واحد — انتخاب‌شده‌ها فقط با سورتینگ بالا می‌آیند، تک‌خطی مثل بقیه */}
                    {isLoading ? (
                        <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-amber-500 mx-auto" /></div>
                    ) : sorted.length === 0 ? (
                        <p className="text-center py-4 text-xs text-on-surface-variant/60">
                            {search.trim()
                                ? 'واحدی با این نام پیدا نشد — با «واحد جدید» ثبتش کن'
                                : 'واحدی در این دسته نمانده — «واحد جدید» بزن'}
                        </p>
                    ) : (
                        <div className="space-y-1.5">
                            {sorted.map((u: any) => {
                                const isSel = selected.has(u.id);
                                const conf = selected.get(u.id);
                                // ✅ ویرایشگر تعداد فقط برای واحدهای بسته‌ای/تعدادی باز می‌شود
                                const isPackaging = !!conf && (conf.containsQty != null || u?.scope === 'wholesale');
                                return (
                                    <div key={u.id}>
                                        <div className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full border transition-colors',
                                            isSel
                                                ? 'border-amber-500/50 bg-amber-50/60 dark:bg-amber-900/15'
                                                : 'border-outline-variant/40 hover:border-amber-500/50 hover:bg-amber-50/40 dark:hover:bg-amber-900/10')}>
                                            <button type="button" onClick={() => toggleUnit(u.id)}
                                                    className="flex-1 min-w-0 flex items-center gap-2.5 text-right">
                                                {isSel ? (
                                                    <span className="w-5 h-5 rounded-full bg-emerald-500 grid place-items-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </span>
                                                ) : (
                                                    <span className="w-5 h-5 rounded-full border-2 border-outline-variant/40 grid place-items-center flex-shrink-0">
                                                        <Plus className="w-3 h-3 text-on-surface-variant/60" />
                                                    </span>
                                                )}
                                                <span className={cn('text-sm truncate', isSel ? 'font-bold text-on-surface' : 'font-medium text-on-surface')}>{u.title}</span>
                                                {/* ✅ تعداد داخل پرانتز — جمع‌وجور و تک‌خطی */}
                                                {isSel && isPackaging && conf?.containsQty != null && (
                                                    <span className="text-[10px] tabular-nums text-on-surface-variant/70 flex-shrink-0">
                                                        ({conf.containsQty.toLocaleString('fa-IR')})
                                                    </span>
                                                )}
                                            </button>
                                            {scopeBadge(u?.scope)}
                                            {!isSel && u.containsQty != null && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 flex-shrink-0">
                                                    {u.containsQty.toLocaleString('fa-IR')} عددی{u.qtyIsFixed ? ' • ثابت' : ''}
                                                </span>
                                            )}
                                            {/* ✅ مداد ویرایش تعداد — فقط برای انتخاب‌شده‌ها */}
                                            {isSel && showQtyFields && isPackaging && (
                                                <button type="button" onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                                                        aria-label={`ویرایش تعداد ${u.title}`}
                                                        className={cn('w-6 h-6 rounded-full grid place-items-center flex-shrink-0 transition-colors',
                                                            editingId === u.id
                                                                ? 'bg-amber-500 text-white'
                                                                : 'text-on-surface-variant hover:bg-surface-container-high')}>
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        {/* ✅ ویرایشگر تعداد — فقط با مداد باز می‌شود تا لیست شلوغ نشود */}
                                        {isSel && showQtyFields && isPackaging && editingId === u.id && (
                                            <div className="flex items-center gap-2.5 mt-1 mr-7 px-3 py-2 rounded-xl
                                                bg-surface border border-outline-variant/25">
                                                <div className="flex-1 flex items-center gap-2">
                                                    <span className="text-[10px] text-on-surface-variant/70 whitespace-nowrap">تعداد داخلش:</span>
                                                    <NumberInput value={conf?.containsQty ?? undefined}
                                                                 onChange={(v) => updateQty(u.id, v ?? null)}
                                                                 className="h-8 flex-1" />
                                                </div>
                                                <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                                                    <input type="checkbox" checked={!!conf?.qtyIsFixed}
                                                           onChange={() => toggleFixed(u.id)}
                                                           className="w-4 h-4 rounded border-outline text-amber-600 focus:ring-amber-500/30" />
                                                    <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                                                        <Lock className="w-3 h-3" /> ثابت
                                                    </span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* فوتر */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20 flex items-center gap-2.5
                    pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3">
                    <span className="flex-1 text-[11px] text-on-surface-variant">
                        ذخیره‌شده‌ها در فرم آگهی بالای لیست می‌آیند
                    </span>
                    <button onClick={handleSave} disabled={saving}
                            className="h-10 px-5 rounded-xl bg-amber-500 text-white text-xs font-extrabold
                                hover:bg-amber-600 flex items-center gap-2 disabled:opacity-50 transition-colors flex-shrink-0">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        ذخیره
                    </button>
                </div>
            </div>
        </div>
    );

    // ✅ الگوی استاندارد portal
    return createPortal(modalContent, document.body);
}
