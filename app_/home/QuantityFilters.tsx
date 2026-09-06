// app/home/QuantityFilters.tsx
'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { NumberInput } from '@/components/common';
import { buildFilterHref, CategoryNode, FilterUrlChanges } from '@/lib/utils/filterUrl';

const faNum = (v: string | number) => Number(v).toLocaleString('fa-IR');

/** تغییر پارامتر عددی → push به URL */
function useCommitQuantity(param: 'minq' | 'minstock', categoryTree: CategoryNode[]) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    return useCallback((v: number | null) => {
        const changes: FilterUrlChanges = param === 'minq'
            ? { minq: v === null ? null : String(v) }
            : { minstock: v === null ? null : String(v) };
        router.push(buildFilterHref(pathname, searchParams, categoryTree, changes), { scroll: false });
    }, [param, router, pathname, searchParams, categoryTree]);
}

/* ─────────── چیپ حجم/موجودی — unit اختیاری (وقتی از نتایج قابل استنتاج نیست، بدون واحد) ─────────── */
export function QuantityChip({
                                 param, label, unit = '', categoryTree,
                             }: {
    param: 'minq' | 'minstock';
    label: string;
    unit?: string;
    categoryTree: CategoryNode[];
}) {
    const pathname = usePathname(); // ✅ فیکس: مسیر فعلی برای لینک حذف
    const searchParams = useSearchParams();
    const raw = searchParams.get(param) ?? '';
    const active = !!raw;
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<number | undefined>(active ? Number(raw) : undefined);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const popRef = useRef<HTMLDivElement>(null);
    const commit = useCommitQuantity(param, categoryTree);

    useEffect(() => { setValue(active && Number.isFinite(Number(raw)) ? Number(raw) : undefined); }, [raw, active]);

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
            if (r) setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, (window.innerWidth || 400) - 196)) });
        }
        setOpen((o) => !o);
    };

    const apply = (v: number | undefined) => {
        if (v !== undefined && Number.isFinite(Number(v)) && Number(v) > 0) commit(Number(v));
        setOpen(false);
    };

    return (
        <>
            <button ref={btnRef} type="button" onClick={toggle}
                    className={cn(
                        'flex-shrink-0 flex items-center gap-1 h-8 px-3 rounded-full border text-xs font-semibold whitespace-nowrap active:scale-95 transition-all',
                        active
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:border-primary/40 hover:text-primary',
                    )}>
                {active
                    ? (unit ? `${label}: ${faNum(raw)} ${unit}` : `${label}: ${faNum(raw)}`)
                    : `${label}＋`}
            </button>

            {open && pos && createPortal(
                <div ref={popRef} style={{ position: 'fixed', top: pos.top, left: pos.left, width: 188 }}
                     className="z-[80] p-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-outline-variant/30 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-on-surface-variant">
                            {unit ? `${label} (${unit})` : label}
                        </span>
                        {active && (
                            <Link href={buildFilterHref(pathname, searchParams, categoryTree, param === 'minq' ? { minq: null } : { minstock: null })}
                                  scroll={false} onClick={() => setOpen(false)} className="text-[10px] text-error font-semibold">حذف</Link>
                        )}
                    </div>
                    <NumberInput className="w-full h-9 text-center rounded-lg bg-surface-container-high/60"
                                 value={value} onChange={(v: any) => setValue(v ?? undefined)} />
                    <button type="button" onClick={() => apply(value)}
                            className="w-full h-8 mt-2 rounded-lg bg-primary text-on-primary text-xs font-bold active:scale-[0.98] transition-transform">
                        اعمال
                    </button>
                </div>,
                document.body,
            )}
        </>
    );
}