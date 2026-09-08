// app/components/DivarFilterBar.tsx
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Building2, X, Search, Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocationsTree } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';

export interface FilterValue {
    provinceCode?: string;
    provinceTitle?: string;
    cityCode?: string;
    cityTitle?: string;
    industry?: string;
    industryId?: string;
}

interface Props {
    value: FilterValue;
    onChange: (v: FilterValue) => void;
}

type ModalType = 'province' | 'city' | 'industry' | null;

/**
 * DivarFilterBar — نوار فیلتر به سبک دیوار
 *
 * ┌──────────────────────────────────────┐
 * │ [استان: همدان ×] [شهر] [صنف ×]      │
 * └──────────────────────────────────────┘
 *
 * - هر چیپ وقتی انتخاب بشه، مقدارش رو نشون می‌ده + دکمه ×
 * - کلیک روی چیپ → مودال باز می‌شه
 * - مودال: جستجو + لیست
 * - استان/شهر از useLocationsTree (تست‌شده)
 * - صنف از autocomplete endpoint (تست‌شده)
 */
export default function DivarFilterBar({ value, onChange }: Props) {
    const [modal, setModal] = useState<ModalType>(null);

    const clearProvince = () => {
        onChange({
            ...value,
            provinceCode: undefined,
            provinceTitle: undefined,
            cityCode: undefined,
            cityTitle: undefined,
        });
    };
    const clearCity = () => {
        onChange({ ...value, cityCode: undefined, cityTitle: undefined });
    };
    const clearIndustry = () => {
        onChange({ ...value, industry: undefined, industryId: undefined });
    };

    const hasAnyFilter = !!(value.provinceCode || value.cityCode || value.industry);

    return (
        <>
            {/* ═══ نوار فیلتر ═══ */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-slim pb-1 -mx-4 px-4">
                {/* استان */}
                <FilterChip
                    icon={<MapPin className="w-3.5 h-3.5" />}
                    label="استان"
                    selectedValue={value.provinceTitle}
                    active={!!value.provinceCode}
                    onClick={() => setModal('province')}
                    onClear={clearProvince}
                />

                {/* شهر */}
                <FilterChip
                    icon={<MapPin className="w-3.5 h-3.5" />}
                    label="شهر"
                    selectedValue={value.cityTitle}
                    active={!!value.cityCode}
                    disabled={!value.provinceCode}
                    onClick={() => setModal('city')}
                    onClear={clearCity}
                />

                {/* صنف */}
                <FilterChip
                    icon={<Building2 className="w-3.5 h-3.5" />}
                    label="صنف"
                    selectedValue={value.industry}
                    active={!!value.industry}
                    onClick={() => setModal('industry')}
                    onClear={clearIndustry}
                />

                {/* پاک کردن همه */}
                {hasAnyFilter && (
                    <button
                        onClick={() => onChange({})}
                        className="flex-shrink-0 text-[11px] font-bold text-error/70 hover:text-error transition-colors px-2 h-8 flex items-center gap-1"
                    >
                        <X className="w-3 h-3" />
                        حذف همه
                    </button>
                )}
            </div>

            {/* ═══ مودال‌ها ═══ */}
            {modal === 'province' && (
                <ProvinceModal
                    selectedCode={value.provinceCode || ''}
                    onSelect={(code, title) => {
                        if (!code) {
                            clearProvince();
                        } else {
                            onChange({
                                ...value,
                                provinceCode: code,
                                provinceTitle: title,
                                cityCode: undefined,
                                cityTitle: undefined,
                            });
                        }
                        setModal(null);
                    }}
                    onClose={() => setModal(null)}
                />
            )}

            {modal === 'city' && (
                <CityModal
                    provinceCode={value.provinceCode || ''}
                    selectedCode={value.cityCode || ''}
                    onSelect={(code, title) => {
                        if (!code) {
                            clearCity();
                        } else {
                            onChange({ ...value, cityCode: code, cityTitle: title });
                        }
                        setModal(null);
                    }}
                    onClose={() => setModal(null)}
                />
            )}

            {modal === 'industry' && (
                <IndustryModal
                    selectedTitle={value.industry || ''}
                    onSelect={(title, id) => {
                        if (!title) {
                            clearIndustry();
                        } else {
                            onChange({ ...value, industry: title, industryId: id });
                        }
                        setModal(null);
                    }}
                    onClose={() => setModal(null)}
                />
            )}
        </>
    );
}

// ═══════════════════════════════════════════════════════════
// کامپوننت چیپ فیلتر
// ═══════════════════════════════════════════════════════════
function FilterChip({
    icon,
    label,
    selectedValue,
    active,
    disabled,
    onClick,
    onClear,
}: {
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
            <button
                onClick={onClick}
                className="flex items-center gap-1.5 h-full px-3 text-xs font-bold"
            >
                {icon}
                <span className="truncate max-w-[100px]">
                    {selectedValue || label}
                </span>
                {!active && <ChevronDown className="w-3 h-3 opacity-50" />}
            </button>
            {active && (
                <button
                    onClick={(e) => { e.stopPropagation(); onClear(); }}
                    className="h-full pl-2 pr-1 flex items-center hover:bg-primary/10 rounded-l-full transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// مودال پایه
// ═══════════════════════════════════════════════════════════
function FilterModalShell({
    title,
    children,
    onClose,
}: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl
                    max-h-[80dvh] flex flex-col overflow-hidden
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            >
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <h3 className="text-sm font-extrabold text-on-surface">{title}</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body,
    );
}

// ═══════════════════════════════════════════════════════════
// مودال استان
// ═══════════════════════════════════════════════════════════
function ProvinceModal({
    selectedCode,
    onSelect,
    onClose,
}: {
    selectedCode: string;
    onSelect: (code: string, title: string) => void;
    onClose: () => void;
}) {
    const { data: tree, isLoading } = useLocationsTree();
    const [search, setSearch] = useState('');

    const provinces = useMemo(() => {
        if (!tree) return [];
        const iran = (tree as any[]).find((n: any) => n.type === 'country' && n.title === 'ایران');
        if (!iran?.children) return [];
        return iran.children
            .filter((n: any) => n.type === 'province')
            .map((n: any) => ({
                value: n.provinceCode || n.id,
                label: n.title,
            }))
            .filter((p: any) => !search || p.label.includes(search.trim()));
    }, [tree, search]);

    return (
        <FilterModalShell title="انتخاب استان" onClose={onClose}>
            <div className="flex-shrink-0 p-3 border-b border-outline-variant/20">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجوی استان..."
                        autoFocus
                        className="w-full h-10 pr-9 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim">
                {isLoading ? (
                    <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
                ) : provinces.length === 0 ? (
                    <div className="p-6 text-center text-xs text-on-surface-variant">استانی پیدا نشد</div>
                ) : (
                    provinces.map((p: any) => (
                        <button
                            key={p.value}
                            onClick={() => onSelect(p.value, p.label)}
                            className={cn(
                                'w-full flex items-center justify-between px-4 py-3 text-right transition-colors',
                                selectedCode === p.value ? 'bg-primary/10' : 'hover:bg-surface-container-low',
                            )}
                        >
                            <span className="text-sm font-medium text-on-surface">{p.label}</span>
                            {selectedCode === p.value && <Check className="w-4 h-4 text-primary" />}
                        </button>
                    ))
                )}
            </div>
            {selectedCode && (
                <div className="flex-shrink-0 p-3 border-t border-outline-variant/20">
                    <button
                        onClick={() => onSelect('', '')}
                        className="w-full h-10 rounded-xl border border-outline-variant/60 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                        حذف فیلتر استان
                    </button>
                </div>
            )}
        </FilterModalShell>
    );
}

// ═══════════════════════════════════════════════════════════
// مودال شهر
// ═══════════════════════════════════════════════════════════
function CityModal({
    provinceCode,
    selectedCode,
    onSelect,
    onClose,
}: {
    provinceCode: string;
    selectedCode: string;
    onSelect: (code: string, title: string) => void;
    onClose: () => void;
}) {
    const { data: tree, isLoading } = useLocationsTree();
    const [search, setSearch] = useState('');

    const cities = useMemo(() => {
        if (!tree || !provinceCode) return [];
        const iran = (tree as any[]).find((n: any) => n.type === 'country' && n.title === 'ایران');
        if (!iran?.children) return [];
        const province = iran.children.find((n: any) => n.type === 'province' && (n.provinceCode || n.id) === provinceCode);
        if (!province?.children) return [];
        return province.children
            .filter((n: any) => n.type === 'city')
            .map((n: any) => ({
                value: n.cityCode || n.id,
                label: n.title,
            }))
            .filter((c: any) => !search || c.label.includes(search.trim()));
    }, [tree, provinceCode, search]);

    return (
        <FilterModalShell title="انتخاب شهر" onClose={onClose}>
            <div className="flex-shrink-0 p-3 border-b border-outline-variant/20">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجوی شهر..."
                        autoFocus
                        className="w-full h-10 pr-9 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim">
                {isLoading ? (
                    <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
                ) : cities.length === 0 ? (
                    <div className="p-6 text-center text-xs text-on-surface-variant">شهری پیدا نشد</div>
                ) : (
                    cities.map((c: any) => (
                        <button
                            key={c.value}
                            onClick={() => onSelect(c.value, c.label)}
                            className={cn(
                                'w-full flex items-center justify-between px-4 py-3 text-right transition-colors',
                                selectedCode === c.value ? 'bg-primary/10' : 'hover:bg-surface-container-low',
                            )}
                        >
                            <span className="text-sm font-medium text-on-surface">{c.label}</span>
                            {selectedCode === c.value && <Check className="w-4 h-4 text-primary" />}
                        </button>
                    ))
                )}
            </div>
            {selectedCode && (
                <div className="flex-shrink-0 p-3 border-t border-outline-variant/20">
                    <button
                        onClick={() => onSelect('', '')}
                        className="w-full h-10 rounded-xl border border-outline-variant/60 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                        حذف فیلتر شهر
                    </button>
                </div>
            )}
        </FilterModalShell>
    );
}

// ═══════════════════════════════════════════════════════════
// مودال صنف — استفاده از autocomplete endpoint (تست‌شده)
// ═══════════════════════════════════════════════════════════
function IndustryModal({
    selectedTitle,
    onSelect,
    onClose,
}: {
    selectedTitle: string;
    onSelect: (title: string, id: string) => void;
    onClose: () => void;
}) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // debounce جستجو
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // جستجوی اصناف از autocomplete endpoint
    const { data, isFetching } = useQuery({
        queryKey: ['industries-modal', debouncedSearch],
        queryFn: async () => {
            if (!debouncedSearch || debouncedSearch.length < 2) {
                // اگه جستجو خالی بود، همه رو بگیر از list endpoint
                const res: any = await apiService.industry.list(false);
                return res?.items || [];
            }
            const res: any = await apiService.industry.autocomplete(debouncedSearch);
            return res?.items || [];
        },
        staleTime: 30_000,
    });

    const items = data || [];

    return (
        <FilterModalShell title="انتخاب صنف" onClose={onClose}>
            <div className="flex-shrink-0 p-3 border-b border-outline-variant/20">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجوی صنف... (حداقل ۲ حرف)"
                        autoFocus
                        className="w-full h-10 pr-9 pl-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim">
                {isFetching ? (
                    <div className="p-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /></div>
                ) : items.length === 0 ? (
                    <div className="p-6 text-center text-xs text-on-surface-variant">
                        {debouncedSearch.length < 2
                            ? 'هیچ صنفی موجود نیست'
                            : 'صنف‌ای با این نام پیدا نشد'}
                    </div>
                ) : (
                    items.map((item: any) => (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item.title, item.id)}
                            className={cn(
                                'w-full flex items-center justify-between px-4 py-3 text-right transition-colors',
                                selectedTitle === item.title ? 'bg-primary/10' : 'hover:bg-surface-container-low',
                            )}
                        >
                            <span className="text-sm font-medium text-on-surface">{item.title}</span>
                            {selectedTitle === item.title && <Check className="w-4 h-4 text-primary" />}
                        </button>
                    ))
                )}
            </div>
            {selectedTitle && (
                <div className="flex-shrink-0 p-3 border-t border-outline-variant/20">
                    <button
                        onClick={() => onSelect('', '')}
                        className="w-full h-10 rounded-xl border border-outline-variant/60 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                        حذف فیلتر صنف
                    </button>
                </div>
            )}
        </FilterModalShell>
    );
}
