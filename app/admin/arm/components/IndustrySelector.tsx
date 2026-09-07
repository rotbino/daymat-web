// app/admin/arm/components/IndustrySelector.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, FolderTree, Search } from 'lucide-react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Industry {
    id: string;
    title: string;
    parentId?: string | null;
    children?: Industry[];
}

interface IndustrySelectorProps {
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    onSave?: () => void;
    isSaving?: boolean;
}

// استخراج برگ‌ها
const extractLeaves = (nodes: Industry[], currentPath: string = ''): { id: string; title: string; path: string }[] => {
    let leaves: { id: string; title: string; path: string }[] = [];
    for (const node of nodes) {
        const newPath = currentPath ? `${currentPath} › ${node.title}` : node.title;
        if (node.children && node.children.length > 0) {
            leaves = leaves.concat(extractLeaves(node.children, newPath));
        } else {
            leaves.push({ id: node.id, title: node.title, path: newPath });
        }
    }
    return leaves;
};

// کامپوننت درختی
const IndustryTree = ({
                          tree,
                          selectedIds,
                          onToggle,
                      }: {
    tree: Industry[];
    selectedIds: string[];
    onToggle: (id: string) => void;
}) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const renderNode = (node: Industry, depth: number = 0): React.ReactNode => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        const isLeaf = !hasChildren;
        const isSelected = isLeaf && selectedIds.includes(node.id);

        return (
            <div key={node.id}>
                <div
                    className={cn(
                        'flex items-center gap-1 py-2 px-2 rounded-lg transition-colors hover:bg-surface-container-low/50 cursor-pointer select-none',
                    )}
                    style={{ paddingRight: `${depth * 1.5}rem` }}
                    onClick={() => {
                        if (hasChildren) {
                            toggleExpand(node.id);
                        } else {
                            onToggle(node.id);
                        }
                    }}
                >
                    {hasChildren ? (
                        <span className="w-5 h-5 flex items-center justify-center text-on-surface-variant/60">
                            {isExpanded ? (
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="m6 9 6 6 6-6" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            )}
                        </span>
                    ) : (
                        <div
                            className={cn(
                                'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                                isSelected
                                    ? 'bg-primary border-primary'
                                    : 'border-gray-300 dark:border-gray-600',
                            )}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggle(node.id);
                            }}
                        >
                            {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    )}
                    <span className={cn('text-sm', isLeaf ? 'font-normal' : 'font-medium')}>
                        {node.title}
                    </span>
                </div>
                {hasChildren && isExpanded && (
                    <div>{node.children!.map(child => renderNode(child, depth + 1))}</div>
                )}
            </div>
        );
    };

    return <div className="max-h-300 overflow-y-auto p-2">{tree.map(node => renderNode(node))}</div>;
};

// کامپوننت جستجو
const IndustrySearch = ({
                            allLeaves,
                            selectedIds,
                            onToggle,
                        }: {
    allLeaves: { id: string; title: string; path: string }[];
    selectedIds: string[];
    onToggle: (id: string) => void;
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredLeaves = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return allLeaves.filter(l => l.title.toLowerCase().includes(term) || l.path.toLowerCase().includes(term));
    }, [allLeaves, searchTerm]);

    return (
        <div className="p-2">
            <div className="relative mb-2">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="جستجوی صنف..."
                    className="w-full bg-surface-container-low/50 border-0 rounded-lg px-3 py-2.5 pr-10 text-sm text-right focus:ring-1 focus:ring-primary outline-none"
                />
            </div>
            <div className="max-h-72 overflow-y-auto">
                {filteredLeaves.map(leaf => {
                    const isSelected = selectedIds.includes(leaf.id);
                    return (
                        <div
                            key={leaf.id}
                            onClick={() => onToggle(leaf.id)}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg mb-0.5',
                                isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-surface-container-high'
                            )}
                        >
                            <div
                                className={cn(
                                    'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                                    isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'
                                )}
                            >
                                {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn('text-sm font-medium truncate', isSelected ? 'text-primary' : 'text-on-surface')}>{leaf.title}</p>
                                <p className="text-[11px] text-on-surface-variant/60 truncate">{leaf.path}</p>
                            </div>
                        </div>
                    );
                })}
                {searchTerm.trim().length >= 2 && filteredLeaves.length === 0 && (
                    <p className="text-xs text-on-surface-variant/60 text-center py-4">نتیجه‌ای یافت نشد</p>
                )}
            </div>
        </div>
    );
};

