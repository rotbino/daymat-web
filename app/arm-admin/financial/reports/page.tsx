// app/arm-admin/financial/reports/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    BarChart3,
    Download,
    Calendar as CalendarIcon,
    TrendingUp,
    TrendingDown,
    Loader2,
    Filter,
    X,
    Search,
    ArrowUpDown,
    ChevronDown,
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import  DateObject  from 'react-date-object';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Transaction {
    id: string;
    amount: number;
    creditCount: number;
    user: string;
    date: string;
    type: 'purchase' | 'spend';
    paymentMethod?: 'online' | 'manual';
    status: string;
}

interface ReportSummary {
    totalIncome: number;
    totalCredits: number;
    averageDaily: number;
    totalTransactions: number;
}

type SortField = 'date' | 'amount' | 'user' | 'creditCount';
type SortOrder = 'asc' | 'desc';

const QUICK_RANGES = [
    { label: 'امروز', days: 0 },
    { label: '۷ روز گذشته', days: 7 },
    { label: '۳۰ روز گذشته', days: 30 },
    { label: '۹۰ روز گذشته', days: 90 },
];

export default function FinancialReportsPage() {
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [startDate, setStartDate] = useState<DateObject | null>(null);
    const [endDate, setEndDate] = useState<DateObject | null>(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'online' | 'manual'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'purchase' | 'spend'>('all');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // ============================================================
    // ✅ واکشی داده‌ها
    // ============================================================
    // app/arm-admin/financial/reports/page.tsx

    const fetchData = async (start?: DateObject, end?: DateObject) => {
        if (!currentSlug) return;

        setLoading(true);
        try {
            const params: any = {};
            if (start && end) {
                params.startDate = new Date(start.valueOf()).toISOString().split('T')[0];
                params.endDate = new Date(end.valueOf()).toISOString().split('T')[0];
            }

            // ✅ استفاده از API واقعی
            const data = await apiService.armAdmin.getFinancialReport(currentSlug, params);

            // تبدیل داده‌های دریافتی به فرمت مورد نظر
            const transactions: Transaction[] = (data.transactions || []).map((tx: any) => ({
                id: tx.id,
                amount: tx.amount || 0,
                creditCount: tx.creditCount || 0,
                user: tx.user || 'کاربر ناشناس',
                date: tx.date || new Date().toISOString(),
                type: tx.type === 'purchase' ? 'purchase' : 'spend',
                paymentMethod: tx.paymentMethod || 'manual',  // ✅ مقدار پیش‌فرض
                status: tx.status || 'تکمیل شده',
            }));

            setTransactions(transactions);
            setFilteredTransactions(transactions);

            // محاسبه خلاصه از داده‌های واقعی
            const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);
            const totalCredits = transactions.reduce((sum, t) => sum + t.creditCount, 0);
            const daysDiff = start && end
                ? Math.ceil((end.valueOf() - start.valueOf()) / (1000 * 60 * 60 * 24))
                : 30;

            setSummary({
                totalIncome,
                totalCredits,
                averageDaily: daysDiff > 0 ? totalIncome / daysDiff : totalIncome,
                totalTransactions: transactions.length,
            });
        } catch (error: any) {
            console.error('Error fetching report:', error);
            toast.error(error?.message || 'خطا در دریافت گزارش');
            // در صورت خطا، داده‌ها رو خالی کن
            setTransactions([]);
            setFilteredTransactions([]);
            setSummary({
                totalIncome: 0,
                totalCredits: 0,
                averageDaily: 0,
                totalTransactions: 0,
            });
        } finally {
            setLoading(false);
            setIsFiltering(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentSlug]);

    // ============================================================
    // ✅ فیلترها و سورت
    // ============================================================
    useEffect(() => {
        let result = [...transactions];

        // جستجو
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            result = result.filter(tx =>
                tx.user.toLowerCase().includes(query)
            );
        }

        // فیلتر روش پرداخت
        if (paymentFilter !== 'all') {
            result = result.filter(tx => tx.paymentMethod === paymentFilter);
        }

        // فیلتر نوع تراکنش
        if (typeFilter !== 'all') {
            result = result.filter(tx => tx.type === typeFilter);
        }

        // سورت
        result.sort((a, b) => {
            let compareA: any = a[sortField];
            let compareB: any = b[sortField];

            if (sortField === 'date') {
                compareA = new Date(a.date).getTime();
                compareB = new Date(b.date).getTime();
            }

            if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredTransactions(result);
    }, [transactions, searchQuery, paymentFilter, typeFilter, sortField, sortOrder]);

    // ============================================================
    // ✅ اعمال فیلتر تاریخ
    // ============================================================
    const handleApplyFilter = (start?: DateObject, end?: DateObject) => {
        if (start && end && start.valueOf() > end.valueOf()) {
            toast.error('تاریخ شروع نباید از تاریخ پایان بزرگتر باشد');
            return;
        }
        setIsFiltering(true);
        setStartDate(start || null);
        setEndDate(end || null);
        fetchData(start, end);
        setShowDatePicker(false);
    };

    const handleQuickRange = (days: number) => {
        const now = new DateObject({ calendar: persian, locale: persian_fa });
        const start = now.clone().subtract(days, 'days');
        const end = now.clone();
        setStartDate(start);
        setEndDate(end);
        handleApplyFilter(start, end);
    };

    const handleClearFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setSearchQuery('');
        setPaymentFilter('all');
        setTypeFilter('all');
        setShowDatePicker(false);
        fetchData();
    };

    // ============================================================
    // ✅ سورت
    // ============================================================
    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
        setShowSortMenu(false);
    };

    const getSortLabel = (field: SortField) => {
        const labels = {
            date: 'تاریخ',
            amount: 'مبلغ',
            user: 'کاربر',
            creditCount: 'تعداد اعتبار',
        };
        return labels[field];
    };

    // ============================================================
    // ✅ خروجی Excel
    // ============================================================
    const handleExport = () => {
        toast.info('قابلیت خروجی Excel به زودی اضافه می‌شود');
    };

    // ============================================================
    // ✅ فرمت تاریخ
    // ============================================================
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getTypeBadge = (type: string) => {
        return type === 'purchase' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                <TrendingUp className="w-3 h-3" />
                خرید
            </span>
        ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full">
                <TrendingDown className="w-3 h-3" />
                مصرف
            </span>
        );
    };

    const getPaymentBadge = (method?: string) => {
        if (!method) return null;
        return method === 'online' ? (
            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">آنلاین</span>
        ) : (
            <span className="text-[10px] bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded-full">فیشی</span>
        );
    };

    // ============================================================
    // ✅ نمایش بازه انتخاب شده
    // ============================================================
    const getRangeDisplay = () => {
        if (startDate && endDate) {
            const start = new Date(startDate.valueOf());
            const end = new Date(endDate.valueOf());
            return `${start.toLocaleDateString('fa-IR')} - ${end.toLocaleDateString('fa-IR')}`;
        }
        return 'انتخاب بازه زمانی';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-on-surface-variant">در حال بارگذاری گزارش...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* هدر */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">گزارش واریزها و درآمد</h1>
                    <p className="text-sm text-on-surface-variant">
                        {currentArm?.name || currentSlug} | گزارشات کامل مالی بازار
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                    <Download className="w-4 h-4" />
                    خروجی Excel
                </button>
            </div>

            {/* فیلترها */}
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl mb-6 space-y-4">
                {/* ردیف اول: تاریخ + دکمه‌های سریع */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline rounded-lg text-sm hover:border-primary/50 transition-colors"
                    >
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        <span className={startDate && endDate ? "text-on-surface" : "text-on-surface-variant"}>
                            {getRangeDisplay()}
                        </span>
                        {showDatePicker ? <X className="w-4 h-4 text-on-surface-variant" /> : <Filter className="w-4 h-4 text-on-surface-variant" />}
                    </button>

                    {QUICK_RANGES.map((range) => (
                        <button
                            key={range.days}
                            onClick={() => handleQuickRange(range.days)}
                            className="px-3 py-1.5 text-xs bg-surface-container-lowest border border-outline rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                            {range.label}
                        </button>
                    ))}

                    {(startDate || endDate || searchQuery || paymentFilter !== 'all' || typeFilter !== 'all') && (
                        <button
                            onClick={handleClearFilter}
                            className="text-xs text-error hover:underline flex items-center gap-1"
                        >
                            <X className="w-3 h-3" />
                            پاک کردن همه
                        </button>
                    )}
                </div>

                {/* ردیف دوم: جستجو + فیلترها */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* جستجو */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="جستجوی کاربر..."
                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 pr-9 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>

                    {/* فیلتر روش پرداخت */}
                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value as any)}
                        className="bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-w-[120px]"
                    >
                        <option value="all">همه روش‌ها</option>
                        <option value="online">آنلاین</option>
                        <option value="manual">فیشی</option>
                    </select>

                    {/* فیلتر نوع تراکنش */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-w-[120px]"
                    >
                        <option value="all">همه تراکنش‌ها</option>
                        <option value="purchase">خرید</option>
                        <option value="spend">مصرف</option>
                    </select>

                    {/* سورت */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            className="flex items-center gap-1 px-3 py-2 bg-surface-container-lowest border border-outline rounded-lg text-sm hover:border-primary/50 transition-colors"
                        >
                            <ArrowUpDown className="w-4 h-4 text-on-surface-variant" />
                            <span>مرتب‌سازی</span>
                            <ChevronDown className="w-3 h-3 text-on-surface-variant" />
                        </button>
                        {showSortMenu && (
                            <div className="absolute top-full left-0 mt-1 bg-surface border border-outline rounded-lg shadow-lg z-20 min-w-[160px] overflow-hidden">
                                {(['date', 'amount', 'user', 'creditCount'] as SortField[]).map((field) => (
                                    <button
                                        key={field}
                                        onClick={() => toggleSort(field)}
                                        className={cn(
                                            "w-full text-right px-4 py-2 text-sm hover:bg-surface-container-low transition-colors flex items-center justify-between",
                                            sortField === field ? "bg-primary/5 text-primary" : "text-on-surface"
                                        )}
                                    >
                                        <span>{getSortLabel(field)}</span>
                                        {sortField === field && (
                                            <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* DatePicker */}
                {showDatePicker && (
                    <div className="relative">
                        <div className="bg-surface shadow-xl rounded-xl border border-outline-variant p-4 w-full">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium text-on-surface">انتخاب بازه زمانی</h4>
                                <button
                                    onClick={() => setShowDatePicker(false)}
                                    className="text-on-surface-variant hover:text-primary transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-on-surface-variant block mb-1">از تاریخ</label>
                                    <DatePicker
                                        value={startDate}
                                        onChange={(date) => setStartDate(date as DateObject)}
                                        calendar={persian}
                                        locale={persian_fa}
                                        calendarPosition="bottom-right"
                                        format="YYYY/MM/DD"
                                        placeholder="انتخاب تاریخ شروع"
                                        inputClass="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        containerClassName="w-full"
                                        maxDate={endDate || undefined}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-on-surface-variant block mb-1">تا تاریخ</label>
                                    <DatePicker
                                        value={endDate}
                                        onChange={(date) => setEndDate(date as DateObject)}
                                        calendar={persian}
                                        locale={persian_fa}
                                        calendarPosition="bottom-right"
                                        format="YYYY/MM/DD"
                                        placeholder="انتخاب تاریخ پایان"
                                        inputClass="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm text-right focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        containerClassName="w-full"
                                        minDate={startDate || undefined}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-3 border-t border-outline-variant">
                                <button
                                    onClick={() => handleApplyFilter(startDate || undefined, endDate || undefined)}
                                    disabled={isFiltering}
                                    className="flex-1 bg-primary text-on-primary py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {isFiltering ? 'در حال اعمال...' : 'اعمال فیلتر'}
                                </button>
                                <button
                                    onClick={() => {
                                        setStartDate(null);
                                        setEndDate(null);
                                    }}
                                    className="px-4 py-2 border border-outline text-on-surface rounded-lg text-sm hover:bg-surface-container-low transition-colors"
                                >
                                    پاک کردن
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* خلاصه */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                    <p className="text-sm text-green-700">کل درآمد</p>
                    <p className="text-2xl font-bold text-green-700">
                        {summary?.totalIncome.toLocaleString() || 0} تومان
                    </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <p className="text-sm text-blue-700">کل اعتبارات فروخته شده</p>
                    <p className="text-2xl font-bold text-blue-700">
                        {summary?.totalCredits.toLocaleString() || 0} اعتبار
                    </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                    <p className="text-sm text-purple-700">میانگین درآمد روزانه</p>
                    <p className="text-2xl font-bold text-purple-700">
                        {Math.round(summary?.averageDaily || 0).toLocaleString()} تومان
                    </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                    <p className="text-sm text-orange-700">تعداد تراکنش‌ها</p>
                    <p className="text-2xl font-bold text-orange-700">
                        {summary?.totalTransactions || 0}
                    </p>
                </div>
            </div>

            {/* جدول */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-outline-variant bg-surface-container">
                            <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant">تاریخ</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant">کاربر</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant">تعداد اعتبار</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant">مبلغ (تومان)</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant">نوع</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant">روش پرداخت</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-on-surface-variant">وضعیت</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-outline-variant/30 hover:bg-surface-container transition-colors">
                                    <td className="px-4 py-3 text-sm text-on-surface">{formatDate(tx.date)}</td>
                                    <td className="px-4 py-3 text-sm text-on-surface">{tx.user}</td>
                                    <td className="px-4 py-3 text-sm font-mono text-on-surface">{tx.creditCount.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm font-mono text-on-surface">{tx.amount.toLocaleString()}</td>
                                    <td className="px-4 py-3">{getTypeBadge(tx.type)}</td>
                                    <td className="px-4 py-3">{getPaymentBadge(tx.paymentMethod)}</td>
                                    <td className="px-4 py-3 text-sm text-on-surface-variant">{tx.status}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-on-surface-variant">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-on-surface-variant/30" />
                                    <p>هیچ داده‌ای برای نمایش وجود ندارد</p>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}