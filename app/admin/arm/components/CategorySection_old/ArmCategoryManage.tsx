// app/admin/arm/components/CategorySection/ArmCategoryManager.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
    Search, X, Sparkles, TreePine, ShoppingCart, Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCategoriesFlat, useUnits } from '@/lib/api/apiHooks';

import type { TreeNode, DeleteConfirmData } from './types';
import {
    MIN_SEARCH_CHARS,
    MAIN_SEARCH_DEBOUNCE_MS,
    toFa,
    normalizeFa,
    useDebouncedValue,
    removeEmptyFolders,
    removeNodeFromTree,
    addNodeToTree,
    updateNodeInTree,
    buildChildrenMap,
    collectTreeIds,
    getAllDescendantIds,
    filterTreeBySearch,
    findNodeInTree,
} from './utils';

import { EmptyState } from './EmptyState';
import { ReferencePickerModal } from './ReferencePickerModal';
import { QuickAddChildrenModal } from './QuickAddChildrenModal';
import { CategoryPickerModal } from './CategoryPickerModal';
import { UnitSettingsModal } from './UnitSettingsModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ScopeTreePanel } from './ScopeTreePanel';
import { FinalTreePanel } from './FinalTreePanel';

// ═══════════════════════════════════════════
// کامپوننت‌های UI کوچک (فقط اینجا)
// ═══════════════════════════════════════════

function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode; label: string; value: string; color: string;
}) {
    const colors: Record<string, string> = {
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    };
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-3 sm:p-4 flex items-center gap-3">
            <div className={cn('p-2 sm:p-2.5 rounded-xl flex-shrink-0', colors[color] || colors.amber)}>
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 truncate">{value}</div>
                <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{label}</div>
            </div>
        </div>
    );
}