// کامپوننت اصلی
export function IndustrySelector({ watch, setValue, onSave, isSaving }: IndustrySelectorProps) {
    const [tree, setTree] = useState<Industry[]>([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'tree' | 'search'>('tree');

    // ⭐ ساختار جدید: آرایه‌ای از اشیاء با دو بولین مستقل
    const selectedIndustries: {
        industryId: string;
        title: string;
        isSeller: boolean;
        isBuyer: boolean;
    }[] = watch('config.selectedIndustries') || [];

    // برای سازگاری با درخت و جستجو
    const selectedIds = useMemo(() => selectedIndustries.map(item => item.industryId), [selectedIndustries]);

    useEffect(() => {
        const fetchTree = async () => {
            setLoading(true);
            try {
                const data = await apiService.admin.industries.getTree();
                setTree(data);
            } catch (error: any) {
                toast.error(error?.message || 'خطا در دریافت اصناف');
            } finally {
                setLoading(false);
            }
        };
        fetchTree();
    }, []);

    const allLeaves = useMemo(() => extractLeaves(tree), [tree]);

    // به‌روزرسانی همزمان آرایهٔ اشیاء و آرایهٔ شناسه‌ها
    const updateSelectedIndustries = (newList: typeof selectedIndustries) => {
        setValue('config.selectedIndustries', newList, { shouldDirty: true });
        setValue('config.selectedIndustryIds', newList.map(item => item.industryId), { shouldDirty: true });
    };

    // توگل انتخاب صنف (اضافه/حذف)
    const toggleIndustry = (id: string) => {
        const exists = selectedIndustries.some(item => item.industryId === id);
        if (exists) {
            updateSelectedIndustries(selectedIndustries.filter(item => item.industryId !== id));
        } else {
            const leaf = allLeaves.find(l => l.id === id);
            updateSelectedIndustries([
                ...selectedIndustries,
                { industryId: id, title: leaf?.title || id, isSeller: false, isBuyer: false },
            ]);
        }
    };

    // تغییر وضعیت فروشنده
    const toggleSeller = (id: string) => {
        const updated = selectedIndustries.map(item =>
            item.industryId === id ? { ...item, isSeller: !item.isSeller } : item
        );
        updateSelectedIndustries(updated);
    };

    // تغییر وضعیت خریدار
    const toggleBuyer = (id: string) => {
        const updated = selectedIndustries.map(item =>
            item.industryId === id ? { ...item, isBuyer: !item.isBuyer } : item
        );
        updateSelectedIndustries(updated);
    };

    // حذف از تراشه
    const removeIndustry = (id: string) => {
        updateSelectedIndustries(selectedIndustries.filter(item => item.industryId !== id));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12 bg-surface-container-low border border-outline-variant rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-surface-container-low p-6 border border-outline-variant rounded-2xl shadow-sm">
            {/* هدر */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-on-surface">اصناف بازار</h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                        صنف‌های قابل قبول را انتخاب و نقش هر صنف را مشخص کنید.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-surface-container-high rounded-lg p-0.5">
                        <button
                            type="button"
                            onClick={() => setMode('tree')}
                            className={cn(
                                'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                mode === 'tree'
                                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                    : 'text-on-surface-variant hover:text-on-surface'
                            )}
                        >
                            <FolderTree className="w-4 h-4" />
                            درختی
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('search')}
                            className={cn(
                                'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                mode === 'search'
                                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                    : 'text-on-surface-variant hover:text-on-surface'
                            )}
                        >
                            <Search className="w-4 h-4" />
                            جستجو
                        </button>
                    </div>

                    {onSave && (
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isSaving}
                            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin inline ml-1" />}
                            ذخیره تغییرات
                        </button>
                    )}
                </div>
            </div>

            {/* نوار افقی تراشه‌ها */}
            {selectedIndustries.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-outline-variant/30 rounded-xl">
                    {selectedIndustries.map(item => (
                        <div
                            key={item.industryId}
                            className="flex items-center gap-2 bg-primary/5 text-primary px-3 py-1.5 rounded-full border border-primary/20"
                        >
                            <span className="text-xs font-medium truncate max-w-[150px]">{item.title}</span>

                            {/* دکمه فروشنده */}
                            <button
                                type="button"
                                onClick={() => toggleSeller(item.industryId)}
                                className={cn(
                                    'px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors',
                                    item.isSeller
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/50 text-on-surface-variant hover:bg-blue-100'
                                )}
                            >
                                فروشنده
                            </button>

                            {/* دکمه خریدار */}
                            <button
                                type="button"
                                onClick={() => toggleBuyer(item.industryId)}
                                className={cn(
                                    'px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors',
                                    item.isBuyer
                                        ? 'bg-green-500 text-white'
                                        : 'bg-white/50 text-on-surface-variant hover:bg-green-100'
                                )}
                            >
                                خریدار
                            </button>

                            {/* حذف */}
                            <button
                                type="button"
                                onClick={() => removeIndustry(item.industryId)}
                                className="opacity-60 hover:opacity-100 hover:bg-primary/20 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    <span className="text-xs text-on-surface-variant/60 mr-auto">
                        {selectedIndustries.length} صنف انتخاب شده
                    </span>
                </div>
            )}

            {/* محتوای انتخاب */}
            <div className="border border-outline-variant/30 rounded-xl bg-white dark:bg-gray-800">
                {mode === 'tree' ? (
                    <IndustryTree tree={tree} selectedIds={selectedIds} onToggle={toggleIndustry} />
                ) : (
                    <IndustrySearch allLeaves={allLeaves} selectedIds={selectedIds} onToggle={toggleIndustry} />
                )}
            </div>
        </div>
    );
}