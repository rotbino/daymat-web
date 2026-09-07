// app/admin/categories/components/BatchUnitAssigner.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Loader2, Search, Check, Layers, Ruler, ChevronRight, ChevronDown } from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';

interface CategoryNode {
    id: string;
    title: string;
    slug: string;
    path: string;
    level: number;
    parentId: string | null;
    children: CategoryNode[];
}

interface UnitItem {
    id: string;
    title: string;
    shortCode: string;
}

interface BatchUnitAssignerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BatchUnitAssigner({ isOpen, onClose }: BatchUnitAssignerProps) {
    const [tree, setTree] = useState<CategoryNode[]>([]);
    const [units, setUnits] = useState<UnitItem[]>([]);
    const [selectedLeaves, setSelectedLeaves] = useState<Set<string>>(new Set());
    const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
    const [searchUnits, setSearchUnits] = useState('');
    const [searchCategories, setSearchCategories] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // واکشی داده‌ها
    useEffect(() => {
        if (!isOpen) return;
        (async () => {
            setLoading(true);
            try {
                const [cats, allUnits] = await Promise.all([
                    apiService.admin.categories.getAll(),   // درخت کامل
                    apiService.admin.units.getAll(),
                ]);
                setTree(cats || []);
                setUnits(allUnits.map((u: any) => ({ id: u.id, title: u.title, shortCode: u.shortCode })));
            } catch (err) {
                toast.error('خطا در بارگذاری داده‌ها');
            } finally {
                setLoading(false);
            }
        })();
    }, [isOpen]);

    // استخراج تمام برگ‌های درخت (جهت فیلتر و شمارش)
    const extractLeaves = useCallback((nodes: CategoryNode[]): CategoryNode[] => {
        let leaves: CategoryNode[] = [];
        for (const node of nodes) {
            if (!node.children || node.children.length === 0) {
                leaves.push(node);
            } else {
                leaves = leaves.concat(extractLeaves(node.children));
            }
        }
        return leaves;
    }, []);

    const allLeaves = useMemo(() => extractLeaves(tree), [tree, extractLeaves]);

    // فیلتر درخت بر اساس جستجو (برگ‌ها و والدین)
    const filterTree = useCallback((nodes: CategoryNode[], query: string): CategoryNode[] => {
        if (!query.trim()) return nodes;
        const lower = query.toLowerCase();
        return nodes.reduce((acc: CategoryNode[], node) => {
            const matches = node.title.toLowerCase().includes(lower) || node.slug.toLowerCase().includes(lower);
            const filteredChildren = filterTree(node.children, query);
            if (matches || filteredChildren.length > 0) {
                acc.push({ ...node, children: filteredChildren });
            }
            return acc;
        }, []);
    }, []);

    const filteredTree = useMemo(() => filterTree(tree, searchCategories), [tree, searchCategories, filterTree]);

    // واحدهای فیلترشده
    const filteredUnits = useMemo(() =>
            units.filter(u =>
                !searchUnits || u.title.toLowerCase().includes(searchUnits.toLowerCase()) || u.shortCode.toLowerCase().includes(searchUnits.toLowerCase())
            ),
        [units, searchUnits]
    );

