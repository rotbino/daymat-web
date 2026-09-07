// app/notifications/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { AlertTriangle, AlertCircle, Info, ArrowLeft, BellCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import NavTabs from '@/app/home/nav/NavTabs';

const SEV: Record<string, { icon: any; cls: string }> = {
    danger:  { icon: AlertTriangle, cls: 'border-red-200/70 bg-red-50/60 dark:bg-red-900/10 dark:border-red-800/40 text-red-800 dark:text-red-200' },
    warning: { icon: AlertTriangle, cls: 'border-amber-200/70 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-800/40 text-amber-800 dark:text-amber-200' },
    info:    { icon: Info, cls: 'border-blue-200/70 bg-blue-50/60 dark:bg-blue-900/10 dark:border-blue-800/40 text-blue-800 dark:text-blue-200' },
};

export default function NotificationsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['notifications-derived'],
        queryFn: () => apiService.notification.getDerived(),
        staleTime: 60_000,
    });
    const items = data?.items ?? [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-24">
            <NavTabs />
            <header className="max-w-3xl mx-auto px-4 pt-6 pb-4">
                <h1 className="text-lg font-black text-on-surface flex items-center gap-1.5">
                    اعلان‌ها
                    {items.length > 0 && (
                        <span className="text-[11px] font-bold text-on-surface-variant/70">({items.length.toLocaleString('fa-IR')})</span>
                    )}
                </h1>
                <p className="text-xs text-on-surface-variant mt-1">وضعیت کاتالوگ‌ها و قیمت‌هایت — کارهای باقی‌مانده اینجاست.</p>
            </header>

            <main className="max-w-3xl mx-auto px-4 space-y-2.5">
                {isLoading ? (
                    <div className="space-y-2.5">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-surface-container-high/50 animate-pulse" />)}</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-16">
                        <BellCheck className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-on-surface">همه‌چیز مرتب است ✓</p>
                        <p className="text-xs text-on-surface-variant mt-1">هیچ کار باقی‌مانده‌ای نداری.</p>
                    </div>
                ) : (
                    items.map((n: any) => {
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
                    })
                )}
            </main>
        </div>
    );
}