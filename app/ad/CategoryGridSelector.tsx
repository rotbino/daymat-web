// components/ad/CategoryGridSelector.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryNode {
    id: string;
    title: string;
    slug: string;
    path: string;
    level: number;
    isSelected: boolean;
    customLabel: string | null;
    defaultUnitId: string | null;
    unitTitle: string;
    unitShortCode: string;
    defaultMinQuantity: number | null;
    example: string;
    children: CategoryNode[];
}

interface CategoryGridSelectorProps {
    categoryTree: CategoryNode[];
    selectedCategoryId: string;
    onSelect: (categoryId: string) => void;
    error?: string;
}

// ----------------------------------------------------------------
// ۱. حذف گره‌های تک‌فرزندی غیرانتخابی در سطوح داخلی
//    اگر گره‌ای isSelected نباشد و دقیقاً یک فرزند داشته باشد،
//    آن را دور می‌زنیم و فرزندش را جایگزین می‌کنیم.
// ----------------------------------------------------------------
function trimSingleChildNodes(nodes: CategoryNode[]): CategoryNode[] {
    if (!nodes) return [];

    return nodes.reduce((acc: CategoryNode[], node) => {
        // اگر برگ است و انتخاب شده، نگه دار
        if (!node.children || node.children.length === 0) {
            if (node.isSelected) acc.push(node);
            return acc;
        }

        // ابتدا فرزندان را هرس کن
        const trimmedChildren = trimSingleChildNodes(node.children);

        // اگر گره انتخاب نشده و بعد از هرس فقط یک فرزند دارد، همان فرزند را نگه دار
        if (!node.isSelected && trimmedChildren.length === 1) {
            acc.push(trimmedChildren[0]);
        } else {
            acc.push({ ...node, children: trimmedChildren });
        }

        return acc;
    }, []);
}

// ----------------------------------------------------------------
// ۲. collapse ریشه: اگر فقط یک گرهٔ غیرانتخابی با فرزند داریم،
//    مستقیماً به سطح پایین‌تر برو (حتی اگر چند فرزند داشته باشد).
//    این کار را آنقدر تکرار کن تا به سطحی با بیش از یک گره
//    یا برگ‌های قابل انتخاب برسیم.
// ----------------------------------------------------------------
function collapseSingleRoot(nodes: CategoryNode[]): CategoryNode[] {
    while (nodes.length === 1 && !nodes[0].isSelected && nodes[0].children && nodes[0].children.length > 0) {
        nodes = nodes[0].children;
    }
    return nodes;
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

    // ⭐ ترکیب هرس و collapse برای نمایش مستقیم برگ‌ها
    const trimmedTree = useMemo(() => {
        let trimmed = trimSingleChildNodes(categoryTree);   // ابتدا هرس داخلی
        trimmed = collapseSingleRoot(trimmed);              // سپس باز کردن ریشهٔ تکی
        return trimmed;
    }, [categoryTree]);

    // آیا درخت اصلی (قبل از هرس) اصلاً درختی است؟
    const isTree = useMemo(() => {
        return categoryTree.some(node => node.children && node.children.length > 0);
    }, [categoryTree]);

    // تمام برگ‌های قابل انتخاب (برای جستجو)
    const allLeaves = useMemo(() => {
        const flatten = (nodes: CategoryNode[]): CategoryNode[] => {
            let result: CategoryNode[] = [];
            for (const node of nodes) {
                if (node.isSelected) result.push(node);
                if (node.children?.length) result = result.concat(flatten(node.children));
            }
            return result;
        };
        return flatten(trimmedTree);
    }, [trimmedTree]);

    // وقتی trimmedTree تغییر کند، سطح جاری را به آن تنظیم کن
    React.useEffect(() => {
        setCurrentLevel(trimmedTree);
        setBreadcrumb([]);
    }, [trimmedTree]);

    // گره‌های نمایش‌داده‌شده (جستجو یا سطح فعلی)
    const displayNodes = useMemo(() => {
        if (searchQuery.trim()) {
            return allLeaves.filter(node => node.title.includes(searchQuery.trim()));
        }
        return currentLevel;
    }, [searchQuery, allLeaves, currentLevel]);

    // کلیک روی یک گره (دریل داون)
    const drillDown = (node: CategoryNode) => {
        if (node.children && node.children.length > 0 && !searchQuery.trim()) {
            setBreadcrumb(prev => [...prev, node]);
            setCurrentLevel(node.children);
        } else {
            onSelect(node.id);
        }
    };

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

    return (
        <div className="space-y-3">
            {/* نوار جستجو */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی دسته‌بندی..."
                    className="w-full h-10 bg-surface-container-lowest border border-outline px-4 pr-10 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none rounded-lg"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>

            {/* Breadcrumb (فقط در حالت درختی و بدون جستجو) */}
            {isTree && !searchQuery.trim() && breadcrumb.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-on-surface-variant overflow-x-auto py-1">
                    <button
                        type="button"
                        onClick={() => {
                            setBreadcrumb([]);
                            setCurrentLevel(trimmedTree);
                        }}
                        className="text-primary hover:underline whitespace-nowrap"
                    >
                        همه دسته‌ها
                    </button>
                    {breadcrumb.map((node, idx) => (
                        <React.Fragment key={node.id}>
                            <ChevronLeft className="w-3 h-3 flex-shrink-0" />
                            <button
                                type="button"
                                onClick={() => {
                                    const newBreadcrumb = breadcrumb.slice(0, idx + 1);
                                    setBreadcrumb(newBreadcrumb);
                                    setCurrentLevel(node.children || []);
                                }}
                                className={cn(
                                    "hover:underline whitespace-nowrap",
                                    idx === breadcrumb.length - 1 ? "text-on-surface font-medium" : "text-on-surface-variant"
                                )}
                            >
                                {node.title}
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* دکمه بازگشت */}
            {isTree && !searchQuery.trim() && breadcrumb.length > 0 && (
                <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                    <ArrowLeft className="w-3 h-3" />
                    بازگشت به {breadcrumb[breadcrumb.length - 1]?.title || 'قبلی'}
                </button>
            )}

            {/* شبکه انتخاب */}
            <div className="max-h-[280px] sm:max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {displayNodes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {displayNodes.map((node) => {
                            const isCurrent = selectedCategoryId === node.id;
                            const hasChildren = node.children && node.children.length > 0;
                            const isDrillable = isTree && hasChildren && !searchQuery.trim();

                            return (
                                <button
                                    key={node.id}
                                    type="button"
                                    onClick={() => drillDown(node)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center relative",
                                        isCurrent
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-outline-variant/50 hover:border-primary/30 hover:bg-surface-container-low"
                                    )}
                                >
                                    <span className={cn(
                                        "text-sm font-bold leading-tight",
                                        isCurrent ? "text-primary" : "text-on-surface"
                                    )}>
                                        {node.title}
                                    </span>
                                    {node.isSelected && (
                                        <span className="text-[10px] text-on-surface-variant mt-1">
                                            واحد: {node.unitTitle}
                                        </span>
                                    )}
                                    {isDrillable && (
                                        <span className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                                            زیرشاخه‌ها <ArrowLeft className="w-3 h-3" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6 text-sm text-on-surface-variant">
                        {searchQuery ? `دسته‌بندی با نام "${searchQuery}" یافت نشد` : 'دسته‌بندی وجود ندارد'}
                    </div>
                )}
            </div>

            {error && <p className="text-error text-xs mt-2">{error}</p>}
        </div>
    );
}