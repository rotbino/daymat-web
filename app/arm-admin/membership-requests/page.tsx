// app/arm-admin/membership-requests/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import {
    UserPlus, Building2, BookOpen, ShoppingBag, Store, Loader2, Check, X,
    Phone, MapPin, ExternalLink, Clock, Inbox, User, BadgeCheck, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * درخواست‌های عضویت در بازار خصوصی — پنل مالک/ادمین بازار:
 *   مشخصات درخواست‌دهنده + کسب‌وکار/کاتالوگ + تایید یا رد با دلیل.
 *   نتیجه به‌صورت اعلان برای کاربر می‌رود.
 */

type StatusTab = 'pending' | 'approved' | 'rejected';

const TABS: { key: StatusTab; label: string }[] = [
    { key: 'pending', label: 'در انتظار بررسی' },
    { key: 'approved', label: 'تاییدشده' },
    { key: 'rejected', label: 'ردشده' },
];

const ROLE_LABEL: Record<string, string> = { buyer: 'خریدار', seller: 'فروشنده', 'seller-buyer': 'فروشنده' };

export default function MembershipRequestsPage() {
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);

    if (!currentSlug) {
        return <div className="text-center py-16 text-sm text-on-surface-variant">ابتدا بازار را انتخاب کنید</div>;
    }
    return <RequestsContent slug={currentSlug} armName={currentArm?.name || currentSlug} />;
}

