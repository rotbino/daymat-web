// app/notifications/page.tsx
// 🔔 اعلان‌ها — دو بخش:
//   ۱) اعلان‌های واقعی چرخهٔ عضویت/ارتباط تجاری (درخواست/تایید/رد/دعوت) — کلیک → مقصد
//   ۲) یادآوری‌های مشتق از دیتا (قیمت منقضی‌شونده، کاتالوگ ناقص)
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { AlertTriangle, AlertCircle, Info, ArrowLeft, BellCheck, Handshake, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import NavTabs from '@/app/home/nav/NavTabs';

const SEV: Record<string, { icon: any; cls: string }> = {
    danger:  { icon: AlertTriangle, cls: 'border-red-200/70 bg-red-50/60 dark:bg-red-900/10 dark:border-red-800/40 text-red-800 dark:text-red-200' },
    warning: { icon: AlertTriangle, cls: 'border-amber-200/70 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-800/40 text-amber-800 dark:text-amber-200' },
    info:    { icon: Info, cls: 'border-blue-200/70 bg-blue-50/60 dark:bg-blue-900/10 dark:border-blue-800/40 text-blue-800 dark:text-blue-200' },
};

export default function NotificationsPage() {
    const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
    const queryClient = useQueryClient();

    // ✅ اعلان‌های واقعی — چرخهٔ عضویت/ارتباط تجاری
    const { data: realData, isLoading: realLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => apiService.notification.list(),
        enabled: isAuthenticated,
        staleTime: 30_000,
    });
    const notifications: any[] = realData?.items ?? [];
    const unreadCount = realData?.unreadCount ?? 0;

    // ✅ یادآوری‌های مشتق — قیمت منقضی‌شونده و…
    const { data, isLoading } = useQuery({
        queryKey: ['notifications-derived'],
        queryFn: () => apiService.notification.getDerived(),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
    const items = data?.items ?? [];

    // خواندن خودکار وقتی صفحه باز است
    useEffect(() => {
        if (!isAuthenticated || unreadCount === 0) return;
        const t = window.setTimeout(async () => {
            try {
                await apiService.notification.markAllRead();
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
            } catch { /* سکوت */ }
        }, 1500);
        return () => window.clearTimeout(t);
    }, [isAuthenticated, unreadCount, queryClient]);

    const markOne = async (id: string) => {
        try {
            await apiService.notification.markRead(id);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        } catch { /* سکوت */ }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-24">
            <NavTabs />
            <header className="max-w-3xl mx-auto px-4 pt-6 pb-4">
                <h1 className="text-lg font-black text-on-surface flex items-center gap-1.5">
                    اعلان‌ها
                    {unreadCount > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-black grid place-items-center">
                            {unreadCount.toLocaleString('fa-IR')} جدید
                        </span>
                    )}
                </h1>
                <p className="text-xs text-on-surface-variant mt-1">درخواست‌های ارتباط تجاری، تاییدها و وضعیت کاتالوگ‌ها — همه اینجا.</p>
            </header>

            <main className="max-w-3xl mx-auto px-4 space-y-2.5">
                {/* ─── اعلان‌های واقعی ─── */}
                {realLoading ? (
                    <div className="space-y-2.5">{[0, 1].map((i) => <div key={i} className="h-16 rounded-xl bg-surface-container-high/50 animate-pulse" />)}</div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-10">
                        <Handshake className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                        <p className="text-xs text-on-surface-variant">هنوز درخواست ارتباطی برایتان نیامده.</p>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <div
                            key={n.id}
                            className={cn(
                                'rounded-xl border p-3.5 flex items-start gap-3 text-right transition-colors',
                                n.isRead
                                    ? 'border-outline-variant/40 bg-surface-container-low/40 dark:bg-gray-900/40'
                                    : 'border-primary/40 bg-primary/5 dark:bg-primary/10',
                            )}
                        >
                            <Link href={n.href || '#'} onClick={() => markOne(n.id)} className="flex items-start gap-3 flex-1 min-w-0 group">
                                <span className={cn(
                                    'w-8 h-8 rounded-xl grid place-items-center flex-shrink-0',
                                    n.isRead ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary/15 text-primary',
                                )}>
                                    <Handshake className="w-4 h-4" />
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className={cn('block text-xs leading-6', n.isRead ? 'text-on-surface-variant' : 'font-extrabold text-on-surface')}>
                                        {n.title}
                                    </span>
                                    {n.body && <span className="block text-[10px] text-on-surface-variant/70 leading-5">{n.body}</span>}
                                </span>
                                <span className="text-[10px] font-bold text-primary whitespace-nowrap flex-shrink-0 flex items-center gap-1 pt-1">
                                    مشاهده
                                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                                </span>
                            </Link>
                            {/* ✅ «مشاهده شد» — اعلان‌های صرفاً اطلاع‌رسانی را بدون رفتن به مقصد، از جریان خارج می‌کند */}
                            {!n.isRead && (
                                <button
                                    onClick={() => markOne(n.id)}
                                    title="این اعلان را دیده‌ام — از شمارندهٔ بج کم شود"
                                    className="flex-shrink-0 self-center flex items-center gap-1 px-2 py-1.5 rounded-lg border border-emerald-200/70 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-95 transition"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    مشاهده شد
                                </button>
                            )}
                        </div>
                    ))
                )}

                {/* ─── یادآوری‌های مشتق ─── */}
                {items.length > 0 && (
                    <>
                        <p className="text-[11px] font-extrabold text-on-surface-variant pt-4 pb-1">یادآوری‌های کاتالوگ</p>
                        {items.map((n: any) => {
                            const s = SEV[n.severity] ?? SEV.info;
                            return (
                                <Link key={n.id} href={n.action?.href ?? '#'}
                                      className={cn('rounded-xl border p-3.5 flex items-center gap-3 text-right group', s.cls)}>
                                    <s.icon className="w-4.5 h-4.5 flex-shrink-0" />
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-xs font-medium leading-6">{n.title}</span>
                                    </span>
                                    <span className="text-[10px] font-bold whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                                        {n.action?.label}
                                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                                    </span>
                                </Link>
                            );
                        })}
                    </>
                )}

                {(!realLoading && !isLoading && notifications.length === 0 && items.length === 0) && (
                    <div className="text-center py-16">
                        <BellCheck className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-on-surface">همه‌چیز مرتب است ✓</p>
                        <p className="text-xs text-on-surface-variant mt-1">هیچ کار باقی‌مانده‌ای نداری.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
