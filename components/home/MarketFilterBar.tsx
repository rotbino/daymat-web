// components/home/MarketFilterBar.tsx
// ✅ فیلتربار توسعه‌پذیر بازار (سبک دیوار) — چیپ برند + بازهٔ قیمت + چک
// همهٔ چیپ‌ها URL-محورند (buildFilterHref) — بازهٔ قیمت/لیست برند از فاست‌های ویترین می‌آیند
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Banknote, Check, ChevronDown, ReceiptText, Search, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberInput } from '@/components/common';
import { Slider } from '@/components/radix/slider';
import { buildFilterHref } from '@/lib/utils/filterUrl';
import type { VitrineFacets } from '@/lib/api/apiTypes';

const faNum = (v: number | string | null | undefined) => {
    if (v === null || v === undefined || v === '') return '—';
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString('fa-IR') : String(v);
};

/** ۵ → «۵ روز» | ۹۰ → «۳ ماه» — مهلت چک */
const formatDays = (d: number) => {
    if (d < 30) return `${faNum(d)} روز`;
    if (d % 30 === 0) return `${faNum(Math.round(d / 30))} ماه`;
    return `${faNum(Math.round(d / 30 * 10) / 10)} ماه`;
};

const CHEQUE_MIN = 5;    // کف بازه: ۵ روز
const CHEQUE_MAX = 300;  // سقف بازه: ۱۰ ماه

/* ─────────── پوستهٔ پاپ‌اور چیپ — دسکتاپ: لنگر زیر دکمه | موبایل: باتم‌شیت ─────────── */
function ChipPop({
    open, onClose, btnRef, width = 300, title, children,
}: {
    open: boolean;
    onClose: () => void;
    btnRef: React.RefObject<HTMLButtonElement | null>;
    width?: number;
    title: string;
    children: React.ReactNode;
}) {
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const [mobile, setMobile] = useState(false);
    const popRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const isMobile = window.innerWidth < 1024;
        setMobile(isMobile);
        if (!isMobile) {
            const r = btnRef.current?.getBoundingClientRect();
            if (r) setPos({ top: r.bottom + 6, left: Math.min(Math.max(8, r.left), (window.innerWidth || 400) - width - 8) });
        }
        const h = (e: MouseEvent) => {
            if (btnRef.current?.contains(e.target as Node) || popRef.current?.contains(e.target as Node)) return;
            onClose();
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', h);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', h);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, btnRef, width, onClose]);

    if (!open) return null;

    const shell = mobile
        ? 'fixed inset-x-0 bottom-0 z-[90] rounded-t-2xl p-4 pb-6 max-h-[75vh] overflow-y-auto scrollbar-slim'
        : 'z-[80] p-3.5 rounded-2xl shadow-xl';

    return createPortal(
        <>
            {mobile && (
                <div className="fixed inset-0 z-[85] bg-black/40 animate-in fade-in duration-150" onClick={onClose} />
            )}
            <div
                ref={popRef}
                style={mobile ? undefined : { position: 'fixed', top: pos?.top ?? 0, left: pos?.left ?? 0, width }}
                className={cn(shell,
                    !mobile && 'bg-white dark:bg-gray-900 border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-150',
                    mobile && 'bg-white dark:bg-gray-900 animate-in slide-in-from-bottom duration-200')}
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-on-surface">{title}</span>
                    <button type="button" onClick={onClose} aria-label="بستن"
                            className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {children}
            </div>
        </>,
        document.body,
    );
}

/* قلاب مشترک: خواندن/نوشتن پارامترهای URL */
function useFilterNav() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const commit = (changes: Parameters<typeof buildFilterHref>[3]) => {
        router.push(buildFilterHref(pathname, searchParams, [], changes), { scroll: false });
    };
    return { searchParams, commit };
}

