// app/home/nav/config.tsx
'use client';

import { BookOpen, User, Store, PauseCircle, XCircle, LayoutDashboard, ClipboardList, Tags, ShoppingCart } from 'lucide-react';

export type NavMode = 'catalog-owner' | 'member';

// ═══ دو تابلوی بازار — ناوِ دسکتاپ (هدر) و موبایل (فوتر) ═══
// فروشندگان → تابلوی قیمت | خریداران → تابلوی اعلام‌های خرید
export type BoardKey = 'sellers' | 'buyers';
export type BoardTab = 'price' | 'inquiry';

export const BOARD_ITEMS: { key: BoardKey; label: string; icon: any; board: BoardTab; href: string }[] = [
    { key: 'sellers', label: 'فروشندگان', icon: Tags, board: 'price', href: '/markets?board=price' },
    { key: 'buyers', label: 'خریداران', icon: ShoppingCart, board: 'inquiry', href: '/markets?board=inquiry' },
];

/** آدرس تابلو روی صفحهٔ بازارِ فعلی — اگر بازارِ جاری نبود، لیست بازارها */
export const boardHref = (slug: string | null | undefined, board: BoardTab) =>
    slug ? `/${slug}?board=${board}` : `/markets?board=${board}`;

export interface NavItemDef {
    key: string;
    label: string;
    icon: any;
    href: string;
}

// ✅ آیتم‌های دسکتاپ (برای هدر)
export const DESKTOP_NAV_ITEMS: NavItemDef[] = [
    { key: 'market', label: 'بازار', icon: Store, href: '/markets' },
    { key: 'sellers', label: 'فروشندگان', icon: Tags, href: '/markets?board=price' },
    { key: 'buyers', label: 'خریداران', icon: ShoppingCart, href: '/markets?board=inquiry' },
    { key: 'catalogs', label: 'کاتالوگ فروش', icon: BookOpen, href: '/my-catalogs' },
    { key: 'inquiries', label: 'اعلام خرید', icon: ClipboardList, href: '/my-inquiries' },
    { key: 'profile', label: 'پروفایل', icon: User, href: '/profile' },
];

export const NAV: Record<NavMode, NavItemDef[]> = {
    'catalog-owner': [
        { key: 'catalogs', label: 'کاتالوگ فروش من', icon: BookOpen, href: '/my-catalogs' },
        { key: 'inquiries', label: 'اعلام خرید من', icon: ClipboardList, href: '/my-inquiries' },
        { key: 'sellers', label: 'فروشندگان', icon: Tags, href: '/markets?board=price' },
        { key: 'buyers', label: 'خریداران', icon: ShoppingCart, href: '/markets?board=inquiry' },
        { key: 'profile', label: 'پروفایل', icon: User, href: '/profile' },
    ],
    member: [
        { key: 'market', label: 'بازار', icon: Store, href: '/markets' },
        { key: 'sellers', label: 'فروشندگان', icon: Tags, href: '/markets?board=price' },
        { key: 'buyers', label: 'خریداران', icon: ShoppingCart, href: '/markets?board=inquiry' },
        { key: 'catalogs', label: 'کاتالوگ فروش', icon: BookOpen, href: '/my-catalogs' },
        { key: 'inquiries', label: 'اعلام خرید', icon: ClipboardList, href: '/my-inquiries' },
        { key: 'profile', label: 'پروفایل', icon: User, href: '/profile' },
    ],
};

export const PUB_META: Record<string, { label: string; cls: string; icon: any }> = {
    active:   { label: 'منتشر در بازار', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: Store },
    pending:  { label: 'در انتظار تایید', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: PauseCircle },
    paused:   { label: 'انتشار خاموش',   cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: PauseCircle },
    rejected: { label: 'نیاز به اصلاح',  cls: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
};