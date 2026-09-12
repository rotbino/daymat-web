// app/my-catalogs/components/TeamTab.tsx
'use client';

import React, { useState } from 'react';
import {
    Users, UserPlus, Store, MapPin, ShieldCheck, ShieldOff, Trash2, Check, X,
    Loader2, Search, BadgeCheck, Hourglass, Phone, History, LogOut, UserCog,
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
    d ? new Date(d).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
    active: { label: 'فعال', cls: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/25' },
    pending: { label: 'در انتظار تایید', cls: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/25' },
    removed: { label: 'حذف‌شده', cls: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/25' },
};

/** تب تیم کاتالوگ — بازاریاب‌ها (فروشنده) و مشتری‌ها (سوپرمارکت‌ها) و ادمین‌ها
 *  سناریوی بازار پخش: اونر کاتالوگ تیم شرکت را می‌دهد؛ هر مشتری به بازاریابِ خودش منتسب است
 *  تا تماسش از آگهی به همان بازاریاب برسد. */
export default function TeamTab({ catalogId }: Props) {
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
    const [assignTo, setAssignTo] = useState(''); // sellerUserId برای افزودن (اونر/ادمین)
    const [reassignTarget, setReassignTarget] = useState<any>(null);

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

    // درخواستِ من در انتظار تایید — بازاریابِ منتظر
    if (team.myRole?.isPendingSeller && !canManage) {
        return (
            <div className={cn(CARD_CLS, 'p-6 text-center')}>
                <Hourglass className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <p className="font-bold text-gray-900 dark:text-gray-100">درخواست فروشندگی شما ثبت شده</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    تا تایید اونر کاتالوگ صبر کنید — بعد از تایید می‌توانید مشتری‌های خودتان را ثبت کنید
                </p>
            </div>
        );
    }

    const pendingSellers: any[] = team.pendingSellers || [];
    const sellers: any[] = team.sellers || [];
    const customers: any[] = team.customers || [];
    const events: any[] = team.events || [];
    const activeCustomers = customers.filter((c) => c.customerStatus === 'active');
    const pendingCustomers = customers.filter((c) => c.customerStatus === 'pending');

    return (
        <div className="space-y-4">
            {/* نوار آمار */}
            <div className={cn(CARD_CLS, 'p-4 flex items-center gap-3')}>
                <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100">تیم کاتالوگ</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {sellers.length.toLocaleString('fa-IR')} بازاریاب · {activeCustomers.length.toLocaleString('fa-IR')} مشتری فعال
                        {pendingSellers.length > 0 && ` · ${pendingSellers.length.toLocaleString('fa-IR')} درخواست فروشندگی جدید`}
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

            {/* درخواست‌های فروشندگی — اونر/ادمین */}
            {canManage && pendingSellers.length > 0 && (
                <div className={cn(CARD_CLS, 'p-4 border-amber-400/40')}>
                    <p className="font-bold text-sm text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                        <Hourglass className="w-4 h-4" />
                        درخواست‌های عضویت فروشندگی ({pendingSellers.length.toLocaleString('fa-IR')})
                    </p>
                    <div className="space-y-2">
                        {pendingSellers.map((s) => (
                            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{s.fullName || 'بدون نام'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        کسب‌وکار: {s.business?.name || '—'} · {s.phone}
                                    </p>
                                    <p className="text-[11px] text-gray-400">درخواست: {faDate(s.joinedAt) || '—'}</p>
                                </div>
                                {busy === `apr-${s.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        <button
                                            onClick={() => run(`apr-${s.id}`, () => apiService.catalog.team.approveSeller(catalogId, s.id), 'بازاریاب به تیم اضافه شد')}
                                            className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                                            title="تایید"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => run(`rej-${s.id}`, () => apiService.catalog.team.rejectSeller(catalogId, s.id), 'درخواست رد شد')}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                            title="رد"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* بازاریاب‌ها */}
            <div className={cn(CARD_CLS, 'p-4')}>
                <p className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" />
                    بازاریاب‌های کاتالوگ
                </p>
                <div className="space-y-2">
                    {sellers.map((s) => {
                        return (
                            <div key={s.id} className="p-3 rounded-xl border border-outline-variant/30 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{s.fullName || 'بدون نام'}</p>
                                            {s.isOwner && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">اونر</span>}
                                            {s.isAdmin && !s.isOwner && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">ادمین</span>
                                            )}
                                            {s.position && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{s.position}</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                            {s.business?.name || '—'}
                                            {' · '}
                                            {(s.customersCount ?? 0).toLocaleString('fa-IR')} مشتری
                                            {s.sellerJoinedAt && ` · عضو از ${faDate(s.sellerJoinedAt)}`}
                                        </p>
                                    </div>
                                    {busy === `rm-${s.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {!s.isOwner && canManage && (
                                                <>
                                                    {isOwner && !s.isAdmin && (
                                                        <button
                                                            onClick={() => run(`adm-${s.id}`, () => apiService.catalog.team.promoteToAdmin(catalogId, s.id), 'ادمین کاتالوگ شد')}
                                                            className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20"
                                                            title="ادمین کن — دسترسی ویرایش کاتالوگ"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {isOwner && s.isAdmin && (
                                                        <button
                                                            onClick={() => run(`dem-${s.id}`, () => apiService.catalog.team.demoteToMember(catalogId, s.id), 'نقش ادمین گرفته شد')}
                                                            className="p-2 rounded-lg bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
                                                            title="گرفتن نقش ادمین"
                                                        >
                                                            <ShieldOff className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`«${s.fullName}» از تیم حذف شود؟ مشتری‌هایش بی‌مسئول می‌شوند.`)) {
                                                                run(`rm-${s.id}`, () => apiService.catalog.team.removeSeller(catalogId, s.id), 'بازاریاب حذف شد');
                                                            }
                                                        }}
                                                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                        title="حذف از تیم"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* منطقه فروش */}
                                <RegionRow
                                    catalogId={catalogId}
                                    seller={s}
                                    editable={canManage || s.userId === team.myRole?.userId}
                                    busy={busy === `rg-${s.id}`}
                                    onSave={(region) => run(`rg-${s.id}`, () => apiService.catalog.team.setSellerRegion(catalogId, s.id, region), 'منطقه ثبت شد')}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* مشتری‌ها */}
            <div className={cn(CARD_CLS, 'p-4')}>
                <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-primary" />
                        {canManage ? 'مشتری‌های کاتالوگ (سوپرمارکت‌ها)' : 'مشتری‌های من'}
                    </p>
                    <span className="text-xs text-gray-400">{activeCustomers.length.toLocaleString('fa-IR')} فعال</span>
                </div>

                {pendingCustomers.length > 0 && (
                    <div className="mb-3 space-y-2">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-300">در انتظار تایید صاحب کسب‌وکار:</p>
                        {pendingCustomers.map((c) => (
                            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10">
                                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{c.customerBusiness?.name || '—'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        بازاریاب: {c.sellerName || '—'} · ثبت: {faDate(c.joinedAt)}
                                    </p>
                                </div>
                                <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold', STATUS_CHIP.pending.cls)}>منتظر تایید</span>
                                {canManage && busy !== `rmc-${c.id}` && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm('ثبت این مشتری حذف شود؟')) {
                                                run(`rmc-${c.id}`, () => apiService.catalog.team.removeCustomer(catalogId, c.id), 'ثبت حذف شد');
                                            }
                                        }}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                        title="حذف ثبت"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                {busy === `rmc-${c.id}` && <Loader2 className="w-4 h-4 animate-spin" />}
                            </div>
                        ))}
                    </div>
                )}

                {activeCustomers.length === 0 && pendingCustomers.length === 0 && (
                    <div className="py-6 text-center text-sm text-gray-400">
                        هنوز مشتری‌ای ثبت نشده — با «ثبت مشتری» سوپرمارکت‌های منطقه‌تان را اضافه کنید
                    </div>
                )}

                <div className="space-y-2">
                    {activeCustomers.map((c) => {
                        const canRemoveThis = canManage || c.assignedSellerUserId === team.myRole?.userId;
                        return (
                            <div key={c.id} className="p-3 rounded-xl border border-outline-variant/30 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{c.customerBusiness?.name || '—'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            بازاریاب: {c.sellerName || 'بی‌مسئول'}
                                            {c.customerBusiness?.city && ` · ${c.customerBusiness.city}`}
                                            {c.customerJoinedAt && ` · مشتری از ${faDate(c.customerJoinedAt)}`}
                                        </p>
                                    </div>
                                    <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold flex-shrink-0', STATUS_CHIP.active.cls)}>
                                        <BadgeCheck className="w-3 h-3 inline ml-0.5 -mt-0.5" />
                                        فعال
                                    </span>
                                    {busy !== `rmc-${c.id}` ? (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {canManage && (
                                                <button
                                                    onClick={() => setReassignTarget(c)}
                                                    className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20"
                                                    title="تغییر بازاریاب"
                                                >
                                                    <MapPin className="w-4 h-4" />
                                                </button>
                                            )}
                                            {canRemoveThis && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`«${c.customerBusiness?.name}» از کاتالوگ حذف شود؟`)) {
                                                            run(`rmc-${c.id}`, () => apiService.catalog.team.removeCustomer(catalogId, c.id), 'مشتری حذف شد');
                                                        }
                                                    }}
                                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                    title="حذف مشتری"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ) : <Loader2 className="w-4 h-4 animate-spin" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* خروج خودِ بازاریاب */}
            {team.myRole?.isSeller && !isOwner && (
                <button
                    onClick={() => {
                        if (window.confirm('از تیم فروش این کاتالوگ خارج شوید؟ مشتری‌هایتان بی‌مسئول می‌شوند.')) {
                            run('leave', () => apiService.catalog.team.leaveAsSeller(catalogId), 'از تیم خارج شدید');
                        }
                    }}
                    className="w-full py-3 rounded-xl border border-red-300/50 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-500/5 flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    خروج از تیم فروش این کاتالوگ
                </button>
            )}

            {/* تاریخچه رویدادها — اونر/ادمین */}
            {canManage && events.length > 0 && (
                <div className={cn(CARD_CLS, 'p-4')}>
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        تاریخچهٔ تیم
                    </p>
                    <div className="space-y-1.5">
                        {events.slice(0, 15).map((e) => (
                            <div key={e.id} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                                <span className="font-bold text-gray-700 dark:text-gray-300">{e.user?.fullName || '—'}</span>
                                <span>{EVENT_LABEL[e.eventType] || e.eventType}</span>
                                <span className="mr-auto text-[10px] text-gray-400 flex-shrink-0">
                                    {new Date(e.createdAt).toLocaleDateString('fa-IR')}
                                </span>
                            </div>
                        ))}
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
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">انتساب به بازاریاب</label>
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

            {/* ─── مودال تغییر بازاریاب مشتری ─── */}
            {reassignTarget && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setReassignTarget(null)}>
                    <div
                        className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">تغییر بازاریاب</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            مشتری «{reassignTarget.customerBusiness?.name}» به کدام بازاریاب سپرده شود؟
                        </p>
                        <div className="space-y-2">
                            {sellers.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        const target = reassignTarget;
                                        setReassignTarget(null);
                                        run(`as-${target.id}`, () => apiService.catalog.team.assignCustomer(catalogId, target.id, s.userId), 'مشتری منتسب شد');
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
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{s.fullName || '—'} {s.isOwner && '(اونر)'}</p>
                                        <p className="text-xs text-gray-500 truncate">{s.business?.name || ''}{s.sellerRegion && ` · ${s.sellerRegion}`}</p>
                                    </div>
                                    {reassignTarget.assignedSellerUserId === s.userId && (
                                        <span className="text-[10px] text-primary font-bold flex-shrink-0">فعلی</span>
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

// ─── ردیف منطقه فروش ───
function RegionRow({ catalogId, seller, editable, busy, onSave }: {
    seller: any;
    editable: boolean;
    busy: boolean;
    onSave: (region?: string) => void;
    catalogId: string;
}) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(seller.sellerRegion || '');

    if (!editable) {
        return seller.sellerRegion ? (
            <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> منطقه: {seller.sellerRegion}
            </p>
        ) : null;
    }

    if (!editing) {
        return (
            <button
                onClick={() => { setVal(seller.sellerRegion || ''); setEditing(true); }}
                className="mt-1.5 text-[11px] text-gray-400 hover:text-primary transition flex items-center gap-1"
            >
                <MapPin className="w-3 h-3" />
                {seller.sellerRegion ? `منطقه: ${seller.sellerRegion} — ویرایش` : 'تعیین منطقهٔ فروش'}
            </button>
        );
    }

    return (
        <div className="mt-2 flex items-center gap-2">
            <input
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder="مثلاً: غرب تهران"
                className="flex-1 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-outline-variant/40 text-xs"
                autoFocus
            />
            <button
                onClick={() => { setEditing(false); onSave(val.trim() || undefined); }}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50"
            >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : 'ذخیره'}
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 text-gray-400">
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

const EVENT_LABEL: Record<string, string> = {
    seller_requested: 'درخواست فروشندگی داد',
    seller_approved: 'به‌عنوان بازاریاب تایید شد',
    seller_rejected: 'درخواست فروشندگی‌اش رد شد',
    seller_removed: 'از تیم حذف شد',
    seller_left: 'خودش از تیم خارج شد',
    admin_promoted: 'ادمین کاتالوگ شد',
    admin_demoted: 'نقش ادمینش گرفته شد',
    customer_added: 'به‌عنوان مشتری ثبت شد',
    customer_confirmed: 'مشتری‌بودنش را تایید کرد',
    customer_declined: 'ثبت مشتری‌بودنش را رد کرد',
    customer_removed: 'به‌عنوان مشتری حذف شد',
    customer_left: 'مشتری‌بودنش را لغو کرد',
    customer_reassigned: 'به بازاریاب دیگری منتسب شد',
    customer_unassigned: 'بی‌مسئول شد',
    region_set: 'منطقه‌اش تغییر کرد',
    joined: 'به تیم کاتالوگ اضافه شد',
    migrated: 'به مدل تیم کاتالوگ منتقل شد',
};
