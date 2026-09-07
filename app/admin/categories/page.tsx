// app/admin/categories/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Search, Plus, FolderPlus, Pencil, Trash2,
    ChevronLeft, Folder, FolderOpen,
    Package, Layers, TreePine, RefreshCw, Filter,
    X, Check, AlertTriangle, GripVertical,
    Copy, ChevronRight, Sparkles, Tag, Zap,
} from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CategoryFormModal } from './components/CategoryFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

// ============================================================
// Types
// ============================================================
export interface CategoryNode {
    id: string;
    title: string;
    titleEn?: string;
    slug: string;
    code: string;            // ✅ کد ISIC
    path: string;
    level: number;
    parentId: string | null;
    icon?: string;
    description?: string;
    example?: string;
    defaultMinQuantity?: number;
    isActive: boolean;
    isCustom: boolean;       // ✅ نود کاستوم
    sortOrder: number;      // ✅ ترتیب
    children?: CategoryNode[];
    _isLeaf?: boolean;
}

// ============================================================
// Helpers
// ============================================================

function normalizeFa(s: string): string {
    return (s || '').replace(/[\u200c\u200f\u200e]/g, '').replace(/ي/g,'ی').replace(/ك/g,'ک')
        .replace(/[أإآ]/g,'ا').replace(/\s+/g,' ').trim().toLowerCase();
}

function buildTree(flatList: CategoryNode[]): CategoryNode[] {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    for (const item of flatList) {
        map.set(item.id, { ...item, children: [], _isLeaf: true });
    }

    for (const node of map.values()) {
        if (node.parentId && map.has(node.parentId)) {
            const parent = map.get(node.parentId)!;
            parent.children!.push(node);
            parent._isLeaf = false;
        } else if (!node.parentId || node.level === 0) {
            roots.push(node);
        }
    }

    // ✅ مرتب‌سازی بر اساس sortOrder بعد title
    const sortNodes = (nodes: CategoryNode[]): CategoryNode[] => {
        return nodes.sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            return a.title.localeCompare(b.title, 'fa');
        }).map(node => ({
            ...node,
            children: node.children ? sortNodes(node.children) : [],
        }));
    };

    return sortNodes(roots);
}

function filterTree(nodes: CategoryNode[], query: string): CategoryNode[] {
    const q = normalizeFa(query);
    if (!q) return nodes;

    const filter = (items: CategoryNode[]): CategoryNode[] => {
        const result: CategoryNode[] = [];
        for (const node of items) {
            const matches =
                normalizeFa(node.title).includes(q) ||
                normalizeFa(node.slug).includes(q) ||
                normalizeFa(node.code).includes(q) ||
                normalizeFa(node.path).includes(q);
            const filteredChildren = node.children ? filter(node.children) : [];
            if (matches || filteredChildren.length > 0) {
                result.push({ ...node, children: matches ? node.children : filteredChildren });
            }
        }
        return result;
    };
    return filter(nodes);
}

function countNodes(nodes: CategoryNode[]) {
    let total = 0, leaves = 0, folders = 0, maxDepth = 0, custom = 0;
    const count = (items: CategoryNode[], depth: number) => {
        for (const node of items) {
            total++;
            if (node.isCustom) custom++;
            if (depth > maxDepth) maxDepth = depth;
            if (node._isLeaf || !node.children?.length) leaves++;
            else { folders++; count(node.children!, depth + 1); }
        }
    };
    count(nodes, 0);
    return { total, leaves, folders, maxDepth, custom };
}

// پیدا کردن مسیر نود برای breadcrumb
function findPath(nodes: CategoryNode[], targetId: string): CategoryNode[] | null {
    for (const node of nodes) {
        if (node.id === targetId) return [node];
        if (node.children) {
            const subPath = findPath(node.children, targetId);
            if (subPath) return [node, ...subPath];
        }
    }
    return null;
}

