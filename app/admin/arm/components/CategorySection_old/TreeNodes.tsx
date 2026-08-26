// app/admin/arm/components/CategorySection/TreeNodes.tsx
'use client';

import { Check, ChevronLeft, Plus, Trash2, Package, Layers, X, FolderPlus, GripVertical, Edit3, Settings, FolderOpen, Folder, ListPlus, Star, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TreeNode, DeleteConfirmData } from './types';
import { toFa } from './utils';

// ============================================================
// کامپوننت: رندر نود درخت مجاز (Scope Tree)
// ============================================================
export function ScopeTreeNode({
                                  node,
                                  depth = 0,
                                  expandedNodes,
                                  finalTreeIds,
                                  referenceChildrenMap,
                                  editingNodeId,
                                  editingLabel,
                                  editingTree,
                                  canAdd,
                                  canRemove,
                                  isAdmin,
                                  onToggleNode,
                                  onOpenQuickAdd,
                                  onAddToFinal,
                                  onStartEdit,
                                  onSaveLabel,
                                  onSetEditingLabel,
                                  onSetEditingNodeId,
                                  onDelete,
                              }: {
    node: TreeNode;
    depth?: number;
    expandedNodes: Set<string>;
    finalTreeIds: Set<string>;
    referenceChildrenMap: Map<string, any[]>;
    editingNodeId: string | null;
    editingLabel: string;
    editingTree: 'scope' | 'final';
    canAdd: boolean;
    canRemove: boolean;
    isAdmin: boolean;
    onToggleNode: (nodeId: string) => void;
    onOpenQuickAdd: (nodeId: string) => void;
    onAddToFinal: (node: TreeNode) => void;
    onStartEdit: (nodeId: string, title: string, tree: 'scope' | 'final') => void;
    onSaveLabel: (nodeId: string) => void;
    onSetEditingLabel: (value: string) => void;
    onSetEditingNodeId: (nodeId: string | null) => void;
    onDelete: (nodeId: string, title: string, tree: 'scope' | 'final') => void;
}) {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isLeaf = !hasChildren;
    const isAdded = finalTreeIds.has(node.id);
    const isEditing = editingNodeId === node.id && editingTree === 'scope';
    const refChildCount = (referenceChildrenMap.get(node.id) || []).length;
    const canQuickAdd = canAdd && refChildCount > 0;

    return (
        <div className="group/node">
            <div
                className={cn(
                    'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200',
                    'hover:bg-gradient-to-r hover:from-amber-50/80 hover:to-transparent dark:hover:from-amber-900/20',
                    isEditing && 'bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-200 dark:ring-amber-800',
                )}
                style={{ paddingRight: depth * 16 + 8 }}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={() => onToggleNode(node.id)}
                        className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-lg transition-colors flex-shrink-0"
                    >
                        <div className={cn('transition-transform duration-200', !isExpanded ? 'rotate-0' : '-rotate-90')}>
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
                            onChange={(e) => onSetEditingLabel(e.target.value)}
                            onBlur={() => onSaveLabel(node.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); onSaveLabel(node.id); }
                                if (e.key === 'Escape') { e.preventDefault(); onSetEditingNodeId(null); }
                            }}
                            autoFocus
                            className="flex-1 min-w-0 h-8 px-3 border-2 border-amber-300 dark:border-amber-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-200 outline-none"
                        />
                        <button onClick={() => onSaveLabel(node.id)} className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600">
                            <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => onSetEditingNodeId(null)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-500">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <span className="flex-1 min-w-0 text-right text-sm font-medium truncate">{node.title}</span>
                )}

                {canQuickAdd && !isEditing && (
                    <button
                        type="button"
                        onClick={() => onOpenQuickAdd(node.id)}
                        className="flex items-center gap-1 p-1.5 sm:px-2 rounded-lg bg-amber-100/80 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 transition-colors flex-shrink-0"
                        title={`افزودن سریع زیرمجموعه‌های «${node.title}»`}
                    >
                        <ListPlus className="w-4 h-4" />
                    </button>
                )}

                {isAdded ? (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                        <Check className="w-3 h-3" />
                        فعال
                    </span>
                ) : canAdd ? (
                    <button
                        type="button"
                        onClick={() => onAddToFinal(node)}
                        className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 opacity-0 group-hover/node:opacity-100 transition-all duration-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    >
                        <Plus className="w-3 h-3" />
                        افزودن
                    </button>
                ) : null}

                {!isAdded && canAdd && (
                    <button
                        type="button"
                        onClick={() => onAddToFinal(node)}
                        className="sm:hidden p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600 flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}

                {canAdd && !isEditing && (
                    <button
                        type="button"
                        onClick={() => onStartEdit(node.id, node.title, 'scope')}
                        className="hidden sm:block p-1.5 hover:bg-amber-100 rounded-lg text-gray-400 hover:text-amber-600 transition-colors opacity-0 group-hover/node:opacity-100 flex-shrink-0"
                        title="ویرایش عنوان"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                )}

                {canRemove && (
                    <button
                        type="button"
                        onClick={() => onDelete(node.id, node.title, 'scope')}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors flex-shrink-0 sm:opacity-0 sm:group-hover/node:opacity-100"
                        title="حذف"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div className="mr-3 sm:mr-4 border-r-2 border-amber-100 rounded-r-lg overflow-hidden">
                    {node.children!.map(child => (
                        <ScopeTreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
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
    );
}

// ============================================================
// کامپوننت: رندر نود درخت نهایی (Final Tree)
// ============================================================
export function FinalTreeNode({
                                  node,
                                  depth = 0,
                                  expandedNodes,
                                  editingNodeId,
                                  editingLabel,
                                  editingTree,
                                  draggedNodeId,
                                  dragOverNodeId,
                                  dragOverPosition,
                                  onToggleNode,
                                  onStartEdit,
                                  onSaveLabel,
                                  onSetEditingLabel,
                                  onSetEditingNodeId,
                                  onDelete,
                                  onOpenUnitSettings,
                                  onAddGroup,
                                  onOpenCategoryPicker,
                                  onDragStart,
                                  onDragEnd,
                                  onDragOver,
                                  onDrop,
                              }: {
    node: TreeNode;
    depth?: number;
    expandedNodes: Set<string>;
    editingNodeId: string | null;
    editingLabel: string;
    editingTree: 'scope' | 'final';
    draggedNodeId: string | null;
    dragOverNodeId: string | null;
    dragOverPosition: 'before' | 'after' | 'inside' | null;
    onToggleNode: (nodeId: string) => void;
    onStartEdit: (nodeId: string, title: string, tree: 'scope' | 'final') => void;
    onSaveLabel: (nodeId: string) => void;
    onSetEditingLabel: (value: string) => void;
    onSetEditingNodeId: (nodeId: string | null) => void;
    onDelete: (nodeId: string, title: string, tree: 'scope' | 'final') => void;
    onOpenUnitSettings: (nodeId: string) => void;
    onAddGroup: (parentId: string | null) => void;
    onOpenCategoryPicker: (parentId: string | null) => void;
    onDragStart: (e: React.DragEvent, nodeId: string) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent, nodeId: string) => void;
    onDrop: (e: React.DragEvent, targetId: string) => void;
}) {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isEditing = editingNodeId === node.id && editingTree === 'final';
    const isDragging = draggedNodeId === node.id;
    const isDragOver = dragOverNodeId === node.id;
    const alternativeUnits = node.alternativeUnits || [];
    const baseUnitTitle = node.baseUnitTitle || 'واحد';
    const canHaveAds = (node.isLeaf === true || !hasChildren) && !!node.categoryId;

    return (
        <div className="group/node">
            <div
                draggable
                onDragStart={(e) => onDragStart(e, node.id)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => onDragOver(e, node.id)}
                onDrop={(e) => onDrop(e, node.id)}
                className={cn(
                    'flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-200 border-2',
                    isDragging && 'opacity-40 border-dashed border-primary',
                    isDragOver && dragOverPosition === 'inside' && 'border-primary bg-primary/5',
                    isDragOver && dragOverPosition === 'before' && 'border-t-4 border-t-primary border-x-transparent border-b-transparent',
                    isDragOver && dragOverPosition === 'after' && 'border-b-4 border-b-primary border-x-transparent border-t-transparent',
                    !isDragging && !isDragOver && !isEditing && 'border-transparent hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-transparent',
                    isEditing && 'border-primary/50 bg-blue-50/50',
                )}
                style={{ paddingRight: depth * 16 + 8 }}
            >
                <div className="hidden sm:block cursor-grab active:cursor-grabbing flex-shrink-0">
                    <GripVertical className="w-4 h-4 text-gray-300" />
                </div>

                {hasChildren ? (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleNode(node.id); }}
                        className="p-1 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                    >
                        <div className={cn('transition-transform duration-200', !isExpanded ? 'rotate-0' : '-rotate-90')}>
                            <ChevronLeft className="w-4 h-4 text-blue-600" />
                        </div>
                    </button>
                ) : (
                    <div className="w-6 flex-shrink-0" />
                )}

                {canHaveAds ? (
                    <div className="p-1 bg-primary/10 rounded-lg flex-shrink-0">
                        <Package className="w-3.5 h-3.5 text-primary" />
                    </div>
                ) : isExpanded ? (
                    <div className="p-1 bg-blue-50 rounded-lg flex-shrink-0">
                        <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                ) : (
                    <div className="p-1 bg-blue-50 rounded-lg flex-shrink-0">
                        <Folder className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                )}

                {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <input
                            type="text"
                            value={editingLabel}
                            onChange={(e) => onSetEditingLabel(e.target.value)}
                            onBlur={() => onSaveLabel(node.id)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); onSaveLabel(node.id); }
                                if (e.key === 'Escape') { e.preventDefault(); onSetEditingNodeId(null); }
                            }}
                            autoFocus
                            className="flex-1 min-w-0 h-8 px-3 border-2 border-primary/50 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <button onClick={() => onSaveLabel(node.id)} className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600">
                            <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => onSetEditingNodeId(null)} className="p-1.5 hover:bg-red-100 rounded-lg text-red-500">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 min-w-0">
                            <span className="block text-right text-sm font-medium truncate">{node.title}</span>
                            {canHaveAds && !isEditing && (
                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                    {node.baseUnitTitle && (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                                            <Ruler className="w-2.5 h-2.5" />
                                            {node.baseUnitTitle}
                                        </span>
                                    )}
                                    {node.overrideUnitTitle && (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600">
                                            <Star className="w-2.5 h-2.5 fill-violet-500" />
                                            {node.overrideUnitTitle}
                                            {node.overrideUnitQty != null && (
                                                <span className="font-normal text-violet-400">
                                                    = {node.overrideUnitQty} {node.baseUnitTitle || 'واحد'}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                    {alternativeUnits.map((au: any, idx: number) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500"
                                        >
                                            <Package className="w-2.5 h-2.5" />
                                            {au.unitTitle}
                                            {au.qty != null && <span className="text-gray-400">= {au.qty} {node.baseUnitTitle || 'واحد'}</span>}
                                            {au.isVariableQty && <span className="text-[8px] text-amber-500">🔧</span>}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {canHaveAds && node.overrideUnitTitle && !isEditing && (
                    <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 flex-shrink-0">
                        {node.overrideUnitTitle}
                    </span>
                )}

                {canHaveAds && alternativeUnits.length > 0 && !isEditing && (
                    <span className="hidden sm:inline-flex text-[9px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 flex-shrink-0">
                        +{alternativeUnits.length}
                    </span>
                )}

                <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                        type="button"
                        onClick={() => onStartEdit(node.id, node.title, 'final')}
                        className="p-1.5 hover:bg-blue-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                        title="ویرایش عنوان"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {canHaveAds && (
                        <button
                            type="button"
                            onClick={() => onOpenUnitSettings(node.id)}
                            className="p-1.5 hover:bg-violet-100 rounded-lg text-gray-400 hover:text-violet-600 transition-colors"
                            title="تنظیمات واحد"
                        >
                            <Settings className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {!node.isLeaf && (
                        <>
                            <button
                                type="button"
                                onClick={() => onAddGroup(node.id)}
                                className="p-1.5 hover:bg-blue-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                                title="افزودن زیرگروه"
                            >
                                <FolderPlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => onOpenCategoryPicker(node.id)}
                                className="p-1.5 hover:bg-emerald-100 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
                                title="افزودن دسته‌بندی"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => onDelete(node.id, node.title, 'final')}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                        title="حذف"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="mr-3 sm:mr-6 border-r-2 border-blue-100 rounded-r-lg overflow-hidden">
                    {node.children!.map(child => (
                        <FinalTreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
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
    );
}