// app/arm-admin/financial/layout.tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CheckCircle, BarChart3, ArrowLeft } from 'lucide-react';

const subMenuItems = [
    { href: '/arm-admin/financial/verify', label: 'تایید فیش‌های واریز', icon: CheckCircle },
    { href: '/arm-admin/financial/reports', label: 'گزارش درآمد', icon: BarChart3 },
];

export default function FinancialLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

   /* const isActive = (href: string) => {
        return pathname?.startsWith(href);
    };*/
    const isActive = (href: string) => {
        if (href === '/arm-admin') return pathname === '/arm-admin';
        if (href === '/arm-admin/settings') return pathname === '/arm-admin/settings' || pathname?.startsWith('/arm-admin/settings/');
        return pathname === href + '/';
    };
    return (
        <div>
            {/* ساب‌منو */}
            <div className="flex items-center gap-1 mb-6 border-b border-outline-variant/30 pb-3 overflow-x-auto">
                {subMenuItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                                active
                                    ? "bg-primary/10 text-primary"
                                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            {/* محتوا */}
            {children}
        </div>
    );
}