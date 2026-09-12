// app/my-catalogs/components/TeamTab.tsx
'use client';

/** تب اعضای کاتالوگ (کنسول) — همان فهرست سادهٔ برگهٔ اعضا:
 *  [آواتار] [نام + کسب‌وکار + شهر] [نقش بیزینسی: فروشنده/ویزیتور/خریدار/تامین‌کننده/خریدار من] [نقش سیستمی: مالک/مدیر کاتالوگ/خودم]
 *  + بخش «در انتظار تایید مدیر (مالک کاتالوگ)» + تاریخچه + خروج */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, UserPlus, MapPin, ShieldCheck, ShieldOff, Trash2, Check, X,
    Loader2, Search, Hourglass, History, LogOut, MoreVertical, ArrowLeftRight, Phone, Handshake,
} from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CARD_CLS } from '../constants';

interface Props {
    catalogId: string;
}

const faDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

const badgeBase = 'text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap text-center';

const EVENT_LABEL: Record<string, string> = {
    coop_requested: 'درخواست ارتباط تجاری داد',
    seller_requested: 'درخواست همکاری در فروش داد',
    seller_approved: 'به‌عنوان همکار فروش تایید شد',
    seller_rejected: 'درخواستش رد شد',
    seller_removed: 'از اعضا حذف شد',
    seller_left: 'خودش از اعضا خارج شد',
    seller_role_changed: 'نقش بیزینسی‌اش عوض شد',
    buyer_approved: 'به‌عنوان خریدار تایید شد',
    buyer_rejected: 'درخواست خریدارش رد شد',
    supplier_approved: 'به‌عنوان تامین‌کننده تایید شد',
    supplier_rejected: 'درخواست تامین‌کننده‌اش رد شد',
    supplier_removed: 'تامین‌کننده‌اش حذف شد',
    admin_promoted: 'مدیر کاتالوگ شد',
    admin_demoted: 'نقش مدیرش گرفته شد',
    customer_added: 'به‌عنوان خریدار ثبت شد',
    customer_confirmed: 'خریداربودنش را تایید کرد',
    customer_declined: 'ثبت خریداربودنش را رد کرد',
    customer_removed: 'به‌عنوان خریدار حذف شد',
    customer_left: 'خریداربودنش را لغو کرد',
    customer_reassigned: 'مسئولش عوض شد',
    customer_unassigned: 'بی‌مسئول شد',
    region_set: 'منطقه‌اش تغییر کرد',
    joined: 'به اعضای کاتالوگ اضافه شد',
    migrated: 'به مدل اعضای کاتالوگ منتقل شد',
};

function Avatar({ url, name, size = 40 }: { url?: string | null; name?: string | null; size?: number }) {
    const [broken, setBroken] = useState(false);
    if (url && !broken) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" style={{ width: size, height: size }} onError={() => setBroken(true)}
                 className="rounded-full object-cover flex-shrink-0 border border-outline-variant/30" />
        );
    }
    const initial = (name || '؟').trim().charAt(0);
    return (
        <div style={{ width: size, height: size }}
             className="rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-500 font-bold">
            {initial}
        </div>
    );
}

