// app/my-catalogs/components/TeamTab.tsx
// 👥 تب «تیم فروش» کاتالوگ — مالک، مدیر کاتالوگ، همکار فروش/بازاریاب + تامین‌کننده‌ها و خدمات
//    ارتقا به مدیر/سلب مدیریت، تغییر نقش فروش/بازاریاب، منطقهٔ فروش، دعوت همکار
//    ✂️ خریدارها به تب جداگانهٔ «خریداران» (CustomersTab) منتقل شدند — تا ادمین برای خریدار معنا نداشته باشد
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, UserPlus, ShieldCheck, ShieldOff, Trash2, Check, X,
    Loader2, Hourglass, History, LogOut, MoreVertical, ArrowLeftRight, MapPin, Truck,
} from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CARD_CLS } from '../constants';
import { useCatalogTeam } from '@/lib/api/apiHooks';
import ConnectionRequestModal from './ConnectionRequestModal';
import { Avatar, MemberMainInfo, personalSlugOf, bizBadge, sysBadge, badgeBase, EVENT_LABEL, REQUEST_LABEL } from './MemberBits';

interface Props {
    catalogId: string;
    /** اسلاگ کاتالوگ — لینک دعوت در ماژول مخاطبین مودال درخواست ارتباط */
    slug?: string | null;
}

