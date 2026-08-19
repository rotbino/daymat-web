// app/home/CategoryFilter.tsx
'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    onSelect: (categoryId: string) => void;
    // VolumeFilter props
    isLeaf?: boolean;
    selectedUnit?: string;
    minQuantity?: number;
    onVolumeChange?: (value: number) => void;
    // ریست کردن چک‌باکس‌ها هنگام بازگشت
    onResetFilters?: () => void;
    // ✅ لیست حجم‌های پویا از سرور
    volumePresets?: number[];
}

export default function CategoryFilter({
                                           categoryTree,
                                           selectedCategoryId,
                                           onSelect,
                                           isLeaf,
                                           selectedUnit = 'تن',
                                           minQuantity = 0,
                                           onVolumeChange,
                                           onResetFilters,
                                           volumePresets = [], // ✅ fallback خالی
                                       }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [path, setPath] = useState<CategoryNode[]>([]);

    useEffect(() => {
        setPath([]);
    }, [categoryTree]);

    const currentLevel = path.length === 0 ? categoryTree : (path[path.length - 1].children || []);

    const drillDown = useCallback(
        (node: CategoryNode) => {
            onSelect(node.id);
            const params = new URLSearchParams(searchParams.toString());
            params.set('category', node.id);
            router.replace(`?${params.toString()}`, { scroll: false });

            if (node.children && node.children.length > 0) {
                setPath(prev => [...prev, node]);
            } else {
                setPath(prev => [...prev, node]);
            }
        },
        [onSelect, router, searchParams]
    );

    const goBack = useCallback(() => {
        setPath(prev => {
            if (prev.length === 0) return prev;
            const newPath = prev.slice(0, -1);
            const parentNode = newPath.length > 0 ? newPath[newPath.length - 1] : null;

            // به‌روزرسانی فیلتر به گره والد یا همه
            if (parentNode) {
                onSelect(parentNode.id);
                const params = new URLSearchParams(searchParams.toString());
                params.set('category', parentNode.id);
                router.replace(`?${params.toString()}`, { scroll: false });
            } else {
                onSelect('');
                const params = new URLSearchParams(searchParams.toString());
                params.delete('category');
                router.replace(`?${params.toString()}`, { scroll: false });
            }

            // پاک کردن فیلتر حجم
            if (onVolumeChange) onVolumeChange(0);

            // ریست چک‌باکس‌های بهترین قیمت و موجودی کافی
            if (onResetFilters) onResetFilters();

            return newPath;
        });
    }, [onSelect, onVolumeChange, onResetFilters, router, searchParams]);

    const handleBreadcrumbClick = useCallback(
        (index: number) => {
            setPath(prev => {
                const newPath = prev.slice(0, index + 1);
                const node = newPath[newPath.length - 1];
                onSelect(node.id);
                const params = new URLSearchParams(searchParams.toString());
                params.set('category', node.id);
                router.replace(`?${params.toString()}`, { scroll: false });
                return newPath;
            });
        },
        [onSelect, router, searchParams]
    );

    const selectAll = useCallback(() => {
        onSelect('');
        const params = new URLSearchParams(searchParams.toString());
        params.delete('category');
        router.replace(`?${params.toString()}`, { scroll: false });
        setPath([]);
        if (onVolumeChange) onVolumeChange(0);
        if (onResetFilters) onResetFilters();
    }, [onSelect, onVolumeChange, onResetFilters, router, searchParams]);

    const breadcrumb = path;

    return (
        <div className="w-full py-2 pt-3 ">
            {/* Breadcrumb */}
            {breadcrumb.length > 0 && (
                <div className="flex items-center pt-0 pb-3 px-3">
                    <div className="flex flex-1 items-center gap-1 text-xs text-on-surface-variant overflow-x-auto scrollbar-hide">
                        <button
                            onClick={selectAll}
                            className="hover:text-primary transition-colors whitespace-nowrap"
                        >
                            همه
                        </button>
                        {breadcrumb.map((node, idx) => {
                            const isLast = idx === breadcrumb.length - 1;
                            return (
                                <React.Fragment key={node.id}>
                                    <ChevronLeft className="w-3 h-3 flex-shrink-0" />
                                    {isLast ? (
                                        <span className="text-on-surface font-medium whitespace-nowrap">{node.title}</span>
                                    ) : (
                                        <button
                                            onClick={() => handleBreadcrumbClick(idx)}
                                            className="hover:text-primary transition-colors whitespace-nowrap"
                                        >
                                            {node.title}
                                        </button>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* نوار افقی دسته‌بندی‌ها */}
            <div className="flex w-full overflow-hidden"> {/* ✅ overflow-hidden اضافه شد */}
                {path.length > 0 && (
                    <button
                        onClick={goBack}
                        className="flex-shrink-0 p-1.5 rounded-md hover:bg-surface-container-high transition-colors"
                        aria-label="بازگشت"
                    >
                        <ArrowRight className="w-5 h-5 text-on-surface" />
                    </button>
                )}
                <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap"> {/* ✅ min-w-0 اضافه شد */}
                    {path.length === 0 && (
                        <button
                            onClick={selectAll}
                            className={cn(
                                "whitespace-nowrap px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 flex-shrink-0",
                                !selectedCategoryId
                                    ? "bg-primary/10 text-primary border-primary"
                                    : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary"
                            )}
                        >
                            همه
                        </button>
                    )}

                    {/* دکمه مادر (در عمق) */}
                    {(path.length > 0 && path[path.length - 1].children?.length == 0) && (
                        <button
                            onClick={goBack}
                            className="flex items-center gap-1 whitespace-nowrap px-2 py-1.5 rounded-full text-xs bg-outline-variant border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors"
                        >
                            {path[path.length - 1].title}
                            {path[path.length - 1].children?.length > 0 && (
                                <X className="w-4 h-4" />
                            )}
                        </button>
                    )}

                    {/* فرزندان سطح جاری */}
                    {currentLevel.map((node) => {
                        const isSelected = node.id === selectedCategoryId;
                        return (
                            <button
                                key={node.id}
                                onClick={() => drillDown(node)}
                                className={cn(
                                    "whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex-shrink-0",
                                    isSelected
                                        ? "bg-primary/15 text-primary border-primary/50"
                                        : "bg-surface-container-low/10 text-on-surface-variant border-outline-variant hover:border-primary hover:bg-surface-container-high"
                                )}
                            >
                                {node.title}
                            </button>
                        );
                    })}

                    {/* ✅ دکمه‌های حجم (فقط برای برگ) با استفاده از volumePresets */}
                    {isLeaf && onVolumeChange && volumePresets.length > 0 && (
                        <>
                            {/* جداکننده ظریف */}
                            <div className="w-px h-6 bg-outline-variant/30 mx-0.5" />
                            {volumePresets.map((vol) => {
                                const isActive = minQuantity === vol;
                                return (
                                    <button
                                        key={vol}
                                        onClick={() => onVolumeChange(isActive ? 0 : vol)}
                                        className={cn(
                                            "whitespace-nowrap px-3 py-1.5 rounded text-xs font-medium border transition-all duration-200 flex-shrink-0",
                                            isActive
                                                ? "bg-outline-variant text-primary border-primary/50"
                                                : "bg-surface-container-low/10 text-on-surface-variant border-dashed border-outline-variant/50 hover:border-primary hover:bg-surface-container-high"
                                        )}
                                    >
                                        {vol.toLocaleString()} {selectedUnit}
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}