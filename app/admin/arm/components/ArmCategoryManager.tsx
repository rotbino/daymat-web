// app/admin/arm/components/CategorySection/ArmCategoryManager.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
    Search, ChevronLeft, Plus, Trash2, Package, Layers, X,
    FolderPlus, Check, GripVertical, Edit3, Settings, FolderOpen,
    Folder, AlertTriangle, Sparkles, TreePine, ShoppingCart,
    Code2, Eye, EyeOff, Star, Box, Copy, Info, Hash, Zap,
    Ruler,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUnits } from '@/lib/api/apiHooks';
import { DropSelector } from '@/components/common/DropSelector';

// ═══════════════════════════════════════════
const MIN_SEARCH = 2;
const DEBOUNCE = 250;

// ═══════════════════════════════════════════
// انواع داده
// ═══════════════════════════════════════════
interface AltUnit {
    unitId: string;
    unitTitle: string;
    unitShortCode?: string;
    isVariableQty?: boolean;
    qty?: number | null;
    minQuantity?: number | null;
    isActive?: boolean;
    displayPriority?: number;
}

interface TreeNode {
    id: string;
    title: string;
    categoryId?: string | null;
    children?: TreeNode[];
    isLeaf?: boolean;
    isManualGroup?: boolean;
    customCode?: string;
    description?: string;
    isActive?: boolean;            // ✅ فعال/غیرفعال — غیرفعال در سایت نمایش داده نمی‌شه
    baseUnitId?: string | null;
    baseUnitTitle?: string | null;
    baseUnitShortCode?: string | null;
    overrideUnitId?: string | null;
    overrideUnitTitle?: string | null;
    overrideUnitShortCode?: string | null;
    overrideUnitQty?: number | null;
    overrideUnitIsVariableQty?: boolean;
    alternativeUnits?: AltUnit[];
    minQuantityOverride?: number | null;
    maxQuantityOverride?: number | null;
    [key: string]: any;
}

interface DeleteData { nodeId: string; title: string; descCount: number; }

// ═══════════════════════════════════════════
// توابع کمکی
// ═══════════════════════════════════════════
function toFa(n: number): string { return new Intl.NumberFormat('fa-IR').format(n); }

function normalizeFa(s: string): string {
    return (s||'').replace(/[\u200c\u200f\u200e]/g,'').replace(/ي/g,'ی').replace(/ك/g,'ک')
        .replace(/[أإآ]/g,'ا').replace(/ؤ/g,'و').replace(/ئ/g,'ی').replace(/[ةۀ]/g,'ه')
        .replace(/\s+/g,' ').trim().toLowerCase();
}

function useDebounced<T>(value: T, delay: number): T {
    const [d, setD] = useState(value);
    useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
    return d;
}

function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
    return nodes.filter(n => n.id !== id).map(n => ({ ...n, children: n.children ? removeNode(n.children, id) : undefined }));
}
function addNode(nodes: TreeNode[], parentId: string | null, node: TreeNode): TreeNode[] {
    if (!parentId) return [...nodes, node];
    return nodes.map(n => n.id === parentId ? { ...n, children: [...(n.children||[]), node] }
        : { ...n, children: n.children ? addNode(n.children, parentId, node) : n.children });
}
function updateNode(nodes: TreeNode[], id: string, patch: Partial<TreeNode>): TreeNode[] {
    return nodes.map(n => n.id === id ? { ...n, ...patch }
        : { ...n, children: n.children ? updateNode(n.children, id, patch) : n.children });
}
function findNode(nodes: TreeNode[], id: string): TreeNode | null {
    for (const n of nodes) { if (n.id === id) return n; if (n.children) { const f = findNode(n.children, id); if (f) return f; } }
    return null;
}
function descIds(node: TreeNode): string[] {
    const ids: string[] = [];
    const c = (n: TreeNode) => { if (n.children) for (const ch of n.children) { ids.push(ch.id); c(ch); } };
    c(node); return ids;
}
function inSubtree(nodes: TreeNode[], ancId: string, candId: string): boolean {
    const a = findNode(nodes, ancId); if (!a?.children) return false;
    return !!findNode(a.children, candId);
}
function insertAt(nodes: TreeNode[], targetId: string, dragged: TreeNode, pos: 'before'|'after'|'inside'): TreeNode[] {
    const res: TreeNode[] = [];
    for (const n of nodes) {
        if (n.id === targetId) {
            if (pos === 'before') { res.push(dragged); res.push(n); }
            else if (pos === 'after') { res.push(n); res.push(dragged); }
            else res.push({ ...n, children: [...(n.children||[]), dragged] });
        } else res.push({ ...n, children: n.children ? insertAt(n.children, targetId, dragged, pos) : n.children });
    }
    return res;
}
function filterTree(nodes: TreeNode[], term: string): TreeNode[] {
    const nt = normalizeFa(term); if (!nt) return nodes;
    const f = (n: TreeNode): TreeNode | null => {
        const self = normalizeFa(n.title).includes(nt) || (n.customCode ? normalizeFa(n.customCode).includes(nt) : false);
        const fc = (n.children||[]).map(f).filter((x): x is TreeNode => x !== null);
        if (self) return { ...n };
        if (fc.length) return { ...n, children: fc };
        return null;
    };
    return nodes.map(f).filter((x): x is TreeNode => x !== null);
}
function countTree(nodes: TreeNode[]) {
    let total=0, leaves=0, folders=0, maxD=0, disabled=0;
    const c = (items: TreeNode[], d: number) => {
        for (const n of items) { total++; if (d>maxD) maxD=d; if (n.isActive===false) disabled++; if (n.isLeaf) leaves++; else { folders++; if (n.children) c(n.children, d+1); } }
    };
    c(nodes, 0); return { total, leaves, folders, maxD, disabled };
}
function genCode(tree: TreeNode[], parentId: string | null): string {
    if (!parentId) {
        const codes = tree.map(n => n.customCode).filter(Boolean).map(c => parseInt(c)).filter(n => !isNaN(n));
        return String((codes.reduce((m,n) => Math.max(m,n), 0))+1).padStart(2, '0');
    }
    const p = findNode(tree, parentId);
    if (!p?.customCode) return genCode(tree, null);
    const used = new Set((p.children||[]).map(s => s.customCode).filter(Boolean)
        .filter(c => c.startsWith(p.customCode!)).map(c => c.substring(p.customCode!.length)).filter(c => c.length > 0));
    let s = 1; while (used.has(String(s))) s++;
    return `${p.customCode}${s}`;
}
function ensureCodes(nodes: TreeNode[], parentCode?: string): TreeNode[] {
    return nodes.map((n, i) => {
        const code = n.customCode || (parentCode ? `${parentCode}${i+1}` : String(i+1).padStart(2,'0'));
        return { ...n, customCode: code, id: n.id || `cat_${Date.now()}_${i}_${Math.random().toString(36).slice(2,6)}`,
            children: n.children ? ensureCodes(n.children, code) : undefined };
    });
}

