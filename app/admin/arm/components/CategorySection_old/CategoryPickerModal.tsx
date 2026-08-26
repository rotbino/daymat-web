// app/admin/arm/components/CategorySection/CategoryPickerModal.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, TreePine, Check, Plus, ShoppingCart, Layers, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModalShell } from './ModalShell';
import { SearchBox } from './SearchBox';
import { EmptyState } from './EmptyState';
import type { TreeNode } from './types';
import {
    MIN_SEARCH_CHARS,
    SEARCH_DEBOUNCE_MS,
    useDebouncedValue,
    normalizeFa,
    toFa,
} from './utils';

export function CategoryPickerModal({ open, onClose, scopeTree, finalUsedIds, onConfirm }: {
    open: boolean;
    onClose: () => void;
    scopeTree: TreeNode[];
    finalUsedIds: Set<string>;
    onConfirm: (selected: TreeNode[]) => void;
}) {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const scopeNodes = useMemo(() => {
        const list: any[] = [];
        const collect = (nodes: TreeNode[], parentTitle: string | null) => {
            for (const n of nodes) {
                list.push({ ...n, _parentTitle: parentTitle });
                if (n.children && n.children.length > 0) collect(n.children, n.title);
            }
        };
        collect(scopeTree, null);
        return list;
    }, [scopeTree]);

    useEffect(() => {
        if (open) {
            setSelectedIds(new Set());
            setSearch('');
        }
    }, [open]);

    const trimmedSearch = debouncedSearch.trim();
    const isSearching = normalizeFa(trimmedSearch).length >= MIN_SEARCH_CHARS;

    const filteredNodes = useMemo(() => {
        if (!isSearching) return scopeNodes;
        const nt = normalizeFa(trimmedSearch);
        return scopeNodes.filter((n: any) =>
            normalizeFa(n.title).includes(nt) ||
            (n._parentTitle ? normalizeFa(n._parentTitle).includes(nt) : false),
        );
    }, [scopeNodes, trimmedSearch, isSearching]);

    const toggleSelect = useCallback((node: any) => {
        if (finalUsedIds.has(node.id)) return;
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(node.id)) next.delete(node.id);
            else next.add(node.id);
            return next;
        });
    }, [finalUsedIds]);

    const handleConfirm = useCallback(() => {
        const selected = scopeNodes.filter((n: any) => selectedIds.has(n.id));
        onConfirm(selected);
    }, [scopeNodes, selectedIds, onConfirm]);

    const rawLen = normalizeFa(search.trim()).length;

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title="افزودن دسته‌بندی به درخت نهایی"
            subtitle="تنها دسته‌بندی‌های موجود در درخت مجاز بازار قابل انتخاب هستند"
            icon={<div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400"><ShoppingCart className="w-5 h-5" /></div>}
            maxWidth="max-w-2xl"
            footer={
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedIds.size > 0 ? `${toFa(selectedIds.size)} مورد انتخاب شده` : 'موردی انتخاب نشده است'}
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
                            disabled={selectedIds.size === 0}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" />
                            افزودن
                        </button>
                    </div>
                </div>
            }
        >
            {scopeNodes.length === 0 ? (
                <EmptyState
                    icon={<TreePine className="w-12 h-12" />}
                    title="درخت مجاز خالی است"
                    description="ابتدا از درخت مرجع، دسته‌بندی‌های مجاز بازار را انتخاب کنید"
                    color="amber"
                />
            ) : (
                <>
                    <div className="mb-3">
                        <SearchBox
                            value={search}
                            onChange={setSearch}
                            placeholder={`جستجوی دسته‌بندی (حداقل ${MIN_SEARCH_CHARS} حرف)...`}
                        />
                        {rawLen > 0 && rawLen < MIN_SEARCH_CHARS && (
                            <p className="text-[11px] text-gray-400 mt-2 text-right">
                                برای فعال شدن جستجو حداقل {toFa(MIN_SEARCH_CHARS)} حرف وارد کنید...
                            </p>
                        )}
                    </div>

                    <div className="max-h-[55vh] overflow-y-auto rounded-xl border-2 border-gray-100 dark:border-gray-700 p-2 bg-gray-50/50 dark:bg-gray-900/30 space-y-1">
                        {filteredNodes.length === 0 ? (
                            <div className="py-10 text-center">
                                <Search className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-sm text-gray-500">نتیجه‌ای یافت نشد</p>
                            </div>
                        ) : (
                            filteredNodes.map((n: any) => {
                                const isUsed = finalUsedIds.has(n.id);
                                const isSelected = selectedIds.has(n.id);
                                const hasKids = (n.children?.length ?? 0) > 0;

                                return (
                                    <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => toggleSelect(n)}
                                        disabled={isUsed}
                                        className={cn(
                                            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-right transition-colors',
                                            isUsed
                                                ? 'opacity-60 cursor-not-allowed bg-emerald-50/50 dark:bg-emerald-900/10'
                                                : isSelected
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/25 ring-2 ring-emerald-300 dark:ring-emerald-700'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50',
                                        )}
                                    >
                                        <div className={cn(
                                            'w-5 h-5 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0',
                                            isSelected || isUsed
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'border-gray-300 dark:border-gray-600',
                                        )}>
                                            {(isSelected || isUsed) && <Check className="w-3.5 h-3.5" strokeWidth={3.5} />}
                                        </div>

                                        {hasKids ? (
                                            <div className="p-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                                                <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                        ) : (
                                            <div className="p-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                                                <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{n.title}</div>
                                            {n._parentTitle && (
                                                <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{n._parentTitle}</div>
                                            )}
                                        </div>

                                        {isUsed && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                                                <Check className="w-3 h-3" />
                                                موجود
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </ModalShell>
    );
}