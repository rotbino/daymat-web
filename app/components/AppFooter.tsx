// app/public/AppFooter.tsx
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useArms } from '@/lib/api/apiHooks';

interface AppFooterProps {
    activeTab?: 'dashboard' | 'add' | 'profile' | 'admin';
}

export function AppFooter({ activeTab = 'dashboard' }: AppFooterProps) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const { currentSlug } = useSelector((state: RootState) => state.arm);
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: arms } = useArms();

    // ✅ بررسی مالک بودن کاربر در بازار فعلی
    const isArmOwner = useMemo(() => {
        if (!user || !currentSlug || !arms) return false;
        return arms.some(
            (a: any) => a.slug === currentSlug && a.role === 'arm_owner'
        );
    }, [arms, currentSlug, user]);

    if (isAuthPage) return null;

    const tabs = [
        { id: 'dashboard' as const, icon: 'dashboard', label: 'تابلو قیمت', href: '/' },
        { id: 'add' as const, icon: 'add_box', label: 'ثبت قیمت عمده', href: '/ad/create' },
        { id: 'profile' as const, icon: 'person', label: 'پروفایل', href: '/profile' },
        ...(isArmOwner
            ? [{ id: 'admin' as const, icon: 'storefront', label: 'پنل مالک', href: '/arm-admin' }]
            : []),
    ];

    return (
        <nav className="lg:hidden bg-surface fixed bottom-0 w-full z-50 border-t border-outline-variant flex justify-around items-center h-14 px-2">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex flex-col items-center justify-center flex-1 h-full active:scale-95 transition-transform ${
                            isActive ? 'text-primary font-bold' : 'text-on-surface-variant'
                        }`}
                    >
                        <span
                            className="material-symbols-outlined text-[20px]"
                            style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                        >
                            {tab.icon}
                        </span>
                        <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : ''}`}>
                            {tab.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}