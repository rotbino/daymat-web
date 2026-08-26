// app/admin/arm/components/CategorySection/ScopeTreePanel.tsx
'use client';

import { Layers, Plus, TreePine } from 'lucide-react';
import { PanelHeader } from './PanelHeader';
import { EmptyState } from './EmptyState';
import { ScopeTreeNode } from './TreeNodes';
import type { TreeNode } from './types';
import { toFa } from './utils';

export function ScopeTreePanel({
                                   tree,
                                   filteredTree,
                                   isSearchActive,
                                   scopeTreeIds,
                                   canAdd,
                                   onOpenReferencePicker,
                                   onToggleNode,
                                   onOpenQuickAdd,
                                   onAddToFinal,
                                   onStartEdit,
                                   onSaveLabel,
                                   onSetEditingLabel,
                                   onSetEditingNodeId,
                                   onDelete,
                                   expandedNodes,
                                   finalTreeIds,
                                   referenceChildrenMap,
                                   editingNodeId,
                                   editingLabel,
                                   editingTree,
                                   canRemove,
                                   isAdmin,
                               }: {
    tree: TreeNode[];
    filteredTree: TreeNode[];
    isSearchActive: boolean;
    scopeTreeIds: Set<string>;
    canAdd: boolean;
    canRemove: boolean;
    isAdmin: boolean;
    onOpenReferencePicker: () => void;
    onToggleNode: (nodeId: string) => void;
    onOpenQuickAdd: (nodeId: string) => void;
    onAddToFinal: (node: TreeNode) => void;
    onStartEdit: (nodeId: string, title: string, tree: 'scope' | 'final') => void;
    onSaveLabel: (nodeId: string) => void;
    onSetEditingLabel: (value: string) => void;
    onSetEditingNodeId: (nodeId: string | null) => void;
    onDelete: (nodeId: string, title: string, tree: 'scope' | 'final') => void;
    expandedNodes: Set<string>;
    finalTreeIds: Set<string>;
    referenceChildrenMap: Map<string, any[]>;
    editingNodeId: string | null;
    editingLabel: string;
    editingTree: 'scope' | 'final';
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
            <PanelHeader
                icon={<Layers className="w-5 h-5" />}
                title="گروه‌های مجاز بازار"
                subtitle="انتخاب از درخت مرجع"
                count={scopeTreeIds.size}
                color="amber"
            >
                {canAdd && (
                    <button
                        onClick={onOpenReferencePicker}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        افزودن از مرجع
                    </button>
                )}
            </PanelHeader>
            <div className="max-h-[500px] overflow-y-auto p-3">
                {filteredTree.length === 0 ? (
                    <EmptyState
                        icon={<TreePine className="w-12 h-12" />}
                        title={isSearchActive ? 'نتیجه‌ای یافت نشد' : 'هیچ گروهی انتخاب نشده'}
                        description={isSearchActive ? 'عبارت جستجو را تغییر دهید' : 'از درخت مرجع دسته‌بندی‌های مجاز را انتخاب کنید'}
                        action={canAdd && !isSearchActive ? { label: 'انتخاب از مرجع', onClick: onOpenReferencePicker } : undefined}
                        color="amber"
                    />
                ) : (
                    <div className="space-y-1">
                        {filteredTree.map(node => (
                            <ScopeTreeNode
                                key={node.id}
                                node={node}
                                expandedNodes={expandedNodes}
                                finalTreeIds={finalTreeIds}
                                referenceChildrenMap={referenceChildrenMap}
                                editingNodeId={editingNodeId}
                                editingLabel={editingLabel}
                                editingTree={editingTree}
                                canAdd={canAdd}
                                canRemove={canRemove}
                                isAdmin={isAdmin}
                                onToggleNode={onToggleNode}
                                onOpenQuickAdd={onOpenQuickAdd}
                                onAddToFinal={onAddToFinal}
                                onStartEdit={onStartEdit}
                                onSaveLabel={onSaveLabel}
                                onSetEditingLabel={onSetEditingLabel}
                                onSetEditingNodeId={onSetEditingNodeId}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}