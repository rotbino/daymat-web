// app/admin/arm/components/CategorySection/ReferencePickerModal.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, ChevronLeft, TreePine, Check, Plus, Layers, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalShell } from './ModalShell';
import { TriStateCheckbox } from './TriStateCheckbox';
import { SearchBox } from './SearchBox';
import { EmptyState } from './EmptyState';
import type { TreeNode } from './types';
import {
    MIN_SEARCH_CHARS,
    SEARCH_DEBOUNCE_MS,
    useDebouncedValue,
    normalizeFa,
    buildTreeFromFlat,
    collectTreeIds,
    filterTreeBySearch,
    buildCheckStates,
    buildScopeTreeFromIds,
    toFa,
} from './utils';

export function ReferencePickerModal({ open, onClose, allCategories, currentScopeTree, onConfirm }: {
    open: boolean;
    onClose: () => void;
    allCategories: any[];
    currentScopeTree: TreeNode[];
    onConfirm: (newTree: TreeNode[]) => void;
}) {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    const referenceTree = useMemo(
        () => buildTreeFromFlat(allCategories.map((c: any) => ({ ...c }))),
        [allCategories],
    );

    const descendantsMap = useMemo(() => {
        const map = new Map<string, string[]>();
        const compute = (node: TreeNode): string[] => {
            const ids: string[] = [];
            for (const child of node.children || []) {
                ids.push(child.id);
                ids.push(...compute(child));
            }
            map.set(node.id, ids);
            return ids;
        };
        referenceTree.forEach(compute);
        return map;
    }, [referenceTree]);

    useEffect(() => {
        if (open) {
            setCheckedIds(collectTreeIds(currentScopeTree));
            setSearch('');
            setExpanded(new Set(referenceTree.map(n => n.id)));
        }
    }, [open]);

    const trimmedSearch = debouncedSearch.trim();
    const isSearching = normalizeFa(trimmedSearch).length >= MIN_SEARCH_CHARS;

    const filteredTree = useMemo(() => {
        if (!isSearching) return referenceTree;
        return filterTreeBySearch(referenceTree, trimmedSearch);
    }, [referenceTree, trimmedSearch, isSearching]);

    useEffect(() => {
        if (!isSearching) return;
        setExpanded(collectTreeIds(filteredTree));
    }, [isSearching, filteredTree]);

    const checkStates = useMemo(
        () => buildCheckStates(referenceTree, checkedIds),
        [referenceTree, checkedIds],
    );

    const toggleExpand = useCallback((nodeId: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    }, []);

    const toggleCheck = useCallback((node: TreeNode) => {
        const descendantIds = descendantsMap.get(node.id) || [];
        const isCurrentlyChecked = checkStates.get(node.id) === 'checked';

        setCheckedIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyChecked) {
                next.delete(node.id);
                descendantIds.forEach(id => next.delete(id));
            } else {
                next.add(node.id);
                descendantIds.forEach(id => next.add(id));
            }
            return next;
        });

        if (!isCurrentlyChecked) {
            setExpanded(prev => {
                const next = new Set(prev);
                next.add(node.id);
                descendantIds.forEach(id => next.add(id));
                return next;
            });
        }
    }, [checkStates, descendantsMap]);

    const handleConfirm = useCallback(() => {
        const newTree = buildScopeTreeFromIds(checkedIds, currentScopeTree, allCategories);
        onConfirm(newTree);
    }, [checkedIds, currentScopeTree, allCategories, onConfirm]);

    const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
        const state = checkStates.get(node.id) || 'unchecked';
        const hasChildren = (node.children?.length ?? 0) > 0;
        const isExpanded = expanded.has(node.id);
        const descendantCount = (descendantsMap.get(node.id) || []).length;

        return (
            <div key={node.id}>
                <div
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-2 rounded-xl hover:bg-amber-50/80 dark:hover:bg-amber-900/20 transition-colors"
                    style={{ paddingRight: depth * 16 + 8 }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => toggleExpand(node.id)}
                            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800/40 rounded-lg transition-colors flex-shrink-0"
                        >
                            <div className={cn('transition-transform duration-200', !isExpanded ? 'rotate-0' : '-rotate-90')}>
                                <ChevronLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                        </button>
                    ) : (
                        <div className="w-6 flex-shrink-0" />
                    )}

                    <TriStateCheckbox state={state} onClick={() => toggleCheck(node)} tone="amber" />

                    {hasChildren ? (
                        <div className="p-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                    ) : (
                        <div className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    )}

                    <span className="flex-1 min-w-0 text-right text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {node.title}
                    </span>

                    {hasChildren && descendantCount > 0 && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
                            {toFa(descendantCount)} زیرمجموعه
                        </span>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <div className="mr-3 sm:mr-4 border-r-2 border-amber-100 dark:border-amber-800/30 rounded-r-lg">
                        {(node.children || []).map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const rawLen = normalizeFa(search.trim()).length;

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title="انتخاب از درخت مرجع"
            subtitle="با تیک زدن هر گروه، تمام زیرمجموعه‌های آن تا انتها انتخاب می‌شوند"
            icon={<div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400"><TreePine className="w-5 h-5" /></div>}
            maxWidth="max-w-3xl"
            footer={
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {checkedIds.size > 0 ? `${toFa(checkedIds.size)} مورد انتخاب شده` : 'موردی انتخاب نشده است'}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            انصراف
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            تأیید و ذخیره
                        </button>
                    </div>
                </div>
            }
        >
            <div className="mb-3">
                <SearchBox
                    value={search}
                    onChange={setSearch}
                    placeholder={`جستجو در درخت مرجع (حداقل ${MIN_SEARCH_CHARS} حرف)...`}
                />
                {rawLen > 0 && rawLen < MIN_SEARCH_CHARS && (
                    <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-2 text-right">
                        برای فعال شدن جستجو حداقل {toFa(MIN_SEARCH_CHARS)} حرف وارد کنید...
                    </p>
                )}
            </div>

            <div className="max-h-[55vh] overflow-y-auto rounded-xl border-2 border-gray-100 dark:border-gray-700 p-2 bg-gray-50/50 dark:bg-gray-900/30">
                {filteredTree.length === 0 ? (
                    <div className="py-10 text-center">
                        <Search className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500">
                            {isSearching ? 'نتیجه‌ای یافت نشد' : 'دسته‌بندی مرجعی موجود نیست'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0.5">{filteredTree.map(node => renderNode(node))}</div>
                )}
            </div>
        </ModalShell>
    );
}