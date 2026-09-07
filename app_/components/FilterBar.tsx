// app/components/FilterBar.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { X, Package, Scale, TrendingUp, ChevronDown } from 'lucide-react';
import { RootState } from '@/lib/store/store';
import { useFilters } from '@/lib/hooks/useFilters';

export function FilterBar() {
    const { currentArm } = useSelector((state: RootState) => state.arm);

    // ✅ استخراج دسته‌بندی‌ها از categoryTree
    const categories = useMemo(() => {
        if (!currentArm?.categoryTree) return [];

        const flattenCategories = (nodes: any[]): any[] => {
            let result: any[] = [];
            for (const node of nodes) {
                // فقط گره‌هایی که isSelected === true هستند
                if (node.isSelected === true) {
                    result.push({
                        id: node.id,
                        name: node.title,
                        path: node.path,
                        level: node.level,
                    });
                }
                if (node.children && node.children.length > 0) {
                    result = result.concat(flattenCategories(node.children));
                }
            }
            return result;
        };

        return flattenCategories(currentArm.categoryTree);
    }, [currentArm?.categoryTree]);

    // ✅ استفاده از هوک مرکزی
    const {
        otherFilters,
        addFilter,
        removeFilter,
        clearFilters,
    } = useFilters();

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showVolumeModal, setShowVolumeModal] = useState(false);
    const [showBumpModal, setShowBumpModal] = useState(false);

    const selectedCategory = otherFilters.find(f => f.type === 'category');
    const selectedCategoryLabel = selectedCategory?.label || 'دسته کالا';

    const volumeOptions = [
        { value: 'under_50', label: 'کمتر از ۵۰ تن' },
        { value: '50_to_200', label: '۵۰ تا ۲۰۰ تن' },
        { value: 'over_200', label: 'بیشتر از ۲۰۰ تن' }
    ];

    const bumpOptions = [
        { value: 'all', label: 'همه آگهی‌ها' },
        { value: 'bumped', label: 'نردبان شده' },
        { value: 'normal', label: 'عادی' }
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pill-scroll">
                <button
                    onClick={() => setShowCategoryModal(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap border transition-colors ${
                        selectedCategory
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                >
                    <Package className="w-3.5 h-3.5" />
                    <span>{selectedCategoryLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <button
                    onClick={() => setShowVolumeModal(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap border transition-colors ${
                        otherFilters.some(f => f.type === 'volume')
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                >
                    <Scale className="w-3.5 h-3.5" />
                    <span>حجم</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <button
                    onClick={() => setShowBumpModal(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap border transition-colors ${
                        otherFilters.some(f => f.type === 'bump')
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>نردبان</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {otherFilters.length > 0 && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-error whitespace-nowrap hover:bg-error/5 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                        پاک کردن همه
                    </button>
                )}
            </div>

            {/* Active Filters Tags */}
            {otherFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {otherFilters.map((filter) => (
                        <div
                            key={filter.id}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full"
                        >
                            <span>{filter.label}</span>
                            <button
                                onClick={() => removeFilter(filter.id)}
                                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* مودال‌ها */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50">
                    <div className="bg-surface w-full max-w-md rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 sticky top-0 bg-surface pt-2">
                            <h3 className="text-base font-semibold">انتخاب دسته کالا</h3>
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="text-on-surface-variant hover:text-primary"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    removeFilter('category');
                                    setShowCategoryModal(false);
                                }}
                                className={`w-full text-right px-4 py-3 hover:bg-surface-container-low transition-colors ${
                                    !selectedCategory ? 'bg-primary/5 text-primary' : ''
                                }`}
                            >
                                همه دسته‌ها
                            </button>
                            {categories.map((cat: any) => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        addFilter({
                                            id: `category-${cat.id}`,
                                            label: cat.name,
                                            value: cat.id,
                                            type: 'category'
                                        });
                                        setShowCategoryModal(false);
                                    }}
                                    className={`w-full text-right px-4 py-3 hover:bg-surface-container-low transition-colors ${
                                        selectedCategory?.value === cat.id ? 'bg-primary/5 text-primary' : ''
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* مودال حجم */}
            {showVolumeModal && (
                <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50">
                    <div className="bg-surface w-full max-w-md rounded-t-2xl p-4 animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold">انتخاب حجم</h3>
                            <button
                                onClick={() => setShowVolumeModal(false)}
                                className="text-on-surface-variant hover:text-primary"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    const existing = otherFilters.filter(f => f.type !== 'volume');
                                    setOtherFilters(existing);
                                    setShowVolumeModal(false);
                                }}
                                className="w-full text-right px-4 py-3 hover:bg-surface-container-low transition-colors"
                            >
                                همه
                            </button>
                            {volumeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        addFilter({
                                            id: `volume-${option.value}`,
                                            label: option.label,
                                            value: option.value,
                                            type: 'volume'
                                        });
                                        setShowVolumeModal(false);
                                    }}
                                    className={`w-full text-right px-4 py-3 hover:bg-surface-container-low transition-colors ${
                                        otherFilters.some(f => f.type === 'volume' && f.value === option.value)
                                            ? 'bg-primary/5 text-primary'
                                            : ''
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* مودال نردبان */}
            {showBumpModal && (
                <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50">
                    <div className="bg-surface w-full max-w-md rounded-t-2xl p-4 animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold">فیلتر نردبان</h3>
                            <button
                                onClick={() => setShowBumpModal(false)}
                                className="text-on-surface-variant hover:text-primary"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {bumpOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        addFilter({
                                            id: `bump-${option.value}`,
                                            label: option.label,
                                            value: option.value,
                                            type: 'bump'
                                        });
                                        setShowBumpModal(false);
                                    }}
                                    className={`w-full text-right px-4 py-3 hover:bg-surface-container-low transition-colors ${
                                        otherFilters.some(f => f.type === 'bump' && f.value === option.value)
                                            ? 'bg-primary/5 text-primary'
                                            : ''
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}