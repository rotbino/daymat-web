// app/arm-admin/delegated/page.tsx
'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import {
    Handshake, BookOpen, Store, Loader2, Package, ExternalLink,
    Inbox, Calendar, Undo2, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * کاتالوگ‌های واگذارشده — پنل مالک/ادمین بازار:
 *   فروشنده‌ها کارِ کاتالوگشان (محصول، قیمت، دسته‌بندی، انتشار) را به تیمِ بازار سپرده‌اند
 *   چون معمولاً خودشان وقت ندارند. از اینجا مستقیم به کنسولِ کار می‌روید و به‌جای آن‌ها انجامش می‌دهید.
 *   همهٔ تاریخ‌ها (واگذاری/لغو) و عامل‌ها ثبت می‌شود — برای شفافیت.
 */

type StatusTab = 'active' | 'revoked' | 'all';

const TABS: { key: StatusTab; label: string }[] = [
    { key: 'active', label: 'واگذارشده' },
    { key: 'revoked', label: 'لغوشده' },
    { key: 'all', label: 'همه' },
];

export default function DelegatedCatalogsPage() {
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);

    if (!currentSlug) {
        return <div className="text-center py-16 text-sm text-on-surface-variant">ابتدا بازار را انتخاب کنید</div>;
    }
    return <DelegatedContent slug={currentSlug} armName={currentArm?.name || currentSlug} />;
}

