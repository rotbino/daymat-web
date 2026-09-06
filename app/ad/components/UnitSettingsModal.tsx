// app_/ad/components/UnitSettingsModal.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Check, Loader2, Package, Search, X, Lock, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';
import { NumberInput } from '@/components/common/NumberInput';

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

    const updateQty = (unitId: string, qty: number) => {
        setSelected((prev) => {
            const next = new Map(prev);
            const cur = next.get(unitId);
            if (cur) next.set(unitId, { ...cur, containsQty: qty });
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

    // ✅ لیست: جستجو + انتخاب‌شده‌ها بالا
    const filtered = useMemo(() => {
        const q = search.trim();
        const list = (allUnits as any[]).filter((u) =>
            !q || (u.title || '').includes(q) || (u.shortCode || '').includes(q),
        );
        return [...list].sort((a, b) => Number(selected.has(a.id)) - Number(selected.has(b.id)));
    }, [allUnits, search, selected]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const units = [...selected.entries()].map(([unitId, v]) => ({
                unitId,
                containsQty: v.containsQty ?? undefined,
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
                <div className="flex-shrink-0 px-4 py-3 border-b border-outline-variant/15">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                               placeholder="جستجو و افزودن واحد…"
                               className="w-full h-10 pr-9 rounded-xl bg-surface-container-lowest border border-outline-variant/40
                                   text-sm outline-none focus:border-amber-500 transition-colors" />
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
                                    const isPackaging = conf.containsQty != null; // ✅ فقط تعدادی‌های دیتابیس
                                    return (
                                        <div key={unitId}
                                             className="rounded-xl border border-amber-500/40 bg-amber-50/50 dark:bg-amber-900/10 p-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <Package className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                                <span className="text-sm font-bold text-on-surface flex-1 truncate">{title}</span>
                                                <button type="button" onClick={() => toggleUnit(unitId)}
                                                        aria-label={`حذف ${title} از کاتالوگ`}
                                                        className="w-6 h-6 rounded-full text-error hover:bg-error/10 grid place-items-center flex-shrink-0 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            {/* ✅ تنظیم تعداد — فقط برای واحدهای تعدادیِ دیتابیس */}
                                            {isPackaging && (
                                                <div className="flex items-center gap-2.5 mt-2">
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <span className="text-[10px] text-on-surface-variant/70 whitespace-nowrap">تعداد داخلش:</span>
                                                        <NumberInput value={conf.containsQty ?? undefined}
                                                                     onChange={(v) => updateQty(unitId, v || 0)}
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

                    {/* لیست افزودن — انتخاب‌شده‌ها فیلتر شده‌اند که دوباره نیایند */}
                    {isLoading ? (
                        <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-amber-500 mx-auto" /></div>
                    ) : filtered.filter((u: any) => !selected.has(u.id)).length === 0 ? (
                        <p className="text-center py-4 text-xs text-on-surface-variant/60">همهٔ واحدها انتخاب شده‌اند ✓</p>
                    ) : (
                        <div className="space-y-1.5">
                            {filtered
                                .filter((u: any) => !selected.has(u.id))
                                .map((u: any) => (
                                    <button key={u.id} type="button" onClick={() => toggleUnit(u.id)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                                border border-outline-variant/40 text-right
                                                hover:border-amber-500/50 hover:bg-amber-50/40 dark:hover:bg-amber-900/10
                                                transition-colors">
                                        <div className="w-5 h-5 rounded-full border-2 border-outline-variant/40 flex items-center justify-center flex-shrink-0">
                                            <Plus className="w-3 h-3 text-on-surface-variant/60" />
                                        </div>
                                        <span className="text-sm font-medium text-on-surface flex-1">{u.title}</span>
                                        {/* ✅ بج نوع — از دیتابیس */}
                                        {u.containsQty != null && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
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