// app/ad/[id]/components/shared.tsx
import React from 'react';

export function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

export function formatNum(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

export function timeLeft(expiresAt: string) {
    const hours = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60));
    if (hours <= 0) return { text: 'منقضی', urgent: true };
    if (hours < 24) return { text: `${hours} ساعت`, urgent: true };
    const days = Math.floor(hours / 24);
    return { text: `${days} روز`, urgent: days <= 2 };
}

export function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'لحظاتی پیش';
    if (m < 60) return `${m} دقیقه پیش`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ساعت پیش`;
    return `${Math.floor(h / 24)} روز پیش`;
}

export function Pill({ children, variant = 'default', className }: {
    children: React.ReactNode;
    variant?: 'default' | 'amber' | 'indigo' | 'green' | 'red';
    className?: string;
}) {
    const styles: Record<string, string> = {
        default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
        amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
        indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400',
        green: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
        red: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
    };

    return (
        <span className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium leading-none',
            styles[variant],
            className
        )}>
            {children}
        </span>
    );
}