// app/business/register/components/SlugPicker.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';

// فقط انگلیسی، عدد، خط‌تیره — بقیه فیلتر می‌شود
const SLUG_REGEX = /^[a-z0-9-]*$/;

type SlugStatus = 'idle' | 'checking' | 'ok' | 'taken' | 'reserved' | 'short' | 'empty';

interface Props {
    value: string;
    onChange: (slug: string) => void;
    /** وضعیت اعتبار را به والد گزارش می‌دهد: 'taken' | 'reserved' | null */
    onStatus?: (status: 'taken' | 'reserved' | null) => void;
    disabled?: boolean;
    excludeId?: string;
}

/**
 * آدرس کاتالوگ — تک‌خطی یکپارچه:
 *   [ daymat.ir /  ┃  this-input  ]   چک زنده · بدون دکمهٔ تایید · مقدار همان لحظه در state والد
 * ورودی: فقط a-z، 0-9، خط‌تیره (regex) · چیدمان LTR داخل RTL
 */
export default function SlugPicker({ value, onChange, onStatus, disabled, excludeId }: Props) {
    const [touched, setTouched] = useState(false);
    const lastReported = useRef<string | null>(null);

    const debounced = useDebounced(value, 450);
    const slug = slugify(debounced);

    // ─── وضعیت محلی ───
    const localStatus: SlugStatus = useMemo(() => {
        if (!slug) return touched ? 'empty' : 'idle';
        if (slug.length < 3) return 'short';
        return 'idle';
    }, [slug, touched]);

    // ─── چک زندهٔ آزاد بودن (فقط وقتی معتبر است) ───
    const { data, isFetching } = useQuery({
        queryKey: ['check-slug', slug, excludeId ?? ''],
        queryFn: () => apiService.catalog.checkSlug(slug, excludeId),
        enabled: slug.length >= 3,
        staleTime: 0,
        gcTime: 0,
        retry: 0,
    });

    const remoteStatus: SlugStatus = useMemo(() => {
        if (slug.length < 3) return localStatus;
        if (isFetching) return 'checking';
        if (data?.available === false) {
            return data?.reason === 'reserved' ? 'reserved' : 'taken';
        }
        if (data?.available === true) return 'ok';
        return 'checking';
    }, [slug, isFetching, data, localStatus]);

    // ─── گزارش به والد — فقط وقتی تغییر معنایی ───
    useEffect(() => {
        const report = remoteStatus === 'taken' || remoteStatus === 'reserved' ? remoteStatus : null;
        if (lastReported.current !== report) {
            lastReported.current = report;
            onStatus?.(report);
        }
    }, [remoteStatus, onStatus]);

    const handleChange = (raw: string) => {
        // ✅ فقط انگلیسی/عدد/خط‌تیره — بقیهٔ کاراکترها در همان ورودی فیلتر می‌شوند
        const cleaned = raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
        onChange(cleaned);
        if (!touched) setTouched(true);
    };

    const statusUI = (() => {
        switch (remoteStatus) {
            case 'checking':
                return {
                    icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-on-surface-variant/60" />,
                    text: 'بررسی آدرس…',
                    cls: 'text-on-surface-variant/70',
                    border: 'border-outline-variant/40 dark:border-gray-700',
                };
            case 'ok':
                return {
                    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
                    text: 'این آدرس آزاد است ✓',
                    cls: 'text-emerald-600 dark:text-emerald-400 font-bold',
                    border: 'border-emerald-400/70',
                };
            case 'taken':
                return {
                    icon: <AlertTriangle className="w-3.5 h-3.5 text-error" />,
                    text: 'این آدرس توسط شخص دیگری رزرو شده — کمی عوضش کن',
                    cls: 'text-error font-bold',
                    border: 'border-error',
                };
            case 'reserved':
                return {
                    icon: <AlertTriangle className="w-3.5 h-3.5 text-error" />,
                    text: 'این آدرس قابل انتخاب نیست — کمی عوضش کن',
                    cls: 'text-error font-bold',
                    border: 'border-error',
                };
            case 'short':
                return {
                    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
                    text: 'حداقل ۳ حرف انگلیسی',
                    cls: 'text-amber-600 dark:text-amber-400',
                    border: 'border-outline-variant/40 dark:border-gray-700',
                };
            case 'empty':
                return {
                    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
                    text: ' با حروف انگلیسی وارد کن',
                    cls: 'text-amber-600 dark:text-amber-400',
                    border: 'border-outline-variant/40 dark:border-gray-700',
                };
            default:
                return {
                    icon: <Check className="w-3.5 h-3.5 text-on-surface-variant/40" />,
                    text: 'لینک اختصاصی کاتالوگت رو وارد کن',
                    cls: 'text-on-surface-variant/60',
                    border: 'border-outline-variant/40 dark:border-gray-700',
                };
        }
    })();

    return (
        <div className="space-y-1.5" dir="ltr">
            {/* ✅ یکپارچه: پیشوند + اینپوت — چیدمان LTR */}
            <div className={cn(
                'flex items-stretch h-11 rounded overflow-hidden border bg-surface-container-lowest transition-all',
                'focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary',
                statusUI.border,
                disabled && 'opacity-60',
            )}>
                {/* پیشوند ثابت — سمت چپ (LTR) */}
                <span className="flex items-center px-3 bg-surface-container-high dark:bg-gray-800
                    text-[12px] font-bold text-on-surface-variant/70 select-none whitespace-nowrap border-e
                    border-outline-variant/30">
                    daymat.ir/
                </span>
                {/* اینپوت */}
                <input
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={disabled}
                    dir="ltr"
                    inputMode="latin"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="flex-1 min-w-0 px-3 text-[13px] font-bold outline-none bg-transparent text-left"
                    placeholder="catalog-link"
                />
            </div>

            {/* پیام وضعیت — زیر کامپوننت */}
            <p className={cn('text-[10px] flex items-center gap-1.5 px-1', statusUI.cls)}>
                {statusUI.icon}
                {statusUI.text}
            </p>
        </div>
    );
}

/* ─── هلپرها ─── */
function slugify(raw: string): string {
    return (raw ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function useDebounced<T>(value: T, delay: number): T {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}