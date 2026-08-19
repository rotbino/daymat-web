// app/admin/payments/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, CheckCircle, Clock, XCircle, Eye, Receipt, ImageIcon, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import  DateObject  from 'react-date-object';
import Image from 'next/image';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';
import { FilterDropdown } from '@/app/admin/ads/components/FilterDropdown';
import { LocationFilter } from '@/app/admin/ads/components/LocationFilter';

type SortField = 'createdAt' | 'amount';

const QUICK_RANGES = [
    { label: 'امروز', days: 0 },
    { label: '۷ روز', days: 7 },
    { label: '۳۰ روز', days: 30 },
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011';

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [stats, setStats] = useState<any>({});

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [armFilter, setArmFilter] = useState('all');
    const [cityFilter, setCityFilter] = useState('');
    const [startDate, setStartDate] = useState<DateObject | null>(null);
    const [endDate, setEndDate] = useState<DateObject | null>(null);
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);

    const [arms, setArms] = useState<any[]>([]);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const getImageUrl = (fileId: string) => {
        if (!fileId) return '';
        if (fileId.startsWith('http')) return fileId;
        const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
        return `${base}/file/${fileId}`;
    };

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 20, sortBy: sortField, sortOrder };
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (armFilter !== 'all') params.armSlug = armFilter;
            if (cityFilter) params.city = cityFilter;
            if (startDate) params.startDate = new Date(startDate.valueOf()).toISOString().split('T')[0];
            if (endDate) params.endDate = new Date(endDate.valueOf()).toISOString().split('T')[0];

            const [data, statsData] = await Promise.all([
                apiService.admin.payments.getList(params),
                apiService.admin.payments.getStats({
                    armSlug: armFilter !== 'all' ? armFilter : undefined,
                    startDate: startDate ? new Date(startDate.valueOf()).toISOString().split('T')[0] : undefined,
                    endDate: endDate ? new Date(endDate.valueOf()).toISOString().split('T')[0] : undefined,
                }),
            ]);
            setPayments(data.items);
            setPagination(data.pagination);
            setStats(statsData);
        } catch (e: any) { toast.error(e?.message); }
        finally { setLoading(false); }
    }, [page, sortField, sortOrder, search, statusFilter, armFilter, cityFilter, startDate, endDate]);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);
    useEffect(() => { apiService.admin.payments.getArms?.().then((d: any) => setArms(d || [])).catch(() => {}); }, []);

    const handleClearAll = () => {
        setSearch(''); setStatusFilter('all'); setArmFilter('all');
        setCityFilter(''); setStartDate(null); setEndDate(null); setPage(1);
    };

    const hasFilters = statusFilter !== 'all' || armFilter !== 'all' || cityFilter || startDate;

    const getStatusBadge = (status: string) => {
        const m: any = {
            approved: { icon: CheckCircle, cls: 'text-green-600 bg-green-50', label: 'تأیید شده' },
            pending: { icon: Clock, cls: 'text-yellow-600 bg-yellow-50', label: 'در انتظار' },
            rejected: { icon: XCircle, cls: 'text-red-600 bg-red-50', label: 'رد شده' },
        };
        const s = m[status] || m.pending;
        return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full", s.cls)}><s.icon className="w-3 h-3" />{s.label}</span>;
    };

    // ============================================================
    // محاسبه درصدها
    // ============================================================
    const approvalRate = stats.total > 0 ? ((stats.approved || 0) / stats.total * 100).toFixed(1) : '0';
    const rejectionRate = stats.total > 0 ? ((stats.rejected || 0) / stats.total * 100).toFixed(1) : '0';
    const pendingRate = stats.total > 0 ? ((stats.pending || 0) / stats.total * 100).toFixed(1) : '0';

    if (loading && payments.length === 0) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

    return (
        <div className="p-4 md:p-6 max-w-full mx-auto">
            {/* هدر */}
            <div className="flex items-center gap-3 mb-4">
                <h1 className="text-xs font-bold text-on-surface">گزارش پرداخت‌ها</h1>
                <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">{pagination.total.toLocaleString('fa-IR')} فیش</span>
                <div className="relative flex-1 max-w-sm mr-auto">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                    <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="جستجو..."
                           className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl h-9 pr-9 pl-3 text-sm focus:ring-1 focus:ring-primary/30 outline-none" />
                </div>
            </div>

            {/* ══════════ کارت‌های درصد و آمار ══════════ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
                {/* جمع کل */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-on-surface">{stats.total?.toLocaleString('fa-IR') || '0'}</p>
                    <p className="text-[10px] text-on-surface-variant">کل فیش‌ها</p>
                </div>

                {/* درآمد تأیید شده */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-green-700">{stats.totalAmount ? (stats.totalAmount / 1000000).toFixed(1) + 'M' : '0'}</p>
                    <p className="text-[10px] text-green-600">درآمد (تومان)</p>
                </div>

                {/* نرخ تأیید */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <p className="text-lg font-bold text-green-600">{approvalRate}%</p>
                    </div>
                    <p className="text-[10px] text-on-surface-variant">نرخ تأیید</p>
                    <div className="mt-1.5 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: `${approvalRate}%` }} />
                    </div>
                </div>

                {/* نرخ رد */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <p className="text-lg font-bold text-red-600">{rejectionRate}%</p>
                    </div>
                    <p className="text-[10px] text-on-surface-variant">نرخ رد</p>
                    <div className="mt-1.5 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: `${rejectionRate}%` }} />
                    </div>
                </div>

                {/* در انتظار */}
                <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <p className="text-lg font-bold text-yellow-600">{pendingRate}%</p>
                    </div>
                    <p className="text-[10px] text-on-surface-variant">در انتظار</p>
                    <div className="mt-1.5 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${pendingRate}%` }} />
                    </div>
                </div>

                {/* تعداد تأیید */}
                <div className="bg-green-50/50 border border-green-100 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-green-700">{stats.approved?.toLocaleString('fa-IR') || '0'}</p>
                    <p className="text-[10px] text-green-600">تأیید شده</p>
                </div>

                {/* تعداد رد */}
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-red-700">{stats.rejected?.toLocaleString('fa-IR') || '0'}</p>
                    <p className="text-[10px] text-red-600">رد شده</p>
                </div>
            </div>

            {/* نوار فیلتر */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                <FilterDropdown
                    label={statusFilter === 'all' ? 'وضعیت' : statusFilter === 'approved' ? 'تأیید شده' : statusFilter === 'pending' ? 'در انتظار' : 'رد شده'}
                    isActive={statusFilter !== 'all'}
                    onRemove={statusFilter !== 'all' ? () => { setStatusFilter('all'); setPage(1); } : undefined}
                >
                    <div className="py-1">
                        {[{ id: 'all', label: 'همه' }, { id: 'approved', label: 'تأیید شده' }, { id: 'pending', label: 'در انتظار' }, { id: 'rejected', label: 'رد شده' }].map(f => (
                            <button key={f.id} onClick={() => { setStatusFilter(f.id); setPage(1); }}
                                    className={cn("w-full text-right px-3 py-2 text-sm hover:bg-surface-container-low", statusFilter === f.id && "text-primary font-medium bg-primary/5")}>{f.label}</button>
                        ))}
                    </div>
                </FilterDropdown>

                <div className="flex items-center gap-1 flex-shrink-0 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-2 py-1.5">
                    <DatePicker value={startDate} onChange={d => { setStartDate(d as DateObject); setPage(1); }} calendar={persian} locale={persian_fa} format="YYYY/MM/DD" placeholder="از"
                                inputClass="w-20 bg-transparent text-[11px] text-right outline-none" containerClassName="w-auto" maxDate={endDate || undefined} />
                    <span className="text-[10px] text-on-surface-variant/40">تا</span>
                    <DatePicker value={endDate} onChange={d => { setEndDate(d as DateObject); setPage(1); }} calendar={persian} locale={persian_fa} format="YYYY/MM/DD" placeholder="تا"
                                inputClass="w-20 bg-transparent text-[11px] text-right outline-none" containerClassName="w-auto" minDate={startDate || undefined} />
                </div>

                {QUICK_RANGES.map(r => (
                    <button key={r.days} onClick={() => {
                        const now = new DateObject({ calendar: persian, locale: persian_fa });
                        setStartDate(now.clone().subtract(r.days, 'days'));
                        setEndDate(now.clone());
                        setPage(1);
                    }} className="px-2.5 py-1.5 text-[11px] rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/30 flex-shrink-0">{r.label}</button>
                ))}

                {hasFilters && (
                    <button onClick={handleClearAll} className="text-xs text-error/70 px-2 py-1.5 rounded-lg flex-shrink-0">پاک کردن</button>
                )}
            </div>

            {/* جدول */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-outline-variant bg-surface-container-low">
                            {['تاریخ', 'کاربر', 'مبلغ', 'اعتبار', 'کسب‌وکار', 'وضعیت', 'فیش', 'جزئیات'].map(label => (
                                <th key={label} className="text-right px-3 py-2.5 text-xs font-semibold text-on-surface-variant whitespace-nowrap">{label}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {payments.length === 0 ? (
                            <tr><td colSpan={8} className="text-center py-12 text-on-surface-variant">هیچ پرداختی یافت نشد</td></tr>
                        ) : payments.map(p => (
                            <tr key={p.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors cursor-pointer"
                                onClick={() => { setSelectedPayment(p); setIsDetailOpen(true); }}>
                                <td className="px-3 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString('fa-IR')}</td>
                                <td className="px-3 py-2.5">
                                    <p className="text-sm font-medium">{p.user?.fullName || 'نامشخص'}</p>
                                    <p className="text-[10px] text-on-surface-variant/50">{p.user?.phone}</p>
                                </td>
                                <td className="px-3 py-2.5 text-sm font-bold whitespace-nowrap">{p.amount?.toLocaleString()} ت</td>
                                <td className="px-3 py-2.5 text-sm whitespace-nowrap">{p.creditCount?.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-xs">
                                    <p>{p.business?.name || '-'}</p>
                                    <p className="text-[10px] text-on-surface-variant/50">{p.business?.city}</p>
                                </td>
                                <td className="px-3 py-2.5">{getStatusBadge(p.status)}</td>
                                <td className="px-3 py-2.5">
                                    {p.receiptImage ? (
                                        <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-outline-variant/30">
                                            <Image src={getImageUrl(p.receiptImage)} alt="فیش" fill className="object-cover" unoptimized />
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-on-surface-variant/40">-</span>
                                    )}
                                </td>
                                <td className="px-3 py-2.5">
                                    <button className="p-1.5 hover:bg-surface-container-high rounded-lg">
                                        <Eye className="w-4 h-4 text-on-surface-variant" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* پیجینگ */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-on-surface-variant">{(page - 1) * 20 + 1} تا {Math.min(page * 20, pagination.total)} از {pagination.total}</span>
                    <div className="flex gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border rounded-lg text-xs disabled:opacity-50">قبلی</button>
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const p = pagination.totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pagination.totalPages - 2 ? pagination.totalPages - 4 + i : page - 2 + i;
                            return <button key={p} onClick={() => setPage(p)} className={cn("w-8 h-8 rounded-lg text-xs", p === page ? "bg-primary text-on-primary" : "border hover:bg-surface-container-low")}>{p.toLocaleString('fa-IR')}</button>;
                        })}
                        <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="px-3 py-1.5 border rounded-lg text-xs disabled:opacity-50">بعدی</button>
                    </div>
                </div>
            )}

            {/* مودال جزئیات */}
            {isDetailOpen && selectedPayment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-surface rounded-t-2xl z-10">
                            <h3 className="text-lg font-semibold">جزئیات فیش</h3>
                            <button onClick={() => { setIsDetailOpen(false); setSelectedPayment(null); }} className="p-1.5 hover:bg-surface-container-high rounded-lg"><XCircle className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className={cn("rounded-xl p-4 text-center",
                                selectedPayment.status === 'approved' ? 'bg-green-50 border border-green-200' :
                                    selectedPayment.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200')}>
                                <p className="text-2xl font-bold">{selectedPayment.amount?.toLocaleString()} تومان</p>
                                <p className="text-sm text-on-surface-variant mt-1">{selectedPayment.creditCount} اعتبار</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {[
                                    ['کاربر', selectedPayment.user?.fullName],
                                    ['موبایل', selectedPayment.user?.phone],
                                    ['کسب‌وکار', selectedPayment.business?.name],
                                    ['شهر', selectedPayment.business?.city],
                                    ['تاریخ', new Date(selectedPayment.createdAt).toLocaleDateString('fa-IR')],
                                    ['وضعیت', selectedPayment.status === 'approved' ? 'تأیید شده' : selectedPayment.status === 'rejected' ? 'رد شده' : 'در انتظار'],
                                ].map(([l, v]) => (
                                    <div key={l} className="bg-surface-container-low p-3 rounded-xl">
                                        <p className="text-[10px] text-on-surface-variant">{l}</p>
                                        <p className="font-medium mt-0.5">{v || '-'}</p>
                                    </div>
                                ))}
                            </div>

                            {selectedPayment.receiptNote && (
                                <div className="bg-surface-container-low p-4 rounded-xl">
                                    <p className="text-xs text-on-surface-variant mb-1">یادداشت</p>
                                    <p className="text-sm">{selectedPayment.receiptNote}</p>
                                </div>
                            )}

                            {selectedPayment.rejectReason && (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                                    <p className="text-xs text-red-600 mb-1">دلیل رد</p>
                                    <p className="text-sm">{selectedPayment.rejectReason}</p>
                                </div>
                            )}

                            {selectedPayment.receiptImage && (
                                <div className="bg-surface-container-low p-4 rounded-xl">
                                    <p className="text-xs text-on-surface-variant mb-2">تصویر فیش</p>
                                    <div className="relative w-full" style={{ minHeight: '200px' }}>
                                        <Image src={getImageUrl(selectedPayment.receiptImage)} alt="فیش" fill className="object-contain rounded-lg" unoptimized />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}