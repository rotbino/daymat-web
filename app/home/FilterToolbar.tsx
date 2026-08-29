// app/home/FilterToolbar.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { ArrowUpDown, Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildActiveChips, buildFilterHref, findNodeById, CategoryNode } from '@/lib/utils/filterUrl';
import { QuantityChip } from './QuantityFilters';

export const SORT_OPTIONS = [
    { value: '', label: 'جدیدترین' },
    { value: 'unitPrice:asc', label: 'ارزان‌ترین' },
    { value: 'unitPrice:desc', label: 'گران‌ترین' },
] as const;

const sortLabel = (v: string | null) => SORT_OPTIONS.find((o) => o.value === (v ?? ''))?.label ?? 'جدیدترین';

/* مرتب‌سازی — پاپ‌اور fixed با portal */
export function SortMenu({ className }: { className?: string }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const popRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const current = searchParams.get('sort') ?? '';

    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => {
            if (btnRef.current?.contains(e.target as Node) || popRef.current?.contains(e.target as Node)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    const toggle = () => {
        if (!open) {
            const r = btnRef.current?.getBoundingClientRect();
            if (r) setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, (window.innerWidth || 400) - 168)) });
        }
        setOpen((o) => !o);
    };

    return (
        <>
            <button ref={btnRef} type="button" onClick={toggle} aria-haspopup="menu" aria-expanded={open}
                    className={cn('relative flex-shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-full border border-outline-variant/60 text-xs font-semibold text-on-surface-variant hover:border-primary/40 hover:text-primary transition-colors active:scale-95', className)}>
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sortLabel(current)}
            </button>

            {open && pos && createPortal(
                <div ref={popRef} role="menu" style={{ position: 'fixed', top: pos.top, left: pos.left, width: 160 }}
                     className="z-[80] p-1.5 rounded-2xl bg-white dark:bg-gray-900 border border-outline-variant/30 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                    {SORT_OPTIONS.map((opt) => {
                        const isActive = current === opt.value;
                        return (
                            <Link key={opt.value}
                                  href={buildFilterHref(pathname, searchParams, [], { sort: opt.value || null })}
                                  scroll={false} onClick={() => setOpen(false)} role="menuitem"
                                  className={cn('flex items-center justify-between h-9 px-3 rounded-xl text-[13px] transition-colors',
                                      isActive ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-high')}>
                                {opt.label}
                                {isActive && <Check className="w-4 h-4" />}
                            </Link>
                        );
                    })}
                </div>,
                document.body,
            )}
        </>
    );
}

