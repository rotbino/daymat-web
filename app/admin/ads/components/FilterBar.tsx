// app/admin/ads/components/FilterBar.tsx
'use client';

import React from 'react';
import { X } from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import  DateObject  from 'react-date-object';
import { FilterDropdown } from './FilterDropdown';
import { LocationFilter } from './LocationFilter';
import { AdFilters, ArmOption } from './types';
import { cn } from '@/lib/utils';

const QUICK_RANGES = [
    { label: 'امروز', days: 0 },
    { label: '۷ روز', days: 7 },
    { label: '۳۰ روز', days: 30 },
];

interface FilterBarProps {
    filters: AdFilters;
    arms: ArmOption[];
    onFilterChange: (key: keyof AdFilters, value: any) => void;
    onClearAll: () => void;
}

export function FilterBar({ filters, arms, onFilterChange, onClearAll }: FilterBarProps) {
    const hasFilters = filters.statusFilter !== 'all' || filters.armFilter !== 'all' || filters.categoryFilter !== 'all' ||
        filters.minPrice || filters.maxPrice || filters.cityFilter || filters.isBumpedFilter !== 'all' || filters.startDate;

    const formatDate = (d: DateObject | null) => d ? d.format('D MMM') : '';

    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
            {/* وضعیت */}
            <div className="flex-shrink-0">
                <FilterDropdown
                    label={filters.statusFilter === 'all' ? 'وضعیت' : filters.statusFilter === 'active' ? 'فعال' : filters.statusFilter === 'pending' ? 'در انتظار' : filters.statusFilter === 'rejected' ? 'رد شده' : 'منقضی'}
                    isActive={filters.statusFilter !== 'all'}
                    onRemove={filters.statusFilter !== 'all' ? () => onFilterChange('statusFilter', 'all') : undefined}
                >
                    <div className="py-1">
                        {[
                            { id: 'all', label: 'همه' },
                            { id: 'active', label: 'فعال' },
                            { id: 'pending', label: 'در انتظار' },
                            { id: 'rejected', label: 'رد شده' },
                            { id: 'expired', label: 'منقضی' },
                        ].map(f => (
                            <button key={f.id} onClick={() => onFilterChange('statusFilter', f.id)}
                                    className={cn("w-full text-right px-3 py-2 text-sm hover:bg-surface-container-low", filters.statusFilter === f.id && "text-primary font-medium bg-primary/5")}>{f.label}</button>
                        ))}
                    </div>
                </FilterDropdown>
            </div>

            {/* بازار */}
            <div className="flex-shrink-0">
                <FilterDropdown
                    label={filters.armName}
                    isActive={filters.armFilter !== 'all'}
                    onRemove={filters.armFilter !== 'all' ? () => { onFilterChange('armFilter', 'all'); onFilterChange('armName', 'همه بازارها'); } : undefined}
                >
                    <div className="py-1 max-h-60 overflow-y-auto">
                        {[{ slug: 'all', name: 'همه بازارها' }, ...arms].map(a => (
                            <button key={a.slug} onClick={() => { onFilterChange('armFilter', a.slug); onFilterChange('armName', a.name); onFilterChange('categoryFilter', 'all'); }}
                                    className={cn("w-full text-right px-3 py-2 text-sm hover:bg-surface-container-low", filters.armFilter === a.slug && "text-primary font-medium bg-primary/5")}>{a.name}</button>
                        ))}
                    </div>
                </FilterDropdown>
            </div>

            {/* نردبان */}
            <div className="flex-shrink-0">
                <FilterDropdown
                    label={filters.isBumpedFilter === 'all' ? 'نوع آگهی' : filters.isBumpedFilter === 'true' ? 'نردبان' : 'معمولی'}
                    isActive={filters.isBumpedFilter !== 'all'}
                    onRemove={filters.isBumpedFilter !== 'all' ? () => onFilterChange('isBumpedFilter', 'all') : undefined}
                >
                    <div className="py-1">
                        {[{ id: 'all', label: 'همه' }, { id: 'true', label: 'نردبان شده' }, { id: 'false', label: 'معمولی' }].map(f => (
                            <button key={f.id} onClick={() => onFilterChange('isBumpedFilter', f.id)}
                                    className={cn("w-full text-right px-3 py-2 text-sm hover:bg-surface-container-low", filters.isBumpedFilter === f.id && "text-primary font-medium bg-primary/5")}>{f.label}</button>
                        ))}
                    </div>
                </FilterDropdown>
            </div>

            {/* قیمت */}
            <div className="flex-shrink-0">
                <FilterDropdown
                    label={filters.minPrice || filters.maxPrice ? `${filters.minPrice || '۰'} - ${filters.maxPrice || '∞'} ت` : 'قیمت'}
                    isActive={!!(filters.minPrice || filters.maxPrice)}
                    onRemove={(filters.minPrice || filters.maxPrice) ? () => { onFilterChange('minPrice', ''); onFilterChange('maxPrice', ''); } : undefined}
                >
                    <div className="p-3 space-y-2 w-52">
                        <div className="flex items-center gap-2">
                            <input type="number" value={filters.minPrice} onChange={e => onFilterChange('minPrice', e.target.value)} placeholder="از" className="w-full bg-surface border rounded-lg h-8 px-2 text-xs" />
                            <span className="text-xs">تا</span>
                            <input type="number" value={filters.maxPrice} onChange={e => onFilterChange('maxPrice', e.target.value)} placeholder="تا" className="w-full bg-surface border rounded-lg h-8 px-2 text-xs" />
                        </div>
                    </div>
                </FilterDropdown>
            </div>

            {/* تاریخ */}
            <div className="flex-shrink-0">
                <FilterDropdown
                    label={filters.startDate ? `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}` : 'تاریخ'}
                    isActive={!!filters.startDate}
                    onRemove={filters.startDate ? () => { onFilterChange('startDate', null); onFilterChange('endDate', null); } : undefined}
                >
                    <div className="p-3 space-y-2 w-72">
                        <div className="flex gap-2">
                            {QUICK_RANGES.map(r => (
                                <button key={r.days} onClick={() => {
                                    const now = new DateObject({ calendar: persian, locale: persian_fa });
                                    onFilterChange('startDate', now.clone().subtract(r.days, 'days'));
                                    onFilterChange('endDate', now.clone());
                                }} className="px-2.5 py-1 text-[11px] rounded-lg bg-surface border hover:border-primary/30">{r.label}</button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <DatePicker value={filters.startDate} onChange={d => onFilterChange('startDate', d as DateObject)}
                                        calendar={persian} locale={persian_fa} format="YYYY/MM/DD" placeholder="از"
                                        inputClass="w-full bg-surface border rounded-lg h-8 px-2 text-[11px] text-right" containerClassName="w-full" maxDate={filters.endDate || undefined} />
                            <DatePicker value={filters.endDate} onChange={d => onFilterChange('endDate', d as DateObject)}
                                        calendar={persian} locale={persian_fa} format="YYYY/MM/DD" placeholder="تا"
                                        inputClass="w-full bg-surface border rounded-lg h-8 px-2 text-[11px] text-right" containerClassName="w-full" minDate={filters.startDate || undefined} />
                        </div>
                    </div>
                </FilterDropdown>
            </div>

            {/* پاک کردن همه */}
            {hasFilters && (
                <div className="flex-shrink-0">
                    <button onClick={onClearAll} className="flex items-center gap-1 px-3 py-2 text-xs text-error/70 hover:bg-error/5 rounded-lg transition-colors">
                        <X className="w-3.5 h-3.5" />پاک کردن همه
                    </button>
                </div>
            )}
        </div>
    );
}