// ✅ فعال/غیرفعال کردن نود + تمام زیرمجموعه‌ها
function setSubtreeActive(node: TreeNode, active: boolean): TreeNode {
    return {
        ...node,
        isActive: active,
        children: node.children ? node.children.map(c => setSubtreeActive(c, active)) : undefined,
    };
}
function toggleActiveInTree(nodes: TreeNode[], nodeId: string): TreeNode[] {
    return nodes.map(n => {
        if (n.id === nodeId) {
            const newActive = n.isActive !== false ? false : true;
            return setSubtreeActive(n, newActive);
        }
        if (n.children) return { ...n, children: toggleActiveInTree(n.children, nodeId) };
        return n;
    });
}

// ═══════════════════════════════════════════
// کامپوننت‌های UI پایه
// ═══════════════════════════════════════════
function ModalShell({ open, onClose, title, subtitle, icon, children, footer, maxWidth='max-w-lg' }: any) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
            <div className={cn('relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-100 dark:border-gray-700 flex flex-col max-h-[88vh]', maxWidth)}>
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b-2 border-gray-100 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">{icon}
                        <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100 truncate">{title}</h3>
                            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{subtitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
                {footer && <div className="px-4 sm:px-5 py-4 border-t-2 border-gray-100 dark:border-gray-700 flex-shrink-0">{footer}</div>}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: any) {
    const c: any = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500',
    };
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-3 flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', c[color]||c.indigo)}>{icon}</div>
            <div><div className="text-lg font-bold text-gray-800 dark:text-gray-100">{value}</div><div className="text-[11px] text-gray-500">{label}</div></div>
        </div>
    );
}

