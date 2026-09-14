// app/home/nav/config.tsx
'use client';

import { BookOpen, User, Tags, ShoppingCart, Bell } from 'lucide-react';

// ═══ معماری ناو دیمت — بدون «هوم» و بدون «بازار» ═══
//   «هوم» دیگر وجود ندارد؛ هوم همان صفحهٔ فروشندگان است (تابلوی قیمت: ‎/{slug}).
//   ترتیب قطعی ۵ آیتم: فروشندگان، خریداران، کاتالوگ من، اعلان، پروفایل
//   خریداران صفحهٔ مستقل دارد: ‎/{slug}/buyers — هیچ سوییچری و هیچ ‎?board= وجود ندارد.
//   اعلان همیشه بالای سایت دیده می‌شود (دسکتاپ: همین هدر | موبایل: MobileHeader).

export type BoardKey = 'sellers' | 'buyers';
export type BoardTab = 'price' | 'inquiry';

export const BOARD_ITEMS: { key: BoardKey; label: string; icon: any; board: BoardTab }[] = [
    { key: 'sellers', label: 'فروشندگان', icon: Tags, board: 'price' },
    { key: 'buyers', label: 'خریداران', icon: ShoppingCart, board: 'inquiry' },
];

/**
 * آدرس دو تابلوی بازار:
 *   فروشندگان (تابلوی قیمت) → ‎/{slug}  — همان «هوم»؛ ریشهٔ تابلو
 *   خریداران (اعلام‌های خرید) → ‎/{slug}/buyers — صفحهٔ مستقل
 * بدون بازارِ جاری → لیست بازارها (فال‌بک امن)
 */
export const boardHref = (slug: string | null | undefined, board: BoardTab) =>
    !slug ? '/markets' : board === 'inquiry' ? `/${slug}/buyers` : `/${slug}`;

export interface NavItemDef {
    key: string;
    label: string;
    icon: any;
    href: string;
}

// ✅ ناو ۵تایی واحد — هر دو مود یکسان؛ ترتیب به تصمیم مالک قفل است.
//    «href» آیتم‌های فروشندگان/خریداران در کامپوننت با boardHref(currentSlug) پویا می‌شود.
const NAV_ITEMS: NavItemDef[] = [
    { key: 'sellers', label: 'فروشندگان', icon: Tags, href: '/markets' },
    { key: 'buyers', label: 'خریداران', icon: ShoppingCart, href: '/markets' },
    { key: 'catalogs', label: 'کاتالوگ من', icon: BookOpen, href: '/my-catalogs' },
    { key: 'notifications', label: 'اعلان', icon: Bell, href: '/notifications' },
    { key: 'profile', label: 'پروفایل', icon: User, href: '/profile' },
];

export type NavMode = 'catalog-owner' | 'member';

export const NAV: Record<NavMode, NavItemDef[]> = {
    'catalog-owner': NAV_ITEMS,
    member: NAV_ITEMS,
};