/* ─────────── ۱) چیپ برند — چندانتخابی با کانت (فاست) ─────────── */
export function MarketBrandFilter({ facets }: { facets?: VitrineFacets }) {
    const { searchParams, commit } = useFilterNav();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const btnRef = useRef<HTMLButtonElement>(null);

    const brands = facets?.brands ?? [];
    const raw = searchParams.get('brand') ?? '';
    const selectedIds = useMemo(() => raw.split(',').map((s) => s.trim()).filter(Boolean), [raw]);
    const active = selectedIds.length > 0;

    const titleOf = (id: string) => brands.find((b) => b.id === id)?.title ?? '';
    const selectedTitles = selectedIds.map(titleOf).filter(Boolean);
    const chipLabel = active
        ? (selectedTitles.length === 1
            ? selectedTitles[0]
            : `${selectedTitles.length} برند`)
        : 'برند';

    const filtered = q.trim()
        ? brands.filter((b) => b.title.includes(q.trim()))
        : brands;

    const toggle = (id: string) => {
        const next = selectedIds.includes(id)
            ? selectedIds.filter((x) => x !== id)
            : [...selectedIds, id];
        commit({ brand: next.length ? next.join(',') : null });
    };

    return (
        <>
            <button ref={btnRef} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
                    className={cn(
                        'flex-shrink-0 flex items-center gap-1 h-8 ps-3 pe-2 rounded-full border text-xs font-semibold whitespace-nowrap active:scale-95 transition-all',
                        active
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:border-primary/40 hover:text-primary',
                    )}>
                <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                {chipLabel}
                {active ? (
                    <span role="button" tabIndex={0} aria-label="حذف فیلتر برند"
                          onClick={(e) => { e.stopPropagation(); commit({ brand: null }); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); commit({ brand: null }); } }}
                          className="p-0.5 rounded-full hover:bg-primary/15 transition-colors">
                        <X className="w-3 h-3" />
                    </span>
                ) : (
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
                )}
            </button>

            <ChipPop open={open} onClose={() => { setOpen(false); setQ(''); }} btnRef={btnRef} width={290} title="برند">
                {brands.length === 0 ? (
                    <p className="text-[11px] text-on-surface-variant/70 py-4 text-center">برندی برای این بازه ثبت نشده است</p>
                ) : (
                    <>
                        <div className="relative mb-2">
                            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/50" />
                            <input
                                type="text" value={q} onChange={(e) => setQ(e.target.value)}
                                placeholder="جستجوی برند..."
                                className="w-full h-9 ps-8 pe-2 rounded-lg bg-surface-container-high/60 text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-on-surface-variant/40"
                            />
                        </div>
                        <div className="max-h-56 overflow-y-auto scrollbar-slim space-y-0.5">
                            {filtered.map((b) => {
                                const isSel = selectedIds.includes(b.id);
                                return (
                                    <button key={b.id} type="button" onClick={() => toggle(b.id)}
                                            className={cn(
                                                'w-full flex items-center gap-2 h-9 px-2 rounded-lg transition-colors text-right',
                                                isSel ? 'bg-primary/[0.07]' : 'hover:bg-surface-container-high/70',
                                            )}>
                                        <span className={cn(
                                            'w-4 h-4 rounded border grid place-items-center flex-shrink-0 transition-colors',
                                            isSel ? 'bg-primary border-primary' : 'border-outline-variant/60',
                                        )}>
                                            {isSel && <Check className="w-3 h-3 text-on-primary" strokeWidth={3} />}
                                        </span>
                                        <span className={cn('flex-1 min-w-0 truncate text-xs', isSel ? 'font-bold text-primary' : 'text-on-surface')}>
                                            {b.title}
                                        </span>
                                        <span className="text-[10px] tabular-nums text-on-surface-variant/60 flex-shrink-0">
                                            {faNum(b.count)}
                                        </span>
                                    </button>
                                );
                            })}
                            {filtered.length === 0 && (
                                <p className="text-[11px] text-on-surface-variant/60 py-3 text-center">برندی با این نام پیدا نشد</p>
                            )}
                        </div>
                        {active && (
                            <button type="button" onClick={() => commit({ brand: null })}
                                    className="w-full h-9 mt-2 rounded-lg text-xs font-bold text-error hover:bg-error/10 transition-colors">
                                حذف فیلتر برند
                            </button>
                        )}
                    </>
                )}
            </ChipPop>
        </>
    );
}

