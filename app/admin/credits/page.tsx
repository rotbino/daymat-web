// app/admin/credits/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import  DateObject  from 'react-date-object';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';
import { FilterDropdown } from '@/app/admin/ads/components/FilterDropdown';
import { LocationFilter } from '@/app/admin/ads/components/LocationFilter';
import { StatsBar } from './components/StatsBar';
import { CreditsTable } from './components/CreditsTable';
import { CreditDetailModal } from './components/CreditDetailModal';

type SortField = 'createdAt' | 'amount' | 'creditCount';

const QUICK_RANGES = [
    { label: 'امروز', days: 0 },
    { label: '۷ روز', days: 7 },
    { label: '۳۰ روز', days: 30 },
];

interface ArmOption { id: string; slug: string; name: string; colorPrimary: string; }

export default function AdminCreditsPage() {
    const [credits, setCredits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [stats, setStats] = useState<any>({});

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [armFilter, setArmFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [cityFilter, setCityFilter] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [startDate, setStartDate] = useState<DateObject | null>(null);
    const [endDate, setEndDate] = useState<DateObject | null>(null);
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);

    const [arms, setArms] = useState<ArmOption[]>([]);
    const [selectedCredit, setSelectedCredit] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const formatDate = (d: DateObject | null) => d ? d.format('D MMM') : '';

    const fetchCredits = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 20, sortBy: sortField, sortOrder };
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (armFilter !== 'all') params.armSlug = armFilter;
            if (paymentFilter !== 'all') params.paymentMethod = paymentFilter;
            if (cityFilter) params.city = cityFilter;
            if (minAmount) params.minAmount = Number(minAmount);
            if (maxAmount) params.maxAmount = Number(maxAmount);
            if (startDate) params.startDate = new Date(startDate.valueOf()).toISOString().split('T')[0];
            if (endDate) params.endDate = new Date(endDate.valueOf()).toISOString().split('T')[0];

            const [data, statsData] = await Promise.all([
                apiService.admin.credits.getList(params),
                apiService.admin.credits.getStats({
                    armSlug: armFilter !== 'all' ? armFilter : undefined,
                    startDate: startDate ? new Date(startDate.valueOf()).toISOString().split('T')[0] : undefined,
                    endDate: endDate ? new Date(endDate.valueOf()).toISOString().split('T')[0] : undefined,
                }),
            ]);
            setCredits(data.items);
            setPagination(data.pagination);
            setStats(statsData);
        } catch (e: any) { toast.error(e?.message); }
        finally { setLoading(false); }
    }, [page, sortField, sortOrder, search, statusFilter, armFilter, paymentFilter, cityFilter, minAmount, maxAmount, startDate, endDate]);

    useEffect(() => { fetchCredits(); }, [fetchCredits]);
    useEffect(() => { apiService.admin.credits.getArms().then(d => setArms(d || [])).catch(() => {}); }, []);

    const handleClearAll = () => {
        setSearch(''); setStatusFilter('all'); setArmFilter('all'); setPaymentFilter('all');
        setCityFilter(''); setMinAmount(''); setMaxAmount('');
        setStartDate(null); setEndDate(null); setPage(1);
    };

    const hasFilters = statusFilter !== 'all' || armFilter !== 'all' || paymentFilter !== 'all' || cityFilter || minAmount || maxAmount || startDate;

    const handleRowClick = async (credit: any) => {
        try { const d = await apiService.admin.credits.getDetail(credit.id); setSelectedCredit(d); setIsDetailOpen(true); } catch { toast.error('خطا'); }
    };

    const getStatusBadge = (status: string) => {
        const m: any = {
            success: { icon: CheckCircle, cls: 'text-green-600 bg-green-50', label: 'موفق' },
            pending: { icon: Clock, cls: 'text-yellow-600 bg-yellow-50', label: 'در انتظار' },
            failed: { icon: XCircle, cls: 'text-red-600 bg-red-50', label: 'ناموفق' },
        };
        const s = m[status] || m.success;
        return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full", s.cls)}><s.icon className="w-3 h-3" />{s.label}</span>;
    };

    const getPaymentBadge = (method: string) => {
        return method === 'online'
            ? <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">آنلاین</span>
            : <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">فیشی</span>;
    };

    if (loading && credits.length === 0) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

    return (
        <div className="p-4 md:p-6 max-w-full mx-auto">
            {/* هدر */}
            <div className="flex items-center gap-3 mb-4">
                <h1 className="text-xl font-bold text-on-surface">اعتبارات فروخته شده</h1>
                <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">{pagination.total.toLocaleString('fa-IR')} تراکنش</span>
                <div className="relative flex-1 max-w-sm mr-auto">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                    <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="جستجوی کاربر یا توضیحات..."
                           className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl h-9 pr-9 pl-3 text-sm focus:ring-1 focus:ring-primary/30 outline-none" />
                </div>
            </div>

            {/* نوار فیلتر + تاریخ + موقعیت */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                <FilterDropdown
                    label={statusFilter === 'all' ? 'وضعیت' : statusFilter === 'success' ? 'موفق' : statusFilter === 'pending' ? 'در انتظار' : 'ناموفق'}
                    isActive={statusFilter !== 'all'}
                    onRemove={statusFilter !== 'all' ? () => { setStatusFilter('all'); setPage(1); } : undefined}
                >
                    <div className="py-1">
                        {[{ id: 'all', label: 'همه' }, { id: 'success', label: 'موفق' }, { id: 'pending', label: 'در انتظار' }, { id: 'failed', label: 'ناموفق' }].map(f => (
                            <button key={f.id} onClick={() => { setStatusFilter(f.id); setPage(1); }}
                                    className={cn("w-full text-right px-3 py-2 text-sm hover:bg-surface-container-low", statusFilter === f.id && "text-primary font-medium bg-primary/5")}>{f.label}</button>
                        ))}
                    </div>
                </FilterDropdown>

                <FilterDropdown
                    label={arms.find(a => a.slug === armFilter)?.name || 'همه بازارها'}
                    isActive={armFilter !== 'all'}
                    onRemove={armFilter !== 'all' ? () => { setArmFilter('all'); setPage(1); } : undefined}
                >
                    <div className="py-1 max-h-60 overflow-y-auto">
                        {[{ slug: 'all', name: 'همه بازارها' }, ...arms].map(a => (
                            <button key={a.slug} onClick={() => { setArmFilter(a.slug); setPage(1); }}
                                    className={cn("w-full text-right px-3 py-2 text-sm hover:bg-surface-container-low", armFilter === a.slug && "text-primary font-medium bg-primary/5")}>{a.name}</button>
                        ))}
                    </div>
                </FilterDropdown>

                <FilterDropdown
                    label={paymentFilter === 'all' ? 'روش پرداخت' : paymentFilter === 'online' ? 'آنلاین' : 'فیشی'}
                    isActive={paymentFilter !== 'all'}
                    onRemove={paymentFilter !== 'all' ? () => { setPaymentFilter('all'); setPage(1); } : undefined}
                >
                    <div className="py-1">
                        {[{ id: 'all', label: 'همه' }, { id: 'online', label: 'آنلاین' }, { id: 'manual', label: 'فیشی' }].map(f => (
                            <button key={f.id} onClick={() => { setPaymentFilter(f.id); setPage(1); }}
                                    className={cn("w-full text-right px-3 py-2 text-sm hover:bg-surface-container-low", paymentFilter === f.id && "text-primary font-medium bg-primary/5")}>{f.label}</button>
                        ))}
                    </div>
                </FilterDropdown>

                {/* تاریخ - مستقیم روی نوار */}
                <div className="flex items-center gap-1 flex-shrink-0 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-2 py-1.5">
                    <DatePicker value={startDate} onChange={d => { setStartDate(d as DateObject); setPage(1); }} calendar={persian} locale={persian_fa} format="YYYY/MM/DD" placeholder="از"
                                inputClass="w-20 bg-transparent text-[11px] text-right outline-none" containerClassName="w-auto" maxDate={endDate || undefined} />
                    <span className="text-[10px] text-on-surface-variant/40">تا</span>
                    <DatePicker value={endDate} onChange={d => { setEndDate(d as DateObject); setPage(1); }} calendar={persian} locale={persian_fa} format="YYYY/MM/DD"
                                inputClass="w-20 bg-transparent text-[11px] text-right outline-none" containerClassName="w-auto" minDate={startDate || undefined} />
                </div>

                {/* quick ranges */}
                {QUICK_RANGES.map(r => (
                    <button key={r.days} onClick={() => {
                        const now = new DateObject({ calendar: persian, locale: persian_fa });
                        setStartDate(now.clone().subtract(r.days, 'days'));
                        setEndDate(now.clone());
                        setPage(1);
                    }} className="px-2.5 py-1.5 text-[11px] rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/30 transition-colors flex-shrink-0">
                        {r.label}
                    </button>
                ))}

                {hasFilters && (
                    <button onClick={handleClearAll} className="flex items-center gap-1 px-3 py-2 text-xs text-error/70 hover:bg-error/5 rounded-lg flex-shrink-0">
                        پاک کردن
                    </button>
                )}
            </div>

            {/* آمار + موقعیت */}
            <div className="flex items-start justify-between mb-4">
                <StatsBar stats={[
                    { label: 'درآمد کل', value: stats.totalAmount ? stats.totalAmount.toLocaleString() + ' ت' : '-', color: 'text-green-600' },
                    { label: 'تراکنش', value: stats.total, color: 'text-blue-600' },
                    { label: 'اعتبار', value: stats.totalCredits?.toLocaleString() || '0', color: 'text-purple-600' },
                    { label: 'میانگین', value: stats.avgPricePerCredit ? stats.avgPricePerCredit.toLocaleString() + ' ت' : '-', color: 'text-orange-600' },
                    { label: 'امروز', value: stats.todayTotal ? stats.todayTotal.toLocaleString() + ' ت' : '-', color: 'text-primary' },
                ]} />
                <LocationFilter
                    armSlug={armFilter !== 'all' ? armFilter : undefined}
                    onLocationChange={(countryCode, provinceCode, city) => { setCityFilter(city || ''); setPage(1); }}
                    onClear={() => setCityFilter('')}
                    hasFilter={!!cityFilter}
                />
            </div>

            {/* جدول */}
            <CreditsTable
                credits={credits} pagination={pagination} page={page}
                sortField={sortField} sortOrder={sortOrder}
                onSort={f => { if (sortField === f) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortField(f); setSortOrder('desc'); } }}
                onPageChange={setPage} onRowClick={handleRowClick}
                getStatusBadge={getStatusBadge} getPaymentBadge={getPaymentBadge}
            />

            {/* مودال */}
            <CreditDetailModal credit={selectedCredit} isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedCredit(null); }} />
        </div>
    );
}