function PanelHeader({ icon, title, subtitle, count, color, children }: {
    icon: React.ReactNode; title: string; subtitle?: string; count?: number;
    color: 'amber' | 'blue'; children?: React.ReactNode;
}) {
    const colorMap = color === 'blue'
        ? { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' }
        : { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };
    return (
        <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 border-b-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 min-w-0">
                <div className={cn('p-2 rounded-xl flex-shrink-0', colorMap.bg, colorMap.text)}>{icon}</div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{title}</h3>
                        {count !== undefined && (
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 tabular-nums', colorMap.bg, colorMap.text)}>
                                {toFa(count)}
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>}
                </div>
            </div>
            {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
        </div>
    );
}

// ═══════════════════════════════════════════
// کامپوننت اصلی
// ═══════════════════════════════════════════

interface ArmCategoryManagerProps {
    onSave?: () => void;
    isAdmin?: boolean;
}

export function ArmCategoryManager({ onSave, isAdmin = false }: ArmCategoryManagerProps) {
    const { setValue } = useFormContext();

    const { data: allCategories = [], isLoading: isCategoriesLoading } = useCategoriesFlat();
    const { data: allUnitsList = [] } = useUnits();

    const formAllowedCategoryScopeTree = useWatch({ name: 'allowedCategoryScopeTree' }) || [];
    const formCategoryTree = useWatch({ name: 'categoryTree' }) || [];
    const armAdminPermission = useWatch({ name: 'config.armAdminPermission' }) || {};

    const categoriesAccess = armAdminPermission.categories || {};
    const canAdd = isAdmin || categoriesAccess.canAdd === true;
    const canRemove = isAdmin || categoriesAccess.canRemove === true;

    // ─────────── State ───────────
    const [mobileTab, setMobileTab] = useState<'scope' | 'final'>('scope');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const [showReferencePicker, setShowReferencePicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [pickerParentId, setPickerParentId] = useState<string | null>(null);

    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddParentId, setQuickAddParentId] = useState<string | null>(null);

    const [showUnitSettings, setShowUnitSettings] = useState(false);
    const [unitSettingsNodeId, setUnitSettingsNodeId] = useState<string | null>(null);

    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmData | null>(null);

    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
    const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | 'inside' | null>(null);

    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingLabel, setEditingLabel] = useState('');
    const [editingTree, setEditingTree] = useState<'scope' | 'final'>('final');

    const debouncedSearchTerm = useDebouncedValue(searchTerm, MAIN_SEARCH_DEBOUNCE_MS);
    const isMainSearchActive = normalizeFa(debouncedSearchTerm.trim()).length >= MIN_SEARCH_CHARS;
    const mainSearchRawLen = normalizeFa(searchTerm.trim()).length;

    // ─────────── Computed ───────────
    const allowedCategoryScopeTree = useMemo(
        () => (Array.isArray(formAllowedCategoryScopeTree) ? formAllowedCategoryScopeTree : []),
        [formAllowedCategoryScopeTree],
    );

    const categoryTree = useMemo(
        () => (Array.isArray(formCategoryTree) ? formCategoryTree : []),
        [formCategoryTree],
    );

    const referenceChildrenMap = useMemo(() => buildChildrenMap(allCategories), [allCategories]);
    const scopeTreeIds = useMemo(() => collectTreeIds(allowedCategoryScopeTree), [allowedCategoryScopeTree]);

    const finalTreeIds = useMemo(() => {
        const ids = new Set<string>();
        const collect = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                ids.add(node.categoryId || node.id);
                if (node.children) collect(node.children);
            }
        };
        collect(categoryTree);
        return ids;
    }, [categoryTree]);

    const scopeLeafCount = useMemo(() => {
        let count = 0;
        const countLeaves = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                if ((node.children?.length ?? 0) === 0) count++;
                if (node.children) countLeaves(node.children);
            }
        };
        countLeaves(allowedCategoryScopeTree);
        return count;
    }, [allowedCategoryScopeTree]);

    const finalLeafCount = useMemo(() => {
        let count = 0;
        const countLeaves = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                if (node.isLeaf === true || (node.children?.length ?? 0) === 0) count++;
                if (node.children) countLeaves(node.children);
            }
        };
        countLeaves(categoryTree);
        return count;
    }, [categoryTree]);

    const filteredScopeTree = useMemo(() => {
        if (!isMainSearchActive) return allowedCategoryScopeTree;
        return filterTreeBySearch(allowedCategoryScopeTree, debouncedSearchTerm);
    }, [allowedCategoryScopeTree, debouncedSearchTerm, isMainSearchActive]);

    const filteredFinalTree = useMemo(() => {
        if (!isMainSearchActive) return categoryTree;
        return filterTreeBySearch(categoryTree, debouncedSearchTerm);
    }, [categoryTree, debouncedSearchTerm, isMainSearchActive]);

    useEffect(() => {
        if (!isMainSearchActive) return;
        setExpandedNodes(prev => {
            const next = new Set(prev);
            const collect = (nodes: TreeNode[]) => {
                for (const n of nodes) {
                    next.add(n.id);
                    if (n.children && n.children.length > 0) collect(n.children);
                }
            };
            collect(filteredScopeTree);
            collect(filteredFinalTree);
            return next;
        });
    }, [isMainSearchActive, filteredScopeTree, filteredFinalTree]);

    const quickAddParentNode = useMemo(
        () => (quickAddParentId ? findNodeInTree(allowedCategoryScopeTree, quickAddParentId) : null),
        [quickAddParentId, allowedCategoryScopeTree],
    );

    const unitSettingsNode = useMemo(
        () => (unitSettingsNodeId ? findNodeInTree(categoryTree, unitSettingsNodeId) : null),
        [unitSettingsNodeId, categoryTree],
    );

    const deleteDescendantCount = useMemo(() => {
        if (!deleteConfirm) return 0;
        const source = deleteConfirm.tree === 'final' ? categoryTree : allowedCategoryScopeTree;
        const node = findNodeInTree(source, deleteConfirm.nodeId);
        return node ? getAllDescendantIds(node).length : 0;
    }, [deleteConfirm, categoryTree, allowedCategoryScopeTree]);

    // ─────────── Actions ───────────
    const saveScopeTree = useCallback((newTree: TreeNode[]) => {
        setValue('allowedCategoryScopeTree', newTree, { shouldDirty: true });
        if (onSave) onSave();
    }, [setValue, onSave]);

    const saveFinalTree = useCallback((newTree: TreeNode[]) => {
        setValue('categoryTree', newTree, { shouldDirty: true });
        if (onSave) onSave();
    }, [setValue, onSave]);

    const handleReferencePickerConfirm = useCallback((newTree: TreeNode[]) => {
        saveScopeTree(newTree);
        setShowReferencePicker(false);
        toast.success('درخت مجاز به‌روزرسانی شد');
    }, [saveScopeTree]);

    const handleQuickAddConfirm = useCallback((newTree: TreeNode[], addedCount: number) => {
        saveScopeTree(newTree);
        setShowQuickAdd(false);
        if (quickAddParentId) setExpandedNodes(prev => new Set([...prev, quickAddParentId]));
        setQuickAddParentId(null);
        toast.success(`${toFa(addedCount)} مورد به درخت مجاز اضافه شد`);
    }, [saveScopeTree, quickAddParentId]);

    const handleRemoveFromScope = useCallback((nodeId: string) => {
        let newTree = removeNodeFromTree(allowedCategoryScopeTree, nodeId);
        newTree = removeEmptyFolders(newTree, referenceChildrenMap);
        saveScopeTree(newTree);
        toast.success('حذف شد');
    }, [allowedCategoryScopeTree, saveScopeTree, referenceChildrenMap]);

    const handleAddToFinal = useCallback((node: TreeNode) => {
        if (finalTreeIds.has(node.id)) return;
        const hasChildrenInScope = (node.children?.length ?? 0) > 0;
        const leafNode: TreeNode = {
            id: node.id,
            title: node.customLabel || node.title,
            categoryId: node.id,
            isLeaf: !hasChildrenInScope,
            children: [],
            customLabel: node.customLabel || null,
            example: node.example || null,
        };
        saveFinalTree([...categoryTree, leafNode]);
        toast.success('دسته‌بندی اضافه شد');
    }, [categoryTree, finalTreeIds, saveFinalTree]);

    const handleAddGroup = useCallback((parentId: string | null) => {
        const newNode: TreeNode = {
            id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: 'گروه جدید',
            children: [],
            isLeaf: false,
            isManualGroup: true,
        };
        const newTree = addNodeToTree(categoryTree, parentId, newNode);
        saveFinalTree(newTree);
        if (parentId) setExpandedNodes(prev => new Set([...prev, parentId]));
        setEditingNodeId(newNode.id);
        setEditingLabel('گروه جدید');
        setEditingTree('final');
    }, [categoryTree, saveFinalTree]);

    const handleConfirmCategoryPicker = useCallback((categories: TreeNode[]) => {
        if (categories.length === 0) {
            setShowCategoryPicker(false);
            setPickerParentId(null);
            return;
        }
        let newTree = categoryTree;
        for (const cat of categories) {
            const hasChildrenInScope = (cat.children?.length ?? 0) > 0;
            const leafNode: TreeNode = {
                id: cat.id,
                title: cat.customLabel || cat.title,
                categoryId: cat.id,
                isLeaf: !hasChildrenInScope,
                children: [],
                customLabel: cat.customLabel || null,
                example: cat.example || null,
            };
            newTree = addNodeToTree(newTree, pickerParentId, leafNode);
        }
        saveFinalTree(newTree);
        if (pickerParentId) setExpandedNodes(prev => new Set([...prev, pickerParentId]));
        setShowCategoryPicker(false);
        setPickerParentId(null);
        toast.success(`${toFa(categories.length)} دسته‌بندی اضافه شد`);
    }, [categoryTree, pickerParentId, saveFinalTree]);

    const handleRemoveFromFinal = useCallback((nodeId: string) => {
        const newTree = removeNodeFromTree(categoryTree, nodeId);
        saveFinalTree(newTree);
        toast.success('حذف شد');
    }, [categoryTree, saveFinalTree]);

    const handleSaveLabel = useCallback((nodeId: string) => {
        const value = editingLabel.trim();
        if (!value) return;
        const sourceTree = editingTree === 'final' ? categoryTree : allowedCategoryScopeTree;
        const newTree = updateNodeInTree(sourceTree, nodeId, { title: value });
        if (editingTree === 'final') saveFinalTree(newTree);
        else saveScopeTree(newTree);
        setEditingNodeId(null);
        setEditingLabel('');
        toast.success('عنوان ذخیره شد');
    }, [editingLabel, editingTree, categoryTree, allowedCategoryScopeTree, saveFinalTree, saveScopeTree]);

    const saveUnitSettings = useCallback((nodeId: string, settings: Partial<TreeNode>) => {
        const newTree = updateNodeInTree(categoryTree, nodeId, settings);
        saveFinalTree(newTree);
        setShowUnitSettings(false);
        setUnitSettingsNodeId(null);
        toast.success('تنظیمات واحد ذخیره شد');
    }, [categoryTree, saveFinalTree]);

    // ─────────── Drag & Drop ───────────
    const insertNodeAtPosition = useCallback((
        nodes: TreeNode[],
        targetId: string,
        draggedNode: TreeNode,
        position: 'before' | 'after' | 'inside',
    ): TreeNode[] => {
        const result: TreeNode[] = [];
        for (const node of nodes) {
            if (node.id === targetId) {
                if (position === 'before') { result.push(draggedNode); result.push(node); }
                else if (position === 'after') { result.push(node); result.push(draggedNode); }
                else { result.push({ ...node, children: [...(node.children || []), draggedNode] }); }
            } else {
                result.push({
                    ...node,
                    children: node.children ? insertNodeAtPosition(node.children, targetId, draggedNode, position) : [],
                });
            }
        }
        return result;
    }, []);

    const isInSubtree = useCallback((ancestorId: string, candidateId: string): boolean => {
        const ancestor = findNodeInTree(categoryTree, ancestorId);
        if (!ancestor) return false;
        return !!findNodeInTree(ancestor.children || [], candidateId);
    }, [categoryTree]);

    const handleDragStart = (e: React.DragEvent, nodeId: string) => {
        setDraggedNodeId(nodeId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', nodeId);
    };

    const handleDragEnd = () => {
        setDraggedNodeId(null);
        setDragOverNodeId(null);
        setDragOverPosition(null);
    };

    const handleDragOver = (e: React.DragEvent, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedNodeId || draggedNodeId === nodeId) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        let position: 'before' | 'after' | 'inside';
        if (y < height * 0.25) position = 'before';
        else if (y > height * 0.75) position = 'after';
        else position = 'inside';
        setDragOverNodeId(nodeId);
        setDragOverPosition(position);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedNodeId || draggedNodeId === targetId || !dragOverPosition) return;
        if (dragOverPosition === 'inside' && isInSubtree(draggedNodeId, targetId)) {
            toast.error('نمی‌توانید یک گروه را داخل زیرمجموعه خودش قرار دهید');
            handleDragEnd();
            return;
        }
        const draggedNode = findNodeInTree(categoryTree, draggedNodeId);
        if (!draggedNode) return;
        const nodeCopy: TreeNode = JSON.parse(JSON.stringify(draggedNode));
        let newTree = removeNodeFromTree(categoryTree, draggedNodeId);
        newTree = insertNodeAtPosition(newTree, targetId, nodeCopy, dragOverPosition);
        saveFinalTree(newTree);
        handleDragEnd();
        toast.success('جابجا شد');
    };

    const toggleNode = (nodeId: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    };

    const openQuickAdd = useCallback((nodeId: string) => {
        setQuickAddParentId(nodeId);
        setShowQuickAdd(true);
    }, []);

    const startEdit = useCallback((nodeId: string, title: string, tree: 'scope' | 'final') => {
        setEditingNodeId(nodeId);
        setEditingLabel(title);
        setEditingTree(tree);
    }, []);

    const handleDelete = useCallback((nodeId: string, title: string, tree: 'scope' | 'final') => {
        setDeleteConfirm({ nodeId, title, tree });
    }, []);

    if (isCategoriesLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={<TreePine className="w-5 h-5" />} label="مرجع" value={toFa(allCategories.length)} color="amber" />
                <StatCard icon={<Layers className="w-5 h-5" />} label="مجاز" value={toFa(scopeTreeIds.size)} color="orange" />
                <StatCard icon={<ShoppingCart className="w-5 h-5" />} label="نهایی" value={toFa(finalLeafCount)} color="emerald" />
                <StatCard icon={<Sparkles className="w-5 h-5" />} label="پوشش" value={`${scopeLeafCount > 0 ? Math.round((finalLeafCount / scopeLeafCount) * 100) : 0}%`} color="blue" />
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="جستجو..."
                    className="w-full h-12 pr-11 pl-11 bg-white border-2 border-gray-200 rounded-2xl text-sm"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Mobile Tabs */}
            <div className="sm:hidden flex bg-gray-100 rounded-2xl p-1">
                <button onClick={() => setMobileTab('scope')} className={cn('flex-1 py-3 rounded-xl', mobileTab === 'scope' ? 'bg-white text-amber-600' : 'text-gray-500')}>
                    مجاز
                </button>
                <button onClick={() => setMobileTab('final')} className={cn('flex-1 py-3 rounded-xl', mobileTab === 'final' ? 'bg-white text-blue-600' : 'text-gray-500')}>
                    نهایی
                </button>
            </div>

            {/* Desktop */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-4">
                <ScopeTreePanel
                    tree={allowedCategoryScopeTree}
                    filteredTree={filteredScopeTree}
                    isSearchActive={isMainSearchActive}
                    scopeTreeIds={scopeTreeIds}
                    canAdd={canAdd}
                    canRemove={canRemove}
                    isAdmin={isAdmin}
                    onOpenReferencePicker={() => setShowReferencePicker(true)}
                    onToggleNode={toggleNode}
                    onOpenQuickAdd={openQuickAdd}
                    onAddToFinal={handleAddToFinal}
                    onStartEdit={startEdit}
                    onSaveLabel={handleSaveLabel}
                    onSetEditingLabel={setEditingLabel}
                    onSetEditingNodeId={setEditingNodeId}
                    onDelete={handleDelete}
                    expandedNodes={expandedNodes}
                    finalTreeIds={finalTreeIds}
                    referenceChildrenMap={referenceChildrenMap}
                    editingNodeId={editingNodeId}
                    editingLabel={editingLabel}
                    editingTree={editingTree}
                />
                <FinalTreePanel
                    tree={categoryTree}
                    filteredTree={filteredFinalTree}
                    isSearchActive={isMainSearchActive}
                    finalLeafCount={finalLeafCount}
                    onAddGroup={handleAddGroup}
                    onOpenCategoryPicker={(parentId) => { setPickerParentId(parentId); setShowCategoryPicker(true); }}
                    onToggleNode={toggleNode}
                    onStartEdit={startEdit}
                    onSaveLabel={handleSaveLabel}
                    onSetEditingLabel={setEditingLabel}
                    onSetEditingNodeId={setEditingNodeId}
                    onDelete={handleDelete}
                    onOpenUnitSettings={(nodeId) => { setUnitSettingsNodeId(nodeId); setShowUnitSettings(true); }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    expandedNodes={expandedNodes}
                    editingNodeId={editingNodeId}
                    editingLabel={editingLabel}
                    editingTree={editingTree}
                    draggedNodeId={draggedNodeId}
                    dragOverNodeId={dragOverNodeId}
                    dragOverPosition={dragOverPosition}
                />
            </div>

            {/* Mobile */}
            <div className="sm:hidden">
                {mobileTab === 'scope' ? (
                    <ScopeTreePanel
                        tree={allowedCategoryScopeTree}
                        filteredTree={filteredScopeTree}
                        isSearchActive={isMainSearchActive}
                        scopeTreeIds={scopeTreeIds}
                        canAdd={canAdd}
                        canRemove={canRemove}
                        isAdmin={isAdmin}
                        onOpenReferencePicker={() => setShowReferencePicker(true)}
                        onToggleNode={toggleNode}
                        onOpenQuickAdd={openQuickAdd}
                        onAddToFinal={handleAddToFinal}
                        onStartEdit={startEdit}
                        onSaveLabel={handleSaveLabel}
                        onSetEditingLabel={setEditingLabel}
                        onSetEditingNodeId={setEditingNodeId}
                        onDelete={handleDelete}
                        expandedNodes={expandedNodes}
                        finalTreeIds={finalTreeIds}
                        referenceChildrenMap={referenceChildrenMap}
                        editingNodeId={editingNodeId}
                        editingLabel={editingLabel}
                        editingTree={editingTree}
                    />
                ) : (
                    <FinalTreePanel
                        tree={categoryTree}
                        filteredTree={filteredFinalTree}
                        isSearchActive={isMainSearchActive}
                        finalLeafCount={finalLeafCount}
                        onAddGroup={handleAddGroup}
                        onOpenCategoryPicker={(parentId) => { setPickerParentId(parentId); setShowCategoryPicker(true); }}
                        onToggleNode={toggleNode}
                        onStartEdit={startEdit}
                        onSaveLabel={handleSaveLabel}
                        onSetEditingLabel={setEditingLabel}
                        onSetEditingNodeId={setEditingNodeId}
                        onDelete={handleDelete}
                        onOpenUnitSettings={(nodeId) => { setUnitSettingsNodeId(nodeId); setShowUnitSettings(true); }}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        expandedNodes={expandedNodes}
                        editingNodeId={editingNodeId}
                        editingLabel={editingLabel}
                        editingTree={editingTree}
                        draggedNodeId={draggedNodeId}
                        dragOverNodeId={dragOverNodeId}
                        dragOverPosition={dragOverPosition}
                    />
                )}
            </div>

            {/* Modals */}
            <ReferencePickerModal
                open={showReferencePicker}
                onClose={() => setShowReferencePicker(false)}
                allCategories={allCategories}
                currentScopeTree={allowedCategoryScopeTree}
                onConfirm={handleReferencePickerConfirm}
            />
            <QuickAddChildrenModal
                open={showQuickAdd}
                onClose={() => { setShowQuickAdd(false); setQuickAddParentId(null); }}
                parentNode={quickAddParentNode}
                allCategories={allCategories}
                currentScopeTree={allowedCategoryScopeTree}
                onConfirm={handleQuickAddConfirm}
            />
            <CategoryPickerModal
                open={showCategoryPicker}
                onClose={() => { setShowCategoryPicker(false); setPickerParentId(null); }}
                scopeTree={allowedCategoryScopeTree}
                finalUsedIds={finalTreeIds}
                onConfirm={handleConfirmCategoryPicker}
            />
            <UnitSettingsModal
                open={showUnitSettings}
                onClose={() => { setShowUnitSettings(false); setUnitSettingsNodeId(null); }}
                node={unitSettingsNode}
                units={allUnitsList}
                onSave={saveUnitSettings}
            />
            <DeleteConfirmModal
                open={!!deleteConfirm}
                data={deleteConfirm}
                descendantCount={deleteDescendantCount}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={(nodeId, tree) => {
                    if (tree === 'final') handleRemoveFromFinal(nodeId);
                    else handleRemoveFromScope(nodeId);
                    setDeleteConfirm(null);
                }}
            />
        </div>
    );
}