/* ─────────── ۲) چیپ بازهٔ قیمت — اسلایدر دولولا از فاست (رفتار دیوار/دیجی‌کالا) ─────────── */
export function MarketPriceFilter({ facets }: { facets?: VitrineFacets }) {
    const { searchParams, commit } = useFilterNav();
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);

    const boundMin = facets?.priceMin ?? null;
    const boundMax = facets?.priceMax ?? null;
    const hasBounds = boundMin !== null && boundMax !== null && boundMax > boundMin;

    const minp = useMemo(() => {
        const v = Number(searchParams.get('minp'));
        return Number.isFinite(v) && v > 0 ? v : null;
    }, [searchParams]);
    const maxp = useMemo(() => {
        const v = Number(searchParams.get('maxp'));
        return Number.isFinite(v) && v > 0 ? v : null;
    }, [searchParams]);
    const active = minp !== null || maxp !== null;

    // مقدار محلی اسلایدر/اینپوت‌ها — با اعمال، به URL می‌رود
    const [lmin, setLmin] = useState<number>(minp ?? boundMin ?? 0);
    const [lmax, setLmax] = useState<number>(maxp ?? boundMax ?? 0);
    useEffect(() => {
        if (open) {
            setLmin(minp ?? boundMin ?? 0);
            setLmax(maxp ?? boundMax ?? 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, minp, maxp, boundMin, boundMax]);

    const chipLabel = active
        ? (minp !== null && maxp !== null
            ? `${faNum(minp)} تا ${faNum(maxp)}`
            : minp !== null ? `از ${faNum(minp)}` : `تا ${faNum(maxp)}`)
        : 'قیمت';

    const sliderStep = hasBounds ? Math.max(1, Math.round((boundMax! - boundMin!) / 400)) : 1;

    const apply = () => {
        // مقادیر روی مرز بازه = بدون محدودیت
        const effMin = hasBounds && lmin <= boundMin! ? null : (lmin > 0 ? Math.round(lmin) : null);
        const effMax = hasBounds && lmax >= boundMax! ? null : (lmax > 0 ? Math.round(lmax) : null);
        commit({
            minp: effMin !== null ? String(effMin) : null,
            maxp: effMax !== null ? String(effMax) : null,
        });
        setOpen(false);
    };

    return (
        <>
            <button ref={btnRef} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
                    className={cn(
                        'flex-shrink-0 flex items-center gap-1 h-8 ps-3 pe-2 rounded-full border text-xs font-semibold whitespace-nowrap active:scale-95 transition-all',
                        active
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:border-primary/40 hover:text-primary',
                    )}>
                <Banknote className="w-3.5 h-3.5 flex-shrink-0" />
                {chipLabel}
                {active ? (
                    <span role="button" tabIndex={0} aria-label="حذف فیلتر قیمت"
                          onClick={(e) => { e.stopPropagation(); commit({ minp: null, maxp: null }); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); commit({ minp: null, maxp: null }); } }}
                          className="p-0.5 rounded-full hover:bg-primary/15 transition-colors">
                        <X className="w-3 h-3" />
                    </span>
                ) : (
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
                )}
            </button>

            <ChipPop open={open} onClose={() => setOpen(false)} btnRef={btnRef} width={320} title="بازهٔ قیمت (قیمت تکی)">
                {hasBounds ? (
                    <>
                        <div className="px-1.5 pt-1 pb-4">
                            <Slider
                                min={boundMin!} max={boundMax!} step={sliderStep}
                                value={[Math.min(lmin, boundMax!), Math.min(Math.max(lmax, lmin), boundMax!)]}
                                onValueChange={(v) => { setLmin(v[0]); setLmax(v[1] ?? v[0]); }}
                            />
                            <div className="flex items-center justify-between mt-2 text-[10px] text-on-surface-variant/70 tabular-nums">
                                <span>{faNum(boundMin!)}</span>
                                <span>{faNum(boundMax!)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] text-on-surface-variant">از</label>
                                <NumberInput className="w-full h-9 text-center rounded-lg bg-surface-container-high/60"
                                             value={lmin || undefined} onChange={(v: any) => setLmin(Number(v) || 0)} />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] text-on-surface-variant">تا</label>
                                <NumberInput className="w-full h-9 text-center rounded-lg bg-surface-container-high/60"
                                             value={lmax || undefined} onChange={(v: any) => setLmax(Number(v) || 0)} />
                            </div>
                        </div>
                        <p className="text-[9px] text-on-surface-variant/50 mt-1.5">فیلتر قیمت روی قیمت تکی (مصرف‌کننده) اعمال می‌شود، نه قیمت کارتن.</p>
                    </>
                ) : (
                    <p className="text-[11px] text-on-surface-variant/70 py-2 text-center">بازهٔ قیمت بعد از ثبت کالا در دسترس است</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                    <button type="button" onClick={apply}
                            className="flex-1 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold active:scale-[0.98] transition-transform">
                        اعمال
                    </button>
                    {active && (
                        <button type="button" onClick={() => { commit({ minp: null, maxp: null }); setOpen(false); }}
                                className="flex-1 h-9 rounded-lg text-xs font-bold text-error hover:bg-error/10 transition-colors">
                            حذف
                        </button>
                    )}
                </div>
            </ChipPop>
        </>
    );
}

