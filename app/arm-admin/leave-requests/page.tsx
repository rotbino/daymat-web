// app/arm-admin/leave-requests/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import {
    UserMinus, Building2, BookOpen, ShoppingBag, Store, Loader2, Check, X,
    Phone, MapPin, ExternalLink, Clock, Inbox, User, AlertCircle, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * درخواست‌های لغو عضویت — پنل مالک/ادمین بازار:
 *   عضو (خریدار/فروشنده) درخواست لغو می‌دهد → اینجا بررسی می‌شود.
 *   تایید = عضویت لغو می‌شود (تاریخ دقیق + عاملِ لغو + ردِ خروجِ فروشنده ثبت می‌شود)
 *   رد = عضو می‌ماند (دلیل رد در اعلان عضو می‌رود)
 *   همهٔ تصمیم‌ها با تاریخ دقیق در تاریخچهٔ عضویت ثبت می‌شوند — برای شکایت‌ها.
 */

type StatusTab = 'pending' | 'approved' | 'rejected';

const TABS: { key: StatusTab; label: string }[] = [
    { key: 'pending', label: 'در انتظار بررسی' },
    { key: 'approved', label: 'لغوشده' },
    { key: 'rejected', label: 'ردشده' },
];

const ROLE_LABEL: Record<string, string> = { buyer: 'خریدار', seller: 'فروشنده' };

export default function LeaveRequestsPage() {
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);

    if (!currentSlug) {
        return <div className="text-center py-16 text-sm text-on-surface-variant">ابتدا بازار را انتخاب کنید</div>;
    }
    return <LeaveRequestsContent slug={currentSlug} armName={currentArm?.name || currentSlug} />;
}

