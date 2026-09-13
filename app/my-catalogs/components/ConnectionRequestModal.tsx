// app/my-catalogs/components/ConnectionRequestModal.tsx
// 🤝 «درخواست ارتباط» — کشفِ مخاطبِ مرتبط میان کسب‌وکارها، کاتالوگ‌ها و افراد
//   مودال با «پیشنهادهای مرتبط» باز می‌شود — لیستِ اولِ هر تب هرگز خالی نیست:
//   سورتِ مرتبط‌سازی: هم‌شهری → هم‌استان → پیش‌شمارهٔ تلفن (مثل ۰۹۱۸ همدان) → مکملِ زنجیرهٔ کاری
//   فیلترها: استان | شهر | صنف (سطح ۱) | زمینهٔ فعالیت (سطح ۲) | نوعِ فروش (تب کاتالوگ‌ها)
//   نوع درخواست بسته به تب و مقصد:
//     کسب‌وکارها → «درخواست خرید» (مشتری ثبت می‌شود؛ تایید با صاحب کسب‌وکار)
//     کاتالوگ‌ها → «درخواست تامین‌کنندگی» یا اگر کاتالوگ مقصد خدماتی باشد «درخواست تامین خدمات»
//     افراد     → «دعوت به همکاری در فروش» (پذیرش با خودِ دعوت‌شده)
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { BUSINESS_TYPE } from '@/lib/api/data-types';
import { resolveFileSrc } from '@/app/business/manage/components/BusinessLogo';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    X, Loader2, Search, Store, BookOpen, User, ExternalLink,
    ShoppingBasket, Truck, Wrench, Handshake, Wallet, SlidersHorizontal,
    ChevronDown, Sparkles,
} from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    catalogId: string;
    canAssign: boolean; // مالک/مدیر — می‌تواند مسئول فروش را هم انتخاب کند
    sellers: any[]; // اعضای فروش فعال (برای انتساب خریدار)
}

type Scope = 'businesses' | 'catalogs' | 'people';

const SCOPES: { key: Scope; label: string; icon: React.ElementType; hint: string }[] = [
    { key: 'businesses', label: 'کسب‌وکارها', icon: Store, hint: 'کسب‌وکارها را به‌عنوان خریدار ثبت کن تا تماس‌شان به شما برسد' },
    { key: 'catalogs', label: 'کاتالوگ‌ها', icon: BookOpen, hint: 'درخواست تامین‌کنندگی یا تامین خدمات بفرست' },
    { key: 'people', label: 'افراد', icon: User, hint: 'فروشندگان و بازاریابان دیمت را به فروش کاتالوگ دعوت کن' },
];

// برچسب فارسی زمینه‌های فعالیت (سطح ۲ درخت) — برای نمایش روی کارت‌ها
const ROLE_LABEL: Record<string, string> = {};
(BUSINESS_TYPE as readonly any[]).forEach((s) => s.children.forEach((c: any) => { ROLE_LABEL[c.id] = c.label; }));

const SALES_TYPE_LABEL: Record<string, string> = {
    wholesale: 'عمده‌فروشی',
    retail: 'خرده‌فروشی',
    service: 'خدماتی',
};

const TAG_CLS = 'px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-primary/10 text-primary whitespace-nowrap';