    // توگل برگ
    const toggleLeaf = (id: string) => {
        setSelectedLeaves(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // توگل واحد
    const toggleUnit = (id: string) => {
        setSelectedUnits(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // انتخاب همه برگ‌های قابل مشاهده
    const selectAllVisibleLeaves = () => {
        const visibleLeaves = extractLeaves(filteredTree);
        if (selectedLeaves.size === visibleLeaves.length) {
            setSelectedLeaves(new Set());
        } else {
            setSelectedLeaves(new Set(visibleLeaves.map(l => l.id)));
        }
    };

    // انتخاب همه واحدهای قابل مشاهده
    const selectAllVisibleUnits = () => {
        if (selectedUnits.size === filteredUnits.length) {
            setSelectedUnits(new Set());
        } else {
            setSelectedUnits(new Set(filteredUnits.map(u => u.id)));
        }
    };

    // باز و بسته کردن گره‌های درخت
    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // عملیات تخصیص
    const handleAssign = async () => {
        if (selectedLeaves.size === 0 || selectedUnits.size === 0) {
            toast.error('حداقل یک برگ و یک واحد انتخاب کنید');
            return;
        }
        await processOperation('add');
    };

    // عملیات حذف
    const handleRemove = async () => {
        if (selectedLeaves.size === 0 || selectedUnits.size === 0) {
            toast.error('حداقل یک برگ و یک واحد انتخاب کنید');
            return;
        }
        await processOperation('remove');
    };

    const processOperation = async (operation: 'add' | 'remove') => {
        setIsProcessing(true);
        const leafArr = Array.from(selectedLeaves);
        const unitArr = Array.from(selectedUnits);
        const total = leafArr.length * unitArr.length;
        let done = 0;
        let skipped = 0;

        for (const leafId of leafArr) {
            for (const unitId of unitArr) {
                try {
                    if (operation === 'add') {
                        await apiService.admin.categories.addUnit(leafId, unitId);
                    } else {
                        await apiService.admin.categories.removeUnit(leafId, unitId);
                    }
                } catch (err) {
                    skipped++; // تکراری یا خطا – نادیده می‌گیریم
                }
                done++;
            }
        }
        setIsProcessing(false);
        if (skipped > 0) {
            toast.success(`${operation === 'add' ? 'تخصیص' : 'حذف'} واحدها انجام شد (${total - skipped} موفق، ${skipped} نادیده گرفته شد)`);
        } else {
            toast.success('عملیات با موفقیت انجام شد');
        }
    };

    // رندر درخت با checkbox
    const renderTree = (nodes: CategoryNode[], level: number = 0): React.ReactNode => {
        return nodes.map(node => {
            const hasChildren = node.children && node.children.length > 0;
            const isExpanded = expandedIds.has(node.id);
            const isLeaf = !hasChildren;
            const isSelected = isLeaf && selectedLeaves.has(node.id);

            return (
                <div key={node.id}>
                    <div
                        className={`flex items-center gap-1 py-1.5 px-2 rounded-lg transition-colors hover:bg-surface-container-low/50 ${isLeaf ? 'cursor-pointer' : 'cursor-pointer'}`}
                        onClick={() => {
                            if (isLeaf) {
                                toggleLeaf(node.id);
                            } else {
                                toggleExpand(node.id);
                            }
                        }}
                        style={{ paddingRight: `${level * 1.5}rem` }}
                    >
                        {hasChildren && (
                            <span className="w-4 h-4 flex items-center justify-center text-on-surface-variant/60">
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </span>
                        )}
                        {!hasChildren && <span className="w-4 h-4" />}
                        {isLeaf && (
                            <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLeaf(node.id);
                                }}
                            >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                        )}
                        <span className={`text-sm ${isLeaf ? 'font-normal' : 'font-medium'} truncate`}>
                            {node.title}
                        </span>
                    </div>
                    {hasChildren && isExpanded && (
                        <div className="mr-4">
                            {renderTree(node.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                <div className="bg-surface rounded-2xl p-8 flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-sm">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface w-full max-w-6xl rounded-2xl shadow-2xl border border-outline-variant max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-on-surface">مدیریت سریع واحدهای گروه‌ها</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-surface-container-high rounded-lg">
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-hidden">
                    {/* ستون درخت دسته‌بندی */}
                    <div className="flex flex-col min-h-0">
                        <div className="flex items-center gap-2 mb-3">
                            <Layers className="w-4 h-4 text-primary" />
                            <h4 className="text-sm font-semibold">گروه‌های کالا (برگ‌ها)</h4>
                            <span className="text-xs text-on-surface-variant mr-auto">
                                {selectedLeaves.size} انتخاب شده
                            </span>
                        </div>
                        <div className="relative mb-2">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                            <input
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl h-10 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="جستجوی گروه..."
                                value={searchCategories}
                                onChange={e => setSearchCategories(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={selectAllVisibleLeaves}
                            className="text-xs text-primary hover:underline mb-2 self-start"
                        >
                            {selectedLeaves.size === extractLeaves(filteredTree).length ? 'حذف انتخاب همه' : 'انتخاب همه برگ‌های نمایش داده شده'}
                        </button>
                        <div className="flex-1 overflow-y-auto border border-outline-variant/20 rounded-xl p-2 bg-surface-container-lowest">
                            {filteredTree.length === 0 ? (
                                <p className="text-sm text-on-surface-variant text-center py-8">موردی یافت نشد</p>
                            ) : (
                                renderTree(filteredTree)
                            )}
                        </div>
                    </div>

                    {/* ستون واحدها */}
                    <div className="flex flex-col min-h-0">
                        <div className="flex items-center gap-2 mb-3">
                            <Ruler className="w-4 h-4 text-primary" />
                            <h4 className="text-sm font-semibold">واحدهای اندازه‌گیری</h4>
                            <span className="text-xs text-on-surface-variant mr-auto">
                                {selectedUnits.size} انتخاب شده
                            </span>
                        </div>
                        <div className="relative mb-2">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                            <input
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl h-10 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="جستجوی واحد..."
                                value={searchUnits}
                                onChange={e => setSearchUnits(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={selectAllVisibleUnits}
                            className="text-xs text-primary hover:underline mb-2 self-start"
                        >
                            {selectedUnits.size === filteredUnits.length ? 'حذف انتخاب همه' : 'انتخاب همه واحدها'}
                        </button>
                        <div className="flex-1 overflow-y-auto border border-outline-variant/20 rounded-xl p-2 bg-surface-container-lowest">
                            {filteredUnits.length === 0 ? (
                                <p className="text-sm text-on-surface-variant text-center py-8">موردی یافت نشد</p>
                            ) : (
                                filteredUnits.map(unit => (
                                    <div
                                        key={unit.id}
                                        onClick={() => toggleUnit(unit.id)}
                                        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                                            selectedUnits.has(unit.id) ? 'bg-primary/5 border border-primary/20' : 'hover:bg-surface-container-low'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                            selectedUnits.has(unit.id) ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                            {selectedUnits.has(unit.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="text-sm font-medium flex-1">{unit.title}</span>
                                        <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                                            {unit.shortCode}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest rounded-b-2xl">
                    <div className="text-sm text-on-surface-variant">
                        {isProcessing ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                در حال پردازش...
                            </span>
                        ) : (
                            <span>
                                {selectedLeaves.size} گروه و {selectedUnits.size} واحد انتخاب شده
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRemove}
                            disabled={isProcessing}
                            className="px-5 py-2.5 bg-error text-on-error rounded-xl text-sm font-medium hover:bg-error/90 disabled:opacity-50 transition-all"
                        >
                            حذف واحدها از گروه‌ها
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={isProcessing}
                            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
                        >
                            تخصیص واحدها به گروه‌ها
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}