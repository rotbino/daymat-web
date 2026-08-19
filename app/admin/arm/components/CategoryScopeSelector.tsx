// app/admin/arm/components/CategoryScopeSelector.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Search, X, Check, ChevronRight, Plus, Building2, AlertCircle, AlertTriangle, Lock, Eye } from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CategoryScopeSelectorProps {
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    disabled?: boolean;
    categorySelections?: any[];
    onSave?: () => void;
    onScopeSelect?: (scopeId: string | null) => void;
    activeScopeId?: string | null;
    isAdmin?: boolean;
    // ✅ دسترسی‌های جدید
    canAddScope?: boolean;
    canRemoveScope?: boolean;
}

interface CategoryNode {
    id: string;
    title: string;
    path: string;
    level: number;
    parentId?: string;
    children?: CategoryNode[];
}

export function CategoryScopeSelector({
                                          watch, setValue, disabled = false, categorySelections = [],
                                          onSave, onScopeSelect, activeScopeId = null,
                                          isAdmin = false,
                                          canAddScope = false,
                                          canRemoveScope = false,
                                      }: CategoryScopeSelectorProps) {
    const [allCategories, setAllCategories] = useState<CategoryNode[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string; childCount: number } | null>(null);

    // ✅ گرفتن دسترسی از armAdminPermission
    const armAdminPermission = watch('config.armAdminPermission') || {};
    const categoriesAccess = armAdminPermission.categories || {};

    // ✅ ترکیب دسترسی‌ها
    const _canAddScope = isAdmin || canAddScope || categoriesAccess.canAddScope === true;
    const _canRemoveScope = isAdmin || canRemoveScope || categoriesAccess.canRemoveScope === true;
    const _canView = isAdmin || categoriesAccess.canView !== false;

    const isOwnerWithNoAccess = !isAdmin && !_canAddScope && !_canRemoveScope;

    const selectedIds: string[] = watch('config.allowedCategoryScope') || [];

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            try {
                const data = await apiService.admin.categories.getAllFlat();
                const branches = data.filter((cat: any) => cat.level === 0 || cat.level === 1);
                setAllCategories(branches);
            } catch (error) {
                toast.error('خطا در دریافت دسته‌بندی‌ها');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const categoryTree = useMemo(() => {
        const map = new Map<string, CategoryNode>();
        const roots: CategoryNode[] = [];
        for (const cat of allCategories) {
            map.set(cat.id, { ...cat, children: [] });
        }
        for (const [id, node] of map) {
            if (node.level === 0) roots.push(node);
            else if (node.parentId && map.has(node.parentId)) {
                map.get(node.parentId)?.children?.push(node);
            }
        }
        return roots;
    }, [allCategories]);

    const getDescendants = (nodeId: string) => {
        const node = allCategories.find(c => c.id === nodeId);
        if (!node) return [];
        return allCategories.filter(c => c.path.startsWith(node.path + '.'));
    };

    const isDeletable = (scopeId: string) => {
        return !categorySelections.some((sel: any) => {
            const category = allCategories.find(c => c.id === sel.categoryId);
            if (!category) return false;
            return category.path.includes(scopeId) && category.id !== scopeId;
        });
    };

    const addScope = (id: string) => {
        if (!_canAddScope) return;
        if (selectedIds.includes(id)) {
            toast.info('این شاخه قبلاً انتخاب شده است');
            return;
        }
        setValue('config.allowedCategoryScope', [...selectedIds, id]);
        setShowAddModal(false);
        toast.success('زمینه فعالیت اضافه شد');
        if (onSave) onSave();
        if (onScopeSelect) onScopeSelect(id);
    };

    const confirmRemoveScope = (id: string) => {
        if (!_canRemoveScope) return;
        const category = allCategories.find(c => c.id === id);
        const childCount = getDescendants(id).filter(c =>
            categorySelections.some((sel: any) => sel.categoryId === c.id)
        ).length;

        if (!isDeletable(id)) {
            toast.warning('این زمینه فعالیت دارای زیرمجموعه انتخاب‌شده است و قابل حذف نیست');
            return;
        }

        setDeleteConfirm({
            id,
            title: category?.title || id,
            childCount,
        });
    };

    const removeScope = () => {
        if (!deleteConfirm || !_canRemoveScope) return;
        const newSelected = selectedIds.filter((i: string) => i !== deleteConfirm.id);
        setValue('config.allowedCategoryScope', newSelected);
        setDeleteConfirm(null);
        toast.success('زمینه فعالیت حذف شد');
        if (onSave) onSave();
        if (onScopeSelect) {
            onScopeSelect(newSelected.length > 0 ? newSelected[0] : null);
        }
    };

    const filteredTree = useMemo(() => {
        if (!searchTerm.trim()) return categoryTree;
        const filterNodes = (nodes: CategoryNode[]): CategoryNode[] => {
            const result: CategoryNode[] = [];
            for (const node of nodes) {
                const matches = node.title.includes(searchTerm);
                const children = node.children ? filterNodes(node.children) : [];
                if (matches || children.length > 0) {
                    result.push({ ...node, children: matches ? node.children : children });
                }
            }
            return result;
        };
        return filterNodes(categoryTree);
    }, [categoryTree, searchTerm]);

    if (isLoading) {
        return <div className="flex items-center justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
    }

    // ============================================================
    // حالت فقط مشاهده برای مالک بدون دسترسی
    // ============================================================
    if (isOwnerWithNoAccess && !_canView) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-semibold text-on-surface">زمینه فعالیت بازار</h4>
                        <p className="text-xs text-on-surface-variant">فقط قابل مشاهده</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant/50">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[10px]">فقط مشاهده</span>
                    </div>
                </div>

                {selectedIds.length === 0 ? (
                    <div className="bg-gray-50/50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700 p-3 rounded-lg text-center text-sm text-gray-400">
                        هیچ زمینه فعالیتی تعیین نشده است
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2 p-2 bg-gray-50/30 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-700 rounded-lg">
                        {selectedIds.map((id: string) => {
                            const category = allCategories.find(c => c.id === id);
                            return (
                                <span key={id} className="px-3 py-1.5 rounded-full text-sm font-medium bg-surface text-on-surface-variant flex items-center gap-1.5">
                                    <Building2 className="w-3 h-3" />
                                    {category?.title || id}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ============================================================
    // حالت کامل با دسترسی‌ها
    // ============================================================
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-semibold text-on-surface">زمینه فعالیت بازار</h4>
                    <p className="text-xs text-on-surface-variant">
                        برای فیلتر کردن گروه‌ها، روی هر زمینه کلیک کنید
                        {!_canAddScope && !isAdmin && ' - فقط قابل مشاهده'}
                    </p>
                </div>
                {_canAddScope && (
                    <button type="button" onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-1 bg-primary text-on-primary px-3 py-1.5 text-sm rounded-lg hover:bg-primary/90 transition-colors">
                        <Plus className="w-4 h-4" />افزودن
                    </button>
                )}
                {!_canAddScope && !isAdmin && (
                    <div className="flex items-center gap-1.5 text-on-surface-variant/50">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[10px]">فقط مشاهده</span>
                    </div>
                )}
            </div>

            {selectedIds.length === 0 ? (
                <div className={cn(
                    "border border-dashed p-3 rounded-lg text-center text-sm",
                    isOwnerWithNoAccess ? 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 text-gray-400' : 'bg-surface-container-low border-outline-variant text-on-surface-variant'
                )}>
                    هیچ زمینه فعالیتی تعیین نشده است
                </div>
            ) : (
                <div className={cn(
                    "flex flex-wrap gap-2 p-2 border rounded-lg",
                    isOwnerWithNoAccess ? 'bg-gray-50/30 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700' : 'bg-surface-container-low border-outline-variant'
                )}>
                    {/*<button type="button" onClick={() => onScopeSelect && onScopeSelect(null)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                activeScopeId === null ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                            }`}>
                        همه گروه‌ها
                        <span className="text-xs opacity-70 mr-1">({categorySelections?.length || 0})</span>
                    </button>*/}

                    {selectedIds.map((id: string) => {
                        const category = allCategories.find(c => c.id === id);
                        const deletable = isDeletable(id);
                        const childCount = getDescendants(id).filter(c =>
                            categorySelections.some((sel: any) => sel.categoryId === c.id)
                        ).length;

                        return (
                            <button type="button" key={id}
                                    onClick={() => onScopeSelect && onScopeSelect(id)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                        activeScopeId === id ? 'bg-primary text-on-primary' : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                                    }`}>
                                <Building2 className="w-3 h-3" />
                                {category?.title || id}
                                {childCount > 0 && <span className="text-xs opacity-70">({childCount})</span>}
                                {_canRemoveScope && (
                                    <span
                                        onClick={(e) => { e.stopPropagation(); confirmRemoveScope(id); }}
                                        className={`p-0.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer ${
                                            activeScopeId === id ? 'text-on-primary' : 'text-on-surface-variant'
                                        }`}
                                        title={deletable ? 'حذف' : 'به دلیل وجود زیرمجموعه قابل حذف نیست'}>
                                        {deletable ? <X className="w-3 h-3" /> : '🔒'}
                                    </span>
                                )}
                                {!_canRemoveScope && !isAdmin && (
                                    <Eye className="w-3 h-3 text-on-surface-variant/30" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* مودال افزودن */}
            {showAddModal && _canAddScope && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
                    <div className="bg-surface p-6 rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">افزودن زمینه فعالیت</h3>
                            <button type="button" onClick={() => { setShowAddModal(false); setSearchTerm(''); }}
                                    className="text-on-surface-variant hover:text-primary transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="relative mb-4">
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                   placeholder="جستجوی شاخه..."
                                   className="w-full bg-surface-container-lowest border border-outline h-10 px-4 pr-10 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded-lg" />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-0.5 max-h-[55vh] border border-outline-variant rounded-lg p-2 bg-surface-container-lowest">
                            {filteredTree.length === 0 ? (
                                <div className="text-center py-8 text-sm text-on-surface-variant">
                                    {searchTerm ? 'هیچ شاخه‌ای یافت نشد' : 'هیچ شاخه‌ای موجود نیست'}
                                </div>
                            ) : renderTree(filteredTree, selectedIds, addScope, setExpandedNodes, expandedNodes)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-outline-variant text-xs text-on-surface-variant flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" /> انتخاب شاخه = محدود شدن بازار به زیرمجموعه‌های آن
                        </div>
                    </div>
                </div>
            )}

            {/* مودال تأیید حذف */}
            {deleteConfirm && _canRemoveScope && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />تأیید حذف
                            </h3>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-sm text-on-surface">
                                آیا از حذف زمینه فعالیت <span className="font-semibold">«{deleteConfirm.title}»</span> اطمینان دارید؟
                            </p>
                            {deleteConfirm.childCount > 0 && (
                                <p className="text-xs text-warning">
                                    ⚠️ {deleteConfirm.childCount} زیرمجموعه انتخاب‌شده در این شاخه وجود دارد.
                                </p>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setDeleteConfirm(null)}
                                        className="flex-1 h-10 border border-outline rounded-xl text-sm">انصراف</button>
                                <button type="button" onClick={removeScope}
                                        className="flex-1 h-10 bg-error text-on-error rounded-xl text-sm hover:bg-error/90">حذف</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function renderTree(
    nodes: CategoryNode[], selectedIds: string[], onAdd: (id: string) => void,
    setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>,
    expandedNodes: Set<string>, level: number = 0
): React.ReactNode {
    return nodes.map((node) => {
        const isSelected = selectedIds.includes(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);

        return (
            <div key={node.id} className="space-y-0.5">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}
                     style={{ paddingRight: `${level * 20 + 12}px` }}>
                    {hasChildren && (
                        <button type="button" onClick={() => {
                            const next = new Set(expandedNodes);
                            if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
                            setExpandedNodes(next);
                        }} className="p-0.5 hover:bg-surface-container rounded">
                            <ChevronRight className={`w-4 h-4 text-on-surface-variant transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                    )}
                    {!hasChildren && <span className="w-5" />}
                    <span className={`flex-1 text-right text-sm ${isSelected ? 'text-primary font-medium' : 'text-on-surface'}`}>{node.title}</span>
                    {isSelected ? (
                        <span className="text-primary text-sm flex items-center gap-1"><Check className="w-4 h-4" />انتخاب شده</span>
                    ) : (
                        <button type="button" onClick={() => onAdd(node.id)} className="text-primary text-sm hover:underline">انتخاب</button>
                    )}
                </div>
                {hasChildren && isExpanded && node.children && (
                    <div className="space-y-0.5">
                        {renderTree(node.children, selectedIds, onAdd, setExpandedNodes, expandedNodes, level + 1)}
                    </div>
                )}
            </div>
        );
    });
}