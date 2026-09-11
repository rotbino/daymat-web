// app/home/nav/config.tsx
'use client';

import { BookOpen, User, Store, PauseCircle, XCircle, LayoutDashboard } from 'lucide-react';

export type NavMode = 'catalog-owner' | 'member';

export interface NavItemDef {
    key: string;
    label: string;
    icon: any;
    href: string;
}

// ✅ آیتم‌های دسکتاپ (برای هدر)
export const DESKTOP_NAV_ITEMS: NavItemDef[] = [
    { key: 'market', label: 'بازار', icon: Store, href: '/markets' },
    { key: 'catalogs', label: 'کاتالوگ', icon: BookOpen, href: '/my-catalogs' },
    { key: 'profile', label: 'پروفایل', icon: User, href: '/profile' },
];

export const NAV: Record<NavMode, NavItemDef[]> = {
    'catalog-owner': [
        { key: 'catalogs', label: 'کاتالوگ من', icon: BookOpen, href: '/my-catalogs' },
        { key: 'profile', label: 'پروفایل', icon: User, href: '/profile' },
    ],
    member: [
        { key: 'market', label: 'بازار', icon: Store, href: '/markets' },
        { key: 'catalogs', label: 'کاتالوگ', icon: BookOpen, href: '/my-catalogs' },
        { key: 'profile', label: 'پروفایل', icon: User, href: '/profile' },
    ],
};

export const PUB_META: Record<string, { label: string; cls: string; icon: any }> = {
    active:   { label: 'منتشر در بازار', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: Store },
    pending:  { label: 'در انتظار تایید', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: PauseCircle },
    paused:   { label: 'انتشار خاموش',   cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: PauseCircle },
    rejected: { label: 'نیاز به اصلاح',  cls: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
};