/* ─────────── ۳) چیپ چک — تیک «فقط چکی» + بازهٔ مهلت ۵ روز تا ۱۰ ماه ─────────── */
export function MarketChequeFilter() {
    const { searchParams, commit } = useFilterNav();
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);

    const chk = searchParams.get('chk') === '1';
    const chkmin = useMemo(() => {
        const v = Number(searchParams.get('chkmin'));
        return Number.isFinite(v) && v > 0 ? v : null;
    }, [searchParams]);
    const chkmax = useMemo(() => {
        const v = Number(searchParams.get('chkmax'));
        return Number.isFinite(v) && v > 0 ? v : null;
    }, [searchParams]);
    const active = chk;

    const [ticked, setTicked] = useState(chk);
    const [lmin, setLmin] = useState(chkmin ?? CHEQUE_MIN);
    const [lmax, setLmax] = useState(chkmax ?? CHEQUE_MAX);
    useEffect(() => {
        if (open) {
            setTicked(chk);
            setLmin(chkmin ?? CHEQUE_MIN);
            setLmax(chkmax ?? CHEQUE_MAX);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, chk, chkmin, chkmax]);

    const chipLabel = active
        ? (chkmin !== null || chkmax !== null
            ? `چک: ${formatDays(chkmin ?? CHEQUE_MIN)} تا ${formatDays(chkmax ?? CHEQUE_MAX)}`
            : 'چکی')
        : 'چک';

    const apply = () => {
        if (!ticked) {
            commit({ chk: null, chkmin: null, chkmax: null });
        } else {
            commit({
                chk: '1',
                chkmin: lmin > CHEQUE_MIN ? String(Math.round(lmin)) : null,
                chkmax: lmax < CHEQUE_MAX ? String(Math.round(lmax)) : null,
            });
        }
        setOpen(false);
    };

    return (
        <>
            <button ref={btnRef} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
                    className={cn(
                        'flex-shrink-0 flex items-center gap-1 h-8 ps-3 pe-2 rounded-full border text-xs font-semibold whitespace-nowrap active:scale-95 transition-all',
                        active
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant hover:border-primary/40 hover:text-primary',
                    )}>
                <ReceiptText className="w-3.5 h-3.5 flex-shrink-0" />
                {chipLabel}
                {active ? (
                    <span role="button" tabIndex={0} aria-label="حذف فیلتر چک"
                          onClick={(e) => { e.stopPropagation(); commit({ chk: null, chkmin: null, chkmax: null }); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); commit({ chk: null, chkmin: null, chkmax: null }); } }}
                          className="p-0.5 rounded-full hover:bg-primary/15 transition-colors">
                        <X className="w-3 h-3" />
                    </span>
                ) : (
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
                )}
            </button>

            <ChipPop open={open} onClose={() => setOpen(false)} btnRef={btnRef} width={320} title="فروش چکی">
                <button type="button" onClick={() => setTicked((t) => !t)}
                        className="w-full flex items-center gap-2.5 h-10 px-2 rounded-lg hover:bg-surface-container-high/70 transition-colors">
                    <span className={cn(
                        'w-4 h-4 rounded border grid place-items-center flex-shrink-0 transition-colors',
                        ticked ? 'bg-primary border-primary' : 'border-outline-variant/60',
                    )}>
                        {ticked && <Check className="w-3 h-3 text-on-primary" strokeWidth={3} />}
                    </span>
                    <span className={cn('text-xs', ticked ? 'font-bold text-primary' : 'text-on-surface')}>
                        فقط آگهی‌های چکی
                    </span>
                </button>

                <div className={cn('px-1.5 pt-2 pb-4 transition-opacity', !ticked && 'opacity-40 pointer-events-none')}>
                    <Slider
                        min={CHEQUE_MIN} max={CHEQUE_MAX} step={1}
                        value={[Math.min(lmin, lmax), Math.max(lmax, lmin)]}
                        onValueChange={(v) => { setLmin(v[0]); setLmax(v[1] ?? v[0]); setTicked(true); }}
                    />
                    <div className="flex items-center justify-between mt-2 text-[10px] text-on-surface-variant/70 tabular-nums">
                        <span>{formatDays(lmin)}</span>
                        <span>{formatDays(lmax)}</span>
                    </div>
                    <p className="text-[9px] text-on-surface-variant/50 mt-1.5 text-center">
                        آگهی‌هایی که مهلت چک‌شان با این بازه هم‌پوشانی دارد
                    </p>
                </div>

                <div className="flex items-center gap-2 mt-1">
                    <button type="button" onClick={apply}
                            className="flex-1 h-9 rounded-lg bg-primary text-on-primary text-xs font-bold active:scale-[0.98] transition-transform">
                        اعمال
                    </button>
                    {active && (
                        <button type="button" onClick={() => { commit({ chk: null, chkmin: null, chkmax: null }); setOpen(false); }}
                                className="flex-1 h-9 rounded-lg text-xs font-bold text-error hover:bg-error/10 transition-colors">
                            حذف
                        </button>
                    )}
                </div>
            </ChipPop>
        </>
    );
}

/* ─────────── ردیف چیپ‌های فیلتر بازار — در تولبار دسکتاپ و نوار موبایل ─────────── */
export function MarketFilterChips({ facets }: { facets?: VitrineFacets }) {
    return (
        <>
            <MarketBrandFilter facets={facets} />
            <MarketPriceFilter facets={facets} />
            <MarketChequeFilter />
        </>
    );
}
