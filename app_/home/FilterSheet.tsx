// app/home/FilterSheet.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, ChevronLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildFilterHref, findPathToNode, CategoryNode } from '@/lib/utils/filterUrl';

interface Props { open: boolean; onClose: () => void; categoryTree: CategoryNode[]; }

export default function FilterSheet({ open, onClose, categoryTree }: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
    }, [open, onClose]);

    if (!open || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="دسته‌بندی">
            <div className="absolute inset-0 bg-black/45 animate-in fade-in duration-200" onClick={onClose} />
            <div className="absolute bottom-0 inset-x-0 flex flex-col max-h-[85dvh] rounded-t-3xl bg-white dark:bg-gray-900 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex-shrink-0 pt-2.5 pb-1 flex justify-center"><div className="w-10 h-1 rounded-full bg-outline-variant/50" /></div>
                <div className="flex-shrink-0 flex items-center justify-between px-4 pb-2 border-b border-outline-variant/15">
                    <h2 className="text-sm font-extrabold">دسته‌بندی</h2>
                    <button type="button" onClick={onClose} aria-label="بستن"
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4">
                    <SheetCategorySection categoryTree={categoryTree} onClose={onClose} />
                </div>

                <div className="flex-shrink-0 flex items-center gap-2 px-4 pt-3 border-t border-outline-variant/15 bg-white dark:bg-gray-900 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                    <Link href={buildFilterHref(pathname, searchParams, categoryTree, { resetAll: true })} scroll={false}
                          className="h-11 px-4 flex items-center rounded-xl border border-outline-variant text-sm font-bold text-on-surface-variant hover:text-error hover:border-error/40 transition-colors">
                        حذف فیلترها
                    </Link>
                    <button type="button" onClick={onClose}
                            className="flex-1 h-11 rounded-xl bg-primary text-on-primary text-sm font-extrabold shadow-sm active:scale-[0.98] transition-transform">
                        مشاهده نتایج
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

function SheetCategorySection({ categoryTree, onClose }: { categoryTree: CategoryNode[]; onClose: () => void; }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    const path = category ? findPathToNode(categoryTree, category) ?? [] : [];
    const parentNode = path.length >= 2 ? path[path.length - 2] : null;
    const currentNode = path.length ? path[path.length - 1] : null;
    const level = path.length ? currentNode!.children ?? [] : categoryTree;

    return (
        <section>
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1 text-[11px] text-on-surface-variant/70 overflow-x-auto scrollbar-hide">
                    <Link href={buildFilterHref(pathname, searchParams, categoryTree, { categoryId: null })} scroll={false} className="hover:text-primary whitespace-nowrap">همه</Link>
                    {path.map((n, i) => (
                        <React.Fragment key={n.id}>
                            <span className="opacity-40">/</span>
                            {i === path.length - 1
                                ? <span className="text-primary font-bold whitespace-nowrap">{n.title}</span>
                                : <Link href={buildFilterHref(pathname, searchParams, categoryTree, { categoryId: n.id })} scroll={false} className="hover:text-primary whitespace-nowrap">{n.title}</Link>}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {parentNode && (
                <Link href={buildFilterHref(pathname, searchParams, categoryTree, { categoryId: parentNode.id })} scroll={false}
                      className="flex items-center gap-2 h-10 px-3 mb-1.5 rounded-xl text-[13px] font-medium text-primary hover:bg-primary/5 transition-colors">
                    <ArrowRight className="w-4 h-4" /> بازگشت به {parentNode.title}
                </Link>
            )}

            <ul className="space-y-1">
                {level.map((node) => {
                    const isActive = node.id === category;
                    const hasChildren = !!node.children?.length;
                    return (
                        <li key={node.id}>
                            {/* برگ: یک کلیک = انتخاب + بستن شیت | گره دارای فرزند: drill-down داخل شیت */}
                            <Link href={buildFilterHref(pathname, searchParams, categoryTree, { categoryId: node.id })}
                                  scroll={false}
                                  onClick={!hasChildren ? onClose : undefined}
                                  className={cn('flex items-center justify-between h-11 px-3.5 rounded-xl text-sm transition-colors active:scale-[0.99]',
                                      isActive ? 'bg-primary text-on-primary font-bold shadow-sm shadow-primary/25' : 'bg-surface-container-high/50 text-on-surface hover:bg-surface-container-high')}>
                                <span className="flex items-center gap-2">{node.title}{isActive && <Check className="w-4 h-4" />}</span>
                                {hasChildren
                                    ? <ChevronLeft className="w-4 h-4 opacity-40" />
                                    : !isActive && <span className="text-[10px] text-on-surface-variant/50">انتخاب</span>}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}