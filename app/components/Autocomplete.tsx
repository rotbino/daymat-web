// app/components/Autocomplete.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    /** تابع ساخت آیتم جدید (اگه کاربر چیزی تایپ کرد که وجود نداشت) */
    createFn?: (title: string) => Promise<AutocompleteItem | null>;
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
 * ۶. موقع ذخیره، بک‌اند خودش آیتم جدید می‌سازه
 *
 * نکات:
 * - کاملاً خاموش — هیچ پیام «پیدا نشد» یا «از قبل وجود داره» نمی‌ده
 * - auto-match: اگه کاربر تایپ کنه «پخش مواد غذایی» و این متن دقیقاً با یک آیتم match بشه،
 *   موقع blur خودکار id اون آیتم ست می‌شه
 */
export default function Autocomplete({
    value,
    onChange,
    fetchFn,
    createFn,
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

    // sync از parent
    useEffect(() => {
        setInput(value.title || '');
    }, [value.title, value.id]);

    // جستجو
    const { data: items = [], isFetching } = useQuery({
        queryKey: [queryKey, input],
        queryFn: async () => {
            if (input.trim().length < minChars) return [];
            return fetchFn(input.trim());
        },
        enabled: input.trim().length >= minChars && isOpen,
        staleTime: 30_000,
    });

    // بستن dropdown با کلیک خارج
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                // ✅ auto-match هنگام blur
                handleBlur();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50 pointer-events-none" />
                <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        // ✅ وقتی کاربر تایپ می‌کنه، id رو null کن
                        onChange({ id: null, title: e.target.value });
                        setIsOpen(true);
                        setHighlightedIndex(-1);
                    }}
                    onFocus={() => input.trim().length >= minChars && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        // delayed blur تا کلیک روی آیتم کار کنه
                        if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                        blurTimeoutRef.current = setTimeout(() => {
                            setIsOpen(false);
                            handleBlur();
                        }, 150);
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
            {isOpen && input.trim().length >= minChars && (
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