export default function TeamTab({ catalogId }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['catalog-team', catalogId],
        queryFn: () => apiService.catalog.team.getTeam(catalogId),
        staleTime: 15_000,
    });

    const [busy, setBusy] = useState<string | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [assignTo, setAssignTo] = useState(''); // sellerUserId برای افزودن (مالک/مدیر)
    const [reassignTarget, setReassignTarget] = useState<any>(null);
    const [menuFor, setMenuFor] = useState<string | null>(null);
    const [approveFor, setApproveFor] = useState<string | null>(null);
    const [regionTarget, setRegionTarget] = useState<any>(null);
    const [regionVal, setRegionVal] = useState('');

    const team = data || null;
    const canManage = !!team?.myRole?.canManage;
    const isOwner = !!team?.myRole?.isOwner;

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['catalog-team', catalogId] });
        queryClient.invalidateQueries({ queryKey: ['catalogs'] });
        refetch();
    };

    const run = async (key: string, fn: () => Promise<any>, successMsg?: string) => {
        setBusy(key);
        try {
            const res = await fn();
            if (successMsg) toast.success(successMsg || res?.message);
            refresh();
            return res;
        } catch (e: any) {
            toast.error(e?.data?.message || e?.message || 'خطا در انجام عملیات');
        } finally {
            setBusy(null);
        }
    };

    // ─── جست‌وجوی مشتری ───
    const doSearch = async (q: string) => {
        setSearch(q);
        if (q.trim().length < 2) { setResults([]); return; }
        setSearching(true);
        try {
            const res = await apiService.catalog.team.customerCandidates(catalogId, q);
            setResults(res?.items || []);
        } catch { setResults([]); }
        finally { setSearching(false); }
    };

    if (isLoading || !team) {
        return (
            <div className="py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            </div>
        );
    }

    // درخواستِ من در انتظار تایید — عضوِ منتظر
    if (team.myRole?.isPendingSeller && !canManage) {
        return (
            <div className={cn(CARD_CLS, 'p-6 text-center')}>
                <Hourglass className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <p className="font-bold text-gray-900 dark:text-gray-100">درخواست عضویت شما ثبت شده</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    در انتظار تایید مدیر (مالک کاتالوگ) — بعد از تایید می‌توانید مشتری‌های خودتان را ثبت کنید
                </p>
            </div>
        );
    }

    const staff: any[] = team.staff || [];
    const pendingRequests: any[] = team.pendingRequests || [];
    const sellers: any[] = team.sellers || [];
    const suppliers: any[] = team.suppliers || [];
    const customers: any[] = team.customers || [];
    const events: any[] = team.events || [];
    const activeCustomers = customers.filter((c) => c.customerStatus === 'active');

    // فهرست ساده: کادر (مالک/مدیرها) → همکاران فروش (خودم اول) → تامین‌کننده‌ها → خریدارها (خریدار من اول)
    const ordered = [...staff, ...sellers, ...suppliers, ...activeCustomers]
        .map((m: any) => ({
            ...m,
            __isMyCustomer: !!team.myRole?.isSeller && m.assignedSellerUserId === team.myRole?.userId,
            __isMe: m.userId === team.myRole?.userId && !m.isOwner && !m.isAdmin,
        }))
        .sort((a: any, b: any) => {
            const rank = (m: any) => (m.isOwner ? 0 : m.isAdmin ? 1 : m.__isMe ? 2 : m.sellerStatus === 'active' ? 3 : m.supplierStatus === 'active' ? 4 : m.__isMyCustomer ? 5 : 6);
            return rank(a) - rank(b);
        });

    const bizBadge = (m: any) => {
        if (m.__isMyCustomer) return { text: 'خریدار من', cls: 'bg-primary text-on-primary' };
        if (m.supplierStatus === 'active') return { text: 'تامین‌کننده', cls: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' };
        if (m.customerStatus === 'active') return { text: 'خریدار', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' };
        if (m.sellerStatus === 'active') return m.sellerRole === 'visitor'
            ? { text: 'ویزیتور', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' }
            : { text: 'فروشنده', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
        return null;
    };

    const sysBadge = (m: any) => {
        if (m.isOwner) return { text: 'مالک کاتالوگ', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' };
        if (m.isAdmin) return { text: 'مدیر کاتالوگ', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' };
        if (m.__isMe) return { text: 'خودم', cls: 'border border-outline-variant/60 text-gray-500 dark:text-gray-400' };
        return null;
    };

    return (
        <div className="space-y-4">
            {/* سربرگ: شمارنده + ثبت مشتری */}
            <div className={cn(CARD_CLS, 'p-4 flex items-center gap-3')}>
                <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100">اعضای کاتالوگ</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {ordered.length.toLocaleString('fa-IR')} عضو · {activeCustomers.length.toLocaleString('fa-IR')} خریدار فعال
                        {canManage && pendingRequests.length > 0 && ` · ${pendingRequests.length.toLocaleString('fa-IR')} درخواست جدید`}
                    </p>
                </div>
                {(canManage || team.myRole?.isSeller) && (
                    <button
                        onClick={() => { setAddOpen(true); setSearch(''); setResults([]); setAssignTo(''); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">ثبت مشتری</span>
                    </button>
                )}
            </div>

            {/* در انتظار تایید مدیر (مالک کاتالوگ) — تایپ‌دار: همکار فروش / خریدار / تامین‌کننده */}
            {canManage && pendingRequests.length > 0 && (
                <div className={cn(CARD_CLS, 'p-4 border-amber-400/40')}>
                    <p className="font-bold text-sm text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                        <Hourglass className="w-4 h-4" />
                        در انتظار تایید مدیر (مالک کاتالوگ) — {pendingRequests.length.toLocaleString('fa-IR')} درخواست
                    </p>
                    <div className="space-y-2">
                        {pendingRequests.map((s) => {
                            const isSellerReq = s.requestType === 'seller';
                            const isBuyerSelf = s.requestType === 'buyer' && s.pendingGate === 'manager';
                            const isBuyerPush = s.requestType === 'buyer' && s.pendingGate === 'business_owner';
                            const isSupplierReq = s.requestType === 'supplier';
                            const entityName = isSupplierReq
                                ? (s.supplierCatalog?.name || '—')
                                : (s.customerBusiness?.name || s.business?.name || s.fullName || '—');
                            return (
                                <div key={s.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10">
                                    <Avatar url={s.avatarUrl} name={s.fullName} size={36} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                                            {isSupplierReq ? <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 ml-1">تامین‌کننده</span> : null}
                                            {s.fullName || entityName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {isSupplierReq && s.supplierCatalog?.name ? `کاتالوگ: ${s.supplierCatalog.name} · ` : ''}
                                            {entityName !== s.fullName ? `${entityName} · ` : ''}
                                            {s.memberCity || ''}
                                            {canManage && s.phone ? ` · ${s.phone}` : ''}
                                        </p>
                                        {isBuyerPush ? (
                                            <p className="text-[11px] text-amber-600 dark:text-amber-400">در انتظار تایید صاحب کسب‌وکار (ثبت‌شده توسط مسئول فروش)</p>
                                        ) : (
                                            <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                                درخواست ارتباط تجاری: {isSellerReq ? 'همکار فروش' : isBuyerSelf ? 'خریدار' : 'تامین‌کننده'} — در انتظار تایید مدیر (مالک کاتالوگ)
                                            </p>
                                        )}
                                    </div>
                                    {busy === `apr-${s.id}` ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : isBuyerPush ? (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('ثبت این خریدار حذف شود؟')) {
                                                    run(`apr-${s.id}`, () => apiService.catalog.team.removeCustomer(catalogId, s.id), 'ثبت حذف شد');
                                                }
                                            }}
                                            className="h-8 px-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-bold flex-shrink-0"
                                            title="حذف ثبت"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1 flex-shrink-0" onClick={() => { setMenuFor(null); setApproveFor(null); }}>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setApproveFor(approveFor === s.id ? null : s.id)}
                                                    className="h-8 px-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1"
                                                    title={isSellerReq ? 'تایید با تعیین نقش بیزینسی' : 'تایید درخواست ارتباط تجاری'}
                                                >
                                                    <Check className="w-3.5 h-3.5" />تایید
                                                </button>
                                                {approveFor === s.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-30" onClick={() => setApproveFor(null)} />
                                                        <div className="absolute left-0 top-full mt-1 z-40 w-44 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-outline-variant/30 py-1.5 text-xs">
                                                            {isSellerReq ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => run(`apr-${s.id}`, () => apiService.catalog.team.approveSeller(catalogId, s.id, 'seller'), 'به‌عنوان فروشنده به اعضا اضافه شد')}
                                                                        className="w-full px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right"
                                                                    >
                                                                        به‌عنوان <b>فروشنده</b>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => run(`apr-${s.id}`, () => apiService.catalog.team.approveSeller(catalogId, s.id, 'visitor'), 'به‌عنوان ویزیتور به اعضا اضافه شد')}
                                                                        className="w-full px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right"
                                                                    >
                                                                        به‌عنوان <b>ویزیتور</b>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={() => run(
                                                                        `apr-${s.id}`,
                                                                        () => (isBuyerSelf
                                                                            ? apiService.catalog.team.approveBuyer(catalogId, s.id)
                                                                            : apiService.catalog.team.approveSupplier(catalogId, s.id)),
                                                                        'به اعضا اضافه شد',
                                                                    )}
                                                                    className="w-full px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right"
                                                                >
                                                                    تایید درخواست ارتباط تجاری
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => run(
                                                    `rej-${s.id}`,
                                                    () => (isSellerReq
                                                        ? apiService.catalog.team.rejectSeller(catalogId, s.id)
                                                        : isBuyerSelf
                                                            ? apiService.catalog.team.rejectBuyer(catalogId, s.id)
                                                            : apiService.catalog.team.rejectSupplier(catalogId, s.id)),
                                                    'درخواست رد شد',
                                                )}
                                                className="h-8 px-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-bold"
                                                title="رد"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* فهرست سادهٔ اعضا */}
            <div className={cn(CARD_CLS, 'p-2')}>
                {ordered.map((m: any) => {
                    const bb = bizBadge(m);
                    const sb = sysBadge(m);
                    const personalSlug = m.supplierCatalog?.slug || m.customerBusiness?.slug || m.sellerBusiness?.slug || m.business?.slug || null;
                    const cityChip = m.sellerRegion || m.memberCity || (m.customerStatus ? m.customerBusiness?.city : null) || null;
                    const menuOpen = menuFor === m.id;
                    return (
                        <div key={m.id} className={cn(
                            'flex items-center gap-2.5 p-2.5 rounded-xl transition-colors',
                            m.__isMyCustomer ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                        )}>
                            <Avatar url={m.avatarUrl} name={m.fullName} />
                            <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => personalSlug && router.push(`/${personalSlug}`)}
                                title={personalSlug ? 'مشاهده صفحهٔ شخصی' : undefined}
                            >
                                <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{m.fullName || 'بدون نام'}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5 flex items-center gap-2">
                                    {(m.customerBusiness?.name || m.sellerBusiness?.name || m.supplierCatalog?.name || m.business?.name) && (
                                        <span className="truncate">
                                            {m.supplierCatalog?.name && m.supplierCatalog?.slug ? 'کاتالوگ: ' : ''}
                                            {m.customerBusiness?.name || m.sellerBusiness?.name || m.supplierCatalog?.name || m.business?.name}
                                        </span>
                                    )}
                                    {cityChip && (
                                        <span className="inline-flex items-center gap-0.5 flex-shrink-0 text-gray-400">
                                            <MapPin className="w-3 h-3" />{cityChip}
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* نقش بیزینسی */}
                            <span className={cn(badgeBase, 'w-16 flex-shrink-0', bb?.cls || 'invisible')}>{bb?.text || '—'}</span>

                            {/* منوی مدیریت */}
                            {canManage && !m.isOwner && (
                                <div className="relative flex-shrink-0">
                                    <button
                                        onClick={() => setMenuFor(menuOpen ? null : m.id)}
                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {menuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                                            <div className="absolute left-0 top-full mt-1 z-40 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-outline-variant/30 py-1.5 text-xs">
                                                {m.sellerStatus === 'active' && (
                                                    <button
                                                        onClick={() => { setMenuFor(null); run(`rl-${m.id}`, () => apiService.catalog.team.setSellerRole(catalogId, m.id, m.sellerRole === 'visitor' ? 'seller' : 'visitor')); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right"
                                                    >
                                                        <ArrowLeftRight className="w-3.5 h-3.5" />
                                                        تبدیل به {m.sellerRole === 'visitor' ? 'فروشنده' : 'ویزیتور'}
                                                    </button>
                                                )}
                                                {m.customerStatus === 'active' && (
                                                    <button
                                                        onClick={() => { setMenuFor(null); setReassignTarget(m); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right"
                                                    >
                                                        <ArrowLeftRight className="w-3.5 h-3.5" />تغییر مسئولِ خریدار
                                                    </button>
                                                )}
                                                {m.sellerStatus === 'active' && (canManage || m.__isMe) && (
                                                    <button
                                                        onClick={() => { setMenuFor(null); setRegionVal(m.sellerRegion || ''); setRegionTarget(m); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right"
                                                    >
                                                        <MapPin className="w-3.5 h-3.5" />{m.sellerRegion ? 'ویرایش منطقهٔ فروش' : 'ثبت منطقهٔ فروش'}
                                                    </button>
                                                )}
                                                {!m.isAdmin && (
                                                    <button
                                                        onClick={() => { setMenuFor(null); run(`adm-${m.id}`, () => apiService.catalog.team.promoteToAdmin(catalogId, m.id), 'به مدیر ارتقا یافت'); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right"
                                                    >
                                                        <ShieldCheck className="w-3.5 h-3.5" />ارتقا به مدیر
                                                    </button>
                                                )}
                                                {m.isAdmin && (
                                                    <button
                                                        onClick={() => { setMenuFor(null); run(`dem-${m.id}`, () => apiService.catalog.team.demoteToMember(catalogId, m.id), 'نقش مدیر گرفته شد'); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right"
                                                    >
                                                        <ShieldOff className="w-3.5 h-3.5" />سلب مدیریت
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`«${m.fullName}» از اعضا حذف شود؟ مشتری‌هایش بی‌مسئول می‌شوند.`)) {
                                                            setMenuFor(null);
                                                            run(`rm-${m.id}`, () => m.sellerStatus === 'active'
                                                                ? apiService.catalog.team.removeSeller(catalogId, m.id)
                                                                : m.supplierStatus === 'active'
                                                                    ? apiService.catalog.team.removeSupplier(catalogId, m.id)
                                                                    : apiService.catalog.team.removeCustomer(catalogId, m.id), 'عضو حذف شد');
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-right"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />حذف عضو
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* نقش سیستمی */}
                            <span className={cn(badgeBase, 'w-24 flex-shrink-0', sb?.cls || 'invisible')}>{sb?.text || '—'}</span>
                        </div>
                    );
                })}
                {ordered.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-400">هنوز عضوی در کاتالوگ نیست</p>
                )}
            </div>

            {/* خروج خودِ عضوِ فروش */}
            {team.myRole?.isSeller && !isOwner && (
                <button
                    onClick={() => {
                        if (window.confirm('از اعضای فروش این کاتالوگ خارج شوید؟ مشتری‌هایتان بی‌مسئول می‌شوند.')) {
                            run('leave', () => apiService.catalog.team.leaveAsSeller(catalogId), 'از اعضا خارج شدید');
                        }
                    }}
                    className="w-full py-3 rounded-xl border border-red-300/50 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-500/5 flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    خروج از اعضای فروش این کاتالوگ
                </button>
            )}

            {/* تاریخچه رویدادها — مالک/مدیر */}
            {canManage && events.length > 0 && (
                <div className={cn(CARD_CLS, 'p-4')}>
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        تاریخچهٔ اعضا
                    </p>
                    <div className="space-y-1.5">
                        {events.slice(0, 15).map((e) => (
                            <div key={e.id} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                                <span className="font-bold text-gray-700 dark:text-gray-300">{e.user?.fullName || '—'}</span>
                                <span>{EVENT_LABEL[e.eventType] || e.eventType}{e.note ? ` (${e.note})` : ''}</span>
                                <span className="mr-auto text-[10px] text-gray-400 flex-shrink-0">
                                    {new Date(e.createdAt).toLocaleDateString('fa-IR')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── مودال منطقهٔ فروش ─── */}
            {regionTarget && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setRegionTarget(null)}>
                    <div
                        className="bg-white dark:bg-gray-900 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">منطقهٔ فروش</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            منطقهٔ {regionTarget.fullName || 'عضو'} — مثل «غرب تهران» (اختیاری)
                        </p>
                        <input
                            value={regionVal}
                            onChange={(e) => setRegionVal(e.target.value)}
                            placeholder="مثلاً: غرب تهران"
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-outline-variant/40 text-sm mb-4"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const t = regionTarget;
                                    setRegionTarget(null);
                                    run(`rg-${t.id}`, () => apiService.catalog.team.setSellerRegion(catalogId, t.id, regionVal.trim() || undefined), 'منطقهٔ فروش ثبت شد');
                                }}
                                disabled={busy === `rg-${regionTarget.id}`}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
                            >
                                ذخیره
                            </button>
                            <button onClick={() => setRegionTarget(null)} className="px-4 py-2.5 rounded-xl border border-outline-variant/40 text-sm">
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── مودال ثبت مشتری ─── */}
            {addOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setAddOpen(false)}>
                    <div
                        className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <p className="font-bold text-gray-900 dark:text-gray-100">ثبت مشتری جدید</p>
                            <button onClick={() => setAddOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {canManage && sellers.length > 1 && (
                            <div className="mb-3">
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">انتساب به عضوِ فروش</label>
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

                        <div className="relative mb-3">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => doSearch(e.target.value)}
                                placeholder="نام کسب‌وکار یا شمارهٔ تماس..."
                                className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-outline-variant/40 text-sm"
                            />
                            {searching && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                        </div>

                        <div className="space-y-2">
                            {results.map((b) => (
                                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 dark:border-gray-800">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{b.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {b.owner?.fullName || ''} · <Phone className="w-3 h-3 inline -mt-0.5" /> {b.owner?.phone || b.phone || '—'}
                                            {b.city && ` · ${b.city}`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            await run(`add-${b.id}`, () =>
                                                apiService.catalog.team.addCustomer(catalogId, {
                                                    businessId: b.id,
                                                    ...(assignTo ? { sellerUserId: assignTo } : {}),
                                                }),
                                                'مشتری ثبت شد — تا تایید صاحب کسب‌وکار، تماسش مسیریابی نمی‌شود');
                                            setResults((rs) => rs.filter((r2) => r2.id !== b.id));
                                        }}
                                        disabled={busy === `add-${b.id}`}
                                        className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold flex-shrink-0 disabled:opacity-50"
                                    >
                                        {busy === `add-${b.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ثبت'}
                                    </button>
                                </div>
                            ))}
                            {search.trim().length >= 2 && !searching && results.length === 0 && (
                                <p className="text-center text-sm text-gray-400 py-4">کسب‌وکاری پیدا نشد</p>
                            )}
                            {search.trim().length < 2 && (
                                <p className="text-center text-sm text-gray-400 py-4">نام یا شمارهٔ سوپرمارکت را بنویسید</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── مودال تغییر مسئولِ مشتری ─── */}
            {reassignTarget && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setReassignTarget(null)}>
                    <div
                        className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">تغییر مسئولِ مشتری</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            مشتری «{reassignTarget.customerBusiness?.name}» به کدام عضوِ فروش سپرده شود؟
                        </p>
                        <div className="space-y-2">
                            {sellers.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        const target = reassignTarget;
                                        setReassignTarget(null);
                                        run(`as-${target.id}`, () => apiService.catalog.team.assignCustomer(catalogId, target.id, s.userId), 'مسئولِ مشتری تغییر کرد');
                                    }}
                                    className={cn(
                                        'w-full flex items-center gap-3 p-3 rounded-xl border text-right transition',
                                        reassignTarget.assignedSellerUserId === s.userId
                                            ? 'border-primary bg-primary/5'
                                            : 'border-outline-variant/30 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                    )}
                                >
                                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                                        {(s.fullName || '؟').slice(0, 1)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                                            {s.fullName || '—'} {s.isOwner && '(مالک)'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {s.sellerRole === 'visitor' ? 'ویزیتور' : 'فروشنده'}
                                            {s.business?.name ? ` · ${s.business.name}` : ''}{s.sellerRegion && ` · ${s.sellerRegion}`}
                                        </p>
                                    </div>
                                    {reassignTarget.assignedSellerUserId === s.userId && (
                                        <span className="text-[10px] text-primary font-bold flex-shrink-0">مسئول فعلی</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
