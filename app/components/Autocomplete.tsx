// app/components/Autocomplete.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Search, X, Check, ChevronLeft, CornerDownLeft, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AutocompleteItem {
    id: string;
    title: string;
    [key: string]: any;
}

export interface AutocompleteValue {
    id: string | null;
    title: string;
}

interface Props {
    /** مقدار فعلی */
    value: AutocompleteValue;
    /** callback هنگام تغییر */
    onChange: (value: AutocompleteValue) => void;
    /** تابع جستجو — باید لیست آیتم‌ها رو برگردونه */
    fetchFn: (q: string) => Promise<AutocompleteItem[]>;
    /** کلید cache برای React Query */
    queryKey: string;
    placeholder?: string;
    className?: string;
    /** حداقل تعداد حرف برای شروع جستجو */
    minChars?: number;
    /** رندر سفارشی برای هر آیتم در dropdown. query برای هایلایت متن matched است. */
    renderOption?: (item: AutocompleteItem, query: string) => React.ReactNode;
    /**
     * اگه true باشه، وقتی کاربر چیزی تایپ کرد که در لیست نبود،
     * یه راهنمای «مورد جدید ساخته می‌شود» نشون می‌ده.
     * پیش‌فرض: true
     */
    allowCreate?: boolean;
    /** برچسب مورد جدید — مثلاً «صنف جدید» یا «شهر جدید» */
    createLabel?: string;
}

/**
 * Autocomplete — کامپوننت جستجوی خودکار قابل استفاده مجدد
 *
 * ┌─────────────────────────────────────────────────┐
 * │ UX Principles                                   │
 * ├─────────────────────────────────────────────────┤
 * │ ۱. Silent when empty — هیچ dropdown خالی نشون   │
 * │    داده نمی‌شه. اینپوت مثل یه فیلد معمولی عمل     │
 * │    می‌کنه تا کاربر حس کنه داره تایپ می‌کنه.        │
 * │                                                 │
 * │ ۲. Clear select affordance — هر آیتم یه حالت    │
 * │    انتخاب واضح داره (hover + آیکون + رنگ).       │
 * │                                                 │
 * │ ۳. Exact match auto-highlight — اگه متن کاربر   │
 * │    دقیقاً با یه آیتم match بشه، خودکار هایلایت   │
 * │    می‌شه و راهنمای «Enter برای انتخاب» نشون      │
 * │    داده می‌شه.                                   │
 * │                                                 │
 * │ ۴. Auto-select on blur — اگه کاربر از لیست       │
 * │    انتخاب نکرد ولی متنش دقیقاً match بود، موقع    │
 * │    blur خودکار انتخاب می‌شه.                     │
 * │                                                 │
 * │ ۵. Selected state badge — وقتی انتخاب شد، badge │
 * │    سبز «✓ انتخاب شد» داخل اینپوت نشون داده       │
 * │    می‌شه.                                        │
 * │                                                 │
 * │ ۶. Create hint — وقتی چیزی پیدا نشد ولی allowCreate│
 * │    روشن بود، راهنمای ملایم «مورد جدید ساخته می‌شه»│
 * │    نشون داده می‌شه (نه dropdown کامل).            │
 * └─────────────────────────────────────────────────┘
 */
