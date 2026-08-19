// components/common/ActivitySelectorModal.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    X,
    Search,
    ChevronDown,
    Check,
    Loader2,
    Folder,
    FileText,
    FolderOpen,
    XCircle
} from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ActivityNode {
    id: string;
    title: string;
    slug: string;
    path: string;
    level: number;
    parentId: string | null;
    icon?: string;
    children?: ActivityNode[];
    isLeaf?: boolean;
}

interface ActivitySelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedIds: string[];
    onSelect: (ids: string[]) => void;
    max?: number;
    title?: string;
}

export function ActivitySelectorModal({
                                          isOpen,
                                          onClose,
                                          selectedIds,
                                          onSelect,
                                          max = 5,
                                          title = 'انتخاب فعالیت‌های کسب‌وکار',
                                      }: ActivitySelectorModalProps) {
    // ============================================================
    // ✅ همه useStateها در ابتدا
    // ============================================================
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [tempSelected, setTempSelected] = useState<string[]>(selectedIds);
    const [viewMode, setViewMode] = useState<'tree' | 'search'>('tree');

    // ============================================================
    // ✅ همه useQueryها
    // ============================================================
    const { data: treeData, isLoading: treeLoading } = useQuery({
        queryKey: ['activities', 'tree'],
        queryFn: () => apiService.activity.getTree(),
        enabled: isOpen,
        staleTime: 1000 * 60 * 5,
    });

    const { data: leavesData, isLoading: leavesLoading } = useQuery({
        queryKey: ['activities', 'leaves'],
        queryFn: () => apiService.activity.getLeaves(),
        enabled: isOpen && searchTerm.length >= 2,
        staleTime: 1000 * 60 * 5,
    });

    // ============================================================
    // ✅ همه useMemoها (قبل از useEffectها)
    // ============================================================
    const searchResults = useMemo(() => {
        if (!leavesData || searchTerm.length < 2) return [];
        return leavesData.filter((item: any) =>
            item.title.includes(searchTerm)
        );
    }, [leavesData, searchTerm]);

    const selectedActivitiesDetails = useMemo(() => {
        if (!leavesData) return [];
        return leavesData.filter((item: any) => tempSelected.includes(item.id));
    }, [leavesData, tempSelected]);

    // ============================================================
    // ✅ همه useEffectها
    // ============================================================
    // بازنشانی انتخاب‌ها هنگام باز شدن مودال
    useEffect(() => {
        if (isOpen) {
            setTempSelected(selectedIds);
            setSearchTerm('');
            setViewMode('tree');
            setExpandedNodes(new Set());
        }
    }, [isOpen, selectedIds]);

    // جستجو با دو حرف
    useEffect(() => {
        if (searchTerm.length >= 2) {
            setViewMode('search');
        } else {
            setViewMode('tree');
        }
    }, [searchTerm]);

    // ============================================================
    // ✅ همه useCallbackها
    // ============================================================
    const toggleNode = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    const toggleSelect = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setTempSelected(prev => {
            if (prev.includes(nodeId)) {
                return prev.filter(id => id !== nodeId);
            }
            if (prev.length >= max) {
                toast.warning(`حداکثر ${max} فعالیت قابل انتخاب است`);
                return prev;
            }
            return [...prev, nodeId];
        });
    }, [max]);

    const removeSelected = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setTempSelected(prev => prev.filter(id => id !== nodeId));
    }, []);

    const handleConfirm = useCallback(() => {
        onSelect(tempSelected);
        toast.success(`${tempSelected.length} فعالیت انتخاب شد`);
        onClose();
    }, [tempSelected, onSelect, onClose]);

    const handleClose = useCallback(() => {
        setTempSelected(selectedIds);
        setSearchTerm('');
        setViewMode('tree');
        onClose();
    }, [selectedIds, onClose]);

    const clearAll = useCallback(() => {
        setTempSelected([]);
    }, []);

    // ============================================================
    // ✅ رندر کردن درخت
    // ============================================================
    const renderTree = useCallback((nodes: ActivityNode[], level: number = 0) => {
        if (!nodes || nodes.length === 0) return null;

        return nodes.map((node) => {
            const isExpanded = expandedNodes.has(node.id);
            const isSelected = tempSelected.includes(node.id);
            const hasChildren = node.children && node.children.length > 0;
            const isLeaf = !hasChildren;

            return (
                <div key={node.id} className="select-none">
                    <div
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 hover:bg-primary/5 rounded-lg transition-colors cursor-pointer",
                            level > 0 && "mr-6",
                            isSelected && "bg-primary/10"
                        )}
                        style={{ paddingRight: `${level * 20}px` }}
                        onClick={() => {
                            if (isLeaf) {
                                toggleSelect(new MouseEvent('click') as any, node.id);
                            } else {
                                setExpandedNodes(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(node.id)) {
                                        newSet.delete(node.id);
                                    } else {
                                        newSet.add(node.id);
                                    }
                                    return newSet;
                                });
                            }
                        }}
                    >
                        {/* آیکون */}
                        {hasChildren ? (
                            isExpanded ? (
                                <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                            ) : (
                                <Folder className="w-4 h-4 text-primary flex-shrink-0" />
                            )
                        ) : (
                            <FileText className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                        )}

                        {/* عنوان */}
                        <span className="text-sm text-on-surface truncate flex-1">
                            {node.title}
                        </span>

                        {/* تعداد فرزندان */}
                        {hasChildren && (
                            <span className="text-[10px] text-on-surface-variant/50 ml-auto">
                                {node.children?.length || 0}
                            </span>
                        )}

                        {/* چک‌باکس برای برگ‌ها */}
                        {isLeaf && (
                            <div
                                className={cn(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                                    isSelected
                                        ? "bg-primary border-primary"
                                        : "border-outline-variant hover:border-primary"
                                )}
                                onClick={(e) => toggleSelect(e, node.id)}
                            >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                        )}

                        {/* دکمه باز کردن فرزندان */}
                        {hasChildren && (
                            <button
                                onClick={(e) => toggleNode(e, node.id)}
                                className="p-1 hover:bg-primary/10 rounded-full transition-colors flex-shrink-0"
                            >
                                <ChevronDown
                                    className={cn(
                                        "w-4 h-4 text-on-surface-variant transition-transform duration-200",
                                        isExpanded && "rotate-180"
                                    )}
                                />
                            </button>
                        )}
                    </div>

                    {/* فرزندان */}
                    {hasChildren && isExpanded && (
                        <div className="border-r-2 border-outline-variant/30 mr-4">
                            {renderTree(node.children || [], level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    }, [expandedNodes, tempSelected, toggleNode, toggleSelect]);

    // ============================================================
    // ✅ رندر نتایج جستجو
    // ============================================================
    const renderSearchResults = useCallback(() => {
        if (searchTerm.length < 2) {
            return (
                <div className="text-center text-on-surface-variant/60 py-8 text-sm">
                    برای جستجو حداقل ۲ حرف وارد کنید
                </div>
            );
        }

        if (leavesLoading) {
            return (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            );
        }

        if (searchResults.length === 0) {
            return (
                <div className="text-center py-8">
                    <Search className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-2" />
                    <p className="text-sm text-on-surface-variant">
                        هیچ فعالیتی با "{searchTerm}" یافت نشد
                    </p>
                </div>
            );
        }

        return searchResults.map((item: any) => {
            const isSelected = tempSelected.includes(item.id);
            return (
                <div
                    key={item.id}
                    className={cn(
                        "flex items-center gap-3 px-3 py-3 hover:bg-primary/5 rounded-lg transition-colors cursor-pointer",
                        isSelected && "bg-primary/10"
                    )}
                    onClick={(e) => toggleSelect(e, item.id)}
                >
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <span className="text-sm text-on-surface block">{item.title}</span>
                        <div className="text-[10px] text-on-surface-variant/50 truncate">
                            {item.path}
                        </div>
                    </div>
                    <div
                        className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0",
                            isSelected
                                ? "bg-primary border-primary"
                                : "border-outline-variant"
                        )}
                        onClick={(e) => toggleSelect(e, item.id)}
                    >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                </div>
            );
        });
    }, [searchTerm, leavesLoading, searchResults, tempSelected, toggleSelect]);

    // ============================================================
    // ✅ رندر محتوای مودال
    // ============================================================
    const renderContent = useCallback(() => {
        if (treeLoading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            );
        }

        if (!treeData || treeData.length === 0) {
            return (
                <div className="text-center py-12">
                    <Folder className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-2" />
                    <p className="text-sm text-on-surface-variant">
                        هیچ فعالیتی تعریف نشده است
                    </p>
                </div>
            );
        }

        if (viewMode === 'search') {
            return renderSearchResults();
        }

        return renderTree(treeData);
    }, [treeLoading, treeData, viewMode, renderSearchResults, renderTree]);

    // ============================================================
    // ✅ اگر مودال باز نباشد، null برگردان
    // ============================================================
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-0 md:p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div className="bg-surface w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl border-0 md:border border-outline-variant shadow-2xl overflow-hidden flex flex-col">
                {/* ============================================================
                    هدر
                    ============================================================ */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant flex-shrink-0 bg-white">
                    <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-on-surface">
                            {title}
                        </h3>
                        <span className="text-xs text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full">
                            {tempSelected.length} / {max}
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-surface-container-low rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>

                {/* ============================================================
                    نوار انتخاب‌ها
                    ============================================================ */}
                <div className="px-4 py-2 border-b border-outline-variant flex-shrink-0 bg-surface-container-low min-h-[48px] flex items-center gap-2 flex-wrap">
                    {tempSelected.length === 0 ? (
                        <span className="text-xs text-on-surface-variant/50">
                            هیچ فعالیتی انتخاب نشده است
                        </span>
                    ) : (
                        <>
                            {selectedActivitiesDetails.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 text-xs rounded-full"
                                >
                                    <span>{item.title}</span>
                                    <button
                                        onClick={(e) => removeSelected(e, item.id)}
                                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={clearAll}
                                className="text-[10px] text-error hover:underline mr-auto"
                            >
                                پاک کردن همه
                            </button>
                        </>
                    )}
                </div>

                {/* ============================================================
                    جستجو
                    ============================================================ */}
                <div className="px-4 py-3 border-b border-outline-variant flex-shrink-0">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearchTerm(value);
                            }}
                            placeholder="جستجوی فعالیت (حداقل ۲ حرف)..."
                            className="w-full bg-surface-container-lowest border border-outline h-11 px-4 pr-11 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                            autoFocus
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setViewMode('tree');
                                }}
                                className="absolute left-11 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-primary transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {searchTerm.length >= 2 && (
                        <p className="text-[10px] text-on-surface-variant/60 mt-1">
                            {searchResults.length} نتیجه برای "{searchTerm}"
                        </p>
                    )}
                </div>

                {/* ============================================================
                    محتوا
                    ============================================================ */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {renderContent()}
                </div>

                {/* ============================================================
                    فوتر
                    ============================================================ */}
                <div className="flex gap-3 p-4 border-t border-outline-variant flex-shrink-0 bg-white">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 h-11 border border-outline text-sm text-on-surface hover:bg-surface-container-low transition-colors font-medium"
                    >
                        انصراف
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={tempSelected.length === 0}
                        className="flex-1 h-11 bg-primary text-sm text-on-primary hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        تایید ({tempSelected.length})
                    </button>
                </div>
            </div>
        </div>
    );
}