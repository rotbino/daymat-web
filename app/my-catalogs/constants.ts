// app/my-catalogs/constants.ts
// ثابت‌ها و هلپرهای مشترک صفحه «بازوهای فروشی من»

import { BadgeCheck, Hourglass, PauseCircle, Store, Package, Wrench, XCircle } from 'lucide-react';

// ─── انواع ───
// ✅ تب «اعضا» به دو تب تفکیک شد: team (تیم فروش) + customers (خریداران)
export type Tab = 'profile' | 'products' | 'publish' | 'stats' | 'team' | 'leads' | 'customers';
export type StatusFilter = 'all' | 'table' | 'catalog' | 'stale' | 'uncat' | 'incomplete';

// ─── هلپرهای وضعیت آگهی ───
// ✅ اعتبار قیمت — فقط یادآوری آپدیت قیمت به خود فروشنده است؛ آگهی همچنان روی تابلو دیده می‌شود
export const isPriceExpired = (ad: any) =>
    !!ad.expiresAt && new Date(ad.expiresAt).getTime() < Date.now();

// سازگاری با مصرف‌کنندگان قبلی — آگهی بدون expiresAt هرگز منقضی نیست
export const isAdExpired = (ad: any) => ad.status === 'expired' || isPriceExpired(ad);

export const inMarket = (ad: any) => ad.publishToMarket !== false;

export const isUncategorized = (ad: any) =>
    inMarket(ad) && !!ad.armId && !ad.categoryId && !!ad.catalogCategoryId;

// 🏷️ «نیاز به تکمیل» — کالای ایمپورت‌شده که هنوز ویرایش و تکمیل نشده؛
//    در کاتالوگ عمومی و تابلوی بازار دیده نمی‌شود تا فروشنده با ویرایش، تکمیلش کند
export const isNeedsCompletion = (ad: any) =>
    !!(ad?.customFields as any)?.needsCompletion;

export const fmt = (n: number | undefined) => n?.toLocaleString('fa-IR') ?? '۰';

// ─── تازگی قیمت — عمر قیمت بر پایهٔ priceUpdatedAt (بک: زمان آخرین بروزرسانی قیمت) ───
//     چون قیمت‌ها مهم‌ترین دارایی آی مچ است، کهنگی‌اش باید برای فروشنده و خریدار پیداشان باشد.
export const priceAgeDays = (priceUpdatedAt?: string | Date | null): number => {
    if (!priceUpdatedAt) return 0;
    const ms = Date.now() - new Date(priceUpdatedAt).getTime();
    return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
};

// ─── چیپ وضعیت انتشار در بازار ───
export const PUB_CHIP: Record<string, { label: string; cls: string; icon: any }> = {
    active: { label: 'منتشر شده', cls: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/25', icon: BadgeCheck },
    pending: { label: 'در انتظار تایید مدیر', cls: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/25', icon: Hourglass },
    paused: { label: 'خاموش', cls: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800', icon: PauseCircle },
    rejected: { label: 'رد شده', cls: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/25', icon: XCircle },
};

// ─── نوع فروش بازوی فروش ───
export const SALES_LABEL: Record<string, string> = {
    wholesale: 'فروش عمده',
    retail: 'فروش خرده',
    service: 'فروش خدمات',
};

export const SALES_ICON: Record<string, any> = {
    wholesale: Store,
    retail: Package,
    service: Wrench,
};

// ─── کلاس استاندارد کارت سفید (فلت) ───
export const CARD_CLS =
    'bg-white dark:bg-gray-900 rounded-xl border border-outline-variant/40 dark:border-gray-700';
