// app/admin/arm/components/CategorySection/ArmCategoryManager.tsx
'use client';

import React, {useState, useMemo, useCallback, useEffect} from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
    Search,  ChevronLeft, Plus, Trash2,
    Package, Layers, X, FolderPlus, Check,
    Sparkles, TreePine, ShoppingCart, ArrowRightLeft,
    GripVertical, Edit3, Settings, FolderOpen, Folder
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCategoriesFlat, useUnits } from '@/lib/api/apiHooks';

interface ArmCategoryManagerProps {
    onSave?: () => void;
    isAdmin?: boolean;
}

// ============================================================
// Types
// ============================================================
interface TreeNode {
    id: string;
    title: string;
    categoryId?: string;
    parentId?: string | null;
    children?: TreeNode[];
    isLeaf?: boolean;
    overrideUnitId?: string;
    overrideUnitTitle?: string;
    customLabel?: string;
    path?: string;
    level?: number;
    [key: string]: any;
}

interface UnitInfo {
    id: string;
    title: string;
    shortCode: string;
}

// ============================================================
// Helper Functions
// ============================================================

function removeEmptyFolders(nodes: TreeNode[]): TreeNode[] {
    return nodes
        .map(node => ({
            ...node,
            children: node.children ? removeEmptyFolders(node.children) : [],
        }))
        .filter(node => {
            if (node.isLeaf) return true;
            if (node.children && node.children.length > 0) return true;
            return false;
        });
}

function removeNodeFromTree(nodes: TreeNode[], nodeId: string): TreeNode[] {
    return nodes
        .filter(node => node.id !== nodeId)
        .map(node => ({
            ...node,
            children: node.children ? removeNodeFromTree(node.children, nodeId) : [],
        }));
}

function addNodeToTree(nodes: TreeNode[], parentId: string | null, newNode: TreeNode): TreeNode[] {
    if (parentId === null) {
        return [...nodes, newNode];
    }
    return nodes.map(node => {
        if (node.id === parentId) {
            return {
                ...node,
                children: [...(node.children || []), newNode],
            };
        }
        if (node.children) {
            return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
        }
        return node;
    });
}

function updateNodeInTree(nodes: TreeNode[], nodeId: string, updates: Partial<TreeNode>): TreeNode[] {
    return nodes.map(node => {
        if (node.id === nodeId) {
            return { ...node, ...updates };
        }
        if (node.children) {
            return { ...node, children: updateNodeInTree(node.children, nodeId, updates) };
        }
        return node;
    });
}

