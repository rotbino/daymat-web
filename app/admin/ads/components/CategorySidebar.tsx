// app/admin/ads/components/CategorySidebar.tsx
'use client';

import React from 'react';
import { ChevronLeft, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryNode } from './types';

interface Props {
    categoryTree: CategoryNode[];
    selectedCategory: string | null;
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
}

export function CategorySidebar({ categoryTree, selectedCategory, expandedIds, onToggle, onSelect }: Props) {
    return (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden sticky top-4 max-h-[80vh] flex flex-col">
            <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/20">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-primary" />دسته‌بندی</h3>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
                <button onClick={() => onSelect('all')}
                        className={cn("w-full text-right px-3 py-2 rounded-lg text-sm mb-1 transition-colors",
                            !selectedCategory ? "bg-primary/10 text-primary font-medium" : "text-on-surface-variant hover:bg-surface-container-low")}>📋 همه</button>
                {categoryTree.map(node => (
                    <CategorySidebarNode key={node.id} node={node} depth={0}
                                         selectedCategory={selectedCategory} expandedIds={expandedIds} onToggle={onToggle} onSelect={onSelect} />
                ))}
            </div>
        </div>
    );
}

function CategorySidebarNode({ node, depth, selectedCategory, expandedIds, onToggle, onSelect }: {
    node: CategoryNode; depth: number; selectedCategory: string | null;
    expandedIds: Set<string>; onToggle: (id: string) => void; onSelect: (id: string) => void;
}) {
    const hasChildren = node.children?.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedCategory === node.id;

    return (
        <div>
            <button onClick={() => { onSelect(node.id); if (hasChildren) onToggle(node.id); }}
                    className={cn("w-full text-right px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 hover:bg-surface-container-low",
                        isSelected && "bg-primary/10 text-primary font-medium")}
                    style={{ paddingRight: `${8 + depth * 12}px` }}>
                {hasChildren ? <ChevronLeft className={cn("w-3 h-3 flex-shrink-0 transition-transform text-on-surface-variant/50", isExpanded && "-rotate-90")} /> : <span className="w-3 h-3 flex-shrink-0" />}
                <span className="truncate">{node.title}</span>
            </button>
            {hasChildren && isExpanded && node.children.map(child => (
                <CategorySidebarNode key={child.id} node={child} depth={depth + 1}
                                     selectedCategory={selectedCategory} expandedIds={expandedIds} onToggle={onToggle} onSelect={onSelect} />
            ))}
        </div>
    );
}