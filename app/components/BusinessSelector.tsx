// app/components/BusinessSelector.tsx
'use client';

/**
 * BusinessSelector — سلکتور مستقل کسب‌وکار (دیمت)
 *
 * شکلی مثل دراپ‌داون دارد؛ کلیک روی آن یک مودال بزرگ/تمام‌صفحه باز می‌کند با
 * جستجوی سبک نوار فیلتر دیوار (جستجوی نام + چیپ استان/شهر) + دسترسی سریع
 * «کسب‌وکارهای من» + ثبت کسب‌وکار جدید (با گارد تکراری‌ثبتی BusinessSetupModal).
 *
 * مستقل است تا بعدها در فرم‌های دیگر هم استفاده شود.
 */

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import {
    Building2, ChevronDown, X, Search, Plus, Loader2, BadgeCheck, Check, MapPin, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBusinessSearch, useMyBusinesses, useLocationsTree } from '@/lib/api/apiHooks';
import BusinessSetupModal from '@/app/components/BusinessSetupModal';

interface Props {
    value: any | null;                    // کسب‌وکار انتخاب‌شده
    onChange: (biz: any | null) => void;  // انتخاب / پاک کردن
    error?: string;
    disabled?: boolean;
}

function shortName(n: string, max = 20) {
    return (n || '').length > max ? n.slice(0, max) + '…' : n;
}

