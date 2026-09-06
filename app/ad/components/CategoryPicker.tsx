// app/ad/components/CategoryPicker.tsx
'use client';

import React, {useMemo, useState} from 'react';
import { Check, ChevronDown, Folder, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatNode { id: string; title: string; children?: CatNode[]; }

interface Props {
    value: string;
    onChange: (id: string) => void;
    tree: CatNode[];
    disabled?: boolean;
}

/** انتخابگر درختی دسته — آکاردئونی، با مسیر انتخاب‌شده؛ جایگزین DropSelector برای دسته‌ها */
export default function CategoryPicker({ value, onChange, tree, disabled }: Props) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [open, setOpen] = useState(false);

    const selectedNode = useMemo(() => {
        const find = (nodes: CatNode[]): CatNode | null => {
            for (const n of nodes) {
                if (n.id === value) return n;
                if (n.children) { const f = find(n.children, value); if (f) return f; }
            }
            return null;
        };
        return find(tree);
    }, [tree, value]);

    const toggleExpand = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    if (!tree.length) return null;

    return (
        <div className="relative">
            <label className="text-xs font-medium text-on-surface block mb-1.5">دسته‌بندی</label>

            <button type="button" onClick={() => setOpen((o) => !o)} disabled={disabled}
                    className={cn('w-full h-11 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border',
                        'flex items-center justify-between gap-2 transition-all',
                        open ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-outline-variant/40 dark:border-gray-700',
                        disabled && 'opacity-50 cursor-not-allowed')}>
                <span className={cn('truncate flex items-center gap-1.5',
                    selectedNode ? 'text-on-surface font-medium' : 'text-on-surface-variant/50')}>
                    {selectedNode ? (
                        <>
                            <Package className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            {selectedNode.title}
                        </>
                    ) : 'انتخاب دسته…'}
                </span>
                <ChevronDown className={cn('w-4 h-4 text-on-surface-variant/60 transition-transform flex-shrink-0', open && 'rotate-180')} />
            </button>

            {open && (
                <div className="absolute top-full inset-x-0 mt-1 z-30 rounded-2xl bg-surface dark:bg-gray-900
                    border border-outline-variant/40 shadow-xl overflow-hidden">
                    <div className="max-h-64 overflow-y-auto scrollbar-slim p-2 space-y-0.5">
                        {/* گزینهٔ «بدون دسته» */}
                        <button type="button" onClick={() => { onChange(''); setOpen(false); }}
                                className={cn('w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-right transition-colors',
                                    !value ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 font-bold'
                                        : 'hover:bg-surface-container-high text-on-surface')}>
                            بدون دسته
                        </button>

                        {tree.map((node) => (
                            <TreeNode
                                key={node.id}
                                node={node}
                                depth={0}
                                value={value}
                                expanded={expanded}
                                toggleExpand={toggleExpand}
                                onSelect={(id) => { onChange(id); setOpen(false); }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function TreeNode({ node, depth, value, expanded, toggleExpand, onSelect }: any) {
    const hasChildren = !!node.children?.length;
    const isExpanded = expanded.has(node.id);
    const isSelected = value === node.id;

    return (
        <div>
            <button type="button"
                    onClick={() => { if (hasChildren) { toggleExpand(node.id); onSelect(node.id); } else { onSelect(node.id); } }}
                    className={cn('w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm text-right transition-colors',
                        isSelected ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 font-bold'
                            : 'hover:bg-surface-container-high text-on-surface')}
                    style={{ paddingLeft: depth * 16 }}>
                {hasChildren ? (
                    <ChevronDown className={cn('w-3.5 h-3.5 text-on-surface-variant/50 transition-transform flex-shrink-0',
                        !isExpanded && '-rotate-90')} />
                ) : (
                    <span className="w-3.5 flex-shrink-0" />
                )}
                {depth === 0 ? <Folder className="w-3.5 h-3.5 text-amber-500/70 flex-shrink-0" /> : <Package className="w-3 h-3 text-on-surface-variant/50 flex-shrink-0" />}
                <span className="flex-1 truncate">{node.title}</span>
                {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
            </button>

            {hasChildren && isExpanded && (
                <div>
                    {node.children.map((c: any) => (
                        <TreeNode key={c.id} node={c} depth={depth + 1} value={value}
                                  expanded={expanded} toggleExpand={toggleExpand} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
}