/* چیپ‌های فیلتر فعال */
export function ActiveFilterChips({ categoryTree, excludeKeys, onClearAllHref, className }: {
    categoryTree: CategoryNode[];
    excludeKeys?: string[];
    onClearAllHref?: string;
    className?: string;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const chips = buildActiveChips(pathname, searchParams, categoryTree, excludeKeys ?? []);
    if (chips.length === 0) return null;

    return (
        <div className={cn('flex items-center gap-1.5 min-w-0', className)}>
            {chips.map((chip) => (
                <Link key={chip.key} href={chip.href} scroll={false} aria-label={`حذف فیلتر ${chip.label}`}
                      className="group flex items-center gap-1 whitespace-nowrap h-8 ps-3 pe-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/10 transition-colors flex-shrink-0">
                    {chip.label}
                    <span className="p-0.5 rounded-full group-hover:bg-primary/15 transition-colors"><X className="w-3 h-3" /></span>
                </Link>
            ))}
            {onClearAllHref && chips.length > 1 && (
                <Link href={onClearAllHref} scroll={false} className="whitespace-nowrap text-[11px] font-semibold text-error/80 hover:text-error px-2 flex-shrink-0">حذف همه</Link>
            )}
        </div>
    );
}

/* ─── نوار موبایل: دسته روی خود دکمه + حجم/موجودی + مرتب‌سازی + چیپ‌ها + تعداد ─── */
export function MobileFilterStrip({ categoryTree, resultCount, onOpenCategories }: {
    categoryTree: CategoryNode[];
    resultCount?: number;
    onOpenCategories: () => void;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const cat = searchParams.get('category');
    const selected = cat ? findNodeById(categoryTree, cat) : null;
    const isLeaf = !!selected && (!selected.children || selected.children.length === 0);
    const unit = selected?.unitShortCode || 'تن';

    // چیپ دسته حذف شد (روی خود دکمه نمایش داده می‌شود).
    // چیپ‌های حجم/موجودی هم فقط وقتی حذف می‌شوند که به‌صورت QuantityChip در حال نمایش هستند (سطح برگ)؛
    // در غیر این صورت به‌صورت چیپ می‌مانند تا فیلتر فعالی نامرئی نشود.
    const excludeKeys = ['category', ...(isLeaf ? ['minq', 'minstock'] : [])];
    const clearCategoryHref = buildFilterHref(pathname, searchParams, categoryTree, { categoryId: null });

    return (
        <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {/* دکمه فیلتر: با انتخاب دسته، عنوان روی خودش می‌نشیند؛ X داخل همان دکمه پاک می‌کند */}
            {selected ? (
                <div className="relative flex-shrink-0 flex items-center h-9 ps-3 pe-1 rounded-full bg-primary
                    text-on-primary text-xs font-bold shadow-sm shadow-primary/25 max-w-[46vw]">
                    <button type="button" onClick={onOpenCategories} aria-label="تغییر دسته‌بندی"
                            className="flex items-center gap-1.5 min-w-0">
                        <SlidersHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{selected.title}</span>
                    </button>
                    <Link href={clearCategoryHref} scroll={false} aria-label="حذف دسته‌بندی"
                          className="flex-shrink-0 ms-0.5 p-1.5 rounded-full hover:bg-primary/20 active:scale-90 transition-all">
                        <X className="w-3.5 h-3.5" />
                    </Link>
                </div>
            ) : (
                <button type="button" onClick={onOpenCategories}
                        className="flex-shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-primary text-on-primary
                        text-xs font-bold shadow-sm shadow-primary/25 active:scale-95 transition-transform">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    دسته‌بندی
                </button>
            )}

            {isLeaf && <QuantityChip param="minq" label="حجم خرید" unit={unit} categoryTree={categoryTree} />}
            {isLeaf && <QuantityChip param="minstock" label="موجودی" unit={unit} categoryTree={categoryTree} />}

            <SortMenu />

            <ActiveFilterChips categoryTree={categoryTree} excludeKeys={excludeKeys} className="flex-1 min-w-0" />

            {resultCount !== undefined && (
                <span className="flex-shrink-0 text-[10px] font-bold text-on-surface-variant/70 bg-surface-container-high/60 px-2 py-1 rounded-full">
                    {resultCount.toLocaleString('fa-IR')} نتیجه
                </span>
            )}
        </div>
    );
}

/* ─── تولبار دسکتاپ: بدون تغییر ─── */
export function DesktopFilterToolbar({ categoryTree, resultCount }: { categoryTree: CategoryNode[]; resultCount?: number }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const chips = buildActiveChips(pathname, searchParams, categoryTree);

    return (
        <div className="max-w-[1440px] mx-auto px-4 xl:px-8 h-11 flex items-center gap-3">
            <SortMenu />
            {chips.length > 0 && <div className="w-px h-5 bg-outline-variant/25 flex-shrink-0" />}
            {chips.length > 0 ? (
                <ActiveFilterChips
                    categoryTree={categoryTree}
                    onClearAllHref={buildFilterHref(pathname, searchParams, categoryTree, { resetAll: true })}
                    className="flex-1 overflow-x-auto scrollbar-hide"
                />
            ) : (
                <div className="flex-1" />
            )}
            {resultCount !== undefined && (
                <span className="flex-shrink-0 text-xs text-on-surface-variant">
                    <b className="text-primary">{resultCount.toLocaleString('fa-IR')}</b> آگهی
                </span>
            )}
        </div>
    );
}