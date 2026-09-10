// app/ad/components/CategorySettingsModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Check, ChevronDown, Folder, Loader2, Package, Pencil,
    Plus, Trash2, X, FolderPlus, Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';

interface CatNode { id: string; title: string; children?: CatNode[]; }

interface Props {
    isOpen: boolean;
    onClose: () => void;
    catalogId: string;
    initialTree: CatNode[];
    onSaved: (tree: CatNode[]) => void;
}

const newId = () => `cat-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

// ✅ Pure helpers — هیچ mutation روی ورودی
function addChildPure(nodes: CatNode[], parentId: string, child: CatNode): CatNode[] {
    return nodes.map((n) => {
        if (n.id === parentId) {
            return { ...n, children: [...(n.children ?? []), child] };
        }
        return n.children ? { ...n, children: addChildPure(n.children, parentId, child) } : n;
    });
}
function renamePure(nodes: CatNode[], id: string, title: string): CatNode[] {
    return nodes.map((n) =>
        n.id === id
            ? { ...n, title }
            : { ...n, children: n.children ? renamePure(n.children, id, title) : undefined },
    );
}
function removePure(nodes: CatNode[], id: string): CatNode[] {
    return nodes
        .filter((n) => n.id !== id)
        .map((n) => ({ ...n, children: n.children ? removePure(n.children, id) : undefined }));
}
function countAll(nodes: CatNode[]): number {
    return nodes.reduce((acc, n) => acc + 1 + (n.children ? countAll(n.children) : 0), 0);
}

export default function CategorySettingsModal({ isOpen, onClose, catalogId, initialTree, onSaved }: Props) {
    const [tree, setTree] = useState<CatNode[]>([]);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [addingUnder, setAddingUnder] = useState<string | 'root' | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [mounted, setMounted] = useState(false);
    // ✅ یک شناسهٔ نسخه — تا initialize فقط هنگام «باز شدنِ جدید» انجام شود، نه با هر re-render والد
    const [openedFor, setOpenedFor] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setOpenedFor(null);
            return;
        }
        // فقط وقتی تازه باز شده → initialize (نه با هر تغییر initialTree از والد)
        const sessionKey = `${catalogId}-${Date.now()}`;
        if (openedFor !== sessionKey) {
            setTree(initialTree ?? []);
            setExpanded(new Set());
            setAddingUnder(null);
            setNewTitle('');
            setEditingId(null);
            setEditTitle('');
            setOpenedFor(sessionKey);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, catalogId]);

    const startAdd = (parentId: string | 'root') => {
        setAddingUnder(parentId);
        setNewTitle('');
        if (parentId !== 'root') setExpanded((prev) => new Set(prev).add(parentId));
    };

    const commitAdd = () => {
        const title = newTitle.trim();
        if (!title || addingUnder === null) return;
        const node: CatNode = { id: newId(), title, children: [] };
        setTree((prev) =>
            addingUnder === 'root'
                ? [...prev, node]
                : addChildPure(prev, addingUnder, node),
        );
        if (addingUnder !== 'root') setExpanded((prev) => new Set(prev).add(addingUnder));
        setNewTitle('');
        setAddingUnder(null);
    };

    const commitRename = (id: string) => {
        const title = editTitle.trim();
        if (!title) return;
        setTree((prev) => renamePure(prev, id, title));
        setEditingId(null);
        setEditTitle('');
    };

    const removeNode = (id: string) => {
        setTree((prev) => removePure(prev, id));
    };

    const toggleExpand = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await apiService.catalog.updateConfig(catalogId, { categoryTree: tree });
            onSaved(res.config?.categoryTree ?? tree);
            toast.success('دسته‌بندی کاتالوگ ذخیره شد');
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'خطا در ذخیره');
        } finally {
            setSaving(false);
        }
    };

    if (!mounted) return null;
    if (!isOpen) return null;

    const renderNode = (node: CatNode, depth: number) => {
        const isExpanded = expanded.has(node.id);
        const hasChildren = !!node.children?.length;
        return (
            <div key={node.id}>
                <div className={cn(
                    'flex items-center gap-1.5 rounded-xl px-2 py-2 transition-colors',
                    depth === 0 ? 'bg-surface-container-high/40' : 'hover:bg-surface-container-high/30',
                )}>
                    {hasChildren ? (
                        <button type="button" onClick={() => toggleExpand(node.id)}
                                className="w-5 h-5 grid place-items-center flex-shrink-0
                                    text-on-surface-variant/60 hover:text-on-surface rounded">
                            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', !isExpanded && '-rotate-90')} />
                        </button>
                    ) : (
                        <span className="w-5 flex-shrink-0" />
                    )}

                    {depth === 0
                        ? <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        : <Package className="w-3.5 h-3.5 text-on-surface-variant/50 flex-shrink-0" />}

                    {editingId === node.id ? (
                        <input autoFocus value={editTitle}
                               onChange={(e) => setEditTitle(e.target.value)}
                               onKeyDown={(e) => {
                                   if (e.key === 'Enter') commitRename(node.id);
                                   if (e.key === 'Escape') setEditingId(null);
                               }}
                               className="flex-1 h-8 px-2 rounded-lg bg-surface-container-lowest border border-amber-500/50 text-xs outline-none" />
                    ) : (
                        <span className="flex-1 text-xs font-bold text-on-surface truncate">{node.title}</span>
                    )}

                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        {editingId === node.id ? (
                            <button type="button" onClick={() => commitRename(node.id)}
                                    className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                                <Check className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <button type="button" onClick={() => { setEditingId(node.id); setEditTitle(node.title); }}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10">
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {depth === 0 && (
                            <button type="button" onClick={() => startAdd(node.id)} title="افزودن زیرشاخه"
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10">
                                <FolderPlus className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button type="button" onClick={() => removeNode(node.id)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {addingUnder === node.id && (
                    <div className="flex items-center gap-1.5 mx-2 my-1 p-1.5 rounded-lg
                        bg-amber-50/60 dark:bg-amber-900/10 border border-amber-300/40">
                        <Plus className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <input autoFocus value={newTitle}
                               onChange={(e) => setNewTitle(e.target.value)}
                               onKeyDown={(e) => {
                                   if (e.key === 'Enter') commitAdd();
                                   if (e.key === 'Escape') setAddingUnder(null);
                               }}
                               placeholder="عنوان زیرشاخه…"
                               className="flex-1 h-8 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs outline-none" />
                        <button type="button" onClick={commitAdd}
                                className="h-7 px-2.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold">افزودن</button>
                        <button type="button" onClick={() => setAddingUnder(null)}
                                className="w-7 h-7 rounded-lg text-on-surface-variant hover:bg-surface-container-high grid place-items-center">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {hasChildren && isExpanded && (
                    <div className="mt-1 space-y-0.5 border-s-2 border-outline-variant/20 ms-4">
                        {node.children!.map((c) => renderNode(c, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const modalContent = (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
             onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                     max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden
                     animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Layers className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                        </span>
                        <div>
                            <h3 className="text-sm font-extrabold text-on-surface">دسته‌بندی کاتالوگ</h3>
                            <p className="text-[10px] text-on-surface-variant/70">
                                {countAll(tree) > 0
                                    ? `${countAll(tree).toLocaleString('fa-IR')} دسته — ساخت، ویرایش، حذف`
                                    : 'دسته‌های اختصاصی خودت را بساز'}
                            </p>
                        </div>
                    </div>
                    {/* ✅ دکمهٔ ＋ همیشه در دسترس — مشکل اصلی همین بود */}
                    <div className="flex items-center gap-1">
                        <button type="button"
                                onClick={() => startAdd(addingUnder === 'root' ? null : 'root')}
                                title="افزودن دستهٔ جدید"
                                className={cn(
                                    'w-9 h-9 rounded-full grid place-items-center transition-colors',
                                    addingUnder === 'root'
                                        ? 'bg-amber-500 text-white'
                                        : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10',
                                )}>
                            {addingUnder === 'root' ? <X className="w-4.5 h-4.5" /> : <Plus className="w-5 h-5" />}
                        </button>
                        <button onClick={onClose} aria-label="بستن"
                                className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant
                                    hover:bg-surface-container-high transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* بدنه */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4 space-y-2">
                    {addingUnder === 'root' && (
                        <div className="flex items-center gap-1.5 p-2 rounded-xl
                            bg-amber-50/60 dark:bg-amber-900/10 border border-amber-300/40">
                            <Plus className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <input autoFocus value={newTitle}
                                   onChange={(e) => setNewTitle(e.target.value)}
                                   onKeyDown={(e) => {
                                       if (e.key === 'Enter') commitAdd();
                                       if (e.key === 'Escape') { setAddingUnder(null); setNewTitle(''); }
                                   }}
                                   placeholder="عنوان دستهٔ جدید…"
                                   className="flex-1 h-8 px-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs outline-none" />
                            <button type="button" onClick={commitAdd}
                                    className="h-7 px-2.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold">افزودن</button>
                            <button type="button" onClick={() => { setAddingUnder(null); setNewTitle(''); }}
                                    className="w-7 h-7 rounded-lg text-on-surface-variant hover:bg-surface-container-high grid place-items-center">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* ✅ empty-state — با دکمهٔ واقعی، نه فقط متن */}
                    {tree.length === 0 && addingUnder !== 'root' && (
                        <div className="text-center py-10 rounded-2xl border border-dashed border-outline-variant/50">
                            <Folder className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-3" />
                            <p className="text-xs text-on-surface-variant leading-6">
                                هنوز دسته‌ای نداری.<br />
                                اولین دسته را بساز — مثلاً «نوشیدنی» یا «لوازم بهداشتی»
                            </p>
                            <button type="button" onClick={() => startAdd('root')}
                                    className="mt-4 h-10 px-6 rounded-xl bg-amber-500 text-white text-xs font-extrabold
                                        inline-flex items-center gap-1.5 hover:bg-amber-600 active:scale-95 transition-all">
                                <Plus className="w-4 h-4" /> ساخت اولین دسته
                            </button>
                        </div>
                    )}

                    {tree.map((node) => renderNode(node, 0))}
                </div>

                {/* فوتر */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20 flex items-center gap-2.5
                    pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3">
                    <span className="flex-1 text-[11px] text-on-surface-variant">
                        این دسته‌ها فقط در فرم ثبت کالایِ این کاتالوگ دیده می‌شوند
                    </span>
                    <button onClick={handleSave} disabled={saving}
                            className="h-10 px-5 rounded-xl bg-amber-500 text-white text-xs font-extrabold
                                hover:bg-amber-600 flex items-center gap-2 disabled:opacity-50 transition-colors flex-shrink-0">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        ذخیره
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}