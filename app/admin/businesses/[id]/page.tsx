// app/admin/businesses/[id]/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    Building2, Package, CreditCard, AlertCircle, ArrowRight,
    Loader2, BadgeCheck, Clock, Shield, Phone, MapPin, Globe,
    FileText, Users, Store, RefreshCw, Search, Calendar as CalendarIcon,
    XCircle, User, CheckCircle, Award, Tag, Layers,
} from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import DateObject from 'react-date-object';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

type TabType = 'info' | 'verification' | 'ads' | 'payments' | 'arms';
type TransactionStatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'success' | 'failed';

const QUICK_RANGES = [
    { label: 'امروز', days: 0 },
    { label: '۷ روز گذشته', days: 7 },
    { label: '۳۰ روز گذشته', days: 30 },
];

const BUSINESS_TYPE_LABELS: Record<string, string> = {
    producer: 'تولیدی', wholesaler: 'عمده‌فروش', importer: 'واردکننده',
    exporter: 'صادرکننده', distributor: 'توزیع‌کننده', retailer: 'خرده‌فروش',
    contractor: 'پیمانکار', service_provider: 'خدمات', other: 'سایر',
};

export default function AdminBusinessDetailPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const businessId = params.id as string;
    const initialTab = (searchParams.get('tab') as TabType) || 'info';

    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    // فیلتر تراکنش‌ها
    const [txFilter, setTxFilter] = useState<TransactionStatusFilter>('all');
    const [txSearch, setTxSearch] = useState('');
    const [txStartDate, setTxStartDate] = useState<DateObject | null>(null);
    const [txEndDate, setTxEndDate] = useState<DateObject | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // اسکرول تب‌ها
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // عملیات تأیید/رد تیک
    const [actionMode, setActionMode] = useState<'none' | 'approve' | 'reject'>('none');
    const [selectedTier, setSelectedTier] = useState<string>('blue');
    const [rejectReason, setRejectReason] = useState('');
    const [verifying, setVerifying] = useState(false);

    // تغییر URL هنگام تغییر تب
    useEffect(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', activeTab);
        router.replace(url.pathname + url.search, { scroll: false });
    }, [activeTab, router]);

    const fetchDetail = useCallback(async (showLoading = true) => {
        if (!businessId) return;
        if (showLoading) setLoading(true); else setRefreshing(true);
        try {
            const data = await apiService.admin.businesses.getDetail(businessId);
            setBusiness(data);
            setError(null);
        } catch (err: any) {
            setError(err?.message || 'خطا');
            toast.error(err?.message || 'خطا');
            if (err?.response?.status === 404) router.push('/admin/businesses');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [businessId]);

    useEffect(() => { fetchDetail(); }, [fetchDetail]);

    // ======================== تب‌ها ========================
    const tabs: { id: TabType; label: string; icon: any; count?: number; badge?: boolean }[] = [
        { id: 'info', label: 'اطلاعات', icon: Building2 },
        { id: 'verification', label: 'مدارک', icon: Shield, badge: business?.verificationStatus === 'pending' },
        { id: 'ads', label: 'آگهی‌ها', icon: Package, count: business?.ads?.length || 0 },
        { id: 'payments', label: 'تراکنش‌ها', icon: CreditCard, count: (business?.credits?.length || 0) + (business?.creditRequests?.length || 0) },
        { id: 'arms', label: 'بازارها', icon: Store, count: business?.armMemberships?.length || 0 },
    ];

    // اسکرول تب‌ها
    useEffect(() => {
        const el = document.getElementById(`tab-btn-${activeTab}`);
        el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [activeTab]);

    // ======================== تأیید/رد ========================
    const handleVerify = async () => {
        if (actionMode === 'approve' && !selectedTier) return toast.error('سطح تیک را انتخاب کنید');
        if (actionMode === 'reject' && !rejectReason.trim()) return toast.error('دلیل رد را وارد کنید');
        setVerifying(true);
        try {
            const body: any = { action: actionMode };
            if (actionMode === 'approve') body.tier = selectedTier;
            else body.reason = rejectReason;
            body.verificationId = business?.latestVerification?.id;

            await apiService.admin.businesses.verify(businessId, body);
            toast.success(actionMode === 'approve' ? 'تیک با موفقیت تأیید شد' : 'درخواست رد شد');
            setActionMode('none');
            fetchDetail(false);
        } catch (err: any) {
            toast.error(err?.message || 'خطا');
        } finally {
            setVerifying(false);
        }
    };

    // ======================== فیلتر تراکنش‌ها ========================
    const allTransactions = useMemo(() => {
        if (!business) return [];
        const credits = (business.credits || []).map((c: any) => ({
            id: c.id,
            type: 'credit' as const,
            amount: c.amount,
            creditCount: c.creditCount,
            statusRaw: c.status,
            status: c.status === 'success' ? 'موفق' : c.status === 'pending' ? 'در انتظار' : 'ناموفق',
            description: c.description || 'تراکنش',
            date: c.createdAt,
            arm: c.arm,
        }));
        const requests = (business.creditRequests || []).map((r: any) => ({
            id: r.id,
            type: 'creditRequest' as const,
            amount: r.amount,
            creditCount: (r.metadata as any)?.creditCount || 0,
            statusRaw: r.status,
            status: r.status === 'approved' ? 'تأیید شده' : r.status === 'rejected' ? 'رد شده' : 'در انتظار',
            description: r.receiptNote || 'خرید فیشی',
            date: r.createdAt,
            arm: r.arm,
        }));
        return [...credits, ...requests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [business]);

    const filteredTransactions = useMemo(() => {
        let result = [...allTransactions];
        if (txStartDate && txEndDate) {
            const s = txStartDate.valueOf();
            const e = txEndDate.valueOf() + 86400000 - 1;
            result = result.filter(tx => {
                const d = new Date(tx.date).getTime();
                return d >= s && d <= e;
            });
        }
        if (txFilter !== 'all') {
            const map: any = {
                pending: ['pending', 'در انتظار'],
                approved: ['approved', 'تأیید شده'],
                rejected: ['rejected', 'رد شده'],
                success: ['success', 'موفق'],
                failed: ['failed', 'ناموفق'],
            };
            result = result.filter(tx => map[txFilter]?.includes(tx.statusRaw));
        }
        if (txSearch.trim()) {
            const q = txSearch.trim().toLowerCase();
            result = result.filter(tx =>
                (tx.description || '').toLowerCase().includes(q) ||
                (tx.id || '').toLowerCase().includes(q) ||
                (tx.arm?.name || '').toLowerCase().includes(q)
            );
        }
        return result;
    }, [allTransactions, txFilter, txSearch, txStartDate, txEndDate]);

    const txStats = useMemo(() => ({
        total: allTransactions.length,
        pending: allTransactions.filter(t => t.statusRaw === 'pending' || t.status === 'در انتظار').length,
        success: allTransactions.filter(t => ['success', 'approved'].includes(t.statusRaw) || ['موفق', 'تأیید شده'].includes(t.status)).length,
        failed: allTransactions.filter(t => ['rejected', 'failed'].includes(t.statusRaw) || ['رد شده', 'ناموفق'].includes(t.status)).length,
    }), [allTransactions]);

    const handleQuickRange = (days: number) => {
        const now = new DateObject({ calendar: persian, locale: persian_fa });
        setTxStartDate(now.clone().subtract(days, 'days'));
        setTxEndDate(now.clone());
        setShowDatePicker(false);
    };
    const clearDate = () => { setTxStartDate(null); setTxEndDate(null); };

    // ======================== وضعیت‌ها ========================
    const formatDate = (d: string) => new Date(d).toLocaleDateString('fa-IR');
    const fileUrl = (id: string) => `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${id}`;

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8" /></div>;
    if (error && !business) return <div className="text-center py-20 text-error"><AlertCircle className="w-16 h-16 mx-auto mb-4" /><p>{error}</p></div>;
    if (!business) return null;

    const latestVer = business.latestVerification;

    return (
        <div className="pb-8">
            {/* هدر */}
            <div className="flex items-start sm:items-center gap-3 mb-6 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30">
                <button onClick={() => router.push('/admin/businesses')} className="p-2 hover:bg-surface-container-high rounded-lg">
                    <ArrowRight className="w-5 h-5 text-on-surface-variant" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg sm:text-xl font-bold truncate">{business.name}</h1>
                        {business.verificationTier !== 'none' && (
                            <BadgeCheck className="w-5 h-5 text-primary" />
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-on-surface-variant">
                        <span>{BUSINESS_TYPE_LABELS[business.type] || business.type}</span>
                        {business.city && <span><MapPin className="w-3.5 h-3.5 inline ml-1" />{business.city}</span>}
                        <span>{business.phone}</span>
                    </div>
                </div>
                <button onClick={() => fetchDetail(false)} disabled={refreshing} className="p-2 hover:bg-surface-container-high rounded-lg">
                    <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                </button>
            </div>

            {/* تب‌ها */}
            <div className="relative mb-0 bg-surface-container-lowest rounded-t-xl border border-b-0 border-outline-variant/30">
                <div ref={scrollContainerRef} className="flex gap-1 px-2 pt-2 overflow-x-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                id={`tab-btn-${tab.id}`}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors",
                                    isActive
                                        ? "text-primary bg-surface border-b-[3px] border-primary z-10"
                                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low border-b-[3px] border-transparent"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                                {tab.badge && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                                )}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className={cn(
                                        "text-[10px] min-w-[20px] text-center px-1.5 py-0.5 rounded-full",
                                        isActive ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                                    )}>
                                        {tab.count.toLocaleString('fa-IR')}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div style={{ height: '52px' }}>{/* اسپیسر */}</div>
            </div>

            {/* محتوای تب‌ها */}
            <div className="bg-surface-container-lowest border border-t-0 border-outline-variant/30 rounded-b-xl p-4 sm:p-6">
                {/* ══════ اطلاعات ══════ */}
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <InfoCard label="نام" value={business.name} icon={Building2} />
                        <InfoCard label="معرفی کوتاه" value={business.shortDescription || '—'} icon={FileText} />
                        <InfoCard label="نوع" value={BUSINESS_TYPE_LABELS[business.type] || business.type} icon={Tag} />
                        <InfoCard label="شهر" value={business.city || '—'} icon={MapPin} />
                        <InfoCard label="تلفن" value={business.phone} icon={Phone} dir="ltr" />
                        <InfoCard label="وب‌سایت" value={business.website || '—'} icon={Globe} />
                        <InfoCard label="وضعیت" value={business.status === 'active' ? 'فعال' : 'غیرفعال'} icon={CheckCircle} />
                        <InfoCard label="تیک اعتماد" value={
                            business.verificationStatus === 'none' ? 'ندارد' :
                                business.verificationStatus === 'pending' ? 'در انتظار' :
                                    business.verificationStatus === 'approved' ? `تأیید شده (${business.verificationTier})` : 'رد شده'
                        } icon={Shield} />
                        <InfoCard label="اعتبار" value={business.trustScore?.toString() || '0'} icon={Award} />
                        <InfoCard label="تاریخ ثبت" value={formatDate(business.createdAt)} icon={CalendarIcon} />
                        <InfoCard label="آخرین ویرایش" value={formatDate(business.updatedAt)} icon={Clock} />
                        <InfoCard label="صنف" value={business.industryId || '—'} icon={Building2} />
                        {business.description && (
                            <div className="col-span-full">
                                <InfoCard label="توضیحات" value={business.description} icon={FileText} />
                            </div>
                        )}
                    </div>
                )}

                {/* ══════ مدارک و تیک ══════ */}
                {activeTab === 'verification' && (
                    <div className="space-y-6">
                        {latestVer ? (
                            <div className="bg-surface rounded-xl border border-outline-variant/20 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-primary" />
                                        <h3 className="font-semibold">درخواست تیک {latestVer.tier === 'blue' ? 'آبی' : latestVer.tier === 'silver' ? 'نقره‌ای' : 'طلایی'}</h3>
                                    </div>
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full",
                                        latestVer.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            latestVer.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    )}>
                                        {latestVer.status === 'pending' ? 'در انتظار' : latestVer.status === 'approved' ? 'تأیید شده' : 'رد شده'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                                    {latestVer.documents?.nationalCardFileId && (
                                        <div>
                                            <DocCard label="کارت ملی" fileId={latestVer.documents.nationalCardFileId} fileUrl={fileUrl} />
                                            {latestVer.documents?.nationalId && (
                                                <p className="text-xs mt-2 text-on-surface-variant dir-ltr text-center">
                                                    کد ملی: {latestVer.documents.nationalId}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {latestVer.documents?.licenseFileIds?.map((fid: string, i: number) => (
                                        <DocCard key={fid} label={`مجوز ${i+1}`} fileId={fid} fileUrl={fileUrl} />
                                    ))}
                                    {latestVer.documents?.awardFileIds?.map((fid: string, i: number) => (
                                        <DocCard key={fid} label={`مدرک افتخار ${i+1}`} fileId={fid} fileUrl={fileUrl} />
                                    ))}
                                </div>

                                {latestVer.status === 'pending' && (
                                    <div className="border-t pt-4">
                                        <div className="flex gap-3 mb-4">
                                            <button onClick={() => setActionMode(actionMode === 'approve' ? 'none' : 'approve')}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">تأیید</button>
                                            <button onClick={() => setActionMode(actionMode === 'reject' ? 'none' : 'reject')}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">رد</button>
                                        </div>

                                        {actionMode === 'approve' && (
                                            <div className="space-y-3 bg-surface-container-low p-4 rounded-lg">
                                                <p className="text-sm">انتخاب سطح تیک:</p>
                                                <div className="flex gap-2">
                                                    {['blue', 'silver', 'gold'].map(t => (
                                                        <button key={t} onClick={() => setSelectedTier(t)}
                                                                className={cn("px-3 py-1 rounded-lg border", selectedTier === t ? "border-primary bg-primary/10" : "border-outline-variant")}>
                                                            {t === 'blue' ? 'آبی' : t === 'silver' ? 'نقره‌ای' : 'طلایی'}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button onClick={handleVerify} disabled={verifying}
                                                        className="px-4 py-2 bg-primary text-white rounded-lg">{verifying ? '...' : 'تأیید تیک'}</button>
                                            </div>
                                        )}

                                        {actionMode === 'reject' && (
                                            <div className="space-y-3 bg-surface-container-low p-4 rounded-lg">
                                                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                                          placeholder="دلیل رد..." rows={3} className="w-full border rounded-lg p-2 text-sm" />
                                                <button onClick={handleVerify} disabled={verifying}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg">{verifying ? '...' : 'رد درخواست'}</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptyState icon={Shield} text="هیچ درخواست تیک اعتمادی ثبت نشده است." />
                        )}
                    </div>
                )}

                {/* ══════ آگهی‌ها ══════ */}
                {activeTab === 'ads' && (
                    business.ads?.length > 0 ? (
                        <div className="space-y-2">
                            {business.ads.map((ad: any) => (
                                <div key={ad.id} className="bg-surface rounded-xl border border-outline-variant/20 p-3 flex items-center justify-between flex-wrap gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{ad.title}</p>
                                        <p className="text-xs text-on-surface-variant">{ad.category?.title} | {ad.arm?.name}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                                            ad.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                                            {ad.status === 'active' ? 'فعال' : ad.status}
                                        </span>
                                        <p className="text-sm font-bold">{ad.unitPrice?.toLocaleString()} تومان</p>
                                        <p className="text-[10px] text-on-surface-variant">{formatDate(ad.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <EmptyState icon={Package} text="هیچ آگهی ثبت نشده" />
                )}

                {/* ══════ تراکنش‌ها ══════ */}
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
                                        <div className="flex items-center gap-3">
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
                            <EmptyState icon={CreditCard} text={allTransactions.length === 0 ? 'هیچ تراکنشی ثبت نشده' : 'نتیجه‌ای یافت نشد'} />
                        )}
                    </div>
                )}

                {/* ══════ بازارها ══════ */}
                {activeTab === 'arms' && (
                    business.armMemberships?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {business.armMemberships.map((m: any) => (
                                <div key={m.id} className="bg-surface rounded-xl border border-outline-variant/20 p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: m.arm?.colorPrimary || '#8b0000' }}>
                                            {m.arm?.name?.[0] || 'ب'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{m.arm?.name}</p>
                                            <p className="text-xs text-on-surface-variant">
                                                {m.role === 'arm_owner' ? 'مدیر' : m.role === 'arm_seller' ? 'فروشنده' : m.role === 'arm_buyer' ? 'خریدار' : 'عضو'}
                                            </p>
                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                                                m.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}>
                                                {m.status === 'active' ? 'فعال' : m.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <EmptyState icon={Store} text="در هیچ بازاری عضو نیست" />
                )}
            </div>
        </div>
    );
}

// ======================== کامپوننت‌های کمکی ========================
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

function DocCard({ label, fileId, fileUrl }: { label: string; fileId: string; fileUrl: (id: string) => string }) {
    return (
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-hidden">
            <a href={fileUrl(fileId)} target="_blank" rel="noopener noreferrer">
                <img src={fileUrl(fileId)} alt={label} className="w-full h-32 object-cover" />
            </a>
            <div className="p-2 text-center text-xs font-medium">{label}</div>
        </div>
    );
}