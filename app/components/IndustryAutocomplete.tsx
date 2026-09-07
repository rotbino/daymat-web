// app/components/IndustryAutocomplete.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { Search, X, Loader2, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * IndustryAutocomplete — اینپوت جستجوی صنف با suggest
 *
 * نحوه کار:
 * ۱. کاربر تایپ می‌کنه
 * ۲. بعد از ۲ حرف، سرچ می‌کنه در جدول Industry
 * ۳. نتایج زیر اینپوت نشون داده می‌شن
 * ۴. اگه کاربر انتخاب کرد → مقدار ست می‌شه
 * ۵. اگه چیزی پیدا نشد → مقدار تایپ‌شده به‌عنوان صنف جدید قبول می‌شه
 */
export default function IndustryAutocomplete({
    value,
    onChange,
    placeholder = 'صنف خود را وارد کنید...',
    className,
}: Props) {
    const [input, setInput] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // sync از parent
    useEffect(() => {
        setInput(value || '');
    }, [value]);

    // جستجوی صنف
    const { data, isFetching } = useQuery({
        queryKey: ['industry-autocomplete', input],
        queryFn: () => apiRequest(`/industries/autocomplete?q=${encodeURIComponent(input)}`),
        enabled: input.trim().length >= 2 && isOpen,
        staleTime: 30_000,
    });

    const items: any[] = data?.items || [];

    // بستن dropdown با کلیک خارج
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (item: any) => {
        onChange(item.title);
        setInput(item.title);
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev < items.length - 1 ? prev + 1 : prev,
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            if (items[highlightedIndex]) {
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
                        onChange(e.target.value);
                        setIsOpen(true);
                        setHighlightedIndex(-1);
                    }}
                    onFocus={() => input.length >= 2 && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
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
                            onChange('');
                            setIsOpen(false);
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/60 hover:text-on-surface"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && input.trim().length >= 2 && (
                <div className="absolute z-50 top-full mt-1 inset-x-0 bg-white dark:bg-gray-900 border border-outline-variant/30 rounded-xl shadow-lg max-h-60 overflow-y-auto scrollbar-slim">
                    {isFetching ? (
                        <div className="p-3 text-center">
                            <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-3 text-center">
                            <p className="text-xs text-on-surface-variant">
                                صنفی پیدا نشد — «{input}» به‌عنوان صنف جدید ثبت می‌شود
                            </p>
                        </div>
                    ) : (
                        <>
                            {items.map((item, idx) => (
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
                                        {item.title}
                                    </span>
                                    {input === item.title && (
                                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                            {/* گزینه «صنف جدید» */}
                            {!items.some((i) => i.title === input) && (
                                <div className="border-t border-outline-variant/20 p-2">
                                    <p className="text-[10px] text-on-surface-variant px-1">
                                        یا «{input}» را به‌عنوان صنف جدید ثبت کنید
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// helper for apiRequest
async function apiRequest(url: string) {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/';
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const res = await fetch(`${base}${url}`, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return { items: [] };
    return res.json();
}