function buildTreeFromFlat(nodes: TreeNode[]): TreeNode[] {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    for (const node of nodes) {
        map.set(node.id, { ...node, children: [] });
    }

    for (const [, node] of map) {
        if (node.parentId && map.has(node.parentId)) {
            map.get(node.parentId)!.children!.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}

function filterTreeBySearch(nodes: TreeNode[], term: string): TreeNode[] {
    if (!term.trim()) return nodes;
    const result: TreeNode[] = [];
    for (const node of nodes) {
        const matches = node.title.includes(term) ||
            node.path?.includes(term) ||
            node.categoryId?.includes(term);
        const filteredChildren = node.children ? filterTreeBySearch(node.children, term) : [];

        if (matches || filteredChildren.length > 0) {
            result.push({
                ...node,
                children: filteredChildren.length > 0 ? filteredChildren : node.children,
            });
        }
    }
    return result;
}

function getAllDescendantIds(node: TreeNode): string[] {
    const ids: string[] = [];
    const collect = (n: TreeNode) => {
        if (n.children) {
            for (const child of n.children) {
                ids.push(child.id);
                collect(child);
            }
        }
    };
    collect(node);
    return ids;
}

function cloneWithDescendants(node: TreeNode): TreeNode {
    return {
        ...node,
        children: node.children?.map(child => cloneWithDescendants(child)) || [],
    };
}

// ============================================================
// Main Component
// ============================================================
export function ArmCategoryManager({ onSave, isAdmin = false }: ArmCategoryManagerProps) {
    const { setValue } = useFormContext();

    // ✅ استفاده از هوک‌های React Query
    const { data: allCategories = [], isLoading: isCategoriesLoading } = useCategoriesFlat();
    const { data: allUnitsList = [] } = useUnits();

    const formAllowedCategoryScopeTree = useWatch({ name: 'allowedCategoryScopeTree' }) || [];
    const formCategoryTree = useWatch({ name: 'categoryTree' }) || [];
    const armAdminPermission = useWatch({ name: 'config.armAdminPermission' }) || {};

    const categoriesAccess = armAdminPermission.categories || {};
    const canAdd = isAdmin || categoriesAccess.canAdd === true;
    const canRemove = isAdmin || categoriesAccess.canRemove === true;

    // ============================================================
    // State
    // ============================================================
    const [mobileTab, setMobileTab] = useState<'scope' | 'final'>('scope');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const [showReferencePicker, setShowReferencePicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [pickerParentId, setPickerParentId] = useState<string | null>(null);
    const [categorySearch, setCategorySearch] = useState('');

    const [showUnitSettings, setShowUnitSettings] = useState(false);
    const [unitSettingsNodeId, setUnitSettingsNodeId] = useState<string | null>(null);
    const [unitSearchTerm, setUnitSearchTerm] = useState('');

    const [deleteConfirm, setDeleteConfirm] = useState<{ nodeId: string; title: string; tree: 'scope' | 'final' } | null>(null);

    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
    const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | 'inside' | null>(null);

    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingLabel, setEditingLabel] = useState('');
    const [editingTree, setEditingTree] = useState<'scope' | 'final'>('final');

    // ============================================================
    // ✅ ensureParentInTree - داخل کامپوننت با دسترسی به allCategories
    // ============================================================
    const ensureParentInTree = useCallback((nodes: TreeNode[], parent: any): TreeNode[] => {
        if (nodes.some(n => n.id === parent.id)) return nodes;
        const parentClone: TreeNode = { ...parent, children: [] };
        let result = [...nodes, parentClone];
        if (parent.parentId) {
            const grandParent = allCategories.find((c: any) => c.id === parent.parentId);
            if (grandParent) result = ensureParentInTree(result, grandParent);
        }
        return result;
    }, [allCategories]);

    // ============================================================
    // Computed values
    // ============================================================
    const allowedCategoryScopeTree = useMemo(() => {
        return Array.isArray(formAllowedCategoryScopeTree) ? formAllowedCategoryScopeTree : [];
    }, [formAllowedCategoryScopeTree]);

    const categoryTree = useMemo(() => {
        return Array.isArray(formCategoryTree) ? formCategoryTree : [];
    }, [formCategoryTree]);

    const scopeTreeIds = useMemo(() => {
        const ids: string[] = [];
        const collect = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                ids.push(node.id);
                if (node.children) collect(node.children);
            }
        };
        collect(allowedCategoryScopeTree);
        return ids;
    }, [allowedCategoryScopeTree]);

    const finalTreeIds = useMemo(() => {
        const ids: string[] = [];
        const collect = (nodes: TreeNode[]) => {
            for (const node of nodes) {
                ids.push(node.categoryId || node.id);
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
                if (node.isLeaf || !node.children?.length) count++;
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
                if (node.isLeaf) count++;
                if (node.children) countLeaves(node.children);
            }
        };
        countLeaves(categoryTree);
        return count;
    }, [categoryTree]);

    const filteredScopeTree = useMemo(() => {
        if (!searchTerm.trim()) return allowedCategoryScopeTree;
        return filterTreeBySearch(allowedCategoryScopeTree, searchTerm);
    }, [allowedCategoryScopeTree, searchTerm]);

    const filteredFinalTree = useMemo(() => {
        if (!searchTerm.trim()) return categoryTree;
        return filterTreeBySearch(categoryTree, searchTerm);
    }, [categoryTree, searchTerm]);

    // ============================================================
    // Scope Tree Actions
    // ============================================================
    const saveScopeTree = useCallback((newTree: TreeNode[]) => {
        setValue('allowedCategoryScopeTree', newTree, { shouldDirty: true });
        if (onSave) onSave();
    }, [setValue, onSave]);

    const handleToggleFromPicker = useCallback((node: TreeNode) => {
        const descendantIds = getAllDescendantIds(node);
        const isFullyChecked = scopeTreeIds.includes(node.id) &&
            descendantIds.every(id => scopeTreeIds.includes(id));

        if (isFullyChecked) {
            let newTree = removeNodeFromTree(allowedCategoryScopeTree, node.id);
            newTree = removeEmptyFolders(JSON.parse(JSON.stringify(newTree)));
            saveScopeTree(newTree);
        } else {
            const nodeWithDescendants = cloneWithDescendants(node);
            let flatNodes: TreeNode[] = [];
            const flatten = (nodes: TreeNode[]) => {
                for (const n of nodes) {
                    flatNodes.push({ ...n });
                    if (n.children) flatten(n.children);
                }
            };
            flatten(allowedCategoryScopeTree);

            const parentChain: any[] = [];
            let current = node;
            while (current.parentId) {
                const parent = allCategories.find((c: any) => c.id === current.parentId);
                if (!parent) break;
                parentChain.unshift(parent);
                current = parent;
            }
            for (const parent of parentChain) {
                flatNodes = ensureParentInTree(flatNodes, parent);
            }

            flatNodes = flatNodes.filter(n => !descendantIds.includes(n.id) && n.id !== node.id);
            flatNodes.push(nodeWithDescendants);

            const newTree = buildTreeFromFlat(flatNodes);
            saveScopeTree(newTree);
        }
    }, [allowedCategoryScopeTree, scopeTreeIds, allCategories, ensureParentInTree, saveScopeTree]);

    const handleRemoveFromScope = useCallback((nodeId: string) => {
        let newTree = removeNodeFromTree(allowedCategoryScopeTree, nodeId);
        newTree = removeEmptyFolders(JSON.parse(JSON.stringify(newTree)));
        saveScopeTree(newTree);
        toast.success('حذف شد');
    }, [allowedCategoryScopeTree, saveScopeTree]);

    // ============================================================
    // Final Tree Actions
    // ============================================================
    const saveFinalTree = useCallback((newTree: TreeNode[]) => {
        setValue('categoryTree', newTree, { shouldDirty: true });
        if (onSave) onSave();
    }, [setValue, onSave]);

    const handleAddToFinal = useCallback((leaf: TreeNode) => {
        if (finalTreeIds.includes(leaf.id)) return;

        const leafNode: TreeNode = {
            id: leaf.id,
            title: leaf.title,
            categoryId: leaf.id,
            isLeaf: true,
        };

        const newTree = [...categoryTree, leafNode];
        saveFinalTree(newTree);
        toast.success('دسته‌بندی اضافه شد');
    }, [categoryTree, finalTreeIds, saveFinalTree]);

    const handleAddGroup = useCallback((parentId: string | null) => {
        const newNode: TreeNode = {
            id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: 'گروه جدید',
            children: [],
            isLeaf: false,
        };

        const newTree = addNodeToTree(categoryTree, parentId, newNode);
        saveFinalTree(newTree);

        if (parentId) {
            setExpandedNodes(prev => new Set([...prev, parentId]));
        }

        setEditingNodeId(newNode.id);
        setEditingLabel('گروه جدید');
        setEditingTree('final');
    }, [categoryTree, saveFinalTree]);

    const handleAddCategoryToGroup = useCallback((category: any, parentId: string | null) => {
        const leafNode: TreeNode = {
            id: category.id,
            title: category.title,
            categoryId: category.id,
            isLeaf: true,
        };

        const newTree = addNodeToTree(categoryTree, parentId, leafNode);
        saveFinalTree(newTree);

        if (parentId) {
            setExpandedNodes(prev => new Set([...prev, parentId]));
        }

        setShowCategoryPicker(false);
        setPickerParentId(null);
        toast.success('دسته‌بندی اضافه شد');
    }, [categoryTree, saveFinalTree]);

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

        if (editingTree === 'final') {
            saveFinalTree(newTree);
        } else {
            saveScopeTree(newTree);
        }

        setEditingNodeId(null);
        setEditingLabel('');
        toast.success('عنوان ذخیره شد');
    }, [editingLabel, editingTree, categoryTree, allowedCategoryScopeTree, saveFinalTree, saveScopeTree]);

    // ============================================================
    // Drag & Drop
    // ============================================================
    const findNode = useCallback((nodes: TreeNode[], nodeId: string): TreeNode | null => {
        for (const node of nodes) {
            if (node.id === nodeId) return node;
            if (node.children) {
                const found = findNode(node.children, nodeId);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const insertNodeAtPosition = useCallback((
        nodes: TreeNode[],
        targetId: string,
        draggedNode: TreeNode,
        position: 'before' | 'after' | 'inside'
    ): TreeNode[] => {
        const result: TreeNode[] = [];

        for (const node of nodes) {
            if (node.id === targetId) {
                if (position === 'before') {
                    result.push({ ...draggedNode, children: [] });
                    result.push(node);
                } else if (position === 'after') {
                    result.push(node);
                    result.push({ ...draggedNode, children: [] });
                } else {
                    result.push({
                        ...node,
                        children: [...(node.children || []), { ...draggedNode, children: [] }],
                    });
                }
            } else {
                result.push({
                    ...node,
                    children: node.children ? insertNodeAtPosition(node.children, targetId, draggedNode, position) : [],
                });
            }
        }

        return result;
    }, []);

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

        const draggedNode = findNode(categoryTree, draggedNodeId);
        if (!draggedNode) return;

        let newTree = removeNodeFromTree(categoryTree, draggedNodeId);
        newTree = insertNodeAtPosition(newTree, targetId, draggedNode, dragOverPosition);
        saveFinalTree(newTree);
        handleDragEnd();
        toast.success('جابجا شد');
    };

    // ============================================================
    // Toggle Node
    // ============================================================
    const toggleNode = (nodeId: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) newSet.delete(nodeId);
            else newSet.add(nodeId);
            return newSet;
        });
    };

    // ============================================================
    // Unit Settings
    // ============================================================
    const openUnitSettings = (nodeId: string) => {
        setUnitSettingsNodeId(nodeId);
        setShowUnitSettings(true);
    };

    const saveUnitSettings = (nodeId: string, settings: Partial<TreeNode>) => {
        const newTree = updateNodeInTree(categoryTree, nodeId, settings);
        saveFinalTree(newTree);
        setShowUnitSettings(false);
        setUnitSettingsNodeId(null);
        toast.success('تنظیمات واحد ذخیره شد');
    };

    // ============================================================
    // Render Scope Node
    // ============================================================
    const renderScopeNode = (node: TreeNode, depth: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isLeaf = !hasChildren;
        const isAdded = isLeaf && finalTreeIds.includes(node.id);
        const isEditing = editingNodeId === node.id && editingTree === 'scope';

        return (
            <div key={node.id} className="group/node">
                <div
                    className={cn(
                        "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200",
                        "hover:bg-gradient-to-r hover:from-amber-50/80 hover:to-transparent dark:hover:from-amber-900/20",
                        isEditing && "bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-200 dark:ring-amber-800"
                    )}
                    style={{ paddingRight: depth * 16 + 8 }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => toggleNode(node.id)}
                            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-lg transition-colors flex-shrink-0"
                        >
                            <div className={cn(
                                "transition-transform duration-200",
                                !isExpanded ? "rotate-0" : "-rotate-90"
                            )}>
                                <ChevronLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        </button>
                    ) : (
                        <div className="w-6 flex-shrink-0" />
                    )}

                    {isLeaf ? (
                        <div className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    ) : (
                        <div className="p-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                    )}

                    {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                                type="text"
                                value={editingLabel}
                                onChange={(e) => setEditingLabel(e.target.value)}
                                onBlur={() => handleSaveLabel(node.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); handleSaveLabel(node.id); }
                                    if (e.key === 'Escape') { e.preventDefault(); setEditingNodeId(null); }
                                }}
                                autoFocus
                                className="flex-1 min-w-0 h-8 px-3 border-2 border-amber-300 dark:border-amber-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-200 outline-none"
                            />
                            <button onClick={() => handleSaveLabel(node.id)} className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 rounded-lg text-emerald-600">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingNodeId(null)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-lg text-red-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <span className="flex-1 min-w-0 text-right text-sm font-medium truncate">
                            {node.title}
                        </span>
                    )}

                    {isLeaf && (
                        isAdded ? (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                                <Check className="w-3 h-3" />
                                فعال
                            </span>
                        ) : canAdd ? (
                            <button
                                type="button"
                                onClick={() => handleAddToFinal(node)}
                                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 opacity-0 group-hover/node:opacity-100 transition-all duration-200 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:shadow-sm"
                            >
                                <Plus className="w-3 h-3" />
                                افزودن
                            </button>
                        ) : null
                    )}

                    {isLeaf && !isAdded && canAdd && (
                        <button
                            type="button"
                            onClick={() => handleAddToFinal(node)}
                            className="sm:hidden p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 rounded-lg text-emerald-600 flex-shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}

                    {canRemove && (
                        <button
                            type="button"
                            onClick={() => handleRemoveFromScope(node.id)}
                            className="hidden sm:block p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 hover:text-red-600 flex-shrink-0 opacity-0 group-hover/node:opacity-100 transition-all duration-200"
                            title="حذف"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {canRemove && (
                        <button
                            type="button"
                            onClick={() => handleRemoveFromScope(node.id)}
                            className="sm:hidden p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 flex-shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <div className="mr-3 sm:mr-4 border-r-2 border-amber-100 dark:border-amber-800/30 rounded-r-lg overflow-hidden">
                        {node.children!.map(child => renderScopeNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // ============================================================
    // Render Final Node
    // ============================================================
    const renderFinalNode = (node: TreeNode, depth: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isEditing = editingNodeId === node.id && editingTree === 'final';
        const isDragging = draggedNodeId === node.id;
        const isDragOver = dragOverNodeId === node.id;

        return (
            <div key={node.id} className="group/node">
                <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, node.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, node.id)}
                    onDrop={(e) => handleDrop(e, node.id)}
                    className={cn(
                        "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200 border-2",
                        isDragging && "opacity-40 border-dashed border-primary",
                        isDragOver && dragOverPosition === 'inside' && "border-primary bg-primary/5",
                        isDragOver && dragOverPosition === 'before' && "border-t-4 border-t-primary border-x-transparent border-b-transparent",
                        isDragOver && dragOverPosition === 'after' && "border-b-4 border-b-primary border-x-transparent border-t-transparent",
                        !isDragging && !isDragOver && !isEditing && "border-transparent hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-transparent dark:hover:from-blue-900/20",
                        isEditing && "border-primary/50 bg-blue-50/50 dark:bg-blue-900/20"
                    )}
                    style={{ paddingRight: depth * 16 + 8 }}
                >
                    <div className="hidden sm:block cursor-grab active:cursor-grabbing flex-shrink-0">
                        <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                    </div>

                    {hasChildren || !node.isLeaf ? (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors flex-shrink-0"
                        >
                            <div className={cn(
                                "transition-transform duration-200",
                                !isExpanded ? "rotate-0" : "-rotate-90"
                            )}>
                                <ChevronLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </button>
                    ) : (
                        <div className="w-6 flex-shrink-0" />
                    )}

                    {node.isLeaf ? (
                        <div className="p-1 bg-primary/10 rounded-lg flex-shrink-0">
                            <Package className="w-3.5 h-3.5 text-primary" />
                        </div>
                    ) : isExpanded ? (
                        <div className="p-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                            <FolderOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                    ) : (
                        <div className="p-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                            <Folder className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                    )}

                    {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                                type="text"
                                value={editingLabel}
                                onChange={(e) => setEditingLabel(e.target.value)}
                                onBlur={() => handleSaveLabel(node.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') { e.preventDefault(); handleSaveLabel(node.id); }
                                    if (e.key === 'Escape') { e.preventDefault(); setEditingNodeId(null); }
                                }}
                                autoFocus
                                className="flex-1 min-w-0 h-8 px-3 border-2 border-primary/50 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                            <button onClick={() => handleSaveLabel(node.id)} className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 rounded-lg text-emerald-600">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingNodeId(null)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-lg text-red-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <span className="flex-1 min-w-0 text-right text-sm font-medium truncate">
                            {node.title}
                        </span>
                    )}

                    {node.isLeaf && node.overrideUnitTitle && !isEditing && (
                        <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex-shrink-0">
                            {node.overrideUnitTitle}
                        </span>
                    )}

                    <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingNodeId(node.id);
                                setEditingLabel(node.title);
                                setEditingTree('final');
                            }}
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                            title="ویرایش عنوان"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {node.isLeaf && (
                            <button
                                type="button"
                                onClick={() => openUnitSettings(node.id)}
                                className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-800/30 rounded-lg text-gray-400 hover:text-violet-600 transition-colors"
                                title="تنظیمات واحد"
                            >
                                <Settings className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {!node.isLeaf && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleAddGroup(node.id)}
                                    className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                                    title="افزودن زیرگروه"
                                >
                                    <FolderPlus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPickerParentId(node.id);
                                        setCategorySearch('');
                                        setShowCategoryPicker(true);
                                    }}
                                    className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/30 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
                                    title="افزودن دسته‌بندی"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => setDeleteConfirm({ nodeId: node.id, title: node.title, tree: 'final' })}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            title="حذف"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="mr-3 sm:mr-6 border-r-2 border-blue-100 dark:border-blue-800/30 rounded-r-lg overflow-hidden">
                        {node.children!.map(child => renderFinalNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // ============================================================
    // Loading State
    // ============================================================
    if (isCategoriesLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
                        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    // ============================================================
    // Main Render
    // ============================================================
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                    icon={<TreePine className="w-5 h-5" />}
                    label="دسته‌بندی مرجع"
                    value={allCategories.length.toString()}
                    color="amber"
                />
                <StatCard
                    icon={<Layers className="w-5 h-5" />}
                    label="مجاز بازار"
                    value={scopeTreeIds.length.toString()}
                    color="orange"
                />
                <StatCard
                    icon={<ShoppingCart className="w-5 h-5" />}
                    label="برگ نهایی"
                    value={finalLeafCount.toString()}
                    color="emerald"
                />
                <StatCard
                    icon={<Sparkles className="w-5 h-5" />}
                    label="پوشش دهی"
                    value={`${scopeLeafCount > 0 ? Math.round((finalLeafCount / scopeLeafCount) * 100) : 0}%`}
                    color="blue"
                />
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="جستجو در دسته‌بندی‌ها..."
                    className="w-full h-12 pr-11 pl-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Mobile Tabs */}
            <div className="sm:hidden flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
                <button
                    onClick={() => setMobileTab('scope')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                        mobileTab === 'scope'
                            ? "bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm"
                            : "text-gray-500"
                    )}
                >
                    <Layers className="w-4 h-4" />
                    مجاز بازار
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30">{scopeTreeIds.length}</span>
                </button>
                <button
                    onClick={() => setMobileTab('final')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                        mobileTab === 'final'
                            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-gray-500"
                    )}
                >
                    <ShoppingCart className="w-4 h-4" />
                    درخت نهایی
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30">{finalLeafCount}</span>
                </button>
            </div>

            {/* Desktop: Two Panels */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-4 lg:gap-6">
                {/* Scope Tree Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                    <PanelHeader
                        icon={<Layers className="w-5 h-5" />}
                        title="گروه‌های مجاز بازار"
                        subtitle="انتخاب از درخت مرجع"
                        count={scopeTreeIds.length}
                        color="amber"
                    >
                        {canAdd && (
                            <button
                                onClick={() => setShowReferencePicker(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                افزودن از مرجع
                            </button>
                        )}
                    </PanelHeader>
                    <div className="max-h-[500px] overflow-y-auto p-3">
                        {filteredScopeTree.length === 0 ? (
                            <EmptyState
                                icon={<TreePine className="w-12 h-12" />}
                                title="هیچ گروهی انتخاب نشده"
                                description="از درخت مرجع دسته‌بندی‌های مجاز را انتخاب کنید"
                                action={canAdd ? {
                                    label: 'انتخاب از مرجع',
                                    onClick: () => setShowReferencePicker(true),
                                } : undefined}
                                color="amber"
                            />
                        ) : (
                            <div className="space-y-1">
                                {filteredScopeTree.map(node => renderScopeNode(node))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Final Tree Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                    <PanelHeader
                        icon={<ShoppingCart className="w-5 h-5" />}
                        title="درخت دسته‌بندی نهایی"
                        subtitle="ساختار نمایش به کاربر"
                        count={finalLeafCount}
                        color="blue"
                    >
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleAddGroup(null)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                            >
                                <FolderPlus className="w-4 h-4" />
                                گروه جدید
                            </button>
                            <button
                                onClick={() => {
                                    setPickerParentId(null);
                                    setCategorySearch('');
                                    setShowCategoryPicker(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                دسته‌بندی
                            </button>
                        </div>
                    </PanelHeader>
                    <div className="max-h-[500px] overflow-y-auto p-3">
                        {filteredFinalTree.length === 0 ? (
                            <EmptyState
                                icon={<ShoppingCart className="w-12 h-12" />}
                                title="درخت نهایی خالی است"
                                description="گروه‌ها و دسته‌بندی‌ها را ایجاد کنید"
                                action={{
                                    label: 'ایجاد گروه جدید',
                                    onClick: () => handleAddGroup(null),
                                }}
                                color="blue"
                            />
                        ) : (
                            <div className="space-y-1">
                                {filteredFinalTree.map(node => renderFinalNode(node))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile: Single Panel */}
            <div className="sm:hidden bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                {mobileTab === 'scope' ? (
                    <>
                        <PanelHeader
                            icon={<Layers className="w-5 h-5" />}
                            title="گروه‌های مجاز"
                            count={scopeTreeIds.length}
                            color="amber"
                        >
                            {canAdd && (
                                <button
                                    onClick={() => setShowReferencePicker(true)}
                                    className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </PanelHeader>
                        <div className="max-h-[60vh] overflow-y-auto p-3">
                            {filteredScopeTree.length === 0 ? (
                                <EmptyState
                                    icon={<TreePine className="w-10 h-10" />}
                                    title="خالی است"
                                    description="از مرجع انتخاب کنید"
                                    action={canAdd ? {
                                        label: 'انتخاب',
                                        onClick: () => setShowReferencePicker(true),
                                    } : undefined}
                                    color="amber"
                                    compact
                                />
                            ) : (
                                <div className="space-y-1">
                                    {filteredScopeTree.map(node => renderScopeNode(node))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <PanelHeader
                            icon={<ShoppingCart className="w-5 h-5" />}
                            title="درخت نهایی"
                            count={finalLeafCount}
                            color="blue"
                        >
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleAddGroup(null)}
                                    className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl"
                                >
                                    <FolderPlus className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        setPickerParentId(null);
                                        setShowCategoryPicker(true);
                                    }}
                                    className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </PanelHeader>
                        <div className="max-h-[60vh] overflow-y-auto p-3">
                            {filteredFinalTree.length === 0 ? (
                                <EmptyState
                                    icon={<ShoppingCart className="w-10 h-10" />}
                                    title="خالی است"
                                    description="گروه ایجاد کنید"
                                    action={{
                                        label: 'ایجاد گروه',
                                        onClick: () => handleAddGroup(null),
                                    }}
                                    color="blue"
                                    compact
                                />
                            ) : (
                                <div className="space-y-1">
                                    {filteredFinalTree.map(node => renderFinalNode(node))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Mobile FAB */}
            <MobileTransferButton
                scopeCount={scopeTreeIds.length}
                finalCount={finalLeafCount}
                onOpenPicker={() => setShowReferencePicker(true)}
                canAdd={canAdd}
            />

            {/* Modals */}
            {showReferencePicker && (
                <ReferenceTreePickerModal
                    categories={allCategories}
                    selectedIds={scopeTreeIds}
                    onToggle={handleToggleFromPicker}
                    onClose={() => setShowReferencePicker(false)}
                />
            )}

            {showCategoryPicker && (
                <CategoryPickerModal
                    categories={allCategories}
                    onSelect={(cat) => handleAddCategoryToGroup(cat, pickerParentId)}
                    onClose={() => {
                        setShowCategoryPicker(false);
                        setPickerParentId(null);
                    }}
                    search={categorySearch}
                    onSearchChange={setCategorySearch}
                />
            )}

            {showUnitSettings && unitSettingsNodeId && (
                <UnitSettingsModal
                    node={categoryTree.find(n => n.id === unitSettingsNodeId)!}
                    units={allUnitsList}
                    search={unitSearchTerm}
                    onSearchChange={setUnitSearchTerm}
                    onSave={(settings) => saveUnitSettings(unitSettingsNodeId!, settings)}
                    onClose={() => {
                        setShowUnitSettings(false);
                        setUnitSettingsNodeId(null);
                    }}
                />
            )}

            {deleteConfirm && (
                <DeleteConfirmModal
                    title={deleteConfirm.title}
                    onConfirm={() => {
                        if (deleteConfirm.tree === 'final') {
                            handleRemoveFromFinal(deleteConfirm.nodeId);
                        } else {
                            handleRemoveFromScope(deleteConfirm.nodeId);
                        }
                        setDeleteConfirm(null);
                    }}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}
        </div>
    );
}

// ============================================================
// Sub Components
// ============================================================

function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: 'amber' | 'blue' | 'emerald' | 'orange';
}) {
    const colorClasses = {
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colorClasses[color])}>
                {icon}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
        </div>
    );
}

function PanelHeader({ icon, title, subtitle, count, color, children }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    count: number;
    color: 'amber' | 'blue';
    children?: React.ReactNode;
}) {
    const colorClasses = {
        amber: 'text-amber-600 dark:text-amber-400',
        blue: 'text-blue-600 dark:text-blue-400',
    };

    return (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={colorClasses[color]}>{icon}</div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
                        {subtitle && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">{subtitle}</p>
                        )}
                    </div>
                    <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        color === 'amber'
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    )}>
                        {count}
                    </span>
                </div>
                {children}
            </div>
        </div>
    );
}

function EmptyState({ icon, title, description, action, color, compact }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
    color: 'amber' | 'blue';
    compact?: boolean;
}) {
    const colorClasses = {
        amber: 'text-amber-300 dark:text-amber-700',
        blue: 'text-blue-300 dark:text-blue-700',
    };

    return (
        <div className={cn("flex flex-col items-center justify-center text-center", compact ? "py-8" : "py-16")}>
            <div className={colorClasses[color]}>{icon}</div>
            <h4 className={cn("font-semibold text-gray-600 dark:text-gray-400 mt-4", compact ? "text-sm" : "text-base")}>
                {title}
            </h4>
            <p className={cn("text-gray-400 dark:text-gray-500 mt-1", compact ? "text-xs" : "text-sm")}>
                {description}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className={cn(
                        "mt-4 font-medium rounded-xl transition-colors",
                        color === 'amber'
                            ? "px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs"
                            : "px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs",
                        compact && "px-3 py-1.5 text-[11px]"
                    )}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

function MobileTransferButton({ scopeCount, finalCount, onOpenPicker, canAdd }: {
    scopeCount: number;
    finalCount: number;
    onOpenPicker: () => void;
    canAdd: boolean;
}) {
    if (!canAdd || scopeCount === 0) return null;

    return (
        <div className="sm:hidden fixed bottom-6 left-4 right-4 z-50">
            <button
                onClick={onOpenPicker}
                className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-amber-500/30 active:scale-[0.98] transition-transform"
            >
                <ArrowRightLeft className="w-5 h-5" />
                <span className="text-sm font-bold">
                    انتقال از مرجع ({scopeCount} دسته)
                </span>
            </button>
        </div>
    );
}

// ============================================================
// Reference Tree Picker Modal - ✅ استفاده از parentId
// ============================================================

function ReferenceTreePickerModal({ categories, selectedIds, onToggle, onClose }: {
    categories: any[];
    selectedIds: string[];
    onToggle: (node: any) => void;
    onClose: () => void;
}) {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const tree = useMemo(() => {
        const map = new Map<string, any>();
        const roots: any[] = [];

        for (const cat of categories) {
            map.set(cat.id, { ...cat, children: [] });
        }

        for (const [, node] of map) {
            if (node.parentId && map.has(node.parentId)) {
                map.get(node.parentId)!.children.push(node);
            } else if (!node.parentId || node.level === 0) {
                roots.push(node);
            }
        }

        const sortNodes = (nodes: any[]): any[] => {
            return nodes
                .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fa'))
                .map(node => ({
                    ...node,
                    children: node.children ? sortNodes(node.children) : [],
                }));
        };

        return sortNodes(roots);
    }, [categories]);

    const filteredTree = useMemo(() => {
        if (!search.trim()) return tree;

        const term = search.trim().toLowerCase();

        const filterNodes = (nodes: any[]): any[] => {
            return nodes.reduce((acc: any[], node) => {
                const matches =
                    (node.title || '').toLowerCase().includes(term) ||
                    (node.titleEn || '').toLowerCase().includes(term) ||
                    (node.code || '').includes(term) ||
                    (node.path || '').includes(term);
                const children = node.children ? filterNodes(node.children) : [];

                if (matches || children.length > 0) {
                    acc.push({
                        ...node,
                        children: children.length > 0 ? children : node.children,
                    });
                }
                return acc;
            }, []);
        };

        return filterNodes(tree);
    }, [tree, search]);

    useEffect(() => {
        if (search.trim()) {
            const ids = new Set<string>();
            const collect = (nodes: any[]) => {
                for (const n of nodes) {
                    ids.add(n.id);
                    if (n.children) collect(n.children);
                }
            };
            collect(filteredTree);
            setExpanded(ids);
        }
    }, [search, filteredTree]);

    const getCheckState = (node: any): 'checked' | 'unchecked' | 'indeterminate' => {
        const descIds: string[] = [];
        const collect = (n: any) => {
            if (n.children) {
                for (const c of n.children) {
                    descIds.push(c.id);
                    collect(c);
                }
            }
        };
        collect(node);

        const hasChildren = descIds.length > 0;
        const selfSelected = selectedIds.includes(node.id);
        const allDescSelected = hasChildren ? descIds.every(id => selectedIds.includes(id)) : true;
        const someDescSelected = hasChildren ? descIds.some(id => selectedIds.includes(id)) : false;

        if (selfSelected && allDescSelected) return 'checked';
        if (selfSelected || someDescSelected) return 'indeterminate';
        return 'unchecked';
    };

    const renderNode = (node: any, depth: number = 0) => {
        const isExpanded = expanded.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const state = getCheckState(node);
        const isLeaf = !hasChildren;

        return (
            <div key={node.id}>
                <div
                    className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ paddingRight: depth * 20 + 12 }}
                >
                    {hasChildren ? (
                        <button
                            onClick={() => setExpanded(prev => {
                                const s = new Set(prev);
                                isExpanded ? s.delete(node.id) : s.add(node.id);
                                return s;
                            })}
                            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <ChevronLeft className={cn(
                                "w-4 h-4 text-gray-400 transition-transform duration-200",
                                isExpanded && "-rotate-90"
                            )} />
                        </button>
                    ) : (
                        <div className="w-6" />
                    )}

                    <button
                        onClick={() => onToggle(node)}
                        className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            state === 'checked' && "bg-amber-500 border-amber-500",
                            state === 'indeterminate' && "bg-amber-300 border-amber-400",
                            state === 'unchecked' && "border-gray-300 dark:border-gray-600"
                        )}
                    >
                        {state === 'checked' && <Check className="w-3 h-3 text-white" />}
                        {state === 'indeterminate' && <div className="w-2 h-0.5 bg-white rounded-full" />}
                    </button>

                    {isLeaf ? (
                        <Package className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                        <Layers className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}

                    <span className="flex-1 text-right text-sm truncate">{node.title}</span>

                    <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                        L{node.level}
                    </span>
                </div>

                {hasChildren && isExpanded && (
                    <div className="border-r-2 border-gray-100 dark:border-gray-700 mr-5">
                        {node.children.map((child: any) => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold">انتخاب از مرجع</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedIds.length} مورد انتخاب شده</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="جستجو در عنوان، کد یا مسیر..."
                            className="w-full h-11 pr-11 pl-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredTree.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <TreePine className="w-12 h-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                            <p className="text-sm">نتیجه‌ای یافت نشد</p>
                        </div>
                    ) : (
                        filteredTree.map(node => renderNode(node))
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <button onClick={onClose} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors">
                        انجام شد ({selectedIds.length} مورد)
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Category Picker Modal
// ============================================================

function CategoryPickerModal({ categories, onSelect, onClose, search, onSearchChange }: {
    categories: any[];
    onSelect: (cat: any) => void;
    onClose: () => void;
    search: string;
    onSearchChange: (v: string) => void;
}) {
    const filtered = categories.filter(c =>
        c.level >= 2 && (c.title.includes(search) || c.path.includes(search))
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold">انتخاب دسته‌بندی</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => onSearchChange(e.target.value)}
                            placeholder="جستجوی دسته‌بندی..."
                            className="w-full h-11 pr-11 pl-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">نتیجه‌ای یافت نشد</div>
                    ) : (
                        filtered.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => onSelect(cat)}
                                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                        <Package className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className="text-sm font-medium">{cat.title}</span>
                                </div>
                                <span className="text-[11px] text-gray-400 font-mono">{cat.path}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Unit Settings Modal
// ============================================================

function UnitSettingsModal({ node, units, search, onSearchChange, onSave, onClose }: {
    node: TreeNode;
    units: UnitInfo[];
    search: string;
    onSearchChange: (v: string) => void;
    onSave: (settings: Partial<TreeNode>) => void;
    onClose: () => void;
}) {
    const [unitId, setUnitId] = useState(node?.overrideUnitId || '');
    const [unitTitle, setUnitTitle] = useState(node?.overrideUnitTitle || '');
    const [unitQty, setUnitQty] = useState<number | ''>(node?.overrideUnitQty ?? '');
    const [isVariable, setIsVariable] = useState(node?.overrideUnitIsVariableQty || false);

    const handleSave = () => {
        onSave({
            overrideUnitId: unitId,
            overrideUnitTitle: unitTitle,
            overrideUnitQty: unitQty === '' ? null : Number(unitQty),
            overrideUnitIsVariableQty: isVariable,
        });
    };

    const filteredUnits = units.filter(u =>
        u.title.includes(search) || u.shortCode.includes(search)
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-lg font-bold">تنظیمات واحد</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{node.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">انتخاب واحد</label>
                        <div className="relative mb-3">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => onSearchChange(e.target.value)}
                                placeholder="جستجو..."
                                className="w-full h-10 pr-10 pl-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none"
                            />
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                            {filteredUnits.map(unit => (
                                <button
                                    key={unit.id}
                                    onClick={() => { setUnitId(unit.id); setUnitTitle(unit.title); }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm border-2 transition-all",
                                        unitId === unit.id
                                            ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20"
                                            : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <span className="font-medium">{unit.title}</span>
                                    <span className="text-xs text-gray-400 font-mono">{unit.shortCode}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                            تعداد در هر {unitTitle || 'واحد'}
                        </label>
                        <input
                            type="number"
                            value={unitQty}
                            onChange={e => setUnitQty(e.target.value ? Number(e.target.value) : '')}
                            placeholder="مثلاً 24"
                            className="w-full h-11 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-violet-400"
                        />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                            isVariable ? "bg-violet-500 border-violet-500" : "border-gray-300 dark:border-gray-600"
                        )} onClick={() => setIsVariable(!isVariable)}>
                            {isVariable && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">ضریب متغیر (کاربر تغییر دهد)</span>
                    </label>
                </div>

                <div className="p-5 pt-0 flex gap-3">
                    <button onClick={onClose} className="flex-1 h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        انصراف
                    </button>
                    <button onClick={handleSave} className="flex-1 h-12 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-medium transition-colors">
                        ذخیره
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Delete Confirm Modal
// ============================================================

function DeleteConfirmModal({ title, onConfirm, onCancel }: {
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm mx-4 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">تأیید حذف</h3>
                    <p className="text-sm text-gray-500">
                        آیا از حذف <span className="font-semibold text-gray-700 dark:text-gray-300">«{title}»</span> اطمینان دارید؟
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        فقط همین مورد حذف می‌شود
                    </p>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={onCancel} className="flex-1 h-12 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        انصراف
                    </button>
                    <button onClick={onConfirm} className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">
                        حذف
                    </button>
                </div>
            </div>
        </div>
    );
}