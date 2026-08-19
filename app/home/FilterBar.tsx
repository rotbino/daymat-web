// app/home/FilterBar.tsx
'use client';
import React, { useState, useCallback, useEffect, useRef, cloneElement, ReactElement } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ArrowRight, X, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberInput } from "@/components/common";
import { LocationFilter } from '@/app/components/LocationFilter';

// --- Types ---
interface CategoryNode {
    id: string;
    title: string;
    children: CategoryNode[];
}

interface Props {
    categoryTree: CategoryNode[];
    selectedCategoryId: string | null;
    onSelect: (categoryId: string) => void;
    isLeaf?: boolean;
    selectedUnit?: string;
    minQuantity?: number;
    onMinQuantityChange?: (value: number) => void;
    minAvailableQuantity?: number;
    onMinAvailableChange?: (value: number) => void;
    moqPresets?: number[];
    stockPresets?: number[];
    onResetFilters?: () => void;
    resultCount?: number;
}

// --- Compact Floating Label (Adapted for Filter Bar) ---
interface FloatingWrapperProps {
    label: string;
    id: string;
    children: ReactElement;
    minWidth?: number
}

const CompactFloatingLabel: React.FC<FloatingWrapperProps> = ({ label, id, children, minWidth = 70 }) => {
    const hasValue = children.props.value !== undefined && children.props.value !== null && children.props.value !== '';

    const childWithProps = cloneElement(children, {
        id,
        className: `flex flex-1 peer w-full text-right bg-surface-container border border-outline-variant rounded-lg h-8 px-2.5 text-[10px]
            focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all
            ${children.props.className ?? ""}`,
        dir: "rtl",
        placeholder: " ",
    });

    return (
        <div className={`relative w-28 min-w-[${minWidth}px]`}>
            {childWithProps}
            <label
                htmlFor={id}
                className={cn(
                    "absolute text-on-surface-variant/60 transition-all duration-200 bg-white dark:bg-gray-900 px-1 pointer-events-none z-10 right-2.5",
                    hasValue
                        ? "-top-2 text-[9px] font-medium text-primary"
                        : "top-1/2 -translate-y-1/2 text-[11px]"
                )}
                style={{
                    top: hasValue ? '-8px' : '50%',
                    transform: hasValue ? 'translateY(0)' : 'translateY(-50%)',
                    fontSize: hasValue ? '10px' : '10px',
                    fontWeight: hasValue ? '500' : '400',
                    color: hasValue ? 'var(--color-primary)' : ''
                }}
            >
                {label}
            </label>
        </div>
    );
};

