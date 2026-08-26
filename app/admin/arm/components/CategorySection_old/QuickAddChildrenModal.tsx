// app/admin/arm/components/CategorySection/QuickAddChildrenModal.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, ChevronLeft, Check, Plus, ListPlus, Layers, Package } from 'lucide-react';
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
    buildChildrenMap,
    collectTreeIds,
    getAllDescendantIds,
    filterTreeBySearch,
    buildCheckStates,
    buildScopeTreeFromIds,
    toFa,
} from './utils';

export function QuickAddChildrenModal({ open, onClose, parentNode, allCategories, currentScopeTree, onConfirm }: {
    open: boolean;
    onClose: () => void;
    parentNode: TreeNode | null;
    allCategories: any[];
    currentScopeTree: TreeNode[];
    onConfirm: (newTree: TreeNode[], addedCount: number) => void;
}) {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [newCheckedIds, setNewCheckedIds] = useState<Set<string>>(new Set());

    const childrenMap = useMemo(() => buildChildrenMap(allCategories), [allCategories]);
    const scopeIds = useMemo(() => collectTreeIds(currentScopeTree), [currentScopeTree]);

    const childTree = useMemo(() => {
        if (!parentNode || !open) return [];
        const buildNode = (c: any): TreeNode => ({
            ...c,
            children: (childrenMap.get(c.id) || []).map(buildNode),
        });
        return (childrenMap.get(parentNode.id) || []).map(buildNode);
    }, [parentNode, childrenMap, open]);

    useEffect(() => {
        if (open) {
            setNewCheckedIds(new Set());
            setSearch('');
            setExpanded(new Set());
        }
    }, [open]);

    const trimmedSearch = debouncedSearch.trim();
    const isSearching = normalizeFa(trimmedSearch).length >= MIN_SEARCH_CHARS;

    const filteredTree = useMemo(() => {
        if (!isSearching) return childTree;
        return filterTreeBySearch(childTree, trimmedSearch);
    }, [childTree, trimmedSearch, isSearching]);

    useEffect(() => {
        if (!isSearching) return;
        setExpanded(collectTreeIds(filteredTree));
    }, [isSearching, filteredTree]);

    const effectiveChecked = useMemo(() => {
        const s = new Set(scopeIds);
        newCheckedIds.forEach(id => s.add(id));
        return s;
    }, [scopeIds, newCheckedIds]);

    const checkStates = useMemo(
        () => buildCheckStates(childTree, effectiveChecked),
        [childTree, effectiveChecked],
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
        if (scopeIds.has(node.id)) return;

        const descendantIds = getAllDescendantIds(node);
        const isCurrentlyChecked =
            newCheckedIds.has(node.id) && descendantIds.every(id => newCheckedIds.has(id));

        setNewCheckedIds(prev => {
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
    }, [scopeIds, newCheckedIds]);

    const handleConfirm = useCallback(() => {
        if (newCheckedIds.size === 0) {
            onClose();
            return;
        }
        const idSet = new Set(scopeIds);
        for (const id of newCheckedIds) {
            if (idSet.has(id)) continue;
            const stack = [id];
            while (stack.length > 0) {
                const cur = stack.pop()!;
                if (idSet.has(cur)) continue;
                idSet.add(cur);
                for (const child of childrenMap.get(cur) || []) stack.push(child.id);
            }
        }
        const newTree = buildScopeTreeFromIds(idSet, currentScopeTree, allCategories);
        onConfirm(newTree, newCheckedIds.size);
    }, [newCheckedIds, scopeIds, childrenMap, currentScopeTree, allCategories, onConfirm, onClose]);

    const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
        const inScope = scopeIds.has(node.id);
        const state = checkStates.get(node.id) || 'unchecked';
        const hasChildren = (node.children?.length ?? 0) > 0;
        const isExpanded = expanded.has(node.id);

        return (
            <div key={node.id}>
                <div
                    className={cn(
                        'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-2 rounded-xl transition-colors',
                        inScope
                            ? 'bg-emerald-50/60 dark:bg-emerald-900/15'
                            : 'hover:bg-amber-50/80 dark:hover:bg-amber-900/20',
                    )}
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

                    <TriStateCheckbox
                        state={state}
                        onClick={() => toggleCheck(node)}
                        disabled={inScope}
                        tone="amber"
                    />

                    {hasChildren ? (
                        <div className="p-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                    ) : (
                        <div className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                            <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    )}

                    <span className={cn(
                        'flex-1 min-w-0 text-right text-sm font-medium truncate',
                        inScope ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200',
                    )}>
                        {node.title}
                    </span>

                    {inScope && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                            <Check className="w-3 h-3" />
                            موجود
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

    const allExisting = childTree.length > 0 && childTree.every(c => scopeIds.has(c.id));
    const rawLen = normalizeFa(search.trim()).length;

    return (
        <ModalShell
            open={open && !!parentNode}
            onClose={onClose}
            title={`افزودن زیرمجموعه به «${parentNode?.title || ''}»`}
            subtitle="موارد جدید را تیک بزنید؛ با تأیید، کنار موارد موجود به درخت مجاز اضافه می‌شوند"
            icon={<div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400"><ListPlus className="w-5 h-5" /></div>}
            maxWidth="max-w-2xl"
            footer={
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {newCheckedIds.size > 0 ? `${toFa(newCheckedIds.size)} مورد جدید انتخاب شد` : 'مورد جدیدی انتخاب نشده'}
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
                            disabled={newCheckedIds.size === 0}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" />
                            افزودن به درخت مجاز
                        </button>
                    </div>
                </div>
            }
        >
            {childTree.length === 0 ? (
                <EmptyState
                    icon={<ListPlus className="w-12 h-12" />}
                    title="زیرمجموعه‌ای وجود ندارد"
                    description="این دسته‌بندی در درخت مرجع هیچ زیرمجموعه‌ای ندارد"
                />
            ) : (
                <>
                    <div className="mb-3">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder={`جستجو در زیرمجموعه‌ها (حداقل ${MIN_SEARCH_CHARS} حرف)...`}
                        />
                        {rawLen > 0 && rawLen < MIN_SEARCH_CHARS && (
                            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-2 text-right">
                                برای فعال شدن جستجو حداقل {toFa(MIN_SEARCH_CHARS)} حرف وارد کنید...
                            </p>
                        )}
                    </div>

                    {allExisting && (
                        <div className="mb-3 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                            <Check className="w-4 h-4 flex-shrink-0" />
                            تمام زیرمجموعه‌های مستقیم این نود قبلاً اضافه شده‌اند؛ می‌توانید از میان نتایج، موارد عمیق‌تر را انتخاب کنید.
                        </div>
                    )}

                    <div className="max-h-[55vh] overflow-y-auto rounded-xl border-2 border-gray-100 dark:border-gray-700 p-2 bg-gray-50/50 dark:bg-gray-900/30">
                        {filteredTree.length === 0 ? (
                            <div className="py-10 text-center">
                                <Search className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-sm text-gray-500">
                                    {isSearching ? 'نتیجه‌ای یافت نشد' : 'زیرمجموعه‌ای برای نمایش وجود ندارد'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">{filteredTree.map(node => renderNode(node))}</div>
                        )}
                    </div>
                </>
            )}
        </ModalShell>
    );
}