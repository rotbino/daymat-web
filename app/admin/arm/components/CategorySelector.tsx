// app/admin/arm/components/CategorySelector.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { UseFormWatch, UseFormSetValue, Control, useFieldArray } from 'react-hook-form';
import {
    Trash2, Search, Loader2, X, Check, ChevronRight, AlertTriangle,
    Layers, Package, List, Lock, Eye, AlertCircle, ArrowRight, SlidersHorizontal
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

const QUANTITY_OPTIONS = [1, 10, 100, 1000, 10000] as const;
type QuantityOption = (typeof QUANTITY_OPTIONS)[number] | null;

export function CategorySelector({
                                     control, watch, setValue,
                                     disabled = false, onSave, activeScopeId = null,
                                     isAdmin = false,
                                 }: CategorySelectorProps) {
    const { fields, append, remove } = useFieldArray({ control, name: 'config.categorySelections' });
    const { currentArm } = useSelector((state: RootState) => state.arm);

    const [allCategories, setAllCategories] = useState<CategoryNode[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCategoryUnits, setSelectedCategoryUnits] = useState<any[]>([]);
    const [isLoadingUnits, setIsLoadingUnits] = useState(false);
    const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; title: string } | null>(null);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

    // Wizard state
    const [modalStep, setModalStep] = useState<1 | 2>(1);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('default');
    const [selectedUnitTitle, setSelectedUnitTitle] = useState<string>('تن');
    const [minQuantity, setMinQuantity] = useState<QuantityOption>(null);
    const [maxQuantity, setMaxQuantity] = useState<QuantityOption>(null);

    const armAdminPermission = watch('config.armAdminPermission') || {};
    const categoriesAccess = armAdminPermission.categories || {};

    const canAdd = isAdmin || categoriesAccess.canAdd === true;
    const canRemove = isAdmin || categoriesAccess.canRemove === true;
    const canChangeUnit = isAdmin || categoriesAccess.canChangeUnit === true;

    const allowedCategoryScope = watch('config.allowedCategoryScope') || [];
    const hasScope = allowedCategoryScope.length > 0;

    // Reset wizard state
    const resetModalState = () => {
        setModalStep(1);
        setSelectedUnitId('default');
        setSelectedUnitTitle('تن');
        setMinQuantity(null);
        setMaxQuantity(null);
    };

    useEffect(() => {
        setIsLoading(true);
        apiService.admin.categories.getAllFlat()
            .then(data => setAllCategories(data))
            .catch(() => toast.error('خطا در دریافت دسته‌بندی‌ها'))
            .finally(() => setIsLoading(false));
    }, []);

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

    const fetchCategoryUnits = (categoryId: string, editingIndex?: number) => {
        if (!canChangeUnit) return;
        setIsLoadingUnits(true);
        setPendingCategoryId(categoryId);
        setEditingIndex(editingIndex !== undefined ? editingIndex : null);

        if (editingIndex !== undefined) {
            const currentSel = watch('config.categorySelections')[editingIndex];
            setSelectedUnitId(currentSel.overrideUnitId || 'default');
            setSelectedUnitTitle(currentSel.overrideUnitTitle || 'تن');
            setMinQuantity(currentSel.minQuantityOverride ?? null);
            setMaxQuantity(currentSel.maxQuantityOverride ?? null);
        } else {
            resetModalState();
        }

        apiService.admin.categories.getUnits(categoryId)
            .then(res => {
                setSelectedCategoryUnits(res || []);
                setShowUnitModal(true);
            })
            .catch(() => toast.error('خطا در دریافت واحدها'))
            .finally(() => setIsLoadingUnits(false));
    };

    const confirmAddCategory = () => {
        if (!pendingCategoryId) return;

        if (editingIndex !== null) {
            const currentSelections = watch('config.categorySelections') || [];
            if (currentSelections[editingIndex]) {
                const updated = [...currentSelections];
                updated[editingIndex] = {
                    ...updated[editingIndex],
                    overrideUnitId: selectedUnitId,
                    overrideUnitTitle: selectedUnitTitle,
                    minQuantityOverride: minQuantity,
                    maxQuantityOverride: maxQuantity,
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
                minQuantityOverride: minQuantity,
                maxQuantityOverride: maxQuantity,
                displayPriority: currentSelections.length,
                isActive: true,
                example: category?.example || null,
            });
            toast.success('دسته‌بندی اضافه شد');
        }

        setPendingCategoryId(null);
        setSelectedCategoryUnits([]);
        setShowUnitModal(false);
        resetModalState();
        if (onSave) onSave();
    };

    const isStep2Valid = () => {
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
                        در صورت نیاز به تغییر یا افزودن گروه جدید، با پشتیبانی Daymat تماس بگیرید.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* باکس ۱: سرگروه‌ها */}
                <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden">
                    <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">سرگروه‌ها</h4>
                        <span className="text-xs text-on-surface-variant mr-auto">{parentGroups.length}</span>
                    </div>
                    <div className="divide-y divide-outline-variant/10 max-h-[500px] overflow-y-auto">
                        {parentGroups.length === 0 ? (
                            <div className="text-center py-8 text-sm text-on-surface-variant">هیچ سرگروهی یافت نشد</div>
                        ) : parentGroups.map(p => {
                            const stat = parentStats[p.id];
                            const isActive = selectedParentId === p.id;
                            return (
                                <button key={p.id} onClick={() => setSelectedParentId(isActive ? null : p.id)}
                                        className={cn("w-full text-right px-4 py-3 transition-colors hover:bg-surface-container-low flex items-center gap-2",
                                            isActive && "bg-primary/5 border-r-2 border-primary")}>
                                    <ChevronRight className={cn("w-4 h-4 text-on-surface-variant/50 transition-transform", isActive && "rotate-90 text-primary")} />
                                    <span className="text-sm font-medium flex-1">{p.title}</span>
                                    {stat && (
                                        <span className={cn("text-xs px-2 py-0.5 rounded-full", stat.selected > 0 ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant")}>
                      {stat.selected}/{stat.total}
                    </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* باکس ۲: برگ‌ها */}
                <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden">
                    <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">گروه‌های کالا</h4>
                        <span className="text-xs text-on-surface-variant mr-auto">{leavesForParent.length}</span>
                    </div>
                    {!selectedParentId ? (
                        <div className="text-center py-12 text-sm text-on-surface-variant">یک سرگروه انتخاب کنید</div>
                    ) : leavesForParent.length === 0 ? (
                        <div className="text-center py-8 text-sm text-on-surface-variant">هیچ گروهی یافت نشد</div>
                    ) : (
                        <>
                            <div className="p-2 border-b border-outline-variant/10">
                                <div className="relative">
                                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                           placeholder="جستجو..."
                                           className="w-full bg-surface-container-lowest border border-outline rounded-lg h-8 px-3 pr-8 text-xs focus:ring-1 focus:ring-primary/30 outline-none" />
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
                                </div>
                            </div>
                            <div className="divide-y divide-outline-variant/10 max-h-[400px] overflow-y-auto">
                                {leavesForParent.map(leaf => {
                                    const isSelected = selectedIds.includes(leaf.id);
                                    return (
                                        <div key={leaf.id}
                                             className={cn("flex items-center justify-between px-4 py-2.5 transition-colors",
                                                 isSelected ? "bg-primary/5" : "hover:bg-surface-container-low")}>
                                            <span className="text-sm">{leaf.title}</span>
                                            {isSelected ? (
                                                <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" />انتخاب شده</span>
                                            ) : (
                                                <button onClick={() => handleLeafClick(leaf.id)}
                                                        className={cn("text-xs", canAdd ? "text-primary hover:underline" : "text-gray-400 cursor-not-allowed")}>
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

                {/* باکس ۳: انتخاب‌شده‌ها */}
                <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden">
                    <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center gap-2">
                        <List className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold">گروههای کالای بازار شما</h4>
                        <span className="text-xs text-on-surface-variant mr-auto">{fields.length}</span>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        {fields.length === 0 ? (
                            <div className="text-center py-12 text-sm text-on-surface-variant">
                                <Package className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/20" />
                                هیچ گروهی انتخاب نشده
                            </div>
                        ) : (
                            <div className="divide-y divide-outline-variant/10">
                                {fields.map((field, index) => {
                                    const cat = allCategories.find(c => c.id === field.categoryId);
                                    const parent = allCategories.find(c => c.id === cat?.parentId);
                                    const hasLimits = field.minQuantityOverride != null || field.maxQuantityOverride != null;
                                    return (
                                        <div key={field.id} className="px-4 py-3 hover:bg-surface-container-low transition-colors group">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{cat?.title || 'نامشخص'}</p>
                                                    <p className="text-[10px] text-on-surface-variant/60 truncate">{parent?.title}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] bg-surface-container-high px-1.5 py-0.5 rounded">
                              {field.overrideUnitTitle || 'تن'}
                            </span>
                                                        {hasLimits && (
                                                            <span className="text-[10px] bg-primary/5 text-primary px-1.5 py-0.5 rounded">
                                {field.minQuantityOverride != null ? field.minQuantityOverride : '۰'} تا{' '}
                                                                {field.maxQuantityOverride != null ? field.maxQuantityOverride : '∞'}
                              </span>
                                                        )}
                                                        {canChangeUnit && (
                                                            <button type="button"
                                                                    onClick={() => fetchCategoryUnits(field.categoryId, index)}
                                                                    className="text-[10px] text-primary hover:underline">
                                                                تغییر واحد و محدوده
                                                            </button>
                                                        )}
                                                        {!canChangeUnit && <Eye className="w-3 h-3 text-gray-400" />}
                                                    </div>
                                                </div>
                                                {canRemove && (
                                                    <button type="button" onClick={() => !disabled && confirmRemove(index)}
                                                            className="p-1 hover:bg-error/10 hover:text-error rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                            disabled={disabled}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {!canRemove && <Eye className="w-3.5 h-3.5 text-gray-400" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* مودال ویزاردی واحد و محدوده فروش */}
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
                                        ? `انتخاب واحد – ${allCategories.find(c => c.id === pendingCategoryId)?.title || ''}`
                                        : `محدودهٔ فروش (${selectedUnitTitle})`}
                                </h3>
                            </div>
                            <button onClick={() => { setShowUnitModal(false); resetModalState(); }}
                                    className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-4">
                            {modalStep === 1 ? (
                                <>
                                    {isLoadingUnits ? (
                                        <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
                                    ) : selectedCategoryUnits.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-on-surface-variant">
                                            <p>هیچ واحدی برای این دسته‌بندی تعریف نشده.</p>
                                            <button onClick={() => { setSelectedUnitId('default'); setSelectedUnitTitle('تن'); setModalStep(2); }}
                                                    className="mt-3 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm">
                                                ادامه با واحد پیش‌فرض (تن)
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedCategoryUnits.map((unit: any) => (
                                                <button key={unit.id}
                                                        onClick={() => { setSelectedUnitId(unit.id); setSelectedUnitTitle(unit.title); setModalStep(2); }}
                                                        className="w-full text-right px-4 py-3 hover:bg-surface-container-low rounded-xl flex items-center justify-between text-sm border border-outline-variant/20 hover:border-primary/30 transition-all">
                                                    <span className="font-medium">{unit.title}</span>
                                                    <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">{unit.shortCode}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-5">
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