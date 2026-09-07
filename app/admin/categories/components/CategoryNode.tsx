// app/admin/categories/components/CategoryNode.tsx
'use client';

import React from 'react';
import { ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryNode as CategoryNodeType } from '../page';

interface CategoryNodeProps {
    node: CategoryNodeType;
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onEdit: (cat: CategoryNodeType) => void;
    onDelete: (cat: CategoryNodeType) => void;
    onAddChild: (parent: CategoryNodeType) => void;
}

export function CategoryNodeComponent({ node, expandedIds, onToggle, onEdit, onDelete, onAddChild }: CategoryNodeProps) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const indent = node.level * 20;

    return (
        <div>
            <div
                className="flex items-center gap-1.5 px-3 py-2 hover:bg-surface-container-low transition-colors cursor-pointer group"
                style={{ paddingRight: `${12 + indent}px` }}
                onClick={() => hasChildren && onToggle(node.id)}
            >
                {/* آیکون باز/بسته */}
                <span className={cn(
                    "w-4 h-4 flex items-center justify-center flex-shrink-0 transition-transform",
                    hasChildren ? "text-on-surface-variant/60" : "text-transparent",
                    isExpanded && hasChildren && "-rotate-90"
                )}>
                    <ChevronRight className="w-3.5 h-3.5" />
                </span>

                {/* آیکون و نام */}
                {/*<span className="text-base flex-shrink-0">{node.icon || '📦'}</span>*/}
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-on-surface truncate py-1">{node.title}</p>
                    {/*<p className="text-[10px] text-on-surface-variant/50  leading-tight pt-3">{node.slug}</p>*/}
                </div>

                {/* تعداد زیرمجموعه */}
                {hasChildren && (
                    <span className="text-[10px] text-on-surface-variant/40 flex-shrink-0">
                        {node.children.length}
                    </span>
                )}

                {/* دکمه‌ها - دسکتاپ: hover ظاهر میشن، موبایل: همیشه visible */}
                <div className="flex items-center gap-0.5 flex-shrink-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddChild(node); }}
                        className="p-1 hover:bg-primary/10 hover:text-primary rounded transition-colors"
                        title="زیرمجموعه"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(node); }}
                        className="p-1 hover:bg-primary/10 hover:text-primary rounded transition-colors"
                        title="ویرایش"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(node); }}
                        className="p-1 hover:bg-error/10 hover:text-error rounded transition-colors"
                        title="حذف"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* فرزندان */}
            {hasChildren && isExpanded && (
                <div>
                    {node.children.map(child => (
                        <CategoryNodeComponent
                            key={child.id}
                            node={child}
                            expandedIds={expandedIds}
                            onToggle={onToggle}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}