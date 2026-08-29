// app/home/FilterBar.tsx
'use client';
import React, { useState, useEffect, useMemo, useCallback, cloneElement, ReactElement } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ArrowRight, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberInput } from '@/components/common';
import { LocationFilter } from '@/app/components/LocationFilter';

interface CategoryNode {
    id: string;
    title: string;
    children?: CategoryNode[];
    unitShortCode?: string;
    [key: string]: any;
}

function findPathToNode(tree: CategoryNode[], id: string): CategoryNode[] | null {
    for (const node of tree) {
        if (node.id === id) return [node];
        if (node.children) {
            const found = findPathToNode(node.children, id);
            if (found) return [node, ...found];
        }
    }
    return null;
}

function findCategoryPath(tree: CategoryNode[], id: string): string[] {
    for (const node of tree) {
        if (node.id === id) return [node.title];
        if (node.children) {
            const found = findCategoryPath(node.children, id);
            if (found) return [node.title, ...found];
        }
    }
    return [];
}

// ─── Compact Floating Label ───
const CompactFloatingLabel: React.FC<{ label: string; id: string; children: ReactElement; minWidth?: number }> =
    ({ label, id, children, minWidth = 70 }) => {
        const hasValue = children.props.value !== undefined && children.props.value !== null && children.props.value !== '';
        const childWithProps = cloneElement(children, {
            id,
            className: `flex flex-1 peer w-full text-right bg-surface-container border border-outline-variant rounded-lg h-8 px-2.5 text-[10px]
            focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all
            ${children.props.className ?? ''}`,
            dir: 'rtl',
            placeholder: ' ',
        });
        return (
            <div className="relative" style={{ minWidth }}>
                {childWithProps}
                <label
                    htmlFor={id}
                    className="absolute transition-all duration-200 bg-white dark:bg-gray-900 px-1 pointer-events-none z-10 right-2.5"
                    style={{
                        top: hasValue ? '-8px' : '50%',
                        transform: hasValue ? 'translateY(0)' : 'translateY(-50%)',
                        fontSize: '10px',
                        fontWeight: hasValue ? 500 : 400,
                        color: hasValue ? 'var(--color-primary)' : undefined,
                    }}
                >
                    {label}
                </label>
            </div>
        );
    };

// ─── چک‌باکس ───
const FilterCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <label className="flex items-center gap-1.5 pl-4 cursor-pointer group select-none whitespace-nowrap">
        <div className="relative">
            <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
            <div className="w-4 h-4 rounded border-2 border-outline-variant bg-surface-container peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center active:scale-90">
                <Check className="w-3 h-3 text-on-primary" style={{ opacity: checked ? 1 : 0 }} />
            </div>
        </div>
        <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">{label}</span>
    </label>
);

