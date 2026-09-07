// app/admin/activities/components/ActivityNode.tsx
'use client';
import React from 'react';
import { ChevronLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityNode as ActivityNodeType } from '../page';

interface Props {
    node: ActivityNodeType;
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onEdit: (a: ActivityNodeType) => void;
    onDelete: (a: ActivityNodeType) => void;
    onAddChild: (p: ActivityNodeType) => void;
}

export function ActivityNodeComponent({ node, expandedIds, onToggle, onEdit, onDelete, onAddChild }: Props) {
    const hasChildren = node.children?.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const indent = node.level * 20;

    return (
        <div>
            <div className="flex items-center gap-1.5 px-3 py-2 hover:bg-surface-container-low transition-colors cursor-pointer group"
                 style={{ paddingRight: `${12 + indent}px` }}
                 onClick={() => hasChildren && onToggle(node.id)}>
                <span className={cn("w-4 h-4 flex items-center justify-center flex-shrink-0 transition-transform",
                    hasChildren ? "text-on-surface-variant/60" : "text-transparent",
                    isExpanded && hasChildren && "-rotate-90")}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                </span>
                <span className="text-base flex-shrink-0">⚡</span>
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-on-surface ">{node.title}</p>
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] text-on-surface-variant/50 font-mono">{node.slug}</p>
                        {node.code && <span className="text-[10px] text-on-surface-variant/40 bg-surface-container-high px-1 rounded">{node.code}</span>}
                    </div>
                </div>
                {hasChildren && <span className="text-[10px] text-on-surface-variant/40">{node.children.length}</span>}
                <div className="flex items-center gap-0.5 flex-shrink-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); onAddChild(node); }} className="p-1 hover:bg-primary/10 hover:text-primary rounded"><Plus className="w-3.5 h-3.5" /></button>
                    <button onClick={e => { e.stopPropagation(); onEdit(node); }} className="p-1 hover:bg-primary/10 hover:text-primary rounded"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={e => { e.stopPropagation(); onDelete(node); }} className="p-1 hover:bg-error/10 hover:text-error rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            </div>
            {hasChildren && isExpanded && (
                <div>{node.children.map(child => (
                    <ActivityNodeComponent key={child.id} node={child} expandedIds={expandedIds}
                                           onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
                ))}</div>
            )}
        </div>
    );
}