export default function ConnectionRequestModal({ open, onClose, catalogId, canAssign, sellers }: Props) {
    const [scope, setScope] = useState<Scope>('businesses');
    const [q, setQ] = useState('');
    const [debounced, setDebounced] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [suggested, setSuggested] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [assignTo, setAssignTo] = useState('');
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const [inviteRole, setInviteRole] = useState<'seller' | 'visitor'>('seller');
    const [quota, setQuota] = useState<any | null>(null);

    // ─── فیلترها ───
    const [showFilters, setShowFilters] = useState(false);
    const [fProvince, setFProvince] = useState('');
    const [fCity, setFCity] = useState('');
    const [fSector, setFSector] = useState('');
    const [fRole, setFRole] = useState('');
    const [fSalesType, setFSalesType] = useState('');

    const activeFilters = [fProvince, fCity, fSector, fRole, scope === 'catalogs' ? fSalesType : ''].filter(Boolean).length;

    // دیبانس جستجو
    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(q.trim()), 400);
        return () => window.clearTimeout(t);
    }, [q]);

    useEffect(() => {
        if (!open) return;
        setQ(''); setDebounced(''); setResults([]); setSentIds(new Set()); setAssignTo(''); setScope('businesses');
        setFProvince(''); setFCity(''); setFSector(''); setFRole(''); setFSalesType(''); setSuggested(false);
        // وضعیت سهمیهٔ درخواست ارتباط — رایگانِ باقی‌مانده / هزینه / موجودی
        let alive = true;
        apiService.catalog.team.connectionQuota(catalogId)
            .then((res) => { if (alive) setQuota(res); })
            .catch(() => { if (alive) setQuota(null); });
        return () => { alive = false; };
    }, [open, catalogId]);

    // ─── گزینه‌های فیلتر جغرافیا ───
    const { data: provincesData } = useQuery({
        queryKey: ['conn-provinces'],
        queryFn: () => apiService.location.getProvinces(),
        enabled: open,
        staleTime: 10 * 60_000,
    });
    const provinces: any[] = provincesData?.items || [];
    const provinceCode = provinces.find((p) => p.title === fProvince)?.provinceCode || '';
    const { data: citiesData } = useQuery({
        queryKey: ['conn-cities', provinceCode],
        queryFn: () => apiService.location.getCities(provinceCode),
        enabled: open && !!provinceCode,
        staleTime: 10 * 60_000,
    });
    const cities: any[] = citiesData?.items || [];

    const sectorChildren = useMemo(
        () => (BUSINESS_TYPE as readonly any[]).find((s) => s.id === fSector)?.children || [],
        [fSector],
    );

    const clearFilters = () => { setFProvince(''); setFCity(''); setFSector(''); setFRole(''); setFSalesType(''); };

    const refreshQuota = async () => {
        try { setQuota(await apiService.catalog.team.connectionQuota(catalogId)); } catch { /* بی‌صدا — بک‌اند خودش گیت می‌گذارد */ }
    };

    // پسوند روایی توست — «چند تا رایگان مونده» یا «چند اعتبار خورد»
    const quotaSuffix = (qv: any) => {
        if (!qv) return '';
        if (qv.charged) return ` — ${qv.creditCost} اعتبار مصرف شد`;
        if (qv.remaining > 0) return ` — ${qv.remaining} درخواست رایگان باقی مانده`;
        return '';
    };

    // خطای اعتبار ناکافی — سهمیه تازه شود تا بنرِ شارژ بالا دیده شود
    const handleSendError = (e: any, dflt: string) => {
        if (e?.data?.errorCode === 'INSUFFICIENT_CREDIT') {
            refreshQuota();
            toast.error(e?.data?.message || 'موجودی اعتبار کافی نیست');
            return;
        }
        toast.error(e?.data?.message || e?.message || dflt);
    };

    // ─── کشفِ مخاطب: با عبارت = جستجو، بدون عبارت = پیشنهادِ مرتبط‌ترین‌ها ───
    useEffect(() => {
        if (!open) return;
        let alive = true;
        (async () => {
            setSearching(true);
            try {
                const params = {
                    q: debounced || undefined,
                    province: fProvince || undefined,
                    city: fCity || undefined,
                    sector: fSector || undefined,
                    role: fRole || undefined,
                    ...(scope === 'catalogs' ? { salesType: fSalesType || undefined } : {}),
                };
                let res: { items?: any[]; suggested?: boolean };
                if (scope === 'businesses') res = await apiService.catalog.team.customerCandidates(catalogId, params);
                else if (scope === 'catalogs') res = await apiService.catalog.team.partnerCatalogs(catalogId, params);
                else res = await apiService.catalog.team.peopleCandidates(catalogId, params);
                if (alive) {
                    setResults(res?.items || []);
                    setSuggested(!!res?.suggested);
                }
            } catch {
                if (alive) { setResults([]); setSuggested(false); }
            } finally {
                if (alive) setSearching(false);
            }
        })();
        return () => { alive = false; };
    }, [open, catalogId, scope, debounced, fProvince, fCity, fSector, fRole, fSalesType]);

    if (!open) return null;

    const markSent = (id: string) => setSentIds((s) => new Set(s).add(id));

    const sendBuyerRequest = async (b: any) => {
        setBusyId(b.id);
        try {
            const res = await apiService.catalog.team.addCustomer(catalogId, {
                businessId: b.id,
                ...(assignTo ? { sellerUserId: assignTo } : {}),
            });
            toast.success((res?.message || 'درخواست خرید ارسال شد — در انتظار تایید صاحب کسب‌وکار') + quotaSuffix(res?.quota));
            markSent(`biz-${b.id}`);
            refreshQuota();
        } catch (e: any) {
            handleSendError(e, 'خطا در ارسال درخواست');
        } finally {
            setBusyId(null);
        }
    };

    const sendSupplierOrService = async (c: any) => {
        setBusyId(c.id);
        try {
            const isService = c.salesType === 'service';
            const res = isService
                ? await apiService.catalog.team.inviteService(catalogId, c.id)
                : await apiService.catalog.team.inviteSupplier(catalogId, c.id);
            toast.success((res?.message || (isService
                ? 'درخواست تامین خدمات ارسال شد — در انتظار تایید صاحب کاتالوگ'
                : 'درخواست تامین‌کنندگی ارسال شد — در انتظار تایید صاحب کاتالوگ')) + quotaSuffix(res?.quota));
            markSent(`cat-${c.id}`);
            refreshQuota();
        } catch (e: any) {
            handleSendError(e, 'خطا در ارسال درخواست');
        } finally {
            setBusyId(null);
        }
    };

    const sendSellerInvite = async (u: any) => {
        setBusyId(u.id);
        try {
            const res = await apiService.catalog.team.inviteSeller(catalogId, u.id, inviteRole);
            toast.success((res?.message || 'دعوت همکاری در فروش ارسال شد') + quotaSuffix(res?.quota));
            markSent(`usr-${u.id}`);
            refreshQuota();
        } catch (e: any) {
            handleSendError(e, 'خطا در ارسال دعوت');
        } finally {
            setBusyId(null);
        }
    };

    const selectCls = 'w-full px-2.5 py-2 rounded-lg bg-white dark:bg-gray-900 border border-outline-variant/40 text-xs';
    const hasQuery = debounced.length >= 2;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl p-5 max-h-[88vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* سربرگ */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">درخواست ارتباط تجاری</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            پیشنهادِ مرتبط‌ترین مخاطبان — یا جستجو و فیلتر کن
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* فیلتر دیواری — سه مسیر */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {SCOPES.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => { setScope(key); setResults([]); }}
                            className={cn(
                                'flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-bold transition-all',
                                scope === key
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-outline-variant/40 dark:border-gray-700 text-gray-500 hover:border-primary/40',
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-gray-400 mb-3 leading-5">
                    {SCOPES.find((s) => s.key === scope)?.hint}
                </p>

                {/* سهمیه و هزینهٔ درخواست ارتباط — عضوگیری پارامتری */}
                {quota && quota.creditCost > 0 && (
                    quota.remaining > 0 ? (
                        <div className="mb-3 flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/60">
                            <Handshake className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] leading-5 text-emerald-800 dark:text-emerald-300">
                                <b>{quota.remaining} درخواست رایگان</b> باقی مانده
                                <span className="opacity-75"> — پس از آن هر درخواست {quota.creditCost} اعتبار مصرف می‌کند</span>
                            </p>
                        </div>
                    ) : (quota.balance ?? 0) >= quota.creditCost ? (
                        <div className="mb-3 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/60">
                            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] leading-5 text-amber-800 dark:text-amber-300">
                                سهمیهٔ رایگان تمام شده — <b>هر درخواست {quota.creditCost} اعتبار</b> · موجودی شما: <b>{quota.balance} اعتبار</b>
                            </p>
                        </div>
                    ) : (
                        <div className="mb-3 flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200/70 dark:border-rose-800/60">
                            <Wallet className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                            <p className="flex-1 text-[11px] leading-5 text-rose-800 dark:text-rose-300">
                                موجودی اعتبار برای ارسال درخواست کافی نیست — هر درخواست {quota.creditCost} اعتبار است
                            </p>
                            <Link href="/credit/purchase" className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold flex-shrink-0 hover:bg-rose-700 transition">
                                شارژ اعتبار
                            </Link>
                        </div>
                    )
                )}

                {/* انتساب مسئول فروش — فقط مالک/مدیر با بیش از یک فروشنده */}
                {scope === 'businesses' && canAssign && sellers.length > 1 && (
                    <div className="mb-3">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">مسئول فروش این خریدار</label>
                        <select
                            value={assignTo}
                            onChange={(e) => setAssignTo(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-outline-variant/40 text-sm"
                        >
                            <option value="">— خودم (پیش‌فرض) —</option>
                            {sellers.filter((s) => !s.isOwner).map((s) => (
                                <option key={s.id} value={s.userId}>{s.fullName || s.business?.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* نقش دعوت — تب افراد */}
                {scope === 'people' && (
                    <div className="flex gap-2 mb-3">
                        {([['seller', 'فروشنده'], ['visitor', 'بازاریاب (ویزیتور)']] as const).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setInviteRole(val)}
                                className={cn(
                                    'flex-1 py-2 rounded-xl border text-xs font-bold transition-all',
                                    inviteRole === val
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-outline-variant/40 dark:border-gray-700 text-gray-500',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {/* جستجو */}
                <div className="relative mb-2">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={
                            scope === 'businesses' ? 'نام کسب‌وکار یا شمارهٔ تماس…'
                            : scope === 'catalogs' ? 'نام کاتالوگ یا کسب‌وکار…'
                            : 'نام یا شمارهٔ موبایل…'
                        }
                        className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-outline-variant/40 text-sm"
                    />
                    {searching && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                </div>

                {/* فیلتر مخاطبان — استان / شهر / صنف / زمینهٔ فعالیت / نوعِ فروش */}
                <div className="mb-3 rounded-xl border border-outline-variant/30 dark:border-gray-800 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5">
                        <button
                            onClick={() => setShowFilters((v) => !v)}
                            className="flex items-center gap-2 flex-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            فیلتر مخاطبان
                            {activeFilters > 0 && (
                                <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-black grid place-items-center">
                                    {activeFilters.toLocaleString('fa-IR')}
                                </span>
                            )}
                            <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
                        </button>
                        {activeFilters > 0 && (
                            <button onClick={clearFilters} className="text-[10px] font-bold text-rose-500 hover:underline">
                                حذف همه
                            </button>
                        )}
                    </div>
                    {showFilters && (
                        <div className={cn('grid grid-cols-2 gap-2 px-3 pb-3', scope !== 'catalogs' && 'sm:grid-cols-2')}>
                            <select
                                value={fProvince}
                                onChange={(e) => { setFProvince(e.target.value); setFCity(''); }}
                                className={selectCls}
                            >
                                <option value="">همهٔ استان‌ها</option>
                                {provinces.map((p) => (
                                    <option key={p.id} value={p.title}>{p.title}</option>
                                ))}
                            </select>
                            <select
                                value={fCity}
                                onChange={(e) => setFCity(e.target.value)}
                                disabled={!fProvince}
                                className={cn(selectCls, !fProvince && 'opacity-50 cursor-not-allowed')}
                            >
                                <option value="">{fProvince ? 'همهٔ شهرها' : 'اول استان را انتخاب کنید'}</option>
                                {cities.map((ct) => (
                                    <option key={ct.id} value={ct.title}>{ct.title}</option>
                                ))}
                            </select>
                            <select
                                value={fSector}
                                onChange={(e) => { setFSector(e.target.value); setFRole(''); }}
                                className={selectCls}
                            >
                                <option value="">همهٔ صنف‌ها</option>
                                {(BUSINESS_TYPE as readonly any[]).map((s) => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                            <select
                                value={fRole}
                                onChange={(e) => setFRole(e.target.value)}
                                disabled={!fSector}
                                className={cn(selectCls, !fSector && 'opacity-50 cursor-not-allowed')}
                            >
                                <option value="">{fSector ? 'همهٔ زمینه‌های فعالیت' : 'اول صنف را انتخاب کنید'}</option>
                                {sectorChildren.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                            {scope === 'catalogs' && (
                                <select
                                    value={fSalesType}
                                    onChange={(e) => setFSalesType(e.target.value)}
                                    className={cn(selectCls, 'col-span-2')}
                                >
                                    <option value="">همهٔ انواع کاتالوگ</option>
                                    <option value="wholesale">عمده‌فروشی</option>
                                    <option value="retail">خرده‌فروشی</option>
                                    <option value="service">خدماتی</option>
                                </select>
                            )}
                        </div>
                    )}
                </div>

                {/* سربرگ پیشنهادها — وقتی جستجویی در کار نیست */}
                {suggested && results.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-2 text-[11px] leading-5 text-gray-500 dark:text-gray-400">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>
                            <b className="text-gray-700 dark:text-gray-300">پیشنهادهای مرتبط</b>
                            {' '}— مرتب‌شده بر پایهٔ شهر، استان، پیش‌شمارهٔ تلفن و مکملِ زنجیرهٔ کاری شما
                        </span>
                    </div>
                )}

                {/* نتایج */}
                <div className="space-y-2">
                    {results.map((item: any) => {
                        const isBiz = scope === 'businesses';
                        const isCat = scope === 'catalogs';
                        const isServiceCat = isCat && item.salesType === 'service';
                        const key = isBiz ? `biz-${item.id}` : isCat ? `cat-${item.id}` : `usr-${item.id}`;
                        const sent = sentIds.has(key);
                        const location = [item.province, item.city].filter(Boolean).join(' · ');
                        const roleLabel = isBiz ? ROLE_LABEL[item.businessRole] : isCat ? ROLE_LABEL[item.business?.businessRole] : '';
                        const catLocation = isCat ? [item.province || item.business?.province, item.city || item.business?.city].filter(Boolean).join(' · ') : '';
                        const tags: string[] = item.relevanceTags || [];
                        return (
                            <div key={key} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 dark:border-gray-800">
                                {!isBiz && !isCat && item.avatarUrl ? (
                                    <img src={resolveFileSrc(item.avatarUrl)!} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                                ) : (
                                    <span className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 grid place-items-center flex-shrink-0 text-gray-400">
                                        {isBiz ? <Store className="w-4 h-4" /> : isCat ? <BookOpen className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    </span>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
                                        {isBiz || isCat ? item.name : (item.fullName || 'کاربر دیمت')}
                                        {isCat && item.slug && (
                                            <Link href={`/${item.slug}`} target="_blank" title="مشاهدهٔ کاتالوگ"
                                                  className="text-primary/70 hover:text-primary flex-shrink-0">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Link>
                                        )}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                        {isBiz && (item.owner?.fullName ? `صاحب: ${item.owner.fullName}` : '')}
                                        {isBiz && location ? ` · ${location}` : ''}
                                        {isBiz && roleLabel ? ` · ${roleLabel}` : ''}
                                        {isCat && (item.business?.name ? `${item.business.name}` : '')}
                                        {isCat && item.salesType ? ` · ${SALES_TYPE_LABEL[item.salesType] || item.salesType}` : ''}
                                        {isCat && catLocation ? ` · ${catLocation}` : ''}
                                        {!isBiz && !isCat && item.businessName ? `${item.businessName}` : ''}
                                        {!isBiz && !isCat && item.phone ? <> · <span dir="ltr">{item.phone}</span></> : null}
                                    </p>
                                    {tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {tags.slice(0, 3).map((t) => (
                                                <span key={t} className={TAG_CLS}>{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {busyId === item.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
                                ) : sent ? (
                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">ارسال شد ✓</span>
                                ) : (
                                    <button
                                        onClick={() => (isBiz ? sendBuyerRequest(item) : isCat ? sendSupplierOrService(item) : sendSellerInvite(item))}
                                        className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold flex-shrink-0 flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition"
                                    >
                                        {isBiz && <><ShoppingBasket className="w-3.5 h-3.5" /> درخواست خرید</>}
                                        {isCat && !isServiceCat && <><Truck className="w-3.5 h-3.5" /> درخواست تامین‌کنندگی</>}
                                        {isCat && isServiceCat && <><Wrench className="w-3.5 h-3.5" /> درخواست تامین خدمات</>}
                                        {!isBiz && !isCat && <><Handshake className="w-3.5 h-3.5" /> دعوت</>}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {!searching && results.length === 0 && (hasQuery || activeFilters > 0) && (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-400">چیزی پیدا نشد</p>
                            {activeFilters > 0 && (
                                <button onClick={clearFilters} className="text-[11px] font-bold text-primary mt-1 hover:underline">
                                    حذف فیلترها و دیدن پیشنهادها
                                </button>
                            )}
                        </div>
                    )}
                    {!searching && results.length === 0 && !hasQuery && activeFilters === 0 && (
                        <p className="text-center text-xs text-gray-400 py-4">
                            هنوز مخاطبی برای پیشنهاد نیست — کمی بعد دوباره سر بزنید یا با جستجو دنبال مخاطب خاص بگردید
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