// ─── کنترل فیلتر عددی (حجم خرید / موجودی) — ماژول‌لِوِل تا با هر رندر remount نشود ───
const QuantityControl = ({
                             id, label, unit, paramValue, onCommit, onClearHref,
                         }: {
    id: string;
    label: string;
    unit: string;
    paramValue: string;
    onCommit: (v: string) => void;
    onClearHref: string;
}) => {
    const active = paramValue !== '';
    const [open, setOpen] = useState(active);
    const [input, setInput] = useState<number | undefined>(active ? Number(paramValue) : undefined);

    // همگام با back/forward مرورگر
    useEffect(() => {
        setOpen(active);
        setInput(active ? Number(paramValue) : undefined);
    }, [active, paramValue]);

    // debounce: بعد از توقف تایپ، URL آپدیت می‌شود
    useEffect(() => {
        if (!open) return;
        const v = input === undefined ? NaN : Number(input);
        if (Number.isNaN(v) || v <= 0) return;
        if (paramValue === String(v)) return; // همین مقدار از قبل در URL هست
        const t = setTimeout(() => onCommit(String(v)), 450);
        return () => clearTimeout(t);
    }, [input, open, paramValue, onCommit]);

    if (!open) {
        return <FilterCheckbox label={label} checked={active} onChange={() => setOpen(true)} />;
    }
    return (
        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-300">
            <CompactFloatingLabel label={`${label} (${unit})`} id={id} minWidth={120}>
                <NumberInput className="max-h-8 text-center" value={input} onChange={(val: any) => setInput(val)} />
            </CompactFloatingLabel>
            {active ? (
                <Link
                    href={onClearHref}
                    scroll={false}
                    aria-label={`حذف ${label}`}
                    className="p-1 rounded-md hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
                >
                    <X className="w-3.5 h-3.5" />
                </Link>
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="بستن"
                    className="p-1 rounded-md hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};

// ─── Main ───
interface Props {
    categoryTree: CategoryNode[];
    resultCount?: number;
}

export default function FilterBar({ categoryTree, resultCount }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const categoryFromUrl = searchParams.get('category');
    const minqFromUrl = searchParams.get('minq') ?? '';
    const minstockFromUrl = searchParams.get('minstock') ?? '';

    const path = useMemo(
        () => (categoryFromUrl ? findPathToNode(categoryTree, categoryFromUrl) ?? [] : []),
        [categoryTree, categoryFromUrl],
    );
    const currentNode = path.length ? path[path.length - 1] : null;
    const isLeaf = !!currentNode && (!currentNode.children || currentNode.children.length === 0);
    const selectedUnit = currentNode?.unitShortCode || 'تن';
    const currentLevel = path.length ? (path[path.length - 1].children ?? []) : categoryTree;

    /**
     * تنها نقطه‌ی ساخت URL فیلترها.
     * undefined = پارامتر دست نخورد | null = حذف | string = مقداردهی
     */
    const buildHref = useCallback((changes: { categoryId?: string | null; minq?: string | null; minstock?: string | null }) => {
        const params = new URLSearchParams(searchParams.toString());
        const { categoryId, minq, minstock } = changes;

        if (categoryId !== undefined) {
            if (categoryId) {
                params.set('category', categoryId);
                const titles = findCategoryPath(categoryTree, categoryId);
                if (titles.length > 0) params.set('path', titles.join('/')); // عنوان برای سئو/خوانایی
                else params.delete('path');
            } else {
                params.delete('category');
                params.delete('path');
            }
        }
        if (minq !== undefined) { if (minq) params.set('minq', minq); else params.delete('minq'); }
        if (minstock !== undefined) { if (minstock) params.set('minstock', minstock); else params.delete('minstock'); }
        params.delete('page'); // تغییر فیلتر همیشه به صفحه اول

        const qs = params.toString();
        return qs ? `${pathname}?${qs}` : pathname;
    }, [searchParams, pathname, categoryTree]);

    const categoryHref = useCallback((id: string | null) => buildHref({ categoryId: id }), [buildHref]);

    // مقصد بازگشت: دسته والد، یا «همه»
    const backHref = path.length >= 2 ? categoryHref(path[path.length - 2].id) : categoryHref(null);

    const commitNumberFilter = useCallback((param: 'minq' | 'minstock', raw: string) => {
        router.push(buildHref(param === 'minq' ? { minq: raw } : { minstock: raw }), { scroll: false });
    }, [buildHref, router]);

    return (
        <div className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-outline-variant/10">
            {/* Breadcrumb — لینک‌محور برای سئو */}
            {path.length > 0 && (
                <div className="flex items-center px-3 pt-1.5 pb-0.5 border-b border-outline-variant/5">
                    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-[10px] md:text-[12px] overflow-x-auto scrollbar-hide py-0.5">
                        <Link href={categoryHref(null)} scroll={false} className="hover:text-primary transition-colors text-on-surface-variant/70 whitespace-nowrap">
                            همه دسته‌ها
                        </Link>
                        {path.map((node, idx) => {
                            const isLast = idx === path.length - 1;
                            return (
                                <React.Fragment key={node.id}>
                                    <ChevronLeft className="w-3 h-3 flex-shrink-0 text-on-surface-variant/30" />
                                    {isLast ? (
                                        <span className="text-on-surface font-semibold whitespace-nowrap px-1 py-0.5 rounded bg-primary/5 text-primary">
                                            {node.title}
                                        </span>
                                    ) : (
                                        <Link href={categoryHref(node.id)} scroll={false} className="hover:text-primary transition-colors whitespace-nowrap text-on-surface-variant/70">
                                            {node.title}
                                        </Link>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </nav>
                </div>
            )}

            <div className="px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                    {/* دکمه بازگشت: خارج از ناحیه اسکرول → با اسکرول افقی غیب نمی‌شود */}
                    {path.length > 0 && (
                        <Link
                            href={backHref}
                            scroll={false}
                            aria-label="بازگشت به دسته قبلی"
                            title="بازگشت"
                            className="flex-shrink-0 flex items-center justify-center w-10 h-10 md:w-9 md:h-9 rounded-xl
                                text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high
                                transition-all active:scale-95"
                        >
                            <ArrowRight className="w-6 h-6 md:w-5 md:h-5" />
                        </Link>
                    )}

                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
                        {path.length === 0 && (
                            <Link
                                href={categoryHref(null)}
                                scroll={false}
                                className={cn(
                                    'whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-full border transition-all flex-shrink-0 active:scale-95',
                                    !categoryFromUrl
                                        ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20'
                                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary',
                                )}
                            >
                                همه
                            </Link>
                        )}

                        {isLeaf && currentNode && (
                            <div className="flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                                {currentNode.title}
                                <Link href={backHref} scroll={false} aria-label="حذف فیلتر دسته" className="hover:bg-primary/20 p-0.5 rounded-full transition-colors">
                                    <X className="w-3 h-3" />
                                </Link>
                            </div>
                        )}

                        {currentLevel.map((node) => (
                            <Link
                                key={node.id}
                                href={categoryHref(node.id)}
                                scroll={false}
                                className={cn(
                                    'whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex-shrink-0 active:scale-95',
                                    node.id === categoryFromUrl
                                        ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20'
                                        : 'bg-surface-container-low/50 text-on-surface-variant border-outline-variant/50 hover:border-primary/40 hover:bg-surface-container-high hover:shadow-sm',
                                )}
                            >
                                {node.title}
                            </Link>
                        ))}

                        <div className="flex flex-1">
                            <div className="flex flex-1" />
                            <LocationFilter />
                        </div>
                    </div>

                    {isLeaf && <div className="w-px h-7 bg-outline-variant/20 mx-1 hidden md:block flex-shrink-0" />}

                    {isLeaf && (
                        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                            <QuantityControl
                                id="moq-input"
                                label="حجم خرید"
                                unit={selectedUnit}
                                paramValue={minqFromUrl}
                                onClearHref={buildHref({ minq: null })}
                                onCommit={(v) => commitNumberFilter('minq', v)}
                            />
                            <div className="w-px h-5 bg-outline-variant/20" />
                            <QuantityControl
                                id="stock-input"
                                label="حداقل موجودی"
                                unit={selectedUnit}
                                paramValue={minstockFromUrl}
                                onClearHref={buildHref({ minstock: null })}
                                onCommit={(v) => commitNumberFilter('minstock', v)}
                            />
                        </div>
                    )}
                </div>

                {/* Mobile Toolbar */}
                {isLeaf && (
                    <div className="flex md:hidden items-center gap-x-1 gap-y-2 mt-1.5 pt-2.5 pb-1 border-t border-outline-variant/10 overflow-x-auto scrollbar-hide">
                        <QuantityControl
                            id="moq-input-m"
                            label="حجم خرید"
                            unit={selectedUnit}
                            paramValue={minqFromUrl}
                            onClearHref={buildHref({ minq: null })}
                            onCommit={(v) => commitNumberFilter('minq', v)}
                        />
                        <QuantityControl
                            id="stock-input-m"
                            label="حداقل موجودی"
                            unit={selectedUnit}
                            paramValue={minstockFromUrl}
                            onClearHref={buildHref({ minstock: null })}
                            onCommit={(v) => commitNumberFilter('minstock', v)}
                        />
                        {resultCount !== undefined && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mr-auto flex-shrink-0">
                                {resultCount.toLocaleString('fa-IR')} نتیجه
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}