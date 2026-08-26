// app/admin/arm/components/CategorySection/FinalTreePanel.tsx
'use client';

import { ShoppingCart, FolderPlus, Plus } from 'lucide-react';
import { PanelHeader } from './PanelHeader';
import { EmptyState } from './EmptyState';
import { FinalTreeNode } from './TreeNodes';
import type { TreeNode } from './types';
import { toFa } from './utils';

export function FinalTreePanel({
                                   tree,
                                   filteredTree,
                                   isSearchActive,
                                   finalLeafCount,
                                   onAddGroup,
                                   onOpenCategoryPicker,
                                   onToggleNode,
                                   onStartEdit,
                                   onSaveLabel,
                                   onSetEditingLabel,
                                   onSetEditingNodeId,
                                   onDelete,
                                   onOpenUnitSettings,
                                   onDragStart,
                                   onDragEnd,
                                   onDragOver,
                                   onDrop,
                                   expandedNodes,
                                   editingNodeId,
                                   editingLabel,
                                   editingTree,
                                   draggedNodeId,
                                   dragOverNodeId,
                                   dragOverPosition,
                               }: {
    tree: TreeNode[];
    filteredTree: TreeNode[];
    isSearchActive: boolean;
    finalLeafCount: number;
    onAddGroup: (parentId: string | null) => void;
    onOpenCategoryPicker: (parentId: string | null) => void;
    onToggleNode: (nodeId: string) => void;
    onStartEdit: (nodeId: string, title: string, tree: 'scope' | 'final') => void;
    onSaveLabel: (nodeId: string) => void;
    onSetEditingLabel: (value: string) => void;
    onSetEditingNodeId: (nodeId: string | null) => void;
    onDelete: (nodeId: string, title: string, tree: 'scope' | 'final') => void;
    onOpenUnitSettings: (nodeId: string) => void;
    onDragStart: (e: React.DragEvent, nodeId: string) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent, nodeId: string) => void;
    onDrop: (e: React.DragEvent, targetId: string) => void;
    expandedNodes: Set<string>;
    editingNodeId: string | null;
    editingLabel: string;
    editingTree: 'scope' | 'final';
    draggedNodeId: string | null;
    dragOverNodeId: string | null;
    dragOverPosition: 'before' | 'after' | 'inside' | null;
}) {
    return (
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
                        onClick={() => onAddGroup(null)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        <FolderPlus className="w-4 h-4" />
                        گروه جدید
                    </button>
                    <button
                        onClick={() => onOpenCategoryPicker(null)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        دسته‌بندی
                    </button>
                </div>
            </PanelHeader>
            <div className="max-h-[500px] overflow-y-auto p-3">
                {filteredTree.length === 0 ? (
                    <EmptyState
                        icon={<ShoppingCart className="w-12 h-12" />}
                        title={isSearchActive ? 'نتیجه‌ای یافت نشد' : 'درخت نهایی خالی است'}
                        description={isSearchActive ? 'عبارت جستجو را تغییر دهید' : 'گروه‌ها و دسته‌بندی‌ها را ایجاد کنید'}
                        action={!isSearchActive ? { label: 'ایجاد گروه جدید', onClick: () => onAddGroup(null) } : undefined}
                        color="blue"
                    />
                ) : (
                    <div className="space-y-1">
                        {filteredTree.map(node => (
                            <FinalTreeNode
                                key={node.id}
                                node={node}
                                expandedNodes={expandedNodes}
                                editingNodeId={editingNodeId}
                                editingLabel={editingLabel}
                                editingTree={editingTree}
                                draggedNodeId={draggedNodeId}
                                dragOverNodeId={dragOverNodeId}
                                dragOverPosition={dragOverPosition}
                                onToggleNode={onToggleNode}
                                onStartEdit={onStartEdit}
                                onSaveLabel={onSaveLabel}
                                onSetEditingLabel={onSetEditingLabel}
                                onSetEditingNodeId={onSetEditingNodeId}
                                onDelete={onDelete}
                                onOpenUnitSettings={onOpenUnitSettings}
                                onAddGroup={onAddGroup}
                                onOpenCategoryPicker={onOpenCategoryPicker}
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                                onDragOver={onDragOver}
                                onDrop={onDrop}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}