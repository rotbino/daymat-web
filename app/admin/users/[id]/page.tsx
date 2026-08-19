// app/admin/users/[id]/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    User, Building2, Package, CreditCard, AlertCircle, ArrowRight,
    Loader2, Crown, CheckCircle, XCircle, Clock, Search,
    RefreshCw, Inbox, Calendar as CalendarIcon, Phone,
    MapPin, Globe, Shield, Ban, UserCheck, Store,
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import  DateObject  from 'react-date-object';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

type TabType = 'info' | 'businesses' | 'ads' | 'payments' | 'memberships';
type TransactionStatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'success' | 'failed';

const QUICK_RANGES = [
    { label: 'امروز', days: 0 },
    { label: '۷ روز گذشته', days: 7 },
    { label: '۳۰ روز گذشته', days: 30 },
];

export default function AdminUserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('info');
    const [error, setError] = useState<string | null>(null);

    // فیلتر تراکنش‌ها
    const [txFilter, setTxFilter] = useState<TransactionStatusFilter>('all');
    const [txSearch, setTxSearch] = useState('');
    const [txStartDate, setTxStartDate] = useState<DateObject | null>(null);
    const [txEndDate, setTxEndDate] = useState<DateObject | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // اسکرول تب‌ها
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // ============================================================
    // واکشی
    // ============================================================
    const fetchUser = async (showLoading = true) => {
        if (!userId) return;
        if (showLoading) setLoading(true); else setRefreshing(true);
        try {
            const data = await apiService.admin.users.getDetail(userId);
            setUserData(data);
            setError(null);
        } catch (error: any) {
            setError(error?.message || 'خطا');
            toast.error(error?.message || 'خطا');
            if (error?.response?.status === 404) router.push('/admin/users');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchUser(); }, [userId]);

    // ============================================================
    // تب‌ها
    // ============================================================
    const tabs: { id: TabType; label: string; icon: any; count?: number }[] = [
        { id: 'info', label: 'اطلاعات پایه', icon: User },
        { id: 'businesses', label: 'کسب‌وکارها', icon: Building2, count: userData?.businesses?.length || 0 },
        { id: 'ads', label: 'آگهی‌ها', icon: Package, count: userData?.ads?.length || 0 },
        { id: 'payments', label: 'تراکنش‌ها', icon: CreditCard, count: userData?.allTransactions?.length || 0 },
        { id: 'memberships', label: 'عضویت در بازارها', icon: Store, count: userData?.armMemberships?.length || 0 },
    ];

    // اسکرول
    const checkScroll = () => {
        const c = scrollContainerRef.current;
        if (!c) return;
        setCanScrollLeft(c.scrollLeft > 0);
        setCanScrollRight(c.scrollLeft < c.scrollWidth - c.clientWidth - 1);
    };
    useEffect(() => {
        const c = scrollContainerRef.current;
        if (!c) return;
        const t = setTimeout(checkScroll, 100);
        c.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('resize', checkScroll);
        return () => { clearTimeout(t); c.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll); };
    }, [userData]);

    useEffect(() => {
        const el = document.getElementById(`tab-btn-${activeTab}`);
        el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [activeTab]);

    // ============================================================
    // تاریخ
    // ============================================================
    const handleQuickRange = (days: number) => {
        const now = new DateObject({ calendar: persian, locale: persian_fa });
        setTxStartDate(now.clone().subtract(days, 'days'));
        setTxEndDate(now.clone());
        setShowDatePicker(false);
    };
    const clearDate = () => { setTxStartDate(null); setTxEndDate(null); };

    // ============================================================
    // فیلتر تراکنش‌ها
    // ============================================================
    const filteredTransactions = useMemo(() => {
        const txs = userData?.allTransactions || [];
        let result = [...txs];
        if (txStartDate && txEndDate) {
            const s = txStartDate.valueOf();
            const e = txEndDate.valueOf() + 86400000 - 1;
            result = result.filter((tx: any) => {
                const d = new Date(tx.date).getTime();
                return d >= s && d <= e;
            });
        }
        if (txFilter !== 'all') {
            result = result.filter((tx: any) => {
                const s = tx.statusRaw || tx.status;
                const map: any = { pending: ['pending', 'در انتظار'], approved: ['approved', 'تأیید شده'], rejected: ['rejected', 'رد شده'], success: ['success', 'موفق'], failed: ['failed', 'ناموفق'] };
                return map[txFilter]?.includes(s);
            });
        }
        if (txSearch.trim()) {
            const q = txSearch.trim().toLowerCase();
            result = result.filter((tx: any) =>
                (tx.description || '').toLowerCase().includes(q) ||
                (tx.id || '').toLowerCase().includes(q) ||
                (tx.arm?.name || '').toLowerCase().includes(q)
            );
        }
        return result;
    }, [userData?.allTransactions, txFilter, txSearch, txStartDate, txEndDate]);

    const txStats = useMemo(() => {
        const txs = userData?.allTransactions || [];
        return {
            total: txs.length,
            pending: txs.filter((t: any) => t.statusRaw === 'pending' || t.status === 'در انتظار').length,
            success: txs.filter((t: any) => ['success', 'approved'].includes(t.statusRaw) || ['موفق', 'تأیید شده'].includes(t.status)).length,
            failed: txs.filter((t: any) => ['rejected', 'failed'].includes(t.statusRaw) || ['رد شده', 'ناموفق'].includes(t.status)).length,
        };
    }, [userData?.allTransactions]);

    // ============================================================
    // تغییر وضعیت کاربر
    // ============================================================
    const handleStatusChange = async (status: string) => {
        try {
            await apiService.admin.users.updateStatus(userId, status);
            toast.success('وضعیت کاربر تغییر کرد');
            fetchUser(false);
        } catch (error: any) {
            toast.error(error?.message || 'خطا');
        }
    };

    // ============================================================
    // بج‌ها
    // ============================================================
    const getStatusBadge = (status: string) => {
        const map: any = {
            active: { icon: CheckCircle, cls: 'bg-green-50 text-green-600 border-green-200', label: 'فعال' },
            suspended: { icon: Clock, cls: 'bg-yellow-50 text-yellow-600 border-yellow-200', label: 'تعلیق' },
            banned: { icon: XCircle, cls: 'bg-red-50 text-red-600 border-red-200', label: 'مسدود' },
        };
        const s = map[status] || map.active;
        return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border", s.cls)}><s.icon className="w-3 h-3" />{s.label}</span>;
    };
    const getRoleBadge = (role: string) => {
        if (role === 'system_admin') return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border bg-purple-50 text-purple-600 border-purple-200"><Crown className="w-3 h-3" />ادمین</span>;
        if (role === 'arm_manager') return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border bg-blue-50 text-blue-600 border-blue-200">مالک بازار</span>;
        return <span className="text-xs text-on-surface-variant">کاربر</span>;
    };

    // ============================================================
    // لودینگ
    // ============================================================
    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    if (error && !userData) return <div className="text-center py-16"><AlertCircle className="w-16 h-16 text-error mx-auto mb-4" /><p>{error}</p></div>;
    if (!userData) return null;

    const formatDate = (d: string) => new Date(d).toLocaleDateString('fa-IR');

    return (
        <div className="pb-8">
            {/* هدر */}
            <div className="flex items-start sm:items-center gap-3 mb-6 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30">
                <button onClick={() => router.push('/admin/users')} className="p-2 hover:bg-surface-container-high rounded-lg">
                    <ArrowRight className="w-5 h-5 text-on-surface-variant" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg sm:text-xl font-bold truncate">{userData.fullName || 'کاربر ناشناس'}</h1>
                        {getRoleBadge(userData.role)}
                        {getStatusBadge(userData.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-on-surface-variant" dir="ltr">{userData.phone}</p>
                        {userData.isPhoneVerified ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {userData.status !== 'active' && (
                        <button onClick={() => handleStatusChange('active')} className="p-2 hover:bg-green-50 hover:text-green-600 rounded-lg" title="فعال"><UserCheck className="w-4 h-4" /></button>
                    )}
                    {userData.status !== 'suspended' && (
                        <button onClick={() => handleStatusChange('suspended')} className="p-2 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg" title="تعلیق"><Clock className="w-4 h-4" /></button>
                    )}
                    {userData.status !== 'banned' && (
                        <button onClick={() => handleStatusChange('banned')} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg" title="مسدود"><Ban className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => fetchUser(false)} disabled={refreshing} className="p-2 hover:bg-surface-container-high rounded-lg">
                        <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* تب‌ها */}
            <div className="relative mb-0 bg-surface-container-lowest rounded-t-xl border border-b-0 border-outline-variant/30">
                <div ref={scrollContainerRef} className="no-scrollbar" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ display: 'flex', gap: '4px', width: 'max-content', paddingLeft: '8px', paddingTop: '8px', height: '100%', alignItems: 'flex-end' }}>
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id} id={`tab-btn-${tab.id}`} onClick={() => setActiveTab(tab.id)}
                                        className={cn("relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap flex-shrink-0",
                                            isActive ? "text-primary bg-surface border-b-[3px] border-primary rounded-t-lg z-10" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low border-b-[3px] border-transparent rounded-t-lg")}>
                                    <Icon className="w-4 h-4" /><span>{tab.label}</span>
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className={cn("text-[10px] min-w-[20px] text-center px-1.5 py-0.5 rounded-full", isActive ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant")}>
                                            {tab.count.toLocaleString('fa-IR')}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div style={{ height: '52px' }}></div>
                {canScrollRight && <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-l from-surface-container-lowest to-transparent pointer-events-none z-[5]" />}
                {canScrollLeft && <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-r from-surface-container-lowest to-transparent pointer-events-none z-[5]" />}
            </div>

            {/* محتوا */}
            <div className="bg-surface-container-lowest border border-t-0 border-outline-variant/30 rounded-b-xl p-4 sm:p-6">

                {/* ══════════ اطلاعات پایه ══════════ */}
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <InfoCard label="موبایل" value={userData.phone} icon={Phone} dir="ltr" />
                        <InfoCard label="نقش" value={userData.role === 'system_admin' ? 'ادمین' : userData.role === 'arm_manager' ? 'مالک بازار' : 'کاربر'} icon={Shield} />
                        <InfoCard label="وضعیت" value={userData.status === 'active' ? 'فعال' : userData.status === 'suspended' ? 'تعلیق' : 'مسدود'} icon={userData.status === 'active' ? CheckCircle : XCircle} />
                        <InfoCard label="تأیید موبایل" value={userData.isPhoneVerified ? 'تأیید شده' : 'تأیید نشده'} icon={userData.isPhoneVerified ? CheckCircle : Clock} />
                        <InfoCard label="تاریخ عضویت" value={formatDate(userData.createdAt)} icon={CalendarIcon} />
                        <InfoCard label="آخرین ورود" value={userData.lastLoginAt ? formatDate(userData.lastLoginAt) : 'ندارد'} icon={Clock} />
                        <InfoCard label="اشتراک" value={userData.membershipTier === 'free' ? 'رایگان' : userData.membershipTier} icon={Crown} />
                        <InfoCard label="زبان" value={userData.locale === 'fa' ? 'فارسی' : userData.locale} icon={Globe} />
                        <InfoCard label="کسب‌وکارها" value={`${userData.businesses?.length || 0} عدد`} icon={Building2} />
                        <InfoCard label="بازارها" value={`${userData.armMemberships?.length || 0} بازار`} icon={Store} />
                        <InfoCard label="آگهی‌ها" value={`${userData.ads?.length || 0} عدد`} icon={Package} />
                        <InfoCard label="تراکنش‌ها" value={`${userData.allTransactions?.length || 0} عدد`} icon={CreditCard} />
                    </div>
                )}

                {/* ══════════ کسب‌وکارها ══════════ */}
                {activeTab === 'businesses' && (
                    userData.businesses?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {userData.businesses.map((b: any) => (
                                <div key={b.id} className="bg-surface rounded-xl border border-outline-variant/20 p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <Building2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-sm">{b.name}</p>
                                            <p className="text-xs text-on-surface-variant">{b.type}</p>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-on-surface-variant">
                                                <MapPin className="w-3 h-3" />{b.city}، {b.province}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                                                    b.verificationTier === 'gold' ? 'bg-yellow-50 text-yellow-700' :
                                                        b.verificationTier === 'silver' ? 'bg-gray-100 text-gray-600' :
                                                            b.verificationTier === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-surface-container-high text-on-surface-variant')}>
                                                    {b.verificationTier === 'none' ? 'عادی' : b.verificationTier}
                                                </span>
                                                <span className="text-[10px] text-on-surface-variant">{b._count?.ads || 0} آگهی</span>
                                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                                                    b.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                                                    {b.status === 'active' ? 'فعال' : b.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <EmptyState icon={Building2} text="هیچ کسب‌وکاری ثبت نشده" />
                )}

                {/* ══════════ آگهی‌ها ══════════ */}
                {activeTab === 'ads' && (
                    userData.ads?.length > 0 ? (
                        <div className="space-y-2">
                            {userData.ads.map((ad: any) => (
                                <div key={ad.id} className="bg-surface rounded-xl border border-outline-variant/20 p-3 flex items-center justify-between flex-wrap gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{ad.title}</p>
                                        <p className="text-xs text-on-surface-variant">{ad.category?.title} | {ad.arm?.name}</p>
                                    </div>
                                    <div className="text-left flex-shrink-0 flex items-center gap-3">
                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                                            ad.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                                            {ad.status === 'active' ? 'فعال' : ad.status}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold">{ad.unitPrice?.toLocaleString()} تومان</p>
                                            <p className="text-[10px] text-on-surface-variant">{formatDate(ad.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <EmptyState icon={Package} text="هیچ آگهی ثبت نشده" />
                )}

                {/* ══════════ تراکنش‌ها ══════════ */}
                {activeTab === 'payments' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <StatBox value={txStats.total} label="کل" color="text-primary" />
                            <StatBox value={txStats.pending} label="در انتظار" color="text-yellow-600" />
                            <StatBox value={txStats.success} label="موفق" color="text-green-600" />
                            <StatBox value={txStats.failed} label="ناموفق" color="text-red-600" />
                        </div>

                        <div className="bg-surface p-4 rounded-xl border border-outline-variant/20 space-y-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                                    <input type="text" value={txSearch} onChange={e => setTxSearch(e.target.value)} placeholder="جستجو..."
                                           className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 pr-10 pl-3 text-xs" />
                                </div>
                                <button onClick={() => setShowDatePicker(!showDatePicker)}
                                        className={cn("flex items-center gap-2 px-3 h-10 rounded-lg border text-xs whitespace-nowrap", txStartDate ? "bg-primary/5 border-primary/30" : "bg-surface-container-lowest border-outline")}>
                                    <CalendarIcon className="w-4 h-4" />
                                    {txStartDate ? `${txStartDate.format('YYYY/MM/DD')} تا ${txEndDate?.format('YYYY/MM/DD')}` : 'بازه زمانی'}
                                </button>
                                {(txFilter !== 'all' || txSearch || txStartDate) && (
                                    <button onClick={() => { setTxFilter('all'); setTxSearch(''); clearDate(); }} className="text-xs text-error whitespace-nowrap">پاک کردن</button>
                                )}
                            </div>

                            {showDatePicker && (
                                <div className="space-y-2">
                                    <div className="flex gap-2">{QUICK_RANGES.map(r => <button key={r.days} onClick={() => handleQuickRange(r.days)} className="px-3 py-1.5 text-xs rounded-lg border bg-surface-container-lowest">{r.label}</button>)}</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <DatePicker value={txStartDate} onChange={d => setTxStartDate(d as DateObject)} calendar={persian} locale={persian_fa} format="YYYY/MM/DD" placeholder="از" inputClass="w-full bg-surface-container-lowest border rounded-lg h-10 px-3 text-xs" containerClassName="w-full" maxDate={txEndDate || undefined} />
                                        <DatePicker value={txEndDate} onChange={d => setTxEndDate(d as DateObject)} calendar={persian} locale={persian_fa} format="YYYY/MM/DD" placeholder="تا" inputClass="w-full bg-surface-container-lowest border rounded-lg h-10 px-3 text-xs" containerClassName="w-full" minDate={txStartDate || undefined} />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { id: 'all', label: 'همه' },
                                    { id: 'pending', label: 'در انتظار' },
                                    { id: 'approved', label: 'تأیید شده' },
                                    { id: 'rejected', label: 'رد شده' },
                                ].map(f => (
                                    <button key={f.id} onClick={() => setTxFilter(f.id as any)}
                                            className={cn("px-3 py-1.5 text-xs rounded-lg border transition-all",
                                                txFilter === f.id ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest border-outline hover:border-primary/30")}>{f.label}</button>
                                ))}
                            </div>
                        </div>

                        {filteredTransactions.length > 0 ? (
                            <div className="space-y-2">
                                {filteredTransactions.map((tx: any) => (
                                    <div key={tx.id} className="bg-surface rounded-xl border border-outline-variant/20 p-3 flex items-center justify-between flex-wrap gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">{tx.creditCount || 0} اعتبار</p>
                                            <p className="text-xs text-on-surface-variant truncate">{tx.description} {tx.arm && `| ${tx.arm.name}`}</p>
                                        </div>
                                        <div className="text-left flex-shrink-0 flex items-center gap-3">
                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                                                tx.status === 'موفق' || tx.status === 'تأیید شده' ? "bg-green-50 text-green-600" :
                                                    tx.status === 'در انتظار' ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600")}>{tx.status}</span>
                                            <p className="text-sm font-bold">{(tx.amount || 0).toLocaleString()} تومان</p>
                                            <p className="text-[10px] text-on-surface-variant">{formatDate(tx.date)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState icon={CreditCard} text={userData.allTransactions?.length === 0 ? 'هیچ تراکنشی ثبت نشده' : 'نتیجه‌ای یافت نشد'} />
                        )}
                    </div>
                )}

                {/* ══════════ عضویت در بازارها ══════════ */}
                {/* ══════════ عضویت در بازارها ══════════ */}
                {activeTab === 'memberships' && (
                    userData.armMemberships?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {userData.armMemberships.map((m: any) => {
                                const ROLE_OPTIONS = [
                                    { value: 'arm_owner', label: 'مدیر کانال' },
                                    { value: 'arm_seller', label: 'فروشنده' },
                                    { value: 'arm_buyer', label: 'خریدار' },
                                    { value: 'arm_member', label: 'عضو عادی' },
                                ];

                                const handleRoleChange = async (armSlug: string, newRole: string) => {
                                    try {
                                        await apiService.admin.users.updateArmRole(userId, armSlug, newRole);
                                        // به‌روزرسانی state بدون رفرش کامل
                                        setUserData((prev: any) => ({
                                            ...prev,
                                            armMemberships: prev.armMemberships.map((mem: any) =>
                                                mem.arm.slug === armSlug ? { ...mem, role: newRole } : mem
                                            ),
                                        }));
                                        toast.success('نقش کاربر تغییر کرد');
                                    } catch (error: any) {
                                        toast.error(error?.message || 'خطا در تغییر نقش');
                                    }
                                };

                                return (
                                    <div key={m.id} className="bg-surface rounded-xl border border-outline-variant/20 p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: m.arm?.colorPrimary || '#8b0000' }}>
                                                {m.arm?.name?.[0] || 'ب'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm truncate">{m.arm?.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                                        m.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                                        {m.status === 'active' ? 'فعال' : m.status}
                                    </span>
                                                    <span className="text-[10px] text-on-surface-variant/60">{formatDate(m.joinedAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ✅ دراپ‌داون تغییر نقش */}
                                        <div className="mt-3">
                                            <label className="text-[10px] text-on-surface-variant block mb-1">نقش:</label>
                                            <select
                                                value={m.role}
                                                onChange={(e) => handleRoleChange(m.arm.slug, e.target.value)}
                                                className="w-full bg-surface-container-lowest border border-outline rounded-lg h-8 px-2 text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                                            >
                                                {ROLE_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <EmptyState icon={Store} text="در هیچ بازاری عضو نیست" />
                )}
            </div>
        </div>
    );
}

// ============================================================
// کامپوننت‌های کمکی
// ============================================================
function InfoCard({ label, value, icon: Icon, dir }: { label: string; value: string; icon: any; dir?: string }) {
    return (
        <div className="bg-surface p-3 rounded-xl border border-outline-variant/20">
            <p className="text-[10px] text-on-surface-variant mb-1 flex items-center gap-1"><Icon className="w-3 h-3" />{label}</p>
            <p className="text-sm font-semibold text-on-surface" dir={dir}>{value}</p>
        </div>
    );
}

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <div className="bg-surface p-3 rounded-xl border border-outline-variant/20 text-center">
            <p className={cn("text-xl font-bold", color)}>{value.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-on-surface-variant">{label}</p>
        </div>
    );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
    return (
        <div className="text-center py-12 bg-surface rounded-xl border-2 border-dashed border-outline-variant/30">
            <Icon className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-2" />
            <p className="text-sm text-on-surface-variant">{text}</p>
        </div>
    );
}