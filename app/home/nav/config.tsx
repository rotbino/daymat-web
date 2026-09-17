// app/home/nav/config.tsx
'use client';

import { BookOpen, User, Tags, ShoppingCart, Bell, Compass } from 'lucide-react';

// ═══ معماری ناو دیمت — دو ناوِ متفاوت ═══
//   ۱) ناو عمومی (بیرون از بازار): بازارها، بازوهای من، اعلان، پروفایل — هدر «بدون جستجو»
//      «فروشندگان/خریداران» از ناو عمومی حذف شد؛ کاربر اول از صفحهٔ «بازارها» وارد بازار می‌شود.
//   ۲) ناو اختصاصی بازار (داخل بازار): تامین کنندگان، خریداران، اعلان، بازوهای من — «با جستجو»
//   اعلان: دسکتاپ در خودِ ناو | موبایلِ بازار: زنگولهٔ MobileHeader بالای سایت
//          | موبایلِ عمومی: آیتم نوار پایین (صفحات عمومی هدرِ زنگوله ندارند)

export type BoardKey = 'sellers' | 'buyers';
export type BoardTab = 'price' | 'inquiry';

export const BOARD_ITEMS: { key: BoardKey; label: string; icon: any; board: BoardTab }[] = [
    { key: 'sellers', label: 'تامین کنندگان', icon: Tags, board: 'price' },
    { key: 'buyers', label: 'خریداران', icon: ShoppingCart, board: 'inquiry' },
];

/**
 * آدرس دو تابلوی بازار:
 *   تامین کنندگان (تابلوی قیمت) → ‎/{slug}  — ریشهٔ تابلو
 *   خریداران (بازوهای خرید) → ‎/{slug}/buyers — صفحهٔ مستقل
 * بدون بازارِ جاری → لیست بازارها (فال‌بک امن)
 */
export const boardHref = (slug: string | null | undefined, board: BoardTab) =>
    !slug ? '/markets' : board === 'inquiry' ? `/${slug}/buyers` : `/${slug}`;

/**
 * آیا این تابلو در بازار داده‌شده فعال است؟
 * ملاک: config.modules.{priceTable|buyLead}.enabled — undefined = روشن (پیش‌فرض)
 * مدیر از تنظیمات بازار ← ماژول‌ها ← «تابلوهای بازار» کنترل می‌کند.
 */
export const boardEnabled = (arm: any | null | undefined, board: BoardTab) => {
    if (!arm) return true;
    const moduleKey = board === 'inquiry' ? 'buyLead' : 'priceTable';
    return (arm as any)?.config?.modules?.[moduleKey]?.enabled !== false;
};

export interface NavItemDef {
    key: string;
    label: string;
    icon: any;
    href: string;
}

// ✅ ناو عمومی — بیرون از بازار؛ هدرِ عمومی باکس جستجو ندارد
//    ترتیب به تصمیم مالک قفل است: بازارها، بازوهای من، اعلان، پروفایل
export const GENERAL_NAV: NavItemDef[] = [
    { key: 'markets', label: 'بازارها', icon: Compass, href: '/markets' },
    { key: 'catalogs', label: 'بازوهای من', icon: BookOpen, href: '/my-catalogs' },
    { key: 'notifications', label: 'اعلان', icon: Bell, href: '/notifications' },
    { key: 'profile', label: 'پروفایل', icon: User, href: '/profile' },
];

// ✅ ناو اختصاصی بازار — داخل بازار؛ آدرس دو تابلو پویاست: ‎/{slug} و ‎/{slug}/buyers
//    ترتیب به تصمیم مالک قفل است: تامین کنندگان، خریداران، اعلان، بازوهای من
export const MARKET_NAV: NavItemDef[] = [
    { key: 'sellers', label: 'تامین کنندگان', icon: Tags, href: '' },
    { key: 'buyers', label: 'خریداران', icon: ShoppingCart, href: '' },
    { key: 'notifications', label: 'اعلان', icon: Bell, href: '/notifications' },
    { key: 'catalogs', label: 'بازوهای من', icon: BookOpen, href: '/my-catalogs' },
];

export type NavMode = 'catalog-owner' | 'member';

// سازگاری با useNavMode — هر دو مود ناو عمومی می‌بینند؛ تفاوت فقط «داخل/بیرون بازار» است
export const NAV: Record<NavMode, NavItemDef[]> = {
    'catalog-owner': GENERAL_NAV,
    member: GENERAL_NAV,
};
