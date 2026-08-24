// app/admin/categories/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search, Plus, FolderPlus, Pencil, Trash2,
    ChevronLeft, Folder, FolderOpen,
    Package, Layers, TreePine, RefreshCw, Filter,
    X, Check, AlertTriangle, Loader2
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
    path: string;
    level: number;
    parentId: string | null;
    icon?: string;
    description?: string;
    example?: string;
    defaultMinQuantity?: number;
    isActive: boolean;
    children?: CategoryNode[];
    _childCount?: number;
    _isLeaf?: boolean;
}

// ============================================================
// Helper: Build tree from flat list
// ============================================================
function buildTree(flatList: CategoryNode[]): CategoryNode[] {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // Create all nodes first
    for (const item of flatList) {
        map.set(item.id, {
            ...item,
            children: [],
            _isLeaf: true,
        });
    }

    // Build parent-child relationships
    for (const node of map.values()) {
        if (node.parentId && map.has(node.parentId)) {
            const parent = map.get(node.parentId)!;
            parent.children!.push(node);
            parent._isLeaf = false;
        } else if (!node.parentId || node.level === 0) {
            roots.push(node);
        }
    }

    // Sort by title at each level
    const sortNodes = (nodes: CategoryNode[]): CategoryNode[] => {
        return nodes.sort((a, b) => a.title.localeCompare(b.title, 'fa')).map(node => ({
            ...node,
            children: node.children ? sortNodes(node.children) : [],
        }));
    };

    return sortNodes(roots);
}

// ============================================================
// Helper: Filter tree by search
// ============================================================
function filterTree(nodes: CategoryNode[], query: string): CategoryNode[] {
    if (!query.trim()) return nodes;
    const lower = query.toLowerCase();

    const filter = (items: CategoryNode[]): CategoryNode[] => {
        const result: CategoryNode[] = [];
        for (const node of items) {
            const matches = node.title.toLowerCase().includes(lower) ||
                node.slug.toLowerCase().includes(lower) ||
                node.path.includes(lower);
            const filteredChildren = node.children ? filter(node.children) : [];

            if (matches || filteredChildren.length > 0) {
                result.push({
                    ...node,
                    children: filteredChildren.length > 0 ? filteredChildren : node.children,
                    _childCount: filteredChildren.length > 0 ? undefined : node._childCount,
                });
            }
        }
        return result;
    };

    return filter(nodes);
}

// ============================================================
// Helper: Count all nodes
// ============================================================
function countNodes(nodes: CategoryNode[]): { total: number; leaves: number; folders: number; maxDepth: number } {
    let total = 0;
    let leaves = 0;
    let folders = 0;
    let maxDepth = 0;

    const count = (items: CategoryNode[], depth: number) => {
        for (const node of items) {
            total++;
            if (depth > maxDepth) maxDepth = depth;
            if (node._isLeaf || !node.children?.length) {
                leaves++;
            } else {
                folders++;
                count(node.children!, depth + 1);
            }
        }
    };

    count(nodes, 0);
    return { total, leaves, folders, maxDepth };
}

