// app/ad/components/UnitSettingsModal.tsx
// ✅ مدال واحدهای کاتالوگ — با تفکیک عمده/خرده + ثبت واحد جدید توسط خود کاربر
//    ۱) فیلتر دسته‌بندی: همه / عمده‌فروشی / خرده‌فروشی — فروشندهٔ عمده سریع واحدش را پیدا می‌کند
//    ۲) ثبت واحد جدید: عنوان بدون تکرار (نرمال‌سازی ی/ک/نیم‌فاصله) + تکلیف صریح عمده/خرده
//       + برای عمده: تعداد داخل واحد (مثل ۲۴ عدد در هر کارتن) و ثابت/قابل‌تغییر
//    ۳) تعدادِ هر واحدِ عمده در همین مدال قابل تنظیم است — حتی اگر در دیتابیس تعداد نداشته باشد
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Check, Loader2, Package, Search, X, Lock, Plus, Boxes, Store,
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
}

export default function UnitSettingsModal({ isOpen, onClose, catalogId, initialUnits, onSaved }: Props) {
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

    // ✅ فیلتر دسته — فروشندهٔ عمده روی «عمده‌فروشی» می‌زند و کارتن/پالت/باله را فوری می‌بیند
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
            toast.error('تکلیف واحد را روشن کن: عمده‌فروشی یا خرده‌فروشی؟');
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
            // ✅ واحد تازه‌ساخت فوری به کاتالوگ اضافه می‌شود
            setSelected((prev) => {
                const next = new Map(prev);
                next.set(created.id, { containsQty: created.containsQty ?? null, qtyIsFixed: !!created.qtyIsFixed });
                return next;
            });
            toast.success(`واحد «${created.title}» ثبت شد و به کاتالوگت اضافه شد`);
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

    // ✅ لیست: جستجو + فیلتر دسته
    const filtered = useMemo(() => {
        const q = search.trim();
        return (allUnits as any[]).filter((u) =>
            (!q || (u.title || '').includes(q) || (u.shortCode || '').includes(q))
            && (scopeFilter === 'all' || u.scope === scopeFilter));
    }, [allUnits, search, scopeFilter]);

    const counts = useMemo(() => {
        const list = allUnits as any[];
        return {
            all: list.length,
            wholesale: list.filter((u) => u.scope === 'wholesale').length,
            retail: list.filter((u) => u.scope === 'retail').length,
        };
    }, [allUnits]);

    const addList = filtered.filter((u: any) => !selected.has(u.id));

    const handleSave = async () => {
        setSaving(true);
        try {
            const units = [...selected.entries()].map(([unitId, v]) => ({
                unitId,
                containsQty: v.containsQty && v.containsQty > 0 ? v.containsQty : undefined,
                qtyIsFixed: v.qtyIsFixed,
            }));
            const res = await apiService.catalog.updateConfig(catalogId, { units });
            onSaved(res.config?.units ?? units);
            toast.success('واحدهای کاتالوگ ذخیره شد');
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
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 flex-shrink-0">عمده</span>
    ) : scope === 'retail' ? (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 flex-shrink-0">خرده</span>
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
                            <h3 className="text-sm font-extrabold text-on-surface">واحدهای اختصاصی کاتالوگ</h3>
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

                {/* جستجو */}
                <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-outline-variant/15 space-y-2.5">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                               placeholder="جستجو و افزودن واحد…"
                               className="w-full h-10 pr-9 rounded-xl bg-surface-container-lowest border border-outline-variant/40
                                   text-sm outline-none focus:border-amber-500 transition-colors" />
                    </div>
                    {/* ✅ فیلتر دسته — عمده/خرده */}
                    <div className="grid grid-cols-3 gap-1.5">
                        {([
                            { key: 'all' as const, label: 'همه', icon: null, count: counts.all },
                            { key: 'wholesale' as const, label: 'عمده‌فروشی', icon: Boxes, count: counts.wholesale },
                            { key: 'retail' as const, label: 'خرده‌فروشی', icon: Store, count: counts.retail },
                        ]).map((t) => {
                            const active = scopeFilter === t.key;
                            return (
                                <button key={t.key} type="button" onClick={() => setScopeFilter(t.key)}
                                        aria-pressed={active}
                                        className={cn('h-8 rounded-lg text-[11px] font-bold border flex items-center justify-center gap-1 transition-colors',
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

                    {/* ✅ بخش انتخاب‌شده‌ها — بالای لیست، با امکان حذف و تنظیم تعداد */}
                    {selected.size > 0 && (
                        <div className="mb-4">
                            <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 mb-2">
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                واحدهای کاتالوگ تو
                            </p>
                            <div className="space-y-1.5">
                                {[...selected.entries()].map(([unitId, conf]) => {
                                    const u = allUnits.find((x: any) => x.id === unitId) as any;
                                    const title = u?.title || unitId;
                                    // ✅ تعداد برای هر واحد عمده قابل تنظیم است — حتی اگر در دیتابیس تعداد نداشته باشد
                                    const isPackaging = conf.containsQty != null || u?.scope === 'wholesale';
                                    return (
                                        <div key={unitId}
                                             className="rounded-xl border border-amber-500/40 bg-amber-50/50 dark:bg-amber-900/10 p-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <Package className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                                <span className="text-sm font-bold text-on-surface flex-1 truncate">{title}</span>
                                                {scopeBadge(u?.scope)}
                                                <button type="button" onClick={() => toggleUnit(unitId)}
                                                        aria-label={`حذف ${title} از کاتالوگ`}
                                                        className="w-6 h-6 rounded-full text-error hover:bg-error/10 grid place-items-center flex-shrink-0 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            {isPackaging && (
                                                <div className="flex items-center gap-2.5 mt-2">
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <span className="text-[10px] text-on-surface-variant/70 whitespace-nowrap">تعداد داخلش:</span>
                                                        <NumberInput value={conf.containsQty ?? undefined}
                                                                     onChange={(v) => updateQty(unitId, v ?? null)}
                                                                     className="h-8 flex-1" />
                                                    </div>
                                                    <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                                                        <input type="checkbox" checked={!!conf.qtyIsFixed}
                                                               onChange={() => toggleFixed(unitId)}
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
                            <div className="h-px bg-outline-variant/20 my-3" />
                            <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 mb-2">
                                <Plus className="w-3.5 h-3.5 text-primary" />
                                افزودن از همهٔ واحدها:
                            </p>
                        </div>
                    )}

                    {/* ✅ دکمهٔ ثبت واحد جدید */}
                    {!showCreate ? (
                        <button type="button" onClick={() => setShowCreate(true)}
                                className="w-full mb-2.5 h-10 rounded-xl border border-dashed border-amber-500/60 text-amber-600 dark:text-amber-400
                                    text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-50/60 dark:hover:bg-amber-900/10 transition-colors">
                            <Plus className="w-4 h-4" />
                            ثبت واحد جدید
                        </button>
                    ) : (
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
                            {/* ✅ تکلیف صریح: عمده یا خرده */}
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { key: 'wholesale' as const, label: 'عمده‌فروشی', icon: Boxes },
                                    { key: 'retail' as const, label: 'خرده‌فروشی', icon: Store },
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
                            {/* ✅ تعداد برای واحدهای عمده — مثل ۲۴ عدد در هر کارتن */}
                            {newScope === 'wholesale' && (
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

                    {/* لیست افزودن — انتخاب‌شده‌ها فیلتر شده‌اند که دوباره نیایند */}
                    {isLoading ? (
                        <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-amber-500 mx-auto" /></div>
                    ) : addList.length === 0 ? (
                        <p className="text-center py-4 text-xs text-on-surface-variant/60">
                            {scopeFilter === 'all' ? 'همهٔ واحدها انتخاب شده‌اند ✓' : 'واحدی در این دسته نمانده — «ثبت واحد جدید» بزن'}
                        </p>
                    ) : (
                        <div className="space-y-1.5">
                            {addList.map((u: any) => (
                                <button key={u.id} type="button" onClick={() => toggleUnit(u.id)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                            border border-outline-variant/40 text-right
                                            hover:border-amber-500/50 hover:bg-amber-50/40 dark:hover:bg-amber-900/10
                                            transition-colors">
                                    <div className="w-5 h-5 rounded-full border-2 border-outline-variant/40 flex items-center justify-center flex-shrink-0">
                                        <Plus className="w-3 h-3 text-on-surface-variant/60" />
                                    </div>
                                    <span className="text-sm font-medium text-on-surface flex-1">{u.title}</span>
                                    {/* ✅ بج دسته — عمده/خرده */}
                                    {scopeBadge(u?.scope)}
                                    {/* ✅ بج تعداد — از دیتابیس */}
                                    {u.containsQty != null && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 flex-shrink-0">
                                            {u.containsQty.toLocaleString('fa-IR')} عددی{u.qtyIsFixed ? ' • ثابت' : ''}
                                        </span>
                                    )}
                                </button>
                            ))}
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
