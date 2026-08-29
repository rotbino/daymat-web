// app/home/CategorySidebar.tsx
'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowRight, ChevronDown, ChevronLeft, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildFilterHref, findPathToNode, CategoryNode } from '@/lib/utils/filterUrl';
import { QuantityRow } from './QuantityFilters';

interface Props { categoryTree: CategoryNode[]; }

export default function CategorySidebar({ categoryTree }: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const selectedId = searchParams.get('category');

    const path = useMemo(() => (selectedId ? findPathToNode(categoryTree, selectedId) ?? [] : []), [categoryTree, selectedId]);
    const rootNode = path[0] ?? null;
    const currentNode = path[path.length - 1] ?? null;
    const isLeaf = !!currentNode && (!currentNode.children || currentNode.children.length === 0);
    const unit = currentNode?.unitShortCode || 'تن';

    const href = useCallback(
        (id: string | null) => buildFilterHref(pathname, searchParams, categoryTree, { categoryId: id }),
        [pathname, searchParams, categoryTree],
    );

    // باز خودکار شدن اجدادِ گره انتخاب‌شده (داخل زیردرخت ریشه)
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    useEffect(() => {
        if (!selectedId || !rootNode) return;
        const ids: string[] = [];
        for (let i = 1; i < path.length - 1; i++) ids.push(path[i].id);
        if (currentNode?.children?.length) ids.push(currentNode.id);
        setExpanded((prev) => {
            const next = new Set(prev);
            let changed = false;
            ids.forEach((id) => { if (!next.has(id)) { next.add(id); changed = true; } });
            return changed ? next : prev;
        });
    }, [selectedId, path, rootNode, currentNode]);

    const toggle = useCallback((id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    // ─── حالت ۱: هیچ دسته‌ای انتخاب نیست → لیست تخت سطح اول (مثل باسکول) ───
    if (!rootNode) {
        return (
            <div className="py-3">
               {/* <div className="px-4 pb-2 flex items-center gap-1.5 text-xs font-bold text-on-surface-variant">
                    <LayoutGrid className="w-3.5 h-3.5" /> دسته‌بندی بازار
                </div>*/}
                <nav aria-label="دسته‌بندی‌ها" className="px-2">
                    <ul className="space-y-0.5">
                        {categoryTree.map((node) => (
                            <li key={node.id}>
                                <Link href={href(node.id)} scroll={false}
                                      className="group flex items-center justify-between h-11 px-3 rounded-xl text-[13px] text-on-surface/90 hover:bg-surface-container-high/70 transition-colors">
                                    <span className="truncate font-medium">{node.title}</span>
                                    <ChevronLeft className="w-4 h-4 text-on-surface-variant/25 group-hover:text-primary transition-colors" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        );
    }

    // ─── حالت ۲: صفحه تخصصی ریشه → درخت فقطِ فرزندان ریشه + فیلترهای برگ ───
    return (
        <div className="py-3">
            <div className="px-3 pb-2">
                <Link href={href(null)} scroll={false}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" /> همه دسته‌ها
                </Link>
            </div>

            {/* هدر محیط تخصصی */}
            <div className="mx-2 mb-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/10">
                <h2 className="text-sm font-extrabold text-primary">{rootNode.title}</h2>
                {path.length > 1 && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-on-surface-variant/70 flex-wrap">
                        {path.slice(1).map((n, i) => (
                            <span key={n.id}>{i > 0 && <span className="opacity-40 mx-0.5">/</span>}{n.title}</span>
                        ))}
                    </div>
                )}
            </div>

            <nav aria-label={`زیرشاخه‌های ${rootNode.title}`} className="px-2">
                <ul className="space-y-0.5">
                    {(rootNode.children ?? []).map((node) => (
                        <SidebarItem key={node.id} node={node} selectedId={selectedId} expanded={expanded} onToggle={toggle} buildHref={href} />
                    ))}
                </ul>
            </nav>

            {/* فیلترهای کالا — فقط در سطح برگ (حجم خرید / موجودی) */}
            {isLeaf && currentNode && (
                <div className="mx-2 mt-3 pt-3 border-t border-outline-variant/20 px-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant mb-2.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" /> فیلترهای {currentNode.title}
                    </div>
                    <div className="space-y-3">
                        <QuantityRow param="minq" label="حداقل حجم خرید" unit={unit} categoryTree={categoryTree} />
                        <QuantityRow param="minstock" label="حداقل موجودی" unit={unit} categoryTree={categoryTree} />
                    </div>
                </div>
            )}
        </div>
    );
}

interface ItemProps {
    node: CategoryNode;
    selectedId: string | null;
    expanded: Set<string>;
    onToggle: (id: string) => void;
    buildHref: (id: string | null) => string;
}

function SidebarItem({ node, selectedId, expanded, onToggle, buildHref }: ItemProps) {
    const hasChildren = !!node.children?.length;
    const isActive = node.id === selectedId;
    const isExpanded = expanded.has(node.id);

    return (
        <li>
            <div className={cn('group flex items-center rounded-xl transition-colors', isActive ? 'bg-primary/10' : 'hover:bg-surface-container-high/70')}>
                {hasChildren ? (
                    <button type="button" onClick={() => onToggle(node.id)} aria-expanded={isExpanded}
                            aria-label={isExpanded ? `بستن ${node.title}` : `باز کردن ${node.title}`}
                            className="flex-shrink-0 w-7 h-10 flex items-center justify-center text-on-surface-variant/50 hover:text-primary transition-colors">
                        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', isExpanded && 'rotate-180')} />
                    </button>
                ) : (
                    <span className="w-4 flex-shrink-0" />
                )}
                <Link href={buildHref(node.id)} scroll={false}
                      className={cn('flex-1 min-w-0 h-10 flex items-center pe-2 text-[13px]', isActive ? 'font-bold text-primary' : 'text-on-surface/90')}>
                    <span className="truncate">{node.title}</span>
                </Link>
            </div>

            {hasChildren && isExpanded && (
                <ul className="space-y-0.5 my-0.5 mb-1 border-s border-outline-variant/20 ms-6">
                    {node.children!.map((child) => (
                        <SidebarItem key={child.id} node={child} selectedId={selectedId} expanded={expanded} onToggle={onToggle} buildHref={buildHref} />
                    ))}
                </ul>
            )}
        </li>
    );
}