export default function Autocomplete({
    value,
    onChange,
    fetchFn,
    queryKey,
    placeholder = 'جستجو...',
    className,
    minChars = 2,
    renderOption,
    allowCreate = true,
    createLabel = 'مورد جدید',
}: Props) {
    const [input, setInput] = useState(value.title || '');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastValueIdRef = useRef(value.id);

    // ✅ FIX: فقط وقتی value.id عوض شد (انتخاب از لیست یا پاک کردن)، input رو سینک کن
    // این جلوی feedback loop رو می‌گیره که باعث می‌شد dropdown سریع بسته بشه.
    useEffect(() => {
        if (value.id !== lastValueIdRef.current) {
            lastValueIdRef.current = value.id;
            setInput(value.title || '');
        }
    }, [value.id, value.title]);

    const query = input.trim();

    // جستجو — enabled فقط به input.length وابسته‌ست، نه isOpen
    const { data: items = [], isFetching } = useQuery({
        queryKey: [queryKey, query],
        queryFn: async () => {
            if (query.length < minChars) return [];
            return fetchFn(query);
        },
        enabled: query.length >= minChars,
        staleTime: 30_000,
    });

    // ✅ پیدا کردن exact match (case-insensitive)
    const exactMatchIndex = items.findIndex(
        (item) => item.title.trim().toLowerCase() === query.toLowerCase()
    );
    const hasExactMatch = exactMatchIndex !== -1;
    const isSelected = !!value.id;
    const hasResults = items.length > 0;

    // ✅ auto-match: اگه متن کاربر دقیقاً با یک آیتم match بشه، خودکار انتخاب کن
    const handleBlur = useCallback(() => {
        if (!query) return;
        const exactMatch = items.find(
            (item) => item.title.trim().toLowerCase() === query.toLowerCase(),
        );
        if (exactMatch && exactMatch.id !== value.id) {
            onChange({ id: exactMatch.id, title: exactMatch.title });
        }
    }, [query, items, value.id, onChange]);

    // بستن dropdown با کلیک خارج
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                handleBlur();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [handleBlur]);

    const handleSelect = (item: AutocompleteItem) => {
        onChange({ id: item.id, title: item.title });
        setInput(item.title);
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // باز کردن dropdown با ArrowDown
        if (e.key === 'ArrowDown' && !isOpen && hasResults) {
            e.preventDefault();
            setIsOpen(true);
            setHighlightedIndex(hasExactMatch ? exactMatchIndex : 0);
            return;
        }

        if (!isOpen || !hasResults) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => {
                if (prev < 0) return hasExactMatch ? exactMatchIndex : 0;
                return prev < items.length - 1 ? prev + 1 : 0;
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => {
                if (prev <= 0) return items.length - 1;
                return prev - 1;
            });
        } else if (e.key === 'Enter') {
            // ✅ اگه آیتمی هایلایت شده → انتخابش
            // ✅ اگه نه ولی exact match هست → انتخابش
            if (highlightedIndex >= 0 && items[highlightedIndex]) {
                e.preventDefault();
                handleSelect(items[highlightedIndex]);
            } else if (hasExactMatch) {
                e.preventDefault();
                handleSelect(items[exactMatchIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
        }
    };

    // ✅ هایلایت کردن بخش matched متن
    const highlightMatch = (text: string, q: string): React.ReactNode => {
        if (!q) return text;
        const lowerText = text.toLowerCase();
        const lowerQuery = q.toLowerCase();
        const idx = lowerText.indexOf(lowerQuery);
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark className="bg-primary/20 text-primary px-0.5 rounded-sm font-bold">
                    {text.slice(idx, idx + q.length)}
                </mark>
                {text.slice(idx + q.length)}
            </>
        );
    };

    // ✅ آیا باید dropdown نشون داده بشه؟
    // فقط وقتی نتیجه هست یا در حال fetch هستیم — وگرنه silent
    const shouldShowDropdown = isOpen && query.length >= minChars && (hasResults || isFetching);

    // ✅ آیا باید راهنمای «مورد جدید» نشون داده بشه؟
    // وقتی چیزی تایپ شده، انتخاب نشده، و نتیجه‌ای نیست (یا exact match نیست)
    const shouldShowCreateHint = allowCreate
        && !isSelected
        && query.length >= minChars
        && !isFetching
        && !hasExactMatch
        && isOpen;

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50 pointer-events-none" />

                <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        // ✅ وقتی کاربر تایپ می‌کنه، id رو null کن (انتخاب قبلی لغو می‌شه)
                        onChange({ id: null, title: e.target.value });
                        setIsOpen(true);
                        setHighlightedIndex(-1);
                    }}
                    onFocus={() => {
                        if (query.length >= minChars) {
                            setIsOpen(true);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        // delayed blur تا کلیک روی آیتم کار کنه
                        if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                        blurTimeoutRef.current = setTimeout(() => {
                            setIsOpen(false);
                            handleBlur();
                        }, 200);
                    }}
                    placeholder={placeholder}
                    className={cn(
                        'w-full h-11 pr-9 pl-20 rounded-xl bg-surface-container-lowest border text-sm',
                        'border-outline-variant/40 dark:border-gray-700 outline-none',
                        'focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all',
                        isSelected && 'border-primary/50 bg-primary/5 pr-9',
                        className,
                    )}
                />

                {/* ✅ badge انتخاب شده / دکمه پاک کردن */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isSelected ? (
                        <span className="flex items-center gap-1 px-2 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                            <Check className="w-3 h-3" /> انتخاب شد
                        </span>
                    ) : input ? (
                        <button
                            type="button"
                            onClick={() => {
                                setInput('');
                                onChange({ id: null, title: '' });
                                setIsOpen(false);
                                setHighlightedIndex(-1);
                            }}
                            className="p-1 text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
                            aria-label="پاک کردن"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* ═══ Dropdown — فقط وقتی نتیجه هست ═══ */}
            {shouldShowDropdown && (
                <div className="absolute z-50 top-full mt-1 inset-x-0 bg-white dark:bg-gray-900 border border-outline-variant/30 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* لیست آیتم‌ها */}
                    <div className="max-h-60 overflow-y-auto scrollbar-slim">
                        {items.map((item, idx) => {
                            const isExact = idx === exactMatchIndex;
                            const isHighlighted = idx === highlightedIndex;
                            const isSelectedItem = value.id === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setHighlightedIndex(idx)}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 px-3 py-2.5 text-right transition-all group',
                                        isHighlighted
                                            ? 'bg-primary/8'
                                            : 'hover:bg-surface-container-high/50',
                                        isExact && !isHighlighted && 'bg-primary/4',
                                    )}
                                >
                                    {/* ✅ آیکون وضعیت */}
                                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                        {isSelectedItem ? (
                                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        ) : isExact ? (
                                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                                        ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/20 group-hover:bg-primary/40 transition-colors" />
                                        )}
                                    </span>

                                    {/* ✅ عنوان با هایلایت matched */}
                                    <span className="flex-1 text-xs font-medium text-on-surface truncate">
                                        {renderOption
                                            ? renderOption(item, query)
                                            : highlightMatch(item.title, query)
                                        }
                                    </span>
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-primary flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <CornerDownLeft className="w-3 h-3" />
                                            انتخاب
                                        </span>
                                    {/* ✅ راهنمای انتخاب */}
                                    {isSelectedItem ? (
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                            انتخاب‌شده
                                        </span>
                                    ) : isExact ? null: (
                                        <ChevronLeft className="w-3.5 h-3.5 text-on-surface-variant/30 group-hover:text-primary/60 flex-shrink-0 transition-colors" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* ✅ فوتر راهنمای کیبورد */}
                    <div className="border-t border-outline-variant/20 px-3 py-1.5 bg-surface-container-low/40 flex items-center justify-between text-[9px] text-on-surface-variant/60">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high/70 text-[8px] font-mono">↑↓</kbd>
                            پیمایش
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high/70 text-[8px] font-mono">↵</kbd>
                            انتخاب
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high/70 text-[8px] font-mono">Esc</kbd>
                            بستن
                        </span>
                    </div>
                </div>
            )}

            {/* ═══ راهنمای «مورد جدید» — silent، بدون dropdown ═══ */}
            {shouldShowCreateHint && (
                <div className="absolute z-40 top-full mt-1 inset-x-0 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30 rounded-lg px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="flex-1">
                            {hasResults ? (
                                <>
                                    اگر یکی از موارد بالا رو انتخاب نکنی،{' '}
                                    <strong className="font-bold">{createLabel}</strong>{' '}
                                    جدیدی با نام «{query}» ساخته می‌شه
                                </>
                            ) : (
                                <>
                                    <strong className="font-bold">{createLabel}</strong>{' '}
                                    جدیدی با نام «{query}» ساخته می‌شه
                                </>
                            )}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
