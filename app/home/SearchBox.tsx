// app/home/SearchBox.tsx
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { Search, X, Clock, TrendingUp, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildFilterHref } from '@/lib/utils/filterUrl';

const faNormalize = (s: string) =>
    s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, ' ')
        .replace(/\s+/g, ' ').trim().toLowerCase();

const RECENT_KEY = 'recentSearches';
const getLocalRecents = (): string[] => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
};
const saveLocalRecent = (term: string) => {
    const list = [term, ...getLocalRecents().filter((r) => r !== term)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
};

interface Props {
    className?: string;
    compact?: boolean;
    placeholder?: string;
}

export default function SearchBox({
                                      className,
                                      compact = false,
                                      placeholder = 'جستجو ...',
                                  }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { currentSlug } = useSelector((s: RootState) => s.arm);
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);
    const armSlug = currentSlug || 'barton';

    const [value, setValue] = useState(searchParams.get('search') || '');
    const [focused, setFocused] = useState(false);
    const [debounced, setDebounced] = useState('');
    const [highlight, setHighlight] = useState(-1);
    const boxRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setValue(searchParams.get('search') || ''); }, [searchParams]);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(value.trim()), 300);
        return () => clearTimeout(t);
    }, [value]);

    useEffect(() => {
        if (!focused) return;
        const h = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocused(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [focused]);

    const q = debounced;
    const qn = faNormalize(q);
    const qReady = focused && q.length >= 2;

    // ─── ۱) پیشنهاد از لاگ جستجوی جمعی (منبع اصلی) ───
    const { data: suggestData, isSuccess: suggestOk, isFetching: suggestFetching } = useQuery({
        queryKey: ['searchSuggest', armSlug, qn],
        queryFn: () => apiService.ad.getSearchSuggestions(armSlug, q),
        enabled: qReady,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 0,
    });
    const loggedTerms: string[] = suggestOk
        ? (suggestData?.suggestions ?? []).map((s: any) => s.term)
        : [];

    // ─── ۲) fallback: استخراج ترم از نتایج واقعی — فقط وقتی لاگ هنوز چیزی ندارد ───
    const { data: fallbackData, isFetching: fallbackFetching } = useQuery({
        queryKey: ['searchSuggestFallback', armSlug, qn],
        queryFn: () => apiService.ad.getVitrine(armSlug, { search: q, limit: 20, page: 1 }),
        enabled: qReady && suggestOk && loggedTerms.length === 0,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: 0,
    });
    const derivedTerms = useMemo(() => {
        if (!suggestOk || loggedTerms.length > 0 || qn.length < 2) return [];
        const freq = new Map<string, string>();
        for (const ad of fallbackData?.ads ?? []) {
            const raw = (ad.productType || ad.title || '').trim();
            if (!raw) continue;
            const norm = faNormalize(raw);
            if (!norm.includes(qn) || norm === qn) continue;
            if (!freq.has(norm)) freq.set(norm, raw);
            if (freq.size >= 6) break;
        }
        return [...freq.values()];
    }, [fallbackData, qn, suggestOk, loggedTerms.length]);

    // ─── ۳) تاریخچه: لاگین = سرور | مهمان = localStorage ───
    const { data: historyData } = useQuery({
        queryKey: ['searchHistory', armSlug, isAuthenticated],
        queryFn: () => apiService.ad.getSearchHistory(armSlug),
        enabled: focused && isAuthenticated,
        staleTime: 1000 * 60,
    });
    const recents: string[] = useMemo(() => {
        if (q.length >= 2) return [];
        if (isAuthenticated) {
            const items = historyData?.items ?? [];
            return items.map((i: any) => i.term);
        }
        return getLocalRecents();
    }, [q, isAuthenticated, historyData]);

    const suggestions = loggedTerms.length > 0 ? loggedTerms : derivedTerms;
    const open = focused && (q.length < 2 ? recents.length > 0 : (suggestions.length > 0 || suggestFetching || fallbackFetching));

    const go = (term: string) => {
        saveLocalRecent(term);
        setFocused(false);
        inputRef.current?.blur();
        router.push(buildFilterHref(pathname, searchParams, [], { search: term || null }), { scroll: false });
    };

    const clearHistory = async () => {
        if (isAuthenticated) {
            await apiService.ad.clearSearchHistory(armSlug).catch(() => {});
            queryClient.invalidateQueries({ queryKey: ['searchHistory', armSlug, true] });
        } else {
            localStorage.removeItem(RECENT_KEY);
        }
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); go(value.trim()); };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const items = q.length >= 2 ? suggestions : recents;
        if (!open || items.length === 0) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, items.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, -1)); }
        else if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur(); }
        else if (e.key === 'Enter' && highlight >= 0) { e.preventDefault(); go(items[highlight]); }
    };

    return (
        <div ref={boxRef} className={cn('relative', className)}>
            <form onSubmit={handleSubmit} role="search" className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                    {/* X پاک‌کردن — سمت شروع (راست در RTL)، فقط وقتی متنی وجود دارد */}
                    {value && (
                        <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); go(''); }}
                            aria-label="پاک کردن جستجو"
                            className="absolute start-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full
                hover:bg-surface-container-high text-on-surface-variant hover:text-error transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    <input
                        ref={inputRef}
                        type="search"
                        value={value}
                        onChange={(e) => { setValue(e.target.value); setHighlight(-1); }}
                        onFocus={() => setFocused(true)}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder}
                        aria-label="جستجو"
                        role="combobox"
                        aria-expanded={open}
                        enterKeyHint="search"
                        className="w-full h-10 ps-9 pe-9 text-sm rounded bg-surface-container-high/70 dark:bg-gray-800
            border focus:border-primary/40 focus:bg-surface focus:outline-none
            focus:ring-1 focus:ring-primary/30 transition-all
            [&::-webkit-search-cancel-button]:hidden"
                    />

                    {/* آیکون جستجو — سمت روبه‌رو (چپ در RTL)، دکمه submit: کلیک = سرچ */}
                    <button
                        type="submit"
                        aria-label="جستجو"
                        onClick={(e) => { if (!value.trim()) e.preventDefault(); }}
                        className={cn(
                            'absolute end-0.5 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all active:scale-90',
                            value.trim()
                                ? 'text-primary hover:bg-primary/10'
                                : 'text-on-surface-variant/50 hover:text-primary',
                        )}
                    >
                        <Search className="w-4 h-4" />
                    </button>
                </div>
                {!compact && (
                    <button type="submit" className="h-10 px-5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 shadow-sm whitespace-nowrap">
                        جستجو
                    </button>
                )}
            </form>

            {open && (
                <div role="listbox"
                     className="absolute top-full inset-x-0 mt-1.5 p-1.5 rounded-2xl bg-white dark:bg-gray-900
                        border border-outline-variant/30 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150
                        max-h-[60vh] overflow-y-auto scrollbar-slim">

                    {/* تاریخچه */}
                    {q.length < 2 && recents.length > 0 && (
                        <>
                            <div className="px-3 pt-1.5 pb-1 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-on-surface-variant/60">جستجوهای اخیر</span>
                                <button type="button" onClick={clearHistory}
                                        className="flex items-center gap-1 text-[10px] text-on-surface-variant/60 hover:text-error">
                                    <Trash2 className="w-3 h-3" /> پاک کردن
                                </button>
                            </div>
                            {recents.map((r) => (
                                <button key={r} type="button" role="option" onMouseDown={(e) => { e.preventDefault(); go(r); }}
                                        className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-on-surface hover:bg-surface-container-high text-right transition-colors">
                                    <Clock className="w-3.5 h-3.5 text-on-surface-variant/50 flex-shrink-0" />
                                    <span className="truncate">{r}</span>
                                </button>
                            ))}
                        </>
                    )}

                    {/* جستجوی عبارت خام — همیشه اول */}
                    {q.length >= 2 && (
                        <button type="button" role="option" onMouseDown={(e) => { e.preventDefault(); go(q); }}
                                className={cn('w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-right transition-colors',
                                    highlight === -1 ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-high')}>
                            <Search className="w-3.5 h-3.5 flex-shrink-0" />
                            جستجوی «{q}»
                        </button>
                    )}

                    {/* پیشنهادها */}
                    {suggestions.map((t, i) => (
                        <button key={t} type="button" role="option" onMouseDown={(e) => { e.preventDefault(); go(t); }}
                                className={cn('w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-right transition-colors',
                                    highlight === i ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-high')}>
                            <TrendingUp className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
                            <span className="truncate">{t}</span>
                        </button>
                    ))}

                    {q.length >= 2 && (suggestFetching || fallbackFetching) && suggestions.length === 0 && (
                        <div className="flex items-center justify-center py-4 text-on-surface-variant/60">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}