// app/admin/credits/components/FilterBar.tsx
'use client';

import React from 'react';
import { X } from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import  DateObject  from 'react-date-object';
import { FilterDropdown } from '@/app/admin/ads/components/FilterDropdown';
import { cn } from '@/lib/utils';

const QUICK_RANGES = [
    { label: 'امروز', days: 0 },
    { label: '۷ روز', days: 7 },
    { label: '۳۰ روز', days: 30 },
];

interface FilterBarProps {
    statusFilter: string; onStatusChange: (v: string) => void;
    armFilter: string; arms: any[]; onArmChange: (v: string) => void;
    paymentFilter: string; onPaymentChange: (v: string) => void;
    creditTypeFilter: string; onCreditTypeChange: (v: string) => void;
    minAmount: string; maxAmount: string; onAmountChange: (min: string, max: string) => void;
    startDate: DateObject | null; endDate: DateObject | null; onDateChange: (s: DateObject | null, e: DateObject | null) => void;
    hasFilters: boolean; onClearAll: () => void;
}

export function FilterBar({
                              statusFilter, onStatusChange,
                              armFilter, arms, onArmChange,
                              paymentFilter, onPaymentChange,
                              creditTypeFilter, onCreditTypeChange,
                              minAmount, maxAmount, onAmountChange,
                              startDate, endDate, onDateChange,
                              hasFilters, onClearAll,
                          }: FilterBarProps) {

    const formatDate = (d: DateObject | null) => d ? d.format('D MMM') : '';

    return (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
            {/* وضعیت */}
            <FilterDropdown
                label={statusFilter === 'all' ? 'وضعیت' : statusFilter === 'success' ? 'موفق' : statusFilter === 'pending' ? 'در انتظار' : 'ناموفق'}
                isActive={statusFilter !== 'all'}
                onRemove={statusFilter !== 'all' ? () => onStatusChange('all') : undefined}
            >
                <div className="py-1">
                    {[{ id: 'all', label: 'همه' }, { id: 'success', label: 'موفق' }, { id: 'pending', label: 'در انتظار' }, { id: 'failed', label: 'ناموفق' }].map(f => (
                        <button key={f.id} onClick={() => onStatusChange(f.id)}
                                className={cn("w-full text-right px-3 py-2 text-sm hover:bg-surface-container-low", statusFilter === f.id && "text-primary font-medium bg-primary/5")}>{f.label}</button>
                    ))}
                </div>
            </FilterDropdown>

            {/* بازار */}
            <FilterDropdown
                label={arms.find(a => a.slug === armFilter)?.name || 'همه بازارها'}
                isActive={armFilter !== 'all'}
                onRemove={armFilter !== 'all' ? () => onArmChange('all') : undefined}
            >
                <div className="py-1 max-h-60 overflow-y-auto">
                    {[{ slug: 'all', name: 'همه بازارها' }, ...arms].map(a => (
                        <button key={a.slug} onClick={() => onArmChange(a.slug)}
                                className={cn("w-full text-right px-3 py-2 text-sm hover:bg-surface-container-low", armFilter === a.slug && "text-primary font-medium bg-primary/5")}>{a.name}</button>
                    ))}
                </div>
            </FilterDropdown>

            {/* روش پرداخت */}
            <FilterDropdown
                label={paymentFilter === 'all' ? 'روش پرداخت' : paymentFilter === 'online' ? 'آنلاین' : 'فیشی'}
                isActive={paymentFilter !== 'all'}
                onRemove={paymentFilter !== 'all' ? () => onPaymentChange('all') : undefined}
            >
                <div className="py-1">
                    {[{ id: 'all', label: 'همه' }, { id: 'online', label: 'آنلاین' }, { id: 'manual', label: 'فیشی' }].map(f => (
                        <button key={f.id} onClick={() => onPaymentChange(f.id)}
                                className={cn("w-full text-right px-3 py-2 text-sm hover:bg-surface-container-low", paymentFilter === f.id && "text-primary font-medium bg-primary/5")}>{f.label}</button>
                    ))}
                </div>
            </FilterDropdown>

            {/* مبلغ */}
            <FilterDropdown
                label={minAmount || maxAmount ? `${minAmount || '۰'} - ${maxAmount || '∞'} ت` : 'مبلغ'}
                isActive={!!(minAmount || maxAmount)}
                onRemove={(minAmount || maxAmount) ? () => onAmountChange('', '') : undefined}
            >
                <div className="p-3 space-y-2 w-52">
                    <div className="flex items-center gap-2">
                        <input type="number" value={minAmount} onChange={e => onAmountChange(e.target.value, maxAmount)} placeholder="از" className="w-full bg-surface border rounded-lg h-8 px-2 text-xs" />
                        <span className="text-xs">تا</span>
                        <input type="number" value={maxAmount} onChange={e => onAmountChange(minAmount, e.target.value)} placeholder="تا" className="w-full bg-surface border rounded-lg h-8 px-2 text-xs" />
                    </div>
                </div>
            </FilterDropdown>

            {/* تاریخ */}
            <FilterDropdown
                label={startDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'تاریخ'}
                isActive={!!startDate}
                onRemove={startDate ? () => onDateChange(null, null) : undefined}
            >
                <div className="p-3 space-y-2 w-72">
                    <div className="flex gap-2">
                        {QUICK_RANGES.map(r => (
                            <button key={r.days} onClick={() => {
                                const now = new DateObject({ calendar: persian, locale: persian_fa });
                                onDateChange(now.clone().subtract(r.days, 'days'), now.clone());
                            }} className="px-2.5 py-1 text-[11px] rounded-lg bg-surface border hover:border-primary/30">{r.label}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <DatePicker value={startDate} onChange={d => onDateChange(d as DateObject, endDate)} calendar={persian} locale={persian_fa} format="YYYY/MM/DD" placeholder="از"
                                    inputClass="w-full bg-surface border rounded-lg h-8 px-2 text-[11px] text-right" containerClassName="w-full" maxDate={endDate || undefined} />
                        <DatePicker value={endDate} onChange={d => onDateChange(startDate, d as DateObject)} calendar={persian} locale={persian_fa} format="YYYY/MM/DD" placeholder="تا"
                                    inputClass="w-full bg-surface border rounded-lg h-8 px-2 text-[11px] text-right" containerClassName="w-full" minDate={startDate || undefined} />
                    </div>
                </div>
            </FilterDropdown>

            {hasFilters && (
                <button onClick={onClearAll} className="flex items-center gap-1 px-3 py-2 text-xs text-error/70 hover:bg-error/5 rounded-lg flex-shrink-0">
                    <X className="w-3.5 h-3.5" />پاک کردن همه
                </button>
            )}
        </div>
    );
}