// ═══════════════════════════════════════════
// ✅ مودال تنظیمات واحد — با DropSelector (سرچ‌دار)
// ═══════════════════════════════════════════
function UnitSettingsModal({ open, onClose, node, units, onSave }: {
    open: boolean; onClose: () => void; node: TreeNode | null; units: any[];
    onSave: (id: string, settings: Partial<TreeNode>) => void;
}) {
    const [baseUnitId, setBaseUnitId] = useState('');
    const [overrideUnitId, setOverrideUnitId] = useState('');
    const [overrideQty, setOverrideQty] = useState<number | ''>('');
    const [overrideVariable, setOverrideVariable] = useState(false);
    const [altUnits, setAltUnits] = useState<AltUnit[]>([]);
    const [minQty, setMinQty] = useState<number | null>(null);
    const [maxQty, setMaxQty] = useState<number | null>(null);

    useEffect(() => {
        if (open && node) {
            setBaseUnitId(node.baseUnitId || '');
            setOverrideUnitId(node.overrideUnitId || '');
            setOverrideQty(node.overrideUnitQty ?? '');
            setOverrideVariable(node.overrideUnitIsVariableQty || false);
            setAltUnits(node.alternativeUnits ? [...node.alternativeUnits] : []);
            setMinQty(node.minQuantityOverride ?? null);
            setMaxQty(node.maxQuantityOverride ?? null);
        }
    }, [open, node]);

    // ✅ گزینه‌های DropSelector
    const unitOptions = useMemo(() =>
            units.map((u: any) => ({ value: u.id, label: u.title, extra: u })),
        [units]
    );

    const availableAltOptions = useMemo(() =>
            units
                .filter(u => u.id !== baseUnitId && u.id !== overrideUnitId && !altUnits.some(a => a.unitId === u.id))
                .map((u: any) => ({ value: u.id, label: u.title, extra: u })),
        [units, baseUnitId, overrideUnitId, altUnits]
    );

    if (!node) return null;

    const baseUnit = units.find(u => u.id === baseUnitId);
    const overrideUnit = units.find(u => u.id === overrideUnitId);
    const baseTitle = baseUnit?.title || 'واحد';
    const overrideTitle = overrideUnit?.title || 'واحد فروش';

    const addAlt = (unitId: string) => {
        const u = units.find(x => x.id === unitId);
        if (!u) return;
        setAltUnits(prev => [...prev, {
            unitId: u.id, unitTitle: u.title, unitShortCode: u.shortCode,
            isVariableQty: false, qty: null, isActive: true, displayPriority: prev.length,
        }]);
    };

    const updateAlt = (idx: number, patch: Partial<AltUnit>) => {
        setAltUnits(prev => prev.map((a, i) => i === idx ? { ...a, ...patch } : a));
    };

    const removeAlt = (idx: number) => setAltUnits(prev => prev.filter((_, i) => i !== idx));

    const handleSave = () => {
        const u = units.find(x => x.id === overrideUnitId);
        const bu = units.find(x => x.id === baseUnitId);
        onSave(node.id, {
            baseUnitId: baseUnitId || null,
            baseUnitTitle: bu?.title || null,
            baseUnitShortCode: bu?.shortCode || null,
            overrideUnitId: overrideUnitId || null,
            overrideUnitTitle: u?.title || null,
            overrideUnitShortCode: u?.shortCode || null,
            overrideUnitQty: overrideQty === '' ? null : Number(overrideQty),
            overrideUnitIsVariableQty: overrideVariable,
            alternativeUnits: altUnits,
            minQuantityOverride: minQty,
            maxQuantityOverride: maxQty,
        });
    };

    const handleReset = () => {
        onSave(node.id, {
            baseUnitId: null, baseUnitTitle: null, baseUnitShortCode: null,
            overrideUnitId: null, overrideUnitTitle: null, overrideUnitShortCode: null,
            overrideUnitQty: null, overrideUnitIsVariableQty: false,
            alternativeUnits: [], minQuantityOverride: null, maxQuantityOverride: null,
        });
    };

    return (
        <ModalShell
            open={open} onClose={onClose}
            title={`تنظیمات واحد — ${node.title}`}
            subtitle={node.customCode ? `کد: ${node.customCode}` : undefined}
            maxWidth="max-w-lg"
            icon={<div className="p-2.5 bg-violet-50 dark:bg-violet-900/30 rounded-xl text-violet-600"><Settings className="w-5 h-5" /></div>}
            footer={
                <div className="flex items-center justify-between gap-3">
                    <button onClick={handleReset} className="text-xs text-red-500 font-medium px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">حذف همه تنظیمات</button>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">انصراف</button>
                        <button onClick={handleSave} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-500 hover:bg-violet-600 text-white flex items-center gap-2 transition-colors">
                            <Check className="w-4 h-4" /> ذخیره
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-5">
                {/* ۱. واحد مصرف‌کننده */}
                <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
                        واحد مصرف‌کننده
                    </label>
                    <p className="text-[10px] text-gray-400 mb-2">مشتری قیمت رو با این واحد می‌بینه (مثلاً عدد، بسته)</p>
                    {/* ✅ DropSelector با سرچ */}
                    <DropSelector
                        value={baseUnitId}
                        options={unitOptions}
                        placeholder="— انتخاب واحد مصرف‌کننده —"
                        onChange={(val: string) => setBaseUnitId(val)}
                    />
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700" />

                {/* ۲. واحد پیش‌فرض فروش */}
                <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-emerald-500" />
                        واحد پیش‌فرض فروش
                    </label>
                    <p className="text-[10px] text-gray-400 mb-2">وقتی آگهی ثبت می‌شه، اول این واحد انتخاب می‌شه</p>
                    {/* ✅ DropSelector با سرچ */}
                    <div className="mb-3">
                        <DropSelector
                            value={overrideUnitId}
                            options={unitOptions}
                            placeholder="— انتخاب واحد فروش —"
                            onChange={(val: string) => setOverrideUnitId(val)}
                        />
                    </div>

                    {overrideUnitId && (
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 space-y-3">
                            <div>
                                <label className="text-[11px] text-gray-500 mb-1 block">
                                    تعداد {baseTitle} در هر {overrideTitle}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input type="number" value={overrideQty} onChange={e => setOverrideQty(e.target.value ? Number(e.target.value) : '')}
                                           placeholder="مثلاً ۲۴" dir="ltr"
                                           className="w-24 h-10 px-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm text-center outline-none focus:border-violet-400" />
                                    <span className="text-[11px] text-gray-400">{baseTitle} / {overrideTitle}</span>
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <button onClick={() => setOverrideVariable(!overrideVariable)} type="button"
                                        className={cn('w-9 h-5 rounded-full transition-colors relative', overrideVariable ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600')}>
                                    <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" style={{ transform: overrideVariable ? 'translateX(16px)' : 'translateX(2px)' }} />
                                </button>
                                <span className="text-[11px] text-gray-600 dark:text-gray-300">فروشنده می‌تونه موقع ثبت آگهی تعداد رو تغییر بده</span>
                            </label>
                        </div>
                    )}
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700" />

                {/* ۳. واحدهای فرعی */}
                <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        سایر واحدهای فروش
                    </label>
                    <p className="text-[10px] text-gray-400 mb-3">واحدهای دیگه‌ای که فروشنده می‌تونه انتخاب کنه</p>

                    {altUnits.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-400 bg-gray-50 dark:bg-gray-900/40 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            هنوز واحد فرعی اضافه نشده
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {altUnits.map((au, idx) => (
                                <div key={au.unitId} className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 min-w-[50px]">{au.unitTitle}</span>
                                    <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                                        <input type="number" value={au.qty ?? ''} placeholder="تعداد"
                                               onChange={e => updateAlt(idx, { qty: e.target.value ? Number(e.target.value) : null })}
                                               dir="ltr" className="w-20 h-9 px-2 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-xs text-center outline-none focus:border-violet-400" />
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{baseTitle}/{au.unitTitle}</span>
                                    </div>
                                    <button onClick={() => updateAlt(idx, { isVariableQty: !au.isVariableQty })} type="button"
                                            className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors', au.isVariableQty ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400')}
                                            title="فروشنده می‌تونه تعداد رو تغییر بده">
                                        <Zap className="w-3 h-3" /> متغیر
                                    </button>
                                    <button onClick={() => removeAlt(idx)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ✅ DropSelector برای افزودن واحد فرعی */}
                    {availableAltOptions.length > 0 && (
                        <div className="mt-2">
                            <DropSelector
                                value=""
                                options={availableAltOptions}
                                placeholder="➕ افزودن واحد فرعی..."
                                onChange={(val: string) => { if (val) addAlt(val); }}
                            />
                        </div>
                    )}
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700" />

                {/* ۴. حداقل/حداکثر */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-1 block">حداقل فروش</label>
                        <select value={minQty ?? ''} onChange={e => setMinQty(e.target.value ? Number(e.target.value) : null)}
                                className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-violet-400">
                            <option value="">بدون محدودیت</option>
                            {[1, 10, 100, 1000, 10000].map(v => <option key={v} value={v}>{toFa(v)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-1 block">حداکثر فروش</label>
                        <select value={maxQty ?? ''} onChange={e => setMaxQty(e.target.value ? Number(e.target.value) : null)}
                                className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-violet-400">
                            <option value="">بدون محدودیت</option>
                            {[1, 10, 100, 1000, 10000].map(v => <option key={v} value={v}>{toFa(v)}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/15 text-[10px] text-blue-600 dark:text-blue-400">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>مثال: برای پفک — واحد مصرف‌کننده = بسته، واحد پیش‌فرض = کارتن، تعداد = ۲۴ (یعنی هر کارتن ۲۴ بسته داره). اگه «متغیر» رو روشن کنی، فروشنده موقع ثبت آگهی می‌تونه ۲۴ رو به ۳۰ تغییر بده.</span>
                </div>
            </div>
        </ModalShell>
    );
}

// ═══════════════════════════════════════════
// مودال ساخت/ویرایش نود
// ═══════════════════════════════════════════
function NodeFormModal({ open, onClose, onConfirm, mode, node, parentTitle }: any) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLeaf, setIsLeaf] = useState(true);

    useEffect(() => {
        if (!open) return;
        if (mode === 'edit' && node) { setTitle(node.title); setDescription(node.description || ''); setIsLeaf(node.isLeaf); }
        else { setTitle(''); setDescription(''); setIsLeaf(true); }
    }, [open, mode, node]);

    if (!open) return null;

    return (
        <ModalShell open={open} onClose={onClose}
                    title={mode === 'edit' ? 'ویرایش دسته' : parentTitle ? `افزودن به «${parentTitle}»` : 'دسته جدید'}
                    icon={<div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">{mode === 'edit' ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}</div>}
                    footer={
                        <div className="flex justify-end gap-2">
                            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">انصراف</button>
                            <button onClick={() => { const t = title.trim(); if (!t) { toast.error('عنوان الزامی است'); return; } onConfirm({ title: t, description: description.trim() || undefined, isLeaf }); }}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"><Check className="w-4 h-4" /> {mode === 'edit' ? 'ذخیره' : 'افزودن'}</button>
                        </div>
                    }
        >
            <div className="space-y-4">
                {mode === 'create' && (
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setIsLeaf(true)} className={cn('flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all', isLeaf ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/25 text-blue-600' : 'border-gray-200 text-gray-500')}>
                            <Package className="w-4 h-4" /> دسته (برگ)
                        </button>
                        <button onClick={() => setIsLeaf(false)} className={cn('flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all', !isLeaf ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/25 text-amber-600' : 'border-gray-200 text-gray-500')}>
                            <Layers className="w-4 h-4" /> گروه
                        </button>
                    </div>
                )}
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">عنوان *</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="مثلاً: شیر تازه" autoFocus
                           className="w-full h-11 px-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">توضیح</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="اختیاری"
                              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-blue-400 resize-none" />
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/15 text-[10px] text-blue-600 dark:text-blue-400">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>کد دسته‌بندی خودکار ساخته می‌شه — نیازی نیست وارد کنی.</span>
                </div>
            </div>
        </ModalShell>
    );
}

// ═══════════════════════════════════════════
// مودال تأیید حذف
// ═══════════════════════════════════════════
function DeleteModal({ data, onClose, onConfirm }: any) {
    if (!data) return null;
    return (
        <ModalShell open={!!data} onClose={onClose} title="حذف دسته" maxWidth="max-w-md"
                    icon={<div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-500"><Trash2 className="w-5 h-5" /></div>}
                    footer={<div className="flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">انصراف</button>
                        <button onClick={onConfirm} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"><Trash2 className="w-4 h-4" /> حذف</button>
                    </div>}>
            <div className="text-center py-2">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center"><AlertTriangle className="w-7 h-7 text-red-500" /></div>
                <p className="text-sm text-gray-600 dark:text-gray-300">حذف <span className="font-bold">«{data.title}»</span>؟</p>
                {data.descCount > 0 && <div className="mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 text-xs flex items-center gap-2 justify-center"><AlertTriangle className="w-3.5 h-3.5" /> {toFa(data.descCount)} زیرمجموعه هم حذف می‌شن</div>}
            </div>
        </ModalShell>
    );
}

// ═══════════════════════════════════════════
// ✅ پنل JSON — نمونه اصلاح‌شده + isActive
// ═══════════════════════════════════════════
function JsonPanel({ tree, units, onApply }: { tree: TreeNode[]; units: any[]; onApply: (t: TreeNode[]) => void; }) {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState('');

    useEffect(() => { setJsonText(JSON.stringify(tree, null, 2)); setError(null); }, [tree]);

    const sample = useMemo(() => {
        const findU = (title: string) => units.find(u => normalizeFa(u.title) === normalizeFa(title));
        const uPiece = findU('عدد') || units[0];
        const uPack = findU('بسته') || units[1] || uPiece;
        const uCarton = findU('کارتن') || units[2] || uPack;
        const uBox = findU('جعبه') || units[3] || uCarton;

        const mkUnit = (u: any) => ({
            unitId: u?.id || 'شناسه_واحد', unitTitle: u?.title || 'عنوان واحد',
            unitShortCode: u?.shortCode || undefined,
        });

        return JSON.stringify([
            {
                id: "cat_1", title: "لبنیات", isLeaf: false, customCode: "01", isActive: true,
                children: [
                    {
                        id: "cat_1_1", title: "شیر تازه", isLeaf: true, customCode: "011", isActive: true,
                        baseUnitId: uPiece?.id, baseUnitTitle: uPiece?.title,
                        overrideUnitId: uBox?.id, overrideUnitTitle: uBox?.title,
                        overrideUnitQty: 12, overrideUnitIsVariableQty: true,
                        alternativeUnits: [
                            { ...mkUnit(uCarton), qty: 24, isVariableQty: false }
                        ]
                    },
                    {
                        id: "cat_1_2", title: "پنیر سفید", isLeaf: true, customCode: "012", isActive: true,
                        baseUnitId: uPack?.id, baseUnitTitle: uPack?.title,
                        overrideUnitId: uCarton?.id, overrideUnitTitle: uCarton?.title,
                        overrideUnitQty: 24, overrideUnitIsVariableQty: true,
                        alternativeUnits: [
                            { ...mkUnit(uBox), qty: 12, isVariableQty: true }
                        ]
                    }
                ]
            },
            {
                id: "cat_2", title: "تنقلات", isLeaf: false, customCode: "02", isActive: true,
                children: [
                    {
                        // ✅ این دسته ساخته می‌شه ولی فعلاً غیرفعاله — بعداً فعال می‌شه
                        id: "cat_2_1", title: "پفک", isLeaf: true, customCode: "021", isActive: false,
                        baseUnitId: uPack?.id, baseUnitTitle: uPack?.title,
                        overrideUnitId: uCarton?.id, overrideUnitTitle: uCarton?.title,
                        overrideUnitQty: 24, overrideUnitIsVariableQty: true,
                        alternativeUnits: []
                    }
                ]
            }
        ], null, 2);
    }, [units]);

    const unitsList = useMemo(() => units.map((u: any) => `- عنوان: ${u.title} | شناسه: ${u.id}${u.shortCode ? ` | کد: ${u.shortCode}` : ''}`).join('\n'), [units]);

    const aiPrompt = useMemo(() => {
        return `این ساختار درخت دسته‌بندی بازار من است. لطفاً برای یک سوپرمارکت درخت کامل بساز.

قوانین:
- id: یکتا با پیشوند cat_ (مثل cat_1، cat_1_1)
- title: عنوان فارسی
- isLeaf: false برای گروه‌ها، true برای دسته‌های پایانی
- customCode: خالی بذار یا طبق الگوی 01 → 011 → 0111 بساز
- isActive: true یا false (اگه false باشه، در سایت نمایش داده نمی‌شه — برای دسته‌هایی که می‌خوای بعداً فعال کنی)
- baseUnitId: واحد مصرف‌کننده (از لیست زیر)
- overrideUnitId: واحد پیش‌فرض فروش (از لیست زیر)
- overrideUnitQty: تعداد واحد مصرف‌کننده در هر واحد فروش
- overrideUnitIsVariableQty: true اگه فروشنده بتونه موقع ثبت آگهی تعداد رو تغییر بده
- alternativeUnits: سایر واحدهای فروش

واحدهای موجود:
 ${unitsList}

مثال برای «پفک»:
- baseUnitId = (شناسه واحد «بسته»)
- overrideUnitId = (شناسه واحد «کارتن»)
- overrideUnitQty = 24 (هر کارتن 24 بسته)
- overrideUnitIsVariableQty = true (فروشنده می‌تونه 24 رو به 30 تغییر بده)

لطفاً فقط جیسون بده، بدون توضیح اضافه.`;
    }, [unitsList]);

    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(label); toast.success(`${label} کپی شد`); setTimeout(() => setCopied(''), 2000);
        }).catch(() => toast.error('خطا در کپی'));
    };

    const handleApply = () => {
        try {
            const parsed = JSON.parse(jsonText);
            if (!Array.isArray(parsed)) { setError('باید یه لیست (آرایه) باشد'); return; }
            onApply(ensureCodes(parsed));
            toast.success('✅ جیسون اعمال شد — درخت آپدیت شد');
            setError(null);
        } catch (e: any) { setError(e.message || 'جیسون نامعتبر'); }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b-2 border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Code2 className="w-4 h-4 text-blue-500" /><span className="text-sm font-bold text-gray-700 dark:text-gray-300">ویرایش جیسون</span></div>
                    <button onClick={handleApply} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors">
                        <Check className="w-3.5 h-3.5" /> اعمال
                    </button>
                </div>
                <textarea value={jsonText} onChange={e => { setJsonText(e.target.value); setError(null); }} dir="ltr" spellCheck={false}
                          className="w-full h-72 p-4 font-mono text-xs bg-gray-50 dark:bg-gray-900 border-0 outline-none resize-y leading-relaxed" />
                {error && <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs flex items-center gap-2 border-t-2 border-red-100 dark:border-red-900/30"><AlertTriangle className="w-3.5 h-3.5" /> {error}</div>}
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-purple-100 dark:border-purple-800/30 p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500 rounded-xl text-white"><Sparkles className="w-4 h-4" /></div>
                    <div>
                        <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300">ساخت سریع با هوش مصنوعی</h3>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400">۳ مرحله ساده — زیر ۲ دقیقه</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-100 dark:border-purple-800/30 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-purple-50 dark:border-purple-900/20">
                        <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">۱. نمونه جیسون</span>
                        <button onClick={() => copy(sample, 'نمونه')} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg">{copied === 'نمونه' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} کپی</button>
                    </div>
                    <pre dir="ltr" className="p-3 text-[10px] font-mono overflow-x-auto max-h-32 text-gray-600 dark:text-gray-400">{sample}</pre>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-100 dark:border-purple-800/30 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-purple-50 dark:border-purple-900/20">
                        <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">۲. لیست واحدها با شناسه</span>
                        <button onClick={() => copy(unitsList, 'لیست واحدها')} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg">{copied === 'لیست واحدها' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} کپی</button>
                    </div>
                    <div className="p-3 space-y-0.5 max-h-32 overflow-y-auto">
                        {units.map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-700 dark:text-gray-300">{u.title}</span>
                                <code className="font-mono text-gray-400 text-[10px]">{u.id}</code>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-100 dark:border-purple-800/30 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-purple-50 dark:border-purple-900/20">
                        <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">۳. پیام آماده برای هوش مصنوعی</span>
                        <button onClick={() => copy(aiPrompt, 'پیام')} className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg">{copied === 'پیام' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} کپی</button>
                    </div>
                    <pre dir="ltr" className="p-3 text-[10px] font-mono overflow-x-auto max-h-40 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{aiPrompt}</pre>
                </div>

                <div className="text-[11px] text-purple-700 dark:text-purple-400 space-y-1 leading-relaxed">
                    <p><strong>چطور کار می‌کنه:</strong></p>
                    <p>۱. هر سه مورد بالا رو کپی کن</p>
                    <p>۲. به ChatGPT یا Claude یا Gemini بده و بگو «برای [نوع بازارت] درخت بساز»</p>
                    <p>۳. جیسونی که هوش مصنوعی میده رو تو باکس بالا پیست کن</p>
                    <p>۴. دکمه «اعمال» رو بزن — ✅ درخت آماده‌ست!</p>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// کامپوننت اصلی
// ═══════════════════════════════════════════
interface Props { onSave?: () => void; isAdmin?: boolean; }

export function ArmCategoryManager({ onSave, isAdmin = false }: Props) {
    const { setValue } = useFormContext();
    const { data: allUnits = [] } = useUnits();
    const formTree = useWatch({ name: 'categoryTree' }) || [];
    const perm = useWatch({ name: 'config.armAdminPermission' }) || {};
    const catAccess = perm.categories || {};
    const canAdd = isAdmin || catAccess.canAdd !== false;
    const canRemove = isAdmin || catAccess.canRemove !== false;
    const canEdit = isAdmin || catAccess.canEdit !== false || canAdd;

    const [tab, setTab] = useState<'visual' | 'json'>('visual');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string | null>(null);
    const [dragMode, setDragMode] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropId, setDropId] = useState<string | null>(null);
    const [dropPos, setDropPos] = useState<'before'|'after'|'inside'|null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState<'create'|'edit'>('create');
    const [editNode, setEditNode] = useState<TreeNode | null>(null);
    const [createParentId, setCreateParentId] = useState<string | null>(null);
    const [createParentTitle, setCreateParentTitle] = useState<string | undefined>(undefined);
    const [showUnits, setShowUnits] = useState(false);
    const [unitNodeId, setUnitNodeId] = useState<string | null>(null);
    const [delData, setDelData] = useState<DeleteData | null>(null);

    const tree = useMemo(() => (Array.isArray(formTree) ? formTree : []), [formTree]);
    const debSearch = useDebounced(search, DEBOUNCE);
    const isSearch = normalizeFa(debSearch.trim()).length >= MIN_SEARCH;
    const searchRaw = normalizeFa(search.trim()).length;
    const filtered = useMemo(() => isSearch ? filterTree(tree, debSearch) : tree, [tree, debSearch, isSearch]);
    const stats = useMemo(() => countTree(tree), [tree]);

    useEffect(() => {
        if (!isSearch) return;
        setExpanded(prev => { const n = new Set(prev);
            const c = (ns: TreeNode[]) => { for (const nd of ns) { n.add(nd.id); if (nd.children) c(nd.children); } };
            c(filtered); return n; });
    }, [isSearch, filtered]);

    const unitNode = useMemo(() => unitNodeId ? findNode(tree, unitNodeId) : null, [tree, unitNodeId]);
    const delCount = useMemo(() => { if (!delData) return 0; const n = findNode(tree, delData.nodeId); return n ? descIds(n).length : 0; }, [delData, tree]);

    const saveTree = useCallback((t: TreeNode[]) => { setValue('categoryTree', t, { shouldDirty: true }); if (onSave) onSave(); }, [setValue, onSave]);
    const toggle = useCallback((id: string) => setExpanded(p => { const n = new Set(p); n.has(id)?n.delete(id):n.add(id); return n; }), []);
    const expandAll = useCallback(() => { const ids = new Set<string>(); const c = (ns: TreeNode[]) => { for (const n of ns) { if (n.children?.length) { ids.add(n.id); c(n.children); } } }; c(tree); setExpanded(ids); }, [tree]);
    const collapseAll = useCallback(() => setExpanded(new Set()), []);

    const openCreate = useCallback((parentId: string | null, parentTitle?: string) => {
        setFormMode('create'); setEditNode(null); setCreateParentId(parentId); setCreateParentTitle(parentTitle); setShowForm(true);
    }, []);
    const openEdit = useCallback((node: TreeNode) => {
        setFormMode('edit'); setEditNode(node); setCreateParentId(null); setCreateParentTitle(undefined); setShowForm(true);
    }, []);

    const handleForm = useCallback((data: any) => {
        if (formMode === 'edit' && editNode) {
            saveTree(updateNode(tree, editNode.id, { title: data.title, description: data.description }));
            toast.success('بروزرسانی شد');
        } else {
            const node: TreeNode = {
                id: `cat_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
                title: data.title, isLeaf: data.isLeaf, description: data.description,
                customCode: genCode(tree, createParentId), isActive: true,
                children: data.isLeaf ? undefined : [],
            };
            saveTree(addNode(tree, createParentId, node));
            if (createParentId) setExpanded(p => new Set([...p, createParentId]));
            toast.success(data.isLeaf ? 'دسته اضافه شد' : 'گروه اضافه شد');
        }
        setShowForm(false); setEditNode(null);
    }, [formMode, editNode, tree, createParentId, saveTree]);

    const handleDel = useCallback(() => { if (!delData) return; saveTree(removeNode(tree, delData.nodeId)); setDelData(null); toast.success('حذف شد'); }, [delData, tree, saveTree]);
    const handleApplyJson = useCallback((t: TreeNode[]) => { saveTree(t); setTab('visual'); }, [saveTree]);
    const handleSaveUnits = useCallback((id: string, settings: Partial<TreeNode>) => {
        saveTree(updateNode(tree, id, settings)); setShowUnits(false); setUnitNodeId(null); toast.success('تنظیمات واحد ذخیره شد');
    }, [tree, saveTree]);

    // ✅ فعال/غیرفعال کردن نود + تمام زیرمجموعه‌ها
    const handleToggleActive = useCallback((nodeId: string) => {
        const node = findNode(tree, nodeId);
        const isCurrentlyActive = node?.isActive !== false;
        saveTree(toggleActiveInTree(tree, nodeId));
        toast.success(isCurrentlyActive ? 'غیرفعال شد — در سایت نمایش داده نمی‌شه' : 'فعال شد');
    }, [tree, saveTree]);

    const onDragStart = (e: React.DragEvent, id: string) => { if (!dragMode) return; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); setDraggedId(id); };
    const onDragOver = (e: React.DragEvent, id: string) => {
        if (!dragMode || !draggedId || draggedId === id) return;
        e.preventDefault(); e.stopPropagation();
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - r.top; const h = r.height;
        setDropId(id); setDropPos(y < h*0.25 ? 'before' : y > h*0.75 ? 'after' : 'inside');
    };
    const onDrop = (e: React.DragEvent, id: string) => {
        if (!dragMode || !draggedId || draggedId === id || !dropPos) return;
        e.preventDefault(); e.stopPropagation();
        if (dropPos === 'inside' && inSubtree(tree, draggedId, id)) { toast.error('نمی‌شه داخل زیرمجموعه خودش'); reset(); return; }
        const node = findNode(tree, draggedId); if (!node) return;
        let nt = removeNode(tree, draggedId);
        const copy: TreeNode = JSON.parse(JSON.stringify(node));
        if (dropPos === 'inside') { nt = addNode(nt, id, copy); setExpanded(p => new Set([...p, id])); }
        else nt = insertAt(nt, id, copy, dropPos);
        saveTree(nt); reset(); toast.success('جابجا شد');
    };
    const reset = () => { setDraggedId(null); setDropId(null); setDropPos(null); };

    // ─── ✅ Render Node — با آیکون چشم (فعال/غیرفعال) ───
    const renderNode = useCallback((node: TreeNode, depth: number = 0): React.ReactNode => {
        const hasKids = (node.children?.length ?? 0) > 0;
        const isExp = expanded.has(node.id);
        const isDrag = draggedId === node.id;
        const isOver = dropId === node.id;
        const hasUnits = node.overrideUnitId || node.alternativeUnits?.length;
        const isActive = node.isActive !== false;  // ✅ پیش‌فرض: فعال

        return (
            <div key={node.id}>
                <div
                    draggable={dragMode}
                    onDragStart={(e) => onDragStart(e, node.id)}
                    onDragOver={(e) => onDragOver(e, node.id)}
                    onDrop={(e) => onDrop(e, node.id)}
                    onDragEnd={reset}
                    className={cn(
                        'flex items-center gap-1.5 px-2 py-2 rounded-xl border-2 transition-all group/row',
                        !dragMode && 'cursor-pointer',
                        dragMode && 'cursor-grab active:cursor-grabbing',
                        'hover:bg-blue-50/50 dark:hover:bg-blue-900/15',
                        selected === node.id && !dragMode && 'ring-1 ring-blue-300 dark:ring-blue-700',
                        isDrag && 'opacity-40 border-dashed border-blue-400',
                        isOver && dropPos === 'before' && 'border-t-4 border-t-blue-500 border-x-transparent border-b-transparent',
                        isOver && dropPos === 'after' && 'border-b-4 border-b-blue-500 border-x-transparent border-t-transparent',
                        isOver && dropPos === 'inside' && 'border-blue-400 bg-blue-50 dark:bg-blue-900/30',
                        !isDrag && !isOver && 'border-transparent',
                        // ✅ حالت غیرفعال
                        !isActive && 'opacity-50',
                    )}
                    style={{ paddingRight: depth * 18 + 8 }}
                    onClick={() => { if (dragMode) return; setSelected(node.id); if (hasKids) toggle(node.id); }}
                >
                    {dragMode && <div className="flex-shrink-0 p-0.5 text-gray-300 hover:text-blue-500"><GripVertical className="w-4 h-4" /></div>}

                    <div className="w-5 flex-shrink-0">
                        {hasKids ? <button onClick={(e) => { e.stopPropagation(); toggle(node.id); }} className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30">
                            <ChevronLeft className={cn('w-4 h-4 text-gray-400 transition-transform', isExp && '-rotate-90')} />
                        </button> : <div className="w-4" />}
                    </div>

                    <div className={cn('p-1 rounded-lg flex-shrink-0 transition-colors',
                        !isActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' :
                            node.isLeaf ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' :
                                isExp ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-400')}>
                        {node.isLeaf ? <Package className="w-3.5 h-3.5" /> : isExp ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={cn('text-sm font-medium truncate', !isActive ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200')}>{node.title}</span>
                            {node.customCode && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 tabular-nums">{node.customCode}</span>}
                            {/* ✅ بج غیرفعال */}
                            {!isActive && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center gap-0.5"><EyeOff className="w-2.5 h-2.5" /> غیرفعال</span>}
                            {hasUnits && isActive && <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600"><Box className="w-2.5 h-2.5" /> {node.overrideUnitTitle || 'واحد'}{node.overrideUnitQty ? ` ×${toFa(node.overrideUnitQty)}` : ''}</span>}
                            {node.isLeaf && !hasUnits && isActive && <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-400">بدون واحد</span>}
                        </div>
                        {node.description && <div className="text-[10px] text-gray-400 truncate mt-0.5">{node.description}</div>}
                    </div>

                    {/* ✅ آیکون‌های عملیات — همیشه visible */}
                    <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {/* ✅ چشم: فعال/غیرفعال */}
                        <button onClick={() => handleToggleActive(node.id)}
                                className={cn('p-1.5 rounded-lg transition-colors',
                                    isActive ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700')}
                                title={isActive ? 'غیرفعال کردن (در سایت نمایش داده نمی‌شه)' : 'فعال کردن'}>
                            {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        {canAdd && (
                            <button onClick={() => openCreate(node.id, node.title)} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors" title="افزودن زیرمجموعه">
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {node.isLeaf && canEdit && (
                            <button onClick={() => { setUnitNodeId(node.id); setShowUnits(true); }}
                                    className={cn('p-1.5 rounded-lg transition-colors', hasUnits ? 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30')}
                                    title="تنظیمات واحد">
                                <Settings className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {canEdit && (
                            <button onClick={() => openEdit(node)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="ویرایش">
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {canRemove && (
                            <button onClick={() => setDelData({ nodeId: node.id, title: node.title, descCount: 0 })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors" title="حذف">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
                {hasKids && isExp && <div className="mr-2 border-r-2 border-blue-100 dark:border-blue-800/30 rounded-r-lg overflow-hidden">{node.children!.map(c => renderNode(c, depth+1))}</div>}
            </div>
        );
    }, [expanded, selected, dragMode, draggedId, dropId, dropPos, toggle, openCreate, openEdit, handleToggleActive, canAdd, canEdit, canRemove]);

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={<Layers className="w-5 h-5" />} label="کل" value={toFa(stats.total)} color="indigo" />
                <StatCard icon={<Folder className="w-5 h-5" />} label="گروه‌ها" value={toFa(stats.folders)} color="blue" />
                <StatCard icon={<Package className="w-5 h-5" />} label="دسته‌ها" value={toFa(stats.leaves)} color="emerald" />
                <StatCard icon={<TreePine className="w-5 h-5" />} label="عمق" value={`${toFa(stats.maxD+1)} سطح`} color="purple" />
            </div>

            {/* ✅ هشدار دسته‌های غیرفعال */}
            {stats.disabled > 0 && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 text-xs">
                    <EyeOff className="w-3.5 h-3.5 flex-shrink-0" />
                    {toFa(stats.disabled)} دسته غیرفعال است — در سایت نمایش داده نمی‌شن
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                <button onClick={() => setTab('visual')} className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all', tab === 'visual' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500')}>
                    <Eye className="w-4 h-4" /> ویژوال
                </button>
                <button onClick={() => setTab('json')} className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all', tab === 'json' ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm' : 'text-gray-500')}>
                    <Code2 className="w-4 h-4" /> جیسون / هوش مصنوعی
                </button>
            </div>

            {tab === 'visual' ? (
                <>
                    <div>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو در عنوان یا کد..."
                                   className="w-full h-12 pr-11 pl-11 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:border-blue-400 outline-none transition-all" />
                            {search && <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>}
                        </div>
                        {searchRaw > 0 && searchRaw < MIN_SEARCH && <p className="text-[11px] text-gray-400 mt-1.5 text-right">حداقل {toFa(MIN_SEARCH)} حرف...</p>}
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-3 flex flex-wrap items-center gap-3">
                        <button onClick={() => setDragMode(!dragMode)} className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all', dragMode ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-500')}>
                            <GripVertical className="w-4 h-4" /> {dragMode ? 'جابجایی فعال' : 'جابجایی'}
                        </button>
                        <div className="flex-1" />
                        <button onClick={expandAll} className="text-xs text-blue-500 font-medium px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">باز کردن همه</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={collapseAll} className="text-xs text-gray-500 font-medium px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">بستن همه</button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-3 py-3 border-b-2 border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-blue-500" /><span className="text-sm font-bold text-gray-700 dark:text-gray-300">درخت دسته‌بندی</span><span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{toFa(stats.total)}</span></div>
                            {canAdd && <button onClick={() => openCreate(null)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"><Plus className="w-4 h-4" /><span className="hidden sm:inline">دسته جدید</span></button>}
                        </div>
                        <div className="p-2 max-h-[600px] overflow-y-auto">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center py-16 text-center">
                                    <TreePine className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">{isSearch ? 'نتیجه‌ای نیست' : 'درخت خالی است'}</h3>
                                    <p className="text-sm text-gray-400 mb-6">{isSearch ? 'جستجو رو تغییر بده' : 'با ویژوال یا جیسون شروع کن'}</p>
                                    {!isSearch && <div className="flex gap-2">
                                        {canAdd && <button onClick={() => openCreate(null)} className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold">+ دسته جدید</button>}
                                        <button onClick={() => setTab('json')} className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" /> با هوش مصنوعی بساز</button>
                                    </div>}
                                </div>
                            ) : <div className="space-y-0.5">{filtered.map(n => renderNode(n))}</div>}
                        </div>
                    </div>
                </>
            ) : (
                <JsonPanel tree={tree} units={allUnits} onApply={handleApplyJson} />
            )}

            {/* Modals */}
            <NodeFormModal open={showForm} onClose={() => { setShowForm(false); setEditNode(null); }} onConfirm={handleForm}
                           mode={formMode} node={editNode} parentTitle={createParentTitle} />
            <UnitSettingsModal open={showUnits} onClose={() => { setShowUnits(false); setUnitNodeId(null); }} node={unitNode} units={allUnits} onSave={handleSaveUnits} />
            <DeleteModal data={delData ? { ...delData, descCount: delCount } : null} onClose={() => setDelData(null)} onConfirm={handleDel} />
        </div>
    );
}