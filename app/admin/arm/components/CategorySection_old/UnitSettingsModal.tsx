// app/admin/arm/components/CategorySection/UnitSettingsModal.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronRight, Package, Check, Plus, Settings, Star, Pencil, Ruler, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ModalShell } from './ModalShell';
import { SearchBox } from './SearchBox';
import type { TreeNode } from './types';
import { MIN_SEARCH_CHARS, useDebouncedValue, normalizeFa } from './utils';

export function UnitSettingsModal({ open, onClose, node, units, onSave }: {
    open: boolean;
    onClose: () => void;
    node: TreeNode | null;
    units: any[];
    onSave: (nodeId: string, settings: Partial<TreeNode>) => void;
}) {
    const [modalStep, setModalStep] = useState<1 | 2>(1);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, 200);

    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [selectedUnitTitle, setSelectedUnitTitle] = useState<string>('');
    const [selectedUnitShortCode, setSelectedUnitShortCode] = useState<string>('');
    const [selectedUnitIsVariableQty, setSelectedUnitIsVariableQty] = useState<boolean>(false);
    const [selectedUnitQty, setSelectedUnitQty] = useState<number | ''>('');

    const [baseUnitId, setBaseUnitId] = useState<string>('');
    const [baseUnitTitle, setBaseUnitTitle] = useState<string>('');
    const [baseUnitShortCode, setBaseUnitShortCode] = useState<string>('');

    const [alternativeUnits, setAlternativeUnits] = useState<any[]>([]);
    const [minQuantity, setMinQuantity] = useState<number | null>(null);
    const [maxQuantity, setMaxQuantity] = useState<number | null>(null);

    const [showAllUnitsModal, setShowAllUnitsModal] = useState(false);
    const [unitModalMode, setUnitModalMode] = useState<'primary' | 'base' | 'alternative'>('primary');

    const [showAddAltModal, setShowAddAltModal] = useState(false);
    const [editingAltIndex, setEditingAltIndex] = useState<number | null>(null);
    const [altUnitId, setAltUnitId] = useState('');
    const [altUnitTitle, setAltUnitTitle] = useState('');
    const [altUnitShortCode, setAltUnitShortCode] = useState('');
    const [altUnitIsVariableQty, setAltUnitIsVariableQty] = useState(false);
    const [altUnitQty, setAltUnitQty] = useState<number | ''>('');

    const [categoryUnits, setCategoryUnits] = useState<any[]>([]);

    useEffect(() => {
        if (open && node) {
            setSelectedUnitId(node.overrideUnitId || '');
            setSelectedUnitTitle(node.overrideUnitTitle || '');
            setSelectedUnitShortCode(node.overrideUnitShortCode || '');
            setSelectedUnitIsVariableQty(node.overrideUnitIsVariableQty || false);
            setSelectedUnitQty(node.overrideUnitQty ?? '');
            setBaseUnitId(node.baseUnitId || '');
            setBaseUnitTitle(node.baseUnitTitle || '');
            setBaseUnitShortCode(node.baseUnitShortCode || '');
            setAlternativeUnits(node.alternativeUnits || []);
            setMinQuantity(node.minQuantityOverride ?? null);
            setMaxQuantity(node.maxQuantityOverride ?? null);
            setSearch('');
            setModalStep(1);
        }
    }, [open, node]);

    useEffect(() => {
        if (open && node?.categoryId) {
            import('@/lib/api/apiService').then(({ apiService }) => {
                apiService.admin.categories.getUnits(node.categoryId!)
                    .then(res => setCategoryUnits(res || []))
                    .catch(() => setCategoryUnits([]));
            });
        }
    }, [open, node?.categoryId]);

    const resetAltModal = () => {
        setEditingAltIndex(null);
        setAltUnitId('');
        setAltUnitTitle('');
        setAltUnitShortCode('');
        setAltUnitIsVariableQty(false);
        setAltUnitQty('');
    };

    const searchNorm = normalizeFa(debouncedSearch.trim());
    const isSearching = searchNorm.length >= MIN_SEARCH_CHARS;

    const filteredUnits = useMemo(() => {
        if (!isSearching) return units;
        return units.filter((u: any) =>
            normalizeFa(u.title || '').includes(searchNorm) ||
            normalizeFa(u.shortCode || '').includes(searchNorm),
        );
    }, [units, searchNorm, isSearching]);

    const handleSelectUnit = (unit: any) => {
        if (unitModalMode === 'primary') {
            setSelectedUnitId(unit.id);
            setSelectedUnitTitle(unit.title);
            setSelectedUnitShortCode(unit.shortCode);
            setSelectedUnitIsVariableQty(unit.isVariableQty || false);
            setSelectedUnitQty(unit.isVariableQty ? '' : (unit.conversionFactor || ''));
            setModalStep(2);
        } else if (unitModalMode === 'base') {
            setBaseUnitId(unit.id);
            setBaseUnitTitle(unit.title);
            setBaseUnitShortCode(unit.shortCode);
        } else if (unitModalMode === 'alternative') {
            setAltUnitId(unit.id);
            setAltUnitTitle(unit.title);
            setAltUnitShortCode(unit.shortCode);
            setAltUnitIsVariableQty(unit.isVariableQty || false);
            setAltUnitQty(unit.isVariableQty ? '' : (unit.conversionFactor || ''));
        }
        setShowAllUnitsModal(false);
        setSearch('');
    };

    const handleSave = () => {
        const qty = selectedUnitQty === '' ? null : Number(selectedUnitQty);
        onSave(node!.id, {
            overrideUnitId: selectedUnitId || null,
            overrideUnitTitle: selectedUnitTitle || null,
            overrideUnitShortCode: selectedUnitShortCode || null,
            overrideUnitIsVariableQty: selectedUnitIsVariableQty,
            overrideUnitQty: qty,
            baseUnitId: baseUnitId || null,
            baseUnitTitle: baseUnitTitle || null,
            baseUnitShortCode: baseUnitShortCode || null,
            minQuantityOverride: minQuantity,
            maxQuantityOverride: maxQuantity,
            alternativeUnits: alternativeUnits,
        });
    };

    const handleReset = () => {
        onSave(node!.id, {
            overrideUnitId: null,
            overrideUnitTitle: null,
            overrideUnitShortCode: null,
            overrideUnitIsVariableQty: false,
            overrideUnitQty: null,
            baseUnitId: null,
            baseUnitTitle: null,
            baseUnitShortCode: null,
            minQuantityOverride: null,
            maxQuantityOverride: null,
            alternativeUnits: [],
        });
    };

    const confirmAddAlt = () => {
        if (editingAltIndex !== null) {
            const updated = [...alternativeUnits];
            updated[editingAltIndex] = {
                ...updated[editingAltIndex],
                unitId: altUnitId,
                unitTitle: altUnitTitle,
                unitShortCode: altUnitShortCode,
                isVariableQty: altUnitIsVariableQty,
                qty: altUnitQty === '' ? null : Number(altUnitQty),
            };
            setAlternativeUnits(updated);
        } else {
            if (alternativeUnits.some(au => au.unitId === altUnitId)) {
                toast.info('این واحد قبلاً اضافه شده');
                setShowAddAltModal(false);
                resetAltModal();
                return;
            }
            setAlternativeUnits(prev => [...prev, {
                unitId: altUnitId,
                unitTitle: altUnitTitle,
                unitShortCode: altUnitShortCode,
                minQuantity: null,
                isActive: true,
                displayPriority: prev.length,
                isVariableQty: altUnitIsVariableQty,
                qty: altUnitQty === '' ? null : Number(altUnitQty),
            }]);
        }
        setShowAddAltModal(false);
        resetAltModal();
    };

    if (!node) return null;

    return (
        <>
            <ModalShell
                open={open}
                onClose={onClose}
                title={`تنظیمات واحد — ${node.title}`}
                subtitle="واحد اندازه‌گیری و حداقل سفارش این دسته‌بندی"
                icon={<div className="p-2.5 bg-violet-50 dark:bg-violet-900/30 rounded-xl text-violet-600 dark:text-violet-400"><Settings className="w-5 h-5" /></div>}
                maxWidth="max-w-lg"
                footer={
                    <div className="flex items-center justify-between gap-3">
                        <button
                            onClick={handleReset}
                            className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            حذف تنظیمات
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!selectedUnitId}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-500 hover:bg-violet-600 text-white shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                                ذخیره
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    {/* واحد اصلی */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border-2 border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                            <Ruler className="w-4 h-4 text-blue-500" />
                            واحد اصلی (کوچکترین واحد قابل فروش)
                        </p>
                        {baseUnitTitle ? (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{baseUnitTitle}</span>
                                <button
                                    onClick={() => { setUnitModalMode('base'); setShowAllUnitsModal(true); }}
                                    className="text-xs text-primary hover:underline"
                                >
                                    تغییر
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setUnitModalMode('base'); setShowAllUnitsModal(true); }}
                                className="w-full text-right px-4 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-primary hover:bg-white dark:hover:bg-gray-800"
                            >
                                + انتخاب واحد اصلی
                            </button>
                        )}
                    </div>

                    {/* واحد پیش‌فرض */}
                    <div className="space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">واحد پیش‌فرض (برای ثبت آگهی):</p>

                        {categoryUnits.length > 0 ? (
                            <div className="space-y-1">
                                {categoryUnits.map((unit: any) => {
                                    const isSelected = selectedUnitId === unit.id;
                                    return (
                                        <button
                                            key={unit.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedUnitId(unit.id);
                                                setSelectedUnitTitle(unit.title);
                                                setSelectedUnitShortCode(unit.shortCode);
                                                setModalStep(2);
                                            }}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-colors',
                                                isSelected
                                                    ? 'bg-violet-50 dark:bg-violet-900/25 ring-2 ring-violet-300 dark:ring-violet-700'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50',
                                            )}
                                        >
                                            <div className={cn(
                                                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                                isSelected ? 'border-violet-500' : 'border-gray-300 dark:border-gray-600',
                                            )}>
                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
                                            </div>
                                            <span className="flex-1 text-sm font-medium truncate">{unit.title}</span>
                                            {unit.shortCode && (
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 flex-shrink-0">
                                                    {unit.shortCode}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400">هیچ واحدی برای این گروه تعریف نشده</p>
                        )}

                        <button
                            onClick={() => { setUnitModalMode('primary'); setShowAllUnitsModal(true); }}
                            className="w-full text-right px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl flex items-center justify-between text-sm border border-dashed border-gray-300 dark:border-gray-600"
                        >
                            <span className="font-medium text-primary">جستجو در همه واحدها</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {/* Step 2: تنظیم تعداد */}
                    {modalStep === 2 && selectedUnitId && (
                        <div className="space-y-4 border-t-2 border-gray-100 dark:border-gray-700 pt-4">
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">
                                        تعداد {baseUnitTitle || 'واحد اصلی'} در هر {selectedUnitTitle} (اختیاری)
                                    </label>
                                    <input
                                        type="number"
                                        value={selectedUnitQty}
                                        onChange={(e) => setSelectedUnitQty(e.target.value ? Number(e.target.value) : '')}
                                        placeholder={baseUnitTitle ? `مثلاً 24 (تعداد ${baseUnitTitle} در هر ${selectedUnitTitle})` : 'مثلاً 24'}
                                        className="w-full h-10 px-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="primaryIsVariableQty"
                                        checked={selectedUnitIsVariableQty}
                                        onChange={(e) => setSelectedUnitIsVariableQty(e.target.checked)}
                                        className="w-4 h-4 accent-violet-500"
                                    />
                                    <label htmlFor="primaryIsVariableQty" className="text-xs text-gray-600 dark:text-gray-300">
                                        ضریب متغیر (کاربر می‌تواند تغییر دهد)
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">حداقل فروش</label>
                                    <select
                                        value={minQuantity ?? ''}
                                        onChange={(e) => setMinQuantity(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full h-10 px-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                                    >
                                        <option value="">بدون محدودیت</option>
                                        {[1, 10, 100, 1000, 10000].map(v => (
                                            <option key={v} value={v}>{v.toLocaleString('fa-IR')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">حداکثر فروش</label>
                                    <select
                                        value={maxQuantity ?? ''}
                                        onChange={(e) => setMaxQuantity(e.target.value ? Number(e.target.value) : null)}
                                        className="w-full h-10 px-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                                    >
                                        <option value="">بدون محدودیت</option>
                                        {[1, 10, 100, 1000, 10000].map(v => (
                                            <option key={v} value={v}>{v.toLocaleString('fa-IR')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* واحدهای فرعی */}
                    <div className="space-y-2 border-t-2 border-gray-100 dark:border-gray-700 pt-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">واحدهای فرعی (مثلاً جعبه، کارتن، پالت):</p>
                            <button
                                onClick={() => { resetAltModal(); setShowAddAltModal(true); }}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                افزودن واحد
                            </button>
                        </div>

                        {alternativeUnits.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500">واحدی اضافه نشده</p>
                        ) : (
                            <div className="space-y-1.5">
                                {alternativeUnits.map((au: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg px-2.5 py-2">
                                        <Package className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                        <span className="text-xs text-gray-700 dark:text-gray-200 flex-1">{au.unitTitle}</span>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {au.isVariableQty ? (
                                                <input
                                                    type="number"
                                                    placeholder="—"
                                                    defaultValue={au.qty || ''}
                                                    onBlur={(e) => {
                                                        const updated = [...alternativeUnits];
                                                        updated[idx] = { ...updated[idx], qty: e.target.value === '' ? null : Number(e.target.value) };
                                                        setAlternativeUnits(updated);
                                                    }}
                                                    className="w-14 h-7 px-1.5 border border-gray-200 dark:border-gray-600 rounded text-[10px] text-center"
                                                />
                                            ) : (
                                                <span className="text-[10px] text-gray-400">= {au.qty || '—'}</span>
                                            )}
                                            <label className="flex items-center gap-0.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={au.isVariableQty || false}
                                                    onChange={(e) => {
                                                        const updated = [...alternativeUnits];
                                                        updated[idx] = { ...updated[idx], isVariableQty: e.target.checked };
                                                        setAlternativeUnits(updated);
                                                    }}
                                                    className="w-3 h-3 accent-violet-500"
                                                />
                                                <span className="text-[9px] text-gray-400">متغیر</span>
                                            </label>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingAltIndex(idx);
                                                setAltUnitId(au.unitId);
                                                setAltUnitTitle(au.unitTitle);
                                                setAltUnitShortCode(au.unitShortCode);
                                                setAltUnitIsVariableQty(au.isVariableQty || false);
                                                setAltUnitQty(au.qty ?? '');
                                                setShowAddAltModal(true);
                                            }}
                                            className="p-0.5 hover:bg-violet-100 dark:hover:bg-violet-800/30 rounded text-gray-400 hover:text-violet-600"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAlternativeUnits(prev => prev.filter((_, i) => i !== idx))}
                                            className="p-0.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-400 hover:text-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ModalShell>

            {/* مودال جستجوی همه واحدها */}
            {showAllUnitsModal && (
                <ModalShell
                    open={showAllUnitsModal}
                    onClose={() => setShowAllUnitsModal(false)}
                    title={unitModalMode === 'base' ? 'انتخاب واحد اصلی' : unitModalMode === 'alternative' ? 'انتخاب واحد' : 'انتخاب واحد پیش‌فرض'}
                    maxWidth="max-w-sm"
                    footer={null}
                >
                    <div className="relative mb-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجوی واحد..."
                            autoFocus
                            className="w-full h-10 pr-10 pl-10 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="max-h-[45vh] overflow-y-auto space-y-1">
                        {filteredUnits.length === 0 ? (
                            <div className="py-8 text-center text-sm text-gray-400">واحدی یافت نشد</div>
                        ) : (
                            filteredUnits.map((u: any) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => handleSelectUnit(u)}
                                    className="w-full text-right px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl flex items-center justify-between text-sm"
                                >
                                    <span className="font-medium">{u.title}</span>
                                    {u.shortCode && (
                                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{u.shortCode}</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </ModalShell>
            )}

            {/* مودال افزودن/ویرایش واحد فرعی */}
            {showAddAltModal && (
                <ModalShell
                    open={showAddAltModal}
                    onClose={() => { setShowAddAltModal(false); resetAltModal(); }}
                    title={editingAltIndex !== null ? `ویرایش واحد: ${altUnitTitle}` : 'افزودن واحد فرعی'}
                    maxWidth="max-w-md"
                    footer={
                        <div className="flex items-center justify-between gap-3">
                            <button
                                onClick={() => { setAltUnitId(''); setAltUnitTitle(''); }}
                                className="text-xs text-gray-500 hover:text-gray-600 px-3 py-2 rounded-lg"
                            >
                                تغییر واحد
                            </button>
                            <button
                                onClick={confirmAddAlt}
                                disabled={!altUnitId}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-500 hover:bg-violet-600 text-white transition-colors disabled:opacity-50"
                            >
                                {editingAltIndex !== null ? 'ذخیره' : 'افزودن'}
                            </button>
                        </div>
                    }
                >
                    {!altUnitId ? (
                        <>
                            <div className="relative mb-3">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="جستجوی واحد..."
                                    autoFocus
                                    className="w-full h-10 pr-10 pl-10 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-1">
                                {filteredUnits.map((u: any) => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => {
                                            setAltUnitId(u.id);
                                            setAltUnitTitle(u.title);
                                            setAltUnitShortCode(u.shortCode);
                                            setAltUnitIsVariableQty(u.isVariableQty || false);
                                            setAltUnitQty(u.isVariableQty ? '' : (u.conversionFactor || ''));
                                        }}
                                        className="w-full text-right px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg flex items-center justify-between text-sm"
                                    >
                                        <span className="font-medium">{u.title}</span>
                                        {u.shortCode && (
                                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{u.shortCode}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 flex items-center gap-2">
                                <Package className="w-4 h-4 text-violet-500" />
                                <span className="text-sm font-semibold">{altUnitTitle}</span>
                                <span className="text-xs text-gray-400">({altUnitShortCode})</span>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">
                                    تعداد {baseUnitTitle || 'واحد اصلی'} در هر {altUnitTitle} (اختیاری)
                                </label>
                                <input
                                    type="number"
                                    value={altUnitQty}
                                    onChange={(e) => setAltUnitQty(e.target.value ? Number(e.target.value) : '')}
                                    placeholder="مثلاً 24"
                                    className="w-full h-10 px-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="altIsVariableQty"
                                    checked={altUnitIsVariableQty}
                                    onChange={(e) => setAltUnitIsVariableQty(e.target.checked)}
                                    className="w-4 h-4 accent-violet-500"
                                />
                                <label htmlFor="altIsVariableQty" className="text-xs text-gray-600 dark:text-gray-300">
                                    ضریب متغیر (کاربر می‌تواند تغییر دهد)
                                </label>
                            </div>
                        </div>
                    )}
                </ModalShell>
            )}
        </>
    );
}