// app/components/Autocomplete.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Loader2, Check } from 'lucide-react';
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
    /** رندر سفارشی برای هر آیتم در dropdown */
    renderOption?: (item: AutocompleteItem) => React.ReactNode;
}

/**
 * Autocomplete — کامپوننت جستجوی خودکار قابل استفاده مجدد
 *
 * نحوه کار:
 * ۱. کاربر تایپ می‌کنه
 * ۲. بعد از minChars حرف، سرچ می‌کنه
 * ۳. نتایج زیر اینپوت نشون داده می‌شن
 * ۴. اگه کاربر انتخاب کرد → { id, title } ست می‌شه
 * ۵. اگه چیزی پیدا نشد → مثل یه اینپوت متن عمل می‌کنه (id=null)
 *    موقع blur، اگه متن با یک آیتم موجود دقیقاً match بشه، خودکار انتخاب می‌شه
 *
 * ✅ FIX: input فقط روی mount و تغییر value.id سینک می‌شه (نه روی هر تغییر value.title)
 *    این از feedback loop جلوگیری می‌کنه که باعث می‌شد dropdown سریع بسته بشه.
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
}: Props) {
    const [input, setInput] = useState(value.title || '');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastValueIdRef = useRef(value.id);

    // ✅ FIX: فقط وقتی value.id عوض شد (انتخاب از لیست یا پاک کردن)، input رو سینک کن
    // این جلوی feedback loop رو می‌گیره: user types → parent re-renders → useEffect fires → setInput → re-render
    useEffect(() => {
        if (value.id !== lastValueIdRef.current) {
            lastValueIdRef.current = value.id;
            setInput(value.title || '');
        }
    }, [value.id, value.title]);

    // جستجو — ✅ FIX: enabled فقط به input.length وابسته‌ست، نه isOpen
    const { data: items = [], isFetching } = useQuery({
        queryKey: [queryKey, input.trim()],
        queryFn: async () => {
            if (input.trim().length < minChars) return [];
            return fetchFn(input.trim());
        },
        enabled: input.trim().length >= minChars,
        staleTime: 30_000,
    });

    // ✅ auto-match: اگه متن کاربر دقیقاً با یک آیتم match بشه، خودکار انتخاب کن
    const handleBlur = useCallback(() => {
        if (!input.trim()) return;
        const exactMatch = items.find(
            (item) => item.title.trim() === input.trim(),
        );
        if (exactMatch && exactMatch.id !== value.id) {
            onChange({ id: exactMatch.id, title: exactMatch.title });
        }
    }, [input, items, value.id, onChange]);

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
        if (!isOpen || items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev < items.length - 1 ? prev + 1 : prev,
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            if (highlightedIndex >= 0 && items[highlightedIndex]) {
                e.preventDefault();
                handleSelect(items[highlightedIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    // ✅ آیا باید dropdown نشون داده بشه؟
    const shouldShowDropdown = isOpen && input.trim().length >= minChars;

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50 pointer-events-none" />
                <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        // ✅ اطلاع به parent که متن عوض شد (id=null چون هنوز انتخاب نشده)
                        onChange({ id: null, title: e.target.value });
                        setIsOpen(true);
                        setHighlightedIndex(-1);
                    }}
                    onFocus={() => {
                        if (input.trim().length >= minChars) {
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
                        'w-full h-11 pr-9 pl-8 rounded bg-surface-container-lowest border text-sm',
                        'border-outline-variant/40 dark:border-gray-700 outline-none',
                        'focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all',
                        className,
                    )}
                />
                {input && (
                    <button
                        type="button"
                        onClick={() => {
                            setInput('');
                            onChange({ id: null, title: '' });
                            setIsOpen(false);
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60 hover:text-on-surface"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {shouldShowDropdown && (
                <div className="absolute z-50 top-full mt-1 inset-x-0 bg-white dark:bg-gray-900 border border-outline-variant/30 rounded-xl shadow-lg max-h-60 overflow-y-auto scrollbar-slim">
                    {isFetching ? (
                        <div className="p-3 text-center">
                            <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />
                        </div>
                    ) : items.length === 0 ? (
                        // ✅ خاموش — هیچ پیامی نمی‌ده، فقط dropdown خالی
                        <div className="p-2" />
                    ) : (
                        items.map((item, idx) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelect(item)}
                                className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2 text-right transition-colors',
                                    highlightedIndex === idx
                                        ? 'bg-primary/5'
                                        : 'hover:bg-surface-container-high',
                                )}
                            >
                                <span className="flex-1 text-xs font-medium text-on-surface truncate">
                                    {renderOption ? renderOption(item) : item.title}
                                </span>
                                {value.id === item.id && (
                                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
