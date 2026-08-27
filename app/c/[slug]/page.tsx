// app/c/[slug]/page.tsx
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useBusinessBySlug, useBusinessAds } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    Phone, Share2, Building2, BadgeCheck, Package, ArrowRight,
    Search, X, LayoutGrid, List, ChevronLeft, Loader2, Star,
    Sparkles, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════ ثابت‌ها ═══════════ */
const PAGE_SIZE = 24;
const SEARCH_THRESHOLD = 15;

// 👇 فقط اینجا رو عوض کن: 'compact' (فلت و کوتاه) یا 'instagram' (حلقه استوری)
const HEADER_VARIANT: 'compact' | 'instagram' = 'compact';

/* کانتینر — دسکتاپ پهن */
const WRAP = 'max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4';

/* ═══════════ helpers ═══════════ */
function fmt(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

function getUrl(file: any): string {
    if (!file) return '';
    if (file.path?.startsWith('https://') || file.fullUrl?.startsWith('https://')) {
        return file.path || file.fullUrl || '';
    }
    if (file.thumbnailPath?.startsWith('https://')) return file.thumbnailPath;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011'}/file/${file.id}`;
}

function getCategory(ad: any): string | null {
    const c = ad.category?.name || ad.category?.title || ad.categoryTitle || ad.category;
    return typeof c === 'string' && c.trim() ? c.trim() : null;
}

const bizTypeMap: Record<string, string> = {
    producer: 'تولیدی', wholesaler: 'عمده‌فروش', importer: 'واردکننده',
    exporter: 'صادرکننده', distributor: 'توزیع‌کننده', retailer: 'خرده‌فروش',
    contractor: 'پیمانکار', service_provider: 'خدمات', other: 'سایر',
};

const tierText: Record<string, string> = { gold: 'تأیید طلایی', silver: 'تأیید نقره‌ای' };

const tierCheckCls: Record<string, string> = {
    gold: 'text-amber-400', silver: 'text-slate-400', blue: 'text-sky-500',
};

const tierOrbCls: Record<string, string> = {
    gold: 'from-amber-400 to-orange-500',
    silver: 'from-slate-300 to-slate-500',
    blue: 'from-sky-400 to-blue-600',
};

const tierBadgeCls: Record<string, string> = {
    gold: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/70 dark:border-amber-500/30',
    silver: 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-500/30',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-200/70 dark:border-blue-500/30',
};

/* ═══════════ hooks ═══════════ */

function useCountUp(target: number, duration = 900) {
    const [value, setValue] = useState(0);
    const fromRef = useRef(0);

    useEffect(() => {
        const from = fromRef.current;
        if (from === target) return;
        let raf = 0;
        const t0 = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - t0) / duration, 1);
            setValue(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
            if (p < 1) raf = requestAnimationFrame(tick);
            else fromRef.current = target;
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);

    return value;
}

function useDebounced<T>(value: T, delay = 400) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={cn(
                'transition-all duration-500 ease-out will-change-transform',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            )}
        >
            {children}
        </div>
    );
}

/* ═══════════ لوگوها ═══════════ */

/** نمونه اینستاگرام — حلقه گرادیان چرخان */
function LogoRing({ src, name, tier }: { src?: string; name: string; tier?: string }) {
    const verified = !!tier && tier !== 'none';
    return (
        <div className="relative w-[80px] h-[80px] sm:w-[92px] sm:h-[92px] shrink-0">
            <div className="absolute inset-0 rounded-full anim-spin-slow bg-[conic-gradient(from_0deg,#6366f1,#ec4899,#f59e0b,#22d3ee,#6366f1)]" aria-hidden />
            <div className="absolute inset-[3px] rounded-full bg-white dark:bg-gray-950" aria-hidden />
            <div className="absolute inset-[6px] rounded-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                {src ? (
                    <Image src={src} alt={name} fill sizes="96px" className="object-cover" unoptimized />
                ) : (
                    <div className="w-full h-full grid place-items-center">
                        <Building2 className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                    </div>
                )}
            </div>
            {verified && (
                <div className={cn(
                    'absolute -bottom-0.5 -left-0.5 w-7 h-7 rounded-full bg-gradient-to-tr text-white grid place-items-center border-2 border-white dark:border-gray-950 shadow-md',
                    tierOrbCls[tier] || tierOrbCls.blue
                )}>
                    <BadgeCheck className="w-3.5 h-3.5" />
                </div>
            )}
        </div>
    );
}