export default function BusinessSelector({ value, onChange, error, disabled }: Props) {
    const [open, setOpen] = useState(false);

    const pick = (b: any) => { onChange(b); setOpen(false); };
    const clear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    return (
        <div className="space-y-1.5">
            <p className="text-[12px] font-bold text-on-surface">ثبت یا انتخاب کسب و کار</p>

            {value ? (
                /* ── انتخاب‌شده — شکلیِ سلکت با لوگو و نام ── */
                <button type="button" disabled={disabled} onClick={() => setOpen(true)}
                        className={cn(
                            'w-full rounded-xl border px-3 py-2.5 flex items-center gap-2.5 text-right transition-all',
                            'border-primary/40 bg-primary/5 hover:bg-primary/10',
                            disabled && 'opacity-50 cursor-not-allowed',
                        )}>
                    <span className="w-10 h-10 rounded-lg overflow-hidden bg-primary/10 grid place-items-center flex-shrink-0">
                        {value.logoUrl
                            ? <Image src={value.logoUrl} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                            : <Building2 className="w-4.5 h-4.5 text-primary/70" />}
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-on-surface truncate">{value.name}</span>
                        <span className="block text-[10px] text-on-surface-variant/70 truncate">
                            {[value.industryName, value.city, value.province].filter(Boolean).join(' · ')}
                        </span>
                    </span>
                    <span role="button" aria-label="حذف انتخاب" onClick={clear}
                          className="w-7 h-7 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-error hover:bg-error/10 transition-colors flex-shrink-0">
                        <X className="w-4 h-4" />
                    </span>
                    <ChevronDown className="w-4 h-4 text-primary/60 flex-shrink-0" />
                </button>
            ) : (
                /* ── خالی — دراپ‌داونِ خالی ── */
                <button type="button" disabled={disabled} onClick={() => setOpen(true)}
                        className={cn(
                            'w-full h-12 px-3.5 rounded-xl border flex items-center justify-between transition-all',
                            'bg-surface-container-lowest border-outline-variant/40 dark:border-gray-700',
                            'hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none',
                            error && 'border-error',
                            disabled && 'opacity-50 cursor-not-allowed',
                        )}>
                    <span className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <Building2 className="w-4.5 h-4.5 text-on-surface-variant/50" />
                        کسب‌وکارت را جستجو و انتخاب کن
                    </span>
                    <ChevronDown className="w-4 h-4 text-on-surface-variant/50" />
                </button>
            )}

            {error && (
                <p className="text-[11px] text-error flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> {error}
                </p>
            )}

            {open && <BusinessPickerModal onPick={pick} onClose={() => setOpen(false)} />}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   مودال بزرگ انتخاب/ثبت — جستجوی سبک نوار فیلتر دیوار
   z-index: 90 (زیر BusinessSetupModal با 95)
   ═══════════════════════════════════════════════════════════ */
function BusinessPickerModal({ onPick, onClose }: { onPick: (b: any) => void; onClose: () => void }) {
    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [provinceCode, setProvinceCode] = useState('');
    const [provinceLabel, setProvinceLabel] = useState('');
    const [cityCode, setCityCode] = useState('');
    const [cityLabel, setCityLabel] = useState('');
    const [locModal, setLocModal] = useState<'province' | 'city' | null>(null);
    const [setupOpen, setSetupOpen] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
        return () => clearTimeout(t);
    }, [q]);

    // قفل اسکرول بدنه هنگام باز بودن مودال
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const searchQ = useBusinessSearch(useMemo(() => ({
        q: debouncedQ || undefined,
        provinceCode: provinceCode || undefined,
        cityCode: cityCode || undefined,
        limit: 20,
    }), [debouncedQ, provinceCode, cityCode]), true);
    const items: any[] = searchQ.data?.items ?? [];

    const myBizQ = useMyBusinesses(true);
    const myItems: any[] = myBizQ.data?.items ?? [];

    const clearLocation = () => {
        setProvinceCode(''); setProvinceLabel(''); setCityCode(''); setCityLabel('');
    };
    const hasFilter = !!(provinceCode || cityCode);
    const searched = !!debouncedQ || hasFilter;

    return createPortal(
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
             onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-surface w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[86dvh] rounded-t-3xl sm:rounded-2xl shadow-2xl
                     flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <h3 className="text-sm font-extrabold text-on-surface">ثبت یا انتخاب کسب و کار</h3>
                    <button onClick={onClose} aria-label="بستن"
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* نوار جستجو به سبک دیوار — جستجوی نام + چیپ استان/شهر */}
                <div className="flex-shrink-0 px-4 pt-3 pb-2.5 border-b border-outline-variant/20 space-y-2.5">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                        <input type="text" value={q} autoFocus
                               onChange={(e) => setQ(e.target.value)}
                               placeholder="جستجو با نام کسب‌وکار…"
                               className="w-full h-11 pr-9 pl-9 text-sm text-right rounded-xl bg-surface-container-lowest border
                                   border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-primary/20
                                   focus:border-primary outline-none transition-all" />
                        {searchQ.isFetching
                            ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                            : q && (
                                <button type="button" onClick={() => setQ('')}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full grid place-items-center text-on-surface-variant/50 hover:text-error hover:bg-error/5">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-slim pb-0.5">
                        <FilterChip icon={<MapPin className="w-3.5 h-3.5" />} label="استان"
                                    selectedValue={provinceLabel} active={!!provinceCode}
                                    onClick={() => setLocModal('province')}
                                    onClear={() => clearLocation()} />
                        <FilterChip icon={<MapPin className="w-3.5 h-3.5" />} label="شهر"
                                    selectedValue={cityLabel} active={!!cityCode}
                                    disabled={!provinceCode}
                                    onClick={() => setLocModal('city')}
                                    onClear={() => { setCityCode(''); setCityLabel(''); }} />
                        {hasFilter && (
                            <button type="button" onClick={clearLocation}
                                    className="flex-shrink-0 text-[11px] font-bold text-error/70 hover:text-error transition-colors px-2 h-9 flex items-center gap-1">
                                <X className="w-3 h-3" /> حذف همه
                            </button>
                        )}
                    </div>
                </div>

                {/* نتایج */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-3">
                    {/* دسترسی سریع — وقتی جستجویی در جریان نیست */}
                    {myItems.length > 0 && !searched && (
                        <div className="mb-3.5 space-y-1.5">
                            <p className="text-[10px] font-bold text-on-surface-variant/70">کسب‌وکارهای من</p>
                            <div className="flex gap-1.5 overflow-x-auto scrollbar-slim pb-1">
                                {myItems.map((b) => (
                                    <button key={b.id} type="button" onClick={() => onPick(b)}
                                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-outline-variant/40 dark:border-gray-700
                                                bg-surface-container-lowest/60 hover:border-primary/40 hover:bg-primary/5 transition-colors flex-shrink-0">
                                        <span className="w-6 h-6 rounded-md overflow-hidden bg-primary/10 grid place-items-center flex-shrink-0">
                                            {b.logoUrl
                                                ? <Image src={b.logoUrl} alt="" width={24} height={24} className="w-full h-full object-cover" unoptimized />
                                                : <Building2 className="w-3 h-3 text-primary/70" />}
                                        </span>
                                        <span className="text-[11px] font-bold text-on-surface whitespace-nowrap">{shortName(b.name, 18)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        {items.map((b) => (
                            <button key={b.id} type="button" onClick={() => onPick(b)}
                                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-outline-variant/30 dark:border-gray-700
                                        bg-surface-container-lowest/60 hover:border-primary/40 hover:bg-primary/5 transition-colors text-right">
                                <span className="w-10 h-10 rounded-lg overflow-hidden bg-primary/10 dark:bg-primary/15 grid place-items-center flex-shrink-0">
                                    {b.logoUrl
                                        ? <Image src={b.logoUrl} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                                        : <Building2 className="w-4.5 h-4.5 text-primary/70" />}
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="flex items-center gap-1">
                                        <span className="text-xs font-bold text-on-surface truncate">{b.name}</span>
                                        {!!b.verificationTier && b.verificationTier !== 'none' && (
                                            <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                        )}
                                    </span>
                                    <span className="block text-[9.5px] text-on-surface-variant/60 truncate">
                                        {[b.industryName, b.city].filter(Boolean).join(' · ')}
                                        {b._count?.catalogs ? ` · ${b._count.catalogs} کاتالوگ` : ''}
                                    </span>
                                </span>
                                <span className="text-[10px] font-bold text-primary flex-shrink-0">انتخاب</span>
                            </button>
                        ))}
                    </div>

                    {/* حالت خالی */}
                    {searched && !searchQ.isFetching && items.length === 0 && (
                        <div className="py-6 text-center space-y-1">
                            <Building2 className="w-8 h-8 text-on-surface-variant/20 mx-auto" />
                            <p className="text-xs text-on-surface-variant/70">کسب‌وکاری با این مشخصات پیدا نشد</p>
                            <p className="text-[10px] text-on-surface-variant/50">اگر مطمئنی تکراری نیست، پایین صفحه ثبتش کن</p>
                        </div>
                    )}
                </div>

                {/* فوتر — ثبت کسب‌وکار جدید */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20">
                    <button type="button" onClick={() => setSetupOpen(true)}
                            className="w-full rounded-xl border border-dashed border-primary/40 bg-primary/5
                                p-3 flex items-center gap-2.5 text-right hover:bg-primary/10 transition-colors">
                        <span className="w-9 h-9 rounded-lg bg-primary/10 grid place-items-center flex-shrink-0">
                            <Plus className="w-4.5 h-4.5 text-primary" />
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="block text-xs font-bold text-on-surface">ثبت کسب‌وکار جدید</span>
                            <span className="block text-[9.5px] text-on-surface-variant/60 mt-0.5">
                                اگر در جستجو پیدا نشد ثبتش کن — شاید همکارانت قبلاً ثبت کرده باشند
                            </span>
                        </span>
                        <Users className="w-4 h-4 text-primary/50 flex-shrink-0" />
                    </button>
                </div>
            </div>

            {/* مودال استان/شهر — پورتال مستقل با z بالاتر */}
            {locModal === 'province' && (
                <LocationPickModal level="province" selectedCode={provinceCode}
                    onSelect={(code, label) => {
                        if (!code) clearLocation();
                        else { setProvinceCode(code); setProvinceLabel(label); setCityCode(''); setCityLabel(''); }
                        setLocModal(null);
                    }}
                    onClose={() => setLocModal(null)} />
            )}
            {locModal === 'city' && (
                <LocationPickModal level="city" provinceCode={provinceCode} selectedCode={cityCode}
                    onSelect={(code, label) => {
                        if (!code) { setCityCode(''); setCityLabel(''); }
                        else { setCityCode(code); setCityLabel(label); }
                        setLocModal(null);
                    }}
                    onClose={() => setLocModal(null)} />
            )}

            {/* ثبت کسب‌وکار جدید — z=95 بالاتر از 90 */}
            <BusinessSetupModal
                isOpen={setupOpen}
                business={null}
                onClose={() => setSetupOpen(false)}
                onSaved={(biz: any) => {
                    // ✅ کسب‌وکار تازه‌ثبت‌شده (یا انتخاب‌شده از مشابه‌ها) بلافاصله انتخاب می‌شود
                    if (biz?.id) onPick(biz);
                    searchQ.refetch();
                    myBizQ.refetch();
                }}
            />
        </div>,
        document.body,
    );
}

/* ═══════════════════════════════════════════════════════════
   چیپ فیلتر — سبک دیوار (همان الگوی DivarFilterBar)
   ═══════════════════════════════════════════════════════════ */
function FilterChip({ icon, label, selectedValue, active, disabled, onClick, onClear }: {
    icon: React.ReactNode;
    label: string;
    selectedValue?: string;
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
    onClear: () => void;
}) {
    return (
        <div className={cn(
            'flex-shrink-0 flex items-center h-9 rounded-full border transition-all',
            active
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant',
            disabled && 'opacity-40 pointer-events-none',
        )}>
            <button type="button" onClick={onClick}
                    className="flex items-center gap-1.5 h-full px-3 text-xs font-bold">
                {icon}
                <span className="truncate max-w-[100px]">{selectedValue || label}</span>
                {!active && <ChevronDown className="w-3 h-3 opacity-50" />}
            </button>
            {active && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }}
                        className="h-full pl-2 pr-1 flex items-center hover:bg-primary/10 rounded-l-full transition-colors">
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   مودال انتخاب استان/شهر — از درخت موقعیت‌ها (الگوی تست‌شده)
   z-index: 92 — بالای مودال اصلی (90)، زیر BusinessSetupModal (95)
   ═══════════════════════════════════════════════════════════ */
function LocationPickModal({ level, provinceCode, selectedCode, onSelect, onClose }: {
    level: 'province' | 'city';
    provinceCode?: string;
    selectedCode: string;
    onSelect: (code: string, label: string) => void;
    onClose: () => void;
}) {
    const { data: tree, isLoading } = useLocationsTree();
    const [search, setSearch] = useState('');

    const options = useMemo(() => {
        if (!tree) return [] as { value: string; label: string }[];
        const iran = (tree as any[]).find((n: any) => n.type === 'country' && n.title === 'ایران');
        if (!iran?.children) return [] as { value: string; label: string }[];
        if (level === 'province') {
            return iran.children
                .filter((n: any) => n.type === 'province')
                .map((n: any) => ({ value: n.provinceCode || n.id, label: n.title }));
        }
        const province = iran.children.find(
            (n: any) => n.type === 'province' && (n.provinceCode || n.id) === provinceCode);
        if (!province?.children) return [] as { value: string; label: string }[];
        return province.children
            .filter((n: any) => n.type === 'city')
            .map((n: any) => ({ value: n.cityCode || n.id, label: n.title }));
    }, [tree, level, provinceCode]);

    const filtered = options.filter((o) => !search || o.label.includes(search.trim()));

    return createPortal(
        <div className="fixed inset-0 z-[92] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
             onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                     min-h-[50dvh] max-h-[80dvh] flex flex-col overflow-hidden
                     animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <h3 className="text-sm font-extrabold text-on-surface">{level === 'province' ? 'انتخاب استان' : 'انتخاب شهر'}</h3>
                    <button onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-shrink-0 p-3 border-b border-outline-variant/20">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                               placeholder={level === 'province' ? 'جستجوی استان...' : 'جستجوی شهر...'}
                               className="w-full h-10 pr-9 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                    </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    {isLoading ? (
                        <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-6 text-center text-xs text-on-surface-variant">
                            {level === 'province' ? 'استانی پیدا نشد' : 'شهری پیدا نشد'}
                        </div>
                    ) : filtered.map((o) => (
                        <button key={o.value} onClick={() => onSelect(o.value, o.label)}
                                className={cn(
                                    'w-full flex items-center justify-between px-4 py-3 text-right transition-colors',
                                    selectedCode === o.value ? 'bg-primary/10' : 'hover:bg-surface-container-low',
                                )}>
                            <span className="text-sm font-medium text-on-surface">{o.label}</span>
                            {selectedCode === o.value && <Check className="w-4 h-4 text-primary" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>,
        document.body,
    );
}