function LeaveRequestsContent({ slug, armName }: { slug: string; armName: string }) {
    const [tab, setTab] = useState<StatusTab>('pending');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['arm-leave-requests', slug, tab],
        queryFn: () => apiService.armAdmin.getLeaveRequests(slug, { status: tab, limit: 50 }),
        staleTime: 15_000,
    });

    const items: any[] = data?.items ?? [];
    const pendingCount: number = data?.pendingCount ?? 0;

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['arm-leave-requests', slug] });
        queryClient.invalidateQueries({ queryKey: ['notifications-derived'] });
    };

    // ✅ تاییدِ لغو — عملیاتِ نهایی: عضویت لغو می‌شود؛ با تایید دومرحله‌ای
    const handleApprove = async (requestId: string) => {
        setBusyId(requestId);
        try {
            await apiService.armAdmin.approveLeaveRequest(slug, requestId);
            toast.success('لغو عضویت انجام شد — تاریخ و عاملِ لغو در پروندهٔ عضو ثبت شد');
            setApprovingId(null);
            invalidate();
        } catch (e: any) {
            toast.error(e?.data?.message || 'خطا در تایید لغو عضویت');
        } finally {
            setBusyId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!rejectReason.trim()) {
            toast.error('دلیل رد را بنویسید — به عضو نمایش داده می‌شود');
            return;
        }
        setBusyId(requestId);
        try {
            await apiService.armAdmin.rejectLeaveRequest(slug, requestId, rejectReason.trim());
            toast.success('درخواست لغو رد شد — عضو می‌ماند و دلیل را در اعلانش می‌بیند');
            setRejectingId(null);
            setRejectReason('');
            invalidate();
        } catch (e: any) {
            toast.error(e?.data?.message || 'خطا در رد درخواست لغو');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* هدر */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
                        <UserMinus className="w-5 h-5 text-rose-500" />
                        درخواست‌های لغو عضویت
                    </h1>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                        بازار {armName} — خروجِ اعضا فقط با تصمیم شما؛ تاریخ‌ها در پرونده ثبت می‌شود
                    </p>
                </div>
                {pendingCount > 0 && tab !== 'pending' && (
                    <button type="button" onClick={() => setTab('pending')}
                            className="h-9 px-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300
                                text-[12px] font-bold border border-amber-200/70 dark:border-amber-800/60">
                        {pendingCount.toLocaleString('fa-IR')} درخواست در انتظار
                    </button>
                )}
            </div>

            {/* تب‌ها */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {TABS.map((t) => (
                    <button key={t.key} type="button" onClick={() => setTab(t.key)}
                            className={cn(
                                'h-9 px-4 rounded-lg text-[12px] font-bold transition-colors border',
                                tab === t.key
                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                    : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high',
                            )}>
                        {t.label}
                        {t.key === 'pending' && pendingCount > 0 && (
                            <span className="mr-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[9.5px] font-extrabold">
                                {pendingCount.toLocaleString('fa-IR')}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* لیست */}
            {isLoading ? (
                <div className="py-16 flex justify-center">
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-16">
                    <Inbox className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                    <p className="text-sm font-bold text-on-surface mb-1">درخواستی در این وضعیت نیست</p>
                    <p className="text-xs text-on-surface-variant">
                        وقتی عضوی بخواهد از بازار خارج شود، درخواستش اینجا می‌آید.
                    </p>
                </div>
            ) : (
                <div className={cn('space-y-3 transition-opacity', isFetching && 'opacity-60')}>
                    {items.map((r) => (
                        <LeaveRequestCard
                            key={r.id}
                            r={r}
                            busy={busyId === r.id}
                            rejecting={rejectingId === r.id}
                            rejectReason={rejectingId === r.id ? rejectReason : ''}
                            approving={approvingId === r.id}
                            onRejectReasonChange={(v) => setRejectReason(v)}
                            onOpenReject={() => { setRejectingId(r.id); setRejectReason(''); setApprovingId(null); }}
                            onOpenApprove={() => { setApprovingId(r.id); setRejectingId(null); }}
                            onCancel={() => { setRejectingId(null); setApprovingId(null); }}
                            onApprove={() => handleApprove(r.id)}
                            onReject={() => handleReject(r.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══ کارت هر درخواست لغو ═══
function LeaveRequestCard({
    r, busy, rejecting, rejectReason, approving,
    onRejectReasonChange, onOpenReject, onOpenApprove, onCancel, onApprove, onReject,
}: {
    r: any;
    busy: boolean;
    rejecting: boolean;
    rejectReason: string;
    approving: boolean;
    onRejectReasonChange: (v: string) => void;
    onOpenReject: () => void;
    onOpenApprove: () => void;
    onCancel: () => void;
    onApprove: () => void;
    onReject: () => void;
}) {
    const isBuyer = r.roleType === 'buyer';
    const biz = r.business;
    const cat = r.catalog;
    const user = r.user;

    const fmt = (v?: string | null) =>
        v ? new Date(v).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
    const fmtDateTime = (v?: string | null) =>
        v ? new Date(v).toLocaleString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

    const statusBadge = useMemo(() => {
        if (r.status === 'approved') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30
                    text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                    <Check className="w-3 h-3" /> لغو شد
                </span>
            );
        }
        if (r.status === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30
                    text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    <X className="w-3 h-3" /> رد شد — عضو ماند
                </span>
            );
        }
        if (r.status === 'withdrawn') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high
                    text-on-surface-variant text-[10px] font-bold">
                    <X className="w-3 h-3" /> پس گرفته‌شده توسط عضو
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30
                text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                <Clock className="w-3 h-3" /> در انتظار
            </span>
        );
    }, [r.status]);

    return (
        <div className={cn(
            'bg-surface-container-lowest rounded-2xl border p-4 transition-all',
            r.status === 'pending' ? 'border-outline-variant/40 hover:border-primary/30' : 'border-outline-variant/25 opacity-90',
        )}>
            {/* ردیف بالا: نقش + وضعیت + تاریخ ثبت */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                        isBuyer
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                    )}>
                        {isBuyer ? <ShoppingBag className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                        لغو عضویت {ROLE_LABEL[r.roleType] || r.roleType}
                    </span>
                    {statusBadge}
                </div>
                <span className="text-[10px] text-on-surface-variant/60">
                    {fmtDateTime(r.createdAt)}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* درخواست‌دهنده */}
                <div className="rounded-xl bg-surface-container-low/70 border border-outline-variant/20 p-3">
                    <p className="text-[9.5px] font-bold text-on-surface-variant/70 mb-2 flex items-center gap-1">
                        <User className="w-3 h-3" /> درخواست‌دهنده
                    </p>
                    <p className="text-[13px] font-bold text-on-surface truncate">{user?.fullName || '—'}</p>
                    {user?.phone && (
                        <p className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-1" dir="ltr">
                            <Phone className="w-3 h-3" /> {user.phone}
                        </p>
                    )}
                    {r.memberJoinedAt && (
                        <p className="text-[10px] text-on-surface-variant/70 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> عضو از {fmt(r.memberJoinedAt)}
                        </p>
                    )}
                </div>

                {/* کسب‌وکار (خریدار) یا کاتالوگ (فروشنده) */}
                <div className="rounded-xl bg-surface-container-low/70 border border-outline-variant/20 p-3">
                    {isBuyer ? (
                        <>
                            <p className="text-[9.5px] font-bold text-on-surface-variant/70 mb-2 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> کسب‌وکارِ نقش خریدار
                            </p>
                            {biz ? (
                                <>
                                    <p className="text-[13px] font-bold text-on-surface truncate">{biz.name}</p>
                                    <div className="flex items-center gap-2.5 flex-wrap mt-1 text-[10.5px] text-on-surface-variant">
                                        {biz.city && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{biz.city}</span>}
                                        {biz.type && <span>{biz.type}</span>}
                                    </div>
                                </>
                            ) : <p className="text-[11px] text-on-surface-variant">بدون کسب‌وکار</p>}
                        </>
                    ) : (
                        <>
                            <p className="text-[9.5px] font-bold text-on-surface-variant/70 mb-2 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> کاتالوگِ درخواستِ خروج
                            </p>
                            {cat ? (
                                <>
                                    <p className="text-[13px] font-bold text-on-surface truncate">{cat.name}</p>
                                    <div className="flex items-center gap-2.5 flex-wrap mt-1 text-[10.5px] text-on-surface-variant">
                                        {cat.industryName && <span>{cat.industryName}</span>}
                                        {cat.slug && (
                                            <Link href={`/${cat.slug}`} target="_blank"
                                                  className="inline-flex items-center gap-0.5 text-primary hover:underline">
                                                دیدن کاتالوگ <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </>
                            ) : <p className="text-[11px] text-on-surface-variant">بدون کاتالوگ</p>}
                        </>
                    )}
                </div>
            </div>

            {/* دلیلِ عضو برای خروج */}
            {r.memberReason && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <AlertCircle className="w-3.5 h-3.5 text-on-surface-variant/60 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-on-surface-variant leading-5">
                        دلیل عضو: {r.memberReason}
                    </p>
                </div>
            )}

            {/* نتیجه — برای درخواست‌های بررسی‌شده */}
            {r.status === 'rejected' && r.rejectReason && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/50">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-5">
                        دلیل ماندن عضو: {r.rejectReason}
                    </p>
                </div>
            )}
            {r.status === 'approved' && r.reviewedAt && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/50">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-5">
                        عضویت در {fmtDateTime(r.reviewedAt)} لغو شد — تاریخِ دقیق در پروندهٔ عضو ثبت است.
                    </p>
                </div>
            )}

            {/* اکشن‌ها — فقط برای pending */}
            {r.status === 'pending' && (
                <div className="mt-3">
                    {!rejecting && !approving ? (
                        <div className="flex items-center gap-2">
                            <button type="button" disabled={busy} onClick={onOpenApprove}
                                    className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50
                                        text-white text-[12.5px] font-bold transition-colors flex items-center justify-center gap-1.5">
                                <Check className="w-4 h-4" />
                                تایید و لغو عضویت
                            </button>
                            <button type="button" disabled={busy} onClick={onOpenReject}
                                    className="flex-1 h-10 rounded-xl border border-emerald-300 dark:border-emerald-800
                                        text-emerald-600 dark:text-emerald-400 text-[12.5px] font-bold
                                        hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-center gap-1.5">
                                <X className="w-4 h-4" /> رد درخواست (عضو بماند)
                            </button>
                        </div>
                    ) : approving ? (
                        <div className="space-y-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/50">
                            <p className="text-[11.5px] text-rose-700 dark:text-rose-300 leading-5">
                                با تایید، عضویت این عضو لغو می‌شود و تاریخِ دقیق لغو در پرونده‌اش ثبت می‌شود.
                                {r.roleType === 'seller' && ' کاتالوگش از بازار خارج و آگهی‌هایش از تابلو برداشته می‌شود و «خروجِ اختیاری» علامت می‌خورد تا اشتباهی دوباره اددش نکنید.'}
                            </p>
                            <div className="flex gap-2">
                                <button type="button" onClick={onCancel} disabled={busy}
                                        className="h-9 px-4 rounded-lg border border-outline-variant text-on-surface-variant text-[12px] font-bold">
                                    انصراف
                                </button>
                                <button type="button" disabled={busy} onClick={onApprove}
                                        className="flex-1 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50
                                            text-white text-[12px] font-bold flex items-center justify-center gap-1.5">
                                    {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    بله، عضویت را لغو کن
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                value={rejectReason}
                                onChange={(e) => onRejectReasonChange(e.target.value)}
                                rows={2}
                                maxLength={500}
                                autoFocus
                                placeholder="چرا درخواست لغو را رد می‌کنی؟ مثلاً: «قراردادت تا پایان ماه فعال است» یا «اول تسویه کن» — دلیل در اعلان عضو می‌رود"
                                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest
                                    p-3 text-xs text-on-surface leading-6 outline-none focus:border-primary/50 resize-y"
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={onCancel} disabled={busy}
                                        className="h-9 px-4 rounded-lg border border-outline-variant text-on-surface-variant text-[12px] font-bold">
                                    انصراف
                                </button>
                                <button type="button" disabled={busy} onClick={onReject}
                                        className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50
                                            text-white text-[12px] font-bold flex items-center justify-center gap-1.5">
                                    {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    ثبت رد درخواست — عضو می‌ماند
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
