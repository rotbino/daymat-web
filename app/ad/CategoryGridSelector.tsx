// components/ad/CategoryGridSelector.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {Search, ChevronLeft, ArrowRight, Home, X} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryNode {
    id: string;
    title: string;
    categoryId?: string;
    isLeaf?: boolean;
    children?: CategoryNode[];
    [key: string]: any;
}

interface CategoryGridSelectorProps {
    categoryTree: CategoryNode[];
    selectedCategoryId: string;
    onSelect: (categoryId: string) => void;
    error?: string;
}

// ─── حذف گروه‌های تک‌فرزندی ───
function trimSingleChildNodes(nodes: CategoryNode[]): CategoryNode[] {
    if (!nodes) return [];

    return nodes.reduce((acc: CategoryNode[], node) => {
        const isLeaf = node.isLeaf === true;
        const hasChildren = node.children && node.children.length > 0;

        // برگ‌ها همیشه نگه داشته می‌شن
        if (isLeaf || !hasChildren) {
            acc.push(node);
            return acc;
        }

        // ابتدا فرزندان را هرس کن
        const trimmedChildren = trimSingleChildNodes(node.children!);

        // اگر فقط یک فرزند دارد و خودش برگ نیست، همون فرزند رو نگه دار
        if (trimmedChildren.length === 1) {
            acc.push(trimmedChildren[0]);
        } else {
            acc.push({ ...node, children: trimmedChildren });
        }

        return acc;
    }, []);
}

// ─── باز کردن ریشه تکی ───
function collapseSingleRoot(nodes: CategoryNode[]): CategoryNode[] {
    let result = nodes;
    while (result.length === 1 && result[0].isLeaf !== true && result[0].children && result[0].children.length > 0) {
        result = result[0].children;
    }
    return result;
}

export function CategoryGridSelector({
                                         categoryTree,
                                         selectedCategoryId,
                                         onSelect,
                                         error,
                                     }: CategoryGridSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentLevel, setCurrentLevel] = useState<CategoryNode[]>([]);
    const [breadcrumb, setBreadcrumb] = useState<CategoryNode[]>([]);

    // ✅ ترکیب هرس و collapse
    const trimmedTree = useMemo(() => {
        let trimmed = trimSingleChildNodes(categoryTree || []);
        trimmed = collapseSingleRoot(trimmed);
        return trimmed;
    }, [categoryTree]);

    // آیا درخت چند سطحی است؟
    const isTree = useMemo(() => {
        return trimmedTree.some(node => node.children && node.children.length > 0);
    }, [trimmedTree]);

    // همه برگ‌ها برای جستجو
    const allLeaves = useMemo(() => {
        const flatten = (nodes: CategoryNode[]): CategoryNode[] => {
            let result: CategoryNode[] = [];
            for (const node of nodes) {
                if (node.isLeaf === true) {
                    result.push(node);
                }
                if (node.children?.length) {
                    result = result.concat(flatten(node.children));
                }
            }
            return result;
        };
        return flatten(trimmedTree);
    }, [trimmedTree]);

    // ✅ وقتی trimmedTree تغییر کرد، سطح جاری رو تنظیم کن
    React.useEffect(() => {
        setCurrentLevel(trimmedTree);
        setBreadcrumb([]);
    }, [trimmedTree]);

    // ✅ گره‌های نمایش‌داده‌شده
    const displayNodes = useMemo(() => {
        if (searchQuery.trim()) {
            const q = searchQuery.trim();
            return allLeaves.filter(node =>
                (node.title || '').includes(q) ||
                (node.customLabel || '').includes(q)
            );
        }
        return currentLevel;
    }, [searchQuery, allLeaves, currentLevel]);

    // ✅ کلیک روی گره
    const handleNodeClick = (node: CategoryNode) => {
        const hasChildren = node.children && node.children.length > 0;
        const isLeaf = node.isLeaf === true;

        if (hasChildren && !isLeaf && !searchQuery.trim()) {
            // دریل داون
            setBreadcrumb(prev => [...prev, node]);
            setCurrentLevel(node.children!);
        } else {
            // انتخاب برگ
            onSelect(node.categoryId || node.id);
        }
    };

    // ✅ بازگشت به سطح قبلی
    const goBack = () => {
        if (breadcrumb.length === 0) return;
        const newBreadcrumb = [...breadcrumb];
        newBreadcrumb.pop();
        setBreadcrumb(newBreadcrumb);

        if (newBreadcrumb.length === 0) {
            setCurrentLevel(trimmedTree);
        } else {
            setCurrentLevel(newBreadcrumb[newBreadcrumb.length - 1].children || []);
        }
    };

    // ✅ بازگشت به ریشه
    const goHome = () => {
        setBreadcrumb([]);
        setCurrentLevel(trimmedTree);
        setSearchQuery('');
    };

    return (
        <div className="space-y-3">
            {/* جستجو */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی و انتخاب دسته‌بندی..."
                    className="w-full h-11 bg-white border border-gray-300 dark:border-gray-600 px-4 pr-10 text-sm rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* ✅ Breadcrumb + دکمه بازگشت واضح */}
            {(breadcrumb.length > 0 || searchQuery) && !searchQuery.trim() && (
                <div className="flex items-center gap-2 flex-wrap">
                    {/* ✅ دکمه بازگشت واضح */}
                    {breadcrumb.length > 0 && (
                        <button
                            type="button"
                            onClick={goBack}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                            بازگشت
                        </button>
                    )}

                    {/* Breadcrumb */}
                    {breadcrumb.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 overflow-x-auto">
                            <button
                                type="button"
                                onClick={goHome}
                                className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap"
                            >
                                <Home className="w-3 h-3" />
                                خانه
                            </button>
                            {breadcrumb.map((node, idx) => (
                                <React.Fragment key={node.id}>
                                    <ChevronLeft className="w-3 h-3 flex-shrink-0 text-gray-400" />
                                    {idx === breadcrumb.length - 1 ? (
                                        <span className="text-on-surface font-bold whitespace-nowrap">{node.title}</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newBreadcrumb = breadcrumb.slice(0, idx + 1);
                                                setBreadcrumb(newBreadcrumb);
                                                setCurrentLevel(node.children || []);
                                            }}
                                            className="hover:text-primary hover:underline whitespace-nowrap"
                                        >
                                            {node.title}
                                        </button>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* شبکه انتخاب */}
            <div className="max-h-[300px] sm:max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {displayNodes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {displayNodes.map((node) => {
                            const isCurrent = selectedCategoryId === (node.categoryId || node.id);
                            const hasChildren = node.children && node.children.length > 0;
                            const isDrillable = hasChildren && node.isLeaf !== true && !searchQuery.trim();

                            return (
                                <button
                                    key={node.id}
                                    type="button"
                                    onClick={() => handleNodeClick(node)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center relative min-h-[80px]",
                                        isCurrent
                                            ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                                            : "border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    )}
                                >
                                    <span className={cn(
                                        "text-sm font-bold leading-tight",
                                        isCurrent ? "text-primary" : "text-on-surface"
                                    )}>
                                        {node.customLabel || node.title}
                                    </span>

                                    {isDrillable && (
                                        <span className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                                            <span className="text-[9px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                                                {node.children!.length} زیرگروه
                                            </span>
                                            <ArrowRight className="w-3 h-3" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-sm text-gray-400">
                        {searchQuery ? `دسته‌بندی با نام "${searchQuery}" یافت نشد` : 'دسته‌بندی وجود ندارد'}
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
    );
}