// --- Main Component ---
export default function FilterBar({
                                      categoryTree,
                                      selectedCategoryId,
                                      onSelect,
                                      isLeaf,
                                      selectedUnit = 'تن',
                                      minQuantity = 0,
                                      onMinQuantityChange,
                                      minAvailableQuantity = 0,
                                      onMinAvailableChange,
                                      moqPresets = [],
                                      stockPresets = [],
                                      onResetFilters,
                                      resultCount,
                                  }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // States
    const [path, setPath] = useState<CategoryNode[]>([]);
    const [moqInput, setMoqInput] = useState<number | undefined>(undefined);
    const [stockInput, setStockInput] = useState<number | undefined>(undefined);

    // Progressive Disclosure States
    const [showMoq, setShowMoq] = useState(false);
    const [showStock, setShowStock] = useState(false);

    // Dropdown States
    const [openMoq, setOpenMoq] = useState(false);
    const [openStock, setOpenStock] = useState(false);

    // Refs
    const moqRef = useRef<HTMLDivElement>(null);
    const stockRef = useRef<HTMLDivElement>(null);

    // Effects
    useEffect(() => { setPath([]); }, [categoryTree]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moqRef.current && !moqRef.current.contains(event.target as Node)) setOpenMoq(false);
            if (stockRef.current && !stockRef.current.contains(event.target as Node)) setOpenStock(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounces
    useEffect(() => {
        if (!showMoq || moqInput === undefined) return;
        const timer = setTimeout(() => onMinQuantityChange?.(moqInput || 0), 300);
        return () => clearTimeout(timer);
    }, [moqInput, showMoq, onMinQuantityChange]);

    useEffect(() => {
        if (!showStock || stockInput === undefined) return;
        const timer = setTimeout(() => onMinAvailableChange?.(stockInput || 0), 300);
        return () => clearTimeout(timer);
    }, [stockInput, showStock, onMinAvailableChange]);

    const currentLevel = path.length === 0 ? categoryTree : (path[path.length - 1].children || []);

    const updateUrl = useCallback((id: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (id) params.set('category', id); else params.delete('category');
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [router, searchParams]);

    const drillDown = useCallback((node: CategoryNode) => {
        onSelect(node.id);
        updateUrl(node.id);
        setPath(prev => [...prev, node]);
    }, [onSelect, updateUrl]);

    const goBack = useCallback(() => {
        setPath(prev => {
            if (prev.length === 0) return prev;
            const newPath = prev.slice(0, -1);
            const parentNode = newPath.length > 0 ? newPath[newPath.length - 1] : null;
            if (parentNode) { onSelect(parentNode.id); updateUrl(parentNode.id); }
            else { onSelect(''); updateUrl(null); }
            onResetFilters?.();
            return newPath;
        });
        setShowMoq(false); setShowStock(false);
        setMoqInput(undefined); setStockInput(undefined);
    }, [onSelect, updateUrl, onResetFilters]);

    const handleBreadcrumbClick = useCallback((index: number) => {
        setPath(prev => {
            const newPath = prev.slice(0, index + 1);
            const node = newPath[newPath.length - 1];
            onSelect(node.id);
            updateUrl(node.id);
            return newPath;
        });
    }, [onSelect, updateUrl]);

    const selectAll = useCallback(() => {
        onSelect(''); updateUrl(null); setPath([]);
        setShowMoq(false); setShowStock(false);
        setMoqInput(undefined); setStockInput(undefined);
        onResetFilters?.();
    }, [onSelect, updateUrl, onResetFilters]);


    // Custom Checkbox Component
    const FilterCheckbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
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

    return (
        <div className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-outline-variant/10">

            {/* Breadcrumb */}
            {path.length > 0 && (
                <div className="flex items-center px-3 pt-1.5 pb-0.5 border-b border-outline-variant/5">
                    <div className="flex items-center gap-1 text-[10px] md:text-[12px] overflow-x-auto scrollbar-hide py-0.5">
                        <button onClick={selectAll} className="hover:text-primary transition-colors text-on-surface-variant/70 whitespace-nowrap">همه دسته‌ها</button>
                        {path.map((node, idx) => {
                            const isLast = idx === path.length - 1;
                            return (
                                <React.Fragment key={node.id}>
                                    <ChevronLeft className="w-3 h-3 flex-shrink-0 text-on-surface-variant/30" />
                                    {isLast ? (
                                        <span className="text-on-surface font-semibold whitespace-nowrap px-1 py-0.5 rounded bg-primary/5 text-primary">{node.title}</span>
                                    ) : (
                                        <button onClick={() => handleBreadcrumbClick(idx)} className="hover:text-primary transition-colors whitespace-nowrap text-on-surface-variant/70">{node.title}</button>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Bar */}
            <div className="px-3 py-1.5">
                <div className="flex items-center gap-2">

                    {/* Categories & Location Scroll Area */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">

                        {path.length > 0 && (
                            <button onClick={goBack} className="flex-shrink-0 p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all active:scale-95" title="بازگشت">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}

                        {path.length === 0 && (
                            <button onClick={selectAll} className={cn(
                                "whitespace-nowrap px-3 py-1 text-xs font-semibold rounded-full border transition-all flex-shrink-0 active:scale-95",
                                !selectedCategoryId ? "bg-primary text-on-primary border-primary shadow-md shadow-primary/20" : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary"
                            )}>همه</button>
                        )}

                        {isLeaf && path.length > 0 && (
                            <div className="flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                                {path[path.length - 1].title}
                                <button onClick={goBack} className="hover:bg-primary/20 p-0.5 rounded-full transition-colors"><X className="w-3 h-3" /></button>
                            </div>
                        )}

                        {currentLevel.map((node) => (
                            <button key={node.id} onClick={() => drillDown(node)} className={cn(
                                "whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-all flex-shrink-0 active:scale-95",
                                node.id === selectedCategoryId ? "bg-primary text-on-primary border-primary shadow-md shadow-primary/20" : "bg-surface-container-low/50 text-on-surface-variant border-outline-variant/50 hover:border-primary/40 hover:bg-surface-container-high hover:shadow-sm"
                            )}>{node.title}</button>
                        ))}

                        {/* ✅ قرارگیری لوکیشن در انتهای نوار دسته بندی */}
                        <div className={"flex flex-1"}>
                            <div className={"flex flex-1"} />
                            <LocationFilter />
                        </div>

                    </div>

                    {/* Divider (Desktop) */}
                    {isLeaf && <div className="w-px h-7 bg-outline-variant/20 mx-1 hidden md:block" />}

                    {/* Right Toolbar (Progressive Disclosure) - Desktop */}
                    {isLeaf && (
                        <div className="hidden md:flex items-center gap-2 flex-shrink-0">

                            {/* MOQ Logic */}
                            {!showMoq ? (
                                <FilterCheckbox label="امکان خرید در حجم" checked={false} onChange={() => setShowMoq(true)} />
                            ) : (
                                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <CompactFloatingLabel label={`حجم خرید (${selectedUnit})`} id="moq-input">
                                        <NumberInput className={"max-h-8 text-center"} value={moqInput} onChange={(val) => setMoqInput(val)} />
                                    </CompactFloatingLabel>
                                    <button onClick={() => { setShowMoq(false); setMoqInput(undefined); onMinQuantityChange?.(0); }} className="p-0.5 rounded-md hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            <div className="w-px h-5 bg-outline-variant/20" />

                            {/* Stock Logic */}
                            {!showStock ? (
                                <FilterCheckbox label="تضمین موجودی" checked={false} onChange={() => setShowStock(true)} />
                            ) : (
                                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <CompactFloatingLabel minWidth={130} label={`حداقل موجودی (${selectedUnit})`} id="stock-input">
                                        <NumberInput className={"max-h-8 text-center"} value={stockInput} onChange={(val) => setStockInput(val)} />
                                    </CompactFloatingLabel>
                                    <button onClick={() => { setShowStock(false); setStockInput(undefined); onMinAvailableChange?.(0); }} className="p-0.5 rounded-md hover:bg-error/10 text-on-surface-variant hover:text-error  transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile Toolbar */}
                {isLeaf && (
                    <div className="flex md:hidden items-center gap-x-0.5 gap-y-2 mt-2 pt-4 pb-1 border-t border-outline-variant/10">

                        {/* MOQ Logic Mobile */}
                        {!showMoq ? (
                            <FilterCheckbox label="امکان خرید در حجم" checked={false} onChange={() => setShowMoq(true)} />
                        ) : (
                            <div className="flex items-center gap-0 animate-in fade-in duration-200">
                                <CompactFloatingLabel minWidth={120} label={`حجم خرید (${selectedUnit})`} id="moq-input-m">
                                    <NumberInput className={"max-h-8 text-center"}  value={moqInput} onChange={(val) => setMoqInput(val)} />
                                </CompactFloatingLabel>
                                <button className="p-0.5 text-error relative left-6" onClick={() => { setShowMoq(false); setMoqInput(undefined); onMinQuantityChange?.(0); }}><X className="w-3.5 h-3.5" /></button>
                            </div>
                        )}

                        {/* Stock Logic Mobile */}
                        {!showStock ? (
                            <FilterCheckbox label="تضمین موجودی" checked={false} onChange={() => setShowStock(true)} />
                        ) : (
                            <div className="flex items-center gap-0 animate-in fade-in duration-200">
                                <CompactFloatingLabel minWidth={130} label={`حداقل موجودی (${selectedUnit})`} id="stock-input-m">
                                    <NumberInput className={"max-h-8 text-center"} value={stockInput} onChange={(val) => setStockInput(val)} />
                                </CompactFloatingLabel>
                                <button className="p-0.5 text-error relative left-6" onClick={() => { setShowStock(false); setStockInput(undefined); onMinAvailableChange?.(0); }}><X className="w-3.5 h-3.5" /></button>
                            </div>
                        )}

                        {resultCount !== undefined && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mr-auto">
                                {resultCount.toLocaleString('fa-IR')} نتیجه
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}