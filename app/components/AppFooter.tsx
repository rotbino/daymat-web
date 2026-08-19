// app/public/AppFooter.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppFooterProps {
    activeTab?: 'dashboard' | 'add' | 'profile';
}

export function AppFooter({ activeTab = 'dashboard' }: AppFooterProps) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (isAuthPage) return null;

    const tabs = [
        { id: 'dashboard' as const, icon: 'dashboard', label: 'تابلو قیمت', href: '/' },
        { id: 'add' as const, icon: 'add_box', label: 'ثبت قیمت', href: '/ad/create' },
        { id: 'profile' as const, icon: 'person', label: 'پروفایل', href: '/profile' },
    ];

    return (
        <nav className="lg:hidden bg-surface fixed bottom-0 w-full z-50 border-t border-outline-variant flex justify-around items-center h-14 px-2">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex flex-col items-center justify-center w-1/3 h-full active:scale-95 transition-transform ${
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