/** نمونه فلت — مربع ساده با مهر تایید */
function LogoFlat({ src, name, tier }: { src?: string; name: string; tier?: string }) {
    const verified = !!tier && tier !== 'none';
    return (
        <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0">
            <div className="w-full h-full rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-white/10 shadow-sm">
                {src ? (
                    <Image src={src} alt={name} fill sizes="72px" className="object-cover" unoptimized />
                ) : (
                    <div className="w-full h-full grid place-items-center">
                        <Building2 className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                    </div>
                )}
            </div>
            {verified && (
                <div className={cn(
                    'absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-tr text-white grid place-items-center border-2 border-gray-50 dark:border-gray-950 shadow-md',
                    tierOrbCls[tier] || tierOrbCls.blue
                )}>
                    <BadgeCheck className="w-3 h-3" />
                </div>
            )}
        </div>
    );
}

/* ═══════════ آمار ═══════════ */

/** آمار اینستاگرامی — سه ستون با شمارنده */
function Stat({ value, label }: { value: number; label: string }) {
    const n = useCountUp(value);
    return (
        <div className="text-center min-w-12">
            <p className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white tabular-nums">
                {n.toLocaleString('fa-IR')}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-gray-400">{label}</p>
        </div>
    );
}

/* ═══════════ هدر ۱ — فلت و کم‌ارتفاع ═══════════ */

