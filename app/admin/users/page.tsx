// app/admin/users/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Search, Filter, X, Loader2, ChevronRight, ChevronLeft,
    User, Phone, Calendar, CheckCircle, XCircle, Clock, Crown,
    Globe, Store, Eye, ArrowUpDown,
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import  DateObject  from 'react-date-object';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

type SortField = 'createdAt' | 'fullName' | 'phone' | 'role' | 'status' | 'lastLoginAt';
const QUICK_RANGES = [
    { label: 'امروز', days: 0 },
    { label: '۷ روز گذشته', days: 7 },
    { label: '۳۰ روز گذشته', days: 30 },
];

export default function AdminUsersPage() {
    const router = useRouter();

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [stats, setStats] = useState<any>({});
    const [arms, setArms] = useState<any[]>([]);

    // فیلترها
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [armFilter, setArmFilter] = useState('all');
    const [phoneFilter, setPhoneFilter] = useState('all');
    const [startDate, setStartDate] = useState<DateObject | null>(null);
    const [endDate, setEndDate] = useState<DateObject | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 20, sortBy: sortField, sortOrder };
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (roleFilter !== 'all') params.role = roleFilter;
            if (armFilter !== 'all') params.armSlug = armFilter;
            if (phoneFilter !== 'all') params.isPhoneVerified = phoneFilter;
            if (startDate) params.startDate = new Date(startDate.valueOf()).toISOString().split('T')[0];
            if (endDate) params.endDate = new Date(endDate.valueOf()).toISOString().split('T')[0];

            const data = await apiService.admin.users.getList(params);
            setUsers(data.items);
            setPagination(data.pagination);
            setStats(data.stats);
        } catch (error: any) {
            toast.error(error?.message || 'خطا');
        } finally {
            setLoading(false);
        }
    };

    const fetchArms = async () => {
        try {
            const data = await apiService.admin.users.getArms();
            setArms(data || []);
        } catch {}
    };

    useEffect(() => { fetchArms(); }, []);
    useEffect(() => { fetchUsers(); }, [page, sortField, sortOrder, armFilter, statusFilter, roleFilter, phoneFilter]);

    const handleQuickRange = (days: number) => {
        const now = new DateObject({ calendar: persian, locale: persian_fa });
        setStartDate(now.clone().subtract(days, 'days'));
        setEndDate(now.clone());
        setShowDatePicker(false);
    };

    const handleApplyDateFilter = () => { setPage(1); fetchUsers(); };
    const handleClearFilters = () => {
        setSearch(''); setStatusFilter('all'); setRoleFilter('all'); setArmFilter('all');
        setPhoneFilter('all'); setStartDate(null); setEndDate(null); setPage(1);
    };

    const hasFilters = search || statusFilter !== 'all' || roleFilter !== 'all' || armFilter !== 'all' || phoneFilter !== 'all' || startDate;

    const getStatusBadge = (status: string) => {
        const map: any = {
            active: { icon: CheckCircle, cls: 'text-green-600 bg-green-50 border-green-200', label: 'فعال' },
            suspended: { icon: Clock, cls: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'تعلیق' },
            banned: { icon: XCircle, cls: 'text-red-600 bg-red-50 border-red-200', label: 'مسدود' },
        };
        const s = map[status] || map.active;
        return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border", s.cls)}><s.icon className="w-3 h-3" />{s.label}</span>;
    };

    if (loading && users.length === 0) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">مدیریت کاربران</h1>
                    <p className="text-sm text-on-surface-variant mt-1">{pagination.total.toLocaleString('fa-IR')} کاربر</p>
                </div>
            </div>

            {/* کارت‌های آماری */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-6">
                {[
                    { label: 'امروز', value: stats.todayNew, color: 'text-blue-600' },
                    { label: '۷ روز', value: stats.weekNew, color: 'text-green-600' },
                    { label: '۳۰ روز', value: stats.monthNew, color: 'text-purple-600' },
                    { label: 'فعال', value: stats.totalActive, color: 'text-emerald-600' },
                    { label: 'تأیید شده', value: stats.totalVerified, color: 'text-primary' },
                ].map(s => (
                    <div key={s.label} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 text-center">
                        <p className={`text-xl font-bold ${s.color}`}>{(s.value || 0).toLocaleString('fa-IR')}</p>
                        <p className="text-[10px] text-on-surface-variant mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* فیلترها */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 mb-4 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی نام یا موبایل..."
                               className="w-full bg-surface border border-outline rounded-xl h-10 pr-10 pl-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                    </div>
                    <button onClick={() => { setShowFilters(!showFilters); setShowDatePicker(false); }}
                            className="flex items-center gap-2 px-4 h-10 rounded-xl border border-outline text-sm hover:border-primary/50 transition-colors">
                        <Filter className="w-4 h-4" />فیلترها {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                    <button onClick={() => { setPage(1); fetchUsers(); }}
                            className="px-4 h-10 bg-primary text-on-primary rounded-xl text-sm hover:bg-primary/90">اعمال</button>
                    {hasFilters && <button onClick={handleClearFilters} className="text-xs text-error hover:underline"><X className="w-3 h-3 inline" /> پاک کردن</button>}
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-3 border-t border-outline-variant/30">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="bg-surface border border-outline rounded-xl h-10 px-3 text-xs">
                            <option value="all">همه وضعیت‌ها</option>
                            <option value="active">فعال</option>
                            <option value="suspended">تعلیق</option>
                            <option value="banned">مسدود</option>
                        </select>
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                className="bg-surface border border-outline rounded-xl h-10 px-3 text-xs">
                            <option value="all">همه نقش‌ها</option>
                            <option value="user">کاربر</option>
                            <option value="admin">ادمین</option>
                            <option value="arm_manager">مالک بازار</option>
                        </select>
                        <select value={armFilter} onChange={e => setArmFilter(e.target.value)}
                                className="bg-surface border border-outline rounded-xl h-10 px-3 text-xs">
                            <option value="all">همه بازارها</option>
                            {arms.map(a => <option key={a.slug} value={a.slug}>{a.name}</option>)}
                        </select>
                        <select value={phoneFilter} onChange={e => setPhoneFilter(e.target.value)}
                                className="bg-surface border border-outline rounded-xl h-10 px-3 text-xs">
                            <option value="all">تأیید موبایل</option>
                            <option value="true">تأیید شده</option>
                            <option value="false">تأیید نشده</option>
                        </select>
                        <button onClick={() => setShowDatePicker(!showDatePicker)}
                                className={cn("flex items-center gap-2 h-10 px-3 rounded-xl border text-xs", startDate ? "bg-primary/5 border-primary/30" : "bg-surface border-outline")}>
                            <Calendar className="w-4 h-4" />
                            {startDate ? `${startDate.format('YYYY/MM/DD')} تا ${endDate?.format('YYYY/MM/DD')}` : 'بازه زمانی'}
                        </button>
                    </div>
                )}

                {showDatePicker && (
                    <div className="space-y-3 pt-3 border-t border-outline-variant/30">
                        {/*<div className="flex gap-2">
                            {QUICK_RANGES.map(r => (
                                <button key={r.days} onClick={() => handleQuickRange(r.days)}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-outline bg-surface hover:border-primary/40">{r.label}</button>
                            ))}
                        </div>*/}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <DatePicker value={startDate} onChange={d => setStartDate(d as DateObject)} calendar={persian} locale={persian_fa} format="YYYY/MM/DD" placeholder="از تاریخ"
                                        inputClass="w-full bg-surface border border-outline rounded-xl h-10 px-3 text-xs text-right" containerClassName="w-full" maxDate={endDate || undefined} />
                            <DatePicker value={endDate} onChange={d => setEndDate(d as DateObject)} calendar={persian} locale={persian_fa} format="YYYY/MM/DD" placeholder="تا تاریخ"
                                        inputClass="w-full bg-surface border border-outline rounded-xl h-10 px-3 text-xs text-right" containerClassName="w-full" minDate={startDate || undefined} />
                        </div>
                    </div>
                )}
            </div>

            {/* جدول */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-outline-variant bg-surface-container-low">
                            {[
                                { key: 'fullName', label: 'نام' },
                                { key: 'phone', label: 'موبایل' },
                                { key: 'role', label: 'نقش' },
                                { key: 'status', label: 'وضعیت' },
                                { key: 'createdAt', label: 'تاریخ ثبت نام' },
                                { key: null, label: 'بازارها' },
                                { key: null, label: 'عملیات' },
                            ].map(col => (
                                <th key={col.key || col.label} className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant whitespace-nowrap">
                                    {col.key ? (
                                        <button onClick={() => {
                                            if (sortField === col.key) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                                            else { setSortField(col.key as SortField); setSortOrder('desc'); }
                                        }} className="flex items-center gap-1 hover:text-primary">
                                            {col.label} {sortField === col.key && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </button>
                                    ) : col.label}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {users.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-on-surface-variant">هیچ کاربری یافت نشد</td></tr>
                        ) : users.map(u => (
                            <tr key={u.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors cursor-pointer"
                                onClick={() => router.push(`/admin/users/${u.id}`)}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-on-surface">{u.fullName || 'بدون نام'}</p>
                                            {u.isPhoneVerified && <CheckCircle className="w-3 h-3 text-green-500 inline" />}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm font-mono text-on-surface" dir="ltr">{u.phone}</td>
                                <td className="px-4 py-3 text-xs">{u.role === 'system_admin' ? <span className="text-purple-600">ادمین</span> : u.role === 'arm_manager' ? 'مالک بازار' : 'کاربر'}</td>
                                <td className="px-4 py-3">{getStatusBadge(u.status)}</td>
                                <td className="px-4 py-3 text-xs text-on-surface-variant">{new Date(u.createdAt).toLocaleDateString('fa-IR')}</td>
                                <td className="px-4 py-3 text-xs">{u._count?.armMemberships || 0} بازار</td>
                                <td className="px-4 py-3"><Eye className="w-4 h-4 text-on-surface-variant" /></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* پیجینگ */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-on-surface-variant">
                        {(pagination.page - 1) * pagination.limit + 1} تا {Math.min(pagination.page * pagination.limit, pagination.total)} از {pagination.total}
                    </span>
                    <div className="flex gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-3 py-1.5 border rounded-lg text-xs disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const p = pagination.totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pagination.totalPages - 2 ? pagination.totalPages - 4 + i : page - 2 + i;
                            return <button key={p} onClick={() => setPage(p)}
                                           className={cn("w-8 h-8 rounded-lg text-xs", p === page ? "bg-primary text-on-primary" : "border hover:bg-surface-container-low")}>{p.toLocaleString('fa-IR')}</button>;
                        })}
                        <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                                className="px-3 py-1.5 border rounded-lg text-xs disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
        </div>
    );
}