function DelegatedContent({ slug, armName }: { slug: string; armName: string }) {
    const [tab, setTab] = useState<StatusTab>('active');
    const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['arm-delegated', slug, tab],
        queryFn: () => apiService.armAdmin.getDelegated(slug, tab),
        staleTime: 15_000,
    });

    const items: any[] = data?.items ?? [];

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['arm-delegated', slug] });
        queryClient.invalidateQueries({ queryKey: ['delegated-catalogs'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-derived'] });
    };

    const handleRevoke = async (catalogId: string, id: string) => {
        setBusyId(id);
        try {
            await apiService.arm.revokeDelegation(slug, catalogId);
            toast.success('واگذاری لغو شد — فروشنده اطلاع داده می‌شود');
            setConfirmRevokeId(null);
            invalidate();
        } catch (e: any) {
            toast.error(e?.data?.message || 'خطا در لغو واگذاری');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* هدر */}
            <div>
                <h1 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-emerald-500" />
                    کاتالوگ‌های واگذارشده
                </h1>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                    بازار {armName} — کارِ این کاتالوگ‌ها (محصول و قیمت) را فروشنده‌ها به تیم شما سپرده‌اند تا به‌جایشان انجام دهید
                </p>
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
                    <p className="text-sm font-bold text-on-surface mb-1">کاتالوگی واگذار نشده</p>
                    <p className="text-xs text-on-surface-variant leading-6">
                        وقتی فروشنده‌ای از تب «انتشار» پنل کاتالوگش، کارِ کاتالوگ را به تیمِ بازار بسپارد، اینجا می‌آید.
                    </p>
                </div>
            ) : (
                <div className={cn('space-y-3 transition-opacity', isFetching && 'opacity-60')}>
                    {items.map((d) => (
                        <DelegationCard
                            key={d.id}
                            d={d}
                            busy={busyId === d.id}
                            confirming={confirmRevokeId === d.id}
                            onOpenRevoke={() => setConfirmRevokeId(d.id)}
                            onCancel={() => setConfirmRevokeId(null)}
                            onRevoke={() => handleRevoke(d.catalog.id, d.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function DelegationCard({
    d, busy, confirming, onOpenRevoke, onCancel, onRevoke,
}: {
    d: any;
    busy: boolean;
    confirming: boolean;
    onOpenRevoke: () => void;
    onCancel: () => void;
    onRevoke: () => void;
}) {
    const fmt = (v?: string | null) =>
        v ? new Date(v).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;
    const isRevoked = d.status === 'revoked';

    return (
        <div className={cn(
            'bg-surface-container-lowest rounded-2xl border p-4',
            isRevoked ? 'border-outline-variant/25 opacity-80' : 'border-outline-variant/40 hover:border-emerald-500/30',
        )}>
            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                    isRevoked
                        ? 'bg-surface-container-high text-on-surface-variant'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                )}>
                    <Handshake className="w-3 h-3" />
                    {isRevoked ? 'واگذاری لغو شده' : 'در دسترس تیم بازار'}
                </span>
                <span className="text-[10px] text-on-surface-variant/60 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {isRevoked
                        ? `لغو در ${fmt(d.revokedAt)}${d.revokedBy?.fullName ? ` توسط ${d.revokedBy.fullName}` : ''}`
                        : `واگذاری از ${fmt(d.grantedAt)}`}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* کاتالوگ */}
                <div className="rounded-xl bg-surface-container-low/70 border border-outline-variant/20 p-3">
                    <p className="text-[9.5px] font-bold text-on-surface-variant/70 mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> کاتالوگ
                    </p>
                    <p className="text-[13px] font-bold text-on-surface truncate">{d.catalog?.name || '—'}</p>
                    <div className="flex items-center gap-2.5 flex-wrap mt-1 text-[10.5px] text-on-surface-variant">
                        {d.catalog?.businessName && <span className="flex items-center gap-0.5"><Store className="w-3 h-3" />{d.catalog.businessName}</span>}
                        {d.catalog?.slug && (
                            <Link href={`/${d.catalog.slug}`} target="_blank"
                                  className="inline-flex items-center gap-0.5 text-primary hover:underline">
                                دیدن کاتالوگ <ExternalLink className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* واگذارکننده */}
                <div className="rounded-xl bg-surface-container-low/70 border border-outline-variant/20 p-3">
                    <p className="text-[9.5px] font-bold text-on-surface-variant/70 mb-2 flex items-center gap-1">
                        <User className="w-3 h-3" /> واگذارکننده (مالک کسب‌وکار)
                    </p>
                    <p className="text-[13px] font-bold text-on-surface truncate">{d.catalog?.ownerName || '—'}</p>
                    {d.catalog?.ownerPhone && (
                        <p className="text-[11px] text-on-surface-variant mt-0.5" dir="ltr">{d.catalog.ownerPhone}</p>
                    )}
                    {d.grantedBy?.fullName && (
                        <p className="text-[10px] text-on-surface-variant/70 mt-1">ثبتِ واگذاری: {d.grantedBy.fullName}</p>
                    )}
                </div>
            </div>

            {/* اکشن‌ها */}
            {!isRevoked && (
                <div className="mt-3">
                    {confirming ? (
                        <div className="space-y-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/50">
                            <p className="text-[11.5px] text-amber-700 dark:text-amber-300 leading-5">
                                با لغو، تیمِ دیگر به این کاتالوگ دسترسی ندارد و فروشنده اطلاع داده می‌شود.
                                تاریخِ لغو و عاملِ آن در پرونده ثبت می‌شود.
                            </p>
                            <div className="flex gap-2">
                                <button type="button" onClick={onCancel} disabled={busy}
                                        className="h-9 px-4 rounded-lg border border-outline-variant text-on-surface-variant text-[12px] font-bold">
                                    انصراف
                                </button>
                                <button type="button" disabled={busy} onClick={onRevoke}
                                        className="flex-1 h-9 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50
                                            text-white text-[12px] font-bold flex items-center justify-center gap-1.5">
                                    {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    بله، واگذاری را لغو کن
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href={`/my-catalogs?catalog=${d.catalog.id}`}
                                  className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white
                                      text-[12.5px] font-bold transition-colors flex items-center justify-center gap-1.5">
                                <Package className="w-4 h-4" /> مدیریت محصولات
                            </Link>
                            <button type="button" disabled={busy} onClick={onOpenRevoke}
                                    className="h-10 px-4 rounded-xl border border-outline-variant/50 text-on-surface-variant
                                        hover:text-rose-600 hover:border-rose-400/50 text-[12px] font-bold
                                        transition-colors flex items-center gap-1.5">
                                <Undo2 className="w-3.5 h-3.5" /> لغو واگذاری
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
