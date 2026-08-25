// app/admin/arm/components/CategorySelector.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { UseFormWatch, UseFormSetValue, Control, useFieldArray } from 'react-hook-form';
import {
    Trash2, Search, Loader2, X, Check, ChevronRight, AlertTriangle,
    Layers, Package, List, Lock, Eye, AlertCircle, ArrowRight, Plus, Star, Pencil, Ruler
} from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CategorySelectorProps {
    control: Control<any>;
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    disabled?: boolean;
    onSave?: () => void;
    activeScopeId?: string | null;
    isAdmin?: boolean;
}

interface CategoryNode {
    id: string;
    title: string;
    path: string;
    level: number;
    parentId?: string;
    children?: CategoryNode[];
}

interface UnitInfo {
    id: string;
    title: string;
    shortCode: string;
    isDefault?: boolean;
    isVariableQty?: boolean;
    conversionFactor?: number;
}

const QUANTITY_OPTIONS = [1, 10, 100, 1000, 10000] as const;
type QuantityOption = (typeof QUANTITY_OPTIONS)[number] | null;

export function CategorySelector({
                                     control, watch, setValue,
                                     disabled = false, onSave, activeScopeId = null,
                                     isAdmin = false,
                                 }: CategorySelectorProps) {
    const { fields, append, remove, update } = useFieldArray({ control, name: 'config.categorySelections' });
    const { currentArm } = useSelector((state: RootState) => state.arm);

    const [allCategories, setAllCategories] = useState<CategoryNode[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSearchTerm, setSelectedSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);
    const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; title: string } | null>(null);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

    // Wizard state - واحد پیش‌فرض
    const [modalStep, setModalStep] = useState<1 | 2>(1);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [selectedUnitTitle, setSelectedUnitTitle] = useState<string>('');
    const [selectedUnitShortCode, setSelectedUnitShortCode] = useState<string>('');
    const [selectedUnitIsVariableQty, setSelectedUnitIsVariableQty] = useState<boolean>(false);
    const [selectedUnitQty, setSelectedUnitQty] = useState<number | ''>('');
    const [minQuantity, setMinQuantity] = useState<QuantityOption>(null);
    const [maxQuantity, setMaxQuantity] = useState<QuantityOption>(null);

    // ✅ واحد اصلی
    const [baseUnitId, setBaseUnitId] = useState<string>('');
    const [baseUnitTitle, setBaseUnitTitle] = useState<string>('');
    const [baseUnitShortCode, setBaseUnitShortCode] = useState<string>('');

    // ✅ واحدهای کتگوری
    const [categoryUnits, setCategoryUnits] = useState<UnitInfo[]>([]);

    // ✅ مودال همه واحدها
    const [showAllUnitsModal, setShowAllUnitsModal] = useState(false);
    const [allUnitsList, setAllUnitsList] = useState<UnitInfo[]>([]);
    const [unitSearchTerm, setUnitSearchTerm] = useState('');
    const [unitModalMode, setUnitModalMode] = useState<'primary' | 'alternative' | 'base'>('primary');

    // ✅ مودال افزودن/ویرایش واحد فرعی
    const [showAddAltUnitModal, setShowAddAltUnitModal] = useState(false);
    const [editingAltIndex, setEditingAltIndex] = useState<number | null>(null);
    const [editingAltFieldIndex, setEditingAltFieldIndex] = useState<number | null>(null);
    const [altUnitId, setAltUnitId] = useState<string>('');
    const [altUnitTitle, setAltUnitTitle] = useState<string>('');
    const [altUnitShortCode, setAltUnitShortCode] = useState<string>('');
    const [altUnitIsVariableQty, setAltUnitIsVariableQty] = useState<boolean>(false);
    const [altUnitQty, setAltUnitQty] = useState<number | ''>('');

    const armAdminPermission = watch('config.armAdminPermission') || {};
    const categoriesAccess = armAdminPermission.categories || {};

    const canAdd = isAdmin || categoriesAccess.canAdd === true;
    const canRemove = isAdmin || categoriesAccess.canRemove === true;
    const canChangeUnit = isAdmin || categoriesAccess.canChangeUnit === true;

    const allowedCategoryScope = watch('config.allowedCategoryScope') || [];
    const hasScope = allowedCategoryScope.length > 0;

    const resetModalState = () => {
        setModalStep(1);
        setSelectedUnitId('');
        setSelectedUnitTitle('');
        setSelectedUnitShortCode('');
        setSelectedUnitIsVariableQty(false);
        setSelectedUnitQty('');
        setMinQuantity(null);
        setMaxQuantity(null);
        setCategoryUnits([]);
    };

    const resetAltUnitModal = () => {
        setEditingAltIndex(null);
        setEditingAltFieldIndex(null);
        setAltUnitId('');
        setAltUnitTitle('');
        setAltUnitShortCode('');
        setAltUnitIsVariableQty(false);
        setAltUnitQty('');
    };

    useEffect(() => {
        setIsLoading(true);
        apiService.admin.categories.getAllFlat()
            .then(data => setAllCategories(data))
            .catch(() => toast.error('خطا در دریافت دسته‌بندی‌ها'))
            .finally(() => setIsLoading(false));
    }, []);

    const fetchAllUnits = () => {
        apiService.units.getAll()
            .then(data => setAllUnitsList(data))
            .catch(() => toast.error('خطا در دریافت واحدها'));
    };

    const parentGroups = useMemo(() => {
        let result = allCategories.filter(c => c.level === 1);
        if (hasScope && allowedCategoryScope.length > 0) {
            const scopePaths = allowedCategoryScope.map(id => allCategories.find(c => c.id === id)?.path).filter(Boolean);
            result = result.filter(c => scopePaths.some(p => c.path.startsWith(p)));
        }
        if (activeScopeId) {
            const scopeNode = allCategories.find(c => c.id === activeScopeId);
            if (scopeNode) result = result.filter(c => c.path.startsWith(scopeNode.path));
        }
        return result;
    }, [allCategories, hasScope, allowedCategoryScope, activeScopeId]);

    useEffect(() => {
        if (parentGroups.length > 0) {
            const isValid = selectedParentId && parentGroups.some(p => p.id === selectedParentId);
            if (!isValid) setSelectedParentId(parentGroups[0].id);
        } else {
            setSelectedParentId(null);
        }
    }, [parentGroups]);

    const leavesForParent = useMemo(() => {
        if (!selectedParentId) return [];
        const parent = allCategories.find(c => c.id === selectedParentId);
        if (!parent) return [];
        let result = allCategories.filter(c => c.level >= 2 && c.path.startsWith(parent.path + '.'));
        if (searchTerm.trim()) {
            const t = searchTerm.trim();
            result = result.filter(c => c.title.includes(t) || c.path.includes(t));
        }
        return result;
    }, [allCategories, selectedParentId, searchTerm]);

    const selectedIds = fields.map((f: any) => f.categoryId);

    const parentStats = useMemo(() => {
        const stats: Record<string, { total: number; selected: number }> = {};
        parentGroups.forEach(p => {
            const leaves = allCategories.filter(c => c.level >= 2 && c.path.startsWith(p.path + '.'));
            const selected = leaves.filter(c => selectedIds.includes(c.id)).length;
            stats[p.id] = { total: leaves.length, selected };
        });
        return stats;
    }, [parentGroups, allCategories, selectedIds]);

    const filteredFields = useMemo(() => {
        if (!selectedSearchTerm.trim()) return fields;
        const t = selectedSearchTerm.trim();
        return fields.filter((field: any) => {
            const cat = allCategories.find(c => c.id === field.categoryId);
            return cat?.title.includes(t) || cat?.path.includes(t);
        });
    }, [fields, selectedSearchTerm, allCategories]);

    const fetchCategoryUnits = (categoryId: string, editingIndex?: number) => {
        if (!canChangeUnit) return;
        setIsLoadingUnits(true);
        setPendingCategoryId(categoryId);
        setEditingIndex(editingIndex !== undefined ? editingIndex : null);

        if (editingIndex !== undefined) {
            const currentSel = watch('config.categorySelections')[editingIndex];
            setSelectedUnitId(currentSel.overrideUnitId || '');
            setSelectedUnitTitle(currentSel.overrideUnitTitle || '');
            setSelectedUnitShortCode(currentSel.overrideUnitShortCode || '');
            setSelectedUnitIsVariableQty(currentSel.overrideUnitIsVariableQty || false);
            setSelectedUnitQty(currentSel.overrideUnitQty ?? '');
            setMinQuantity(currentSel.minQuantityOverride ?? null);
            setMaxQuantity(currentSel.maxQuantityOverride ?? null);
            setBaseUnitId(currentSel.baseUnitId || '');
            setBaseUnitTitle(currentSel.baseUnitTitle || '');
            setBaseUnitShortCode(currentSel.baseUnitShortCode || '');
        } else {
            resetModalState();
            setBaseUnitId('');
            setBaseUnitTitle('');
            setBaseUnitShortCode('');
        }

        apiService.admin.categories.getUnits(categoryId)
            .then(res => {
                setCategoryUnits(res || []);
                setShowUnitModal(true);
            })
            .catch(() => {
                toast.error('خطا در دریافت واحدها');
                setCategoryUnits([]);
                setShowUnitModal(true);
            })
            .finally(() => setIsLoadingUnits(false));
    };

    const handleSelectPrimaryUnit = (unit: UnitInfo) => {
        setSelectedUnitId(unit.id);
        setSelectedUnitTitle(unit.title);
        setSelectedUnitShortCode(unit.shortCode);
        setSelectedUnitIsVariableQty(unit.isVariableQty || false);
        setSelectedUnitQty(unit.isVariableQty ? '' : (unit.conversionFactor || ''));
        setModalStep(2);
    };

    const handleSelectUnitFromSearch = (unit: UnitInfo) => {
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
        setUnitSearchTerm('');
    };

    const confirmAddCategory = () => {
        if (!pendingCategoryId || !selectedUnitId) return;

        if (editingIndex !== null) {
            const currentSelections = watch('config.categorySelections') || [];
            if (currentSelections[editingIndex]) {
                const updated = [...currentSelections];
                updated[editingIndex] = {
                    ...updated[editingIndex],
                    overrideUnitId: selectedUnitId,
                    overrideUnitTitle: selectedUnitTitle,
                    overrideUnitShortCode: selectedUnitShortCode,
                    overrideUnitIsVariableQty: selectedUnitIsVariableQty,
                    overrideUnitQty: selectedUnitQty === '' ? null : Number(selectedUnitQty),
                    minQuantityOverride: minQuantity,
                    maxQuantityOverride: maxQuantity,
                    baseUnitId: baseUnitId || null,
                    baseUnitTitle: baseUnitTitle || null,
                    baseUnitShortCode: baseUnitShortCode || null,
                };
                setValue('config.categorySelections', updated);
                toast.success('تنظیمات ذخیره شد');
            }
            setEditingIndex(null);
        } else {
            const category = allCategories.find(c => c.id === pendingCategoryId);
            const currentSelections = watch('config.categorySelections') || [];
            append({
                categoryId: pendingCategoryId,
                customLabel: null,
                overrideUnitId: selectedUnitId,
                overrideUnitTitle: selectedUnitTitle,
                overrideUnitShortCode: selectedUnitShortCode,
                overrideUnitIsVariableQty: selectedUnitIsVariableQty,
                overrideUnitQty: selectedUnitQty === '' ? null : Number(selectedUnitQty),
                minQuantityOverride: minQuantity,
                maxQuantityOverride: maxQuantity,
                baseUnitId: baseUnitId || null,
                baseUnitTitle: baseUnitTitle || null,
                baseUnitShortCode: baseUnitShortCode || null,
                alternativeUnits: [],
                displayPriority: currentSelections.length,
                isActive: true,
                example: category?.example || null,
            });
            toast.success('دسته‌بندی اضافه شد');
        }

        setPendingCategoryId(null);
        setShowUnitModal(false);
        resetModalState();
        if (onSave) onSave();
    };

    // ✅ باز کردن مودال افزودن واحد فرعی
    const handleOpenAddAltUnitModal = (fieldIndex: number) => {
        resetAltUnitModal();
        setEditingAltFieldIndex(fieldIndex);
        setShowAddAltUnitModal(true);
        fetchAllUnits();
    };

    // ✅ باز کردن مودال ویرایش واحد فرعی
    const handleEditAltUnit = (fieldIndex: number, altUnitIndex: number) => {
        const field = fields[fieldIndex];
        const au = field?.alternativeUnits?.[altUnitIndex];
        if (!au) return;

        setEditingAltFieldIndex(fieldIndex);
        setEditingAltIndex(altUnitIndex);
        setAltUnitId(au.unitId);
        setAltUnitTitle(au.unitTitle);
        setAltUnitShortCode(au.unitShortCode);
        setAltUnitIsVariableQty(au.isVariableQty || false);
        setAltUnitQty(au.qty ?? '');
        setShowAddAltUnitModal(true);
        fetchAllUnits();
    };

    // ✅ تأیید افزودن/ویرایش واحد فرعی
    const confirmAddAlternativeUnit = () => {
        if (editingAltFieldIndex === null || !altUnitId) return;

        const currentSelections = watch('config.categorySelections') || [];
        const field = currentSelections[editingAltFieldIndex];
        if (!field) return;

        const currentAltUnits = [...(field.alternativeUnits || [])];

        if (editingAltIndex !== null) {
            currentAltUnits[editingAltIndex] = {
                ...currentAltUnits[editingAltIndex],
                unitId: altUnitId,
                unitTitle: altUnitTitle,
                unitShortCode: altUnitShortCode,
                isVariableQty: altUnitIsVariableQty,
                qty: altUnitQty === '' ? null : Number(altUnitQty),
            };
            toast.success('واحد به‌روزرسانی شد');
        } else {
            if (currentAltUnits.some((au: any) => au.unitId === altUnitId)) {
                toast.info('این واحد قبلاً اضافه شده');
                setShowAddAltUnitModal(false);
                resetAltUnitModal();
                return;
            }

            currentAltUnits.push({
                unitId: altUnitId,
                unitTitle: altUnitTitle,
                unitShortCode: altUnitShortCode,
                minQuantity: null,
                isActive: true,
                displayPriority: currentAltUnits.length,
                isVariableQty: altUnitIsVariableQty,
                qty: altUnitQty === '' ? null : Number(altUnitQty),
            });
            toast.success(`${altUnitTitle} اضافه شد`);
        }

        const updated = [...currentSelections];
        updated[editingAltFieldIndex] = {
            ...updated[editingAltFieldIndex],
            alternativeUnits: currentAltUnits,
        };
        setValue('config.categorySelections', updated);
        setShowAddAltUnitModal(false);
        resetAltUnitModal();
        if (onSave) onSave();
    };

    // ✅ حذف واحد فرعی
    const handleRemoveAlternativeUnit = (fieldIndex: number, altUnitIndex: number) => {
        const currentSelections = watch('config.categorySelections') || [];
        const field = currentSelections[fieldIndex];
        if (!field) return;

        const updatedAltUnits = (field.alternativeUnits || []).filter((_: any, i: number) => i !== altUnitIndex);
        const updated = [...currentSelections];
        updated[fieldIndex] = {
            ...updated[fieldIndex],
            alternativeUnits: updatedAltUnits,
        };
        setValue('config.categorySelections', updated);
        if (onSave) onSave();
    };

    // ✅ تغییر واحد پیش‌فرض (باز کردن مودال تنظیمات)
    const handleChangePrimaryUnit = (fieldIndex: number) => {
        const field = fields[fieldIndex];
        if (!field) return;
        fetchCategoryUnits(field.categoryId, fieldIndex);
    };

    // ✅ به‌روزرسانی تعداد واحد پیش‌فرض
    const handleUpdatePrimaryQty = (fieldIndex: number, value: string) => {
        const numValue = value === '' ? null : Number(value);
        update(fieldIndex, {
            ...fields[fieldIndex],
            overrideUnitQty: numValue,
        });
        if (onSave) onSave();
    };

    // ✅ به‌روزرسانی ضریب متغیر بودن واحد پیش‌فرض
    const handleTogglePrimaryIsVariable = (fieldIndex: number, isVariable: boolean) => {
        update(fieldIndex, {
            ...fields[fieldIndex],
            overrideUnitIsVariableQty: isVariable,
        });
        if (onSave) onSave();
    };

    // ✅ به‌روزرسانی تعداد واحد فرعی
    const handleUpdateAltQty = (fieldIndex: number, altUnitIndex: number, value: string) => {
        const field = fields[fieldIndex];
        if (!field) return;

        const updatedAltUnits = [...(field.alternativeUnits || [])];
        updatedAltUnits[altUnitIndex] = {
            ...updatedAltUnits[altUnitIndex],
            qty: value === '' ? null : Number(value),
        };

        update(fieldIndex, {
            ...field,
            alternativeUnits: updatedAltUnits,
        });
        if (onSave) onSave();
    };

    // ✅ به‌روزرسانی ضریب متغیر بودن واحد فرعی
    const handleToggleAltIsVariable = (fieldIndex: number, altUnitIndex: number, isVariable: boolean) => {
        const field = fields[fieldIndex];
        if (!field) return;

        const updatedAltUnits = [...(field.alternativeUnits || [])];
        updatedAltUnits[altUnitIndex] = {
            ...updatedAltUnits[altUnitIndex],
            isVariableQty: isVariable,
        };

        update(fieldIndex, {
            ...field,
            alternativeUnits: updatedAltUnits,
        });
        if (onSave) onSave();
    };

    const isStep2Valid = () => {
        if (!selectedUnitId) return false;
        if (minQuantity != null && maxQuantity != null && minQuantity > maxQuantity) return false;
        return true;
    };

    const confirmRemove = (index: number) => {
        if (!canRemove) return;
        const field = fields[index];
        const cat = allCategories.find(c => c.id === field.categoryId);
        setDeleteConfirm({ index, title: cat?.title || 'این دسته‌بندی' });
    };

    const handleRemove = () => {
        if (!deleteConfirm) return;
        remove(deleteConfirm.index);
        setDeleteConfirm(null);
        toast.success('حذف شد');
        if (onSave) onSave();
    };

    const handleLeafClick = (leafId: string) => {
        if (!canAdd) return;
        if (selectedIds.includes(leafId)) return;
        fetchCategoryUnits(leafId);
    };

    if (isLoading) return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

    return (
        <div className="space-y-4">
            {!isAdmin && !canAdd && !canRemove && !canChangeUnit && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        ویرایش گروه‌های کالا فعلا توسط مدیر سیستم قابل انجام است.
                    </p>
                </div>
            )}

            {/* ✅ تغییر عرض: باکس ۱ و ۲ کوچکتر، باکس ۳ بزرگتر */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* باکس ۱: سرگروه‌ها - عرض کمتر */}
                <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden">
                    <div className="px-3 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-semibold">سرگروه‌ها</h4>
                        <span className="text-[10px] text-on-surface-variant mr-auto">{parentGroups.length}</span>
                    </div>
                    <div className="divide-y divide-outline-variant/10 max-h-[500px] overflow-y-auto">
                        {parentGroups.length === 0 ? (
                            <div className="text-center py-8 text-xs text-on-surface-variant">هیچ سرگروهی یافت نشد</div>
                        ) : parentGroups.map(p => {
                            const stat = parentStats[p.id];
                            const isActive = selectedParentId === p.id;
                            return (
                                <button key={p.id} onClick={() => setSelectedParentId(isActive ? null : p.id)}
                                        className={cn("w-full text-right px-3 py-2.5 transition-colors hover:bg-surface-container-low flex items-center gap-1.5",
                                            isActive && "bg-primary/5 border-r-2 border-primary")}>
                                    <ChevronRight className={cn("w-3.5 h-3.5 text-on-surface-variant/50 transition-transform flex-shrink-0", isActive && "rotate-90 text-primary")} />
                                    <span className="text-xs font-medium flex-1 truncate">{p.title}</span>
                                    {stat && (
                                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0", stat.selected > 0 ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant")}>
                      {stat.selected}/{stat.total}
                    </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* باکس ۲: برگ‌ها - عرض کمتر */}
                <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden">
                    <div className="px-3 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-semibold">گروه‌های کالا</h4>
                        <span className="text-[10px] text-on-surface-variant mr-auto">{leavesForParent.length}</span>
                    </div>
                    {!selectedParentId ? (
                        <div className="text-center py-12 text-xs text-on-surface-variant">یک سرگروه انتخاب کنید</div>
                    ) : leavesForParent.length === 0 ? (
                        <div className="text-center py-8 text-xs text-on-surface-variant">هیچ گروهی یافت نشد</div>
                    ) : (
                        <>
                            <div className="p-2 border-b border-outline-variant/10">
                                <div className="relative">
                                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                           placeholder="جستجو..."
                                           className="w-full bg-surface-container-lowest border border-outline rounded-lg h-7 px-2.5 pr-7 text-[11px] focus:ring-1 focus:ring-primary/30 outline-none" />
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-on-surface-variant/50" />
                                </div>
                            </div>
                            <div className="divide-y divide-outline-variant/10 max-h-[400px] overflow-y-auto">
                                {leavesForParent.map(leaf => {
                                    const isSelected = selectedIds.includes(leaf.id);
                                    return (
                                        <div key={leaf.id}
                                             className={cn("flex items-center justify-between px-3 py-2 transition-colors",
                                                 isSelected ? "bg-primary/5" : "hover:bg-surface-container-low")}>
                                            <span className="text-xs truncate">{leaf.title}</span>
                                            {isSelected ? (
                                                <span className="text-[10px] text-green-600 flex items-center gap-0.5 flex-shrink-0"><Check className="w-3 h-3" /></span>
                                            ) : (
                                                <button onClick={() => handleLeafClick(leaf.id)}
                                                        className={cn("text-[10px] flex-shrink-0", canAdd ? "text-primary hover:underline" : "text-gray-400 cursor-not-allowed")}>
                                                    {canAdd ? '+ افزودن' : '🔒'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* ✅ باکس ۳: انتخاب‌شده‌ها - عرض بیشتر (3 ستون) */}
                <div className="lg:col-span-3 bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden">
                    <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/20 space-y-2">
                        <div className="flex items-center gap-2">
                            <List className="w-4 h-4 text-primary" />
                            <h4 className="text-sm font-semibold">گروه‌های کالای بازار شما</h4>
                            <span className="text-xs text-on-surface-variant mr-auto">{fields.length}</span>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={selectedSearchTerm}
                                onChange={(e) => setSelectedSearchTerm(e.target.value)}
                                placeholder="جستجو در گروه‌های منتخب..."
                                className="w-full bg-surface-container-lowest border border-outline rounded-lg h-8 px-3 pr-8 text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                            />
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
                        </div>
                    </div>
                    <div className="p-3 space-y-3 max-h-[450px] overflow-y-auto">
                        {filteredFields.length === 0 ? (
                            <div className="text-center py-12 text-sm text-on-surface-variant">
                                {selectedSearchTerm ? (
                                    <>
                                        <Search className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/20" />
                                        هیچ گروهی با این نام یافت نشد
                                    </>
                                ) : (
                                    <>
                                        <Package className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/20" />
                                        هیچ گروهی انتخاب نشده
                                    </>
                                )}
                            </div>
                        ) : (
                            filteredFields.map((field, index) => {
                                const cat = allCategories.find(c => c.id === field.categoryId);
                                const parent = allCategories.find(c => c.id === cat?.parentId);
                                const alternativeUnits = field.alternativeUnits || [];
                                const baseUnit = field.baseUnitTitle ? {
                                    id: field.baseUnitId,
                                    title: field.baseUnitTitle,
                                    shortCode: field.baseUnitShortCode,
                                } : null;

                                return (
                                    <div key={field.id} className="bg-white dark:bg-gray-800 rounded-xl border border-outline-variant/20 p-3 space-y-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-on-surface truncate">
                                                    {cat?.title || 'نامشخص'}
                                                </p>
                                                <p className="text-[10px] text-on-surface-variant/60 truncate">
                                                    {parent?.title}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {canChangeUnit && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChangePrimaryUnit(index)}
                                                        className="text-[10px] text-primary hover:underline"
                                                    >
                                                        تنظیمات واحد
                                                    </button>
                                                )}
                                                {canRemove && (
                                                    <button
                                                        type="button"
                                                        onClick={() => !disabled && confirmRemove(index)}
                                                        className="p-1 hover:bg-error/10 hover:text-error rounded"
                                                        disabled={disabled}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {baseUnit && (
                                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2.5 py-1.5">
                                                <Ruler className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                                                    واحد اصلی: {baseUnit.title}
                                                </span>
                                            </div>
                                        )}

                                        {/* ✅ واحد پیش‌فرض - با تیک ضریب متغیر */}
                                        <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-2.5 py-2">
                                            <Star className="w-3.5 h-3.5 text-primary fill-primary flex-shrink-0" />
                                            <span className="text-xs font-semibold text-on-surface flex-1">
                                                {field.overrideUnitTitle || 'نامشخص'}
                                            </span>

                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {/* ✅ تعداد یا آیکون ویرایش */}
                                                {field.overrideUnitIsVariableQty ? (
                                                    <input
                                                        type="number"
                                                        placeholder="—"
                                                        defaultValue={field.overrideUnitQty || ''}
                                                        onBlur={(e) => handleUpdatePrimaryQty(index, e.target.value)}
                                                        className="w-16 h-7 px-1.5 border border-outline-variant rounded text-[10px] text-center"
                                                        title={`تعداد ${baseUnit?.title || 'واحد'} در هر ${field.overrideUnitTitle}`}
                                                    />
                                                ) : (
                                                    <span className="text-[10px] text-on-surface-variant">
                                                        = {field.overrideUnitQty || '—'}
                                                    </span>
                                                )}

                                                {/* ✅ تیک ضریب متغیر */}
                                                <label className="flex items-center gap-0.5 cursor-pointer" title="ضریب متغیر">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.overrideUnitIsVariableQty || false}
                                                        onChange={(e) => handleTogglePrimaryIsVariable(index, e.target.checked)}
                                                        className="w-3.5 h-3.5 accent-primary"
                                                    />
                                                    <span className="text-[9px] text-on-surface-variant">متغیر</span>
                                                </label>
                                            </div>
                                        </div>

                                        {(field.minQuantityOverride != null || field.maxQuantityOverride != null) && (
                                            <div className="flex items-center gap-2 px-2.5">
                                                {field.minQuantityOverride != null && (
                                                    <span className="text-[10px] text-on-surface-variant">
                                                        حداقل: {field.minQuantityOverride}
                                                    </span>
                                                )}
                                                {field.maxQuantityOverride != null && (
                                                    <span className="text-[10px] text-on-surface-variant">
                                                        حداکثر: {field.maxQuantityOverride}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-1.5 pr-2">
                                            {alternativeUnits.map((au: any, auIndex: number) => (
                                                <div key={auIndex} className="flex items-center gap-2 bg-surface-container-high/50 rounded-lg px-2 py-1.5">
                                                    <Package className="w-3 h-3 text-on-surface-variant/50 flex-shrink-0" />
                                                    <span className="text-xs text-on-surface flex-1">{au.unitTitle}</span>

                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        {au.isVariableQty ? (
                                                            <input
                                                                type="number"
                                                                placeholder="—"
                                                                defaultValue={au.qty || ''}
                                                                onBlur={(e) => handleUpdateAltQty(index, auIndex, e.target.value)}
                                                                className="w-16 h-7 px-1.5 border border-outline-variant rounded text-[10px] text-center"
                                                                title={`تعداد ${baseUnit?.title || 'واحد'} در هر ${au.unitTitle}`}
                                                            />
                                                        ) : (
                                                            <span className="text-[10px] text-on-surface-variant">
                                                                = {au.qty || '—'}
                                                            </span>
                                                        )}

                                                        <label className="flex items-center gap-0.5 cursor-pointer" title="ضریب متغیر">
                                                            <input
                                                                type="checkbox"
                                                                checked={au.isVariableQty || false}
                                                                onChange={(e) => handleToggleAltIsVariable(index, auIndex, e.target.checked)}
                                                                className="w-3.5 h-3.5 accent-primary"
                                                            />
                                                            <span className="text-[9px] text-on-surface-variant">متغیر</span>
                                                        </label>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditAltUnit(index, auIndex)}
                                                        className="p-0.5 hover:bg-primary/10 hover:text-primary rounded flex-shrink-0"
                                                        title="ویرایش"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAlternativeUnit(index, auIndex)}
                                                        className="p-0.5 hover:bg-error/10 hover:text-error rounded flex-shrink-0"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}

                                            {canChangeUnit && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenAddAltUnitModal(index)}
                                                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    افزودن واحد
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* مودال ویزاردی واحد پیش‌فرض */}
            {showUnitModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-surface rounded-t-2xl z-10">
                            <div className="flex items-center gap-2">
                                {modalStep === 2 && (
                                    <button onClick={() => setModalStep(1)} className="p-1 hover:bg-surface-container rounded">
                                        <ArrowRight className="w-5 h-5 text-on-surface-variant" />
                                    </button>
                                )}
                                <h3 className="text-lg font-semibold">
                                    {modalStep === 1
                                        ? `تنظیم واحد – ${allCategories.find(c => c.id === pendingCategoryId)?.title || ''}`
                                        : `تنظیم واحد پیش‌فرض (${selectedUnitTitle})`}
                                </h3>
                            </div>
                            <button onClick={() => { setShowUnitModal(false); resetModalState(); }}
                                    className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-4">
                            {modalStep === 1 ? (
                                <div className="space-y-4">
                                    <div className="bg-surface-container-low rounded-xl p-4">
                                        <p className="text-xs font-medium text-on-surface mb-2 flex items-center gap-1.5">
                                            <Ruler className="w-4 h-4 text-blue-500" />
                                            واحد اصلی (کوچکترین واحد قابل فروش)
                                        </p>
                                        {baseUnitTitle ? (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold">{baseUnitTitle}</span>
                                                <button
                                                    onClick={() => { setUnitModalMode('base'); fetchAllUnits(); setShowAllUnitsModal(true); }}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    تغییر
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setUnitModalMode('base'); fetchAllUnits(); setShowAllUnitsModal(true); }}
                                                className="w-full text-right px-4 py-2.5 border border-dashed border-outline-variant rounded-lg text-xs text-primary hover:bg-surface-container-low"
                                            >
                                                + انتخاب واحد اصلی
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs text-on-surface-variant">واحد پیش‌فرض (برای ثبت آگهی):</p>

                                        {categoryUnits.length > 0 ? (
                                            <div className="space-y-2">
                                                {categoryUnits.map((unit: UnitInfo) => (
                                                    <button
                                                        key={unit.id}
                                                        onClick={() => handleSelectPrimaryUnit(unit)}
                                                        className="w-full text-right px-4 py-3 hover:bg-surface-container-low rounded-xl flex items-center justify-between text-sm border border-outline-variant/20 hover:border-primary/30 transition-all"
                                                    >
                                                        <span className="font-medium">{unit.title}</span>
                                                        <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">{unit.shortCode}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-on-surface-variant/50">هیچ واحدی برای این گروه تعریف نشده</p>
                                        )}

                                        <button
                                            onClick={() => { setUnitModalMode('primary'); fetchAllUnits(); setShowAllUnitsModal(true); }}
                                            className="w-full text-right px-4 py-3 hover:bg-surface-container-low rounded-xl flex items-center justify-between text-sm border border-dashed border-outline-variant hover:border-primary/30 transition-all"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Search className="w-4 h-4 text-primary" />
                                                <span className="font-medium text-primary">جستجو در همه واحدها</span>
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-on-surface-variant/50" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-on-surface block mb-1">
                                                تعداد {baseUnitTitle || 'واحد اصلی'} در هر {selectedUnitTitle} (اختیاری)
                                            </label>
                                            <input
                                                type="number"
                                                value={selectedUnitQty}
                                                onChange={(e) => setSelectedUnitQty(e.target.value ? Number(e.target.value) : '')}
                                                placeholder={baseUnitTitle ? `مثلاً 24 (تعداد ${baseUnitTitle} در هر ${selectedUnitTitle})` : 'مثلاً 24'}
                                                className="w-full bg-surface border border-outline-variant rounded-lg h-10 px-3 text-sm"
                                            />
                                        </div>

                                        {/* ✅ چک باکس ضریب متغیر برای واحد پیش‌فرض */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="primaryIsVariableQty"
                                                checked={selectedUnitIsVariableQty}
                                                onChange={(e) => setSelectedUnitIsVariableQty(e.target.checked)}
                                                className="w-4 h-4 accent-primary"
                                            />
                                            <label htmlFor="primaryIsVariableQty" className="text-xs text-on-surface">
                                                ضریب متغیر (کاربر می‌تواند موقع ثبت آگهی تغییر دهد)
                                            </label>
                                        </div>
                                    </div>

                                    <div className="bg-surface-container-low rounded-xl p-4">
                                        <p className="text-xs text-on-surface-variant mb-4">تعیین حداقل و حداکثر حجم فروش (اختیاری)</p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium text-on-surface block mb-1">حداقل فروش</label>
                                                <select
                                                    value={minQuantity ?? ''}
                                                    onChange={(e) => setMinQuantity(e.target.value ? Number(e.target.value) : null)}
                                                    className="w-full bg-surface border border-outline-variant rounded-lg h-10 px-3 text-sm"
                                                >
                                                    <option value="">بدون محدودیت</option>
                                                    {QUANTITY_OPTIONS.map(val => (
                                                        <option key={val} value={val}>{val.toLocaleString()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-on-surface block mb-1">حداکثر فروش</label>
                                                <select
                                                    value={maxQuantity ?? ''}
                                                    onChange={(e) => setMaxQuantity(e.target.value ? Number(e.target.value) : null)}
                                                    className="w-full bg-surface border border-outline-variant rounded-lg h-10 px-3 text-sm"
                                                >
                                                    <option value="">بدون محدودیت</option>
                                                    {QUANTITY_OPTIONS.map(val => (
                                                        <option key={val} value={val}>{val.toLocaleString()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {!isStep2Valid() && (
                                            <p className="text-xs text-error mt-3">حداقل نمی‌تواند بیشتر از حداکثر باشد.</p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => setModalStep(1)}
                                                className="flex-1 h-11 border border-outline text-on-surface rounded-xl text-sm hover:bg-surface-container-low">
                                            بازگشت
                                        </button>
                                        <button onClick={confirmAddCategory}
                                                disabled={!isStep2Valid()}
                                                className="flex-1 h-11 bg-primary text-on-primary rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-primary/90">
                                            ذخیره
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* مودال جستجوی همه واحدها */}
            {showAllUnitsModal && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant max-h-[70vh] flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
                            <h3 className="text-sm font-semibold">
                                {unitModalMode === 'base' ? 'انتخاب واحد اصلی' : unitModalMode === 'alternative' ? 'انتخاب واحد' : 'انتخاب واحد پیش‌فرض'}
                            </h3>
                            <button onClick={() => setShowAllUnitsModal(false)} className="p-1.5 hover:bg-surface-container-high rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-3 border-b flex-shrink-0">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={unitSearchTerm}
                                    onChange={(e) => setUnitSearchTerm(e.target.value)}
                                    placeholder="جستجوی واحد..."
                                    className="w-full bg-surface-container-lowest border border-outline rounded-lg h-9 px-3 pr-8 text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                                />
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {allUnitsList
                                .filter(u => u.title.includes(unitSearchTerm) || u.shortCode.includes(unitSearchTerm))
                                .map(unit => (
                                    <button
                                        key={unit.id}
                                        onClick={() => handleSelectUnitFromSearch(unit)}
                                        className="w-full text-right px-4 py-2.5 hover:bg-surface-container-low flex items-center justify-between text-sm border-b border-outline-variant/10 last:border-0"
                                    >
                                        <span className="font-medium">{unit.title}</span>
                                        <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">{unit.shortCode}</span>
                                    </button>
                                ))}
                            {allUnitsList.filter(u => u.title.includes(unitSearchTerm) || u.shortCode.includes(unitSearchTerm)).length === 0 && (
                                <div className="text-center py-8 text-sm text-on-surface-variant">هیچ واحدی یافت نشد</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* مودال افزودن/ویرایش واحد فرعی */}
            {showAddAltUnitModal && (
                <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-surface rounded-t-2xl z-10">
                            <h3 className="text-lg font-semibold">
                                {editingAltIndex !== null ? `ویرایش واحد: ${altUnitTitle}` : 'افزودن واحد'}
                            </h3>
                            <button onClick={() => { setShowAddAltUnitModal(false); resetAltUnitModal(); }}
                                    className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-4 space-y-4">
                            {!altUnitId ? (
                                <>
                                    <p className="text-xs text-on-surface-variant">انتخاب واحد:</p>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={unitSearchTerm}
                                            onChange={(e) => setUnitSearchTerm(e.target.value)}
                                            placeholder="جستجوی واحد..."
                                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 pr-8 text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                                        />
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                        {allUnitsList
                                            .filter(u => u.title.includes(unitSearchTerm) || u.shortCode.includes(unitSearchTerm))
                                            .map(unit => (
                                                <button
                                                    key={unit.id}
                                                    onClick={() => {
                                                        setAltUnitId(unit.id);
                                                        setAltUnitTitle(unit.title);
                                                        setAltUnitShortCode(unit.shortCode);
                                                        setAltUnitIsVariableQty(unit.isVariableQty || false);
                                                        setAltUnitQty(unit.isVariableQty ? '' : (unit.conversionFactor || ''));
                                                    }}
                                                    className="w-full text-right px-3 py-2 hover:bg-surface-container-low rounded-lg flex items-center justify-between text-sm"
                                                >
                                                    <span className="font-medium">{unit.title}</span>
                                                    <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">{unit.shortCode}</span>
                                                </button>
                                            ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-semibold">{altUnitTitle}</span>
                                        <span className="text-xs text-on-surface-variant">({altUnitShortCode})</span>
                                    </div>

                                    <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-on-surface block mb-1">
                                                تعداد واحد اصلی در هر {altUnitTitle} (اختیاری)
                                            </label>
                                            <input
                                                type="number"
                                                value={altUnitQty}
                                                onChange={(e) => setAltUnitQty(e.target.value ? Number(e.target.value) : '')}
                                                placeholder="مثلاً 24"
                                                className="w-full bg-surface border border-outline-variant rounded-lg h-10 px-3 text-sm"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="altIsVariableQty"
                                                checked={altUnitIsVariableQty}
                                                onChange={(e) => setAltUnitIsVariableQty(e.target.checked)}
                                                className="w-4 h-4 accent-primary"
                                            />
                                            <label htmlFor="altIsVariableQty" className="text-xs text-on-surface">
                                                ضریب متغیر (کاربر می‌تواند موقع ثبت آگهی تغییر دهد)
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => { setAltUnitId(''); setAltUnitTitle(''); setAltUnitShortCode(''); }}
                                                className="flex-1 h-11 border border-outline text-on-surface rounded-xl text-sm hover:bg-surface-container-low">
                                            تغییر واحد
                                        </button>
                                        <button onClick={confirmAddAlternativeUnit}
                                                className="flex-1 h-11 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary/90">
                                            {editingAltIndex !== null ? 'ذخیره' : 'افزودن'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* مودال تأیید حذف */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" />تأیید حذف</h3>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-sm">آیا از حذف <span className="font-semibold">«{deleteConfirm.title}»</span> اطمینان دارید؟</p>
                            <p className="text-xs text-warning">⚠️ آگهی‌های مرتبط با این دسته‌بندی از بازار حذف خواهند شد.</p>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 border border-outline rounded-xl text-sm">انصراف</button>
                                <button type="button" onClick={handleRemove} className="flex-1 h-10 bg-error text-on-error rounded-xl text-sm hover:bg-error/90">حذف</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}