// ============================================================
// Main Component
// ============================================================
export default function CategoriesPage() {
    const [flatCategories, setFlatCategories] = useState<CategoryNode[]>([]);
    const [tree, setTree] = useState<CategoryNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // ✅ حالت جابجایی (Drag & Drop)
    const [dragMode, setDragMode] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    // ✅ فیلتر کاستوم
    const [filterMode, setFilterMode] = useState<'all' | 'custom' | 'standard'>('all');
    const [filterLevel, setFilterLevel] = useState<number | null>(null);

    // Modal state
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
    const [addingChildParent, setAddingChildParent] = useState<CategoryNode | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CategoryNode | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ─────────── Load ───────────
    const loadData = useCallback(async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true); else setIsLoading(true);
        try {
            const data = await apiService.admin.categories.getAllFlat();
            setFlatCategories(data || []);
            setTree(buildTree(data || []));
        } catch { toast.error('خطا در دریافت دسته‌بندی‌ها'); }
        finally { setIsLoading(false); setIsRefreshing(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ─────────── Computed ───────────
    const stats = useMemo(() => countNodes(tree), [tree]);

    const filteredTree = useMemo(() => {
        // فیلتر custom/standard
        let result = tree;
        if (filterMode !== 'all') {
            const filterCustom = (nodes: CategoryNode[]): CategoryNode[] => {
                return nodes.reduce((acc: CategoryNode[], node) => {
                    const matches = filterMode === 'custom' ? node.isCustom : !node.isCustom;
                    const filteredChildren = node.children ? filterCustom(node.children) : [];
                    if (matches || filteredChildren.length > 0) {
                        acc.push({ ...node, children: matches ? node.children : filteredChildren });
                    }
                    return acc;
                }, []);
            };
            result = filterCustom(result);
        }

        // جستجو
        result = filterTree(result, searchTerm);

        // فیلتر سطح
        if (filterLevel !== null) {
            const byLevel = (nodes: CategoryNode[]): CategoryNode[] => {
                return nodes.reduce((acc: CategoryNode[], node) => {
                    if (node.level === filterLevel) acc.push({ ...node, children: [] });
                    else if (node.children && node.level < filterLevel) {
                        const fc = byLevel(node.children);
                        if (fc.length > 0) acc.push({ ...node, children: fc });
                    }
                    return acc;
                }, []);
            };
            result = byLevel(result);
        }

        return result;
    }, [tree, searchTerm, filterMode, filterLevel]);

    // Auto-expand هنگام جستجو
    useEffect(() => {
        if (searchTerm.trim()) {
            const ids = new Set<string>();
            const collect = (nodes: CategoryNode[]) => {
                for (const n of nodes) { ids.add(n.id); if (n.children) collect(n.children); }
            };
            collect(filteredTree);
            setExpandedIds(ids);
        }
    }, [searchTerm, filteredTree]);

    // مسیر نود انتخاب‌شده (breadcrumb)
    const breadcrumb = useMemo(() => {
        if (!selectedNodeId) return null;
        return findPath(tree, selectedNodeId);
    }, [tree, selectedNodeId]);

    // ─────────── Actions ───────────
    const toggleNode = useCallback((id: string) => {
        setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }, []);

    const expandAll = useCallback(() => {
        const ids = new Set<string>();
        const collect = (nodes: CategoryNode[]) => {
            for (const n of nodes) { if (n.children?.length) { ids.add(n.id); collect(n.children); } }
        };
        collect(filteredTree);
        setExpandedIds(ids);
    }, [filteredTree]);

    const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

    const handleAddRoot = () => { setEditingCategory(null); setAddingChildParent(null); setShowFormModal(true); };
    const handleAddChild = (parent: CategoryNode) => { setEditingCategory(null); setAddingChildParent(parent); setShowFormModal(true); };
    const handleEdit = (cat: CategoryNode) => { setEditingCategory(cat); setAddingChildParent(null); setShowFormModal(true); };
    const handleDelete = (cat: CategoryNode) => setDeleteTarget(cat);

    const handleDuplicate = async (node: CategoryNode) => {
        try {
            await apiService.admin.categories.duplicate(node.id);
            toast.success('کپی ایجاد شد');
            loadData(true);
        } catch (e: any) { toast.error(e?.message || 'خطا در کپی'); }
    };

    // ─────────── ✅ Drag & Drop Handlers ───────────
    const handleDragStart = (e: React.DragEvent, id: string) => {
        if (!dragMode) return;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
        setDraggedId(id);
    };

    const handleDragOver = (e: React.DragEvent, node: CategoryNode) => {
        if (!dragMode || !draggedId || draggedId === node.id) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const h = rect.height;
        let pos: 'before' | 'after' | 'inside';
        if (y < h * 0.25) pos = 'before';
        else if (y > h * 0.75) pos = 'after';
        else pos = 'inside';
        setDropTargetId(node.id);
        setDropPosition(pos);
    };

    const handleDrop = async (e: React.DragEvent, target: CategoryNode) => {
        if (!dragMode || !draggedId || draggedId === target.id) return;
        e.preventDefault();
        e.stopPropagation();
        setIsMoving(true);
        try {
            let newParentId: string | null;
            let newSortOrder: number | undefined;

            if (dropPosition === 'inside') {
                newParentId = target.id;
            } else {
                newParentId = target.parentId;
                // قبل/بعد از target
                newSortOrder = dropPosition === 'before' ? target.sortOrder - 0.5 : target.sortOrder + 0.5;
            }

            await fetch(`/api/admin/categories/${draggedId}/move`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ newParentId, newSortOrder }),
            });

            toast.success('نود جابجا شد');
            await loadData(true);
            // باز کردن والد هدف
            if (dropPosition === 'inside') {
                setExpandedIds(prev => new Set([...prev, target.id]));
            }
        } catch { toast.error('خطا در جابجایی'); }
        finally {
            setIsMoving(false);
            setDraggedId(null);
            setDropTargetId(null);
            setDropPosition(null);
        }
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDropTargetId(null);
        setDropPosition(null);
    };

    const handleFormSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await apiService.admin.categories.update(editingCategory.id, data);
                toast.success('بروزرسانی شد');
            } else {
                const payload = addingChildParent ? { ...data, parentId: addingChildParent.id } : data;
                await apiService.admin.categories.create(payload);
                toast.success(addingChildParent ? 'زیرگروه ایجاد شد' : 'گروه ایجاد شد');
                if (addingChildParent) {
                    setExpandedIds(prev => new Set([...prev, addingChildParent.id]));
                }
            }
            setShowFormModal(false);
            loadData(true);
        } catch (e: any) { toast.error(e?.message || 'خطا در ذخیره'); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await apiService.admin.categories.delete(deleteTarget.id);
            toast.success('حذف شد');
            setDeleteTarget(null);
            loadData(true);
        } catch (e: any) { toast.error(e?.message || 'خطا در حذف'); }
        finally { setIsDeleting(false); }
    };

    const handleCloseForm = () => {
        setShowFormModal(false);
        setEditingCategory(null);
        setAddingChildParent(null);
    };

    // ─────────── ✅ Render Node ───────────
    const renderNode = useCallback((node: CategoryNode, depth: number = 0): React.ReactNode => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        const isSelected = selectedNodeId === node.id;
        const isLeaf = !hasChildren;
        const isDragOver = dropTargetId === node.id;
        const isDragging = draggedId === node.id;

        return (
            <div key={node.id}>
                <div
                    draggable={dragMode}
                    onDragStart={(e) => handleDragStart(e, node.id)}
                    onDragOver={(e) => handleDragOver(e, node)}
                    onDrop={(e) => handleDrop(e, node)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                        "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-150 group/row",
                        !dragMode && "cursor-pointer",
                        dragMode && "cursor-grab active:cursor-grabbing",
                        // ✅ رنگ متمایز برای کاستوم
                        node.isCustom
                            ? "bg-amber-50/40 dark:bg-amber-900/10 hover:bg-amber-50/70 dark:hover:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30"
                            : "hover:bg-gradient-to-l hover:from-indigo-50/80 hover:to-transparent dark:hover:from-indigo-900/20",
                        isSelected && !dragMode && "ring-1 ring-indigo-300 dark:ring-indigo-700",
                        isDragging && "opacity-40",
                        // ✅ نشانگرهای Drop
                        isDragOver && dropPosition === 'before' && "border-t-4 border-t-indigo-500",
                        isDragOver && dropPosition === 'after' && "border-b-4 border-b-indigo-500",
                        isDragOver && dropPosition === 'inside' && "bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-400",
                    )}
                    style={{ paddingRight: depth * 20 + 12 }}
                    onClick={() => {
                        if (dragMode) return;
                        setSelectedNodeId(node.id);
                        if (hasChildren) toggleNode(node.id);
                    }}
                >
                    {/* ✅ Drag Handle (فقط در حالت جابجایی) */}
                    {dragMode && (
                        <div className="cursor-grab active:cursor-grabbing flex-shrink-0 p-1 text-gray-400 hover:text-indigo-500">
                            <GripVertical className="w-4 h-4" />
                        </div>
                    )}

                    {/* Expand/Collapse */}
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {hasChildren ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                                className="p-0.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors"
                            >
                                <ChevronLeft className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", isExpanded && "-rotate-90")} />
                            </button>
                        ) : <div className="w-4" />}
                    </div>

                    {/* Icon */}
                    <div className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                        isLeaf
                            ? node.isCustom
                                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600"
                                : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500"
                            : isExpanded
                                ? node.isCustom
                                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600"
                                    : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500"
                                : "bg-gray-50 dark:bg-gray-800 text-gray-400"
                    )}>
                        {isLeaf ? <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            : isExpanded ? <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                : <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </div>

                    {/* ✅ Title + Code + Custom Badge */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-sm font-medium truncate",
                                node.isCustom ? "text-amber-800 dark:text-amber-300" : "text-gray-800 dark:text-gray-200"
                            )}>
                                {node.title}
                            </span>
                            {/* ✅ کد نمایش داده شود */}
                            <span className={cn(
                                "text-[10px] font-mono px-1.5 py-0.5 rounded-md flex-shrink-0 tabular-nums",
                                node.isCustom
                                    ? "bg-amber-200/60 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                            )}>
                                {node.code}
                            </span>
                            {/* ✅ بج کاستوم */}
                            {node.isCustom && (
                                <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300 flex-shrink-0">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    کاستوم
                                </span>
                            )}
                            {node.icon && <span className="text-sm flex-shrink-0">{node.icon}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                L{node.level}
                            </span>
                            {hasChildren && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                    {node.children!.length} زیرگروه
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        {!isLeaf && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleAddChild(node); }}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-500 transition-colors"
                                title="افزودن زیرگروه"
                            >
                                <FolderPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        )}
                        {/* ✅ کپی */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(node); }}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 text-gray-400 hover:text-violet-500 transition-colors"
                            title="کپی"
                        >
                            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(node); }}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500 transition-colors"
                            title="ویرایش"
                        >
                            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(node); }}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                            title="حذف"
                        >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                    </div>

                    {/* Mobile Actions */}
                    <div className="sm:hidden flex items-center gap-0.5 flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(node); }} className="p-1.5 rounded-lg text-gray-400">
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(node); }} className="p-1.5 rounded-lg text-gray-400">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="mr-2 sm:mr-3 border-r-2 border-indigo-100 dark:border-indigo-800/30 rounded-r-lg overflow-hidden">
                        {node.children!.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    }, [expandedIds, selectedNodeId, dragMode, draggedId, dropTargetId, dropPosition, toggleNode, handleAddChild, handleEdit, handleDelete, handleDuplicate, handleDragStart, handleDragOver, handleDrop, handleDragEnd]);

    // ─────────── Loading ───────────
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900 rounded-full" />
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">در حال بارگذاری</p>
                </div>
            </div>
        );
    }

    // ─────────── Main Render ───────────
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <TreePine className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white">گروه‌های مرجع</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">درخت کالای ISIC + توسعه کاستوم</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => loadData(true)} disabled={isRefreshing}
                                    className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors disabled:opacity-50"
                                    title="بروزرسانی">
                                <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
                            </button>
                            <button onClick={handleAddRoot}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all active:scale-[0.98]">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">گروه جدید</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* ✅ Breadcrumb نود انتخاب‌شده */}
                {breadcrumb && breadcrumb.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-2.5 mb-4 flex items-center gap-1 overflow-x-auto">
                        <Tag className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        {breadcrumb.map((n, i) => (
                            <React.Fragment key={n.id}>
                                {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                                <button
                                    onClick={() => {
                                        setSelectedNodeId(n.id);
                                        setExpandedIds(prev => new Set([...prev, ...breadcrumb!.slice(0, i).map(b => b.id)]));
                                    }}
                                    className={cn(
                                        "text-xs font-medium whitespace-nowrap transition-colors",
                                        i === breadcrumb.length - 1 ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-indigo-500"
                                    )}
                                >
                                    {n.title}
                                    <span className="text-[10px] font-mono text-gray-400 mr-1">{n.code}</span>
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
                    <StatCard icon={<Layers className="w-5 h-5" />} label="کل" value={toFa(stats.total)} color="indigo" />
                    <StatCard icon={<Folder className="w-5 h-5" />} label="گروه‌ها" value={toFa(stats.folders)} color="blue" />
                    <StatCard icon={<Package className="w-5 h-5" />} label="برگ‌ها" value={toFa(stats.leaves)} color="emerald" />
                    <StatCard icon={<Sparkles className="w-5 h-5" />} label="کاستوم" value={toFa(stats.custom)} color="amber" />
                    <StatCard icon={<TreePine className="w-5 h-5" />} label="عمق درخت" value={`${toFa(stats.maxDepth + 1)} سطح`} color="purple" />
                </div>

                {/* Search & Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6 overflow-hidden">
                    <div className="p-4 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="جستجو در عنوان، کد، slug یا مسیر..."
                                className="w-full h-12 pr-12 pl-12 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-2xl text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            )}
                        </div>

                        {/* ✅ Drag & Drop Toggle */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/15 border border-indigo-100 dark:border-indigo-800/30">
                            <button
                                onClick={() => setDragMode(!dragMode)}
                                className={cn(
                                    "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                                    dragMode ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
                                )}
                            >
                                <span className={cn(
                                    "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
                                    dragMode ? "left-0.5" : "left-0.5"
                                )} style={{ transform: dragMode ? 'translateX(0)' : 'translateX(0)' }} />
                            </button>
                            <div className="flex items-center gap-1.5">
                                <GripVertical className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                    حالت جابجایی (Drag &amp; Drop)
                                </span>
                            </div>
                            {dragMode && (
                                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 mr-auto flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    نودها را بکشید و رها کنید
                                </span>
                            )}
                            {isMoving && (
                                <span className="text-[10px] text-amber-500 mr-auto flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    در حال جابجایی...
                                </span>
                            )}
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* ✅ فیلتر کاستوم/استاندارد */}
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Filter className="w-3.5 h-3.5" /> نوع:
                            </span>
                            {(['all', 'standard', 'custom'] as const).map(mode => (
                                <button key={mode} onClick={() => setFilterMode(mode)}
                                        className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                            filterMode === mode
                                                ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200")}>
                                    {mode === 'all' ? 'همه' : mode === 'standard' ? 'استاندارد' : 'کاستوم'}
                                </button>
                            ))}

                            <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>

                            <span className="text-xs text-gray-500 dark:text-gray-400">سطح:</span>
                            <button onClick={() => setFilterLevel(null)}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        filterLevel === null ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" : "bg-gray-100 dark:bg-gray-700 text-gray-500")}>
                                همه
                            </button>
                            {[0, 1, 2, 3, 4].map(l => (
                                <button key={l} onClick={() => setFilterLevel(l)}
                                        className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                            filterLevel === l ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" : "bg-gray-100 dark:bg-gray-700 text-gray-500")}>
                                    {toFa(l)}
                                </button>
                            ))}

                            <div className="flex-1" />

                            <button onClick={expandAll} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium px-2 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                باز کردن همه
                            </button>
                            <span className="text-gray-300">|</span>
                            <button onClick={collapseAll} className="text-xs text-gray-500 hover:text-gray-600 font-medium px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                بستن همه
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tree */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TreePine className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">ساختار درختی</span>
                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                {toFa(filteredTree.length)} ریشه
                            </span>
                        </div>
                    </div>

                    <div className="p-2 sm:p-3">
                        {filteredTree.length === 0 ? (
                            <EmptyState
                                icon={<TreePine className="w-16 h-16" />}
                                title={searchTerm ? "نتیجه‌ای یافت نشد" : "درخت خالی است"}
                                description={searchTerm ? "عبارت دیگری را جستجو کنید" : "اولین گروه مرجع را ایجاد کنید"}
                                action={!searchTerm ? { label: "ایجاد گروه جدید", onClick: handleAddRoot } : undefined}
                            />
                        ) : (
                            <div className="space-y-0.5">
                                {filteredTree.map(node => renderNode(node))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile FAB */}
            <div className="sm:hidden fixed bottom-6 left-4 right-4 z-50">
                <button onClick={handleAddRoot}
                        className="w-full h-14 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/30 active:scale-[0.98] transition-transform">
                    <Plus className="w-5 h-5" />
                    <span className="font-bold">ایجاد گروه جدید</span>
                </button>
            </div>

            {/* Modals */}
            <CategoryFormModal
                isOpen={showFormModal}
                onClose={handleCloseForm}
                onSubmit={handleFormSubmit}
                category={editingCategory}
                parentCategory={addingChildParent}
                loading={isSubmitting}
            />

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                category={deleteTarget}
                loading={isDeleting}
            />
        </div>
    );
}

// ============================================================
// Helpers: toFa
// ============================================================
function toFa(n: number | string): string {
    return new Intl.NumberFormat('fa-IR').format(Number(n));
}

// ============================================================
// Sub Components
// ============================================================
function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode; label: string; value: string;
    color: 'indigo' | 'blue' | 'emerald' | 'purple' | 'amber';
}) {
    const colors = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500',
    };
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colors[color])}>{icon}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
        </div>
    );
}

function EmptyState({ icon, title, description, action }: {
    icon: React.ReactNode; title: string; description: string;
    action?: { label: string; onClick: () => void };
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-gray-200 dark:text-gray-700 mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-sm">{description}</p>
            {action && (
                <button onClick={action.onClick}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all">
                    {action.label}
                </button>
            )}
        </div>
    );
}