export default function TeamTab({ catalogId, slug }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data, isLoading, refetch } = useCatalogTeam(catalogId);

    const [busy, setBusy] = useState<string | null>(null);
    const [addOpen, setAddOpen] = useState(false);
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
        queryClient.invalidateQueries({ queryKey: ['catalog-pending-summary'] });
        queryClient.invalidateQueries({ queryKey: ['my-pending-approvals'] });
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

    if (isLoading || !team) {
        return (
            <div className="py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            </div>
        );
    }

    // درخواستِ من در انتظار — عضوِ منتظر؛ اگر دعوتِ مدیر باشد خودش می‌پذیرد/رد می‌کند
    if (team.myRole?.isPendingSeller && !canManage) {
        const isInvite = !!team.myRole?.pendingInvite;
        return (
            <div className={cn(CARD_CLS, 'p-6 text-center')}>
                <Hourglass className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                {isInvite ? (
                    <>
                        <p className="font-bold text-gray-900 dark:text-gray-100">به همکاری در فروش این کاتالوگ دعوت شده‌اید</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            با پذیرش، به‌عنوان فروشنده به اعضا اضافه می‌شوید و می‌توانید مشتری ثبت کنید
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <button
                                onClick={() => run('acc-inv', () => apiService.catalog.team.acceptSellerInvite(catalogId), 'دعوت پذیرفته شد')}
                                disabled={busy === 'acc-inv'}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" /> پذیرش دعوت
                            </button>
                            <button
                                onClick={() => run('dec-inv', () => apiService.catalog.team.declineSellerInvite(catalogId), 'دعوت رد شد')}
                                disabled={busy === 'dec-inv'}
                                className="px-5 py-2.5 rounded-xl border border-outline-variant/50 text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-50"
                            >
                                رد دعوت
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="font-bold text-gray-900 dark:text-gray-100">درخواست همکاری در فروش شما ثبت شد</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            در انتظار تایید مدیر کاتالوگ — بعد از تایید، می‌توانید مشتری‌های خودتان را ثبت کنید
                        </p>
                    </>
                )}
            </div>
        );
    }

    const staff: any[] = team.staff || [];
    const pendingRequests: any[] = (team.pendingRequests || []).filter((s: any) => s.requestType !== 'buyer');
    const sellers: any[] = team.sellers || [];
    const suppliers: any[] = team.suppliers || [];
    const services: any[] = team.services || [];

    const decorate = (m: any) => ({
        ...m,
        __isMe: m.userId === team.myRole?.userId && !m.isOwner && !m.isAdmin,
    });
    // ✅ دی‌دوپ — مدیری که خودش هم فروشندهٔ فعال است فقط یک‌بار نشان داده شود
    const teamRows = [...staff, ...sellers].map(decorate)
        .filter((m: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === m.id) === i)
        .sort((a: any, b: any) => {
            const rank = (m: any) => (m.isOwner ? 0 : m.isAdmin ? 1 : m.__isMe ? 2 : m.sellerStatus === 'active' ? 3 : 4);
            return rank(a) - rank(b);
        });
    const supplyRows = [...suppliers, ...services].map(decorate);

    // ─── منوی مدیریت هر ردیف — فقط اقداماتِ معنادار برای همان نقش ───
    //    ارتقا به مدیر فقط برای اعضای تیم فروش؛ حذف فقط برای نقش‌هایی که اندپوینت دارند
    const menuActionsFor = (m: any) => {
        const acts: { key: string; icon: any; label: string; onClick: () => void; danger?: boolean }[] = [];
        if (m.sellerStatus === 'active') {
            acts.push({
                key: 'role',
                icon: ArrowLeftRight,
                label: `تبدیل به ${m.sellerRole === 'visitor' ? 'فروشنده' : 'ویزیتور'}`,
                onClick: () => run(`rl-${m.id}`, () => apiService.catalog.team.setSellerRole(catalogId, m.id, m.sellerRole === 'visitor' ? 'seller' : 'visitor')),
            });
            if (canManage || m.__isMe) {
                acts.push({
                    key: 'region',
                    icon: MapPin,
                    label: m.sellerRegion ? 'ویرایش منطقهٔ فروش' : 'ثبت منطقهٔ فروش',
                    onClick: () => { setRegionVal(m.sellerRegion || ''); setRegionTarget(m); },
                });
            }
        }
        // ✅ ارتقا/سلب مدیریت — فقط اعضای تیم فروش (تامین‌کننده/خدمات بیرون می‌مانند)
        if (m.sellerStatus === 'active' && !m.isAdmin) {
            acts.push({
                key: 'promote',
                icon: ShieldCheck,
                label: 'ارتقا به مدیر',
                onClick: () => run(`adm-${m.id}`, () => apiService.catalog.team.promoteToAdmin(catalogId, m.id), 'به مدیر ارتقا یافت'),
            });
        }
        if (m.isAdmin) {
            acts.push({
                key: 'demote',
                icon: ShieldOff,
                label: 'سلب مدیریت',
                onClick: () => run(`dem-${m.id}`, () => apiService.catalog.team.demoteToMember(catalogId, m.id), 'نقش مدیر گرفته شد'),
            });
        }
        if (m.sellerStatus === 'active') {
            acts.push({
                key: 'remove',
                icon: Trash2,
                label: 'حذف از تیم فروش',
                danger: true,
                onClick: () => {
                    if (window.confirm(`«${m.fullName}» از تیم فروش حذف شود؟ مشتری‌هایش بی‌مسئول می‌شوند.`)) {
                        run(`rm-${m.id}`, () => apiService.catalog.team.removeSeller(catalogId, m.id), 'عضو حذف شد');
                    }
                },
            });
        } else if (m.supplierStatus === 'active') {
            acts.push({
                key: 'remove',
                icon: Trash2,
                label: 'حذف تامین‌کننده',
                danger: true,
                onClick: () => {
                    if (window.confirm(`«${m.fullName}» از تامین‌کننده‌های کاتالوگ حذف شود؟`)) {
                        run(`rm-${m.id}`, () => apiService.catalog.team.removeSupplier(catalogId, m.id), 'تامین‌کننده حذف شد');
                    }
                },
            });
        }
        return acts;
    };

    const rowFor = (m: any) => {
        const bb = bizBadge(m);
        const sb = sysBadge(m);
        const menuOpen = menuFor === m.id;
        const actions = canManage && !m.isOwner ? menuActionsFor(m) : [];
        const pSlug = personalSlugOf(m);
        return (
            <div key={m.id} className="flex items-center gap-2.5 p-2.5 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <Avatar url={m.avatarUrl} name={m.fullName} />
                <MemberMainInfo m={m} onOpen={pSlug ? () => router.push(`/${pSlug}`) : undefined} />

                {/* نقش بیزینسی */}
                <span className={cn(badgeBase, 'w-16 flex-shrink-0', bb?.cls || 'invisible')}>{bb?.text || '—'}</span>

                {/* منوی مدیریت */}
                {actions.length > 0 && (
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={() => setMenuFor(menuOpen ? null : m.id)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="اقدامات"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                                <div className="absolute left-0 top-full mt-1 z-40 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-outline-variant/30 py-1.5 text-xs">
                                    {actions.map((a) => (
                                        <button
                                            key={a.key}
                                            onClick={() => { setMenuFor(null); a.onClick(); }}
                                            className={cn(
                                                'w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right',
                                                a.danger && 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400',
                                            )}
                                        >
                                            <a.icon className="w-3.5 h-3.5" />{a.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* نقش سیستمی */}
                <span className={cn(badgeBase, 'w-24 flex-shrink-0', sb?.cls || 'invisible')}>{sb?.text || '—'}</span>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* سربرگ: شمارندهٔ تیم + دعوت همکار */}
            <div className={cn(CARD_CLS, 'p-4 flex items-center gap-3')}>
                <span className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100">تیم فروش کاتالوگ</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {teamRows.length.toLocaleString('fa-IR')} عضو — مالک، مدیر و همکاران فروش
                        {canManage && pendingRequests.length > 0 && ` · ${pendingRequests.length.toLocaleString('fa-IR')} درخواست جدید`}
                    </p>
                </div>
                {canManage && (
                    <button
                        onClick={() => { setAddOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">دعوت همکار / تامین‌کننده</span>
                        <span className="sm:hidden">دعوت</span>
                    </button>
                )}
            </div>

            {/* درخواست‌های در انتظار تعیین تکلیف شما — فروش/تامین‌کننده/خدمات (خریدار در تب خریداران) */}
            {canManage && pendingRequests.length > 0 && (
                <div className={cn(CARD_CLS, 'p-4 border-amber-400/40')}>
                    <p className="font-bold text-sm text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                        <Hourglass className="w-4 h-4" />
                        درخواست‌های در انتظار تایید شما — {pendingRequests.length.toLocaleString('fa-IR')} مورد
                    </p>
                    <div className="space-y-2">
                        {pendingRequests.map((s) => {
                            const isSellerReq = s.requestType === 'seller';
                            const isSupplierReq = s.requestType === 'supplier';
                            const isServiceReq = s.requestType === 'service';
                            const entityName = (isSupplierReq || isServiceReq)
                                ? ((isServiceReq ? s.serviceCatalog?.name : s.supplierCatalog?.name) || '—')
                                : (s.sellerBusiness?.name || s.customerBusiness?.name || s.business?.name || s.fullName || '—');
                            return (
                                <div key={s.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10">
                                    <Avatar url={s.avatarUrl} name={s.fullName} size={36} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                                            {isSupplierReq && <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 ml-1">تامین‌کننده</span>}
                                            {isServiceReq && <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 ml-1">سرویس‌دهنده</span>}
                                            {s.fullName || entityName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {(entityName !== s.fullName) ? `${entityName} · ` : ''}
                                            {s.memberCity || ''}
                                            {canManage && s.phone ? ` · ${s.phone}` : ''}
                                        </p>
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                            {REQUEST_LABEL[s.requestType] || 'درخواست ارتباط تجاری'} — در انتظار تایید شما
                                        </p>
                                    </div>
                                    {busy === `apr-${s.id}` ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : (
                                        <div className="flex items-center gap-1 flex-shrink-0" onClick={() => { setMenuFor(null); setApproveFor(null); }}>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setApproveFor(approveFor === s.id ? null : s.id)}
                                                    className="h-8 px-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1"
                                                    title="تایید درخواست"
                                                >
                                                    <Check className="w-3.5 h-3.5" />تایید
                                                </button>
                                                {approveFor === s.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-30" onClick={() => setApproveFor(null)} />
                                                        <div className="absolute left-0 top-full mt-1 z-40 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-outline-variant/30 py-1.5 text-xs">
                                                            {isSellerReq ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => run(`apr-${s.id}`, () => apiService.catalog.team.approveSeller(catalogId, s.id, 'seller'), 'به‌عنوان همکار فروش تایید شد')}
                                                                        className="w-full px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right"
                                                                    >
                                                                        تایید به‌عنوان <b>همکار فروش</b>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => run(`apr-${s.id}`, () => apiService.catalog.team.approveSeller(catalogId, s.id, 'visitor'), 'به‌عنوان بازاریاب تایید شد')}
                                                                        className="w-full px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right"
                                                                    >
                                                                        تایید به‌عنوان <b>بازاریاب (ویزیتور)</b>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={() => run(
                                                                        `apr-${s.id}`,
                                                                        () => (isSupplierReq
                                                                            ? apiService.catalog.team.approveSupplier(catalogId, s.id)
                                                                            : apiService.catalog.team.approveService(catalogId, s.id)),
                                                                        'به اعضا اضافه شد',
                                                                    )}
                                                                    className="w-full px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right"
                                                                >
                                                                    تایید {REQUEST_LABEL[s.requestType] || 'درخواست'}
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
                                                        : isSupplierReq
                                                            ? apiService.catalog.team.rejectSupplier(catalogId, s.id)
                                                            : apiService.catalog.team.rejectService(catalogId, s.id)),
                                                    'درخواست رد شد',
                                                )}
                                                className="h-8 px-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-bold"
                                                title="رد درخواست"
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

            {/* تیم فروش و مدیریت — مالک/مدیر/فروشنده/بازاریاب */}
            <div className={cn(CARD_CLS, 'p-2')}>
                <p className="flex items-center gap-1.5 px-2 pt-2 pb-1 text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                    <Users className="h-3.5 w-3.5" />
                    تیم فروش و مدیریت
                </p>
                {teamRows.map((m: any) => <React.Fragment key={m.id}>{rowFor(m)}</React.Fragment>)}
            </div>

            {/* تامین‌کننده‌ها و خدمات — لِین کاتالوگ قیمت */}
            {supplyRows.length > 0 && (
                <div className={cn(CARD_CLS, 'p-2')}>
                    <p className="flex items-center gap-1.5 px-2 pt-2 pb-1 text-[11px] font-black text-sky-700 dark:text-sky-400">
                        <Truck className="h-3.5 w-3.5" />
                        تامین‌کننده‌ها و خدمات
                    </p>
                    {supplyRows.map((m: any) => <React.Fragment key={m.id}>{rowFor(m)}</React.Fragment>)}
                </div>
            )}

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
            {canManage && (team.events || []).length > 0 && (
                <div className={cn(CARD_CLS, 'p-4')}>
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        تاریخچهٔ اعضا
                    </p>
                    <div className="space-y-1.5">
                        {team.events.slice(0, 15).map((e: any) => (
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

            {/* ─── مودال درخواست ارتباط — دعوت همکار (افراد) / تامین‌کننده (کاتالوگ‌ها) ─── */}
            <ConnectionRequestModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                catalogId={catalogId}
                canAssign={canManage}
                sellers={sellers}
                slug={slug}
                defaultScope="people"
            />
        </div>
    );
}