function HeaderCompact({ business, total, activeCount, viewCount, onContact, onShare }: any) {
    const tier = business.verificationTier;
    const verified = tier && tier !== 'none';
    const joinDate = business.createdAt
        ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(new Date(business.createdAt))
        : null;
    const meta = [
        business.type && (bizTypeMap[business.type] || business.type),
        business.city,
        joinDate && `عضو از ${joinDate}`,
    ].filter(Boolean).join('  ·  ');

    return (
        <header className={cn(WRAP, 'pt-16 sm:pt-20 pb-1')}>
            <Reveal>
                <div className="flex items-center gap-4">
                    <LogoFlat src={business.logoUrl} name={business.name} tier={tier} />

                    {/* نام + متادیتا + آمار خطی */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg sm:text-xl font-extrabold leading-tight truncate">{business.name}</h1>
                            {verified && (
                                <span className={cn(
                                    'hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0',
                                    tierBadgeCls[tier] || tierBadgeCls.blue
                                )}>
                                    <BadgeCheck className="w-3 h-3" />
                                    {tierText[tier] || 'تأیید شده'}
                                </span>
                            )}
                        </div>
                        {meta && <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{meta}</p>}
                        <p className="mt-0.5 text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                            {fmt(total)} محصول · {fmt(activeCount)} فعال · {fmt(viewCount)} بازدید
                        </p>
                    </div>

                    {/* دکمه‌ها — دسکتاپ */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <button
                            onClick={onContact}
                            className="h-10 px-6 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-[0.97] transition inline-flex items-center gap-2"
                        >
                            <Phone className="w-4 h-4" />
                            تماس
                        </button>
                        <button
                            onClick={onShare}
                            aria-label="اشتراک‌گذاری"
                            className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-800 grid place-items-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-[0.97] transition"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* دکمه‌ها — موبایل */}
                <div className="sm:hidden mt-3 flex gap-2">
                    <button
                        onClick={onContact}
                        className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-bold active:scale-[0.98] transition-transform inline-flex items-center justify-center gap-2"
                    >
                        <Phone className="w-4 h-4" />
                        تماس
                    </button>
                    <button
                        onClick={onShare}
                        aria-label="اشتراک‌گذاری"
                        className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-800 grid place-items-center text-gray-600 dark:text-gray-300 active:scale-[0.97] transition"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>

                {/* بیو — دو خط حداکثر */}
                {business.shortDescription && (
                    <p className="mt-2.5 text-[13px] leading-6 text-gray-600 dark:text-gray-300 line-clamp-2">
                        {business.shortDescription}
                    </p>
                )}
            </Reveal>
        </header>
    );
}

/* ═══════════ هدر ۲ — اینستاگرامی ═══════════ */

function HeaderInstagram({ business, total, activeCount, viewCount, onContact, onShare }: any) {
    const tier = business.verificationTier;
    const verified = tier && tier !== 'none';
    const joinDate = business.createdAt
        ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(new Date(business.createdAt))
        : null;
    const meta = [
        business.type && (bizTypeMap[business.type] || business.type),
        business.city,
        joinDate && `عضو از ${joinDate}`,
    ].filter(Boolean).join('  ·  ');

    return (
        <header className={cn(WRAP, 'pt-16 sm:pt-20 pb-2')}>
            <Reveal>
                {/* لوگو + آمار */}
                <div className="flex items-center gap-6 sm:gap-10">
                    <LogoRing src={business.logoUrl} name={business.name} tier={tier} />
                    <div className="flex-1 flex items-center justify-around">
                        <Stat value={total} label="محصول" />
                        <Stat value={activeCount} label="فعال" />
                        <Stat value={viewCount} label="بازدید" />
                    </div>
                </div>

                {/* نام + تایید */}
                <div className="mt-3.5 flex items-center gap-1.5">
                    <h1 className="text-lg sm:text-xl font-extrabold leading-snug">{business.name}</h1>
                    {verified && <BadgeCheck className={cn('w-5 h-5 shrink-0', tierCheckCls[tier] || tierCheckCls.blue)} />}
                </div>

                {meta && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{meta}</p>}

                {business.shortDescription && (
                    <p className="mt-2 text-[13px] leading-6 text-gray-600 dark:text-gray-300 whitespace-pre-line line-clamp-2">
                        {business.shortDescription}
                    </p>
                )}

                {/* دکمه‌ها */}
                <div className="mt-3.5 flex gap-2">
                    <button
                        onClick={onContact}
                        className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                        <Phone className="w-4 h-4" />
                        تماس و استعلام قیمت
                    </button>
                    <button
                        onClick={onShare}
                        aria-label="اشتراک‌گذاری"
                        className="w-11 h-11 rounded-xl border border-gray-200 dark:border-gray-800 grid place-items-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 active:scale-[0.98] transition"
                    >
                        <Share2 className="w-[18px] h-[18px]" />
                    </button>
                </div>
            </Reveal>
        </header>
    );
}

/* ═══════════ سوییچ نمایش ═══════════ */

function ViewToggle({ view, onChange }: { view: 'grid' | 'list'; onChange: (v: 'grid' | 'list') => void }) {
    return (
        <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-gray-900" role="group" aria-label="حالت نمایش">
            {([['grid', LayoutGrid], ['list', List]] as const).map(([v, Icon]) => (
                <button
                    key={v}
                    onClick={() => onChange(v)}
                    aria-label={v === 'grid' ? 'نمایش شبکه‌ای' : 'نمایش لیستی'}
                    aria-pressed={view === v}
                    className={cn(
                        'p-1.5 rounded-lg transition-all duration-200',
                        view === v
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    )}
                >
                    <Icon className="w-4 h-4" />
                </button>
            ))}
        </div>
    );
}

/* ═══════════ کارت محصول — گرید ═══════════ */

function ProductCardGrid({ ad, index }: { ad: any; index: number }) {
    const router = useRouter();
    const unit = ad.unit?.shortCode || ad.unit?.name || '';
    const imgUrl = getUrl(ad.files?.[0]) || '/images/no_product_image.jpg';
    const featured = !!ad.isBumped;
    const title = ad.productType || ad.title || 'بدون عنوان';

    return (
        <Reveal delay={(index % 8) * 55}>
            <button
                onClick={() => {
                    const persianSlug = (ad.productType || ad.title || 'ad')
                        .replace(/\s+/g, '-')
                        .replace(/[^\u0600-\u06FF\u0750-\u077F\w\-]/g, '')
                        .substring(0, 60);
                    router.push(`/ad/${ad.id}/${persianSlug}`);
                }}
                className={cn(
                    'group relative w-full text-right rounded-3xl overflow-hidden bg-white dark:bg-gray-900/80 backdrop-blur',
                    'transition-all duration-500 ease-out hover:-translate-y-1.5 active:scale-[0.98]',
                    'hover:shadow-2xl hover:shadow-gray-900/10 dark:hover:shadow-black/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    featured
                        ? 'ring-2 ring-amber-400/80 dark:ring-amber-400/50 shadow-lg shadow-amber-500/10'
                        : 'border border-gray-200/70 dark:border-white/10 hover:border-primary/40'
                )}
            >
                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                        src={imgUrl}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        priority={index < 4}
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-x-0 bottom-0 p-3 flex justify-center translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-gray-900/90 backdrop-blur text-[11px] font-bold text-gray-900 dark:text-white shadow-lg">
                            <Eye className="w-3.5 h-3.5 text-primary" />
                            مشاهده محصول
                        </span>
                    </div>
                    {featured && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-l from-amber-400 to-orange-400 text-white text-[10px] font-extrabold shadow-lg shadow-orange-500/30 overflow-hidden">
                            <Sparkles className="w-3 h-3" />
                            ویژه
                            <span className="absolute inset-y-0 left-0 w-4 bg-white/40 blur-sm anim-shine pointer-events-none" />
                        </span>
                    )}
                </div>

                <div className="p-3 sm:p-3.5">
                    <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 line-clamp-1">{title}</p>
                    <div className="mt-1.5 flex items-baseline justify-between gap-2">
                        <span className="text-sm font-extrabold text-primary tabular-nums">{fmt(ad.unitPrice)}</span>
                        {unit && <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">{unit}</span>}
                    </div>
                </div>
            </button>
        </Reveal>
    );
}

/* ═══════════ کارت محصول — لیست ═══════════ */

function ProductCardList({ ad, index }: { ad: any; index: number }) {
    const router = useRouter();
    const unit = ad.unit?.shortCode || ad.unit?.name || '';
    const imgUrl = getUrl(ad.files?.[0]) || '/images/no_product_image.jpg';
    const featured = !!ad.isBumped;
    const title = ad.productType || ad.title || 'بدون عنوان';

    return (
        <Reveal delay={Math.min(index, 6) * 45}>
            <button
                onClick={() => router.push(`/ad/${ad.id}`)}
                className={cn(
                    'group w-full flex items-center gap-3.5 p-3 rounded-3xl text-right bg-white dark:bg-gray-900/80 backdrop-blur',
                    'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-gray-900/10 dark:hover:shadow-black/40 active:scale-[0.99]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    featured
                        ? 'ring-2 ring-amber-400/80 dark:ring-amber-400/50'
                        : 'border border-gray-200/70 dark:border-white/10 hover:border-primary/40'
                )}
            >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
                    <Image
                        src={imgUrl}
                        alt={title}
                        fill
                        sizes="96px"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        unoptimized
                        loading="lazy"
                    />
                    {featured && (
                        <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-l from-amber-400 to-orange-400 text-white text-[9px] font-extrabold shadow">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            ویژه
                        </span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-1">{title}</p>
                    {getCategory(ad) && (
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/15">
                            {getCategory(ad)}
                        </span>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-base font-extrabold text-primary tabular-nums">
                            {fmt(ad.unitPrice)}
                            {unit && <span className="ms-1 text-[10px] font-medium text-gray-400">{unit}</span>}
                        </span>
                        {ad.viewCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                <Eye className="w-3 h-3" />
                                {fmt(ad.viewCount)}
                            </span>
                        )}
                    </div>
                </div>

                <ChevronLeft className="w-5 h-5 shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-primary group-hover:-translate-x-1 transition-all duration-300" />
            </button>
        </Reveal>
    );
}

/* ═══════════ page ═══════════ */

export default function CatalogPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);
    const [items, setItems] = useState<any[]>([]);

    const debouncedSearch = useDebounced(searchInput.trim(), 400);

    const { data: business, isLoading: businessLoading } = useBusinessBySlug(slug);
    // سرچ سمت بک‌اند (پارامتر چهارم hook)
    const { data: adsData, isLoading: adsLoading, isFetching } = useBusinessAds(
        business?.id || '', page, PAGE_SIZE, debouncedSearch || undefined
    );

    const rawAds: any[] = adsData?.ads ?? [];
    const total: number = adsData?.total ?? adsData?.count ?? 0;
    const showSearch = total > SEARCH_THRESHOLD;
    const hasMore = total > 0 ? items.length < total : rawAds.length >= PAGE_SIZE;

    /* تجمیع صفحات */
    useEffect(() => {
        if (!rawAds.length) {
            if (page === 1) setItems([]);
            return;
        }
        setItems(prev => {
            if (page === 1) return rawAds;
            const seen = new Set(prev.map(a => a.id));
            return [...prev, ...rawAds.filter(a => !seen.has(a.id))];
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adsData]);

    useEffect(() => { setPage(1); }, [debouncedSearch]);

    /* عنوان تب */
    useEffect(() => {
        if (business?.name) document.title = `کاتالوگ ${business.name} | دیمات`;
    }, [business?.name]);

    /* بازیابی حالت نمایش */
    useEffect(() => {
        const v = localStorage.getItem('catalog-view');
        if (v === 'grid' || v === 'list') setView(v);
    }, []);
    const changeView = (v: 'grid' | 'list') => {
        setView(v);
        localStorage.setItem('catalog-view', v);
    };

    /* آمار */
    const activeCount = items.filter(ad => ad.status === 'active').length;
    const viewCount = items.reduce((s, ad) => s + (ad.viewCount || 0), 0);

    /* تماس — شماره ثبت‌نام کاربر */
    const handleContact = useCallback(() => {
        const phone = business?.owner?.phone;
        if (!phone) { toast.error('شماره تماس ثبت نشده است'); return; }
        if (window.innerWidth < 768) {
            window.location.href = `tel:${phone}`;
        } else {
            navigator.clipboard.writeText(phone).catch(() => {});
            toast.success('شماره تماس کپی شد', { description: phone, duration: 6000 });
        }
    }, [business]);

    const handleShare = async () => {
        try {
            const url = window.location.href;
            if (navigator.share) await navigator.share({ title: `کاتالوگ ${business?.name}`, url });
            else { await navigator.clipboard.writeText(url); toast.success('لینک کاتالوگ کپی شد'); }
        } catch {}
    };

    /* ─── بارگذاری ─── */
    if (businessLoading) {
        return (
            <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-7 h-7 text-gray-300 animate-spin" />
            </div>
        );
    }

    if (!business) {
        return (
            <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-950 px-4 text-center">
                <div>
                    <Building2 className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                    <h1 className="text-lg font-extrabold text-gray-900 dark:text-white">کسب‌وکار یافت نشد</h1>
                    <button onClick={() => router.push('/')} className="mt-5 h-10 px-6 rounded-xl bg-primary text-white text-sm font-bold active:scale-95 transition">
                        بازگشت
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 selection:bg-primary/15">

            {/* ═══ دکمه‌های شناور ═══ */}
            <div className="absolute top-4 inset-x-0 z-30">
                <div className={cn(WRAP, 'flex items-center justify-between')}>
                    <button
                        onClick={() => router.back()}
                        aria-label="بازگشت"
                        className="p-2.5 rounded-full bg-white/80 dark:bg-gray-900/70 backdrop-blur border border-gray-200/70 dark:border-white/10 shadow-md hover:scale-105 active:scale-95 transition-transform"
                    >
                        <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </button>
                    <button
                        onClick={handleShare}
                        aria-label="اشتراک‌گذاری"
                        className="p-2.5 rounded-full bg-white/80 dark:bg-gray-900/70 backdrop-blur border border-gray-200/70 dark:border-white/10 shadow-md hover:scale-105 active:scale-95 transition-transform"
                    >
                        <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </button>
                </div>
            </div>

            {/* ═══ هدر (سوییچ بین دو نمونه) ═══ */}
            {HEADER_VARIANT === 'compact' ? (
                <HeaderCompact
                    business={business}
                    total={total}
                    activeCount={activeCount}
                    viewCount={viewCount}
                    onContact={handleContact}
                    onShare={handleShare}
                />
            ) : (
                <HeaderInstagram
                    business={business}
                    total={total}
                    activeCount={activeCount}
                    viewCount={viewCount}
                    onContact={handleContact}
                    onShare={handleShare}
                />
            )}

            {/* ═══ محصولات ═══ */}
            <main className="pb-16">

                {/* سرچ چسبان — فقط بالای ۱۵ محصول */}
                {showSearch && (
                    <div className="sticky top-0 z-30 mt-6 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-md border-y border-gray-100 dark:border-gray-800/70">
                        <div className={cn(WRAP, 'py-3')}>
                            <div className="relative">
                                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder={`جستجو در ${fmt(total)} محصول…`}
                                    className="w-full h-11 pr-10 pl-9 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-white/10 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-gray-400"
                                />
                                {searchInput && (
                                    <button onClick={() => setSearchInput('')} aria-label="پاک کردن"
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <section className={cn(WRAP, showSearch ? 'pt-6' : 'pt-8')}>
                    {/* هدر بخش */}
                    <Reveal>
                        <div className="flex items-end justify-between gap-4 mb-5">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.35em] text-primary/60 mb-1">PRODUCT CATALOG</p>
                                <h2 className="text-lg sm:text-xl font-black">کاتالوگ محصولات</h2>
                            </div>
                            <div className="flex items-center gap-3 pb-0.5">
                                <span className="text-xs font-semibold text-gray-400 tabular-nums whitespace-nowrap">
                                    {fmt(total)} محصول
                                </span>
                                <ViewToggle view={view} onChange={changeView} />
                            </div>
                        </div>
                    </Reveal>

                    {/* محتوا */}
                    <div className={cn('transition-opacity duration-200', isFetching && items.length > 0 && 'opacity-50')}>
                        {adsLoading ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-white/5">
                                        <div className="aspect-square shimmer" />
                                        <div className="p-3 space-y-2">
                                            <div className="h-3 w-3/4 rounded-full shimmer" />
                                            <div className="h-3 w-1/2 rounded-full shimmer" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : items.length === 0 ? (
                            <Reveal>
                                <div className="text-center py-16 px-6 rounded-[2rem] bg-white/70 dark:bg-white/[0.03] border border-dashed border-gray-300 dark:border-gray-700">
                                    <Package className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    {debouncedSearch ? (
                                        <>
                                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">نتیجه‌ای برای «{debouncedSearch}» پیدا نشد</p>
                                            <button onClick={() => setSearchInput('')} className="mt-2 text-xs font-bold text-primary hover:underline">
                                                پاک کردن جستجو
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">هنوز محصولی ثبت نشده است</p>
                                            <p className="mt-1 text-xs text-gray-400">به‌زودی محصولات این کسب‌وکار نمایش داده می‌شود</p>
                                        </>
                                    )}
                                </div>
                            </Reveal>
                        ) : view === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                {items.map((ad, i) => <ProductCardGrid key={ad.id} ad={ad} index={i} />)}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {items.map((ad, i) => <ProductCardList key={ad.id} ad={ad} index={i} />)}
                            </div>
                        )}
                    </div>

                    {/* نمایش بیشتر */}
                    {hasMore && items.length > 0 && (
                        <div className="mt-8 flex flex-col items-center gap-2">
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={isFetching}
                                className="h-11 px-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md active:scale-[0.97] transition inline-flex items-center gap-2 disabled:opacity-50"
                            >
                                {isFetching && <Loader2 className="w-4 h-4 animate-spin" />}
                                نمایش بیشتر
                            </button>
                            <p className="text-[11px] text-gray-400 tabular-nums">
                                نمایش {fmt(items.length)} از {fmt(total)}
                            </p>
                        </div>
                    )}
                </section>
            </main>

            {/* ═══ فوتر — مینیمال ═══ */}
            <footer className="border-t border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-950">
                <div className={cn(WRAP, 'py-8')}>
                    {(business.phone || business.owner?.phone || business.website || business.address || business.province) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                            {(business.phone || business.owner?.phone || business.website) && (
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 mb-1.5">تماس</h3>
                                    <div className="space-y-1">
                                        {business.phone && (
                                            <a href={`tel:${business.phone}`} className="block text-gray-500 dark:text-gray-400 hover:text-primary transition-colors" dir="ltr">
                                                {business.phone}
                                            </a>
                                        )}
                                        {!business.phone && business.owner?.phone && (
                                            <a href={`tel:${business.owner.phone}`} className="block text-gray-500 dark:text-gray-400 hover:text-primary transition-colors" dir="ltr">
                                                {business.owner.phone}
                                            </a>
                                        )}
                                        {business.website && (
                                            <a
                                                href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="block text-gray-500 dark:text-gray-400 hover:text-primary transition-colors truncate" dir="ltr"
                                            >
                                                {business.website}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                            {(business.province || business.city || business.address) && (
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 mb-1.5">آدرس</h3>
                                    <p className="text-gray-500 dark:text-gray-400 leading-6">
                                        {[business.province, business.city].filter(Boolean).join('، ')}
                                        {business.address && (business.province || business.city) ? '، ' : ''}
                                        {business.address}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-8 flex flex-col items-center gap-2.5">
                        <div className="relative h-6 w-24">
                            <Image src="/images/logo2.png" alt="دیمات" fill className="object-contain" unoptimized />
                        </div>
                        <p className="text-[10px] text-gray-300 dark:text-gray-600">
                            © {new Date().toLocaleDateString('fa-IR', { year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes spin-slow { to { transform: rotate(360deg); } }
                .anim-spin-slow { animation: spin-slow 8s linear infinite; }
                @keyframes shine {
                    0% { transform: translateX(-220%) skewX(-18deg); }
                    60%, 100% { transform: translateX(420%) skewX(-18deg); }
                }
                .anim-shine { animation: shine 3.2s ease-in-out infinite; }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .shimmer {
                    background-image: linear-gradient(100deg, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.09) 50%, rgba(0,0,0,0.04) 70%);
                    background-size: 200% 100%;
                    animation: shimmer 1.6s linear infinite;
                }
                :is(.dark) .shimmer {
                    background-image: linear-gradient(100deg, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 70%);
                }
                @media (prefers-reduced-motion: reduce) {
                    *, *::before, *::after {
                        animation-duration: 0.01ms !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </div>
    );
}