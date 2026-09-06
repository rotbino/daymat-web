// app/my-catalogs/components/SlugEditor.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';

const SLUG_REGEX = /^[a-z0-9-]*$/;

type SlugStatus = 'idle' | 'checking' | 'ok' | 'taken' | 'reserved' | 'short' | 'empty' | 'own';

interface Props {
    value: string;
    onChange: (slug: string) => void;
    excludeId?: string;
    initialError?: 'taken' | 'reserved' | null;
}

export default function SlugEditor({ value, onChange, excludeId, initialError }: Props) {
    const debounced = useDebounced(value, 450);
    const slug = slugify(debounced);
    const isOwn = slug === slugify(value);

    const localStatus: SlugStatus = useMemo(() => {
        if (!slug) return 'empty';
        if (slug.length < 3) return 'short';
        return 'idle';
    }, [slug]);

    const { data, isFetching } = useQuery({
        queryKey: ['check-slug', slug, excludeId ?? ''],
        queryFn: () => apiService.catalog.checkSlug(slug, excludeId),
        enabled: slug.length >= 3 && !isOwn,
        staleTime: 0,
        gcTime: 0,
        retry: 0,
    });

    const status: SlugStatus = useMemo(() => {
        if (initialError && slug === slugify(value) && (initialError === 'taken' || initialError === 'reserved')) {
            return initialError;
        }
        if (isOwn) return 'own';
        if (slug.length < 3) return localStatus;
        if (isFetching) return 'checking';
        if (data?.available === false) return data?.reason === 'reserved' ? 'reserved' : 'taken';
        if (data?.available === true) return 'ok';
        return 'checking';
    }, [slug, isFetching, data, isOwn, localStatus, initialError, value]);

    const handleChange = (raw: string) => {
        onChange(raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40));
    };

    const ui = (() => {
        switch (status) {
            case 'checking': return { icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-on-surface-variant/60" />, text: 'بررسی…', cls: 'text-on-surface-variant/70', border: 'border-outline-variant/40 dark:border-gray-700' };
            case 'ok': return { icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />, text: 'این آدرس آزاد است ✓', cls: 'text-emerald-600 dark:text-emerald-400 font-bold', border: 'border-emerald-400/70' };
            case 'taken': return { icon: <AlertTriangle className="w-3.5 h-3.5 text-error" />, text: 'این آدرس توسط شخص دیگری رزرو شده', cls: 'text-error font-bold', border: 'border-error' };
            case 'reserved': return { icon: <AlertTriangle className="w-3.5 h-3.5 text-error" />, text: 'این آدرس قابل انتخاب نیست', cls: 'text-error font-bold', border: 'border-error' };
            case 'short': return { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />, text: 'حداقل ۳ حرف انگلیسی', cls: 'text-amber-600 dark:text-amber-400', border: 'border-outline-variant/40 dark:border-gray-700' };
            case 'empty': return { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />, text: 'آدرس را بنویس', cls: 'text-amber-600 dark:text-amber-400', border: 'border-outline-variant/40 dark:border-gray-700' };
            case 'own': return { icon: <CheckCircle2 className="w-3.5 h-3.5 text-primary" />, text: 'آدرس فعلی کاتالوگت', cls: 'text-primary', border: 'border-primary/40' };
            default: return { icon: <Check className="w-3.5 h-3.5 text-on-surface-variant/40" />, text: 'آدرس انگلیسی', cls: 'text-on-surface-variant/60', border: 'border-outline-variant/40 dark:border-gray-700' };
        }
    })();

    return (
        <div className="space-y-1.5" dir="ltr">
            <div className={cn(
                'flex items-stretch h-11 rounded overflow-hidden border bg-surface-container-lowest transition-all',
                'focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary',
                ui.border,
            )}>
                <span className="flex items-center px-3 bg-surface-container-high dark:bg-gray-800
                    text-[12px] font-bold text-on-surface-variant/70 select-none whitespace-nowrap border-e border-outline-variant/30">
                    daymat.ir/
                </span>
                <input
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    dir="ltr"
                    inputMode="latin"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="flex-1 min-w-0 px-3 text-[13px] font-bold outline-none bg-transparent text-left"
                    placeholder="my-catalog"
                />
            </div>
            <p className={cn('text-[10px] flex items-center gap-1.5 px-1', ui.cls)}>
                {ui.icon}
                {ui.text}
            </p>
        </div>
    );
}

function slugify(raw: string): string {
    return (raw ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function useDebounced<T>(value: T, delay: number): T {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}