function RequestsContent({ slug, armName }: { slug: string; armName: string }) {
    const [tab, setTab] = useState<StatusTab>('pending');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['arm-membership-requests', slug, tab],
        queryFn: () => apiService.armAdmin.getMembershipRequests(slug, { status: tab, limit: 50 }),
        staleTime: 15_000,
    });

    const items: any[] = data?.items ?? [];
    const pendingCount: number = data?.pendingCount ?? 0;

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['arm-membership-requests', slug] });
    };

    const handleApprove = async (requestId: string) => {
        setBusyId(requestId);
        try {
            await apiService.armAdmin.approveMembershipRequest(slug, requestId);
            toast.success('درخواست تایید شد — عضو جدید به بازار اضافه شد و اعلان گرفت');
            invalidate();
        } catch (e: any) {
            toast.error(e?.data?.message || 'خطا در تایید درخواست');
        } finally {
            setBusyId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!rejectReason.trim()) {
            toast.error('دلیل رد را بنویسید — به کاربر نمایش داده می‌شود');
            return;
        }
        setBusyId(requestId);
        try {
            await apiService.armAdmin.rejectMembershipRequest(slug, requestId, rejectReason.trim());
            toast.success('درخواست رد شد — دلیل برای کاربر ارسال شد');
            setRejectingId(null);
            setRejectReason('');
            invalidate();
        } catch (e: any) {
            toast.error(e?.data?.message || 'خطا در رد درخواست');
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
                        <UserPlus className="w-5 h-5 text-primary" />
                        درخواست‌های عضویت
                    </h1>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                        بازار {armName} — درخواست‌های عضویت در بازار خصوصی
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
                        درخواست‌های جدید از مدال «درخواست عضویت» روی تابلوی قیمت می‌آیند.
                    </p>
                </div>
            ) : (
                <div className={cn('space-y-3 transition-opacity', isFetching && 'opacity-60')}>
                    {items.map((r) => (
                        <RequestCard
                            key={r.id}
                            r={r}
                            busy={busyId === r.id}
                            rejecting={rejectingId === r.id}
                            rejectReason={rejectingId === r.id ? rejectReason : ''}
                            onRejectReasonChange={(v) => setRejectReason(v)}
                            onOpenReject={() => { setRejectingId(r.id); setRejectReason(''); }}
                            onCancelReject={() => setRejectingId(null)}
                            onApprove={() => handleApprove(r.id)}
                            onReject={() => handleReject(r.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══ کارت هر درخواست ═══
function RequestCard({
    r, busy, rejecting, rejectReason, onRejectReasonChange, onOpenReject, onCancelReject, onApprove, onReject,
}: {
    r: any;
    busy: boolean;
    rejecting: boolean;
    rejectReason: string;
    onRejectReasonChange: (v: string) => void;
    onOpenReject: () => void;
    onCancelReject: () => void;
    onApprove: () => void;
    onReject: () => void;
}) {
    const isBuyer = r.roleType === 'buyer';
    const biz = r.business;
    const cat = r.catalog;
    const user = r.user;

    const statusBadge = useMemo(() => {
        if (r.status === 'approved') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30
                    text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    <BadgeCheck className="w-3 h-3" /> تاییدشده
                </span>
            );
        }
        if (r.status === 'rejected') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30
                    text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                    <X className="w-3 h-3" /> ردشده
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
            {/* ردیف بالا: نقش + وضعیت + تاریخ */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                        isBuyer
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                    )}>
                        {isBuyer ? <ShoppingBag className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                        درخواست {ROLE_LABEL[r.roleType] || r.roleType}
                    </span>
                    {statusBadge}
                </div>
                <span className="text-[10px] text-on-surface-variant/60">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
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
                </div>

                {/* کسب‌وکار (خریدار) یا کاتالوگ (فروشنده) */}
                <div className="rounded-xl bg-surface-container-low/70 border border-outline-variant/20 p-3">
                    {isBuyer ? (
                        <>
                            <p className="text-[9.5px] font-bold text-on-surface-variant/70 mb-2 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> کسب‌وکار خریدار
                            </p>
                            {biz ? (
                                <>
                                    <p className="text-[13px] font-bold text-on-surface truncate">{biz.name}</p>
                                    <div className="flex items-center gap-2.5 flex-wrap mt-1 text-[10.5px] text-on-surface-variant">
                                        {biz.city && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{biz.city}</span>}
                                        {biz.type && <span>{biz.type}</span>}
                                        {biz.status && <span className={biz.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}>
                                            {biz.status === 'active' ? 'فعال' : biz.status}
                                        </span>}
                                    </div>
                                </>
                            ) : <p className="text-[11px] text-on-surface-variant">بدون کسب‌وکار</p>}
                        </>
                    ) : (
                        <>
                            <p className="text-[9.5px] font-bold text-on-surface-variant/70 mb-2 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> کاتالوگ فروشنده
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

            {/* دلیل رد — برای درخواست‌های ردشده */}
            {r.status === 'rejected' && r.rejectReason && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-800/50">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-5">
                        دلیل رد: {r.rejectReason}
                    </p>
                </div>
            )}

            {/* اکشن‌ها — فقط برای pending */}
            {r.status === 'pending' && (
                <div className="mt-3">
                    {!rejecting ? (
                        <div className="flex items-center gap-2">
                            <button type="button" disabled={busy} onClick={onApprove}
                                    className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50
                                        text-white text-[12.5px] font-bold transition-colors flex items-center justify-center gap-1.5">
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                تایید عضویت
                            </button>
                            <button type="button" disabled={busy} onClick={onOpenReject}
                                    className="flex-1 h-10 rounded-xl border border-rose-300 dark:border-rose-800
                                        text-rose-600 dark:text-rose-400 text-[12.5px] font-bold
                                        hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-1.5">
                                <X className="w-4 h-4" /> رد با ذکر دلیل
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                value={rejectReason}
                                onChange={(e) => onRejectReasonChange(e.target.value)}
                                rows={2}
                                maxLength={500}
                                autoFocus
                                placeholder="چرا رد می‌کنی؟ مثلاً: «اول کسب‌وکارت را ثبت کن» یا «کاتالوگت کامل نیست» یا «خیاطی‌ها در این بازار عضو نمی‌شوند»"
                                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest
                                    p-3 text-xs text-on-surface leading-6 outline-none focus:border-primary/50 resize-y"
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={onCancelReject}
                                        className="h-9 px-4 rounded-lg border border-outline-variant text-on-surface-variant text-[12px] font-bold">
                                    انصراف
                                </button>
                                <button type="button" disabled={busy} onClick={onReject}
                                        className="flex-1 h-9 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50
                                            text-white text-[12px] font-bold flex items-center justify-center gap-1.5">
                                    {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    ثبت رد درخواست
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