// ============================================================
// Main Page Component
// ============================================================
export default function CategoriesPage() {
    // Data state
    const [flatCategories, setFlatCategories] = useState<CategoryNode[]>([]);
    const [tree, setTree] = useState<CategoryNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Modal state
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
    const [addingChildParent, setAddingChildParent] = useState<CategoryNode | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CategoryNode | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter level
    const [filterLevel, setFilterLevel] = useState<number | null>(null);

    // ============================================================
    // Load data
    // ============================================================
    const loadData = useCallback(async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const data = await apiService.admin.categories.getAllFlat();
            setFlatCategories(data || []);
            const builtTree = buildTree(data || []);
            setTree(builtTree);
        } catch (error) {
            toast.error('خطا در دریافت دسته‌بندی‌ها');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ============================================================
    // Computed values
    // ============================================================
    const stats = useMemo(() => countNodes(tree), [tree]);

    const filteredTree = useMemo(() => {
        let result = filterTree(tree, searchTerm);

        if (filterLevel !== null) {
            const filterByLevel = (nodes: CategoryNode[]): CategoryNode[] => {
                return nodes.reduce((acc: CategoryNode[], node) => {
                    if (node.level === filterLevel) {
                        acc.push({ ...node, children: [] });
                    } else if (node.children && node.level < filterLevel) {
                        const filteredChildren = filterByLevel(node.children);
                        if (filteredChildren.length > 0) {
                            acc.push({ ...node, children: filteredChildren });
                        }
                    }
                    return acc;
                }, []);
            };
            result = filterByLevel(result);
        }

        return result;
    }, [tree, searchTerm, filterLevel]);

    // Auto-expand when searching
    useEffect(() => {
        if (searchTerm.trim()) {
            const ids = new Set<string>();
            const collect = (nodes: CategoryNode[]) => {
                for (const node of nodes) {
                    ids.add(node.id);
                    if (node.children) collect(node.children);
                }
            };
            collect(filteredTree);
            setExpandedIds(ids);
        }
    }, [searchTerm, filteredTree]);

    // ============================================================
    // Actions
    // ============================================================
    const toggleNode = useCallback((id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        const ids = new Set<string>();
        const collect = (nodes: CategoryNode[]) => {
            for (const node of nodes) {
                if (node.children && node.children.length > 0) {
                    ids.add(node.id);
                    collect(node.children);
                }
            }
        };
        collect(filteredTree);
        setExpandedIds(ids);
    }, [filteredTree]);

    const collapseAll = useCallback(() => {
        setExpandedIds(new Set());
    }, []);

    const handleAddRoot = () => {
        setEditingCategory(null);
        setAddingChildParent(null);
        setShowFormModal(true);
    };

    const handleAddChild = (parent: CategoryNode) => {
        setEditingCategory(null);
        setAddingChildParent(parent);
        setShowFormModal(true);
    };

    const handleEdit = (category: CategoryNode) => {
        setEditingCategory(category);
        setAddingChildParent(null);
        setShowFormModal(true);
    };

    const handleDelete = (category: CategoryNode) => {
        setDeleteTarget(category);
    };

    const handleFormSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await apiService.admin.categories.update(editingCategory.id, data);
                toast.success('دسته‌بندی بروزرسانی شد');
            } else {
                const payload = addingChildParent
                    ? { ...data, parentId: addingChildParent.id }
                    : data;
                await apiService.admin.categories.create(payload);
                toast.success(addingChildParent ? 'زیرگروه ایجاد شد' : 'دسته‌بندی ایجاد شد');
            }
            setShowFormModal(false);
            loadData(true);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ذخیره');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await apiService.admin.categories.delete(deleteTarget.id);
            toast.success('حذف شد');
            setDeleteTarget(null);
            loadData(true);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در حذف');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseForm = () => {
        setShowFormModal(false);
        setEditingCategory(null);
        setAddingChildParent(null);
    };

    // ============================================================
    // Render Tree Node
    // ============================================================
    const renderNode = useCallback((node: CategoryNode, depth: number = 0): React.ReactNode => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        const isSelected = selectedNodeId === node.id;
        const isLeaf = !hasChildren;

        return (
            <div key={node.id}>
                <div
                    className={cn(
                        "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-150 cursor-pointer group/row",
                        "hover:bg-gradient-to-l hover:from-indigo-50/80 hover:to-transparent dark:hover:from-indigo-900/20",
                        isSelected && "bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-800"
                    )}
                    style={{ paddingRight: depth * 20 + 12 }}
                    onClick={() => {
                        setSelectedNodeId(node.id);
                        if (hasChildren) toggleNode(node.id);
                    }}
                >
                    {/* Expand/Collapse */}
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {hasChildren ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }}
                                className="p-0.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors"
                            >
                                <ChevronLeft className={cn(
                                    "w-4 h-4 text-gray-400 transition-transform duration-200",
                                    isExpanded && "-rotate-90"
                                )} />
                            </button>
                        ) : (
                            <div className="w-4" />
                        )}
                    </div>

                    {/* Icon */}
                    <div className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                        isLeaf
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500"
                            : isExpanded
                                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500"
                                : "bg-gray-50 dark:bg-gray-800 text-gray-400"
                    )}>
                        {isLeaf ? (
                            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : isExpanded ? (
                            <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : (
                            <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                    </div>

                    {/* Title & Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                {node.title}
                            </span>
                            {node.icon && (
                                <span className="text-sm flex-shrink-0">{node.icon}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
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

                    {/* Mobile Actions - Always visible */}
                    <div className="sm:hidden flex items-center gap-0.5 flex-shrink-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(node); }}
                            className="p-1.5 rounded-lg text-gray-400"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(node); }}
                            className="p-1.5 rounded-lg text-gray-400"
                        >
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
    }, [expandedIds, selectedNodeId, toggleNode, handleAddChild, handleEdit, handleDelete]);

    // ============================================================
    // Loading State
    // ============================================================
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900 rounded-full" />
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400 font-medium">در حال بارگذاری</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">دسته‌بندی‌های مرجع</p>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // Main Render
    // ============================================================
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
                                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">مدیریت درخت دسته‌بندی‌های کالا</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => loadData(true)}
                                disabled={isRefreshing}
                                className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors disabled:opacity-50"
                                title="بروزرسانی"
                            >
                                <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
                            </button>
                            <button
                                onClick={handleAddRoot}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all active:scale-[0.98]"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">گروه جدید</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <StatCard
                        icon={<Layers className="w-5 h-5" />}
                        label="کل دسته‌بندی‌ها"
                        value={stats.total.toString()}
                        color="indigo"
                    />
                    <StatCard
                        icon={<Folder className="w-5 h-5" />}
                        label="گروه‌ها"
                        value={stats.folders.toString()}
                        color="blue"
                    />
                    <StatCard
                        icon={<Package className="w-5 h-5" />}
                        label="برگ‌ها"
                        value={stats.leaves.toString()}
                        color="emerald"
                    />
                    <StatCard
                        icon={<TreePine className="w-5 h-5" />}
                        label="عمق درخت"
                        value={`${stats.maxDepth + 1} سطح`}
                        color="purple"
                    />
                </div>

                {/* Search & Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6 overflow-hidden">
                    <div className="p-4">
                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="جستجو در عنوان، slug یا مسیر..."
                                className="w-full h-12 pr-12 pl-12 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-2xl text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            )}
                        </div>

                        {/* Level Filter & Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Filter className="w-3.5 h-3.5" />
                                سطح:
                            </span>
                            <button
                                onClick={() => setFilterLevel(null)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    filterLevel === null
                                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                                )}
                            >
                                همه
                            </button>
                            {[0, 1, 2, 3, 4].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setFilterLevel(level)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        filterLevel === level
                                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    )}
                                >
                                    سطح {level}
                                </button>
                            ))}

                            <div className="flex-1" />

                            <button
                                onClick={expandAll}
                                className="text-xs text-indigo-500 hover:text-indigo-600 font-medium px-2 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            >
                                باز کردن همه
                            </button>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <button
                                onClick={collapseAll}
                                className="text-xs text-gray-500 hover:text-gray-600 font-medium px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                بستن همه
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tree */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    {/* Tree Header */}
                    <div className="px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TreePine className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">ساختار درختی</span>
                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                {filteredTree.length} ریشه
                            </span>
                        </div>
                    </div>

                    {/* Tree Content */}
                    <div className="p-2 sm:p-3">
                        {filteredTree.length === 0 ? (
                            <EmptyState
                                icon={<TreePine className="w-16 h-16" />}
                                title={searchTerm ? "نتیجه‌ای یافت نشد" : "درخت خالی است"}
                                description={searchTerm ? "عبارت دیگری را جستجو کنید" : "اولین گروه مرجع را ایجاد کنید"}
                                action={!searchTerm ? {
                                    label: "ایجاد گروه جدید",
                                    onClick: handleAddRoot
                                } : undefined}
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
                <button
                    onClick={handleAddRoot}
                    className="w-full h-14 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/30 active:scale-[0.98] transition-transform"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-bold">ایجاد گروه جدید</span>
                </button>
            </div>

            {/* Form Modal */}
            <CategoryFormModal
                isOpen={showFormModal}
                onClose={handleCloseForm}
                onSubmit={handleFormSubmit}
                category={editingCategory}
                parentCategory={addingChildParent}
                loading={isSubmitting}
            />

            {/* Delete Modal */}
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
// Sub Components
// ============================================================

function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: 'indigo' | 'blue' | 'emerald' | 'purple';
}) {
    const colors = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colors[color])}>
                {icon}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
        </div>
    );
}

function EmptyState({ icon, title, description, action }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-gray-200 dark:text-gray-700 mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-sm">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}