// app/home/HomeCategoryFilter.tsx
'use client';
import React, { useState } from 'react';
import { ChevronLeft, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryNode {
    id: string;
    title: string;
    children: CategoryNode[];
}

interface Props {
    categoryTree: CategoryNode[];
    selectedCategoryId: string | null;
    onSelect: (id: string) => void;
    isMobile?: boolean;
}

export default function HomeCategoryFilter({
                                               categoryTree,
                                               selectedCategoryId,
                                               onSelect,
                                               isMobile,
                                           }: Props) {
    const [drillStack, setDrillStack] = useState<CategoryNode[][]>([categoryTree]);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [selectedTopLevel, setSelectedTopLevel] = useState<string | null>(null);

    const currentLevel = drillStack[drillStack.length - 1];
    const topLevel = categoryTree;

    const drillDown = (node: CategoryNode) => {
        if (node.children && node.children.length > 0) {
            setDrillStack(prev => [...prev, node.children]);
        } else {
            onSelect(node.id);
            if (isMobile) {
                setMobileOpen(false);
                setDrillStack([categoryTree]);
            }
        }
    };

    const goBack = () => {
        if (drillStack.length > 1) setDrillStack(prev => prev.slice(0, -1));
    };

    const openMobileForNode = (node: CategoryNode) => {
        setDrillStack([categoryTree, node.children || []]);
        setSelectedTopLevel(node.id);
        setMobileOpen(true);
    };

    const closeMobile = () => {
        setMobileOpen(false);
        setDrillStack([categoryTree]);
        setSelectedTopLevel(null);
    };

    const selectAll = () => {
        onSelect('');
        if (isMobile) closeMobile();
    };

    if (isMobile) {
        return (
            <>
                {/* نوار افقی سطح اول */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-hide">
                    {topLevel.map(node => {
                        const isSelected = node.id === selectedCategoryId;
                        return (
                            <button
                                key={node.id}
                                onClick={() => openMobileForNode(node)}
                                className={cn(
                                    "whitespace-nowrap px-3.5 py-2 text-xs font-medium transition-all duration-200 rounded-full border",
                                    isSelected
                                        ? "bg-primary/10 text-primary border-primary"
                                        : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary"
                                )}
                            >
                                {node.title}
                            </button>
                        );
                    })}
                    <button
                        onClick={selectAll}
                        className={cn(
                            "whitespace-nowrap px-3.5 py-2 text-xs font-medium rounded-full border",
                            !selectedCategoryId
                                ? "bg-primary/10 text-primary border-primary"
                                : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary"
                        )}
                    >
                        همه
                    </button>
                </div>

                {/* Bottom Sheet Modal */}
                {mobileOpen && (
                    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeMobile} />
                        <div className="relative bg-surface rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
                                <div className="flex items-center gap-2">
                                    {drillStack.length > 1 && (
                                        <button onClick={goBack} className="p-1.5 hover:bg-surface-container-low rounded-full">
                                            <ArrowRight className="w-5 h-5 text-on-surface" />
                                        </button>
                                    )}
                                    <h3 className="font-semibold text-sm">
                                        {drillStack.length > 1
                                            ? topLevel.find(n => n.id === selectedTopLevel)?.title || 'انتخاب'
                                            : 'همه دسته‌ها'}
                                    </h3>
                                </div>
                                <button onClick={closeMobile} className="p-1.5 hover:bg-surface-container-low rounded-full">
                                    <X className="w-5 h-5 text-on-surface-variant" />
                                </button>
                            </div>
                            <div className="overflow-y-auto p-3 space-y-1">
                                {currentLevel.map(node => {
                                    const isSelected = node.id === selectedCategoryId;
                                    const hasChildren = node.children && node.children.length > 0;
                                    return (
                                        <button
                                            key={node.id}
                                            onClick={() => drillDown(node)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors",
                                                isSelected
                                                    ? "bg-primary/10 text-primary"
                                                    : "hover:bg-surface-container-low text-on-surface"
                                            )}
                                        >
                                            <span className="text-sm font-medium">{node.title}</span>
                                            {hasChildren && <ChevronLeft className="w-4 h-4 text-on-surface-variant" />}
                                            {isSelected && !hasChildren && <span className="w-2 h-2 rounded-full bg-primary" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Desktop
    return (
        <div className="space-y-2">
            {drillStack.length > 1 && (
                <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-2 overflow-x-auto">
                    <button
                        onClick={() => setDrillStack([categoryTree])}
                        className="hover:text-primary transition-colors whitespace-nowrap"
                    >
                        همه دسته‌ها
                    </button>
                    {drillStack.slice(0, -1).map((_, idx) => (
                        <React.Fragment key={idx}>
                            <ChevronLeft className="w-3 h-3 flex-shrink-0" />
                            <button
                                onClick={() => setDrillStack(drillStack.slice(0, idx + 2))}
                                className="hover:text-primary transition-colors whitespace-nowrap"
                            >
                                {drillStack[idx]?.[0]?.title || '...'}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}
            <ul className="space-y-0.5">
                {currentLevel.map(node => {
                    const isSelected = node.id === selectedCategoryId;
                    const hasChildren = node.children && node.children.length > 0;
                    return (
                        <li key={node.id}>
                            <button
                                onClick={() => drillDown(node)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                    isSelected
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                                )}
                            >
                                <span>{node.title}</span>
                                {hasChildren && <ChevronLeft className="w-4 h-4 opacity-60" />}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}